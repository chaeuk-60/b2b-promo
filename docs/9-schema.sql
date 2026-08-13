-- b2b-promo 데이터베이스 스키마 (PostgreSQL 17)
-- 기반 문서: docs/9-erd.md, docs/1-domain-definition.md 3장(엔티티)·4장(관계)
-- project-principle.md 원칙에 따라 앱 코드 검증 대신 DB 제약으로 해결 가능한 것은 제약으로 해결함
--   (예: 사용자-펫 1:1 -> UNIQUE, 중복 신청 방지 -> UNIQUE, 찜 -> 복합 PK)

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- 발급된 리프레시 토큰 저장(로그아웃/강제 만료 시 해당 행을 DELETE 하면 즉시 무효화됨)
-- 토큰 원문 대신 해시만 저장하고, 무효화는 별도 revoked 플래그 없이 행 삭제로 처리한다.
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL, -- 발급 시각 + 14일
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id); -- 로그아웃 시 사용자별 일괄 삭제용

CREATE TABLE promotions (
    id               BIGSERIAL PRIMARY KEY,
    title            TEXT NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    content          TEXT NOT NULL,
    special_food_id  TEXT NOT NULL -- 이 프로모션의 특식 식별자(도메인 정의서상 별도 엔티티 없음, 프로모션당 1개)
);

CREATE TABLE applications (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    promotion_id  BIGINT NOT NULL REFERENCES promotions(id),
    applied_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, promotion_id) -- 중복 신청 방지(도메인 정의서 7장)
);

CREATE TABLE favorites (
    user_id       BIGINT NOT NULL REFERENCES users(id),
    promotion_id  BIGINT NOT NULL REFERENCES promotions(id),
    PRIMARY KEY (user_id, promotion_id) -- 찜 = 행 존재, 해제 = 행 삭제
);

CREATE TABLE pets (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL UNIQUE REFERENCES users(id), -- 사용자당 1마리(1:1)
    name                   TEXT,
    stage                  TEXT NOT NULL DEFAULT '알'
                           CHECK (stage IN ('알', '새끼', '성체', '묘비')),
    mood                   TEXT
                           CHECK (mood IN ('더러움', '배고픔', '삐짐', '평범', '행복', '무지개', '반짝이', '특식 요청')),
    egg_state              TEXT DEFAULT '평범'
                           CHECK (egg_state IN ('평범', '더러움', '반질반질', '무지개', '반짝이', '특식 요청')),
    requested_promotion_id BIGINT REFERENCES promotions(id), -- mood/eggState가 "특식 요청"일 때 대상(그날 고정)
    activity_count         INT NOT NULL DEFAULT 0,
    last_active_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_gift_at           TIMESTAMPTZ,
    stage_changed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ear_type               TEXT NOT NULL
                           CHECK (ear_type IN ('위로 곧게', '앞으로 접힘', '옆으로 처짐', '뒤로 말림', '아래로 늘어짐'))
);
