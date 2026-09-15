import type { AlgorithmCategory, AnyStep, LabId } from "./core/types";

import { bubbleSort } from "./sorting/bubbleSort";
import { selectionSort } from "./sorting/selectionSort";
import { insertionSort } from "./sorting/insertionSort";
import { mergeSort } from "./sorting/mergeSort";
import { quickSort } from "./sorting/quickSort";
import { heapSort } from "./sorting/heapSort";
import { linearSearch } from "./searching/linearSearch";
import { binarySearch } from "./searching/binarySearch";
import { bfs } from "./graph/bfs";
import { dfs } from "./graph/dfs";
import { dijkstra } from "./graph/dijkstra";
import { graphAstar } from "./graph/astar";
import { gridAstar, gridBfs, gridDijkstra } from "./pathfinding/algorithms";
import { bstDelete, bstInsert, bstSearch } from "./trees/bst";
import {
  inOrderTraversal,
  levelOrderTraversal,
  postOrderTraversal,
  preOrderTraversal,
} from "./trees/traversals";

import type { ArrayAlgorithm, ArrayInput } from "./sorting/model";
import type { GraphAlgorithm, GraphInput } from "./graph/model";
import type { GridAlgorithm, GridInput } from "./pathfinding/model";
import type { TreeAlgorithm, TreeInput } from "./trees/model";

/**
 * Registry entries are tagged by the kind of data they consume, which is what
 * lets one call site execute any algorithm in the library without knowing what
 * it does.
 */
export type RegistryEntry =
  | { kind: "array"; definition: ArrayAlgorithm }
  | { kind: "graph"; definition: GraphAlgorithm }
  | { kind: "grid"; definition: GridAlgorithm }
  | { kind: "tree"; definition: TreeAlgorithm };

const entries: RegistryEntry[] = [
  { kind: "array", definition: bubbleSort },
  { kind: "array", definition: selectionSort },
  { kind: "array", definition: insertionSort },
  { kind: "array", definition: mergeSort },
  { kind: "array", definition: quickSort },
  { kind: "array", definition: heapSort },
  { kind: "array", definition: linearSearch },
  { kind: "array", definition: binarySearch },
  { kind: "graph", definition: bfs },
  { kind: "graph", definition: dfs },
  { kind: "graph", definition: dijkstra },
  { kind: "graph", definition: graphAstar },
  { kind: "grid", definition: gridAstar },
  { kind: "grid", definition: gridDijkstra },
  { kind: "grid", definition: gridBfs },
  { kind: "tree", definition: bstInsert },
  { kind: "tree", definition: bstSearch },
  { kind: "tree", definition: bstDelete },
  { kind: "tree", definition: inOrderTraversal },
  { kind: "tree", definition: preOrderTraversal },
  { kind: "tree", definition: postOrderTraversal },
  { kind: "tree", definition: levelOrderTraversal },
];

export const registry = new Map<string, RegistryEntry>(
  entries.map((entry) => [entry.definition.id, entry]),
);

export function getEntry(id: string): RegistryEntry | undefined {
  return registry.get(id);
}

export function getDefinition(id: string) {
  return registry.get(id)?.definition;
}

export const CATEGORY_ORDER: AlgorithmCategory[] = [
  "sorting",
  "searching",
  "graph",
  "pathfinding",
  "trees",
];

export const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
  sorting: "Sorting",
  searching: "Search",
  graph: "Graph",
  pathfinding: "Pathfinding",
  trees: "Trees",
};

export const LAB_LABELS: Record<LabId, string> = {
  sorting: "Sorting",
  graph: "Graph",
  pathfinding: "Pathfinding",
  trees: "Trees",
};

export const LAB_ORDER: LabId[] = ["sorting", "graph", "pathfinding", "trees"];

export const DEFAULT_ALGORITHM: Record<LabId, string> = {
  sorting: "quick-sort",
  graph: "dijkstra",
  pathfinding: "grid-astar",
  trees: "bst-insert",
};

export function algorithmsByCategory(): { category: AlgorithmCategory; items: RegistryEntry[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: entries.filter((entry) => entry.definition.category === category),
  })).filter((group) => group.items.length > 0);
}

export interface LabInputs {
  array: ArrayInput;
  graph: GraphInput;
  grid: GridInput;
  tree: TreeInput;
}

export interface RunResult {
  steps: AnyStep[];
  /** A requirement the dataset does not satisfy, explained for the user. */
  requirement: string | null;
  /** An unexpected failure inside the generator. */
  failure: string | null;
}

const EMPTY_RESULT: RunResult = { steps: [], requirement: null, failure: null };

/**
 * Executes one algorithm against the current datasets.
 *
 * Generation is fully synchronous and deterministic; a thrown error is contained
 * here and surfaced as a message rather than taking down the interface.
 */
export function runAlgorithm(id: string, inputs: LabInputs): RunResult {
  const entry = registry.get(id);
  if (!entry) return EMPTY_RESULT;

  try {
    switch (entry.kind) {
      case "array": {
        const requirement = entry.definition.validate?.(inputs.array) ?? null;
        if (requirement) return { steps: [], requirement, failure: null };
        return {
          steps: entry.definition.generate(inputs.array) as AnyStep[],
          requirement: null,
          failure: null,
        };
      }
      case "graph": {
        const requirement = entry.definition.validate?.(inputs.graph) ?? null;
        if (requirement) return { steps: [], requirement, failure: null };
        return {
          steps: entry.definition.generate(inputs.graph) as AnyStep[],
          requirement: null,
          failure: null,
        };
      }
      case "grid": {
        const requirement = entry.definition.validate?.(inputs.grid) ?? null;
        if (requirement) return { steps: [], requirement, failure: null };
        return {
          steps: entry.definition.generate(inputs.grid) as AnyStep[],
          requirement: null,
          failure: null,
        };
      }
      case "tree": {
        const requirement = entry.definition.validate?.(inputs.tree) ?? null;
        if (requirement) return { steps: [], requirement, failure: null };
        return {
          steps: entry.definition.generate(inputs.tree) as AnyStep[],
          requirement: null,
          failure: null,
        };
      }
    }
  } catch (error) {
    return {
      steps: [],
      requirement: null,
      failure:
        error instanceof Error
          ? `Unable to execute the algorithm: ${error.message}`
          : "Unable to execute the algorithm.",
    };
  }
}
