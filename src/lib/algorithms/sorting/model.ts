import type { AlgorithmDefinition, AlgorithmStep } from "../core/types";

/**
 * The array operation vocabulary. Sorting and searching both speak it, which is
 * why a single visualizer can render every array algorithm in the library.
 */
export type ArrayOp =
  | { type: "compare"; indices: [number, number] }
  | { type: "swap"; indices: [number, number] }
  | { type: "overwrite"; index: number; value: number }
  | { type: "mark-sorted"; index: number }
  | { type: "pivot"; index: number | null }
  | { type: "range"; start: number; end: number }
  | { type: "pointer"; name: string; index: number | null }
  | { type: "probe"; index: number }
  | { type: "discard"; start: number; end: number }
  | { type: "found"; index: number }
  | { type: "exhausted" }
  | { type: "idle" };

/** A live recursion / partition frame, used to draw recursion boundaries. */
export interface ArrayFrame {
  start: number;
  end: number;
  depth: number;
  label: string;
}

export interface ArrayExtra {
  frames: ArrayFrame[];
  /** Auxiliary buffer contents, for algorithms that merge out of place. */
  aux: { label: string; start: number; values: (number | null)[] } | null;
}

export interface ArrayInput {
  values: number[];
  /** Only meaningful for searching algorithms. */
  target: number;
}

export type ArrayStep = AlgorithmStep<ArrayOp, ArrayExtra>;
export type ArrayAlgorithm = AlgorithmDefinition<ArrayInput, ArrayOp, ArrayExtra>;

export interface ArrayPointer {
  name: string;
  index: number;
}

export interface ArrayView {
  values: number[];
  /**
   * Stable identity per slot. A swap exchanges ids along with values, so the
   * renderer can animate an element *travelling* to its new slot instead of
   * teleporting.
   */
  ids: number[];
  sorted: boolean[];
  discarded: boolean[];
  comparing: number[];
  swapping: number[];
  writing: number[];
  probing: number | null;
  pivot: number | null;
  range: [number, number] | null;
  pointers: ArrayPointer[];
  found: number | null;
  exhausted: boolean;
  frames: ArrayFrame[];
}

const NO_INDICES: number[] = [];

export function createArrayView(values: readonly number[]): ArrayView {
  return {
    values: [...values],
    ids: values.map((_, i) => i),
    sorted: values.map(() => false),
    discarded: values.map(() => false),
    comparing: NO_INDICES,
    swapping: NO_INDICES,
    writing: NO_INDICES,
    probing: null,
    pivot: null,
    range: null,
    pointers: [],
    found: null,
    exhausted: false,
    frames: [],
  };
}

/**
 * Folds one operation into the view. Transient highlights (comparing, swapping,
 * writing, probing) last exactly one step; structural facts (values, sorted,
 * discarded, pointers) persist until changed.
 */
export function reduceArrayView(view: ArrayView, op: ArrayOp): ArrayView {
  const next: ArrayView = {
    ...view,
    comparing: NO_INDICES,
    swapping: NO_INDICES,
    writing: NO_INDICES,
    probing: null,
  };

  switch (op.type) {
    case "compare":
      next.comparing = op.indices;
      return next;

    case "swap": {
      const [i, j] = op.indices;
      next.values = [...view.values];
      next.ids = [...view.ids];
      [next.values[i], next.values[j]] = [next.values[j], next.values[i]];
      [next.ids[i], next.ids[j]] = [next.ids[j], next.ids[i]];
      next.swapping = op.indices;
      return next;
    }

    case "overwrite":
      next.values = [...view.values];
      next.values[op.index] = op.value;
      next.writing = [op.index];
      return next;

    case "mark-sorted":
      next.sorted = [...view.sorted];
      next.sorted[op.index] = true;
      return next;

    case "pivot":
      next.pivot = op.index;
      return next;

    case "range":
      next.range = [op.start, op.end];
      return next;

    case "pointer": {
      const rest = view.pointers.filter((p) => p.name !== op.name);
      next.pointers =
        op.index === null ? rest : [...rest, { name: op.name, index: op.index }];
      return next;
    }

    case "probe":
      next.probing = op.index;
      return next;

    case "discard":
      next.discarded = [...view.discarded];
      for (let i = op.start; i <= op.end; i++) {
        if (i >= 0 && i < next.discarded.length) next.discarded[i] = true;
      }
      return next;

    case "found":
      next.found = op.index;
      return next;

    case "exhausted":
      next.exhausted = true;
      return next;

    case "idle":
      return next;
  }
}

/**
 * Frames live in `extra` rather than in the operation stream, so the reducer
 * copies them across from the step being displayed.
 */
export function withFrames(view: ArrayView, extra: ArrayExtra): ArrayView {
  return view.frames === extra.frames ? view : { ...view, frames: extra.frames };
}

export const NO_EXTRA: ArrayExtra = { frames: [], aux: null };
