import subprocess
import os
import sys

def run_command(command, cwd="c:\\app_ingentia"):
    print(f"Executing: {' '.join(command)}")
    # Use shell=True for npm on Windows
    result = subprocess.run(command, capture_output=True, text=True, cwd=cwd, shell=True)
    if result.stdout:
        print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")
    return result.returncode == 0

def resolve_deploy():
    cwd = "c:\\app_ingentia"
    
    # 1. Install dependencies
    print("Installing dependencies (npm install)...")
    success = run_command(["npm", "install"], cwd=cwd)
    
    if not success:
        print("[ERROR] Failed to install dependencies.")
        return False

    print("[SUCCESS] Dependencies installed.")
    
    # 2. Try to run dev (briefly to verify)
    print("Environment is now ready. You can run 'npm run dev' now.")
    return True

if __name__ == "__main__":
    resolve_deploy()
