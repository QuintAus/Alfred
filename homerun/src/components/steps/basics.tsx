import { Building2, CalendarClock, Home, KeyRound, RefreshCcw, Sparkles, TrendingUp } from "lucide-react";
import { NZ_REGIONS, ENGINE_ASSUMPTIONS } from "../../lib/bankPolicies";
import { fmtMoney, fmtPct } from "../../lib/money";
import type { Goal } from "../../lib/types";
import { CurrencyInput, Field, OptionGrid, SelectInput, SliderInput, TextInput } from "../ui";
import type { StepProps } from "./shared";

/* ------------------------------------------------------------------ */
/* 1 · Goal                                                            */
/* ------------------------------------------------------------------ */

export function GoalStep({ profile, set, onPick }: StepProps & { onPick: () => void }) {
  return (
    <OptionGrid<Goal>
      value={profile.goal}
      onChange={(goal) => {
        set((p) => ({ ...p, goal }));
        onPick();
      }}
      options={[
        {
          value: "first-home",
          title: "Buying my first home",
          description: "KiwiSaver, First Home Loan and low-deposit paths included",
          icon: <Sparkles size={20} />,
        },
        {
          value: "next-home",
          title: "Buying my next home",
          description: "Moving up, moving towns, or starting over",
          icon: <Home size={20} />,
        },
        {
          value: "investment",
          title: "Buying an investment property",
          description: "Rental income counted, investor LVR and DTI rules applied",
          icon: <TrendingUp size={20} />,
        },
        {
          value: "refinance",
          title: "Refinancing or refixing",
          description: "See what switching saves before your fixed term rolls over",
          icon: <RefreshCcw size={20} />,
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* 2 · Property                                                        */
/* ------------------------------------------------------------------ */

export function PropertyStep({ profile, set }: StepProps) {
  const refi = profile.goal === "refinance";
  const price = profile.property.price;
  return (
    <>
      <Field label={refi ? "Roughly what's your home worth today?" : "Purchase price or budget"}>
        <CurrencyInput
          value={price}
          onChange={(n) => set((p) => ({ ...p, property: { ...p.property, price: n } }))}
          placeholder={refi ? "950,000" : "850,000"}
        />
        <div className="mt-4 px-1">
          <SliderInput
            value={price || 600_000}
            onChange={(n) => set((p) => ({ ...p, property: { ...p.property, price: n } }))}
            min={200_000}
            max={2_500_000}
            step={10_000}
          />
          <div className="mt-1.5 flex justify-between text-xs text-ink-faint">
            <span>$200k</span>
            <span>$2.5m</span>
          </div>
        </div>
      </Field>

      <Field label="Region">
        <SelectInput
          value={profile.property.region ?? ""}
          onChange={(e) =>
            set((p) => ({ ...p, property: { ...p.property, region: e.target.value || null } }))
          }
        >
          <option value="" disabled>
            Choose a region
          </option>
          {NZ_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectInput>
      </Field>

      {!refi && (
        <Field label="New build or existing?">
          <OptionGrid
            columns={2}
            value={profile.property.buildType}
            onChange={(buildType) => set((p) => ({ ...p, property: { ...p.property, buildType } }))}
            options={[
              {
                value: "existing",
                title: "Existing home",
                description: "Standard deposit rules apply",
                icon: <Home size={20} />,
              },
              {
                value: "new-build",
                title: "New build",
                description: "Exempt from LVR limits — smaller deposits OK",
                icon: <Building2 size={20} />,
              },
            ]}
          />
        </Field>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · Deposit                                                         */
/* ------------------------------------------------------------------ */

export function DepositStep({ profile, set, match }: StepProps) {
  const firstHome = profile.goal === "first-home";
  const d = profile.deposit;
  const total = match.depositTotal;
  const pct = match.depositPct;

  return (
    <>
      <Field label="Savings in the bank">
        <CurrencyInput
          value={d.savings}
          onChange={(n) => set((p) => ({ ...p, deposit: { ...p.deposit, savings: n } }))}
          placeholder="80,000"
        />
      </Field>
      {firstHome && (
        <Field label="KiwiSaver available to withdraw" hint="First-home withdrawal — $1,000 must stay in">
          <CurrencyInput
            value={d.kiwiSaver}
            onChange={(n) => set((p) => ({ ...p, deposit: { ...p.deposit, kiwiSaver: n } }))}
            placeholder="45,000"
          />
        </Field>
      )}
      <Field label="Gifts from family" hint="Genuine gifts, not loans">
        <CurrencyInput
          value={d.gift}
          onChange={(n) => set((p) => ({ ...p, deposit: { ...p.deposit, gift: n } }))}
          placeholder="0"
        />
      </Field>

      {/* Live running total */}
      <div className="rounded-2xl border border-accent/20 bg-accent-tint p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-accent-deep/70">
              Total deposit
            </div>
            <div className="font-display text-3xl font-semibold text-accent-deep tabular-nums">
              {fmtMoney(total)}
            </div>
          </div>
          {profile.property.price > 0 && (
            <div className="text-right">
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-accent-deep/70">
                Of {fmtMoney(profile.property.price)}
              </div>
              <div className="font-display text-3xl font-semibold text-accent-deep tabular-nums">
                {fmtPct(pct)}
              </div>
            </div>
          )}
        </div>
        {profile.property.price > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(100, (pct / 20) * 100)}%` }}
            />
          </div>
        )}
        <p className="mt-2.5 text-[0.82rem] leading-snug text-accent-deep/80">
          {pct >= 20
            ? "20%+ opens every lender's best pricing. Strong position."
            : pct >= 10
              ? "10–20% works with several lenders — expect low-equity margins from some."
              : pct >= 5
                ? firstHome
                  ? "5–10% can still work via the First Home Loan path — we'll check the income caps."
                  : "Under 10% is tight outside first-home schemes, but not a dead end."
                : "Most lenders want at least 5% down. Every extra dollar here moves your number the most."}
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3R · Refinance details (replaces Deposit on the refi path)          */
/* ------------------------------------------------------------------ */

export function RefinanceStep({ profile, set }: StepProps) {
  const r = profile.refinance;
  const equity = Math.max(0, profile.property.price - r.balance);
  const equityPct = profile.property.price > 0 ? (equity / profile.property.price) * 100 : 0;

  const refixWindow = (() => {
    if (!r.fixedExpiry) return null;
    const d = new Date(r.fixedExpiry);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() - ENGINE_ASSUMPTIONS.refixWindowDays);
    return d;
  })();

  return (
    <>
      <Field label="Who's your current lender?">
        <TextInput
          value={r.currentLender ?? ""}
          placeholder="e.g. ANZ, ASB, Westpac…"
          onChange={(e) =>
            set((p) => ({ ...p, refinance: { ...p.refinance, currentLender: e.target.value || null } }))
          }
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Loan balance remaining">
          <CurrencyInput
            value={r.balance}
            onChange={(n) => set((p) => ({ ...p, refinance: { ...p.refinance, balance: n } }))}
            placeholder="620,000"
          />
        </Field>
        <Field label="Current rate" hint="% p.a.">
          <TextInput
            inputMode="decimal"
            value={r.currentRate === 0 ? "" : String(r.currentRate)}
            placeholder="6.85"
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^\d.]/g, ""));
              set((p) => ({
                ...p,
                refinance: { ...p.refinance, currentRate: Number.isFinite(n) ? Math.min(n, 15) : 0 },
              }));
            }}
          />
        </Field>
      </div>

      <Field label="When does your fixed term expire?">
        <TextInput
          type="date"
          value={r.fixedExpiry ?? ""}
          onChange={(e) =>
            set((p) => ({ ...p, refinance: { ...p.refinance, fixedExpiry: e.target.value || null } }))
          }
        />
      </Field>

      {r.balance > 0 && profile.property.price > 0 && (
        <div className="rounded-2xl border border-accent/20 bg-accent-tint p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-accent-deep/70">
                Your equity
              </div>
              <div className="font-display text-3xl font-semibold text-accent-deep tabular-nums">
                {fmtMoney(equity)}{" "}
                <span className="text-lg">({equityPct.toFixed(0)}%)</span>
              </div>
            </div>
            <KeyRound className="text-accent-deep/40" size={28} />
          </div>
          {refixWindow && (
            <p className="mt-2.5 flex items-center gap-2 text-[0.85rem] font-medium text-accent-deep">
              <CalendarClock size={16} />
              Your refix window opens on{" "}
              {refixWindow.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
              — most lenders let you lock a rate ~60 days early.
            </p>
          )}
        </div>
      )}
    </>
  );
}
