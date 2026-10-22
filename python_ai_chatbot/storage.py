
import json
from pathlib import Path
from datetime import datetime
from uuid import uuid4

DATA_DIR = Path(__file__).parent / "data"
HISTORY_FILE = DATA_DIR / "chats.json"


def load_chats():
    DATA_DIR.mkdir(exist_ok=True)

    if not HISTORY_FILE.exists():
        return {}

    try:
        return json.loads(
            HISTORY_FILE.read_text(encoding="utf-8")
        )
    except (json.JSONDecodeError, OSError):
        return {}


def save_chats(chats):
    DATA_DIR.mkdir(exist_ok=True)

    temp_file = HISTORY_FILE.with_suffix(".tmp")
    temp_file.write_text(
        json.dumps(chats, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_file.replace(HISTORY_FILE)


def create_chat(chats):
    chat_id = str(uuid4())

    chats[chat_id] = {
        "title": "New Chat",
        "created_at": datetime.now().isoformat(
            timespec="seconds"
        ),
        "messages": [],
    }

    save_chats(chats)
    return chat_id


def delete_chat(chats, chat_id):
    chats.pop(chat_id, None)
    save_chats(chats)
