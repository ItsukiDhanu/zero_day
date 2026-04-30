import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageSiteSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !canManageSiteSettings(user.role)) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 403 });
    }

    const { paymentId } = await context.params;
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const payment = await prisma.teamPayment.findUnique({
      where: { id: paymentId },
      select: {
        receiptData: true,
        receiptMimeType: true,
        receiptFileName: true,
      },
    });

    if (!payment || !payment.receiptData) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const mimeType = payment.receiptMimeType || "application/octet-stream";
    const fileName = payment.receiptFileName || "receipt";

    return new NextResponse(payment.receiptData, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Payment Receipt Error]", error);
    return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
  }
}
