import subprocess

def run(cmd):
    print(f"Executing: {' '.join(cmd)}")
    subprocess.run(cmd, capture_output=False)

def main():
    # 1. Add and Commit
    run(["git", "add", "."])
    run(["git", "commit", "-m", "feat: implement currency consolidation in Dashboard and Finance and add BNA rate agent"])
    
    # 2. Checkout main and merge
    run(["git", "checkout", "main"])
    run(["git", "merge", "feat/setup-connection"])
    
    # 3. Push to origin main
    run(["git", "push", "origin", "main"])
    
    print("\nPush to production (main) completed.")

if __name__ == "__main__":
    main()
