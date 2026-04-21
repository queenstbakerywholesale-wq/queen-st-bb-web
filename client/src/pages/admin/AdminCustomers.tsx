import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, X, Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminCustomers.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
  });

  const customerDetail = trpc.adminCustomers.getById.useQuery(
    { id: selectedCustomer! },
    { enabled: !!selectedCustomer }
  );

  const createMutation = trpc.adminCustomers.create.useMutation({
    onSuccess: () => {
      utils.adminCustomers.list.invalidate();
      setShowForm(false);
      setForm({ name: "", email: "", phone: "", notes: "" });
      toast.success("Customer created");
    },
  });

  const updateMutation = trpc.adminCustomers.update.useMutation({
    onSuccess: () => {
      utils.adminCustomers.list.invalidate();
      setShowForm(false);
      setEditingCustomer(null);
      toast.success("Customer updated");
    },
  });

  const deleteMutation = trpc.adminCustomers.delete.useMutation({
    onSuccess: () => {
      utils.adminCustomers.list.invalidate();
      toast.success("Customer deleted");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setForm({ name: customer.name, email: customer.email ?? "", phone: customer.phone ?? "", notes: customer.notes ?? "" });
    setShowForm(true);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);
  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E20", color: "#5A3A2E" };
  const labelStyle = { fontFamily: "var(--font-body)", color: "#5A3A2E80", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-[0.1em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
          Customers
        </h1>
        <button
          onClick={() => { setEditingCustomer(null); setForm({ name: "", email: "", phone: "", notes: "" }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className="block mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle} className="block mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md" style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}>
                {editingCustomer ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingCustomer(null); }} className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md border" style={{ borderColor: "#5A3A2E30", color: "#5A3A2E", fontFamily: "var(--font-body)" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && customerDetail.data && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light tracking-[0.1em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
                {customerDetail.data.name}
              </h2>
              <button onClick={() => setSelectedCustomer(null)}><X className="w-5 h-5" style={{ color: "#5A3A2E" }} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Email</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{customerDetail.data.email || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Phone</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{customerDetail.data.phone || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Orders</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{customerDetail.data.orders?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Bookings</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{customerDetail.data.bookings?.length ?? 0}</p>
              </div>
            </div>

            {customerDetail.data.notes && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Notes</p>
                <p className="text-sm p-2 rounded" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E", backgroundColor: "#5A3A2E05" }}>
                  {customerDetail.data.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E50" }} />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md focus:outline-none"
          style={{ fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" }}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#5A3A2E05", fontFamily: "var(--font-body)" }}>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Name</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Email</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Phone</th>
                <th className="text-left text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Joined</th>
                <th className="text-right text-[11px] uppercase tracking-[0.1em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td colSpan={5} className="px-5 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} /></td>
                  </tr>
                ))
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((customer) => (
                  <tr key={customer.id} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{customer.name}</td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>{customer.email || "—"}</td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>{customer.phone || "—"}</td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedCustomer(customer.id)} className="p-1.5 rounded hover:bg-black/5 transition-colors">
                          <Eye className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                        <button onClick={() => handleEdit(customer)} className="p-1.5 rounded hover:bg-black/5 transition-colors">
                          <Pencil className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                        <button onClick={() => { if (confirm("Delete this customer?")) deleteMutation.mutate({ id: customer.id }); }} className="p-1.5 rounded hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="w-8 h-8 text-xs rounded-md transition-all" style={{ fontFamily: "var(--font-body)", backgroundColor: page === i + 1 ? "#5A3A2E" : "transparent", color: page === i + 1 ? "#F5F0EB" : "#5A3A2E" }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
