-- ==============================================================================
-- Migration: 20261004000001_create_schema.sql
-- Description: Core tables, canonical categories, atomic ingestion RPC, and RLS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: categories (Canonical List)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Canonical Categories
INSERT INTO public.categories (name, color, icon) VALUES
    ('Food & Dining', '#F97316', 'utensils'),
    ('Groceries', '#10B981', 'shopping-cart'),
    ('Shopping', '#EC4899', 'shopping-bag'),
    ('Bills & Utilities', '#3B82F6', 'zap'),
    ('Travel & Fuel', '#8B5CF6', 'car'),
    ('Health & Medical', '#EF4444', 'heart-pulse'),
    ('Entertainment', '#F59E0B', 'film'),
    ('Personal/Other', '#6B7280', 'user'),
    ('Transfers (People)', '#06B6D4', 'arrow-right-left')
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Table: merchant_rules
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchant_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_pattern TEXT NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Table: raw_messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raw_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    body_hash TEXT NOT NULL UNIQUE,
    parse_status TEXT NOT NULL CHECK (parse_status IN ('parsed', 'needs_review', 'ignored', 'checkpoint')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_messages_body_hash ON public.raw_messages(body_hash);
CREATE INDEX IF NOT EXISTS idx_raw_messages_status ON public.raw_messages(parse_status);

-- ------------------------------------------------------------------------------
-- 4. Table: expenses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_message_id UUID REFERENCES public.raw_messages(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    merchant TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Default NULL (Uncategorised)
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('UPI', 'card', 'netbanking', 'atm', 'other')),
    account_last4 VARCHAR(4),
    occurred_at TIMESTAMPTZ NOT NULL,
    balance_after NUMERIC(12, 2),
    upi_ref TEXT UNIQUE,
    source TEXT NOT NULL CHECK (source IN ('sms', 'manual')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_chain_order ON public.expenses(account_last4, occurred_at ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_expenses_occurred_at ON public.expenses(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_upi_ref ON public.expenses(upi_ref);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_raw_msg ON public.expenses(raw_message_id);

-- ------------------------------------------------------------------------------
-- 5. Table: balance_gaps
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.balance_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_last4 VARCHAR(4) NOT NULL,
    gap_type TEXT NOT NULL CHECK (gap_type IN ('under_balance', 'over_balance')),
    expected_balance NUMERIC(12, 2) NOT NULL,
    actual_balance NUMERIC(12, 2) NOT NULL,
    gap_amount NUMERIC(12, 2) NOT NULL CHECK (gap_amount >= 0),
    detected_at_expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'dismissed')),
    resolved_by_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_balance_gaps_lookup ON public.balance_gaps(account_last4, status);
CREATE INDEX IF NOT EXISTS idx_balance_gaps_expense ON public.balance_gaps(detected_at_expense_id);

-- ------------------------------------------------------------------------------
-- 6. Atomic Ingestion RPC Function: process_ingested_message
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_ingested_message(
    p_sender TEXT,
    p_body TEXT,
    p_received_at TIMESTAMPTZ,
    p_body_hash TEXT,
    p_parse_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_amount NUMERIC(12, 2) DEFAULT NULL,
    p_currency TEXT DEFAULT 'INR',
    p_merchant TEXT DEFAULT NULL,
    p_payment_mode TEXT DEFAULT 'UPI',
    p_account_last4 VARCHAR(4) DEFAULT NULL,
    p_occurred_at TIMESTAMPTZ DEFAULT NULL,
    p_balance_after NUMERIC(12, 2) DEFAULT NULL,
    p_upi_ref TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_raw_id UUID;
    v_raw_status TEXT;
    v_linked_expense_id UUID;
    v_category_id UUID := NULL;
    v_new_expense_id UUID;
    v_new_expense_created_at TIMESTAMPTZ;
    v_rule_record RECORD;

    -- Money arithmetic in integer paise (cents)
    v_curr_balance_paise BIGINT;
    v_curr_amount_paise BIGINT;
    v_prev_record RECORD;
    v_prev_expected_paise BIGINT;
    v_prev_delta_paise BIGINT;
    
    v_next_record RECORD;
    v_next_expected_paise BIGINT;
    v_next_delta_paise BIGINT;
BEGIN
    -- 1. Deduplication on body_hash
    INSERT INTO public.raw_messages (
        sender, body, received_at, body_hash, parse_status, error_message
    ) VALUES (
        p_sender, p_body, COALESCE(p_received_at, now()), p_body_hash, p_parse_status, p_error_message
    )
    ON CONFLICT (body_hash) DO NOTHING
    RETURNING id, parse_status INTO v_raw_id, v_raw_status;

    -- If conflict on body_hash:
    IF v_raw_id IS NULL THEN
        SELECT id, parse_status INTO v_raw_id, v_raw_status
        FROM public.raw_messages
        WHERE body_hash = p_body_hash;

        -- Check if an expense is already linked to this raw message
        SELECT id INTO v_linked_expense_id
        FROM public.expenses
        WHERE raw_message_id = v_raw_id
        LIMIT 1;

        -- If already linked to an expense OR previously marked ignored, return duplicate
        IF v_linked_expense_id IS NOT NULL OR v_raw_status = 'ignored' THEN
            RETURN jsonb_build_object(
                'status', 'duplicate',
                'message', 'Message already processed',
                'raw_message_id', v_raw_id,
                'expense_id', v_linked_expense_id
            );
        END IF;

        -- Otherwise, it is an unlinked message eligible for reprocessing on retry!
        UPDATE public.raw_messages
        SET parse_status = p_parse_status,
            error_message = p_error_message
        WHERE id = v_raw_id;
    END IF;

    -- 2. Handle Ignored Messages (OTP, Credit, Promo)
    IF p_parse_status = 'ignored' THEN
        RETURN jsonb_build_object(
            'status', 'ignored',
            'raw_message_id', v_raw_id
        );
    END IF;

    -- 3. Handle Needs Review Messages
    IF p_parse_status = 'needs_review' THEN
        RETURN jsonb_build_object(
            'status', 'needs_review',
            'raw_message_id', v_raw_id
        );
    END IF;

    -- 4. Deduplication on upi_ref (if present)
    IF p_upi_ref IS NOT NULL THEN
        SELECT id INTO v_linked_expense_id
        FROM public.expenses
        WHERE upi_ref = p_upi_ref;

        IF v_linked_expense_id IS NOT NULL THEN
            UPDATE public.raw_messages
            SET parse_status = 'parsed'
            WHERE id = v_raw_id;

            RETURN jsonb_build_object(
                'status', 'duplicate',
                'message', 'UPI reference already recorded',
                'raw_message_id', v_raw_id,
                'expense_id', v_linked_expense_id
            );
        END IF;
    END IF;

    -- 5. Auto-Categorisation Rule Match
    IF p_merchant IS NOT NULL THEN
        FOR v_rule_record IN 
            SELECT category_id, merchant_pattern FROM public.merchant_rules
        LOOP
            IF p_merchant ~* v_rule_record.merchant_pattern THEN
                v_category_id := v_rule_record.category_id;
                EXIT;
            END IF;
        END LOOP;
    END IF;

    -- 6. Insert Expense (Defaults to NULL / Uncategorised if no rule matched)
    INSERT INTO public.expenses (
        raw_message_id,
        amount,
        currency,
        merchant,
        category_id,
        payment_mode,
        account_last4,
        occurred_at,
        balance_after,
        upi_ref,
        source,
        note
    ) VALUES (
        v_raw_id,
        p_amount,
        COALESCE(p_currency, 'INR'),
        p_merchant,
        v_category_id,
        COALESCE(p_payment_mode, 'UPI'),
        p_account_last4,
        p_occurred_at,
        p_balance_after,
        p_upi_ref,
        'sms',
        p_note
    )
    RETURNING id, created_at INTO v_new_expense_id, v_new_expense_created_at;

    UPDATE public.raw_messages
    SET parse_status = 'parsed'
    WHERE id = v_raw_id;

    -- 7. Bidirectional Balance Gap Chain Re-Evaluation
    IF p_account_last4 IS NOT NULL AND p_balance_after IS NOT NULL THEN
        v_curr_balance_paise := ROUND(p_balance_after * 100);
        v_curr_amount_paise := ROUND(p_amount * 100);

        -- Step 7a: Evaluate Predecessor (E_prev -> E_curr)
        SELECT id, balance_after, amount
        INTO v_prev_record
        FROM public.expenses
        WHERE account_last4 = p_account_last4
          AND balance_after IS NOT NULL
          AND id != v_new_expense_id
          AND (occurred_at < p_occurred_at OR (occurred_at = p_occurred_at AND created_at < v_new_expense_created_at))
        ORDER BY occurred_at DESC, created_at DESC
        LIMIT 1;

        IF v_prev_record.id IS NOT NULL THEN
            v_prev_expected_paise := ROUND(v_prev_record.balance_after * 100) - v_curr_amount_paise;
            v_prev_delta_paise := v_curr_balance_paise - v_prev_expected_paise;

            IF v_prev_delta_paise < 0 THEN
                -- Balance dropped MORE than expected -> Active Missed Transaction Notice
                INSERT INTO public.balance_gaps (
                    account_last4, gap_type, expected_balance, actual_balance, gap_amount, detected_at_expense_id, status
                ) VALUES (
                    p_account_last4,
                    'under_balance',
                    (v_prev_expected_paise / 100.0),
                    p_balance_after,
                    (ABS(v_prev_delta_paise) / 100.0),
                    v_new_expense_id,
                    'unresolved'
                );
            ELSIF v_prev_delta_paise > 0 THEN
                -- Balance is HIGHER than expected -> Quiet note (likely credit)
                INSERT INTO public.balance_gaps (
                    account_last4, gap_type, expected_balance, actual_balance, gap_amount, detected_at_expense_id, status
                ) VALUES (
                    p_account_last4,
                    'over_balance',
                    (v_prev_expected_paise / 100.0),
                    p_balance_after,
                    (v_prev_delta_paise / 100.0),
                    v_new_expense_id,
                    'unresolved'
                );
            END IF;
        END IF;

        -- Step 7b: Re-evaluate Successor (E_curr -> E_next) for out-of-order arrivals
        SELECT id, balance_after, amount
        INTO v_next_record
        FROM public.expenses
        WHERE account_last4 = p_account_last4
          AND balance_after IS NOT NULL
          AND id != v_new_expense_id
          AND (occurred_at > p_occurred_at OR (occurred_at = p_occurred_at AND created_at > v_new_expense_created_at))
        ORDER BY occurred_at ASC, created_at ASC
        LIMIT 1;

        IF v_next_record.id IS NOT NULL THEN
            v_next_expected_paise := v_curr_balance_paise - ROUND(v_next_record.amount * 100);
            v_next_delta_paise := ROUND(v_next_record.balance_after * 100) - v_next_expected_paise;

            -- Clear any previous unresolved gap tied to this successor since the chain just healed
            DELETE FROM public.balance_gaps
            WHERE detected_at_expense_id = v_next_record.id
              AND status = 'unresolved';

            IF v_next_delta_paise < 0 THEN
                INSERT INTO public.balance_gaps (
                    account_last4, gap_type, expected_balance, actual_balance, gap_amount, detected_at_expense_id, status
                ) VALUES (
                    p_account_last4,
                    'under_balance',
                    (v_next_expected_paise / 100.0),
                    v_next_record.balance_after,
                    (ABS(v_next_delta_paise) / 100.0),
                    v_next_record.id,
                    'unresolved'
                );
            ELSIF v_next_delta_paise > 0 THEN
                INSERT INTO public.balance_gaps (
                    account_last4, gap_type, expected_balance, actual_balance, gap_amount, detected_at_expense_id, status
                ) VALUES (
                    p_account_last4,
                    'over_balance',
                    (v_next_expected_paise / 100.0),
                    v_next_record.balance_after,
                    (v_next_delta_paise / 100.0),
                    v_next_record.id,
                    'unresolved'
                );
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'status', 'parsed',
        'raw_message_id', v_raw_id,
        'expense_id', v_new_expense_id
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Row-Level Security (RLS) Baseline
-- ------------------------------------------------------------------------------
-- Enable RLS on every table immediately so zero rows are exposed to public callers
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_gaps ENABLE ROW LEVEL SECURITY;

-- Baseline: By default with RLS enabled and no public policies, all anon requests return 0 rows.
-- In migration 20261004000002_lockdown_owner_rls.sql, the authenticated owner policy is attached.
