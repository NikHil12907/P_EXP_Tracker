# Personal Expense Tracker - System Specification (docs/SPEC.md)

> **Document Status**: Approved Specification  
> **Source of Truth Reference**: [`docs/PROMPT.md`](file:///d:/ET_V1/docs/PROMPT.md)  
> **Target Audience**: Single User (Personal Application)

---

## 1. Executive Summary & Goals

### 1.1 Goal
Build a private, mobile-first Progressive Web App (PWA) that provides real-time personal spending analytics, interactive charts, and automated expense capture from Indian bank debit SMS messages (initially Federal Bank UPI) forwarded automatically by MacroDroid from an Android phone.

### 1.2 Non-Goals (Explicitly Out of Scope)
- **Multi-user support**: Locked down to ONE authorized user.
- **Public signups**: Public self-registration is permanently disabled in Supabase Auth.
- **Direct bank API / Account Aggregator integrations**: No Open Banking or third-party credential scraping.
- **Payment processing / funds transfer**: Read-only tracking; no money moves through this app.
- **Native Android/iOS app**: PWA only. The browser never reads SMS directly (Android browser security sandbox prohibits SMS access).
- **Extraneous feature bloat**: No budgeting games, no crypto/stock tracking, no shared group bills.

---

## 2. Technology Stack & Tooling

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, React 19, TypeScript Strict) | Modern server components, typed API routes, zero-config Vercel deployment. |
| **Database & Auth** | Supabase (PostgreSQL 15+, Supabase Auth, Row-Level Security) | Managed relational DB, atomic SQL migrations in Git, rock-solid RLS, email + password auth. |
| **Styling** | Tailwind CSS | Mobile-first utility design, dark/light mode support, lightweight footprint. |
| **Charts** | Recharts | Responsive, composable SVG charts (daily spend bar, category donut, MoM comparison). |
| **Service Worker / PWA** | Serwist | Hashed static asset caching; strict exclusion of financial API/auth responses. |
| **Client Offline Store**| IndexedDB / React Query Persister | Encrypted/in-app storage for offline viewing; cleared immediately upon sign-out. |
| **Validation** | Zod | Runtime payload and schema validation with strict TypeScript inference. |
| **Testing** | Vitest | Fast, native ESM unit and integration testing. |
| **Deployment** | Vercel | Edge/serverless hosting for Next.js, automated preview and production deploys. |

---

## 3. Data Model & Database Architecture

All tables reside in PostgreSQL in Supabase. Migrations are managed via SQL files committed in `supabase/migrations/`. Row-Level Security (RLS) is enabled on every table, strictly limiting read/write access to the single authenticated owner user ID (`auth.uid() = '<OWNER_UID>'`). Public signups are disabled; the owner account is created manually via the Supabase Dashboard. Server-side ingestion runs using the Supabase Service Role Key inside an atomic PostgreSQL function (RPC).

### 3.1 Canonical Category List
The system uses one canonical list of seeded categories across all documentation, UI, and database seeds:
1. **Food & Dining** (`#F97316`, `utensils`)
2. **Groceries** (`#10B981`, `shopping-cart`)
3. **Shopping** (`#EC4899`, `shopping-bag`)
4. **Bills & Utilities** (`#3B82F6`, `zap`)
5. **Travel & Fuel** (`#8B5CF6`, `car`)
6. **Health & Medical** (`#EF4444`, `heart-pulse`)
7. **Entertainment** (`#F59E0B`, `film`)
8. **Personal/Other** (`#6B7280`, `user`)
9. **Transfers (People)** (`#06B6D4`, `arrow-right-left`)

*Default Categorisation Rule*: All newly parsed or manually added expenses without a matching rule default to **Uncategorised** (`category_id = NULL`), never to `Personal/Other`.

### 3.2 Tables & Schema Definition

#### 1. `categories`
- `id`: `uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `name`: `text NOT NULL UNIQUE`
- `color`: `text NOT NULL`
- `icon`: `text NOT NULL`
- `created_at`: `timestamptz NOT NULL DEFAULT now()`

#### 2. `merchant_rules`
- `id`: `uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `merchant_pattern`: `text NOT NULL UNIQUE`
- `category_id`: `uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE`
- `created_at`: `timestamptz NOT NULL DEFAULT now()`

#### 3. `raw_messages`
Stores every inbound SMS webhook payload for auditing, deduplication, and reprocessing.
- `id`: `uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `sender`: `text NOT NULL`
- `body`: `text NOT NULL`
- `received_at`: `timestamptz NOT NULL DEFAULT now()`
- `body_hash`: `text NOT NULL UNIQUE` (SHA-256 hash of `sender.trim() + ':' + body.trim()`)
- `parse_status`: `text NOT NULL CHECK (parse_status IN ('parsed', 'needs_review', 'ignored', 'checkpoint'))`
  - `'checkpoint'` is reserved in the DB schema for future credit/balance SMS that update account balance checkpoints without creating an expense.
- `error_message`: `text NULL`
- `created_at`: `timestamptz NOT NULL DEFAULT now()`

#### 4. `expenses`
Normalized financial records representing debits and manual entries.
- `id`: `uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `raw_message_id`: `uuid NULL REFERENCES raw_messages(id) ON DELETE SET NULL`
- `amount`: `numeric(12, 2) NOT NULL CHECK (amount > 0)`
- `currency`: `text NOT NULL DEFAULT 'INR'`
- `merchant`: `text NOT NULL`
- `category_id`: `uuid NULL REFERENCES categories(id) ON DELETE SET NULL` (NULL = Uncategorised)
- `payment_mode`: `text NOT NULL CHECK (payment_mode IN ('UPI', 'card', 'netbanking', 'atm', 'other'))`
- `account_last4`: `varchar(4) NULL`
- `occurred_at`: `timestamptz NOT NULL`
- `balance_after`: `numeric(12, 2) NULL`
- `upi_ref`: `text NULL UNIQUE` (Primary dedup key)
- `source`: `text NOT NULL CHECK (source IN ('sms', 'manual'))`
- `note`: `text NULL`
- `created_at`: `timestamptz NOT NULL DEFAULT now()`

#### 5. `balance_gaps`
Persisted discrepancy notices evaluated per `account_last4`.
- `id`: `uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`
- `account_last4`: `varchar(4) NOT NULL`
- `gap_type`: `text NOT NULL CHECK (gap_type IN ('under_balance', 'over_balance'))`
  - `'under_balance'`: Balance dropped MORE than expected (`actual < expected`). Flags an active "possible missed transaction" notice.
  - `'over_balance'`: Balance is HIGHER than expected (`actual > expected`). Quiet notice: "balance higher than expected (likely a credit)", no action required.
- `expected_balance`: `numeric(12, 2) NOT NULL`
- `actual_balance`: `numeric(12, 2) NOT NULL`
- `gap_amount`: `numeric(12, 2) NOT NULL CHECK (gap_amount >= 0)`
- `detected_at_expense_id`: `uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE`
- `status`: `text NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'dismissed'))`
- `resolved_by_expense_id`: `uuid NULL REFERENCES expenses(id) ON DELETE SET NULL`
- `created_at`: `timestamptz NOT NULL DEFAULT now()`

---

## 4. Money Precision & Arithmetic Rules

- **Zero Floats in Monetary Arithmetic**: All financial calculations in application code (TypeScript) and database functions must be performed either:
  1. In integer **paise** ($\text{amount in paise} = \text{round}(\text{amount in INR} \times 100)$).
  2. Or using exact decimal string / fixed-point representations.
- **Exact Gap Comparisons**: Discrepancies are calculated as exact integer paise differences:
  $$\Delta_{\text{paise}} = \text{BalanceAfter}_{\text{paise}} - (\text{PrevBalance}_{\text{paise}} - \text{Amount}_{\text{paise}})$$
- An exact gap exists if and only if $\Delta_{\text{paise}} \neq 0$.

---

## 5. Ingestion Endpoint Specification (`/api/ingest`)

### 5.1 Authentication & Rate Limiting Design
- **Header Requirement**: Must include `x-ingest-token: <SECRET_TOKEN>`.
- **Constant-Time Comparison**: Evaluated against `process.env.INGEST_SECRET_TOKEN` via `crypto.timingSafeEqual`. Rejection yields `401 Unauthorized`.
- **Primary Security Control**: A 256-bit cryptographically random token (32 bytes hex) is the primary access control. Because in-memory rate limiting is ineffective across ephemeral Vercel serverless isolates, external shared rate limiting (e.g. Upstash Redis) is optional.
  > **Architectural Recommendation**: Use the 256-bit token as the primary control without introducing Upstash Redis to keep the architecture lean and zero-dependency for a single-user private webhook.
- **Optional Sender Filter**: Read optional `ALLOWED_SENDER_PATTERN` env var. If set, sender must match regex; if unset or empty, accept any sender.
- **Privacy & Logging**: Under **no circumstances** may raw SMS body contents be output to standard logging (`console.log`, stdout) in production.

### 5.2 Content-Type Handling & Validation
Accepts BOTH `application/json` AND `application/x-www-form-urlencoded`:
- Zod Schema:
  ```typescript
  z.object({
    sender: z.string().min(1).max(100),
    body: z.string().min(1).max(2000),
    received_at: z.string().datetime().optional()
  })
  ```
- If `received_at` is omitted, server time (`new Date().toISOString()`) is used as fallback.

### 5.3 Atomicity & Database RPC Function (`process_ingested_message`)
To guarantee that a crash or network partition never strands a message between `raw_messages` and `expenses`, all ingestion writes execute within a single PostgreSQL function (`process_ingested_message`):

1. **Deduplication on `body_hash`**:
   - `INSERT INTO raw_messages ... ON CONFLICT (body_hash) DO NOTHING;`
   - If conflict:
     - Check if existing raw message already has an associated expense or is marked `'ignored'`.
     - If yes, return `{ status: 'duplicate' }` with HTTP 200.
     - If existing raw message has NO linked expense and is NOT `'ignored'` (e.g. previously `'needs_review'` or interrupted), it is **reprocessable** and proceeds through the pipeline!
2. **Parser Execution**: Pure function `parseSms(body, sender)`.
   - If `'ignored'`: update `raw_messages.parse_status = 'ignored'`; return `{ status: 'ignored' }`.
   - If `'needs_review'`: update `raw_messages.parse_status = 'needs_review'`; return `{ status: 'needs_review' }`.
   - If `'parsed'`:
3. **Deduplication on `upi_ref`**:
   - If `upi_ref` is present, insert into `expenses` with `ON CONFLICT (upi_ref) DO NOTHING`.
   - If conflict on `upi_ref`: link raw message to existing expense, mark `'parsed'`, return `{ status: 'duplicate' }`.
4. **Expense Insertion & Categorisation**:
   - Match `merchant` against `merchant_rules`. If matched, set `category_id`; otherwise `category_id = NULL` (Uncategorised).
   - Insert row into `expenses`.
5. **Bidirectional Gap Chain Re-Evaluation**:
   - Execute gap evaluation within the same transaction for BOTH the new transaction AND any subsequent transaction (see Section 7).
6. **Commit**: Transaction commits atomically.

---

## 6. SMS Parser Specification (`lib/parser`)

Pure, side-effect-free function in `lib/parser/index.ts`.

### 6.1 Parser Contract & Discriminated Union
```typescript
export interface ParsedExpense {
  amount: number; // Stored as decimal in DB, computed in integer paise in calculations
  merchant: string;
  paymentMode: 'UPI' | 'card' | 'netbanking' | 'atm' | 'other';
  accountLast4: string;
  occurredAt: Date;
  upiRef: string | null;
  balanceAfter: number | null;
}

export type ParseResult =
  | { status: 'parsed'; data: ParsedExpense }
  | { status: 'ignored'; reason: 'otp' | 'credit' | 'promo' | 'balance_alert' }
  | { status: 'needs_review'; reason: 'unrecognized_format' | 'low_confidence' };

export function parseSms(body: string, sender: string): ParseResult;
```

### 6.2 Federal Bank UPI Debit Matcher
```regex
/Debited Rs\s?([\d,]+(?:\.\d{1,2})?) from a\/c X(\d{4}) on (\d{1,2}[A-Za-z]{3}\d{2}) (\d{2}:\d{2}) via (UPI) to (.+?)\.\s?Ref (\d+)\.\s?Bal Rs ([\d,]+(?:\.\d{1,2})?)/i
```
- Spacing-tolerant.
- Commas stripped from amounts (`11,000.00` -> `11000.00`).
- Date parsed as `DD MMM YY HH:mm` in `Asia/Kolkata` (UTC+05:30).
- Merchant trimmed.

### 6.3 Test Fixtures (Federal Bank - Synthetic Values)
1. **Fixture 1 (Standard Debit)**:
   - SMS: `"Debited Rs 40.00 from a/c X1234 on 17Aug26 13:18 via UPI to TEST MERCHANT A. Ref 600000000001.Bal Rs 11000.00. Not you?Call 18004251199 -Federal Bank"`
   - Output: `{ amount: 40.00, last4: "1234", occurredAt: "2026-08-17T13:18:00+05:30", mode: "UPI", merchant: "TEST MERCHANT A", upiRef: "600000000001", balanceAfter: 11000.00 }`
2. **Fixture 2 (Debit with Under-Balance Gap)**:
   - SMS: `"Debited Rs 60.00 from a/c X1234 on 20Aug26 21:30 via UPI to TESTUSER ONE. Ref 600000000002.Bal Rs 10700.00. Not you?Call 18004251199 -Federal Bank"`
   - Check: `11000.00 - 60.00 = 10940.00 != 10700.00`. Actual balance (10700) is LOWER than expected (10940) by 240.00. Flags active gap notice.
3. **Fixture 3 (Consistent Chain)**:
   - SMS: `"Debited Rs 200.00 from a/c X1234 on 21Aug26 18:10 via UPI to Adhoc Test PE. Ref 600000000003.Bal Rs 10500.00. Not you?Call 18004251199 -Federal Bank"`
   - Check: `10700.00 - 200.00 = 10500.00`. Chain consistent, no gap flagged.
4. **Negative Test Cases**:
   - Credit: `"Credited Rs 5000.00 to a/c X1234 on 15Aug26..."` -> returns `{ status: 'ignored', reason: 'credit' }`.
   - OTP: `"123456 is your secret OTP for transaction at..."` -> returns `{ status: 'ignored', reason: 'otp' }`.
   - Promo: `"Get 20% off on your Federal Bank debit card at..."` -> returns `{ status: 'ignored', reason: 'promo' }`.
   - Any unrecognized format from bank -> `{ status: 'needs_review', reason: 'unrecognized_format' }`.

---

## 7. Balance Gap Chain Ordering & Out-of-Order Evaluation

### 7.1 Chain Ordering
To deterministically order transactions that occur within the same minute:
$$\text{Order Criterion: } (\text{occurred\_at ASC}, \text{created\_at ASC})$$

### 7.2 Out-of-Order Gap Evaluation
When expense $E_{\text{curr}}$ is inserted with `account_last4` and `balance_after`:
1. **Predecessor Evaluation ($E_{\text{prev}} \to E_{\text{curr}}$)**:
   - Find $E_{\text{prev}}$: highest `(occurred_at, created_at)` strictly before $E_{\text{curr}}$ where `balance_after IS NOT NULL` and `account_last4 = E_{\text{curr}}.account_last4`.
   - If $E_{\text{prev}}$ exists, compute:
     $$\Delta_{\text{prev}} = E_{\text{curr}}.\text{balance\_after} - (E_{\text{prev}}.\text{balance\_after} - E_{\text{curr}}.\text{amount})$$
     - If $\Delta_{\text{prev}} < 0$: Raise/update `balance_gaps` (`gap_type = 'under_balance'`, `gap_amount = abs(\Delta_{\text{prev}})`).
     - If $\Delta_{\text{prev}} > 0$: Raise/update `balance_gaps` (`gap_type = 'over_balance'`, `gap_amount = \Delta_{\text{prev}}`).
     - If $\Delta_{\text{prev}} = 0$: Any existing gap for $E_{\text{curr}}$ is cleared/resolved.
2. **Successor Re-Evaluation ($E_{\text{curr}} \to E_{\text{next}}$)**:
   - Find $E_{\text{next}}$: lowest `(occurred_at, created_at)` strictly after $E_{\text{curr}}$ where `balance_after IS NOT NULL` and `account_last4 = E_{\text{curr}}.account_last4`.
   - If $E_{\text{next}}$ exists, re-evaluate gap between $E_{\text{curr}}$ and $E_{\text{next}}$:
     $$\Delta_{\text{next}} = E_{\text{next}}.\text{balance\_after} - (E_{\text{curr}}.\text{balance\_after} - E_{\text{next}}.\text{amount})$$
     - Update or remove existing gap records attached to $E_{\text{next}}$.
     - This guarantees that delayed SMS arrivals automatically repair or realign the ledger chain.

### 7.3 Auto-Resolution & Dismissal
- **Auto-Resolve on Manual Expense Entry**:
  - When the user manually logs an expense whose amount matches an unresolved `under_balance` gap on the same `account_last4` within the gap time window:
  - Automatically update `balance_gaps.status = 'resolved'` with `resolved_by_expense_id = manual_expense.id`.
- **Manual Dismissal**:
  - Every gap notice in the UI includes a manual **Dismiss** button setting `status = 'dismissed'`.

---

## 8. Offline & Progressive Web App (PWA) Security

### 8.1 Service Worker Strategy
- **Hashed Static Assets Only**: Cache-First strategy applies strictly to `/_next/static/*`, static SVG/PNG icons, and fonts.
- **Pages & Data**: Network-First strategy.
- **Strict Financial Isolation**:
  - The Service Worker HTTP Cache API must **NEVER** cache `/api/*`, Supabase REST endpoints, or authentication tokens/cookies.
- **Offline Data Storage**:
  - Financial data for offline viewing is cached exclusively in an in-app client-side store (React Query Persister / IndexedDB).
  - **Sign-Out Purge**: On user sign-out, the in-app offline store is wiped completely.

---

## 9. Row-Level Security (RLS) & Phase 1 Verification

### 9.1 Single-Owner RLS Migration Sequence
1. Supabase project created.
2. Owner account created manually in Supabase Auth Users dashboard.
3. The owner's `auth.uid()` is plugged into the RLS policy:
   ```sql
   CREATE POLICY "Owner access only" ON public.expenses
       FOR ALL TO authenticated
       USING (auth.uid() = '<OWNER_UID>')
       WITH CHECK (auth.uid() = '<OWNER_UID>');
   ```
4. Repeat for all tables: `raw_messages`, `expenses`, `categories`, `merchant_rules`, `balance_gaps`.

### 9.2 Verification Test (Definition of Done)
Run this command from any terminal:
```bash
curl -i https://<project-ref>.supabase.co/rest/v1/expenses \
  -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
```
- **Expected Result**: HTTP `200 OK` returning an empty JSON array `[]`, or `401 Unauthorized`. Zero rows returned to unauthenticated callers.
