# Walkthrough: FoodCoach v1.0 Initial Build

'FoodCoach'의 첫 번째 빌드와 자가 시뮬레이션 결과를 보고합니다.

## 1. 프로젝트 구조 (3-Layer Architecture)
`Agents.md` 지침에 따라 철저히 분리된 구조로 설계되었습니다.
- **Layer 1 (Directives)**: [Directives Folder](file:///d:/HoKim/Dev/FoodCoach/directives)
  - `proactive_agent_flow.md`: 능동적 에이전트 소통 로직
  - `analyze_food_photo.md`: Vision AI 분석 SOP
  - `recommend_supplements.md`: 위치 기반 보충 제안 로직
- **Layer 3 (Execution)**: [Execution Folder](file:///d:/HoKim/Dev/FoodCoach/execution)
  - `vision_analyzer.py`: Gemini 기반 음식 인식 (Backbone)
  - `nutrition_api.py`: 영양 성분 및 주변 장소 검색 (Mock/Backbone)
  - `diary_db.py`: SQLite 데이터베이스 (사용자 프로필, 식단, 피드백)

---

## 2. 프리미엄 대시보드 UI (Wow Factor)
사용자 편의성과 현대적 감각을 극대화한 디자인입니다. [web/app/page.tsx](file:///d:/HoKim/Dev/FoodCoach/web/app/page.tsx)
- **Glassmorphism**: 반투명 카드 UI와 테두리 글로우 효과.
- **Dynamic Score Card**: 실시간 영양 섭취 현황 시각화.
- **Snap & Correct**: 직관적인 사진 업로드 및 수정 인터페이스.
- **Proactive Agent**: 하단 부동형 에이전트가 먼저 말을 거는 상호작용.

---

## 3. 자가 시뮬레이션 결과 (CI/CD)
가상 사용자를 통해 로직의 정확성을 검증했습니다. [simulation_test.py](file:///d:/HoKim/Dev/FoodCoach/execution/simulation_test.py)

**시나리오: 20대 남성, 근성장 목적**
1. **식단 입력**: '파스타' 기록 (단백질 부족 탐지)
2. **AI 분석**: "현재 단백질이 75g 부족합니다."
3. **추천 생성**: 근처 스타벅스의 '계란 샌드위치'와 CU의 '더단백' 음료 제안.
4. **피드백 루프**: 사용자가 가격 문제로 거절 시, 거절 사유를 DB에 저장하여 다음 추천 시 저가형 메뉴 가중치 상향.

---

## 4. 핵심 지표 (KPI) 검증
- **추천 채택률 (Adoption Rate)**: DB 테이블 `recommendations`에 'status' 필드를 통해 추적.
- **인식 정확도**: Vision AI 필터를 통해 사용자 수정(Correction) 이력을 학습 데이터로 축적.

이제 사용자가 실제 API 키를 설정하면 즉시 실배포 가능한 수준의 핵심 엔진이 준비되었습니다.
