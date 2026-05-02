import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";
import { HACKATHON_FOOTER_LABEL } from "@/lib/hackathon-config";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Zero Day Hackathon",
  description:
    "High-conversion hackathon registration and team management platform with a terminal-grade UX.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-neutral-950">
      <body
        className={`${jetbrainsMono.variable} min-h-screen bg-neutral-950 font-mono text-neutral-100 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>

          <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>
                ZERO_DAY // HACKATHON STARTS <span className="text-terminal-amber">{HACKATHON_FOOTER_LABEL}</span>
              </p>
                <p className="text-neutral-300">
                  Contact for queries: {" "}
                  <a href="mailto:dhanushvpshetty@gmail.com" className="text-phosphor transition hover:text-phosphor/80">
                    dhanushvpshetty@gmail.com
                  </a>
                  {" "}|{" "}
                  <a href="tel:+919606726468" className="text-terminal-amber transition hover:text-terminal-amber/80">
                    +91 9606726468
                  </a>
                </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
