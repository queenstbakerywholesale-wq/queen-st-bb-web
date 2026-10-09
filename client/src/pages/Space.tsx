/**
 * Space / Locations — three-branch editorial directory for Queen St BB.
 * The visual language stays quiet and premium while making each location easy to compare.
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp";
const CBD_BRANCH_IMAGE = "/manus-storage/IMG_24732_d4c47399.webp";
const HAWTHORN_BRANCH_IMAGE = "/manus-storage/IMG_3274_2f51a630.webp";

const branches = [
  {
    number: "01",
    name: "CBD",
    eyebrow: "The city atelier",
    address: "408 Queen St, Melbourne VIC 3000",
    description:
      "Our Queen Street flagship — a central Melbourne stop for slow afternoons, after-work dessert rituals, and the full Queen St BB collection.",
    features: ["Flagship location", "Tiramisu & gelato", "Central Melbourne"],
    image: CBD_BRANCH_IMAGE,
    imageAlt: "Queen St BB dessert atelier atmosphere in Melbourne CBD",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=408+Queen+St+Melbourne+VIC+3000",
    status: "Open daily · 2:00 PM — 11:00 PM",
    tone: "dark",
  },
  {
    number: "02",
    name: "Hawthorn",
    eyebrow: "The neighbourhood room",
    address: "616 Glenferrie Rd, Hawthorn VIC 3122",
    description:
      "A softer, neighbourhood expression of Queen St BB — made for focused study, relaxed work meetings, families, and lingering over something sweet.",
    features: ["Study & work meetings", "Baby-friendly", "Wi-Fi area"],
    image: HAWTHORN_BRANCH_IMAGE,
    imageAlt: "Queen St BB Hawthorn space and dessert atelier interior",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=616+Glenferrie+Rd+Hawthorn+VIC+3122",
    status: "Open daily · 2:00 PM — 11:00 PM",
    tone: "light",
  },
  {
    number: "03",
    name: "Windsor",
    eyebrow: "A new chapter",
    address: "Location to be announced",
    description:
      "Our next Melbourne address is taking shape. Join the list to hear first when the Windsor room, opening details, and first menu are announced.",
    features: ["Coming soon", "New neighbourhood room", "Opening details to follow"],
    mapUrl: "#windsor-coming-soon",
    status: "Coming soon",
    tone: "coming",
  },
] as const;

const fade = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7 },
};

function BranchVisual({ branch }: { branch: (typeof branches)[number] }) {
  if (branch.tone === "coming") {
    return (
      <div
        className="relative flex h-full min-h-[300px] items-center justify-center overflow-hidden md:min-h-[430px]"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.35 0.05 45) 0%, oklch(0.47 0.075 52) 52%, oklch(0.77 0.08 72) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, #fff 0 1px, transparent 1px), radial-gradient(circle at 70% 75%, #fff 0 1px, transparent 1px)", backgroundSize: "42px 42px, 56px 56px" }} />
        <div className="relative z-10 px-8 text-center text-[#fffaf2]">
          <span className="mb-5 block text-[10px] uppercase tracking-[0.22em] opacity-70">
            Image coming soon
          </span>
          <div className="mx-auto mb-6 h-20 w-20 rounded-full border border-[#fffaf2]/40 p-2">
            <div className="flex h-full w-full items-center justify-center rounded-full border border-[#fffaf2]/50 font-serif text-4xl italic">
              Q
            </div>
          </div>
          <p className="font-serif text-3xl italic md:text-4xl">Windsor</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] opacity-75">
            A new Queen St BB room
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px] overflow-hidden md:min-h-[430px]">
      <img
        src={branch.image}
        alt={branch.imageAlt}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
        style={{ objectPosition: branch.name === "CBD" ? "center 45%" : "center center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2d211b]/65 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 text-[#fffaf2] md:bottom-8 md:left-8">
        <span className="text-[10px] uppercase tracking-[0.18em] opacity-80">{branch.eyebrow}</span>
        <p className="mt-2 font-serif text-3xl italic md:text-4xl">{branch.name}</p>
      </div>
    </div>
  );
}

export default function Space() {
  const heroImage = usePageImage("space", "hero", DEFAULT_HERO);

  return (
    <PageLayout
      heroImage={heroImage}
      heroTitle="The Space"
      heroSubtitle="Three rooms, one Queen St BB feeling"
    >
      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-end md:gap-20">
          <motion.div {...fade}>
            <div className="editorial-rule mb-8" />
            <span
              className="mb-5 block text-[11px] uppercase"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "oklch(0.45 0.06 45 / 0.58)",
              }}
            >
              Melbourne / 03 locations
            </span>
            <h2
              className="text-4xl md:text-6xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                lineHeight: 1.04,
                color: "oklch(0.34 0.05 45)",
              }}
            >
              Find your room.
            </h2>
          </motion.div>
          <motion.p
            {...fade}
            className="max-w-2xl text-base md:justify-self-end md:text-lg"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              lineHeight: 1.75,
              color: "oklch(0.34 0.05 45 / 0.72)",
            }}
          >
            Queen St BB is designed as a collection of places rather than a
            single address. Each room carries the same dessert atelier spirit,
            with its own pace, neighbourhood rhythm, and reason to stay awhile.
          </motion.p>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-32">
        <div className="mx-auto max-w-6xl space-y-6">
          {branches.map((branch, index) => (
            <motion.article
              key={branch.name}
              {...fade}
              transition={{ duration: 0.7, delay: index * 0.08 }}
              className={`group overflow-hidden rounded-[2px] ${branch.tone === "light" ? "bg-[#eee4d6]" : branch.tone === "coming" ? "bg-[#3d2c24]" : "bg-[#3d2c24]"}`}
            >
              <div className="grid md:grid-cols-[0.95fr_1.05fr]">
                <BranchVisual branch={branch} />
                <div
                  className="flex flex-col justify-between p-7 md:p-10 lg:p-14"
                  style={{
                    backgroundColor:
                      branch.tone === "light" ? "#eee4d6" : branch.tone === "coming" ? "#3d2c24" : "#3d2c24",
                    color: branch.tone === "light" ? "#3d2c24" : "#fffaf2",
                  }}
                >
                  <div>
                    <div className="mb-10 flex items-start justify-between gap-5">
                      <span
                        className="text-[11px] uppercase tracking-[0.18em]"
                        style={{ opacity: 0.55 }}
                      >
                        {branch.number} / Location
                      </span>
                      <span
                        className="rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.11em]"
                        style={{ borderColor: "currentColor", opacity: 0.65 }}
                      >
                        {branch.status}
                      </span>
                    </div>
                    <p
                      className="mb-3 text-[11px] uppercase tracking-[0.14em]"
                      style={{ opacity: 0.58 }}
                    >
                      {branch.eyebrow}
                    </p>
                    <h3 className="font-serif text-4xl italic leading-none md:text-5xl">
                      {branch.name}
                    </h3>
                    <p className="mt-7 max-w-lg text-sm leading-7" style={{ opacity: 0.72 }}>
                      {branch.description}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-2">
                      {branch.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.08em]"
                          style={{ borderColor: "currentColor", opacity: 0.72 }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 border-t pt-6" style={{ borderColor: "currentColor", opacity: 0.72 }}>
                    <p className="text-sm leading-6" style={{ opacity: 0.9 }}>
                      {branch.address}
                    </p>
                    {branch.tone === "coming" ? (
                      <p className="mt-4 text-[11px] uppercase tracking-[0.12em]" style={{ opacity: 0.58 }}>
                        Exact address and opening date to be announced
                      </p>
                    ) : (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] underline underline-offset-4 transition-opacity hover:opacity-60"
                      >
                        Open in Maps <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section
        id="windsor-coming-soon"
        className="px-6 py-20 md:px-10 md:py-28"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <motion.div {...fade}>
            <span
              className="mb-5 block text-[11px] uppercase"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.14em",
                color: "oklch(0.45 0.06 45 / 0.58)",
              }}
            >
              More to come
            </span>
            <h2
              className="font-serif text-4xl italic md:text-5xl"
              style={{ color: "oklch(0.34 0.05 45)" }}
            >
              A room for every kind of pause.
            </h2>
          </motion.div>
          <motion.p
            {...fade}
            className="text-base leading-8 md:text-lg"
            style={{ color: "oklch(0.34 0.05 45 / 0.7)" }}
          >
            Come for the signature tiramisu, stay for the atmosphere. As the
            collection grows, each location will have its own visual story,
            seasonal moments, and local rituals — while remaining unmistakably
            Queen St BB.
          </motion.p>
        </div>
      </section>
    </PageLayout>
  );
}
