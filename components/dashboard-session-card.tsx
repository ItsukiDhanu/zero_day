"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DashboardSessionCardProps = {
  email: string;
  role: "PARTICIPANT" | "ORGANIZER" | "ADMIN";
};

type LogoutResponse = {
  ok?: boolean;
  error?: string;
};

export function DashboardSessionCard({ email, role }: DashboardSessionCardProps) {
  const router = useRouter();
  const [logoutState, setLogoutState] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState("");

  const handleSignOut = async () => {
    setLogoutState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => ({}))) as LogoutResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to sign out right now.");
      }

      setMessage("Signed out successfully. Redirecting to login...");
      router.push("/login");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign out right now.");
      setLogoutState("idle");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Session</p>
          <p className="mt-1 text-sm text-neutral-200">
            {email} ({role})
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={logoutState === "submitting"}
          className="rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-3 py-2 text-xs font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber"
        >
          {logoutState === "submitting" ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-neutral-300">{message}</p> : null}
    </section>
  );
}
