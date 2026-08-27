import type { BankPolicy } from "./types";

/**
 * Five illustrative lender policies built on genuine NZ lending rules:
 *
 * - Servicing test rates ≈ carded rate + ~2.0% buffer (≈7.5% default).
 * - RBNZ DTI caps (from 1 July 2024): ≤6× gross income for owner-occupiers,
 *   ≤7× for investors. Banks have a 20% speed-limit exemption; the prototype
 *   applies the caps hard. Non-banks are exempt from the regime.
 * - LVR: owner-occupiers generally need 20% deposit; investors 30%
 *   (70% LVR cap). New builds are exempt from LVR restrictions, so lender
 *   appetite is higher there.
 * - Credit card commitments assessed at ~3% of the LIMIT per month.
 * - Kāinga Ora-style First Home Loan: 5–20% deposit with income caps
 *   (configurable below).
 *
 * Rates are illustrative with a ~0.3% spread between best and worst bank.
 */
export const BANK_POLICIES: BankPolicy[] = [
  {
    id: "bank-a",
    name: "Bank A — Major",
    kind: "major",
    tagline: "Sharpest rate, strictest rulebook",
    testRate: 7.5,
    indicativeRate: 5.49,
    dtiCapOwnerOccupier: 6,
    dtiCapInvestor: 7,
    maxLvrOwnerOccupier: 0.8,
    maxLvrInvestor: 0.7,
    maxLvrNewBuildOwnerOccupier: 0.9,
    maxLvrNewBuildInvestor: 0.8,
    minMonthlySurplus: 650,
    rentalIncomeScaling: 0.75,
    selfEmployedMinYears: 2,
    acceptsCreditHistory: ["clean", "minor"],
    acceptsWorkVisa: false,
    bnplMonthlyAssessment: 200,
    strengths: ["Lowest indicative rate", "Strong cashback offers for 20%+ deposits"],
  },
  {
    id: "bank-b",
    name: "Bank B — Major",
    kind: "major",
    tagline: "Big-bank muscle, conservative on cards and credit",
    testRate: 7.7,
    indicativeRate: 5.55,
    dtiCapOwnerOccupier: 6,
    dtiCapInvestor: 7,
    maxLvrOwnerOccupier: 0.85,
    maxLvrInvestor: 0.7,
    maxLvrNewBuildOwnerOccupier: 0.9,
    maxLvrNewBuildInvestor: 0.8,
    minMonthlySurplus: 800,
    rentalIncomeScaling: 0.7,
    selfEmployedMinYears: 2,
    acceptsCreditHistory: ["clean"],
    acceptsWorkVisa: true,
    bnplMonthlyAssessment: 250,
    strengths: ["Will stretch to 85% LVR for strong owner-occupiers", "Fast turnaround on salaried applications"],
  },
  {
    id: "bank-c",
    name: "Bank C — Challenger",
    kind: "challenger",
    tagline: "Hungrier for deposits under 20% and the self-employed",
    testRate: 7.3,
    indicativeRate: 5.59,
    dtiCapOwnerOccupier: 6,
    dtiCapInvestor: 7,
    maxLvrOwnerOccupier: 0.9,
    maxLvrInvestor: 0.7,
    maxLvrNewBuildOwnerOccupier: 0.95,
    maxLvrNewBuildInvestor: 0.85,
    minMonthlySurplus: 500,
    rentalIncomeScaling: 0.8,
    selfEmployedMinYears: 1,
    acceptsCreditHistory: ["clean", "minor"],
    acceptsWorkVisa: true,
    bnplMonthlyAssessment: 150,
    strengths: [
      "Takes self-employed with 1 year of financials",
      "Counts 80% of rental and boarder income — the most generous here",
    ],
  },
  {
    id: "non-bank",
    name: "Non-bank Lender",
    kind: "non-bank",
    tagline: "Says yes when banks say no — for a price",
    testRate: 8.2,
    indicativeRate: 6.45,
    // Non-bank lenders sit outside the RBNZ DTI regime.
    dtiCapOwnerOccupier: null,
    dtiCapInvestor: null,
    maxLvrOwnerOccupier: 0.85,
    maxLvrInvestor: 0.8,
    maxLvrNewBuildOwnerOccupier: 0.9,
    maxLvrNewBuildInvestor: 0.85,
    minMonthlySurplus: 400,
    rentalIncomeScaling: 0.8,
    selfEmployedMinYears: 1,
    acceptsCreditHistory: ["clean", "minor", "defaults"],
    acceptsWorkVisa: true,
    bnplMonthlyAssessment: 150,
    strengths: [
      "No RBNZ DTI cap and flexible on credit history",
      "A stepping-stone: refinance to a bank once your file is clean",
    ],
  },
  {
    id: "fh-specialist",
    name: "First-Home Specialist",
    kind: "specialist",
    tagline: "Built for 5–20% deposits via the First Home Loan scheme",
    testRate: 7.5,
    indicativeRate: 5.79,
    dtiCapOwnerOccupier: 6,
    dtiCapInvestor: 7,
    maxLvrOwnerOccupier: 0.95,
    maxLvrInvestor: 0.7,
    maxLvrNewBuildOwnerOccupier: 0.95,
    maxLvrNewBuildInvestor: 0.8,
    minMonthlySurplus: 550,
    rentalIncomeScaling: 0.75,
    selfEmployedMinYears: 2,
    acceptsCreditHistory: ["clean", "minor"],
    acceptsWorkVisa: false,
    bnplMonthlyAssessment: 200,
    firstHomeLoanScheme: {
      minDepositPct: 0.05,
      incomeCapSingle: 95_000,
      incomeCapCombined: 150_000,
    },
    strengths: [
      "Kāinga Ora-backed First Home Loan from a 5% deposit",
      "Trade-offs: income caps apply and a ~0.5% lender fee is added to the loan",
    ],
  },
];

/** Household living-expense model and other engine-wide assumptions. */
export const ENGINE_ASSUMPTIONS = {
  /** Base monthly living expenses, single adult household. */
  livingExpenseSingle: 2_350,
  /** Base monthly living expenses, two-adult household. */
  livingExpenseCouple: 3_850,
  /** Added monthly expenses per dependant. */
  livingExpensePerDependant: 550,
  /**
   * Households spend more as they earn more — scale expenses up by a share
   * of net income above a floor, HEM-style.
   */
  livingExpenseIncomeFloor: 6_500,
  livingExpenseIncomeScaling: 0.06,
  /** Credit card limits are assessed at this share of the LIMIT, monthly. */
  creditCardLimitFactor: 0.03,
  /** Standard assessment term for the servicing test, years. */
  assessmentTermYears: 30,
  /** NZ student loan repayments: 12% of income over the annual threshold. */
  studentLoanRate: 0.12,
  studentLoanThreshold: 24_128,
  /** Refix window: lenders let you lock a new rate ~60 days before expiry. */
  refixWindowDays: 60,
} as const;

export const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
] as const;
