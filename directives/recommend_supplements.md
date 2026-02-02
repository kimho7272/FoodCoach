# SOP: Supplement & Restaurant Recommendations

## Goal
Fill nutritional gaps by recommending specific menu items from nearby convenience stores or cafes.

## Input
- `current_score_card`: Missing nutrients (e.g., Protein -20g, Fiber -5g).
- `user_location`: Lat/Long coordinates.
- `user_preferences`: (e.g., "Vegetarian", "Cheap", "No Coffee").

## Algorithm
1. **Identify Gap**: Calculate what's missing from the daily target.
2. **Search Nearby**: Use Nutritionix/Google Places API to find nearby food outlets.
3. **Menu Filtering**: Match nearby menu items to the missing nutrients.
    - Example: Missing Protein -> Suggest "Chicken Breast Sandwich" from nearby Starbucks.
4. **Ranking**: Prioritize based on:
    - Distance (Closer is better).
    - Nutrient Density (Highest protein/lowest sugar).
    - User Adoption Rate (Previously liked items).

## Output
- List of 3 recommendations with:
    - Menu Name
    - Location Info (Map Link)
    - Why this? (e.g., "단백질 15g을 보충하기에 완벽한 선택입니다!")
