# HKDM Services — Project Documentation

> Live site: https://hkdmservices.xyz
> Repository: https://github.com/hkdmservices/Hkdmservices
> Last updated: [ADD TODAY'S DATE]

---

## 1. What This Site Is

HKDM Services is a full-stack platform that combines:

- **An SMM panel** — customers fund their wallet, buy social media services (Global + Nigeria catalogues), place orders, track transactions, redeem vouchers, and earn referral commissions.
- **A custom website service** — customers request a website (Landing Page, Business Website, E-commerce Store, Security Audit, Security Fix), receive a quote, pay a deposit, track progress, and pay the balance on delivery.

A separate **admin panel** manages everything: orders, users, services, shop, analytics, transactions, vouchers, website requests, and fraud detection.

---

## 2. Services Offered

### SMM Services (Digital)
- Global services catalogue (international platforms)
- Nigeria services catalogue (local platforms)
- One-time fixed-price services
- Standard per-1000 rate services

### Website Services
- Landing Page — ₦100,000 (5–7 days)
- Business Website — ₦300,000 (10–14 days)
- E-commerce Store — ₦600,000 (21–30 days)
- Security Audit — ₦40,000 (5–7 days)
- Security Fix — ₦80,000 (7–10 days)

### Other
- Reseller upgrade
- VIP tier
- Vouchers (redeemable for wallet credit)
- Referral commissions

---

## 3. Site Structure

### Customer Pages
| File | Purpose |
|---|---|
| `index.html` | Public landing page |
| `login.html` / `login.js` | Customer login |
| `register.html` / `register.js` | Customer registration |
| `forgot-password.html` / `forgot-password.js` | Password reset request |
| `reset-password.html` | Reset password form |
| `confirm-email-change.html` | Confirm email change |
| `dashboard.html` / `dashboard.js` | Main customer dashboard |
| `services.html` / `services.js` | Services page |
| `services-catalog.html` / `services-catalog.js` | Services catalogue |
| `services-global.html` | Global services list |
| `services-nigeria.html` / `nigeria-services.js` | Nigeria services list |
| `nigeria-services-catalog.html` | Nigeria catalogue view |
| `services-old.html` | Legacy services page (backup) |
| `order.html` / `order.js` | Place an order |
| `order-success.html` | Order confirmation |
| `my-purchases.html` | Purchase history |
| `recent-orders.html` / `recent-orders.js` | Recent orders view |
| `wallet.html` / `wallet.js` | Wallet funding (Korapay) |
| `transactions.html` / `transactions.js` | Transaction history |
| `profile.html` / `profile.js` | Account settings |
| `shop.html` / `shop.js` | Shop page |
| `build-website.html` | Submit a website request |
| `my-website-requests.html` / `my-website-requests.js` | Track website projects |
| `build-website-guide.html` | Public service guide (copy + PDF) |
| `about.html` | About page |
| `terms-policy.html` | Terms & policy |
| `suspended.html` | Suspended user page |
| `success.html` | Generic success page |

### Admin Pages
| File | Purpose |
|---|---|
| `admin-login.html` | Admin authentication |
| `admin-panel-new.html` | Main admin dashboard |
| `users-activity.html` / `users-activity.js` | Fraud detection + user monitoring |
| `set-admin.html` / `set-admin.js` / `setAdmin.js` | Set admin role |

### Testing / Dev
| File | Purpose |
|---|---|
| `auth-test.html` | Auth testing |
| `test.html` | General test page |

### Assets / Config
| File | Purpose |
|---|---|
| `theme.js` | Light/dark/auto theme toggle |
| `style.css` | Global styles |
| `logo.svg` | Site logo |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker |
| `package.json` | Node dependencies |
| `firebase.js` | Firebase config (compat SDK) |
| `firebase-admin.js` | Firebase admin utilities (frontend) |
| `script.js` | Global scripts |
| `telegram.js` | Telegram notifications |
| `README.md` | Repo readme |
| `.gitignore` | Git ignore rules |

---

## 4. Backend Endpoints (PHP — /api-php/)

### Website Request Flow
| File | Purpose |
|---|---|
| `send-website-request.php` | Submit new website request + email |
| `admin-update-website-request.php` | Admin quotes price, sets deposit %, sends email |
| `pay-website-deposit.php` | Wallet payment for deposit |
| `pay-website-balance.php` | Wallet payment for balance |
| `website_request_log.txt` | Website request log |

### Order & Payment
| File | Purpose |
|---|---|
| `create-order.php` | Place order |
| `order.php` | Order handler |
| `create-payment.php` | Create Korapay payment |
| `verify-payment.php` | Verify payment status |
| `payment-success.php` | Payment success page |
| `payment-success-display.php` | Payment success display |
| `korapay-webhook.php` | Korapay webhook handler |
| `webhook.php` | Main webhook (wallet funding) |
| `webhook_log.txt` | Webhook log |
| `order_log.txt` | Order log |

### Wallet & Transactions
| File | Purpose |
|---|---|
| `wallet-history.php` | Wallet history API |
| `redeem-voucher.php` | Redeem voucher for wallet credit |
| `voucher_debug.log` | Voucher debug log |

### User Management
| File | Purpose |
|---|---|
| `set-admin.php` | Set admin role |
| `save-services.php` | Save service catalogue |
| `set-catalogue.php` | Set catalogue |
| `reseller.php` | Reseller upgrade |
| `unlock-reseller.php` | Unlock reseller |
| `request-vip.php` | VIP upgrade request |
| `send-credentials.php` | Send credentials |
| `send-email-change.php` | Email change confirmation |
| `confirm-email-change.php` | Confirm email change |
| `send-password-reset.php` | Password reset email |
| `send-verification.php` | Email verification |

### Notifications & Email
| File | Purpose |
|---|---|
| `send-email.php` | SMTP email helper |
| `send-flag-alert.php` | Flag alert email |
| `email-notifications.php` | Notification system |
| `telegram-notify.php` | Telegram notifications |
| `PHPMailer-master.zip` | PHPMailer library |

### Monitoring & Security
| File | Purpose |
|---|---|
| `flag-monitor.php` | Cron: auto-flag suspicious users |
| `flag-monitor-log.txt` | Flag monitor log |
| `health.php` | Health check |
| `check-link.php` | Link checker |
| `check-error-log.php` | Error log checker |

### Config & Keys
| File | Purpose |
|---|---|
| `hkdmservices-7d59f-firebase-adminsdk-fbsvc-4e20c7c9bb.json` | Firebase service account key ⚠️ |
| `phpmaile` (folder) | PHPMailer install |

### Logs
| File | Purpose |
|---|---|
| `debug_log.txt` | Debug log |
| `debug-reset.php` | Debug reset |
| `email_change_debug.log` | Email change debug |
| `email_change_log.txt` | Email change log |
| `error_log` | PHP error log |
| `cron-output.txt` | Cron output |

### Tests
| File | Purpose |
|---|---|
| `test-api.php` | API test |
| `test-email-debug.php` | Email debug test |
| `test-email-now.php` | Send test email |
| `test-forgot.php` | Forgot password test |
| `test-korapay.php` | Korapay test |
| `test-mail.php` | Mail test |
| `test-phpmailer.php` | PHPMailer test |
| `test-resend.php` | Resend test |
| `test-smtp-direct.php` | SMTP direct test |
| `test-smtp-now.php` | SMTP test |
| `test-smtp.php` | SMTP test |
| `test.php` | General test |

---

## 5. Features

### 5.1 Authentication
- Register, login, logout, forgot password, reset password
- Email verification
- Firebase Authentication

### 5.2 Wallet System
- Fund wallet via Korapay
- Webhook credits wallet on successful payment
- Wallet history page
- Transactions page
- ⚠️ **Pending:** Migrate webhook to Firebase Admin SDK (Permission denied issue)

### 5.3 SMM Orders
- Browse Global + Nigeria services
- Place order against wallet balance
- Track order status (pending, processing, completed, cancelled)
- My Purchases + Recent Orders pages

### 5.4 Website Request System
- Submit request via `build-website.html`
- Admin quotes price + sets deposit %
- Customer pays deposit from wallet
- Track progress (milestones, timeline, notes)
- Pay balance on delivery
- Email notifications at every stage

### 5.5 Voucher System
- Admin creates vouchers in panel
- Customers redeem for wallet credit
- Voucher debug log for troubleshooting

### 5.6 Referral System
- Unique referral link per user
- Earn commission on referrals
- Referral count + total earnings displayed on dashboard

### 5.7 Reseller & VIP
- Reseller upgrade (₦100,000 investment)
- VIP tier (₦60,000 spend)
- Request VIP page
- Unlock reseller flow

### 5.8 Admin Panel
- Orders, Users, Services, Shop, Analytics, Transactions, Vouchers, Website Requests
- Quote website requests
- Send emails to customers
- Manage vouchers

### 5.9 Users Activity Panel (Fraud Detection)
- 14+ fraud flags (unexplained wallet change, refund abuse, rapid funding, rapid orders, wash trading, zero-balance orders, shared email base, voucher abuse, referral spam, reseller without fee, VIP low spend, negative wallet, high refund ratio, self-referral)
- Block/unblock users with reason
- Wallet timeline per user
- Auto-flag cron job (`flag-monitor.php`)

### 5.10 Theme System
- Light / Dark / Auto toggle
- `theme.js` used across all pages
- Persists in localStorage

### 5.11 Notifications
- Email notifications (SMTP via PHPMailer)
- Telegram notifications (`telegram-notify.php`)
- Webhook logs

### 5.12 PWA
- `manifest.json` + `sw.js` for installable app

### 5.13 Build Website Guide
- Public page with copyable service guide
- Copy Full Version, Copy Short Version, Download as PDF

### 5.14 Suspended Page
- Shown to suspended users

---

## 6. Tech Stack

- **Frontend:** HTML + Bootstrap 5 + Vanilla JS
- **Auth:** Firebase Authentication
- **Database:** Firebase Realtime Database
- **Backend:** PHP (cPanel / Nairahost)
- **Payments:** Korapay (wallet funding)
- **Email:** PHPMailer via SMTP
- **Notifications:** Telegram Bot API
- **Hosting:** Nairahost
- **Domain:** hkdmservices.xyz
- **Version Control:** GitHub
- **CI:** GitHub Actions (`.github/workflows`)

---

## 7. Pending / TODO

- [ ] **Korapay webhook** — Migrate to Firebase Admin SDK (fix "Permission denied")
- [ ] **Firebase API key** — Rotate + move to environment variables
- [ ] **One-time services** — Troubleshoot listing/display issue
- [ ] **Firebase Security Rules** — Tighten Realtime Database rules
- [ ] **Services-old.html** — Decide whether to delete or keep as backup
- [ ] **Duplicate set-admin files** — `set-admin.js` + `setAdmin.js`
- [ ] **Debug/test PHP files** — Remove from production
- [ ] **Log files** — Rotate/clean (flag-monitor-log.txt is 5.3 MB)
- [ ] **PHPMailer-master.zip** — Remove after extraction
- [ ] **Firebase service account JSON** — Move outside `public_html`

---

## 8. Changelog

### Recent
- Admin panel rebuilt (13 parts) — debug blocks removed
- Users Activity Panel — theme + mobile navbar + 14+ fraud flags
- My Website Requests — payment toggle fixed (matches by `data-type`)
- Dashboard — Firebase SDK conflict fixed, persistence, referrals, orders
- Services page — restructured to show catalogue directly
- Build Website Guide — copy + PDF buttons
- Back buttons — added to 7 pages
- Custom domain — hkdmservices.xyz live via Nairahost
- Korapay webhook — initial version built (Permission denied issue identified)

---

## 9. Notes

- **Firebase Admin key** is currently in `api-php/` — should be moved outside `public_html` for security.
- **Log files** grow large — set up rotation.
- **Test/debug files** should be removed from production.
- **Cron job** runs `flag-monitor.php` every 15 minutes.
- **Webhook log** (`webhook_log.txt`) tracks all Korapay payment callbacks.
- **Website request log** (`website_request_log.txt`) tracks all website request activity.
