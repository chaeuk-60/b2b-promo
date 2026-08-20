-- BE-8: 오늘의 운세(하루 1회, 새끼/성체 전용, 같은 날 재요청 시 동일 결과 유지)를 위해
-- 그날 뽑은 문구와 날짜를 저장한다. fortune_date는 KST 'YYYY-MM-DD' 문자열로 저장해
-- pg의 DATE 타입 타임존 파싱 이슈 없이 다른 곳(daily_login_count 등)과 같은 방식으로 비교한다.
ALTER TABLE pets ADD COLUMN fortune_message TEXT;
ALTER TABLE pets ADD COLUMN fortune_date TEXT;
