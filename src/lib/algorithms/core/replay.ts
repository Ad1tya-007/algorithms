import type { AlgorithmStep } from "./types";

/**
 * Rebuilds the visual state at any point in a step trace.
 *
 * Steps describe *operations*, not full snapshots, which keeps traces small.
 * The replayer folds those operations into a view, caching the latest result so
 * ordinary playback costs one reduction per frame, and keeping periodic
 * checkpoints so scrubbing backwards stays cheap on long traces.
 *
 * `reduce` must return a new view rather than mutating, since checkpoints
 * retain references to earlier views.
 */
export class Replayer<View, Op> {
  private checkpoints = new Map<number, View>();
  private trace: readonly AlgorithmStep<Op, unknown>[] | null = null;
  private lastIndex = -1;
  private lastView: View;

  constructor(
    private readonly initial: () => View,
    private readonly reduce: (view: View, op: Op) => View,
    private readonly checkpointEvery = 400,
  ) {
    this.lastView = initial();
  }

  /** `index` is the index of the last applied step; -1 means "nothing ran yet". */
  view(steps: readonly AlgorithmStep<Op, unknown>[], index: number): View {
    if (steps !== this.trace) {
      this.trace = steps;
      this.checkpoints.clear();
      this.lastIndex = -1;
      this.lastView = this.initial();
    }

    const target = Math.min(index, steps.length - 1);
    if (target === this.lastIndex) return this.lastView;

    let from = this.lastIndex;
    let view = this.lastView;

    if (target < from) {
      let nearest = -1;
      for (const key of this.checkpoints.keys()) {
        if (key <= target && key > nearest) nearest = key;
      }
      if (nearest >= 0) {
        from = nearest;
        view = this.checkpoints.get(nearest)!;
      } else {
        from = -1;
        view = this.initial();
      }
    }

    for (let i = from + 1; i <= target; i++) {
      view = this.reduce(view, steps[i].op);
      if (i % this.checkpointEvery === 0) this.checkpoints.set(i, view);
    }

    this.lastIndex = target;
    this.lastView = view;
    return view;
  }
}
