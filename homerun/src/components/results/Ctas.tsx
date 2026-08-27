import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck, Check, Mail, PhoneCall, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared sheet / dialog                                               */
/* ------------------------------------------------------------------ */

/* Portalled to <body>: ancestors keep transforms from step animations,
 * which would otherwise re-anchor position:fixed to the animated element. */
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="animate-fade absolute inset-0 bg-ink/45" onClick={onClose} />
      <div className="animate-sheet-up relative w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-pop sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-paper text-ink-soft transition hover:text-ink"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const input =
  "w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[0.95rem] font-medium outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 placeholder:font-normal placeholder:text-ink-faint";

function Done({ title, body }: { title: string; body: string }) {
  return (
    <div className="animate-rise py-6 text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-accent-tint text-accent">
        <Check size={26} strokeWidth={2.5} />
      </span>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-[0.9rem] leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Book a call                                                         */
/* ------------------------------------------------------------------ */

function nextWeekdays(count: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
  }
  return days;
}

const SLOTS = ["9:30 am", "11:00 am", "1:30 pm", "4:00 pm"];

export function BookCallSheet({ onClose }: { onClose: () => void }) {
  const days = useMemo(() => nextWeekdays(5), []);
  const [day, setDay] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    const when = day !== null ? days[day].toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" }) : "";
    return (
      <Sheet onClose={onClose}>
        <Done
          title="You're booked in"
          body={`15 minutes, ${when} at ${slot}. A real human (no sales script) will call to walk through your results.`}
        />
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="font-display text-xl font-semibold">Lock it in — 15-min call</h3>
      <p className="mt-1 text-[0.85rem] text-ink-soft">
        A friendly adviser, your results on the screen, zero obligation.
      </p>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => setDay(i)}
              className={`min-w-16 shrink-0 rounded-xl border-2 px-3 py-2 text-center transition ${
                day === i ? "border-accent bg-accent-tint" : "border-line hover:border-line-strong"
              }`}
            >
              <div className="text-[0.68rem] font-bold uppercase text-ink-faint">
                {d.toLocaleDateString("en-NZ", { weekday: "short" })}
              </div>
              <div className="font-display text-lg font-semibold">{d.getDate()}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`rounded-xl border-2 px-3 py-2.5 text-[0.88rem] font-semibold transition ${
                slot === s ? "border-accent bg-accent-tint text-accent-deep" : "border-line hover:border-line-strong"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className={input}
          placeholder="Email or mobile"
          inputMode="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        <button
          type="button"
          disabled={day === null || !slot || !name.trim() || !contact.trim()}
          onClick={() => setDone(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white transition enabled:hover:bg-accent-deep enabled:active:scale-[0.985] disabled:opacity-40"
        >
          <CalendarCheck size={18} />
          Confirm my call
        </button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Email my results                                                    */
/* ------------------------------------------------------------------ */

export function EmailSheet({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (done) {
    return (
      <Sheet onClose={onClose}>
        <Done
          title="On its way"
          body={`Your full results — every lender, every number, every "why" — are heading to ${email}. No follow-up spam, promise.`}
        />
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="font-display text-xl font-semibold">Email me my results</h3>
      <p className="mt-1 text-[0.85rem] text-ink-soft">
        A single tidy summary you can keep, forward, or take to any broker.
      </p>
      <div className="mt-5 space-y-4">
        <input
          className={input}
          type="email"
          inputMode="email"
          placeholder="you@example.co.nz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => setDone(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-white transition enabled:hover:bg-accent-deep enabled:active:scale-[0.985] disabled:opacity-40"
        >
          <Mail size={18} />
          Send my results
        </button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* CTA row                                                             */
/* ------------------------------------------------------------------ */

export function CtaSection() {
  const [sheet, setSheet] = useState<"call" | "email" | null>(null);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => setSheet("call")}
        className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-[0.98rem] font-semibold text-white shadow-card transition hover:bg-accent-deep active:scale-[0.985]"
      >
        <PhoneCall size={18} />
        Lock it in — book a 15-min call
      </button>
      <button
        type="button"
        onClick={() => setSheet("email")}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-accent bg-surface px-6 py-4 text-[0.98rem] font-semibold text-accent-deep transition hover:bg-accent-tint active:scale-[0.985]"
      >
        <Mail size={18} />
        Email me my results
      </button>
      {sheet === "call" && <BookCallSheet onClose={() => setSheet(null)} />}
      {sheet === "email" && <EmailSheet onClose={() => setSheet(null)} />}
    </div>
  );
}
