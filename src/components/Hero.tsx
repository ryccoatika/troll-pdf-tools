"use client";

import { motion } from "motion/react";
import { useApp, type Tool } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { FuseIcon, LaserIcon, PressIcon } from "./Icons";

export const TOOLS: { id: Tool; name: string; tag: string; blurb: string; color: string; Icon: typeof PressIcon }[] = [
  {
    id: "compress",
    name: "Compress PDF",
    tag: "40-ton hydraulic",
    blurb: "Crush your document's content up to 90% thinner. Every page, every word.",
    color: "#ffb020",
    Icon: PressIcon,
  },
  {
    id: "split",
    name: "Split PDF",
    tag: "Precision laser",
    blurb: "Every page cut cleanly in half. Twice the pages, zero extra effort.",
    color: "#5ef0ff",
    Icon: LaserIcon,
  },
  {
    id: "merge",
    name: "Merge PDF",
    tag: "Molecular fusion",
    blurb: "Combine all your PDFs into one. One page. All of it. At once.",
    color: "#a974ff",
    Icon: FuseIcon,
  },
];

export default function Hero() {
  const setTool = useApp((s) => s.setTool);
  const pick = (t: Tool) => {
    sfx.click();
    setTool(t);
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-muted"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
          100% in-browser. Your files never leave your device. Sadly.
        </motion.div>

        <motion.h1
          initial={{ y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto max-w-4xl text-balance text-center font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl"
        >
          PDF tools that do{" "}
          <span className="relative inline-block font-serif font-normal italic text-amber">
            <motion.span
              className="inline-block origin-bottom"
              animate={{ scaleY: [1, 1, 0.45, 0.45, 1], scaleX: [1, 1, 1.12, 1.12, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.55, 0.62, 0.9, 1], ease: "easeInOut" }}
            >
              exactly
            </motion.span>
          </span>{" "}
          what they say.
        </motion.h1>

        <motion.p
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-center text-lg text-muted"
        >
          Compress, split and merge PDFs with industrial-grade, physically accurate, extremely literal technology.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => pick("compress")}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-black transition hover:bg-white"
          >
            Start squishing. It&apos;s free
          </button>
          <a href="#how" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/5">
            How it works
          </a>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {TOOLS.map((t, i) => (
            <motion.button
              key={t.id}
              onClick={() => pick(t.id)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.6 }}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-3xl p-6 text-left"
            >
              <div
                className="absolute -right-10 -top-10 size-40 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40"
                style={{ background: t.color }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="grid size-11 place-items-center rounded-2xl"
                  style={{ background: `${t.color}1f`, color: t.color }}
                >
                  <t.Icon />
                </span>
                <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {t.tag}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{t.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.blurb}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium" style={{ color: t.color }}>
                Open tool <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
