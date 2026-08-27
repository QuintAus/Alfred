# Homerun — NZ digital mortgage platform (front-end prototype)

One smooth form, instant answers, no jargon, no phone calls unless you want one.

A single-page, mobile-first React prototype for a New Zealand digital mortgage
qualifier. All state lives in memory; the eligibility maths is real NZ lending
policy, fully separated from the UI so a backend can be dropped in later.
"Homerun" is a neutral placeholder brand — swap it in `index.html`,
`src/components/Header.tsx` and the disclosure footer.

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # type-checks + production build
```

## Demo mode

A low-contrast **demo** button sits in the bottom-right corner:

- **Click** — pre-fills a realistic first-home couple (Auckland, $910k,
  24% deposit, $178k household income, $15k of credit card limits) so the
  whole flow can be walked in ~30 seconds by tapping Continue.
- **Shift-click** — pre-fills the refinance path ($620k balance at 6.85%,
  fixed term expiring soon) to show the switching-savings story.

## Architecture — where a real API plugs in

The data layer is three things, all in `src/lib/`, none of which import UI:

| Piece | File | Role |
| --- | --- | --- |
| `ApplicantProfile` | `types.ts`, `profile.ts` | The single object the form fills in |
| `bankPolicies` | `bankPolicies.ts` | Config array of 5 illustrative lender policies + engine assumptions |
| `matchEngine(profile)` | `matchEngine.ts` | Pure function → ranked lender results, quick wins, shortfall hints |

The UI (in `src/components/`) only ever calls `matchEngine(profile)`. Replace
that one call with a `fetch` and nothing else changes.

## The lending rules the engine actually models

- **Servicing test**: repayments stress-tested at ~7.3–8.2% (carded + ~2%
  buffer, per lender) over 30 years, against net income (NZ PAYE from
  July 2024 + ACC levy) minus a HEM-style living-expense estimate (scaled by
  household size, dependants and income) minus commitments, requiring a
  per-lender minimum monthly surplus (UMI).
- **RBNZ DTI caps** (July 2024): total debt ≤ 6× gross income for
  owner-occupiers, ≤ 7× for investors, applied hard (the 20% speed-limit
  exemption is ignored). Non-bank lenders are exempt from the regime.
- **LVR**: owner-occupiers ~20% deposit (per-lender appetite 80–90%),
  investors 30% (70% LVR); **new builds are LVR-exempt** and treated as an
  advantage.
- **Credit cards**: assessed at 3% of the **limit** per month, and limits
  count toward DTI debt. BNPL is a per-lender monthly assessment.
- **Rental/boarder income** scaled to 70–80% per lender. Student loan at 12%
  over the repayment threshold.
- **Kāinga Ora-style First Home Loan**: 5–20% deposit path with configurable
  income caps ($95k single / $150k combined), surfaced as a distinct option
  with its trade-offs.
- **Refinance**: first-class path — equity from estimated value minus
  balance, savings per year vs the current rate, and a "your refix window
  opens on [date]" hook (~60 days before fixed-term expiry).

Every lender card carries a plain-English "why" naming the binding constraint
with real numbers, an expandable breakdown of all three constraints, and a
repayment preview (weekly/fortnightly/monthly, 25/30-year). The quick-wins
panel re-runs the engine on mutated profiles (cancel card limits, clear BNPL,
pay off loans, take a boarder, buy a new build) and only shows levers that
genuinely move the best-lender number. Dead ends never happen: when nothing
fits, a shortfall panel quantifies exactly what would need to change.

All figures are illustrative and indicative only — not financial advice.
