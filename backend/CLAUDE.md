# b2b promo 백엔드 개발을 위한 지침

## 반드시 준수할 사항

- SOLID 원칙을 반드시 지킬 것
- Clean 아키텍처를 반드시 구현할 것

## 참조 문서

백엔드 개발 전 아래 문서를 먼저 확인할 것(경로는 프로젝트 루트 `docs/` 기준).

| 문서명 | 문서 | 내용 |
|---|---|---|
| 도메인 정의서 | [`../docs/1-domain-definition.md`](../docs/1-domain-definition.md) | 엔티티, 펫 상태 전이 등 모든 비즈니스 규칙의 근거 |
| PRD | [`../docs/3-PRD.md`](../docs/3-PRD.md) | 제품 요구사항 정의서 — 기술 스택, 기능 범위, 인증 방식 |
| 프로젝트 구조 설계 원칙 | [`../docs/6-project-principle.md`](../docs/6-project-principle.md) | 프로젝트 구조/코딩 원칙 — 7장이 백엔드 디렉토리 구조 |
| ERD | [`../docs/9-erd.md`](../docs/9-erd.md) | 엔티티 관계도(mermaid) |
| DB 스키마 | [`../docs/9-schema.sql`](../docs/9-schema.sql) | PostgreSQL DDL |
| 실행계획 | [`../docs/10-plan.md`](../docs/10-plan.md) | DB/BE/FE 실행 계획 — Task별 작업 내용/선행관계/완료조건 |
| 펫 상태 다이어그램 | [`../docs/11-pet-state-diagram.md`](../docs/11-pet-state-diagram.md) | 펫 상태(stage/mood/eggState) 및 행동별 효과 다이어그램 |
| API 스펙 | [`../docs/swagger.json`](../docs/swagger.json) | OpenAPI 3.0 API 스펙 |
