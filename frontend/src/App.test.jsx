// FE-1 완료 조건: 빈 페이지 라우트 5개(로그인/목록/상세/나의신청/펫)로 이동 가능한지 확인.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App 라우팅', () => {
  it('/ 경로는 로그인 페이지를 보여준다', () => {
    renderAt('/');
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('/promotions 경로는 프로모션 목록 페이지를 보여준다', () => {
    renderAt('/promotions');
    expect(screen.getByText('프로모션 목록')).toBeInTheDocument();
  });

  it('/promotions/:id 경로는 프로모션 상세 페이지를 보여준다', () => {
    renderAt('/promotions/1');
    expect(screen.getByText('프로모션 상세')).toBeInTheDocument();
  });

  it('/my-applications 경로는 나의 신청 목록 페이지를 보여준다', () => {
    renderAt('/my-applications');
    expect(screen.getByText('나의 신청 목록')).toBeInTheDocument();
  });

  it('/pet 경로는 펫 화면 페이지를 보여준다', () => {
    renderAt('/pet');
    expect(screen.getByText('펫 화면')).toBeInTheDocument();
  });
});
