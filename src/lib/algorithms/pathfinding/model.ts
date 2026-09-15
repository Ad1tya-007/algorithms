import type { AlgorithmDefinition, AlgorithmStep } from "../core/types";

export const TERRAIN_COSTS = [1, 2, 5, 10] as const;
export type TerrainCost = (typeof TERRAIN_COSTS)[number];

export interface GridData {
  cols: number;
  rows: number;
  /** 1 = wall. */
  walls: Uint8Array;
  /** Traversal cost multiplier per cell. */
  costs: Uint8Array;
  start: number;
  goal: number;
  diagonal: boolean;
}

export interface GridInput {
  grid: GridData;
}

export type GridOp =
  | {
      type: "open";
      index: number;
      g: number;
      h: number;
      f: number;
      parent: number;
      /** True when an existing open cell was improved rather than newly found. */
      improved: boolean;
    }
  | { type: "current"; index: number }
  | { type: "close"; index: number }
  | { type: "reject"; index: number }
  | { type: "path"; indices: number[] }
  | { type: "idle" };

export interface GridExtra {
  open: number;
  closed: number;
  current: number | null;
  g: number;
  h: number;
  f: number;
  pathLength: number | null;
  pathCost: number | null;
}

export type GridStep = AlgorithmStep<GridOp, GridExtra>;
export type GridAlgorithm = AlgorithmDefinition<GridInput, GridOp, GridExtra>;

/** Cell render states, in ascending visual priority. */
export const CELL_UNVISITED = 0;
export const CELL_OPEN = 1;
export const CELL_CLOSED = 2;
export const CELL_PATH = 3;

export interface GridView {
  state: Uint8Array;
  g: Float32Array;
  h: Float32Array;
  f: Float32Array;
  parent: Int32Array;
  current: number | null;
  path: number[];
}

export function createGridView(cells: number): GridView {
  const g = new Float32Array(cells).fill(Infinity);
  return {
    state: new Uint8Array(cells),
    g,
    h: new Float32Array(cells).fill(Infinity),
    f: new Float32Array(cells).fill(Infinity),
    parent: new Int32Array(cells).fill(-1),
    current: null,
    path: [],
  };
}

const EMPTY_PATH: number[] = [];

/**
 * Grid traces store deltas rather than snapshots — a 40×60 grid would otherwise
 * copy 2,400 cells per step. Only the arrays an operation actually touches are
 * cloned, which keeps replay cheap while leaving earlier views untouched so the
 * checkpoint cache stays valid.
 */
export function reduceGridView(view: GridView, op: GridOp): GridView {
  switch (op.type) {
    case "open": {
      const state = new Uint8Array(view.state);
      const g = new Float32Array(view.g);
      const h = new Float32Array(view.h);
      const f = new Float32Array(view.f);
      const parent = new Int32Array(view.parent);
      state[op.index] = CELL_OPEN;
      g[op.index] = op.g;
      h[op.index] = op.h;
      f[op.index] = op.f;
      parent[op.index] = op.parent;
      return { ...view, state, g, h, f, parent, path: EMPTY_PATH };
    }

    case "close": {
      const state = new Uint8Array(view.state);
      state[op.index] = CELL_CLOSED;
      return { ...view, state, current: op.index };
    }

    case "current":
      return { ...view, current: op.index };

    case "reject":
      return view;

    case "path": {
      const state = new Uint8Array(view.state);
      for (const index of op.indices) state[index] = CELL_PATH;
      return { ...view, state, path: op.indices, current: null };
    }

    case "idle":
      return view;
  }
}

export function cellCost(grid: GridData, index: number): number {
  return grid.costs[index] || 1;
}

export function toXY(grid: GridData, index: number): { x: number; y: number } {
  return { x: index % grid.cols, y: Math.floor(index / grid.cols) };
}

export function toIndex(grid: GridData, x: number, y: number): number {
  return y * grid.cols + x;
}

export function describeCell(grid: GridData, index: number): string {
  const { x, y } = toXY(grid, index);
  return `(${x}, ${y})`;
}

export interface GridNeighbor {
  index: number;
  /** Geometric step length: 1 orthogonally, √2 diagonally. */
  step: number;
}

export function neighbors(grid: GridData, index: number): GridNeighbor[] {
  const { x, y } = toXY(grid, index);
  const out: GridNeighbor[] = [];

  const orthogonal = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const diagonals = [
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ];

  const passable = (nx: number, ny: number) =>
    nx >= 0 &&
    ny >= 0 &&
    nx < grid.cols &&
    ny < grid.rows &&
    grid.walls[toIndex(grid, nx, ny)] === 0;

  for (const [dx, dy] of orthogonal) {
    if (passable(x + dx, y + dy)) out.push({ index: toIndex(grid, x + dx, y + dy), step: 1 });
  }

  if (grid.diagonal) {
    for (const [dx, dy] of diagonals) {
      if (!passable(x + dx, y + dy)) continue;
      // No squeezing between two walls: both shared orthogonal cells must be open.
      if (!passable(x + dx, y) || !passable(x, y + dy)) continue;
      out.push({ index: toIndex(grid, x + dx, y + dy), step: Math.SQRT2 });
    }
  }

  return out;
}

/**
 * Manhattan distance for 4-way movement, octile for 8-way.
 *
 * Terrain costs are at least 1, so distance in steps never overestimates the
 * true remaining cost — the heuristic stays admissible and A* stays optimal.
 */
export function heuristic(grid: GridData, from: number, to: number): number {
  const a = toXY(grid, from);
  const b = toXY(grid, to);
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (!grid.diagonal) return dx + dy;
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

export function validateGrid({ grid }: GridInput): string | null {
  if (grid.start < 0 || grid.goal < 0) {
    return "Place a start and an end point to begin. Use the Start and End tools, then run the search.";
  }
  if (grid.walls[grid.start] === 1) return "The start cell is inside a wall. Erase it or move the start.";
  if (grid.walls[grid.goal] === 1) return "The end cell is inside a wall. Erase it or move the end.";
  if (grid.start === grid.goal) return "The start and end are the same cell. Move one of them apart.";
  return null;
}
