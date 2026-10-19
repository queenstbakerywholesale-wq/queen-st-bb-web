import { Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import ProgressiveImage from "@/components/ProgressiveImage";
import { usePageImages } from "@/hooks/usePageImage";
import { trpc } from "@/lib/trpc";

const DEFAULT_IMAGES = {
  "hero-main": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp",
  "hero-tiramisu": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp",
  "hero-gelato": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp",
  "hero-space": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp",
};

const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6 } };
const collectionCards = [
  { label: "Tiramisu", note: "Layered with intention", href: "/tiramisu", image: "hero-tiramisu" },
  { label: "Gelato & Sorbet", note: "Churned daily", href: "/gelato", image: "hero-gelato" },
  { label: "The Space", note: "Three Melbourne rooms", href: "/space", image: "hero-space" },
  { label: "Objects", note: "Objects for the everyday", href: "/objects", image: "hero-main" },
];
const quickLinks = [
  { label: "Cake Booking", note: "Made to order", href: "/cake-booking" },
  { label: "Gift Cards", note: "Give a little Queen St BB", href: "/gift-cards" },
  { label: "Wholesale", note: "Bring us to your room", href: "/wholesale" },
  { label: "Franchise", note: "A new chapter", href: "/franchise" },
];

export default function Home() {
  const images = usePageImages("home", DEFAULT_IMAGES);
  const { data: liveProducts } = trpc.publicProducts.list.useQuery({ limit: 100 });
  const featuredGoods = (liveProducts ?? []).filter((product) => product.productType === "merchandise" && Boolean(product.imageUrl) && Number(product.stock ?? 0) > 0).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#351b16] text-[#f1dfb8]">
      <Navigation variant="transparent" />
      <section className="relative min-h-[840px] overflow-hidden bg-[#351b16] px-5 pb-14 pt-[150px] md:min-h-[900px] md:px-12 md:pt-[190px]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center">
          <motion.div {...fade} className="relative z-10 mb-14 border border-[#ead5a5]/15 bg-[#421f19] px-10 py-7 text-center shadow-[0_15px_45px_rgba(16,5,3,0.2)] md:mb-20 md:px-20">
            <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#ead5a5]/70">Welcome to the world of</p>
            <h1 className="font-serif text-5xl italic leading-none text-[#f4dfaf] md:text-7xl">Queenst.bb</h1>
            <p className="mt-4 font-serif text-lg italic text-[#ead5a5]">Life is soft.</p>
          </motion.div>
          <motion.div {...fade} className="relative w-full max-w-[980px] border border-[#ead5a5]/70 p-3 md:p-5">
            <div className="pointer-events-none absolute -inset-4 border border-[#ead5a5]/25 md:-inset-6" />
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 font-serif text-4xl text-[#ead5a5]">❦</div>
            <div className="relative aspect-[16/8.5] overflow-hidden bg-[#2a1411]">
              <ProgressiveImage src={images["hero-main"]} alt="Queen St BB tiramisu atelier" containerClassName="h-full w-full" className="saturate-[0.78] sepia-[0.12]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d1713]/55 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#351b16] px-7 font-serif text-xl italic text-[#ead5a5]">Made fresh, shared slowly</div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-6 rotate-180 text-[9px] uppercase tracking-[0.35em] text-[#ead5a5]/70 [writing-mode:vertical-rl]">Melbourne / dessert atelier</div>
        <div className="pointer-events-none absolute bottom-6 right-6 text-[9px] uppercase tracking-[0.35em] text-[#ead5a5]/70 [writing-mode:vertical-rl]">Tiramisu / gelato</div>
      </section>

      <section id="collections" className="border-t border-[#ead5a5]/15 bg-[#f1dfb8] px-6 py-20 text-[#351b16] md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fade} className="mx-auto mb-12 max-w-xl text-center"><span className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-[#7d5640]">Explore Queen St BB</span><h2 className="font-serif text-4xl italic md:text-6xl">Our little world</h2><p className="mt-4 text-sm leading-6 text-[#6a4939]">A soft place for tiramisu, gelato, good objects, and Melbourne moments.</p></motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            {collectionCards.map((card, index) => <motion.div key={card.label} {...fade} transition={{ duration: 0.6, delay: index * 0.06 }}><Link href={card.href}><article className="group relative min-h-[300px] overflow-hidden border border-[#351b16]/15 bg-[#351b16] text-[#f1dfb8]"><ProgressiveImage src={images[card.image as keyof typeof images]} alt={card.label} containerClassName="absolute inset-0 h-full w-full" className="saturate-[0.8] transition-transform duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-[#24110d]/85 via-transparent to-transparent" /><div className="absolute inset-x-6 bottom-6 md:inset-x-8 md:bottom-8"><p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#ead5a5]/75">{card.note}</p><h3 className="font-serif text-4xl italic md:text-5xl">{card.label}</h3><span className="mt-5 inline-block border-b border-[#ead5a5]/70 pb-1 text-[10px] uppercase tracking-[0.16em] text-[#ead5a5]">Discover ↗</span></div></article></Link></motion.div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[#ead5a5]/15 bg-[#421f19] px-6 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center"><motion.div {...fade}><span className="mb-4 block text-[10px] uppercase tracking-[0.25em] text-[#ead5a5]/65">The BB ritual</span><h2 className="font-serif text-4xl italic leading-tight text-[#f1dfb8] md:text-6xl">A little Italian soul.<br />A little Melbourne charm.</h2></motion.div><motion.p {...fade} className="max-w-xl text-sm leading-7 text-[#ead5a5]/75 md:text-base">We make tiramisu fresh every day and let it rest for 24 hours before serving. Our gelato is churned in small batches, with fresh fruit wherever the recipe calls for it. Come for one spoonful, stay for the room.</motion.p></div></section>

      {featuredGoods.length > 0 && <section className="bg-[#f1dfb8] px-6 py-20 text-[#351b16] md:px-10 md:py-28"><div className="mx-auto max-w-6xl"><motion.div {...fade} className="mb-9 flex items-end justify-between gap-5"><div><span className="mb-3 block text-[10px] uppercase tracking-[0.2em] text-[#7d5640]">The boutique</span><h2 className="font-serif text-4xl italic md:text-5xl">Little things, made memorable.</h2></div><Link href="/objects" className="hidden text-[10px] uppercase tracking-[0.16em] underline underline-offset-4 md:block">Visit the boutique ↗</Link></motion.div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{featuredGoods.map((product, index) => <motion.div key={product.id} {...fade} transition={{ duration: 0.55, delay: index * 0.06 }}><Link href="/objects"><article className="group"><div className="aspect-[4/5] overflow-hidden border border-[#351b16]/10 bg-[#ead5a5]"><ProgressiveImage src={product.imageUrl!} alt={product.name} containerClassName="h-full w-full" objectFit="contain" className="p-3 transition-transform duration-700 group-hover:scale-[1.04]" /></div><div className="px-1 pt-4"><h3 className="font-serif text-xl italic leading-tight">{product.name}</h3><p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-[#7d5640]">AUD {Number(product.price).toFixed(2)}</p></div></article></Link></motion.div>)}</div></div></section>}

      <section className="bg-[#351b16] px-6 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-6xl"><motion.div {...fade} className="mb-8 text-center"><span className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-[#ead5a5]/60">More from Queen St BB</span><h2 className="font-serif text-4xl italic text-[#f1dfb8] md:text-5xl">Find your next moment</h2></motion.div><div className="grid grid-cols-2 gap-px overflow-hidden border border-[#ead5a5]/20 bg-[#ead5a5]/20 md:grid-cols-4">{quickLinks.map((item) => <Link key={item.href} href={item.href}><div className="group min-h-[165px] bg-[#351b16] p-5 transition-colors hover:bg-[#421f19] md:min-h-[190px] md:p-7"><span className="text-[9px] uppercase tracking-[0.16em] text-[#ead5a5]/55">Explore</span><h3 className="mt-8 font-serif text-2xl italic text-[#f1dfb8] md:text-3xl">{item.label}</h3><p className="mt-2 text-[11px] text-[#ead5a5]/60">{item.note}</p></div></Link>)}</div></div></section>
    </div>
  );
}
