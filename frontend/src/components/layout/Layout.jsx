// 공통 네비게이션(8-wireframe.md 3번, 10-plan.md FE-10): 로그인 이후 화면(목록/상세/
// 나의신청/펫/관리자)에 공통으로 얹는다. "펫 보기"는 페이지 이동이 아니라 팝업 토글로
// 동작한다 - 어느 화면에서든 우상단 버튼으로 펫을 열고 닫을 수 있어야 한다는 요구사항 반영
// (원래 와이어프레임은 "펫 화면으로 이동"이었으나 팝업으로 대체).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PetPanel from '../pet/PetPanel';
import { usePet } from '../../hooks/usePet';
import { bodySpriteUrl, eggSpriteUrl, TOMBSTONE_SPRITE_URL } from '../../utils/petSprite';

// 와이어프레임 3번 "펫 보기는 텍스트 버튼 대신 스프라이트 축소판"에 맞춰 실제 펫 이미지를
// 버튼 아이콘으로 쓴다. usePet()은 PetPanel과 같은 쿼리 키(['pet'])를 쓰므로 TanStack
// Query가 요청을 중복 없이 캐시/공유한다(네트워크 요청이 두 번 나가지 않는다).
function navThumbnailUrl(pet) {
  if (!pet) return null;
  if (pet.stage === '묘비') return TOMBSTONE_SPRITE_URL;
  if (pet.stage === '알') return eggSpriteUrl(pet.egg_state);
  return bodySpriteUrl(pet.stage, pet.ear_type);
}

function Layout({ children }) {
  const [showPetPopup, setShowPetPopup] = useState(false);
  const { data: pet } = usePet();
  const thumbnailUrl = navThumbnailUrl(pet);

  return (
    <div>
      <nav className="app-nav">
        <Link to="/promotions">
          📋 <span className="app-nav-label">프로모션 목록</span>
        </Link>
        <Link to="/my-applications">
          📄 <span className="app-nav-label">나의 신청 목록</span>
        </Link>
        <button
          type="button"
          className="pixel-btn app-nav-pet-toggle"
          aria-expanded={showPetPopup}
          onClick={() => setShowPetPopup((open) => !open)}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              width={20}
              height={20}
              className="app-nav-pet-thumbnail"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            '🐾'
          )}{' '}
          <span className="app-nav-label">펫 보기</span>
        </button>
      </nav>

      {children}

      {showPetPopup && (
        <div className="pet-popup-overlay" onClick={() => setShowPetPopup(false)}>
          <div className="pet-popup pixel-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pixel-btn pet-popup-close"
              aria-label="닫기"
              onClick={() => setShowPetPopup(false)}
            >
              ×
            </button>
            <PetPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
