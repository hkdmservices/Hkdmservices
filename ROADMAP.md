# HKDM Services — Roadmap

What to build next, in priority order.

---

## 🚨 PRIORITY 1 — Fix Broken Things (This Week)

### 1. Fix Korapay Webhook (Firebase Admin SDK)
**Why:** Wallet funding is broken. Users pay, don't get credited.
**What:** Rewrite `webhook.php` using `kreait/firebase-php`.
**Time:** 30–60 min

### 2. Rotate Firebase API Key
**Why:** Exposed in multiple chats + files.
**What:** Generate new key, restrict, update references.
**Time:** 15 min

### 3. Move Service Account JSON Outside `public_html`
**Why:** Currently publicly accessible.
**Time:** 10 min

### 4. Delete Test/Debug Files
**Time:** 15 min

### 5. Move Logs Outside `public_html`
**Time:** 20 min

---

## ⚙️ PRIORITY 2 — Finish Half-Built (Next 2 Weeks)

### 6. One-Time Services Fix
**Time:** 1–2 hrs

### 7. Admin 2FA
**Time:** 2–3 hrs

### 8. Rate Limiting on Payment Endpoints
**Time:** 2–3 hrs

### 9. Idempotency on Webhook
**Time:** 30 min

### 10. Clean Up Duplicate Files
**Time:** 10 min

---

## 🚀 PRIORITY 3 — High-Value (1–2 Months)

11. WhatsApp order notifications (4–6 hrs)
12. Automated refund flow (2–3 hrs)
13. Service performance tracking (3–4 hrs)
14. Bulk order upload (4–6 hrs)
15. Email template system (3–4 hrs)
16. Customer support tickets (6–8 hrs)

---

## 💡 PRIORITY 4 — Growth (3–6 Months)

17. Multi-currency support (1–2 weeks)
18. Reseller API (2–3 weeks)
19. Customer analytics dashboard (1 week)
20. Affiliate program expansion (3–4 days)
21. Mobile app (3–4 weeks)
22. Automated backups (3–4 hrs)
23. Compliance pages (1 week)

---

## 🎯 PRIORITY 5 — Nice to Have

24. Dark mode polish (2 hrs)
25. Order filtering in admin (3 hrs)
26. Customer notes (2 hrs)
27. Referral leaderboard (3 hrs)
28. Loyalty points (1 week)
29. Multi-language (1–2 weeks)
30. Voice search (4 hrs)

---

## 📋 Recommended Order (Do These First)

1. **Fix Korapay webhook** — critical
2. **Rotate Firebase key** — urgent security
3. **Move service account JSON** — urgent security
4. **Fix one-time services** — user-facing bug
5. **Add admin 2FA** — protect account

---

## 🗓️ Suggested Timeline

**Week 1:** Webhook fix, key rotation, service account move, cleanup
**Week 2:** Logs, one-time services, duplicate files
**Week 3–4:** 2FA, rate limiting, idempotency
**Month 2:** WhatsApp, refunds, tracking
**Month 3–4:** Bulk upload, templates, tickets
**Month 5–6:** API, analytics, backups

---

## ⚠️ Do NOT

- Don't disable Firebase rules to fix webhook
- Don't build new features while payments are broken
- Don't add more API keys to code
- Don't skip backups

---

## 📊 Tracking

- [ ] Fix Korapay webhook
- [ ] Rotate Firebase API key
- [ ] Move service account JSON
- [ ] Delete test/debug files
- [ ] Move logs outside public_html
- [ ] Fix one-time services
- [ ] Add admin 2FA
- [ ] Add rate limiting
- [ ] Add webhook idempotency
- [ ] Clean duplicate files
- [ ] WhatsApp order notifications
- [ ] Automated refunds
- [ ] Service performance tracking
- [ ] Bulk order upload
- [ ] Email template system
- [ ] Support ticket system
- [ ] Multi-currency support
- [ ] Reseller API
- [ ] Analytics dashboard
- [ ] Affiliate expansion
- [ ] Mobile app
- [ ] Automated backups
- [ ] Compliance pages
