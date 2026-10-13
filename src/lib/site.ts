/** Single source of truth for SEO metadata, structured data and visible FAQ copy. */

/**
 * Public base URL. Explicit `NEXT_PUBLIC_SITE_URL` wins; on Vercel we fall back to
 * the production domain (or the deployment URL for previews), then localhost.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelDeploy = process.env.VERCEL_URL;
  const url =
    explicit ||
    (process.env.VERCEL_ENV === "production" && vercelProd ? `https://${vercelProd}` : "") ||
    (vercelDeploy ? `https://${vercelDeploy}` : "") ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export const SITE_URL = resolveSiteUrl();

/** Only the production deployment should be indexed; Vercel previews stay out of search. */
export const INDEXABLE = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

export const SITE = {
  name: "literally.pdf",
  title: "literally.pdf: Compress, Split & Merge PDF Online, Literally",
  shortTitle: "literally.pdf",
  description:
    "Free in-browser PDF tools that take your request literally: a 3D hydraulic press compresses your content, a laser splits every page in half, and merge fuses all pages into one.",
  tagline: "PDF tools that do exactly what they say.",
  keywords: [
    "compress pdf",
    "split pdf",
    "merge pdf",
    "pdf tools",
    "online pdf compressor",
    "free pdf tools",
    "pdf joke",
    "funny pdf tool",
    "hydraulic press pdf",
    "browser pdf editor",
  ],
  themeColor: "#0a0b0f",
};

export const FAQ: [question: string, answer: string][] = [
  ["Is my PDF actually compressed?", "Yes. Literally. Every page, paper and content, is physically squeezed by the percentage you choose. File size is a different department, and that department is closed."],
  ["Why does my split PDF have twice as many pages?", "Because every page was split in half. You asked us to split it. We are a company of our word."],
  ["Merge put all my pages on one page.", "Correct. That's what merging means. Look it up."],
  ["Is the direction really random?", "Our proprietary AI decides between vertical and horizontal. The AI is Math.random(). It has never been wrong."],
  ["Are my files uploaded anywhere?", "No. Everything happens in your browser. We couldn't steal your documents even if we wanted to, and honestly, after seeing what we do to them, would you want us to?"],
  ["Can I get a refund?", "You paid nothing. We will happily refund all of it."],
];
