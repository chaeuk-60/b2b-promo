// FE-7 완료 조건: stage/mood(또는 eggState)에 맞는 스프라이트/대사, 묘비 안내 문구.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PetView from './PetView';

describe('PetView', () => {
  it('알 단계는 eggState에 맞는 스프라이트와 이름/상태를 표시한다', () => {
    render(<PetView pet={{ stage: '알', egg_state: '더러움', name: '김커푸' }} />);

    expect(screen.getByText('이름: 김커푸')).toBeInTheDocument();
    expect(screen.getByText('상태: 더러움')).toBeInTheDocument();
    expect(screen.getByAltText('알 (더러움)')).toHaveAttribute('src', '/images/egg-더러움.svg');
  });

  it('새끼 단계는 귀 모양 베이스 + mood 오버레이 스프라이트를 표시한다', () => {
    render(
      <PetView pet={{ stage: '새끼', mood: '배고픔', ear_type: '아래로 늘어짐', name: '김커푸' }} />
    );

    expect(screen.getByText('상태: 배고픔')).toBeInTheDocument();
    // 대사는 목록 중 랜덤으로 골라 표시하므로(1-domain-definition.md), 후보 중 하나인지만 확인한다.
    expect(screen.getByText(/꼬르륵\.\.\. 배고파요|밥 주세요!/)).toBeInTheDocument();
    expect(screen.getByAltText('새끼 (배고픔)')).toHaveAttribute('src', '/images/baby-dog.svg');
  });

  it('성체 단계는 성체 베이스 스프라이트를 표시한다', () => {
    render(<PetView pet={{ stage: '성체', mood: '평범', ear_type: '위로 곧게', name: '김커푸' }} />);

    expect(screen.getByAltText('성체 (평범)')).toHaveAttribute('src', '/images/adult-cat.svg');
  });

  it('행복 mood는 정적 오버레이 대신 걷기 애니메이션 프레임을 표시한다', () => {
    render(<PetView pet={{ stage: '성체', mood: '행복', ear_type: '위로 곧게', name: '김커푸' }} />);

    expect(screen.getByAltText('성체 (행복)')).toHaveAttribute('src', '/images/happy-walk-1.svg');
  });

  it('묘비 상태일 때 안내 메시지가 표시된다', () => {
    render(<PetView pet={{ stage: '묘비', name: '김커푸' }} />);

    expect(screen.getByText('자주 오세요...')).toBeInTheDocument();
    expect(screen.getByAltText('묘비')).toHaveAttribute('src', '/images/tombstone.svg');
  });
});
