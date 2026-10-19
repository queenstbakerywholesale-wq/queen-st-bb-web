import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { applyWatermark } from "../watermark";
import { ENV } from "../_core/env";
import { ADMIN_COOKIE_NAME } from "@shared/const";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4;
const ADMIN_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_admin");

/** Keeps the website's password-admin session separate from POS staff sessions. */
const adminUploadProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role === "admin") return next({ ctx });

  const token = ctx.req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }

  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    if (payload.role !== "admin") throw new Error("Not an admin token");
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }

  return next({ ctx });
});

type RasterType = "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif";

function getRasterType(buffer: Buffer): RasterType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a")) {
    return "image/gif";
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buffer.length >= 16 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 16).toString("ascii").toLowerCase();
    if (brand.includes("avif") || brand.includes("avis")) return "image/avif";
  }
  return null;
}

function extensionFor(type: RasterType): string {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
  })[type];
}

export const adminUploadRouter = router({
  uploadImage: adminUploadProcedure
    .input(
      z.object({
        base64: z.string().min(1).max(MAX_BASE64_LENGTH),
        filename: z.string().min(1).max(255),
        // The client supplied MIME is retained for backwards-compatible callers;
        // storage uses the independently detected magic-byte type below.
        contentType: z.string().max(100).refine(
          (value) => ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"].includes(value),
          "Unsupported image content type",
        ).default("image/jpeg"),
        // Original files are retained unless a caller intentionally asks for a watermark.
        applyWatermark: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64) || input.base64.length % 4 !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid base64 image data" });
      }

      let buffer = Buffer.from(input.base64, "base64");
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be 8MB or smaller" });
      }

      const detectedType = getRasterType(buffer);
      if (!detectedType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only JPEG, PNG, GIF, WebP, or AVIF raster images are allowed" });
      }
      const key = `page-images/${nanoid()}.${extensionFor(detectedType)}`;

      // Apply brand watermark if enabled
      if (input.applyWatermark) {
        try {
          buffer = Buffer.from(await applyWatermark(buffer));
        } catch (err) {
          console.error("[Watermark] Failed to apply watermark, uploading original:", err);
          // Fall back to original image if watermark fails
        }
      }

      const { url, key: storageKey } = await storagePut(key, buffer, detectedType);
      return { url, key: storageKey };
    }),
});
