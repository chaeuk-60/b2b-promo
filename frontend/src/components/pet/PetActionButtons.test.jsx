// FE-8 완료 조건: 목욕/쓰다듬기 클릭 시 상태 갱신, "밥" 드롭다운(기본 주식/특식 주기)에서
// 보유 특식 유무에 따른 활성화/선택, 오늘의 운세는 알 단계 비활성/새끼·성체 전용.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PetActionButtons from './PetActionButtons';

vi.mock('../../api/pet.api', () => ({
  bathePet: vi.fn(),
  feedPet: vi.fn(),
  feedSpecialFood: vi.fn(),
  patPet: vi.fn(),
  fetchFortune: vi.fn(),
}));
vi.mock('../../api/application.api', () => ({
  listMyApplications: vi.fn(),
}));

import { bathePet, feedPet, patPet, feedSpecialFood, fetchFortune } from '../../api/pet.api';
import { listMyApplications } from '../../api/application.api';

function renderButtons(pet, applications = []) {
  listMyApplications.mockResolvedValue(applications);
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PetActionButtons pet={pet} />
    </QueryClientProvider>
  );
}

const adultPet = { stage: '성체', mood: '평범' };

describe('PetActionButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('목욕/쓰다듬기 버튼 클릭 시 각각의 행동 API가 호출된다', async () => {
    bathePet.mockResolvedValue({});
    patPet.mockResolvedValue({});
    renderButtons(adultPet);

    fireEvent.click(screen.getByRole('button', { name: '목욕' }));
    await waitFor(() => expect(bathePet).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: '쓰다듬기' }));
    await waitFor(() => expect(patPet).toHaveBeenCalled());
  });

  it('밥 버튼을 누르면 기본 주식/특식 주기 선택지가 나오고, 기본 주식을 고르면 feedPet이 호출된다', async () => {
    feedPet.mockResolvedValue({});
    renderButtons(adultPet);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const basicButton = await screen.findByRole('button', { name: /기본 주식/ });
    fireEvent.click(basicButton);

    await waitFor(() => expect(feedPet).toHaveBeenCalled());
  });

  it('보유 특식이 없으면 밥 메뉴의 특식 주기 항목이 비활성화된다', async () => {
    renderButtons(adultPet, []);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: /특식 주기/ });
    await waitFor(() => expect(specialButton).toBeDisabled());
  });

  it('보유 특식이 있으면 특식 주기에서 목록을 선택해 급여할 수 있다', async () => {
    feedSpecialFood.mockResolvedValue({});
    renderButtons(adultPet, [
      { promotion_id: 1, title: '여름맞이 쌀 증정', special_food_id: 'rice-cake' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: /특식 주기/ });
    await waitFor(() => expect(specialButton).not.toBeDisabled());
    fireEvent.click(specialButton);

    expect(await screen.findByText('줄 특식을 선택하세요')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio'));
    fireEvent.click(screen.getByRole('button', { name: '급여하기' }));

    await waitFor(() => expect(feedSpecialFood).toHaveBeenCalled());
    expect(feedSpecialFood.mock.calls[0][0]).toEqual({ promotionId: 1 });
  });

  it('알 단계에서는 오늘의 운세 버튼이 노출되지 않는다', () => {
    renderButtons({ stage: '알', egg_state: '평범' });

    expect(screen.queryByRole('button', { name: '오늘의 운세' })).not.toBeInTheDocument();
  });

  it('새끼/성체에서는 오늘의 운세 버튼을 눌러 결과가 표시된다', async () => {
    fetchFortune.mockResolvedValue({ message: '오늘은 좋은 일이 생길 거예요' });
    renderButtons(adultPet);

    fireEvent.click(screen.getByRole('button', { name: '오늘의 운세' }));

    expect(await screen.findByText('오늘은 좋은 일이 생길 거예요')).toBeInTheDocument();
  });
});
