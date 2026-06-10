/**
 * Admin Page Images — Visual layout showing where each image appears on the site
 * Grouped by page with wireframe-style previews showing exact placement
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ImageEditor from "@/components/ImageEditor";

// ─── Slot definitions with layout context ────────────────────────────
interface SlotDef {
  pageSlug: string;
  slotKey: string;
  label: string;
  description: string;
  aspectRatio: string; // CSS aspect-ratio
  layoutHint: "full-width" | "half" | "third";
}

const PAGE_CONFIG: {
  slug: string;
  title: string;
  description: string;
  slots: SlotDef[];
}[] = [
  {
    slug: "home",
    title: "Homepage",
    description: "Full-screen scrolling sections — each section fills the viewport",
    slots: [
      { pageSlug: "home", slotKey: "hero-main", label: "Section 1 — Hero", description: "Full-screen hero with brand title overlay", aspectRatio: "16/9", layoutHint: "full-width" },
      { pageSlug: "home", slotKey: "hero-tiramisu", label: "Section 2 — Tiramisu", description: "Full-screen tiramisu showcase", aspectRatio: "16/9", layoutHint: "full-width" },
      { pageSlug: "home", slotKey: "hero-gelato", label: "Section 3 — Gelato", description: "Full-screen gelato showcase", aspectRatio: "16/9", layoutHint: "full-width" },
      { pageSlug: "home", slotKey: "hero-space", label: "Section 4 — The Space", description: "Full-screen café interior", aspectRatio: "16/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "tiramisu",
    title: "Tiramisu Page",
    description: "Hero image at the top of the tiramisu product page",
    slots: [
      { pageSlug: "tiramisu", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner at page top", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "gelato",
    title: "Gelato Page",
    description: "Hero image at the top of the gelato product page",
    slots: [
      { pageSlug: "gelato", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner at page top", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "space",
    title: "Space / Experience Page",
    description: "Hero image showcasing the café interior and atmosphere",
    slots: [
      { pageSlug: "space", slotKey: "hero", label: "Hero Image", description: "Full-width hero showing café interior", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "objects",
    title: "Objects (Shop) Page",
    description: "Hero image for the merchandise/goods shop page",
    slots: [
      { pageSlug: "objects", slotKey: "hero", label: "Hero Image", description: "Full-width hero for the shop section", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "wholesale",
    title: "Wholesale & Franchise Page",
    description: "Hero image for the wholesale enquiry page",
    slots: [
      { pageSlug: "wholesale", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "cake-booking",
    title: "Cake Booking Page",
    description: "Hero image for the cake order/booking page",
    slots: [
      { pageSlug: "cake-booking", slotKey: "hero", label: "Hero Image", description: "Full-width hero showing cakes", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "about",
    title: "About Page",
    description: "Hero image for the about/story page",
    slots: [
      { pageSlug: "about", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
  {
    slug: "customer-care",
    title: "Customer Care Page",
    description: "Hero image for the customer care/contact page",
    slots: [
      { pageSlug: "customer-care", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" },
    ],
  },
];

interface PendingEdit {
  file: File;
  pageSlug: string;
  slotKey: string;
}

export default function AdminPageImages() {
  const [expandedPage, setExpandedPage] = useState<string | null>("home");
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const { data: allImages = [], refetch } = trpc.adminPageImages.list.useQuery({});

  const uploadImage = trpc.adminUpload.uploadImage.useMutation();
  const upsertImage = trpc.adminPageImages.upsert.useMutation({
    onSuccess: () => {
      toast.success("Image updated successfully");
      refetch();
    },
  });

  const imageMap = useMemo(() => {
    const map: Record<string, any> = {};
    allImages.forEach((img: any) => {
      map[`${img.pageSlug}/${img.slotKey}`] = img;
    });
    return map;
  }, [allImages]);

  const getImage = (pageSlug: string, slotKey: string) => {
    return imageMap[`${pageSlug}/${slotKey}`];
  };

  const handleUpload = async (file: File, pageSlug: string, slotKey: string) => {
    const slotId = `${pageSlug}/${slotKey}`;
    setUploadingSlot(slotId);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadImage.mutateAsync({
        base64: base64.split(",")[1],
        filename: file.name,
        contentType: file.type,
      });

      const existing = getImage(pageSlug, slotKey);
      await upsertImage.mutateAsync({
        id: existing?.id,
        pageSlug,
        slotKey,
        imageUrl: result.url,
        storageKey: result.key,
        altText: `${pageSlug} ${slotKey}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleFileSelected = (file: File, pageSlug: string, slotKey: string) => {
    setPendingEdit({ file, pageSlug, slotKey });
  };

  const handleEditorConfirm = (editedFile: File) => {
    if (!pendingEdit) return;
    setPendingEdit(null);
    handleUpload(editedFile, pendingEdit.pageSlug, pendingEdit.slotKey);
  };

  const handleEditorCancel = () => {
    setPendingEdit(null);
  };

  // Count images set per page
  const getPageImageCount = (slug: string) => {
    const page = PAGE_CONFIG.find((p) => p.slug === slug);
    if (!page) return { set: 0, total: 0 };
    const total = page.slots.length;
    const set = page.slots.filter((s) => getImage(s.pageSlug, s.slotKey)).length;
    return { set, total };
  };

  return (
    <div className="space-y-6">
      {/* Image Editor Modal */}
      {pendingEdit && (
        <ImageEditor
          file={pendingEdit.file}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-medium"
          style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
        >
          Page Images
        </h1>
        <p
          className="mt-1 text-sm font-medium"
          style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}
        >
          각 페이지의 이미지 슬롯을 시각적으로 확인하고 업로드하세요. 이미지가 사이트에서 어디에 표시되는지 미리 볼 수 있습니다.
        </p>
      </div>

      {/* Page Accordion */}
      <div className="space-y-3">
        {PAGE_CONFIG.map((page) => {
          const isExpanded = expandedPage === page.slug;
          const { set, total } = getPageImageCount(page.slug);
          const isComplete = set === total;

          return (
            <div
              key={page.slug}
              className="overflow-hidden transition-all duration-200"
              style={{
                border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                backgroundColor: isExpanded ? "oklch(0.97 0.008 80)" : "oklch(0.94 0.015 80)",
              }}
            >
              {/* Page Header (clickable) */}
              <button
                onClick={() => setExpandedPage(isExpanded ? null : page.slug)}
                className="w-full flex items-center justify-between p-4 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: isComplete
                        ? "oklch(0.55 0.15 145)"
                        : set > 0
                        ? "oklch(0.7 0.15 80)"
                        : "oklch(0.75 0.02 80)",
                    }}
                  />
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}
                    >
                      {page.title}
                    </span>
                    <span
                      className="ml-2 text-[10px] uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.1em",
                        color: "oklch(0.34 0.05 45 / 0.4)",
                      }}
                    >
                      {set}/{total} images
                    </span>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    color: "oklch(0.34 0.05 45 / 0.4)",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Page description */}
                  <p
                    className="text-xs"
                    style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}
                  >
                    {page.description}
                  </p>

                  {/* Visual Layout Preview */}
                  <div className="space-y-3">
                    {/* Mini wireframe showing page structure */}
                    <div
                      className="p-3 rounded"
                      style={{ backgroundColor: "oklch(0.92 0.01 80)", border: "1px dashed oklch(0.8 0.02 72 / 0.5)" }}
                    >
                      <p
                        className="text-[9px] uppercase mb-2"
                        style={{
                          fontFamily: "var(--font-body)",
                          letterSpacing: "0.15em",
                          color: "oklch(0.34 0.05 45 / 0.3)",
                        }}
                      >
                        Page Layout Preview
                      </p>
                      <div className="space-y-1">
                        {page.slots.map((slot, idx) => {
                          const img = getImage(slot.pageSlug, slot.slotKey);
                          return (
                            <div
                              key={slot.slotKey}
                              className="flex items-center gap-2 p-1.5 rounded"
                              style={{
                                backgroundColor: img ? "oklch(0.55 0.15 145 / 0.08)" : "oklch(0.85 0.01 80)",
                                border: img ? "1px solid oklch(0.55 0.15 145 / 0.2)" : "1px solid oklch(0.8 0.02 72 / 0.3)",
                              }}
                            >
                              <div
                                className="w-12 h-6 rounded overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: "oklch(0.88 0.02 75)" }}
                              >
                                {img?.imageUrl ? (
                                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-[7px]" style={{ color: "oklch(0.34 0.05 45 / 0.2)" }}>
                                      empty
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span
                                className="text-[10px]"
                                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}
                              >
                                {idx + 1}. {slot.label}
                              </span>
                              {img && (
                                <span className="text-[8px] ml-auto" style={{ color: "oklch(0.55 0.15 145)" }}>
                                  ✓
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Image Slots */}
                  <div
                    className={`grid gap-4 ${
                      page.slots.length === 1
                        ? "grid-cols-1"
                        : page.slots.length <= 3
                        ? "grid-cols-1 lg:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2"
                    }`}
                  >
                    {page.slots.map((slot) => {
                      const img = getImage(slot.pageSlug, slot.slotKey);
                      const slotId = `${slot.pageSlug}/${slot.slotKey}`;
                      const isUploading = uploadingSlot === slotId;

                      return (
                        <div
                          key={slotId}
                          className="overflow-hidden rounded"
                          style={{
                            backgroundColor: "white",
                            border: img
                              ? "1px solid oklch(0.55 0.15 145 / 0.3)"
                              : "1px dashed oklch(0.8 0.02 72 / 0.5)",
                          }}
                        >
                          {/* Image Preview Area */}
                          <div
                            className="relative overflow-hidden"
                            style={{
                              aspectRatio: slot.aspectRatio,
                              backgroundColor: "oklch(0.92 0.01 80)",
                              maxHeight: "200px",
                            }}
                          >
                            {img?.imageUrl ? (
                              <img
                                src={img.imageUrl}
                                alt={slot.label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-2">
                                <svg
                                  className="w-8 h-8"
                                  style={{ color: "oklch(0.34 0.05 45 / 0.15)" }}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span
                                  className="text-[10px] uppercase"
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    letterSpacing: "0.1em",
                                    color: "oklch(0.34 0.05 45 / 0.25)",
                                  }}
                                >
                                  No image uploaded
                                </span>
                              </div>
                            )}

                            {isUploading && (
                              <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.6)" }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span
                                    className="text-[10px] uppercase"
                                    style={{
                                      fontFamily: "var(--font-body)",
                                      letterSpacing: "0.15em",
                                      color: "oklch(0.94 0.015 80)",
                                    }}
                                  >
                                    Uploading...
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Position indicator overlay */}
                            {img?.imageUrl && (
                              <div
                                className="absolute top-2 left-2 px-2 py-0.5 rounded"
                                style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.7)" }}
                              >
                                <span
                                  className="text-[8px] uppercase"
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    letterSpacing: "0.1em",
                                    color: "white",
                                  }}
                                >
                                  {slot.label}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Slot Info & Actions */}
                          <div className="p-3 space-y-2">
                            <div>
                              <p
                                className="text-xs font-medium"
                                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}
                              >
                                {slot.label}
                              </p>
                              <p
                                className="text-[10px] mt-0.5"
                                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.45)" }}
                              >
                                {slot.description}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <label
                                className="cursor-pointer text-[10px] uppercase py-1.5 px-3 transition-all duration-200 hover:opacity-70 rounded"
                                style={{
                                  fontFamily: "var(--font-body)",
                                  letterSpacing: "0.1em",
                                  backgroundColor: img ? "oklch(0.34 0.05 45)" : "oklch(0.55 0.15 145)",
                                  color: "white",
                                }}
                              >
                                {img ? "Replace" : "Upload Image"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelected(file, slot.pageSlug, slot.slotKey);
                                    e.target.value = "";
                                  }}
                                />
                              </label>

                              <button
                                onClick={() => {
                                  const url = prompt("Enter image URL:");
                                  if (url) {
                                    const existing = getImage(slot.pageSlug, slot.slotKey);
                                    upsertImage.mutate({
                                      id: existing?.id,
                                      pageSlug: slot.pageSlug,
                                      slotKey: slot.slotKey,
                                      imageUrl: url,
                                      altText: `${slot.pageSlug} ${slot.slotKey}`,
                                    });
                                  }
                                }}
                                className="text-[10px] uppercase py-1.5 px-3 transition-all duration-200 hover:opacity-70 rounded"
                                style={{
                                  fontFamily: "var(--font-body)",
                                  letterSpacing: "0.1em",
                                  color: "oklch(0.34 0.05 45 / 0.5)",
                                  border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                                }}
                              >
                                URL
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
