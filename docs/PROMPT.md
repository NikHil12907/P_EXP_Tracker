ROLE
You are a senior full-stack engineer building a personal expense tracker for ONE user (me). Work in small, reviewable phases. Do not move to the next phase until I approve. First action: save this entire prompt verbatim to docs/PROMPT.md and treat it as the source of truth for the whole project.

GOAL
A mobile-first Progressive Web App that shows my spending with charts, and automatically records expenses from bank debit SMS messages forwarded by an automation app on my Android phone.

NON-GOALS
Multi-user support, public signup, bank API integrations, payments, native apps. Do not add features outside this spec without asking.

STACK
Next.js (App Router, TypeScript strict), Supabase (Postgres + Auth + RLS), Vercel, Tailwind, Recharts for charts, Serwist (or next-pwa) for the service worker, Vitest for tests, Zod for validation.

ARCHITECTURE
Android automation app (MacroDroid) --> POST https://<app>/api/ingest with a secret token header --> parse SMS --> insert into Supabase --> PWA dashboard reads via Supabase client.
The PWA never reads SMS itself (browsers cannot). State this assumption in the README.

DATA MODEL (Postgres, migrations committed to git)
- raw_messages: id, sender, body, received_at, body_hash (UNIQUE), parse_status ('parsed' | 'needs_review' | 'ignored'), created_at
- expenses: id, raw_message_id (nullable FK), amount numeric(12,2), currency (default 'INR'), merchant, category_id, payment_mode ('UPI'|'card'|'netbanking'|'atm'|'other'), account_last4, occurred_at, balance_after numeric(12,2) nullable, upi_ref text UNIQUE nullable, source ('sms'|'manual'), note, created_at
- categories: id, name, color, icon
- merchant_rules: id, merchant_pattern, category_id (auto-categorisation)
Enable RLS on every table. Only my authenticated user can read/write. Disable public signups.

INGEST ENDPOINT (/api/ingest) - most critical part
1. Require header x-ingest-token, compared in constant time against an env secret. Reject with 401 otherwise. Add basic rate limiting.
2. Accept BOTH application/json and application/x-www-form-urlencoded with fields sender and body. received_at is optional (default to server time; the true transaction time comes from the SMS body). Reason: SMS text can contain quotes/newlines that break hand-built JSON on the phone side. Validate with Zod.
3. Compute body_hash = sha256(sender + body). Insert into raw_messages.
4. Run the parser. Only DEBIT messages become expenses. OTPs, credits, balance alerts and promos are marked 'ignored'.
5. DEDUP: use upi_ref as the primary dedup key; fall back to body_hash when there is no ref. A duplicate returns 200 and does nothing (phone automations retry, so the endpoint must be idempotent).
6. If the parser cannot confidently extract amount + merchant, mark 'needs_review' and show it in a "Needs review" inbox in the UI. Never guess silently, never drop silently.
7. Apply merchant_rules to set the category. When I manually correct a category in the UI, offer to save it as a rule.
8. Use the Supabase service-role key ONLY server-side. Never expose it to the client. Never console.log raw SMS bodies.

PARSER
Pure, side-effect-free function in /lib/parser, designed as a list of per-format matchers so new formats (card, ATM, other banks) are added by adding a fixture + a matcher. Return { amount, merchant, mode, last4, occurredAt, upiRef, balanceAfter } or null. Write Vitest tests FIRST.

Federal Bank UPI debit: start from this pattern and make it tolerant of spacing differences:
/Debited Rs\s?([\d,]+(?:\.\d{1,2})?) from a\/c X(\d{4}) on (\d{1,2}[A-Za-z]{3}\d{2}) (\d{2}:\d{2}) via (UPI) to (.+?)\.\s?Ref (\d+)\.\s?Bal Rs ([\d,]+(?:\.\d{1,2})?)/i
Strip commas from amounts, parse the date as DD MMM YY in Asia/Kolkata, trim the merchant.

SAMPLE SMS FIXTURES (Federal Bank; all values are fake, use only these in committed files)
1. "Debited Rs 40.00 from a/c X1234 on 17Aug26 13:18 via UPI to TEST MERCHANT A. Ref 600000000001.Bal Rs 11000.00. Not you?Call 18004251199 -Federal Bank"
   -> amount 40.00, last4 1234, occurredAt 2026-08-17 13:18 IST, mode UPI, merchant "TEST MERCHANT A", upiRef 600000000001, balanceAfter 11000.00
2. "Debited Rs 60.00 from a/c X1234 on 20Aug26 21:30 via UPI to TESTUSER ONE. Ref 600000000002.Bal Rs 10700.00. Not you?Call 18004251199 -Federal Bank"
   -> same shape. NOTE: 11000.00 - 60.00 != 10700.00, so the balance-gap detector must flag a 240.00 gap here.
3. "Debited Rs 200.00 from a/c X1234 on 21Aug26 18:10 via UPI to Adhoc Test PE. Ref 600000000003.Bal Rs 10500.00. Not you?Call 18004251199 -Federal Bank"
   -> balance chain is consistent (10700.00 - 200.00 = 10500.00), no gap flagged.
Negative tests: an OTP message, a credit ("Credited Rs ..."), and a promo must all return null / 'ignored'. Any Federal Bank format that does not match goes to 'needs_review'.

BALANCE GAP DETECTOR
After inserting an expense, compare the previous expense's balance_after minus this amount with this balance_after. If they differ, show a "possible missed transaction" notice in the UI with the gap amount so I can add it manually. Do not block the insert.

UI (mobile-first, design at 390px width first, then scale up)
- Home: this month's total, today's total, last 5 transactions, floating "+" for manual entry.
- Charts: daily spend (bar), category split (donut), month-over-month comparison, top 5 merchants. Date range filter: week / month / custom.
- Transactions: list with search, filter by category/mode, tap to edit category/note, delete.
- Needs review inbox for unparsed SMS, and the missed-transaction notices.
- Optimistic UI updates for edits and deletes.
- Thumb-friendly: min 44px touch targets, bottom navigation, no horizontal scroll.
- Dark and light mode. Clean, fast, minimal. No decorative animation.

PWA
Valid manifest, icons, installable on Android home screen, service worker caching the app shell, last-loaded data viewable offline. Pass Lighthouse PWA and performance checks on mobile.

SECURITY
Supabase Auth with email login for my account only. Secrets only in env vars. Commit .env.example, never .env. Add security headers. Document a brief threat model in docs/SECURITY.md (SMS data is sensitive financial data).

GIT WORKFLOW
- Initialise the repo first with .gitignore, README, .env.example.
- main is always deployable. One branch per phase: feat/<phase-name>.
- Conventional Commits (feat:, fix:, chore:, test:, docs:), small and frequent.
- End each phase with a PR-style summary for me to review before merging.

PHASES (stop after each and wait for my approval)
0. Write docs/SPEC.md and docs/ARCHITECTURE.md from this prompt. List your assumptions and open questions. No code yet.
1. Repo scaffold, Supabase schema + migrations, auth, deploy skeleton to Vercel.
2. Parser + tests (no UI).
3. /api/ingest endpoint + tests, then walk me through connecting MacroDroid on my Android phone.
4. Dashboard, transactions, needs-review UI, gap notices.
5. Charts.
6. PWA + offline + Lighthouse pass.
7. Hardening: error handling, rate limit check, README with setup steps.

DEFINITION OF DONE (per phase)
Type-check and lint pass, tests pass, I can run it and verify it myself, and you list exactly what to test manually.

START NOW: do only Phase 0, then stop and wait for my approval. If anything in this spec is ambiguous, ask me before building.
