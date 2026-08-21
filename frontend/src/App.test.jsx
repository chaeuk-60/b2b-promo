// FE-1 완료 조건: 빈 페이지 라우트 5개(로그인/목록/상세/나의신청/펫)로 이동 가능한지 확인.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// App은 마운트 시 세션 복원(refresh)을 먼저 시도하고 끝나야 라우트를 그린다(관리자가
// 새로고침하면 로그인 정보가 사라지던 버그 수정 - App.jsx 참고). 로그인 안 한 상태를
// 모사하기 위해 refresh는 실패시킨다.
vi.mock('./api/auth.api', () => ({
  refresh: vi.fn().mockRejectedValue(new Error('로그인 안 함')),
  login: vi.fn(),
  signup: vi.fn(),
}));

function renderAt(path) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('App 라우팅', () => {
  it('/ 경로는 로그인 페이지를 보여준다', async () => {
    renderAt('/');
    expect(await screen.findByText('로그인')).toBeInTheDocument();
  });

  it('/promotions 경로는 프로모션 목록 페이지를 보여준다', async () => {
    // PromotionListPage는 이제 실제 API를 호출하는 화면이라(내용 검증은
    // PromotionListPage.test.jsx가 담당), 여기서는 라우팅 자체만 확인한다.
    renderAt('/promotions');
    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument();
  });

  it('/promotions/:id 경로는 프로모션 상세 페이지를 보여준다', async () => {
    // PromotionDetailPage도 실제 API를 호출하는 화면이라(내용 검증은
    // PromotionDetailPage.test.jsx가 담당), 여기서는 라우팅 자체만 확인한다.
    renderAt('/promotions/1');
    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument();
  });

  it('/my-applications 경로는 나의 신청 목록 페이지를 보여준다', async () => {
    // MyApplicationsPage도 실제 API를 호출하는 화면이라(내용 검증은
    // MyApplicationsPage.test.jsx가 담당), 여기서는 라우팅 자체만 확인한다.
    renderAt('/my-applications');
    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument();
  });

  it('/pet 경로는 펫 화면 페이지를 보여준다', async () => {
    // PetPage도 실제 API를 호출하는 화면이라(내용 검증은 PetPage.test.jsx/
    // PetView.test.jsx가 담당), 여기서는 라우팅 자체만 확인한다.
    renderAt('/pet');
    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument();
  });

  it('/admin/promotions 경로는 관리자가 아니면 프로모션 목록으로 리다이렉트된다', async () => {
    // 로그인하지 않은(user: null) 상태이므로 즉시 /promotions로 리다이렉트되고,
    // 그 화면은 실제 API를 호출하는 화면이라 로딩 문구가 뜬다(상세 검증은
    // AdminPromotionsPage.test.jsx가 담당).
    renderAt('/admin/promotions');
    expect(await screen.findByText('불러오는 중...')).toBeInTheDocument();
  });
});
