// 신청(나의 신청 목록) 도메인 API 함수. (10-plan.md FE-6)
import client from './client';

export function listMyApplications() {
  return client.get('/applications').then((res) => res.data);
}
