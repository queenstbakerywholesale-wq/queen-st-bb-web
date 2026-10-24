import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, RefreshCw, X, Clock3, Users, FileSpreadsheet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { WEEKDAYS, addCalendarDays, mondayOf, melbourneToday, blocksForDay, summarizeStaff, scheduledHours, staffColor, branchLabel, safeCsvCell, type CalendarShift } from "@/lib/shiftCalendar";
import "./staffCalendar.css";

interface StaffShiftsProps { branchId: number; staffId: number; role: "staff" | "manager" | "owner"; }
const statuses = { scheduled: "예정", confirmed: "확정", completed: "완료", cancelled: "취소", no_show: "미출근" };
type ShiftStatus = keyof typeof statuses;
const emptyForm = { staffId: 0, date: "", startTime: "12:00", endTime: "20:00", status: "scheduled" as ShiftStatus, notes: "" };

function download(url: string, filename: string) {
  const a = document.createElement("a"); a.href = url; a.download = filename; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
}

export default function StaffShifts({ branchId, staffId, role }: StaffShiftsProps) {
  const [selectedBranch, setSelectedBranch] = useState(branchId);
  const [anchorDate, setAnchorDate] = useState(() => melbourneToday());
  const [view, setView] = useState<"calendar" | "staff">("calendar");
  const [editor, setEditor] = useState<{ id?: number } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [workbook, setWorkbook] = useState<{ url: string; filename: string } | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);
  const [swapShift, setSwapShift] = useState<number | null>(null);
  const [swapTarget, setSwapTarget] = useState(0);
  const [swapReason, setSwapReason] = useState("");
  const canEdit = role === "owner" || (role === "manager" && selectedBranch === branchId);
  const canSeeWages = role === "owner";
  const today = melbourneToday();
  const days = useMemo(() => { const start = mondayOf(anchorDate); return Array.from({ length: 7 }, (_, i) => addCalendarDays(start, i)); }, [anchorDate]);
  const { data: branches = [], isLoading: branchesLoading } = trpc.shifts.listBranches.useQuery();
  const { data: allShifts = [], isLoading, error, refetch, isFetching } = trpc.shifts.listByBranch.useQuery(
    { branchId: selectedBranch, startDate: addCalendarDays(days[0], -1), endDate: days[6] },
    { enabled: !!selectedBranch, refetchOnWindowFocus: true, refetchInterval: 30000 }
  );
  const { data: staffList = [] } = trpc.shifts.listStaff.useQuery({ branchId: selectedBranch }, { enabled: !!selectedBranch });
  const { data: swaps = [], refetch: refetchSwaps } = trpc.shifts.listSwapRequests.useQuery({ branchId: selectedBranch }, { enabled: !!selectedBranch });
  const shifts = allShifts as CalendarShift[];
  const weekShifts = shifts.filter(s => s.date >= days[0] && s.date <= days[6]);
  const summary = useMemo(() => summarizeStaff(weekShifts, days), [allShifts, days]);
  const totalHours = summary.reduce((sum, row) => sum + row.hours, 0);
  const totalWages = summary.reduce((sum, row) => sum + row.wage, 0);
  const selectedBranchName = branchLabel(branches.find(b => b.id === selectedBranch)?.name || "지점");
  const dayBlocks = useMemo(() => days.map(day => blocksForDay(shifts, day)), [allShifts, days]);
  const startHour = Math.min(8, ...dayBlocks.flatMap(blocks => blocks.map(b => Math.floor(b.start / 60))));
  const endHour = Math.max(22, ...dayBlocks.flatMap(blocks => blocks.map(b => Math.ceil(b.end / 60))));
  const hourHeight = 52;
  const timelineHeight = (endHour - startHour) * hourHeight;

  useEffect(() => { setWorkbook(null); }, [selectedBranch, anchorDate]);
  const saved = (data: { workbook?: { url: string; filename: string } | null; workbookError?: string }) => {
    setEditor(null); void refetch(); void refetchSwaps();
    toast.success("근무 시간이 서버에 저장됐습니다.");
    if (data.workbook) { setWorkbook(data.workbook); if (autoDownload) download(data.workbook.url, data.workbook.filename); }
    if (data.workbookError) toast.warning("근무 시간은 저장됐지만 Excel 생성에 실패했습니다. Excel 다운로드로 다시 시도하세요.");
  };
  const create = trpc.shifts.create.useMutation({ onSuccess: saved, onError: e => toast.error(e.message) });
  const update = trpc.shifts.update.useMutation({ onSuccess: saved, onError: e => toast.error(e.message) });
  const remove = trpc.shifts.delete.useMutation({ onSuccess: saved, onError: e => toast.error(e.message) });
  const exportExcel = trpc.shifts.exportWorkbook.useMutation({ onSuccess: data => { setWorkbook(data); download(data.url, data.filename); toast.success("최신 근무시간 Excel 파일을 생성했습니다."); }, onError: e => toast.error(e.message) });
  const requestSwap = trpc.shifts.requestSwap.useMutation({ onSuccess: () => { setSwapShift(null); void refetchSwaps(); toast.success("교대 요청을 보냈습니다."); }, onError: e => toast.error(e.message) });
  const respondSwap = trpc.shifts.respondSwap.useMutation({ onSuccess: () => { void refetchSwaps(); void refetch(); toast.success("교대 요청을 처리했습니다."); }, onError: e => toast.error(e.message) });
  const busy = create.isPending || update.isPending || remove.isPending;

  function openNew(date = days[0], time = "12:00") { setForm({ ...emptyForm, date, startTime: time }); setEditor({}); }
  function openEdit(shift: CalendarShift) { setForm({ staffId: shift.staffId, date: shift.date, startTime: shift.startTime, endTime: shift.endTime, status: shift.status as ShiftStatus, notes: shift.notes || "" }); setEditor({ id: shift.id }); }
  function submit() {
    if (!form.staffId || !form.date || !form.startTime || !form.endTime) return toast.error("직원·날짜·시작·종료 시간을 입력하세요.");
    if (form.startTime === form.endTime) return toast.error("시작 시간과 종료 시간은 달라야 합니다.");
    if (editor?.id) update.mutate({ id: editor.id, ...form });
    else create.mutate({ branchId: selectedBranch, staffId: form.staffId, date: form.date, startTime: form.startTime, endTime: form.endTime, notes: form.notes || undefined });
  }
  function exportCsv() {
    const header = ["Branch", "Date", "Weekday", "Staff ID", "Staff", "Start", "End", "Scheduled Hours", "Status", "Notes"];
    if (canSeeWages) header.push("Hourly Rate (AUD)", "Estimated Wage (AUD)");
    const rows = weekShifts.map(shift => {
      const hours = ["cancelled", "no_show"].includes(shift.status) ? 0 : scheduledHours(shift.startTime, shift.endTime);
      const row: unknown[] = [selectedBranchName, shift.date, WEEKDAYS[days.indexOf(shift.date)], shift.staffId, shift.staffName, shift.startTime, shift.endTime, hours.toFixed(2), shift.status, shift.notes || ""];
      if (canSeeWages) row.push(shift.hourlyRate || "", (hours * Number(shift.hourlyRate || 0)).toFixed(2));
      return row;
    });
    const content = "\uFEFF" + [header, ...rows].map(row => row.map(safeCsvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" })); download(url, `Queenst-BB-shifts-${selectedBranch}-${days[0]}.csv`); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return <div className="staff-calendar">
    <div className="sc-heading"><div><div className="sc-eyebrow">QUEENST.BB · TEAM ROSTER</div><h2><CalendarDays size={25} /> 직원 스케줄</h2><p>멜버른 시간 기준 · 시간 입력 후 서버 저장 · 직원별 근무시간 자동 합산</p></div>
      <div className="sc-actions"><button className="sc-button" onClick={() => void refetch()} aria-label="새로고침"><RefreshCw size={15} className={isFetching ? "sc-spin" : ""} /></button><button className="sc-button" onClick={exportCsv} disabled={isLoading || !!error}><Download size={15} />CSV</button><button className="sc-button sc-excel" disabled={exportExcel.isPending || isLoading || !!error} onClick={() => exportExcel.mutate({ branchId: selectedBranch, startDate: days[0], endDate: days[6] })}><FileSpreadsheet size={16} />{exportExcel.isPending ? "생성 중…" : "Excel 다운로드"}</button>{canEdit && <button className="sc-button sc-primary" onClick={() => openNew()}><Plus size={16} /> 근무시간 입력</button>}</div>
    </div>
    <div className="sc-branch-tabs" aria-label="지점 선택">{branchesLoading ? <span>지점 불러오는 중…</span> : [...branches].sort((a, b) => (/CBD/i.test(a.name) ? -1 : /CBD/i.test(b.name) ? 1 : a.id - b.id)).map(b => <button key={b.id} onClick={() => setSelectedBranch(b.id)} className={selectedBranch === b.id ? "active" : ""}><span className={`sc-branch-dot sc-branch-${b.id}`} />{branchLabel(b.name)}{b.id === branchId && <small>내 지점</small>}</button>)}</div>
    <div className="sc-stats"><div><span><Clock3 size={14} /> 총 예정 근무시간</span><strong>{totalHours.toFixed(2)}<small>시간</small></strong></div><div><span><Users size={14} /> 근무 직원</span><strong>{summary.length}<small>명 · {summary.reduce((n, r) => n + r.shifts, 0)}개 시프트</small></strong></div>{canSeeWages && <div><span>예상 기본 웨이지</span><strong><small>AUD</small> {totalWages.toFixed(2)}</strong></div>}<div className="sc-save-note"><span>서버 저장 / 자동 Excel</span><p>근무시간을 저장하면 지점별 주간 Excel도 자동 생성·보관됩니다.</p>{workbook && <a href={workbook.url} target="_blank" rel="noreferrer">저장된 Excel 열기 ↗</a>}</div></div>
    {canSeeWages && <p className="sc-footnote">예정 근무시간 × 설정된 기본 시급의 추정액입니다. 실제 출퇴근·휴게시간·가산수당·Super는 포함하지 않습니다.{summary.some(r => r.rateMissing) && " 시급 미설정 직원이 있습니다. 관리자 Staff에서 시급을 입력하세요."}</p>}
    <div className="sc-toolbar"><div className="sc-week-nav"><button className="sc-icon" onClick={() => setAnchorDate(addCalendarDays(days[0], -7))} aria-label="지난 주"><ChevronLeft size={19} /></button><button className="sc-button" onClick={() => setAnchorDate(today)}>이번 주</button><button className="sc-icon" onClick={() => setAnchorDate(addCalendarDays(days[0], 7))} aria-label="다음 주"><ChevronRight size={19} /></button><strong>{days[0].replaceAll("-", ".")} — {days[6].slice(5).replace("-", ".")}</strong><input aria-label="보고 싶은 날짜" type="date" value={anchorDate} onChange={e => { if (e.target.value) setAnchorDate(e.target.value); }} /></div><div className="sc-view-toggle"><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>주간 캘린더</button><button className={view === "staff" ? "active" : ""} onClick={() => setView("staff")}>직원별 시간표</button></div></div>
    <div className="sc-legend">{staffList.map(s => <span key={s.id}><i style={{ background: staffColor(s.id) }} />{s.displayName}{s.id === staffId ? " (나)" : ""}</span>)}{!canEdit && <em>열람 모드 · 입력 및 수정은 해당 지점 매니저 또는 Angela 계정에서 가능합니다.</em>}</div>
    {error ? <div className="sc-empty sc-error">스케줄을 불러오지 못했습니다. {error.message}<button className="sc-button" onClick={() => void refetch()}>다시 시도</button></div> : isLoading ? <div className="sc-empty">스케줄을 불러오는 중입니다…</div> : <>
      {view === "calendar" && <div className="sc-grid-scroll"><div className="sc-grid">
        <div className="sc-time-header">GMT<br />Melbourne</div>{days.map((day, i) => <div key={day} className={`sc-day-heading ${day === today ? "today" : ""}`}><span>{WEEKDAYS[i]}</span><strong>{Number(day.slice(8))}</strong><small>{summary.reduce((n, r) => n + r.days[i], 0).toFixed(1)}h</small>{canEdit && <button aria-label={`${day} 근무 추가`} onClick={() => openNew(day)}>+</button>}</div>)}
        <div className="sc-time-axis" style={{ height: timelineHeight }}>{Array.from({ length: endHour - startHour + 1 }, (_, i) => <span key={i} style={{ top: i * hourHeight }}>{String(startHour + i).padStart(2, "0")}:00</span>)}</div>
        {days.map((day, index) => <div key={day} className={`sc-day-column ${day === today ? "today" : ""}`} style={{ height: timelineHeight, backgroundSize: `100% ${hourHeight}px` }}>
          {canEdit && Array.from({ length: endHour - startHour }, (_, hour) => <button key={hour} className="sc-hour-slot" style={{ top: hour * hourHeight, height: hourHeight }} onClick={() => openNew(day, `${String(startHour + hour).padStart(2, "0")}:00`)} aria-label={`${day} ${startHour + hour}시 근무 입력`} />)}
          {dayBlocks[index].map(block => <button key={`${block.shift.id}-${block.start}`} className={`sc-shift-block ${block.shift.staffId === staffId ? "mine" : ""}`} style={{ top: (block.start / 60 - startHour) * hourHeight + 2, height: Math.max(22, (block.end - block.start) / 60 * hourHeight - 4), left: `${block.lane / block.lanes * 100}%`, width: `calc(${100 / block.lanes}% - 5px)`, background: `${staffColor(block.shift.staffId)}18`, borderColor: staffColor(block.shift.staffId), color: staffColor(block.shift.staffId) }} onClick={() => openEdit(block.shift)} title={`${block.shift.staffName} · ${block.shift.startTime}–${block.shift.endTime} · ${statuses[block.shift.status as ShiftStatus]}`}><strong>{block.shift.staffName}</strong><span>{block.shift.startTime}–{block.shift.endTime}{block.overnight ? " (+1일)" : ""}</span><small>{scheduledHours(block.shift.startTime, block.shift.endTime).toFixed(2)}h · {statuses[block.shift.status as ShiftStatus]}</small>{block.shift.notes && <em>{block.shift.notes}</em>}</button>)}
        </div>)}
      </div></div>}
      {view === "staff" && <div className="sc-table-wrap"><table className="sc-table"><thead><tr><th>직원</th>{days.map((day, i) => <th key={day}>{WEEKDAYS[i]} {day.slice(5)}</th>)}<th>합계</th>{canSeeWages && <th>예상 웨이지</th>}</tr></thead><tbody>{summary.map(row => <tr key={row.id}><th><i style={{ background: staffColor(row.id) }} />{row.name}</th>{days.map((day, i) => <td key={day}>{weekShifts.filter(s => s.staffId === row.id && s.date === day && !["cancelled", "no_show"].includes(s.status)).map(s => <button onClick={() => openEdit(s)} key={s.id}>{s.startTime}–{s.endTime}</button>)}<small>{row.days[i] ? `${row.days[i].toFixed(2)}h` : "—"}</small></td>)}<td><strong>{row.hours.toFixed(2)}h</strong></td>{canSeeWages && <td>AUD {row.wage.toFixed(2)}</td>}</tr>)}<tr className="sc-total"><th>지점 합계</th>{days.map((d, i) => <td key={d}>{summary.reduce((n, r) => n + r.days[i], 0).toFixed(2)}h</td>)}<td>{totalHours.toFixed(2)}h</td>{canSeeWages && <td>AUD {totalWages.toFixed(2)}</td>}</tr></tbody></table></div>}
      {!weekShifts.length && <div className="sc-empty">{selectedBranchName}의 이번 주 근무가 아직 없습니다.{canEdit && <button className="sc-button" onClick={() => openNew()}>첫 근무시간 입력하기</button>}</div>}
      {weekShifts.some(s => ["cancelled", "no_show"].includes(s.status)) && <details className="sc-excluded"><summary>취소·미출근 기록 (합계에서 제외)</summary>{weekShifts.filter(s => ["cancelled", "no_show"].includes(s.status)).map(s => <button key={s.id} onClick={() => openEdit(s)}>{s.date} · {s.staffName} · {s.startTime}–{s.endTime} · {statuses[s.status as ShiftStatus]}</button>)}</details>}
    </>}
    {swaps.length > 0 && <section className="sc-swaps"><h3>교대 요청</h3>{swaps.map(req => <div key={req.id}><p>{req.requesterName} · {req.shift?.date} {req.shift?.startTime}–{req.shift?.endTime}{req.targetStaffName && ` → ${req.targetStaffName}`}<small>{req.reason}</small></p><span>{req.status}</span>{req.status === "pending" && (canEdit || req.targetStaffId === staffId) && <><button onClick={() => respondSwap.mutate({ id: req.id, status: "accepted" })} disabled={respondSwap.isPending}>승인</button><button onClick={() => respondSwap.mutate({ id: req.id, status: "rejected" })} disabled={respondSwap.isPending}>거절</button></>}</div>)}</section>}
    {canEdit && <label className="sc-auto-download"><input type="checkbox" checked={autoDownload} onChange={e => setAutoDownload(e.target.checked)} /> 저장할 때 내 기기에도 Excel 자동 다운로드 <small>(브라우저 다운로드 허용 필요)</small></label>}
    {editor && <div className="sc-modal-backdrop" onClick={() => !busy && setEditor(null)}><section className="sc-modal" role="dialog" aria-modal="true" aria-label="근무시간 입력" onClick={e => e.stopPropagation()}><header><div><small>{selectedBranchName}</small><h3>{editor.id ? canEdit ? "근무시간 수정" : "근무 상세" : "근무시간 입력"}</h3></div><button onClick={() => setEditor(null)} aria-label="닫기"><X size={20} /></button></header><label>직원<select aria-label="직원" value={form.staffId} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, staffId: Number(e.target.value) }))}><option value={0}>직원 선택</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}{!staffList.some(s => s.id === form.staffId) && form.staffId > 0 && <option value={form.staffId}>{shifts.find(s => s.staffId === form.staffId)?.staffName}</option>}</select></label><label>근무 시작 날짜<input aria-label="근무 시작 날짜" type="date" value={form.date} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></label><div className="sc-form-pair"><label>시작 시간<input aria-label="시작 시간" type="time" value={form.startTime} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></label><label>종료 시간<input aria-label="종료 시간" type="time" value={form.endTime} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></label></div><p className="sc-duration"><Clock3 size={15} /> 예정 {scheduledHours(form.startTime, form.endTime).toFixed(2)}시간{form.endTime < form.startTime && " · 다음 날 종료"}</p>{editor.id && <label>상태<select aria-label="상태" value={form.status} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, status: e.target.value as ShiftStatus }))}>{Object.entries(statuses).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>}<label>메모<textarea aria-label="메모" value={form.notes} maxLength={2000} disabled={!canEdit} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="예: 오픈 / 마감 / 담당 업무" /></label><footer>{canEdit ? <>{editor.id && <button className="sc-delete" disabled={busy} onClick={() => { if (window.confirm("이 근무 기록을 삭제할까요?")) remove.mutate({ id: editor.id! }); }}>삭제</button>}<button className="sc-button" onClick={() => setEditor(null)}>취소</button><button className="sc-button sc-primary" disabled={busy} onClick={submit}>{busy ? "저장 중…" : "저장 + Excel 자동 생성"}</button></> : <>{editor.id && shifts.find(s => s.id === editor.id)?.staffId === staffId && form.status === "scheduled" && <button className="sc-button" onClick={() => { setSwapShift(editor.id!); setEditor(null); }}>교대 요청</button>}<button className="sc-button" onClick={() => setEditor(null)}>닫기</button></>}</footer></section></div>}
    {swapShift && <div className="sc-modal-backdrop"><section className="sc-modal" role="dialog" aria-modal="true" aria-label="교대 요청"><header><h3>교대 요청</h3><button onClick={() => setSwapShift(null)} aria-label="닫기"><X size={20} /></button></header><label>대상 직원<select value={swapTarget} onChange={e => setSwapTarget(Number(e.target.value))}><option value={0}>가능한 직원 누구나</option>{staffList.filter(s => s.id !== staffId).map(s => <option key={s.id} value={s.id}>{s.displayName}</option>)}</select></label><label>이유<input value={swapReason} onChange={e => setSwapReason(e.target.value)} maxLength={2000} /></label><footer><button className="sc-button" onClick={() => setSwapShift(null)}>취소</button><button className="sc-button sc-primary" disabled={requestSwap.isPending} onClick={() => requestSwap.mutate({ shiftId: swapShift, targetStaffId: swapTarget || undefined, reason: swapReason || undefined })}>요청 보내기</button></footer></section></div>}
  </div>;
}
