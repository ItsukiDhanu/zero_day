"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type ResetPasswordFormProps = {
  token: string | null;
};

type ResetPasswordResponse = {
  message?: string;
  error?: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const hasValidToken = useMemo(() => Boolean(token && /^[a-f0-9]{64}$/i.test(token)), [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasValidToken || !token) {
      setStatus("error");
      setMessage("Reset token is invalid or missing.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Password confirmation does not match.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const payload = (await response.json().catch(() => ({}))) as ResetPasswordResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Reset-password request failed.");
      }

      setStatus("success");
      setPassword("");
      setConfirmPassword("");
      setMessage(payload.message ?? "Password reset successful.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Reset-password request failed.");
    }
  };

  if (!hasValidToken) {
    return (
      <section className="mx-auto mt-10 w-full max-w-5xl">
        <div className="rounded-2xl border border-terminal-amber/50 bg-terminal-amber/10 p-6 text-terminal-amber sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em]">Credential Recovery</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Invalid Reset Link</h2>
          <p className="mt-3 text-sm">The reset link is missing or malformed. Request a new one from the forgot-password page.</p>
          <Link href="/forgot-password" className="mt-4 inline-flex text-sm underline underline-offset-2">
            Request new reset link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Credential Recovery</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Set New Password</h2>
          </div>
          <p className="text-xs text-neutral-400">Use at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm text-neutral-200">
            <span>New Password *</span>
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Confirm New Password *</span>
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="Repeat new password"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {status === "submitting" ? "Resetting..." : "Reset Password"}
            </button>
            <Link href="/login" className="text-sm text-terminal-amber underline underline-offset-2">
              Back to login
            </Link>
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-phosphor/40 bg-phosphor/10 px-3 py-2 text-sm text-phosphor">
              {message || "Password reset successful."}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 px-3 py-2 text-sm text-terminal-amber">
              {message || "Unable to reset password."}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
