// 로그인 사용자 정보만 담당하는 전역 상태(Zustand). 서버 상태(펫, 프로모션 등)는 여기 두지 않고
// 전부 TanStack Query로 관리한다. (10-plan.md FE-2, 6-project-principle.md 6장)
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useAuthStore;
