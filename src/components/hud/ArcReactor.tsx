import type { JarvisStatus } from "@/lib/types";

/**
 * The arc reactor — central focal element. Built from layered SVG rings with
 * CSS animations (no JS, render-cheap, crisp at any size). The reactive audio
 * ring is drawn separately by <VoiceVisualizer/> and overlaid on top of this.
 */
export function ArcReactor({
  status = "idle",
  className,
}: {
  status?: JarvisStatus;
  className?: string;
}) {
  const accent = status === "error" ? "#fb7185" : "#22d3ee";
  const accentBright = status === "error" ? "#fda4af" : "#00d4ff";

  // iconic triangular coil — three vertices on a circle
  const triR = 46;
  const tri = [90, 210, 330]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      return `${100 + triR * Math.cos(a)},${100 + triR * Math.sin(a)}`;
    })
    .join(" ");

  // radial coil spokes
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return {
      x1: 100 + 30 * Math.cos(a),
      y1: 100 + 30 * Math.sin(a),
      x2: 100 + 44 * Math.cos(a),
      y2: 100 + 44 * Math.sin(a),
    };
  });

  const center = "100px 100px";

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="ar-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eafcff" />
          <stop offset="32%" stopColor={accentBright} />
          <stop offset="70%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ar-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentBright} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* outer static ring */}
      <circle cx="100" cy="100" r="96" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="1" />

      {/* tick ring — slow spin */}
      <g className="animate-spin-slow" style={{ transformOrigin: center }}>
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="2 6"
        />
      </g>

      {/* segmented ring — reverse spin */}
      <g className="animate-spin-slow-rev" style={{ transformOrigin: center }}>
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="url(#ar-ring)"
          strokeWidth="3"
          strokeDasharray="34 16"
          strokeLinecap="round"
        />
      </g>

      {/* coil spokes — slow spin */}
      <g className="animate-spin-slow" style={{ transformOrigin: center }}>
        {spokes.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2"
          />
        ))}
        {/* iconic triangle coil */}
        <polygon
          points={tri}
          fill="none"
          stroke={accentBright}
          strokeOpacity="0.7"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      {/* inner ring */}
      <circle cx="100" cy="100" r="30" fill="none" stroke={accentBright} strokeOpacity="0.8" strokeWidth="2" />

      {/* glowing core — pulse */}
      <g className="animate-reactor-pulse" style={{ transformOrigin: center }}>
        <circle cx="100" cy="100" r="26" fill="url(#ar-core)" />
        <circle cx="100" cy="100" r="9" fill="#eafcff" opacity="0.95" />
      </g>
    </svg>
  );
}
