import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.teamId) {
      return NextResponse.json({ error: "Not authenticated or not in a team" }, { status: 401 });
    }

    const payment = await prisma.teamPayment.findUnique({
      where: {
        teamId_paymentPurpose: {
          teamId: user.teamId,
          paymentPurpose: "EXTRA_SLOT",
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ status: "NO_PAYMENT" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[Extra Slot Status Error]", error);
    return NextResponse.json({ error: "Failed to fetch extra slot status" }, { status: 500 });
  }
}
