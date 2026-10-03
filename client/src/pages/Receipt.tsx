import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";

export default function Receipt() {
  const [, params] = useRoute("/receipt/:token");
  const { data, isLoading, error } = trpc.pos.publicReceipt.useQuery({ token: params?.token || "" }, { enabled: Boolean(params?.token) });
  if (isLoading) return <main className="min-h-screen bg-[#f4eee5] flex items-center justify-center text-[#3d2c24]">Loading your receipt…</main>;
  if (error || !data) return <main className="min-h-screen bg-[#f4eee5] flex items-center justify-center text-[#3d2c24]">This receipt link is no longer available.</main>;
  const { order, items, branch } = data;
  return <main className="min-h-screen bg-[#f4eee5] px-4 py-10 text-[#3d2c24]">
    <article className="receipt-card mx-auto max-w-xl bg-[#fffaf2] border border-[#d9c8b6] px-7 py-9 shadow-sm">
      <div className="flex items-start justify-between border-b border-[#d9c8b6] pb-6"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#3d2c24] bg-[#3d2c24] text-[#fffaf2]" aria-label="Queen St BB logo"><span className="font-serif text-2xl italic">Q</span></div><div><p className="text-[11px] font-medium tracking-[.22em]">QUEEN ST BB</p><p className="mt-2 text-xs opacity-65">A dessert atelier</p></div></div><p className="text-xs opacity-65 tracking-[.14em]">E-RECEIPT</p></div>
      <div className="py-7"><p className="text-xs opacity-65">Thank you for visiting</p><h1 className="mt-2 text-3xl font-normal">Your receipt</h1><p className="mt-3 text-sm">{order.orderNumber}</p><p className="text-xs opacity-65">{new Date(order.createdAt).toLocaleString("en-AU")}</p></div>
      <div className="space-y-3 border-y border-[#d9c8b6] py-5">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.quantity} × {item.itemName}</span><span>AUD {parseFloat(String(item.totalPrice)).toFixed(2)}</span></div>)}</div>
      <div className="space-y-2 py-5 text-sm"><div className="flex justify-between"><span>GST included</span><span>AUD {parseFloat(String(order.tax)).toFixed(2)}</span></div><div className="flex justify-between text-xl"><span>Total</span><strong>AUD {parseFloat(String(order.total)).toFixed(2)}</strong></div></div>
      <div className="border-t border-[#d9c8b6] pt-5 text-xs opacity-70"><p>{branch?.name || "Queen St BB"}</p><p>{branch?.address || "Melbourne, Australia"}</p><p className="mt-2">Payment: {order.paymentMethod.toUpperCase()}</p></div>
      <div className="mt-8 flex gap-2 print:hidden"><button onClick={() => window.print()} className="flex-1 bg-[#3d2c24] px-4 py-3 text-xs tracking-[.12em] text-[#fffaf2]">DOWNLOAD / PRINT PDF</button><button onClick={() => window.close()} className="border border-[#3d2c24] px-4 py-3 text-xs">CLOSE</button></div>
    </article>
    <style>{`@media print { body { background:#fffaf2 !important; } .receipt-card { box-shadow:none !important; border:0 !important; } }`}</style>
  </main>;
}
