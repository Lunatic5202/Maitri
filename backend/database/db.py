# database/db.py
import aiosqlite
import time

DB_PATH = "maitri_audio.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                state TEXT,
                accuracy REAL,
                user_message TEXT,
                inference_time REAL,
                timestamp INTEGER
            )
        """)
        await db.commit()

async def insert_log(state, accuracy, user_message, inference_time):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO logs (state, accuracy, user_message, inference_time, timestamp) VALUES (?, ?, ?, ?, ?)",
            (state, accuracy, user_message, inference_time, int(time.time()))
        )
        await db.commit()

async def get_history(hours=48):
    cutoff = int(time.time()) - hours * 3600
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "SELECT id, state, accuracy, user_message, inference_time, timestamp FROM logs WHERE timestamp >= ? ORDER BY timestamp DESC",
            (cutoff,)
        )
        rows = await cur.fetchall()
    return rows
