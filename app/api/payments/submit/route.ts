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
    const { paymentMethod, transactionReference, proofFileUrl } = body;

    // Validate inputs
    if (!paymentMethod || !transactionReference) {
      return NextResponse.json(
        { error: "Payment method and transaction reference are required" },
        { status: 400 }
      );
    }

    if (!["UPI", "BANK_TRANSFER"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

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
          transactionReference,
          proofFileUrl: proofFileUrl || null,
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
        transactionReference,
        proofFileUrl: proofFileUrl || null,
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
