"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

type TeamResponse = {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  extraSlotUnlocked: boolean;
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    isCaptain: boolean;
  }>;
};

type JoinLinkResponse = {
  team?: TeamResponse;
  message?: string;
  error?: string;
};

type PageProps = {
  params: Promise<{ link: string }>;
};

export default function JoinViaLinkPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "idle" | "joining" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [team, setTeam] = useState<TeamResponse | null>(null);

  useEffect(() => {
    const handleJoin = async () => {
      try {
        setStatus("joining");
        const response = await fetch("/api/teams/join-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ joinLink: resolvedParams.link }),
        });

        const payload = (await response.json().catch(() => ({}))) as JoinLinkResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to join team via link.");
        }

        if (payload.team) {
          setTeam(payload.team);
          setMessage(payload.message || "Team joined successfully!");
          setStatus("success");
          
          // Redirect to teams page after 2 seconds
          setTimeout(() => {
            router.push("/teams");
          }, 2000);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to join team.");
        setStatus("error");
      }
    };

    handleJoin();
  }, [resolvedParams.link, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-md">
          <div className="text-center">
            {status === "loading" || status === "joining" ? (
              <>
                <div className="mb-4 flex justify-center">
                  <Loader className="h-12 w-12 animate-spin text-phosphor" />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-100">Joining Team...</h1>
                <p className="mt-2 text-neutral-400">Please wait while we process your join request.</p>
              </>
            ) : status === "success" ? (
              <>
                <div className="mb-4 flex justify-center">
                  <CheckCircle className="h-12 w-12 text-phosphor" />
                </div>
                <h1 className="text-2xl font-semibold text-phosphor">Success!</h1>
                {team && (
                  <>
                    <p className="mt-2 text-lg font-medium text-neutral-100">{team.name}</p>
                    <p className="mt-1 text-sm text-neutral-400">{message}</p>
                    <p className="mt-4 text-xs text-neutral-500">Redirecting to teams page...</p>
                  </>
                )}
              </>
            ) : status === "error" ? (
              <>
                <div className="mb-4 flex justify-center">
                  <AlertCircle className="h-12 w-12 text-red-400" />
                </div>
                <h1 className="text-2xl font-semibold text-red-400">Unable to Join</h1>
                <p className="mt-2 text-neutral-300">{message}</p>
                <button
                  onClick={() => router.push("/teams")}
                  className="mt-6 rounded-lg bg-phosphor px-6 py-2 font-medium text-black transition-colors hover:bg-phosphor/90"
                >
                  Back to Teams
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
