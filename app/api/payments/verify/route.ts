import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageSiteSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    // Check if user has admin permissions
    if (!user || !canManageSiteSettings(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { paymentId, status, rejectionReason } = body;

    // Validate inputs
    if (!paymentId || !["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid payment ID or status" },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await prisma.teamPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // Update payment status
    const updated = await prisma.teamPayment.update({
      where: { id: paymentId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        verifiedByEmail: user.email,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      message: `Payment ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("[Payment Verify Error]", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    // Check if user has admin permissions
    if (!user || !canManageSiteSettings(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 403 }
      );
    }

    // Get all pending payments with team details
    const payments = await prisma.teamPayment.findMany({
      where: { status: "PENDING" },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Also get verified and rejected for stats
    const stats = await prisma.teamPayment.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      pending: payments,
      stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
    });
  } catch (error) {
    console.error("[Payment List Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
