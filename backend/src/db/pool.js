// pg 연결 풀. DATABASE_URL 환경변수 하나로 접속 정보를 관리한다(10-plan.md DB-2).
require('dotenv').config(); // backend/.env 로드(npm start/test 어디서 실행하든 DATABASE_URL 등이 채워지도록)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
