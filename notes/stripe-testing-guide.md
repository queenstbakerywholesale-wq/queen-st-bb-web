# Stripe 결제 테스트 가이드

## 테스트 카드 정보

| 항목 | 값 |
|------|------|
| 카드 번호 | `4242 4242 4242 4242` |
| 만료일 | 아무 미래 날짜 (예: `12/30`) |
| CVC | 아무 3자리 (예: `123`) |
| 우편번호 | 아무 값 (예: `4000`) |

## 테스트 순서

### 1. 상품 구매 테스트

1. `/objects` 페이지에서 상품 카드에 마우스를 올려 "ADD TO BAG" 클릭
2. 장바구니 아이콘 클릭 → 사이드바에서 상품 확인
3. "PROCEED TO CHECKOUT" 클릭
4. 고객 정보 입력 (이름, 이메일, 주소, 우편번호)
5. "PAY WITH STRIPE" 클릭 → Stripe 결제 페이지로 이동
6. 위의 테스트 카드 정보 입력 후 결제 완료
7. `/order-success` 페이지에서 주문 확인
8. 입력한 이메일로 주문 확인 이메일 수신 확인

### 2. 기프트 카드 구매 테스트

1. `/gift-cards` 페이지에서 금액 선택 ($30~$200)
2. 카드 디자인 선택 또는 커스텀 디자인 편집
3. 수신자 정보 및 메시지 입력
4. "PAY WITH STRIPE" 클릭 → Stripe 결제
5. 결제 완료 후 기프트 카드 코드 확인
6. `/gift-cards/balance`에서 잔액 조회 테스트

### 3. 기프트 카드로 결제 테스트

1. Objects 체크아웃에서 "GIFT CARD CODE" 필드에 기프트 카드 코드 입력
2. "APPLY" 클릭 → 할인 금액 확인
3. 잔여 금액이 있으면 Stripe로 나머지 결제

### 4. 케이크 주문 테스트 (Pickup Only)

1. 케이크 상품을 장바구니에 추가
2. 자동으로 "STORE PICKUP" 모드로 전환 확인
3. 픽업 지점, 날짜, 시간 선택
4. 결제 완료 후 주문 확인

## 등록된 테스트 상품

| 상품명 | 가격 | 유형 | 배송 |
|--------|------|------|------|
| Tiramisu Cup | $12.00 | Tiramisu | Shipping + Pickup |
| Vanilla Bean Gelato | $9.00 | Gelato | Shipping + Pickup |
| Queen St BB Postcard Set | $5.00 | Postcards | Shipping + Pickup |

## Admin 패널 확인

- `/admin-angela91/orders`에서 새 주문 확인
- 주문 알림 벨 아이콘으로 실시간 알림 확인
- 주문 상태 업데이트 (preparing → ready → shipped)
- 배송 추적 번호 입력 시 고객에게 이메일 발송

## Stripe 대시보드

- Stripe 테스트 샌드박스 클레임: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVE5oTk1EME5IelFBQ2tRLDE3NzczNTA1MzQv100CIaRQphY
- 클레임 기한: 2026-06-20
- 라이브 모드 전환 시 Settings → Payment에서 라이브 키 입력 필요

## 배송비 계산

- 우편번호 입력 시 호주 지역 기반 배송비 자동 계산
- QLD (4000-4999): $12.00
- NSW (2000-2999): $14.00
- VIC (3000-3999): $16.00
- SA (5000-5999): $18.00
- WA (6000-6999): $22.00
- TAS (7000-7999): $20.00
- NT (0800-0999): $24.00
- ACT (2600-2619): $15.00
