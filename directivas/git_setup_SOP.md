# Directiva: Conexión a GitHub y Preparación de Pull Request

## Objetivo
Conectar el directorio local al repositorio de GitHub `IngentiaDeitta/Ingestion` y configurar el entorno para permitir la creación de Pull Requests.

## Entradas
- URL del repositorio: `https://github.com/IngentiaDeitta/Ingestion`
- Credenciales de GitHub: Token de Acceso Personal (PAT) configurado en el entorno o Git Helper.

## Lógica de Ejecución (Paso a Paso)
1. **Verificar Estado de Git**: Comprobar si el directorio ya es un repositorio. Si no lo es, ejecutar `git init`.
2. **Configurar Remoto**: Añadir la URL del repositorio como remoto `origin`.
3. **Sincronizar**: Realizar un `git fetch` y `git pull origin main` (o la rama por defecto) para traer el código existente.
4. **Preparar Estructura**: Asegurarse de que las carpetas `directivas/`, `scripts/` y `.tmp/` se mantengan según las reglas del agente.
5. **Configurar Identidad**: Asegurarse de que `user.name` y `user.email` estén configurados para poder realizar commits.
6. **Rama de Trabajo**: Crear una rama nueva (ej. `feat/setup-connection`) para el primer Pull Request.

## Restricciones y Casos Borde
- [IMPORTANTE] Si se requiere autenticación, el script debe intentar usar el token del entorno o informar si falta.
- [CAUTION] No sobreescribir archivos locales si hay conflictos; usar estrategias de merge seguras.
- [NOTE] El repositorio parece estar actualmente vacío o con mínima estructura según la exploración inicial.

## Salidas Esperadas
- Repositorio local vinculado al remoto.
- Rama de trabajo creada.
- Conexión verificada con un `git remote -v`.
