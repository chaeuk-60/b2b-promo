// pg 연결 풀. DATABASE_URL 환경변수 하나로 접속 정보를 관리한다(10-plan.md DB-2).
require('dotenv').config(); // backend/.env 로드(npm start/test 어디서 실행하든 DATABASE_URL 등이 채워지도록)
const { Pool, types } = require('pg');

// DATE 컬럼(OID 1082, 예: promotions.start_date/end_date)을 pg가 기본으로 JS Date 객체로
// 파싱하면 JSON 직렬화 시 "2026-07-31T15:00:00.000Z"처럼 시각까지 붙어버린다. 원래 시각 정보가
// 없는 순수 날짜이므로 문자열("YYYY-MM-DD") 그대로 돌려주도록 한 곳에서 고정한다.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
