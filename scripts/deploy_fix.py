import subprocess
import os

def run_command(command):
    print(f"Ejecutando: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True

def main():
    print("Iniciando despliegue de corrección de tipos de cambio...")
    
    # 1. Agregar archivos específicos
    files_to_add = [
        "directivas/mantenimiento_tipos_cambio_SOP.md",
        "scripts/update_bna_rates.py",
        "src/data/exchange_rates.json"
    ]
    
    if not run_command(["git", "add"] + files_to_add):
        return

    # 2. Commit
    commit_message = "fix: update BNA scraper regex for robustness and update SOP documentation"
    if not run_command(["git", "commit", "-m", commit_message]):
        # Si no hay cambios (aunque git status dijo que sí), continuamos
        pass

    # 3. Push a main
    if not run_command(["git", "push", "origin", "main"]):
        print("Fallo al subir los cambios a origin/main.")
        return

    print("\nDespliegue completado con éxito. Los cambios están en 'main'.")

if __name__ == "__main__":
    main()
