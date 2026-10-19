import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const utilityLinks = [
  { label: "Our story", href: "/about" },
  { label: "The BB ritual", href: "/tiramisu" },
  { label: "Find us", href: "/space" },
];

const mainLeft = [
  { label: "Tiramisu", href: "/tiramisu" },
  { label: "Our flavours", href: "/gelato" },
  { label: "The boutique", href: "/objects" },
];

const mainRight = [
  { label: "Our world", href: "/about" },
  { label: "Visit us", href: "/space" },
];

const menuLinks = [
  ...mainLeft,
  ...mainRight,
  { label: "Cake Booking", href: "/cake-booking" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Franchise", href: "/franchise" },
  { label: "Customer Care", href: "/customer-care" },
];

interface NavigationProps { variant?: "transparent" | "solid"; }

export default function Navigation({ variant = "solid" }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const allLinks = useMemo(() => isAuthenticated ? [...menuLinks, { label: "My Page", href: "/my-page" }] : menuLinks, [isAuthenticated]);
  const isTransparent = variant === "transparent";
  const showSolid = !isTransparent || scrolled || menuOpen;
  const ink = menuOpen ? "#f2dfb6" : showSolid ? "#ead5a5" : "#f5e8c8";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] border-b border-[#ead5a5]/15 bg-[#2d1713] text-[#ead5a5]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 text-[10px] tracking-[0.08em] md:px-12">
          <nav className="hidden gap-6 md:flex">
            {utilityLinks.map((link) => <NavLink key={link.href} link={link} location={location} color={ink} />)}
          </nav>
          <span className="mx-auto font-serif italic tracking-[0.14em] md:absolute md:left-1/2 md:-translate-x-1/2">A little Italian soul. A little Melbourne charm.</span>
          <a href="https://instagram.com/queenst_bb" target="_blank" rel="noreferrer" className="hidden md:block">@queenst_bb ↗</a>
        </div>
      </div>

      <header
        className="fixed left-0 right-0 top-[32px] z-50 transition-colors duration-300"
        style={{ backgroundColor: menuOpen ? "#2d1713" : showSolid ? "rgba(52,27,22,0.97)" : "rgba(52,27,22,0.72)", backdropFilter: "blur(8px)" }}
      >
        <div className="relative mx-auto hidden max-w-[1440px] items-center justify-between px-12 py-7 lg:flex">
          <nav className="flex min-w-[370px] items-center gap-12">
            {mainLeft.map((link) => <NavLink key={link.href} link={link} location={location} color={ink} />)}
          </nav>
          <Link href="/" className="absolute left-1/2 top-0 z-10 flex h-[118px] w-[190px] -translate-x-1/2 items-center justify-center border-x border-b border-[#ead5a5]/20 bg-[#401e19] shadow-[0_12px_35px_rgba(24,8,5,0.25)]">
            <span className="relative text-center font-serif text-2xl italic tracking-[0.02em] text-[#f4dfaf]">Queenst.bb<span className="mt-1 block text-[8px] not-italic uppercase tracking-[0.35em]">Tiramisu · Gelato</span></span>
          </Link>
          <nav className="flex min-w-[370px] items-center justify-end gap-12">
            {mainRight.map((link) => <NavLink key={link.href} link={link} location={location} color={ink} />)}
            <Link href="/objects" aria-label="Open boutique" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1dfb8] text-[#3a1c16] transition-transform hover:scale-105"><ShoppingBag size={17} strokeWidth={1.3} /></Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" className="flex w-7 flex-col gap-1.5">
              <span className="h-px w-7 bg-[#ead5a5]" /><span className="ml-auto h-px w-5 bg-[#ead5a5]" /><span className="h-px w-7 bg-[#ead5a5]" />
            </button>
          </nav>
        </div>
        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <Link href="/" className="font-serif text-xl italic text-[#f4dfaf]">Queenst.bb</Link>
          <div className="flex items-center gap-4">
            <Link href="/objects" aria-label="Open boutique" className="text-[#f1dfb8]"><ShoppingBag size={17} strokeWidth={1.3} /></Link>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="flex w-7 flex-col items-end gap-1.5"><span className="h-px w-7 bg-[#ead5a5]" /><span className="h-px w-5 bg-[#ead5a5]" /><span className="h-px w-7 bg-[#ead5a5]" /></button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-[#2d1713] px-8 pt-24">
            <nav className="grid w-full max-w-2xl grid-cols-2 gap-x-10 gap-y-7 md:grid-cols-3">
              {allLinks.map((link, i) => <motion.div key={`${link.href}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}><Link href={link.href} onClick={() => setMenuOpen(false)}><span className={`font-serif text-2xl italic transition-opacity hover:opacity-50 ${location === link.href ? "text-[#fff0c7]" : "text-[#ead5a5]"}`}>{link.label}</span></Link></motion.div>)}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ link, location, color }: { link: { label: string; href: string }; location: string; color: string }) {
  return <Link href={link.href}><span className="text-[11px] tracking-[0.05em] transition-opacity hover:opacity-55" style={{ color }}>{link.label}</span></Link>;
}
