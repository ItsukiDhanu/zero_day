"use client";

import { FormEvent, useState } from "react";

type RepositorySubmissionResponse = {
  message?: string;
  error?: string;
  repositoryUrl?: string | null;
};

type TeamRepositorySubmitFormProps = {
  teamName: string;
  initialRepositoryUrl: string | null;
};

export function TeamRepositorySubmitForm({
  teamName,
  initialRepositoryUrl,
}: TeamRepositorySubmitFormProps) {
  const [repositoryUrl, setRepositoryUrl] = useState(initialRepositoryUrl ?? "");
  const [savedRepositoryUrl, setSavedRepositoryUrl] = useState<string | null>(initialRepositoryUrl);
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUrl = repositoryUrl.trim();
    if (!normalizedUrl) {
      setMessage("GitHub repository link is required.");
      return;
    }

    setSubmitState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/teams/repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repositoryUrl: normalizedUrl }),
      });

      const payload = (await response.json().catch(() => ({}))) as RepositorySubmissionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit repository link.");
      }

      const nextRepositoryUrl = payload.repositoryUrl ?? normalizedUrl;
      setSavedRepositoryUrl(nextRepositoryUrl);
      setRepositoryUrl(nextRepositoryUrl);
      setMessage(payload.message ?? "Repository link submitted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit repository link.");
    } finally {
      setSubmitState("idle");
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/70 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Leader Submission</p>
      <p className="mt-2 text-sm text-neutral-300">
        Submit your team&apos;s GitHub repository link for <span className="font-semibold text-neutral-100">{teamName}</span>.
      </p>

      <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="team-repository-url"
            className="text-xs uppercase tracking-[0.16em] text-neutral-400"
          >
            GitHub Repository URL
          </label>
          <input
            id="team-repository-url"
            type="url"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            placeholder="https://github.com/your-org/your-repo"
            className="mt-2 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor/50"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="rounded-md border border-phosphor/50 bg-phosphor/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-phosphor transition hover:border-phosphor hover:bg-phosphor/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitState === "submitting"
            ? "Submitting..."
            : savedRepositoryUrl
              ? "Update Repository Link"
              : "Submit Repository Link"}
        </button>
      </form>

      {savedRepositoryUrl ? (
        <p className="mt-3 text-sm text-neutral-300">
          Current link:{" "}
          <a
            href={savedRepositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-phosphor transition hover:text-phosphor/80"
          >
            {savedRepositoryUrl}
          </a>
        </p>
      ) : null}

      {message ? <p className="mt-3 text-sm text-terminal-amber">{message}</p> : null}
    </div>
  );
}
