# Pocket

A small, private app for three lists: wishes, funds and loans. Built for one person on a phone, added to the home screen. You type the numbers; they live in your own database. Nothing is linked to a bank.

## What it does

**Wishes.** Sections for people or places (Mom, Dad, Me, Home). Each holds cards with a name, an expected amount, a few links and a note. Tap a card to edit it, mark it got, or delete it.

**Funds.** Money with a name on it: Emergency, Goa, iPhone. Each has a target and a balance. Tap one, then Put in or Take out. Every entry is kept as history and the balance follows.

**Loans.** Money you took or gave: name, amount, end date. Tap one to record what has been paid. It settles itself when fully paid.

**Me.** A glance at totals, theme (dark by default, violet accent), JSON export, sign out.

Amounts are typed as plain digits and shown with Indian grouping (1,50,000) as you type.

## How it works

One page. The server renders it once with all your data (one cached read per user, invalidated on every write). After that every tab and detail screen is a client-side swap with no server request; the view lives in the URL so back and reload work. Writes go through server actions, then the store refreshes in the background. Reopening the app after a minute refreshes quietly.

## Stack

Next.js 16 (App Router, server actions) · React 19 · Prisma 7 on Postgres (Neon) · NextAuth with Google · Tailwind 4.

```bash
npm install
cp .env.local.example .env.local   # DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_URL/SECRET
npx prisma migrate deploy
npm run build && npm start         # next dev works too, but compiles on demand and is slower
```

`npm run build` runs migrations first, so deploys apply schema changes automatically.

## Feel

Each tab has its own colour (pink wishes, green funds, amber loans, violet you) so things can be found by colour. Screens slide in the direction you moved, lists stagger in, progress bars spring and shimmer when full, big numbers count up, and finishing something (a wish got, a fund full, a loan settled) throws confetti. Writes show instantly and confirm in the background. Everything respects the system's reduced-motion setting.

## Notes

- Bottom tab bar on every screen size. Standalone display, service worker, safe-area aware.
- The session token carries the user id, so no request looks the user up.
- Earlier versions tracked expenses, then modelled plans and phases. All of that is gone.
