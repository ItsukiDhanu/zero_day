import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { TeamPaymentForm } from "@/components/team-payment-form";
import { decodeSessionToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PaymentPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/login?next=/payment");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login?next=/payment");
  }

  if (!user.teamId) {
    redirect("/teams?next=/payment");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <CommandPalette isAuthenticated />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // REGISTRATION PAYMENT</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/dashboard"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Dashboard
              </Link>
              <Link
                href="/teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Teams
              </Link>
            </nav>
          </div>
        </header>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Team Registration Payment</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-100">{user.team?.name || "Your Team"}</h1>
            <p className="mt-2 text-neutral-300">
              Complete your team&apos;s registration by submitting payment verification. This is required to participate in
              the hackathon.
            </p>
          </div>

          <div className="bg-black/40 rounded-lg p-6 border border-white/10">
            <TeamPaymentForm />
          </div>

          <div className="mt-8 rounded-lg border border-white/10 bg-black/60 p-6">
            <h2 className="text-lg font-semibold mb-3">Important Notes</h2>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex gap-3">
                <span className="text-phosphor font-bold">•</span>
                <span>You must be part of a team to proceed with payment.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-phosphor font-bold">•</span>
                <span>Payment is team-level, so only one person from your team needs to complete this.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-phosphor font-bold">•</span>
                <span>Your team will only be able to submit repositories after payment verification.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-phosphor font-bold">•</span>
                <span>
                  Our admin team will verify your payment within 24 hours and notify you via email.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-terminal-amber font-bold">•</span>
                <span>For queries, contact the organizing team.</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </main>
  );
}
