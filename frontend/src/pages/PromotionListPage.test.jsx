// FE-4: 목록이 카드 형태로 렌더링되는지 확인(로딩/에러/성공 상태).
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PromotionListPage from './PromotionListPage';

vi.mock('../api/promotion.api', () => ({
  listPromotions: vi.fn(),
  toggleFavorite: vi.fn(),
}));

import { listPromotions } from '../api/promotion.api';

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PromotionListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PromotionListPage', () => {
  it('목록 조회 성공 시 카드 형태로 렌더링된다', async () => {
    listPromotions.mockResolvedValue([
      {
        id: 1,
        title: '프로모션 A',
        start_date: '2026-08-01',
        end_date: '2099-12-31',
        content: '내용 A',
        special_food_id: 'a',
        favorited: false,
        applied: false,
      },
      {
        id: 2,
        title: '프로모션 B',
        start_date: '2026-08-01',
        end_date: '2099-12-31',
        content: '내용 B',
        special_food_id: 'b',
        favorited: true,
        applied: false,
      },
    ]);
    renderPage();

    expect(await screen.findByText(/프로모션 A/)).toBeInTheDocument();
    expect(await screen.findByText(/프로모션 B/)).toBeInTheDocument();
  });

  it('목록 조회 실패 시 에러 문구가 표시된다', async () => {
    listPromotions.mockRejectedValue(new Error('네트워크 오류'));
    renderPage();

    expect(await screen.findByText('프로모션 목록을 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
