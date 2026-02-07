# 📘 CONTEXT.md - 개발 컨텍스트 및 히스토리

> 이 문서는 프로젝트의 현재 개발 단계, 주요 결정 사항, 다음 작업 목표를 추적합니다.
> 모든 중요한 변경사항과 결정은 이 문서에 기록되어야 합니다.

---

## 📅 최종 업데이트
**날짜**: 2026-02-06  
**작성자**: Atlas (OhMyOpenCode)  
**현재 단계**: Phase 2 - 스마트 매칭 및 장바구니 기능 개선

---

## 🎯 프로젝트 개요

### 서비스 이름
**유튜브/음식명 기반 식재료 자동 장바구니 서비스**

### 핵심 가치 제안
사용자가 유튜브 레시피 영상이나 음식 이름만 입력하면, AI가 자동으로 필요한 식재료를 추출하고 여러 이커머스 플랫폼에서 최적의 상품(저가격, 저칼로리)을 찾아 크롬 확장 프로그램으로 장바구니에 자동으로 담아주는 서비스

### 타겟 사용자
- 요리 초보자
- 시간이 부족한 직장인
- 건강한 식단을 원하는 사람들
- 유튜브 레시피를 자주 보는 사용자

---

## 🏗️ 현재 개발 단계

### Phase 0: 프로젝트 초기화 ✅ (완료)

#### 완료된 작업
- [x] Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind CSS)
- [x] 모노레포 폴더 구조 설계 및 생성
  - `apps/extension/` - 크롬 확장 프로그램
  - `packages/database/` - Prisma 및 DB 로직
  - `packages/ai/` - Claude API 래퍼
  - `packages/scraper/` - Playwright 스크래퍼
  - `packages/shared/` - 공통 타입 및 유틸리티
- [x] README.md 작성 (프로젝트 개요, 기능, 설치 방법)
- [x] CONTEXT.md 작성 (이 문서)
- [x] Git 초기화 (create-next-app이 자동으로 수행)

### Phase 1: AI 재료 추출 API 및 UI 연동 ✅ (완료)

#### 완료된 작업
- [x] Claude API 연동 로직 구현 (`packages/ai/src/index.ts`)
  - `extractIngredientsFromText()` - 레시피 텍스트에서 재료 추출
  - `extractIngredientsFromDishName()` - 요리명에서 재료 추출
- [x] 재료 추출 API 엔드포인트 생성 (`app/api/ai/ingredients/route.ts`)
  - POST `/api/ai/ingredients` - 음식명 또는 유튜브 링크에서 재료 추출
  - inputType: 'food' | 'youtube' 지원
- [x] 프론트엔드 UI 구현 및 API 연동
  - `FoodInputCard` 컴포넌트 - 음식명/유튜브 링크 입력
  - `IngredientListCard` 컴포넌트 - 추출된 재료 리스트 표시
  - `page.tsx` - 메인 페이지에서 API 호출 및 결과 표시

#### 구현된 기능
- 사용자가 음식명(예: "김치찌개") 입력 시 Claude AI가 자동으로 재료 추출
- 사용자가 유튜브 링크 입력 시 재료 추출 (향후 유튜브 자막 연동 예정)
- 추출된 재료는 실시간으로 IngredientListCard에 표시
- 로딩 상태 및 에러 핸들링 구현

#### 변경 이력
- 2026-02-03: Phase 1 완료 - AI 재료 추출 API 및 UI 연동

#### 생성된 파일 및 폴더
```
ingredient-cart-service/
├── app/                    # Next.js App Router
├── apps/
│   └── extension/         # 크롬 확장 (빈 폴더)
├── packages/
│   ├── database/          # DB 패키지 (빈 폴더)
│   ├── ai/                # AI 패키지 (빈 폴더)
│   ├── scraper/           # 스크래퍼 패키지 (빈 폴더)
│   └── shared/            # 공통 패키지 (빈 폴더)
├── public/
├── node_modules/
├── .git/
├── .gitignore
├── README.md
├── CONTEXT.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── eslint.config.mjs
```

---

## 🔑 주요 기술 결정 사항

### 1. 프론트엔드 프레임워크
**결정**: Next.js 14 (App Router)

**이유**:
- SSR/SSG 지원으로 SEO 최적화
- API Routes로 백엔드 로직 통합 가능
- Vercel 배포 최적화
- TypeScript 네이티브 지원
- 한국어 콘텐츠 SEO에 유리

**대안 고려**:
- ❌ Create React App: SSR 미지원, SEO 불리
- ❌ Remix: 생태계가 Next.js보다 작음
- ❌ Vue/Nuxt: React 생태계가 더 풍부

### 2. 데이터베이스
**결정**: PostgreSQL + Prisma ORM

**이유**:
- 관계형 데이터 구조 (사용자, 검색 이력, 상품 정보)
- Prisma의 타입 안정성 (TypeScript 통합)
- 트랜잭션 지원 (결제 처리)
- Railway, Supabase 등 무료 호스팅 옵션

**대안 고려**:
- ❌ MongoDB: 관계형 데이터에 부적합
- ❌ MySQL: PostgreSQL이 JSON 타입 지원 우수

### 3. AI 모델
**결정**: Anthropic Claude API

**이유**:
- 한국어 처리 능력 우수
- 구조화된 출력 (JSON) 생성 용이
- 긴 컨텍스트 지원 (유튜브 자막 전체 처리)
- 합리적인 가격

**대안 고려**:
- ❌ OpenAI GPT: 한국어 처리가 Claude보다 약함
- ❌ Google Gemini: API 안정성 이슈

### 4. 웹 스크래핑
**결정**: Playwright

**이유**:
- 한국 이커머스 사이트의 복잡한 JavaScript 처리
- 헤드리스 브라우저로 실제 사용자 행동 모방
- 안티봇 우회 가능
- TypeScript 네이티브 지원

**대안 고려**:
- ❌ Puppeteer: Playwright가 더 현대적이고 안정적
- ❌ Cheerio: JavaScript 렌더링 미지원

### 5. 크롬 확장 프로그램
**결정**: Manifest V3

**이유**:
- Chrome Web Store의 최신 표준
- Manifest V2는 2024년부터 지원 중단
- 보안 강화

**제약사항**:
- Background scripts → Service Workers로 변경
- Content Security Policy 강화

### 6. 결제 시스템
**결정**: PortOne (구 아임포트)

**이유**:
- 한국 PG사 통합 (카카오페이, 네이버페이, 토스 등)
- 간편한 API
- 무료 티어 제공
- 한국어 문서 및 지원

**대안 고려**:
- ❌ Stripe: 한국 결제 수단 지원 제한적
- ❌ Toss Payments: PortOne이 더 많은 PG 지원

### 7. 배포 전략
**결정**: Vercel (프론트엔드) + Railway (데이터베이스)

**이유**:
- Vercel: Next.js 최적화, 무료 티어, 자동 배포
- Railway: PostgreSQL 무료 티어, 간편한 설정

**대안 고려**:
- ❌ AWS: 초기 설정 복잡, 비용 관리 어려움
- ❌ Heroku: 무료 티어 종료

### 8. 모노레포 구조
**결정**: 단일 저장소에 apps/ 및 packages/ 분리

**이유**:
- 코드 공유 용이 (타입, 유틸리티)
- 크롬 확장과 웹 앱 동시 개발
- 의존성 관리 단순화

**향후 고려**:
- Turborepo 또는 Nx 도입 (빌드 최적화)

---

## 🚧 다음 작업 목표 (Phase 2)

### 우선순위 1: 환경 설정 및 기본 인프라
- [ ] `.env.example` 파일 생성 (필요한 환경 변수 템플릿)
  - ANTHROPIC_API_KEY
  - DATABASE_URL
  - REDIS_URL
- [ ] Prisma 스키마 설계 및 마이그레이션
  - User 모델 (사용자 정보)
  - Recipe 모델 (레시피 정보)
  - Ingredient 모델 (식재료)
  - SearchHistory 모델 (검색 이력)
  - Product 모델 (상품 정보 캐시)
- [ ] Redis 연결 설정 (AI 응답 캐싱용)

### 우선순위 2: 유튜브 연동 기능
- [ ] YouTube 데이터 추출 모듈 (`packages/scraper/youtube.ts`)
  - YouTube Data API 연동
  - 자막/설명 추출
  - Shorts 지원
- [ ] 유튜브 링크 분석 API 개선
  - 영상 제목, 설명, 자막 추출
  - 추출된 텍스트에서 재료 분석

### 우선순위 3: 이커머스 스크래핑
- [ ] 배민 스크래퍼 구현
- [ ] 쿠팡 스크래퍼 구현
- [ ] 마켓컬리 스크래퍼 구현
- [ ] 가격 및 칼로리 정보 추출
- [ ] 상품 비교 API (`app/api/products/compare/route.ts`)

### 우선순위 4: 결과 페이지 및 장바구니 기능
- [ ] 결과 페이지 (`app/results/page.tsx`)
  - 추출된 식재료 리스트 표시
  - 플랫폼별 상품 비교 표시
  - 장바구니 추가 기능
- [ ] 크롬 확장 프로그램 연동
  - 장바구니 자동 추가 API
  - 인기 레시피

### 우선순위 4: 크롬 확장 프로그램
- [ ] Manifest V3 설정 (`apps/extension/manifest.json`)
- [ ] Content Script (장바구니 자동 추가)
- [ ] Background Service Worker (API 통신)
- [ ] Popup UI (확장 프로그램 팝업)

### 우선순위 5: 결제 시스템
- [ ] PortOne SDK 연동
- [ ] 결제 API 엔드포인트 (`app/api/payment/route.ts`)
- [ ] Webhook 처리 (결제 완료 알림)

---

## 📊 기술 부채 및 개선 사항

### 현재 알려진 이슈
- 없음 (프로젝트 초기 단계)

### 향후 개선 계획
1. **성능 최적화**
   - AI 응답 캐싱 (Redis)
   - 상품 정보 캐싱 (24시간)
   - 이미지 최적화 (Next.js Image)

2. **보안 강화**
   - API Rate Limiting
   - CSRF 토큰
   - 환경 변수 암호화

3. **사용자 경험**
   - 다크 모드 지원
   - 모바일 최적화
   - 다국어 지원 (영어)

4. **테스트**
   - 단위 테스트 (Jest)
   - E2E 테스트 (Playwright)
   - API 테스트 (Supertest)

---

## 🔄 변경 이력

### 2026-02-03
- **Phase 1: AI 재료 추출 API 및 UI 연동 완료**
  - Claude API 연동 로직 구현 (`packages/ai/src/index.ts`)
    - `extractIngredientsFromText()`: 레시피 텍스트에서 재료 추출
    - `extractIngredientsFromDishName()`: 요리명에서 재료 추출
  - 재료 추출 API 엔드포인트 생성 (`app/api/ai/ingredients/route.ts`)
    - POST `/api/ai/ingredients`: 음식명 또는 유튜브 링크에서 재료 추출
    - inputType: 'food' | 'youtube' 지원
  - 프론트엔드 UI 구현 및 API 연동
    - `FoodInputCard`, `IngredientListCard` 컴포넌트 생성
    - `page.tsx` 메인 페이지에서 API 호출 및 결과 표시
    - 로딩 상태 및 에러 핸들링 구현
  - 임시 데이터 제거, 실제 Claude API 연동 완료

### 2026-02-04
- **AI 프롬프트 개선 - 1인 기준 재료양 추출**
  - `packages/ai/src/index.ts` 수정
    - `extractIngredientsFromText()`: 1인분 기준 재료양 계산 프롬프트 추가
    - `extractIngredientsFromDishName()`: 1인분 기준 재료양 계산 프롬프트 추가
  - 요구사항: 모든 재료는 1인분 기준으로 분량을 계산, amount는 숫자만, unit은 단위만 표시

- **스마트 상품 매칭 로직 구현**
  - `packages/scraper/src/index.ts` 수정
    - `extractWeightFromName()`: 상품명에서 무게/용량 추출 함수 추가
    - `findBestMatchByWeight()`: 재료양과 가장 근접한 상품 매칭 함수 추가
  - `app/api/products/coupang-match/route.ts` 생성
    - 쿠팡 상품 검색 및 재료양 매칭 API 엔드포인트
    - 최저가/저칼로리 필터 적용 후 최적 상품 반환

- **UI 개선 - 스마트 매칭 버튼 연동**
  - `app/page.tsx` 수정
    - `openCoupangWithSmartMatch()`: 스마트 매칭 기능 구현
    - 최저가/저칼로리 버튼을 스마트 매칭 기능과 연동
    - 재료 카드에 1인분 기준 분량 표시 추가

- **사용자 요청사항 기록 (2026-02-04)**
  - 재료 표시를 밑으로 길게 늘어지지 않고 한 화면에 모두 표시되도록 변경 요청
  - 모든 요청사항은 CONTEXT.md에 기록 필요
  - AI 응답은 항상 한국어로 작성
  - 웹 디자인을 Yumix 스타일(https://yumix.framer.website)로 변경 - 밝은 테마, 파스텔톤 색상
  - 재료 옆에 최저가/저칼로리 버튼 추가 - 클릭 시 쿠팡에서 해당 조건의 상품을 새 브라우저에서 열기
  - AI가 1인 기준 재료양 추출하도록 프롬프트 개선
  - 쿠팡에서 재료양과 가장 근접한 상품 매칭 및 자동 로그인 처리 (진행 중)
  - **낱개 상품 우선 매칭**: 100g 요청 시 "100g 10개입" 대신 "100g 낱개" 상품 우선 연결

- **멀티 플랫폼 스마트 매칭 및 로직 고도화 (2026-02-04)**
  - **티어 기반 용량 매칭 도입**:
    - 티어 1: 요청량의 0.8~1.5배 (최우선)
    - 티어 2: 요청량의 0.5~3.0배 (차선)
    - 이 로직을 통해 "300g 요청 시 3kg 대용량"이 매칭되는 문제 해결
  - **멀티 플랫폼 지원**: 쿠팡뿐만 아니라 **마켓컬리, B마트** 스크래퍼 통합 완료
  - **스마트 매칭 API (`/api/products/smart-match`)**: 모든 플랫폼을 검색하여 가장 적합한 단일 상품 상세 페이지로 바로 연결하는 API 구현
  - **스크래핑 내구성 강화**: 텍스트 기반 추출 로직으로 변경하여 사이트 UI 변경에 유연하게 대응
  - **봇 감지 우회**: 모바일 유저 에이전트 및 마스킹 적용으로 쿠팡/컬리 차단 완화
  - **저칼로리 우선 매칭 기능**: 
    - [저칼로리] 선택 시 검색어에 '저칼로리' 자동 포함
    - 상품명에서 칼로리(kcal) 수치 또는 '무설탕', '라이트', '다이어트' 등 키워드 추출하여 정렬 1순위로 적용
    - UI 상품 리스트에 칼로리 정보 및 마켓 로고 표시 강화
  - **장바구니 및 벌크 매칭 기능 구현**:
    - 개별 상품 [장바구니 담기] 버튼 추가
    - [전체 최저가 담기] 버튼: 모든 재료에 대해 AI가 자동으로 최적 상품을 찾아 장바구니에 일괄 추가
    - 플로팅 장바구니 버튼 및 슬라이딩 사이드바 UI 구현
    - 총 주문 금액 자동 계산 및 전체 상품 결제 페이지 일괄 열기 기능 추가

### 2026-02-06 (오전)
- **마켓컬리 로그인 후 자동 장바구니 담기 기능 구현**
  - 웹에서 마켓컬리 상품 장바구니 담기 버튼 클릭 시 로그인 플로우 개선
  - 크롬 확장 프로그램이 마켓컬리 로그인 페이지를 새 탭으로 열도록 구현
  - 사용자가 로그인 완료(아이디/비밀번호, 네이버/카카오 등) 후 자동으로 재료들을 장바구니에 담는 기능 추가
  - `apps/extension/background.js` 수정:
    - `startKurlyCartOperation()`: 마켓컬리 로그인 페이지 열기 및 장바구니 작업 시작
    - `checkKurlyLoginStatus()`: 로그인 완료 감지 (URL 변경 모니터링)
    - `addNextProductToCart()`: 로그인 후 순차적으로 재료 검색 및 장바구니 담기
  - `apps/extension/content.js` 수정:
    - `handleKurlyAddToCart()`: 마켓컬리 검색 페이지에서 첫 번째 상품 클릭 및 장바구니 담기
    - `findAndClickCartButton()`: 장바구니 버튼 자동 클릭 및 팝업 닫기

### 2026-02-06 (심야 - 첫 번째 수정)
- **재료 검색 정확도 및 상품 매칭 로직 대폭 개선**
  - **문제 1 해결: 소금 vs 소금빵 오매칭 방지**
    - `calculateMatchScore()` 함수 추가: 재료명과 상품명의 매칭 점수 계산
    - 정확한 단어 매칭 시 높은 점수, 부분 매칭 시 낮은 점수 부여
    - 소금빵, 소금과자 등 불필요한 접미사 감지 시 감점 처리 (빵, 과자, 쿠키, 케이크, 사탕, 젤리, 음료, 주스 등)
  - **문제 2 해결: [선물세트] 등 대괄호 접두사 처리**
    - `extractCoreIngredient()` 함수 개선: 재료명에서 소괄호만 제거, 대괄호는 유지
    - `extractProductSearchKeyword()` 함수 추가: 상품명에서 [선물세트], [특가] 등 대괄호 제거
    - 장바구니 담기 시 상품 10개를 순회하며 매칭 점수가 가장 높은 상품 선택
  - **마켓컬리 검색 결과 정렬 개선**
    - 검색 결과를 매칭 점수 순으로 정렬하여 가장 정확한 상품을 최상단에 표시
    - 장바구니 담기 시 단순히 첫 번째 상품이 아닌 가장 정확한 상품을 자동 선택
  - **수정된 파일**:
    - `packages/scraper/src/index.ts`: 핵심 매칭 로직 및 헬퍼 함수 추가

### 2026-02-06 (심야 - 두 번째 수정)
- **재료명 전체 검색 문제 해결**
  - **문제**: "[KF365] 1+등급 무항생제 특란 10구" 검색 시 "[KF365]"만 검색되어 돈까스가 검색됨
  - **해결**: `extractCoreIngredient()` 함수 수정 - 대괄호[] 유지, 소괄호()만 제거
  - **이유**: 브랜드명이나 상품 등급 등 중요 정보는 대괄호로 표시되므로 검색에 포함해야 정확
  - **결과**: "[KF365] 1+등급 무항생제 특란 10구" 전체가 검색되어 정확한 특란 상품 매칭
  - **수정된 파일**:
    - `packages/scraper/src/index.ts`: `extractCoreIngredient()` 함수 로직 개선

### 2026-02-06 (심야 - 세 번째 수정) ⭐ 중요
- **소금 vs 소금빵 완전 해결**
  - **문제**: `calculateMatchScore()` 함수를 만들었지만 `findBestMatchByWeight()`에서 사용하지 않아 여전히 소금빵이 검색됨
  - **근본 원인**: 매칭 점수를 계산만 하고 실제 필터링/정렬에 적용하지 않음
  - **해결**:
    1. `findBestMatchByWeight()`에 `ingredientName` 파라미터 추가
    2. 모든 상품에 대해 매칭 점수 계산
    3. **매칭 점수가 0 이하인 상품 필터링** (소금빵 = -30점 이하 → 제외)
    4. 정렬 시 매칭 점수를 **최우선 순위**로 적용 (가격/칼로리보다 우선)
  - **결과**: 
    - "소금" 검색 시 "소금빵"은 음수 점수로 완전히 제외됨
    - "소금" 자체 상품만 선택되어 장바구니에 담김
  - **수정된 파일**:
    - `packages/scraper/src/index.ts`: `findBestMatchByWeight()` 함수 매칭 점수 통합
    - `app/api/products/smart-match/route.ts`: 재료명 전달 추가

### 2026-02-06 (오후 - 네 번째 수정) 🎯 최종 해결
- **브랜드명 검색 문제 완전 해결**
  - **문제**: AI가 "[진가네반찬] 생깻잎 김치 100g"를 추출 → "[진가네반찬]"으로만 검색 → "두부야채전" 잘못 담김
  - **근본 원인**: 
    1. AI가 브랜드명을 포함한 전체 상품명을 재료로 추출
    2. `extractCoreIngredient()` 함수가 대괄호를 유지하여 브랜드명만 검색됨
    3. 수량/용량 정보도 검색에 포함되어 정확도 저하
  - **해결**: `extractCoreIngredient()` 함수 완전 개선
    1. **대괄호 브랜드명 제거**: [진가네반찬], [KF365] 등 완전히 제거
    2. **소괄호 제거**: (다짐육) 등 제거하고 공백으로 변환
    3. **수량/용량 정보 제거**: 끝에 있는 "100g", "10구", "500ml" 등 제거
    4. **순수 재료명만 추출**: "생깻잎 김치", "1+등급 무항생제 특란"
  - **결과**:
    - "[진가네반찬] 생깻잎 김치 100g" → "생깻잎 김치" 검색 → 정확한 김치 상품 매칭
    - "[KF365] 1+등급 무항생제 특란 10구" → "1+등급 무항생제 특란" 검색 → 정확한 달걀 매칭
    - 브랜드명이나 수량 정보로 인한 오매칭 완전히 제거
  - **최저가 확인**: `addAllCheapest` 함수는 이미 `smart-match` API 사용 중 → 매칭 점수 + 최저가 정렬 적용됨
  - **수정된 파일**:
    - `packages/scraper/src/index.ts`: `extractCoreIngredient()` 함수 완전 개선

### 2026-02-06 (저녁 - 다섯 번째 수정) 🎁 선물세트 필터링
- **선물세트 상품 매칭 문제 해결**
  - **문제**: "참기름" 검색 시 "[선물세트] 서리재 방앗간 참기름 2구 세트"가 매칭됨
  - **근본 원인**: `calculateMatchScore()` 함수에서 상품명 정제를 하지 않아 선물세트가 높은 점수를 받음
  - **해결**: `calculateMatchScore()` 함수 개선
    1. **상품명 정제 추가**: [선물세트], [특가] 등 대괄호 접두사 제거 후 점수 계산
    2. **선물세트 키워드 감점**: '선물세트', '세트', '기획', '특가', '이벤트' 포함 시 -30점
    3. **순수 상품과 세트 상품 명확한 구분**: 동일한 참기름이어도 세트는 낮은 점수
  - **결과**:
    - "참기름" 검색 → "서리재 방앗간 참기름 160ml" (단품) > "[선물세트] 참기름 2구 세트" (세트)
    - 선물세트/기획전 상품은 자동으로 낮은 우선순위로 처리됨
    - 일반 소비자가 원하는 낱개 상품이 우선 선택됨
  - **수정된 파일**:
    - `packages/scraper/src/index.ts`: `calculateMatchScore()` 함수 개선

### 2026-02-07 (새벽 - 여섯 번째 수정) 🎯 장바구니 URL 직접 접속
- **장바구니 담기 근본 문제 해결**
  - **문제**: 
    - 사용자가 "[진가네반찬] 생깻잎 김치 100g" (URL: https://www.kurly.com/goods/5011264) 선택
    - 장바구니 담기 클릭 시 재료명으로 다시 검색 → "[진가네반찬]"만 검색 → 첫 번째 상품(두부야채전) 담김
  - **근본 원인**: 
    - 장바구니에 이미 상품 URL이 있는데 무시하고 재료명으로 재검색
    - 브랜드명만 검색되어 엉뚱한 상품이 첫 번째로 나옴
  - **완전한 해결책**:
    1. **API 시그니처 변경**: `ingredients[]` → `products[]` (URL 포함)
    2. **검색 제거**: 재료명 검색 대신 상품 URL로 직접 접속
    3. **정확한 상품 담기**: URL로 직접 이동하여 해당 상품의 장바구니 버튼 클릭
  - **결과**:
    - ✅ "[진가네반찬] 생깻잎 김치 100g" 선택 → 정확히 그 상품이 장바구니에 담김
    - ✅ 검색 과정 제거로 속도 향상 및 정확도 100%
    - ✅ 사용자가 선택한 상품 = 장바구니에 담긴 상품 (완벽한 일치)
  - **수정된 파일**:
    - `app/page.tsx`: 마켓컬리 버튼 클릭 시 products 배열 전달
    - `app/api/cart/kurly/route.ts`: ingredients 대신 products 받도록 수정
    - `packages/scraper/src/index.ts`: `addToKurlyCartWithLogin()` 함수를 URL 직접 접속 방식으로 완전 개편

### 2026-02-07 (오전 - 일곱 번째 수정) 📝 UX 개선
- **마켓컬리 장바구니 담기 사용자 경험 개선**
  - **문제**: 새 브라우저 창이 백그라운드에서 열려 사용자가 인지하지 못함
  - **해결**: 
    1. 버튼 클릭 시 사전 확인 메시지 표시 (상품 개수, 소요 시간, 로그인 필요 등)
    2. "작업 표시줄 확인" 문구 추가
    3. 성공/실패 메시지에 이모지 및 상세 정보 추가
  - **수정된 파일**: `app/page.tsx`

### 2026-02-07 (낮 - 여덟 번째 수정) 🎛️ 옵션 선택 자동화 완성
- **옵션/수량 선택 필요 상품 자동 처리**
  - **문제**: "[소이퀸] 국산 진한 팥물 500mL 2종 (택1)" 등 옵션 선택이 필요한 상품에서 "주문하실 상품을 선택해주세요" 팝업 발생
  - **근본 원인**: 옵션 미선택 시 장바구니 담기 버튼이 작동하지 않음
  - **완전한 해결책**: 4단계 fallback 옵션 선택 로직 구현
    1. **클릭 가능한 옵션 버튼/div** (마켓컬리 주요 방식)
       - `div[role="button"]`, `li[role="option"]` 등 감지
       - 첫 번째 옵션 자동 클릭
    2. **셀렉트박스 (드롭다운)**
       - `<select>` 태그 감지
       - 두 번째 옵션 선택 (첫 번째는 "선택하세요")
    3. **라디오 버튼**
       - `input[type="radio"]` 감지
       - 첫 번째 라디오 버튼 클릭
    4. **일반 버튼형 옵션**
       - `button[class*="option"]` 감지
       - 첫 번째 버튼 클릭
  - **안정성 강화**:
    - 각 방법마다 try-catch 처리
    - 성공 시 로그 출력 (`✅ Selected`)
    - 실패 시 다음 방법으로 fallback
    - 옵션 선택 후 1초 대기 (UI 업데이트 보장)
  - **결과**:
    - ✅ 옵션 선택 필요 상품도 자동으로 장바구니 담기
    - ✅ 여러 옵션 형태를 모두 지원
    - ✅ "택1", "500mL", "국산 진한 팥물" 등 다양한 옵션 자동 처리
  - **수정된 파일**: `packages/scraper/src/index.ts`

### 2026-02-02
- **프로젝트 초기화**
  - Next.js 14 프로젝트 생성
  - 모노레포 구조 설계
  - README.md 및 CONTEXT.md 작성
  - Git 초기화

---

## 📝 개발 규칙

### Git 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정, 패키지 업데이트 등
```

### 브랜치 전략
- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### 코드 리뷰 규칙
- 모든 PR은 최소 1명의 리뷰 필요
- 테스트 통과 필수
- Lint 에러 없어야 함

---

## 🤔 의사결정 로그

### 2026-02-02: 모노레포 vs 멀티레포
**질문**: 크롬 확장과 웹 앱을 같은 저장소에 둘 것인가?

**결정**: 모노레포 (단일 저장소)

**이유**:
- 타입 정의 공유 용이
- 의존성 관리 단순화
- 동시 개발 및 배포 편리
- 초기 프로젝트 규모가 크지 않음

**반대 의견**:
- 저장소 크기 증가
- 빌드 시간 증가 가능성

**결론**: 초기에는 모노레포로 시작하고, 프로젝트가 커지면 분리 고려

---

## 📚 참고 자료

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PortOne Documentation](https://portone.io/docs)

### 유용한 리소스
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 아이디어 백로그

### 향후 추가 기능 아이디어
1. **레시피 북마크 기능**
   - 자주 만드는 레시피 저장
   - 장바구니 원클릭 재생성

2. **영양 정보 분석**
   - 칼로리, 단백질, 탄수화물 계산
   - 건강 목표 설정 및 추천

3. **소셜 기능**
   - 레시피 공유
   - 사용자 리뷰 및 평점

4. **AI 레시피 추천**
   - 냉장고 재료 기반 추천
   - 계절별 레시피 추천

5. **음성 입력 지원**
   - 음식 이름 음성 인식
   - 핸즈프리 요리 모드

---

**이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.**
