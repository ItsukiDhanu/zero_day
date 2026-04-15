"use client";

import { useEffect, useMemo, useState } from "react";

type TeamMemberSnapshot = {
  id: string;
  name: string | null;
  email: string;
};

type TeamSnapshot = {
  id: string;
  name: string;
  joinCode: string;
};

type AdminManagedTeam = {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  memberCount: number;
  members: TeamMemberSnapshot[];
};

type AdminManagedUser = {
  id: string;
  name: string | null;
  email: string;
  role: "PARTICIPANT" | "ORGANIZER" | "ADMIN";
  year: string | null;
  branch: string | null;
  phoneNumber: string | null;
  createdAt: string;
  teamId: string | null;
};

type SettingsResponse = {
  registrationOpen?: boolean;
  error?: string;
};

type AdminUsersResponse = {
  users?: AdminManagedUser[];
  teamsById?: Record<string, TeamSnapshot>;
  error?: string;
};

type AdminTeamsResponse = {
  teams?: AdminManagedTeam[];
  error?: string;
};

type AdminActionResponse = {
  message?: string;
  error?: string;
};

type RoleActionResponse = AdminActionResponse & {
  user?: {
    id: string;
    role: "PARTICIPANT" | "ORGANIZER" | "ADMIN";
  };
};

type TeamDetachActionResponse = AdminActionResponse & {
  user?: {
    id: string;
    teamId: string | null;
  };
};

const ROLE_OPTIONS = ["PARTICIPANT", "ORGANIZER", "ADMIN"] as const;
type ControlPanelMode = "admin" | "organizer";

function formatAcademicYear(year: string | null) {
  if (year === "FIRST_YEAR") {
    return "1st Year";
  }

  if (year === "SECOND_YEAR") {
    return "2nd Year";
  }

  return year ?? "Year N/A";
}

export function AdminControlsPanel({ mode = "admin" }: { mode?: ControlPanelMode }) {
  const isOrganizerView = mode === "organizer";

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [teamsById, setTeamsById] = useState<Record<string, TeamSnapshot>>({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersMessage, setUsersMessage] = useState("");

  const [teams, setTeams] = useState<AdminManagedTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [teamsMessage, setTeamsMessage] = useState("");

  const [actionBusyKey, setActionBusyKey] = useState("");

  const teamMemberCountByTeamId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const managedUser of users) {
      if (!managedUser.teamId) {
        continue;
      }

      counts.set(managedUser.teamId, (counts.get(managedUser.teamId) ?? 0) + 1);
    }

    return counts;
  }, [users]);

  const loadSettings = async () => {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as SettingsResponse;

    if (!response.ok || typeof payload.registrationOpen !== "boolean") {
      throw new Error(payload.error ?? "Unable to load registration settings.");
    }

    setRegistrationOpen(payload.registrationOpen);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersMessage("");

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AdminUsersResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load user directory.");
      }

      setUsers(payload.users ?? []);
      setTeamsById(payload.teamsById ?? {});
    } catch (error) {
      setUsersMessage(error instanceof Error ? error.message : "Unable to load user directory.");
    } finally {
      setUsersLoading(false);
    }
  };

  const loadTeams = async () => {
    setTeamsLoading(true);
    setTeamsMessage("");

    try {
      const response = await fetch("/api/admin/teams", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AdminTeamsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load team directory.");
      }

      setTeams(payload.teams ?? []);
      setTeamsLoaded(true);
    } catch (error) {
      setTeamsMessage(error instanceof Error ? error.message : "Unable to load team directory.");
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadAll = async () => {
    setSettingsMessage("");
    setUsersMessage("");
    setTeamsMessage("");

    try {
      await Promise.all([loadSettings(), loadUsers()]);
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Unable to load control center state.");
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleToggleRegistration = async () => {
    setSettingsBusy(true);
    setSettingsMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationOpen: !registrationOpen }),
      });

      const payload = (await response.json().catch(() => ({}))) as SettingsResponse;

      if (!response.ok || typeof payload.registrationOpen !== "boolean") {
        throw new Error(payload.error ?? "Settings update failed.");
      }

      setRegistrationOpen(payload.registrationOpen);
      setSettingsMessage(
        payload.registrationOpen
          ? "Registration toggled to OPEN. New users can register and form teams."
          : "Registration toggled to CLOSED. New user/team actions are paused.",
      );
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Settings update failed.");
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, role: (typeof ROLE_OPTIONS)[number]) => {
    setActionBusyKey(`role:${targetUserId}:${role}`);
    setUsersMessage("");

    try {
      const response = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const payload = (await response.json().catch(() => ({}))) as RoleActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Role update failed.");
      }

      setUsersMessage(payload.message ?? "Role updated.");
      setUsers((current) =>
        current.map((managedUser) =>
          managedUser.id === targetUserId ? { ...managedUser, role: payload.user?.role ?? role } : managedUser,
        ),
      );
    } catch (error) {
      setUsersMessage(error instanceof Error ? error.message : "Role update failed.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleForceRemoveFromTeam = async (targetUserId: string) => {
    setActionBusyKey(`remove:${targetUserId}`);
    setUsersMessage("");

    try {
      const response = await fetch(`/api/admin/users/${targetUserId}/force-remove-team`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => ({}))) as TeamDetachActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Force remove failed.");
      }

      const removedUser = users.find((managedUser) => managedUser.id === targetUserId);
      const detachedTeamId = removedUser?.teamId ?? null;

      setUsersMessage(payload.message ?? "User removed from team.");
      setUsers((current) =>
        current.map((managedUser) =>
          managedUser.id === targetUserId ? { ...managedUser, teamId: null } : managedUser,
        ),
      );

      if (detachedTeamId) {
        setTeams((current) =>
          current.map((managedTeam) =>
            managedTeam.id === detachedTeamId
              ? {
                  ...managedTeam,
                  memberCount: Math.max(0, managedTeam.memberCount - 1),
                  members: managedTeam.members.filter((member) => member.id !== targetUserId),
                }
              : managedTeam,
          ),
        );
      }
    } catch (error) {
      setUsersMessage(error instanceof Error ? error.message : "Force remove failed.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetEmail: string) => {
    const confirmed = window.confirm(`Delete user ${targetEmail}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setActionBusyKey(`delete-user:${targetUserId}`);
    setUsersMessage("");

    try {
      const response = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as AdminActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "User deletion failed.");
      }

      const deletedUser = users.find((managedUser) => managedUser.id === targetUserId);
      const deletedUserTeamId = deletedUser?.teamId ?? null;

      setUsersMessage(payload.message ?? "User deleted.");
      setUsers((current) => current.filter((managedUser) => managedUser.id !== targetUserId));

      if (deletedUserTeamId) {
        setTeams((current) =>
          current.map((managedTeam) =>
            managedTeam.id === deletedUserTeamId
              ? {
                  ...managedTeam,
                  memberCount: Math.max(0, managedTeam.memberCount - 1),
                  members: managedTeam.members.filter((member) => member.id !== targetUserId),
                }
              : managedTeam,
          ),
        );
      }
    } catch (error) {
      setUsersMessage(error instanceof Error ? error.message : "User deletion failed.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleDeleteTeam = async (targetTeamId: string, targetTeamName: string) => {
    const confirmed = window.confirm(
      `Delete team ${targetTeamName}? All members will be detached from that team.`,
    );

    if (!confirmed) {
      return;
    }

    setActionBusyKey(`delete-team:${targetTeamId}`);
    setTeamsMessage("");

    try {
      const response = await fetch(`/api/admin/teams/${targetTeamId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as AdminActionResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Team deletion failed.");
      }

      setTeamsMessage(payload.message ?? "Team deleted.");
      setTeams((current) => current.filter((managedTeam) => managedTeam.id !== targetTeamId));
      setUsers((current) =>
        current.map((managedUser) =>
          managedUser.teamId === targetTeamId ? { ...managedUser, teamId: null } : managedUser,
        ),
      );
      setTeamsById((current) => {
        const next = { ...current };
        delete next[targetTeamId];
        return next;
      });
    } catch (error) {
      setTeamsMessage(error instanceof Error ? error.message : "Team deletion failed.");
    } finally {
      setActionBusyKey("");
    }
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl pb-12">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">
          {isOrganizerView ? "Organizer Control Center" : "Hidden Admin Control Center"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">
          {isOrganizerView ? "Registration + Team Overview" : "Role + Team Management"}
        </h1>

        {isOrganizerView ? (
          <p className="mt-2 text-sm text-neutral-300">
            Organizer mode is read-only for user/team directories. Registration toggle is still enabled.
          </p>
        ) : null}

        <div
          className={`mt-5 rounded-lg border px-3 py-2 text-sm ${
            registrationOpen
              ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
              : "border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"
          }`}
        >
          Registration Status: {registrationOpen ? "OPEN" : "CLOSED"}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Global Setting</p>
              <p className="mt-1 text-sm text-neutral-200">Toggle registration access for all operators.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleRegistration}
              disabled={settingsBusy}
              className="rounded-lg border border-phosphor bg-phosphor px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {settingsBusy ? "Applying..." : registrationOpen ? "Close Registration" : "Open Registration"}
            </button>
          </div>

          {settingsMessage ? <p className="mt-3 text-sm text-neutral-300">{settingsMessage}</p> : null}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">User Directory</p>
              <p className="mt-1 text-sm text-neutral-200">
                {isOrganizerView
                  ? "View user profiles and team assignments."
                  : "Set roles and force-remove users from teams."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={usersLoading || Boolean(actionBusyKey)}
              className="rounded-lg border border-phosphor bg-phosphor px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {usersLoading ? "Refreshing..." : "Refresh Users"}
            </button>
          </div>

          {usersMessage ? <p className="mt-3 text-sm text-neutral-300">{usersMessage}</p> : null}

          <div className="mt-4 grid gap-3">
            {usersLoading ? (
              <p className="text-sm text-neutral-400">Loading user directory...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-neutral-400">No users available yet.</p>
            ) : (
              users.map((managedUser) => {
                const linkedTeam = managedUser.teamId ? teamsById[managedUser.teamId] : null;

                return (
                  <div key={managedUser.id} className="rounded-lg border border-white/10 bg-black/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-100">{managedUser.name || "Unnamed Participant"}</p>
                        <p className="text-xs text-neutral-400">{managedUser.email}</p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {formatAcademicYear(managedUser.year)} • {managedUser.branch || "Branch N/A"} • {managedUser.phoneNumber || "Phone N/A"}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Registered: {new Date(managedUser.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                          managedUser.role === "ADMIN"
                            ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
                            : managedUser.role === "ORGANIZER"
                              ? "border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"
                              : "border-white/20 bg-black/40 text-neutral-300"
                        }`}
                      >
                        {managedUser.role}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-neutral-400">
                      {managedUser.teamId && linkedTeam
                        ? `Team: ${linkedTeam.name} (${linkedTeam.joinCode}) • ${teamMemberCountByTeamId.get(managedUser.teamId) ?? 0}/4`
                        : managedUser.teamId
                          ? "Team: Assigned"
                          : "Team: None"}
                    </p>

                    {!isOrganizerView ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((roleOption) => (
                          <button
                            key={`${managedUser.id}-${roleOption}`}
                            type="button"
                            disabled={Boolean(actionBusyKey) || managedUser.role === roleOption}
                            onClick={() => void handleRoleChange(managedUser.id, roleOption)}
                            className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Set {roleOption}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={Boolean(actionBusyKey) || !managedUser.teamId}
                          onClick={() => void handleForceRemoveFromTeam(managedUser.id)}
                          className="rounded-md border border-terminal-amber/60 bg-terminal-amber/10 px-2.5 py-1 text-xs font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Force Remove Team
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(actionBusyKey)}
                          onClick={() => void handleDeleteUser(managedUser.id, managedUser.email)}
                          className="rounded-md border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete User
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Team Directory</p>
              <p className="mt-1 text-sm text-neutral-200">
                {isOrganizerView
                  ? "Review all teams and member rosters."
                  : "Review all teams and delete invalid or duplicate teams."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadTeams()}
              disabled={teamsLoading || Boolean(actionBusyKey)}
              className="rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-3 py-2 text-xs font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber"
            >
              {teamsLoading ? "Loading..." : teamsLoaded ? "Refresh Teams" : "Load Teams"}
            </button>
          </div>

          {teamsMessage ? <p className="mt-3 text-sm text-neutral-300">{teamsMessage}</p> : null}

          <div className="mt-4 grid gap-3">
            {teamsLoading ? (
              <p className="text-sm text-neutral-400">Loading team directory...</p>
            ) : !teamsLoaded ? (
              <p className="text-sm text-neutral-400">Team directory is not loaded yet. Click "Load Teams" when needed.</p>
            ) : teams.length === 0 ? (
              <p className="text-sm text-neutral-400">No teams created yet.</p>
            ) : (
              teams.map((managedTeam) => (
                <div key={managedTeam.id} className="rounded-lg border border-white/10 bg-black/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">{managedTeam.name}</p>
                      <p className="text-xs text-neutral-400">Join Code: {managedTeam.joinCode}</p>
                      <p className="mt-1 text-xs text-neutral-400">Members: {managedTeam.memberCount}/4</p>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Created: {new Date(managedTeam.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!isOrganizerView ? (
                      <button
                        type="button"
                        disabled={Boolean(actionBusyKey)}
                        onClick={() => void handleDeleteTeam(managedTeam.id, managedTeam.name)}
                        className="rounded-md border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete Team
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs text-neutral-400">
                    {managedTeam.members.length === 0
                      ? "Members: None"
                      : `Members: ${managedTeam.members
                          .map((member) => member.name || member.email)
                          .join(", ")}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
