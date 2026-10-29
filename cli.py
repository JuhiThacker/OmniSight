import sys
from engine.runner import run_workflow
if __name__ == "__main__":
path = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else "plain"
print(run_workflow(path, mode))
