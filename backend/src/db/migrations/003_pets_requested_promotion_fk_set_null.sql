-- pets.requested_promotion_id는 "그날 특식 요청 대상"을 가리키는 참조일 뿐, 프로모션이 사라지면
-- 그 요청 자체가 의미 없어지므로 SET NULL이 맞다(운영에서는 프로모션 삭제 API가 없어 실사용 영향은
-- 없지만, 테스트에서 병렬로 실행되는 다른 테스트가 임의로 이 컬럼을 채워둔 상태로 프로모션을 지우려다
-- FK 위반이 나던 문제를 스키마 레벨에서 근본적으로 없앤다).
ALTER TABLE pets DROP CONSTRAINT pets_requested_promotion_id_fkey;
ALTER TABLE pets ADD CONSTRAINT pets_requested_promotion_id_fkey
  FOREIGN KEY (requested_promotion_id) REFERENCES promotions(id) ON DELETE SET NULL;
