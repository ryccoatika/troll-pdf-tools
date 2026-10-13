import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Workspace from "@/components/Workspace";
import ProModal from "@/components/ProModal";
import Toast from "@/components/Toast";
import { FAQ, SITE, SITE_URL } from "@/lib/site";
import { Faq, Footer, HowItWorks, LogoStrip, Pricing, Testimonials } from "@/components/Sections";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE.name,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE.name,
      url: `${SITE_URL}/`,
      description: SITE.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and WebGL",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Compress PDF: hydraulic-press content compression from 10% to 90%",
        "Split PDF: every page cut in half, vertically or horizontally",
        "Merge PDF: all pages of all files fused onto a single page",
        "100% in-browser processing, no uploads",
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="backdrop" />
      <Header />
      <main className="flex-1">
        <Hero />
        <LogoStrip />
        <Workspace />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
      </main>
      <Footer />
      <ProModal />
      <Toast />
    </>
  );
}
