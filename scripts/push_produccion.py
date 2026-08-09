import subprocess
import sys

def run_cmd(cmd):
    print(f"Ejecutando: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"Error ({result.returncode}):\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}")
            return False, result.stdout, result.stderr
        print(result.stdout)
        return True, result.stdout, result.stderr
    except subprocess.TimeoutExpired as e:
        print(f"Timeout al ejecutar {' '.join(cmd)}: {e}")
        return False, "", str(e)

def main():
    print("=== Iniciando proceso de push a producción (origin/main) ===")
    
    # 0. Add all modified/new files and commit
    run_cmd(["git", "add", "."])
    run_cmd(["git", "commit", "-m", "style: homogenize typography scale and UI padding across all sections"])

    # 1. Fetch
    success, _, _ = run_cmd(["git", "fetch", "origin"])
    if not success:
        print("Fallo al hacer git fetch.")
        sys.exit(1)
        
    # 2. Pull --rebase para integrar commits remotos si los hay
    success, stdout, stderr = run_cmd(["git", "pull", "--rebase", "origin", "main"])
    if not success:
        print("Fallo al ejecutar git pull --rebase origin main.")
        sys.exit(1)
        
    # 3. Push a origin main
    success, stdout, stderr = run_cmd(["git", "push", "origin", "main"])
    if not success:
        print("Fallo al ejecutar git push origin main.")
        sys.exit(1)
        
    print("\n¡Push a producción completado exitosamente!")

if __name__ == "__main__":
    main()
