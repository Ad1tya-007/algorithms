import { TERRAIN_COSTS, type GridData } from "@/lib/algorithms/pathfinding/model";
import { Rng } from "@/lib/utils/random";

export type GridPreset = "open" | "maze" | "spiral" | "rooms" | "random";

export const GRID_PRESETS: { id: GridPreset; label: string; hint: string }[] = [
  { id: "open", label: "Open", hint: "No obstacles — pure heuristic behaviour" },
  { id: "maze", label: "Maze", hint: "Perfect maze: exactly one route" },
  { id: "spiral", label: "Spiral", hint: "Forces a long detour" },
  { id: "rooms", label: "Rooms", hint: "Chambers joined by doorways" },
  { id: "random", label: "Random", hint: "Scattered walls at the chosen density" },
];

export interface GridConfig {
  preset: GridPreset;
  cols: number;
  rows: number;
  /** 0…1, used by the random preset. */
  wallDensity: number;
  diagonal: boolean;
  /** Whether to paint variable-cost terrain. */
  terrain: boolean;
}

export const GRID_LIMITS = {
  cols: { min: 10, max: 60 },
  rows: { min: 8, max: 34 },
} as const;

function blank(cols: number, rows: number): GridData {
  const cells = cols * rows;
  return {
    cols,
    rows,
    walls: new Uint8Array(cells),
    costs: new Uint8Array(cells).fill(1),
    start: Math.floor(rows / 2) * cols + 1,
    goal: Math.floor(rows / 2) * cols + (cols - 2),
    diagonal: false,
  };
}

function carveMaze(grid: GridData, rng: Rng): void {
  grid.walls.fill(1);
  const { cols, rows } = grid;
  const at = (x: number, y: number) => y * cols + x;

  const startX = 1;
  const startY = 1;
  grid.walls[at(startX, startY)] = 0;

  const stack: [number, number][] = [[startX, startY]];
  const directions = [
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
  ];

  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1];
    const options = rng.shuffle([...directions]).filter(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && grid.walls[at(nx, ny)] === 1;
    });

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const [dx, dy] = options[0];
    grid.walls[at(x + dx / 2, y + dy / 2)] = 0;
    grid.walls[at(x + dx, y + dy)] = 0;
    stack.push([x + dx, y + dy]);
  }

  // The start and goal must sit on carved cells.
  for (const index of [grid.start, grid.goal]) {
    grid.walls[index] = 0;
    const x = index % cols;
    const y = Math.floor(index / cols);
    if (x + 1 < cols) grid.walls[at(x + 1, y)] = 0;
    if (x - 1 >= 0) grid.walls[at(x - 1, y)] = 0;
  }
}

function carveSpiral(grid: GridData): void {
  const { cols, rows } = grid;
  const at = (x: number, y: number) => y * cols + x;

  let left = 2;
  let right = cols - 3;
  let top = 2;
  let bottom = rows - 3;
  let gapAtTop = true;

  while (right - left > 3 && bottom - top > 3) {
    for (let x = left; x <= right; x++) {
      grid.walls[at(x, top)] = 1;
      grid.walls[at(x, bottom)] = 1;
    }
    for (let y = top; y <= bottom; y++) {
      grid.walls[at(left, y)] = 1;
      grid.walls[at(right, y)] = 1;
    }

    // One doorway per ring, alternating sides, so a single long route exists.
    if (gapAtTop) grid.walls[at(left, top + 1)] = 0;
    else grid.walls[at(right, bottom - 1)] = 0;
    gapAtTop = !gapAtTop;

    left += 3;
    right -= 3;
    top += 3;
    bottom -= 3;
  }

  grid.walls[grid.start] = 0;
  grid.walls[grid.goal] = 0;
}

function carveRooms(grid: GridData, rng: Rng): void {
  const { cols, rows } = grid;
  const at = (x: number, y: number) => y * cols + x;

  const divide = (x0: number, y0: number, x1: number, y1: number, depth: number) => {
    const width = x1 - x0;
    const height = y1 - y0;
    if (depth > 4 || (width < 7 && height < 7)) return;

    const vertical = width > height;
    if (vertical) {
      if (width < 7) return;
      const wall = x0 + 3 + rng.int(0, Math.max(0, width - 6));
      for (let y = y0; y <= y1; y++) grid.walls[at(wall, y)] = 1;
      const door = y0 + rng.int(0, Math.max(0, height));
      grid.walls[at(wall, door)] = 0;
      if (door + 1 <= y1) grid.walls[at(wall, door + 1)] = 0;
      divide(x0, y0, wall - 1, y1, depth + 1);
      divide(wall + 1, y0, x1, y1, depth + 1);
    } else {
      if (height < 7) return;
      const wall = y0 + 3 + rng.int(0, Math.max(0, height - 6));
      for (let x = x0; x <= x1; x++) grid.walls[at(x, wall)] = 1;
      const door = x0 + rng.int(0, Math.max(0, width));
      grid.walls[at(door, wall)] = 0;
      if (door + 1 <= x1) grid.walls[at(door + 1, wall)] = 0;
      divide(x0, y0, x1, wall - 1, depth + 1);
      divide(x0, wall + 1, x1, y1, depth + 1);
    }
  };

  divide(1, 1, cols - 2, rows - 2, 0);
  grid.walls[grid.start] = 0;
  grid.walls[grid.goal] = 0;
}

function paintTerrain(grid: GridData, rng: Rng): void {
  const { cols, rows } = grid;
  const blobs = Math.max(3, Math.round((cols * rows) / 220));

  for (let i = 0; i < blobs; i++) {
    const cost = rng.pick(TERRAIN_COSTS.slice(1));
    const cx = rng.int(2, cols - 3);
    const cy = rng.int(1, rows - 2);
    const radius = rng.int(2, 5);

    for (let y = Math.max(0, cy - radius); y <= Math.min(rows - 1, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(cols - 1, cx + radius); x++) {
        const distance = Math.hypot(x - cx, y - cy);
        if (distance > radius) continue;
        const index = y * cols + x;
        if (grid.walls[index] === 1) continue;
        grid.costs[index] = cost;
      }
    }
  }

  grid.costs[grid.start] = 1;
  grid.costs[grid.goal] = 1;
}

export function generateGrid(config: GridConfig, seed: number): GridData {
  const rng = new Rng(seed);
  const cols = Math.max(GRID_LIMITS.cols.min, Math.min(GRID_LIMITS.cols.max, config.cols));
  const rows = Math.max(GRID_LIMITS.rows.min, Math.min(GRID_LIMITS.rows.max, config.rows));
  const grid = blank(cols, rows);
  grid.diagonal = config.diagonal;

  switch (config.preset) {
    case "open":
      break;
    case "maze":
      carveMaze(grid, rng);
      break;
    case "spiral":
      carveSpiral(grid);
      break;
    case "rooms":
      carveRooms(grid, rng);
      break;
    case "random": {
      const density = Math.max(0, Math.min(0.45, config.wallDensity));
      for (let i = 0; i < grid.walls.length; i++) {
        if (i === grid.start || i === grid.goal) continue;
        grid.walls[i] = rng.next() < density ? 1 : 0;
      }
      break;
    }
  }

  if (config.terrain) paintTerrain(grid, rng);

  grid.walls[grid.start] = 0;
  grid.walls[grid.goal] = 0;
  return grid;
}

export function cloneGrid(grid: GridData): GridData {
  return {
    ...grid,
    walls: new Uint8Array(grid.walls),
    costs: new Uint8Array(grid.costs),
  };
}

/** Resizes while preserving the parts of the drawing that still fit. */
export function resizeGrid(grid: GridData, cols: number, rows: number): GridData {
  const next = blank(cols, rows);
  next.diagonal = grid.diagonal;

  for (let y = 0; y < Math.min(rows, grid.rows); y++) {
    for (let x = 0; x < Math.min(cols, grid.cols); x++) {
      next.walls[y * cols + x] = grid.walls[y * grid.cols + x];
      next.costs[y * cols + x] = grid.costs[y * grid.cols + x];
    }
  }

  next.walls[next.start] = 0;
  next.walls[next.goal] = 0;
  next.costs[next.start] = 1;
  next.costs[next.goal] = 1;
  return next;
}
