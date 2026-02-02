# SOP: Vision AI Food Analysis

## Goal
Accurately identify food items and portion sizes from user-uploaded photos to minimize manual entry.

## Process
1. **Image Reception**: Accept photo from the `web` frontend or proactive chat.
2. **Vision Processing (Layer 3)**: Call `execution/vision_analyzer.py` which uses Gemini 1.5 Pro Vision.
3. **Data Mapping**:
    - Identify dominant ingredients (e.g., "Salmon", "Asparagus").
    - Estimate volume/weight (e.g., "150g", "1 cup").
    - Match with Nutritionix/USDA database.
4. **User Confirmation**: Present the identified items and estimated calories to the user for correction ("Snap & Correct").

## Edge Cases
- **Low Light/Blurry**: Ask the user for a textual description or a clearer photo.
- **Multiple Dishes**: Break down into individual items and show as a list.
- **Unknown Item**: Ask the user: "이 음식의 이름을 알려주시면 제가 학습해서 다음에 꼭 기억할게요!"
