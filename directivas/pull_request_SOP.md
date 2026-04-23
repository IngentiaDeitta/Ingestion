# Directiva: Creación de Pull Request

## Objetivo
Subir los cambios realizados (configuración de directivas y scripts) al repositorio remoto y dejar todo listo para un Pull Request.

## Entradas
- Rama de trabajo: `feat/setup-connection`
- Cambios realizados: Creación de `directivas/` y `scripts/`.

## Lógica de Ejecución (Paso a Paso)
1. **Staging**: Añadir los archivos de directivas y scripts al índice de git.
2. **Commit**: Crear un commit con un mensaje claro, por ejemplo: `docs: initialize agent structure and git connection`.
3. **Push**: Intentar subir la rama al remoto `origin`.
4. **Verificación**: Si el push es exitoso, proporcionar el link para crear el PR en GitHub.
5. **Fallback**: Si el push falla por falta de permisos, generar un script de ayuda para que el usuario lo ejecute localmente con sus credenciales.

## Restricciones y Casos Borde
- [IMPORTANT] No incluir archivos sensibles en el commit.
- [WARNING] Si no hay un token de GitHub configurado, el push fallará. En ese caso, se debe indicar al usuario cómo proceder.

## Salidas Esperadas
- Rama remota actualizada.
- Instrucciones para finalizar el PR.
