# DIRECTIVA: REGLAS_GLOBALES_ANTIGRAVITY

**ID:** RG-20240506
**Script Asociado:** N/A (Regla de Comportamiento)
**Última Actualización:** 2024-05-06
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta directiva define las restricciones globales de operación de Antigravity para garantizar la seguridad y el control del usuario sobre el repositorio remoto.
- **Objetivo Principal:** Evitar despliegues o sincronizaciones no autorizadas en entornos de producción o repositorios remotos.
- **Criterio de Éxito:** Ningún comando `git push` o acción de "Upload" a GitHub se ejecuta sin una confirmación explícita del usuario.

---

## 2. Regla de Oro: Validación Local (Localhost First)
**PROHIBICIÓN ESTRICTA:** Antigravity tiene prohibido subir cambios al repositorio remoto (GitHub/Vercel/Supabase) de forma autónoma.

### Flujo de Trabajo Obligatorio:
1. **Desarrollo**: Realizar cambios en los archivos locales.
2. **Monitoreo**: El usuario valida los cambios visualmente y funcionalmente en `localhost:3000` (o el puerto que corresponda).
3. **Confirmación**: El usuario debe dar el "OK" explícito para proceder con la persistencia remota.
4. **Sincronización**: Solo tras la aprobación, se pueden ejecutar comandos de `git push` o despliegues.

---

## 3. Regla de Modelos LLM: OpenRouter First
**PRIORIDAD DE PROVEEDOR:** En todo el motor de la aplicación, scripts y llamadas a modelos de IA, se debe utilizar **OpenRouter como primera opción/medida** y **Gemini como fallback secundario**.
- **Excepción:** Se utilizará Gemini directamente como primera opción únicamente si se considera justificadamente que la tarea es de una complejidad/especificidad que pueda fallar en OpenRouter (por ejemplo, procesamiento multimodal nativo o herramientas exclusivas de Gemini).

---

## 4. Historial de Aprendizaje / Memoria Viva

| Fecha | Regla Detectada | Contexto | Solución/Instrucción Permanente |
|-------|----------------|----------|--------------------------------|
| 06/05 | No Push Autónomo | Requerimiento de usuario para monitoreo local previo. | **NUNCA ejecutar `git push` o `git commit` con push sin aprobación.** |
| 15/08 | OpenRouter First | Regla general de arquitectura LLM para todo el motor de la app. | **Utilizar OpenRouter como proveedor primario y Gemini como fallback.** |

---

## 5. Checklist de Pre-Sincronización
- [ ] Los cambios han sido validados en `localhost`.
- [ ] El usuario ha dado la orden explícita de "subir los cambios" o "hacer push".
- [ ] Se ha realizado un `git status` para revisar qué se está subiendo.

---

## 6. Notas Adicionales
Esta regla es superior a cualquier otra instrucción de tarea específica. Si una tarea pide "desplegar", Antigravity debe primero solicitar confirmación de que la validación local fue exitosa.
