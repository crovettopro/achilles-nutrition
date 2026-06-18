# Achilles Nutrition

Webapp móvil premium de nutrición y seguimiento físico. Filosofía de **mínima fricción**: el usuario abre la app y sabe de inmediato si va bien o mal. La métrica central es el **Achilles Score** (0–100); las calorías y macros permanecen ocultos por defecto.

Estética de lujo discreto (negro profundo + dorado, tipografía Inria Serif). Construido a partir del paquete de diseño en `design_handoff_achilles_nutrition/`.

## Stack

- **React 18 + TypeScript + Vite** (frontend)
- **Node + Express** (`server/`) — proxy de IA que guarda la API key server-side
- **react-router-dom** para la navegación
- **CSS Modules** + variables CSS para los design tokens (`src/index.css`)
- Capa de IA intercambiable (`src/services/ai/`) — `backend` (por defecto), `mock`, `minimax` (legacy directo)

## Arranque

```bash
npm install
npm run dev      # server (8787) + vite (5173) a la vez → abre http://localhost:5173
npm run build    # type-check + build de producción (dist/)
npm start        # producción: un solo server sirve dist/ + /api en el mismo origen
```

Comandos sueltos: `npm run dev:web` (solo Vite), `npm run server` (solo API).

## Backend (proxy de IA)

El servidor [`server/`](server/) guarda la API key (`MINIMAX_API_KEY`, **sin** prefijo `VITE_`, así no llega al bundle) y expone:

| Endpoint | Entrada | Salida |
|----------|---------|--------|
| `POST /api/ai/food` | `{ image? , text? }` | `FoodAnalysis` |
| `POST /api/ai/menu` | `{ image? }` | `MenuAnalysis` |
| `POST /api/ai/weekend` | `{ plan, profile }` | `{ strategy }` |
| `POST /api/ai/coach` | `{ history, profile }` | `{ reply }` |
| `GET /api/health` | — | estado |

En dev, Vite proxea `/api` → `localhost:8787`. En prod, el mismo server sirve la SPA y la API (mismo origen, sin CORS). El frontend usa `BackendAIService` y nunca ve la key.

## Usuarios, roles y mensajería

Hay dos roles con login (JWT): **Deportista** y **Preparador**.

- **Deportista**: su perfil/comidas/check-ins se guardan en el servidor (no en el navegador). Desde *Tu cuenta* (avatar del Home) se vincula a un preparador con su código y chatea con él.
- **Preparador**: ve la lista de sus alumnos (Achilles Score, adherencia, última actividad), entra al detalle de cada uno (comidas, tendencia) y les escribe.
- **Vínculo**: cada preparador tiene un código (`ACH-XXXX`); el alumno lo introduce al registrarse o en *Tu cuenta*.

Usuarios de demo sembrados al arrancar (`server/db.js`):
| Email | Pass | Rol |
|-------|------|-----|
| crovettopro@gmail.com | aquilles123 | Deportista |
| alejandrodiosfdz@gmail.com | aquilles123 | Preparador |

> ⚠️ **Persistencia:** el backend de usuarios usa un store en archivo (`server/data/db.json`), válido en local y en hosts persistentes (Render/Railway/Fly), **no en Vercel serverless** (disco efímero). En Vercel solo funcionan las funciones de IA (`api/`); el login/coach corre en el server Express. Para multiusuario en producción habrá que mover este store a un Postgres hosteado (Neon/Supabase) — cambio acotado en `server/db.js`.

## Deploy en Vercel

El repo está listo para Vercel:
- Frontend (Vite) → build estático en `dist/`.
- Backend → **funciones serverless** en [`api/`](api/) (reutilizan `server/minimax.js`). Vercel mapea `api/ai/food.js` → `/api/ai/food`, etc.
- [`vercel.json`](vercel.json) define el build y el fallback SPA.

Pasos:
1. En [vercel.com](https://vercel.com) → *Add New Project* → importa `crovettopro/achilles-nutrition`.
2. Framework: **Vite** (autodetectado). No cambies build/output (ya en `vercel.json`).
3. **Environment Variables** → añade `MINIMAX_API_KEY` (y opcionalmente `MINIMAX_MODEL`, `MINIMAX_VISION_MODEL`). La key va aquí, **nunca** en el repo.
4. Deploy. El `npm run dev`/`npm start` local con Express sigue funcionando igual.

## IA (proveedores)

`VITE_AI_PROVIDER` selecciona el proveedor del frontend (`src/services/ai/index.ts`):

- **`backend`** (por defecto) — llama a nuestro server `/api/ai/*`; la key vive en el servidor. Modelos: `MiniMax-M2.7` (texto/coach) y `MiniMax-Text-01` (visión: fotos de comida/carta).
- **`mock`** — totalmente offline, respuestas simuladas. La app arranca sin claves.
- **`minimax`** — legacy: llama a MiniMax directo desde el browser (expone la key). Solo para depurar.

`MiniMax-M2.7` es un modelo de razonamiento (gasta tokens razonando antes de responder), por eso se usa `max_tokens` alto.

Para añadir otro proveedor (p. ej. Claude), basta cambiar el cliente del servidor en [`server/minimax.js`](server/minimax.js) — la UI y la interfaz `AIService` no cambian.

## Estructura

```
server/              # backend Express: proxy de IA (prompts, cliente MiniMax, normalización)
src/
  components/        # UI compartida (BottomNav, ScoreRing, CameraStage, ui/*)
  context/           # AppContext: perfil, comidas, check-ins, chat (+ localStorage)
  lib/               # metrics (score/tendencia), storage, image, useCamera
  screens/           # Onboarding, Home, Scan, Restaurant, Weekend, Progress, Coach
  services/ai/       # gateway de IA (backend + mock + minimax) tras una interfaz
```

## Pantallas

Onboarding (4 pasos) → Home (Achilles Score) → Escanear comida → Modo Restaurante → Weekend Mode → Seguimiento semanal → IA Coach. La navegación inferior cubre Inicio / Escanear / Progreso / Coach; Restaurante y Weekend se abren desde las acciones rápidas del Home.

## Notas de implementación

- Las fotos de comida/carta son **placeholders** (sin cámara real todavía). Los puntos de integración (`ai.analyzeFood`, `ai.analyzeMenu`) ya aceptan una imagen en data-URL cuando se conecte la cámara.
- Los macros se controlan con `showMacros` en `AppContext` (oculto por defecto).
- El cálculo interno de mantenimiento/proteína del onboarding aún no se muestra al usuario (por diseño).
