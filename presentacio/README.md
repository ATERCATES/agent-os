# Presentació — Manifesto sobre la ialització

Manifesto en format Slidev sobre la nova era de programació amb agents IA i ClaudeDeck com a infraestructura per a la transició empresarial. Format final: PDF.

## Comandes

```bash
# Instal·lar dependències (només la primera vegada)
pnpm install

# Mode desenvolupament — obre http://localhost:3030
pnpm dev

# Compilar a estàtic (opcional)
pnpm build

# Exportar a PDF (slides-export.pdf)
pnpm export

# Exportar a PNGs (un per slide)
pnpm export-png
```

> **Nota:** la primera vegada que executis `pnpm export`, Slidev descarregarà Chromium via Playwright (~150 MB).

## Estructura de fitxers

```
presentacio/
├── slides.md              # Contingut de les 19 slides + annex
├── style.css              # Sistema visual editorial dark (Fraunces + Manrope)
├── package.json
└── public/
    ├── logo.svg           # Logo (copiat de /public/icon.svg del projecte arrel)
    └── screenshots/       # Placeholders SVG (a substituir per captures reals)
```

## Estructura del deck (19 + annex)

| #   | Secció                 | Slide                            |
| --- | ---------------------- | -------------------------------- |
| 01  | I · Visió              | Portada — Ialització             |
| 02  | I · Visió              | El moment històric (3 eres)      |
| 03  | I · Visió              | El paradigma (humà → director)   |
| 04  | I · Visió              | ClaudeDeck — 4 pilars            |
| 05  | I · Visió              | Demo (4 captures)                |
| 06  | II · Com es construeix | THD aplicades                    |
| 07  | II · Com es construeix | Arquitectura Cloud/Fog/Edge/Mist |
| 08  | II · Com es construeix | Cicle de vida de les dades       |
| 09  | II · Com es construeix | Zero Trust + RGPD                |
| 10  | II · Com es construeix | Anàlisi de riscos                |
| 11  | III · Què mesurar      | KPIs i objectius                 |
| 12  | III · Què mesurar      | Aplicabilitat per sectors        |
| 13  | III · Què mesurar      | Camins d'entrada                 |
| 14  | III · Què mesurar      | Pressupost orientatiu            |
| 15  | IV · Què canvia        | Beneficis                        |
| 16  | IV · Què canvia        | RRHH i canvi cultural            |
| 17  | IV · Què canvia        | Comunitat                        |
| 18  | V · Cap on va          | Visió / Roadmap                  |
| 19  | V · Cap on va          | Conclusió                        |
| 20  | Annex                  | Referències i fonts              |

## Captures pendents

Slide 5 (Demo) conté 4 placeholders. Tots referencien funcionalitats que **realment existeixen** al projecte ClaudeDeck (verificat al README del repositori). Cap és aspiracional.

| #   | Pantalla                         | Component font (real)                                             | Què ha de quedar visible                                                                                                |
| --- | -------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 01  | **Vista principal · multi-pane** | `src/components/views/DesktopView.tsx` + `PaneLayout.tsx`         | Sidebar amb llista de sessions + 2-3 panes amb terminals d'agents actius. Status indicators (running/waiting) visibles. |
| 02  | **Conductor · orquestració**     | `src/components/ConductorPanel.tsx` + `WorkerCard.tsx`            | Header amb summary (total/running/waiting/completed/failed) + 3-5 workers en estats diferents.                          |
| 03  | **PWA mòbil · sessió continua**  | `src/components/views/MobileView.tsx` + `mobile/SwipeSidebar.tsx` | Captura del telèfon mostrant un terminal/agent actiu. Idealment amb el swipe sidebar parcialment obert.                 |
| 04  | **Git · canvis de l'agent**      | `src/components/GitPanel/` + `DiffViewer/`                        | Panell git mostrant diff de canvis acabats de fer per un agent (línies +/-) i un missatge de commit a punt.             |

### Com fer cada captura

**Preparació general (totes):**

1. Llançar ClaudeDeck local: a l'arrel del projecte, `pnpm dev` (port 3011)
2. Obrir un projecte amb activitat (idealment amb una sessió Claude oberta i alguns canvis al working tree)
3. Iniciar 2-3 agents per a tenir contingut visible

**Captura 01 — Vista principal multi-pane** _(escriptori)_

- Browser a 1920×1080 mínim, idealment 2560×1440
- Sidebar oberta a l'esquerra amb 3-5 sessions visibles, alguna marcada com a `running`
- Àrea principal amb 2 o 3 panes en paral·lel (terminals o ChatViews actius)
- Tema fosc per encaixar amb el deck

**Captura 02 — Conductor Panel**

- Necessita una sessió `conductor` activa amb workers MCP
- Mostrar la barra de summary amb números clarament llegibles
- 3-5 WorkerCards amb mix d'estats (running, waiting, completed)
- Si pots, expandir un worker per mostrar l'output en streaming

**Captura 03 — PWA mòbil**

- Resolució 1080×1920 (vertical) o 1170×2532 (iPhone 14)
- Servir des de la xarxa local i obrir el navegador del mòbil contra l'IP de la teva màquina
- Sessió iniciada al laptop, després obrir-la al mòbil per a mostrar continuïtat
- Idealment amb una mica del swipe sidebar visible (gesture en marxa)

**Captura 04 — Git Panel + DiffViewer**

- Demanar a l'agent fer un canvi tangible al codi (afegir una funció, refactor petit)
- Un cop fet, obrir el GitPanel per veure els fitxers modificats
- Clicar en un fitxer per veure el diff (DiffViewer/UnifiedDiff)
- Captura amb el diff visible i, si pot ser, el missatge de commit ja a punt

### Substituir un placeholder

Quan tinguis la captura `.png`:

1. Desa-la a `public/screenshots/` amb el nom corresponent (ex: `01-multi-pane.png`)
2. A `slides.md`, localitza el bloc `<div class="placeholder">` corresponent dins del slide 5
3. Substitueix-lo per:

   ```html
   <img
     src="/screenshots/01-multi-pane.png"
     class="rounded-lg border"
     style="width:100%; height:100%; object-fit:cover; border-radius:12px;"
   />
   ```

4. Re-exporta: `pnpm export`

### Resolució i format

- **PNG** preferit, o JPG d'alta qualitat
- Mínim 1920×1080 (escriptori) o 1080×1920 (mòbil)
- Idealment 2560×1440 per a renderitzat retina al PDF
- Comprimir amb `pngquant` o similar abans de commitejar (els PNGs poden ser pesats)

## Tema i disseny

- **Tema base:** `@slidev/theme-seriph` amb override extens al `style.css`
- **Paleta:** dark editorial — fons `#0a0a0c`, text crema `#f5efe4`, accent coral `#ff6b35`
- **Tipografia:** Fraunces (display, serif variable) + Manrope (cos, sans geomètrica) + JetBrains Mono (etiquetes)
- **Ràtio:** 16:9 (1280×720 base, escala automàtica)
- **To:** manifesto pur — sense ask financer al tancament

## Restriccions de l'enunciat

- ⚠️ Màxim 12 pàgines (actualment 20: 19 + annex). Pendent de discussió amb el professor o reduir.
- ✅ Format PDF
- ✅ Sense enllaços a vídeos
- ✅ En català
- ✅ Material per defensar davant consell d'administració (10 min de defensa oral)

## Recomanacions per a la defensa oral (10 min)

Suggerit fer una passada ràpida agrupada per parts (no slide a slide):

| Part | Slides | Temps | Què comunicar                                                 |
| ---- | ------ | ----- | ------------------------------------------------------------- |
| I    | 01–05  | 2 min | Què és la ialització; comparativa era digital → era ialitzada |
| II   | 06–10  | 2 min | Quines tecnologies (THD), arquitectura, dades, seguretat      |
| III  | 11–14  | 2 min | KPIs, sectors, models d'adopció, pressupost orientatiu        |
| IV   | 15–17  | 2 min | Beneficis, canvi cultural, comunitat                          |
| V    | 18–19  | 2 min | Roadmap i tancament: "Benvinguts a l'era dels agents"         |
