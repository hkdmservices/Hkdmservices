<?php
/**
 * sync-user-private.php
 * Mirrors wallet fields into user_private/{uid} via the Firebase service account.
 * Service account bypasses security rules, so this works even though
 * user_private has ".write": false in Firebase rules.
 *
 * Safe to require_once multiple times.
 */

if (!function_exists('syncUserPrivate')) {

    function base64url_encode_sync($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    function getServiceAccountAccessToken() {
        static $token = false; // false = not fetched yet, null = failed, string = token
        if ($token !== false) return $token;

        $path = '/home/hkdmserv/firebase-service-account.json';
        if (!file_exists($path)) {
            $token = null;
            return null;
        }
        $sa = json_decode(file_get_contents($path), true);
        if (!$sa || empty($sa['private_key'])) {
            $token = null;
            return null;
        }

        $now = time();
        $header  = base64url_encode_sync(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $payload = base64url_encode_sync(json_encode([
            'iss'   => $sa['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
            'aud'   => $sa['token_uri'],
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));
        $sigInput = "$header.$payload";
        $signature = '';
        if (!openssl_sign($sigInput, $signature, $sa['private_key'], 'SHA256')) {
            $token = null;
            return null;
        }
        $jwt = "$sigInput." . base64url_encode_sync($signature);

        $ch = curl_init($sa['token_uri']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT => 10,
        ]);
        $resp = json_decode(curl_exec($ch), true);
        curl_close($ch);

        $token = $resp['access_token'] ?? null;
        return $token;
    }

    /**
     * Mirror wallet-related fields to user_private/{uid}.
     *
     * @param string $firebaseDbUrl  e.g. https://hkdmservices-7d59f-default-rtdb.firebaseio.com
     * @param string $uid
     * @param array  $fields         e.g. ['wallet' => 123, 'totalSpent' => 456]
     * @return bool                  true on success
     */
    function syncUserPrivate($firebaseDbUrl, $uid, $fields) {
        if (!$uid || empty($fields)) return false;

        $token = getServiceAccountAccessToken();
        if (!$token) {
            error_log("syncUserPrivate: no service account token");
            return false;
        }

        $url = rtrim($firebaseDbUrl, '/') . "/user_private/$uid.json?access_token=" . urlencode($token);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => 'PATCH',
            CURLOPT_POSTFIELDS     => json_encode($fields),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 10,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            error_log("syncUserPrivate failed ($code) for uid=$uid: $resp");
            return false;
        }
        return true;
    }
}
