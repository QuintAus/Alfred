import { BANK_POLICIES, ENGINE_ASSUMPTIONS as A } from "./bankPolicies";
import {
  fmtMoney,
  fmtMoneyShort,
  loanFromPayment,
  monthlyPayment,
  netAnnual,
  paymentPerDollar,
  toAnnual,
} from "./money";
import type {
  ApplicantProfile,
  BankPolicy,
  ConstraintResult,
  LenderResult,
  MatchResult,
  QuickWin,
  ShortfallHint,
  Verdict,
} from "./types";

/* ------------------------------------------------------------------ */
/* Household derivations                                               */
/* ------------------------------------------------------------------ */

interface Household {
  /** Gross annual income with rental/boarder income scaled per lender policy. */
  grossAssessable: number;
  /** Unscaled gross annual (for display + student loan). */
  grossActual: number;
  netMonthly: number;
  livingExpensesMonthly: number;
  commitmentsMonthly: number;
  depositTotal: number;
}

function activeApplicants(profile: ApplicantProfile) {
  return profile.income.hasSecondApplicant
    ? profile.income.applicants
    : [profile.income.applicants[0]];
}

function household(profile: ApplicantProfile, policy: BankPolicy): Household {
  const applicants = activeApplicants(profile);

  let grossAssessable = 0;
  let grossActual = 0;
  let netMonthly = 0;
  for (const a of applicants) {
    const salary = toAnnual(a.salary, a.frequency);
    const se = toAnnual(a.selfEmployed, a.frequency);
    const rental = toAnnual(a.rentalOrBoarder, a.frequency);
    const other = toAnnual(a.other, a.frequency);
    const assessable = salary + se + other + rental * policy.rentalIncomeScaling;
    grossAssessable += assessable;
    grossActual += salary + se + other + rental;
    // Tax is approximated on the assessable figure per applicant — close
    // enough for an indicative tool, and it keeps the engine pure and simple.
    netMonthly += netAnnual(assessable) / 12;
  }

  const c = profile.commitments;
  const base = profile.income.hasSecondApplicant ? A.livingExpenseCouple : A.livingExpenseSingle;
  const livingExpensesMonthly =
    base +
    c.dependants * A.livingExpensePerDependant +
    Math.max(0, netMonthly - A.livingExpenseIncomeFloor) * A.livingExpenseIncomeScaling;

  let commitmentsMonthly =
    c.loanRepaymentsMonthly + c.creditCardLimits * A.creditCardLimitFactor;
  if (c.hasBnpl) commitmentsMonthly += policy.bnplMonthlyAssessment;
  if (c.hasStudentLoan) {
    const app1Gross = toAnnual(applicants[0].salary, applicants[0].frequency) +
      toAnnual(applicants[0].selfEmployed, applicants[0].frequency);
    commitmentsMonthly += Math.max(0, (app1Gross - A.studentLoanThreshold) * A.studentLoanRate) / 12;
  }

  const isRefinance = profile.goal === "refinance";
  const depositTotal = isRefinance
    ? Math.max(0, profile.property.price - profile.refinance.balance) // equity
    : profile.deposit.savings +
      profile.deposit.gift +
      (profile.goal === "first-home" ? profile.deposit.kiwiSaver : 0);

  return { grossAssessable, grossActual, netMonthly, livingExpensesMonthly, commitmentsMonthly, depositTotal };
}

function maxLvrFor(profile: ApplicantProfile, policy: BankPolicy): number {
  const investor = profile.goal === "investment";
  const newBuild = profile.property.buildType === "new-build" && profile.goal !== "refinance";
  let lvr = newBuild
    ? investor
      ? policy.maxLvrNewBuildInvestor
      : policy.maxLvrNewBuildOwnerOccupier
    : investor
      ? policy.maxLvrInvestor
      : policy.maxLvrOwnerOccupier;

  // The specialist's 95% appetite only exists via the First Home Loan scheme,
  // which carries income caps. Outside the scheme it behaves like an 80% lender.
  const scheme = policy.firstHomeLoanScheme;
  if (scheme && !investor && lvr > 0.8 && !firstHomeSchemeApplies(profile, policy)) {
    lvr = 0.8;
  }
  return lvr;
}

function firstHomeSchemeApplies(profile: ApplicantProfile, policy: BankPolicy): boolean {
  const scheme = policy.firstHomeLoanScheme;
  if (!scheme || profile.goal !== "first-home") return false;
  const gross = household(profile, policy).grossActual;
  const cap = profile.income.hasSecondApplicant ? scheme.incomeCapCombined : scheme.incomeCapSingle;
  return gross > 0 && gross <= cap;
}

/* ------------------------------------------------------------------ */
/* Per-lender assessment                                               */
/* ------------------------------------------------------------------ */

function assessLender(profile: ApplicantProfile, policy: BankPolicy): LenderResult {
  const h = household(profile, policy);
  const isRefinance = profile.goal === "refinance";
  const price = profile.property.price;
  const loanRequired = isRefinance
    ? profile.refinance.balance
    : Math.max(0, price - h.depositTotal);
  const incomeEntered = h.grossAssessable > 0;

  /* ---- hard policy gates ---- */
  const hardFails: string[] = [];
  const lvr = maxLvrFor(profile, policy);
  const depositPct = price > 0 ? h.depositTotal / price : 0;

  if (price > 0 && depositPct + 1e-9 < 1 - lvr) {
    const needPct = Math.round((1 - lvr) * 100);
    hardFails.push(
      isRefinance
        ? `Needs at least ${needPct}% equity — you have ${(depositPct * 100).toFixed(1)}%`
        : `Needs a ${needPct}% deposit — yours is ${(depositPct * 100).toFixed(1)}%`,
    );
  }
  if (
    profile.situation.employmentType === "self-employed" &&
    profile.situation.tenureYears < policy.selfEmployedMinYears
  ) {
    hardFails.push(
      `Wants ${policy.selfEmployedMinYears} year${policy.selfEmployedMinYears > 1 ? "s" : ""} of self-employed financials — you have ${profile.situation.tenureYears || "under 1"}`,
    );
  }
  if (!policy.acceptsCreditHistory.includes(profile.situation.creditHistory)) {
    hardFails.push(
      profile.situation.creditHistory === "defaults"
        ? "Doesn't lend where there are credit defaults on file"
        : "Only takes clean credit files",
    );
  }
  if (profile.situation.residency === "work-visa" && !policy.acceptsWorkVisa) {
    hardFails.push("Requires NZ citizenship or permanent residency");
  }
  if (profile.situation.residency === "other" && policy.kind !== "non-bank") {
    hardFails.push("Requires NZ citizenship, residency or a work visa");
  }
  if (
    policy.firstHomeLoanScheme &&
    profile.goal === "first-home" &&
    incomeEntered &&
    !firstHomeSchemeApplies(profile, policy) &&
    depositPct < 0.2
  ) {
    const cap = profile.income.hasSecondApplicant
      ? policy.firstHomeLoanScheme.incomeCapCombined
      : policy.firstHomeLoanScheme.incomeCapSingle;
    hardFails.push(
      `Household income is over the First Home Loan cap (${fmtMoneyShort(cap)}), so the 5% deposit path is off`,
    );
  }

  /* ---- the three real constraints ---- */
  const constraints: ConstraintResult[] = [];

  // 1. Servicing / surplus (UMI) test at the lender's stress rate.
  if (incomeEntered) {
    const available =
      h.netMonthly - h.livingExpensesMonthly - h.commitmentsMonthly - policy.minMonthlySurplus;
    const maxLoanServicing = Math.max(0, loanFromPayment(available, policy.testRate, A.assessmentTermYears));
    constraints.push({
      kind: "servicing",
      maxLoan: maxLoanServicing,
      detail: `${fmtMoney(Math.max(0, available))}/month free to service a loan tested at ${policy.testRate.toFixed(2)}%`,
    });
  }

  // 2. RBNZ DTI cap (banks only — non-banks are exempt).
  const dtiCap = profile.goal === "investment" ? policy.dtiCapInvestor : policy.dtiCapOwnerOccupier;
  if (incomeEntered && dtiCap !== null) {
    const existingDebt = profile.commitments.loanBalances + profile.commitments.creditCardLimits;
    const maxLoanDti = Math.max(0, dtiCap * h.grossAssessable - existingDebt);
    constraints.push({
      kind: "dti",
      maxLoan: maxLoanDti,
      detail: `RBNZ cap of ${dtiCap}× your ${fmtMoneyShort(h.grossAssessable)} gross income, less ${fmtMoneyShort(existingDebt)} existing debt`,
    });
  }

  // 3. LVR / deposit. Capacity is what the deposit supports at max LVR,
  // and for this specific property, no more than price × LVR.
  if (h.depositTotal > 0 || price > 0) {
    const fromDeposit = lvr < 1 ? (h.depositTotal * lvr) / (1 - lvr) : Infinity;
    const maxLoanLvr = price > 0 ? Math.min(price * lvr, fromDeposit) : fromDeposit;
    constraints.push({
      kind: "lvr",
      maxLoan: maxLoanLvr,
      detail: `Max ${Math.round(lvr * 100)}% LVR with your ${fmtMoneyShort(h.depositTotal)} ${isRefinance ? "equity" : "deposit"}`,
    });
  }

  const applicable = constraints.filter((c) => Number.isFinite(c.maxLoan));
  const binding =
    applicable.length > 0
      ? applicable.reduce((min, c) => (c.maxLoan < min.maxLoan ? c : min))
      : null;
  const maxLoan = binding ? Math.max(0, binding.maxLoan) : 0;

  /* ---- verdict ---- */
  let verdict: Verdict;
  if (hardFails.length > 0) verdict = "unlikely";
  else if (!incomeEntered || loanRequired === 0) verdict = "borderline";
  else if (maxLoan >= loanRequired * 1.03) verdict = "likely";
  else if (maxLoan >= loanRequired * 0.93) verdict = "borderline";
  else verdict = "unlikely";

  /* ---- surplus at the requested loan ---- */
  const surplusAtRequested =
    h.netMonthly -
    h.livingExpensesMonthly -
    h.commitmentsMonthly -
    monthlyPayment(loanRequired, policy.testRate, A.assessmentTermYears);

  /* ---- plain-English "why" ---- */
  const why = whyLine(policy, verdict, hardFails, binding, maxLoan, loanRequired, profile, h);

  /* ---- repayments on the loan they'd actually write ---- */
  const quotedLoan = Math.min(loanRequired > 0 ? loanRequired : maxLoan, maxLoan);
  const repayments = {
    rate: policy.indicativeRate,
    monthly25: monthlyPayment(quotedLoan, policy.indicativeRate, 25),
    monthly30: monthlyPayment(quotedLoan, policy.indicativeRate, 30),
  };

  /* ---- refinance savings ---- */
  let refinance: LenderResult["refinance"];
  if (isRefinance && profile.refinance.balance > 0) {
    const annualSavings =
      (profile.refinance.balance * (profile.refinance.currentRate - policy.indicativeRate)) / 100;
    refinance = { annualSavings, monthlySavings: annualSavings / 12 };
  }

  return {
    policy,
    verdict,
    hardFails,
    maxLoan,
    binding,
    constraints,
    why,
    surplusAtRequested,
    repayments,
    firstHomeScheme: firstHomeSchemeApplies(profile, policy) && (profile.property.price === 0 || depositPct < 0.2),
    refinance,
  };
}

function whyLine(
  policy: BankPolicy,
  verdict: Verdict,
  hardFails: string[],
  binding: ConstraintResult | null,
  maxLoan: number,
  loanRequired: number,
  profile: ApplicantProfile,
  h: Household,
): string {
  if (hardFails.length > 0) return `${hardFails[0]}.`;

  const cc = profile.commitments.creditCardLimits;
  const ccDrag = cc * A.creditCardLimitFactor;
  const name = policy.name.split(" — ")[0];

  if (!binding || loanRequired === 0) {
    return `Answer the income questions and ${name} can put a real number on this.`;
  }

  if (verdict === "likely") {
    const headroom = maxLoan - loanRequired;
    return `Comfortably covers the ${fmtMoneyShort(loanRequired)} you need with about ${fmtMoneyShort(headroom)} of headroom at their ${policy.testRate.toFixed(1)}% test rate.`;
  }

  switch (binding.kind) {
    case "servicing": {
      const ccNote =
        cc > 0
          ? ` — your ${fmtMoneyShort(cc)} of credit card limits alone reduce that surplus by ${fmtMoney(ccDrag)}/month`
          : "";
      return `${name} caps you at ${fmtMoneyShort(maxLoan)} because after living costs and commitments, your monthly surplus only services that much at their ${policy.testRate.toFixed(1)}% test rate${ccNote}.`;
    }
    case "dti": {
      const capX = profile.goal === "investment" ? policy.dtiCapInvestor : policy.dtiCapOwnerOccupier;
      return `${name} caps you at ${fmtMoneyShort(maxLoan)}: the RBNZ debt-to-income rule limits total debt to ${capX}× your ${fmtMoneyShort(h.grossAssessable)} gross income, and existing balances and card limits use up part of that.`;
    }
    case "lvr": {
      const isRefi = profile.goal === "refinance";
      return `${name} caps you at ${fmtMoneyShort(maxLoan)} because your ${fmtMoneyShort(h.depositTotal)} ${isRefi ? "equity" : "deposit"} limits the loan-to-value ratio, not your income.`;
    }
    default:
      return `${name} caps you at ${fmtMoneyShort(maxLoan)}.`;
  }
}

/* ------------------------------------------------------------------ */
/* Quick wins                                                          */
/* ------------------------------------------------------------------ */

/**
 * Best achievable loan across lenders that pass every hard policy gate.
 * Stricter than the headline borrowing-power figure on purpose: a quick win
 * only counts if it moves a loan someone would actually write.
 */
function bestPower(profile: ApplicantProfile): number {
  const results = BANK_POLICIES.map((p) => assessLender(profile, p));
  return Math.max(0, ...results.filter((r) => r.hardFails.length === 0).map((r) => r.maxLoan));
}

function quickWins(profile: ApplicantProfile): QuickWin[] {
  const wins: QuickWin[] = [];
  const c = profile.commitments;
  const baseline = bestPower(profile);

  const test = (id: string, title: string, description: string, mutated: ApplicantProfile) => {
    const delta = bestPower(mutated) - baseline;
    if (delta >= 10_000) wins.push({ id, title, description, delta });
  };

  if (c.creditCardLimits > 0) {
    test(
      "cards",
      `Cancel your ${fmtMoneyShort(c.creditCardLimits)} of credit card limits`,
      `Lenders assess 3% of the limit — ${fmtMoney(c.creditCardLimits * A.creditCardLimitFactor)}/month — against you even if you never touch the cards.`,
      { ...profile, commitments: { ...c, creditCardLimits: 0 } },
    );
  }
  if (c.hasBnpl) {
    test(
      "bnpl",
      "Close your Afterpay/BNPL accounts",
      "Active BNPL reads as reliance on short-term credit and is assessed as a monthly commitment.",
      { ...profile, commitments: { ...c, hasBnpl: false } },
    );
  }
  if (c.loanRepaymentsMonthly > 0 && c.loanBalances > 0 && profile.goal !== "refinance") {
    test(
      "loans",
      `Clear the ${fmtMoneyShort(c.loanBalances)} of personal/car loans first`,
      `Freeing up ${fmtMoney(c.loanRepaymentsMonthly)}/month of repayments usually adds more borrowing power than the balance costs you in deposit.`,
      {
        ...profile,
        commitments: { ...c, loanRepaymentsMonthly: 0, loanBalances: 0 },
        deposit: { ...profile.deposit, savings: Math.max(0, profile.deposit.savings - c.loanBalances) },
      },
    );
  }
  if (
    (profile.goal === "first-home" || profile.goal === "next-home") &&
    profile.property.buildType === "existing"
  ) {
    test(
      "new-build",
      "Consider a new build",
      "New builds are exempt from LVR restrictions, so lenders accept smaller deposits and stretch further.",
      { ...profile, property: { ...profile.property, buildType: "new-build" } },
    );
  }
  if (
    (profile.goal === "first-home" || profile.goal === "next-home") &&
    toAnnual(profile.income.applicants[0].rentalOrBoarder, profile.income.applicants[0].frequency) === 0
  ) {
    const a1 = profile.income.applicants[0];
    const boarderAnnual = 200 * 52;
    const inFreq =
      a1.frequency === "annual" ? boarderAnnual : a1.frequency === "monthly" ? boarderAnnual / 12 : 200;
    test(
      "boarder",
      "Take in a boarder at $200/week",
      "Most lenders count 70–80% of declared boarder income toward servicing.",
      {
        ...profile,
        income: {
          ...profile.income,
          applicants: [
            { ...a1, rentalOrBoarder: a1.rentalOrBoarder + inFreq },
            profile.income.applicants[1],
          ],
        },
      },
    );
  }

  return wins.sort((a, b) => b.delta - a.delta).slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Shortfall hints — never a dead end                                  */
/* ------------------------------------------------------------------ */

function shortfallHint(
  profile: ApplicantProfile,
  results: LenderResult[],
  loanRequired: number,
): ShortfallHint | null {
  if (loanRequired <= 0) return null;
  const anyPath = results.some((r) => r.verdict !== "unlikely");
  if (anyPath) return null;

  // Best genuine option (ignoring hard fails) tells us what to fix first.
  const best = [...results].sort((a, b) => b.maxLoan - a.maxLoan)[0];
  if (!best) return null;

  if (best.hardFails.length > 0 && best.maxLoan >= loanRequired * 0.93) {
    return {
      headline: "The numbers work — one policy rule is in the way",
      detail: `${best.policy.name} could stretch to ${fmtMoneyShort(best.maxLoan)}, but: ${best.hardFails[0].toLowerCase()}. Fix that and this becomes live.`,
    };
  }

  const gap = loanRequired - best.maxLoan;
  switch (best.binding?.kind) {
    case "lvr": {
      const lvr = maxLvrFor(profile, best.policy);
      const h = household(profile, best.policy);
      const depositNeeded = profile.property.price * (1 - lvr) - h.depositTotal;
      return {
        headline: `About ${fmtMoneyShort(Math.max(depositNeeded, 0))} more deposit changes everything`,
        detail: `At ${best.policy.name}'s ${Math.round(lvr * 100)}% max LVR, a ${fmtMoneyShort(profile.property.price)} property needs ${fmtMoneyShort(profile.property.price * (1 - lvr))} down. KiwiSaver, a family gift, or a slightly cheaper property (${fmtMoneyShort((h.depositTotal / (1 - lvr)))} works today) all close the gap.`,
      };
    }
    case "servicing":
      return {
        headline: `You're ${fmtMoneyShort(gap)} short on servicing — here's the size of the fix`,
        detail: `Roughly ${fmtMoney(gap * paymentPerDollar(best.policy.testRate, A.assessmentTermYears))}/month more surplus would cover it: trimming commitments, adding income, or targeting around ${fmtMoneyShort(best.maxLoan + household(profile, best.policy).depositTotal)} instead.`,
      };
    case "dti":
      return {
        headline: "The RBNZ debt-to-income cap is the binding limit",
        detail: `Total debt is capped at ${profile.goal === "investment" ? 7 : 6}× gross income. Clearing existing balances and card limits, or growing income, moves this — or a non-bank lender outside the cap may stretch further.`,
      };
    default:
      return {
        headline: "Not there yet — but the gap is measurable",
        detail: `The strongest lender reaches ${fmtMoneyShort(best.maxLoan)} of the ${fmtMoneyShort(loanRequired)} you need. Adjust the deposit or price and watch the number in the header respond.`,
      };
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const VERDICT_ORDER: Record<Verdict, number> = { likely: 0, borderline: 1, unlikely: 2 };

export function matchEngine(profile: ApplicantProfile): MatchResult {
  const results = BANK_POLICIES.map((p) => assessLender(profile, p)).sort(
    (a, b) =>
      VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] ||
      b.maxLoan - a.maxLoan ||
      a.policy.indicativeRate - b.policy.indicativeRate,
  );

  const refHousehold = household(profile, BANK_POLICIES[0]);
  const isRefinance = profile.goal === "refinance";
  const loanRequired = isRefinance
    ? profile.refinance.balance
    : Math.max(0, profile.property.price - refHousehold.depositTotal);

  const clean = results.filter((r) => r.hardFails.length === 0);
  const pool = clean.length > 0 ? clean : results;
  const borrowingPower = Math.max(0, ...pool.map((r) => r.maxLoan));

  let refinance: MatchResult["refinance"] = null;
  if (isRefinance) {
    let refixWindowOpens: string | null = null;
    if (profile.refinance.fixedExpiry) {
      const d = new Date(profile.refinance.fixedExpiry);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() - A.refixWindowDays);
        refixWindowOpens = d.toISOString().slice(0, 10);
      }
    }
    refinance = {
      refixWindowOpens,
      bestAnnualSavings: Math.max(0, ...clean.map((r) => r.refinance?.annualSavings ?? 0)),
    };
  }

  return {
    lenders: results,
    borrowingPower,
    loanRequired,
    depositTotal: refHousehold.depositTotal,
    depositPct: profile.property.price > 0 ? (refHousehold.depositTotal / profile.property.price) * 100 : 0,
    grossAnnualIncome: refHousehold.grossActual,
    netMonthlyIncome: refHousehold.netMonthly,
    monthlyCommitments: refHousehold.commitmentsMonthly,
    monthlyLivingExpenses: refHousehold.livingExpensesMonthly,
    quickWins: refHousehold.grossActual > 0 ? quickWins(profile) : [],
    shortfall: refHousehold.grossActual > 0 ? shortfallHint(profile, results, loanRequired) : null,
    refinance,
  };
}
