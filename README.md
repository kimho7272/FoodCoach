# 🥗 FoodCoach: The Proactive Diet Agent

**FoodCoach**는 기존 식단 관리 앱들의 번거로움과 한계를 극복하기 위해 설계된 **AI 기반 능동형 영양 관리 에이전트**입니다. 사용자가 수동으로 기록하기를 기다리는 대신, AI가 먼저 다가와 식단을 제안하고 상황에 맞는 영양 분석을 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 멀티모달 Vision AI 기반 식단 인식
- **간편한 기록**: 복잡한 검색이나 수동 입력 없이, 음식 사진 한 장으로 메뉴와 재료를 자동 인식합니다.
- **정확한 분석**: Nutritionix 및 USDA 정규 데이터셋을 활용하여 신뢰도 높은 영양 정보를 제공합니다.

### 2. OpenClaw 기반 능동형 에이전트 (Proactive Agent)
- **선제적 가이드**: 정해진 식사 시간(아침, 점심, 저녁)에 에이전트가 먼저 메시지를 보내 식사 여부를 확인하고 가이드를 제공합니다.
- **맥락 인지형 대화**: 단순히 식사 기록을 묻는 것을 넘어, 과거 데이터를 바탕으로 "어제 단백질이 부족했으니 점심에는 닭가슴살 샐러드를 드셔보세요!"와 같은 맞춤형 제안을 합니다.

### 3. 실시간 위치 기반 추천 & 영양 성적표
- **영양 점수화**: 사용자의 신체 정보(BMR) 대비 실시간 섭취량을 분석하여 오늘의 영양 점수를 계산합니다.
- **주변 메뉴 추천**: 부족한 영양소를 채울 수 있는 주변 식당이나 편의점 메뉴를 실시간 위치 기반으로 추천합니다.

### 4. 자가 진화형 추천 엔진
- **피드백 루프**: 사용자의 추천 채택률을 분석하여 선호도를 학습합니다.
- **지속적 고도화**: 거절 이유를 수집하여 시간이 지날수록 사용자에게 정교한 추천을 제공합니다.

---

## 🛠 기술 스택 (Tech Stack)

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Python (FastAPI/Flask API 연동용), Next.js API Routes
- **AI/ML**: Google Gemini (Vision & LLM), OpenClaw (Agent Framework)
- **Database**: SQLite (foodcoach.db)
- **Deployment**: Localhost (Development), GitHub Repository

---

## 📂 프로젝트 구조 (Project Structure)

- `/web`: Next.js 기반 웹 애플리케이션 프론트엔드 및 API
- `/execution`: 비전 분석, 영양 API 연동, 시뮬레이션 테스트 스크립트 (Python)
- `/directives`: 에이전트 행동 지침 및 시나리오 정의
- `foodcoach.db`: 사용자 데이터 및 식단 기록 저장소

---

## 🚦 시작하기 (Getting Started)

### 1. 환경 설정
`web` 디렉토리 내에 `.env.local` 파일을 생성하고 필요한 API Key(Gemini, NextAuth 등)를 설정합니다.

### 2. 웹 앱 실행
```bash
cd web
npm install
npm run dev
```

### 3. 에이전트 실행 (Python 기반 백엔드)
```bash
# 관련 라이브러리 설치 후 실행
python execution/vision_analyzer.py
```

---

## 📈 앞으로의 로드맵
- [ ] 실시간 위치 API (Google Maps 등) 고도화
- [ ] 사용자 프로필 기반 시뮬레이션 모드 강화
- [ ] 모바일 최적화 및 푸시 알림 연동

---

**FoodCoach**와 함께 더 건강하고 스마트한 식습관을 시작해보세요! 🍎
