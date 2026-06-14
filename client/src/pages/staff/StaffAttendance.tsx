/**
 * Staff Attendance — Clock In/Out with photo capture
 * Staff takes a photo in front of the clock when clocking in/out
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface StaffAttendanceProps {
  staffId: number;
  branchId: number;
  displayName: string;
  role: "staff" | "manager";
}

export default function StaffAttendance({ staffId, branchId, displayName, role }: StaffAttendanceProps) {
  const [captureMode, setCaptureMode] = useState<"in" | "out" | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: todayStatus, refetch: refetchStatus } = trpc.attendance.todayStatus.useQuery();

  const clockInMutation = trpc.attendance.clockIn.useMutation({
    onSuccess: (data) => {
      toast.success(`Clocked in at ${new Date(data.clockInTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`);
      refetchStatus();
      stopCamera();
      setCaptureMode(null);
      setPhotoPreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const clockOutMutation = trpc.attendance.clockOut.useMutation({
    onSuccess: (data) => {
      const hours = Math.floor(data.totalMinutes / 60);
      const mins = data.totalMinutes % 60;
      toast.success(`Clocked out! Total: ${hours}h ${mins}m`);
      refetchStatus();
      stopCamera();
      setCaptureMode(null);
      setPhotoPreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch (err) {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    // Add timestamp overlay
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "16px monospace";
    ctx.fillText(new Date().toLocaleString("en-AU"), 10, canvas.height - 15);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoPreview(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitPhoto = () => {
    if (!photoPreview) return;
    if (captureMode === "in") {
      clockInMutation.mutate({ photoBase64: photoPreview });
    } else if (captureMode === "out") {
      clockOutMutation.mutate({ photoBase64: photoPreview });
    }
  };

  const startClockAction = (mode: "in" | "out") => {
    setCaptureMode(mode);
    setPhotoPreview(null);
    startCamera();
  };

  const cancelCapture = () => {
    stopCamera();
    setCaptureMode(null);
    setPhotoPreview(null);
  };

  const isClockedIn = todayStatus?.clockInTime && !todayStatus?.clockOutTime;
  const isClockedOut = todayStatus?.clockOutTime;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-sm font-semibold text-neutral-800 mb-1">Attendance</h2>
      <p className="text-[10px] text-neutral-400 mb-6">{displayName} • {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

      {/* Today's Status Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6 max-w-md">
        <h3 className="text-xs font-medium text-neutral-600 mb-3">Today's Record</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-neutral-400">Clock In</p>
            <p className="text-sm font-medium text-neutral-800">
              {todayStatus?.clockInTime
                ? new Date(todayStatus.clockInTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400">Clock Out</p>
            <p className="text-sm font-medium text-neutral-800">
              {todayStatus?.clockOutTime
                ? new Date(todayStatus.clockOutTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
          </div>
        </div>
        {todayStatus?.totalMinutes && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <p className="text-[10px] text-neutral-400">Total Hours</p>
            <p className="text-sm font-medium text-green-600">
              {Math.floor(todayStatus.totalMinutes / 60)}h {todayStatus.totalMinutes % 60}m
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!captureMode && (
        <div className="flex gap-3 max-w-md">
          {!isClockedIn && !isClockedOut && (
            <button
              onClick={() => startClockAction("in")}
              className="flex-1 py-4 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
            >
              Clock In
            </button>
          )}
          {isClockedIn && (
            <button
              onClick={() => startClockAction("out")}
              className="flex-1 py-4 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
            >
              Clock Out
            </button>
          )}
          {isClockedOut && (
            <div className="flex-1 py-4 bg-neutral-100 text-neutral-500 text-sm font-medium rounded-xl text-center">
              Shift Complete ✓
            </div>
          )}
        </div>
      )}

      {/* Camera / Photo Capture Modal */}
      {captureMode && (
        <div className="max-w-md bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs font-medium text-neutral-700 mb-3">
            {captureMode === "in" ? "📸 Take Clock-In Photo" : "📸 Take Clock-Out Photo"}
          </p>
          <p className="text-[10px] text-neutral-400 mb-3">
            Please take a photo in front of the clock
          </p>

          {!photoPreview ? (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!streaming && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                    Starting camera...
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  disabled={!streaming}
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-medium rounded-lg disabled:opacity-40"
                >
                  📷 Capture
                </button>
                <label className="flex-1 py-3 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg text-center cursor-pointer hover:bg-neutral-200">
                  📁 Upload
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                </label>
                <button
                  onClick={cancelCapture}
                  className="px-4 py-3 text-xs text-neutral-500 border border-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <img src={photoPreview} alt="Preview" className="w-full rounded-lg" />
              <div className="flex gap-2">
                <button
                  onClick={submitPhoto}
                  disabled={clockInMutation.isPending || clockOutMutation.isPending}
                  className={`flex-1 py-3 text-white text-xs font-medium rounded-lg disabled:opacity-40 ${
                    captureMode === "in" ? "bg-green-600" : "bg-red-500"
                  }`}
                >
                  {clockInMutation.isPending || clockOutMutation.isPending
                    ? "Submitting..."
                    : captureMode === "in" ? "Confirm Clock In" : "Confirm Clock Out"}
                </button>
                <button
                  onClick={() => { setPhotoPreview(null); startCamera(); }}
                  className="px-4 py-3 text-xs text-neutral-500 border border-neutral-200 rounded-lg"
                >
                  Retake
                </button>
                <button
                  onClick={cancelCapture}
                  className="px-4 py-3 text-xs text-neutral-500 border border-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
