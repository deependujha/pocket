# Pocket

Your money, in one place. A private, single-person money-management app: emergency fund, goals, SIPs, FDs, loans, and one number that says how secure you are.

Nothing is linked to a bank. You type the numbers in; they live in your own Postgres database.

---

## Why this exists

Version 1 was an expense tracker with a UPI QR scanner. Scanning was flaky in real lighting, and payment redirects kept getting blocked. Logging every chai was also the wrong thing to optimise.

What actually matters is the structure: is there an emergency fund, is the card paid, are the SIPs running, is the Goa trip funded before the flight? Pocket v2 tracks that structure and nothing else.

---

## The model

**Accounts** are where money physically sits: savings account, cash, each FD, RD, PPF, EPF, Nifty 50 SIP, gold ETF, stocks, credit card (as an amount owed). Every balance change is logged as a movement, so each account has a history.

**Goals** are what the money is for: emergency fund, long-term wealth, a phone at Diwali, a gift for Mom, a trip. A goal has a target, an optional date or trigger ("when I get my bonus"), and a monthly plan. An account can fund at most one goal; the goal's progress is the sum of its linked balances. One FD per goal keeps it clean.

**Loans** are money you lent or borrowed, with repayments. Lent money is an asset you can't spend. Borrowed money and card dues are subtracted from net worth.

**The Plan** is the point of the app. Surplus is take-home minus expenses (expenses include everything you don't want to track, like parents' insurance). Debts are paid first, off the top. What's left is split by percentages you set with sliders; move one and the others rebalance. A phase ends when a goal fills up. The next phase is yours to decide: Pocket shows the same split carried forward among the goals still open and asks you to confirm or adjust. Adding a goal flags the current phase until it has a share. Later phases stay hidden until their turn.

---|---|---|
| Runway | 30 | Job-loss cover holds N months of expenses (default 6) |
| Cash buffer | 15 | One month of expenses free in liquid accounts after card dues |
| Debt load | 20 | Nothing owed (drops to 0 at 50% of assets) |
| Investing | 20 | 20% of income goes to SIPs, or 40% of assets are invested |
| Goals on track | 15 | Every dated goal is at or ahead of its expected pace |

Each component shows what it measured and one thing that would raise it.

---

## Screens

- **Overview**: net worth with a small trend line, the security ring, this month's split, three goals, and the next three dates.
- **Plan**: debts, then percentage sliders per phase, with completion months computed as you drag.
- **Goals**: progress meters with an expected-pace marker; detail page has a path-to-target projection and the accounts funding it.
- **Money**: accounts and loans under one tab. Accounts are grouped by type with sparklines; detail page has balance history, FD maturity value, SIP cost vs value, and a balance-update sheet (deposit / withdraw / interest / market / set).
  Loans: lent vs borrowed, repayments, auto-close when repaid. A borrowed loan's monthly payment comes off the top of the plan.
- **More**: Settings (your numbers, theme, export, sign out) and Info (how Pocket thinks about money, how the score is built).

The view lives in the URL (`/?tab=goals&id=…`) so reloads and the back button work, but switching never asks the server for anything.

First sign-in asks for income, expenses, targets for job-loss cover, health fund and fun fund, an optional debt, and starter accounts. It sets a first split and opens the Plan.

---

## Stack

Next.js 16 (App Router, server actions) · React 19 · Prisma 7 on Postgres (Neon) · NextAuth with Google · Tailwind 4 · Recharts.

```bash
npm install
cp .env.local.example .env.local   # DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, NEXTAUTH_URL/SECRET
npx prisma migrate deploy
npm run dev
```

`npm run build` runs migrations then builds, so deploys apply schema changes automatically.

---

## Notes

- Amounts are integer rupees. Formatting is Indian (₹1,50,000; ₹1.5L; ₹1.2Cr).
- FD maturity assumes quarterly compounding.
- Dark by default, light available, violet accent. Switch under More → Appearance.
- Built to be added to the home screen: standalone display, bottom tab bar everywhere, service worker for install.
- Speed: it is a single page. The server renders it once with all your data (one cached read per user, invalidated on write); after that every tab, detail screen and back/forward is a client-side component swap with zero server requests. Writes go through server actions, then the in-memory store re-pulls in the background (a thin violet bar at the top shows it). Reopening the app after a minute refreshes quietly. `next dev` compiles on demand and is much slower than the production build.
