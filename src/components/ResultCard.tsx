"use client";

import { downloadBytes, formatBytes } from "@/lib/pdf";
import { sfx } from "@/lib/sound";
import { CheckIcon, DownloadIcon } from "./Icons";
import type { Outcome } from "./Workspace";

export default function ResultCard({ outcome, onAgain, onFresh }: { outcome: Outcome; onAgain: () => void; onFresh: () => void }) {
  const { tool, result, axis, percent, fileCount } = outcome;
  const delta = result.outputSize - result.inputSize;
  const deltaPct = Math.round((Math.abs(delta) / Math.max(1, result.inputSize)) * 100);

  const title =
    tool === "compress" ? "Compressed. Literally." : tool === "split" ? "Split. Right down the middle." : "Merged. Into one page.";
  const story =
    tool === "compress"
      ? `Every page was crushed ${percent}% ${axis === "vertical" ? "shorter" : "narrower"}, paper and all. Direction chosen by our AI (coin).`
      : tool === "split"
        ? `Every page was cut ${axis === "vertical" ? "down the middle, left | right" : "across the middle, top / bottom"}. ${result.pagesIn} page${result.pagesIn === 1 ? "" : "s"} in, ${result.pagesOut} half-pages out.`
        : `${result.pagesIn} pages from ${fileCount} files were fused onto a single page. Reading it is your problem now.`;

  const stats: [string, string, string?][] =
    tool === "compress"
      ? [
          ["Page compression", `${percent}%`, "text-amber"],
          ["Direction", axis === "vertical" ? "Vertical ↕" : "Horizontal ↔"],
          ["Original size", formatBytes(result.inputSize)],
          [
            "New size",
            formatBytes(result.outputSize),
          ],
        ]
      : tool === "split"
        ? [
            ["Pages before", String(result.pagesIn)],
            ["Pages after", String(result.pagesOut), "text-cyan"],
            ["Cut", axis === "vertical" ? "Vertical |" : "Horizontal —"],
            ["Accuracy", "±0.0001 mm"],
          ]
        : [
            ["Pages in", String(result.pagesIn)],
            ["Pages out", "1", "text-violet"],
            ["Readability", `${Math.max(1, Math.round(100 / result.pagesIn))}%`],
            ["Efficiency", "Unmatched"],
          ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-emerald-400/15 text-emerald-400">
          <CheckIcon width={20} height={20} />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted">{result.fileName}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink/80">{story}</p>

      <div className="grid grid-cols-2 gap-2">
        {stats.map(([k, v, cls]) => (
          <div key={k} className="rounded-xl border border-line bg-black/20 px-3 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">{k}</p>
            <p className={`mt-0.5 font-display text-lg font-semibold ${cls ?? ""}`}>{v}</p>
          </div>
        ))}
      </div>
      {tool === "compress" && (
        <p className="text-xs text-muted">
          File size {delta <= 0 ? `went down ${deltaPct}%` : `went up ${deltaPct}%`}.{" "}
          {delta <= 0 ? "Nice, but not our department." : "Bonus bytes, free of charge."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[
          ["Before", outcome.before],
          ["After", outcome.after],
        ].map(([label, src]) => (
          <figure key={label} className="overflow-hidden rounded-xl border border-line bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${label} preview`} className="aspect-[3/4] w-full object-contain p-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
            <figcaption className="bg-panel px-2 py-1 text-center font-mono text-[10px] uppercase tracking-widest text-muted">{label}</figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => {
            sfx.click();
            downloadBytes(result.bytes, result.fileName);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 font-display text-base font-semibold text-black transition hover:bg-white"
        >
          <DownloadIcon width={18} height={18} /> Download PDF
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onAgain} className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink/85 transition hover:bg-white/5">
            Again, harder
          </button>
          <button onClick={onFresh} className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink/85 transition hover:bg-white/5">
            New file
          </button>
        </div>
      </div>
    </div>
  );
}
