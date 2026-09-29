# HKDM Services — Feature Deep Dive

This document explains how every major feature works, end to end.

---

## 1. Authentication

### Register
1. User opens `register.html`
2. Fills name, email, password
3. Firebase Auth creates account
4. User record created in `users/{uid}` with default fields:
   - `wallet: 0`, `tier: regular`, `status: active`
   - `referralCode: uid`, `totalReferrals: 0`
5. Verification email sent via `send-verification.php`
6. Redirect to dashboard

### Login
1. User opens `login.html`
2. Firebase Auth signs in
3. `firebase.js` sets persistence to LOCAL
4. Redirect to `dashboard.html`
5. `dashboard.js` loads user data + orders + referrals

### Forgot Password
1. User enters email on `forgot-password.html`
2. `send-password-reset.php` sends reset link
3. Link opens `reset-password.html` with code
4. User sets new password

### Email Change
1. User requests change on `profile.html`
2. `send-email-change.php` sends confirmation link
3. Link opens `confirm-email-change.html`
4. `confirm-email-change.php` updates Firebase Auth + user record

---

## 2. Wallet System

### Fund Wallet (Korapay Flow)

**Step 1 — User initiates**
1. User opens `wallet.html`
2. Enters amount
3. Frontend calls `create-payment.php` with amount + uid + idToken

**Step 2 — Server creates payment**
1. `create-payment.php` validates user
2. Calls Korapay API to create a payment
3. Saves pending payment to Firebase: `pending_payments/{reference}` = `{ uid, amount, createdAt }`
4. Returns Korapay checkout URL

**Step 3 — User pays**
1. User redirected to Korapay checkout
2. Pays via card, bank transfer, etc.

**Step 4 — Webhook fires**
1. Korapay calls `webhook.php`
2. Reads `reference` from payload
3. Looks up `pending_payments/{reference}`
4. Gets `uid`
5. Reads current wallet from `users/{uid}/wallet`
6. Calculates new wallet = current + amount
7. Updates `users/{uid}/wallet` via PATCH
8. Creates transaction in `transactions/{txnId}`
9. Deletes `pending_payments/{reference}`
10. Logs to `webhook_log.txt`

**⚠️ Current Issue:** Step 7 fails with "Permission denied" — webhook uses REST API with no Firebase auth context. Fix: Firebase Admin SDK.

### Wallet History
- `wallet-history.php` returns `wallet_history/{uid}` entries
- Each entry: `{ type, amount, before, after, reference, timestamp }`
- Types: `wallet_funding`, `order_payment`, `refund`, `voucher`, `reseller_upgrade`

### Transactions Page
- `transactions.html` + `transactions.js`
- Lists `transactions` where `uid == current user`

---

## 3. SMM Orders

### Browse Services
1. User opens `services.html`
2. Loads `services.js` catalogue (Global + Nigeria)
3. Filters by platform or search term
4. Clicks "Order"

### Place Order
1. User lands on `order.html?service={id}&platform={name}`
2. Enters link + quantity
3. Frontend validates minimum quantity
4. Calculates cost = quantity × rate / 1000
5. On submit → `create-order.php`:
   - Validates wallet balance
   - Deducts wallet
   - Creates order in `orders/{orderId}`
   - Adds `wallet_history` entry
   - Adds `transactions` entry
6. Redirect to `order-success.html`

### Order Status Flow
- `pending` → waiting for provider
- `processing` → provider handling
- `completed` → delivered
- `cancelled` / `refunded` → money returned

---

## 4. Website Request System

### Customer Submits Request
1. Opens `build-website.html`
2. Chooses category
3. Fills description, budget, timeline
4. On submit → `send-website-request.php`:
   - Validates input
   - Creates `website_requests/{requestId}` with:
     `requestId`, `uid`, `categoryName`, `basePrice`, `description`, `budget`, `timeline`, `status: pending`, `createdAt`
   - Sends confirmation email to customer
   - Sends notification email to admin
5. Redirect to `my-website-requests.html`

### Admin Quotes
1. Opens `admin-panel-new.html` → Website Requests
2. Enters quote + deposit %
3. Calls `admin-update-website-request.php`:
   - Verifies admin role
   - Updates `website_requests/{requestId}`:
     `quotedPrice`, `quotedDeposit`, `depositPercent`, `status: quoted`, `adminNote`
   - Sends quote email to customer

### Customer Pays Deposit
1. Opens `my-website-requests.html`
2. Sees quoted card + yellow "Pay Deposit" button
3. Taps → payment block opens
4. Wallet payment → `pay-website-deposit.php`
5. Or bank transfer → WhatsApp proof
6. `pay-website-deposit.php`:
   - Checks wallet balance
   - Deducts deposit
   - Updates request: `status: deposit-paid`
   - Adds `wallet_history` + `transactions`
7. Project starts

### Progress Tracking
- Admin updates `milestones`, `progress`, `expectedDelivery`, `latestNote`
- Customer sees timeline:
  - Quote accepted → Deposit paid → Design mockup → Development → Revisions → Final delivery

### Customer Pays Balance
1. When `status: delivered`, yellow "Pay Remaining Balance"
2. `pay-website-balance.php` runs same flow
3. Updates request: `status: fully-paid`

### Email Notifications
- `admin-update-website-request.php` sends emails via `send-email.php`

---

## 5. Voucher System

### Admin Creates Voucher
1. Opens `admin-panel-new.html` → Vouchers
2. Clicks "Add Voucher"
3. Enters code + amount
4. Writes to `vouchers/{code}`: `code, amount, createdAt, createdBy, isUsed: false`

### Customer Redeems Voucher
1. Opens `dashboard.html`
2. Enters code
3. Frontend calls `/api-php/redeem-voucher.php` with idToken
4. `redeem-voucher.php`:
   - Verifies user
   - Reads `vouchers/{code}`
   - Checks `isUsed === false`
   - Adds amount to wallet
   - Updates voucher: `isUsed: true`, `usedBy: uid`, `usedAt`
   - Adds `wallet_history` + `transactions` entries

---

## 6. Referral System

### How It Works
1. Every user has `referralCode` (defaults to uid)
2. Link: `https://hkdmservices.xyz/register.html?ref={code}`
3. New user registers with `?ref={code}`:
   - Registration detects `ref` param
   - Sets `referredBy: {code}` on new user
   - Increments `totalReferrals` on referrer
   - Credits commission to referrer's wallet

### Dashboard Display
- Referral link input + copy button
- Total referrals + total earnings

---

## 7. Reseller & VIP

### Reseller Upgrade
1. User confirms ₦100,000 investment
2. Calls `reseller.php`:
   - Checks wallet ≥ ₦100,000
   - Deducts amount
   - Updates user: `tier: reseller`
   - Adds `totalInvested`

### VIP Upgrade
1. User spends ≥ ₦60,000 total
2. Requests VIP via `request-vip.php`
3. Admin approves → `tier: vip`

### Unlock Reseller
- `unlock-reseller.php` — admin manually unlocks

---

## 8. Admin Panel

### Sections
1. Orders — view, filter by status
2. Users — view, edit, block, unblock
3. Services — add, edit, delete
4. Shop — manage items
5. Analytics — revenue stats
6. Transactions — all wallet transactions
7. Vouchers — create, view, delete
8. Website Requests — quote, update, email

---

## 9. Users Activity Panel (Fraud Detection)

### Access
- Only `role === admin` or `moderator`

### Detection Logic
| Flag | Trigger | Level |
|---|---|---|
| Unexplained wallet change | Current ≠ reconstructed | Critical |
| Refund abuse | ≥3 refunds | High |
| Rapid funding | ≥5 in 24h | Medium |
| Rapid orders | ≥10 in 24h | Medium |
| Wash trading | ≥2 cycles <10min apart | High |
| Zero-balance orders | before < amount | Critical |
| Shared email base | ≥3 same base | High |
| Voucher abuse | ≥5 in 24h | High |
| Referral spam | ≥5 referrals | High |
| Reseller without fee | Invested <₦100k | Critical |
| VIP low spend | Spent <₦60k | High |
| Negative wallet | Wallet < 0 | Critical |
| High refund ratio | >50% refunded | Critical |
| Self-referral | code/ref == uid | Critical |

### Cron Job (`flag-monitor.php`)
- Runs every 15 min
- Detects critical flags
- Auto-blocks flagged users
- Sends alert email
- Logs to `flag-monitor-log.txt`
- Lock file prevents overlap

---

## 10. Notifications

### Email (PHPMailer)
- `send-email.php` — central helper
- Used by: `send-verification.php`, `send-password-reset.php`, `send-email-change.php`, `send-credentials.php`, `admin-update-website-request.php`, `send-flag-alert.php`, `email-notifications.php`

### Telegram
- `telegram-notify.php` — admin alerts

---

## 11. Theme System

- `theme.js` used by every page
- Dark mode via `html[data-theme="dark"]`
- Flow:
  1. Page load → `theme.js` runs before body
  2. Reads `localStorage.adminTheme` (light / dark / auto)
  3. Auto → checks `prefers-color-scheme`
  4. Applies `data-theme` attribute
  5. Toggle from navbar dropdown

---

## 12. PWA

- `manifest.json` + `sw.js`
- Install via "Add to Home Screen"
- Works offline (cached)

---

## 13. Build Website Guide

- Copy Full Version (detailed guide)
- Copy Short Version (quick reply)
- Download as PDF (print view)

---

## 14. Suspended Page

- Shown to users with `status === suspended`
- Any protected page detects suspension → redirects

---

## 15. Data Model (Firebase Realtime Database)

### `users/{uid}`
`wallet, tier, status, role, fullName, email, referralCode, referredBy, totalReferrals, totalSpent, totalInvested, totalReferralEarnings, blockedAt, blockedBy, blockedReason, unblockedAt, unblockedBy, createdAt`

### `orders/{orderId}`
`uid, orderId, serviceName, platform, quantity, total, status, createdAt, updatedAt`

### `transactions/{txnId}`
`uid, reference, type, amount, status, description, createdAt, orderId`

### `wallet_history/{uid}/{historyId}`
`type, amount, before, after, reference, timestamp, orderId, voucherCode, method, fee`

### `website_requests/{requestId}`
`requestId, uid, categoryName, basePrice, description, budget, timeline, status, quotedPrice, quotedDeposit, depositPercent, adminNote, milestones, progress, expectedDelivery, latestNote, createdAt, updatedAt`

### `vouchers/{code}`
`code, amount, createdAt, createdBy, isUsed, usedBy, usedAt`

### `pending_payments/{reference}`
`uid, amount, createdAt`
