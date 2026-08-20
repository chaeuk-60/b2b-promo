// FE-2: 로그인/회원가입 폼 제출 -> pet.name 유무에 따라 이동, 실패 시 에러 메시지 표시.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './LoginPage';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { login, signup } from '../api/auth.api';

function renderLoginPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/pet/name" element={<div>펫 이름 짓기</div>} />
          <Route path="/promotions" element={<div>프로모션 목록</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인 성공 시 pet.name이 없으면 펫 이름 짓기 화면으로 이동한다', async () => {
    login.mockResolvedValue({
      accessToken: 'token',
      user: { id: 1, email: 'a@example.com' },
      pet: { name: null },
    });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(screen.getByText('펫 이름 짓기')).toBeInTheDocument());
  });

  it('로그인 성공 시 pet.name이 있으면 프로모션 목록 화면으로 이동한다', async () => {
    login.mockResolvedValue({
      accessToken: 'token',
      user: { id: 1, email: 'a@example.com' },
      pet: { name: '몽실이' },
    });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(screen.getByText('프로모션 목록')).toBeInTheDocument());
  });

  it('로그인 실패 시 에러 메시지가 표시된다', async () => {
    login.mockRejectedValue({
      response: { data: { error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } } },
    });
    renderLoginPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '이메일 또는 비밀번호가 올바르지 않습니다.'
      )
    );
  });

  it('회원가입 모드로 전환 후 제출하면 signup과 login이 순서대로 호출되고 이동한다', async () => {
    signup.mockResolvedValue({ user: { id: 2, email: 'b@example.com' }, pet: { name: null } });
    login.mockResolvedValue({
      accessToken: 'token',
      user: { id: 2, email: 'b@example.com' },
      pet: { name: null },
    });
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'b@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => expect(screen.getByText('펫 이름 짓기')).toBeInTheDocument());
    expect(signup).toHaveBeenCalled();
    expect(signup.mock.calls[0][0]).toEqual({ email: 'b@example.com', password: 'password123' });
    expect(login).toHaveBeenCalled();
    expect(login.mock.calls[0][0]).toEqual({ email: 'b@example.com', password: 'password123' });
  });
});
