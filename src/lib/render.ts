"use client";

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

function pdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

/** Render pages of a PDF to canvases (white background), long side ~`maxSize` px. */
export async function renderPages(
  data: ArrayBuffer | Uint8Array,
  { maxPages = 1, maxSize = 1024, scale: fixedScale }: { maxPages?: number; maxSize?: number; scale?: number } = {},
): Promise<HTMLCanvasElement[]> {
  const lib = await pdfjs();
  // pdf.js transfers the buffer to the worker, so hand it a copy
  const copy = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0));
  const task = lib.getDocument({ data: copy });
  const doc = await task.promise;
  const out: HTMLCanvasElement[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = fixedScale ?? maxSize / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    canvas.dataset.scale = String(scale);
    out.push(canvas);
  }
  await task.destroy();
  return out;
}

/**
 * Place `page` on a transparent canvas the size of `frame`, so before/after
 * previews share one scale. Anchored like the output: bottom-left for compress,
 * top-left for split.
 */
export function onFrame(page: HTMLCanvasElement, frame: HTMLCanvasElement, anchor: "bottom-left" | "top-left") {
  const c = document.createElement("canvas");
  c.width = Math.max(frame.width, page.width);
  c.height = Math.max(frame.height, page.height);
  const y = anchor === "bottom-left" ? c.height - page.height : 0;
  c.getContext("2d")!.drawImage(page, 0, y);
  return c;
}

/** A believable fake document used as the idle placeholder in the 3D stage. */
export function placeholderPage(seed = 0, title = "Quarterly Report"): HTMLCanvasElement {
  const W = 724;
  const H = 1024;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  g.fillStyle = "#fbfaf7";
  g.fillRect(0, 0, W, H);
  const accents = ["#ff6a1a", "#2f6bff", "#14b37d", "#e0388c", "#7a5cff"];
  const accent = accents[seed % accents.length];
  g.fillStyle = accent;
  g.fillRect(60, 64, 64, 10);
  g.fillStyle = "#16161d";
  g.font = "700 46px ui-sans-serif, system-ui, sans-serif";
  g.fillText(title, 60, 140);
  g.fillStyle = "#8a8a95";
  g.font = "400 20px ui-sans-serif, system-ui, sans-serif";
  g.fillText("CONFIDENTIAL · DO NOT SQUISH", 60, 178);

  let y = 240;
  for (let p = 0; p < 3; p++) {
    for (let l = 0; l < 5; l++) {
      const w = l === 4 ? 200 + rnd() * 200 : 560 + rnd() * 44;
      g.fillStyle = "#c9c9d1";
      g.fillRect(60, y, w, 12);
      y += 28;
    }
    y += 20;
    if (p === 0) {
      // bar chart
      const bars = 7;
      for (let b = 0; b < bars; b++) {
        const bh = 40 + rnd() * 140;
        g.fillStyle = b === 4 ? accent : "#e3e3ea";
        g.fillRect(60 + b * 84, y + 180 - bh, 56, bh);
      }
      y += 220;
    }
  }
  g.fillStyle = "#b0b0ba";
  g.font = "400 16px ui-sans-serif, system-ui, sans-serif";
  g.fillText(`page ${seed + 1}`, W - 120, H - 40);
  return c;
}
