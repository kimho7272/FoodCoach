# Build Specification: FoodCoach v1.0 (The Proactive Diet Agent)

## 1단계: 경쟁사 약점 파악 (Market Gap Analysis)

| 순위 | 페인 포인트 (Pain Points) | 구체적 내용 | FoodCoach의 해결 전략 |
| :--- | :--- | :--- | :--- |
| 1 | **수동 기록의 피로도** | 바코드 스캔 유료화, 검색 후 수동 입력 번거로움 | **멀티모달 Vision AI**: 사진 한 장으로 재료/음식 자동 인식 (무료) |
| 2 | **부적확한 DB 정보** | 유효성 검증 안 된 사용자 업로드 데이터 혼재 | **API 교차 검증**: Nutritionix + USDA 정규 데이터셋 우선 활용 |
| 3 | **UI의 경직성과 광고** | 과도한 광고와 직관적이지 않은 레이아웃(최근 Update 이슈) | **Vanilla CSS 기반 Clean UI**: 광고 배제, 대화형 카드 UI 도입 |
| 4 | **수동적 기능 (기록 전용)** | 사용자가 직접 앱을 켜야만 작동함 | **OpenClaw Proactive Agent**: 식사 시간 알림 및 선제적 질문 |
| 5 | **비싼 구독 모델** | 기본 기능(바코드, 매크로 설정)의 유료화 | **Free Base Architecture**: 핵심 인식 및 기록 기능을 무료로 제공 |

---

## 2단계: 자율적 기능 확장 (Feature Evolution)

### 2.1 능동적 에이전트 (Proactive Agent with OpenClaw)
- **Time-Triggered Interaction**: 아침(08:00), 점심(12:30), 저녁(19:00) 식사 시간에 맞춰 에이전트가 먼저 메시지 전송.
- **Contextual Inquiry**: 단순히 "뭐 먹었어?"가 아니라, "어제 저녁엔 단백질이 부족했네요! 오늘 점심은 닭가슴살 샐러드 어때요?" 식의 데이터 기반 제안.

### 2.2 실시간 위치 기반 '영양 성적표' & 추천
- **Daily Score Card**: 사용자의 나이/키/몸무게 기반 기초대사량(BMR) 대비 실시간 섭취량 분석.
- **Location-Based Supplementation**: 
  - 부족 영양소 식별 -> 주변 카페/편의점 검색 -> 최적 메뉴 추천 (예: "근처 CU에 단백질 음료 '더단백' 2+1 행사 중이에요!").

---

## 3단계: 자가 테스트 및 업그레이드 (CI/CD)

### 3.1 가상 사용자 프로필 시뮬레이션
- **Profile A**: 20대 남성, 벌크업 목적 (고단백 선호)
- **Profile B**: 30대 여성, 체중 감량 목적 (저칼로리, 식이섬유 선호)
- **Sim Mode**: 가상 데이터를 입력하여 추천 로직의 적절성을 자체 검증.

### 3.2 핵심 지표 (KPI): 추천 채택률 (Adoption Rate)
- 사용자가 추천 메뉴를 클릭하거나 "좋아요"를 누르면 가점.
- 기각 시 거절 이유(비쌈, 맛없음, 멀음)를 수집하여 알고리즘 가중치 자동 조정.

---

## 개발 로드맵 (Immediate Action)

1. [x] **Directives 업데이트**: `proactive_agent_flow.md` 추가
2. [x] **Execution 스크립트 고도화**: `recommendation_engine.py` (Location API 연동)
3. [x] **DB 스케마 구축**: 사용자 정보 및 '추천 피드백' 테이블 설계
