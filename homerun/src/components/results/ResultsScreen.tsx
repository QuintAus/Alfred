import { useState } from "react";
import { CalendarClock, Compass, Pencil, Zap } from "lucide-react";
import { fmtMoney, fmtMoneyShort, fmtPct, roundTo } from "../../lib/money";
import type { ApplicantProfile, MatchResult } from "../../lib/types";
import { Segmented, useAnimatedNumber } from "../ui";
import { CtaSection } from "./Ctas";
import { LenderCard, type PayFreq, type Term } from "./LenderCard";

export function ResultsScreen({
  profile,
  match,
  onEdit,
}: {
  profile: ApplicantProfile;
  match: MatchResult;
  onEdit: () => void;
}) {
  const [term, setTerm] = useState<Term>(30);
  const [freq, setFreq] = useState<PayFreq>("fortnightly");
  const isRefinance = profile.goal === "refinance";
  const animatedPower = useAnimatedNumber(match.borrowingPower, 900);
  const animatedSavings = useAnimatedNumber(match.refinance?.bestAnnualSavings ?? 0, 900);
  const likelyCount = match.lenders.filter((l) => l.verdict === "likely").length;

  return (
    <div className="animate-step-in">
      {/* ------------ Hero ------------ */}
      <div className="mb-6 rounded-3xl bg-ink p-6 text-white shadow-pop sm:p-8">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/60">
          {isRefinance ? "Your switching picture" : "Your borrowing power"}
        </div>
        <div className="mt-1 font-display text-[2.6rem] font-semibold leading-none tabular-nums sm:text-[3.2rem]">
          {isRefinance ? `${fmtMoney(roundTo(animatedSavings, 100))}/yr` : fmtMoney(roundTo(animatedPower, 1000))}
        </div>
        <p className="mt-3 max-w-md text-[0.92rem] leading-relaxed text-white/75">
          {isRefinance
            ? match.refinance && match.refinance.bestAnnualSavings > 0
              ? `That's the saving on your ${fmtMoneyShort(match.loanRequired)} balance if you switch to the sharpest match below — before any cash contribution sweeteners.`
              : "No lender beats your current rate today — but your position is checked against every policy below."
            : likelyCount > 0
              ? `You need ${fmtMoneyShort(match.loanRequired)} — and ${likelyCount} of 5 lenders would likely write it. Every card explains itself: no black box.`
              : `You need ${fmtMoneyShort(match.loanRequired)}. Nobody clears it comfortably yet — but the gap is measurable, and below is exactly what moves it.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-[0.78rem] font-semibold">
          {!isRefinance && (
            <span className="rounded-full bg-white/12 px-3 py-1.5">
              Deposit {fmtMoneyShort(match.depositTotal)} ({fmtPct(match.depositPct, 1)})
            </span>
          )}
          <span className="rounded-full bg-white/12 px-3 py-1.5">
            Income {fmtMoneyShort(match.grossAnnualIncome)}/yr gross
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1.5">
            Commitments {fmtMoney(match.monthlyCommitments)}/mo
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink transition hover:bg-white/85"
          >
            <Pencil size={12} />
            Edit answers
          </button>
        </div>
      </div>

      {/* ------------ Refix window hook ------------ */}
      {isRefinance && match.refinance?.refixWindowOpens && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent-tint p-4 text-accent-deep">
          <CalendarClock size={22} className="shrink-0" />
          <p className="text-[0.9rem] leading-snug">
            <strong>
              Your refix window opens on{" "}
              {new Date(match.refinance.refixWindowOpens).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </strong>{" "}
            Lock a rate then and switch the day your fixed term ends — no break fees.
          </p>
        </div>
      )}

      {/* ------------ Shortfall — never a dead end ------------ */}
      {match.shortfall && (
        <div className="mb-6 rounded-2xl border border-warn/25 bg-warn-tint p-5">
          <div className="flex items-center gap-2 font-bold text-warn">
            <Compass size={18} />
            {match.shortfall.headline}
          </div>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-warn/90">{match.shortfall.detail}</p>
        </div>
      )}

      {/* ------------ Quick wins ------------ */}
      {match.quickWins.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
              <Zap size={16} />
            </span>
            <h2 className="text-[1.05rem] font-bold">Quick wins</h2>
            <span className="text-[0.78rem] text-ink-faint">computed from your actual numbers</span>
          </div>
          <div className="mt-4 space-y-3">
            {match.quickWins.map((w) => (
              <div
                key={w.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-line bg-paper p-4"
              >
                <div>
                  <div className="text-[0.92rem] font-semibold leading-snug">{w.title}</div>
                  <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-soft">{w.description}</p>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <div className="font-display text-lg font-semibold text-accent-deep tabular-nums">
                    +{fmtMoneyShort(w.delta)}
                  </div>
                  <div className="text-[0.62rem] font-semibold uppercase leading-tight tracking-wide text-ink-faint">
                    borrowing
                    <br />
                    power
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------ Repayment context ------------ */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[1.05rem] font-bold">
          {isRefinance ? "Where you'd land, lender by lender" : "Your matches, ranked"}
        </h2>
        <div className="flex gap-2">
          <Segmented<"25" | "30">
            size="sm"
            value={String(term) as "25" | "30"}
            onChange={(v) => setTerm(Number(v) as Term)}
            options={[
              { value: "25", label: "25 yr" },
              { value: "30", label: "30 yr" },
            ]}
          />
          <Segmented<PayFreq>
            size="sm"
            value={freq}
            onChange={setFreq}
            options={[
              { value: "weekly", label: "Wk" },
              { value: "fortnightly", label: "Fn" },
              { value: "monthly", label: "Mo" },
            ]}
          />
        </div>
      </div>

      {/* ------------ Lender cards ------------ */}
      <div className="space-y-4">
        {match.lenders.map((r, i) => (
          <LenderCard key={r.policy.id} result={r} rank={i} term={term} freq={freq} isRefinance={isRefinance} />
        ))}
      </div>

      {/* ------------ CTAs ------------ */}
      <div className="mt-8">
        <CtaSection />
        <p className="mt-3 text-center text-[0.8rem] text-ink-faint">
          No pressure, no forced signup — your results stay right here either way.
        </p>
      </div>

      {/* ------------ Disclosure ------------ */}
      <footer className="mt-10 border-t border-line pt-5 text-[0.72rem] leading-relaxed text-ink-faint">
        <p>
          Indicative only — not financial advice. Figures are estimates from published lending settings and
          simplified assumptions; final approval, pricing and loan amounts are always subject to each lender's
          full assessment of your verified information. Homerun Financial Services Ltd (placeholder), FSP000000,
          holds a Financial Advice Provider licence (placeholder wording). Rates shown are illustrative and
          change without notice.
        </p>
      </footer>
    </div>
  );
}
