"use client";

import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  repositorySubmissionOpen?: boolean;
  error?: string;
};

type AdminUsersResponse = {
  users?: AdminManagedUser[];
  teamsById?: Record<string, TeamSnapshot>;
  error?: string;
};

type AdminUserSuggestionsResponse = {
  suggestions?: Array<{
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
  }>;
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

type UserSearchSuggestion = {
  id: string;
  value: string;
  label: string;
  kind: "Name" | "Email" | "Phone";
};

type UserSearchCacheEntry = {
  users: AdminManagedUser[];
  teamsById: Record<string, TeamSnapshot>;
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

function toCsvCell(value: string) {
  if (/[,"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildUserSearchSuggestions(
  users: Array<{ name: string | null; email: string; phoneNumber: string | null }>,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const phoneQuery = query.replace(/[^0-9]/g, "");

  if (!normalizedQuery) {
    return [] as UserSearchSuggestion[];
  }

  const suggestions: UserSearchSuggestion[] = [];

  for (const managedUser of users) {
    const name = managedUser.name?.trim() ?? "";
    const email = managedUser.email.trim();
    const phone = managedUser.phoneNumber?.trim() ?? "";

    if (name && name.toLowerCase().includes(normalizedQuery)) {
      suggestions.push({
        id: `name:${name.toLowerCase()}`,
        value: name,
        label: `${name} (${email})`,
        kind: "Name",
      });
    }

    if (email.toLowerCase().includes(normalizedQuery)) {
      suggestions.push({
        id: `email:${email.toLowerCase()}`,
        value: email,
        label: email,
        kind: "Email",
      });
    }

    if (phone && phoneQuery.length >= 3 && phone.includes(phoneQuery)) {
      suggestions.push({
        id: `phone:${phone}`,
        value: phone,
        label: `${phone} (${email})`,
        kind: "Phone",
      });
    }
  }

  const deduped = new Map<string, UserSearchSuggestion>();

  for (const suggestion of suggestions) {
    if (!deduped.has(suggestion.id)) {
      deduped.set(suggestion.id, suggestion);
    }
  }

  return Array.from(deduped.values()).slice(0, 8);
}

export function AdminControlsPanel({ mode = "admin" }: { mode?: ControlPanelMode }) {
  const isOrganizerView = mode === "organizer";
  const userSearchCacheRef = useRef<Map<string, UserSearchCacheEntry>>(new Map());
  const userSuggestionCacheRef = useRef<Map<string, UserSearchSuggestion[]>>(new Map());

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [repositorySubmissionOpen, setRepositorySubmissionOpen] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [teamsById, setTeamsById] = useState<Record<string, TeamSnapshot>>({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersMessage, setUsersMessage] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchSuggestions, setUserSearchSuggestions] = useState<UserSearchSuggestion[]>([]);
  const [userSearchSuggestionsLoading, setUserSearchSuggestionsLoading] = useState(false);
  const [selectedUserSuggestionIndex, setSelectedUserSuggestionIndex] = useState(-1);
  const [lastUserSearchQuery, setLastUserSearchQuery] = useState("");
  const [usersSearched, setUsersSearched] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);

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

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/settings", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as SettingsResponse;

    if (
      !response.ok ||
      typeof payload.registrationOpen !== "boolean" ||
      typeof payload.repositorySubmissionOpen !== "boolean"
    ) {
      throw new Error(payload.error ?? "Unable to load global settings.");
    }

    setRegistrationOpen(payload.registrationOpen);
    setRepositorySubmissionOpen(payload.repositorySubmissionOpen);
  }, []);

  const loadUsers = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    const queryKey = query.toLowerCase();

    if (!query) {
      setUsers([]);
      setTeamsById({});
      setUsersSearched(false);
      setUsersMessage("");
      return;
    }

    const cachedResult = userSearchCacheRef.current.get(queryKey);

    if (cachedResult) {
      setUsers(cachedResult.users);
      setTeamsById(cachedResult.teamsById);
      setUsersSearched(true);
      setLastUserSearchQuery(query);
      setUsersMessage(
        `Loaded ${cachedResult.users.length} user${cachedResult.users.length === 1 ? "" : "s"} for "${query}".`,
      );
      return;
    }

    setUsersLoading(true);
    setUsersMessage("");

    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AdminUsersResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load user directory.");
      }

      const nextUsers = payload.users ?? [];
      const nextTeamsById = payload.teamsById ?? {};

      userSearchCacheRef.current.set(queryKey, {
        users: nextUsers,
        teamsById: nextTeamsById,
      });

      const nextSuggestions = buildUserSearchSuggestions(nextUsers, query);
      userSuggestionCacheRef.current.set(queryKey, nextSuggestions);

      setUsers(nextUsers);
      setTeamsById(nextTeamsById);
      setUsersSearched(true);
      setLastUserSearchQuery(query);
      setUsersMessage(
        `Loaded ${nextUsers.length} user${nextUsers.length === 1 ? "" : "s"} for "${query}".`,
      );
    } catch (error) {
      setUsersSearched(false);
      setUsersMessage(error instanceof Error ? error.message : "Unable to load user directory.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

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

  const loadAll = useCallback(async () => {
    setSettingsMessage("");
    setTeamsMessage("");

    try {
      await loadSettings();
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "Unable to load control center state.");
    }
  }, [loadSettings]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setSelectedUserSuggestionIndex(-1);
  }, [userSearchQuery]);

  useEffect(() => {
    const query = userSearchQuery.trim();
    const queryKey = query.toLowerCase();

    if (query.length < 2) {
      setUserSearchSuggestions([]);
      setUserSearchSuggestionsLoading(false);
      return;
    }

    const cachedSuggestions = userSuggestionCacheRef.current.get(queryKey);

    if (cachedSuggestions) {
      setUserSearchSuggestions(cachedSuggestions);
      setUserSearchSuggestionsLoading(false);
      return;
    }

    let isCancelled = false;
    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      setUserSearchSuggestionsLoading(true);

      try {
        const response = await fetch(`/api/admin/users/suggestions?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: abortController.signal,
        });
        const payload = (await response.json().catch(() => ({}))) as AdminUserSuggestionsResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load user suggestions.");
        }

        if (isCancelled) {
          return;
        }

        const nextSuggestions = buildUserSearchSuggestions(payload.suggestions ?? [], query);
        userSuggestionCacheRef.current.set(queryKey, nextSuggestions);
        setUserSearchSuggestions(nextSuggestions);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!isCancelled) {
          setUserSearchSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setUserSearchSuggestionsLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [userSearchQuery]);

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

      if (
        !response.ok ||
        typeof payload.registrationOpen !== "boolean" ||
        typeof payload.repositorySubmissionOpen !== "boolean"
      ) {
        throw new Error(payload.error ?? "Settings update failed.");
      }

      setRegistrationOpen(payload.registrationOpen);
      setRepositorySubmissionOpen(payload.repositorySubmissionOpen);
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

  const handleToggleRepositorySubmission = async () => {
    setSettingsBusy(true);
    setSettingsMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repositorySubmissionOpen: !repositorySubmissionOpen }),
      });

      const payload = (await response.json().catch(() => ({}))) as SettingsResponse;

      if (
        !response.ok ||
        typeof payload.registrationOpen !== "boolean" ||
        typeof payload.repositorySubmissionOpen !== "boolean"
      ) {
        throw new Error(payload.error ?? "Settings update failed.");
      }

      setRegistrationOpen(payload.registrationOpen);
      setRepositorySubmissionOpen(payload.repositorySubmissionOpen);
      setSettingsMessage(
        payload.repositorySubmissionOpen
          ? "Repository submission toggled to OPEN. Team leaders can submit GitHub links."
          : "Repository submission toggled to CLOSED. Team leaders cannot submit links right now.",
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

  const handleClearUserSearch = () => {
    setUserSearchQuery("");
    setUserSearchSuggestions([]);
    setUserSearchSuggestionsLoading(false);
    setSelectedUserSuggestionIndex(-1);
    setLastUserSearchQuery("");
    setUsersSearched(false);
    setUsersMessage("");
    setUsers([]);
    setTeamsById({});
  };

  const applyUserSearchSuggestion = (value: string) => {
    setUserSearchQuery(value);
    setUserSearchSuggestions([]);
    setUserSearchSuggestionsLoading(false);
    setSelectedUserSuggestionIndex(-1);
    void loadUsers(value);
  };

  const handleUserSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (userSearchSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedUserSuggestionIndex((current) => {
        const next = current + 1;
        return next >= userSearchSuggestions.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedUserSuggestionIndex((current) => {
        if (current <= 0) {
          return userSearchSuggestions.length - 1;
        }

        return current - 1;
      });
      return;
    }

    if (event.key === "Enter" && selectedUserSuggestionIndex >= 0) {
      event.preventDefault();
      applyUserSearchSuggestion(userSearchSuggestions[selectedUserSuggestionIndex].value);
      return;
    }

    if (event.key === "Escape") {
      setSelectedUserSuggestionIndex(-1);
      setUserSearchSuggestions([]);
    }
  };

  const handleExportUsersCsv = async () => {
    setCsvExporting(true);

    try {
      const response = await fetch("/api/admin/users?scope=all", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as AdminUsersResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to export users.");
      }

      const exportUsers = payload.users ?? [];
      const exportTeamsById = payload.teamsById ?? {};

      if (exportUsers.length === 0) {
        setUsersMessage("No users available for export.");
        return;
      }

      const exportTeamMemberCountByTeamId = new Map<string, number>();

      for (const managedUser of exportUsers) {
        if (!managedUser.teamId) {
          continue;
        }

        exportTeamMemberCountByTeamId.set(
          managedUser.teamId,
          (exportTeamMemberCountByTeamId.get(managedUser.teamId) ?? 0) + 1,
        );
      }

      const headers = [
        "User ID",
        "Name",
        "Email",
        "Role",
        "Year",
        "Department",
        "Phone",
        "Team Name",
        "Join Code",
        "Team Member Count",
        "Registered At",
      ];

      const rows = exportUsers.map((managedUser) => {
        const linkedTeam = managedUser.teamId ? exportTeamsById[managedUser.teamId] : null;

        return [
          managedUser.id,
          managedUser.name ?? "",
          managedUser.email,
          managedUser.role,
          formatAcademicYear(managedUser.year),
          managedUser.branch ?? "",
          managedUser.phoneNumber ?? "",
          linkedTeam?.name ?? "",
          linkedTeam?.joinCode ?? "",
          managedUser.teamId ? String(exportTeamMemberCountByTeamId.get(managedUser.teamId) ?? 0) : "0",
          new Date(managedUser.createdAt).toISOString(),
        ]
          .map((value) => toCsvCell(value))
          .join(",");
      });

      const csv = [headers.map((value) => toCsvCell(value)).join(","), ...rows].join("\n");
      const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      link.href = downloadUrl;
      link.setAttribute("download", `user-directory-all-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      setUsersMessage(`Exported ${exportUsers.length} users to CSV.`);
    } catch (error) {
      setUsersMessage(error instanceof Error ? error.message : "Unable to export users.");
    } finally {
      setCsvExporting(false);
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

        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            repositorySubmissionOpen
              ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
              : "border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"
          }`}
        >
          Repository Submission: {repositorySubmissionOpen ? "OPEN" : "CLOSED"}
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
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Repository Submission</p>
              <p className="mt-1 text-sm text-neutral-200">
                Allow team leaders to submit or update GitHub repository links on Confirmed Teams.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleRepositorySubmission}
              disabled={settingsBusy}
              className="rounded-lg border border-phosphor bg-phosphor px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {settingsBusy
                ? "Applying..."
                : repositorySubmissionOpen
                  ? "Close Repo Submission"
                  : "Open Repo Submission"}
            </button>
          </div>
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
              onClick={() => void handleExportUsersCsv()}
              disabled={usersLoading || csvExporting}
              className="rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-3 py-2 text-xs font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber"
            >
              {csvExporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setUserSearchSuggestions([]);
              setUserSearchSuggestionsLoading(false);
              setSelectedUserSuggestionIndex(-1);
              void loadUsers(userSearchQuery);
            }}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <input
              type="text"
              value={userSearchQuery}
              onChange={(event) => setUserSearchQuery(event.target.value)}
              onKeyDown={handleUserSearchKeyDown}
              placeholder="Search by name, email, or phone"
              className="min-w-[16rem] flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-phosphor focus:ring-2 focus:ring-phosphor/30"
            />

            <button
              type="submit"
              disabled={usersLoading || Boolean(actionBusyKey) || userSearchQuery.trim().length < 2}
              className="rounded-lg border border-phosphor bg-phosphor px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
            >
              {usersLoading ? "Searching..." : "Search User"}
            </button>

            <button
              type="button"
              onClick={handleClearUserSearch}
              disabled={usersLoading || (!usersSearched && !userSearchQuery)}
              className="rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-semibold text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor disabled:cursor-not-allowed disabled:opacity-70"
            >
              Clear
            </button>
          </form>

          {userSearchQuery.trim().length >= 2 && (userSearchSuggestionsLoading || userSearchSuggestions.length > 0) ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/60 p-2">
              <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500">Suggestions</p>

              {userSearchSuggestionsLoading ? (
                <p className="px-2 pb-1 text-xs text-neutral-400">Loading suggestions...</p>
              ) : (
                <ul className="grid gap-1">
                  {userSearchSuggestions.map((suggestion, index) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        onClick={() => applyUserSearchSuggestion(suggestion.value)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition ${
                          index === selectedUserSuggestionIndex
                            ? "bg-phosphor/15 text-phosphor"
                            : "bg-black/40 text-neutral-200 hover:bg-white/10"
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
              )}
            </div>
          ) : null}

          {usersMessage ? <p className="mt-3 text-sm text-neutral-300">{usersMessage}</p> : null}

          {usersSearched && lastUserSearchQuery ? (
            <p className="mt-2 text-xs text-neutral-400">Showing results for: {lastUserSearchQuery}</p>
          ) : null}

          <div className="mt-4 grid gap-3">
            {usersLoading ? (
              <p className="text-sm text-neutral-400">Loading user directory...</p>
            ) : !usersSearched ? (
              <p className="text-sm text-neutral-400">Search user directory to load only matching users.</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-neutral-400">No users matched your search.</p>
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
              <p className="text-sm text-neutral-400">Team directory is not loaded yet. Click Load Teams when needed.</p>
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
