# AI Analysis Prompts - Procedimiento Operativo Estándar (SOP)

## Descripción
Este documento registra el cambio de arquitectura del "AI Solution Architect" de ser un módulo centralizado a un modelo distribuido basado en prompts especializados de NotebookLM.

En lugar de tener una vista separada (`/solution-architect`), la IA y el análisis se llevarán a cabo en las distintas áreas de la plataforma utilizando los cuadernos de NotebookLM y los prompts respectivos.

## Prompts Definidos

### 1. AI Client Analyst (Perfilado de Empresa)
**Objetivo:** Construir un perfil estratégico de una empresa utilizando información proveniente de NotebookLM.
**Contexto de Lectura:**
- `[CTX]` -> Contexto general del cliente
- `[DOC]` -> Documentación de procesos
- `[MEET]` -> Reuniones y minutas
- `[PROJ-XXX]` -> Información de proyectos

**Reglas:**
- Priorizar `[CTX]` y `[DOC]`
- Usar `[MEET]` como complemento
- Ignorar `[PROJ-XXX]` salvo contexto general.

**Output Esperado:**
Extracción de información clave: Nombre, Industria, Modelo de negocio, etc.

### 2. AI Project Analyst (Módulo Proyectos)
**Objetivo:** Analizar un proyecto específico dentro del contexto de un cliente utilizando el agente Antigravity para extraer conocimiento de NotebookLM.

**Proceso de Integración NotebookLM (Agente):**
1. Revisar los documentos creados e identificar el cliente asociado al proyecto.
2. Hacer match con el cuaderno creado en NotebookLM que corresponda a ese cliente.
3. Dentro del cuaderno, buscar y consumir los diversos documentos clasificados según las directivas previstas para que el agente tome de contexto de la empresa y del proyecto.

**Contexto de Lectura (Nomenclatura en Cuaderno NotebookLM):**
- `[CTX]` -> Contexto general de la empresa/cliente
- `[DOC]` -> Documentación de procesos y flujos de trabajo
- `[MEET]` -> Reuniones y minutas (histórico)
- `[PROJ-XXX]` -> Información específica del proyecto en curso

**Reglas:**
- El Agente buscará el cuaderno por el nombre del cliente asociado al proyecto.
- Priorizar documentos `[PROJ-XXX]` relacionados al proyecto.
- Complementar con `[MEET]`.
- Usar `[CTX]` y `[DOC]` solo como contexto general.
- Basarse estrictamente en los documentos encontrados en NotebookLM, no sobreinterpretar y ser concreto.

**Input Esperado (Entrada al Agente):**
- Nombre del proyecto
- Descripción del proyecto
- Nombre del cliente asociado (para match con NotebookLM)
- Client Analysis (`client_analysis` en JSON)

**Proceso:**
1. Identificar problema principal.
2. Determinar impacto en el negocio.
3. Detectar áreas afectadas.
4. Clasificar problema (determinístico, secuencial, basado en reglas, ambiguo, exploratorio, iterativo).
5. Evaluar urgencia y complejidad.

**Output Esperado (JSON):**
```json
{
  "project_summary": "",
  "problem": "",
  "impact": "",
  "areas": [],
  "urgency": "",
  "classification": "",
  "complexity": ""
}
```

### 3. AI Solution Architect + Estimator (Módulo Smart Quoter)
**Objetivo:** Definir la solución óptima, arquitectura y estimar la complejidad y esfuerzo para un proyecto.

**Input Esperado:**
- Client Analysis (`client_analysis` en JSON)
- Project Analysis (`project_analysis` en JSON)

**Proceso:**
1. Comprender contexto global del cliente y problema específico del proyecto.
2. Definir solución óptima (Backend tradicional, API IA directa, Workflow, Agente, Multi-agente).
3. Reglas de solución: Minimizar agentes, priorizar eficiencia, no usar RAG salvo que sea estrictamente necesario.
4. Definir arquitectura: componentes, integraciones, flujo de datos.
5. Estimar complejidad (Baja, Media, Alta).
6. Estimar esfuerzo (Bajo, Medio, Alto).
7. Estimar rango de costo relativo.

**Output Esperado (JSON):**
```json
{
  "solution": "",
  "architecture": {
    "components": [],
    "integrations": []
  },
  "complexity": "",
  "estimated_effort": "",
  "estimated_cost_range": ""
}
```

**Reglas:**
- Justificar decisiones.
- Evitar sobreingeniería.
- Output claro y accionable.

## Casos Borde y Trampas Conocidas
- Todavía en fase de implementación: integrar la lógica en los endpoints o modales directamente desde la vista del cliente o proyecto.
