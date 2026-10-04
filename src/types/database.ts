export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ParseStatus = 'parsed' | 'needs_review' | 'ignored' | 'checkpoint';
export type PaymentMode = 'UPI' | 'card' | 'netbanking' | 'atm' | 'other';
export type ExpenseSource = 'sms' | 'manual';
export type GapType = 'under_balance' | 'over_balance';
export type GapStatus = 'unresolved' | 'resolved' | 'dismissed';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface MerchantRule {
  id: string;
  merchant_pattern: string;
  category_id: string;
  created_at: string;
}

export interface RawMessage {
  id: string;
  sender: string;
  body: string;
  received_at: string;
  body_hash: string;
  parse_status: ParseStatus;
  error_message: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  raw_message_id: string | null;
  amount: number;
  currency: string;
  merchant: string;
  category_id: string | null;
  payment_mode: PaymentMode;
  account_last4: string | null;
  occurred_at: string;
  balance_after: number | null;
  upi_ref: string | null;
  source: ExpenseSource;
  note: string | null;
  created_at: string;
}

export interface BalanceGap {
  id: string;
  account_last4: string;
  gap_type: GapType;
  expected_balance: number;
  actual_balance: number;
  gap_amount: number;
  detected_at_expense_id: string;
  status: GapStatus;
  resolved_by_expense_id: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      merchant_rules: {
        Row: MerchantRule;
        Insert: Omit<MerchantRule, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<MerchantRule, 'id' | 'created_at'>>;
      };
      raw_messages: {
        Row: RawMessage;
        Insert: Omit<RawMessage, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<RawMessage, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
      };
      balance_gaps: {
        Row: BalanceGap;
        Insert: Omit<BalanceGap, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<BalanceGap, 'id' | 'created_at'>>;
      };
    };
  };
}
