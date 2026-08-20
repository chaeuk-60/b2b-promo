import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PetNamePage from './pages/PetNamePage';
import PromotionListPage from './pages/PromotionListPage';
import PromotionDetailPage from './pages/PromotionDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PetPage from './pages/PetPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/pet/name" element={<PetNamePage />} />
      <Route path="/promotions" element={<PromotionListPage />} />
      <Route path="/promotions/:id" element={<PromotionDetailPage />} />
      <Route path="/my-applications" element={<MyApplicationsPage />} />
      <Route path="/pet" element={<PetPage />} />
    </Routes>
  );
}

export default App;
