# Changelog

All notable changes to HKDM Services will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Rotate Firebase API key (exposed during development)
- Add `.htaccess` to block `*.log`, `*.txt`, `*.env` from public access
- Fix "Email FAILED" issue in flag-monitor (SMTP config)
- Add 4 more fraud-detection flags
- Migrate webhook to Firebase Admin SDK (fix Korapay wallet funding)

---

## [2026-09-30] — Role-based access + fraud detection overhaul

### Added

**Moderator System**
- `moderator-login.html` — dedicated login page for moderators (blue badge, moderator-only)
- `moderator-panel.html` — dedicated panel for moderators with full activity view
- Logout button on moderator panel with confirmation prompt
- Role-based routing after login:
  - `admin` → `admin-panel-new.html`
  - `moderator` → `moderator-panel.html`
- Firebase `config/admins` node — stores admin & moderator UIDs + emails
- Public admin list readable only by authenticated users

**Fraud Detection Flags** (4 new)
- **21. Disposable Email** — detects signup from temp-mail services (mailinator, tempmail, yopmail, etc.)
- **22. Short Email Base** — flags emails with base under 3 characters (bot pattern)
- **26. Refund Re-Fund Cycle** — detects refund then re-fund within 5 minutes, ≥3 times
- **32. Wallet Never Decreased** — flags users with orders but no funding/voucher history
- **A. History Tampering** — detects broken chain links in wallet history (deleted/edited entries)
- **B. Unauthorized Role** — flags users with admin/moderator role not present in `config/admins`

**API Security**
- `.env` file at `/home/hkdmserv/.env` — stores `FIREBASE_API_KEY` outside `public_html`
- `flag-monitor.php` now reads API key from environment (no more hardcoded key in source)
- Firebase service account JSON moved outside `public_html`

### Changed

**`flag-monitor.php`**
- Runs every 1 minute (lock at 55s prevents overlap)
- Admin list loaded from Firebase `config/admins` instead of hardcoded
- Email comparison is now case-insensitive + trims whitespace
- Skips "Unauthorized Role" check if user has no email field (prevents false positives)
- Logs admin list contents for debugging

**`users-activity.js`**
- Redirects unauthorized users to `moderator-login.html` (was `admin-login.html`)
- Accepts both `admin` and `moderator` roles
- Footer/version bumped to `?v=4` to force fresh cache

**`admin-panel-new.html`**
- Auth check now redirects moderators to `moderator-panel.html` if they attempt to access
- Admin role check unchanged

**Firebase Rules**
- Added `config/admins` node with `.read: "auth != null"` and `.write: false`
- Tightened `users` node read/write based on role
- Kept all other paths as-is for now (staged rollout)

### Fixed

- **Moderator login blocked** — previously rejected with "Access denied" because admin-login only accepted `admin` role
- **Moderator access denied on panel** — root cause was login page rejection, now fixed with dedicated moderator login
- **Admin list not loading in cron** — Firebase rules were requiring Firebase Auth context, now allow authenticated reads
- **False "Unauthorized Role" flags** — users without `email` field were being flagged; now skipped

### Notes

- `flag-monitor.php` skips users with `skipAutoBlock: true` (must be stored as boolean, not string)
- Admin accounts (`hipkhalifa6666`, `hipqalifa`) have `skipAutoBlock: true` set
- Users with `unblockClearedHash` set are forgiven on the next run if their flags match

---

## [2026-09-29] — Website Requests & payments

### Added
- `admin-update-website-request.php` — admin quotes price, sets deposit %, sends email
- `pay-website-deposit.php` — wallet payment for website deposit
- `pay-website-balance.php` — wallet payment for remaining balance
- `send-website-request.php` — submit website request + email
- Website request tracking: milestones, progress bar, expected delivery, latest note
- Email notifications at every stage (quote, status change, deposit, delivery)

### Fixed
- **My Website Requests** — payment block toggle now matches by `data-type` attribute instead of hardcoded index (was returning `undefined` when only one block existed)

---

## [2026-09-27] — Admin panel rebuild

### Added
- `admin-panel-new.html` — rebuilt across 13 parts
- Sections: Orders, Users, Services, Shop, Analytics, Transactions, Vouchers, Website Requests
- Bulk order actions (mark processing, completed, cancelled, refunded)
- Order search + status filters
- User tier/status filters + refresh
- Voucher generation + statistics
- Website Requests panel with full tracking editor
- Theme toggle (light/dark/auto) with time-based fallback

### Removed
- Debug error script in `<head>`
- PAYLOAD PREVIEW alert in save handler

### Fixed
- Admin update website request — email sending
- Corrupted PHP file (replaced)

---

## [2026-09-15] — Services restructure

### Added
- `services-global.html` — international services list
- `services-nigeria.html` — Nigeria services list
- `nigeria-services-catalogue.js` — Nigeria services data

### Changed
- `services.html` — no longer shows catalog selection, shows all services directly
- Dashboard quick action renamed "Services & Catalogues" → "Services"

### Removed
- `services-old.html` (backup kept temporarily)

---

## [2026-09-10] — Dashboard + Firebase

### Added
- `dashboard.js` — main customer dashboard logic
- Firebase compat SDK wrappers (matching modular function names)
- Referral system (link, count, earnings)
- Voucher redemption via `/api/redeem-voucher`
- WhatsApp support form
- User tier evaluation

### Fixed
- **SDK conflict** — compat SDK (in `dashboard.html`) vs modular SDK (in other files) caused `firebase.apps` conflicts
- **Session persistence** — set to LOCAL persistence after login

---

## [2026-09-05] — Initial setup

### Added
- Firebase project setup (auth, database)
- Basic auth pages (login, register, forgot-password, reset-password)
- Wallet funding via Korapay (`create-payment.php`, `webhook.php`)
- Order placement (`create-order.php`)
- Transaction history
- Voucher system
- Referral system
- Flag monitor cron (basic version)
- Custom domain `hkdmservices.xyz` via Nairahost DNS

---

## Legend

- **Added** — new features
- **Changed** — changes to existing functionality
- **Deprecated** — soon-to-be-removed features
- **Removed** — removed features
- **Fixed** — bug fixes
- **Security** — security improvements
