/**
 * Full-screen HUD chrome layered behind the dashboard content:
 * blueprint grid, scanlines, vignette and a soft radial glow.
 * Purely decorative + non-interactive.
 */
export function HudFrame() {
  return (
    <>
      {/* radial glow + base colour */}
      <div className="hud-backdrop pointer-events-none fixed inset-0 -z-30" aria-hidden />
      {/* blueprint grid, faded at edges */}
      <div className="hud-grid pointer-events-none fixed inset-0 -z-20" aria-hidden />
      {/* vignette */}
      <div className="vignette pointer-events-none fixed inset-0 -z-10" aria-hidden />
    </>
  );
}
