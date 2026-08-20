# b2b promo 프론트엔드 개발을 위한 지침

## 기술 스택 (반드시 준수, `3-PRD.md` 4장 근거)

| 구분 | 기술 |
|---|---|
| 플랫폼 | 웹 우선, 별도 모바일 앱 없이 반응형 UI로 대응(CSS만으로 처리, 컴포넌트 분기 금지) |
| 프론트엔드 프레임워크 | React 19 |
| 전역 상태관리 | Zustand — 클라이언트 UI 상태 전용(로그인 사용자 정보 등) |
| 백엔드 통신/서버 상태 | TanStack Query — API 데이터 캐싱/재조회 전용, 서버 상태를 Zustand에 중복 저장하지 않음 |
| 인증 | JWT 액세스 토큰 + 리프레시 토큰. 액세스 토큰은 `Authorization: Bearer` 헤더, 리프레시 토큰은 httpOnly 쿠키 |

위 표에 없는 항목(라우팅: react-router-dom, HTTP 클라이언트: axios, 빌드: Vite, 테스트: Vitest)은 PRD에 명시되지 않은 구현 선택이며 이미 코드베이스에 적용되어 있으므로 그대로 따른다. 새로운 상태관리/데이터 페칭 라이브러리를 임의로 추가하지 않는다.

## 디렉토리 구조

```
frontend/
└─ src/
   ├─ api/          axios 인스턴스 및 엔드포인트별 API 함수 (client.js, auth.api.js, pet.api.js, promotion.api.js)
   ├─ components/    재사용 UI 컴포넌트 (도메인별 하위 디렉토리, 예: promotion/)
   ├─ hooks/         TanStack Query 기반 커스텀 훅 (useAuth, usePet, usePromotions, useToggleFavorite 등)
   ├─ pages/         라우트 단위 화면 컴포넌트 + 페이지 전용 CSS
   ├─ store/         Zustand 클라이언트 상태 스토어 (auth.store.js 등)
   ├─ test/          Vitest 공통 설정 (setup.js)
   ├─ App.jsx        라우트 정의(<Routes>)
   └─ main.jsx       Provider 조립(QueryClientProvider, BrowserRouter) 및 엔트리포인트
```

- 각 소스 파일 옆에 동일 이름의 `*.test.jsx`/`*.test.js`를 둔다(테스트를 별도 디렉토리로 분리하지 않음).
- 서버 상태는 `hooks/`(TanStack Query)로, 클라이언트 UI 상태는 `store/`(Zustand)로 분리한다. 자세한 레이어링 원칙은 `6-project-principle.md` 참고.

## 참조 문서

프론트엔드 개발 전 아래 문서를 먼저 확인할 것(경로는 프로젝트 루트 `docs/` 기준).

| 문서명 | 문서 | 내용 |
|---|---|---|
| 도메인 정의서 | [`../docs/1-domain-definition.md`](../docs/1-domain-definition.md) | 용어, 엔티티, 펫 상태 전이 등 모든 비즈니스 규칙의 근거 |
| 펫 디자인 가이드 | [`../docs/2-pet-design-guide.md`](../docs/2-pet-design-guide.md) | 펫 픽셀아트 그리드/색상/귀 타입 — 펫 스프라이트 렌더링 근거 |
| PRD | [`../docs/3-PRD.md`](../docs/3-PRD.md) | 제품 요구사항 정의서 — 기술 스택, 기능 범위 |
| 사용자 시나리오 | [`../docs/5-user-scenarios.md`](../docs/5-user-scenarios.md) | 화면 흐름의 근거가 되는 사용자 시나리오 |
| 프로젝트 구조 설계 원칙 | [`../docs/6-project-principle.md`](../docs/6-project-principle.md) | 프로젝트 구조/코딩 원칙 — 프론트엔드 디렉토리 구조, 반응형은 CSS만으로 처리 |
| 프론트엔드 컴포넌트 구조 | [`../docs/7-arch-diagram.md`](../docs/7-arch-diagram.md) | 기술 아키텍처 및 프론트엔드 컴포넌트 구조 다이어그램 |
| 와이어프레임 | [`../docs/8-wireframe.md`](../docs/8-wireframe.md) | 화면별 와이어프레임 — UI 레이아웃의 1차 근거 |
| 실행계획 | [`../docs/10-plan.md`](../docs/10-plan.md) | DB/BE/FE 실행 계획 — Task별 작업 내용/선행관계/완료조건 |
| 펫 상태 다이어그램 | [`../docs/11-pet-state-diagram.md`](../docs/11-pet-state-diagram.md) | 펫 상태(stage/mood/eggState) 및 행동별 효과 — 화면 상태 표시 근거 |
| UI 스타일 가이드 | [`../docs/12-style.md`](../docs/12-style.md) | 레트로 픽셀아트 색상/폰트/버튼/카드 규칙 — 와이어프레임과 결합해 실제 UI 생성 |
| API 스펙 | [`../docs/swagger.json`](../docs/swagger.json) | OpenAPI 3.0 API 스펙 — 백엔드 통신 구현 근거 |
