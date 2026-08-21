import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PromotionListPage from './pages/PromotionListPage';
import PromotionDetailPage from './pages/PromotionDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PetPage from './pages/PetPage';
import AdminPromotionsPage from './pages/AdminPromotionsPage';
import Layout from './components/layout/Layout';
import { refresh } from './api/auth.api';
import { setAccessToken } from './api/client';
import useAuthStore from './store/auth.store';

// 로그인 화면은 아직 목록·펫으로 이동할 이유가 없어 공통 네비게이션을 씌우지 않는다
// (10-plan.md FE-10, 8-wireframe.md 3번 네비게이션은 로그인 이후 화면 기준). 펫 이름
// 짓기는 별도 라우트가 아니라 펫 팝업(PetPanel.jsx) 안에서 처리한다(FE-3).
function withLayout(element) {
  return <Layout>{element}</Layout>;
}

// 로그인 사용자 정보(auth.store)는 메모리에만 있어 새로고침/URL 직접 이동 시 사라진다.
// 버그: 관리자도 새로고침하면 세션 쿠키는 멀쩡한데 auth.store.user가 비어 있어
// 관리자 페이지에서 계속 튕겨나갔다(리포트 3.2). 마운트 시 httpOnly 리프레시 토큰
// 쿠키로 액세스 토큰/사용자 정보를 한 번 복원해서 고친다.
function useRestoreSession() {
  const setUser = useAuthStore((state) => state.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    refresh()
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        // 로그인한 적이 없거나 리프레시 토큰이 만료된 정상적인 경우 - 로그인 화면으로 진행.
      })
      .finally(() => setReady(true));
  }, [setUser]);

  return ready;
}

function App() {
  const sessionReady = useRestoreSession();

  if (!sessionReady) return null;

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/promotions" element={withLayout(<PromotionListPage />)} />
      <Route path="/promotions/:id" element={withLayout(<PromotionDetailPage />)} />
      <Route path="/my-applications" element={withLayout(<MyApplicationsPage />)} />
      <Route path="/pet" element={withLayout(<PetPage />)} />
      <Route path="/admin/promotions" element={withLayout(<AdminPromotionsPage />)} />
    </Routes>
  );
}

export default App;
