# Handoff: Achilles Nutrition — Webapp de tracking físico

## Overview
Achilles Nutrition es una webapp móvil premium de nutrición y seguimiento físico para hombres ocupados que quieren "el físico de Aquiles" sin contar calorías manualmente. La filosofía es de **mínima fricción**: el usuario abre la app y sabe de inmediato "¿voy bien o voy mal?". La métrica central es el **Achilles Score** (0–100), mucho más visible que las calorías o macros, que permanecen ocultos por defecto.

Estética de **lujo discreto** (referencias: Apple, Whoop, Levels, Eight Sleep, Tom Ford, Rolex, Aesop). NO debe parecer una app de gimnasio ni MyFitnessPal.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra el aspecto y comportamiento previstos, **no código de producción para copiar directamente**. La tarea es **recrear este diseño en el entorno del codebase destino** (React, Vue, React Native, SwiftUI, etc.) usando sus patrones y librerías establecidos. Si aún no existe codebase, elige el framework más apropiado (recomendado: React + Vite o Next.js para web; React Native/Expo si el objetivo es app nativa) e impleméntalo allí.

El prototipo está construido como un "Design Component" (`.dc.html`) que usa un runtime propietario (`support.js`) con plantillas y una clase de lógica. **No reutilices ese runtime** — extrae de él la estructura, los estilos y la lógica de estado, y reescríbelos con componentes nativos del framework destino.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados e interacciones son los definitivos. Recrear la UI de forma pixel-perfect usando las librerías y patrones del codebase destino. Todos los valores exactos están en la sección Design Tokens.

## Screenshots
Capturas de referencia de cada pantalla en `screenshots/` (PNG, alta resolución, teléfono completo con bottom nav):

| # | Archivo | Pantalla |
|---|---------|----------|
| 01 | `screenshots/01-onboarding-welcome.png` | Onboarding — bienvenida / branding |
| 02 | `screenshots/02-onboarding-objetivo.png` | Onboarding paso 1 — objetivo |
| 03 | `screenshots/03-onboarding-datos.png` | Onboarding paso 2 — edad/peso/altura |
| 04 | `screenshots/04-onboarding-actividad.png` | Onboarding paso 3 — actividad |
| 05 | `screenshots/05-dashboard.png` | Dashboard — Achilles Score |
| 06 | `screenshots/06-escanear-camara.png` | Escanear comida — cámara |
| 07 | `screenshots/07-escanear-resultado.png` | Escanear comida — resultado + score |
| 08 | `screenshots/08-restaurante-camara.png` | Modo Restaurante — cámara |
| 09 | `screenshots/09-restaurante-resultado.png` | Modo Restaurante — recomendación |
| 10 | `screenshots/10-weekend-mode.png` | Weekend Mode — estrategia |
| 11 | `screenshots/11-seguimiento-semanal.png` | Seguimiento semanal |
| 12 | `screenshots/12-ia-coach.png` | IA Coach — chat |

> Nota: las capturas muestran datos demo y la opción `showMacros` desactivada (macros ocultos). La fuente de UI cae a una sans del sistema en la captura porque Helvetica/Inter cargan vía red; en la app real se ve con la tipografía correcta.

## Screens / Views

El prototipo vive dentro de un marco de teléfono de **390 × 844 px** (radio 46px). En producción el marco NO existe: es solo para presentación. Implementar las pantallas a pantalla completa, mobile-first. Hay una barra de estado simulada (50px) arriba y una **bottom nav** (78px) abajo presente en todas las pantallas salvo el onboarding.

### 1. Onboarding (4 pasos, sin bottom nav)
- **Propósito:** Captar objetivo y datos básicos con mínima fricción. La IA calcula internamente calorías de mantenimiento, proteína recomendada y objetivo — **estos números NUNCA se muestran al usuario.**
- **Paso 0 — Bienvenida:** centrado vertical. Monograma "ATC" (Inria Serif, 13px, letter-spacing 5px, dorado). Wordmark "ACHILLES" (Inria Serif 300, 46px, letter-spacing 1px, blanco roto). Línea divisoria dorada 34×1px. Tagline gris (16px, max-width 270px): "Construye el físico de Aquiles. Sin contar calorías. Sin obsesión." Botón dorado full-width "Comenzar".
- **Paso 1 — Objetivo:** Eyebrow "PASO 1 DE 3" (gris, 12px, uppercase, letter-spacing 2px). Título serif 300 30px "¿Cuál es tu objetivo?". Dos tarjetas seleccionables full-width (bg `#141414`, radio 18px, padding 24px): "Perder grasa" / "Ganar músculo limpio" (título serif 21px + subtítulo gris 14px). **Seleccionar una tarjeta avanza automáticamente** al paso 2 (auto-advance = filosofía de baja fricción). El borde de la tarjeta seleccionada pasa a dorado.
- **Paso 2 — Datos:** Tres filas stepper (Edad, Peso·kg, Altura·cm). Cada fila: bg `#141414`, radio 18px, padding 20×24px, label gris a la izquierda, a la derecha botones circulares −/+ (34px, borde sutil) con el valor en serif 24px en medio. Botón dorado "Continuar". Defaults: edad 32, peso 82, altura 180.
- **Paso 3 — Actividad:** Tres tarjetas: "Poco activo" (<7.000 pasos), "Activo" (8.000–10.000), "Muy activo" (10.000–15.000). Título 17px + subtítulo gris 13px. Seleccionar resalta borde dorado. Botón dorado "Crear mi protocolo" → entra al Dashboard.

### 2. Dashboard / Home
- **Propósito:** Estado de un vistazo. Cero tablas, cero macros, cero gráficos técnicos.
- **Layout:** padding 8×24px. Header: a la izquierda wordmark "ACHILLES" (serif 11px, letter-spacing 4px, dorado) + fecha gris 13px; a la derecha avatar circular 38px con inicial.
- **Anillo Achilles Score (centro):** SVG 180×180. Círculo de fondo (stroke `rgba(255,255,255,0.06)`, width 5) + arco de progreso dorado (stroke `#B89B5E`, width 5, linecap round) rotado −90°. Radio 72px → circunferencia ≈ 452.4; `stroke-dashoffset = C × (1 − score/100)`. En el centro: número del score (serif 300, 52px) + label "ACHILLES SCORE" (gris 12px uppercase letter-spacing 2px). Valor demo: **87**.
- **Pill de estado:** bajo el anillo, borde dorado translúcido, radio 100px, punto dorado 6px + texto. Lógica: score ≥85 → "Vas por buen camino"; 70–84 → "Vas bien, ajusta detalles"; <70 → "Necesitas más constancia".
- **Objetivo:** texto centrado gris "Objetivo · <objetivo elegido>".
- **Métricas (grid 3 col):** "89% Adherencia", "✓ Proteína" (el check en dorado), "11.4k Pasos". Tarjetas `#141414`, radio 16px, números en serif 26px.
- **Acciones rápidas (grid 2 col):** "Modo Restaurante / Qué pedir hoy" y "Weekend Mode / Sal sin culpa". Tarjetas con `background: linear-gradient(160deg,#1a1713,#121212)`, borde dorado translúcido `rgba(184,155,94,0.18)`, radio 16px. Navegan a sus pantallas.
- **Comidas de hoy:** título serif 18px "Hoy" + contador. Lista de tarjetas: nombre (14px) + hora (gris 12px) a la izquierda, score en serif 22px a la derecha (dorado si ≥85, gris si <85). Datos demo: "Tortilla de claras y café" 08:20 → 84; "Pollo a la plancha, arroz y aguacate" 13:40 → 92; "Salmón con espárragos" 20:15 → 95.

### 3. Escanear comida (3 estados)
- **Propósito:** Función principal. Foto → estimación rápida (no perfecta) de proteínas/carbos/grasas/calorías + Achilles Score.
- **Estado cámara:** Título serif 28px "Escanear comida" + subtítulo "Una foto. La IA hace el resto." Visor `aspect-ratio 3/4`, radio 24px, fondo de rayas diagonales (placeholder), marco interior dorado translúcido, caption monospace "APUNTA A TU COMIDA". Botón dorado "Capturar". Separador "o describe" + input de texto con ejemplo "Pollo, arroz y aguacate" (Método 2: registro por texto). *(Método 3, código de barras, es futuro — no implementado.)*
- **Estado analizando:** spinner circular (60px, borde dorado parcial, animación spin 1s lineal) centrado + "Analizando…" (serif 20px) + "Proteína · ingredientes · saciedad". Dura ~1.9s (simulado con setTimeout — en producción será la llamada real a la IA).
- **Estado resultado:** Placeholder de foto (aspect 16/10, rayas tono cálido, caption "FOTO COMIDA"). Score grande centrado: "92" en serif 300 64px **dorado** + label uppercase + nombre del plato. Tarjeta de factores (`#141414`, radio 18px): lista de ✔ (dorado) "Proteína alta", "Alimentos naturales", "Buena saciedad" y ⚠ (gris) "Faltan verduras". **Macros ocultos por defecto** — solo se muestran si la opción `showMacros` está activa (grid 4 col: 48g Prot, 62g Carbs, 18g Grasa, 610 kcal). Botones: "Otra foto" (ghost) + "Registrar" (dorado, vuelve a Home).

### 4. Modo Restaurante (2 estados)
- **Propósito:** Funcionalidad prioritaria. Fotografía la carta/menú → mejor opción para tu objetivo.
- **Cámara:** back link "← Inicio", título serif 28px, visor 3/4 con marco dorado y caption "FOTOGRAFÍA LA CARTA", botón dorado "Analizar carta".
- **Resultado:** Tarjeta destacada (gradiente `160deg,#1a1713,#121212`, borde dorado): eyebrow dorado "MEJOR OPCIÓN PARA TI" + frase serif 24px "Elige el salmón con patata asada." Tarjeta "Evita": lista con ✕ "Salsas", "Bebidas azucaradas", "Postres". Botón ghost "Analizar otra".

### 5. Weekend Mode
- **Propósito:** Exclusiva de Achilles Protocol. Estrategia automática para comer fuera.
- **Layout:** back link, título serif 28px, subtítulo. Dos botones seleccionables (`#141414`, radio 18px, serif 20px): "Hoy voy a comer fuera" / "Hoy voy a cenar fuera". Al elegir, aparece tarjeta de estrategia (gradiente dorado) con eyebrow "TU ESTRATEGIA DE HOY" + texto serif 21px.
  - comida → "Prioriza proteína durante el día y elimina el desayuno. Bebe agua antes de salir."
  - cena → "Mantén el día ligero y rico en proteína. Reserva tus carbohidratos para la cena."

### 6. Seguimiento semanal (Progreso)
- **Propósito:** Solo 1 vez por semana — sin tracking diario complejo.
- **Layout:** título serif 28px + subtítulo "Una vez por semana. Nada más." Tarjeta de tendencia (gradiente dorado): eyebrow "TENDENCIA" + frase serif 20px de recomendación simple. Tres filas: Peso (81,4 kg, −0,6 kg en dorado), Cintura (84 cm, −1 cm), Foto progreso (pendiente, "Añadir →"). Botón dorado "Registrar esta semana".

### 7. IA Coach (chat)
- **Propósito:** Chat integrado. Responder ¿puedo comer esto? / ¿qué pido aquí? / ¿cómo llego a mi proteína? según la filosofía Achilles.
- **Layout:** Header con borde inferior, título serif 24px "IA Coach". Burbujas: IA a la izquierda (`#141414`, borde sutil, texto blanco, radio 16px, max-width 84%), usuario a la derecha (bg dorado `#B89B5E`, texto `#0A0A0A`). Chips de sugerencias (pills `#141414`, borde sutil, gris 12px). Barra de input redondeada (placeholder "Escribe a tu coach…") + botón circular dorado 46px con flecha "↑". Mensaje inicial de la IA. En el prototipo las respuestas son enlatadas; en producción conectar a la API real.

## Interactions & Behavior
- **Navegación:** bottom nav con 4 destinos (Inicio, Escanear, Progreso, Coach). El activo va en blanco con punto dorado 4px debajo; inactivos en gris `#666`. Modo Restaurante y Weekend se alcanzan desde las acciones rápidas del Dashboard (back link "← Inicio").
- **Onboarding:** el paso de objetivo auto-avanza al seleccionar; los demás usan botón explícito.
- **Escaneo / restaurante:** transición cámara → analizando (~1.9s / ~1.6s) → resultado. En producción sustituir el setTimeout por la llamada a la IA con estados de carga/error reales.
- **Entrada de pantalla:** fade-in sutil `achFade` (opacity 0→1, translateY 8px→0, 0.5–0.6s ease).
- **Spinner:** `achSpin` rotación 360° 1s lineal infinita.
- **Selección:** las tarjetas seleccionadas (objetivo, actividad, weekend) cambian el borde a dorado.

## State Management
Estado necesario (en el prototipo, una sola clase; en producción repartir por vistas/stores):
- `screen`: pantalla actual (`onboarding | home | scan | restaurant | weekend | progress | coach`).
- `ob`: paso de onboarding (0–3).
- `goal`: `'fat' | 'muscle'`.
- `age`, `weight`, `height`: números (defaults 32 / 82 / 180).
- `activity`: `'low' | 'mid' | 'high'`.
- `scan`: `'camera' | 'analyzing' | 'result'`.
- `restaurant`: `'camera' | 'analyzing' | 'result'`.
- `weekend`: `null | 'lunch' | 'dinner'`.
- `chat`: array de `{ role: 'ai' | 'me', text }`.
- **Derivados:** el Achilles Score impulsa el `stroke-dashoffset` del anillo y el texto del pill de estado; el objetivo impulsa el label "Objetivo".
- **Data fetching (producción):** análisis de foto de comida, análisis de carta, generación de estrategia weekend y respuestas del coach → endpoints de IA. Cálculo interno de mantenimiento/proteína/objetivo en onboarding (oculto al usuario).

## Design Tokens
**Colores**
- Fondo principal: `#0A0A0A` (negro profundo)
- Fondo de página/marco: `#050505`
- Superficie de tarjeta: `#141414`
- Superficie destacada (gradiente): `linear-gradient(160deg, #1a1713, #121212)`
- Texto principal: `#F5F5F5` (blanco roto)
- Texto secundario: `#A0A0A0` (gris piedra)
- Texto terciario / placeholders: `#777` / `#666`
- Acento dorado: `#B89B5E` (solo botones clave, indicadores premium, detalles — **nunca dominante**)
- Bordes sutiles: `rgba(255,255,255,0.06)` a `rgba(255,255,255,0.15)`
- Borde dorado translúcido: `rgba(184,155,94,0.18)` – `rgba(184,155,94,0.4)`

**Tipografía**
- Títulos / branding / frases destacadas: **Inria Serif** (pesos 300, 400, 700). Estética griega moderna, clásica, elegante.
- Interfaz / texto general: **Helvetica Now** (PRD). Fallbacks usados en el prototipo: `Inter`, `-apple-system`, sans-serif. En producción usar Helvetica Now si hay licencia; si no, Inter o SF Pro.
- Escalas vistas: serif 300 → 64/52/46/30/28/24/21/20px; UI 11–17px.

**Radios:** botones 14px · tarjetas 16–18px · visores 20–24px · pills 100px · marco 46px.

**Espaciado:** padding de pantalla 24px horizontal; tarjetas 16–26px; gaps 8–14px.

**Sombras:** marco del teléfono `0 40px 120px rgba(0,0,0,0.7)` (solo presentación).

**Animaciones:** `achFade` 0.5–0.6s ease (entrada) · `achSpin` 1s linear infinite (loader).

## Assets
- **Sin imágenes reales.** Las fotos de comida/carta y la foto de progreso son **placeholders** (fondos de rayas diagonales con caption monospace). En producción: cámara real + subida de imagen.
- **Fuentes:** Inria Serif e Inter desde Google Fonts en el prototipo. Helvetica Now requiere licencia propia.
- **Iconografía:** mínima e intencionada (✓ ✔ ⚠ ✕ ↑ − +, puntos y círculos). No hay set de iconos; añadir uno ligero y de trazo fino si el codebase lo requiere, en línea con la estética sobria.
- **Logo:** Opción 1 logotipo "ALEX THE CREATOR" en Inria Serif; Opción 2 monograma "ATC". El prototipo usa "ATC" + wordmark "ACHILLES".

## Files
- `Achilles Nutrition.dc.html` — prototipo completo (plantilla + clase de lógica con todo el estado y la navegación). Es la referencia principal: léelo para extraer estructura, estilos inline exactos y lógica.
- `support.js` — runtime del Design Component. **No portar.** Solo está para que el `.dc.html` abra en un navegador; ignóralo al implementar.
- `ACHILLES NUTRITION - Product Requirements Document.pdf` — PRD original con visión, personas, filosofía e identidad visual.
