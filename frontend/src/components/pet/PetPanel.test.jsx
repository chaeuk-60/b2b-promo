// FE-7/FE-8: 펫 조회 성공/실패 시 화면 상태 확인(상세 렌더링은 PetView.test.jsx/
// PetActionButtons.test.jsx가 담당).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PetPanel from './PetPanel';

vi.mock('../../api/pet.api', () => ({
  getPet: vi.fn(),
  namePet: vi.fn(),
  bathePet: vi.fn(),
  feedPet: vi.fn(),
  feedSpecialFood: vi.fn(),
  patPet: vi.fn(),
  fetchFortune: vi.fn(),
}));
vi.mock('../../api/application.api', () => ({
  listMyApplications: vi.fn(),
}));

import { getPet, patPet, namePet } from '../../api/pet.api';
import { listMyApplications } from '../../api/application.api';

function renderPanel() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PetPanel />
    </QueryClientProvider>
  );
}

describe('PetPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('펫 조회 성공 시 이름이 표시된다', async () => {
    getPet.mockResolvedValue({ stage: '알', egg_state: '평범', name: '김커푸' });
    listMyApplications.mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText('김커푸')).toBeInTheDocument();
  });

  it('펫 조회 실패 시 에러 문구가 표시된다', async () => {
    getPet.mockRejectedValue(new Error('네트워크 오류'));
    renderPanel();

    expect(await screen.findByText('펫 정보를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('행동 성공 시 반응(이모지+문구)이 말풍선에 잠깐 떴다가 사라진다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getPet.mockResolvedValue({ stage: '성체', mood: '평범', ear_type: '위로 곧게', name: '김커푸' });
    listMyApplications.mockResolvedValue([]);
    patPet.mockResolvedValue({});
    renderPanel();

    await screen.findByText('김커푸');
    fireEvent.click(screen.getByRole('button', { name: '쓰다듬기' }));

    await waitFor(() => expect(screen.getByText('❤️ 완전 좋아요~')).toBeInTheDocument());

    vi.advanceTimersByTime(4500);
    await waitFor(() => expect(screen.queryByText('❤️ 완전 좋아요~')).not.toBeInTheDocument());

    vi.useRealTimers();
  });

  // FE-3: 별도 페이지 대신 펫 팝업을 처음 열 때 이름이 없으면 여기서 바로 짓는다.
  it('펫 이름이 없으면 이름 짓기 폼이 뜨고, 이름을 지으면 그 자리에서 평소 펫 화면으로 바뀐다', async () => {
    getPet
      .mockResolvedValueOnce({ stage: '알', egg_state: '평범', name: null })
      .mockResolvedValue({ stage: '알', egg_state: '평범', name: '몽실이' });
    listMyApplications.mockResolvedValue([]);
    namePet.mockResolvedValue({});
    renderPanel();

    expect(await screen.findByText('펫에게 이름을 지어주세요')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '몽실이' } });
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(namePet).toHaveBeenCalled());
    expect(namePet.mock.calls[0][0]).toEqual({ name: '몽실이' });
    expect(await screen.findByText('몽실이')).toBeInTheDocument();
  });

  it('이름 짓기에서 건너뛰기를 누르면 기본 이름으로 저장된다', async () => {
    getPet.mockResolvedValue({ stage: '알', egg_state: '평범', name: null });
    listMyApplications.mockResolvedValue([]);
    namePet.mockResolvedValue({});
    renderPanel();

    fireEvent.click(await screen.findByRole('button', { name: '건너뛰기' }));

    await waitFor(() => expect(namePet).toHaveBeenCalled());
    expect(namePet.mock.calls[0][0]).toEqual({ name: '김커푸' });
  });
});
