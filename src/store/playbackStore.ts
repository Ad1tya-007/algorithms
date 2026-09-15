"use client";

import { create } from "zustand";
import { emptyMetrics, type AnyStep, type Metrics } from "@/lib/algorithms/core/types";

export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export type Speed = (typeof SPEEDS)[number];

/** Steps advanced per second at 1×. */
export const BASE_STEPS_PER_SECOND = 11;

export type EngineStatus = "empty" | "ready" | "running" | "paused" | "complete" | "blocked";

export interface RunPayload {
  steps: AnyStep[];
  requirement: string | null;
  failure: string | null;
  generationMs: number;
}

interface PlaybackState {
  steps: AnyStep[];
  /** Index of the last applied step; -1 means nothing has executed yet. */
  index: number;
  playing: boolean;
  speed: Speed;
  /** A dataset requirement the selected algorithm does not accept. */
  requirement: string | null;
  /** An unexpected failure while generating the trace. */
  failure: string | null;
  /** How long the trace took to generate, shown in the metrics panel. */
  generationMs: number;

  load: (payload: RunPayload) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepForward: () => void;
  stepBack: () => void;
  seek: (index: number) => void;
  reset: () => void;
  finish: () => void;
  setSpeed: (speed: Speed) => void;
  cycleSpeed: (direction: 1 | -1) => void;
}

/**
 * The playback engine. It owns a step trace and a position inside it, and
 * nothing else — every visualizer simply renders the step at `index`, which is
 * what lets the four laboratories share one set of controls.
 */
export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  steps: [],
  index: -1,
  playing: false,
  speed: 1,
  requirement: null,
  failure: null,
  generationMs: 0,

  load: ({ steps, requirement, failure, generationMs }) =>
    set({ steps, requirement, failure, generationMs, index: -1, playing: false }),

  play: () => {
    const { steps, index } = get();
    if (steps.length === 0) return;
    // Pressing play at the end restarts rather than sitting still.
    set({ playing: true, index: index >= steps.length - 1 ? -1 : index });
  },

  pause: () => set({ playing: false }),

  toggle: () => (get().playing ? get().pause() : get().play()),

  stepForward: () =>
    set((state) => ({
      index: Math.min(state.steps.length - 1, state.index + 1),
      playing: false,
    })),

  stepBack: () => set((state) => ({ index: Math.max(-1, state.index - 1), playing: false })),

  seek: (index) =>
    set((state) => ({ index: Math.max(-1, Math.min(state.steps.length - 1, index)) })),

  reset: () => set({ index: -1, playing: false }),

  finish: () => set((state) => ({ index: state.steps.length - 1, playing: false })),

  setSpeed: (speed) => set({ speed }),

  cycleSpeed: (direction) =>
    set((state) => {
      const at = SPEEDS.indexOf(state.speed);
      const next = Math.max(0, Math.min(SPEEDS.length - 1, at + direction));
      return { speed: SPEEDS[next] };
    }),
}));

export function currentStep(state: { steps: AnyStep[]; index: number }): AnyStep | null {
  return state.index >= 0 ? (state.steps[state.index] ?? null) : null;
}

export function metricsAt(state: { steps: AnyStep[]; index: number }): Metrics {
  return currentStep(state)?.metrics ?? emptyMetrics();
}

export function statusOf(state: {
  steps: AnyStep[];
  index: number;
  playing: boolean;
  requirement: string | null;
  failure: string | null;
}): EngineStatus {
  if (state.requirement || state.failure) return "blocked";
  if (state.steps.length === 0) return "empty";
  if (state.playing) return "running";
  if (state.index >= state.steps.length - 1) return "complete";
  if (state.index < 0) return "ready";
  return "paused";
}

/**
 * Duration budget for one visual transition. Derived from playback speed so
 * animations always finish before the next step lands.
 */
export function transitionMs(speed: number): number {
  return Math.max(28, Math.min(420, (1000 / (BASE_STEPS_PER_SECOND * speed)) * 0.75));
}
