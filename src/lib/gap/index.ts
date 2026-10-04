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
 */
export function evaluateGap(
  prev: GapEvaluationInputPrev,
  current: GapEvaluationInputCurrent
): GapResult {
  // Stub implementation for test-first workflow
  return { kind: 'ok', gapPaise: 0 };
}
