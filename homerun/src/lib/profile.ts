import type { ApplicantIncome, ApplicantProfile } from "./types";

export const emptyApplicant = (): ApplicantIncome => ({
  frequency: "annual",
  salary: 0,
  selfEmployed: 0,
  rentalOrBoarder: 0,
  other: 0,
});

export const emptyProfile = (): ApplicantProfile => ({
  goal: null,
  property: { price: 0, region: null, buildType: "existing" },
  deposit: { savings: 0, kiwiSaver: 0, gift: 0 },
  income: { hasSecondApplicant: false, applicants: [emptyApplicant(), emptyApplicant()] },
  commitments: {
    loanRepaymentsMonthly: 0,
    loanBalances: 0,
    creditCardLimits: 0,
    hasBnpl: false,
    hasStudentLoan: false,
    dependants: 0,
  },
  situation: {
    employmentType: "salaried",
    tenureYears: 3,
    residency: "citizen",
    creditHistory: "clean",
  },
  refinance: { currentLender: null, balance: 0, currentRate: 6.85, fixedExpiry: null },
});

/**
 * Demo mode: a realistic first-home couple, pre-filled so the whole flow can
 * be walked through in ~30 seconds. Every step already has answers, so demo
 * viewers just tap Next and watch the borrowing-power figure react.
 */
export const demoProfile = (): ApplicantProfile => ({
  goal: "first-home",
  property: { price: 910_000, region: "Auckland", buildType: "existing" },
  deposit: { savings: 120_000, kiwiSaver: 70_000, gift: 30_000 },
  income: {
    hasSecondApplicant: true,
    applicants: [
      { frequency: "annual", salary: 98_000, selfEmployed: 0, rentalOrBoarder: 0, other: 0 },
      { frequency: "annual", salary: 76_000, selfEmployed: 0, rentalOrBoarder: 0, other: 4_000 },
    ],
  },
  commitments: {
    loanRepaymentsMonthly: 420,
    loanBalances: 14_000,
    creditCardLimits: 15_000,
    hasBnpl: false,
    hasStudentLoan: true,
    dependants: 0,
  },
  situation: {
    employmentType: "salaried",
    tenureYears: 4,
    residency: "citizen",
    creditHistory: "clean",
  },
  refinance: { currentLender: null, balance: 0, currentRate: 6.85, fixedExpiry: null },
});

/** Alternative demo: a refinance profile, for showing the refi path. */
export const demoRefinanceProfile = (): ApplicantProfile => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 85);
  return {
    ...demoProfile(),
    goal: "refinance",
    property: { price: 1_050_000, region: "Wellington", buildType: "existing" },
    deposit: { savings: 0, kiwiSaver: 0, gift: 0 },
    commitments: {
      loanRepaymentsMonthly: 0,
      loanBalances: 0,
      creditCardLimits: 8_000,
      hasBnpl: false,
      hasStudentLoan: false,
      dependants: 1,
    },
    refinance: {
      currentLender: "Bank B — Major",
      balance: 620_000,
      currentRate: 6.85,
      fixedExpiry: expiry.toISOString().slice(0, 10),
    },
  };
};
