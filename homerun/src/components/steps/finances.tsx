import { Briefcase, Clock, HandCoins, Laptop, UserPlus, X } from "lucide-react";
import { ENGINE_ASSUMPTIONS } from "../../lib/bankPolicies";
import { fmtMoney } from "../../lib/money";
import type { ApplicantIncome, Frequency } from "../../lib/types";
import { CountStepper, CurrencyInput, Field, OptionGrid, Segmented, SelectInput, ToggleRow } from "../ui";
import type { StepProps } from "./shared";

/* ------------------------------------------------------------------ */
/* 4 · Income                                                          */
/* ------------------------------------------------------------------ */

function ApplicantCard({
  index,
  applicant,
  investor,
  onChange,
  onRemove,
}: {
  index: 0 | 1;
  applicant: ApplicantIncome;
  investor: boolean;
  onChange: (a: ApplicantIncome) => void;
  onRemove?: () => void;
}) {
  const patch = (part: Partial<ApplicantIncome>) => onChange({ ...applicant, ...part });
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.95rem] font-bold">{index === 0 ? "You" : "Applicant 2"}</h3>
        <div className="flex items-center gap-2">
          <Segmented<Frequency>
            size="sm"
            value={applicant.frequency}
            onChange={(frequency) => patch({ frequency })}
            options={[
              { value: "annual", label: "Yearly" },
              { value: "monthly", label: "Monthly" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove applicant 2"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-faint transition hover:border-danger hover:text-danger"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Salary / wages" hint="before tax">
          <CurrencyInput
            compact
            value={applicant.salary}
            onChange={(salary) => patch({ salary })}
            placeholder="90,000"
          />
        </Field>
        <Field label="Self-employed income" hint="needs 2 yrs financials">
          <CurrencyInput
            compact
            value={applicant.selfEmployed}
            onChange={(selfEmployed) => patch({ selfEmployed })}
          />
        </Field>
        <Field
          label={investor ? "Expected rental income" : "Rental / boarder income"}
          hint="banks count ~75%"
        >
          <CurrencyInput
            compact
            value={applicant.rentalOrBoarder}
            onChange={(rentalOrBoarder) => patch({ rentalOrBoarder })}
          />
        </Field>
        <Field label="Other income" hint="benefits, dividends…">
          <CurrencyInput compact value={applicant.other} onChange={(other) => patch({ other })} />
        </Field>
      </div>
    </div>
  );
}

export function IncomeStep({ profile, set }: StepProps) {
  const { hasSecondApplicant, applicants } = profile.income;
  const investor = profile.goal === "investment";
  const setApplicant = (i: 0 | 1) => (a: ApplicantIncome) =>
    set((p) => {
      const next: [ApplicantIncome, ApplicantIncome] = [...p.income.applicants];
      next[i] = a;
      return { ...p, income: { ...p.income, applicants: next } };
    });

  return (
    <>
      <ApplicantCard index={0} applicant={applicants[0]} investor={investor} onChange={setApplicant(0)} />
      {hasSecondApplicant ? (
        <ApplicantCard
          index={1}
          applicant={applicants[1]}
          investor={investor}
          onChange={setApplicant(1)}
          onRemove={() => set((p) => ({ ...p, income: { ...p.income, hasSecondApplicant: false } }))}
        />
      ) : (
        <button
          type="button"
          onClick={() => set((p) => ({ ...p, income: { ...p.income, hasSecondApplicant: true } }))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong p-4 text-[0.95rem] font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
        >
          <UserPlus size={18} />
          Add a second applicant — partners usually borrow more together
        </button>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 5 · Commitments                                                     */
/* ------------------------------------------------------------------ */

export function CommitmentsStep({ profile, set }: StepProps) {
  const c = profile.commitments;
  const patch = (part: Partial<typeof c>) =>
    set((p) => ({ ...p, commitments: { ...p.commitments, ...part } }));
  const ccMonthly = c.creditCardLimits * ENGINE_ASSUMPTIONS.creditCardLimitFactor;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Loan repayments" hint="car, personal — $/month">
          <CurrencyInput value={c.loanRepaymentsMonthly} onChange={(n) => patch({ loanRepaymentsMonthly: n })} />
        </Field>
        <Field label="Balance left on those loans">
          <CurrencyInput value={c.loanBalances} onChange={(n) => patch({ loanBalances: n })} />
        </Field>
      </div>

      <Field label="Credit card limits — total across all cards" hint="the limit, not what you owe">
        <CurrencyInput value={c.creditCardLimits} onChange={(n) => patch({ creditCardLimits: n })} />
        {c.creditCardLimits > 0 && (
          <p className="mt-2 rounded-xl bg-warn-tint px-3.5 py-2.5 text-[0.82rem] leading-snug text-warn">
            Banks assess ~3% of the limit monthly whether you use it or not — that's{" "}
            <strong>{fmtMoney(ccMonthly)}/month</strong> counted against you.
          </p>
        )}
      </Field>

      <ToggleRow
        label="Afterpay / Buy-now-pay-later"
        description="Any active BNPL accounts (Afterpay, Laybuy, Zip…)"
        value={c.hasBnpl}
        onChange={(hasBnpl) => patch({ hasBnpl })}
      />
      <ToggleRow
        label="Student loan"
        description="Repaid at 12% of income over the threshold"
        value={c.hasStudentLoan}
        onChange={(hasStudentLoan) => patch({ hasStudentLoan })}
      />

      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <div>
          <div className="text-[0.95rem] font-semibold">Dependants</div>
          <div className="text-[0.8rem] text-ink-soft">Kids or others you support financially</div>
        </div>
        <CountStepper value={c.dependants} onChange={(dependants) => patch({ dependants })} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 6 · Situation                                                       */
/* ------------------------------------------------------------------ */

export function SituationStep({ profile, set }: StepProps) {
  const s = profile.situation;
  const patch = (part: Partial<typeof s>) =>
    set((p) => ({ ...p, situation: { ...p.situation, ...part } }));

  return (
    <>
      <Field label="How do you earn?">
        <OptionGrid
          columns={2}
          value={s.employmentType}
          onChange={(employmentType) => patch({ employmentType })}
          options={[
            { value: "salaried", title: "Salary / wages", icon: <Briefcase size={20} /> },
            { value: "self-employed", title: "Self-employed", icon: <Laptop size={20} /> },
            { value: "contractor", title: "Contractor", icon: <HandCoins size={20} /> },
            { value: "casual", title: "Casual / part-time", icon: <Clock size={20} /> },
          ]}
        />
      </Field>

      <Field
        label={s.employmentType === "self-employed" ? "Years trading" : "Years in current role"}
        hint={s.employmentType === "self-employed" ? "most banks want 2+ years of financials" : undefined}
      >
        <SelectInput
          value={String(s.tenureYears)}
          onChange={(e) => patch({ tenureYears: Number(e.target.value) })}
        >
          <option value="0">Under 1 year</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="5">5+ years</option>
          <option value="10">10+ years</option>
        </SelectInput>
      </Field>

      <Field label="Residency">
        <SelectInput
          value={s.residency}
          onChange={(e) => patch({ residency: e.target.value as typeof s.residency })}
        >
          <option value="citizen">NZ citizen</option>
          <option value="permanent-resident">Permanent resident</option>
          <option value="work-visa">Work visa</option>
          <option value="other">Other</option>
        </SelectInput>
      </Field>

      <Field label="Credit history — your honest read">
        <OptionGrid
          value={s.creditHistory}
          onChange={(creditHistory) => patch({ creditHistory })}
          options={[
            {
              value: "clean",
              title: "Clean",
              description: "Everything paid on time, no surprises",
            },
            {
              value: "minor",
              title: "A few minor issues",
              description: "The odd late payment or a small unpaid bill, since fixed",
            },
            {
              value: "defaults",
              title: "Defaults on file",
              description: "Listed defaults, judgments or a past bankruptcy",
            },
          ]}
        />
      </Field>
    </>
  );
}
