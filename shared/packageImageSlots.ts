export const PACKAGE_DEFAULT_IMAGES: Record<string, string> = {
  "brand-logo": "/manus-storage/queenstbb-antique-logo_38e2dc63.png",
  "story-koala": "/manus-storage/queen-koala_f684aaaa.png",
  "boutique-hero": "/manus-storage/self-scoop_9a91aa59.png",
  "ritual-photo": "/manus-storage/self-scoop_9a91aa59.png",
  "flavour-original": "/manus-storage/self-scoop_9a91aa59.png",
  "flavour-pistachio": "/manus-storage/self-scoop_9a91aa59.png",
  "flavour-fruit": "/manus-storage/self-scoop_9a91aa59.png",
  "boutique-mug": "/manus-storage/queen-street-melbourne-mug-green_55440936.png",
  "boutique-postcard": "/manus-storage/postcard-18_5eadbaa4.jpg",
  "boutique-koala": "/manus-storage/queen-bb-koala-doll_1d718ccd.png",
};

export const PACKAGE_IMAGE_SLOTS = [
  { slotKey: "brand-logo", label: "브랜드 로고", description: "상단 중앙 앤티크 로고 · PNG 투명 배경 권장", aspectRatio: "3/2", layoutHint: "half" },
  { slotKey: "boutique-hero", label: "홈 메인 사진", description: "앤티크 프레임 안의 메인 사진 · 가로 16:9, 1920px 권장", aspectRatio: "16/9", layoutHint: "full-width" },
  { slotKey: "story-koala", label: "브랜드 스토리 코알라", description: "브랜드 소개 위 그림 · 세로 2:3, 투명 배경 권장", aspectRatio: "2/3", layoutHint: "third" },
  { slotKey: "ritual-photo", label: "셀프 스쿱 안내 사진", description: "3단계 안내 옆 사진 · 세로 4:5 권장", aspectRatio: "4/5", layoutHint: "half" },
  { slotKey: "flavour-original", label: "Original 맛 사진", description: "Original 탭 사진 · 가로 4:3 권장", aspectRatio: "4/3", layoutHint: "half" },
  { slotKey: "flavour-pistachio", label: "Pistachio 맛 사진", description: "Pistachio 탭 사진 · 가로 4:3 권장", aspectRatio: "4/3", layoutHint: "half" },
  { slotKey: "flavour-fruit", label: "과일 맛 사진", description: "Something fruity 탭 사진 · 가로 4:3 권장", aspectRatio: "4/3", layoutHint: "half" },
  { slotKey: "boutique-mug", label: "홈 굿즈 — 머그 사진", description: "홈 추천 머그 이미지 · 상품 자체 사진과 재고는 Products에서 관리", aspectRatio: "1/1", layoutHint: "third" },
  { slotKey: "boutique-postcard", label: "홈 굿즈 — 엽서 사진", description: "홈 추천 엽서 이미지 · 원본 비율 유지", aspectRatio: "1/1", layoutHint: "third" },
  { slotKey: "boutique-koala", label: "홈 굿즈 — 인형 사진", description: "홈 추천 인형 이미지 · 상품 자체 사진과 재고는 Products에서 관리", aspectRatio: "1/1", layoutHint: "third" },
].map(slot => ({ ...slot, pageSlug: "home", fallback: PACKAGE_DEFAULT_IMAGES[slot.slotKey], layoutHint: slot.layoutHint as "full-width" | "half" | "third" }));
