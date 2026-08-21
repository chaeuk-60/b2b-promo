// 관리자 프로모션 등록/수정 화면(10-plan.md FE-9). 와이어프레임에는 없는 화면으로,
// PRD 3.1·5.2절 범위의 관리자 CRUD를 위한 최소 폼 1개만 추가한다(별도 관리자
// 레이아웃/컴포넌트 체계 없음). 관리자 판별은 백엔드와 동일하게 ADMIN_EMAIL 일치 여부로 한다.
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import { usePromotions } from '../hooks/usePromotions';
import { useCreatePromotion, useUpdatePromotion } from '../hooks/useAdminPromotion';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@b2b-promo.com';

const EMPTY_FORM = { title: '', start_date: '', end_date: '', content: '', special_food_id: '' };

function AdminPromotionsPage() {
  const user = useAuthStore((state) => state.user);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: promotions } = usePromotions();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const isSubmitting = createPromotion.isPending || updatePromotion.isPending;

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/promotions" replace />;
  }

  function startEdit(promotion) {
    setEditingId(promotion.id);
    setForm({
      title: promotion.title,
      start_date: promotion.start_date,
      end_date: promotion.end_date,
      content: promotion.content,
      special_food_id: promotion.special_food_id,
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updatePromotion.mutateAsync({ promotionId: editingId, ...form });
      } else {
        await createPromotion.mutateAsync(form);
      }
      startCreate();
    } catch {
      // 실패 시 화면에 머물러 재시도할 수 있게 한다(에러 표시는 isError로 처리).
    }
  }

  return (
    <div>
      <Link className="back-link" to="/promotions">
        {'< 프로모션 목록'}
      </Link>
      <h2>프로모션 등록/수정</h2>

      <div className="pixel-card">
        <form onSubmit={handleSubmit}>
          <label className="pixel-field">
            <span className="pixel-field-label">제목</span>
            <input
              className="pixel-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label className="pixel-field">
            <span className="pixel-field-label">시작일</span>
            <input
              className="pixel-input"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </label>
          <label className="pixel-field">
            <span className="pixel-field-label">종료일</span>
            <input
              className="pixel-input"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </label>
          <label className="pixel-field">
            <span className="pixel-field-label">내용</span>
            <input
              className="pixel-input"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </label>
          <label className="pixel-field">
            <span className="pixel-field-label">특식 ID</span>
            <input
              className="pixel-input"
              value={form.special_food_id}
              onChange={(e) => setForm({ ...form, special_food_id: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="pixel-btn pixel-btn-primary" disabled={isSubmitting}>
            {editingId ? '수정 완료' : '등록'}
          </button>
          {editingId && (
            <button type="button" className="pixel-btn" onClick={startCreate}>
              취소하고 새로 등록
            </button>
          )}
        </form>
        {(createPromotion.isError || updatePromotion.isError) && (
          <p role="alert">저장에 실패했습니다.</p>
        )}
      </div>

      <h3>등록된 프로모션</h3>
      {(promotions || []).map((promotion) => (
        <div className="pixel-card" key={promotion.id}>
          <p>{promotion.title}</p>
          <button type="button" className="pixel-btn" onClick={() => startEdit(promotion)}>
            수정
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminPromotionsPage;
