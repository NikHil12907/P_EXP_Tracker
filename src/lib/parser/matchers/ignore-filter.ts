import type { ParseResult } from '../types';

/**
 * Evaluates whether an unhandled SMS is an ignorable message (OTP, Credit, Promo, Balance Alert).
 * Returns an ignored ParseResult or null if the message should proceed to review.
 */
export function checkIgnoreFilter(body: string): ParseResult | null {
  if (!body || typeof body !== 'string') return null;

  // 1. OTP messages: high priority filter
  if (/\b(?:OTP|one[- ]time password|verification code|secret OTP)\b/i.test(body)) {
    return { status: 'ignored', reason: 'otp' };
  }

  // 2. Credit/Deposit/Refund messages
  if (
    /\b(?:credited|deposited|refund\s+of\s+Rs)\b/i.test(body) &&
    !/\bdebited\b/i.test(body)
  ) {
    return { status: 'ignored', reason: 'credit' };
  }

  // 3. Balance inquiry alerts (excluding debit/withdrawal notifications)
  const isDebitAction = /\b(?:withdrawn|debited|spent|paid)\b/i.test(body);
  if (!isDebitAction) {
    if (
      /(?:clear\s+balance|avail(?:able)?\s+balance\s+in\s+a\/c|balance\s+in\s+a\/c\s+[X\d]+\s+as\s+on)/i.test(
        body
      )
    ) {
      return { status: 'ignored', reason: 'balance_alert' };
    }
  }

  // 4. Promotional messages
  if (
    /\b(?:exclusive\s+offer|flat\s+\d+%\s+(?:off|discount)|cashback|pre[- ]approved|apply\s+now)\b/i.test(
      body
    )
  ) {
    return { status: 'ignored', reason: 'promo' };
  }

  return null;
}
