# machilog (codename)

QRコードを読み取ると、現在地周辺の匿名ローカルログが開くWebサービス。

> Scan a universal QR code, open the log page for your current area, and leave short anonymous impressions about the place.

## Stack

- Next.js (App Router) / Vercel
- Neon Postgres + Drizzle ORM
- h3-js (H3 res 10, ~130m cells)
- next-intl (ja / en / ko / zh-Hans / zh-Hant)

## Setup

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL (Neon), ADMIN_PASSWORD, AUTH_SECRET, IP_ENC_KEY, CRON_SECRET
pnpm db:migrate
pnpm dev
```

Geolocation requires HTTPS (or localhost). Test on a phone via `pnpm dev` + local network, or use browser devtools sensor emulation.

## Key routes

| Route | Purpose |
| --- | --- |
| `/here` | QR entry. Resolves location → redirects to cell page. `?s=<sticker>` tracks QR placement |
| `/c/[cellId]` | Area log page (read / write / report / delete own) |
| `/admin` | Admin login → post management |
| `/api/cron/purge` | Daily purge of expired encrypted IPs (Vercel cron) |

## Design invariants

- Exact lat/lng is never stored. Posts belong to an H3 cell only.
- Write requires current location within gridDisk(k=1) of the target cell, accuracy ≤ 200m.
- Read shows neighbor-cell posts (labeled) only when own cell has < 5 visible posts.
- IP: encrypted original kept 90 days (disclosure-request readiness), hash kept for rate limiting.
- Posts are visible immediately; regex filter can force pending/block; 2 reports auto-hide.
- All funnel events land in the `events` table — the data asset survives the service.

See `docs/SPEC.md` for the full product spec and decision log.
