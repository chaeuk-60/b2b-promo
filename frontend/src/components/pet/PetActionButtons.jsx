// 펫 행동 버튼(8-wireframe.md 6번 / 승인된 목업 기준): 목욕/밥/쓰다듬기 3버튼 노출.
// "밥"은 누르면 하위에 "기본 주식"/"특식 주기" 두 항목이 나오는 드롭다운이다 - 다만
// API 자체는 여전히 완전히 분리된 별개 엔드포인트라(POST /pet/feed vs
// /pet/feed-special-food) 1-domain-definition.md "특식 주기 버튼" 규칙(행동 분리)은
// 그대로 지킨다. 여기서 "분리"는 UI 배치가 아니라 행동/효과가 섞이지 않는다는 뜻으로
// 재해석했다(사용자 확인, 10-plan.md FE-8).
import { useState } from 'react';
import { useBathePet, useFeedPet, useFeedSpecialFood, usePatPet, useFortune } from '../../hooks/usePetAction';
import { useMyApplications } from '../../hooks/useMyApplications';
import { foodEmoji } from '../../utils/foodEmoji';

function PetActionButtons({ pet }) {
  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [fortuneMessage, setFortuneMessage] = useState(null);

  const { data: applications } = useMyApplications();
  const heldFoods = applications || [];

  const bathe = useBathePet();
  const feed = useFeedPet();
  const feedSpecial = useFeedSpecialFood();
  const pat = usePatPet();
  const fortune = useFortune();

  const anyPending = bathe.isPending || feed.isPending || pat.isPending;
  const canShowFortune = pet.stage === '새끼' || pet.stage === '성체';

  function handleFeedBasic() {
    feed.mutate(undefined, { onSuccess: () => setShowFeedMenu(false) });
  }

  function openFoodPicker() {
    setShowFoodPicker(true);
  }

  function handleFeedSpecial() {
    if (!selectedPromotionId) return;
    feedSpecial.mutate(
      { promotionId: selectedPromotionId },
      {
        onSuccess: () => {
          setShowFoodPicker(false);
          setShowFeedMenu(false);
        },
      }
    );
  }

  function handleFortune() {
    fortune.mutate(undefined, { onSuccess: (data) => setFortuneMessage(data.message) });
  }

  return (
    <div>
      <button type="button" className="pixel-btn" onClick={() => bathe.mutate()} disabled={anyPending}>
        목욕
      </button>
      <button
        type="button"
        className="pixel-btn"
        aria-expanded={showFeedMenu}
        onClick={() => setShowFeedMenu((open) => !open)}
      >
        밥 {showFeedMenu ? '▲' : '▼'}
      </button>
      <button type="button" className="pixel-btn" onClick={() => pat.mutate()} disabled={anyPending}>
        쓰다듬기
      </button>

      {canShowFortune && (
        <button
          type="button"
          className="pixel-btn pixel-btn-primary"
          onClick={handleFortune}
          disabled={fortune.isPending}
        >
          오늘의 운세
        </button>
      )}

      {(bathe.isError || feed.isError || pat.isError || fortune.isError) && (
        <p role="alert">행동 처리에 실패했습니다.</p>
      )}
      {fortuneMessage && <p>{fortuneMessage}</p>}

      {showFeedMenu && !showFoodPicker && (
        <div className="pixel-card">
          <p>밥 선택</p>
          <button type="button" className="pixel-btn" onClick={handleFeedBasic} disabled={feed.isPending}>
            기본 주식 (쌀밥)
            <br />
            평범한 상태 회복, 특식 효과 없음
          </button>
          <button type="button" className="pixel-btn" onClick={openFoodPicker} disabled={heldFoods.length === 0}>
            특식 주기 ›<br />
            보유 특식 {heldFoods.length}개 중 선택해서 급여
          </button>
        </div>
      )}

      {showFeedMenu && showFoodPicker && (
        <div className="pixel-card">
          <p>줄 특식을 선택하세요</p>
          {heldFoods.map((application) => (
            <label key={application.promotion_id}>
              <input
                type="radio"
                name="specialFood"
                checked={selectedPromotionId === application.promotion_id}
                onChange={() => setSelectedPromotionId(application.promotion_id)}
              />
              {foodEmoji(application.special_food_id)} {application.title}의 특식
            </label>
          ))}
          {feedSpecial.isError && <p role="alert">특식 급여에 실패했습니다.</p>}
          <button
            type="button"
            className="pixel-btn pixel-btn-primary"
            onClick={handleFeedSpecial}
            disabled={!selectedPromotionId || feedSpecial.isPending}
          >
            급여하기
          </button>
        </div>
      )}
    </div>
  );
}

export default PetActionButtons;
