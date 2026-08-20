-- BE-5: 로그인마다 그날 몇 번째 접속인지 판정하려면(1회차/2회차+/3회차+ mood 재계산 규칙,
-- 도메인 정의서 5장) 그날의 접속 횟수를 세는 컬럼이 필요하다. last_active_at의 날짜(KST)가
-- 바뀌면 1로 리셋, 같은 날이면 로그인마다 +1 하는 방식으로 애플리케이션(pet.service.js)에서 관리한다.
ALTER TABLE pets ADD COLUMN daily_login_count INT NOT NULL DEFAULT 0;
