import type { AlgorithmDefinition, AlgorithmStep } from "../core/types";

/** Positions are normalised to 0…1 so the canvas can resize freely. */
export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  weighted: boolean;
}

export interface GraphInput {
  graph: GraphData;
  start: string | null;
  goal: string | null;
}

export type GraphOp =
  | { type: "expand"; node: string }
  | { type: "discover"; node: string; via: string | null; edge: string | null }
  | { type: "inspect-edge"; edge: string; node: string }
  | { type: "relax"; edge: string; node: string; from: number; to: number }
  | { type: "reject-edge"; edge: string; node: string }
  | { type: "settle"; node: string }
  | { type: "path"; nodes: string[]; edges: string[] }
  | { type: "idle" };

export interface FrontierEntry {
  id: string;
  /** Ordering key shown next to the node, e.g. a distance or an f-score. */
  key?: string;
}

/**
 * Graph traces carry full state snapshots. Graphs in the laboratory hold at most
 * a few dozen nodes, so a snapshot per step is cheap and lets the inspector show
 * distance tables and parent maps without replaying anything.
 */
export interface GraphExtra {
  current: string | null;
  frontierLabel: string;
  frontier: FrontierEntry[];
  discovered: string[];
  settled: string[];
  parent: Record<string, string | null>;
  distances: Record<string, number> | null;
  scores: Record<string, { g: number; h: number; f: number }> | null;
  order: string[];
  activeEdge: string | null;
  pathNodes: string[];
  pathEdges: string[];
}

export type GraphStep = AlgorithmStep<GraphOp, GraphExtra>;
export type GraphAlgorithm = AlgorithmDefinition<GraphInput, GraphOp, GraphExtra>;

export interface Neighbor {
  node: string;
  edge: GraphEdge;
}

/**
 * Adjacency list. Undirected graphs traverse every edge both ways; directed
 * graphs only follow `from → to`. Neighbours are sorted by label so a given
 * graph always produces an identical trace.
 */
export function buildAdjacency(graph: GraphData): Map<string, Neighbor[]> {
  const labels = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const adjacency = new Map<string, Neighbor[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);

  for (const edge of graph.edges) {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) continue;
    adjacency.get(edge.from)!.push({ node: edge.to, edge });
    if (!graph.directed) {
      adjacency.get(edge.to)!.push({ node: edge.from, edge });
    }
  }

  for (const list of adjacency.values()) {
    list.sort((a, b) => {
      const la = labels.get(a.node) ?? a.node;
      const lb = labels.get(b.node) ?? b.node;
      return la.localeCompare(lb, "en", { numeric: true });
    });
  }

  return adjacency;
}

export function labelOf(graph: GraphData, id: string | null): string {
  if (!id) return "—";
  return graph.nodes.find((n) => n.id === id)?.label ?? id;
}

export function edgeWeight(graph: GraphData, edge: GraphEdge): number {
  return graph.weighted ? edge.weight : 1;
}

/** Reconstructs a path by walking the parent map backwards from `goal`. */
export function tracePath(
  parent: Record<string, string | null>,
  start: string,
  goal: string,
): string[] | null {
  const path: string[] = [];
  let cursor: string | null = goal;
  const guard = new Set<string>();

  while (cursor) {
    if (guard.has(cursor)) return null;
    guard.add(cursor);
    path.push(cursor);
    if (cursor === start) return path.reverse();
    cursor = parent[cursor] ?? null;
  }

  return null;
}

export function pathEdgeIds(graph: GraphData, path: string[]): string[] {
  const ids: string[] = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = graph.edges.find(
      (e) =>
        (e.from === a && e.to === b) || (!graph.directed && e.from === b && e.to === a),
    );
    if (edge) ids.push(edge.id);
  }
  return ids;
}

export function euclidean(a: GraphNode, b: GraphNode, scale: number): number {
  return Math.hypot(a.x - b.x, a.y - b.y) * scale;
}

export function requireStart(input: GraphInput): string | null {
  if (input.graph.nodes.length === 0) {
    return "There is no graph yet. Click the canvas to create nodes, or load a preset.";
  }
  if (!input.start) {
    return "Choose a start node. Select a node on the canvas and press “Set Start”.";
  }
  return null;
}
