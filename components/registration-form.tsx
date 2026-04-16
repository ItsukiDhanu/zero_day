"use client";

import { FormEvent, useState } from "react";

const SESSION_UPDATED_EVENT = "session-updated";

type RegistrationState = {
  name: string;
  year: string;
  branch: string;
  collegeEmail: string;
  phoneNumber: string;
  password: string;
};

const YEAR_OPTIONS = [
  { label: "1st Year", value: "FIRST_YEAR" },
  { label: "2nd Year", value: "SECOND_YEAR" },
] as const;

const DEPARTMENT_OPTIONS = [
  "CSE",
  "CSE-DS",
  "AIML",
  "ISE",
  "MT",
  "ME",
  "EC",
  "EE",
  "AE",
  "BT",
  "CV",
  "Other",
] as const;

type RegistrationResponse = {
  message?: string;
  error?: string;
  user?: {
    email?: string;
  };
};

const initialState: RegistrationState = {
  name: "",
  year: "",
  branch: "",
  collegeEmail: "",
  phoneNumber: "",
  password: "",
};

function isAcharyaEmail(email: string) {
  return /^[^\s@]+@acharya\.ac\.in$/.test(email.trim().toLowerCase());
}

export function RegistrationForm() {
  const [form, setForm] = useState<RegistrationState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAcharyaEmail(form.collegeEmail)) {
      setStatus("error");
      setMessage("College email must be in the format <name>@acharya.ac.in.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => ({}))) as RegistrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Registration request failed.");
      }

      setStatus("success");
      setForm(initialState);
      setMessage(payload.message ?? `Authenticated as ${payload.user?.email ?? "new participant"}.`);
      window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Registration request failed.");
    }
  };

  return (
    <section id="register" className="mx-auto mt-10 w-full max-w-5xl scroll-mt-20">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Registration Node</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Initialize Participant Profile</h2>
          </div>
          <p className="text-xs text-neutral-400">Fields marked with * are required.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Name *</span>
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="Your full name"
            />
          </label>

          <fieldset className="grid gap-2 text-sm text-neutral-200">
            <legend>Year *</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {YEAR_OPTIONS.map((option, index) => {
                const selected = form.year === option.value;

                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-center font-semibold transition ${
                      selected
                        ? "border-phosphor bg-phosphor/15 text-phosphor"
                        : "border-white/10 bg-black/60 text-neutral-300 hover:border-phosphor/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="year"
                      value={option.value}
                      checked={selected}
                      required={index === 0}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          year: event.target.value,
                        }))
                      }
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Department *</span>
            <select
              required
              value={form.branch}
              onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
            >
              <option value="" disabled>
                Select your department
              </option>
              {DEPARTMENT_OPTIONS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-neutral-200">
            <span>College Email ID *</span>
            <input
              required
              type="email"
              pattern="[^\s@]+@acharya\.ac\.in"
              title="Use your Acharya email in the format <name>@acharya.ac.in"
              value={form.collegeEmail}
              onChange={(event) =>
                setForm((current) => ({ ...current, collegeEmail: event.target.value.toLowerCase() }))
              }
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="you@acharya.ac.in"
            />
          </label>

          <label className="grid gap-2 text-sm text-neutral-200">
            <span>Phone Number *</span>
            <input
              required
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
              placeholder="+91XXXXXXXXXX"
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
              placeholder="At least 8 characters"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {status === "submitting" ? "Registering..." : "Submit Registration"}
            </button>
            <p className="text-sm text-terminal-amber">Secure intake. Confirmation email follows validation.</p>
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-phosphor/40 bg-phosphor/10 px-3 py-2 text-sm text-phosphor">
              {message || "Registration captured. You are queued for team assignment."}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 px-3 py-2 text-sm text-terminal-amber">
              {message || "Registration failed. Please retry."}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
