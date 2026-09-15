"use client";

import { useEffect, useMemo } from "react";
import { usePlaybackStore } from "@/store/playbackStore";

/**
 * Steps advanced per second at 1× speed.
 *
 * Traces vary enormously in length — a binary search emits a few dozen steps
 * while a bubble sort over 100 elements emits tens of thousands — so a fixed
 * rate would be either unwatchably slow or a blur. The rate is chosen so a full
 * run at 1× lands around twenty seconds, bounded to stay readable at one end and
 * finite at the other.
 */
export function stepRateFor(total: number): number {
  return Math.min(400, Math.max(6, total / 20));
}

export function usePlaybackTiming() {
  const total = usePlaybackStore((s) => s.steps.length);
  const speed = usePlaybackStore((s) => s.speed);

  return useMemo(() => {
    const rate = stepRateFor(total) * speed;
    return {
      rate,
      /** Animation budget for one step — always a little under the step interval. */
      durationMs: Math.max(40, Math.min(240, 820 / rate)),
    };
  }, [total, speed]);
}

/** Drives the trace forward while playing. One requestAnimationFrame loop, no timers. */
export function usePlaybackLoop() {
  const playing = usePlaybackStore((s) => s.playing);
  const speed = usePlaybackStore((s) => s.speed);
  const total = usePlaybackStore((s) => s.steps.length);

  useEffect(() => {
    if (!playing || total === 0) return;

    const rate = stepRateFor(total) * speed;
    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const tick = (now: number) => {
      const elapsed = Math.min(250, now - last);
      last = now;
      carry += (elapsed / 1000) * rate;

      if (carry >= 1) {
        const advance = Math.floor(carry);
        carry -= advance;
        const store = usePlaybackStore.getState();
        const next = store.index + advance;

        if (next >= store.steps.length - 1) {
          store.seek(store.steps.length - 1);
          store.pause();
          return;
        }
        store.seek(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, total]);
}
