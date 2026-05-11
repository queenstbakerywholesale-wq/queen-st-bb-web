/**
 * GiftCardEditor — Canvas-based drag-and-drop gift card designer
 * Users can:
 * 1. Choose a preset background or upload their own photo
 * 2. Drag & drop stickers/logos onto the card
 * 3. Add custom text overlays
 * 4. Export the final design as a PNG image
 */
import { useRef, useState, useCallback, useEffect } from "react";
import {
  Upload, Type, Image as ImageIcon, Move, Trash2, Download,
  RotateCcw, Plus, Minus, X, Check, Palette,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
type DraggableItem = {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // image-specific
  src?: string;
  // text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
};

type EditorProps = {
  /** Preset background gradient or image URL */
  backgroundGradient?: string;
  backgroundImage?: string;
  /** Card amount */
  amount: number;
  /** Recipient name */
  recipientName?: string;
  /** Personal message */
  personalMessage?: string;
  /** Gift card code (shown on card) */
  code?: string;
  /** Called when user exports the final image */
  onExport?: (dataUrl: string) => void;
  /** Called when user closes the editor */
  onClose?: () => void;
  /** Whether to show in full-screen modal */
  isModal?: boolean;
  /** Pre-loaded sticker URLs (admin-uploaded logos/photos) */
  stickerUrls?: string[];
};

/* ─── Preset Backgrounds ─── */
const PRESET_BACKGROUNDS = [
  { id: "classic", gradient: "linear-gradient(135deg, #3A2A1E 0%, #5A4A3E 50%, #3A2A1E 100%)", label: "Classic" },
  { id: "floral", gradient: "linear-gradient(135deg, #F5E6D3 0%, #E8D5C0 50%, #DCC5A8 100%)", label: "Floral" },
  { id: "minimal", gradient: "linear-gradient(135deg, #FAFAF8 0%, #F0EDE8 50%, #E8E4DD 100%)", label: "Minimal" },
  { id: "celebration", gradient: "linear-gradient(135deg, #5A3A2E 0%, #8B5E3C 50%, #C4956A 100%)", label: "Celebration" },
  { id: "coffee", gradient: "linear-gradient(135deg, #2C1810 0%, #4A2C20 50%, #6B3A28 100%)", label: "Coffee" },
  { id: "dessert", gradient: "linear-gradient(135deg, #F8E8D8 0%, #F0D8C0 50%, #E8C8A8 100%)", label: "Dessert" },
];

const DARK_BACKGROUNDS = ["classic", "coffee", "celebration"];

/* ─── Text Presets ─── */
const TEXT_PRESETS = [
  { text: "Happy Birthday!", fontSize: 28, color: "#FFFFFF" },
  { text: "Congratulations!", fontSize: 24, color: "#FFFFFF" },
  { text: "Thank You!", fontSize: 28, color: "#FFFFFF" },
  { text: "With Love", fontSize: 24, color: "#FFFFFF" },
  { text: "Enjoy!", fontSize: 32, color: "#FFFFFF" },
  { text: "Merry Christmas!", fontSize: 24, color: "#FFFFFF" },
];

/* ─── Default Decorative Stickers (SVG data URLs) ─── */
const DEFAULT_STICKERS: { label: string; src: string }[] = [
  {
    label: "Heart",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 88 C25 65 5 50 5 35 C5 20 18 10 30 10 C40 10 47 15 50 22 C53 15 60 10 70 10 C82 10 95 20 95 35 C95 50 75 65 50 88Z" fill="#C4956A" opacity="0.9"/></svg>')}`,
  },
  {
    label: "Star",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 5 L61 38 L97 38 L68 60 L79 93 L50 73 L21 93 L32 60 L3 38 L39 38Z" fill="#D8C3A8" opacity="0.9"/></svg>')}`,
  },
  {
    label: "Gift Box",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="15" y="40" width="70" height="50" rx="4" fill="#5A3A2E"/><rect x="15" y="35" width="70" height="15" rx="3" fill="#8B5E3C"/><rect x="45" y="35" width="10" height="55" fill="#D8C3A8"/><path d="M50 35 C50 25 40 15 30 20 C20 25 30 35 50 35" fill="#C4956A"/><path d="M50 35 C50 25 60 15 70 20 C80 25 70 35 50 35" fill="#C4956A"/></svg>')}`,
  },
  {
    label: "Cake",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="75" rx="35" ry="8" fill="#8B5E3C"/><rect x="20" y="50" width="60" height="25" rx="4" fill="#F5E6D3"/><rect x="25" y="42" width="50" height="12" rx="3" fill="#E8D5C0"/><path d="M30 42 Q40 35 50 42 Q60 35 70 42" fill="#C4956A"/><rect x="48" y="28" width="4" height="14" fill="#D8C3A8"/><circle cx="50" cy="25" r="4" fill="#FFD700"/></svg>')}`,
  },
  {
    label: "Coffee Cup",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M25 35 L30 85 C30 90 70 90 70 85 L75 35Z" fill="#5A3A2E"/><path d="M75 45 C85 45 90 55 85 65 C80 70 75 65 75 65" fill="none" stroke="#5A3A2E" stroke-width="4"/><ellipse cx="50" cy="35" rx="25" ry="5" fill="#3A2A1E"/><path d="M35 20 Q38 10 42 20" fill="none" stroke="#D8C3A8" stroke-width="2" opacity="0.6"/><path d="M48 15 Q51 5 54 15" fill="none" stroke="#D8C3A8" stroke-width="2" opacity="0.6"/><path d="M60 20 Q63 10 66 20" fill="none" stroke="#D8C3A8" stroke-width="2" opacity="0.6"/></svg>')}`,
  },
  {
    label: "Ribbon",
    src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10 30 Q30 10 50 30 Q70 50 90 30" fill="none" stroke="#C4956A" stroke-width="8" stroke-linecap="round"/><path d="M5 35 L20 50 L15 35Z" fill="#C4956A"/><path d="M95 35 L80 50 L85 35Z" fill="#C4956A"/></svg>')}`,
  },
];

const CANVAS_W = 800;
const CANVAS_H = 500;
const DISPLAY_SCALE = 0.55; // scale for on-screen display

export default function GiftCardEditor({
  backgroundGradient,
  backgroundImage,
  amount,
  recipientName,
  personalMessage,
  code,
  onExport,
  onClose,
  isModal = false,
  stickerUrls = [],
}: EditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<DraggableItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgType, setBgType] = useState<"preset" | "custom">(backgroundImage ? "custom" : "preset");
  const [selectedPreset, setSelectedPreset] = useState(
    PRESET_BACKGROUNDS.find((p) => p.gradient === backgroundGradient)?.id || "classic"
  );
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(backgroundImage || null);
  const [customBgImg, setCustomBgImg] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"backgrounds" | "stickers" | "text">("backgrounds");
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [editingText, setEditingText] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState("");

  // Load custom background image
  useEffect(() => {
    if (customBgUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setCustomBgImg(img);
      img.src = customBgUrl;
    } else {
      setCustomBgImg(null);
    }
  }, [customBgUrl]);

  // Load sticker images
  useEffect(() => {
    items.forEach((item) => {
      if (item.type === "image" && item.src && !loadedImages.has(item.src)) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setLoadedImages((prev) => new Map(prev).set(item.src!, img));
        };
        img.src = item.src;
      }
    });
  }, [items, loadedImages]);

  /* ─── Canvas Rendering ─── */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 1. Draw background
    if (bgType === "custom" && customBgImg) {
      // Cover-fit the image
      const imgRatio = customBgImg.width / customBgImg.height;
      const canvasRatio = CANVAS_W / CANVAS_H;
      let sx = 0, sy = 0, sw = customBgImg.width, sh = customBgImg.height;
      if (imgRatio > canvasRatio) {
        sw = customBgImg.height * canvasRatio;
        sx = (customBgImg.width - sw) / 2;
      } else {
        sh = customBgImg.width / canvasRatio;
        sy = (customBgImg.height - sh) / 2;
      }
      ctx.drawImage(customBgImg, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
      // Slight overlay for text readability
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      const preset = PRESET_BACKGROUNDS.find((p) => p.id === selectedPreset) || PRESET_BACKGROUNDS[0];
      // Parse gradient colors
      const colors = preset.gradient.match(/#[A-Fa-f0-9]{6}/g) || ["#3A2A1E", "#5A4A3E", "#3A2A1E"];
      const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // 2. Draw draggable items (images & text)
    items.forEach((item) => {
      ctx.save();
      ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);

      if (item.type === "image" && item.src) {
        const img = loadedImages.get(item.src);
        if (img) {
          ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
        }
      } else if (item.type === "text" && item.text) {
        ctx.font = `${item.fontSize || 24}px '${item.fontFamily || "Playfair Display"}', Georgia, serif`;
        ctx.fillStyle = item.color || "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Text shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(item.text, 0, 0);
        ctx.shadowColor = "transparent";
      }

      // Selection border
      if (item.id === selectedId) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(-item.width / 2 - 4, -item.height / 2 - 4, item.width + 8, item.height + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // 3. Draw fixed card elements (brand, amount, code)
    const isDark = bgType === "custom" || DARK_BACKGROUNDS.includes(selectedPreset);
    const textColor = isDark ? "#FFFFFF" : "#3A2A1E";
    const subtextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(58,42,30,0.6)";
    const accentColor = isDark ? "#D8C3A8" : "#8B6B4A";

    // Brand
    ctx.font = "500 28px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.fillText("Queen St BB", 40, 55);

    ctx.font = "500 10px 'Inter', Arial, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText("GIFT CARD", 40, 75);

    // Amount
    ctx.font = "500 48px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = accentColor;
    ctx.textAlign = "right";
    ctx.fillText(`$${amount}`, CANVAS_W - 40, 60);

    ctx.font = "500 12px 'Inter', Arial, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText("AUD", CANVAS_W - 40, 82);

    // Recipient & message
    ctx.textAlign = "left";
    if (recipientName) {
      ctx.font = "500 16px 'Inter', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.fillText(`For: ${recipientName}`, 40, CANVAS_H - 100);
    }
    if (personalMessage) {
      ctx.font = "italic 13px 'Inter', Arial, sans-serif";
      ctx.fillStyle = subtextColor;
      const msg = personalMessage.length > 80 ? personalMessage.slice(0, 80) + "..." : personalMessage;
      ctx.fillText(`"${msg}"`, 40, CANVAS_H - 72);
    }

    // Code
    if (code) {
      ctx.font = "500 14px 'Courier New', monospace";
      ctx.fillStyle = subtextColor;
      ctx.fillText(code, 40, CANVAS_H - 30);
    }

    ctx.textAlign = "right";
    ctx.font = "500 10px 'Inter', Arial, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText("A DESSERT ATELIER", CANVAS_W - 40, CANVAS_H - 30);
  }, [items, selectedId, bgType, selectedPreset, customBgImg, loadedImages, amount, recipientName, personalMessage, code]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  /* ─── Mouse Handlers ─── */
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    // Check items in reverse order (top-most first)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
        setSelectedId(item.id);
        setIsDragging(true);
        setDragOffset({ x: x - item.x, y: y - item.y });
        return;
      }
    }
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId) return;
    const { x, y } = getCanvasCoords(e);
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              x: Math.max(0, Math.min(CANVAS_W - item.width, x - dragOffset.x)),
              y: Math.max(0, Math.min(CANVAS_H - item.height, y - dragOffset.y)),
            }
          : item
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /* ─── Touch Handlers (mobile) ─── */
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (touch.clientY - rect.top) * (CANVAS_H / rect.height);
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
        setSelectedId(item.id);
        setIsDragging(true);
        setDragOffset({ x: x - item.x, y: y - item.y });
        e.preventDefault();
        return;
      }
    }
    setSelectedId(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (touch.clientY - rect.top) * (CANVAS_H / rect.height);
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              x: Math.max(0, Math.min(CANVAS_W - item.width, x - dragOffset.x)),
              y: Math.max(0, Math.min(CANVAS_H - item.height, y - dragOffset.y)),
            }
          : item
      )
    );
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  /* ─── Item Actions ─── */
  const addSticker = (src: string) => {
    const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [
      ...prev,
      { id, type: "image", src, x: CANVAS_W / 2 - 60, y: CANVAS_H / 2 - 60, width: 120, height: 120, rotation: 0 },
    ]);
    setSelectedId(id);
  };

  const addTextItem = (preset?: typeof TEXT_PRESETS[0]) => {
    const id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isDark = bgType === "custom" || DARK_BACKGROUNDS.includes(selectedPreset);
    setItems((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: preset?.text || "Your Text",
        x: CANVAS_W / 2 - 100,
        y: CANVAS_H / 2 - 20,
        width: 200,
        height: 40,
        rotation: 0,
        fontSize: preset?.fontSize || 24,
        fontFamily: "Playfair Display",
        color: preset?.color || (isDark ? "#FFFFFF" : "#3A2A1E"),
      },
    ]);
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const resizeSelected = (delta: number) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== selectedId) return item;
        if (item.type === "text") {
          return { ...item, fontSize: Math.max(12, Math.min(72, (item.fontSize || 24) + delta)) };
        }
        const newW = Math.max(30, Math.min(400, item.width + delta * 10));
        const ratio = newW / item.width;
        return { ...item, width: newW, height: item.height * ratio };
      })
    );
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, rotation: (item.rotation + 15) % 360 } : item
      )
    );
  };

  /* ─── File Upload Handlers ─── */
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBgUrl(reader.result as string);
      setBgType("custom");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Sticker must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addSticker(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ─── Export ─── */
  const handleExport = () => {
    // Deselect to remove selection border
    setSelectedId(null);
    // Use requestAnimationFrame to ensure canvas re-renders without selection
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        if (onExport) {
          onExport(dataUrl);
        } else {
          // Direct download
          const link = document.createElement("a");
          link.download = `queen-st-bb-gift-card-custom.png`;
          link.href = dataUrl;
          link.click();
          toast.success("Gift card image downloaded!");
        }
      });
    });
  };

  const selectedItem = items.find((i) => i.id === selectedId);

  /* ─── Inline text editing ─── */
  const startEditText = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.type === "text") {
      setEditingText(id);
      setEditTextValue(item.text || "");
    }
  };

  const commitEditText = () => {
    if (editingText && editTextValue.trim()) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingText
            ? {
                ...item,
                text: editTextValue.trim(),
                width: Math.max(item.width, editTextValue.trim().length * ((item.fontSize || 24) * 0.6)),
              }
            : item
        )
      );
    }
    setEditingText(null);
    setEditTextValue("");
  };

  const content = (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas Area */}
      <div className="flex-1">
        <div
          className="relative mx-auto rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: CANVAS_W * DISPLAY_SCALE,
            height: CANVAS_H * DISPLAY_SCALE,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={() => {
              if (selectedId) {
                const item = items.find((i) => i.id === selectedId);
                if (item?.type === "text") startEditText(selectedId);
              }
            }}
          />
        </div>

        {/* Item Controls */}
        {selectedItem && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => resizeSelected(-1)}
              className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#E8DDD0" }}
              title="Smaller"
            >
              <Minus size={14} style={{ color: "#5A4A3E" }} />
            </button>
            <button
              onClick={() => resizeSelected(1)}
              className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#E8DDD0" }}
              title="Bigger"
            >
              <Plus size={14} style={{ color: "#5A4A3E" }} />
            </button>
            <button
              onClick={rotateSelected}
              className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#E8DDD0" }}
              title="Rotate"
            >
              <RotateCcw size={14} style={{ color: "#5A4A3E" }} />
            </button>
            {selectedItem.type === "text" && (
              <button
                onClick={() => startEditText(selectedItem.id)}
                className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
                style={{ borderColor: "#E8DDD0" }}
                title="Edit Text"
              >
                <Type size={14} style={{ color: "#5A4A3E" }} />
              </button>
            )}
            <button
              onClick={deleteSelected}
              className="p-2 rounded-lg border transition-colors hover:bg-red-50"
              style={{ borderColor: "#E8DDD0" }}
              title="Delete"
            >
              <Trash2 size={14} style={{ color: "#C62828" }} />
            </button>
          </div>
        )}

        {/* Text editing modal */}
        {editingText && (
          <div className="flex items-center gap-2 mt-3 max-w-md mx-auto">
            <input
              type="text"
              value={editTextValue}
              onChange={(e) => setEditTextValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitEditText(); }}
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "#E8DDD0", color: "#3A2A1E", fontFamily: "var(--font-body)" }}
              autoFocus
              maxLength={60}
            />
            <button onClick={commitEditText} className="p-2 rounded-lg" style={{ backgroundColor: "#3A2A1E" }}>
              <Check size={14} color="#FFFFFF" />
            </button>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-center mt-5">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm uppercase tracking-wider transition-all hover:opacity-90"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              backgroundColor: "#3A2A1E",
              color: "#FFFFFF",
              letterSpacing: "0.06em",
            }}
          >
            <Download size={16} />
            Download Card
          </button>
        </div>
      </div>

      {/* Sidebar Tools */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "#F0EDE8" }}>
          {(["backgrounds", "stickers", "text"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-[10px] uppercase tracking-wider rounded-md transition-all"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent",
                color: activeTab === tab ? "#3A2A1E" : "#8B7355",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab === "backgrounds" ? "BG" : tab === "stickers" ? "Stickers" : "Text"}
            </button>
          ))}
        </div>

        {/* Backgrounds Tab */}
        {activeTab === "backgrounds" && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
              Preset Backgrounds
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => { setSelectedPreset(bg.id); setBgType("preset"); }}
                  className="aspect-[1.6/1] rounded-md overflow-hidden border-2 transition-all"
                  style={{
                    background: bg.gradient,
                    borderColor: bgType === "preset" && selectedPreset === bg.id ? "#3A2A1E" : "#E8DDD0",
                  }}
                >
                  <span className="text-[7px] uppercase block mt-auto p-1" style={{ color: DARK_BACKGROUNDS.includes(bg.id) ? "rgba(255,255,255,0.7)" : "#5A4A3E" }}>
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
                Custom Background
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-xs transition-colors hover:bg-gray-50"
                style={{ borderColor: "#D8C3A8", color: "#8B7355", fontFamily: "var(--font-body)" }}
              >
                <Upload size={14} />
                Upload Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              {customBgUrl && (
                <button
                  onClick={() => setBgType("custom")}
                  className="w-full mt-2 py-2 rounded-md text-[10px] uppercase tracking-wider border transition-all"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    borderColor: bgType === "custom" ? "#3A2A1E" : "#E8DDD0",
                    backgroundColor: bgType === "custom" ? "#3A2A1E" : "transparent",
                    color: bgType === "custom" ? "#FFFFFF" : "#5A4A3E",
                  }}
                >
                  Use Custom Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stickers Tab */}
        {activeTab === "stickers" && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
              Add Sticker / Logo
            </p>
            <button
              onClick={() => stickerInputRef.current?.click()}
              className="w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-xs transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D8C3A8", color: "#8B7355", fontFamily: "var(--font-body)" }}
            >
              <Upload size={14} />
              Upload Image / Logo
            </button>
            <input ref={stickerInputRef} type="file" accept="image/*" className="hidden" onChange={handleStickerUpload} />

            {/* Default Decorative Stickers */}
            <p className="text-[10px] uppercase tracking-wider pt-2" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
              Decorations
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_STICKERS.map((sticker, i) => (
                <button
                  key={i}
                  onClick={() => addSticker(sticker.src)}
                  className="aspect-square rounded-md border overflow-hidden hover:border-[#3A2A1E] transition-colors p-2 flex items-center justify-center"
                  style={{ borderColor: "#E8DDD0", backgroundColor: "#FAFAF8" }}
                  title={sticker.label}
                >
                  <img src={sticker.src} alt={sticker.label} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {stickerUrls.length > 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider pt-2" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
                  Brand Stickers
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {stickerUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => addSticker(url)}
                      className="aspect-square rounded-md border overflow-hidden hover:border-[#3A2A1E] transition-colors p-1"
                      style={{ borderColor: "#E8DDD0", backgroundColor: "#FAFAF8" }}
                    >
                      <img src={url} alt={`Sticker ${i + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-[9px]" style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}>
              Tip: Upload PNG images with transparent backgrounds for best results. Drag to position, use +/- to resize.
            </p>
          </div>
        )}

        {/* Text Tab */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
              Quick Text
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TEXT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => addTextItem(preset)}
                  className="py-2.5 px-2 rounded-md border text-xs transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E8DDD0", color: "#3A2A1E", fontFamily: "var(--font-body)" }}
                >
                  {preset.text}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#8B7355" }}>
                Custom Text
              </p>
              <button
                onClick={() => addTextItem()}
                className="w-full py-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-xs transition-colors hover:bg-gray-50"
                style={{ borderColor: "#D8C3A8", color: "#8B7355", fontFamily: "var(--font-body)" }}
              >
                <Type size={14} />
                Add Custom Text
              </button>
            </div>

            <p className="text-[9px]" style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}>
              Tip: Double-click text on the card to edit. Use +/- to change size.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8"
          style={{ backgroundColor: "#FAF7F2" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} style={{ color: "#5A4A3E" }} />
          </button>
          <h2
            className="text-xl mb-6"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}
          >
            Customise Your Gift Card
          </h2>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
