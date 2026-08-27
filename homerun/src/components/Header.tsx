import { fmtMoney, roundTo } from "../lib/money";
import { useAnimatedNumber } from "./ui";

export function Header({
  progress,
  showPower,
  power,
}: {
  /** 0..1 across the form steps. */
  progress: number;
  showPower: boolean;
  power: number;
}) {
  const animated = useAnimatedNumber(power);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-4 px-5">
        <a href="#" className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <span className="grid size-8 place-items-center rounded-lg bg-accent font-display text-lg font-semibold text-white">
            h
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">homerun</span>
        </a>

        {showPower && (
          <div className="animate-fade rounded-full border border-accent/25 bg-accent-tint px-4 py-1.5 text-right">
            <div className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-accent-deep/70">
              Est. borrowing power
            </div>
            <div className="font-display text-lg font-semibold leading-tight text-accent-deep tabular-nums">
              {power > 0 ? fmtMoney(roundTo(animated, 1000)) : "—"}
            </div>
          </div>
        )}
      </div>
      <div className="h-0.5 w-full bg-line">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </header>
  );
}
