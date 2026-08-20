import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PetNamePage from './pages/PetNamePage';
import PromotionListPage from './pages/PromotionListPage';
import PromotionDetailPage from './pages/PromotionDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PetPage from './pages/PetPage';
import AdminPromotionsPage from './pages/AdminPromotionsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/pet/name" element={<PetNamePage />} />
      <Route path="/promotions" element={<PromotionListPage />} />
      <Route path="/promotions/:id" element={<PromotionDetailPage />} />
      <Route path="/my-applications" element={<MyApplicationsPage />} />
      <Route path="/pet" element={<PetPage />} />
      <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
    </Routes>
  );
}

export default App;
