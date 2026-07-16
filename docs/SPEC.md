# machilog — Product Spec & Decision Log

## 컨셉

QR을 찍으면 현재 위치 주변 사람들이 남긴 익명 지역 로그를 볼 수 있는 웹서비스.

- QR은 모든 장소에서 동일한 URL(`/here`)을 가리킨다. QR은 장소를 기억하지 않는다.
- 사용자 위치가 H3 cell(res 10, 약 100~150m)로 변환되어 지역 페이지(`/c/[cellId]`)가 열린다.
- 로그인/앱 설치/닉네임 없음. 80자 익명 한마디. 보존형(삭제형 아님).
- 리뷰앱이 아니다: **사람을 평가하지 말고, 장소의 분위기를 남긴다.**

## 핵심 원칙

1. 정확한 lat/lng는 저장하지 않는다. 글은 cell_id에만 귀속된다.
2. cell_id는 개인정보성이 낮아진 위치 정보로 취급한다. 화면에 정확한 좌표/핀 표시 금지.
3. 초기 매력은 단순해야 한다: "QR 찍었더니 이 근처의 익명 말들이 열린다."

## 확정 결정 (2026-07-08 설계 세션)

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 시장/언어 | 일본 우선, UI는 ja/en/ko/zh-Hans/zh-Hant 5로케일. Accept-Language 자동 감지 + 쿠키 스위처, URL 프리픽스 없음, 폴백 en | QR이 붙는 곳은 일본. 관광객(한중영) 커버 |
| UI | 모바일 전용 단일 컬럼 | QR 진입 = 99% 모바일 |
| H3 | res 10 고정 (~130m) | 100~150m 체감 목표에 부합 |
| 쓰기 검증 | 요청 cell이 실제 위치 cell의 gridDisk(k=1) 안이면 허용. accuracy > 200m 거부 | 실내 GPS 오차 50~500m, 엄격 비교 시 정당한 작성도 거부됨 |
| 읽기 범위 | 자기 셀만 (2026-07-17 변경: 셀 하나 = 방 하나, 이웃 보완 제거) | "방" 컨셉 명확화, 400m는 너무 넓다는 판단 |
| 노출 흐름 | 즉시 visible. 필터 걸리면 자동 pending, 신고 2건 자동 hidden, 일일 사후 검토 | 즉시성이 서비스 재미의 핵심 |
| IP | 암호화 원문 90일 보존 + hash 영구 | 일본 発信者情報開示請求/수사 조회 대응 수단 확보 |
| 본인 삭제 | device_hash 매칭으로 본인 글 soft delete 허용 | 삭제 요청 응대 노동 예방 |
| 서비스명 | "machilog"는 코드네임. 런칭 전 확정 | マチログ(電通 분석 서비스), 街ログ(지역 SNS), machi-log.net 충돌 확인. machilog.app은 미등록(2026-07 확인)이나 구매 보류 |
| 인프라 | Vercel Hobby + Neon Free. AdSense는 v0.2 투입 | 유저 결정. Hobby 상업이용 제한 리스크 인지 |
| 콜드 스타트 | 직접 소량 QR 스티커 배포. 가짜 시딩 없음. 빈 셀은 퍼스트라이터 UX | 신뢰가 자산 |

## 데이터 자산 설계 (실패해도 남는 것)

자체 `events` 테이블에 모든 퍼널 이벤트 저장. 원시 데이터 완전 소유.

```text
scan            /here 진입 (source = QR 스티커 코드 ?s=)
geo_granted     위치 허용 (meta.accuracy)
geo_denied      위치 거부           ← 최대 이탈 지점
geo_error       위치 취득 실패 (meta.code)
cell_view       셀 페이지 도달 (meta.visibleCount, neighborFill)
compose_opened  작성창 열기
post_created    작성 (meta.accuracy, length, status)
post_rejected   작성 거부 (meta.reason: cell_mismatch/low_accuracy/rate_limited/filter_blocked)
post_deleted    본인 삭제
report_created  신고 (meta.reason)
```

공통 컬럼: device_hash, source, ui_locale, device_language(Accept-Language 원문 1순위),
os/browser/device_type(UA 코스 파싱, 원문 미저장), country(Vercel 지오 헤더).

분석 가능: 퍼널 전환율, 스티커 배치별 성과, 브라우저별 권한 거부율(LINE 인앱 등),
GPS 품질 분포, 관광객 비율(device_language≠ja), 지역×언어 분포, 위치 수요 지도.

- 이벤트 영구 보존 (cell 단위라 프라이버시 리스크 낮음)
- 주 1회 DB dump 로컬 백업 (Neon Free 복구 한계 대비)

## 모더레이션

- 금칙어/패턴: block(전화번호, 이메일, URL, SNS ID) / pending(욕설, 특정인 지칭 표현)
- 신고 2건 → 자동 hidden. 민감 지역(cell.sensitive) → 작성 즉시 pending
- Rate limit: 기기 1시간 1회, IP 10분 3회, 신고 기기 10분 3회 + 동일 글 중복 신고 불가

## MVP 로드맵

- **v0.1 (완료)**: /here, 위치→셀, 셀 페이지, 작성/신고/본인삭제, 어드민 로그인+글 관리, 금칙어 필터, events 수집, 정적 페이지 5종
- **v0.2**: AdSense, 어드민 대시보드(퍼널 지표), 지역 잠금, 기기 차단 UI, 금칙어 관리 UI
- **v0.3**: 지역 이름(rough_name), SEO, 인기 지역/글, 공유 카드, 민감 지역 모드
- **하지 않는 것**: 앱, 회원가입, 댓글, 사진, DM, 팔로우, 지도 핀, 별점, 프로필

## 이름 확정 전 체크리스트 (런칭 전)

1. 일본어 상표/서비스명 충돌 재검색
2. 도메인 확보 (.app 등)
3. `src/config.ts`의 SERVICE_NAME + i18n 메시지 교체
4. /contact 연락처 기재 (개인 이메일, 회사 메일 금지)
