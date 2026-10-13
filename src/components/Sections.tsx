"use client";

import { motion } from "motion/react";
import { useApp } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { FAQ } from "@/lib/site";
import { CheckIcon, Logo } from "./Icons";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{children}</p>;
}

/* ---------------- logos ---------------- */
export function LogoStrip() {
  const names = ["Flatland Co.", "Halfsies", "Squishr", "OnePage Inc.", "Lorem Labs", "Thinly Ltd.", "Compact Group", "Paper Cuts LLC"];
  return (
    <div className="border-y border-line/70 py-6">
      <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        Trusted by teams who did not read the description
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
        <div className="marquee flex w-max gap-14 pr-14">
          {[...names, ...names].map((n, i) => (
            <span key={i} className="whitespace-nowrap font-display text-xl font-semibold text-white/30">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- how it works ---------------- */
export function HowItWorks() {
  const steps = [
    ["01", "Upload", "Drop a PDF into the machine. It is processed entirely in your browser, so nobody can stop us."],
    ["02", "Industrial process", "A 40-ton hydraulic press, a ±0.0001 mm laser or a 9,000 RPM fusion vortex does exactly what you asked."],
    ["03", "Download the consequences", "Get a real, valid PDF. Content: squished, halved or fused. As promised. In writing."],
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div {...fade} className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Other tools speak in <span className="font-serif font-normal italic text-muted">metaphors</span>. We don&apos;t.
        </h2>
      </motion.div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map(([n, t, d], i) => (
          <motion.div key={n} {...fade} transition={{ ...fade.transition, delay: i * 0.1 }} className="glass relative overflow-hidden rounded-3xl p-6">
            <span className="font-display text-6xl font-semibold text-white/[0.06]">{n}</span>
            <h3 className="mt-2 font-display text-xl font-semibold">{t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- testimonials ---------------- */
export function Testimonials() {
  const quotes = [
    ["My 40-page contract is now 40 pages of very confident horizontal lines. Legally binding? Probably.", "Dana K.", "Paralegal"],
    ["I asked it to split my thesis. It split my thesis. I respect that.", "Marco P.", "PhD candidate, formerly"],
    ["Merged 300 invoices into one page. Accounting has stopped calling me.", "Priya S.", "Freelancer"],
    ["The hydraulic press sound is the only thing that calms me down now.", "Tom W.", "Project manager"],
    ["Compression: 90%. File size: up 4%. Content: gone. Five stars.", "Lena R.", "Product designer"],
    ["Finally a tool that doesn't lie to me.", "Anonymous", "Every user"],
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <motion.div {...fade}>
        <Eyebrow>Wall of love</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          4.9<span className="text-amber">★</span> from people who skimmed.
        </h2>
      </motion.div>
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {quotes.map(([q, n, r], i) => (
          <motion.figure key={n + i} {...fade} transition={{ ...fade.transition, delay: (i % 3) * 0.08 }} className="glass mb-4 break-inside-avoid rounded-3xl p-6">
            <blockquote className="text-pretty text-[15px] leading-relaxed text-ink/90">“{q}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-white/[0.06] font-display text-sm font-semibold">{n[0]}</span>
              <span>
                <span className="block text-sm font-medium">{n}</span>
                <span className="block text-xs text-muted">{r}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */
export function Pricing() {
  const { openPro, showToast, pro } = useApp();
  const tiers = [
    {
      name: "Free",
      price: "$0",
      per: "forever",
      blurb: "For individuals with documents they don't need.",
      cta: "Current plan",
      features: ["Compress up to 90%", "Split in half (both halves included)", "Merge into one page", "100% local processing", "Unlimited regret"],
      onClick: () => showToast("You're already on Free. It doesn't get freer than this."),
    },
    {
      name: "Pro",
      price: "$9.99",
      per: "/ month",
      blurb: "For professionals who want their PDFs truly flat.",
      cta: pro ? "You're Pro ✓" : "Upgrade to Pro",
      highlight: true,
      features: ["Compress up to 100% (true flatness)", "Priority crushing queue (there is no queue)", "Laser in Premium Cyan™", "Emotional-support hydraulic press", "Everything in Free, but smugger"],
      onClick: () => openPro(),
    },
    {
      name: "Enterprise",
      price: "Custom",
      per: "",
      blurb: "For organisations that need to squish at scale.",
      cta: "Contact sales",
      features: ["On-prem hydraulic press (shipping not included)", "SSO: Squish Sign-On", "SLA: 99.99% flatness", "Dedicated split-in-half manager", "Annual pressure audit"],
      onClick: () => showToast("Our sales team has been compressed. Please try again never."),
    },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div {...fade} className="mx-auto max-w-2xl text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple, <span className="font-serif font-normal italic text-amber">compressed</span> pricing.
        </h2>
        <p className="mt-4 text-muted">No hidden fees. All our fees are clearly visible and also fake.</p>
      </motion.div>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            {...fade}
            transition={{ ...fade.transition, delay: i * 0.08 }}
            className={`relative flex flex-col rounded-3xl p-7 ${t.highlight ? "border border-amber/50 bg-gradient-to-b from-amber/[0.12] to-transparent" : "glass"}`}
          >
            {t.highlight && (
              <span className="absolute -top-3 left-7 rounded-full bg-amber px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-black">
                Most squished
              </span>
            )}
            <h3 className="font-display text-xl font-semibold">{t.name}</h3>
            <p className="mt-1 text-sm text-muted">{t.blurb}</p>
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-5xl font-semibold tracking-tight">{t.price}</span>
              <span className="text-sm text-muted">{t.per}</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <CheckIcon width={18} height={18} className={t.highlight ? "shrink-0 text-amber" : "shrink-0 text-muted"} />
                  <span className="text-ink/85">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                sfx.click();
                t.onClick();
              }}
              className={`mt-8 rounded-2xl px-5 py-3.5 text-sm font-semibold transition ${
                t.highlight ? "bg-amber text-black hover:brightness-110" : "border border-line text-ink hover:bg-white/5"
              }`}
            >
              {t.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */
export function Faq() {
  const items = FAQ;
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div {...fade} className="text-center">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Frequently asked complaints</h2>
      </motion.div>
      <div className="mt-10 divide-y divide-line rounded-3xl border border-line bg-white/[0.02]">
        {items.map(([q, a]) => (
          <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium" onClick={() => sfx.click()}>
              {q}
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */
export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="hazard h-1.5 opacity-80" />
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display font-semibold">
            literally<span className="text-amber">.pdf</span>
          </span>
        </div>
        <p className="max-w-md text-sm text-muted">
          © 2026 literally.pdf. Not affiliated with any PDF company that does things figuratively. No PDFs were harmed. Several were flattened.
        </p>
      </div>
    </footer>
  );
}
