-- 초기 데이터: 회원가입 API로는 만들 수 없는 관리자 계정과, 화면 확인용 샘플 프로모션.
-- 기반: docs/10-plan.md DB-3
-- 관리자 이메일은 BE-3(관리자 판별)에서 화이트리스트로 참조할 값이다.
-- 비밀번호는 'admin1234!'를 bcryptjs(rounds=10)로 해시한 값이다.
INSERT INTO users (email, password_hash) VALUES
    ('admin@b2b-promo.com', '$2a$10$HdZsh3Wlx/f8ZF.eC6HNROKoVrLijU/hjfTvBW430Z0ZiMIFABMG.');

-- 진행 중 프로모션 2건 + 기간 종료 프로모션 1건, 프로모션마다 다른 특식(special_food_id)
INSERT INTO promotions (title, start_date, end_date, content, special_food_id) VALUES
    ('여름맞이 쌀 증정 프로모션', '2026-08-01', '2026-08-31', '여름 시즌 거래처 대상 쌀 20kg 증정 프로모션입니다.', 'rice-cake'),
    ('신제품 라면 시식 프로모션', '2026-08-10', '2026-09-10', '신제품 라면 입점 기념 시식 및 발주 프로모션입니다.', 'noodle'),
    ('봄맞이 과자 세트 프로모션', '2026-06-01', '2026-07-31', '봄 시즌 과자 세트 발주 프로모션입니다(기간 종료).', 'cookie');
