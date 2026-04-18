import Link from "next/link";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { decodeSessionToken } from "@/lib/session";

const rules = [
  {
    title: "Eligibility",
    points: [
      "Each participant must register with a valid @acharya.ac.in email account.",
      "One account represents one participant; shared accounts are not allowed.",
      "Participants must provide accurate profile information during registration.",
    ],
  },
  {
    title: "Team Structure",
    points: [
      "Teams must have at least 2 and at most 4 members.",
      "A participant can belong to only one team at a time.",
      "Team join code is private and should only be shared with intended members.",
    ],
  },
  {
    title: "Build Guidelines",
    points: [
      "Your team must submit work produced during the official hackathon window.",
      "Using open-source libraries is allowed, but plagiarism is strictly prohibited.",
      "Keep source code and documentation ready for mentor and jury review.",
    ],
  },
  {
    title: "Conduct",
    points: [
      "Maintain respectful communication with participants, volunteers, and judges.",
      "Any harassment, abuse, or sabotage results in immediate disqualification.",
      "Follow venue and organizer instructions throughout the event.",
    ],
  },
  {
    title: "Judging and Decisions",
    points: [
      "Projects are judged on innovation, impact, implementation quality, and presentation.",
      "Teams may be asked for a live demo, walkthrough, and technical Q&A.",
      "Organizer and jury decisions are final.",
    ],
  },
] as const;

export default async function RulesPage() {
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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // RULEBOOK</p>
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
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Rules
              </Link>
              <Link
                href="/faq"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                FAQ
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Participation Guidelines</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Zero Day Hackathon Rules</h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
              Follow these rules to keep the event fair, competitive, and safe for everyone. Any violation can
              result in warnings, score penalties, or disqualification based on severity.
            </p>

            <div className="mt-6 grid gap-4">
              {rules.map((section) => (
                <article key={section.title} className="rounded-xl border border-white/10 bg-black/60 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-neutral-100">{section.title}</h2>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-300">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
