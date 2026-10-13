"use client";

import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store";

export default function Toast() {
  const toast = useApp((s) => s.toast);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="max-w-md rounded-2xl border border-white/10 bg-panel-2/95 px-5 py-3 text-center text-sm shadow-2xl backdrop-blur"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
