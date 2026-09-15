import { emptyTree, insertValue, type TreeData } from "@/lib/algorithms/trees/model";
import { Rng } from "@/lib/utils/random";

export type TreePreset = "balanced" | "left-heavy" | "right-heavy" | "random";

export const TREE_PRESETS: { id: TreePreset; label: string; hint: string }[] = [
  { id: "balanced", label: "Balanced", hint: "Height ≈ log n — searches cost log n" },
  { id: "left-heavy", label: "Left Heavy", hint: "Descending inserts degrade to a list" },
  { id: "right-heavy", label: "Right Heavy", hint: "Ascending inserts degrade to a list" },
  { id: "random", label: "Random", hint: "Typical shape from random insertion order" },
];

export interface TreeConfig {
  preset: TreePreset;
  nodeCount: number;
}

export const TREE_LIMITS = { nodeCount: { min: 1, max: 31 } } as const;

export function generateTree(config: TreeConfig, seed: number): TreeData {
  const rng = new Rng(seed);
  const count = Math.max(
    TREE_LIMITS.nodeCount.min,
    Math.min(TREE_LIMITS.nodeCount.max, config.nodeCount),
  );

  // Distinct values spread over a readable two-digit range.
  const pool = Array.from({ length: count }, (_, i) =>
    Math.round(5 + ((95 - 5) * i) / Math.max(1, count - 1)),
  );

  let order: number[];
  switch (config.preset) {
    case "balanced": {
      // Inserting the median of each sub-range first yields a perfectly balanced tree.
      order = [];
      const emit = (lo: number, hi: number) => {
        if (lo > hi) return;
        const mid = (lo + hi) >> 1;
        order.push(pool[mid]);
        emit(lo, mid - 1);
        emit(mid + 1, hi);
      };
      emit(0, pool.length - 1);
      break;
    }
    case "left-heavy":
      order = [...pool].reverse();
      break;
    case "right-heavy":
      order = [...pool];
      break;
    case "random":
      order = rng.shuffle([...pool]);
      break;
  }

  let tree = emptyTree();
  for (const value of order) tree = insertValue(tree, value);
  return tree;
}
