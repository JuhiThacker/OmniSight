
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import webview

if getattr(sys, "frozen", False):
    # Executable is inside dist\NovaAI\
    APP_DIR = Path(sys.executable).resolve().parent.parent.parent
else:
    APP_DIR = Path(__file__).resolve().parent

APP_FILE = APP_DIR / "app.py"
APP_URL = "http://127.0.0.1:8502"

VENV_PYTHON = APP_DIR / ".venv" / "Scripts" / "python.exe"
PYTHON_EXE = str(VENV_PYTHON if VENV_PYTHON.exists() else sys.executable)

streamlit_process = None


def wait_for_streamlit(timeout=60):
    start = time.time()

    while time.time() - start < timeout:
        if streamlit_process.poll() is not None:
            raise RuntimeError(
                "Streamlit stopped unexpectedly. Check the terminal output."
            )

        try:
            with urllib.request.urlopen(
                APP_URL + "/_stcore/health", timeout=2
            ) as response:
                if response.status == 200:
                    return
        except Exception:
            pass

        time.sleep(1)

    raise TimeoutError(
        "Nova AI did not start within 60 seconds."
    )


def main():
    global streamlit_process

    if not APP_FILE.exists():
        raise FileNotFoundError(f"Missing app.py: {APP_FILE}")

    # Keep the project folder as the working directory so
    # storage.py and data/chats.json continue working.
    streamlit_process = subprocess.Popen(
    [
        PYTHON_EXE,
        "-m",
        "streamlit",
        "run",
        str(APP_FILE),
        "--server.address=127.0.0.1",
        "--server.port=8502",
        "--server.headless=true",
        "--browser.gatherUsageStats=false",
    ],
    cwd=str(APP_DIR),
)

    try:
        wait_for_streamlit()

        webview.create_window(
            "Nova AI",
            APP_URL,
            width=1200,
            height=800,
            min_size=(800, 600),
        )

        webview.start()
    finally:
        if streamlit_process and streamlit_process.poll() is None:
            streamlit_process.terminate()

            try:
                streamlit_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                streamlit_process.kill()


if __name__ == "__main__":
    main()
