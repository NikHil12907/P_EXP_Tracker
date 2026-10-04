import { describe, it, expect } from 'vitest';
import { evaluateGap } from '@/lib/gap';

describe('Balance Gap Evaluator - Pure Continuity Engine', () => {
  it('should flag a "missed" gap when balance dropped MORE than expected (Fixture 2: 24000 paise / ₹240.00 gap)', () => {
    // Fixture 1 was balance 11000.00 (1100000 paise)
    // Fixture 2 debited 60.00 (6000 paise) -> Expected balance: 1094000 paise (₹10,940.00)
    // Actual balance reported: 10700.00 (1070000 paise)
    // Discrepancy: dropped by 24000 paise (₹240.00) more than expected
    const prev = { balanceAfterPaise: 1100000 };
    const current = { amountPaise: 6000, balanceAfterPaise: 1070000 };

    const result = evaluateGap(prev, current);

    expect(result).toEqual({
      kind: 'missed',
      gapPaise: 24000,
    });
  });

  it('should return "ok" when balance chain is consistent (Fixture 3: exact continuity)', () => {
    // Fixture 2 balance: 10700.00 (1070000 paise)
    // Fixture 3 debited 200.00 (20000 paise) -> Expected: 1050000 paise (₹10,500.00)
    // Actual balance reported: 10500.00 (1050000 paise)
    const prev = { balanceAfterPaise: 1070000 };
    const current = { amountPaise: 20000, balanceAfterPaise: 1050000 };

    const result = evaluateGap(prev, current);

    expect(result).toEqual({
      kind: 'ok',
      gapPaise: 0,
    });
  });

  it('should return "higher" when balance is HIGHER than expected (unrecorded credit/deposit)', () => {
    // Prev balance: 10000.00 (1000000 paise)
    // Debited: 100.00 (10000 paise) -> Expected: 9900.00 (990000 paise)
    // Actual reported balance: 10500.00 (1050000 paise) -> 60000 paise (₹600.00) higher
    const prev = { balanceAfterPaise: 1000000 };
    const current = { amountPaise: 10000, balanceAfterPaise: 1050000 };

    const result = evaluateGap(prev, current);

    expect(result).toEqual({
      kind: 'higher',
      gapPaise: 60000,
    });
  });

  it('should handle missing prior balance (first recorded transaction baseline)', () => {
    const prev = { balanceAfterPaise: null };
    const current = { amountPaise: 5000, balanceAfterPaise: 1000000 };

    const result = evaluateGap(prev, current);

    expect(result).toEqual({
      kind: 'ok',
      gapPaise: 0,
    });
  });

  it('should handle current transaction missing balance', () => {
    const prev = { balanceAfterPaise: 1000000 };
    const current = { amountPaise: 5000, balanceAfterPaise: null };

    const result = evaluateGap(prev, current);

    expect(result).toEqual({
      kind: 'ok',
      gapPaise: 0,
    });
  });
});
