# WiFi Manager UI (Svelte + Vite)

A purpose-built control surface for the ESP WiFi Manager portal with a modern look, live async refresh, and resilient offline fallbacks.

## Highlights
- Auto-refresh with abort + retry and optional manual sync
- Activity log with recent connect/save attempts
- Network scan and quick connect (secure + open APs)
- System config form with captive portal controls
- Tune sync interval (5–120s) and retry attempts (1–5) without rebuilding

## Run locally
```bash
cd svelte-wifi-ui
npm install
npm run dev -- --open
```

## Build / preview
```bash
npm run build
npm run preview
```

## Expected device API
- `GET /api/status` → `{ fw, ip, ap, connected, ssid, hostname, apClients, uptime }`
- `GET /api/scan` (or `/api/scan?refresh=1`) → array of `{ ssid, strength, secure, channel, latency }`
- `POST /api/connect` form-urlencoded `{ ssid, password }` → `{ connected, status? }`
- `GET /api/config` / `POST /api/config` form-urlencoded body → `{ hostname, portalTimeout, captive, apSsid, apPasswordSet }`

If an endpoint is unreachable, the UI keeps using cached values and default demo networks so the portal stays usable even when offline.
