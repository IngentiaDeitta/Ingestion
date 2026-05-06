# SOP: Reemplazo de Logo de la Aplicación

## Objetivo
Reemplazar el logo actual (basado en componentes y texto) por un logo de imagen específico proporcionado por el usuario.

## Entradas
- Archivo de imagen: `c:\app-ingentia\Recursos\Logo Blanco_T.png`
- Componente a modificar: `c:\app-ingentia\src\components\Sidebar.tsx`

## Pasos
1. **Preparación del recurso**: Copiar `Logo Blanco_T.png` de la carpeta `Recursos/` a la carpeta `public/` para que sea accesible de forma estática por la aplicación.
2. **Identificación del bloque**: Localizar en `Sidebar.tsx` el bloque de código que renderiza el logo actual (líneas 22-32 aproximadamente).
3. **Sustitución**: Reemplazar el bloque `div` y `h1` por una etiqueta `img`.
4. **Estilización**: Asegurar que la imagen tenga un tamaño adecuado (ej. `h-12` o similar) para mantener la estética premium.
5. **Verificación**: Confirmar que la ruta de la imagen sea correcta y se visualice en la aplicación.

- El sidebar y gran parte de la app tienen fondos claros (`bg-white`). El logo proporcionado es blanco (`Logo Blanco_T.png`).
- **Solución de Contraste**: Para que el logo sea visible, se implementó un contenedor oscuro (`bg-[#1A1A1A]`) con bordes redondeados (`rounded-xl` o `rounded-2xl`) en todos los lugares donde se insertó el logo. Esto mantiene la legibilidad y le da un aspecto premium de "badge".
- **Rutas**: Siempre referenciar el logo como `/logo.png` después de copiarlo a `public/`.

## Nota de Diseño
Se ha estandarizado el uso de un fondo oscuro antracita (`#1A1A1A`) detrás del logo blanco en toda la aplicación (Sidebar, Login, Register, PDFs, etc.) para asegurar la consistencia de marca y visibilidad.
