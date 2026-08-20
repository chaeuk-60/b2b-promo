// 펫 행동 버튼(8-wireframe.md 6번): 목욕/밥/특식 주기/쓰다듬기 4개가 동등하게 노출되고,
// "밥"은 특식 주기의 하위 메뉴가 아니라 완전히 분리된 버튼이다(1-domain-definition.md
// "특식 주기 버튼" 규칙, 10-plan.md FE-8). 오늘의 운세는 새끼/성체 전용.
import { useState } from 'react';
import { useBathePet, useFeedPet, useFeedSpecialFood, usePatPet, useFortune } from '../../hooks/usePetAction';
import { useMyApplications } from '../../hooks/useMyApplications';
import { foodEmoji } from '../../utils/foodEmoji';

function PetActionButtons({ pet }) {
  const [showPicker, setShowPicker] = useState(false);
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

  function handleFeedSpecial() {
    if (!selectedPromotionId) return;
    feedSpecial.mutate(
      { promotionId: selectedPromotionId },
      { onSuccess: () => setShowPicker(false) }
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
      <button type="button" className="pixel-btn" onClick={() => feed.mutate()} disabled={anyPending}>
        밥
      </button>
      <button
        type="button"
        className="pixel-btn"
        onClick={() => setShowPicker(true)}
        disabled={heldFoods.length === 0}
      >
        특식 주기
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

      {showPicker && (
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
