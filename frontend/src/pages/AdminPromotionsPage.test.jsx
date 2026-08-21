// FE-9 완료 조건: 관리자만 진입 가능, 폼으로 등록/수정하면 목록에 즉시 반영.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminPromotionsPage from './AdminPromotionsPage';
import useAuthStore from '../store/auth.store';

vi.mock('../api/promotion.api', () => ({
  listPromotions: vi.fn(),
  toggleFavorite: vi.fn(),
  createPromotion: vi.fn(),
  updatePromotion: vi.fn(),
}));

import { listPromotions, createPromotion, updatePromotion } from '../api/promotion.api';

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/promotions']}>
        <Routes>
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/promotions" element={<div>프로모션 목록</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AdminPromotionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPromotions.mockResolvedValue([]);
    useAuthStore.setState({ user: null });
  });

  it('관리자가 아니면 목록 화면으로 리다이렉트된다', async () => {
    useAuthStore.setState({ user: { id: 1, email: 'user@example.com' } });
    renderPage();

    expect(await screen.findByText('프로모션 목록')).toBeInTheDocument();
  });

  it('로그인하지 않았으면 목록 화면으로 리다이렉트된다', async () => {
    renderPage();

    expect(await screen.findByText('프로모션 목록')).toBeInTheDocument();
  });

  it('관리자는 등록 화면에 진입할 수 있다', async () => {
    useAuthStore.setState({ user: { id: 1, email: 'admin@b2b-promo.com' } });
    renderPage();

    expect(await screen.findByText('프로모션 등록/수정')).toBeInTheDocument();
  });

  it('폼으로 프로모션을 등록하면 목록 쿼리가 갱신된다', async () => {
    useAuthStore.setState({ user: { id: 1, email: 'admin@b2b-promo.com' } });
    createPromotion.mockResolvedValue({ id: 1 });
    renderPage();

    await screen.findByText('프로모션 등록/수정');
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '신규 프로모션' } });
    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('종료일'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('간단 내용(목록에 표시)'), {
      target: { value: '신규 내용' },
    });
    fireEvent.change(screen.getByLabelText('상세 내용(상세 화면에 표시)'), {
      target: { value: '신규 상세 내용' },
    });
    fireEvent.change(screen.getByLabelText('특식 이모지'), { target: { value: '🍰' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => expect(createPromotion).toHaveBeenCalled());
    expect(createPromotion.mock.calls[0][0]).toEqual({
      title: '신규 프로모션',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      content: '신규 내용',
      detail_content: '신규 상세 내용',
      special_food_id: '🍰',
    });
  });

  it('기존 프로모션의 수정 버튼을 누르면 폼에 값이 채워지고 저장 시 updatePromotion이 호출된다', async () => {
    useAuthStore.setState({ user: { id: 1, email: 'admin@b2b-promo.com' } });
    listPromotions.mockResolvedValue([
      {
        id: 5,
        title: '여름맞이 쌀 증정',
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        content: '내용',
        detail_content: '상세 내용',
        special_food_id: '🍚',
      },
    ]);
    updatePromotion.mockResolvedValue({ id: 5 });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '수정' }));
    expect(screen.getByLabelText('제목')).toHaveValue('여름맞이 쌀 증정');

    fireEvent.click(screen.getByRole('button', { name: '수정 완료' }));
    await waitFor(() => expect(updatePromotion).toHaveBeenCalled());
    expect(updatePromotion.mock.calls[0][0]).toEqual({
      promotionId: 5,
      title: '여름맞이 쌀 증정',
      start_date: '2026-08-01',
      end_date: '2026-08-31',
      content: '내용',
      detail_content: '상세 내용',
      special_food_id: '🍚',
    });
  });
});
