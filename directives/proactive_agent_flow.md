# SOP: Proactive Agent Interaction (OpenClaw)

## Goal
To reduce the user's manual entry burden by initiating conversations at key meal times and providing data-driven dietary prompts.

## Interaction Triggers
1. **Morning Prompt (08:00 - 08:30)**: "좋은 아침입니다! 오늘 아침 식사는 무엇인가요? 사진을 찍어주시면 바로 분석해 드릴게요."
2. **Lunch Prompt (12:00 - 13:00)**: "점심시간이네요! 어제 기록을 보니 섬유질이 조금 부족했어요. 오늘은 샐러드나 채소가 풍부한 메뉴 어떠신가요?"
3. **Evening Prompt (18:30 - 19:30)**: "오늘 하루도 수고하셨습니다. 저녁 식사를 기록하고 오늘의 영양 성적표를 확인해 보세요."

## Contextual Logic
- **If user is underweight**: Suggest high-protein, calorie-dense options.
- **If user is overweight**: Suggest low-carb, high-satiety options.
- **Missing Nutrients**: If the "Score Card" shows a gap in Vitamin C, suggest a fruit snack or specific convenience store juices.

## Feedback Loop
- If the user ignores the prompt 3 times, delay subsequent prompts by 30 minutes.
- If the user responds with "나중에", set a reminder for 1 hour later.
