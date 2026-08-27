import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function StepShell({
  stepKey,
  direction,
  kicker,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  hideNext,
}: {
  stepKey: string;
  direction: "fwd" | "back";
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
}) {
  return (
    <div
      key={stepKey}
      className={direction === "fwd" ? "animate-step-in" : "animate-step-back"}
    >
      <div className="mb-7">
        <div className="mb-2 flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="grid size-8 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-accent hover:text-accent active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent">
            {kicker}
          </span>
        </div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>

      <div className="space-y-4">{children}</div>

      {!hideNext && onNext && (
        <div className="mt-8">
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-[1.02rem] font-semibold text-white shadow-card transition enabled:hover:bg-accent-deep enabled:active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-56"
          >
            {nextLabel}
            <ArrowRight size={18} className="transition-transform group-enabled:group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
