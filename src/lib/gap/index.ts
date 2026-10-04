export interface GapEvaluationInputPrev {
  balanceAfterPaise: number | null;
}

export interface GapEvaluationInputCurrent {
  amountPaise: number;
  balanceAfterPaise: number | null;
}

export interface GapResult {
  kind: 'ok' | 'missed' | 'higher';
  gapPaise: number;
}

/**
 * Pure function evaluating continuity between two consecutive balance-bearing transactions.
 * Uses exact integer paise comparison (no floating point or epsilon).
 *
 * - 'missed': Balance dropped MORE than expected (actual < expected).
 * - 'higher': Balance is HIGHER than expected (actual > expected, likely an unrecorded credit).
 * - 'ok': Exact continuity match or baseline transaction where balance is null.
 */
export function evaluateGap(
  prev: GapEvaluationInputPrev,
  current: GapEvaluationInputCurrent
): GapResult {
  if (prev.balanceAfterPaise === null || current.balanceAfterPaise === null) {
    return { kind: 'ok', gapPaise: 0 };
  }

  const expectedPaise = prev.balanceAfterPaise - current.amountPaise;
  const deltaPaise = current.balanceAfterPaise - expectedPaise;

  if (deltaPaise === 0) {
    return { kind: 'ok', gapPaise: 0 };
  }

  if (deltaPaise < 0) {
    return { kind: 'missed', gapPaise: Math.abs(deltaPaise) };
  }

  return { kind: 'higher', gapPaise: deltaPaise };
}
