# Security & Threat Model (docs/SECURITY.md)

> **Classification**: Sensitive Financial Application  
> **Target Audience**: Single Authorized Owner

---

## 1. Overview & Data Sensitivity

This application records and processes personal financial data extracted from bank SMS messages, including:
- Partial bank account numbers (`account_last4`)
- Real-time account balances (`balance_after`)
- Merchant/payee names and payment modes (UPI, Card, ATM)
- Exact transaction amounts and timestamps

A breach of this data would expose spending habits, account balances, and merchant relationships. Consequently, security defense-in-depth is enforced across ingestion, storage, transmission, and rendering.

---

## 2. Threat Analysis & Mitigations

### 2.1 Threat Vector 1: Unauthorized Ingestion Webhook Abuse
- **Scenario**: An attacker scans the `/api/ingest` URL and attempts to inject forged debit transactions or spam messages.
- **Mitigations**:
  1. **Constant-Time Token Comparison**: All requests must supply an `x-ingest-token` HTTP header. The token is evaluated using `crypto.timingSafeEqual()` against `process.env.INGEST_SECRET_TOKEN` to prevent side-channel timing attacks.
  2. **High-Entropy Secret**: The token is recommended to be a randomly generated 256-bit hexadecimal string (32 bytes).
  3. **Rate Limiting**: Sliding-window rate limiter on the `/api/ingest` route prevents brute-forcing and denial-of-service replay storms.
  4. **Optional Sender Filter**: `ALLOWED_SENDER_PATTERN` rejects any payload where the sender does not match expected banking sender IDs.

### 2.2 Threat Vector 2: Public Registration & Unauthorized Access
- **Scenario**: An outsider visits the dashboard URL and attempts to register an account to view or modify financial data.
- **Mitigations**:
  1. **Public Signups Disabled**: In Supabase Auth, "Allow new users to sign up" is disabled.
  2. **Manual Provisioning**: Only the single pre-created owner account exists in `auth.users`.
  3. **Row-Level Security (RLS)**: Every database table (`raw_messages`, `expenses`, `categories`, `merchant_rules`, `balance_gaps`) has RLS enabled. Read and write operations strictly require `auth.role() = 'authenticated'`.
  4. **Route Protection**: Next.js middleware redirects all unauthenticated requests to `/login`.

### 2.3 Threat Vector 3: Financial Data Leakage in Logs
- **Scenario**: Application error handlers or debugging statements dump full SMS text into serverless execution logs (Vercel logs).
- **Mitigations**:
  1. **Strict Logging Prohibition**: No raw SMS body is ever passed to `console.log`, `console.error`, or telemetry in production code.
  2. **Masked Diagnostics**: Error messages stored in `raw_messages.error_message` record parser error codes or generic descriptions without printing sensitive account details.

### 2.4 Threat Vector 4: Credential Exposure via Client-Side Bundling
- **Scenario**: Developers accidentally import server-side Supabase credentials into client components, exposing the database admin key.
- **Mitigations**:
  1. **Service Role Key Isolation**: `SUPABASE_SERVICE_ROLE_KEY` is loaded exclusively inside server-only modules (`src/lib/supabase/service.ts` and server route handlers).
  2. **Environment Variable Naming**: Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are allowed to have the `NEXT_PUBLIC_` prefix. Next.js compiler will never bundle non-prefixed variables into client JavaScript.

### 2.5 Threat Vector 5: Network Interception (Man-in-the-Middle)
- **Scenario**: An eavesdropper intercepts mobile cellular or public Wi-Fi transmissions between the phone and Vercel.
- **Mitigations**:
  1. **Strict HTTPS**: Enforced HTTPS across all Vercel edge endpoints.
  2. **HSTS Header**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header applied to all responses.
  3. **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and strict Referrer-Policy configured in `next.config.mjs`.

---

## 3. Incident Response & Secret Rotation

If the `INGEST_SECRET_TOKEN` or Supabase keys are suspected of being compromised:
1. Immediately rotate the token in the Vercel project environment variables and restart deployments.
2. Update the `x-ingest-token` HTTP header inside the MacroDroid macro on the Android device.
3. In Supabase Dashboard, rotate the `service_role` and `anon` keys if needed.
