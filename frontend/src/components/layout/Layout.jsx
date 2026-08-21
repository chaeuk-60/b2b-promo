// 공통 네비게이션(8-wireframe.md 3번, 10-plan.md FE-10): 로그인 이후 화면(목록/상세/
// 나의신청/펫/관리자)에 공통으로 얹는다. "펫 보기"는 페이지 이동이 아니라 팝업 토글로
// 동작한다 - 어느 화면에서든 우상단 버튼으로 펫을 열고 닫을 수 있어야 한다는 요구사항 반영
// (원래 와이어프레임은 "펫 화면으로 이동"이었으나 팝업으로 대체).
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import PetPanel from '../pet/PetPanel';
import { usePet } from '../../hooks/usePet';
import useAuthStore from '../../store/auth.store';
import { bodySpriteUrl, eggSpriteUrl, TOMBSTONE_SPRITE_URL } from '../../utils/petSprite';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@b2b-promo.com';

// 와이어프레임 3번 "펫 보기는 텍스트 버튼 대신 스프라이트 축소판"에 맞춰 실제 펫 이미지를
// 버튼 아이콘으로 쓴다. usePet()은 PetPanel과 같은 쿼리 키(['pet'])를 쓰므로 TanStack
// Query가 요청을 중복 없이 캐시/공유한다(네트워크 요청이 두 번 나가지 않는다).
// 이름이 아직 없으면(펫 팝업을 열어야 이름 짓기 폼이 뜨는 상태) 알/펫 스프라이트 대신
// 발자국 이모지(🐾, thumbnailUrl null -> 아래 폴백)로 "아직 정해지지 않은 펫"임을
// 보여준다(사용자 확인).
function navThumbnailUrl(pet) {
  if (!pet || !pet.name) return null;
  if (pet.stage === '묘비') return TOMBSTONE_SPRITE_URL;
  if (pet.stage === '알') return eggSpriteUrl(pet.egg_state);
  return bodySpriteUrl(pet.stage, pet.ear_type);
}

function Layout({ children }) {
  const [showPetPopup, setShowPetPopup] = useState(false);
  const { data: pet } = usePet();
  const thumbnailUrl = navThumbnailUrl(pet);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div>
      {/* 상단 탭(레퍼런스: Y2K/레트로 OS 탭바) - 버튼과 같은 pixel-btn 모양을 그대로 써서
          통일감을 주고, 현재 페이지 탭만 brand-blue로 눌린 듯 강조한다. */}
      <nav className="app-nav">
        <NavLink
          to="/promotions"
          className={({ isActive }) => `pixel-btn${isActive ? ' pixel-tab-active' : ''}`}
        >
          📋 <span className="app-nav-label">프로모션 목록</span>
        </NavLink>
        <NavLink
          to="/my-applications"
          className={({ isActive }) => `pixel-btn${isActive ? ' pixel-tab-active' : ''}`}
        >
          📄 <span className="app-nav-label">나의 신청 목록</span>
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin/promotions"
            className={({ isActive }) => `pixel-btn${isActive ? ' pixel-tab-active' : ''}`}
          >
            🛠 <span className="app-nav-label">관리자</span>
          </NavLink>
        )}
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
            {/* 창 제목표시줄(pixel-titlebar - 프로모션 카드/상세와 공통, index.css 참고) -
                닫기 버튼을 그 안의 컨트롤 버튼으로 배치한다. */}
            <div className="pixel-titlebar">
              <button
                type="button"
                className="pixel-titlebar-btn pixel-titlebar-btn-close"
                aria-label="닫기"
                onClick={() => setShowPetPopup(false)}
              >
                ×
              </button>
            </div>
            <PetPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
