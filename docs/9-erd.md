# ERD: b2b-promo

기반 문서: `docs/1-domain-definition.md` 3장(엔티티) · 4장(관계), `docs/3-PRD.md` 6장(데이터 모델)

```mermaid
erDiagram
    USER ||--|| PET : "가입 시 자동 생성"
    USER ||--o{ REFRESH_TOKEN : "발급"
    USER ||--o{ APPLICATION : "신청"
    USER ||--o{ FAVORITE : "찜"
    PROMOTION ||--o{ APPLICATION : "신청 대상"
    PROMOTION ||--o{ FAVORITE : "찜 대상"

    USER {
        ID id PK
        string email
        string password
    }

    REFRESH_TOKEN {
        ID id PK
        ID userId FK
        string tokenHash "토큰 원문 대신 해시 저장"
        datetime expiresAt "발급 + 14일"
        datetime createdAt
    }

    PROMOTION {
        ID id PK
        string title
        date startDate
        date endDate
        text content
        ID specialFoodId "이 프로모션의 특식(펫 아이템)"
    }

    APPLICATION {
        ID id PK
        ID userId FK
        ID promotionId FK
        datetime appliedAt
    }

    FAVORITE {
        ID userId PK,FK
        ID promotionId PK,FK
    }

    PET {
        ID id PK
        ID userId FK
        string name
        string stage "알/새끼/성체/묘비"
        string mood "새끼·성체 전용"
        string eggState "알 전용"
        ID requestedPromotionId "특식 요청 대상"
        int activityCount
        int dailyLoginCount "오늘 몇 번째 접속인지(mood 재계산용)"
        datetime lastActiveAt
        datetime lastGiftAt
        datetime stageChangedAt
        string earType
        string fortuneMessage "오늘 뽑은 운세 문구"
        string fortuneDate "운세를 뽑은 날짜(하루 1회 제한용)"
    }
```

## 엔티티 설명
- **USER**: 이메일/비밀번호로 가입하는 사용자(거래처 담당자) 계정.
- **REFRESH_TOKEN**: 발급된 리프레시 토큰(해시)의 저장소. 로그아웃·강제 만료 시 해당 행을 삭제해 즉시 무효화한다. 별도 revoked 플래그는 두지 않고 행 삭제로 처리.
- **PROMOTION**: 회사가 등록하는 신청 가능한 프로모션 상품/이벤트.
- **APPLICATION**: 사용자가 특정 프로모션에 신청한 이력.
- **FAVORITE**: 사용자가 특정 프로모션을 찜(관심 표시)한 이력. userId+promotionId 복합키.
- **PET**: 사용자당 1마리 지급되는 다마고치 캐릭터. specialFoodId(프로모션의 특식)와는 신청/보유 로직으로 연결되며 별도 엔티티는 두지 않음.
