import Link from "next/link";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { HACKATHON_START_LABEL } from "@/lib/hackathon-config";
import { decodeSessionToken } from "@/lib/session";

const faqs = [
  {
    question: "Who can register for Zero Day?",
    answer:
      "Registration is open only to students of Acharya Institutes, and only for 1st year and 2nd year students using a valid @acharya.ac.in email address.",
  },
  {
    question: "What is the allowed team size?",
    answer:
      "Each team must have a minimum of 2 members and a maximum of 4 members.",
  },
  {
    question: "Is cross-department teaming allowed?",
    answer:
      "Yes. Students from different departments can form a team as long as all participants meet the eligibility rules.",
  },
  {
    question: "What is the entry fee for a team?",
    answer:
      "The entry fee is Rs. 150 per team, and payment will be received during team creation.",
  },
  {
    question: "How do I join an existing team?",
    answer:
      "Open Team Console, enter the exact team name and valid join code provided by your captain.",
  },
  {
    question: "Can I be in multiple teams?",
    answer:
      "No. A participant account can be linked to only one team at any given time.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Use the Forgot Password page to request a reset link, then set a new password from the reset page.",
  },
  {
    question: "When does the hackathon start?",
    answer: `The current configured start time is ${HACKATHON_START_LABEL}.`,
  },
  {
    question: "Where can I see eligible teams?",
    answer:
      "Use the Confirmed Teams page to view teams that have between 2 and 5 registered members (5th slot unlocked if needed).",
  },
] as const;

export default async function FaqPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <CommandPalette isAuthenticated={isAuthenticated} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // FAQ</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                  >
                    Login
                  </Link>
                </>
              )}
              <Link
                href="/teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Teams
              </Link>
              <Link
                href="/confirmed-teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Confirmed Teams
              </Link>
              <Link
                href="/rules"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Rules
              </Link>
              <Link
                href="/faq"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                FAQ
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Help Desk</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Frequently Asked Questions</h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
              Quick answers for common registration and team workflow questions.
            </p>

            <div className="mt-6 space-y-3">
              {faqs.map((item) => (
                <article key={item.question} className="rounded-xl border border-white/10 bg-black/60 p-4 sm:p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-terminal-amber">Q. {item.question}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-300">A. {item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
