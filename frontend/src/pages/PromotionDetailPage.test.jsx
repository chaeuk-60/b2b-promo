// FE-5 완료 조건: 신청 버튼 클릭 시 신청 완료 표시로 전환, 신청 완료/기간 종료 시 비활성화+안내 문구.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PromotionDetailPage from './PromotionDetailPage';

vi.mock('../api/promotion.api', () => ({
  getPromotion: vi.fn(),
  applyPromotion: vi.fn(),
  toggleFavorite: vi.fn(),
}));

import { getPromotion, applyPromotion } from '../api/promotion.api';

const basePromotion = {
  id: 1,
  title: '여름맞이 쌀 증정',
  start_date: '2026-08-01',
  end_date: '2099-12-31',
  content: '상세 내용입니다.',
  special_food_id: 'rice-cake',
  favorited: false,
  applied: false,
};

function renderDetail() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/promotions/1']}>
        <Routes>
          <Route path="/promotions/:id" element={<PromotionDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PromotionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제목/기간/내용을 렌더링한다', async () => {
    getPromotion.mockResolvedValue(basePromotion);
    renderDetail();

    expect(await screen.findByText('여름맞이 쌀 증정')).toBeInTheDocument();
    expect(screen.getByText('기간: 2026-08-01 ~ 2099-12-31')).toBeInTheDocument();
    expect(screen.getByText('상세 내용입니다.')).toBeInTheDocument();
  });

  it('신청 버튼 클릭 시 신청이 완료되고 버튼이 신청 완료 표시로 바뀐다', async () => {
    getPromotion.mockResolvedValueOnce(basePromotion);
    applyPromotion.mockResolvedValue({ id: 10, promotion_id: 1 });
    renderDetail();

    const applyButton = await screen.findByRole('button', { name: '신청하기' });
    getPromotion.mockResolvedValue({ ...basePromotion, applied: true });
    fireEvent.click(applyButton);

    await waitFor(() => expect(applyPromotion).toHaveBeenCalled());
    expect(await screen.findByText('신청 완료')).toBeInTheDocument();
  });

  it('이미 신청 완료했으면 신청 버튼 대신 신청 완료 표시와 안내 문구가 나온다', async () => {
    getPromotion.mockResolvedValue({ ...basePromotion, applied: true });
    renderDetail();

    expect(await screen.findByText('신청 완료')).toBeInTheDocument();
    expect(screen.getByText('취소는 담당자에게 연락 주세요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '신청하기' })).not.toBeInTheDocument();
  });

  it('기간이 종료된 프로모션은 신청 버튼이 비활성화되고 안내 문구가 표시된다', async () => {
    getPromotion.mockResolvedValue({ ...basePromotion, end_date: '2020-01-01' });
    renderDetail();

    const disabledButton = await screen.findByRole('button', { name: '기간 종료 - 신청불가' });
    expect(disabledButton).toBeDisabled();
    expect(screen.getByText('담당자에게 연락 주세요')).toBeInTheDocument();
  });

  it('상세 조회 실패 시 에러 문구가 표시된다', async () => {
    getPromotion.mockRejectedValue(new Error('네트워크 오류'));
    renderDetail();

    expect(await screen.findByText('프로모션 정보를 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
