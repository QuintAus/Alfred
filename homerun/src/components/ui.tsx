import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Animated number                                                     */
/* ------------------------------------------------------------------ */

export function useAnimatedNumber(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      fromRef.current = v;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/* Field chrome                                                        */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[0.9rem] font-semibold text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-line-strong bg-surface px-4 py-3.5 text-[1.05rem] font-medium text-ink placeholder:font-normal placeholder:text-ink-faint outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className ?? ""}`} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={`${inputBase} appearance-none ${className ?? ""}`}>
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Currency input — free typing, formatted with commas                 */
/* ------------------------------------------------------------------ */

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  autoFocus,
  compact,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [text, setText] = useState(value > 0 ? value.toLocaleString("en-NZ") : "");
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value > 0 ? value.toLocaleString("en-NZ") : "");
  }, [value]);

  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-medium text-ink-faint ${compact ? "left-3 text-sm" : "left-4 text-[1.05rem]"}`}
      >
        $
      </span>
      <input
        inputMode="numeric"
        autoFocus={autoFocus}
        className={`${inputBase} ${compact ? "px-3 py-2.5 pl-7 text-sm" : "pl-8"} tabular-nums`}
        placeholder={placeholder}
        value={text}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(value > 0 ? value.toLocaleString("en-NZ") : "");
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          const n = raw === "" ? 0 : Math.min(Number(raw), 99_999_999);
          setText(raw === "" ? "" : n.toLocaleString("en-NZ"));
          onChange(n);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slider + linked input                                               */
/* ------------------------------------------------------------------ */

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const clamped = Math.min(Math.max(value, min), max);
  const fill = ((clamped - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamped}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Adjust amount"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Option cards — the big touch targets                                */
/* ------------------------------------------------------------------ */

export interface Option<T extends string> {
  value: T;
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 1,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`group flex w-full items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-left transition-all duration-200 active:scale-[0.985] ${
              active
                ? "border-accent bg-accent-tint shadow-card"
                : "border-line hover:border-line-strong hover:shadow-card"
            }`}
          >
            {o.icon && (
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors ${
                  active ? "bg-accent text-white" : "bg-paper text-ink-soft group-hover:text-accent"
                }`}
              >
                {o.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[0.98rem] font-semibold leading-snug">{o.title}</span>
              {o.description && (
                <span className="mt-0.5 block text-[0.82rem] leading-snug text-ink-soft">
                  {o.description}
                </span>
              )}
            </span>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
                active ? "border-accent bg-accent text-white" : "border-line-strong text-transparent"
              }`}
            >
              <Check size={14} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented toggle                                                    */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`inline-flex w-full rounded-xl bg-ink/6 p-1 ${size === "sm" ? "max-w-xs" : ""}`}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[10px] px-3 font-semibold transition-all duration-200 ${
            size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm"
          } ${
            o.value === value
              ? "bg-surface text-ink shadow-card"
              : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle row (yes/no switch)                                          */
/* ------------------------------------------------------------------ */

export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-line-strong"
    >
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-semibold">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-soft">{description}</span>
        )}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          value ? "bg-accent" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all duration-200 ${
            value ? "left-[calc(100%-1.625rem)]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Count stepper (dependants)                                          */
/* ------------------------------------------------------------------ */

export function CountStepper({
  value,
  onChange,
  min = 0,
  max = 8,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const btn =
    "grid size-11 place-items-center rounded-xl border border-line-strong bg-surface text-ink-soft transition enabled:hover:border-accent enabled:hover:text-accent enabled:active:scale-95 disabled:opacity-35";
  return (
    <div className="flex items-center gap-4">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Fewer">
        <Minus size={18} />
      </button>
      <span className="w-10 text-center font-display text-2xl font-semibold tabular-nums">{value}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="More">
        <Plus size={18} />
      </button>
    </div>
  );
}
