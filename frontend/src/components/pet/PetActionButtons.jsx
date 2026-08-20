// 펫 행동 버튼(8-wireframe.md 6번 / 승인된 목업 기준): 목욕/밥/쓰다듬기 3버튼 노출.
// "밥"을 누르면 포켓몬 메뉴처럼 씬(초원 배경) 아래쪽에 겹쳐서 짧은 선택지가 뜬다 -
// "밥" 또는 "특식"만 고르면 되고, 특식은 보유 목록에서 클릭 한 번으로 바로 준다(설명
// 문구 없이 간단하게, 사용자 확인). API 자체는 여전히 완전히 분리된 별개 엔드포인트라
// (POST /pet/feed vs /pet/feed-special-food) 1-domain-definition.md "특식 주기 버튼"
// 규칙(행동 분리)은 그대로 지킨다 - "분리"는 UI가 아니라 행동/효과가 섞이지 않는다는 뜻.
import { useState } from 'react';
import { useBathePet, useFeedPet, useFeedSpecialFood, usePatPet, useFortune } from '../../hooks/usePetAction';
import { useMyApplications } from '../../hooks/useMyApplications';
import { foodEmoji } from '../../utils/foodEmoji';

// 행동별 반응(말풍선에 잠깐 표시, PetPanel이 실제 타이머를 관리한다). 텍스트는 알
// 단계에서는 안 쓰고 이모지만 보여준다(PetView가 stage로 판단). 새끼는 아기 말투로
// 짧게, 성체는 신난 느낌으로 길게 말한다(사용자 확인).
const BABY_REACTIONS = {
  bathe: { emoji: '🫧', text: '뽀득!' },
  feed: { emoji: '🍚', text: '마시떠' },
  pat: { emoji: '❤️', text: '조아' },
};

const ADULT_REACTIONS = {
  bathe: { emoji: '🫧', text: '뽀송뽀송~' },
  feed: { emoji: '🍚', text: '냠냠 맛있어요! 최고예요~' },
  pat: { emoji: '❤️', text: '완전 좋아요~' },
};

function PetActionButtons({ pet, onAction }) {
  const reactions = pet.stage === '새끼' ? BABY_REACTIONS : ADULT_REACTIONS;

  function notify(action) {
    onAction?.(reactions[action]);
  }

  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);

  const { data: applications } = useMyApplications();
  // 특식은 한 번 급여하면 소모되므로(special_food_used_at) 아직 안 쓴 것만 보유 목록에 남긴다.
  const heldFoods = (applications || []).filter((a) => !a.special_food_used_at);

  const bathe = useBathePet();
  const feed = useFeedPet();
  const feedSpecial = useFeedSpecialFood();
  const pat = usePatPet();
  const fortune = useFortune();

  const anyPending = bathe.isPending || feed.isPending || pat.isPending;
  const canShowFortune = pet.stage === '새끼' || pet.stage === '성체';

  function closeFeedMenu() {
    setShowFeedMenu(false);
    setShowFoodPicker(false);
  }

  function handleFeedBasic() {
    feed.mutate(undefined, {
      onSuccess: () => {
        closeFeedMenu();
        notify('feed');
      },
    });
  }

  function handleFeedSpecial(application) {
    feedSpecial.mutate(
      { promotionId: application.promotion_id },
      {
        onSuccess: () => {
          closeFeedMenu();
          onAction?.({
            emoji: `${foodEmoji(application.special_food_id)}❤️`,
            text: pet.stage === '새끼' ? '우와 마시떠!!' : '완전 최고예요!!! 짱 냠냠 야미~!!',
          });
        },
      }
    );
  }

  function handleFortune() {
    fortune.mutate(undefined, {
      // 오늘의 운세는 별도 문구가 아니라 펫이 직접 말풍선으로 말해준다. spotlight로
      // 표시해서(가운데 고정 + 어두운 배경) 이동 중에도 안정적으로 읽을 수 있게 한다.
      onSuccess: (data) => onAction?.({ emoji: '🍀', text: data.message, spotlight: true }),
    });
  }

  return (
    <div className="pet-actions-row">
      {showFeedMenu && (
        <div className="pet-feed-menu">
          {!showFoodPicker ? (
            <>
              <button type="button" className="pixel-btn" onClick={handleFeedBasic} disabled={feed.isPending}>
                밥
              </button>
              <button
                type="button"
                className="pixel-btn"
                onClick={() => setShowFoodPicker(true)}
                disabled={heldFoods.length === 0}
              >
                특식
              </button>
            </>
          ) : (
            heldFoods.map((application) => (
              <button
                type="button"
                className="pixel-btn"
                key={application.promotion_id}
                onClick={() => handleFeedSpecial(application)}
                disabled={feedSpecial.isPending}
              >
                {foodEmoji(application.special_food_id)} {application.title}
              </button>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        className="pixel-btn"
        onClick={() => bathe.mutate(undefined, { onSuccess: () => notify('bathe') })}
        disabled={anyPending}
      >
        목욕
      </button>
      <button
        type="button"
        className="pixel-btn"
        aria-expanded={showFeedMenu}
        onClick={() => (showFeedMenu ? closeFeedMenu() : setShowFeedMenu(true))}
      >
        밥 {showFeedMenu ? '▲' : '▼'}
      </button>
      <button
        type="button"
        className="pixel-btn"
        onClick={() => pat.mutate(undefined, { onSuccess: () => notify('pat') })}
        disabled={anyPending}
      >
        쓰다듬기
      </button>

      <button
        type="button"
        className="pixel-btn pixel-btn-primary"
        onClick={handleFortune}
        disabled={!canShowFortune || fortune.isPending}
        title={canShowFortune ? undefined : '알에서 부화하면 이용할 수 있어요'}
      >
        오늘의 운세
      </button>

      {(bathe.isError || feed.isError || pat.isError || fortune.isError || feedSpecial.isError) && (
        <p role="alert">행동 처리에 실패했습니다.</p>
      )}
    </div>
  );
}

export default PetActionButtons;
