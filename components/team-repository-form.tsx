"use client";

import { useActionState, useState } from "react";
import { submitTeamRepositoryAction } from "@/app/actions/team-repository";

type TeamRepositorySubmitFormProps = {
  teamName: string;
  initialRepositoryUrl: string | null;
};

export function TeamRepositorySubmitForm({
  teamName,
  initialRepositoryUrl,
}: TeamRepositorySubmitFormProps) {
  const [repositoryUrl, setRepositoryUrl] = useState(initialRepositoryUrl ?? "");
  const [submissionState, formAction, pending] = useActionState(submitTeamRepositoryAction, {
    repositoryUrl: initialRepositoryUrl,
  });

  const savedRepositoryUrl = submissionState.repositoryUrl ?? initialRepositoryUrl;
  const message = submissionState.error ?? submissionState.message ?? "";

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-black/70 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Leader Submission</p>
      <p className="mt-2 text-sm text-neutral-300">
        Submit your team&apos;s GitHub repository link for <span className="font-semibold text-neutral-100">{teamName}</span>.
      </p>

      <form className="mt-3 space-y-3" action={formAction}>
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
            name="repositoryUrl"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-phosphor/50 bg-phosphor/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-phosphor transition hover:border-phosphor hover:bg-phosphor/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
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
