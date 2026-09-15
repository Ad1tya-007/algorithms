/**
 * Core execution model.
 *
 *   DATA → ALGORITHM → STEPS → PLAYBACK → VISUALIZATION → INSPECTOR
 *
 * Algorithms are pure step generators. They never touch React, never render,
 * and never know how they will be drawn. Every lab reuses this same pipeline;
 * only the operation union and the renderer differ.
 */

export type LabId = "sorting" | "graph" | "pathfinding" | "trees";

export type AlgorithmCategory =
  | "sorting"
  | "searching"
  | "graph"
  | "pathfinding"
  | "trees";

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

/** Growth class used to highlight the algorithm on the complexity chart. */
export type GrowthClass = "1" | "log n" | "n" | "n log n" | "n^2";

export interface Metrics {
  comparisons: number;
  swaps: number;
  writes: number;
  visits: number;
  relaxations: number;
}

export function emptyMetrics(): Metrics {
  return {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    visits: 0,
    relaxations: 0,
  };
}

export function totalOperations(metrics: Metrics): number {
  return (
    metrics.comparisons +
    metrics.swaps +
    metrics.writes +
    metrics.visits +
    metrics.relaxations
  );
}

export type MetricKey = keyof Metrics;

export type FieldTone = "default" | "active" | "good" | "warn" | "accent" | "muted";

/**
 * A single line of algorithm state for the inspector. Deliberately generic:
 * the inspector renders whatever the algorithm chooses to expose about itself.
 */
export interface StateField {
  label: string;
  value: string;
  tone?: FieldTone;
}

/**
 * Canonical vocabulary for what the algorithm is doing right now. Shared across
 * labs so the UI can label every state with words, not only colour.
 */
export type Phase =
  | "IDLE"
  | "SCANNING"
  | "COMPARING"
  | "SWAPPING"
  | "WRITING"
  | "SORTED"
  | "PIVOT"
  | "PARTITION"
  | "MERGING"
  | "HEAPIFY"
  | "PROBING"
  | "DISCARDING"
  | "FOUND"
  | "NOT FOUND"
  | "DISCOVERED"
  | "EXPANDING"
  | "VISITED"
  | "RELAXING"
  | "OPEN"
  | "CLOSED"
  | "CURRENT"
  | "PATH"
  | "INSERTED"
  | "DELETED"
  | "TRAVERSING"
  | "UNREACHABLE"
  | "COMPLETE";

export interface AlgorithmStep<Op, Extra> {
  id: number;
  /** What changed in the data during this step. */
  op: Op;
  /** Which state of the algorithm this step represents. */
  phase: Phase;
  /** One short sentence: what is happening and why. */
  explanation: string;
  /** Algorithm-specific state, rendered by the inspector. */
  fields: StateField[];
  /** Structured payload for rich inspector widgets (queues, distance tables…). */
  extra: Extra;
  /** Cumulative counters at this point in execution. */
  metrics: Metrics;
  /** Index into the algorithm's pseudocode, for the code panel highlight. */
  codeLine: number | null;
}

export type AnyStep = AlgorithmStep<unknown, unknown>;

export interface AlgorithmDefinition<Input, Op, Extra> {
  id: string;
  name: string;
  category: AlgorithmCategory;
  lab: LabId;
  complexity: Complexity;
  growth: GrowthClass;
  /** One or two sentences. This is a visualization tool, not a textbook. */
  description: string;
  /** A slightly longer "how it works" note for the explanation panel. */
  howItWorks: string;
  pseudocode: string[];
  /**
   * Returns a human-readable requirement when the current dataset cannot be
   * executed (e.g. Dijkstra on an unweighted graph), otherwise null.
   */
  validate?: (input: Input) => string | null;
  generate: (input: Input) => AlgorithmStep<Op, Extra>[];
}
