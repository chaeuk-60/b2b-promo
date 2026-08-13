# 프로젝트 구조 설계 원칙: b2b-promo

기반 문서: `docs/1-domain-definition.md`, `docs/2-pet-design-guide.md`, `docs/3-PRD.md`, `docs/4-use-case-diagram.md`, `docs/5-user-scenarios.md`
전제: 1인 개발, 3일 일정, 오버엔지니어링 금지(CLAUDE.md 최우선 지침)

---

## 1. 최상위 원칙 (모든 스택 공통)

- **문서에 없는 걸 만들지 않는다.** 도메인 정의서(펫 상태머신, 프로모션/신청/찜)에 없는 계층·기능·추상화는 추가하지 않는다.
- **작은 앱은 작은 구조로.** 3일 완성 목표. 파일 수·레이어 수는 항상 "이게 없으면 실제로 문제가 생기는가?"로 판단한다.
- **규칙은 한 곳에만 존재한다.** 펫 전이 규칙(확률, 하루 리셋 등)처럼 복잡한 로직은 한 함수/모듈에 모아 중복 구현을 막는다.
- **DB 제약으로 해결되면 앱 코드로 만들지 않는다.** 예: 사용자-펫 1:1은 `pet.user_id UNIQUE`로, 중복 신청 방지는 `(user_id, promotion_id) UNIQUE`로 해결한다.

## 2. 의존성/레이어 원칙

- 의존 방향은 항상 **route → service(도메인 로직) → db(pg 쿼리)** 한 방향. 역방향 참조 금지, 순환 의존 금지.
- 프론트는 **component → hook(TanStack Query) → api client**. 컴포넌트가 axios/fetch를 직접 호출하지 않는다.
- 계층은 딱 이 3개까지만. repository 패턴, DI 컨테이너, CQRS, 이벤트 버스 등은 도입하지 않는다(트래픽·팀 규모상 불필요).
- 예: 펫 급여(feed) 로직은 `services/pet.service.js` 하나에만 있고, route 핸들러와 배치/스케줄러(있다면)가 이 함수를 같이 호출한다. 두 곳에 각자 확률 계산을 복사하지 않는다.
- 도메인 간 참조는 1방향만 허용: `promotion` 도메인은 `pet`을 몰라도 되지만, `pet`(특식 급여)은 `promotion`(specialFoodId)을 참조해야 한다. 이 방향을 반대로 만들지 않는다.

## 3. 코드/네이밍 원칙

- **엔티티/필드명은 도메인 정의서 용어를 그대로 코드에 반영**한다. `stage`, `mood`, `eggState`, `activityCount`, `requestedPromotionId`, `lastActiveAt`, `lastGiftAt`, `stageChangedAt`, `earType` — DB 컬럼(snake_case)과 JS 변수(camelCase) 간 이름만 케이스 변환하고 의미는 바꾸지 않는다.
- enum 값은 도메인 정의서 표에 있는 값만 사용한다. 예: mood는 `더러움/배고픔/삐짐/평범/행복/무지개/반짝이/특식 요청` 8종 외 임의 상태를 만들지 않는다(영문 slug로 옮길 경우 매핑 테이블 하나만 둔다).
- 파일명은 `기능명.역할.js` 형식(예: `pet.service.js`, `pet.routes.js`, `promotion.controller.js`)으로 통일해 어디에 뭐가 있는지 파일명만 보고 알 수 있게 한다.
- 함수명은 도메인 동사를 그대로 쓴다: `feedPet`, `bathePet`, `patPet`, `toggleFavorite`, `applyPromotion` — 범용적인 `handleAction`, `process` 같은 이름 금지.

## 4. 테스트/품질 원칙

- 3일 일정상 전체 커버리지 목표를 잡지 않는다. **확률/분기가 있는 로직만** 테스트한다: 성장 전이(50% 판정), 특식 요청 대상 선정(70% 가중치), 자발적 급여 특수효과(10%→50/50), 성체 선물(5%+3일 쿨다운), 사망 vs 성체순환 우선순위.
- 테스트는 확률 시드를 주입 가능하게(Math.random을 함수 인자로 받거나 mock) 만들어 "특정 확률 분기가 선택됐을 때 상태가 올바른가"만 검증한다. 통계적 분포 검증(수천 번 반복) 같은 건 만들지 않는다.
- E2E는 유스케이스 다이어그램의 핵심 플로우 1~2개(가입→로그인→펫 생성, 신청→특식 보유→급여)만 커버하면 충분하다.
- 린트/포맷터(ESLint+Prettier 기본 설정)만 두고, 커스텀 룰·커밋훅 파이프라인은 만들지 않는다.

## 5. 설정/보안/운영 원칙

- **환경변수**: `.env`(로컬)로 관리, `.env.example` 커밋. 최소 목록: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`. 시크릿은 절대 커밋하지 않는다.
- **JWT**: PRD 5.1절 그대로 — 액세스 토큰 15분 만료(Bearer 헤더), 리프레시 토큰 14일 만료(httpOnly 쿠키). 리프레시 토큰은 `refresh_tokens` 테이블에 해시로 저장하고, 로그아웃·강제 만료는 해당 행 DELETE로 처리한다. revoked 플래그·토큰 로테이션 이력·Redis 블랙리스트는 미리 만들지 않는다.
- **비밀번호**: bcrypt 해시 저장. 평문 저장/자체 암호화 금지.
- **로깅**: 콘솔 기반 구조화 로그(요청 메서드/경로/상태코드/소요시간) 정도면 충분. 별도 로그 수집 인프라(ELK 등)는 이번 범위에 넣지 않는다.
- **자정 기준 하루 판정**(mood/eggState 리셋, 오늘의 운세, 접속 횟수)은 서버 타임존을 명시적으로 고정(KST)해서 처리하고, 클라이언트 로컬 시간에 의존하지 않는다.
- **관리자 권한**: PRD대로 별도 RBAC 없이 단일 관리자 계정(예: 특정 email 화이트리스트 또는 role 컬럼 1개)으로 충분. 권한 테이블/정책 엔진 도입 금지.

## 6. 프론트엔드 디렉토리 구조 (React 19 + Zustand + TanStack Query)

```
frontend/src/
  api/                # axios 인스턴스 + 도메인별 API 함수(fetch만, 캐싱 없음)
    client.js         # baseURL, 인터셉터(액세스 토큰 자동 첨부, 401 시 리프레시)
    auth.api.js
    promotion.api.js
    pet.api.js
  hooks/              # TanStack Query 훅 (도메인별)
    useAuth.js
    usePromotions.js       # 목록/상세 useQuery
    useApplyPromotion.js   # useMutation
    useToggleFavorite.js
    usePet.js               # 펫 조회 useQuery
    usePetAction.js         # 목욕/밥/쓰다듬기/운세 useMutation
  store/              # Zustand — 서버 상태 아닌 것만(로그인 사용자 정보, UI 토글 등)
    auth.store.js
  pages/              # 라우트 단위 화면
    LoginPage.jsx
    PromotionListPage.jsx
    PromotionDetailPage.jsx
    MyApplicationsPage.jsx
    PetPage.jsx
  components/         # 재사용 UI 컴포넌트
    promotion/
      PromotionCard.jsx
      FavoriteButton.jsx
    pet/
      PetView.jsx       # stage/mood/eggState에 따라 스프라이트 렌더
      PetActionButtons.jsx
  App.jsx
  main.jsx
```

- 서버 상태(프로모션 목록, 펫 상태 등)는 **전부 TanStack Query**로 관리. Zustand에 서버 데이터를 복제해서 넣지 않는다(둘 다 캐시를 갖는 이중 관리 금지).
- Zustand는 로그인 사용자 정보(디코딩된 JWT 클레임 정도), 전역 UI 상태 정도만 담당.
- 펫 스프라이트는 `2-pet-design-guide.md` 기준 베이스(귀 5종) + mood 오버레이 조합을 `PetView.jsx` 한 컴포넌트 안에서 `stage/mood/eggState/earType`로 분기 렌더링. 컴포넌트를 40개로 쪼개지 않는다.

## 7. 백엔드 디렉토리 구조 (Node.js + Express + pg + PostgreSQL)

```
backend/src/
  db/
    pool.js               # pg Pool 생성/export
    migrations/           # SQL 마이그레이션 파일(순번 prefix), node-pg-migrate 등 가벼운 도구 사용
      001_init.sql         # users, promotions, applications, favorites, pets
  middleware/
    auth.middleware.js    # Authorization: Bearer 검증, req.user 세팅
    error.middleware.js   # 공통 에러 핸들러 → { error: { code, message } } 통일 응답
  routes/
    auth.routes.js
    promotion.routes.js
    pet.routes.js
  controllers/            # req/res 파싱 + 응답, 로직 없음
    auth.controller.js
    promotion.controller.js
    pet.controller.js
  services/                # 도메인 로직 전부 여기 (route/controller에 로직 두지 않음)
    auth.service.js         # 회원가입, 로그인, 토큰 발급/재발급
    promotion.service.js    # 목록/상세/신청/찜, 기간·중복 검증
    pet.service.js          # 5장 상태머신 전체(전이/확률/특식요청/선물지급/사망/성체순환)
  jobs/
    dailyReset.js          # (선택) 자정 배치가 필요하면 여기. 아니면 로그인 시점 lazy 계산으로 대체 가능
  app.js                    # express 앱 조립, 미들웨어 등록
  server.js                 # listen
```

- **`pet.service.js`가 이 프로젝트에서 가장 복잡한 파일**이 되는 것을 인정하고, 억지로 잘게 쪼개지 않는다. 다만 함수는 규칙 단위로 분리한다: `resolveMoodOnLogin`, `applyAction(action)`, `feedSpecialFood`, `checkStageTransition`, `checkDeathOrCycle`, `maybeGrantGift`. 이 정도 함수 분리로 충분하며, 이걸 다시 여러 클래스/전략 패턴으로 감싸지 않는다.
- 하루 단위 리셋(mood/eggState, 오늘의 운세, 접속횟수)은 **별도 배치 잡 없이 로그인 API 호출 시점에 "마지막 갱신일 != 오늘이면 리셋"으로 lazy 처리**한다. cron/스케줄러를 새로 띄우는 건 이번 범위에서 불필요.
- 쿼리는 `pg`로 직접 SQL 작성(파라미터 바인딩으로 SQL 인젝션 방지). ORM(Prisma/Sequelize) 도입은 일정상 생략 — PRD 기술스택에도 명시되어 있지 않음.
- 트랜잭션이 필요한 곳(신청 시 신청 레코드 생성 + 특식 보유 처리, 성체 순환 시 펫 리셋 + 쿠폰 지급)은 `pool.connect()` 후 `BEGIN/COMMIT/ROLLBACK`으로 명시적으로 감싼다.
- 에러 응답 포맷은 하나로 통일(`error.middleware.js`)하고, 컨트롤러마다 다른 형태로 응답하지 않는다.
