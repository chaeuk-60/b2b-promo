// FE-7: 펫 조회 성공/실패 시 화면 상태 확인(상세 렌더링은 PetView.test.jsx가 담당).
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PetPage from './PetPage';

vi.mock('../api/pet.api', () => ({
  getPet: vi.fn(),
  namePet: vi.fn(),
}));

import { getPet } from '../api/pet.api';

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PetPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PetPage', () => {
  it('펫 조회 성공 시 이름이 표시된다', async () => {
    getPet.mockResolvedValue({ stage: '알', egg_state: '평범', name: '김커푸' });
    renderPage();

    expect(await screen.findByText('이름: 김커푸')).toBeInTheDocument();
  });

  it('펫 조회 실패 시 에러 문구가 표시된다', async () => {
    getPet.mockRejectedValue(new Error('네트워크 오류'));
    renderPage();

    expect(await screen.findByText('펫 정보를 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
