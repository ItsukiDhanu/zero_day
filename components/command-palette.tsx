"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type CommandAction = {
  id: string;
  label: string;
  section: string;
  hint: string;
  path: string;
};

const commandActions: CommandAction[] = [
  {
    id: "hero",
    label: "Mission Brief",
    section: "Landing",
    hint: "Go to home",
    path: "/",
  },
  {
    id: "registration",
    label: "Register Operator",
    section: "Onboarding",
    hint: "Open registration page",
    path: "/register",
  },
  {
    id: "login",
    label: "Operator Login",
    section: "Onboarding",
    hint: "Open login page",
    path: "/login",
  },
  {
    id: "forgot-password",
    label: "Reset Password",
    section: "Onboarding",
    hint: "Open forgot-password page",
    path: "/forgot-password",
  },
  {
    id: "teams",
    label: "Team Console",
    section: "Team Ops",
    hint: "Open team dashboard page",
    path: "/teams",
  },
  {
    id: "confirmed-teams",
    label: "Confirmed Teams",
    section: "Team Ops",
    hint: "Open public confirmed teams roster",
    path: "/confirmed-teams",
  },
  {
    id: "rules",
    label: "Hackathon Rules",
    section: "Info",
    hint: "Open rules and participation policy",
    path: "/rules",
  },
  {
    id: "faq",
    label: "FAQ",
    section: "Info",
    hint: "Open frequently asked questions",
    path: "/faq",
  },
  {
    id: "dashboard",
    label: "Participant Dashboard",
    section: "Workspace",
    hint: "Open participant dashboard",
    path: "/dashboard",
  },
];

const CommandPaletteDialog = dynamic(
  () => import("./command-palette-dialog").then((mod) => mod.CommandPaletteDialog),
  { ssr: false },
);

type CommandPaletteProps = {
  isAuthenticated?: boolean;
};

export function CommandPalette({ isAuthenticated = false }: CommandPaletteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CommandAction | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && pressedK) {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => {
      void import("./command-palette-dialog");
    }, 1200);

    return () => window.clearTimeout(preloadTimer);
  }, []);

  const filteredActions = useMemo(() => {
    const availableActions = isAuthenticated
      ? commandActions.filter((action) => action.id !== "registration" && action.id !== "login")
      : commandActions;

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return availableActions;
    }

    return availableActions.filter((action) =>
      [action.label, action.section, action.hint].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [isAuthenticated, query]);

  const handleSelect = (action: CommandAction | null) => {
    if (!action) {
      return;
    }

    setSelected(action);
    setIsOpen(false);
    setQuery("");
    router.push(action.path);
  };

  return (
    <>
      <div className="fixed right-5 top-5 z-30 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-neutral-300 backdrop-blur-md">
        <span className="text-phosphor">Cmd/Ctrl</span> + <span className="text-phosphor">K</span>
      </div>

      {isOpen ? (
        <CommandPaletteDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          selected={selected}
          setQuery={setQuery}
          filteredActions={filteredActions}
          onSelect={handleSelect}
        />
      ) : null}
    </>
  );
}
