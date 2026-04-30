import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.teamId) {
      return NextResponse.json(
        { error: "Not authenticated or not in a team" },
        { status: 401 }
      );
    }

    const payment = await prisma.teamPayment.findUnique({
      where: { teamId: user.teamId },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        transactionReference: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { status: "NO_PAYMENT", message: "No payment submitted yet" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[Payment Status Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
