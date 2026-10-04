import { describe, it, expect } from 'vitest';
import { parseSms, paiseToDecimalString } from '@/lib/parser';
import fs from 'fs';
import path from 'path';

describe('SMS Parser - Pure Matching Engine', () => {
  const SENDER = 'AD-FEDBNK';

  describe('Synthetic Fixtures from Spec', () => {
    it('should parse Fixture 1: Standard Federal Bank UPI debit', () => {
      const sms =
        'Debited Rs 40.00 from a/c X1234 on 17Aug26 13:18 via UPI to TEST MERCHANT A. Ref 600000000001.Bal Rs 11000.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;

      expect(result.data).toEqual({
        amountPaise: 4000,
        accountLast4: '1234',
        occurredAt: new Date('2026-08-17T07:48:00.000Z'),
        paymentMode: 'UPI',
        merchant: 'TEST MERCHANT A',
        upiRef: '600000000001',
        balanceAfterPaise: 1100000,
      });
      expect(paiseToDecimalString(result.data.amountPaise)).toBe('40.00');
      expect(paiseToDecimalString(result.data.balanceAfterPaise)).toBe('11000.00');
    });

    it('should parse Fixture 2: Federal Bank UPI debit with balance gap', () => {
      const sms =
        'Debited Rs 60.00 from a/c X1234 on 20Aug26 21:30 via UPI to TESTUSER ONE. Ref 600000000002.Bal Rs 10700.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;

      expect(result.data).toEqual({
        amountPaise: 6000,
        accountLast4: '1234',
        occurredAt: new Date('2026-08-20T16:00:00.000Z'),
        paymentMode: 'UPI',
        merchant: 'TESTUSER ONE',
        upiRef: '600000000002',
        balanceAfterPaise: 1070000,
      });
    });

    it('should parse Fixture 3: Federal Bank UPI debit (consistent chain)', () => {
      const sms =
        'Debited Rs 200.00 from a/c X1234 on 21Aug26 18:10 via UPI to Adhoc Test PE. Ref 600000000003.Bal Rs 10500.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;

      expect(result.data).toEqual({
        amountPaise: 20000,
        accountLast4: '1234',
        occurredAt: new Date('2026-08-21T12:40:00.000Z'),
        paymentMode: 'UPI',
        merchant: 'Adhoc Test PE',
        upiRef: '600000000003',
        balanceAfterPaise: 1050000,
      });
    });
  });

  describe('Amount Format Variants', () => {
    it('should parse amounts with Indian comma grouping: "Rs 1,250.00"', () => {
      const sms =
        'Debited Rs 1,250.00 from a/c X1234 on 17Aug26 13:18 via UPI to CAFE SHOP. Ref 600000000010.Bal Rs 9750.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.amountPaise).toBe(125000);
      expect(result.data.balanceAfterPaise).toBe(975000);
    });

    it('should parse integer amounts without decimals: "Rs 500"', () => {
      const sms =
        'Debited Rs 500 from a/c X1234 on 17Aug26 13:18 via UPI to QUICK STORE. Ref 600000000011.Bal Rs 9250. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.amountPaise).toBe(50000);
      expect(result.data.balanceAfterPaise).toBe(925000);
    });

    it('should parse large lakh amounts: "Rs 1,00,000.50"', () => {
      const sms =
        'Debited Rs 1,00,000.50 from a/c X1234 on 17Aug26 13:18 via UPI to BIG VENDOR. Ref 600000000012.Bal Rs 5,40,000.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.amountPaise).toBe(10000050);
      expect(result.data.balanceAfterPaise).toBe(54000000);
    });
  });

  describe('Spacing & Punctuation Variants', () => {
    it('should tolerate spacing variations around "Ref", "Bal Rs", and "a/c X"', () => {
      const sms =
        'Debited  Rs 150.00  from  a/c   X1234 on 17Aug26 13:18 via UPI to SPICY BITES.Ref   600000000013. Bal   Rs   8500.50. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.amountPaise).toBe(15000);
      expect(result.data.accountLast4).toBe('1234');
      expect(result.data.upiRef).toBe('600000000013');
      expect(result.data.balanceAfterPaise).toBe(850050);
      expect(result.data.merchant).toBe('SPICY BITES');
    });
  });

  describe('Merchant Name Edge Cases', () => {
    it('should handle merchant with internal periods and digits', () => {
      const sms =
        'Debited Rs 99.00 from a/c X1234 on 17Aug26 13:18 via UPI to ST. MARKS STORE 123. Ref 600000000014.Bal Rs 8000.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.merchant).toBe('ST. MARKS STORE 123');
    });

    it('should strip trailing periods and excess whitespace from merchant name', () => {
      const sms =
        'Debited Rs 45.00 from a/c X1234 on 17Aug26 13:18 via UPI to   BAKERY DELIGHT .   Ref 600000000015.Bal Rs 7900.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.merchant).toBe('BAKERY DELIGHT');
    });

    it('should preserve lowercase and mixed case in merchant', () => {
      const sms =
        'Debited Rs 120.00 from a/c X1234 on 17Aug26 13:18 via UPI to uber india rides. Ref 600000000016.Bal Rs 7500.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      expect(result.data.merchant).toBe('uber india rides');
    });

    it('should prioritize bank matcher over ignore filters when merchant name contains "OTP" or "REFUND"', () => {
      const smsOtpMerchant =
        'Debited Rs 300.00 from a/c X1234 on 17Aug26 13:18 via UPI to OTP SERVICES PVT LTD. Ref 600000000017.Bal Rs 7200.00. Not you?Call 18004251199 -Federal Bank';
      const resultOtp = parseSms(smsOtpMerchant, SENDER);

      expect(resultOtp.status).toBe('parsed');
      if (resultOtp.status === 'parsed') {
        expect(resultOtp.data.merchant).toBe('OTP SERVICES PVT LTD');
        expect(resultOtp.data.amountPaise).toBe(30000);
      }

      const smsRefundMerchant =
        'Debited Rs 100.00 from a/c X1234 on 17Aug26 13:18 via UPI to REFUND DESK CAFE. Ref 600000000018.Bal Rs 7100.00. Not you?Call 18004251199 -Federal Bank';
      const resultRefund = parseSms(smsRefundMerchant, SENDER);

      expect(resultRefund.status).toBe('parsed');
      if (resultRefund.status === 'parsed') {
        expect(resultRefund.data.merchant).toBe('REFUND DESK CAFE');
      }
    });
  });

  describe('Date Parsing & Timezone Validation', () => {
    it('should accurately convert Asia/Kolkata date to UTC', () => {
      const sms =
        'Debited Rs 10.00 from a/c X1234 on 17Aug26 13:18 via UPI to TEA STALL. Ref 600000000019.Bal Rs 7000.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('parsed');
      if (result.status !== 'parsed') return;
      // 17Aug26 13:18 IST == 2026-08-17T07:48:00.000Z
      expect(result.data.occurredAt.toISOString()).toBe('2026-08-17T07:48:00.000Z');
    });

    it('should reject impossible dates with needs_review: e.g. 31Feb26', () => {
      const sms =
        'Debited Rs 10.00 from a/c X1234 on 31Feb26 13:18 via UPI to TEA STALL. Ref 600000000020.Bal Rs 7000.00. Not you?Call 18004251199 -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('needs_review');
      if (result.status === 'needs_review') {
        expect(result.reason).toBe('invalid_date');
      }
    });
  });

  describe('Negative Filters (Ignored Messages)', () => {
    it('should ignore OTP messages with reason "otp"', () => {
      const sms =
        '839201 is your secret OTP for transaction of Rs 500.00 at AMAZON on Federal Bank card. Never share OTP with anyone.';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('ignored');
      if (result.status === 'ignored') {
        expect(result.reason).toBe('otp');
      }
    });

    it('should ignore Credit messages with reason "credit"', () => {
      const sms =
        'Your a/c X1234 is Credited with Rs 25,000.00 on 17Aug26 by UPI/SALARY. Bal Rs 35,000.00. -Federal Bank';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('ignored');
      if (result.status === 'ignored') {
        expect(result.reason).toBe('credit');
      }
    });

    it('should ignore Promotional messages with reason "promo"', () => {
      const sms =
        'Exclusive offer! Get flat 20% discount on dining with your Federal Bank Debit Card. T&C apply.';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('ignored');
      if (result.status === 'ignored') {
        expect(result.reason).toBe('promo');
      }
    });

    it('should ignore Balance Alert inquiries with reason "balance_alert"', () => {
      const sms =
        'Dear Customer, clear balance in a/c X1234 as on 17Aug26 is Rs 11,000.00. Call 18004251199 for help.';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('ignored');
      if (result.status === 'ignored') {
        expect(result.reason).toBe('balance_alert');
      }
    });
  });

  describe('Unknown / Ambiguous Formats', () => {
    it('should return needs_review for an unrecognized Federal Bank debit format', () => {
      const sms =
        'Rs 400 withdrawn from a/c X1234 at ATM 4920 on 17Aug26. Available balance Rs 5000.';
      const result = parseSms(sms, SENDER);

      expect(result.status).toBe('needs_review');
      if (result.status === 'needs_review') {
        expect(result.reason).toBe('unrecognized_format');
      }
    });
  });

  describe('Fuzzing & Robustness (Never Throws)', () => {
    it('should never throw on empty, garbage, or ultra-long strings', () => {
      const inputs = [
        '',
        '   ',
        '\n\t\r',
        'undefined',
        'null',
        'A'.repeat(50000),
        '$$%%^^&&**',
        'Debited Rs from a/c X on',
        '{"json": "broken',
      ];

      for (const input of inputs) {
        expect(() => {
          const res = parseSms(input, SENDER);
          expect(res.status).toBeDefined();
        }).not.toThrow();
      }
    });
  });

  describe('Optional Real-SMS Safety Suite (fixtures.local.ts)', () => {
    it('should optionally test private real-world messages if fixtures.local.ts exists', async () => {
      const localFixturePath = path.resolve(__dirname, 'fixtures.local.ts');
      if (!fs.existsSync(localFixturePath)) {
        // Expected in CI/repo when real fixtures are omitted
        expect(true).toBe(true);
        return;
      }

      const { localFixtures } = await import('./fixtures.local');
      if (!Array.isArray(localFixtures)) return;

      for (const fixture of localFixtures) {
        const result = parseSms(fixture.sms, fixture.sender || SENDER);
        expect(result.status).toBe(fixture.expectedStatus);
      }
    });
  });
});

describe('Helper: paiseToDecimalString', () => {
  it('should format integer paise into decimal strings correctly', () => {
    expect(paiseToDecimalString(4000)).toBe('40.00');
    expect(paiseToDecimalString(60)).toBe('0.60');
    expect(paiseToDecimalString(5)).toBe('0.05');
    expect(paiseToDecimalString(10000050)).toBe('100000.50');
    expect(paiseToDecimalString(0)).toBe('0.00');
    expect(paiseToDecimalString(null)).toBeNull();
  });
});
