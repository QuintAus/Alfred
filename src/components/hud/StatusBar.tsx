import { CornerBrackets } from "@/components/ui/CornerBrackets";

function Telemetry({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 px-3">
      <span className="font-heading text-[10px] tracking-[0.25em] text-ink-dim">{label}</span>
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: accent ?? "var(--color-ink)" }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Top HUD bar: wordmark on the left, system telemetry on the right.
 * Telemetry values are decorative in Phase 1.
 */
export function StatusBar() {
  return (
    <header className="relative">
      <div className="glass relative flex items-center justify-between rounded-xl px-4 py-2.5">
        <CornerBrackets size={10} opacity={0.5} />

        {/* wordmark */}
        <div className="flex items-center gap-3">
          <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)] animate-ring-breathe" />
          <div className="leading-none">
            <div className="font-display text-lg font-bold tracking-[0.3em] text-ink text-glow">
              J.A.R.V.I.S.
            </div>
            <div className="font-heading text-[10px] tracking-[0.3em] text-ink-dim">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </div>
          </div>
        </div>

        {/* telemetry */}
        <div className="hidden items-center divide-x divide-primary/10 md:flex">
          <Telemetry label="CORE" value="42.0°C" accent="var(--color-primary)" />
          <Telemetry label="PWR" value="98%" accent="var(--color-success)" />
          <Telemetry label="MEM" value="61%" accent="var(--color-primary)" />
          <Telemetry label="UPLINK" value="◈ SECURE" accent="var(--color-success)" />
          <Telemetry label="SYS" value="ONLINE" accent="var(--color-accent)" />
        </div>

        {/* animated sweep line */}
        <div className="pointer-events-none absolute inset-x-2 bottom-0 h-px overflow-hidden">
          <div
            className="h-px w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{ animation: "sweep 6s linear infinite" }}
          />
        </div>
      </div>
    </header>
  );
}
