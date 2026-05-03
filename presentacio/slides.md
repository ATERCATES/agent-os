---
theme: seriph
title: Ialització — La fase 2 de la digitalització
info: Manifesto sobre la nova era de programació amb agents IA i ClaudeDeck com a infraestructura per a la transició
class: text-left
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: fade
mdc: true
aspectRatio: 16/9
canvasWidth: 1280
colorSchema: dark
defaults:
  layout: default
fonts:
  sans: "Manrope"
  serif: "Fraunces"
  mono: "JetBrains Mono"
themeConfig:
  primary: "#ff6b35"
---

<div class="hero-grid h-full">

<div class="flex-between">
  <span class="hero-mark">Manifesto · Ialització</span>
  <span class="hero-mark">v1.0 · 2026.05.03</span>
</div>

<div class="flex flex-col justify-center gap-8">
  <div>
    <span class="eyebrow">La fase 2 de la digitalització</span>
    <h1 class="hero-title"><em>Ialització.</em></h1>
    <p style="margin-top: 1rem; font-family: var(--font-display); font-weight: 300; font-size: 1.9rem; line-height: 1.15; letter-spacing: -0.015em; color: var(--text-muted); max-width: 30ch;">
      La nova era de treballar amb agents IA, no només amb eines digitals.
    </p>
  </div>
  <p class="hero-subtitle">
    Quan els processos ja són digitals, el següent salt no és més software. És treballar de costat amb agents IA. Aquesta és la infraestructura per a fer-ho possible.
  </p>
</div>

<div class="hero-meta">
  <span><strong>Javier</strong> · ClaudeDeck</span>
  <span>València · Maig 2026</span>
  <span class="text-right">01 / 19</span>
</div>

</div>

<style>
.slidev-layout { padding: 4rem 4.5rem; }
</style>

---

<div class="slide-tag"><span class="accent-dot"></span>El moment</div>
<div class="page-number">02 / 19</div>

<div class="split-asymmetric h-full">

<div class="flex flex-col justify-center" style="gap: 2rem;">
  <div>
    <span class="eyebrow">Història recent</span>
    <h1>Una <em style="color:var(--accent);font-style:italic;">nova fase</em><br>en la transformació<br>de les empreses.</h1>
  </div>
  <div class="text-sm" style="color:var(--text-muted); max-width: 38ch;">
    No és més digitalització. És el següent salt: deixar que els agents IA executin part del treball juntament amb els humans, amb la mateixa naturalitat amb la qual avui s'usa el correu electrònic.
  </div>
</div>

<div class="flex flex-col gap-6 justify-center">

<div class="pillar">
  <span class="pillar-num">1990 — 2010 / Era 1</span>
  <h3 class="pillar-title">Informatització</h3>
  <p class="pillar-body">Els processos passen del paper a l'ordinador. Cada empleat aprèn a fer servir software per fer la seva feina diària.</p>
</div>

<div class="pillar">
  <span class="pillar-num">2010 — 2025 / Era 2</span>
  <h3 class="pillar-title">Digitalització</h3>
  <p class="pillar-body">Els processos passen al núvol, mòbils i APIs. Tot connectat, accessible des de qualsevol lloc, sempre disponible.</p>
</div>

<div class="pillar" style="border-top-color: var(--accent);">
  <span class="pillar-num" style="color: var(--accent);">2025 — ? / Era 3</span>
  <h3 class="pillar-title" style="color: var(--accent);">Ialització</h3>
  <p class="pillar-body">Els processos es comparteixen amb agents IA. Els humans dirigeixen, els agents executen. La feina no es fa amb eines: <strong>es fa amb un equip</strong>.</p>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>El paradigma</div>
<div class="page-number">03 / 19</div>

<div class="h-full flex flex-col justify-between">

<div>
  <span class="eyebrow">El canvi de model</span>
  <h1>De fer servir software<br>a <em style="color:var(--accent);font-style:italic;">comandar agents.</em></h1>
</div>

<div class="cols-2" style="grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: stretch;">

<div class="card" style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem; opacity: 0.7;">
  <span class="tag">Era digital · 2010 — 2025</span>
  <h3 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 400;">L'humà fa el treball<br>amb l'ajuda d'eines.</h3>
  <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.5rem;">
    <li>→ El dev escriu cada línia de codi</li>
    <li>→ El gestor escriu cada email</li>
    <li>→ L'analista interpreta cada dada</li>
    <li>→ Productivitat lineal a hores treballades</li>
  </ul>
</div>

<div class="card" style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem; border-color: var(--accent); background: linear-gradient(160deg, var(--accent-glow), var(--surface) 60%);">
  <span class="tag tag-accent">Era ialitzada · 2025 — ?</span>
  <h3 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 400;">L'humà <em style="color:var(--accent);">dirigeix</em><br>un equip d'agents.</h3>
  <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: var(--text); display: flex; flex-direction: column; gap: 0.5rem;">
    <li>→ El dev orquestra agents que escriuen codi</li>
    <li>→ El gestor delega tasques recurrents</li>
    <li>→ L'analista valida i interpreta resultats</li>
    <li>→ Productivitat <strong>multiplicativa</strong> a quants agents pots dirigir</li>
  </ul>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>La infraestructura</div>
<div class="page-number">04 / 19</div>

<div class="h-full flex flex-col" style="gap: 2.5rem; justify-content: center;">

<div>
  <span class="eyebrow">Per fer-ho possible</span>
  <h1>ClaudeDeck.</h1>
  <p class="lead" style="margin-top: 1rem; max-width: 60ch;">
    La plataforma que dona a qualsevol empresa la infraestructura humana i tècnica per començar a treballar amb agents IA <em>avui mateix</em>.
  </p>
</div>

<div class="cols-4">

<div class="card-elevated">
  <span class="tag tag-accent">01</span>
  <h3 style="margin-top: 1rem;">Potència</h3>
  <p style="font-size: 0.8rem; line-height: 1.5;">Orquestració d'agents en paral·lel, terminal completa, accés total al filesystem, MCP marketplace per estendre capacitats.</p>
</div>

<div class="card-elevated">
  <span class="tag tag-accent">02</span>
  <h3 style="margin-top: 1rem;">Versatilitat</h3>
  <p style="font-size: 0.8rem; line-height: 1.5;">Multi-provider (Claude, GPT, Gemini, locals), multi-stack, multi-projecte, multi-dispositiu via PWA. Port forwarding integrat.</p>
</div>

<div class="card-elevated">
  <span class="tag tag-accent">03</span>
  <h3 style="margin-top: 1rem;">Onboarding</h3>
  <p style="font-size: 0.8rem; line-height: 1.5;">Reducció de la corba d'adopció: governança per defecte, observabilitat, plantilles d'agent, comunitat amb best practices.</p>
</div>

<div class="card-elevated">
  <span class="tag tag-accent">04</span>
  <h3 style="margin-top: 1rem;">Sobirania</h3>
  <p style="font-size: 0.8rem; line-height: 1.5;">Codi i dades viuen al servidor corporatiu. Compliment RGPD, ISO 27001 i NIS2 per disseny.</p>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Demo</div>
<div class="page-number">05 / 19</div>

<div class="h-full flex flex-col">

<div class="flex-between mb-6">
  <div>
    <span class="eyebrow">La plataforma en acció</span>
    <h2>Veure-la funcionant.</h2>
  </div>
  <span class="tag">Captures de producte</span>
</div>

<div class="grid grid-cols-2 gap-5 flex-1">

<div class="placeholder">
  <div>
    <span class="placeholder-label">Captura 01</span>
    <h3 class="placeholder-title">Dashboard d'agents</h3>
    <p class="placeholder-desc">Vista general de projectes amb agents actius, tokens i estat de cada execució.</p>
  </div>
  <span class="tag" style="align-self:flex-end;">/dashboard</span>
</div>

<div class="placeholder">
  <div>
    <span class="placeholder-label">Captura 02</span>
    <h3 class="placeholder-title">Conductor — orquestració</h3>
    <p class="placeholder-desc">Múltiples agents treballant en paral·lel sobre un mateix projecte, coordinats per l'humà.</p>
  </div>
  <span class="tag" style="align-self:flex-end;">/conductor</span>
</div>

<div class="placeholder">
  <div>
    <span class="placeholder-label">Captura 03</span>
    <h3 class="placeholder-title">PWA mòbil</h3>
    <p class="placeholder-desc">Continua dirigint els agents des de qualsevol dispositiu, sense perdre el context de la sessió.</p>
  </div>
  <span class="tag" style="align-self:flex-end;">/mobile</span>
</div>

<div class="placeholder">
  <div>
    <span class="placeholder-label">Captura 04</span>
    <h3 class="placeholder-title">Observabilitat</h3>
    <p class="placeholder-desc">Mètriques d'activitat, costos i productivitat agregada de tot l'equip d'agents per projecte.</p>
  </div>
  <span class="tag" style="align-self:flex-end;">/insights</span>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Tecnologies</div>
<div class="page-number">06 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">Tecnologies habilitadores digitals</span>
  <h2>Quines THD activa<br>la <em style="color:var(--accent);font-style:italic;">ialització.</em></h2>
</div>

<div class="text-sm">

| THD          | Aplicació concreta                                                       | Pes a ClaudeDeck            |
| ------------ | ------------------------------------------------------------------------ | --------------------------- |
| **IA / ML**  | Agents que executen tasques amb context. Multi-provider intercanviable.  | **Central** — el cor        |
| **Cloud**    | Distribució Cloud / Fog / Edge / Mist. Multi-tenant, multi-dispositiu.   | **Alt** — infraestructura   |
| **Big Data** | Logs JSONL agregats, observabilitat, detecció de patrons d'ús i de cost. | **Mitjà** — observabilitat  |
| **IoT**      | Sensors hardware dev (GPU, energia), badges per Zero Trust contextual.   | **Baix** — fase 2+ opcional |

</div>

<p style="font-size: 0.85rem; color: var(--text-muted); max-width: 70ch;">
La ialització no és <em>només</em> IA: és la combinació de IA, Cloud i Big Data en una arquitectura coherent. L'IoT entra en una segona fase per a casos específics.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Arquitectura</div>
<div class="page-number">07 / 19</div>

<div class="split-asymmetric-rev h-full">

<div class="flex flex-col justify-center">
  <span class="eyebrow">Distribució per capes</span>
  <h2>L'arquitectura<br>que demanen<br>els agents.</h2>
  <p style="margin-top: 1.5rem; max-width: 32ch;">Els agents IA necessiten <strong>execució real</strong> sobre filesystem complet i processos persistents. No funcionen bé en IDEs lleugers ni en containers restringits.</p>
  <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
    <span class="tag">Filesystem total</span>
    <span class="tag">Tmux persistent</span>
    <span class="tag">Multi-provider</span>
  </div>
</div>

<div class="flex flex-col gap-3 justify-center">

<div class="layer">
  <span class="layer-tag">Cloud</span>
  <div class="layer-content">
    <span class="layer-chip">Anthropic</span>
    <span class="layer-chip">OpenAI</span>
    <span class="layer-chip">Gemini</span>
    <span class="layer-chip">Models locals</span>
  </div>
</div>

<div class="layer-arrow">↑ models intercanviables ↑</div>

<div class="layer" style="border-color: var(--accent);">
  <span class="layer-tag">Fog</span>
  <div class="layer-content">
    <span class="layer-chip">ClaudeDeck</span>
    <span class="layer-chip">SQLite</span>
    <span class="layer-chip">tmux</span>
    <span class="layer-chip">MCP servers</span>
  </div>
</div>

<div class="layer-arrow">↑ orquestració d'agents ↑</div>

<div class="layer">
  <span class="layer-tag">Edge</span>
  <div class="layer-content">
    <span class="layer-chip">Filesystem complet</span>
    <span class="layer-chip">Procés persistent</span>
  </div>
</div>

<div class="layer-arrow">↑ accés des de qualsevol lloc ↑</div>

<div class="layer">
  <span class="layer-tag">Mist</span>
  <div class="layer-content">
    <span class="layer-chip">Laptop</span>
    <span class="layer-chip">Tauleta</span>
    <span class="layer-chip">Mòbil PWA</span>
  </div>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Dades</div>
<div class="page-number">08 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">Cicle de vida de les dades</span>
  <h2>Què passa amb el codi<br>i amb els prompts.</h2>
</div>

<div class="cols-3" style="gap: 0.85rem;">

<div class="card-bordered-accent">
  <span class="pillar-num">01 / Recollida</span>
  <h3 style="margin: 0.4rem 0;">Prompts i context</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Prompts del dev, codi del projecte, context de MCP servers actius.</p>
</div>

<div class="card-bordered-accent">
  <span class="pillar-num">02 / Emmagatzematge</span>
  <h3 style="margin: 0.4rem 0;">Sessions JSONL</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Al Fog corporatiu. El codi mai surt del servidor de l'empresa.</p>
</div>

<div class="card-bordered-accent">
  <span class="pillar-num">03 / Processament</span>
  <h3 style="margin: 0.4rem 0;">Scrubbing PII</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Detecció i ofuscació de dades sensibles abans de cap trucada externa.</p>
</div>

<div class="card-bordered-accent">
  <span class="pillar-num">04 / Anàlisi</span>
  <h3 style="margin: 0.4rem 0;">Mètriques agregades</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Productivitat per equip, cost per projecte, patrons d'ús.</p>
</div>

<div class="card-bordered-accent">
  <span class="pillar-num">05 / Visualització</span>
  <h3 style="margin: 0.4rem 0;">Dashboards</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Observabilitat per role: dev, lead, finance, compliance.</p>
</div>

<div class="card-bordered-accent">
  <span class="pillar-num">06 / Arxiu</span>
  <h3 style="margin: 0.4rem 0;">Retenció i auditoria</h3>
  <p style="font-size: 0.75rem; color: var(--text-muted);">Polítiques configurables. Audit log immutable per compliance.</p>
</div>

</div>

<p style="font-size: 0.78rem; color: var(--text-muted); max-width: 70ch;">
Totes les etapes succeeixen al <strong>Fog corporatiu</strong>. Només prompts amb scrubbing surten cap al Cloud.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Seguretat</div>
<div class="page-number">09 / 19</div>

<div class="split-asymmetric h-full">

<div class="flex flex-col justify-center" style="gap: 1.5rem;">
  <div>
    <span class="eyebrow">Zero Trust + RGPD</span>
    <h2>Compliance<br>per disseny.</h2>
  </div>
  <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 32ch;">
    Verificació contínua, mínim privilegi i microsegmentació aplicades a cada capa de la plataforma.
  </p>
  <div class="cols-3" style="gap: 0.6rem;">
    <div class="compare-cell" style="padding: 0.6rem 0.7rem;">
      <span class="compare-tag" style="font-size: 0.55rem;">RGPD</span>
      <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35;">Drets per disseny: accés, rectificació, supressió, portabilitat.</p>
    </div>
    <div class="compare-cell" style="padding: 0.6rem 0.7rem;">
      <span class="compare-tag" style="font-size: 0.55rem;">ISO 27001</span>
      <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35;">Encaix amb controls A.5–A.18.</p>
    </div>
    <div class="compare-cell" style="padding: 0.6rem 0.7rem;">
      <span class="compare-tag" style="font-size: 0.55rem;">NIS2</span>
      <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.35;">Traçabilitat completa d'accions amb agents.</p>
    </div>
  </div>
</div>

<div class="text-sm">

| Capa            | Mesura concreta                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| **Identitat**   | SSO corporatiu (SAML/OIDC), MFA obligatori, RBAC granular per projecte.      |
| **Dispositius** | Només PWA des de dispositius gestionats (MDM); device fingerprinting.        |
| **Xarxa**       | Túnel xifrat empresarial; port forwarding sense exposar serveis a internet.  |
| **Aplicacions** | Microsegmentació per equip; agents amb permisos mínims via MCP allowlist.    |
| **Dades**       | Codi mai surt del Fog; scrubbing PII en prompts; auditoria completa de logs. |

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Riscos</div>
<div class="page-number">10 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">Anàlisi de riscos</span>
  <h2>Què pot anar malament<br>i com es mitiga.</h2>
</div>

<div class="text-sm">

| Risc                             | Probabilitat | Impacte | Mitigació                                                         |
| -------------------------------- | ------------ | ------- | ----------------------------------------------------------------- |
| **Fuga de codi propietari**      | Alta         | Crític  | Self-host al Fog, scrubbing PII, allowlist d'MCP servers          |
| **Allucinacions de l'agent**     | Mitjana      | Mitjà   | Revisió humana obligatòria, tests automàtics, traçabilitat        |
| **Cost API descontrolat**        | Alta         | Mitjà   | Quotes per equip, alertes de pressupost, multi-provider barat     |
| **Vendor lock-in**               | Mitjana      | Alt     | Capa d'abstracció multi-provider; canvi de model sense reescriure |
| **Resistència cultural**         | Alta         | Alt     | Formació, casos pilot, dev advocates, mètriques visibles          |
| **Compliance gap (RGPD / NIS2)** | Mitjana      | Crític  | Auditoria contínua, certificacions, procés ISO 27001              |

</div>

<p style="font-size: 0.8rem; color: var(--text-muted); max-width: 70ch;">
La majoria dels riscos no són exclusius de la ialització — són els mateixos de qualsevol adopció tecnològica. La diferència és que <strong>amb una arquitectura adequada es controlen des del primer dia</strong>.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>KPIs</div>
<div class="page-number">11 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">Què mesurar</span>
  <h2>Els objectius d'una<br>empresa <em style="color:var(--accent);font-style:italic;">ialitzada</em>.</h2>
</div>

<div class="text-sm">

| Objectiu estratègic                | KPI concret                          | Meta any 1   |
| ---------------------------------- | ------------------------------------ | ------------ |
| **Acceleració de delivery**        | % tasques amb assistència d'agent    | > 50%        |
| **Reducció de càrrega repetitiva** | Hores estalviades / dev / setmana    | 8 – 12 h     |
| **Onboarding més ràpid**           | Temps fins productivitat de nou dev  | de 5 d a 1 d |
| **Cost API sota control**          | Cost per dev / mes                   | < 100 €      |
| **Cobertura de compliance**        | % codi auditat per agents amb logs   | 100 %        |
| **Adopció interna**                | % devs amb sessions actives mensuals | > 80 %       |

</div>

<p style="font-size: 0.8rem; color: var(--text-muted); max-width: 70ch;">
Cap d'aquests indicadors és teòric. Tots es poden mesurar des de la primera setmana amb la capa d'observabilitat de ClaudeDeck.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Aplicabilitat</div>
<div class="page-number">12 / 19</div>

<div class="h-full flex flex-col">

<div class="mb-5">
  <span class="eyebrow">A qui aplica la ialització</span>
  <h2>Qualsevol empresa.<br>Diferents nivells de maduresa.</h2>
</div>

<div class="text-sm flex-1">

| Sector                                | Cas d'ús primari                            | Maduresa actual | Encaix de ClaudeDeck                     |
| ------------------------------------- | ------------------------------------------- | --------------- | ---------------------------------------- |
| **Terciari** · software i consultoria | Acceleració de desenvolupament i delivery   | Mitjana–alta    | **Directe** — adopció immediata          |
| **Terciari** · finances, legal, salut | Automatització de processos amb agents      | Baixa           | **Alt** — la sobirania és crítica        |
| **Terciari** · educació, mitjans      | Generació i revisió de continguts a escala  | Baixa           | **Mitjà** — via departaments tècnics     |
| **Secundari** · indústria 4.0         | Manteniment predictiu, automatització OT    | Variable        | **Mitjà** — entra via IT corporatiu      |
| **Primari** · agro, aqua, energia     | Models de predicció, automatització de camp | Baixa           | **Indirecte** — via partners tecnològics |

</div>

<p style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted); max-width: 70ch;">
La ialització no demana canviar de sector ni de model de negoci. Demana incorporar agents IA als processos existents on tinguin sentit. <strong style="color: var(--text);">ClaudeDeck és la rampa d'entrada</strong>, qualsevol que sigui la maduresa actual.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Models d'adopció</div>
<div class="page-number">13 / 19</div>

<div class="h-full flex flex-col">

<div class="flex-between mb-6">
  <div>
    <span class="eyebrow">Com s'incorpora l'eina</span>
    <h2>Camins d'entrada.</h2>
  </div>
  <div style="text-align: right; max-width: 38ch;">
    <span class="tag tag-accent">Llicència oberta · FSL</span>
    <p style="font-size: 0.78rem; margin-top: 0.5rem; color: var(--text-muted);">Codi públic i auditable. Ús personal i empresarial intern lliures. Conversió a Apache 2.0 als 2 anys.</p>
  </div>
</div>

<div class="cols-4 flex-1">

<div class="tier">
  <span class="tier-audience">Devs i equips</span>
  <h3 class="tier-name">Self-Hosted</h3>
  <p class="tier-features" style="margin-top: 1rem;">Instal·lació al servidor propi. Funcionalitat completa. Comunitat i MCP marketplace.</p>
  <p style="margin-top: auto; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim);">Punt d'entrada</p>
</div>

<div class="tier">
  <span class="tier-audience">Devs individuals</span>
  <h3 class="tier-name">Cloud Personal</h3>
  <p class="tier-features" style="margin-top: 1rem;">Cloud gestionat sense haver de mantenir servidor. Ideal per provar el paradigma sense fricció.</p>
  <p style="margin-top: auto; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim);">Adopció ràpida</p>
</div>

<div class="tier tier-featured">
  <span class="tier-audience">Equips 5–50</span>
  <h3 class="tier-name">Cloud Team</h3>
  <p class="tier-features" style="margin-top: 1rem;">Col·laboració entre devs, SSO, observabilitat avançada, RBAC per projecte.</p>
  <p style="margin-top: auto; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);">Ialització d'equip</p>
</div>

<div class="tier">
  <span class="tier-audience">Empreses 50+</span>
  <h3 class="tier-name">Enterprise</h3>
  <p class="tier-features" style="margin-top: 1rem;">Self-host comercial amb SLA, certificacions i auditoria. Suport dedicat per al rollout.</p>
  <p style="margin-top: auto; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-dim);">Ialització corporativa</p>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Pressupost</div>
<div class="page-number">14 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">Què costa ialitzar-se</span>
  <h2>Inversió orientativa<br>per mida d'empresa.</h2>
</div>

<div class="cols-3">

<div class="card-elevated">
  <span class="tier-audience">Equip petit · 10 devs</span>
  <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; margin: 0.5rem 0;">15 – 25k€<small style="font-family: var(--font-body); font-size: 0.75rem; color: var(--text-muted);"> / any</small></h3>
  <ul style="list-style: none; padding: 0; margin: 0.75rem 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.6;">
    <li>· API consum: ~6 – 12 k€</li>
    <li>· ClaudeDeck Personal x10: ~2 k€</li>
    <li>· Infra self-host: ~1 k€</li>
    <li>· Formació + onboarding: 5 – 10 k€</li>
  </ul>
</div>

<div class="card-elevated">
  <span class="tier-audience">Equip mitjà · 50 devs</span>
  <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; margin: 0.5rem 0;">80 – 150k€<small style="font-family: var(--font-body); font-size: 0.75rem; color: var(--text-muted);"> / any</small></h3>
  <ul style="list-style: none; padding: 0; margin: 0.75rem 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.6;">
    <li>· API consum: ~40 – 80 k€</li>
    <li>· ClaudeDeck Team: ~30 k€</li>
    <li>· Infra empresarial: ~5 k€</li>
    <li>· Formació + dev advocates: 15 – 30 k€</li>
  </ul>
</div>

<div class="card-elevated" style="border-color: var(--accent);">
  <span class="tier-audience" style="color: var(--accent);">Empresa · 200+ devs</span>
  <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; margin: 0.5rem 0;">350k€ – 1M€<small style="font-family: var(--font-body); font-size: 0.75rem; color: var(--text-muted);"> / any</small></h3>
  <ul style="list-style: none; padding: 0; margin: 0.75rem 0 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.6;">
    <li>· API consum: ~200 – 600 k€</li>
    <li>· ClaudeDeck Enterprise: contracte</li>
    <li>· Infra + DR + compliance: ~50 k€</li>
    <li>· Formació corporativa: 50 – 100 k€</li>
  </ul>
</div>

</div>

<p style="font-size: 0.8rem; color: var(--text-muted); max-width: 70ch;">
Estimacions a partir de costos típics de mercat (Anthropic / OpenAI / Gemini, llicències empresarials i formació). El payback típic és de <strong>6 a 9 mesos</strong> via productivitat recuperada.
</p>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Beneficis</div>
<div class="page-number">15 / 19</div>

<div class="h-full flex flex-col" style="gap: 2rem; justify-content: center;">

<div>
  <span class="eyebrow">Què canvia per qui adopta</span>
  <h2>L'impacte de la <em style="color:var(--accent);font-style:italic;">ialització.</em></h2>
</div>

<div class="cols-3">
  <div class="card-elevated">
    <span class="tier-audience">Operatiu</span>
    <h3 style="margin: 0.5rem 0 0.75rem; font-family: var(--font-display); font-size: 1.4rem; font-weight: 400;">Capacitat<br>multiplicada.</h3>
    <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">Cada dev passa de fer una feina a dirigir 3–5 agents en paral·lel sobre tasques diferents.</p>
  </div>
  <div class="card-elevated">
    <span class="tier-audience">Estratègic</span>
    <h3 style="margin: 0.5rem 0 0.75rem; font-family: var(--font-display); font-size: 1.4rem; font-weight: 400;">Talent<br>amplificat.</h3>
    <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">Els equips no necessiten créixer linealment per agafar més projectes. Els agents absorbeixen la càrrega repetitiva.</p>
  </div>
  <div class="card-elevated" style="border-color: var(--accent);">
    <span class="tier-audience">Cultural</span>
    <h3 style="margin: 0.5rem 0 0.75rem; font-family: var(--font-display); font-size: 1.4rem; font-weight: 400;">Treball<br>més creatiu.</h3>
    <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">L'humà puja d'executor a director. Es dedica a problemes nous; els repetitius els fan els agents.</p>
  </div>
</div>

<div class="cols-3" style="gap: 0.75rem;">
  <div class="compare-cell">
    <span class="compare-tag">Velocitat</span>
    <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Cicles de lliurament 3–5× més curts en projectes adequats per agents.</p>
  </div>
  <div class="compare-cell">
    <span class="compare-tag">Cost marginal</span>
    <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Una hora d'agent costa cèntims; una hora humana costa desenes d'euros.</p>
  </div>
  <div class="compare-cell">
    <span class="compare-tag">Onboarding</span>
    <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">Nou empleat productiu en dies, no setmanes — l'agent guia i contextualitza.</p>
  </div>
</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Equips</div>
<div class="page-number">16 / 19</div>

<div class="h-full flex flex-col" style="gap: 1.75rem; justify-content: center;">

<div>
  <span class="eyebrow">L'humà a l'era ialitzada</span>
  <h2>Què canvia<br>per als equips.</h2>
</div>

<div class="text-sm">

| Rol                 | Era digital (avui)                       | Era ialitzada                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------- |
| **Dev junior**      | Escriu codi mecànic i resol bugs simples | Revisa i valida agents; aprèn més de pressa    |
| **Dev sènior**      | Mentor + arquitecte d'una part del codi  | Orquestrador d'equips d'agents                 |
| **Tech lead**       | Coordinador d'equip humà                 | Dissenyador d'estratègia agent-driven          |
| **Product manager** | Especifica per a humans que executaran   | Defineix què poden fer els agents directament  |
| **Rols nous**       | —                                        | Agent ops · Prompt engineer · Compliance audit |

</div>

<div class="cols-3" style="gap: 0.75rem;">
  <div class="compare-cell">
    <span class="compare-tag">Formació</span>
    <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Programa intern d'<strong>agent literacy</strong> obligatori per a tots els rols tècnics.</p>
  </div>
  <div class="compare-cell">
    <span class="compare-tag">Cultura</span>
    <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Acceptar que la <strong>velocitat creativa</strong> es premia per damunt del codi escrit a mà.</p>
  </div>
  <div class="compare-cell">
    <span class="compare-tag">Carrera</span>
    <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Dos camins: especialista en domini tècnic vs orquestrador d'agents.</p>
  </div>
</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Comunitat</div>
<div class="page-number">17 / 19</div>

<div class="split-2 h-full">

<div class="flex flex-col justify-center" style="gap: 1.75rem;">
  <div>
    <span class="eyebrow">Construir-ho junts</span>
    <h2>L'eina creix<br>amb la comunitat.</h2>
  </div>
  <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.55; max-width: 36ch;">
    ClaudeDeck és una plataforma oberta. La comunitat aporta MCP servers, plantilles d'agent i traduccions; cada empresa que l'adopta enriqueix el ecosistema per a la resta.
  </p>
</div>

<div>

<div class="funnel-stage" style="padding: 0.65rem 0;">
  <span class="funnel-num">01</span>
  <div>
    <h3 class="funnel-title" style="font-size: 0.95rem;">Codi obert</h3>
    <p class="funnel-body" style="font-size: 0.75rem;">Tota la base auditable. Auto-hostable des de la primera línia. Llicència Functional Source.</p>
  </div>
</div>

<div class="funnel-stage" style="padding: 0.65rem 0;">
  <span class="funnel-num">02</span>
  <div>
    <h3 class="funnel-title" style="font-size: 0.95rem;">MCP marketplace</h3>
    <p class="funnel-body" style="font-size: 0.75rem;">Els agents s'estenen amb capacitats afegides per la comunitat: bases de dades, SaaS, hardware.</p>
  </div>
</div>

<div class="funnel-stage" style="padding: 0.65rem 0;">
  <span class="funnel-num">03</span>
  <div>
    <h3 class="funnel-title" style="font-size: 0.95rem;">Plantilles d'agent</h3>
    <p class="funnel-body" style="font-size: 0.75rem;">Configuracions provades per casos d'ús concrets, compartides i versionades.</p>
  </div>
</div>

<div class="funnel-stage" style="padding: 0.65rem 0;">
  <span class="funnel-num">04</span>
  <div>
    <h3 class="funnel-title" style="font-size: 0.95rem;">Coneixement compartit</h3>
    <p class="funnel-body" style="font-size: 0.75rem;">Best practices, casos d'estudi i playbooks per cada sector que entra a la ialització.</p>
  </div>
</div>

<div class="funnel-stage" style="padding: 0.65rem 0;">
  <span class="funnel-num">05</span>
  <div>
    <h3 class="funnel-title" style="font-size: 0.95rem; color: var(--accent);">Standard de fet</h3>
    <p class="funnel-body" style="font-size: 0.75rem;">Cada nova adopció reforça la posició: més plantilles, més MCP, més casos resolts per a tothom.</p>
  </div>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Visió</div>
<div class="page-number">18 / 19</div>

<div class="split-asymmetric h-full">

<div class="flex flex-col justify-center" style="gap: 1.75rem;">
  <div>
    <span class="eyebrow">Cap on va</span>
    <h2>Roadmap<br>de la ialització.</h2>
  </div>
  <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.55; max-width: 30ch;">
    El producte segueix una corba clara: primer obrir-ho a developers, després a equips, després a empreses senceres.
  </p>
</div>

<div class="flex flex-col justify-center" style="gap: 0.55rem;">

<div class="card" style="display: grid; grid-template-columns: 90px 1fr; gap: 1rem; align-items: center; padding: 0.85rem 1.1rem;">
  <span class="layer-tag" style="font-size: 0.6rem;">Fase 1</span>
  <div>
    <h3 style="margin: 0; font-size: 0.9rem;">Obertura del codi · FSL</h3>
    <p style="font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted);">Llançament públic per a developers que volen experimentar amb agents.</p>
  </div>
</div>

<div class="card" style="display: grid; grid-template-columns: 90px 1fr; gap: 1rem; align-items: center; padding: 0.85rem 1.1rem;">
  <span class="layer-tag" style="font-size: 0.6rem;">Fase 2</span>
  <div>
    <h3 style="margin: 0; font-size: 0.9rem;">Cloud gestionat per a individus</h3>
    <p style="font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted);">Permet provar el paradigma sense fricció d'auto-hostar.</p>
  </div>
</div>

<div class="card" style="display: grid; grid-template-columns: 90px 1fr; gap: 1rem; align-items: center; padding: 0.85rem 1.1rem;">
  <span class="layer-tag" style="font-size: 0.6rem;">Fase 3</span>
  <div>
    <h3 style="margin: 0; font-size: 0.9rem;">Versió per a equips</h3>
    <p style="font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted);">SSO, col·laboració entre devs, observabilitat agregada per equip.</p>
  </div>
</div>

<div class="card" style="display: grid; grid-template-columns: 90px 1fr; gap: 1rem; align-items: center; padding: 0.85rem 1.1rem; border-color: var(--accent);">
  <span class="layer-tag" style="font-size: 0.6rem;">Fase 4</span>
  <div>
    <h3 style="margin: 0; font-size: 0.9rem;">Empresa · ialització a escala</h3>
    <p style="font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted);">Self-host comercial, compliance, suport dedicat per al rollout corporatiu.</p>
  </div>
</div>

<div class="card" style="display: grid; grid-template-columns: 90px 1fr; gap: 1rem; align-items: center; padding: 0.85rem 1.1rem; opacity: 0.7;">
  <span class="layer-tag" style="font-size: 0.6rem; color: var(--text-dim);">Fase 5+</span>
  <div>
    <h3 style="margin: 0; font-size: 0.9rem;">Expansió més enllà del codi</h3>
    <p style="font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted);">Extensió del paradigma a operacions, suport, anàlisi i altres rols no-dev.</p>
  </div>
</div>

</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Conclusió</div>
<div class="page-number">19 / 19</div>

<div class="h-full grid" style="grid-template-rows: 1fr auto auto;">

<div class="flex flex-col justify-center">
  <span class="eyebrow">El camí ja està obert</span>
  <div class="closing-mark">Benvinguts<br>a l'era<br><em>dels agents.</em></div>
</div>

<div style="margin-top: 2rem;">
  <p style="font-size: 1.1rem; color: var(--text); max-width: 64ch; line-height: 1.45;">
    La <strong style="color: var(--accent);">ialització</strong> no és una opció a llarg termini — està passant ja. ClaudeDeck és la infraestructura per fer aquest salt amb seguretat, sense reescriure els processos i sense dependre d'un sol proveïdor.
  </p>
</div>

<div class="closing-meta" style="margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
  <span><strong>Javier</strong> · ClaudeDeck</span>
  <span>Manifesto · v1.0</span>
  <span>3 de maig de 2026</span>
</div>

</div>

---

<div class="slide-tag"><span class="accent-dot"></span>Annex · Referències</div>
<div class="page-number">Annex</div>

<div class="h-full flex flex-col">

<div class="mb-6">
  <span class="eyebrow">Fonts que sustenten la visió</span>
  <h2>Per què aquesta lectura<br>no és casual.</h2>
</div>

<div class="cols-2" style="gap: 2rem; flex: 1;">

<div>

<div style="margin-bottom: 1.5rem;">
  <span class="layer-tag" style="font-size: 0.6rem; color: var(--accent);">Adopció empresarial</span>
  <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Anthropic</strong> · 2026 Agentic Coding Trends Report — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">resources.anthropic.com/hubfs/2026-Agentic-Coding-Trends-Report.pdf</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">McKinsey</strong> · The agentic organization: Contours of the next paradigm — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">mckinsey.com/capabilities/people-and-organizational-performance/our-insights/the-agentic-organization</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">OutSystems</strong> · Enterprise AI Agent Report 2026 — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">outsystems.com/news/enterprise-ai-agent-report-2026</span></li>
  </ul>
</div>

<div>
  <span class="layer-tag" style="font-size: 0.6rem; color: var(--accent);">Paradigma de programació</span>
  <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">CIO</strong> · How agentic AI will reshape engineering workflows in 2026 — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">cio.com/article/4134741/how-agentic-ai-will-reshape-engineering-workflows-in-2026</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">McKinsey</strong> · Redesigning technology workforce for the agentic AI era — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">mckinsey.com/capabilities/mckinsey-technology/our-insights/designing-an-end-to-end-technology-workforce-for-the-ai-first-era</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Anthropic</strong> · Claude Code · agentic coding system — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">anthropic.com/product/claude-code</span></li>
  </ul>
</div>

</div>

<div>

<div style="margin-bottom: 1.5rem;">
  <span class="layer-tag" style="font-size: 0.6rem; color: var(--accent);">Sobirania i context europeu</span>
  <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Comissió Europea</strong> · European approach to artificial intelligence — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Accenture</strong> · Europe Seeking Greater AI Sovereignty — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">newsroom.accenture.com/news/2025/europe-seeking-greater-ai-sovereignty-accenture-report-finds</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">McKinsey</strong> · Accelerating Europe's AI adoption: sovereign AI capabilities — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">mckinsey.com/industries/technology-media-and-telecommunications/our-insights/accelerating-europes-ai-adoption</span></li>
  </ul>
</div>

<div>
  <span class="layer-tag" style="font-size: 0.6rem; color: var(--accent);">Infraestructura i estàndards</span>
  <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; display: flex; flex-direction: column; gap: 0.5rem;">
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">McKinsey</strong> · Reimagining tech infrastructure for agentic AI — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">mckinsey.com/capabilities/mckinsey-technology/our-insights/reimagining-tech-infrastructure-for-and-with-agentic-ai</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Anthropic</strong> · Introducing the Model Context Protocol — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">anthropic.com/news/model-context-protocol</span></li>
    <li style="font-size: 0.72rem;"><strong style="color: var(--text);">Linux Foundation</strong> · Model Context Protocol (open standard) — <span style="color: var(--text-dim); font-family: var(--font-mono); font-size: 0.65rem;">modelcontextprotocol.io</span></li>
  </ul>
</div>

</div>

</div>

<p style="margin-top: 1.5rem; font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-dim); text-align: center;">12 fonts · consultades el 3 de maig de 2026</p>

</div>
