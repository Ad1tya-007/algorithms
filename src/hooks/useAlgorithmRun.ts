"use client";

import { useEffect, useMemo } from "react";

import type { AnyStep } from "@/lib/algorithms/core/types";
import { getEntry, runAlgorithm, type RegistryEntry } from "@/lib/algorithms/registry";
import { useAlgorithmStore } from "@/store/algorithmStore";
import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";

export interface AlgorithmRun {
  entry: RegistryEntry | undefined;
  steps: AnyStep[];
  /** The current step, or null before execution starts. */
  step: AnyStep | null;
  index: number;
  requirement: string | null;
  failure: string | null;
  generationMs: number;
}

/**
 * The pipeline in one hook:
 *
 *   dataset + algorithm → generate steps → hand the length to the playback engine
 *
 * Generation is memoised on the inputs, so it re-runs when the data or the
 * selected algorithm changes and at no other time.
 */
export function useAlgorithmRun(): AlgorithmRun {
  const lab = useUiStore((s) => s.lab);
  const algorithmId = useAlgorithmStore((s) => s.byLab[lab]);

  const array = useDatasetStore((s) => s.array);
  const target = useDatasetStore((s) => s.arrayConfig.target);
  const graph = useDatasetStore((s) => s.graph);
  const graphStart = useDatasetStore((s) => s.graphStart);
  const graphGoal = useDatasetStore((s) => s.graphGoal);
  const grid = useDatasetStore((s) => s.grid);
  const tree = useDatasetStore((s) => s.tree);
  const treeValue = useDatasetStore((s) => s.treeConfig.value);

  const index = usePlaybackStore((s) => s.index);
  const load = usePlaybackStore((s) => s.load);

  const result = useMemo(() => {
    const startedAt = performance.now();
    const run = runAlgorithm(algorithmId, {
      array: { values: array, target },
      graph: { graph, start: graphStart, goal: graphGoal },
      grid: { grid },
      tree: { tree, value: treeValue },
    });
    return { ...run, generationMs: performance.now() - startedAt };
  }, [algorithmId, array, target, graph, graphStart, graphGoal, grid, tree, treeValue]);

  useEffect(() => {
    load({
      steps: result.steps,
      requirement: result.requirement,
      failure: result.failure,
      generationMs: result.generationMs,
    });
  }, [result.steps, result.requirement, result.failure, result.generationMs, load]);

  const clamped = Math.min(index, result.steps.length - 1);

  return {
    entry: getEntry(algorithmId),
    steps: result.steps,
    step: clamped >= 0 ? result.steps[clamped] ?? null : null,
    index: clamped,
    requirement: result.requirement,
    failure: result.failure,
    generationMs: result.generationMs,
  };
}
