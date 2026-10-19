import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "focused-test-secret",
  },
}));

const mockSelect = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
const mockInsertValues = vi.fn().mockResolvedValue([{ insertId: 73 }]);
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);

const mockDb = {
  select: mockSelect,
  update: vi.fn(() => ({
    set: mockUpdateSet.mockReturnValue({ where: mockUpdateWhere }),
  })),
  insert: vi.fn(() => ({ values: mockInsertValues })),
  delete: vi.fn(() => ({ where: mockDeleteWhere })),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  pageImages: {
    id: "id",
    pageSlug: "pageSlug",
    slotKey: "slotKey",
    imageUrl: "imageUrl",
    storageKey: "storageKey",
    altText: "altText",
    sortOrder: "sortOrder",
    isActive: "isActive",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  asc: vi.fn((value: unknown) => value),
}));

vi.mock("./storage", () => ({ storagePut: vi.fn() }));
vi.mock("./watermark", () => ({ applyWatermark: vi.fn() }));

const { adminPageImagesRouter, publicPageImagesRouter } = await import("./routers/adminPageImages");
const { adminUploadRouter } = await import("./routers/adminUpload");

function context(cookie?: string): TrpcContext {
  return {
    user: null,
    req: { cookies: cookie ? { admin_session_id: cookie } : {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

async function adminContext(): Promise<TrpcContext> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("focused-test-secret_admin"));
  return context(token);
}

function selectRows(rows: unknown[]) {
  mockSelect.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue(rows),
        limit: vi.fn().mockResolvedValue(rows),
      })),
      orderBy: vi.fn().mockResolvedValue(rows),
    })),
  }));
}

const savedImage = {
  id: 12,
  pageSlug: "home",
  slotKey: "boutique-hero",
  imageUrl: "/manus-storage/hero.png",
  storageKey: "page-images/hero.png",
  altText: "홈 메인 사진",
  sortOrder: 0,
  isActive: true,
};

describe("adminPageImages focused safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows([]);
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockInsertValues.mockResolvedValue([{ insertId: 73 }]);
  });

  it("rejects an unauthenticated page image admin request", async () => {
    const caller = adminPageImagesRouter.createCaller(context());
    await expect(caller.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects javascript, data, svg, and non-HTTPS image URLs", async () => {
    const caller = adminPageImagesRouter.createCaller(await adminContext());
    for (const imageUrl of [
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "http://example.com/photo.jpg",
      "https://example.com/vector.svg?cache=1",
    ]) {
      await expect(caller.upsert({ pageSlug: "home", slotKey: "boutique-hero", imageUrl })).rejects.toThrow();
    }
  });

  it("keeps public active-image reads available without admin credentials", async () => {
    selectRows([savedImage]);
    const caller = publicPageImagesRouter.createCaller(context());
    await expect(caller.getByPage({ pageSlug: "home" })).resolves.toEqual([savedImage]);
  });

  it("rejects an unauthenticated upload before attempting storage", async () => {
    const caller = adminUploadRouter.createCaller(context());
    await expect(caller.uploadImage({
      base64: "YWJj",
      filename: "photo.png",
      contentType: "image/png",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("persists both a new slot and an explicit slot update with the mocked DB", async () => {
    const caller = adminPageImagesRouter.createCaller(await adminContext());

    await expect(caller.upsert({
      pageSlug: "home",
      slotKey: "brand-logo",
      imageUrl: "/manus-storage/logo.png",
      altText: "Queen St BB 로고",
    })).resolves.toEqual({ id: 73 });
    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
      pageSlug: "home",
      slotKey: "brand-logo",
      imageUrl: "/manus-storage/logo.png",
      altText: "Queen St BB 로고",
    }));

    await expect(caller.upsert({
      id: 12,
      pageSlug: "home",
      slotKey: "brand-logo",
      imageUrl: "https://images.example.com/new-logo.png",
      altText: "새 로고",
    })).resolves.toEqual({ id: 12 });
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({
      imageUrl: "https://images.example.com/new-logo.png",
      altText: "새 로고",
    }));
  });
});
