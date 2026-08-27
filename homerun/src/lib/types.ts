/**
 * Core data shapes for the Homerun qualifier.
 *
 * Everything the UI collects lives in one `ApplicantProfile` object, and
 * everything the results screen shows comes out of `matchEngine(profile)`.
 * A real API can replace the engine later without touching the UI.
 */

export type Goal = "first-home" | "next-home" | "investment" | "refinance";
export type BuildType = "new-build" | "existing";
export type Frequency = "annual" | "monthly" | "weekly";
export type EmploymentType = "salaried" | "self-employed" | "contractor" | "casual";
export type Residency = "citizen" | "permanent-resident" | "work-visa" | "other";
export type CreditHistory = "clean" | "minor" | "defaults";

export interface ApplicantIncome {
  /** All amounts entered in the applicant's chosen frequency. */
  frequency: Frequency;
  salary: number;
  selfEmployed: number;
  /** Rental or boarder income (lenders scale this down). */
  rentalOrBoarder: number;
  other: number;
}

export interface ApplicantProfile {
  goal: Goal | null;
  property: {
    /** Purchase price/budget, or estimated value when refinancing. */
    price: number;
    region: string | null;
    buildType: BuildType;
  };
  deposit: {
    savings: number;
    /** KiwiSaver available for first-home withdrawal. */
    kiwiSaver: number;
    /** Gifted funds from family. */
    gift: number;
  };
  income: {
    hasSecondApplicant: boolean;
    applicants: [ApplicantIncome, ApplicantIncome];
  };
  commitments: {
    /** Monthly repayments on existing loans (car, personal, HP). */
    loanRepaymentsMonthly: number;
    /** Total balance outstanding on those loans (counts toward DTI). */
    loanBalances: number;
    /** Combined credit card LIMITS — banks assess ~3% of the limit per month. */
    creditCardLimits: number;
    hasBnpl: boolean;
    hasStudentLoan: boolean;
    dependants: number;
  };
  situation: {
    employmentType: EmploymentType;
    /** Years in current role, or years trading if self-employed. */
    tenureYears: number;
    residency: Residency;
    creditHistory: CreditHistory;
  };
  refinance: {
    currentLender: string | null;
    /** Loan balance being refinanced. */
    balance: number;
    /** Current interest rate, % p.a. */
    currentRate: number;
    /** ISO date the fixed term expires. */
    fixedExpiry: string | null;
  };
}

/* ------------------------------------------------------------------ */
/* Lender policy config                                                */
/* ------------------------------------------------------------------ */

export interface BankPolicy {
  id: string;
  name: string;
  kind: "major" | "challenger" | "non-bank" | "specialist";
  tagline: string;
  /** Rate all repayments are stress-tested at (carded + ~2% buffer). */
  testRate: number;
  /** Indicative carded rate shown to the customer, % p.a. */
  indicativeRate: number;
  /**
   * RBNZ DTI caps (July 2024). `null` means the lender is outside the
   * bank DTI regime (non-banks are exempt).
   */
  dtiCapOwnerOccupier: number | null;
  dtiCapInvestor: number | null;
  /** Max LVR appetite for existing properties. */
  maxLvrOwnerOccupier: number;
  maxLvrInvestor: number;
  /** New builds are exempt from LVR restrictions — lender appetite above 80/70. */
  maxLvrNewBuildOwnerOccupier: number;
  maxLvrNewBuildInvestor: number;
  /** Minimum uncommitted monthly income (surplus/UMI) after everything, $/month. */
  minMonthlySurplus: number;
  /** Share of rental/boarder income counted (banks scale to ~70–80%). */
  rentalIncomeScaling: number;
  /** Minimum years of financials for self-employed applicants. */
  selfEmployedMinYears: number;
  acceptsCreditHistory: CreditHistory[];
  acceptsWorkVisa: boolean;
  /** Monthly commitment assumed when active BNPL accounts are declared. */
  bnplMonthlyAssessment: number;
  /** Kāinga Ora First Home Loan style path (5% deposit, income caps). */
  firstHomeLoanScheme?: {
    minDepositPct: number;
    incomeCapSingle: number;
    incomeCapCombined: number;
  };
  /** Short human notes shown on the lender card. */
  strengths: string[];
}

/* ------------------------------------------------------------------ */
/* Engine output                                                       */
/* ------------------------------------------------------------------ */

export type Verdict = "likely" | "borderline" | "unlikely";

export type ConstraintKind = "servicing" | "dti" | "lvr" | "deposit";

export interface ConstraintResult {
  kind: ConstraintKind;
  /** Max loan this single constraint would allow. Infinity = not applicable. */
  maxLoan: number;
  detail: string;
}

export interface RepaymentQuote {
  rate: number;
  monthly25: number;
  monthly30: number;
}

export interface LenderResult {
  policy: BankPolicy;
  verdict: Verdict;
  /** Hard policy failures (deposit floor, credit history, visa…). */
  hardFails: string[];
  /** Estimated maximum loan from this lender. */
  maxLoan: number;
  /** The constraint that produced `maxLoan`. */
  binding: ConstraintResult | null;
  constraints: ConstraintResult[];
  /** Plain-English explanation of the verdict — the transparency promise. */
  why: string;
  /** Monthly surplus at the requested loan size (can be negative). */
  surplusAtRequested: number;
  repayments: RepaymentQuote;
  /** Set when this card is the Kāinga Ora First Home Loan path. */
  firstHomeScheme: boolean;
  refinance?: {
    monthlySavings: number;
    annualSavings: number;
  };
}

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  /** Change in best-lender borrowing power, $. */
  delta: number;
}

export interface ShortfallHint {
  /** What is blocking everything, and what would need to change. */
  headline: string;
  detail: string;
}

export interface MatchResult {
  lenders: LenderResult[];
  /** Best max loan across lenders that pass hard policy checks. */
  borrowingPower: number;
  /** Loan the profile actually needs (price − deposit, or refi balance). */
  loanRequired: number;
  depositTotal: number;
  depositPct: number;
  grossAnnualIncome: number;
  netMonthlyIncome: number;
  monthlyCommitments: number;
  monthlyLivingExpenses: number;
  quickWins: QuickWin[];
  /** Only set when nothing is achievable — never leave a dead end. */
  shortfall: ShortfallHint | null;
  refinance: {
    refixWindowOpens: string | null;
    bestAnnualSavings: number;
  } | null;
}
