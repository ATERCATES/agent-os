# Embedded Browser — Design Spec

**Date:** 2026-05-03
**Status:** Proposed (awaiting review)
**Author:** brainstormed with Claude

## 1. Problem

ClaudeDeck runs on a server (often remote). Dev servers spawned by Claude — Vite, Next dev, Storybook, custom Node servers, Docker containers — bind to `localhost:PORT` on that machine. From the user's browser, those ports are unreachable without manual port forwarding (SSH `-L`, k8s port-forward, Tailscale Funnel, etc.).

The user wants to view those running apps **inside ClaudeDeck itself**, side-by-side with the chat and terminal, without:

- Touching dev server config (`base`, `allowedHosts`, CORS, CSRF allow-lists).
- Setting up DNS, TLS, or wildcard subdomains.
- Requiring internet access (i.e., must work in air-gapped LAN deployments).

The result must feel "as if you opened `localhost:PORT` directly".

## 2. Scope

### In

- Embed any HTTP service running on `localhost` / `127.0.0.1` of the ClaudeDeck server.
- Support typical dev servers: Vite, Next dev, Storybook, CRA, Astro dev, plain static servers, custom Node/Python servers.
- Support HMR (WebSocket upgrade through the proxy).
- Mini-browser UX: URL bar, back/forward/reload, "open in new tab".
- Quick-launch from `DevServerCard` (no need to retype the URL).
- Multiple browser instances simultaneously, each independent.
- Escape hatch: per-instance toggle to switch from internal proxy to a `cloudflared` tunnel (already implemented in `src/lib/tunnels.ts`) when the proxy can't handle the target app.

### Out (explicit non-goals for this spec)

- Embedding remote hosts (anything outside `localhost`/`127.0.0.1`). Defense-in-depth against turning ClaudeDeck into an open SSRF gateway. Future work if needed.
- Persisting browser tab state across server restarts beyond `localStorage`.
- Service Worker support inside the proxied app (scopes don't survive path-prefix proxying; rare in dev).
- Devtools-like inspection (request panel, console mirror). Out of scope.
- Mobile-specific UX polish for the browser tab type. The MVP must render on mobile; rich gestures are deferred.

## 3. UX

### 3.1 Browser as a tab kind

The pane system today (`src/lib/panes.ts`) holds tabs that are bound to a session (`sessionId`, `sessionName`, etc.). The browser must coexist with sessions inside the same pane structure — same split layout, same tab bar, same focus model.

The cleanest way is to **promote `TabData` to a discriminated union**:

```ts
export type TabData = SessionTabData | BrowserTabData;

export interface SessionTabData {
  kind: "session";
  id: string;
  sessionId: string | null;
  sessionName: string | null;
  claudeProjectName: string | null;
  workingDirectory: string | null;
  attachedTmux: string | null;
  detachedTmux: string | null;
  detachedSessionId: string | null;
}

export interface BrowserTabData {
  kind: "browser";
  id: string;
  url: string; // current URL shown in iframe (server-side perspective)
  initialUrl: string; // the URL the user typed to open the tab
  mode: "proxy" | "tunnel";
  tunnelUrl?: string; // populated when mode === "tunnel"
}
```

Existing tabs in `localStorage` lack `kind`. On load, treat any tab without `kind` as `kind: "session"`. Migration is a one-liner in `loadPaneState`.

### 3.2 Creating a browser tab

Three entry points:

1. **Tab bar "+" menu** — split into "New session" (existing) and "New browser tab". Picking the latter creates a `BrowserTabData` with empty URL; the empty state in `BrowserPane` shows a URL input centered ("Type `localhost:PORT` to start").
2. **`DevServerCard` "Open here" button** — a new icon-button next to the existing "Open in new tab" link. Clicking it creates a browser tab in the focused pane and pre-fills `url = http://localhost:PORT`.
3. **`QuickSwitcher`** — `localhost:PORT` typed in the switcher offers "Open in browser pane" as an action. Nice-to-have, not blocking MVP.

### 3.3 Browser pane chrome

```
┌───────────────────────────────────────────────────────────────┐
│ [←] [→] [↻]  http://localhost:3000/foo            [⛓ ] [↗ ] [×]│
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                       <iframe>                                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

- `←` / `→`: history back/forward (state managed in React, see §3.4).
- `↻`: reload iframe (force reload, bust cache).
- URL bar: editable input, `Enter` navigates. Shows the iframe's current URL (read from `iframe.contentWindow.location` because same-origin under proxy mode).
- `⛓ ` (chain icon): toggle between proxy mode and tunnel mode. In tunnel mode, ClaudeDeck calls the existing `startTunnel(port)` and points the iframe at the resulting `*.trycloudflare.com` URL. The icon shows a "warning" state if `cloudflared` isn't installed.
- `↗ `: open the current URL in a real browser tab (uses the user's external browser).
- `×`: close the tab (standard).

### 3.4 History model

Cross-origin iframe access is normally blocked, but in **proxy mode** the iframe is same-origin (served from ClaudeDeck), so we can:

- Read `iframe.contentWindow.location.href` after each navigation.
- Hook `iframe.contentWindow.addEventListener("popstate", ...)` and `("hashchange", ...)`.
- Listen for `load` events on the iframe to capture full-page navigations.

We maintain an explicit history stack in React (`{ entries: string[]; index: number }`) and update it on each navigation event. Back/forward set `iframe.src` to the corresponding entry. We do **not** rely on `iframe.contentWindow.history.back()` because we want the toolbar's stack to be authoritative (and it lets us survive cross-origin transitions in tunnel mode without losing history).

In **tunnel mode**, the iframe is cross-origin and we cannot observe in-iframe navigation. The URL bar shows the last URL the user explicitly entered, plus a hint icon that reads "URL tracking unavailable in tunnel mode". This is the explicit cost of the escape hatch.

## 4. Architecture

### 4.1 Data flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Client browser                                                    │
│ ┌───────────────────────┐                                         │
│ │ ClaudeDeck UI         │                                         │
│ │  └─ <iframe src=      │                                         │
│ │     "/embed/3000/foo">│                                         │
│ └────┬──────────────────┘                                         │
└──────┼────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ ClaudeDeck server (server.ts on :3011)                            │
│                                                                   │
│  request handler:                                                 │
│    1. is /embed/:port/* ?           → embedProxy(req, res, port)  │
│    2. has Referer /embed/:port/* ?  → embedProxy(req, res, port)  │
│    3. otherwise                     → next.handle(req, res)       │
│                                                                   │
│  upgrade handler (WS):                                            │
│    same routing logic, with embedProxy.ws(req, socket, head)      │
└──────┬────────────────────────────────────────────────────────────┘
       │
       ▼   (HTTP request with Host: localhost:PORT, no x-forwarded-*)
┌──────────────────────────────────────────────────────────────────┐
│ Dev server on localhost:PORT                                      │
│ (sees a normal localhost request, no host validation triggered)   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 New files

| File                                     | Purpose                                                                                                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/embed-proxy.ts`                 | Stateless HTTP + WS proxy logic. One exported function `proxyRequest(port, req, res)`, one `proxyUpgrade(port, req, socket, head)`. Wraps `http-proxy` (new dep) with the header/cookie/security rules in §4.4. |
| `src/lib/embed-routing.ts`               | Pure function `resolveEmbedTarget(req): { port: number } \| null`. Encapsulates path-match and Referer-fallback logic. Unit-testable in isolation.                                                              |
| `src/components/views/BrowserPane.tsx`   | Top-level component for `kind: "browser"` tabs. Renders chrome + iframe. Owns history stack and URL state.                                                                                                      |
| `src/components/views/BrowserUrlBar.tsx` | URL input with autocomplete from open dev servers.                                                                                                                                                              |
| `src/data/tunnels.ts` _(if not already)_ | React Query hooks for `startTunnel(port)` and `stopTunnel(port)`. May already exist; verify in implementation.                                                                                                  |

### 4.3 Modified files

| File                                                        | Change                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`                                                 | Insert proxy routing **before** `handle(req, res, parsedUrl)`. Insert upgrade routing **before** the existing `/ws/terminal` / `/ws/updates` matchers. Run `validateSession` against the request cookie _before_ proxying — embed paths must not bypass auth. |
| `src/lib/panes.ts`                                          | Promote `TabData` to discriminated union (§3.1). Add `createBrowserTab(initialUrl?: string)` factory. Update `loadPaneState` to inject `kind: "session"` for legacy tabs.                                                                                     |
| `src/components/Pane/index.tsx`                             | Switch on `tab.kind` to render `SessionView` (existing) or `<BrowserPane tab={...} />`.                                                                                                                                                                       |
| `src/components/Pane/DesktopTabBar.tsx`, `MobileTabBar.tsx` | Render a globe-style icon (or similar) for browser tabs instead of session indicators. Show truncated host:port as the tab label.                                                                                                                             |
| `src/components/DevServers/DevServerCard.tsx`               | Add "Open here" icon-button next to the existing "Open in new tab" link. Wire it to a callback that creates a browser tab in the focused pane.                                                                                                                |
| `src/proxy.ts` (Next middleware)                            | Whitelist `/embed/` so it falls through to the server-level proxy. The existing auth gate must still apply: validate session and 401 on mismatch (otherwise `/embed/...` becomes an open SSRF).                                                               |
| `src/app/page.tsx` (or wherever the `+` menu lives)         | Add "New browser tab" entry.                                                                                                                                                                                                                                  |

### 4.4 Proxy behaviour

For each incoming request:

**Outgoing request to dev server:**

- Strip path prefix: `/embed/3000/foo?bar=1` → `/foo?bar=1`. If matched via Referer, the path is unchanged.
- Set `Host: localhost:PORT`. This is the linchpin — Vite's `server.allowedHosts` check passes because the request looks local.
- Strip `x-forwarded-*` headers.
- Forward all other headers verbatim including `Cookie`, `Authorization`, `User-Agent`.

**Incoming response to client:**

- Strip `x-frame-options`, `content-security-policy`, `content-security-policy-report-only`. Without this, the iframe goes blank for any dev server that defaults to `frame-ancestors 'self'`.
- Strip `strict-transport-security` (we're proxying HTTP through the same origin and don't want to upgrade-lock paths).
- Rewrite `Set-Cookie` headers:
  - If `Path=/` (or absent), rewrite to `Path=/embed/PORT/` so cookies are scoped to the embedded app and don't leak into ClaudeDeck routes.
  - Strip `Domain=` (we are not on the same domain).
  - Strip `Secure` if ClaudeDeck is running on plain HTTP (otherwise the cookie is dropped silently).
- Pass body through unmodified — **no HTML/JS rewriting**. The Referer-fallback handles absolute paths.

**WebSocket upgrade:**

- Same routing logic (path-match or Referer of the HTTP request that initiated the upgrade).
- Forward `sec-websocket-*` headers.
- Same Host rewriting.
- This makes Vite/Next HMR work end-to-end.

### 4.5 Why the Referer fallback

A Vite app served at `/embed/3000/` will emit HTML with absolute paths like `<script src="/@vite/client">`. The browser requests `https://claudedeck/​@vite/client` (no `/embed/3000/` prefix), which would 404 against ClaudeDeck.

But the `Referer` header on that request is `https://claudedeck/embed/3000/`. We use that to recover the target port and proxy correctly. This is the same trick used by `caddy`, `traefik` path-prefix configs, and tools like `serve-localhost-on-internet`.

Edge cases:

- **No Referer**: e.g., `fetch(url, { referrerPolicy: "no-referrer" })`. We fall through to Next, which 404s. Acceptable — these are rare in dev servers, and the user can switch to tunnel mode.
- **Referer from a different embedded port** (bug in app or shared service worker): we proxy to the wrong port. Mitigation: the path takes precedence over Referer; only fall back when path doesn't match.
- **Referer pointing into ClaudeDeck routes** (e.g., `Referer: /sessions/foo`): no match, falls through. Correct.

### 4.6 Auth and security

- The existing `proxy.ts` middleware runs `validateSession` for all non-public paths. `/embed/*` must inherit that — added to neither `PUBLIC_PATHS` nor any bypass.
- The server-level proxy hook should **also** verify the session cookie before proxying, because the WS upgrade path bypasses Next middleware entirely. Reuse `validateSession` from `src/lib/auth`.
- Localhost-only target enforcement: `proxyRequest` must reject any `port` that isn't an integer in `[1, 65535]` and must always proxy to literal `localhost`. No host parameter. This prevents accidental `?host=internal.lan` style abuse.
- No CSRF concerns: ClaudeDeck's auth is cookie-based and the proxied apps are the user's own.
- Same-origin iframe consequence: scripts in the embedded app run in the same origin as ClaudeDeck and can in principle read its DOM via `parent`. This is acceptable because (a) ClaudeDeck is single-user, (b) the embedded app is the user's own dev server, (c) sandboxing the iframe (`sandbox="allow-scripts"`) breaks too many real apps. **Document the trust boundary** in `docs/decisions.md` so future work can reconsider.

## 5. Failure modes and tunnel escape hatch

| Symptom                                                                          | Likely cause                                                                                           | UX response                                                                                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Iframe stays blank, no network activity                                          | Connection refused on `localhost:PORT`                                                                 | Show "No service on port PORT" overlay with retry button                                                                                          |
| Iframe shows "refused to connect"                                                | Some `X-Frame-Options` header survived stripping (rare; happens if dev server sets it via JS `<meta>`) | Detect via `iframe.onload` not firing within 5s, prompt user to switch to tunnel mode                                                             |
| HMR doesn't reconnect                                                            | WS upgrade failing (proxy bug, dev server using non-relative WS URL)                                   | Console message in the BrowserPane chrome: "HMR may be broken. Try tunnel mode."                                                                  |
| App makes requests to a hardcoded `http://localhost:OTHER_PORT`                  | Cross-origin from iframe; not our problem to fix                                                       | Document. User can open a second browser pane for that port.                                                                                      |
| HMR/WS using **absolute** URL (e.g., `new WebSocket("ws://localhost:5173/hmr")`) | App config bypasses the proxy origin                                                                   | Will not work in proxy mode. Vite/Next defaults use relative URLs and are unaffected; document the caveat for custom setups, suggest tunnel mode. |
| `cloudflared` not installed                                                      | Tunnel toggle disabled with tooltip "Install cloudflared to enable"                                    | (Existing) — `isCloudflaredInstalled()` already in `tunnels.ts`.                                                                                  |

The tunnel toggle is **always manual**. We considered automatic detection-and-fallback but rejected it: heuristics like "iframe didn't fire load in N seconds" are noisy (slow dev servers, large bundles), and silently switching mode hides what's actually broken. Manual toggle keeps the model legible.

## 6. Testing

### 6.1 Unit tests

- `embed-routing.test.ts` — table-driven: given `(url, referer)`, assert the resolved port (or null). Cover: `/embed/3000/x` → 3000; `/x` with Referer `/embed/5173/` → 5173; `/x` with no Referer → null; `/embed/abc/` → null; injection attempts (`/embed/3000;rm -rf/`) → null.
- `embed-proxy.test.ts` — mock `http-proxy` with a fake target server (test fixture). Verify Host rewriting, header stripping, cookie rewriting. Verify path stripping vs. Referer-mode preservation.

### 6.2 Manual integration scenarios

The implementation plan must walk through each:

1. **Static HTML server** (`python -m http.server 8000`) — sanity baseline.
2. **Vite dev** (default config, no `base`, no `allowedHosts`) — verify HMR over WS.
3. **Next dev** (`pnpm dlx create-next-app@latest`) — verify `/_next/static/...` is recovered via Referer.
4. **Storybook** — known to use absolute paths heavily.
5. **Express app with Set-Cookie** — verify cookie path rewrite works and cookie reaches the embedded app, not ClaudeDeck.
6. **Tunnel-mode toggle** — same Vite app, switch toggle, verify it loads via `*.trycloudflare.com`. Skip if `cloudflared` not installed in CI.
7. **Two browser panes simultaneously** — different ports, independent history.
8. **Pane state persistence** — refresh ClaudeDeck, verify browser tabs reload at last URL.

### 6.3 Things we will not test automatically

- HMR over WS through a real Vite (would need a docker-in-CI setup). Manual checklist instead.
- Cloudflared tunnel mode (requires network egress). Manual.

## 7. Open questions for review

1. **Tab bar icon for browser tabs** — globe? Compass? `↗ `? UX call.
2. **Should "Open here" in `DevServerCard`** replace the existing "Open in new tab" link, or live alongside it? Spec says alongside; reconsider during implementation if the row gets cluttered.
3. **`http-proxy` vs Node 24 native fetch streaming** — the proxy could be implemented without a dependency by using `fetch` + `ReadableStream` + a manual upgrade handler. `http-proxy` is battle-tested for WS; native is one less dep. Pick during implementation; the public API of `embed-proxy.ts` is the same either way.
4. **localStorage migration** — the discriminated-union change is backward-compatible if we inject `kind: "session"` on load, but worth a minor version bump in any internal versioning.

## 8. Estimated effort

- Proxy + routing + tests: ~1 day
- BrowserPane component + history + URL bar: ~1 day
- Integration into pane system + tab kind union + migrations: ~0.5 day
- DevServerCard hook + tab bar polish: ~0.5 day
- Manual testing matrix + bug-fix headroom: ~1 day

**Total: ~4 days of focused work.**
