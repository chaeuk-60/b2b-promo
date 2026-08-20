import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PetNamePage from './pages/PetNamePage';
import PromotionListPage from './pages/PromotionListPage';
import PromotionDetailPage from './pages/PromotionDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PetPage from './pages/PetPage';
import AdminPromotionsPage from './pages/AdminPromotionsPage';
import Layout from './components/layout/Layout';

// 로그인/이름짓기 화면은 아직 목록·펫으로 이동할 이유가 없어 공통 네비게이션을 씌우지
// 않는다(10-plan.md FE-10, 8-wireframe.md 3번 네비게이션은 로그인 이후 화면 기준).
function withLayout(element) {
  return <Layout>{element}</Layout>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/pet/name" element={<PetNamePage />} />
      <Route path="/promotions" element={withLayout(<PromotionListPage />)} />
      <Route path="/promotions/:id" element={withLayout(<PromotionDetailPage />)} />
      <Route path="/my-applications" element={withLayout(<MyApplicationsPage />)} />
      <Route path="/pet" element={withLayout(<PetPage />)} />
      <Route path="/admin/promotions" element={withLayout(<AdminPromotionsPage />)} />
    </Routes>
  );
}

export default App;
