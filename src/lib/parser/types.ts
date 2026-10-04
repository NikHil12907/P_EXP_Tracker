export interface ParsedExpenseData {
  amountPaise: number;
  merchant: string;
  paymentMode: 'UPI' | 'card' | 'netbanking' | 'atm' | 'other';
  accountLast4: string;
  occurredAt: Date;
  upiRef: string | null;
  balanceAfterPaise: number | null;
}

export type ParseResult =
  | { status: 'parsed'; data: ParsedExpenseData }
  | { status: 'ignored'; reason: 'otp' | 'credit' | 'promo' | 'balance_alert' }
  | {
      status: 'needs_review';
      reason: 'unrecognized_format' | 'low_confidence' | 'invalid_date' | 'internal_error';
    };

export interface SmsMatcher {
  id: string;
  name: string;
  canHandle(body: string, sender: string): boolean;
  match(body: string, sender: string): ParseResult | null;
}
