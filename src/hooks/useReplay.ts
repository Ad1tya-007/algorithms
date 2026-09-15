"use client";

import { useMemo, type DependencyList } from "react";
import type { Replayer } from "@/lib/algorithms/core/replay";
import type { AlgorithmStep, AnyStep } from "@/lib/algorithms/core/types";

/**
 * Folds a step trace into the view for the current position.
 *
 * `deps` should contain whatever the initial view is built from (the array, the
 * grid dimensions…) so the replayer and its cache are rebuilt when the dataset
 * underneath changes.
 */
export function useReplay<View, Op>(
  steps: readonly AnyStep[],
  index: number,
  makeReplayer: () => Replayer<View, Op>,
  deps: DependencyList,
): View {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const replayer = useMemo(makeReplayer, deps);
  return replayer.view(steps as readonly AlgorithmStep<Op, unknown>[], index);
}
