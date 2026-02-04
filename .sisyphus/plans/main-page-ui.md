# 메인 페이지 UI 구현

## TL;DR

> **Quick Summary**: Next.js 메인 페이지에 유튜브 링크와 음식명 입력 폼 구현, 최저가/저칼로리 필터 추가
> 
> **Deliverables**:
> - `app/page.tsx` 파일 수정 (입력 폼 및 필터 UI)
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - sequential
> **Critical Path**: Task 1 (단일 작업)

---

## Context

### Original Request
사용자 요청: "Next.js 메인 페이지에 유튜브 링크와 음식명을 입력할 입력을 생성해줘. '최저가/저칼로리' 필터 버튼을 포함하고, Tailwind로 깔끔하게 디자인해줘. 작업 후 CONTEXT.md를 업데이트해."

### Current State
- Next.js 14 프로젝트 초기화 완료
- 기본 템플릿 페이지가 `app/page.tsx`에 존재
- Tailwind CSS 설정 완료

### Research Findings
- 현재 `app/page.tsx`는 Next.js 기본 템플릿 사용 중
- 'use client' 지시문 필요 (useState 사용을 위해)
- Tailwind CSS로 반응형 디자인 구현 가능

---

## Work Objectives

### Core Objective
유튜브 레시피 링크 또는 음식명을 입력받고 필터 옵션을 선택할 수 있는 사용자 친화적인 메인 페이지 UI 구현

### Concrete Deliverables
- `app/page.tsx` 파일 수정 (React 컴포넌트)
- `CONTEXT.md` 업데이트

### Definition of Done
- [ ] 유튜브 링크 입력 필드 작동 확인
- [ ] 음식명 입력 필드 작동 확인
- [ ] 최저가 필터 버튼 토글 작동 확인
- [ ] 저칼로리 필터 버튼 토글 작동 확인
- [ ] 검색 버튼 클릭 시 콘솔에 입력값 출력 확인
- [ ] 반응형 디자인 동작 확인 (모바일, 태블릿, 데스크탑)
- [ ] 브라우저에서 `npm run dev` 실행 후 http://localhost:3000 접속하여 UI 확인

### Must Have
- 유튜브 URL 입력 필드
- 음식명 텍스트 입력 필드
- 최저가 필터 버튼 (토글 가능, 활성화 시 파란색)
- 저칼로리 필터 버튼 (토글 가능, 활성화 시 초록색)
- 식재료 찾기 버튼
- 입력 유효성 검사 (둘 중 하나는 입력되어야 함)
- 깔끔한 Tailwind CSS 디자인
- 반응형 레이아웃

### Must NOT Have (Guardrails)
- 실제 API 호출 로직 (아직 백엔드 미구현)
- 라우팅 변경 (현재 페이지에서만 작동)
- 외부 라이브러리 추가 (Tailwind만 사용)
- 복잡한 상태 관리 라이브러리 (useState만 충분)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (테스트 미설정)
- **User wants tests**: NO
- **Framework**: 없음
- **QA approach**: Manual verification (브라우저 확인)

### Manual Verification Procedures

**For Frontend/UI changes** (using browser):
```
Agent executes via browser:
1. Command: npm run dev (개발 서버 실행)
2. Navigate to: http://localhost:3000
3. Test: 유튜브 링크 입력 필드에 텍스트 입력 가능 확인
4. Test: 음식명 입력 필드에 텍스트 입력 가능 확인
5. Click: 최저가 버튼 → 파란색으로 변경 확인
6. Click: 저칼로리 버튼 → 초록색으로 변경 확인
7. Click: 식재료 찾기 버튼 → 콘솔에 입력값 출력 확인
8. Test: 빈 입력 상태로 검색 버튼 클릭 → alert 표시 확인
9. Test: 브라우저 크기 변경 (모바일 뷰) → 레이아웃 반응형 확인
```

**Evidence to Capture:**
- [ ] 개발 서버 정상 실행 (에러 없음)
- [ ] 브라우저에서 페이지 로딩 성공
- [ ] 모든 입력 필드 정상 작동
- [ ] 필터 버튼 토글 정상 작동
- [ ] 콘솔에 올바른 데이터 출력

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
└── Task 1: app/page.tsx 수정 및 UI 구현

Wave 2 (After Wave 1):
└── Task 2: CONTEXT.md 업데이트

Critical Path: Task 1 → Task 2
Parallel Speedup: N/A (순차 실행)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | None |
| 2 | 1 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | delegate_task(category="visual-engineering", load_skills=["frontend-ui-ux"], run_in_background=true) |
| 2 | 2 | delegate_task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

- [ ] 1. app/page.tsx 수정 - 입력 폼 및 필터 UI 구현

  **What to do**:
  - 기존 `app/page.tsx` 파일 읽기
  - 'use client' 지시문 추가 (React Hooks 사용을 위해)
  - useState 훅으로 상태 관리:
    - `youtubeUrl`: 유튜브 링크 입력값
    - `dishName`: 음식명 입력값
    - `lowestPrice`: 최저가 필터 활성화 여부 (boolean)
    - `lowCalorie`: 저칼로리 필터 활성화 여부 (boolean)
  - 입력 폼 UI 구현:
    - 유튜브 링크 입력 필드 (type="url", placeholder 포함)
    - "또는" 구분선
    - 음식명 입력 필드 (type="text", placeholder 포함)
  - 필터 버튼 UI 구현:
    - 최저가 버튼 (활성화 시 bg-blue-500, 비활성화 시 bg-gray-100)
    - 저칼로리 버튼 (활성화 시 bg-green-500, 비활성화 시 bg-gray-100)
  - 검색 버튼 구현:
    - 클릭 핸들러 추가
    - 입력 유효성 검사 (둘 중 하나는 입력되어야 함)
    - 콘솔에 입력값과 필터 상태 출력
  - Tailwind CSS 스타일링:
    - 중앙 정렬 레이아웃
    - 그라데이션 배경 (bg-gradient-to-br from-orange-50 via-white to-green-50)
    - 카드 디자인 (rounded-3xl, shadow-2xl)
    - 호버 효과 (hover:scale, transition-all)
    - 반응형 클래스 (md:, sm:)

  **Must NOT do**:
  - API 호출 로직 추가하지 말 것
  - 외부 라이브러리 import 하지 말 것
  - 복잡한 로직 구현하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 프론트엔드 UI 구현 작업으로, 디자인 및 사용자 경험에 집중
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React 컴포넌트 구현, Tailwind CSS 스타일링, 반응형 디자인 전문

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (단독)
  - **Blocks**: Task 2 (CONTEXT.md 업데이트)
  - **Blocked By**: None (시작 즉시 실행 가능)

  **References**:

  **Pattern References** (existing code to follow):
  - `app/layout.tsx` - Next.js App Router 구조 참고
  - `app/globals.css` - Tailwind CSS 설정 확인

  **API/Type References** (contracts to implement against):
  - `packages/shared/src/types.ts:SearchRequest` - 검색 요청 타입 구조 참고

  **Documentation References**:
  - Next.js 14 App Router: https://nextjs.org/docs/app
  - React Hooks (useState): https://react.dev/reference/react/useState
  - Tailwind CSS: https://tailwindcss.com/docs

  **WHY Each Reference Matters**:
  - `app/layout.tsx`: Next.js App Router의 기본 구조와 메타데이터 설정 방식 이해
  - `packages/shared/src/types.ts`: 향후 API 연동 시 사용할 타입 구조 미리 파악
  - Tailwind CSS 문서: 반응형 클래스 및 그라데이션 구현 방법 확인

  **Acceptance Criteria**:

  **Manual Verification (브라우저 테스트):**
  ```bash
  # Agent runs:
  npm run dev
  # Assert: Dev server starts without errors
  # Assert: Terminal shows "Local: http://localhost:3000"
  
  # Browser navigation:
  # 1. Open http://localhost:3000
  # 2. Assert: 페이지 로딩 성공, UI 표시됨
  # 3. Type in 유튜브 링크 입력: "https://youtube.com/watch?v=test"
  # 4. Assert: 입력값 표시됨
  # 5. Click 최저가 버튼
  # 6. Assert: 버튼 색상이 파란색으로 변경
  # 7. Click 저칼로리 버튼
  # 8. Assert: 버튼 색상이 초록색으로 변경
  # 9. Click 식재료 찾기 버튼
  # 10. Open browser console (F12)
  # 11. Assert: 콘솔에 입력값과 필터 상태 출력됨
  # 12. Resize browser window to mobile size (< 768px)
  # 13. Assert: 레이아웃이 모바일에 맞게 조정됨
  ```

  **Evidence to Capture:**
  - [ ] Terminal output showing dev server running
  - [ ] Browser console log showing correct input values
  - [ ] Visual confirmation of responsive layout

  **Commit**: YES
  - Message: `feat(ui): 메인 페이지 입력 폼 및 필터 UI 구현`
  - Files: `app/page.tsx`
  - Pre-commit: `npm run build` (TypeScript 타입 체크)

---

- [ ] 2. CONTEXT.md 업데이트 - 메인 페이지 작업 기록

  **What to do**:
  - `CONTEXT.md` 파일 읽기
  - "🏗️ 현재 개발 단계" 섹션 업데이트:
    - Phase 1의 "우선순위 3: 프론트엔드 UI" 하위 항목 체크
    - "메인 페이지 (`app/page.tsx`)" 항목을 완료로 변경
  - "🔄 변경 이력" 섹션에 새 항목 추가:
    - 날짜: 2026-02-02
    - 내용: "메인 페이지 UI 구현 - 유튜브 링크 및 음식명 입력, 필터 버튼 추가"

  **Must NOT do**:
  - 다른 섹션 수정하지 말 것
  - 과도한 내용 추가하지 말 것

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단순 문서 업데이트 작업
  - **Skills**: []
    - 추가 스킬 불필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (After Task 1)
  - **Blocks**: None
  - **Blocked By**: Task 1 (메인 페이지 구현 완료 후)

  **References**:

  **Pattern References**:
  - `CONTEXT.md` - 기존 문서 구조 및 작성 스타일 참고

  **Acceptance Criteria**:

  **Manual Verification:**
  ```bash
  # Agent runs:
  cat CONTEXT.md | grep "메인 페이지"
  # Assert: 메인 페이지 완료 표시 확인
  
  cat CONTEXT.md | grep "2026-02-02"
  # Assert: 변경 이력에 새 항목 추가 확인
  ```

  **Evidence to Capture:**
  - [ ] CONTEXT.md 파일 수정 확인
  - [ ] Git diff로 변경사항 확인

  **Commit**: YES
  - Message: `docs: CONTEXT.md 업데이트 - 메인 페이지 구현 기록`
  - Files: `CONTEXT.md`
  - Pre-commit: None

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(ui): 메인 페이지 입력 폼 및 필터 UI 구현` | app/page.tsx | npm run build |
| 2 | `docs: CONTEXT.md 업데이트 - 메인 페이지 구현 기록` | CONTEXT.md | cat CONTEXT.md |

---

## Success Criteria

### Verification Commands
```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트 (TypeScript 타입 체크)
npm run build
```

### Final Checklist
- [ ] 유튜브 링크 입력 필드 정상 작동
- [ ] 음식명 입력 필드 정상 작동
- [ ] 최저가 필터 버튼 토글 작동
- [ ] 저칼로리 필터 버튼 토글 작동
- [ ] 검색 버튼 클릭 시 콘솔 출력 확인
- [ ] 반응형 디자인 작동 확인
- [ ] CONTEXT.md 업데이트 확인
- [ ] Git 커밋 완료
