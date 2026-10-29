import json, os, time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from server.db import get_conn, init_db
load_dotenv()
ROOT = Path(__file__).resolve().parent.parent
def now():
return datetime.now().isoformat(timespec="seconds")
def resolve(value):
if value is None:
return None
return value.replace("{{PASSWORD}}", os.getenv("DEMO_PASSWORD", ""))
def exec_step(page, step):
action = step["action"]
if action == "wait":
page.wait_for_timeout(int(step["value"]))
return None
loc = page.locator(step["target"]["selector"])
if action == "click":
loc.click(timeout=3000)
elif action == "type":
loc.fill(resolve(step["value"]), timeout=3000)
elif action == "select":
loc.select_option(step["value"], timeout=3000)
elif action == "extract":
return loc.inner_text(timeout=3000)
return None
def run_workflow(path, mode="plain"):
init_db()
wf = json.loads(Path(path).read_text(encoding="utf-8"))
conn = get_conn()
cur = conn.execute(
"INSERT INTO runs (workflow, mode, status, started_at) VALUES
(?,?,?,?)",
(wf["name"], mode, "running", now()))
conn.commit()
run_id = cur.lastrowid
out_dir = ROOT / "runs" / str(run_id)
out_dir.mkdir(parents=True, exist_ok=True)
status = "passed"
with sync_playwright() as p:
browser = p.chromium.launch(headless=False)
page = browser.new_page()
page.goto(wf["startUrl"])
for step in wf["steps"]:
t0 = time.time()
step_status, error = "ok", None
try:
exec_step(page, step)
except Exception as e:
step_status, error, status = "failed", str(e)[:500], "failed"
# blur password fields so they never appear in screenshots
page.add_style_tag(content="input[type=password]
{filter:blur(8px)}")
shot = out_dir / f"step-{step['id']}.png"
page.screenshot(path=str(shot))
conn.execute(
"INSERT INTO steps (run_id, step_no, action, target, status,
error, screenshot, duration_ms) VALUES (?,?,?,?,?,?,?,?)",
(run_id, step["id"], step["action"], step["target"]
["description"] if "target" in step else "",
step_status, error, str(shot), int((time.time() - t0) *
1000)))
conn.commit()
if step_status == "failed":
break
browser.close()
conn.execute("UPDATE runs SET status=?, finished_at=? WHERE id=?",
(status, now(), run_id))
conn.commit()
conn.close()
return run_id, status
