// 펫 상태 표시(8-wireframe.md 6번): 이름/상태 + 초원 배경 안 스프라이트 + 일상 대사 말풍선.
// stage/mood/eggState 조합에 따라 분기 렌더하는 하나의 컴포넌트로 유지한다(잘게 쪼개지 않음,
// 10-plan.md FE-7).
import { useEffect, useState } from 'react';
import {
  bodySpriteUrl,
  eggSpriteUrl,
  moodOverlayUrl,
  moodDialogue,
  eggDialogue,
  HAPPY_WALK_FRAMES,
  TOMBSTONE_SPRITE_URL,
  TOMBSTONE_MESSAGE,
} from '../../utils/petSprite';

// 행복 mood는 정적 오버레이 대신 걷기 사이클 애니메이션으로 표현한다(2-pet-design-guide.md).
// 실제 화면을 좌우로 돌아다니게 하는 것까지는 과하다고 판단해(오버엔지니어링 금지) 제자리에서
// 프레임만 순환시키는 걸음 사이클로 단순화했다.
function useHappyWalkFrame(isHappy) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isHappy) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % HAPPY_WALK_FRAMES.length), 400);
    return () => clearInterval(id);
  }, [isHappy]);

  return frame;
}

function PetView({ pet }) {
  const isHappy = pet.stage !== '알' && pet.stage !== '묘비' && pet.mood === '행복';
  const walkFrame = useHappyWalkFrame(isHappy);

  if (pet.stage === '묘비') {
    return (
      <div>
        {pet.name && <p>이름: {pet.name}</p>}
        <div className="pet-scene">
          <img src={TOMBSTONE_SPRITE_URL} alt="묘비" width={96} height={96} style={{ imageRendering: 'pixelated' }} />
        </div>
        <p>{TOMBSTONE_MESSAGE}</p>
      </div>
    );
  }

  if (pet.stage === '알') {
    return (
      <div>
        <p>이름: {pet.name}</p>
        <p>상태: {pet.egg_state}</p>
        <div className="pet-scene">
          <p>({eggDialogue(pet.egg_state)})</p>
          <img
            src={eggSpriteUrl(pet.egg_state)}
            alt={`알 (${pet.egg_state})`}
            width={96}
            height={96}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
    );
  }

  // 새끼/성체 공통: 베이스 스프라이트 + mood 오버레이(행복이면 걷기 프레임으로 대체) 합성.
  const bodyUrl = isHappy ? HAPPY_WALK_FRAMES[walkFrame] : bodySpriteUrl(pet.stage, pet.ear_type);
  const overlayUrl = isHappy ? null : moodOverlayUrl(pet.mood);

  return (
    <div>
      <p>이름: {pet.name}</p>
      <p>상태: {pet.mood}</p>
      <div className="pet-scene">
        <p>({moodDialogue(pet.mood)})</p>
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
          <img
            src={bodyUrl}
            alt={`${pet.stage} (${pet.mood})`}
            width={96}
            height={96}
            style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
          />
          {overlayUrl && (
            <img
              src={overlayUrl}
              alt=""
              width={96}
              height={96}
              style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PetView;
