"use client";

import { FormEvent, useState } from "react";

type SessionUser = {
  id: string;
  email: string;
  role: "PARTICIPANT" | "ORGANIZER" | "ADMIN";
  name: string | null;
  year: string | null;
  branch: string | null;
  phoneNumber: string | null;
  teamId: string | null;
};

type TeamState = {
  id: string;
  name: string;
  joinCode: string;
  memberCount: number;
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    isCaptain: boolean;
  }>;
};

type TeamActionResponse = {
  message?: string;
  error?: string;
  team?: TeamState;
};

type TeamDashboardShellProps = {
  initialUser: SessionUser;
  initialTeam: TeamState | null;
  initialRegistrationOpen: boolean;
};

export function TeamDashboardShell({
  initialUser,
  initialTeam,
  initialRegistrationOpen,
}: TeamDashboardShellProps) {
  const [teamName, setTeamName] = useState("");
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [team, setTeam] = useState<TeamState | null>(initialTeam);
  const [registrationOpen] = useState(initialRegistrationOpen);
  const [createStatus, setCreateStatus] = useState<"idle" | "submitting">("idle");
  const [joinStatus, setJoinStatus] = useState<"idle" | "submitting">("idle");
  const [teamActionView, setTeamActionView] = useState<"create" | "join" | null>(null);
  const [createMessage, setCreateMessage] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setCreateMessage("Register first to open a team session.");
      return;
    }

    if (!registrationOpen) {
      setCreateMessage("Registration is currently closed by organizers.");
      return;
    }

    const normalizedName = teamName.trim();
    if (!normalizedName) {
      setCreateMessage("Team name required before code generation.");
      return;
    }

    setCreateStatus("submitting");
    setCreateMessage("");

    try {
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: normalizedName }),
      });

      const payload = (await response.json().catch(() => ({}))) as TeamActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Team creation failed.");
      }

      if (payload.team) {
        setTeam(payload.team);
        setUser((current) => (current ? { ...current, teamId: payload.team?.id ?? current.teamId } : current));
      }

      setCreateMessage(payload.message ?? "Team booted. Share team name + join code with up to 3 teammates.");
      setJoinMessage("");
      setTeamName("");
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : "Team creation failed.");
    } finally {
      setCreateStatus("idle");
    }
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setJoinMessage("Register first to join a team.");
      return;
    }

    if (!registrationOpen) {
      setJoinMessage("Registration is currently closed by organizers.");
      return;
    }

    const normalizedCode = joinCode.trim().toUpperCase();
    const normalizedTeamName = joinTeamName.trim();

    if (!normalizedTeamName) {
      setJoinMessage("Team name is required to join.");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setJoinMessage("Join code must be 6 uppercase alphanumeric characters.");
      return;
    }

    setJoinStatus("submitting");
    setJoinMessage("");

    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ joinCode: normalizedCode, teamName: normalizedTeamName }),
      });

      const payload = (await response.json().catch(() => ({}))) as TeamActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Team join failed.");
      }

      if (payload.team) {
        setTeam(payload.team);
        setUser((current) => (current ? { ...current, teamId: payload.team?.id ?? current.teamId } : current));
      }

      setJoinMessage(payload.message ?? "Team join successful.");
      setCreateMessage("");
      setJoinCode("");
      setJoinTeamName("");
    } catch (error) {
      setJoinMessage(error instanceof Error ? error.message : "Team join failed.");
    } finally {
      setJoinStatus("idle");
    }
  };

  const hasTeam = Boolean(team);
  const slotCount = team ? 4 - team.memberCount : 4;

  return (
    <section id="teams" className="mx-auto mt-10 w-full max-w-5xl scroll-mt-20 pb-12">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Team Dashboard Shell</p>
        <h2 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Create + Join Team Console</h2>

        <div
          className={`mt-5 rounded-lg border px-3 py-2 text-sm ${
            registrationOpen
              ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
              : "border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"
          }`}
        >
          Registration Status: {registrationOpen ? "OPEN" : "CLOSED"}
        </div>

        {!registrationOpen ? (
          <div className="mt-4 rounded-lg border border-terminal-amber/50 bg-terminal-amber/10 px-3 py-2 text-sm text-terminal-amber">
            Registration is closed. Team create/join actions are paused.
          </div>
        ) : null}

        {hasTeam && team ? (
          <div className="mt-7 rounded-xl border border-phosphor/40 bg-phosphor/10 p-5 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Active Team</p>
            <h3 className="mt-2 text-xl font-semibold text-neutral-100">{team.name}</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Join Code</p>
                <p className="mt-2 text-lg font-semibold tracking-[0.28em] text-phosphor">{team.joinCode}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Capacity</p>
                <p className="mt-2 text-lg font-semibold text-neutral-100">{team.memberCount}/4 members</p>
                <p className={`mt-1 text-sm ${slotCount <= 1 ? "text-terminal-amber" : "text-phosphor"}`}>
                  {slotCount} slot{slotCount === 1 ? "" : "s"} remaining
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/50 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Team Members</p>
              <div className="mt-3 grid gap-2">
                {team.members.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between rounded-md border border-white/10 bg-black/60 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">{member.name || member.email}</p>
                      <p className="text-xs text-neutral-400">Member {index + 1}</p>
                    </div>
                    {member.isCaptain ? (
                      <span className="rounded-md border border-phosphor/60 bg-phosphor/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-phosphor">
                        Captain
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {createMessage || joinMessage ? (
              <p className="mt-2 text-sm text-neutral-300">{createMessage || joinMessage}</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setTeamActionView("create")}
                className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor ${
                  teamActionView === "create"
                    ? "border-phosphor/60 bg-phosphor/10"
                    : "border-white/10 bg-black/40 hover:border-phosphor/40"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Action 01</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-100">Create Team</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  Start a new squad and generate a private 6-character join code for teammates.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTeamActionView("join")}
                className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber ${
                  teamActionView === "join"
                    ? "border-terminal-amber/70 bg-terminal-amber/10"
                    : "border-white/10 bg-black/40 hover:border-terminal-amber/40"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-terminal-amber">Action 02</p>
                <h3 className="mt-2 text-lg font-semibold text-neutral-100">Join Team</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  Enter the team name and join code shared by your captain to join an existing team.
                </p>
              </button>
            </div>

            {teamActionView === "create" ? (
              <form
                onSubmit={handleCreate}
                className="rounded-xl border border-phosphor/40 bg-phosphor/5 p-4 backdrop-blur-md"
              >
                <p className="text-sm font-semibold text-phosphor">Create Team</p>
                <label className="mt-4 grid gap-2 text-sm text-neutral-200">
                  <span>Team Name</span>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
                    placeholder="Red Team Raptors"
                    disabled={Boolean(team) || !user || createStatus === "submitting" || !registrationOpen}
                  />
                </label>

                <button
                  type="submit"
                  disabled={Boolean(team) || !user || createStatus === "submitting" || !registrationOpen}
                  className="mt-4 rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
                >
                  {createStatus === "submitting" ? "Generating..." : "Generate 6-Char Code"}
                </button>

                {createMessage ? <p className="mt-3 text-sm text-neutral-300">{createMessage}</p> : null}
              </form>
            ) : teamActionView === "join" ? (
              <form
                onSubmit={handleJoin}
                className="rounded-xl border border-terminal-amber/40 bg-terminal-amber/5 p-4 backdrop-blur-md"
              >
                <p className="text-sm font-semibold text-terminal-amber">Join Team</p>
                <label className="mt-4 grid gap-2 text-sm text-neutral-200">
                  <span>Team Name</span>
                  <input
                    value={joinTeamName}
                    onChange={(event) => setJoinTeamName(event.target.value)}
                    className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-terminal-amber focus:ring-2 focus:ring-terminal-amber/30"
                    placeholder="Red Team Raptors"
                    disabled={Boolean(team) || !user || joinStatus === "submitting" || !registrationOpen}
                  />
                </label>

                <label className="mt-4 grid gap-2 text-sm text-neutral-200">
                  <span>Enter Join Code</span>
                  <input
                    value={joinCode}
                    maxLength={6}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-neutral-100 outline-none transition focus:border-terminal-amber focus:ring-2 focus:ring-terminal-amber/30"
                    placeholder="A1B2C3"
                    disabled={Boolean(team) || !user || joinStatus === "submitting" || !registrationOpen}
                  />
                </label>

                <button
                  type="submit"
                  disabled={Boolean(team) || !user || joinStatus === "submitting" || !registrationOpen}
                  className="mt-4 rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-4 py-2 text-sm font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber"
                >
                  {joinStatus === "submitting" ? "Joining..." : "Join Team"}
                </button>

                {joinMessage ? <p className="mt-3 text-sm text-neutral-300">{joinMessage}</p> : null}

                <div className="mt-4 rounded-lg border border-white/10 bg-black/60 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Remaining Slots</p>
                  <p className={`mt-2 text-xl font-semibold ${slotCount <= 1 ? "text-terminal-amber" : "text-phosphor"}`}>
                    {slotCount}
                  </p>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-neutral-300 backdrop-blur-md">
                Pick an action card above to continue with team setup.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
