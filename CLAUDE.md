# b2b-promo 프로젝트의 최상위 지침

## 반드시 준수할 최우선 지침

- 모든 대화는 한국어로 할 것
- 오버엔지니어링 금지

## 개발할 때 다음 사항을 준수할 것

- 안드레 카파시의 CLAUDE.md
- https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/refs/heads/main/CLAUDE.md

## 문서 구조 (docs/)

작업 전 관련 문서를 먼저 확인할 것. 번호는 작성 순서이며 뒤 문서는 앞 문서를 근거로 작성됨.

| 문서 | 내용 |
|---|---|
| `docs/1-domain-definition.md` | 도메인 정의서. 문제 정의, 용어, 엔티티, 펫 상태 전이 규칙 등 모든 비즈니스 규칙의 근거 |
| `docs/2-pet-design-guide.md` | 펫 픽셀아트 디자인 가이드(그리드, 색상, 귀 타입) |
| `docs/3-PRD.md` | 제품 요구사항 정의서(기술 스택, 기능 범위, KPI, 리스크) |
| `docs/4-use-case-diagram.md` | 유스케이스 다이어그램(mermaid) |
| `docs/5-user-scenarios.md` | 사용자 시나리오 |
| `docs/6-project-principle.md` | 프로젝트 구조/코딩 원칙(디렉토리 구조, 레이어링) |
| `docs/7-arch-diagram.md` | 기술 아키텍처 및 프론트엔드 컴포넌트 구조 다이어그램(mermaid) |
| `docs/8-wireframe.md` | 화면별 와이어프레임 |
| `docs/9-erd.md` | ERD(mermaid) |
| `docs/9-schema.sql` | PostgreSQL DDL(ERD 기반) |
| `docs/10-plan.md` | DB/BE/FE 실행 계획(Task, 선행관계, 완료조건 체크박스) |
| `docs/swagger.json` | OpenAPI 3.0 API 스펙 |

문서 간 불일치가 생기면(파일 경로 변경, 규칙 변경 등) 관련된 다른 문서도 함께 수정할 것.
