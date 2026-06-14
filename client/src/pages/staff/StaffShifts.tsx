/**
 * Staff Shifts — Weekly calendar view for shift management
 * Staff: view own shifts, request swaps
 * Manager: create/edit/delete shifts, approve swaps
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface StaffShiftsProps {
  branchId: number;
  staffId: number;
  role: "staff" | "manager";
}

export default function StaffShifts({ branchId, staffId, role }: StaffShiftsProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ staffId: 0, date: "", startTime: "09:00", endTime: "17:00", notes: "" });
  const [showSwapModal, setShowSwapModal] = useState<number | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [swapTarget, setSwapTarget] = useState<number | undefined>(undefined);

  // Calculate week range
  const weekRange = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    return {
      start: startOfWeek.toISOString().slice(0, 10),
      end: endOfWeek.toISOString().slice(0, 10),
      days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    };
  }, [weekOffset]);

  const { data: shifts = [], refetch: refetchShifts } = trpc.shifts.listByBranch.useQuery(
    { branchId, startDate: weekRange.start, endDate: weekRange.end },
    { enabled: !!branchId }
  );

  const { data: staffList = [] } = trpc.shifts.listStaff.useQuery(
    { branchId },
    { enabled: !!branchId }
  );

  const { data: swapRequests = [], refetch: refetchSwaps } = trpc.shifts.listSwapRequests.useQuery(
    { branchId },
    { enabled: !!branchId }
  );

  const createMutation = trpc.shifts.create.useMutation({
    onSuccess: () => { toast.success("Shift created"); setShowCreateModal(false); refetchShifts(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.shifts.delete.useMutation({
    onSuccess: () => { toast.success("Shift deleted"); refetchShifts(); },
    onError: (e) => toast.error(e.message),
  });

  const swapMutation = trpc.shifts.requestSwap.useMutation({
    onSuccess: () => { toast.success("Swap request sent"); setShowSwapModal(null); refetchSwaps(); },
    onError: (e) => toast.error(e.message),
  });

  const respondSwapMutation = trpc.shifts.respondSwap.useMutation({
    onSuccess: () => { toast.success("Swap request updated"); refetchSwaps(); refetchShifts(); },
    onError: (e) => toast.error(e.message),
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getShiftsForDay = (date: string) => shifts.filter((s: any) => s.date === date);

  const isMyShift = (shift: any) => shift.staffId === staffId;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-800">Shift Schedule</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="px-2 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-50">←</button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-50">Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="px-2 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-50">→</button>
          {role === "manager" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-700"
            >
              + Add Shift
            </button>
          )}
        </div>
      </div>

      {/* Week label */}
      <p className="text-[10px] text-neutral-400 mb-3">
        {new Date(weekRange.start).toLocaleDateString("en-AU", { month: "short", day: "numeric" })} — {new Date(weekRange.end).toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekRange.days.map((date, i) => {
          const dayShifts = getShiftsForDay(date);
          const isToday = date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={date}
              className={`min-h-[120px] rounded-lg border p-2 ${
                isToday ? "border-blue-300 bg-blue-50/50" : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-medium ${isToday ? "text-blue-600" : "text-neutral-500"}`}>
                  {dayNames[i]}
                </span>
                <span className={`text-[10px] ${isToday ? "text-blue-600 font-bold" : "text-neutral-400"}`}>
                  {date.slice(8)}
                </span>
              </div>
              <div className="space-y-1">
                {dayShifts.map((shift: any) => (
                  <div
                    key={shift.id}
                    className={`p-1.5 rounded text-[9px] leading-tight ${
                      isMyShift(shift)
                        ? "bg-blue-100 border border-blue-200 text-blue-800"
                        : "bg-neutral-100 border border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div className="font-medium truncate">{shift.staffName}</div>
                    <div className="text-[8px] opacity-70">{shift.startTime}–{shift.endTime}</div>
                    {isMyShift(shift) && shift.status === "scheduled" && (
                      <button
                        onClick={() => setShowSwapModal(shift.id)}
                        className="mt-0.5 text-[8px] text-orange-600 hover:underline"
                      >
                        Swap
                      </button>
                    )}
                    {role === "manager" && (
                      <button
                        onClick={() => deleteMutation.mutate({ id: shift.id })}
                        className="mt-0.5 text-[8px] text-red-500 hover:underline ml-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Swap Requests Section */}
      {swapRequests.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-neutral-700 mb-2">Swap Requests</h3>
          <div className="space-y-2">
            {swapRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg">
                <div>
                  <p className="text-xs text-neutral-800">
                    <span className="font-medium">{req.requesterName}</span> wants to swap
                    {req.shift && ` (${req.shift.date} ${req.shift.startTime}–${req.shift.endTime})`}
                  </p>
                  {req.targetStaffName && (
                    <p className="text-[10px] text-neutral-500">with {req.targetStaffName}</p>
                  )}
                  {req.reason && <p className="text-[10px] text-neutral-400 italic mt-0.5">{req.reason}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 text-[9px] rounded ${
                    req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    req.status === "accepted" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {req.status}
                  </span>
                  {req.status === "pending" && (role === "manager" || req.targetStaffId === staffId) && (
                    <>
                      <button
                        onClick={() => respondSwapMutation.mutate({ id: req.id, status: "accepted" })}
                        className="px-2 py-0.5 text-[9px] bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondSwapMutation.mutate({ id: req.id, status: "rejected" })}
                        className="px-2 py-0.5 text-[9px] bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-[360px] shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">Add Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1">Staff Member</label>
                <select
                  value={createForm.staffId}
                  onChange={(e) => setCreateForm(f => ({ ...f, staffId: Number(e.target.value) }))}
                  className="w-full p-2 text-xs border border-neutral-200 rounded"
                >
                  <option value={0}>Select staff...</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.displayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full p-2 text-xs border border-neutral-200 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">Start</label>
                  <input
                    type="time"
                    value={createForm.startTime}
                    onChange={(e) => setCreateForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full p-2 text-xs border border-neutral-200 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">End</label>
                  <input
                    type="time"
                    value={createForm.endTime}
                    onChange={(e) => setCreateForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full p-2 text-xs border border-neutral-200 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 text-xs border border-neutral-200 rounded"
                  placeholder="e.g. Opening shift"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 text-xs border border-neutral-200 rounded hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!createForm.staffId || !createForm.date) {
                    toast.error("Please select staff and date");
                    return;
                  }
                  createMutation.mutate({
                    branchId,
                    staffId: createForm.staffId,
                    date: createForm.date,
                    startTime: createForm.startTime,
                    endTime: createForm.endTime,
                    notes: createForm.notes || undefined,
                  });
                }}
                disabled={createMutation.isPending}
                className="flex-1 py-2 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-700 disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-[320px] shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">Request Shift Swap</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1">Swap with (optional)</label>
                <select
                  value={swapTarget || ""}
                  onChange={(e) => setSwapTarget(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full p-2 text-xs border border-neutral-200 rounded"
                >
                  <option value="">Anyone available</option>
                  {staffList.filter((s: any) => s.id !== staffId).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.displayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-1">Reason</label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="w-full p-2 text-xs border border-neutral-200 rounded"
                  placeholder="e.g. Personal appointment"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowSwapModal(null); setSwapReason(""); setSwapTarget(undefined); }}
                className="flex-1 py-2 text-xs border border-neutral-200 rounded hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  swapMutation.mutate({
                    shiftId: showSwapModal,
                    targetStaffId: swapTarget,
                    reason: swapReason || undefined,
                  });
                }}
                disabled={swapMutation.isPending}
                className="flex-1 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-40"
              >
                Request Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
