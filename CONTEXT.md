# 📘 CONTEXT.md - 개발 컨텍스트 및 히스토리

> 이 문서는 프로젝트의 현재 개발 단계, 주요 결정 사항, 다음 작업 목표를 추적합니다.
> 모든 중요한 변경사항과 결정은 이 문서에 기록되어야 합니다.

---

## 📅 최종 업데이트
**날짜**: 2026-02-02  
**작성자**: Atlas (OhMyOpenCode)  
**현재 단계**: 프로젝트 초기화 완료

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

## 🚧 다음 작업 목표 (Phase 1)

### 우선순위 1: 환경 설정 및 기본 인프라
- [ ] `.env.example` 파일 생성 (필요한 환경 변수 템플릿)
- [ ] Prisma 스키마 설계
  - User 모델 (사용자 정보)
  - Recipe 모델 (레시피 정보)
  - Ingredient 모델 (식재료)
  - SearchHistory 모델 (검색 이력)
  - Product 모델 (상품 정보 캐시)
- [ ] Prisma 마이그레이션 실행
- [ ] Redis 연결 설정 (캐싱용)

### 우선순위 2: 핵심 기능 구현
- [ ] YouTube 데이터 추출 모듈 (`packages/scraper/youtube.ts`)
  - YouTube Data API 연동
  - 자막/설명 추출
  - Shorts 지원
- [ ] Claude API 통합 (`packages/ai/claude.ts`)
  - 식재료 추출 프롬프트 작성
  - JSON 구조화된 응답 파싱
  - 에러 핸들링
- [ ] 이커머스 스크래퍼 (`packages/scraper/ecommerce.ts`)
  - 배민 스크래퍼
  - 쿠팡 스크래퍼
  - 마켓컬리 스크래퍼
  - 가격 및 칼로리 정보 추출

### 우선순위 3: 프론트엔드 UI
- [ ] 메인 페이지 (`app/page.tsx`)
  - 유튜브 링크 입력 폼
  - 음식 이름 입력 폼
  - 로딩 상태 표시
- [ ] 결과 페이지 (`app/results/page.tsx`)
  - 추출된 식재료 리스트
  - 플랫폼별 상품 비교
  - 장바구니 추가 버튼
- [ ] 관리자 대시보드 (`app/admin/page.tsx`)
  - 사용자 통계
  - 검색 이력 분석
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
