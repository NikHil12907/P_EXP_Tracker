import type { ParseResult, SmsMatcher } from '../types';
import { parseAmountToPaise, parseIndianDateToUtc } from '../utils';

/**
 * Regex for Federal Bank UPI debit SMS messages.
 * Handles spacing variations, Indian number formatting (e.g. 1,00,000.50),
 * optional decimals, and punctuation variations around Ref and Bal.
 */
const FEDERAL_BANK_UPI_REGEX =
  /Debited\s+Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s+from\s+a\/c\s+X?(\d{4})\s+on\s+(\d{1,2}[A-Za-z]{3}\d{2})\s+(\d{2}:\d{2})\s+via\s+UPI\s+to\s+(.+?)(?:\.|\s)+Ref\s*([A-Za-z0-9]+)(?:\.?\s*Bal\s*Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?))?/i;

export const federalBankUpiMatcher: SmsMatcher = {
  id: 'federal_bank_upi',
  name: 'Federal Bank UPI Debit Matcher',

  canHandle(body: string, sender: string): boolean {
    if (!body || typeof body !== 'string') return false;
    const isFederal = /FEDBNK/i.test(sender) || /Federal Bank/i.test(body);
    const looksLikeFederalUpi = /Debited\s+Rs/i.test(body) && /via\s+UPI/i.test(body);
    return isFederal || looksLikeFederalUpi;
  },

  match(body: string): ParseResult | null {
    if (!body || typeof body !== 'string') return null;

    const match = body.match(FEDERAL_BANK_UPI_REGEX);
    if (!match) {
      return null;
    }

    const [
      ,
      rawAmount,
      accountLast4,
      dateStr,
      timeStr,
      rawMerchant,
      upiRef,
      rawBalance,
    ] = match;

    const amountPaise = parseAmountToPaise(rawAmount);
    if (amountPaise === null) {
      return { status: 'needs_review', reason: 'low_confidence' };
    }

    const occurredAt = parseIndianDateToUtc(dateStr, timeStr);
    if (!occurredAt) {
      return { status: 'needs_review', reason: 'invalid_date' };
    }

    const balanceAfterPaise = rawBalance ? parseAmountToPaise(rawBalance) : null;
    const merchant = rawMerchant.trim().replace(/\.+$/, '').trim();

    return {
      status: 'parsed',
      data: {
        amountPaise,
        accountLast4,
        occurredAt,
        paymentMode: 'UPI',
        merchant,
        upiRef: upiRef || null,
        balanceAfterPaise,
      },
    };
  },
};
