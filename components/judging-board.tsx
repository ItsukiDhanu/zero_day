"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";

const MAX_CRITERION_SCORE = 20;

const CRITERIA = [
  {
    key: "innovationScore",
    label: "Innovation",
    description: "How original and creative is the core solution?",
  },
  {
    key: "impactScore",
    label: "Impact",
    description: "How clearly does it solve a meaningful problem?",
  },
  {
    key: "implementationScore",
    label: "Implementation",
    description: "Code quality, technical depth, and execution quality.",
  },
  {
    key: "presentationScore",
    label: "Presentation",
    description: "Demo clarity, communication, and storytelling.",
  },
  {
    key: "ruleAdherenceScore",
    label: "Rule Adherence",
    description: "Repository submission, fair play, and teamwork compliance.",
  },
] as const;

type ScoreField = (typeof CRITERIA)[number]["key"];

type JudgingSnapshot = {
  innovationScore: number;
  impactScore: number;
  implementationScore: number;
  presentationScore: number;
  ruleAdherenceScore: number;
  comments: string | null;
  updatedByEmail: string | null;
  updatedAt: string;
};

export type JudgingTeamState = {
  id: string;
  name: string;
  memberCount: number;
  members: string[];
  repositoryUrl: string | null;
  judging: JudgingSnapshot | null;
};

type JudgingDraft = {
  innovationScore: number;
  impactScore: number;
  implementationScore: number;
  presentationScore: number;
  ruleAdherenceScore: number;
  comments: string;
};

type JudgingApiResponse = {
  message?: string;
  error?: string;
  judging?: {
    innovationScore: number;
    impactScore: number;
    implementationScore: number;
    presentationScore: number;
    ruleAdherenceScore: number;
    comments: string | null;
    updatedByEmail: string | null;
    updatedAt: string;
    totalScore: number;
  };
};

type JudgingBoardProps = {
  initialTeams: JudgingTeamState[];
};

type SearchSuggestion = {
  id: string;
  value: string;
  label: string;
  kind: "Team" | "Member";
};

const EMPTY_DRAFT: JudgingDraft = {
  innovationScore: 0,
  impactScore: 0,
  implementationScore: 0,
  presentationScore: 0,
  ruleAdherenceScore: 0,
  comments: "",
};

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > MAX_CRITERION_SCORE) {
    return MAX_CRITERION_SCORE;
  }

  return value;
}

function toDraft(team: JudgingTeamState): JudgingDraft {
  if (!team.judging) {
    return { ...EMPTY_DRAFT };
  }

  return {
    innovationScore: team.judging.innovationScore,
    impactScore: team.judging.impactScore,
    implementationScore: team.judging.implementationScore,
    presentationScore: team.judging.presentationScore,
    ruleAdherenceScore: team.judging.ruleAdherenceScore,
    comments: team.judging.comments ?? "",
  };
}

function totalFromDraft(draft: JudgingDraft) {
  return (
    draft.innovationScore +
    draft.impactScore +
    draft.implementationScore +
    draft.presentationScore +
    draft.ruleAdherenceScore
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function JudgingBoard({ initialTeams }: JudgingBoardProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [drafts, setDrafts] = useState<Record<string, JudgingDraft>>(() => {
    return Object.fromEntries(initialTeams.map((team) => [team.id, toDraft(team)])) as Record<
      string,
      JudgingDraft
    >;
  });
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const hasSearchQuery = query.trim().length > 0;

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return teams.filter((team) => {
      if (team.name.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      return team.members.some((member) => member.toLowerCase().includes(normalizedQuery));
    });
  }, [query, teams]);

  const searchSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];

    for (const team of teams) {
      if (team.name.toLowerCase().includes(normalizedQuery)) {
        suggestions.push({
          id: `team-${team.id}`,
          value: team.name,
          label: team.name,
          kind: "Team",
        });
      }

      for (const member of team.members) {
        if (member.toLowerCase().includes(normalizedQuery)) {
          suggestions.push({
            id: `member-${team.id}-${member.toLowerCase().replace(/\s+/g, "-")}`,
            value: member,
            label: `${member} (${team.name})`,
            kind: "Member",
          });
        }
      }
    }

    const deduped = new Map<string, SearchSuggestion>();

    for (const suggestion of suggestions) {
      const dedupeKey = `${suggestion.kind}:${suggestion.value.toLowerCase()}`;
      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, suggestion);
      }
    }

    return Array.from(deduped.values()).slice(0, 8);
  }, [query, teams]);

  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [query]);

  const setTeamMessage = (teamId: string, message: string) => {
    setMessages((current) => ({
      ...current,
      [teamId]: message,
    }));
  };

  const applySuggestion = (value: string) => {
    setQuery(value);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hasSearchQuery || searchSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((current) => {
        const next = current + 1;
        return next >= searchSuggestions.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((current) => {
        if (current <= 0) {
          return searchSuggestions.length - 1;
        }

        return current - 1;
      });
      return;
    }

    if (event.key === "Enter" && selectedSuggestionIndex >= 0) {
      event.preventDefault();
      applySuggestion(searchSuggestions[selectedSuggestionIndex].value);
      return;
    }

    if (event.key === "Escape") {
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleScoreChange = (teamId: string, field: ScoreField, value: string) => {
    const parsedValue = Number.parseInt(value, 10);
    const normalizedValue = clampScore(parsedValue);

    setDrafts((current) => {
      const previous = current[teamId] ?? { ...EMPTY_DRAFT };

      return {
        ...current,
        [teamId]: {
          ...previous,
          [field]: normalizedValue,
        },
      };
    });
  };

  const handleCommentsChange = (teamId: string, value: string) => {
    setDrafts((current) => {
      const previous = current[teamId] ?? { ...EMPTY_DRAFT };

      return {
        ...current,
        [teamId]: {
          ...previous,
          comments: value,
        },
      };
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>, teamId: string) => {
    event.preventDefault();

    const draft = drafts[teamId];
    if (!draft) {
      setTeamMessage(teamId, "Unable to load draft for this team.");
      return;
    }

    setSavingTeamId(teamId);
    setTeamMessage(teamId, "");

    try {
      const response = await fetch("/api/judging", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          innovationScore: draft.innovationScore,
          impactScore: draft.impactScore,
          implementationScore: draft.implementationScore,
          presentationScore: draft.presentationScore,
          ruleAdherenceScore: draft.ruleAdherenceScore,
          comments: draft.comments,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as JudgingApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save judging marks.");
      }

      if (!payload.judging) {
        throw new Error("Judging response did not include saved marks.");
      }

      const savedJudging = payload.judging;

      setTeams((current) =>
        current.map((team) => {
          if (team.id !== teamId) {
            return team;
          }

          return {
            ...team,
            judging: {
              innovationScore: savedJudging.innovationScore,
              impactScore: savedJudging.impactScore,
              implementationScore: savedJudging.implementationScore,
              presentationScore: savedJudging.presentationScore,
              ruleAdherenceScore: savedJudging.ruleAdherenceScore,
              comments: savedJudging.comments,
              updatedByEmail: savedJudging.updatedByEmail,
              updatedAt: savedJudging.updatedAt,
            },
          };
        }),
      );

      setDrafts((current) => ({
        ...current,
        [teamId]: {
          innovationScore: savedJudging.innovationScore,
          impactScore: savedJudging.impactScore,
          implementationScore: savedJudging.implementationScore,
          presentationScore: savedJudging.presentationScore,
          ruleAdherenceScore: savedJudging.ruleAdherenceScore,
          comments: savedJudging.comments ?? "",
        },
      }));

      setTeamMessage(
        teamId,
        payload.message ?? `Judging marks saved. Total score: ${savedJudging.totalScore}/100.`,
      );
    } catch (error) {
      setTeamMessage(teamId, error instanceof Error ? error.message : "Failed to save judging marks.");
    } finally {
      setSavingTeamId(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-neutral-300">
        No confirmed teams yet. Teams appear here once they have 2 to 4 members.
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="rounded-xl border border-white/10 bg-black/60 p-4 sm:p-5">
        <label htmlFor="judging-team-search" className="text-xs uppercase tracking-[0.18em] text-neutral-400">
          Search Teams
        </label>
        <input
          id="judging-team-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by team name or member name"
          className="mt-2 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor/50"
        />

        {hasSearchQuery && searchSuggestions.length > 0 ? (
          <div className="mt-3 rounded-md border border-white/10 bg-black/70 p-2">
            <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500">Suggestions</p>
            <ul className="grid gap-1">
              {searchSuggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => applySuggestion(suggestion.value)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition ${
                      index === selectedSuggestionIndex
                        ? "bg-phosphor/15 text-phosphor"
                        : "bg-black/50 text-neutral-200 hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate">{suggestion.label}</span>
                    <span className="ml-3 shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                      {suggestion.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4">
        {!hasSearchQuery ? (
          <p className="rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-neutral-300">
            Type a team name or member name to start searching.
          </p>
        ) : filteredTeams.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-neutral-300">
            No teams matched your search query.
          </p>
        ) : (
          filteredTeams.map((team) => {
            const draft = drafts[team.id] ?? toDraft(team);
            const totalScore = totalFromDraft(draft);
            const judging = team.judging;
            const lastUpdated = judging ? formatUpdatedAt(judging.updatedAt) : "Not judged yet";

            return (
              <article key={team.id} className="rounded-xl border border-white/10 bg-black/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-100">{team.name}</h2>
                    <p className="mt-1 text-xs text-neutral-400">{team.memberCount}/4 members</p>
                  </div>
                  <span className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2 py-1 text-xs font-semibold text-phosphor">
                    Total: {totalScore}/100
                  </span>
                </div>

                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Members</p>
                    <ul className="mt-2 grid gap-1 text-sm text-neutral-200">
                      {team.members.map((member) => (
                        <li key={`${team.id}-${member}`}>{member}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Repository</p>
                    {team.repositoryUrl ? (
                      <a
                        href={team.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex break-all text-sm font-medium text-phosphor transition hover:text-phosphor/80"
                      >
                        {team.repositoryUrl}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-400">Repository link not submitted yet.</p>
                    )}
                    <p className="mt-3 text-xs text-neutral-500">Last updated: {lastUpdated}</p>
                    {judging?.updatedByEmail ? (
                      <p className="mt-1 text-xs text-neutral-500">Updated by: {judging.updatedByEmail}</p>
                    ) : null}
                  </div>
                </div>

                <form className="mt-4 space-y-4" onSubmit={(event) => handleSave(event, team.id)}>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {CRITERIA.map((criterion) => (
                      <label
                        key={criterion.key}
                        htmlFor={`${team.id}-${criterion.key}`}
                        className="rounded-lg border border-white/10 bg-black/70 p-3"
                      >
                        <span className="text-xs uppercase tracking-[0.16em] text-neutral-400">{criterion.label}</span>
                        <span className="mt-2 block text-sm text-neutral-300">{criterion.description}</span>
                        <span className="mt-2 block text-xs text-neutral-500">0 to 20 points</span>
                        <input
                          id={`${team.id}-${criterion.key}`}
                          type="number"
                          min={0}
                          max={MAX_CRITERION_SCORE}
                          value={draft[criterion.key]}
                          onChange={(event) => handleScoreChange(team.id, criterion.key, event.target.value)}
                          className="mt-2 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-phosphor/50"
                          required
                        />
                      </label>
                    ))}
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/70 p-3">
                    <label
                      htmlFor={`${team.id}-comments`}
                      className="text-xs uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Jury Notes (optional)
                    </label>
                    <textarea
                      id={`${team.id}-comments`}
                      value={draft.comments}
                      onChange={(event) => handleCommentsChange(team.id, event.target.value)}
                      maxLength={1000}
                      rows={4}
                      placeholder="Mention standout ideas, risks, and follow-up points for this team."
                      className="mt-2 w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor/50"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={savingTeamId === team.id}
                      className="rounded-md border border-phosphor/50 bg-phosphor/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-phosphor transition hover:border-phosphor hover:bg-phosphor/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingTeamId === team.id ? "Saving..." : "Save Marks"}
                    </button>

                    {messages[team.id] ? (
                      <p className="text-sm text-terminal-amber">{messages[team.id]}</p>
                    ) : null}
                  </div>
                </form>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
