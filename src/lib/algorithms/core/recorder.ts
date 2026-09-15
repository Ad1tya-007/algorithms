import {
  emptyMetrics,
  type AlgorithmStep,
  type MetricKey,
  type Metrics,
  type Phase,
  type StateField,
} from "./types";

interface RecordInput<Op, Extra> {
  op: Op;
  phase: Phase;
  explanation: string;
  fields?: StateField[];
  extra: Extra;
  codeLine?: number | null;
  /** Counters to increment *before* the snapshot is taken. */
  count?: MetricKey | MetricKey[];
}

/**
 * Collects the step trace for one algorithm run.
 *
 * Algorithms call `record` at every point a human would want to pause and look.
 * Metrics accumulate across the run and each step keeps its own snapshot, so
 * stepping backwards restores the counters exactly.
 */
export class StepRecorder<Op, Extra> {
  private steps: AlgorithmStep<Op, Extra>[] = [];
  private metrics: Metrics = emptyMetrics();

  bump(key: MetricKey, amount = 1): void {
    this.metrics[key] += amount;
  }

  record(input: RecordInput<Op, Extra>): void {
    if (input.count) {
      const keys = Array.isArray(input.count) ? input.count : [input.count];
      for (const key of keys) this.metrics[key] += 1;
    }

    this.steps.push({
      id: this.steps.length,
      op: input.op,
      phase: input.phase,
      explanation: input.explanation,
      fields: input.fields ?? [],
      extra: input.extra,
      metrics: { ...this.metrics },
      codeLine: input.codeLine ?? null,
    });
  }

  get count(): number {
    return this.steps.length;
  }

  get currentMetrics(): Metrics {
    return { ...this.metrics };
  }

  done(): AlgorithmStep<Op, Extra>[] {
    return this.steps;
  }
}
