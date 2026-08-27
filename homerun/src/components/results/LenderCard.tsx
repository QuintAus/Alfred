import { useState } from "react";
import { BadgeCheck, ChevronDown, Landmark, PiggyBank, ShieldQuestion, Sparkles, XCircle } from "lucide-react";
import { fmtMoney, roundTo } from "../../lib/money";
import type { LenderResult, Verdict } from "../../lib/types";

export type Term = 25 | 30;
export type PayFreq = "weekly" | "fortnightly" | "monthly";

const VERDICT_META: Record<
  Verdict,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  likely: {
    label: "Likely approve",
    badge: "bg-accent-tint text-accent-deep border-accent/25",
    icon: <BadgeCheck size={14} />,
  },
  borderline: {
    label: "Borderline",
    badge: "bg-warn-tint text-warn border-warn/25",
    icon: <ShieldQuestion size={14} />,
  },
  unlikely: {
    label: "Unlikely",
    badge: "bg-danger-tint text-danger border-danger/20",
    icon: <XCircle size={14} />,
  },
};

const FREQ_META: Record<PayFreq, { divisor: number; suffix: string }> = {
  weekly: { divisor: 52 / 12, suffix: "/wk" },
  fortnightly: { divisor: 26 / 12, suffix: "/fn" },
  monthly: { divisor: 1, suffix: "/mo" },
};

const CONSTRAINT_LABEL: Record<string, string> = {
  servicing: "Servicing surplus",
  dti: "RBNZ debt-to-income cap",
  lvr: "Deposit / LVR",
  deposit: "Deposit",
};

export function LenderCard({
  result,
  rank,
  term,
  freq,
  isRefinance,
}: {
  result: LenderResult;
  rank: number;
  term: Term;
  freq: PayFreq;
  isRefinance: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[result.verdict];
  const monthly = term === 25 ? result.repayments.monthly25 : result.repayments.monthly30;
  const payment = monthly / FREQ_META[freq].divisor;
  const dimmed = result.verdict === "unlikely";

  return (
    <div
      className={`animate-rise overflow-hidden rounded-2xl border bg-surface shadow-card transition ${
        rank === 0 && !dimmed ? "border-accent/40 ring-1 ring-accent/20" : "border-line"
      } ${dimmed ? "opacity-75" : ""}`}
      style={{ animationDelay: `${rank * 70}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                dimmed ? "bg-paper text-ink-faint" : "bg-accent-tint text-accent-deep"
              }`}
            >
              {result.policy.kind === "non-bank" ? <PiggyBank size={19} /> : <Landmark size={19} />}
            </span>
            <div>
              <h3 className="text-[1.02rem] font-bold leading-tight">{result.policy.name}</h3>
              <p className="text-[0.78rem] text-ink-faint">{result.policy.tagline}</p>
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[0.72rem] font-bold ${meta.badge}`}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {result.firstHomeScheme && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[0.72rem] font-bold text-white">
            <Sparkles size={12} />
            First Home Loan path — 5% deposit OK, income caps apply
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
              {isRefinance ? "Would refinance up to" : "Est. max loan"}
            </div>
            <div
              className={`font-display text-[1.9rem] font-semibold leading-tight tabular-nums ${
                dimmed ? "text-ink-faint" : "text-ink"
              }`}
            >
              {fmtMoney(roundTo(result.maxLoan, 1000))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
              Indicative rate
            </div>
            <div className="font-display text-xl font-semibold tabular-nums">
              {result.repayments.rate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* The transparency promise: a plain-English why on every card. */}
        <p
          className={`mt-3 rounded-xl px-3.5 py-3 text-[0.86rem] leading-relaxed ${
            result.verdict === "likely"
              ? "bg-accent-tint text-accent-deep"
              : result.verdict === "borderline"
                ? "bg-warn-tint text-warn"
                : "bg-paper text-ink-soft"
          }`}
        >
          {result.why}
        </p>

        {isRefinance && result.refinance && result.hardFails.length === 0 && (
          <p
            className={`mt-2 text-[0.88rem] font-semibold ${
              result.refinance.annualSavings > 0 ? "text-accent-deep" : "text-ink-soft"
            }`}
          >
            {result.refinance.annualSavings > 0
              ? `Save ~${fmtMoney(result.refinance.annualSavings)}/year (${fmtMoney(result.refinance.monthlySavings)}/month) by switching here.`
              : "No rate saving vs. your current deal — stay put or negotiate."}
          </p>
        )}

        {!dimmed && payment > 0 && (
          <div className="mt-3 flex items-baseline justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5">
            <span className="text-[0.8rem] font-medium text-ink-soft">
              Repayments · {term}-year term
            </span>
            <span className="font-semibold tabular-nums">
              {fmtMoney(payment)}
              <span className="text-[0.78rem] font-medium text-ink-faint">{FREQ_META[freq].suffix}</span>
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-3 flex items-center gap-1 text-[0.8rem] font-semibold text-accent transition hover:text-accent-deep"
        >
          How we worked this out
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="animate-fade mt-3 space-y-2 border-t border-line pt-3">
            {result.constraints.map((c) => (
              <div key={c.kind} className="flex items-start justify-between gap-4 text-[0.82rem]">
                <div>
                  <span className="font-semibold">
                    {CONSTRAINT_LABEL[c.kind]}
                    {result.binding?.kind === c.kind && (
                      <span className="ml-1.5 rounded bg-ink/8 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft">
                        binding
                      </span>
                    )}
                  </span>
                  <p className="text-ink-faint">{c.detail}</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {Number.isFinite(c.maxLoan) ? fmtMoney(c.maxLoan) : "—"}
                </span>
              </div>
            ))}
            {result.hardFails.map((f) => (
              <p key={f} className="text-[0.82rem] font-medium text-danger">
                ✕ {f}
              </p>
            ))}
            <ul className="pt-1">
              {result.policy.strengths.map((s) => (
                <li key={s} className="text-[0.8rem] text-ink-soft">
                  · {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
