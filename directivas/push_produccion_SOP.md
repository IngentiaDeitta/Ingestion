# DIRECTIVA: PUSH_PRODUCCION_SOP

**ID:** 2026-08-09-001
**Script Asociado:** `scripts/push_produccion.py`
**Última Actualización:** 2026-08-09
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Hacer push de los últimos cambios de la rama local `main` a la rama remota `origin/main` en producción.
- **Criterio de Éxito:** La rama local `main` se sincroniza con `origin/main` y `git push origin main` se ejecuta sin errores.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Rama Git local:** `main`
- **Remoto:** `origin/main` (GitHub repository `IngentiaDeitta/Ingestion`)

### Salidas (Outputs)
- **Consola:** Logs del proceso de sincronización (fetch, rebase/pull, push).
- **GitHub / Producción:** Commits locales publicados en la rama `main` remota.

---

## 3. Flujo Lógico (Algoritmo)

1. **Verificación de Estado Local:** Ejecutar `git status` para comprobar si hay cambios pendientes o no comiteados.
2. **Sincronización Remota:** Ejecutar `git fetch origin` para actualizar las referencias del repositorio remoto.
3. **Integración de Cambios Remotos:** Ejecutar `git pull --rebase origin main` para aplicar los commits locales sobre los commits remotos más recientes (por ejemplo, actualizaciones automáticas de tipos de cambio).
4. **Push a Producción:** Ejecutar `git push origin main` para publicar todos los cambios locales en el repositorio remoto de producción.
5. **Verificación Final:** Confirmar que `git status` indique que la rama local está al día con `origin/main`.

---

## 4. Herramientas y Librerías
- **Python:** `subprocess`, `sys`.
- **CLI:** `git`.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Conflictos de Rebase:** Si la rama remota contiene commits modificando los mismos archivos que la rama local (ej. `exchange_rates.json`), se debe resolver el conflicto durante el rebase.
- **Autenticación:** Git debe tener credenciales/tokens válidos configurados.

### Errores Comunes y Soluciones
- **Divergencia de ramas:** Si `main` y `origin/main` divergieron, usar `git pull --rebase origin main` evita merges innecesarios y mantiene un historial limpio.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 09/08 | Push rejected (non-fast-forward) | `origin/main` recibió commits de bots (`skip ci`) mientras `main` local tenía commits propios | Ejecutar `git pull --rebase origin main` antes de `git push origin main` |
| 09/08 | Subprocess hang en Python | `subprocess.run` sin timeout se bloqueaba esperando stdin en Git CLI no interactivo | Especificar `timeout=30` en llamadas a `subprocess.run` para evitar bloqueos infinitos |

---

## 7. Ejemplos de Uso

```bash
python scripts/push_produccion.py
```

---

## 8. Checklist de Pre-Ejecución
- [x] Repositorio Git inicializado y vinculado a `origin`.
- [x] Rama actual es `main`.

---

## 9. Checklist Post-Ejecución
- [ ] Push a `origin/main` completado con éxito.
- [ ] Working tree limpio.
