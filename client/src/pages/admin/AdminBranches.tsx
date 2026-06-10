import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Pencil, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function AdminBranches() {
  const utils = trpc.useUtils();
  const { data: branches, isLoading } = trpc.adminBookings.listBranches.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    pickupSlotDuration: 30,
    maxBookingsPerSlot: 3,
    minPrepNoticeHours: 24,
    allowSameDayBooking: false,
    isActive: true,
    openingHours: {} as Record<string, { open: string; close: string; closed?: boolean }>,
  });

  const createMutation = trpc.adminBookings.createBranch.useMutation({
    onSuccess: () => {
      utils.adminBookings.listBranches.invalidate();
      setShowForm(false);
      resetForm();
      toast.success("Branch created");
    },
  });

  const updateMutation = trpc.adminBookings.updateBranch.useMutation({
    onSuccess: () => {
      utils.adminBookings.listBranches.invalidate();
      setShowForm(false);
      setEditingBranch(null);
      resetForm();
      toast.success("Branch updated");
    },
  });

  const resetForm = () => {
    setForm({
      name: "", address: "", phone: "", email: "",
      pickupSlotDuration: 30, maxBookingsPerSlot: 3, minPrepNoticeHours: 24,
      allowSameDayBooking: false, isActive: true,
      openingHours: {},
    });
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      pickupSlotDuration: branch.pickupSlotDuration,
      maxBookingsPerSlot: branch.maxBookingsPerSlot,
      minPrepNoticeHours: branch.minPrepNoticeHours,
      allowSameDayBooking: branch.allowSameDayBooking,
      isActive: branch.isActive,
      openingHours: branch.openingHours ?? {},
    });
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const setHours = (day: string, field: "open" | "close" | "closed", value: string | boolean) => {
    const existing = form.openingHours[day] ?? { open: "14:00", close: "23:00" };
    setForm({
      ...form,
      openingHours: {
        ...form.openingHours,
        [day]: {
          ...existing,
          [field]: value,
        },
      },
    });
  };

  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E20", color: "#5A3A2E" };
  const labelStyle = { fontFamily: "var(--font-body)", color: "#5A3A2E80", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-[0.04em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
          Branches
        </h1>
        <button
          onClick={() => { setEditingBranch(null); resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md"
          style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Branch
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className="block mb-1">Branch Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} required />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active (uncheck for "Open Soon")
              </label>
            </div>

            {/* Booking Settings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label style={labelStyle} className="block mb-1">Slot Duration (min)</label>
                <input type="number" value={form.pickupSlotDuration} onChange={(e) => setForm({ ...form, pickupSlotDuration: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Max/Slot</label>
                <input type="number" value={form.maxBookingsPerSlot} onChange={(e) => setForm({ ...form, maxBookingsPerSlot: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Min Notice (hrs)</label>
                <input type="number" value={form.minPrepNoticeHours} onChange={(e) => setForm({ ...form, minPrepNoticeHours: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none" style={inputStyle} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm pb-2" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                  <input type="checkbox" checked={form.allowSameDayBooking} onChange={(e) => setForm({ ...form, allowSameDayBooking: e.target.checked })} />
                  Same-day
                </label>
              </div>
            </div>

            {/* Opening Hours */}
            {form.isActive && (
              <div>
                <label style={labelStyle} className="block mb-2">Opening Hours</label>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-24 text-xs capitalize" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{day}</span>
                      <label className="flex items-center gap-1 text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>
                        <input type="checkbox" checked={form.openingHours[day]?.closed ?? false} onChange={(e) => setHours(day, "closed", e.target.checked)} />
                        Closed
                      </label>
                      {!form.openingHours[day]?.closed && (
                        <>
                          <input type="time" value={form.openingHours[day]?.open ?? "14:00"} onChange={(e) => setHours(day, "open", e.target.value)} className="px-2 py-1 text-xs border rounded focus:outline-none" style={inputStyle} />
                          <span className="text-xs" style={{ color: "#5A3A2E50" }}>to</span>
                          <input type="time" value={form.openingHours[day]?.close ?? "23:00"} onChange={(e) => setHours(day, "close", e.target.value)} className="px-2 py-1 text-xs border rounded focus:outline-none" style={inputStyle} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md" style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}>
                {editingBranch ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingBranch(null); }} className="px-5 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md border" style={{ borderColor: "#5A3A2E30", color: "#5A3A2E", fontFamily: "var(--font-body)" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} />
          ))
        ) : branches && branches.length > 0 ? (
          branches.map((branch) => (
            <div key={branch.id} className="p-5 rounded-lg border" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{branch.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" style={{ color: "#5A3A2E50" }} />
                    <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{branch.address}</p>
                  </div>
                </div>
                <span className={`text-[9px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full`} style={{
                  fontFamily: "var(--font-body)",
                  backgroundColor: branch.isActive ? "#E8F5E9" : "#FFF3E0",
                  color: branch.isActive ? "#2E7D32" : "#E65100",
                }}>
                  {branch.isActive ? "Active" : "Open Soon"}
                </span>
              </div>

              {branch.isActive && branch.openingHours ? (
                <div className="flex items-center gap-2 text-xs mb-3" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>
                  <Clock className="w-3 h-3" />
                  <span>
                    {(() => {
                      const hours = branch.openingHours as Record<string, { open: string; close: string; closed?: boolean }>;
                      const monday = hours?.monday;
                      if (monday && !monday.closed) {
                        return `${monday.open} – ${monday.close}`;
                      }
                      return "Hours vary";
                    })()}
                  </span>
                </div>
              ) : !branch.isActive ? (
                <p className="text-xs mb-3 italic" style={{ fontFamily: "var(--font-body)", color: "#E65100" }}>
                  Coming soon — stay tuned!
                </p>
              ) : null}

              {branch.isActive && branch.openingHours && (
                <div className="flex items-center gap-2 text-xs mb-3" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E40" }}>
                  <span>{branch.pickupSlotDuration}min slots | Max {branch.maxBookingsPerSlot}/slot | {branch.minPrepNoticeHours}h notice</span>
                </div>
              )}

              <button onClick={() => handleEdit(branch)} className="flex items-center gap-1 text-[11px] uppercase tracking-[0.04em] hover:opacity-70 transition-opacity" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-sm rounded-lg border" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50", borderColor: "#5A3A2E10" }}>
            No branches yet. Add your first branch to enable cake bookings.
          </div>
        )}
      </div>
    </div>
  );
}
