// 나의 신청 목록 useQuery. (10-plan.md FE-6)
import { useQuery } from '@tanstack/react-query';
import { listMyApplications } from '../api/application.api';

export function useMyApplications() {
  return useQuery({
    queryKey: ['myApplications'],
    queryFn: listMyApplications,
    retry: false,
  });
}
