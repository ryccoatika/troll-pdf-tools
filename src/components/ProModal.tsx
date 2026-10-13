"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { CheckIcon, CloseIcon, SparkIcon } from "./Icons";

type Step = "pitch" | "paying" | "declined";

const PAYING_LINES = ["Contacting your bank…", "Your bank is laughing…", "Applying hydraulic pressure to your wallet…", "Wallet too thin…"];

export default function ProModal() {
  const { proOpen, closePro, proReason, unlockPro, pro } = useApp();
  const [step, setStep] = useState<Step>("pitch");
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (step !== "paying") return;
    const iv = setInterval(() => setLine((l) => l + 1), 700);
    const to = setTimeout(() => {
      setStep("declined");
      sfx.sadTrombone();
    }, 700 * PAYING_LINES.length);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [step]);

  const close = () => {
    closePro();
    setTimeout(() => setStep("pitch"), 300);
  };

  useEffect(() => {
    if (!proOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proOpen]);

  return (
    <AnimatePresence>
      {proOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="literally.pdf Pro"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber/30 bg-panel shadow-2xl"
          >
            <div className="hazard h-2" />
            <button onClick={close} aria-label="Close" className="absolute right-4 top-6 grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/5 hover:text-ink">
              <CloseIcon width={18} height={18} />
            </button>
            <div className="p-7">
              {pro && step === "pitch" ? (
                <div className="text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber/15 text-amber">
                    <CheckIcon width={28} height={28} />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold">You&apos;re already Pro</h3>
                  <p className="mt-2 text-sm text-muted">You have unlocked 100% compression. Use this power irresponsibly.</p>
                  <button onClick={close} className="mt-6 w-full rounded-2xl bg-amber py-3.5 font-semibold text-black">
                    Back to squishing
                  </button>
                </div>
              ) : step === "pitch" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                    <SparkIcon width={12} height={12} /> literally.pdf Pro
                  </span>
                  <h3 className="mt-4 font-display text-3xl font-semibold leading-tight">Unlock true flatness.</h3>
                  {proReason && <p className="mt-3 rounded-xl border border-line bg-black/20 px-3 py-2 text-sm text-ink/80">{proReason}</p>}
                  <ul className="mt-5 space-y-2.5 text-sm">
                    {["Compress up to 100%. Your PDF becomes a line.", "Priority crushing queue (there is no queue)", "Laser in Premium Cyan™", "A certificate of flatness (not included)"].map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <CheckIcon width={18} height={18} className="shrink-0 text-amber" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-semibold">$9.99</span>
                    <span className="text-sm text-muted line-through">$99.99</span>
                    <span className="text-sm text-muted">/ month, billed eternally</span>
                  </div>
                  <button
                    onClick={() => {
                      sfx.click();
                      setLine(0);
                      setStep("paying");
                    }}
                    className="mt-5 w-full rounded-2xl bg-amber py-3.5 font-display text-lg font-semibold text-black transition hover:brightness-110"
                  >
                    Upgrade now
                  </button>
                  <button onClick={close} className="mt-2 w-full py-2 text-xs text-muted hover:text-ink">
                    No thanks, I like my PDFs only 90% flat
                  </button>
                </>
              ) : step === "paying" ? (
                <div className="py-8 text-center">
                  <motion.div
                    className="mx-auto h-16 w-24 rounded-lg bg-gradient-to-br from-amber to-orange-600"
                    animate={{ scaleY: [1, 0.25, 1], scaleX: [1, 1.2, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  />
                  <AnimatePresence mode="wait">
                    <motion.p key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 font-mono text-sm text-muted">
                      {PAYING_LINES[Math.min(line, PAYING_LINES.length - 1)]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger/15 text-2xl">💸</div>
                  <h3 className="mt-4 font-display text-2xl font-semibold">Payment declined. Successfully.</h3>
                  <p className="mt-2 text-sm text-muted">
                    We couldn&apos;t charge you because we never asked for your card. Pro is unlocked anyway. Please don&apos;t tell finance.
                  </p>
                  <button
                    onClick={() => {
                      unlockPro();
                      sfx.success();
                      close();
                    }}
                    className="mt-6 w-full rounded-2xl bg-amber py-3.5 font-semibold text-black transition hover:brightness-110"
                  >
                    Claim my free Pro
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
