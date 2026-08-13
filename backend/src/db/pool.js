// pg 연결 풀. DATABASE_URL 환경변수 하나로 접속 정보를 관리한다(10-plan.md DB-2).
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
