# Embedded Browser — Design Spec

**Date:** 2026-05-03
**Status:** Proposed (revision 2 — capability subdomain approach)
**Author:** brainstormed with Claude

## 1. Problem

ClaudeDeck runs on a server (often remote). Dev servers spawned by Claude — Vite, Next dev, Storybook, custom Node servers, Docker containers — bind to `localhost:PORT` on that machine. From the user's browser, those ports are unreachable without manual port forwarding.

The user wants to view those running apps **inside ClaudeDeck itself**, side-by-side with the chat and terminal, with two firm requirements:

1. **Zero changes to dev server config** (no `base`, no `allowedHosts`, no CORS allow-lists, no special HMR settings).
2. **Behaves exactly like `localhost`** — HMR works, absolute paths work, WebSockets work, Service Workers work where applicable.

The previous revision of this spec proposed a path-prefix proxy with Referer fallback. Review found that approach breaks Vite's default HMR (the WS URL has no path prefix, and Chromium does not send `Referer` on `new WebSocket(...)` upgrades). The current revision uses **capability subdomains** instead.

## 2. Approach in one sentence

Each browser pane allocates an unguessable subdomain `p<port>-<16hex>.<EMBED_DOMAIN>` that resolves to ClaudeDeck via a wildcard DNS record; ClaudeDeck routes by `Host` header, rewriting it to `localhost:PORT` before proxying. The dev server receives requests indistinguishable from a normal local connection.

## 3. Scope

### In

- Embed any HTTP service running on `localhost` / `127.0.0.1` of the ClaudeDeck server.
- Support typical dev servers: Vite, Next dev, Storybook, CRA, Astro dev, plain static servers, custom Node/Python servers, **with HMR and absolute paths working out of the box**.
- Mini-browser UX: URL bar (input only — see §5.3), back/forward via React-managed history stack, reload, "open in real browser tab".
- Quick-launch from `DevServerCard`.
- Multiple browser instances simultaneously, each with its own capability subdomain.
- Capability subdomains expire when the pane is closed (or when ClaudeDeck restarts).

### Out (explicit non-goals)

- Embedding remote hosts (anything outside `localhost`/`127.0.0.1`). Defense in depth against turning ClaudeDeck into an open SSRF gateway.
- Persisting allocated subdomains across server restarts (allocation is in-memory; pane re-allocates on restart).
- URL bar reflecting in-iframe navigation (cross-origin iframe can't be inspected; URL bar shows last URL we set).
- DevTools-like inspection.

### Deployment requirements (new)

This approach assumes:

1. **A wildcard DNS record** `*.embed.<host> → ClaudeDeck server IP`. One-time setup.
2. **A wildcard TLS certificate** for `*.embed.<host>`. Issued via DNS-01 challenge (Let's Encrypt). Auto-renewable. Caddy/Traefik handle this transparently.
3. **A reverse proxy / TLS terminator** in front of ClaudeDeck (Caddy, Traefik, nginx, Cloudflare) that forwards the `Host` header verbatim to ClaudeDeck on its internal HTTP port.

If the user's deploy is HTTP-only (e.g., LAN, no TLS), all four steps still apply at HTTP level (`http://*.embed.<host>`), but mixed-content rules require ClaudeDeck itself to be HTTP in that case. Documented as a setup variant.

If `EMBED_DOMAIN` is unset, the embedded-browser feature is disabled and the UI shows a one-line "Configure embed domain to enable" with a link to setup docs.

## 4. Architecture

### 4.1 Data flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Client browser                                                    │
│ ┌────────────────────────────────────────────┐                    │
│ │ ClaudeDeck UI at https://claudedeck.host   │                    │
│ │  └─ <iframe src=                           │                    │
│ │     "https://p3000-a8f3c2.embed.host/">    │                    │
│ └────┬───────────────────────────────────────┘                    │
└──────┼────────────────────────────────────────────────────────────┘
       │ DNS: *.embed.host → server IP (wildcard A/CNAME)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ TLS terminator (Caddy/Traefik/nginx) — wildcard cert *.embed.host │
└──────┬────────────────────────────────────────────────────────────┘
       │ HTTP, Host: p3000-a8f3c2.embed.host  preserved
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ ClaudeDeck server (server.ts)                                     │
│                                                                   │
│  request handler:                                                 │
│    1. Match Host against EMBED_DOMAIN suffix?                     │
│       → lookup capability prefix "p3000-a8f3c2" in allocation     │
│         table → port 3000                                         │
│       → proxyToLocalhost(3000, req, res)                          │
│    2. Otherwise → next.handle(req, res)                           │
│                                                                   │
│  upgrade handler (WS): same Host-based routing.                   │
└──────┬────────────────────────────────────────────────────────────┘
       │ Host rewritten to "localhost:3000"; no x-forwarded-* added
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Dev server on localhost:3000                                      │
│ (sees a normal localhost request; allowedHosts passes; HMR        │
│  client emits relative WS URL → loops back through subdomain)     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 New files

| File                                     | Purpose                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/embed-allocations.ts`           | In-memory map `Map<subdomainPrefix, { port, paneId, createdAt }>`. Exports `allocate(port, paneId): string` returning a fresh `p<port>-<16hex>` prefix using `crypto.randomBytes`, `release(prefix)`, `lookup(prefix): { port } \| null`, `releaseByPaneId(paneId)`. Stored on `globalThis` so HMR doesn't lose it (same pattern as `tunnels.ts:22-32`). |
| `src/lib/embed-proxy.ts`                 | Pure-ish proxy logic. `proxyHttp(port, req, res)` and `proxyWs(port, req, socket, head)`. Uses `http-proxy-3` (auditable, mantained fork of `http-proxy`). Sets `Host: localhost:PORT`, strips `X-Forwarded-*`, on response strips `X-Frame-Options`, `Content-Security-Policy[-Report-Only]`, `Strict-Transport-Security`. No body rewriting.           |
| `src/lib/embed-routing.ts`               | `resolveEmbedTarget(hostHeader: string): { port: number } \| null`. Matches `Host` against `EMBED_DOMAIN` suffix, extracts the prefix, calls `embed-allocations.lookup`. Pure, unit-testable.                                                                                                                                                            |
| `src/app/api/embed/route.ts`             | API: `POST /api/embed { port }` → allocates subdomain prefix, returns `{ subdomain, url }`. `DELETE /api/embed { subdomain }` → releases. Auth-gated by existing middleware.                                                                                                                                                                             |
| `src/components/views/BrowserPane.tsx`   | Renders `kind: "browser"` tabs. Top toolbar (back/forward/reload/URL/open-in-tab/close) + iframe. Owns history stack.                                                                                                                                                                                                                                    |
| `src/components/views/BrowserUrlBar.tsx` | URL input. Submission parses `localhost:PORT[/path]`, calls `POST /api/embed`, sets iframe src to the returned URL + path.                                                                                                                                                                                                                               |
| `src/data/embed.ts`                      | React Query hooks for allocate/release.                                                                                                                                                                                                                                                                                                                  |

### 4.3 Modified files

| File                                                        | Change                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server.ts`                                                 | Insert Host-based proxy routing **before** `handle(req, res, parsedUrl)`. Insert WS routing **before** the existing `/ws/terminal`/`/ws/updates` matchers. Use `req.headers.host` for the dispatch decision.                                                                         |
| `src/proxy.ts` (Next middleware)                            | No change. Embed subdomains do not hit Next at all — they're intercepted by `server.ts` based on Host.                                                                                                                                                                               |
| `src/lib/panes.ts`                                          | Promote `TabData` to discriminated union `SessionTabData \| BrowserTabData`. `BrowserTabData` holds `port`, `subdomain`, `currentPath`, `historyStack`, `historyIndex`. Add `createBrowserTab()` factory. `loadPaneState` migration: legacy tabs without `kind` → `kind: "session"`. |
| `src/components/PaneContext.tsx`                            | Narrow tab kind in every accessor. `attachSession` / `detachSession` / `reattachSession` become no-ops with a console.warn when called on browser tabs. Estimated ~18 narrowing sites (per reviewer audit).                                                                          |
| `src/components/Pane/index.tsx`                             | Switch on `tab.kind`: render existing session view or `<BrowserPane tab={...} />`.                                                                                                                                                                                                   |
| `src/components/Pane/DesktopTabBar.tsx`, `MobileTabBar.tsx` | Show globe icon and host:port label for browser tabs. The local `interface Tab` definitions need union treatment too.                                                                                                                                                                |
| `src/components/DevServers/DevServerCard.tsx`               | Add "Open here" button next to existing "Open in new tab" link. Click → focused-pane creates browser tab with port pre-filled.                                                                                                                                                       |
| `src/lib/env-setup.ts` (or equivalent)                      | Read `EMBED_DOMAIN` and `EMBED_PROTOCOL` env vars at boot. Validate format. If unset, embed feature disabled (UI hides "New browser tab" entry; API returns 503).                                                                                                                    |
| `docs/setup.md`                                             | New section: "Embedded Browser setup" with DNS, cert, reverse-proxy examples for Caddy, Traefik, nginx.                                                                                                                                                                              |

### 4.4 Capability subdomains: lifecycle and security

**Allocation.** When a `BrowserPane` mounts (or the user submits a URL), it `POST /api/embed { port }`. Server generates `crypto.randomBytes(8).toString("hex")` (16 hex chars, 64 bits), stores `{ prefix, port, paneId, createdAt }`, returns the full URL `https://p<port>-<hex>.<EMBED_DOMAIN>/`.

**Capability semantics.** The 64-bit random suffix is an unguessable token. Anyone who possesses the URL has access to the dev server through it for the lifetime of the allocation. This matches how `cloudflared` quick tunnels and Sandstorm grain URLs work. We do **not** layer additional auth on top because:

- The wildcard DNS makes the subdomain publicly resolvable, but the suffix has 2^64 entropy — brute force is infeasible.
- Cookies are not available on first request (different origin from ClaudeDeck), so cookie-based auth would require an extra round-trip; not worth the complexity.
- The user's deploy can place the wildcard subdomain behind their reverse-proxy ACL (e.g., Cloudflare Access) if they need stricter access control.

**Release.** When the `BrowserPane` unmounts, it `DELETE /api/embed { subdomain }`. Server removes the entry. Subsequent requests to that subdomain 404. Belt-and-braces: a periodic GC sweep removes entries older than 24h that have no associated open pane (defends against client-side cleanup failures).

**Server restart.** All allocations are lost; all open browser panes are dead. On reload, panes reallocate automatically from `BrowserTabData.port`. The `subdomain` field in localStorage is discarded if it doesn't match a current allocation.

**Cross-origin isolation.** The iframe is hosted on a subdomain that is cross-origin to ClaudeDeck. This means:

- Embedded app's JS cannot read `parent.document` / `parent.localStorage` / ClaudeDeck cookies.
- Embedded app's `fetch('/api/...')` hits the embed subdomain (proxied to dev server), not ClaudeDeck's API.
- Embedded app's cookies are scoped to its own subdomain — no leakage either way.

**Cookie-Domain caveat.** For this isolation to hold, the ClaudeDeck session cookie must NOT be issued with `Domain=.<host>`. Verify in `src/lib/auth/`: cookie should be issued without Domain attribute (defaults to host-only). If it currently uses `Domain=`, fix that first as part of this work.

### 4.5 Proxy behaviour

For each incoming HTTP request whose Host matches an embed allocation:

**Outgoing to dev server:**

- Set `Host: localhost:PORT`. Vite/Next/etc. see a local request.
- Do not add `X-Forwarded-*` headers (would tip off the dev server that it's behind a proxy and might trigger e.g. `trustProxy` logic).
- Forward all other headers verbatim (`Cookie`, `Authorization`, `User-Agent`, `Accept-*`, `Content-*`).

**Response back to client:**

- Strip `X-Frame-Options` and `Content-Security-Policy[-Report-Only]` (otherwise the iframe can render but the embedded app could refuse to be framed; in practice most dev servers don't set these, but defense in depth).
- Strip `Strict-Transport-Security` (we control the TLS termination, not the dev server).
- Pass through `Set-Cookie` as-is. Cookies are scoped to the embed subdomain by default; no path or domain rewriting needed.
- Pass body through unmodified.

**WebSocket upgrade:**

- Same Host-based routing.
- Forward all `Sec-WebSocket-*` headers.
- Same Host header rewriting.
- This is what makes Vite HMR work: Vite's client emits `new WebSocket(\`${proto}://${location.host}/\`)`→ connects to`wss://p3000-a8f.embed.host/`→ reverse proxy → ClaudeDeck → upgrade to`ws://localhost:3000/`with`Host: localhost:3000` → Vite's WS server accepts (Host check passes).

### 4.6 Auth gating

`POST /api/embed` and `DELETE /api/embed` go through the existing `src/proxy.ts` middleware → `validateSession`. So creating a capability is gated by an authenticated ClaudeDeck session.

The proxied embed subdomains themselves are **not** gated by ClaudeDeck session (they're a different origin and would need a separate cookie). Capability suffix is the auth.

## 5. UX

### 5.1 Browser as a tab kind

`TabData` becomes a discriminated union (same as previous revision):

```ts
export type TabData = SessionTabData | BrowserTabData;

export interface BrowserTabData {
  kind: "browser";
  id: string;
  port: number | null; // null until first URL submission
  subdomain: string | null; // server-allocated capability prefix
  currentPath: string; // last path navigated within the iframe (best effort)
  history: { entries: string[]; index: number };
}
```

Existing tabs without `kind` are migrated to `kind: "session"` on `loadPaneState`.

### 5.2 Entry points

1. **Tab bar "+" menu** — adds "New browser tab".
2. **`DevServerCard` "Open here"** — opens a browser tab in the focused pane pre-filled with `port = card.port`.
3. **`QuickSwitcher`** — typing `localhost:PORT` offers "Open in browser pane" as an action (nice-to-have, fine to defer).

If `EMBED_DOMAIN` is unset, all three entry points are hidden and the user sees a "Embedded browser disabled — see setup" pointer.

### 5.3 Pane chrome

```
┌───────────────────────────────────────────────────────────────┐
│ [←] [→] [↻]  http://localhost:3000/foo            [↗ ] [×]   │
├───────────────────────────────────────────────────────────────┤
│                       <iframe>                                 │
└───────────────────────────────────────────────────────────────┘
```

- URL bar is **input-only**: it shows the last URL the user submitted. We can't observe in-iframe navigation (cross-origin). Pressing Enter on a new URL allocates a new subdomain if the port changed, otherwise just sets `iframe.src` to the new path.
- Back/forward use a React-managed `history` stack: pushed on each user-initiated submission, popped on click. Setting `iframe.src` triggers a load; we don't try to use `iframe.contentWindow.history` (cross-origin).
- Reload sets `iframe.src` to the same URL with a cache-busting query param.
- "Open in real tab" opens the same subdomain URL externally — works because the subdomain is publicly resolvable (within capability lifetime).
- Close removes the tab; releases the subdomain.

### 5.4 Switching ports within one tab

If the user types `localhost:5173` in a tab that was previously embedding `localhost:3000`, we release the old subdomain and allocate a new one for 5173. The history stack persists (URLs across ports — the back button can take you back to the 3000 URL, which will re-allocate at that point).

## 6. Failure modes

| Symptom                                              | Cause                                                   | UX response                                                   |
| ---------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Iframe blank, no network activity                    | Dev server not running on that port                     | "No service on port PORT" overlay with retry button           |
| 502 from reverse proxy                               | Wildcard DNS misconfigured                              | Banner: "Embed subdomain unreachable. Check setup." with link |
| Browser shows cert error                             | TLS cert doesn't cover wildcard                         | Banner: "Embed cert invalid for `*.embed.host`. See setup."   |
| Allocation fails with 503                            | `EMBED_DOMAIN` unset                                    | "Embed feature disabled" — link to docs                       |
| HMR doesn't reconnect after dev server restart       | Allocation persisted but dev server bound to a new port | User reloads pane (same UX as cloudflared tunnels today)      |
| App hardcodes `http://localhost:OTHER:PORT` in links | Cross-origin from iframe; can't intercept               | Document. User opens a second pane for that port.             |

## 7. Testing

### 7.1 Unit tests

- `embed-routing.test.ts` — given `(host, allocations)`, assert resolved port or null. Cases: valid prefix, unknown prefix, malformed Host, Host with port, case-insensitive matching.
- `embed-allocations.test.ts` — `allocate` returns unique prefixes; `release` removes them; `releaseByPaneId` removes all entries for a pane; GC removes stale entries older than threshold.
- `embed-proxy.test.ts` — fake target HTTP server. Assert: `Host` rewritten, `X-Forwarded-*` not added, response `X-Frame-Options`/CSP stripped, body unchanged, Set-Cookie passed through.

### 7.2 Manual integration scenarios

The implementation plan must walk through each:

1. **Static server** (`python -m http.server 8000`) — sanity baseline.
2. **Vite dev** with default config — verify HMR over WS, verify absolute paths to `/@vite/client` work.
3. **Next dev** (`pnpm dlx create-next-app`) — verify `/_next/static/...` and Fast Refresh work.
4. **Storybook** — known to use absolute paths heavily.
5. **App that sets cookies** — verify cookies arrive at the dev server only, do not appear in ClaudeDeck.
6. **Two browser panes simultaneously** — different ports, independent capability subdomains, HMR loops back to the correct port for each.
7. **Pane state persistence** — refresh ClaudeDeck. Browser tabs should re-allocate subdomains on mount and load.
8. **Subdomain release** — close pane, verify the old subdomain 404s on direct curl.

### 7.3 Things NOT tested in CI

- Real reverse-proxy config (Caddy/Traefik). Manual checklist plus a sample `Caddyfile` in `docs/setup.md`.
- Cert renewal. Out of scope for this work; standard Caddy/certbot territory.

## 8. Open questions

1. **Subdomain length** — `p<port>-<16hex>` results in e.g. `p3000-a8f3c2d4e5f6789a.embed.host` (~37 chars before EMBED_DOMAIN). Long but unobtrusive. If preferred shorter, drop to 12 hex (48 bits), still secure but shorter URLs.
2. **HTTP-only setups** — should we support HTTP wildcards for LAN deploys, or insist on TLS? Lean toward supporting both, controlled by `EMBED_PROTOCOL` env.
3. **Subdomain stability across pane reloads** — currently each mount allocates fresh. Alternative: persist allocation to localStorage and reuse on reload, requiring a `GET /api/embed/{prefix}` to confirm it's still valid. Defer; cost vs. benefit unclear.
4. **`http-proxy-3` vs native streaming** — `http-proxy-3` is the maintained fork; choose during implementation. Public API of `embed-proxy.ts` is unaffected.
5. **DevServerCard already-running detection** — when the user clicks "Open here" and the dev server is in the `failed` state, do we offer to start it? Defer to UX iteration.

## 9. Estimated effort

(Revised from reviewer-corrected estimates)

- `embed-routing` + `embed-allocations` + tests: 0.5 day
- `embed-proxy` (HTTP + WS via http-proxy-3) + tests: 1 day
- Server.ts wiring + API routes: 0.5 day
- `TabData` union refactor + ~18 narrow sites + localStorage migration: 1 day
- `BrowserPane` + URL bar + history stack: 1 day
- DevServerCard "Open here" + tab bar polish + disabled-when-unconfigured states: 0.5 day
- Setup docs (Caddy + nginx examples) + manual matrix walk-through + bug headroom: 1.5 days

**Total: ~5.5 days.** Slightly less than reviewer's 6-7 estimate for the path-prefix variant because the proxy logic itself is much simpler (no Referer fallback, no cookie path rewriting, no body rewriting), and the security/CSRF questions are fully resolved by cross-origin isolation.

## 10. What this approach gives up vs. an ideal "magic local"

- **Requires deploy-side setup** (DNS + cert + reverse proxy). Acceptable per user decision.
- **URL bar in the embedded browser is input-only** — can't reflect in-iframe navigation. Minor UX loss.
- **Doesn't work in airgapped environments without TLS infra.** Acceptable.
- **One global `EMBED_DOMAIN`** — can't trivially switch domains per-instance. Fine for self-host.

## 11. What this approach gains vs. the previous path-prefix proposal

- Vite HMR works without touching dev server config. (Path-prefix variant didn't.)
- Next dev `/_next/...` works without Referer fallback heuristics.
- No CSRF self-targeting risk: iframe is cross-origin.
- No `localStorage` / DOM leakage from embedded app to ClaudeDeck.
- Simpler proxy implementation (no cookie path rewriting, no body rewriting, no Referer-based catch-all).
- Cleaner trust boundary: capability subdomain = capability URL, well-understood security model.
