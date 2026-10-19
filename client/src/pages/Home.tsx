import { useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { PACKAGE_DEFAULT_IMAGES } from "@shared/packageImageSlots";
import { PACKAGE_HOME_TEMPLATE } from "@/lib/packageHomeTemplate";
import { escapeMarkup, renderPackageMarkup } from "@/lib/packageHome";
import "./packageHome.css";
import "./packageHomeIntegration.css";

const goods = [
  { key: "mug", id: 390001, title: "Queen Street Melbourne Mug (Green)", copy: "A Melbourne keepsake for your morning coffee and all the little pauses in between." },
  { key: "postcard", id: 120009, title: "Melbourne Postcard", copy: "A little Melbourne love, to send or to keep. Discover our original postcard collection." },
  { key: "koala", id: 570001, title: "Queen BB Koala Keyring Doll", copy: "A little companion from our Melbourne world. Check the boutique for current availability." },
];
const flavours = {
  original: { name: "Queen’s Original", edition: "No. 01 — The timeless one", description: "Coffee-soaked ladyfingers, soft mascarpone cream and a generous veil of cocoa. Some things need no introduction.", position: "12% 70%", scale: "1.5" },
  pistachio: { name: "Verde Dolce Pistacchio", edition: "No. 02 — A little nutty", description: "Pistachio meets soft tiramisu layers for the nut lover at heart. See our complete tiramisu collection for ingredients and allergen details.", position: "67% 49%", scale: "2" },
  fruit: { name: "A fresh little crush.", edition: "No. 03 — The fruit collection", description: "Discover Cherry Noir Bloom, Mango Crown and our other fruit-led tiramisu flavours. Made fresh every day, then rested for 24 hours before serving.", position: "100% 26%", scale: "2.2" },
};

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const selectedFlavour = useRef<keyof typeof flavours>("original");
  const selectedGood = useRef<string | null>(null);
  const { data: saved = [] } = trpc.publicPageImages.getByPage.useQuery({ pageSlug: "home" }, { staleTime: 0, refetchOnWindowFocus: true });
  const { data: products = [] } = trpc.publicProducts.list.useQuery({ limit: 100 });
  const imageMap = useMemo(() => {
    const result = { ...PACKAGE_DEFAULT_IMAGES };
    goods.forEach(good => { const p = products.find(p => p.id === good.id); if (p?.imageUrl) result[`boutique-${good.key}`] = p.imageUrl; });
    saved.forEach(image => { if (image.imageUrl) result[image.slotKey] = image.imageUrl; });
    return result;
  }, [saved, products]);
  const markup = useMemo(() => renderPackageMarkup(PACKAGE_HOME_TEMPLATE, imageMap), [imageMap]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const menu = el.querySelector<HTMLButtonElement>(".nav-menu")!;
    const mobile = el.querySelector<HTMLElement>("#mobile-nav")!;
    const dialog = el.querySelector<HTMLDialogElement>("dialog")!;
    saved.forEach(image => {
      if (!image.altText) return;
      el.querySelectorAll<HTMLImageElement>("img[data-page-slot]").forEach(img => { if (img.dataset.pageSlot === image.slotKey) img.alt = image.altText!; });
    });
    goods.forEach(good => {
      const product = products.find(p => p.id === good.id);
      if (!product) return;
      const card = el.querySelector<HTMLElement>(`[data-product-id="${good.id}"]`)!;
      const title = card.querySelector(".object-title");
      if (title) title.innerHTML = `${escapeMarkup(product.name)} <span>↗</span>`;
      const summary = card.querySelector("p");
      if (summary) summary.textContent = `AUD ${Number(product.price).toFixed(2)}${Number(product.stock) <= 0 ? " · Sold out" : ""}`;
    });
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    function selectFlavour(button: HTMLButtonElement) {
      const key = button.dataset.flavour as keyof typeof flavours;
      const data = flavours[key];
      if (!data) return;
      selectedFlavour.current = key;
      tabs.forEach(tab => { const active = tab === button; tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; });
      el!.querySelector("#flavour-panel")!.setAttribute("aria-labelledby", button.id);
      el!.querySelector("#flavour-name")!.textContent = data.name;
      el!.querySelector("#flavour-edition")!.textContent = data.edition;
      el!.querySelector("#flavour-description")!.textContent = data.description;
      const image = el!.querySelector<HTMLImageElement>("#flavour-image")!;
      const slot = `flavour-${key}`;
      image.src = imageMap[slot];
      image.dataset.pageSlot = slot;
      image.alt = saved.find(i => i.slotKey === slot)?.altText || `${data.name} tiramisu`;
      const originalPackageImage = imageMap[slot] === PACKAGE_DEFAULT_IMAGES[slot];
      image.style.objectPosition = originalPackageImage ? data.position : "center";
      image.style.transform = originalPackageImage ? `scale(${data.scale})` : "none";
    }
    selectFlavour(tabs.find(tab => tab.dataset.flavour === selectedFlavour.current) || tabs[0]);
    const year = el.querySelector("#year"); if (year) year.textContent = String(new Date().getFullYear());
    function closeMenu() { menu.setAttribute("aria-expanded", "false"); mobile.classList.remove("open"); }
    function openGood(key: string) {
      const good = goods.find(g => g.key === key);
      if (!good) return;
      selectedGood.current = key;
      const product = products.find(p => p.id === good.id);
      el!.querySelector("#dialog-title")!.textContent = product?.name || good.title;
      el!.querySelector("#dialog-copy")!.textContent = `${good.copy}${product ? ` AUD ${Number(product.price).toFixed(2)}.${Number(product.stock) <= 0 ? " Currently sold out — not available to purchase." : ""}` : ""}`;
      dialog.querySelector<HTMLAnchorElement>("a")!.href = `/objects?product=${good.id}`;
      if (!dialog.open) dialog.showModal();
    }
    if (selectedGood.current) openGood(selectedGood.current);
    function dialogClosed() { selectedGood.current = null; }
    function click(event: MouseEvent) {
      const target = (event.target as Element).closest<HTMLElement>("button,a");
      if (!target || !el!.contains(target)) return;
      if (target === menu) {
        const open = menu.getAttribute("aria-expanded") !== "true";
        menu.setAttribute("aria-expanded", String(open)); mobile.classList.toggle("open", open);
      }
      if (mobile.contains(target) && target.tagName === "A") closeMenu();
      if (target.matches("[role=tab]")) selectFlavour(target as HTMLButtonElement);
      if (target.matches(".close")) dialog.close();
      if (target.dataset.modal) openGood(target.dataset.modal);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
      const i = tabs.indexOf(event.target as HTMLButtonElement);
      if (i < 0) return;
      const index = event.key === "ArrowRight" ? (i+1)%tabs.length : event.key === "ArrowLeft" ? (i+tabs.length-1)%tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length-1 : null;
      if (index !== null) { event.preventDefault(); selectFlavour(tabs[index]); tabs[index].focus(); }
    }
    el.addEventListener("click", click); el.addEventListener("keydown", keydown); dialog.addEventListener("close", dialogClosed);
    return () => { el.removeEventListener("click", click); el.removeEventListener("keydown", keydown); dialog.removeEventListener("close", dialogClosed); };
  }, [markup, imageMap, saved, products]);

  return <div ref={root} className="bb-package" dangerouslySetInnerHTML={{ __html: markup }} />;
}
