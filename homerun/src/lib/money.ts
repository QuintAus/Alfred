import type { Frequency } from "./types";

/** NZ PAYE brackets from 31 July 2024 (annualised composite thresholds). */
const PAYE_BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo: 15_600, rate: 0.105 },
  { upTo: 53_500, rate: 0.175 },
  { upTo: 78_100, rate: 0.3 },
  { upTo: 180_000, rate: 0.33 },
  { upTo: Infinity, rate: 0.39 },
];

/** ACC earners' levy. */
const ACC_LEVY_RATE = 0.016;
const ACC_LEVY_MAX_INCOME = 142_283;

/** Annual PAYE + ACC for one person's gross annual income. */
export function annualTax(gross: number): number {
  let tax = 0;
  let last = 0;
  for (const { upTo, rate } of PAYE_BRACKETS) {
    if (gross <= last) break;
    tax += (Math.min(gross, upTo) - last) * rate;
    last = upTo;
  }
  return tax + Math.min(gross, ACC_LEVY_MAX_INCOME) * ACC_LEVY_RATE;
}

export function netAnnual(gross: number): number {
  return gross - annualTax(gross);
}

export function toAnnual(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "annual":
      return amount;
    case "monthly":
      return amount * 12;
    case "weekly":
      return amount * 52;
  }
}

/** Monthly principal-and-interest payment per $1 borrowed. */
export function paymentPerDollar(annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return 1 / n;
  return (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Monthly P&I payment on a loan. */
export function monthlyPayment(loan: number, annualRatePct: number, years: number): number {
  return loan * paymentPerDollar(annualRatePct, years);
}

/** Largest loan a given monthly payment can service. */
export function loanFromPayment(payment: number, annualRatePct: number, years: number): number {
  if (payment <= 0) return 0;
  return payment / paymentPerDollar(annualRatePct, years);
}

/* ---------------- formatting ---------------- */

const nzd = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  maximumFractionDigits: 0,
});

export function fmtMoney(n: number): string {
  return nzd.format(Math.round(n));
}

/** Compact money for headline figures: $712k, $1.24m. */
export function fmtMoneyShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export function fmtPct(n: number, dp = 1): string {
  return `${n.toFixed(dp)}%`;
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}
