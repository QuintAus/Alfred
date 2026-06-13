"use client";

import { AnimatePresence } from "motion/react";
import { useJarvis } from "@/lib/store";
import { HudFrame } from "./HudFrame";
import { ParticleField } from "./ParticleField";
import { StatusBar } from "./StatusBar";
import { CentralCore } from "./CentralCore";
import { CommandBar } from "./CommandBar";
import { BootSequence } from "./BootSequence";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { TasksWidget } from "@/components/widgets/TasksWidget";
import { InboxWidget } from "@/components/widgets/InboxWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { NowPlayingWidget } from "@/components/widgets/NowPlayingWidget";
import { StatsWidget } from "@/components/widgets/StatsWidget";

/**
 * Top-level HUD composition: backgrounds, status bar, the three-column widget
 * grid around the central core, and a bottom strip. Plays the boot sequence
 * first, then reveals the live dashboard.
 */
export function Dashboard() {
  const booted = useJarvis((s) => s.booted);
  const setBooted = useJarvis((s) => s.setBooted);

  return (
    <>
      <ParticleField />
      <HudFrame />

      <main className="scanlines relative z-0 flex min-h-screen flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <StatusBar />

        {/* main three-column area */}
        <div className="grid flex-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* left column */}
          <div className="order-2 flex flex-col gap-3 sm:gap-4 lg:order-1">
            <CalendarWidget delay={0.05} />
            <TasksWidget delay={0.1} />
          </div>

          {/* centre core */}
          <div className="order-1 flex flex-col gap-3 sm:gap-4 lg:order-2">
            <div className="flex flex-1 items-center justify-center py-2">
              <CentralCore />
            </div>
            <CommandBar />
          </div>

          {/* right column */}
          <div className="order-3 flex flex-col gap-3 sm:gap-4">
            <InboxWidget delay={0.15} />
            <WeatherWidget delay={0.2} />
          </div>
        </div>

        {/* bottom strip */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <NowPlayingWidget delay={0.25} />
          </div>
          <StatsWidget delay={0.3} />
        </div>
      </main>

      <AnimatePresence>
        {!booted && <BootSequence key="boot" onComplete={() => setBooted(true)} />}
      </AnimatePresence>
    </>
  );
}
