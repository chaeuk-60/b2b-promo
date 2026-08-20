// 펫 상태 표시(8-wireframe.md 6번): 이름/상태 + 초원 배경 안 스프라이트 + 일상 대사 말풍선.
// stage/mood/eggState 조합에 따라 분기 렌더하는 하나의 컴포넌트로 유지한다(잘게 쪼개지 않음,
// 10-plan.md FE-7). 좌우로 총총 걸어다니는 모션/통통 튀는 모션은 docs/mockups/
// pet-screen-mockup.html의 애니메이션을 그대로 이식했다(스타일은 12-style.md 픽셀 테마로 대체).
import { useEffect, useState } from 'react';
import {
  bodySpriteUrl,
  eggSpriteUrl,
  moodOverlayUrl,
  moodDialoguePool,
  eggDialoguePool,
  pickDialogue,
  HAPPY_WALK_FRAMES,
  TOMBSTONE_SPRITE_URL,
  TOMBSTONE_MESSAGE,
} from '../../utils/petSprite';

// 행복 mood는 정적 오버레이 대신 걷기 사이클 애니메이션으로 표현한다(2-pet-design-guide.md).
function useHappyWalkFrame(isHappy) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isHappy) return undefined;
    const id = setInterval(() => setFrame((f) => (f + 1) % HAPPY_WALK_FRAMES.length), 400);
    return () => clearInterval(id);
  }, [isHappy]);

  return frame;
}

const AMBIENT_SHOW_MS = 4000;
const AMBIENT_CYCLE_MS = 20000;

// 대사 목록에서 간간히 랜덤으로 하나를 골라 5초간 보여주고 끈다(1-domain-definition.md
// "일상 대사"). reaction(행동 반응)이 떠 있는 동안은 겹치지 않도록 잠시 멈춘다.
function useAmbientLine(pool, paused) {
  const [line, setLine] = useState(null);

  useEffect(() => {
    if (paused) {
      setLine(null);
      return undefined;
    }
    let hideTimer;
    function speak() {
      setLine(pickDialogue(pool));
      hideTimer = setTimeout(() => setLine(null), AMBIENT_SHOW_MS);
    }
    speak();
    const intervalId = setInterval(speak, AMBIENT_CYCLE_MS);
    return () => {
      clearInterval(intervalId);
      clearTimeout(hideTimer);
    };
  }, [pool, paused]);

  return line;
}

function Bubble({ text }) {
  if (!text) return null;
  return <p className="pet-bubble">{text}</p>;
}

function PetView({ pet, reaction }) {
  const isHappy = pet.stage !== '알' && pet.stage !== '묘비' && pet.mood === '행복';
  const walkFrame = useHappyWalkFrame(isHappy);
  const isSpotlight = !!reaction?.spotlight;

  const eggPool = eggDialoguePool(pet.egg_state);
  const moodPool = moodDialoguePool(pet.mood, pet.stage);
  const ambientEgg = useAmbientLine(eggPool, pet.stage !== '알' || !!reaction);
  const ambientMood = useAmbientLine(moodPool, pet.stage === '알' || pet.stage === '묘비' || !!reaction);

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
    // 대사는 이모지/의성어 수준만(알은 "펫이 말한다"기보다 옹알이 느낌 - 사용자 확인).
    const bubbleText = reaction ? reaction.emoji : ambientEgg;
    return (
      <div>
        <p>이름: {pet.name}</p>
        <p>상태: {pet.egg_state}</p>
        <div className="pet-scene">
          {/* 다리가 없어 좌우로 돌아다니지 못하고 제자리에서 흔들리는 idle 모션만 가진다.
              말풍선을 펫과 같이 묶어서 펫이 말하는 것처럼 보이게 한다(길면 줄바꿈). */}
          <div className="pet-egg-idle">
            <Bubble text={bubbleText} />
            <img
              src={eggSpriteUrl(pet.egg_state)}
              alt={`알 (${pet.egg_state})`}
              width={96}
              height={96}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 새끼/성체 공통: 베이스 스프라이트 + mood 오버레이(행복이면 걷기 프레임으로 대체) 합성.
  const bodyUrl = isHappy ? HAPPY_WALK_FRAMES[walkFrame] : bodySpriteUrl(pet.stage, pet.ear_type);
  const overlayUrl = isHappy ? null : moodOverlayUrl(pet.mood);
  const bubbleText = reaction ? `${reaction.emoji} ${reaction.text}` : ambientMood;

  return (
    <div>
      <p>이름: {pet.name}</p>
      <p>상태: {pet.mood}</p>
      <div className={`pet-scene${isSpotlight ? ' pet-scene-spotlight' : ''}`}>
        {/* 말풍선은 펫 위치와 무관하게 씬 상단 가운데 고정(길어지면 줄바꿈) - 펫을 따라
            움직이게 했더니 문구가 길 때 씬 밖으로 삐져나가는 문제가 있어 분리했다.
            운세(spotlight)일 때는 펫도 가운데로 멈춰 세운다. */}
        <Bubble text={bubbleText} />
        <div className={`pet-wander${isSpotlight ? ' pet-wander-paused' : ''}`}>
          <div className="pet-hop">
            <div className="pet-bounce">
              <div style={{ position: 'relative', width: 96, height: 96 }}>
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
        </div>
      </div>
    </div>
  );
}

export default PetView;
