/**
 * Gelato — flavour catalogue
 * Inspired by the editorial product-grid rhythm in the provided reference.
 */
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";
import { filterFlavours, filters, type Filter, type Flavour } from "@/lib/gelatoCatalog";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp";

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55 },
};

export default function Gelato() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const visibleFlavours = useMemo(() => filterFlavours(activeFilter), [activeFilter]);

  const classicFlavours = visibleFlavours.filter((flavour) => flavour.section === "Gelato");
  const veganFlavours = visibleFlavours.filter(
    (flavour) => flavour.section === "Vegan Gelato & Sorbet",
  );

  return (
    <PageLayout
      heroImage={usePageImage("gelato", "hero", DEFAULT_HERO)}
      heroTitle="Gelato"
      heroSubtitle="Churned daily, served beautifully"
    >
      <section className="px-6 pb-8 pt-16 md:px-10 md:pb-12 md:pt-24">
        <motion.div {...fade} className="mx-auto max-w-3xl text-center">
          <div className="editorial-rule mx-auto mb-8" />
          <p
            className="text-base md:text-lg"
            style={{
              fontFamily: "var(--font-body)",
              lineHeight: 1.75,
              color: "oklch(0.34 0.05 45 / 0.8)",
            }}
          >
            A daily rotation of slow-churned flavours, made with a little drama and
            served at the perfect temperature. Browse by dietary preference, then
            find your flavour by image, name and starting price.
          </p>
        </motion.div>
      </section>

      <nav
        aria-label="Filter gelato flavours by dietary preference"
        className="sticky top-0 z-20 overflow-x-auto border-y px-4 md:px-8"
        style={{
          backgroundColor: "oklch(0.96 0.025 82 / 0.96)",
          borderColor: "oklch(0.34 0.05 45 / 0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex min-w-max items-center justify-center gap-7 py-4 md:gap-12 md:py-5">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.label;
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter.label)}
                className="relative whitespace-nowrap text-[12px] uppercase tracking-[0.08em] transition-opacity duration-200 hover:opacity-60 md:text-[13px]"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "oklch(0.34 0.05 45)",
                  opacity: isActive ? 1 : 0.72,
                }}
              >
                {filter.label}
                {filter.helper && <sup className="ml-0.5 text-[9px]">{filter.helper}</sup>}
                <span
                  className="absolute -bottom-2 left-0 h-px w-full origin-left transition-transform duration-200"
                  style={{
                    backgroundColor: "oklch(0.34 0.05 45)",
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <section className="px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-9 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 block text-[11px] uppercase tracking-[0.18em] text-brand-cocoa/70">
                {activeFilter === "All" ? "The flavour cabinet" : `${activeFilter} selection`}
              </span>
              <h2 className="text-4xl md:text-5xl">{activeFilter === "All" ? "All flavours" : activeFilter}</h2>
            </div>
            <p className="max-w-sm text-sm text-brand-brown/65 md:text-right">
              {visibleFlavours.length} flavours · from $7.40 AUD
            </p>
          </div>

          {classicFlavours.length > 0 && (
            <FlavourGrid title="Gelato" subtitle="Creamy, slow-churned classics" flavours={classicFlavours} />
          )}

          {veganFlavours.length > 0 && (
            <div className={classicFlavours.length > 0 ? "mt-16 md:mt-24" : ""}>
              <FlavourGrid
                title="Vegan gelato & sorbet"
                subtitle="100% plant-based · no dairy"
                flavours={veganFlavours}
                vegan
              />
            </div>
          )}

          {visibleFlavours.length === 0 && (
            <div className="border-y border-brand-brown/20 py-20 text-center">
              <p className="font-display text-2xl">No flavours in this filter yet.</p>
              <p className="mt-3 text-sm text-brand-brown/65">
                Ask our team in-store for the latest ingredient information.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className="px-6 py-16 md:px-10 md:py-24"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <motion.div {...fade} className="mx-auto max-w-3xl text-center">
          <span className="mb-7 block text-[11px] uppercase tracking-[0.18em] text-brand-cocoa/70">
            Dietary notes
          </span>
          <p className="font-display text-xl leading-relaxed text-brand-brown md:text-2xl">
            Vegan means 100% plant-based. Other labels are a guide to the current
            recipe; please speak with our team about allergies and cross-contact
            before ordering.
          </p>
          <div className="editorial-rule mx-auto mt-8" />
        </motion.div>
      </section>
    </PageLayout>
  );
}

function FlavourGrid({
  title,
  subtitle,
  flavours: items,
  vegan = false,
}: {
  title: string;
  subtitle: string;
  flavours: Flavour[];
  vegan?: boolean;
}) {
  return (
    <section aria-labelledby={`${title.replace(/\s+/g, "-")}-heading`}>
      <div className="mb-5 flex flex-col gap-2 border-b border-brand-brown/25 pb-4 md:mb-6 md:flex-row md:items-baseline md:justify-between">
        <div className="flex items-baseline gap-3">
          <h3 id={`${title.replace(/\s+/g, "-")}-heading`} className="text-2xl md:text-3xl">
            {title}
          </h3>
          {vegan && (
            <span className="rounded-full border border-emerald-800/30 bg-emerald-900/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-900">
              Vegan
            </span>
          )}
        </div>
        <span className="text-xs uppercase tracking-[0.12em] text-brand-cocoa/65">{subtitle}</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-brand-brown/25 md:grid-cols-3 xl:grid-cols-4">
        {items.map((flavour) => (
          <article key={flavour.name} className="group bg-parchment">
            <div className="relative aspect-[3/4] overflow-hidden bg-linen">
              <img
                src={flavour.image}
                alt={`${flavour.name} gelato or sorbet`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {flavour.note && (
                  <span className="bg-parchment/95 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-brand-brown">
                    {flavour.note}
                  </span>
                )}
                {flavour.tags.includes("Vegan") && (
                  <span className="bg-emerald-900/90 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-white">
                    Vegan
                  </span>
                )}
              </div>
            </div>
            <div className="min-h-[142px] p-4 md:min-h-[158px] md:p-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="max-w-[11rem] text-lg leading-tight md:text-xl">{flavour.name}</h4>
                <p className="max-w-[5.5rem] shrink-0 text-right text-[11px] uppercase leading-tight tracking-[0.08em] text-brand-brown/80">
                  {flavour.price}
                </p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-brand-brown/65 md:text-sm">{flavour.description}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.08em] text-brand-cocoa/70">{flavour.contains}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
