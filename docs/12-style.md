# UI 스타일 가이드 (레트로 픽셀아트)

> 파일명 안내: 요청은 `10-style.md`였으나 `docs/10-plan.md`가 이미 그 번호를 쓰고 있어 다음 빈 번호인 `12`로 저장함(`11-pet-state-diagram.md` 다음). 이 문서는 첨부된 "PIXEL CONCEPT" 레퍼런스 이미지를 근거로 작성됨. FE-5 이후 화면과, 기존에 만든 FE-1~FE-4의 스타일 없는 화면에도 소급 적용하는 것을 전제로 한다.

## 1. 컨셉 한 줄 요약

레트로 게임보이 감성의 귀여운 픽셀아트. 두꺼운 검정 픽셀 테두리 + 파스텔 그라데이션 배경 + 도트 폰트 + 알약형 버튼. `2-pet-design-guide.md`의 8×8 도트 펫 스프라이트와 톤을 맞춘다(펫이 이 UI 안에서 살고 있다는 느낌).

## 2. 색상 팔레트

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg-sky-top` | `#BFE8F5` | 배경 그라데이션 상단(하늘) |
| `--bg-sky-bottom` | `#F3C9E0` | 배경 그라데이션 하단(노을) |
| `--bg-skyline` | `#6C5CE7` | 뒷배경 도시 실루엣(보라) |
| `--ink` | `#1A1A2E` | 텍스트 기본색, 픽셀 테두리(진남색에 가까운 블랙) |
| `--paper` | `#FFFFFF` | 카드/버튼 배경, 텍스트 아웃라인 |
| `--brand-blue` | `#3B6FE0` | 헤드라인, 주요 강조색(레퍼런스의 파란 픽셀 타이틀) |
| `--accent-green` | `#5FD068` | 주요 액션 버튼(START류 — 우리는 "신청하기"/"확인") |
| `--accent-pink` | `#FF7AB8` | 찜/하트, 보조 강조 |
| `--warn` | `#FF6B4A` | 기간종료/에러/삭제 등 경고 |
| `--muted` | `#8A8FA3` | 비활성 텍스트, 종료된 항목 |

페이지 배경: Y2K/레트로퓨처 컨셉 레퍼런스(사용자 제공)에 맞춰, 부드러운 `linear-gradient` 대신 60×34 격자에 칸마다 색을 찍고 밝기를 살짝 흔든(디더링) 픽셀 그라데이션 SVG(`frontend/public/images/app-bg.svg`, 시드 고정 스크립트로 생성)를 `background: url(...) center / cover fixed`로 깐다. 색 흐름은 민트/시안(위) → 옐로/골드(중간) → 핑크/마젠타(아래)의 대각선 그라데이션.

## 3. 타이포그래피

- **폰트**: 도트/픽셀 폰트 1종만 전역 사용 (예: `"Press Start 2P"`, `"DungGeunMo"` 등 웹폰트 — CDN 접근 가능한 환경이면 `@font-face`로 로드, 폰트 라이선스 확인 후 `frontend/public/fonts`에 넣고 로컬 서빙 권장). 폴백: `monospace`.
- **크기 스케일**: 12px(캡션) / 16px(본문) / 24px(섹션 제목) / 32px(페이지 타이틀). 도트 폰트 특성상 짝수·2의 배수 크기만 사용해 흐려짐 방지.
- **헤드라인 처리**: 레퍼런스처럼 두꺼운 흰색 텍스트 아웃라인(`text-shadow`로 4~8방향 반복) + 진한 남색 본문색.
  ```css
  .pixel-title {
    color: var(--brand-blue);
    text-shadow:
      2px 2px 0 var(--paper), -2px -2px 0 var(--paper),
      2px -2px 0 var(--paper), -2px 2px 0 var(--paper);
  }
  ```
- **작은 라벨**(레퍼런스의 "PITCH DECK DESIGN" 같은 태그): 대문자 + 자간(`letter-spacing: 0.05em`) + `--muted` 색, 12px.

## 4. 픽셀 테두리 & 모서리

- **카드/버튼**(주요·보조·찜 구분 없이)은 `border-radius`로 둥글리지 않는다. 대신 네 모서리를 계단형으로 잘라내는 **픽셀 노치**를 `clip-path: polygon(...)`으로 적용해 "픽셀 찍은 것 같은" 각진 모서리를 만든다(1단만 자르면 그냥 대각선 모서리처럼 보이므로 반드시 2단 이상으로 꺾는다). 단, **카드는 2단**, **버튼은 카드보다 작으므로 1단**만 자른다(버튼에 2단을 그대로 쓰면 꺾임이 상대적으로 너무 두꺼워 보임) - 버튼의 1단 두께는 카드 2단 중 한 칸(`--pixel-notch-half`)과 맞춘다. 버튼 종류 구분은 모양이 아니라 배경색으로만 한다 - 모양/높이가 버튼마다 다르면 오히려 일관성이 깨져 보인다.
  ```css
  :root {
    --pixel-notch: 10px;
    --pixel-notch-half: calc(var(--pixel-notch) / 2);
    --pixel-border: 3px;
    --pixel-corners: polygon(
      0 var(--pixel-notch), var(--pixel-notch-half) var(--pixel-notch), var(--pixel-notch-half) var(--pixel-notch-half),
      var(--pixel-notch) var(--pixel-notch-half), var(--pixel-notch) 0,
      calc(100% - var(--pixel-notch)) 0, calc(100% - var(--pixel-notch)) var(--pixel-notch-half),
      calc(100% - var(--pixel-notch-half)) var(--pixel-notch-half), calc(100% - var(--pixel-notch-half)) var(--pixel-notch), 100% var(--pixel-notch),
      100% calc(100% - var(--pixel-notch)), calc(100% - var(--pixel-notch-half)) calc(100% - var(--pixel-notch)),
      calc(100% - var(--pixel-notch-half)) calc(100% - var(--pixel-notch-half)), calc(100% - var(--pixel-notch)) calc(100% - var(--pixel-notch-half)), calc(100% - var(--pixel-notch)) 100%,
      var(--pixel-notch) 100%, var(--pixel-notch) calc(100% - var(--pixel-notch-half)),
      var(--pixel-notch-half) calc(100% - var(--pixel-notch-half)), var(--pixel-notch-half) calc(100% - var(--pixel-notch)), 0 calc(100% - var(--pixel-notch))
    );
    /* 버튼용 1단 노치: 위 2단 패턴에서 "반 칸"(--pixel-notch-half) 하나만 잘라낸 버전.
       좌표는 --pixel-notch 자리에 --pixel-notch-half를 넣은 동일한 12점 polygon. */
    --pixel-corners-btn: polygon(/* ... 위와 동일한 형태, --pixel-notch-half 기준 1단 ... */);
  }
  ```
- **주의**: `border` 속성은 `clip-path`가 잘라낸 대각선 모서리를 따라가지 못해서, 노치 모서리마다 테두리가 끊기고 빈틈이 생긴다(모서리가 "연결이 안 되는" 문제). 그래서 `border`를 쓰지 않고, "바깥은 잉크색 도형 전체, 그 위에 `--pixel-border`(3px)만큼 안쪽으로 종이색 도형을 겹쳐서" 테두리처럼 보이게 한다 - 안쪽 도형도 같은 clip-path를 쓰므로 모서리가 안팎 모두 끊김 없이 이어진다. `<button>`/`<a>`는 기본 UA 테두리가 있으므로 `border: none`을 명시로 지워야 한다(안 지우면 회색 테두리가 겹쳐 보인다).
  ```css
  .pixel-card, .pixel-btn {
    position: relative;
    isolation: isolate; /* ::before의 z-index:-1이 카드 밖으로 새지 않게 가둔다 */
    border: none;
    background: var(--ink); /* 잉크색이 곧 "테두리" */
  }
  .pixel-card { clip-path: var(--pixel-corners); }       /* 카드: 2단 */
  .pixel-btn { clip-path: var(--pixel-corners-btn); }    /* 버튼: 1단 */
  .pixel-card::before, .pixel-btn::before {
    content: '';
    position: absolute;
    inset: var(--pixel-border); /* 테두리 두께만큼 안쪽으로 */
    background: var(--paper); /* 종류별로 여기 배경색만 바꾸면 됨(예: 주요 버튼은 --accent-green) */
    /* 바깥과 같은 clip-path를 각각 써야 한다: .pixel-card::before는 --pixel-corners,
       .pixel-btn::before는 --pixel-corners-btn */
    z-index: -1;
  }
  ```
  - `input`은 대체 요소(replaced element)라 `::before`가 안 그려지므로 이 트릭을 쓸 수 없다. 입력창만 예외로 `border` + 작은 `border-radius`(노치 아님)를 그대로 쓴다.
- 그림자는 **하드 섀도우**(픽셀 블록 그림자)를 쓰되, `box-shadow`는 `clip-path`로 잘린 모양을 따라가지 않으므로 `filter: drop-shadow(...)`를 쓴다. blur 없이 순수 오프셋만. hover/active 시 오프셋을 줄여 "눌리는" 느낌을 준다.
  ```css
  .pixel-card { filter: drop-shadow(4px 4px 0 var(--ink)); }
  .pixel-btn:active { filter: drop-shadow(1px 1px 0 var(--ink)); transform: translate(3px, 3px); }
  ```
- `image-rendering: pixelated`를 펫 스프라이트 `<img>`/`<canvas>`에 적용해 확대 시 뭉개지지 않게 한다.

## 5. 버튼

모든 버튼은 모양(픽셀 노치)·높이·패딩이 동일하고, 배경색으로만 종류를 구분한다(`min-height` 고정 + `display: inline-flex; align-items: center; justify-content: center`로 글자 길이/폰트 크기와 무관하게 높이를 통일). 나란히 놓인 버튼 사이에는 `.pixel-btn + .pixel-btn { margin-left: var(--space-2); }`로 간격을 준다(버튼끼리 붙어 보이지 않게).

- **주요 버튼**(신청하기, 확인, 로그인): `--accent-green` 배경 + `--ink` 3px 테두리 + 픽셀 노치 + 하드 섀도우. 레퍼런스의 초록 "START" 버튼과 동일 톤.
- **보조 버튼**(건너뛰기, 취소): 흰 배경 + `--ink` 테두리 + 픽셀 노치, 나머지는 주요 버튼과 동일.
- **비활성 버튼**(기간 종료): `--muted` 배경, 테두리 흐리게, 커서 `not-allowed`, 섀도우 제거(눌려있는 듯).
- **찜 버튼**: 흰 배경(찜 안 함)/`--accent-pink` 배경(찜 함) + 하트 아이콘(♥/♡), 눌렀을 때 살짝 튀는 애니메이션(`transform: scale(1.2)`, 150ms). 모양·높이는 다른 버튼과 동일.

## 6. 카드 (프로모션 카드 등)

- 배경 `--paper`, 3px `--ink` 테두리, 하드 섀도우, 내부 패딩 16px.
- 상단에 특식 이모지를 픽셀아트 느낌 배경(작은 원형 배지, `--bg-sky-top`)에 얹어 펫 먹이 느낌 강조.
- hover 시 살짝 위로 떠오르는 효과: `transform: translateY(-2px)` + 섀도우 오프셋 증가.

## 6-1. 펫 팝업 창 / 말풍선

사용자 제공 레퍼런스(Y2K/레트로 데스크톱 팝업창 목업)를 참고해 적용.

- **팝업 창 제목표시줄**: 카드 안쪽 흰 배경 맨 위에 `--brand-blue` 색 바를 가장자리까지 꽉 채우고(카드 패딩만큼 음수 마진), 우측에 컨트롤 버튼(닫기)만 둔다.
- **닫기 버튼**: 레퍼런스의 컬러 사각 컨트롤 버튼처럼 `--accent-pink` 배경 + 흰 `×` + `--ink` 2px 테두리 + 하드 섀도우(2px), 클릭 시 섀도우 없이 눌리는 느낌.
- **말풍선**: 둥근 말풍선(`border-radius`) 대신 각진 사각 말풍선 - `--ink` 2px 테두리 + 하드 섀도우(3px, blur 없음) + 아래로 작은 사각형 한 칸을 내민 계단형 꼬리(뾰족한 삼각형 꼬리 아님, "네모네모" 원칙 유지).

## 7. 배경/장식

- 페이지 최상단 헤더: 하늘 그라데이션 + (선택) 하단에 도시 실루엣 SVG 한 줄. 과하게 넣지 않는다(오버엔지니어링 금지 — 장식은 헤더 영역 한정, 리스트/폼 내부는 단색 배경 유지).
- 펫 화면에서는 배경을 펫의 mood(`11-pet-state-diagram.md`)에 맞춰 톤만 미세하게 바꿔도 됨(예: 행복=하늘색 쨍하게, 삐짐=톤 다운). 새 애셋 제작 없이 CSS 필터/배경색 정도로 그친다.

## 8. 여백/그리드

기존 `6-project-principle.md`의 "CSS만으로 반응형 처리" 원칙 유지. 8px 배수 스페이싱(`--space-1:8px ~ --space-4:32px`)만 쓰고 임의 값 지양.

## 9. 적용 우선순위

1. 전역 토큰(색/폰트/스페이싱)을 `frontend/src/styles/tokens.css`로 분리해 한 번만 정의 (신규 파일, 오버엔지니어링 방지 위해 이거 하나면 충분 — 별도 테마 시스템/디자인 토큰 라이브러리 도입 안 함).
2. 공통 컴포넌트(버튼, 카드, 인풋)에 우선 적용 → FE-1~FE-4 화면에 자동 반영.
3. FE-5 이후 신규 화면은 처음부터 이 가이드로 작성.

**스킵한 것**: 웹폰트 정식 라이선스 검토, 다크모드, 애니메이션 라이브러리 도입 — 필요해지면 그때 추가.
