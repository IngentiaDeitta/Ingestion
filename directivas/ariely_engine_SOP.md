# Directiva SOP — Ariely Engine: Motor de Economía Conductual

## Objetivo

Automatizar la aplicación de los 4 principios de Dan Ariely (*"Las Trampas del Deseo"*) en la propuesta comercial que genera el Smart Quoter de Ingentia. El output de este motor es un PDF de 2 páginas diseñado para reducir el "dolor del pago" del cliente y guiarlo hacia el Paquete Objetivo sin manipulación artificial.

---

## Arquitectura de Componentes

| Archivo | Rol |
|---|---|
| `src/lib/ariely-engine.ts` | Motor puro determinista. Sin efectos secundarios ni llamadas API. |
| `src/components/ProposalPDFTemplate.tsx` | Template PDF de 2 páginas con arquitectura conductual. |
| `src/pages/SmartQuoter.tsx` | Tab "Propuesta Conductual" + botón "Exportar Propuesta Conductual". |

---

## Los 4 Efectos y su Lógica

### 1. Anclaje de Expectativas
- **Input:** `result.hoursStage1`, `result.financialEstimation.estimatedRevenue`
- **Fórmula:**
  - `annualWastedHours = hoursStage1 × 12`
  - `annualInefficencyCost = annualWastedHours × $35/h` (tarifa estándar SME LatAm)
  - `revenueAtRisk = estimatedRevenue × 8%`
  - `ratio = targetPrice / annualInefficencyCost × 100`
- **Output PDF:** Aparece en **Página 1**, antes de cualquier precio.
- **Propósito:** Anclar una cifra grande (costo del statu quo) en la mente del cliente antes de revelar el costo de la solución.

### 2. Efecto IKEA (Co-creación)
- **Input:** `analysisData` del AI Solution Architect (pain_points, features, problems)
- **Lógica:** Extrae los 2-4 primeros pain points y los muestra como "prioridades ya elegidas" por el cliente.
- **Output PDF:** Sección "Prioridades Co-definidas" en **Página 1** con checkboxes marcados.
- **Guion de reunión comercial:** Mostrar este bloque al cliente y decir: *"Acá están las prioridades que definimos juntos. Esta propuesta está construida exactamente sobre estos pilares."*
- **Propósito:** El cliente siente que la solución es propia porque ve sus propios problemas como origen de la propuesta.

### 3. Efecto Anzuelo (Decoy)
- **Input:** `targetPrice = module1.price + module2.price`
- **Fórmula de paquetes:**
  - Esencial: `round(targetPrice × 0.65)` — sólo Módulo 1, sin implementación
  - Objetivo (Profesional): `targetPrice` — marcado como "⭐ MÁS ELEGIDO"
  - Premium (Anzuelo): `round(targetPrice × 1.55)` — agrega 2 features de relleno real
- **Features Premium:** Pool de 6 opciones, se eligen 2 de forma rotativa por precio (determinista, no aleatoria).
- **Output PDF:** Tabla comparativa en **Página 2** con el Objetivo visualmente destacado.
- **Restricción:** La diferencia entre Objetivo y Premium debe ser ≥ 45%. Los features extra del Premium deben ser reales (no inventados) pero de valor marginal.

### 4. Poder del Gratis
- **Input:** `module1.price`, `module2.price`, `module3.monthlyPrice`
- **Ítems bonificados generados automáticamente:**
  - Setup de entornos: `m1 × 10%` (siempre)
  - Documentación técnica: `(m1+m2) × 7%` (siempre)
  - Deployment en producción: `m2 × 8%` (si `m2 > 0`)
  - Garantía de bugs 30 días: `m2 × 12%` (si `m2 > 0`)
  - Primer mes de soporte: `m3` exacto (si `m3 > 0`)
- **Output PDF:** Lista con precios tachados y badge "BONIFICADO $0" en **Página 2**.
- **Propósito:** Activar el disparador emocional del beneficio sin costo. El cliente percibe que recibe más de lo que paga.

---

## Flujo de Uso

1. Usuario genera cotización normal en Smart Quoter (tabs Análisis + Presupuesto)
2. Hace clic en el tab **"Propuesta Conductual"**
3. El Ariely Engine calcula automáticamente los 4 efectos (sin llamada a IA)
4. El usuario revisa el preview en pantalla
5. Hace clic en **"Exportar Propuesta Conductual"** → PDF de 2 páginas listo para el cliente

---

## Restricciones y Casos Borde Conocidos

- **Si `module2.price = 0` (solo consultoría):** Los ítems de Deployment y Garantía de bugs no se generan. El Paquete Esencial y el Profesional serán casi iguales; en este caso considerar no usar la tabla de 3 paquetes y exportar el PDF original.
- **Si `targetPrice = 0`:** El engine lanzará una excepción manejada. El tab mostrará el fallback "Generá un presupuesto primero".
- **Si `analysisData` no tiene pain_points/features/problems:** El IKEA Engine usa los `deliverables` y `risks` de Gemini como fallback. Siempre habrá datos.
- **Redondeo de precios:** Todos los precios calculados se redondean a múltiplos de $50 para precios visualmente limpios (`round(n/50)*50`).
- **Tarifa hora:** Fija en $35 USD/h. Si el mercado objetivo es distinto, actualizar la constante `HOURLY_RATE_USD` en `ariely-engine.ts`.
- **El PDF original no fue modificado.** `BudgetPDFTemplate` sigue funcionando para cotizaciones internas.
- **Restricciones de Layout y Responsividad:**
  - Las tarjetas de estadísticas (Stat Cards) deben renderizarse fuera del grid de columnas (`lg:col-span-7`) a ancho completo para evitar truncamientos y overflows.
  - Los botones de pestañas del panel de resultados deben llevar la clase `shrink-0` para prevenir que Flexbox comprima su padding a cero, forzando un scroll horizontal limpio sin solapamiento de textos e iconos.
  - La grilla comparativa de paquetes de la propuesta conductual debe ser responsive (`grid-cols-1 md:grid-cols-3`) para evitar aplastamientos en tamaños de pantalla menores a desktop.

---

## Actualización de este Documento

Si se descubre una nueva restricción de la API, un formato inesperado de `analysisData`, o se cambian los multiplicadores de precio, actualizar la sección **"Restricciones y Casos Borde"** inmediatamente y anotar la fecha del cambio.
