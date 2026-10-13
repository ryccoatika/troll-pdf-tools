"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { Logo, SoundOff, SoundOn } from "./Icons";

export default function Header() {
  const { muted, toggleMuted, pro, openPro } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="literally.pdf home" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight">
            literally<span className="text-amber">.pdf</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm text-muted md:flex">
          {[
            ["Tools", "#tools"],
            ["How it works", "#how"],
            ["Pricing", "#pricing"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 transition hover:bg-white/5 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              toggleMuted();
              sfx.click();
            }}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:text-ink"
          >
            {muted ? <SoundOff width={18} height={18} /> : <SoundOn width={18} height={18} />}
          </button>
          <button
            onClick={() => {
              sfx.click();
              openPro();
            }}
            className={
              pro
                ? "rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-sm font-semibold text-amber"
                : "rounded-full bg-amber px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_-8px] shadow-amber/60 transition hover:brightness-110"
            }
          >
            {pro ? "PRO ✓" : "Go Pro"}
          </button>
        </div>
      </div>
    </header>
  );
}
