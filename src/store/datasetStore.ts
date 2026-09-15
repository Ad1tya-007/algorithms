import { create } from "zustand";

import type { GraphData } from "@/lib/algorithms/graph/model";
import type { GridData } from "@/lib/algorithms/pathfinding/model";
import { cloneTree, emptyTree, insertValue, type TreeData } from "@/lib/algorithms/trees/model";
import { generateArray, type ArrayPreset } from "@/lib/datasets/arrays";
import { generateGraph, nextNodeId, type GraphPreset } from "@/lib/datasets/graphs";
import { generateGrid, type GridPreset } from "@/lib/datasets/grids";
import { generateTree, type TreePreset } from "@/lib/datasets/trees";
import { randomSeed, Rng } from "@/lib/utils/random";
import type { GridTool } from "./uiStore";

/**
 * Sub-seeds keep the labs independent: one master seed reproduces every dataset,
 * but the array and the graph are not derived from the same number stream.
 */
const SEED_SALT = {
  array: 0x0000,
  graph: 0x5f1e,
  grid: 0x2c93,
  tree: 0x7a41,
} as const;

export interface ArrayConfig {
  size: number;
  maxValue: number;
  preset: ArrayPreset;
  target: number;
}

export interface GraphConfig {
  nodeCount: number;
  density: number;
  directed: boolean;
  weighted: boolean;
  preset: GraphPreset;
}

export interface GridConfig {
  cols: number;
  rows: number;
  wallDensity: number;
  diagonal: boolean;
  terrain: boolean;
  preset: GridPreset;
}

export interface TreeConfig {
  count: number;
  preset: TreePreset;
  value: number;
}

interface Snapshot {
  array: number[];
  graph: GraphData;
  graphStart: string | null;
  graphGoal: string | null;
  grid: GridData;
  tree: TreeData;
}

interface DatasetState extends Snapshot {
  seed: number;
  arrayConfig: ArrayConfig;
  graphConfig: GraphConfig;
  gridConfig: GridConfig;
  treeConfig: TreeConfig;

  past: Snapshot[];
  future: Snapshot[];

  setSeed: (seed: number) => void;
  randomizeSeed: () => void;

  /** Snapshot the current data before a continuous gesture (drag, paint stroke). */
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  setArrayConfig: (patch: Partial<ArrayConfig>) => void;
  regenerateArray: () => void;
  shuffle: () => void;
  reverse: () => void;
  sortArray: () => void;
  setArrayValue: (index: number, value: number) => void;

  setGraphConfig: (patch: Partial<GraphConfig>) => void;
  regenerateGraph: () => void;
  addNode: (x: number, y: number) => string;
  removeNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  addEdge: (from: string, to: string) => void;
  removeEdge: (id: string) => void;
  setEdgeWeight: (id: string, weight: number) => void;
  setGraphStart: (id: string | null) => void;
  setGraphGoal: (id: string | null) => void;
  clearGraph: () => void;

  setGridConfig: (patch: Partial<GridConfig>) => void;
  regenerateGrid: () => void;
  paintCell: (index: number, tool: GridTool, terrainCost?: number) => void;
  clearWalls: () => void;

  setTreeConfig: (patch: Partial<TreeConfig>) => void;
  regenerateTree: () => void;
  commitTree: (tree: TreeData) => void;
  clearTree: () => void;
  suggestTreeValue: () => void;

  resetLab: (lab: "sorting" | "graph" | "pathfinding" | "trees") => void;
}

const HISTORY_LIMIT = 80;

function cloneGraph(graph: GraphData): GraphData {
  return {
    nodes: graph.nodes.map((node) => ({ ...node })),
    edges: graph.edges.map((edge) => ({ ...edge })),
    directed: graph.directed,
    weighted: graph.weighted,
  };
}

function cloneGrid(grid: GridData): GridData {
  return {
    ...grid,
    walls: new Uint8Array(grid.walls),
    costs: new Uint8Array(grid.costs),
  };
}

function snapshotOf(state: Snapshot): Snapshot {
  return {
    array: [...state.array],
    graph: cloneGraph(state.graph),
    graphStart: state.graphStart,
    graphGoal: state.graphGoal,
    grid: cloneGrid(state.grid),
    tree: cloneTree(state.tree),
  };
}

const DEFAULT_ARRAY_CONFIG: ArrayConfig = {
  size: 44,
  maxValue: 100,
  preset: "random",
  target: 50,
};

const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  nodeCount: 11,
  density: 0.18,
  directed: false,
  weighted: true,
  preset: "random",
};

const DEFAULT_GRID_CONFIG: GridConfig = {
  cols: 45,
  rows: 23,
  wallDensity: 0.28,
  diagonal: false,
  terrain: false,
  preset: "maze",
};

const DEFAULT_TREE_CONFIG: TreeConfig = {
  count: 11,
  preset: "balanced",
  value: 42,
};

const INITIAL_SEED = 849201;

function buildArray(config: ArrayConfig, seed: number): number[] {
  return generateArray(
    { preset: config.preset, size: config.size, min: 1, max: config.maxValue },
    seed ^ SEED_SALT.array,
  );
}

function buildGraph(config: GraphConfig, seed: number): GraphData {
  return generateGraph(
    {
      preset: config.preset,
      nodeCount: config.nodeCount,
      density: config.density,
      directed: config.directed,
      weighted: config.weighted,
      allowCycles: true,
    },
    seed ^ SEED_SALT.graph,
  );
}

function buildGrid(config: GridConfig, seed: number): GridData {
  return generateGrid(
    {
      preset: config.preset,
      cols: config.cols,
      rows: config.rows,
      wallDensity: config.wallDensity,
      diagonal: config.diagonal,
      terrain: config.terrain,
    },
    seed ^ SEED_SALT.grid,
  );
}

function buildTree(config: TreeConfig, seed: number): TreeData {
  return generateTree({ preset: config.preset, nodeCount: config.count }, seed ^ SEED_SALT.tree);
}

/** Farthest-apart pair by hop count — a meaningful default start/goal for demos. */
function suggestEndpoints(graph: GraphData): { start: string | null; goal: string | null } {
  if (graph.nodes.length === 0) return { start: null, goal: null };
  if (graph.nodes.length === 1) return { start: graph.nodes[0].id, goal: null };

  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);
  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to);
    if (!graph.directed) adjacency.get(edge.to)?.push(edge.from);
  }

  const bfsFrom = (source: string) => {
    const distance = new Map<string, number>([[source, 0]]);
    const queue = [source];
    let farthest = source;
    while (queue.length) {
      const current = queue.shift()!;
      for (const next of adjacency.get(current) ?? []) {
        if (distance.has(next)) continue;
        distance.set(next, (distance.get(current) ?? 0) + 1);
        if ((distance.get(next) ?? 0) > (distance.get(farthest) ?? 0)) farthest = next;
        queue.push(next);
      }
    }
    return farthest;
  };

  const start = bfsFrom(graph.nodes[0].id);
  const goal = bfsFrom(start);
  return {
    start,
    goal: goal === start ? (graph.nodes.at(-1)?.id ?? null) : goal,
  };
}

const initialGraph = buildGraph(DEFAULT_GRAPH_CONFIG, INITIAL_SEED);
const initialEndpoints = suggestEndpoints(initialGraph);

export const useDatasetStore = create<DatasetState>((set, get) => {
  /** Applies a change and records the previous data for undo. */
  const commit = (mutate: (state: DatasetState) => Partial<DatasetState>) => {
    set((state) => {
      const past = [...state.past, snapshotOf(state)].slice(-HISTORY_LIMIT);
      return { ...mutate(state), past, future: [] };
    });
  };

  return {
    seed: INITIAL_SEED,
    arrayConfig: DEFAULT_ARRAY_CONFIG,
    graphConfig: DEFAULT_GRAPH_CONFIG,
    gridConfig: DEFAULT_GRID_CONFIG,
    treeConfig: DEFAULT_TREE_CONFIG,

    array: buildArray(DEFAULT_ARRAY_CONFIG, INITIAL_SEED),
    graph: initialGraph,
    graphStart: initialEndpoints.start,
    graphGoal: initialEndpoints.goal,
    grid: buildGrid(DEFAULT_GRID_CONFIG, INITIAL_SEED),
    tree: buildTree(DEFAULT_TREE_CONFIG, INITIAL_SEED),

    past: [],
    future: [],

    setSeed: (seed) =>
      commit((state) => {
        const graph = buildGraph(state.graphConfig, seed);
        const endpoints = suggestEndpoints(graph);
        return {
          seed,
          array: buildArray(state.arrayConfig, seed),
          graph,
          graphStart: endpoints.start,
          graphGoal: endpoints.goal,
          grid: buildGrid(state.gridConfig, seed),
          tree: buildTree(state.treeConfig, seed),
        };
      }),

    randomizeSeed: () => get().setSeed(randomSeed()),

    pushHistory: () =>
      set((state) => ({
        past: [...state.past, snapshotOf(state)].slice(-HISTORY_LIMIT),
        future: [],
      })),

    undo: () =>
      set((state) => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return state;
        return {
          ...previous,
          past: state.past.slice(0, -1),
          future: [snapshotOf(state), ...state.future].slice(0, HISTORY_LIMIT),
        };
      }),

    redo: () =>
      set((state) => {
        const next = state.future[0];
        if (!next) return state;
        return {
          ...next,
          past: [...state.past, snapshotOf(state)].slice(-HISTORY_LIMIT),
          future: state.future.slice(1),
        };
      }),

    setArrayConfig: (patch) =>
      commit((state) => {
        const arrayConfig = { ...state.arrayConfig, ...patch };
        const structural =
          patch.size !== undefined || patch.maxValue !== undefined || patch.preset !== undefined;
        return {
          arrayConfig,
          array: structural ? buildArray(arrayConfig, state.seed) : state.array,
        };
      }),

    regenerateArray: () =>
      commit((state) => ({ array: buildArray(state.arrayConfig, state.seed) })),

    shuffle: () =>
      commit((state) => ({ array: new Rng(state.seed + 7).shuffle([...state.array]) })),

    reverse: () => commit((state) => ({ array: [...state.array].reverse() })),

    sortArray: () => commit((state) => ({ array: [...state.array].sort((a, b) => a - b) })),

    setArrayValue: (index, value) =>
      commit((state) => {
        const array = [...state.array];
        if (index < 0 || index >= array.length) return {};
        array[index] = Math.max(1, Math.min(state.arrayConfig.maxValue, Math.round(value)));
        return { array };
      }),

    setGraphConfig: (patch) =>
      commit((state) => {
        const graphConfig = { ...state.graphConfig, ...patch };
        const structural =
          patch.nodeCount !== undefined || patch.density !== undefined || patch.preset !== undefined;

        if (structural) {
          const graph = buildGraph(graphConfig, state.seed);
          const endpoints = suggestEndpoints(graph);
          return {
            graphConfig,
            graph,
            graphStart: endpoints.start,
            graphGoal: endpoints.goal,
          };
        }

        // Direction and weighting apply to the existing topology.
        return {
          graphConfig,
          graph: {
            ...state.graph,
            directed: graphConfig.directed,
            weighted: graphConfig.weighted,
          },
        };
      }),

    regenerateGraph: () =>
      commit((state) => {
        const graph = buildGraph(state.graphConfig, state.seed);
        const endpoints = suggestEndpoints(graph);
        return { graph, graphStart: endpoints.start, graphGoal: endpoints.goal };
      }),

    addNode: (x, y) => {
      const state = get();
      const { id, label } = nextNodeId(state.graph);

      commit((current) => ({
        graph: {
          ...current.graph,
          nodes: [...current.graph.nodes, { id, label, x, y }],
        },
        graphStart: current.graphStart ?? id,
      }));

      return id;
    },

    removeNode: (id) =>
      commit((state) => ({
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.filter((node) => node.id !== id),
          edges: state.graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
        },
        graphStart: state.graphStart === id ? null : state.graphStart,
        graphGoal: state.graphGoal === id ? null : state.graphGoal,
      })),

    moveNode: (id, x, y) =>
      set((state) => ({
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((node) =>
            node.id === id
              ? { ...node, x: Math.min(0.97, Math.max(0.03, x)), y: Math.min(0.97, Math.max(0.03, y)) }
              : node,
          ),
        },
      })),

    addEdge: (from, to) =>
      commit((state) => {
        if (from === to) return {};
        const exists = state.graph.edges.some(
          (edge) =>
            (edge.from === from && edge.to === to) ||
            (!state.graph.directed && edge.from === to && edge.to === from),
        );
        if (exists) return {};

        const rng = new Rng(state.seed + state.graph.edges.length);
        return {
          graph: {
            ...state.graph,
            edges: [
              ...state.graph.edges,
              {
                id: `e${Date.now().toString(36)}${state.graph.edges.length}`,
                from,
                to,
                weight: state.graph.weighted ? rng.int(1, 20) : 1,
              },
            ],
          },
        };
      }),

    removeEdge: (id) =>
      commit((state) => ({
        graph: { ...state.graph, edges: state.graph.edges.filter((edge) => edge.id !== id) },
      })),

    setEdgeWeight: (id, weight) =>
      commit((state) => ({
        graph: {
          ...state.graph,
          edges: state.graph.edges.map((edge) =>
            edge.id === id ? { ...edge, weight: Math.max(0, Math.round(weight)) } : edge,
          ),
        },
      })),

    setGraphStart: (id) => set({ graphStart: id }),
    setGraphGoal: (id) => set({ graphGoal: id }),

    clearGraph: () =>
      commit(() => ({
        graph: { nodes: [], edges: [], directed: get().graphConfig.directed, weighted: get().graphConfig.weighted },
        graphStart: null,
        graphGoal: null,
      })),

    setGridConfig: (patch) =>
      commit((state) => {
        const gridConfig = { ...state.gridConfig, ...patch };
        const structural =
          patch.cols !== undefined ||
          patch.rows !== undefined ||
          patch.preset !== undefined ||
          patch.wallDensity !== undefined ||
          patch.terrain !== undefined;

        if (structural) return { gridConfig, grid: buildGrid(gridConfig, state.seed) };
        return { gridConfig, grid: { ...state.grid, diagonal: gridConfig.diagonal } };
      }),

    regenerateGrid: () => commit((state) => ({ grid: buildGrid(state.gridConfig, state.seed) })),

    paintCell: (index, tool, terrainCost = 5) =>
      set((state) => {
        const grid = state.grid;
        if (index < 0 || index >= grid.cols * grid.rows) return state;

        if (tool === "start") {
          if (grid.walls[index] === 1 || index === grid.goal) return state;
          return { grid: { ...grid, start: index } };
        }
        if (tool === "end") {
          if (grid.walls[index] === 1 || index === grid.start) return state;
          return { grid: { ...grid, goal: index } };
        }
        if (index === grid.start || index === grid.goal) return state;

        if (tool === "terrain") {
          if (grid.costs[index] === terrainCost) return state;
          const costs = new Uint8Array(grid.costs);
          const walls = new Uint8Array(grid.walls);
          costs[index] = terrainCost;
          walls[index] = 0;
          return { grid: { ...grid, costs, walls } };
        }

        const target = tool === "wall" ? 1 : 0;
        if (grid.walls[index] === target) return state;
        const walls = new Uint8Array(grid.walls);
        walls[index] = target;
        return { grid: { ...grid, walls } };
      }),

    clearWalls: () =>
      commit((state) => ({
        grid: {
          ...state.grid,
          walls: new Uint8Array(state.grid.cols * state.grid.rows),
          costs: new Uint8Array(state.grid.cols * state.grid.rows).fill(1),
        },
      })),

    setTreeConfig: (patch) =>
      commit((state) => {
        const treeConfig = { ...state.treeConfig, ...patch };
        const structural = patch.count !== undefined || patch.preset !== undefined;
        return {
          treeConfig,
          tree: structural ? buildTree(treeConfig, state.seed) : state.tree,
        };
      }),

    regenerateTree: () => commit((state) => ({ tree: buildTree(state.treeConfig, state.seed) })),

    commitTree: (tree) => commit(() => ({ tree: cloneTree(tree) })),

    clearTree: () => commit(() => ({ tree: emptyTree() })),

    /** Offers a value that is not already present, so the next insert is valid. */
    suggestTreeValue: () =>
      set((state) => {
        const existing = new Set(Object.values(state.tree.nodes).map((node) => node.value));
        const rng = new Rng(state.seed + Object.keys(state.tree.nodes).length * 31);
        for (let attempt = 0; attempt < 200; attempt++) {
          const candidate = rng.int(4, 99);
          if (!existing.has(candidate)) {
            return { treeConfig: { ...state.treeConfig, value: candidate } };
          }
        }
        return state;
      }),

    resetLab: (lab) =>
      commit((state) => {
        switch (lab) {
          case "sorting":
            return { array: buildArray(state.arrayConfig, state.seed) };
          case "graph": {
            const graph = buildGraph(state.graphConfig, state.seed);
            const endpoints = suggestEndpoints(graph);
            return { graph, graphStart: endpoints.start, graphGoal: endpoints.goal };
          }
          case "pathfinding":
            return { grid: buildGrid(state.gridConfig, state.seed) };
          case "trees":
            return { tree: buildTree(state.treeConfig, state.seed) };
        }
      }),
  };
});

export function insertIntoTree(tree: TreeData, value: number): TreeData {
  return insertValue(tree, value);
}
