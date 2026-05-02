import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BASE_TEAM_MEMBER_LIMIT } from "@/lib/team-capacity";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.teamId) {
      return NextResponse.json({ error: "Not authenticated or not in a team" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: { id: true, extraSlotUnlocked: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.extraSlotUnlocked) {
      return NextResponse.json({ error: "Extra slot already unlocked" }, { status: 409 });
    }

    const memberCount = await prisma.user.count({ where: { teamId: team.id } });
    if (memberCount < BASE_TEAM_MEMBER_LIMIT) {
      return NextResponse.json(
        { error: `Extra slot is only available when the team has ${BASE_TEAM_MEMBER_LIMIT} members.` },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const transactionValue = formData.get("transactionId") || formData.get("transactionReference");
    const transactionId = typeof transactionValue === "string" ? transactionValue.trim() : "";
    const fileValue = formData.get("receiptFile");
    const receiptFile = fileValue instanceof File ? fileValue : null;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    if (!receiptFile) {
      return NextResponse.json({ error: "Payment receipt or screenshot is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(receiptFile.type)) {
      return NextResponse.json({ error: "Only PNG, JPG, WEBP, or PDF files are allowed" }, { status: 400 });
    }

    if (receiptFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Max size is 5MB" }, { status: 400 });
    }

    const existingPayment = await prisma.teamPayment.findUnique({
      where: {
        teamId_paymentPurpose: {
          teamId: team.id,
          paymentPurpose: "EXTRA_SLOT",
        },
      },
    });

    if (existingPayment?.status === "VERIFIED") {
      return NextResponse.json({ error: "Extra slot already verified" }, { status: 409 });
    }

    const receiptBuffer = Buffer.from(await receiptFile.arrayBuffer());
    const receiptFileName = receiptFile.name || "receipt";
    const receiptMimeType = receiptFile.type || "application/octet-stream";

    const paymentMethod = "UPI";
    const paymentPurpose = "EXTRA_SLOT";

    if (existingPayment) {
      const updated = await prisma.teamPayment.update({
        where: { id: existingPayment.id },
        data: {
          paymentMethod,
          paymentPurpose,
          transactionReference: transactionId,
          receiptFileName,
          receiptMimeType,
          receiptData: receiptBuffer,
          status: "PENDING",
          rejectionReason: null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ id: updated.id, status: updated.status });
    }

    const payment = await prisma.teamPayment.create({
      data: {
        teamId: team.id,
        paymentMethod,
        paymentPurpose,
        transactionReference: transactionId,
        receiptFileName,
        receiptMimeType,
        receiptData: receiptBuffer,
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: payment.id, status: payment.status }, { status: 201 });
  } catch (error) {
    console.error("[Extra Slot Payment Error]", error);
    return NextResponse.json({ error: "Failed to submit extra slot payment" }, { status: 500 });
  }
}
