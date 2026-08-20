// FE-7/8/10: PetPage는 "< 프로모션 목록" 링크 + PetPanel을 그대로 렌더하는 래퍼다
// (내용 검증은 PetPanel.test.jsx가 담당, 여기서는 라우팅용 링크만 확인한다).
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PetPage from './PetPage';

vi.mock('../api/pet.api', () => ({
  getPet: vi.fn(),
  namePet: vi.fn(),
  bathePet: vi.fn(),
  feedPet: vi.fn(),
  feedSpecialFood: vi.fn(),
  patPet: vi.fn(),
  fetchFortune: vi.fn(),
}));
vi.mock('../api/application.api', () => ({
  listMyApplications: vi.fn(),
}));

import { getPet } from '../api/pet.api';
import { listMyApplications } from '../api/application.api';

describe('PetPage', () => {
  it('프로모션 목록으로 돌아가는 링크가 있다', async () => {
    getPet.mockResolvedValue({ stage: '알', egg_state: '평범', name: '김커푸' });
    listMyApplications.mockResolvedValue([]);
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PetPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('link', { name: '< 프로모션 목록' })).toHaveAttribute(
      'href',
      '/promotions'
    );
    expect(await screen.findByText('이름: 김커푸')).toBeInTheDocument();
  });
});
