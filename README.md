# Pocket

A simple, private, local-first expense tracker built for daily use.

This app is designed to be **used**, not marketed.

---

## Why this exists

Most expense trackers:

* require accounts
* collect data
* show ads
* push subscriptions
* overcomplicate basic tracking

This app does none of that.

It’s meant for **one person (or two)** who just want to log expenses quickly and look at them later.

---

## Core principles

* **No authentication**
* **No backend**
* **No ads**
* **No analytics**
* **No data collection**
* **No cloud sync (by design)**

Your data lives **only in your browser**, stored locally using **IndexedDB**.

If you delete the browser data, the expenses are gone.
That’s the tradeoff for privacy and simplicity.

---

## How it works

* Built as a **web app**
* Uses **IndexedDB** for persistence
* Works fully offline after first load
* Optimized for mobile usage

The app has four sections:

### Today

* Add expenses
* Edit today’s entries
* Quick, frictionless logging

### History

* Read-only view of past expenses
* Grouped by day
* No editing or deletion (intentional)

### Stats

* Monthly overview
* Category-wise breakdown
* Visual distribution of spending

### More

* Guest profile
* Option to delete all local data

---

## How you’re expected to use it

This is important.

### First time

1. Open the website in your mobile browser (Chrome / Safari)
2. Add it to your **Home Screen**

   * iOS: Share → Add to Home Screen
   * Android: Browser menu → Add to Home Screen

Now it behaves like an app.

### Daily usage

* Open the app
* Add an expense **immediately after a transaction**
* Don’t overthink categories
* Don’t optimize prematurely

The goal is **habit**, not perfection.

---

## Data & privacy

* All data is stored locally in **IndexedDB**
* Nothing is sent to any server
* No tracking scripts
* No cookies
* No user identification

This app cannot see your data.
That’s the point.

---

## Limitations (intentional)

* No login
* No sync across devices
* No backups
* No sharing

If, after using this daily for a month or two, syncing feels necessary — then it’s earned.

Until then, local-only keeps things fast, private, and distraction-free.

---

## Tech stack (for the curious)

* Next.js
* React
* Tailwind CSS
* IndexedDB
* Recharts (for stats)

No backend. No database server. No auth provider.

---

## Future ideas (only if needed)

* Optional login
* Cloud sync (MongoDB / Supabase / etc.)
* Export / import data
* Multi-device support

None of these are planned until daily usage proves they’re worth the complexity.

---

## Philosophy

> Software should adapt to habits, not demand them.

This app stays out of your way.
If it helps you become more aware of spending, it’s doing its job.

---

If you want, next time we can:

* add export/import
* add optional backup
* or deliberately **not add anything** and keep it boring

Boring software that works is a success.

---

*Credits*:

Special thanks to [ChatGPT](https://chat.openai.com/) and [GitHub Copilot](https://github.com/features/copilot) for their assistance.
