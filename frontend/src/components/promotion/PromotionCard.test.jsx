// FE-4 완료 조건: 찜 토글, 기간 종료 시 신청 버튼 비활성화+안내 문구.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PromotionCard from './PromotionCard';

vi.mock('../../api/promotion.api', () => ({
  toggleFavorite: vi.fn(),
}));

import { toggleFavorite } from '../../api/promotion.api';

function renderCard(promotion) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PromotionCard promotion={promotion} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const basePromotion = {
  id: 1,
  title: '여름맞이 쌀 증정',
  start_date: '2026-08-01',
  end_date: '2099-12-31',
  content: '내용 요약',
  special_food_id: 'rice-cake',
  favorited: false,
  applied: false,
};

describe('PromotionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제목/기간/내용과 찜 버튼을 렌더링한다', () => {
    renderCard(basePromotion);

    expect(screen.getByText(/여름맞이 쌀 증정/)).toBeInTheDocument();
    expect(screen.getByText('기간: 2026-08-01 ~ 2099-12-31')).toBeInTheDocument();
    expect(screen.getByText('내용 요약')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '♡ 찜' })).toBeInTheDocument();
  });

  it('찜 버튼을 누르면 toggleFavorite API가 호출된다', async () => {
    toggleFavorite.mockResolvedValue({ favorited: true });
    renderCard(basePromotion);

    fireEvent.click(screen.getByRole('button', { name: '♡ 찜' }));

    await waitFor(() => expect(toggleFavorite).toHaveBeenCalled());
    expect(toggleFavorite.mock.calls[0][0]).toBe(1);
  });

  it('favorited가 true면 ♥ 찜으로 표시된다', () => {
    renderCard({ ...basePromotion, favorited: true });

    expect(screen.getByRole('button', { name: '♥ 찜' })).toBeInTheDocument();
  });

  it('기간이 종료된 프로모션은 신청 버튼이 비활성화되고 안내 문구가 표시된다', () => {
    renderCard({ ...basePromotion, end_date: '2020-01-01' });

    const applyButton = screen.getByRole('button', { name: '기간 종료' });
    expect(applyButton).toBeDisabled();
    expect(screen.getByText('담당자에게 연락 주세요')).toBeInTheDocument();
  });

  it('기간 내이고 신청 전이면 신청하기 링크가 표시된다', () => {
    renderCard(basePromotion);

    expect(screen.getByRole('link', { name: '신청하기' })).toHaveAttribute(
      'href',
      '/promotions/1'
    );
  });

  it('이미 신청 완료했으면 신청 완료 표시가 나온다', () => {
    renderCard({ ...basePromotion, applied: true });

    expect(screen.getByText('신청 완료')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '신청하기' })).not.toBeInTheDocument();
  });
});
