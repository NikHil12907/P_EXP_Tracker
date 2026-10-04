import type { ParseResult } from './types';
import { matcherRegistry, checkIgnoreFilter } from './matchers';

export * from './types';
export * from './utils';

/**
 * Pure function parsing incoming SMS messages into structured expense data,
 * ignored statuses, or needs_review.
 *
 * Matching Order:
 * 1. Bank-specific strict matchers first (registry-based).
 * 2. Ignore filters (OTP, credit, promo, balance alert).
 * 3. Fallback: needs_review ('unrecognized_format').
 *
 * Guaranteed never to throw an exception or produce console output.
 */
export function parseSms(body: string, sender: string = ''): ParseResult {
  try {
    if (!body || typeof body !== 'string' || !body.trim()) {
      return { status: 'needs_review', reason: 'unrecognized_format' };
    }

    const safeSender = typeof sender === 'string' ? sender : '';

    // 1. Bank-specific matchers first
    for (const matcher of matcherRegistry) {
      if (matcher.canHandle(body, safeSender)) {
        const result = matcher.match(body, safeSender);
        if (result !== null) {
          return result;
        }
      }
    }

    // 2. Ignore filters if no bank matcher claimed the message
    const ignoreResult = checkIgnoreFilter(body);
    if (ignoreResult !== null) {
      return ignoreResult;
    }

    // 3. Unrecognized format fallback
    return { status: 'needs_review', reason: 'unrecognized_format' };
  } catch {
    // Pure function safety: never throws
    return { status: 'needs_review', reason: 'internal_error' };
  }
}
