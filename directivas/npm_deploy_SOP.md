# DIRECTIVA: DESPLIEGUE_LOCAL_NPM_SOP

**ID:** 2026-04-23-001
**Script Asociado:** `scripts/npm_deploy.py`
**Última Actualización:** 2026-04-23
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
*Resolver el error de ejecución de comandos npm en el entorno local.*
- **Objetivo Principal:** Asegurar que el entorno de desarrollo (Vite/React) se inicie correctamente con `npm run dev`.
- **Criterio de Éxito:** El servidor de desarrollo está corriendo y es accesible en localhost.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Archivos Fuente:**
  - `package.json`: Define las dependencias y scripts.
- **Herramientas Requeridas:**
  - `node`: v14+ (recomendado).
  - `npm`: Gestor de paquetes.

### Salidas (Outputs)
- **Artefactos Generados:**
  - `node_modules/`: Carpeta de dependencias instaladas.
- **Retorno de Consola:** URL del servidor local (ej: http://localhost:3000).

---

## 3. Flujo Lógico (Algoritmo)

1. **Validación de Entorno:** Comprobar si `npm` está instalado en el sistema.
2. **Verificación de Dependencias:** Revisar si existe la carpeta `node_modules`.
3. **Instalación:** Si falta `node_modules` o el comando falla, ejecutar `npm install`.
4. **Ejecución:** Intentar correr `npm run dev`.
5. **Captura de Errores:** Si `vite` no se reconoce, forzar una reinstalación limpia.

---

## 4. Herramientas y Librerías
- **Comandos:** `npm`, `npx`.
- **Framework:** Vite.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Error "Vite no se reconoce":** Ocurre cuando las dependencias no están instaladas o el binario no está en el PATH de la sesión actual.
- **Permisos:** En Windows, a veces se requieren permisos de administrador o cambiar la política de ejecución de scripts.

### Errores Comunes y Soluciones
- **EACCESS:** Ejecutar como administrador o revisar permisos de carpeta.
- **Port Conflict:** Si el puerto 3000 está ocupado, Vite suele elegir otro automáticamente, pero hay que informarlo.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 23/04 | "vite" no se reconoce | Faltan node_modules tras el clonado | Ejecutar `npm install` antes de `npm run dev` |

---

## 7. Ejemplos de Uso

```bash
# Ejecución vía script de control
python scripts/npm_deploy.py
```

---

## 8. Checklist de Pre-Ejecución
- [x] Node.js instalado.
- [x] `package.json` presente en la raíz.

---

## 10. Notas Adicionales
El usuario intentó ejecutar `npm run dev` directamente y falló porque `node_modules` no estaba presente (el repo fue clonado recientemente).
