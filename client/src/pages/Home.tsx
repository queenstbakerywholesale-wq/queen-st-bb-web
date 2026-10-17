import { Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import ProgressiveImage from "@/components/ProgressiveImage";
import { usePageImages } from "@/hooks/usePageImage";

const DEFAULT_IMAGES = {
  "hero-main": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp",
  "hero-tiramisu": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp",
  "hero-gelato": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp",
  "hero-space": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp",
};

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6 },
};

const collectionCards = [
  { label: "Tiramisu", note: "Layered with intention", href: "/tiramisu", image: "hero-tiramisu", tone: "dark" },
  { label: "Gelato & Sorbet", note: "Churned daily", href: "/gelato", image: "hero-gelato", tone: "light" },
  { label: "The Space", note: "Three Melbourne rooms", href: "/space", image: "hero-space", tone: "dark" },
  { label: "Objects", note: "Objects for the everyday", href: "/objects", image: "hero-main", tone: "light" },
];

const quickLinks = [
  { label: "Cake Booking", note: "Made to order", href: "/cake-booking" },
  { label: "Gift Cards", note: "Give a little Queen St BB", href: "/gift-cards" },
  { label: "Wholesale", note: "Bring us to your room", href: "/wholesale" },
  { label: "Franchise", note: "A new chapter", href: "/franchise" },
];

export default function Home() {
  const images = usePageImages("home", DEFAULT_IMAGES);

  return (
    <div className="min-h-screen bg-[#f4eee2] text-[#3d2c24]">
      <Navigation variant="transparent" />

      <section className="relative min-h-[78vh] overflow-hidden bg-[#3d2c24]">
        <ProgressiveImage
          src={images["hero-main"]}
          alt="Queen St BB dessert atelier"
          containerClassName="absolute inset-0 h-full w-full"
          className="saturate-[0.85] contrast-[0.95]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b1e18]/80 via-[#2b1e18]/15 to-transparent" />
        <motion.div {...fade} className="absolute inset-x-6 bottom-12 mx-auto max-w-6xl text-center text-[#fffaf2] md:bottom-20">
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-white/70">Melbourne / A dessert atelier</p>
          <h1 className="font-serif text-6xl italic leading-none md:text-8xl">Queen St BB</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/80">Fresh tiramisu, slow-churned gelato, and objects made to make an everyday moment feel special.</p>
          <a href="#collections" className="mt-8 inline-block border-b border-white/60 pb-2 text-[10px] uppercase tracking-[0.18em] text-white/90">Discover the collection</a>
        </motion.div>
      </section>

      <section id="collections" className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fade} className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-[#7c6250]/75">Explore Queen St BB</span>
              <h2 className="font-serif text-4xl italic md:text-6xl">Wonders of the atelier</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#5a4335]/70">Everything we make, serve, and share — gathered in one place.</p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {collectionCards.map((card, index) => (
              <motion.div key={card.label} {...fade} transition={{ duration: 0.6, delay: index * 0.06 }}>
                <Link href={card.href}>
                  <article className={`group relative min-h-[300px] overflow-hidden rounded-[2px] ${card.tone === "dark" ? "bg-[#3d2c24] text-[#fffaf2]" : "bg-[#e6d7c5] text-[#3d2c24]"}`}>
                    <ProgressiveImage src={images[card.image as keyof typeof images]} alt={card.label} containerClassName="absolute inset-0 h-full w-full" className="transition-transform duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241813]/75 via-transparent to-transparent" />
                    <div className="absolute inset-x-6 bottom-6 md:inset-x-8 md:bottom-8">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/70">{card.note}</p>
                      <h3 className="font-serif text-4xl italic text-white md:text-5xl">{card.label}</h3>
                      <span className="mt-5 inline-block border-b border-white/60 pb-1 text-[10px] uppercase tracking-[0.16em] text-white/80">See collection ↗</span>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#8d705b]/20 bg-[#ebe0d1] px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <motion.div {...fade}>
            <span className="mb-4 block text-[10px] uppercase tracking-[0.2em] text-[#7c6250]/75">Made fresh, shared slowly</span>
            <h2 className="font-serif text-4xl italic leading-tight md:text-6xl">A little indulgence, with a point of view.</h2>
          </motion.div>
          <motion.p {...fade} className="max-w-xl text-sm leading-7 text-[#5a4335]/75 md:text-base">
            We make tiramisu fresh every day and let it rest for 24 hours before serving. Our gelato is churned in small batches, with fresh fruit wherever the recipe calls for it. Come for one spoonful, stay for the room.
          </motion.p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fade} className="mb-8 flex items-end justify-between gap-5">
            <div>
              <span className="mb-3 block text-[10px] uppercase tracking-[0.2em] text-[#7c6250]/75">More from Queen St BB</span>
              <h2 className="font-serif text-4xl italic md:text-5xl">Find your next moment</h2>
            </div>
            <Link href="/customer-care" className="hidden text-[10px] uppercase tracking-[0.16em] underline underline-offset-4 md:block">Visit the care guide ↗</Link>
          </motion.div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] bg-[#8d705b]/20 md:grid-cols-4">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="group min-h-[150px] bg-[#f4eee2] p-5 transition-colors hover:bg-[#e6d7c5] md:min-h-[190px] md:p-7">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-[#7c6250]/65">Explore</span>
                  <h3 className="mt-8 font-serif text-2xl italic md:text-3xl">{item.label}</h3>
                  <p className="mt-2 text-[11px] text-[#5a4335]/65">{item.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
