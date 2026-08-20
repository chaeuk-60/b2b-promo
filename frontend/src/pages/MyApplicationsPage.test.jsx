// FE-6 완료 조건: 신청한 프로모션만 표시, 취소 버튼 없이 안내 문구만 표시.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyApplicationsPage from './MyApplicationsPage';

vi.mock('../api/application.api', () => ({
  listMyApplications: vi.fn(),
}));

import { listMyApplications } from '../api/application.api';

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyApplicationsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MyApplicationsPage', () => {
  it('신청한 프로모션이 제목/신청일/기간 카드로 렌더링된다', async () => {
    listMyApplications.mockResolvedValue([
      {
        id: 1,
        promotion_id: 10,
        applied_at: '2026-08-05T03:00:00.000Z',
        title: '여름맞이 쌀 증정',
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        special_food_id: 'rice-cake',
      },
    ]);
    renderPage();

    expect(await screen.findByText(/여름맞이 쌀 증정/)).toBeInTheDocument();
    expect(screen.getByText('신청일: 2026-08-05')).toBeInTheDocument();
    expect(screen.getByText('기간: 2026-08-01 ~ 2026-08-31')).toBeInTheDocument();
  });

  it('취소 버튼은 없고 안내 문구가 표시된다', async () => {
    listMyApplications.mockResolvedValue([
      {
        id: 1,
        promotion_id: 10,
        applied_at: '2026-08-05T03:00:00.000Z',
        title: '여름맞이 쌀 증정',
        start_date: '2026-08-01',
        end_date: '2026-08-31',
        special_food_id: 'rice-cake',
      },
    ]);
    renderPage();

    expect(await screen.findByText('취소는 담당자에게 연락 주세요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /취소/ })).not.toBeInTheDocument();
  });

  it('신청한 프로모션이 없으면 안내 문구를 보여준다', async () => {
    listMyApplications.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('아직 신청한 프로모션이 없습니다.')).toBeInTheDocument();
  });

  it('조회 실패 시 에러 문구가 표시된다', async () => {
    listMyApplications.mockRejectedValue(new Error('네트워크 오류'));
    renderPage();

    expect(await screen.findByText('나의 신청 목록을 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
