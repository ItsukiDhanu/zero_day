import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CommandPalette } from "@/components/command-palette";
import { AdminPaymentPanel } from "@/components/admin-payment-panel";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPaymentPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/login?next=/admin/payments");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <CommandPalette isAuthenticated />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // PAYMENT VERIFICATION</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/admin"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Admin Console
              </Link>
              <Link
                href="/organizer"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Organizer
              </Link>
            </nav>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Payment Management</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-100">Team Registration Payments</h1>
            <p className="mt-2 text-neutral-300">
              Review and verify team registration payments. Approve verified payments and reject incomplete submissions.
            </p>
          </div>

          <AdminPaymentPanel />
        </div>
      </div>
    </main>
  );
}
