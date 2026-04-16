"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  message?: string;
  error?: string;
  previewResetUrl?: string;
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus("submitting");
    setMessage("");
    setPreviewResetUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json().catch(() => ({}))) as ForgotPasswordResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Forgot-password request failed.");
      }

      setStatus("success");
      setMessage(payload.message ?? "If your account exists, a reset link has been sent.");
      setPreviewResetUrl(payload.previewResetUrl ?? null);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Forgot-password request failed.");
    }
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Credential Recovery</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Request Password Reset</h2>
          </div>
          <p className="text-xs text-neutral-400">Enter your registered email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Registered Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value.toLowerCase())}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="you@acharya.ac.in"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {status === "submitting" ? "Sending..." : "Send Reset Link"}
            </button>
            <Link href="/login" className="text-sm text-terminal-amber underline underline-offset-2">
              Back to login
            </Link>
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-phosphor/40 bg-phosphor/10 px-3 py-2 text-sm text-phosphor">
              {message}
              {previewResetUrl ? (
                <div className="mt-2 break-all text-xs text-neutral-200">
                  Dev preview link: {" "}
                  <a href={previewResetUrl} className="underline underline-offset-2">
                    {previewResetUrl}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 px-3 py-2 text-sm text-terminal-amber">
              {message || "Unable to process forgot-password request."}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
