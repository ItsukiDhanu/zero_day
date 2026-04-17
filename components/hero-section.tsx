"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HACKATHON_COUNTDOWN_TARGET_LABEL,
  HACKATHON_START_LABEL,
  HACKATHON_START_MS,
} from "@/lib/hackathon-config";

const rotatingCommands = [
  "./register --squad ready --mode blitz",
  "./register --role builder --year first",
  "./teams --create night-owls --slot 4",
  "./join --team night-owls --code A1B2C3",
  "./launch --prototype --before sunrise",
] as const;

const TYPE_SPEED_MS = 42;
const DELETE_SPEED_MS = 24;
const HOLD_COMMAND_MS = 1400;
const NEXT_COMMAND_DELAY_MS = 260;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function getCountdownState(nowMs: number) {
  const remainingMs = HACKATHON_START_MS - nowMs;

  if (remainingMs <= 0) {
    return {
      isLive: true,
      label: "T-00d 00h 00m 00s // HACKATHON LIVE",
    };
  }

  const days = Math.floor(remainingMs / DAY_MS);
  const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((remainingMs % MINUTE_MS) / SECOND_MS);

  return {
    isLive: false,
    label: `T-${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`,
  };
}

export function HeroSection() {
  const [typedCommand, setTypedCommand] = useState("");
  const [countdown, setCountdown] = useState(() => getCountdownState(Date.now()));

  useEffect(() => {
    let commandIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer: number | undefined;

    const scheduleTick = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = () => {
      const activeCommand = rotatingCommands[commandIndex];
      setTypedCommand(activeCommand.slice(0, characterIndex));

      if (!deleting) {
        if (characterIndex < activeCommand.length) {
          characterIndex += 1;
          scheduleTick(TYPE_SPEED_MS);
          return;
        }

        deleting = true;
        scheduleTick(HOLD_COMMAND_MS);
        return;
      }

      if (characterIndex > 0) {
        characterIndex -= 1;
        scheduleTick(DELETE_SPEED_MS);
        return;
      }

      deleting = false;
      commandIndex = (commandIndex + 1) % rotatingCommands.length;
      scheduleTick(NEXT_COMMAND_DELAY_MS);
    };

    scheduleTick(120);

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getCountdownState(Date.now()));
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, SECOND_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section id="hero" className="mx-auto mt-10 w-full max-w-5xl scroll-mt-20">
      <div className="animate-hero-fade-in rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow motion-reduce:animate-none sm:p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-phosphor/90">Zero Day Hackathon // Registration Open</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-neutral-100 sm:text-5xl">
          Prototype. Penetrate. Prevail.
          <span className="block text-phosphor">From first commit to final pitch before dawn.</span>
        </h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-terminal-amber sm:text-sm">
          Hackathon starts {HACKATHON_START_LABEL}
        </p>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
          Zero Day is built for teams who love pressure and pace. Register in seconds, lock your squad,
          and spend the night building, breaking, and shipping before final demos.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">terminal://primary-cta</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-phosphor sm:text-base">
            <span className="text-neutral-500">$</span>
            <span aria-live="polite">{typedCommand}</span>
            <span aria-hidden="true" className="h-5 w-2 bg-phosphor animate-caret-blink motion-reduce:animate-none" />
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/60 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">timer://hackathon-start</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <span className="text-neutral-500">$</span>
              <span className="text-terminal-amber">{`./countdown --to ${HACKATHON_COUNTDOWN_TARGET_LABEL}`}</span>
            </div>
            <p className={`mt-1 text-sm font-semibold ${countdown.isLive ? "text-phosphor" : "text-terminal-amber"}`}>
              {countdown.label}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-lg border border-phosphor bg-phosphor px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor"
          >
            Register Now
          </Link>
          <Link
            href="/teams"
            className="rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-4 py-2 text-sm font-semibold text-terminal-amber transition hover:bg-terminal-amber/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terminal-amber"
          >
            Team Console
          </Link>
        </div>
      </div>
    </section>
  );
}
