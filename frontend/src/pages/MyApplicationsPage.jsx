// 나의 신청 목록 화면(8-wireframe.md 5번): 신청한 프로모션 카드(제목/신청일/기간),
// 취소 버튼은 없고 안내 문구만 표시(도메인 정의서 - 신청 취소 미제공).
// "< 목록으로" 링크는 없다 - 상단 네비게이션의 "프로모션 목록" 탭과 중복이라 뺀다(사용자 확인).
import { useMyApplications } from '../hooks/useMyApplications';
import { foodEmoji } from '../utils/foodEmoji';

function MyApplicationsPage() {
  const { data: applications, isLoading, isError } = useMyApplications();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>나의 신청 목록을 불러오지 못했습니다.</p>;

  return (
    <div>
      <h2>나의 신청 목록</h2>
      {applications.length === 0 ? (
        <p>아직 신청한 프로모션이 없습니다.</p>
      ) : (
        applications.map((application) => (
          <div className="pixel-card" key={application.id}>
            <h3>
              {foodEmoji(application.special_food_id)} {application.title}
            </h3>
            <p>신청일: {application.applied_at.slice(0, 10)}</p>
            <p>
              기간: {application.start_date} ~ {application.end_date}
            </p>
            <p className="promo-card-note">※ 취소는 담당자에게 연락 주세요</p>
          </div>
        ))
      )}
    </div>
  );
}

export default MyApplicationsPage;
