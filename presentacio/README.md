# Presentació de defensa — ClaudeDeck

Presentació feta amb [Slidev](https://sli.dev) (tema `seriph`) per defensar ClaudeDeck davant del consell d'administració. Format final: PDF de 12 pàgines.

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

## Estructura

```
presentacio/
├── slides.md              # Contingut de les 12 slides
├── style.css              # Override de paleta i estil de placeholders
├── package.json
└── public/
    ├── logo.svg           # Logo (copiat de /public/icon.svg del projecte arrel)
    ├── screenshots/       # Captures pendents (placeholders SVG inclosos)
    └── diagrams/          # Diagrames externs (si calen, no es fan servir actualment)
```

## Captures pendents

Les slides 4 contenen 4 placeholders. La resta dels diagrames són Mermaid integrats al markdown.

| #   | Pantalla            | Component font                      | Què ha de quedar visible                                               |
| --- | ------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| 01  | Dashboard principal | `src/components/ClaudeProjects/`    | Llista de projectes amb sessions actives, sidebar, comptador de tokens |
| 02  | Conductor Panel     | `src/components/ConductorPanel.tsx` | 2-3 agents executant-se en paral·lel, vista de tasques                 |
| 03  | PWA mòbil           | `src/components/mobile/`            | App al telèfon mostrant la mateixa sessió que al laptop                |
| 04  | Observabilitat      | (panell de mètriques)               | Gràfic de costos per projecte / dia, tokens consumits                  |

### Com substituir un placeholder

Pots fer-ho de dues maneres equivalents:

**Opció A — substituir directament la `<div>` del placeholder a `slides.md`:**

Localitza al `slides.md` el bloc:

```html
<div class="placeholder">
  <div class="placeholder-label">CAPTURA 01</div>
  <div class="placeholder-desc">
    Dashboard principal — vista de projectes i sessions actives
  </div>
</div>
```

I substitueix-lo per:

```html
<img src="/screenshots/01-dashboard.png" class="rounded-lg border shadow-md" />
```

**Opció B — generar les imatges abans i editar slides.md tot d'una vegada:**

1. Llançar ClaudeDeck en local: `cd .. && pnpm dev` (port 3011)
2. Obrir http://localhost:3011 al navegador
3. Capturar cada pantalla a resolució mínima 1920x1080
4. Desar a `public/screenshots/01-dashboard.png`, `02-session-multi-agent.png`, etc.
5. Editar `slides.md` per substituir els 4 blocs `<div class="placeholder">` per `<img>` tags
6. Re-exportar: `pnpm export`

### Resolució i format suggerits

- **PNG** (preferit) o JPG d'alta qualitat
- **Mínim 1920x1080** (idealment 2560x1440 per a renderitzat retina al PDF)
- Si la captura és vertical (mòbil), 1080x1920 funciona bé
- Comprimir lleugerament amb `pngquant` o similar abans de comprometre

## Tema i disseny

- **Tema base:** `@slidev/theme-seriph` (acadèmic formal)
- **Paleta:** blau corporatiu (`#1e40af`) com a accent únic
- **Tipografia:** Inter (cos) + Playfair Display (titulars) + JetBrains Mono (codi/tags)
- **Ràtio:** 16:9 (1280×720 base, escala automàtica)

Els overrides de paleta i estil de les caixes placeholder estan a `style.css`.

## Edició del contingut

Les 12 slides estan al fitxer únic `slides.md`. Estructura:

| #   | Slide                                              |
| --- | -------------------------------------------------- |
| 1   | Portada                                            |
| 2   | El problema                                        |
| 3   | Solució: ClaudeDeck                                |
| 4   | La plataforma en acció (4 captures)                |
| 5   | Arquitectura tècnica (Mermaid Cloud/Fog/Edge/Mist) |
| 6   | Moat — per què no ens copien                       |
| 7   | Model de negoci open-core                          |
| 8   | Seguretat Zero Trust + RGPD                        |
| 9   | Go-to-market — funnel                              |
| 10  | Projecció financera (3 anys)                       |
| 11  | Pla d'implementació + pressupost (Mermaid Gantt)   |
| 12  | Conclusió + ask                                    |

Cada slide es separa amb `---` precedit per metadades opcionals (`layout: ...`).

## Restriccions de l'enunciat

- ✅ Màxim 12 pàgines
- ✅ Format PDF
- ✅ Sense enllaços a vídeos
- ✅ En català
- ✅ Material per defensar davant consell d'administració (10 min de defensa oral)

## Recomanacions per a la defensa oral (10 min)

| Slide            | Temps suggerit | Punts clau a verbalitzar                       |
| ---------------- | -------------- | ---------------------------------------------- |
| 1 (portada)      | 15 s           | Presentació + frase-clau                       |
| 2 (problema)     | 60 s           | Tres dolors + estadística RGPD (4% facturació) |
| 3 (solució)      | 60 s           | Frase de posicionament repetida + 4 pilars     |
| 4 (demo)         | 90 s           | Recorregut visual ràpid                        |
| 5 (arquitectura) | 60 s           | "El codi mai surt del Fog"                     |
| 6 (moat)         | 90 s           | Punt fort: per què no ens copien               |
| 7 (negoci)       | 75 s           | Llicència FSL + tiers                          |
| 8 (seguretat)    | 45 s           | Compliance per disseny                         |
| 9 (GTM)          | 60 s           | Funnel OSS → Cloud                             |
| 10 (financers)   | 60 s           | ARR projectada any 3                           |
| 11 (pla)         | 60 s           | Roadmap i equip mínim                          |
| 12 (ask)         | 25 s           | "El codi es queda a casa" + ask de 215 k€      |
| **Total**        | **~10 min**    |                                                |
