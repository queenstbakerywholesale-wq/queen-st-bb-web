import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ImageEditor from "@/components/ImageEditor";
import { PACKAGE_IMAGE_SLOTS } from "@shared/packageImageSlots";

type LayoutHint = "full-width" | "half" | "third";

type SlotDef = {
  pageSlug: string;
  slotKey: string;
  label: string;
  description: string;
  aspectRatio: string;
  layoutHint: LayoutHint;
  fallback?: string;
};

const OTHER_PAGE_CONFIG: { slug: string; title: string; description: string; slots: SlotDef[] }[] = [
  {
    slug: "tiramisu",
    title: "Tiramisu Page",
    description: "Hero image at the top of the tiramisu product page",
    slots: [{ pageSlug: "tiramisu", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner at page top", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "gelato",
    title: "Gelato Page",
    description: "Hero image at the top of the gelato product page",
    slots: [{ pageSlug: "gelato", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner at page top", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "space",
    title: "Space / Experience Page",
    description: "Hero image showcasing the café interior and atmosphere",
    slots: [{ pageSlug: "space", slotKey: "hero", label: "Hero Image", description: "Full-width hero showing café interior", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "objects",
    title: "Objects (Shop) Page",
    description: "Hero image for the merchandise/goods shop page",
    slots: [{ pageSlug: "objects", slotKey: "hero", label: "Hero Image", description: "Full-width hero for the shop section", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "wholesale",
    title: "Wholesale & Franchise Page",
    description: "Hero image for the wholesale enquiry page",
    slots: [{ pageSlug: "wholesale", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "cake-booking",
    title: "Cake Booking Page",
    description: "Hero image for the cake order/booking page",
    slots: [{ pageSlug: "cake-booking", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "about",
    title: "About Page",
    description: "Hero image for the about/story page",
    slots: [{ pageSlug: "about", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
  {
    slug: "customer-care",
    title: "Customer Care Page",
    description: "Hero image for the customer care/contact page",
    slots: [{ pageSlug: "customer-care", slotKey: "hero", label: "Hero Image", description: "Full-width hero banner", aspectRatio: "21/9", layoutHint: "full-width" }],
  },
];

const PAGE_CONFIG = [
  {
    slug: "home",
    title: "홈 패키지 이미지",
    description: "새 홈 디자인에서 사용하는 로고·소개·맛·굿즈 이미지 슬롯입니다.",
    slots: PACKAGE_IMAGE_SLOTS as SlotDef[],
  },
  ...OTHER_PAGE_CONFIG,
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
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();
  const { data: allImages = [], refetch } = trpc.adminPageImages.list.useQuery({});
  const uploadImage = trpc.adminUpload.uploadImage.useMutation();
  const upsertImage = trpc.adminPageImages.upsert.useMutation();

  const imageMap = useMemo(() => {
    const map: Record<string, any> = {};
    allImages.forEach((img: any) => {
      map[`${img.pageSlug}/${img.slotKey}`] = img;
    });
    return map;
  }, [allImages]);

  const getImage = (pageSlug: string, slotKey: string) => imageMap[`${pageSlug}/${slotKey}`];
  const slotIdFor = (slot: SlotDef) => `${slot.pageSlug}/${slot.slotKey}`;
  const altFor = (slot: SlotDef, image?: any) => altDrafts[slotIdFor(slot)] ?? image?.altText ?? slot.label;

  const refreshAfterSave = async (pageSlug: string) => {
    await Promise.all([
      refetch(),
      utils.publicPageImages.getByPage.invalidate({ pageSlug }),
    ]);
  };

  const saveSlot = async (slot: SlotDef, imageUrl: string, storageKey?: string, current?: any) => {
    await upsertImage.mutateAsync({
      id: current?.id,
      pageSlug: slot.pageSlug,
      slotKey: slot.slotKey,
      imageUrl,
      storageKey,
      altText: altFor(slot, current).trim() || slot.label,
    });
    await refreshAfterSave(slot.pageSlug);
  };

  const handleUpload = async (file: File, pageSlug: string, slotKey: string) => {
    const slot = PAGE_CONFIG.flatMap((page) => page.slots).find(
      (candidate) => candidate.pageSlug === pageSlug && candidate.slotKey === slotKey,
    );
    if (!slot) return;

    const slotId = `${pageSlug}/${slotKey}`;
    setUploadingSlot(slotId);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({
        base64,
        filename: file.name,
        contentType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif",
        applyWatermark: false,
      });
      await saveSlot(slot, result.url, result.key, getImage(pageSlug, slotKey));
      toast.success("이미지가 저장되어 홈 미리보기에 반영되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "업로드에 실패했습니다.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleEditorConfirm = (editedFile: File) => {
    if (!pendingEdit) return;
    const { pageSlug, slotKey } = pendingEdit;
    setPendingEdit(null);
    void handleUpload(editedFile, pageSlug, slotKey);
  };

  const saveAltText = async (slot: SlotDef, image: any) => {
    if (!image?.imageUrl) return;
    try {
      await saveSlot(slot, image.imageUrl, image.storageKey ?? undefined, image);
      toast.success("대체 텍스트가 저장되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "대체 텍스트 저장에 실패했습니다.");
    }
  };

  const saveUrl = async (slot: SlotDef, image: any) => {
    const url = window.prompt("https URL 또는 /manus-storage/ 이미지 경로를 입력하세요.", image?.imageUrl ?? "");
    if (!url?.trim()) return;
    try {
      await saveSlot(slot, url.trim(), undefined, image);
      toast.success("이미지 URL이 저장되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "안전한 이미지 URL을 입력하세요.");
    }
  };

  const getPageImageCount = (page: (typeof PAGE_CONFIG)[number]) => ({
    set: page.slots.filter((slot) => Boolean(getImage(slot.pageSlug, slot.slotKey)?.imageUrl)).length,
    total: page.slots.length,
  });

  return (
    <div className="space-y-6">
      {pendingEdit && (
        <ImageEditor
          file={pendingEdit.file}
          onConfirm={handleEditorConfirm}
          onCancel={() => setPendingEdit(null)}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
            페이지 이미지
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}>
            홈 디자인에 쓰이는 사진을 즉시 교체하거나 안전한 이미지 URL로 저장할 수 있습니다.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center rounded px-3 py-2 text-[10px] uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-body)", color: "white", backgroundColor: "oklch(0.34 0.05 45)" }}
        >
          홈 라이브 미리보기 열기
        </a>
      </div>

      <div className="rounded p-4 text-xs leading-5" style={{ backgroundColor: "oklch(0.94 0.03 80)", border: "1px solid oklch(0.84 0.025 72 / 0.65)", color: "oklch(0.34 0.05 45 / 0.75)" }}>
        <strong>안내:</strong> 사진을 고르면 <strong>원본 바로 업로드</strong> 또는 기존 편집기에서 자르기·회전 후 업로드를 선택할 수 있습니다. 홈 굿즈 썸네일만 바꾸며, 상품의 가격·재고·상품 원본 사진은 <strong>Products</strong>에서 별도로 관리됩니다.
      </div>

      <div className="space-y-3">
        {PAGE_CONFIG.map((page) => {
          const isExpanded = expandedPage === page.slug;
          const { set, total } = getPageImageCount(page);
          return (
            <section key={page.slug} className="overflow-hidden" style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", backgroundColor: isExpanded ? "oklch(0.97 0.008 80)" : "oklch(0.94 0.015 80)" }}>
              <button onClick={() => setExpandedPage(isExpanded ? null : page.slug)} className="flex w-full items-center justify-between p-4 text-left hover:opacity-80">
                <span>
                  <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>{page.title}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-[0.1em]" style={{ color: "oklch(0.34 0.05 45 / 0.45)" }}>{set}/{total} 직접 저장됨</span>
                </span>
                <span className="text-sm" style={{ transform: isExpanded ? "rotate(180deg)" : undefined, color: "oklch(0.34 0.05 45 / 0.5)" }}>⌄</span>
              </button>

              {isExpanded && (
                <div className="space-y-4 px-4 pb-4">
                  <p className="text-xs" style={{ color: "oklch(0.34 0.05 45 / 0.6)" }}>{page.description}</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {page.slots.map((slot) => {
                      const image = getImage(slot.pageSlug, slot.slotKey);
                      const slotId = slotIdFor(slot);
                      const previewUrl = image?.imageUrl || slot.fallback;
                      const isUploading = uploadingSlot === slotId;
                      return (
                        <article key={slotId} className="overflow-hidden rounded bg-white" style={{ border: image?.imageUrl ? "1px solid oklch(0.55 0.15 145 / 0.35)" : "1px dashed oklch(0.8 0.02 72 / 0.65)" }}>
                          <div className="relative overflow-hidden" style={{ aspectRatio: slot.aspectRatio, maxHeight: "260px", backgroundColor: "oklch(0.92 0.01 80)" }}>
                            {previewUrl ? (
                              <img src={previewUrl} alt={altFor(slot, image)} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.1em]" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>미리보기 없음</div>
                            )}
                            <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-[8px] uppercase tracking-[0.1em]" style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.75)", color: "white" }}>
                              {image?.imageUrl ? "저장된 이미지" : slot.fallback ? "기본 이미지" : "비어 있음"}
                            </span>
                            {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] uppercase tracking-[0.12em] text-white">업로드 중…</div>
                            )}
                          </div>

                          <div className="space-y-3 p-3">
                            <div>
                              <h2 className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>{slot.label}</h2>
                              <p className="mt-0.5 text-[10px] leading-4" style={{ color: "oklch(0.34 0.05 45 / 0.55)" }}>{slot.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <label className="cursor-pointer rounded px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] hover:opacity-70" style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.55 0.15 145)", color: "white" }}>
                                원본 바로 업로드
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" className="hidden" onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) void handleUpload(file, slot.pageSlug, slot.slotKey);
                                  event.target.value = "";
                                }} />
                              </label>
                              <label className="cursor-pointer rounded border px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] hover:opacity-70" style={{ fontFamily: "var(--font-body)", borderColor: "oklch(0.84 0.025 72 / 0.7)", color: "oklch(0.34 0.05 45 / 0.7)" }}>
                                편집 후 업로드
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" className="hidden" onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) setPendingEdit({ file, pageSlug: slot.pageSlug, slotKey: slot.slotKey });
                                  event.target.value = "";
                                }} />
                              </label>
                              <button onClick={() => void saveUrl(slot, image)} className="rounded border px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] hover:opacity-70" style={{ fontFamily: "var(--font-body)", borderColor: "oklch(0.84 0.025 72 / 0.7)", color: "oklch(0.34 0.05 45 / 0.7)" }}>URL 저장</button>
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={altFor(slot, image)}
                                onChange={(event) => setAltDrafts((drafts) => ({ ...drafts, [slotId]: event.target.value }))}
                                maxLength={500}
                                aria-label={`${slot.label} 대체 텍스트`}
                                placeholder="이미지 대체 텍스트"
                                className="min-w-0 flex-1 rounded border px-2 py-1.5 text-xs"
                                style={{ borderColor: "oklch(0.84 0.025 72 / 0.65)", color: "oklch(0.34 0.05 45)" }}
                              />
                              <button disabled={!image?.imageUrl || upsertImage.isPending} onClick={() => void saveAltText(slot, image)} className="rounded px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] disabled:opacity-40" style={{ color: "white", backgroundColor: "oklch(0.34 0.05 45)" }}>텍스트 저장</button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
