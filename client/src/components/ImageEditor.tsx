/**
 * ImageEditor — Crop & Rotate editor for admin image uploads
 * Uses react-image-crop for cropping, canvas for rotation
 * Styled to match the Queen St BB admin aesthetic
 */
import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { RotateCw, RotateCcw, Crop as CropIcon, Check, X, RefreshCw } from "lucide-react";

interface ImageEditorProps {
  file: File;
  onConfirm: (editedFile: File) => void;
  onCancel: () => void;
}

/**
 * Convert a PixelCrop + rotation into a new canvas, then return a File.
 */
function getCroppedRotatedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop | null,
  rotation: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const radians = (rotation * Math.PI) / 180;

  // If no crop, use full image
  const sx = crop ? crop.x : 0;
  const sy = crop ? crop.y : 0;
  const sw = crop ? crop.width : image.naturalWidth;
  const sh = crop ? crop.height : image.naturalHeight;

  // After rotation, the bounding box changes
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const outW = Math.round(sw * cos + sh * sin);
  const outH = Math.round(sw * sin + sh * cos);

  canvas.width = outW;
  canvas.height = outH;

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

  return canvas;
}

export default function ImageEditor({ file, onConfirm, onCancel }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load file into data URL
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const handleRotateRight = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((r) => (r - 90 + 360) % 360);
  }, []);

  const handleResetRotation = useCallback(() => {
    setRotation(0);
  }, []);

  const toggleCrop = useCallback(() => {
    if (isCropping) {
      // Exiting crop mode — keep the completedCrop
      setIsCropping(false);
    } else {
      // Entering crop mode
      setCrop(undefined);
      setCompletedCrop(null);
      setIsCropping(true);
    }
  }, [isCropping]);

  const handleClearCrop = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(null);
    setIsCropping(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!imgRef.current) return;

    const canvas = getCroppedRotatedCanvas(
      imgRef.current,
      completedCrop,
      rotation
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = file.name.split(".").pop() || "png";
        const editedFile = new File([blob], `edited-${file.name}`, {
          type: ext === "png" ? "image/png" : "image/jpeg",
        });
        onConfirm(editedFile);
      },
      file.type.startsWith("image/png") ? "image/png" : "image/jpeg",
      0.92
    );
  }, [completedCrop, rotation, file, onConfirm]);

  if (!imageSrc) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ backgroundColor: "oklch(0.15 0.02 45 / 0.85)" }}
      >
        <div
          className="text-sm animate-pulse"
          style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80)" }}
        >
          Loading image...
        </div>
      </div>
    );
  }

  const hasEdits = rotation !== 0 || completedCrop !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: "oklch(0.15 0.02 45 / 0.92)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid oklch(0.94 0.015 80 / 0.1)" }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="text-sm font-light tracking-[0.15em] uppercase"
            style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80)" }}
          >
            Edit Image
          </h2>
          {rotation !== 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: "oklch(0.94 0.015 80 / 0.1)",
                color: "oklch(0.94 0.015 80 / 0.6)",
              }}
            >
              {rotation}°
            </span>
          )}
          {completedCrop && (
            <span
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: "oklch(0.94 0.015 80 / 0.1)",
                color: "oklch(0.94 0.015 80 / 0.6)",
              }}
            >
              {Math.round(completedCrop.width)}×{Math.round(completedCrop.height)}
            </span>
          )}
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-md transition-colors hover:bg-white/10"
          title="Cancel"
        >
          <X className="w-5 h-5" style={{ color: "oklch(0.94 0.015 80 / 0.6)" }} />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto min-h-0">
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          {isCropping ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Edit preview"
                className="max-w-full max-h-[60vh] object-contain"
                style={{ display: "block" }}
              />
            </ReactCrop>
          ) : (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Edit preview"
              className="max-w-full max-h-[60vh] object-contain"
              style={{ display: "block" }}
            />
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="shrink-0 px-6 py-5"
        style={{ borderTop: "1px solid oklch(0.94 0.015 80 / 0.1)" }}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Rotation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRotateLeft}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
              title="Rotate left 90°"
            >
              <RotateCcw className="w-4 h-4" style={{ color: "oklch(0.94 0.015 80 / 0.7)" }} />
              <span
                className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80 / 0.7)" }}
              >
                Left
              </span>
            </button>

            <button
              onClick={handleRotateRight}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
              title="Rotate right 90°"
            >
              <RotateCw className="w-4 h-4" style={{ color: "oklch(0.94 0.015 80 / 0.7)" }} />
              <span
                className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80 / 0.7)" }}
              >
                Right
              </span>
            </button>

            {rotation !== 0 && (
              <button
                onClick={handleResetRotation}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
                title="Reset rotation"
              >
                <RefreshCw className="w-4 h-4" style={{ color: "oklch(0.94 0.015 80 / 0.4)" }} />
                <span
                  className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline"
                  style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80 / 0.4)" }}
                >
                  Reset
                </span>
              </button>
            )}
          </div>

          {/* Crop Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCrop}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isCropping ? "bg-white/15" : "hover:bg-white/10"
              }`}
              title={isCropping ? "Done cropping" : "Start cropping"}
            >
              <CropIcon className="w-4 h-4" style={{ color: "oklch(0.94 0.015 80 / 0.7)" }} />
              <span
                className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80 / 0.7)" }}
              >
                {isCropping ? "Done" : "Crop"}
              </span>
            </button>

            {completedCrop && (
              <button
                onClick={handleClearCrop}
                className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-white/10"
                title="Clear crop"
              >
                <X className="w-4 h-4" style={{ color: "oklch(0.94 0.015 80 / 0.4)" }} />
                <span
                  className="text-[10px] uppercase tracking-[0.1em] hidden sm:inline"
                  style={{ fontFamily: "var(--font-body)", color: "oklch(0.94 0.015 80 / 0.4)" }}
                >
                  Clear
                </span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] rounded-md transition-colors hover:bg-white/10"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.94 0.015 80 / 0.5)",
                border: "1px solid oklch(0.94 0.015 80 / 0.15)",
              }}
            >
              Cancel
            </button>

            <button
              onClick={hasEdits ? handleConfirm : () => onConfirm(file)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.15em] rounded-md transition-all duration-200 hover:opacity-80"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: "oklch(0.34 0.05 45)",
                color: "oklch(0.94 0.015 80)",
              }}
            >
              <Check className="w-3.5 h-3.5" />
              {hasEdits ? "Apply & Upload" : "Upload Original"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
