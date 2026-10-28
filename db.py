import sqlite3
from pathlib import Path
DB_PATH = Path(__file__).resolve().parent.parent / "omnisight.db"
SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
workflow TEXT, mode TEXT, status TEXT,
started_at TEXT, finished_at TEXT, cost_usd REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS steps (
id INTEGER PRIMARY KEY AUTOINCREMENT,
run_id INTEGER, step_no INTEGER, action TEXT, target TEXT,
status TEXT, error TEXT, screenshot TEXT, duration_ms INTEGER
);
CREATE TABLE IF NOT EXISTS heals (
id INTEGER PRIMARY KEY AUTOINCREMENT,
run_id INTEGER, step_no INTEGER, strategy TEXT,
old_locator TEXT, new_locator TEXT, confidence REAL,
needs_review INTEGER DEFAULT 0, duration_ms INTEGER
);
"""
def get_conn():
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
return conn
def init_db():
conn = get_conn()
conn.executescript(SCHEMA)
conn.commit()
conn.close()
