import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const body = await req.json();
    const transactionId =
      typeof body.transactionId === "string"
        ? body.transactionId.trim()
        : typeof body.transactionReference === "string"
          ? body.transactionReference.trim()
          : "";
    const receiptEvidence =
      typeof body.receiptEvidence === "string"
        ? body.receiptEvidence.trim()
        : typeof body.proofFileUrl === "string"
          ? body.proofFileUrl.trim()
          : "";

    // Validate inputs
    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    if (!receiptEvidence) {
      return NextResponse.json(
        { error: "Payment receipt or screenshot is required" },
        { status: 400 }
      );
    }

    const paymentMethod = "UPI";

    // Check if payment record already exists
    const existingPayment = await prisma.teamPayment.findUnique({
      where: { teamId: user.teamId },
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
          transactionReference: transactionId,
          proofFileUrl: receiptEvidence || null,
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
        transactionReference: transactionId,
        proofFileUrl: receiptEvidence || null,
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
