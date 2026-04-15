"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RouteTransitionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="relative animate-route-fade-in motion-reduce:animate-none">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-phosphor/60 animate-route-scan-line motion-reduce:animate-none"
      />
      {children}
    </div>
  );
}
