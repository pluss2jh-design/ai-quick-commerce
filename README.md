# 🛒 유튜브/음식명 기반 식재료 자동 장바구니 서비스

AI를 활용하여 유튜브 레시피 영상이나 음식 이름에서 식재료를 자동으로 추출하고, 여러 이커머스 플랫폼에서 최적의 상품을 찾아 장바구니에 자동으로 담아주는 서비스입니다.

## 📋 주요 기능

### 1. 입력 처리
- 유튜브 링크 (일반 영상 및 Shorts) 입력
- 음식 이름 직접 입력

### 2. AI 기반 식재료 추출
- Claude API를 활용한 레시피 분석
- 식재료 리스트 및 분량 자동 추출
- 한국어 레시피 최적화

### 3. 스마트 상품 매핑
- 배민, 쿠팡, 마켓컬리 등 주요 플랫폼 검색
- **저가격** 및 **저칼로리** 기준 최적화
- 실시간 가격 비교

### 4. 크롬 확장 프로그램
- 원클릭 장바구니 자동 추가
- 여러 플랫폼 동시 지원
- Manifest V3 기반

### 5. 결제 시스템
- 포트원(PortOne) 통합 결제
- 카카오페이, 네이버페이 등 한국 결제 수단 지원

### 6. 관리자 대시보드
- `/admin` 경로에서 접근
- 사용자 통계 및 분석
- 링크 분석 현황

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React**

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL**
- **Redis** (캐싱)

### AI & Automation
- **Anthropic Claude API** (식재료 추출)
- **Playwright** (웹 스크래핑)
- **YouTube Data API** (영상 정보 추출)

### Chrome Extension
- **Manifest V3**
- **TypeScript**

### Payment
- **PortOne** (구 아임포트)

### DevOps
- **Vercel** (프론트엔드 배포)
- **Railway** (데이터베이스)
- **Git** (버전 관리)

## 📁 프로젝트 구조

```
ingredient-cart-service/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── admin/             # 관리자 대시보드
│   └── api/               # API 라우트
├── apps/
│   └── extension/         # 크롬 확장 프로그램
├── packages/
│   ├── database/          # Prisma 스키마 및 DB 로직
│   ├── ai/                # Claude API 래퍼
│   ├── scraper/           # Playwright 스크래퍼
│   └── shared/            # 공통 타입 및 유틸리티
├── public/                # 정적 파일
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 함수
├── README.md              # 이 파일
├── CONTEXT.md             # 개발 컨텍스트 및 히스토리
└── package.json           # 의존성 관리
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 18.x 이상
- **npm** 또는 **pnpm**
- **PostgreSQL** 데이터베이스
- **Redis** (선택사항, 캐싱용)

### 설치 방법

1. **저장소 클론**
```bash
git clone <repository-url>
cd ingredient-cart-service
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env.local
```

`.env.local` 파일에 다음 값들을 설정하세요:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ingredient_cart"

# AI
ANTHROPIC_API_KEY="your-claude-api-key"

# YouTube
YOUTUBE_API_KEY="your-youtube-api-key"

# Payment
PORTONE_API_KEY="your-portone-api-key"
PORTONE_API_SECRET="your-portone-secret"

# Redis (선택사항)
REDIS_URL="redis://localhost:6379"
```

4. **데이터베이스 마이그레이션**
```bash
npx prisma migrate dev
```

5. **개발 서버 실행**
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint

# 타입 체크
npm run type-check

# Prisma Studio 실행 (DB GUI)
npx prisma studio
```

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage
```

## 📦 크롬 확장 프로그램 빌드

```bash
cd apps/extension
npm run build
```

빌드된 확장 프로그램은 `apps/extension/dist` 폴더에 생성됩니다.

### 크롬에 로드하기
1. Chrome에서 `chrome://extensions` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `apps/extension/dist` 폴더 선택

## 🌐 배포

### Vercel 배포 (권장)

```bash
npm install -g vercel
vercel
```

### Docker 배포

```bash
docker build -t ingredient-cart-service .
docker run -p 3000:3000 ingredient-cart-service
```

## 📝 API 문서

API 엔드포인트 문서는 개발 서버 실행 후 `/api/docs`에서 확인할 수 있습니다.

### 주요 엔드포인트

- `POST /api/extract` - 유튜브 링크 또는 음식명에서 식재료 추출
- `POST /api/search` - 이커머스 플랫폼에서 상품 검색
- `POST /api/cart` - 장바구니에 상품 추가
- `POST /api/payment` - 결제 처리
- `GET /api/admin/stats` - 관리자 통계 (인증 필요)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

## 🙏 감사의 말

- [Next.js](https://nextjs.org/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Playwright](https://playwright.dev/)
- [PortOne](https://portone.io/)

---

**Made with ❤️ for better cooking experience**
