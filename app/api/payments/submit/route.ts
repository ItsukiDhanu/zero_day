import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const user = await getSessionUser(req);
    if (!user || !user.teamId) {
      return NextResponse.json(
        { error: "Not authenticated or not in a team" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let transactionId = "";
    let receiptEvidence = "";
    let receiptFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const transactionValue = formData.get("transactionId") || formData.get("transactionReference");
      transactionId = typeof transactionValue === "string" ? transactionValue.trim() : "";
      const fileValue = formData.get("receiptFile");
      receiptFile = fileValue instanceof File ? fileValue : null;
    } else {
      const body = await req.json();
      transactionId =
        typeof body.transactionId === "string"
          ? body.transactionId.trim()
          : typeof body.transactionReference === "string"
            ? body.transactionReference.trim()
            : "";
      receiptEvidence =
        typeof body.receiptEvidence === "string"
          ? body.receiptEvidence.trim()
          : typeof body.proofFileUrl === "string"
            ? body.proofFileUrl.trim()
            : "";
    }

    // Validate inputs
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!receiptFile && !receiptEvidence) {
      return NextResponse.json(
        { error: "Payment receipt or screenshot is required" },
        { status: 400 }
      );
    }

    if (receiptFile) {
      if (!ALLOWED_MIME_TYPES.includes(receiptFile.type)) {
        return NextResponse.json(
          { error: "Only PNG, JPG, WEBP, or PDF files are allowed" },
          { status: 400 }
        );
      }

      if (receiptFile.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File too large. Max size is 5MB" },
          { status: 400 }
        );
      }
    }

    const paymentMethod = "UPI";
    const paymentPurpose = "REGISTRATION";

    const receiptBuffer = receiptFile
      ? Buffer.from(await receiptFile.arrayBuffer())
      : null;
    const receiptFileName = receiptFile ? receiptFile.name || "receipt" : null;
    const receiptMimeType = receiptFile ? receiptFile.type || "application/octet-stream" : null;

    // Check if payment record already exists
    const existingPayment = await prisma.teamPayment.findUnique({
      where: {
        teamId_paymentPurpose: {
          teamId: user.teamId,
          paymentPurpose,
        },
      },
    });

    if (existingPayment) {
      if (existingPayment.status === "VERIFIED") {
        return NextResponse.json(
          { error: "Payment already verified for this team" },
          { status: 409 }
        );
      }

      // Update existing payment record
      const updated = await prisma.teamPayment.update({
        where: { id: existingPayment.id },
        data: {
          paymentMethod,
          paymentPurpose,
          transactionReference: transactionId,
          proofFileUrl: receiptEvidence || null,
          receiptFileName: receiptFileName || null,
          receiptMimeType: receiptMimeType || null,
          receiptData: receiptBuffer,
          status: "PENDING",
          rejectionReason: null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        message: "Payment submission updated",
      });
    }

    // Create new payment record
    const payment = await prisma.teamPayment.create({
      data: {
        teamId: user.teamId,
        paymentMethod,
        paymentPurpose,
        transactionReference: transactionId,
        proofFileUrl: receiptEvidence || null,
        receiptFileName: receiptFileName || null,
        receiptMimeType: receiptMimeType || null,
        receiptData: receiptBuffer,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        id: payment.id,
        status: payment.status,
        message: "Payment submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Payment Submit Error]", error);
    return NextResponse.json(
      { error: "Failed to submit payment" },
      { status: 500 }
    );
  }
}
