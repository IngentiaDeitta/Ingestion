# Directiva: Edición de Montos en Smart Quoter

## Objetivo
Permitir la edición manual de los montos propuestos por la IA en el módulo de "Smart Quoter" antes de guardar la cotización final. Estos montos editados serán la base para el total de la cotización que impactará el ingreso en módulos relacionados de la plataforma.

## Entradas
- Resultado de la predicción de precios generada por la IA (vía `analyzeWithGemini`).
- Interacción del usuario para habilitar el modo de edición y enviar valores actualizados.

## Salidas
- Interfaz actualizada que permite introducir y ver montos personalizados para los módulos del presupuesto.
- Al guardar la cotización (`Save Modal`), el cálculo del `total_amount` resultante y el contenido guardado en `results` deben reflejar los montos editados.

## Lógica y Procedimiento
1. Introducir estados de React para manejar si un campo de precio está en "modo edición" y el "valor editado" actual.
2. Cada bloque de módulo en la pestaña de presupuesto (`Módulo 1`, `Módulo 2`, `Módulo 3`) debe cambiar de solo lectura a campos editables al hacer clic o al presionar un botón de "Editar precio".
3. Actualizar directamente el objeto `results` o mantener un estado `customPrices` que sobrescriba el de la IA. Por simplicidad e integridad de guardado, modificar directamente `results.pricing` crea una cotización final consistente que será consumida por otros módulos.
4. Ajustar el cálculo del Total en la IU inferior y en la función `handleSaveQuote` para que ambos respeten los precios ajustados.

## Restricciones / Casos Borde
- *Nota: Asegurarse de que al recalcular la cotización con la IA (nueva cotización) se sobreescriban correctamente (reseteen) los valores editados.*
- *Nota: Respetar el tipo de dato numérico (`number`) al actualizar `results.pricing.moduleX.price` dado que los input devuelven `string`. De lo contrario el `total_amount` podría concatenar strings en vez de sumarlos.*
