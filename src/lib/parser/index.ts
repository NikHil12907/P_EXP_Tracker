import type { ParseResult } from './types';

export * from './types';

/**
 * Converts integer paise into a decimal string representation (e.g. 4000 -> "40.00").
 */
export function paiseToDecimalString(paise: number | null): string | null {
  if (paise === null || paise === undefined) return null;
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;
  const formatted = `${rupees}.${remainingPaise.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Pure function parsing incoming SMS messages into structured expense data,
 * ignored statuses, or needs_review.
 */
export function parseSms(body: string, sender: string): ParseResult {
  // Stub implementation for test-first workflow: returns needs_review
  return { status: 'needs_review', reason: 'unrecognized_format' };
}
