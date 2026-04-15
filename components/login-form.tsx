"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_UPDATED_EVENT = "session-updated";

type LoginState = {
  email: string;
  password: string;
};

type LoginResponse = {
  message?: string;
  error?: string;
};

const initialState: LoginState = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Login request failed.");
      }

      setStatus("success");
      setForm(initialState);
      setMessage(payload.message ?? "Login successful.");
      window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
      router.push("/teams");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login request failed.");
    }
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Authentication Node</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Login to Continue</h2>
          </div>
          <p className="text-xs text-neutral-400">Use your college email and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm text-neutral-200">
            <span>College Email ID *</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value.toLowerCase() }))}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="you@college.edu"
            />
          </label>

          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Password *</span>
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="Your password"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {status === "submitting" ? "Logging in..." : "Login"}
            </button>
            <p className="text-sm text-terminal-amber">
              New here?{" "}
              <Link href="/register" className="underline underline-offset-2">
                Register first
              </Link>
              .
            </p>
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-phosphor/40 bg-phosphor/10 px-3 py-2 text-sm text-phosphor">
              {message || "Login successful."}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 px-3 py-2 text-sm text-terminal-amber">
              {message || "Login failed. Please retry."}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
