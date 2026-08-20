// FE-3: 이름 입력 후 확인 -> 저장 후 이동, 건너뛰기 -> API 호출 없이 바로 이동.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PetNamePage from './PetNamePage';

vi.mock('../api/pet.api', () => ({
  namePet: vi.fn(),
}));

import { namePet } from '../api/pet.api';

function renderPetNamePage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/pet/name']}>
        <Routes>
          <Route path="/pet/name" element={<PetNamePage />} />
          <Route path="/promotions" element={<div>프로모션 목록</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PetNamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이름을 입력하고 확인을 누르면 저장 후 목록 화면으로 이동한다', async () => {
    namePet.mockResolvedValue({ pet: { name: '몽실이' } });
    renderPetNamePage();

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '몽실이' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByText('프로모션 목록')).toBeInTheDocument());
    expect(namePet).toHaveBeenCalled();
    expect(namePet.mock.calls[0][0]).toEqual({ name: '몽실이' });
  });

  it('건너뛰기를 누르면 API 호출 없이 바로 목록 화면으로 이동한다', async () => {
    renderPetNamePage();

    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));

    await waitFor(() => expect(screen.getByText('프로모션 목록')).toBeInTheDocument());
    expect(namePet).not.toHaveBeenCalled();
  });

  it('저장 실패 시 에러 메시지가 표시되고 화면에 머무른다', async () => {
    namePet.mockRejectedValue(new Error('실패'));
    renderPetNamePage();

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '몽실이' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByText('프로모션 목록')).not.toBeInTheDocument();
  });
});
