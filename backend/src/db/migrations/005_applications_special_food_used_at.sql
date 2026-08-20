-- 특식은 한 번 급여하면 소모된다(신청 1건당 특식 1회, 사용자 확인 - 1-domain-definition.md 갱신).
-- NULL이면 아직 보유 중, 값이 있으면 이미 급여해 소모된 상태.
ALTER TABLE applications ADD COLUMN special_food_used_at TIMESTAMPTZ;
