/**
 * Admin Page Images — Manage hero and section images for all public pages
 * Now with integrated image editor (crop & rotate) before upload
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ImageEditor from "@/components/ImageEditor";

// Define all image slots across the site
const PAGE_SLOTS = [
  { pageSlug: "home", slotKey: "hero-main", label: "Homepage — Hero (Section 1)" },
  { pageSlug: "home", slotKey: "hero-tiramisu", label: "Homepage — Tiramisu (Section 2)" },
  { pageSlug: "home", slotKey: "hero-gelato", label: "Homepage — Gelato (Section 3)" },
  { pageSlug: "home", slotKey: "hero-space", label: "Homepage — The Space (Section 4)" },
  { pageSlug: "tiramisu", slotKey: "hero", label: "Tiramisu — Hero" },
  { pageSlug: "gelato", slotKey: "hero", label: "Gelato — Hero" },
  { pageSlug: "space", slotKey: "hero", label: "Space / Experience — Hero" },
  { pageSlug: "objects", slotKey: "hero", label: "Objects — Hero" },
  { pageSlug: "wholesale", slotKey: "hero", label: "Wholesale — Hero" },
  { pageSlug: "cake-booking", slotKey: "hero", label: "Cake Booking — Hero" },
  { pageSlug: "about", slotKey: "hero", label: "About — Hero" },
  { pageSlug: "customer-care", slotKey: "hero", label: "Customer Care — Hero" },
];

interface PendingEdit {
  file: File;
  pageSlug: string;
  slotKey: string;
}

export default function AdminPageImages() {
  const [selectedPage, setSelectedPage] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);

  const { data: allImages = [], refetch } = trpc.adminPageImages.list.useQuery({
    pageSlug: selectedPage === "all" ? undefined : selectedPage,
  });

  const uploadImage = trpc.adminUpload.uploadImage.useMutation();
  const upsertImage = trpc.adminPageImages.upsert.useMutation({
    onSuccess: () => {
      toast.success("Image updated");
      refetch();
    },
  });

  const filteredSlots =
    selectedPage === "all"
      ? PAGE_SLOTS
      : PAGE_SLOTS.filter((s) => s.pageSlug === selectedPage);

  const getImageForSlot = (pageSlug: string, slotKey: string) => {
    return allImages.find(
      (img: any) => img.pageSlug === pageSlug && img.slotKey === slotKey
    );
  };

  /** Upload the final (possibly edited) file to S3 and save to DB */
  const handleUpload = async (
    file: File,
    pageSlug: string,
    slotKey: string
  ) => {
    const slotId = `${pageSlug}/${slotKey}`;
    setUploadingSlot(slotId);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via admin upload
      const result = await uploadImage.mutateAsync({
        base64: base64.split(",")[1],
        filename: file.name,
        contentType: file.type,
      });

      // Save to page_images
      const existing = getImageForSlot(pageSlug, slotKey);
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

  /** When a file is selected, open the editor instead of uploading directly */
  const handleFileSelected = (
    file: File,
    pageSlug: string,
    slotKey: string
  ) => {
    setPendingEdit({ file, pageSlug, slotKey });
  };

  /** Editor confirmed — upload the (possibly edited) file */
  const handleEditorConfirm = (editedFile: File) => {
    if (!pendingEdit) return;
    setPendingEdit(null);
    handleUpload(editedFile, pendingEdit.pageSlug, pendingEdit.slotKey);
  };

  /** Editor cancelled */
  const handleEditorCancel = () => {
    setPendingEdit(null);
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "oklch(0.34 0.05 45 / 0.5)",
  };

  const uniquePages = Array.from(new Set(PAGE_SLOTS.map((s) => s.pageSlug)));

  return (
    <div className="space-y-8">
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
          style={{
            fontFamily: "var(--font-display)",
            color: "oklch(0.34 0.05 45)",
          }}
        >
          Page Images
        </h1>
        <p
          className="mt-1 text-sm font-medium"
          style={{
            fontFamily: "var(--font-body)",
            color: "oklch(0.34 0.05 45 / 0.5)",
          }}
        >
          Manage hero and section images across all pages — crop &amp; rotate before uploading
        </p>
      </div>

      {/* Page Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedPage("all")}
          className="px-4 py-2 text-xs uppercase transition-all duration-200"
          style={{
            fontFamily: "var(--font-body)",
            letterSpacing: "0.15em",
            backgroundColor:
              selectedPage === "all"
                ? "oklch(0.34 0.05 45)"
                : "oklch(0.94 0.015 80)",
            color:
              selectedPage === "all"
                ? "oklch(0.94 0.015 80)"
                : "oklch(0.34 0.05 45 / 0.6)",
            border: "1px solid oklch(0.84 0.025 72 / 0.5)",
          }}
        >
          All Pages
        </button>
        {uniquePages.map((page) => (
          <button
            key={page}
            onClick={() => setSelectedPage(page)}
            className="px-4 py-2 text-xs uppercase transition-all duration-200"
            style={{
              fontFamily: "var(--font-body)",
              letterSpacing: "0.15em",
              backgroundColor:
                selectedPage === page
                  ? "oklch(0.34 0.05 45)"
                  : "oklch(0.94 0.015 80)",
              color:
                selectedPage === page
                  ? "oklch(0.94 0.015 80)"
                  : "oklch(0.34 0.05 45 / 0.6)",
              border: "1px solid oklch(0.84 0.025 72 / 0.5)",
            }}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Image Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSlots.map((slot) => {
          const existing = getImageForSlot(slot.pageSlug, slot.slotKey);
          const slotId = `${slot.pageSlug}/${slot.slotKey}`;
          const isUploading = uploadingSlot === slotId;

          return (
            <div
              key={slotId}
              className="overflow-hidden"
              style={{
                backgroundColor: "oklch(0.94 0.015 80)",
                border: "1px solid oklch(0.84 0.025 72 / 0.5)",
              }}
            >
              {/* Image Preview */}
              <div
                className="relative aspect-video overflow-hidden"
                style={{ backgroundColor: "oklch(0.88 0.02 75)" }}
              >
                {existing?.imageUrl ? (
                  <img
                    src={existing.imageUrl}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45 / 0.25)",
                      }}
                    >
                      No image set
                    </span>
                  </div>
                )}

                {isUploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.6)" }}
                  >
                    <span
                      className="text-xs uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.15em",
                        color: "oklch(0.94 0.015 80)",
                      }}
                    >
                      Uploading...
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Info */}
              <div className="p-4 space-y-3">
                <div>
                  <span style={labelStyle}>{slot.label}</span>
                  {existing && (
                    <p
                      className="text-[10px] mt-1"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "oklch(0.34 0.05 45 / 0.3)",
                      }}
                    >
                      {existing.storageKey ? "Uploaded" : "External URL"}
                    </p>
                  )}
                </div>

                {/* Upload Button — now opens editor first */}
                <div className="flex gap-2">
                  <label
                    className="cursor-pointer text-[10px] uppercase py-2 px-4 transition-all duration-200 hover:opacity-70"
                    style={{
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.15em",
                      backgroundColor: "oklch(0.34 0.05 45)",
                      color: "oklch(0.94 0.015 80)",
                    }}
                  >
                    {existing ? "Replace" : "Upload"}
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

                  {/* URL input for manual entry */}
                  <button
                    onClick={() => {
                      const url = prompt("Enter image URL:");
                      if (url) {
                        upsertImage.mutate({
                          id: existing?.id,
                          pageSlug: slot.pageSlug,
                          slotKey: slot.slotKey,
                          imageUrl: url,
                          altText: `${slot.pageSlug} ${slot.slotKey}`,
                        });
                      }
                    }}
                    className="text-[10px] uppercase py-2 px-4 transition-all duration-200 hover:opacity-70"
                    style={{
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.15em",
                      backgroundColor: "transparent",
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

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}
