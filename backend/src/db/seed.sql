-- 초기 데이터: 회원가입 API로는 만들 수 없는 관리자 계정과, 화면 확인용 샘플 프로모션.
-- 기반: docs/10-plan.md DB-3
-- 관리자 이메일은 BE-3(관리자 판별)에서 화이트리스트로 참조할 값이다.
-- 비밀번호는 'admin1234!'를 bcryptjs(rounds=10)로 해시한 값이다.
INSERT INTO users (email, password_hash) VALUES
    ('admin@b2b-promo.com', '$2a$10$HdZsh3Wlx/f8ZF.eC6HNROKoVrLijU/hjfTvBW430Z0ZiMIFABMG.');

-- 진행 중 프로모션 2건 + 기간 종료 프로모션 1건, 프로모션마다 다른 특식(special_food_id)
-- special_food_id는 이모지가 아니라 문자열 식별자다. 화면에 보이는 특식 이모지는
-- frontend/src/utils/foodEmoji.js가 이 문자열을 해시해서 8개 후보(🍖🍰🍜🍎🍕🍩🍇🍓)
-- 중 하나로 결정적으로 골라준다(같은 id는 항상 같은 이모지).
INSERT INTO promotions (title, start_date, end_date, content, special_food_id) VALUES
    ('여름맞이 쌀 증정 프로모션', '2026-08-01', '2026-08-31', '여름 시즌 거래처 대상 쌀 20kg 증정 프로모션입니다.', 'rice-cake'),
    ('신제품 라면 시식 프로모션', '2026-08-10', '2026-09-10', '신제품 라면 입점 기념 시식 및 발주 프로모션입니다.', 'noodle'),
    ('봄맞이 과자 세트 프로모션', '2026-06-01', '2026-07-31', '봄 시즌 과자 세트 발주 프로모션입니다(기간 종료).', 'cookie'),
    ('명절 선물세트 갈비 증정 프로모션', '2026-08-15', '2026-09-30', '명절 시즌 거래처 대상 갈비 세트 증정 프로모션입니다.', 'meat-set'),
    ('신제품 애플파이 출시 기념 프로모션', '2026-08-20', '2026-10-15', '신제품 애플파이 입점 기념 시식 및 발주 프로모션입니다.', 'apple-pie'),
    ('만두 신메뉴 시식 프로모션', '2026-09-01', '2026-09-30', '만두 신메뉴 입점 기념 시식 및 발주 프로모션입니다.', 'dumpling'),
    ('겨울맞이 샌드위치 세트 프로모션', '2026-05-01', '2026-06-30', '겨울 시즌 샌드위치 세트 발주 프로모션입니다(기간 종료).', 'sandwich');

-- 임시 테스트 계정: 회원가입 직후에는 펫이 항상 알 단계라 화면 확인을 위해 매번 키워야
-- 하는 게 불편해서, 성체 펫을 미리 만들어둔 계정을 하나 시드에 넣는다(사용자 확인).
-- 비밀번호는 'password123'을 bcryptjs(rounds=10)로 해시한 값.
INSERT INTO users (email, password_hash) VALUES
    ('test-adult@example.com', '$2a$10$9UR.5CQdobfizpEpxk/hm.otmPE.fWlVzs7Wi526MSJzjgWMihbii');

INSERT INTO pets (user_id, name, stage, mood, egg_state, activity_count, ear_type)
SELECT id, '몽실이', '성체', '평범', '평범', 20, '옆으로 처짐'
FROM users WHERE email = 'test-adult@example.com';
