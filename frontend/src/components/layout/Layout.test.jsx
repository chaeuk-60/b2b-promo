// FE-10 완료 조건: 상단 네비게이션으로 목록/나의신청 이동 가능, "펫 보기"는 팝업
// 토글(열림/닫힘)로 동작한다.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';

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

import { getPet } from '../../api/pet.api';
import { listMyApplications } from '../../api/application.api';

function renderLayout() {
  getPet.mockResolvedValue({ stage: '알', egg_state: '평범', name: '김커푸' });
  listMyApplications.mockResolvedValue([]);
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Layout>
          <p>페이지 내용</p>
        </Layout>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Layout', () => {
  it('프로모션 목록/나의 신청 목록으로 이동하는 네비게이션 링크가 있다', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: /프로모션 목록/ })).toHaveAttribute(
      'href',
      '/promotions'
    );
    expect(screen.getByRole('link', { name: /나의 신청 목록/ })).toHaveAttribute(
      'href',
      '/my-applications'
    );
  });

  it('페이지 내용은 그대로 렌더링된다', () => {
    renderLayout();

    expect(screen.getByText('페이지 내용')).toBeInTheDocument();
  });

  it('펫 보기 버튼을 누르면 팝업이 열리고, 다시 누르면 닫힌다', async () => {
    renderLayout();

    const toggle = screen.getByRole('button', { name: /펫 보기/ });
    expect(screen.queryByText('김커푸(평범)')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(await screen.findByText('김커푸(평범)')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('김커푸(평범)')).not.toBeInTheDocument();
  });

  it('배경(오버레이)을 클릭하면 팝업이 닫힌다', async () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /펫 보기/ }));
    await screen.findByText('김커푸(평범)');

    fireEvent.click(document.querySelector('.pet-popup-overlay'));
    expect(screen.queryByText('김커푸(평범)')).not.toBeInTheDocument();
  });

  it('닫기 버튼을 누르면 팝업이 닫힌다', async () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: /펫 보기/ }));
    await screen.findByText('김커푸(평범)');

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByText('김커푸(평범)')).not.toBeInTheDocument();
  });
});
