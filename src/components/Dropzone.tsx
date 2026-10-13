"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatBytes } from "@/lib/pdf";
import { CloseIcon, FileIcon, UploadIcon } from "./Icons";

interface Props {
  files: File[];
  multiple: boolean;
  disabled: boolean;
  accent: string;
  onFiles: (f: File[]) => void;
  onRemove: (i: number) => void;
  onSample: () => void;
}

export default function Dropzone({ files, multiple, disabled, accent, onFiles, onRemove, onSample }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const showDrop = multiple || files.length === 0;

  return (
    <div className="flex flex-col gap-2.5">
      {showDrop && (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={disabled}
          onClick={() => !disabled && input.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (!disabled) onFiles(Array.from(e.dataTransfer.files));
          }}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-4 text-center transition ${
            files.length ? "py-4" : "py-8"
          } ${over ? "bg-white/[0.06]" : "border-white/12 bg-black/20 hover:bg-white/[0.04]"}`}
          style={over ? { borderColor: accent } : undefined}
        >
          <motion.div animate={over ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="mx-auto grid size-11 place-items-center rounded-2xl" style={{ background: `${accent}22`, color: accent }}>
            <UploadIcon width={20} height={20} />
          </motion.div>
          <p className="mt-3 text-sm font-medium">
            {files.length ? "Add more PDFs" : `Drop your PDF${multiple ? "s" : ""} here`}
          </p>
          {!files.length && <p className="mt-1 text-xs text-muted">or click to browse. Max sanity: not enforced.</p>}
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            multiple={multiple}
            hidden
            onChange={(e) => {
              onFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {files.map((f, i) => (
          <motion.div
            key={`${f.name}-${i}-${f.size}`}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-danger/15 text-danger">
                <FileIcon width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted">{formatBytes(f.size)}</p>
              </div>
              <button
                onClick={() => onRemove(i)}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
                className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-40"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <button onClick={onSample} disabled={disabled} className="text-xs text-muted underline decoration-dotted underline-offset-4 transition hover:text-ink">
          No PDF handy? Use a sample{multiple ? " set" : ""}
        </button>
      )}
    </div>
  );
}
