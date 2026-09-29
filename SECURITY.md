# HKDM Services — Security Improvement Plan

Every security issue, its risk level, and the exact fix.

---

## 🚨 CRITICAL — Fix Immediately

### 1. Firebase API Key Exposed
**Where:** `firebase.js`, `firebase-admin.js`, `admin-update-website-request.php`, `flag-monitor.php`
**Risk:** Key `AIzaSyADh...` used with `?auth=` bypasses Firebase Security Rules. Anyone with it can read/write your entire database.
**Fix:**
1. Google Cloud Console → APIs & Services → Credentials
2. Restrict key to: Identity Toolkit API, Firebase Realtime Database API
3. Add HTTP referrer restrictions (`hkdmservices.xyz/*`)
4. Rotate key (create new, delete old)
5. Move to env var: `getenv('FIREBASE_API_KEY')`

### 2. Firebase Service Account Key in `public_html`
**Where:** `api-php/hkdmservices-7d59f-firebase-adminsdk-fbsvc-4e20c7c9bb.json`
**Risk:** Grants full admin access. If leaked → full control.
**Fix:**
1. Move file outside `public_html` (e.g. `/var/secure/keys/firebase-adminsdk.json`)
2. Update path in `webhook.php`
3. Verify `api-php/` cannot be listed
4. Add to `.gitignore`

### 3. Korapay Webhook — Permission Denied
**Where:** `webhook.php`
**Risk:** Webhook fails because it uses REST API with no auth. Disabling Firebase rules to fix it opens a worse hole.
**Fix:** Migrate to Firebase Admin SDK. **Do NOT** disable Firebase rules.

---

## ⚠️ HIGH — Fix This Week

### 4. Firebase Rules Too Open
**Where:** Firebase Console → Realtime Database → Rules
**Risk:** If `.read: true, .write: true`, anyone can read/write everything.
**Fix:** Use strict rules:
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        "wallet": {
          ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
        }
      }
    },
    "orders": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "pending_payments": {
      ".read": false,
      ".write": false
    },
    "transactions": {
      ".read": "auth != null && (data.child('uid').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
      ".write": false
    }
  }
}
