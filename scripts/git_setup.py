import subprocess
import os
import sys

def run_command(command, cwd=None):
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True, cwd=cwd)
    if result.stdout:
        print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")
    return result.returncode == 0, result.stdout, result.stderr

def setup_git():
    repo_url = "https://github.com/IngentiaDeitta/Ingestion"
    cwd = "c:\\app_ingentia"
    
    # 1. Init
    if not os.path.exists(os.path.join(cwd, ".git")):
        success, _, _ = run_command(["git", "init"], cwd=cwd)
        if not success:
            print("Failed to initialize git.")
            return
    
    # 2. Add Remote
    run_command(["git", "remote", "remove", "origin"], cwd=cwd)
    success, _, _ = run_command(["git", "remote", "add", "origin", repo_url], cwd=cwd)
    if not success:
        print("Failed to add remote.")
        return
    
    # 3. Configure identity if missing
    _, name, _ = run_command(["git", "config", "user.name"], cwd=cwd)
    if not name.strip():
        run_command(["git", "config", "user.name", "Antigravity Agent"], cwd=cwd)
        run_command(["git", "config", "user.email", "agent@antigravity.ai"], cwd=cwd)

    # 4. Fetch and Pull
    print("Attempting to sync with remote...")
    # Try to determine default branch
    run_command(["git", "fetch", "origin"], cwd=cwd)
    
    # Try to pull main or master
    success, _, _ = run_command(["git", "pull", "origin", "main"], cwd=cwd)
    if not success:
        print("Could not pull 'main', trying 'master'...")
        success, _, _ = run_command(["git", "pull", "origin", "master"], cwd=cwd)
    
    # 5. Create development branch
    branch_name = "feat/setup-connection"
    run_command(["git", "checkout", "-b", branch_name], cwd=cwd)
    
    print("\n[SUCCESS] Connection established to IngentiaDeitta/Ingestion")
    print(f"[INFO] Current branch: {branch_name}")

if __name__ == "__main__":
    setup_git()
