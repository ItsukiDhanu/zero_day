import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageSiteSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notify";

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

    // Find the payment record with team and members
    const payment = await prisma.teamPayment.findUnique({
      where: { id: paymentId },
      include: {
        team: {
          include: {
            members: { select: { email: true, name: true } },
            captain: { select: { email: true, name: true } },
          },
        },
      },
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

    if (status === "VERIFIED" && payment.paymentPurpose === "EXTRA_SLOT") {
      await prisma.team.update({
        where: { id: payment.teamId },
        data: { extraSlotUnlocked: true },
      });
    }

    // Notify team members by email
    try {
      const recipients = payment?.team?.members?.map((m) => m.email) ?? [];
      // Ensure captain included
      if (payment?.team?.captain?.email && !recipients.includes(payment.team.captain.email)) {
        recipients.push(payment.team.captain.email);
      }

      const teamName = payment?.team?.name ?? "your team";

      const paymentLabel = payment.paymentPurpose === "EXTRA_SLOT" ? "extra slot" : "registration";
      const subject =
        status === "VERIFIED"
          ? `${paymentLabel} payment verified: ${teamName}`
          : `${paymentLabel} payment rejected: ${teamName}`;

      const text =
        status === "VERIFIED"
          ? `Hello,\n\nYour ${paymentLabel} payment for team '${teamName}' has been verified by the organizers.\n\nVerified by: ${user.email}\n\nRegards,\nZero_Day organizers`
          : `Hello,\n\nYour ${paymentLabel} payment submission for team '${teamName}' was rejected. Reason: ${rejectionReason}\n\nPlease resubmit your payment proof at /payment.\n\nRegards,\nZero_Day organizers`;

      const html = text.replace(/\n/g, "<br />");

      // Send to each recipient (best-effort)
      await Promise.all(
        recipients.map((to) => sendEmail({ to, subject, text, html }))
      );
    } catch (notifyErr) {
      console.error("[Payment Verify Notify Error]", notifyErr);
    }

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
      select: {
        id: true,
        paymentMethod: true,
        paymentPurpose: true,
        transactionReference: true,
        createdAt: true,
        receiptFileName: true,
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
