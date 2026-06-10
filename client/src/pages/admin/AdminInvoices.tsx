/**
 * Admin Invoices — Create, send, and manage invoices
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminInvoices() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: invoices = [], refetch } = trpc.pos.listInvoices.useQuery();
  const { data: branches = [] } = trpc.adminStaff.branches.useQuery();

  const createMutation = trpc.pos.createInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice created"); refetch(); setShowCreate(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const sendMutation = trpc.pos.sendInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice sent"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const markPaidMutation = trpc.pos.markInvoicePaid.useMutation({
    onSuccess: () => { toast.success("Invoice marked as paid"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
    color: "oklch(0.34 0.05 45)",
    padding: "8px 12px",
    width: "100%",
  };

  const statusColors: Record<string, string> = {
    draft: "oklch(0.6 0.1 60)",
    sent: "oklch(0.5 0.15 250)",
    paid: "oklch(0.45 0.15 145)",
    overdue: "oklch(0.5 0.15 25)",
    cancelled: "oklch(0.5 0.05 45)",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
            Invoices
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            인보이스를 생성하고 이메일/SMS로 전송합니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-xs uppercase transition-all hover:opacity-80"
          style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
        >
          + New Invoice
        </button>
      </div>

      {showCreate && (
        <InvoiceForm
          branches={branches}
          onSubmit={(data: any) => createMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Invoice List */}
      <div className="space-y-2">
        {invoices.length === 0 ? (
          <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
            <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>No invoices yet</p>
          </div>
        ) : (
          invoices.map((inv: any) => (
            <div
              key={inv.id}
              className="p-4 flex items-center justify-between"
              style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                  {inv.invoiceNumber}
                </p>
                <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                  {inv.customerName} · ${inv.total}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] uppercase px-2 py-0.5"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: statusColors[inv.status] || "oklch(0.34 0.05 45)", border: `1px solid ${statusColors[inv.status] || "oklch(0.34 0.05 45)"}` }}
                >
                  {inv.status}
                </span>
                {inv.status === "draft" && (
                  <button
                    onClick={() => sendMutation.mutate({ id: inv.id, via: "email" })}
                    className="text-[10px] uppercase px-3 py-1 hover:opacity-70"
                    style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
                  >
                    Send
                  </button>
                )}
                {(inv.status === "sent" || inv.status === "draft") && inv.status !== "paid" && (
                  <button
                    onClick={() => markPaidMutation.mutate({ id: inv.id })}
                    className="text-[10px] uppercase px-3 py-1 hover:opacity-70"
                    style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", backgroundColor: "oklch(0.45 0.15 145)", color: "white" }}
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InvoiceForm({ branches, onSubmit, onCancel, isLoading }: any) {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    branchId: branches[0]?.id || null,
    items: [{ name: "", quantity: 1, unitPrice: "" }],
    notes: "",
    dueDate: "",
  });

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)", fontSize: "13px", backgroundColor: "white",
    border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)", padding: "8px 12px", width: "100%",
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { name: "", quantity: 1, unitPrice: "" }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: any) => {
    const items = [...form.items];
    (items[i] as any)[field] = value;
    setForm({ ...form, items });
  };

  const total = form.items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice || "0")), 0);

  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: "oklch(0.97 0.008 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>New Invoice</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input style={inputStyle} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Customer name" />
        <input style={inputStyle} value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="Email" />
        <input style={inputStyle} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="Phone" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Items</p>
        {form.items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input style={{ ...inputStyle, flex: 2 }} value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} placeholder="Item name" />
            <input style={{ ...inputStyle, width: "80px" }} type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
            <input style={{ ...inputStyle, width: "100px" }} type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} placeholder="Price" />
            <span className="text-sm w-20 text-right" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
              ${(item.quantity * parseFloat(item.unitPrice || "0")).toFixed(2)}
            </span>
            {form.items.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-sm" style={{ color: "oklch(0.5 0.15 25)" }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addItem} className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
          + Add item
        </button>
      </div>

      <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
          Total: ${total.toFixed(2)}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onSubmit({ ...form, items: form.items.filter(i => i.name) })}
            disabled={isLoading || !form.customerName || form.items.every(i => !i.name)}
            className="px-4 py-2 text-xs uppercase disabled:opacity-40"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
          >
            {isLoading ? "..." : "Create"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-xs uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
