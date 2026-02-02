import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../foodcoach.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # User Profile Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        age INTEGER,
        height FLOAT,
        weight FLOAT,
        gender TEXT,
        goal TEXT, -- 'lose', 'gain', 'maintain'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Meal Diary Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS meal_diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        food_name TEXT,
        calories FLOAT,
        protein FLOAT,
        fat FLOAT,
        carbs FLOAT,
        image_url TEXT,
        correction_log TEXT -- 'user changed 200kcal to 250kcal'
    )
    ''')
    
    # Recommendation Feedback (Self-Evolution KPI)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        suggested_item TEXT,
        place_name TEXT,
        status TEXT, -- 'accepted', 'rejected', 'ignored'
        rejection_reason TEXT,
        adoption_rate_impact FLOAT DEFAULT 0.0
    )
    ''')
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
