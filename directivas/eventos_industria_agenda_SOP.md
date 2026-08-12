# DIRECTIVA: Agenda de Eventos Industriales & PyME en Dashboard (SOP)

**ID:** 20260812_EVENTOS_INDUSTRIA_AGENDA
**Scripts Asociados:** `scripts/seed_eventos_industria.py`
**Archivos Frontend:** `src/data/eventos_industria.json`, `src/pages/Dashboard.tsx`
**Última Actualización:** 2026-08-12
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Incorporar un calendario dinámico de eventos, congresos, exposiciones y foros de la industria nacional y PyMEs a la Agenda del Dashboard de IngentIA.
- **Criterio de Éxito:** Los eventos locales referidos a industria, metalmecánica, alimentos, logística, tecnología y PyMEs se despliegan en el calendario con marcas visuales distintivas, detalles de sede, temas principales y la posibilidad de agendar recordatorios directos en el Kanban del equipo.

---

## 2. Catálogo de Eventos Locales (Industria & PyMEs Argentina)

Los eventos se categorizan según:
- `EXPOSICION`: Ferias comerciales e industriales (FIMAQH, Expo Logísti-k, Tecno Fidta).
- `CONGRESO`: Encuentros anuales de dirigentes e industriales (Somos Industria - UIPBA).
- `FORO`: Jornadas de innovación, financiamiento y PyME (Foro CAME/CAC, El Cronista PyME).
- `NETWORKING`: Rondas de negocios e ingesta comercial B2B.

---

## 3. Especificaciones de Datos (`eventos_industria.json` & Supabase)

Cada evento posee el esquema:
```json
{
  "id": "evt_somos_industria_2026",
  "title": "Somos Industria 2026 - Congreso Industrial Pyme",
  "category": "CONGRESO",
  "organizer": "UIPBA / RedPARQUES / ADIBA",
  "date_start": "2026-09-24",
  "date_end": "2026-09-25",
  "location": "Centro de Exposiciones Costa Salguero, CABA",
  "sectors": ["PyMEs", "Parques Industriales", "Transformación Digital"],
  "description": "El evento industrial PyME más relevante de Argentina. Espacio de debate, rondas de negocios e innovación técnica para la industria bonaerense y nacional.",
  "relevance_ingentia": "ALTA - Generación de leads PyME industrial para proyectos de automatización e IA.",
  "website": "https://somosindustria.com.ar"
}
```

---

## 4. Flujo Lógico y Seeding (`scripts/seed_eventos_industria.py`)

1. **Lectura de Catálogo Local:** Cargar `src/data/eventos_industria.json`.
2. **Conexión Supabase:** Intentar upsert en la tabla `eventos_industria`.
3. **Manejo de Fallback:** Si la tabla no existe en Supabase, el Dashboard consume directamente la data local de `src/data/eventos_industria.json` garantizando 100% de disponibilidad sin bloquear la UI.

---

## 5. Historial de Aprendizaje / Errores

| Fecha | Error Detectado | Causa Raíz | Solución Aplicada |
|-------|----------------|------------|-------------------|
| 12/08/2026 | Supabase RLS / Tabla Inexistente | La tabla `eventos_industria` requiere migración o credenciales de admin | Implementar fallback a `src/data/eventos_industria.json` en `Dashboard.tsx` |

---

## 6. Comandos de Verificación

```bash
# Ejecutar seeding de eventos
python scripts/seed_eventos_industria.py

# Verificar build de TypeScript
npm run build
```
