import sqlite3
try:
    conn = sqlite3.connect('foodcoach.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(f"Tables: {cursor.fetchall()}")
    
    cursor.execute("PRAGMA table_info(meal_diary);")
    print(f"meal_diary columns: {cursor.fetchall()}")
except Exception as e:
    print(f"Error: {e}")
