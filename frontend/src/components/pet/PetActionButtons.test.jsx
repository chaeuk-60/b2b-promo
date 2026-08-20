// FE-8 완료 조건: 목욕/쓰다듬기 클릭 시 상태 갱신, "밥" 메뉴(밥/특식)에서 보유 특식
// 유무에 따른 활성화, 오늘의 운세는 알 단계 비활성/새끼·성체 전용.
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

function renderButtons(pet, applications = [], onAction = () => {}) {
  listMyApplications.mockResolvedValue(applications);
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PetActionButtons pet={pet} onAction={onAction} />
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

  it('밥 버튼을 누르면 밥/특식 선택지가 나오고, 밥을 고르면 feedPet이 호출된다', async () => {
    feedPet.mockResolvedValue({});
    renderButtons(adultPet);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const basicButton = await screen.findByRole('button', { name: '밥' });
    fireEvent.click(basicButton);

    await waitFor(() => expect(feedPet).toHaveBeenCalled());
  });

  it('보유 특식이 없으면 밥 메뉴의 특식 항목이 비활성화된다', async () => {
    renderButtons(adultPet, []);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: '특식' });
    await waitFor(() => expect(specialButton).toBeDisabled());
  });

  it('이미 급여해서 소모된(special_food_used_at 있음) 특식은 보유 목록에서 제외된다', async () => {
    renderButtons(adultPet, [
      { promotion_id: 1, title: '이미 준 특식', special_food_id: 'a', special_food_used_at: '2026-08-01T00:00:00.000Z' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: '특식' });
    await waitFor(() => expect(specialButton).toBeDisabled());
  });

  it('보유 특식이 있으면 특식 목록에서 클릭 한 번으로 급여한다', async () => {
    feedSpecialFood.mockResolvedValue({});
    renderButtons(adultPet, [
      { promotion_id: 1, title: '여름맞이 쌀 증정', special_food_id: 'rice-cake' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: '특식' });
    await waitFor(() => expect(specialButton).not.toBeDisabled());
    fireEvent.click(specialButton);

    const foodButton = await screen.findByRole('button', { name: /여름맞이 쌀 증정/ });
    fireEvent.click(foodButton);

    await waitFor(() => expect(feedSpecialFood).toHaveBeenCalled());
    expect(feedSpecialFood.mock.calls[0][0]).toEqual({ promotionId: 1 });
  });

  it('알 단계에서는 오늘의 운세 버튼이 비활성화되고 안내 툴팁이 붙는다', () => {
    renderButtons({ stage: '알', egg_state: '평범' });

    const fortuneButton = screen.getByRole('button', { name: '오늘의 운세' });
    expect(fortuneButton).toBeDisabled();
    expect(fortuneButton).toHaveAttribute('title', '알에서 부화하면 이용할 수 있어요');
  });

  it('새끼/성체에서는 오늘의 운세 버튼을 눌러 펫이 말하는 형태로 결과가 전달된다', async () => {
    fetchFortune.mockResolvedValue({ message: '오늘은 좋은 일이 생길 거예요' });
    const onAction = vi.fn();
    renderButtons(adultPet, [], onAction);

    const fortuneButton = screen.getByRole('button', { name: '오늘의 운세' });
    expect(fortuneButton).not.toBeDisabled();
    fireEvent.click(fortuneButton);

    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith({
        emoji: '🍀',
        text: '오늘은 좋은 일이 생길 거예요',
        spotlight: true,
      })
    );
  });

  it('행동 성공 시 각 행동에 맞는 반응(이모지+문구)으로 onAction이 호출된다', async () => {
    bathePet.mockResolvedValue({});
    patPet.mockResolvedValue({});
    const onAction = vi.fn();
    renderButtons(adultPet, [], onAction);

    fireEvent.click(screen.getByRole('button', { name: '목욕' }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith({ emoji: '🫧', text: '뽀송뽀송~' }));

    fireEvent.click(screen.getByRole('button', { name: '쓰다듬기' }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith({ emoji: '❤️', text: '완전 좋아요~' }));
  });

  it('특식을 급여하면 해당 특식 이모지+하트로 onAction이 호출된다', async () => {
    feedSpecialFood.mockResolvedValue({});
    const onAction = vi.fn();
    renderButtons(
      adultPet,
      [{ promotion_id: 1, title: '여름맞이 쌀 증정', special_food_id: 'rice-cake' }],
      onAction
    );

    fireEvent.click(screen.getByRole('button', { name: /^밥/ }));
    const specialButton = await screen.findByRole('button', { name: '특식' });
    await waitFor(() => expect(specialButton).not.toBeDisabled());
    fireEvent.click(specialButton);
    fireEvent.click(await screen.findByRole('button', { name: /여름맞이 쌀 증정/ }));

    await waitFor(() => expect(onAction).toHaveBeenCalled());
    const reaction = onAction.mock.calls[0][0];
    expect(reaction.emoji).toContain('❤️');
    expect(reaction.text).toBe('완전 최고예요!!! 짱 냠냠 야미~!!');
  });
});
