const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, monthIndex: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[monthIndex] ?? 0;
}

/**
 * Parses amount string into integer paise without floating point inaccuracies.
 * Supports: "40.00", "1,250.00", "500", "1,00,000.50".
 */
export function parseAmountToPaise(amountStr: string): number | null {
  if (!amountStr) return null;
  const clean = amountStr.replace(/,/g, '').trim();
  if (!clean) return null;

  const parts = clean.split('.');
  if (parts.length > 2) return null;

  const rupeesStr = parts[0];
  const paiseStr = parts[1] ?? '00';

  if (!/^\d+$/.test(rupeesStr) || !/^\d{0,2}$/.test(paiseStr)) {
    return null;
  }

  const rupees = parseInt(rupeesStr, 10);
  const paise = parseInt(paiseStr.padEnd(2, '0'), 10);

  return rupees * 100 + paise;
}

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
 * Parses Indian date format "DDMMMYY" (e.g. "17Aug26") and time "HH:mm" (e.g. "13:18")
 * in Asia/Kolkata (IST, UTC+05:30) and converts to an exact UTC Date object.
 * Returns null if the date is invalid (e.g. "31Feb26").
 */
export function parseIndianDateToUtc(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{2})$/);
  if (!dateMatch) return null;

  const day = parseInt(dateMatch[1], 10);
  const monthKey = dateMatch[2].toLowerCase();
  const year2Digit = parseInt(dateMatch[3], 10);
  const year = 2000 + year2Digit;

  const monthIndex = MONTH_MAP[monthKey];
  if (monthIndex === undefined) return null;

  // Validate calendar days for month & leap year
  const maxDays = getDaysInMonth(year, monthIndex);
  if (day < 1 || day > maxDays) {
    return null;
  }

  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!timeMatch) return null;

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  // IST offset is UTC+05:30 (+330 minutes)
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const utcEpoch = Date.UTC(year, monthIndex, day, hours, minutes, 0, 0) - istOffsetMs;

  return new Date(utcEpoch);
}
