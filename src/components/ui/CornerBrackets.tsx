import { cn } from "@/lib/utils";

/**
 * Decorative HUD corner brackets ( ⌐ ¬ etc. ) drawn around a container.
 * Render inside a `relative` parent; this fills it and is non-interactive.
 */
export function CornerBrackets({
  className,
  size = 14,
  color = "var(--color-primary)",
  inset = 0,
  opacity = 0.7,
}: {
  className?: string;
  size?: number;
  color?: string;
  inset?: number;
  opacity?: number;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    opacity,
  };
  const o = inset;
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span style={{ ...base, top: o, left: o, borderTop: "1.5px solid", borderLeft: "1.5px solid" }} />
      <span style={{ ...base, top: o, right: o, borderTop: "1.5px solid", borderRight: "1.5px solid" }} />
      <span style={{ ...base, bottom: o, left: o, borderBottom: "1.5px solid", borderLeft: "1.5px solid" }} />
      <span style={{ ...base, bottom: o, right: o, borderBottom: "1.5px solid", borderRight: "1.5px solid" }} />
    </div>
  );
}
