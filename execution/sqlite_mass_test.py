import sqlite3
import random
from datetime import datetime, timedelta
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../foodcoach.db')

# Pre-defined nutritional database for testing
FOOD_DATABASE = {
    "Avocado Toast": {"calories": 280, "protein": 8, "fat": 22, "carbs": 16, "health_score": 9, "description": "High in healthy fats and fiber."},
    "Grilled Salmon": {"calories": 450, "protein": 34, "fat": 28, "carbs": 0, "health_score": 10, "description": "Excellent source of omega-3 fatty acids."},
    "Quinoa Salad": {"calories": 320, "protein": 12, "fat": 14, "carbs": 45, "health_score": 9, "description": "Packed with complete plant-protein."},
    "Chicken Pasta": {"calories": 650, "protein": 28, "fat": 22, "carbs": 85, "health_score": 6, "description": "Energy-rich meal with balanced macros."},
    "Tofu Stir-fry": {"calories": 240, "protein": 18, "fat": 12, "carbs": 15, "health_score": 9, "description": "Light, high-protein plant-based meal."},
    "Beef Steak": {"calories": 720, "protein": 52, "fat": 48, "carbs": 0, "health_score": 7, "description": "Iron-rich, high-quality protein source."},
    "Greek Yogurt": {"calories": 150, "protein": 15, "fat": 4, "carbs": 12, "health_score": 10, "description": "Probiotic-rich snack for gut health."},
    "Oatmeal": {"calories": 300, "protein": 10, "fat": 6, "carbs": 54, "health_score": 9, "description": "Great slow-release energy source."},
    "Sushi Roll": {"calories": 380, "protein": 14, "fat": 12, "carbs": 58, "health_score": 8, "description": "Balanced rice, fish, and veggies."},
    "Lentil Soup": {"calories": 220, "protein": 16, "fat": 2, "carbs": 36, "health_score": 10, "description": "High fiber and plant-based protein."},
    "Caesar Salad": {"calories": 420, "protein": 22, "fat": 32, "carbs": 14, "health_score": 5, "description": "Contains protein but high in fat (dressing)."},
    "Shrimp Scampi": {"calories": 510, "protein": 28, "fat": 24, "carbs": 48, "health_score": 7, "description": "Flavorful seafood dish with pasta."},
    "Turkey Sandwich": {"calories": 400, "protein": 24, "fat": 12, "carbs": 48, "health_score": 8, "description": "Lean protein with whole grains."},
    "Pizza Slice": {"calories": 285, "protein": 12, "fat": 10, "carbs": 36, "health_score": 4, "description": "Comfort food, high in simple carbs."},
    "Falafel Wrap": {"calories": 550, "protein": 18, "fat": 24, "carbs": 68, "health_score": 7, "description": "Satisfying vegetarian wrap."},
    "Scrambled Eggs": {"calories": 210, "protein": 14, "fat": 16, "carbs": 2, "health_score": 8, "description": "Quick, high-quality protein breakfast."},
    "Smoothie": {"calories": 250, "protein": 5, "fat": 2, "carbs": 54, "health_score": 9, "description": "Vitamin-packed liquid energy."},
    "Burrito Bowl": {"calories": 780, "protein": 42, "fat": 34, "carbs": 82, "health_score": 7, "description": "Hearty meal with diverse ingredients."},
    "Miso Soup": {"calories": 80, "protein": 6, "fat": 3, "carbs": 10, "health_score": 9, "description": "Low calorie, fermented soybean soup."},
    "Hummus & Pita": {"calories": 350, "protein": 12, "fat": 18, "carbs": 42, "health_score": 8, "description": "Classic Middle Eastern snack."},
    "Roasted Veggies": {"calories": 180, "protein": 6, "fat": 12, "carbs": 18, "health_score": 10, "description": "Essential micronutrients and fiber."},
    "Pancakes": {"calories": 520, "protein": 12, "fat": 18, "carbs": 78, "health_score": 4, "description": "Indulgent breakfast, high in sugar."},
    "Chicken Wings": {"calories": 840, "protein": 48, "fat": 62, "carbs": 8, "health_score": 3, "description": "High in protein but very oily."},
    "Poke Bowl": {"calories": 480, "protein": 26, "fat": 18, "carbs": 54, "health_score": 9, "description": "Fresh and nutritionally balanced bowl."},
    "Carbonara": {"calories": 720, "protein": 24, "fat": 36, "carbs": 74, "health_score": 5, "description": "Rich and delicious cream-based pasta."},
    "Fried Rice": {"calories": 450, "protein": 10, "fat": 15, "carbs": 68, "health_score": 5, "description": "Quick meal, can be high in sodium."},
    "Hamburger": {"calories": 550, "protein": 28, "fat": 32, "carbs": 38, "health_score": 5, "description": "Classic meal, best eaten in moderation."},
    "Tomato Soup": {"calories": 150, "protein": 4, "fat": 5, "carbs": 22, "health_score": 8, "description": "Antioxidant-rich, soul-warming soup."},
    "Bagel & Cream Cheese": {"calories": 410, "protein": 12, "fat": 18, "carbs": 52, "health_score": 6, "description": "Dense carbs with dairy fat."},
    "Chicken Pho": {"calories": 380, "protein": 24, "fat": 8, "carbs": 54, "health_score": 9, "description": "Lean, aromatic and hydrating meal."},
    "Dim Sum": {"calories": 320, "protein": 15, "fat": 18, "carbs": 28, "health_score": 6, "description": "Bite-sized flavorful dumplings."},
    "Tacos (Beef)": {"calories": 480, "protein": 24, "fat": 26, "carbs": 42, "health_score": 6, "description": "Satisfying protein with corn shells."},
    "Cobb Salad": {"calories": 560, "protein": 36, "fat": 44, "carbs": 12, "health_score": 7, "description": "High protein, but watch the dressing."},
    "Fish and Chips": {"calories": 950, "protein": 42, "fat": 54, "carbs": 78, "health_score": 3, "description": "Deep-fried, best for occasional treats."},
    "Lasagna": {"calories": 680, "protein": 34, "fat": 38, "carbs": 52, "health_score": 6, "description": "Complex, comforting layered meal."},
    "Pad Thai": {"calories": 750, "protein": 22, "fat": 28, "carbs": 104, "health_score": 5, "description": "Flavorful, very high carb count."},
    "Shepherd's Pie": {"calories": 520, "protein": 26, "fat": 32, "carbs": 34, "health_score": 7, "description": "Balanced meat and potato dish."},
    "Clam Chowder": {"calories": 450, "protein": 18, "fat": 28, "carbs": 34, "health_score": 5, "description": "Creamy seafood soup, high in fat."},
    "Ramen": {"calories": 820, "protein": 32, "fat": 44, "carbs": 75, "health_score": 4, "description": "High sodium, delicious savory broth."},
    "Chicken Curry": {"calories": 580, "protein": 34, "fat": 26, "carbs": 52, "health_score": 8, "description": "Anti-inflammatory spices with protein."},
    "Ratatouille": {"calories": 160, "protein": 4, "fat": 8, "carbs": 20, "health_score": 10, "description": "All-vegetable healthy stew."},
    "Grilled Cheese": {"calories": 420, "protein": 14, "fat": 24, "carbs": 38, "health_score": 4, "description": "Simple comfort food, high in dairy fat."},
    "Eggs Benedict": {"calories": 710, "protein": 28, "fat": 52, "carbs": 34, "health_score": 5, "description": "Rich brunch special with hollandaise."},
    "Bibimbap": {"calories": 540, "protein": 24, "fat": 18, "carbs": 72, "health_score": 9, "description": "Traditional balanced Korean meal."},
    "Kimchi Jjigae": {"calories": 280, "protein": 18, "fat": 14, "carbs": 22, "health_score": 9, "description": "Probiotic-rich and spicy stew."},
    "Gnocchi": {"calories": 410, "protein": 8, "fat": 12, "carbs": 68, "health_score": 6, "description": "Soft potato pasta with herbs."},
    "BBQ Ribs": {"calories": 980, "protein": 54, "fat": 68, "carbs": 44, "health_score": 3, "description": "High calorie, high protein, high sugar sauce."},
    "French Onion Soup": {"calories": 310, "protein": 12, "fat": 18, "carbs": 26, "health_score": 6, "description": "Savory onion soup with cheese crust."},
    "Lobster Roll": {"calories": 480, "protein": 32, "fat": 24, "carbs": 34, "health_score": 7, "description": "Luxury protein on a toasted bun."},
    "Chili Con Carne": {"calories": 420, "protein": 32, "fat": 18, "carbs": 34, "health_score": 8, "description": "Great fiber and protein combination."}
}

def run_test():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Clear existing logs for a fresh test
        cursor.execute("DELETE FROM meal_diary")
        
        now = datetime.now()
        items = list(FOOD_DATABASE.items())
        
        for i in range(50):
            food_name, data = items[i % len(items)]
            
            # Spread over last 7 days
            days_ago = random.randint(0, 6)
            hour = random.randint(8, 22)
            log_time = (now - timedelta(days=days_ago)).replace(hour=hour, minute=random.randint(0, 59))
            
            cursor.execute('''
            INSERT INTO meal_diary (food_name, calories, protein, fat, carbs, timestamp, correction_log)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (food_name, data["calories"], data["protein"], data["fat"], data["carbs"], log_time.isoformat(), "Simulation Test"))
            
        conn.commit()
        conn.close()
        print("Successfully populated 50 meal logs into SQLite 'meal_diary'.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_test()
