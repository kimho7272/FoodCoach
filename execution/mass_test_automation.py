import requests
import json
import random
from datetime import datetime, timedelta
import time

SUPABASE_URL = "https://ahrmhfbiagjhrzohqsmf.supabase.co"
SUPABASE_KEY = "sb_publishable_azCVnn4OFdLd4vyyji55gA_l-f43-M1"
USER_ID = "37db4252-0c14-4469-a1a5-f26d6feed6ef"

# Pre-defined nutritional database for testing
FOOD_DATABASE = {
    "Avocado Toast": {"calories": 280, "protein": "8g", "fat": "22g", "carbs": "16g", "health_score": 9, "description": "High in healthy fats and fiber."},
    "Grilled Salmon": {"calories": 450, "protein": "34g", "fat": "28g", "carbs": "0g", "health_score": 10, "description": "Excellent source of omega-3 fatty acids."},
    "Quinoa Salad": {"calories": 320, "protein": "12g", "fat": "14g", "carbs": "45g", "health_score": 9, "description": "Packed with complete plant-protein."},
    "Chicken Pasta": {"calories": 650, "protein": "28g", "fat": "22g", "carbs": "85g", "health_score": 6, "description": "Energy-rich meal with balanced macros."},
    "Tofu Stir-fry": {"calories": 240, "protein": "18g", "fat": "12g", "carbs": "15g", "health_score": 9, "description": "Light, high-protein plant-based meal."},
    "Beef Steak": {"calories": 720, "protein": "52g", "fat": "48g", "carbs": "0g", "health_score": 7, "description": "Iron-rich, high-quality protein source."},
    "Greek Yogurt": {"calories": 150, "protein": "15g", "fat": "4g", "carbs": "12g", "health_score": 10, "description": "Probiotic-rich snack for gut health."},
    "Oatmeal": {"calories": 300, "protein": "10g", "fat": "6g", "carbs": "54g", "health_score": 9, "description": "Great slow-release energy source."},
    "Sushi Roll": {"calories": 380, "protein": "14g", "fat": "12g", "carbs": "58g", "health_score": 8, "description": "Balanced rice, fish, and veggies."},
    "Lentil Soup": {"calories": 220, "protein": "16g", "fat": "2g", "carbs": "36g", "health_score": 10, "description": "High fiber and plant-based protein."},
    "Caesar Salad": {"calories": 420, "protein": "22g", "fat": "32g", "carbs": "14g", "health_score": 5, "description": "Contains protein but high in fat (dressing)."},
    "Shrimp Scampi": {"calories": 510, "protein": "28g", "fat": "24g", "carbs": "48g", "health_score": 7, "description": "Flavorful seafood dish with pasta."},
    "Turkey Sandwich": {"calories": 400, "protein": "24g", "fat": "12g", "carbs": "48g", "health_score": 8, "description": "Lean protein with whole grains."},
    "Pizza Slice": {"calories": 285, "protein": "12g", "fat": "10g", "carbs": "36g", "health_score": 4, "description": "Comfort food, high in simple carbs."},
    "Falafel Wrap": {"calories": 550, "protein": "18g", "fat": "24g", "carbs": "68g", "health_score": 7, "description": "Satisfying vegetarian wrap."},
    "Scrambled Eggs": {"calories": 210, "protein": "14g", "fat": "16g", "carbs": "2g", "health_score": 8, "description": "Quick, high-quality protein breakfast."},
    "Smoothie": {"calories": 250, "protein": "5g", "fat": "2g", "carbs": "54g", "health_score": 9, "description": "Vitamin-packed liquid energy."},
    "Burrito Bowl": {"calories": 780, "protein": "42g", "fat": "34g", "carbs": "82g", "health_score": 7, "description": "Hearty meal with diverse ingredients."},
    "Miso Soup": {"calories": 80, "protein": "6g", "fat": "3g", "carbs": "10g", "health_score": 9, "description": "Low calorie, fermented soybean soup."},
    "Hummus & Pita": {"calories": 350, "protein": "12g", "fat": "18g", "carbs": "42g", "health_score": 8, "description": "Classic Middle Eastern snack."},
    "Roasted Veggies": {"calories": 180, "protein": "6g", "fat": "12g", "carbs": "18g", "health_score": 10, "description": "Essential micronutrients and fiber."},
    "Pancakes": {"calories": 520, "protein": "12g", "fat": "18g", "carbs": "78g", "health_score": 4, "description": "Indulgent breakfast, high in sugar."},
    "Chicken Wings": {"calories": 840, "protein": "48g", "fat": "62g", "carbs": "8g", "health_score": 3, "description": "High in protein but very oily."},
    "Poke Bowl": {"calories": 480, "protein": "26g", "fat": "18g", "carbs": "54g", "health_score": 9, "description": "Fresh and nutritionally balanced bowl."},
    "Carbonara": {"calories": 720, "protein": "24g", "fat": "36g", "carbs": "74g", "health_score": 5, "description": "Rich and delicious cream-based pasta."},
    "Fried Rice": {"calories": 450, "protein": "10g", "fat": "15g", "carbs": "68g", "health_score": 5, "description": "Quick meal, can be high in sodium."},
    "Hamburger": {"calories": 550, "protein": "28g", "fat": "32g", "carbs": "38g", "health_score": 5, "description": "Classic meal, best eaten in moderation."},
    "Tomato Soup": {"calories": 150, "protein": "4g", "fat": "5g", "carbs": "22g", "health_score": 8, "description": "Antioxidant-rich, soul-warming soup."},
    "Bagel & Cream Cheese": {"calories": 410, "protein": "12g", "fat": "18g", "carbs": "52g", "health_score": 6, "description": "Dense carbs with dairy fat."},
    "Chicken Pho": {"calories": 380, "protein": "24g", "fat": "8g", "carbs": "54g", "health_score": 9, "description": "Lean, aromatic and hydrating meal."},
    "Dim Sum": {"calories": 320, "protein": "15g", "fat": "18g", "carbs": "28g", "health_score": 6, "description": "Bite-sized flavorful dumplings."},
    "Tacos (Beef)": {"calories": 480, "protein": "24g", "fat": "26g", "carbs": "42g", "health_score": 6, "description": "Satisfying protein with corn shells."},
    "Cobb Salad": {"calories": 560, "protein": "36g", "fat": "44g", "carbs": "12g", "health_score": 7, "description": "High protein, but watch the dressing."},
    "Fish and Chips": {"calories": 950, "protein": "42g", "fat": "54g", "carbs": "78g", "health_score": 3, "description": "Deep-fried, best for occasional treats."},
    "Lasagna": {"calories": 680, "protein": "34g", "fat": "38g", "carbs": "52g", "health_score": 6, "description": "Complex, comforting layered meal."},
    "Pad Thai": {"calories": 750, "protein": "22g", "fat": "28g", "carbs": "104g", "health_score": 5, "description": "Flavorful, very high carb count."},
    "Shepherd's Pie": {"calories": 520, "protein": "26g", "fat": "32g", "carbs": "34g", "health_score": 7, "description": "Balanced meat and potato dish."},
    "Clam Chowder": {"calories": 450, "protein": "18g", "fat": "28g", "carbs": "34g", "health_score": 5, "description": "Creamy seafood soup, high in fat."},
    "Ramen": {"calories": 820, "protein": "32g", "fat": "44g", "carbs": "75g", "health_score": 4, "description": "High sodium, delicious savory broth."},
    "Chicken Curry": {"calories": 580, "protein": "34g", "fat": "26g", "carbs": "52g", "health_score": 8, "description": "Anti-inflammatory spices with protein."},
    "Ratatouille": {"calories": 160, "protein": "4g", "fat": "8g", "carbs": "20g", "health_score": 10, "description": "All-vegetable healthy stew."},
    "Grilled Cheese": {"calories": 420, "protein": "14g", "fat": "24g", "carbs": "38g", "health_score": 4, "description": "Simple comfort food, high in dairy fat."},
    "Eggs Benedict": {"calories": 710, "protein": "28g", "fat": "52g", "carbs": "34g", "health_score": 5, "description": "Rich brunch special with hollandaise."},
    "Bibimbap": {"calories": 540, "protein": "24g", "fat": "18g", "carbs": "72g", "health_score": 9, "description": "Traditional balanced Korean meal."},
    "Kimchi Jjigae": {"calories": 280, "protein": "18g", "fat": "14g", "carbs": "22g", "health_score": 9, "description": "Probiotic-rich and spicy stew."},
    "Gnocchi": {"calories": 410, "protein": "8g", "fat": "12g", "carbs": "68g", "health_score": 6, "description": "Soft potato pasta with herbs."},
    "BBQ Ribs": {"calories": 980, "protein": "54g", "fat": "68g", "carbs": "44g", "health_score": 3, "description": "High calorie, high protein, high sugar sauce."},
    "French Onion Soup": {"calories": 310, "protein": "12g", "fat": "18g", "carbs": "26g", "health_score": 6, "description": "Savory onion soup with cheese crust."},
    "Lobster Roll": {"calories": 480, "protein": "32g", "fat": "24g", "carbs": "34g", "health_score": 7, "description": "Luxury protein on a toasted bun."},
    "Chili Con Carne": {"calories": 420, "protein": "32g", "fat": "18g", "carbs": "34g", "health_score": 8, "description": "Great fiber and protein combination."}
}

def log_meal_to_supabase(food_name, data, created_at):
    url = f"{SUPABASE_URL}/rest/v1/food_logs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Random meal type based on creation hour
    hour = datetime.fromisoformat(created_at).hour
    if hour < 11: meal_type = "Breakfast"
    elif hour < 16: meal_type = "Lunch"
    elif hour < 21: meal_type = "Dinner"
    else: meal_type = "Snack"
        
    payload = {
        "user_id": USER_ID,
        "food_name": food_name,
        "calories": data["calories"],
        "protein": data["protein"],
        "fat": data["fat"],
        "carbs": data["carbs"],
        "meal_type": meal_type,
        "health_score": data["health_score"],
        "description": data["description"],
        "created_at": created_at
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code not in [200, 201]:
            print(f"Failed to log {food_name}: {response.text}")
        else:
            print(f"Logged {food_name} successfully at {created_at}.")
    except Exception as e:
        print(f"Network error logging {food_name}: {e}")

def run_test():
    now = datetime.now()
    print(f"Starting mass log for user {USER_ID}...")
    
    items = list(FOOD_DATABASE.items())
    for i in range(50):
        food_name, data = items[i % len(items)]
        
        # Spread over last 7 days
        days_ago = random.randint(0, 6)
        hour = random.randint(8, 22)
        log_time = (now - timedelta(days=days_ago)).replace(hour=hour, minute=random.randint(0, 59))
        
        log_meal_to_supabase(food_name, data, log_time.isoformat())
        
        # Small delay to prevent burst limit issues if any
        if (i+1) % 10 == 0:
            time.sleep(0.5)

    print("Finished mass log test.")

if __name__ == "__main__":
    run_test()
