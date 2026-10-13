import { PDFDocument, degrees, type PDFPage } from "pdf-lib";

export type Axis = "vertical" | "horizontal";

export interface ToolResult {
  bytes: Uint8Array;
  fileName: string;
  inputSize: number;
  outputSize: number;
  pagesIn: number;
  pagesOut: number;
}

export const randomAxis = (): Axis => (Math.random() < 0.5 ? "vertical" : "horizontal");

async function load(file: File) {
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  return { doc, size: buf.byteLength };
}

function box(page: PDFPage) {
  const mb = page.getMediaBox();
  return { x: mb.x, y: mb.y, w: mb.width, h: mb.height };
}

const baseName = (name: string) => name.replace(/\.pdf$/i, "");

async function finish(out: PDFDocument) {
  out.setProducer("literally.pdf — tools that do exactly what they say");
  out.setCreator("literally.pdf");
  return out.save({ useObjectStreams: true });
}

/**
 * "Compress": the whole page (paper and content) gets crushed along one axis
 * by `percent`, exactly like it came out of the hydraulic press.
 */
export async function compressPdf(file: File, percent: number, axis: Axis): Promise<ToolResult> {
  const { doc, size } = await load(file);
  const out = await PDFDocument.create();
  const factor = Math.max(0.005, 1 - percent / 100);
  const pages = doc.getPages();
  const embedded = await out.embedPages(pages);

  // PDF viewers reject pages smaller than 3pt, so a 100% squish still leaves a sliver
  const MIN_PT = 3;
  pages.forEach((page, i) => {
    const { w, h } = box(page);
    const pw = axis === "horizontal" ? Math.max(MIN_PT, w * factor) : w;
    const ph = axis === "vertical" ? Math.max(MIN_PT, h * factor) : h;
    out.addPage([pw, ph]).drawPage(embedded[i], { x: 0, y: 0, width: pw, height: ph });
  });

  const bytes = await finish(out);
  return {
    bytes,
    fileName: `${baseName(file.name)}-compressed-${percent}pct.pdf`,
    inputSize: size,
    outputSize: bytes.byteLength,
    pagesIn: pages.length,
    pagesOut: pages.length,
  };
}

/**
 * "Split": every page is cut in half. Vertical cut = left/right halves,
 * horizontal cut = top/bottom halves.
 */
export async function splitPdf(file: File, axis: Axis): Promise<ToolResult> {
  const { doc, size } = await load(file);
  const out = await PDFDocument.create();
  const pages = doc.getPages();

  for (const page of pages) {
    const { x, y, w, h } = box(page);
    const halves =
      axis === "vertical"
        ? [
            { left: x, bottom: y, right: x + w / 2, top: y + h },
            { left: x + w / 2, bottom: y, right: x + w, top: y + h },
          ]
        : [
            { left: x, bottom: y + h / 2, right: x + w, top: y + h },
            { left: x, bottom: y, right: x + w, top: y + h / 2 },
          ];
    for (const bb of halves) {
      const emb = await out.embedPage(page, bb);
      const pw = bb.right - bb.left;
      const ph = bb.top - bb.bottom;
      out.addPage([pw, ph]).drawPage(emb, { x: 0, y: 0, width: pw, height: ph });
    }
  }

  const bytes = await finish(out);
  return {
    bytes,
    fileName: `${baseName(file.name)}-split.pdf`,
    inputSize: size,
    outputSize: bytes.byteLength,
    pagesIn: pages.length,
    pagesOut: pages.length * 2,
  };
}

export const MERGE_PAGE_LIMIT = 60;

/**
 * "Merge": every page of every file is fused onto a single page, stacked on top
 * of each other with a little chaos.
 */
export async function mergePdf(files: File[]): Promise<ToolResult> {
  const out = await PDFDocument.create();
  let inputSize = 0;
  const allPages: PDFPage[] = [];

  for (const f of files) {
    const { doc, size } = await load(f);
    inputSize += size;
    allPages.push(...doc.getPages());
  }
  const pages = allPages.slice(0, MERGE_PAGE_LIMIT);
  const first = box(pages[0]);
  const W = first.w;
  const H = first.h;
  const canvas = out.addPage([W, H]);
  // pages come from different source documents, so embed them one by one
  const embedded = [];
  for (const pg of pages) embedded.push(await out.embedPage(pg));
  const opacity = Math.max(0.12, Math.min(1, 1.4 / pages.length));

  embedded.forEach((emb, i) => {
    const scale = Math.min(W / emb.width, H / emb.height);
    const w = emb.width * scale;
    const h = emb.height * scale;
    const theta = i === 0 ? 0 : (Math.random() - 0.5) * 8; // degrees
    const r = (theta * Math.PI) / 180;
    // rotate around the page centre
    const cx = W / 2 + (i === 0 ? 0 : (Math.random() - 0.5) * W * 0.04);
    const cy = H / 2 + (i === 0 ? 0 : (Math.random() - 0.5) * H * 0.04);
    const ox = cx - (Math.cos(r) * w) / 2 + (Math.sin(r) * h) / 2;
    const oy = cy - (Math.sin(r) * w) / 2 - (Math.cos(r) * h) / 2;
    canvas.drawPage(emb, { x: ox, y: oy, width: w, height: h, rotate: degrees(theta), opacity: i === 0 ? Math.max(opacity, 0.5) : opacity });
  });

  const bytes = await finish(out);
  return {
    bytes,
    fileName: `merged-${files.length}-files.pdf`,
    inputSize,
    outputSize: bytes.byteLength,
    pagesIn: allPages.length,
    pagesOut: 1,
  };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** A small sample document, for people who came to squish but brought nothing. */
export async function makeSamplePdf(name = "sample-report.pdf", pages = 3): Promise<File> {
  const { StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const accents = [rgb(1, 0.42, 0.1), rgb(0.18, 0.42, 1), rgb(0.08, 0.7, 0.49)];
  const titles = ["Quarterly Report", "Very Important Memo", "Terms & Conditions"];
  const lorem =
    "This document contains extremely important information that must not be squished, split, or merged under any circumstances whatsoever.";

  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]);
    const accent = accents[p % accents.length];
    page.drawRectangle({ x: 50, y: 770, width: 48, height: 8, color: accent });
    page.drawText(titles[p % titles.length], { x: 50, y: 730, size: 30, font: bold, color: rgb(0.08, 0.08, 0.12) });
    page.drawText(`Page ${p + 1} of ${pages}  ·  CONFIDENTIAL`, { x: 50, y: 705, size: 10, font: reg, color: rgb(0.5, 0.5, 0.56) });
    let y = 660;
    for (let para = 0; para < 3; para++) {
      const words = lorem.split(" ");
      let line = "";
      for (const w of words) {
        if (reg.widthOfTextAtSize(line + w, 12) > 495) {
          page.drawText(line, { x: 50, y, size: 12, font: reg, color: rgb(0.2, 0.2, 0.25) });
          y -= 18;
          line = "";
        }
        line += w + " ";
      }
      page.drawText(line, { x: 50, y, size: 12, font: reg, color: rgb(0.2, 0.2, 0.25) });
      y -= 34;
      if (para === 0) {
        const vals = [60, 110, 80, 150, 125, 190, 170];
        vals.forEach((v, i) =>
          page.drawRectangle({ x: 50 + i * 68, y: y - 200 + (200 - v), width: 44, height: v, color: i === 5 ? accent : rgb(0.88, 0.88, 0.92) }),
        );
        y -= 236;
      }
    }
    page.drawText("Signature: ______________________", { x: 50, y: 90, size: 12, font: reg, color: rgb(0.2, 0.2, 0.25) });
  }
  const bytes = await doc.save();
  return new File([bytes as BlobPart], name, { type: "application/pdf" });
}
