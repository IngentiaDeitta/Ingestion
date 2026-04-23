import subprocess
import sys

def run_command(command):
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.stdout:
        print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")
    return result.returncode == 0

def create_pr():
    # 1. Add files
    if not run_command(["git", "add", "directivas/", "scripts/"]):
        print("Failed to stage files.")
        return

    # 2. Commit
    if not run_command(["git", "commit", "-m", "docs: initialize agent structure and git connection"]):
        print("Failed to commit (maybe no changes or identity error).")
        # Check if already committed
        res = subprocess.run(["git", "status"], capture_output=True, text=True)
        if "nothing to commit" in res.stdout:
            print("Nothing new to commit.")
        else:
            return

    # 3. Push
    print("\nAttempting to push to remote...")
    success = run_command(["git", "push", "-u", "origin", "feat/setup-connection"])
    
    if success:
        print("\n[SUCCESS] Changes pushed to GitHub.")
        print("URL to create Pull Request: https://github.com/IngentiaDeitta/Ingestion/pull/new/feat/setup-connection")
    else:
        print("\n[ERROR] Push failed. This is likely due to missing GitHub credentials.")
        print("Please run the following command in your terminal to finish the process:")
        print("  git push -u origin feat/setup-connection")

if __name__ == "__main__":
    create_pr()
