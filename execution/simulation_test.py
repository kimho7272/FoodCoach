import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from execution.diary_db import init_db, DB_PATH
from execution.nutrition_api import NutritionEngine
import sqlite3

def run_simulation():
    print("🚀 Starting FoodCoach Virtual User Simulation...")
    
    # 1. Initialize
    if not os.path.exists(DB_PATH):
        init_db()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 2. Create Virtual Profile: 20s Male, Goal: Muscle Gain
    cursor.execute("INSERT INTO user_profile (age, height, weight, gender, goal) VALUES (25, 180, 75, 'Male', 'gain')")
    user_id = cursor.lastrowid
    print(f"👤 Created Profile A: 25yo Male, Goal: Muscle Gain (ID: {user_id})")
    
    # 3. Mock Meal Log: Lunch (Missing Protein)
    # Target for 25yo Male (Gain) might be ~150g protein/day
    cursor.execute("INSERT INTO meal_diary (food_name, calories, protein, fat, carbs) VALUES ('Pasta', 600, 15, 20, 90)")
    print("🍴 Logged Meal: Pasta (Protein: 15g - VERY LOW for goal)")
    
    # 4. Trigger Recommendation Logic
    engine = NutritionEngine()
    gaps = ["protein"] # Simplified for simulation
    recommendations = engine.find_nearby_recommendations(37.5665, 126.9780, gaps)
    
    print("💡 AI Recommendations for Protein Gap:")
    for rec in recommendations:
        print(f"   - {rec['name']} at {rec['place']} ({rec['distance']})")
        # Store for feedback loop test
        cursor.execute("INSERT INTO recommendations (suggested_item, place_name, status) VALUES (?, ?, 'pending')", 
                       (rec['name'], rec['place']))
    
    # 5. Simulate Feedback (User Rejects Protein Shake)
    rec_id = cursor.lastrowid
    cursor.execute("UPDATE recommendations SET status='rejected', rejection_reason='too expensive' WHERE id=?", (rec_id,))
    print(f"❌ User rejected {recommendations[-1]['name']} (Reason: too expensive)")
    
    conn.commit()
    conn.close()
    print("\n✅ Simulation Complete. Results stored in DB for logic adjustment testing.")

if __name__ == "__main__":
    run_simulation()
