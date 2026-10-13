"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp, type Tool } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { placeholderPage, renderPages } from "@/lib/render";
import {
  compressPdf,
  makeSamplePdf,
  mergePdf,
  randomAxis,
  splitPdf,
  type ToolResult,
} from "@/lib/pdf";
import type { RunSpec } from "./three/shared";
import { TOOLS } from "./Hero";
import Dropzone from "./Dropzone";
import ResultCard from "./ResultCard";
import { LockIcon } from "./Icons";

const Stage = dynamic(() => import("./three/Stage"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center font-mono text-xs uppercase tracking-widest text-muted">
      Warming up heavy machinery…
    </div>
  ),
});

const DURATIONS: Record<Tool, number> = { compress: 6.4, split: 5.6, merge: 5.4 };
const IDLE_PHASE: Record<Tool, string> = {
  compress: "Press idle. Hydraulics nominal.",
  split: "Laser armed. Awaiting victim.",
  merge: "Vortex on standby.",
};

type Status = "idle" | "running" | "done";

function placeholders(tool: Tool) {
  if (tool === "merge") return ["Invoice", "Contract", "Memo", "Report", "Resume"].map((t, i) => placeholderPage(i, t));
  return [placeholderPage(tool === "split" ? 1 : 0, tool === "split" ? "Contract" : "Quarterly Report")];
}

export interface Outcome {
  tool: Tool;
  result: ToolResult;
  axis: RunSpec["axis"];
  percent: number;
  fileCount: number;
  before: string;
  after: string;
}

export default function Workspace() {
  const { tool, setTool, pro, openPro, showToast } = useApp();
  const [files, setFiles] = useState<File[]>([]);
  const [rendered, setRendered] = useState<HTMLCanvasElement[]>([]);
  const [percent, setPercent] = useState(50);
  const [status, setStatus] = useState<Status>("idle");
  const [run, setRun] = useState<RunSpec | null>(null);
  const [phase, setPhase] = useState(IDLE_PHASE[tool]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const meterRef = useRef<HTMLSpanElement>(null);
  const animResolve = useRef<(() => void) | null>(null);

  // reset everything when the tool changes (tabs or hero cards)
  const [prevTool, setPrevTool] = useState(tool);
  if (prevTool !== tool) {
    setPrevTool(tool);
    setFiles([]);
    setRendered([]);
    setStatus("idle");
    setRun(null);
    setOutcome(null);
    setPhase(IDLE_PHASE[tool]);
  }

  // placeholder pages until the user brings their own
  const fallback = useMemo(() => (typeof document === "undefined" ? [] : placeholders(tool)), [tool]);
  const textures = files.length && rendered.length ? rendered : fallback;

  // render real pages as soon as files arrive
  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const per = tool === "merge" ? Math.max(1, Math.ceil(8 / files.length)) : 1;
        const all: HTMLCanvasElement[] = [];
        for (const f of files) {
          all.push(...(await renderPages(await f.arrayBuffer(), { maxPages: per, maxSize: 1024 })));
        }
        if (!cancelled) setRendered(all.slice(0, 8));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          showToast("That PDF fought back. We couldn't read it.");
          setFiles([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files, tool, showToast]);

  const switchTool = (t: Tool) => {
    if (status === "running" || t === tool) return;
    sfx.click();
    setTool(t);
  };

  const onDone = useCallback(() => animResolve.current?.(), []);

  const addFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length < incoming.length) showToast("PDFs only. We don't squish JPEGs (yet).");
    if (!pdfs.length) return;
    sfx.click();
    setOutcome(null);
    setStatus("idle");
    setRun(null);
    setPhase(IDLE_PHASE[tool]);
    setFiles((prev) => (tool === "merge" ? [...prev, ...pdfs].slice(0, 12) : [pdfs[0]]));
  };

  const loadSample = async () => {
    const samples =
      tool === "merge"
        ? await Promise.all([makeSamplePdf("invoice.pdf", 2), makeSamplePdf("contract.pdf", 2), makeSamplePdf("memo.pdf", 1)])
        : [await makeSamplePdf()];
    addFiles(samples);
  };

  const setPct = (v: number) => {
    if (v > 90 && !pro) {
      setPercent(90);
      openPro("Compression beyond 90% requires literally.pdf Pro. Our lawyers insisted.");
      return;
    }
    setPercent(v);
  };

  const start = async () => {
    if (status === "running") return;
    if (!files.length) {
      showToast("Upload a PDF first. We can't squish air.");
      sfx.sadTrombone();
      return;
    }
    if (tool === "merge" && files.length < 2) {
      showToast("Merging one file with itself is a philosophy problem. Add another PDF.");
      return;
    }
    const axis = randomAxis();
    const spec: RunSpec = { id: Date.now(), tool, factor: Math.max(0.03, 1 - percent / 100), axis };
    const animDone = new Promise<void>((res) => (animResolve.current = res));
    setOutcome(null);
    setStatus("running");
    setRun(spec);

    try {
      const job =
        tool === "compress" ? compressPdf(files[0], percent, axis) : tool === "split" ? splitPdf(files[0], axis) : mergePdf(files);
      const beforeJob = files[0].arrayBuffer().then((b) => renderPages(b, { maxPages: 1, maxSize: 900 }));
      const [result, , [beforeCanvas]] = await Promise.all([job, animDone, beforeJob]);
      const [afterCanvas] = await renderPages(result.bytes, { maxPages: 1, maxSize: 900 });
      setOutcome({
        tool,
        result,
        axis,
        percent,
        fileCount: files.length,
        before: beforeCanvas.toDataURL("image/jpeg", 0.85),
        after: afterCanvas.toDataURL("image/jpeg", 0.85),
      });
      setStatus("done");
      sfx.success();
    } catch (e) {
      console.error(e);
      sfx.sadTrombone();
      showToast("The machine jammed on that PDF. It might be encrypted or broken.");
      setStatus("idle");
      setRun(null);
      setPhase(IDLE_PHASE[tool]);
    }
  };

  const again = () => {
    sfx.click();
    setStatus("idle");
    setRun(null);
    setOutcome(null);
    setPhase(IDLE_PHASE[tool]);
  };

  const fresh = () => {
    again();
    setFiles([]);
  };

  const meta = TOOLS.find((t) => t.id === tool)!;
  const running = status === "running";

  return (
    <section id="tools" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">The workshop</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Pick your <span className="font-serif font-normal italic" style={{ color: meta.color }}>machine</span>.
          </h2>
        </div>
        {/* tool tabs */}
        <div className="glass relative flex rounded-full p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTool(t.id)}
              disabled={running}
              className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${
                tool === t.id ? "text-black" : "text-muted hover:text-ink"
              }`}
            >
              {tool === t.id && (
                <motion.span
                  layoutId="tool-pill"
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{ background: t.color }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <t.Icon width={16} height={16} />
              {t.name.replace(" PDF", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* ---------- control panel ---------- */}
        <div className="glass flex min-h-[520px] flex-col rounded-[28px] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {status === "done" && outcome ? (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
                <ResultCard outcome={outcome} onAgain={again} onFresh={fresh} />
              </motion.div>
            ) : (
              <motion.div
                key={`controls-${tool}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col gap-5"
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold">{meta.name}</h3>
                  <p className="mt-1 text-sm text-muted">{meta.blurb}</p>
                </div>

                <Dropzone
                  files={files}
                  multiple={tool === "merge"}
                  disabled={running}
                  accent={meta.color}
                  onFiles={addFiles}
                  onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))}
                  onSample={loadSample}
                />

                {tool === "compress" && <CompressOptions percent={percent} setPercent={setPct} disabled={running} pro={pro} />}
                {tool === "split" && <LockedOptions items={["Split into thirds", "Split into 1,000 pieces", "Split personality"]} lead="Cut direction" note="Vertical or horizontal, decided by a fair coin flip at the moment of cutting." />}
                {tool === "merge" && <LockedOptions items={["Merge into negative pages", "Merge with a stranger's PDF", "Un-merge"]} lead="Output" note="Every page of every file, fused onto a single page. Efficient." />}

                <div className="mt-auto">
                  <button
                    onClick={start}
                    disabled={running}
                    className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 font-display text-lg font-semibold text-black transition enabled:hover:brightness-110 disabled:opacity-70"
                    style={{ background: meta.color, boxShadow: `0 18px 50px -18px ${meta.color}` }}
                  >
                    <span className="relative z-10">
                      {running ? "Processing…" : tool === "compress" ? `Compress ${percent}%` : tool === "split" ? "Split PDF" : `Merge ${files.length || ""} PDFs`.replace("  ", " ")}
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-full" />
                  </button>
                  <p className="mt-3 text-center text-xs text-muted">Processed locally. No uploads, no accounts, no refunds.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------- 3D stage ---------- */}
        <div className="relative h-[460px] overflow-hidden rounded-[28px] border border-line bg-[#0c0d12] sm:h-[560px] lg:h-auto lg:min-h-[620px]">
          <Stage
            tool={tool}
            textures={textures}
            run={run}
            onDone={onDone}
            onPhase={setPhase}
            meterRef={meterRef}
          />

          {/* HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-2.5 rounded-full border border-white/10 bg-black/50 px-3.5 py-2 backdrop-blur-md">
              <span
                className={`size-2 shrink-0 rounded-full ${running ? "blink" : ""}`}
                style={{ background: running ? "#ff4d4d" : status === "done" ? "#2bff8a" : meta.color, boxShadow: `0 0 12px ${running ? "#ff4d4d" : meta.color}` }}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="truncate font-mono text-[11px] uppercase tracking-wider text-ink/90 sm:text-xs"
                >
                  {phase}
                </motion.span>
              </AnimatePresence>
            </div>
            <Gauge tool={tool} status={status} meterRef={meterRef} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
            {running && (
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  key={run?.id}
                  className="h-full rounded-full"
                  style={{ background: meta.color }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: DURATIONS[tool], ease: "linear" }}
                />
              </div>
            )}
            {status === "idle" && (
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/35">
                Move your cursor to look around · Machine is real · Probably
              </p>
            )}
          </div>

          <AnimatePresence>
            {status === "done" && outcome && (
              <motion.div
                initial={{ opacity: 0, scale: 2.2, rotate: -18 }}
                animate={{ opacity: 1, scale: 1, rotate: -9 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="pointer-events-none absolute bottom-8 right-6 rounded-xl border-4 px-4 py-2 font-display text-2xl font-bold uppercase tracking-wider sm:bottom-10 sm:right-10 sm:text-3xl"
                style={{ borderColor: meta.color, color: meta.color, textShadow: `0 0 24px ${meta.color}` }}
              >
                {tool === "compress" ? `Squished ${outcome.percent}%` : tool === "split" ? "Halved ✓" : "Fused ✓"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Gauge({ tool, status, meterRef }: { tool: Tool; status: Status; meterRef: React.RefObject<HTMLSpanElement | null> }) {
  const running = status === "running";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 px-3.5 py-2 text-right backdrop-blur-md">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
        {tool === "compress" ? "Pressure" : tool === "split" ? "Laser" : "Vortex"}
      </div>
      <div className="font-mono text-sm font-semibold tabular-nums text-ink">
        {tool === "compress" ? (
          <>
            <span ref={meterRef}>0</span> <span className="text-muted">PSI</span>
          </>
        ) : tool === "split" ? (
          running ? <span className="text-cyan">FIRING</span> : "ARMED"
        ) : running ? (
          <span className="text-violet">9,000 RPM</span>
        ) : (
          "IDLE"
        )}
      </div>
    </div>
  );
}

function CompressOptions({ percent, setPercent, disabled, pro }: { percent: number; setPercent: (v: number) => void; disabled: boolean; pro: boolean }) {
  const label =
    percent >= 100 ? "Total flatness" : percent > 85 ? "Extreme" : percent > 60 ? "Strong" : percent >= 40 ? "Recommended" : "Gentle squeeze";
  return (
    <div className="rounded-2xl border border-line bg-black/20 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Compression level</p>
          <p className="mt-1 text-sm text-ink/80">{label}</p>
        </div>
        <motion.span key={percent} initial={{ scaleY: 0.6 }} animate={{ scaleY: 1 }} className="origin-bottom font-display text-5xl font-semibold tabular-nums text-amber">
          {percent}
          <span className="text-2xl">%</span>
        </motion.span>
      </div>
      <input
        type="range"
        min={10}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        onChange={(e) => setPercent(Number(e.target.value))}
        className="squish mt-4"
        style={{ ["--fill" as string]: `${((percent - 10) / 90) * 100}%` }}
        aria-label="Compression percentage"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[25, 50, 75, 90, 100].map((v) => (
          <button
            key={v}
            disabled={disabled}
            onClick={() => {
              sfx.click();
              setPercent(v);
            }}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
              percent === v ? "border-amber bg-amber/15 text-amber" : "border-line text-muted hover:text-ink"
            }`}
          >
            {v === 100 && !pro && <LockIcon width={11} height={11} />}
            {v}%
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Your content gets {percent}% thinner. Direction (vertical or horizontal) is picked by our AI. The AI is a coin.
      </p>
    </div>
  );
}

function LockedOptions({ lead, note, items }: { lead: string; note: string; items: string[] }) {
  const openPro = useApp((s) => s.openPro);
  return (
    <div className="rounded-2xl border border-line bg-black/20 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{lead}</p>
      <p className="mt-1.5 text-sm text-ink/85">{note}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={it}
            onClick={() => {
              sfx.click();
              openPro(`“${it}” is a Pro feature. It is also not a real feature.`);
            }}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-white/20 hover:text-ink"
          >
            <LockIcon width={11} height={11} /> {it}
          </button>
        ))}
      </div>
    </div>
  );
}
