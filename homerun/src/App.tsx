import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { matchEngine } from "./lib/matchEngine";
import { demoProfile, demoRefinanceProfile, emptyProfile } from "./lib/profile";
import type { ApplicantProfile } from "./lib/types";
import { Header } from "./components/Header";
import { StepShell } from "./components/StepShell";
import { DepositStep, GoalStep, PropertyStep, RefinanceStep } from "./components/steps/basics";
import { CommitmentsStep, IncomeStep, SituationStep } from "./components/steps/finances";
import { ResultsScreen } from "./components/results/ResultsScreen";
import { toAnnual } from "./lib/money";

type StepId = "goal" | "property" | "money-in-hand" | "income" | "commitments" | "situation" | "results";

const STEP_ORDER: StepId[] = ["goal", "property", "money-in-hand", "income", "commitments", "situation", "results"];

export default function App() {
  const [profile, setProfile] = useState<ApplicantProfile>(emptyProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [saved, setSaved] = useState(false);

  const match = useMemo(() => matchEngine(profile), [profile]);
  const step = STEP_ORDER[stepIndex];
  const isRefinance = profile.goal === "refinance";

  const set = (fn: (p: ApplicantProfile) => ApplicantProfile) => setProfile(fn);

  /* Autosave feel: flash a quiet "Saved" chip on every change. */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [profile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const go = (delta: 1 | -1) => {
    setDirection(delta === 1 ? "fwd" : "back");
    setStepIndex((i) => Math.min(Math.max(i + delta, 0), STEP_ORDER.length - 1));
  };

  const loadDemo = (refi: boolean) => {
    setProfile(refi ? demoRefinanceProfile() : demoProfile());
    setDirection("fwd");
    setStepIndex(0);
  };

  /* ---- per-step validation ---- */
  const applicant1 = profile.income.applicants[0];
  const incomeEntered =
    toAnnual(applicant1.salary, applicant1.frequency) +
      toAnnual(applicant1.selfEmployed, applicant1.frequency) +
      toAnnual(applicant1.other, applicant1.frequency) +
      toAnnual(applicant1.rentalOrBoarder, applicant1.frequency) >
    0;
  const canContinue: Record<StepId, boolean> = {
    goal: profile.goal !== null,
    property: profile.property.price > 0 && profile.property.region !== null,
    "money-in-hand": isRefinance
      ? profile.refinance.balance > 0 && profile.refinance.currentRate > 0
      : match.depositTotal > 0,
    income: incomeEntered,
    commitments: true,
    situation: true,
    results: true,
  };

  const showPower = stepIndex >= 2 && !isRefinance && match.borrowingPower > 0;
  const stepProps = { profile, set, match };

  return (
    <div className="min-h-dvh bg-paper">
      <Header
        progress={stepIndex / (STEP_ORDER.length - 1)}
        showPower={showPower}
        power={match.borrowingPower}
      />

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-8 sm:pt-12">
        {step === "goal" && (
          <StepShell
            stepKey="goal"
            direction={direction}
            kicker="Step 1 of 6"
            title="What are we sorting out today?"
            subtitle="One smooth form, instant answers, plain English. No phone calls unless you ask for one."
            hideNext
          >
            <GoalStep {...stepProps} onPick={() => setTimeout(() => go(1), 220)} />
          </StepShell>
        )}

        {step === "property" && (
          <StepShell
            stepKey="property"
            direction={direction}
            kicker="Step 2 of 6"
            title={isRefinance ? "Tell us about your home" : "The property"}
            subtitle={
              isRefinance
                ? "A rough value is fine — it sets your equity, which sets your pricing."
                : "A budget range is fine — you can drag the number around later and watch everything react."
            }
            onBack={() => go(-1)}
            onNext={() => go(1)}
            nextDisabled={!canContinue.property}
          >
            <PropertyStep {...stepProps} />
          </StepShell>
        )}

        {step === "money-in-hand" && (
          <StepShell
            stepKey="money-in-hand"
            direction={direction}
            kicker="Step 3 of 6"
            title={isRefinance ? "Your current loan" : "Your deposit"}
            subtitle={
              isRefinance
                ? "Three numbers from your loan docs — that's all the switching maths needs."
                : "Every dollar here counts. Watch the running total — and your borrowing power up top."
            }
            onBack={() => go(-1)}
            onNext={() => go(1)}
            nextDisabled={!canContinue["money-in-hand"]}
          >
            {isRefinance ? <RefinanceStep {...stepProps} /> : <DepositStep {...stepProps} />}
          </StepShell>
        )}

        {step === "income" && (
          <StepShell
            stepKey="income"
            direction={direction}
            kicker="Step 4 of 6"
            title="What's coming in?"
            subtitle="Before-tax figures, in whatever frequency your brain works in."
            onBack={() => go(-1)}
            onNext={() => go(1)}
            nextDisabled={!canContinue.income}
          >
            <IncomeStep {...stepProps} />
          </StepShell>
        )}

        {step === "commitments" && (
          <StepShell
            stepKey="commitments"
            direction={direction}
            kicker="Step 5 of 6"
            title="What's going out?"
            subtitle="This is where borrowing power hides. Credit card limits count even if you never use the card."
            onBack={() => go(-1)}
            onNext={() => go(1)}
          >
            <CommitmentsStep {...stepProps} />
          </StepShell>
        )}

        {step === "situation" && (
          <StepShell
            stepKey="situation"
            direction={direction}
            kicker="Step 6 of 6"
            title="Last one — your situation"
            subtitle="Honest answers get honest results. Nothing here is a dealbreaker on its own."
            onBack={() => go(-1)}
            onNext={() => go(1)}
            nextLabel="See my matches"
          >
            <SituationStep {...stepProps} />
          </StepShell>
        )}

        {step === "results" && (
          <ResultsScreen
            profile={profile}
            match={match}
            onEdit={() => {
              setDirection("back");
              setStepIndex(1);
            }}
          />
        )}
      </main>

      {/* Autosave chip */}
      <div
        aria-hidden={!saved}
        className={`pointer-events-none fixed left-1/2 top-[4.75rem] z-30 -translate-x-1/2 transition-all duration-300 ${
          saved ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[0.75rem] font-semibold text-white shadow-pop">
          <Check size={12} strokeWidth={3} />
          Saved
        </span>
      </div>

      {/* Hidden demo mode: click = first-home demo, shift-click = refinance demo. */}
      <button
        type="button"
        title="Demo mode (shift-click for the refinance demo)"
        onClick={(e) => loadDemo(e.shiftKey)}
        className="fixed bottom-4 right-4 z-40 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold text-ink-faint/50 transition hover:bg-surface hover:text-ink-soft hover:shadow-card"
      >
        demo
      </button>
    </div>
  );
}
