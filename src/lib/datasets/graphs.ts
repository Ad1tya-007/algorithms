import type { GraphData, GraphEdge, GraphNode } from "@/lib/algorithms/graph/model";
import { Rng } from "@/lib/utils/random";

export type GraphPreset = "random" | "tree" | "dag" | "dense" | "sparse" | "grid";

export const GRAPH_PRESETS: { id: GraphPreset; label: string; hint: string }[] = [
  { id: "random", label: "Random", hint: "Connected graph with random extra edges" },
  { id: "tree", label: "Tree", hint: "No cycles — exactly one path between any pair" },
  { id: "dag", label: "DAG", hint: "Directed, acyclic, layered left to right" },
  { id: "dense", label: "Dense", hint: "Many edges — heavy frontier growth" },
  { id: "sparse", label: "Sparse", hint: "Few edges — long thin paths" },
  { id: "grid", label: "Grid", hint: "Lattice with uniform structure" },
];

export interface GraphConfig {
  preset: GraphPreset;
  nodeCount: number;
  /** 0…1, how many optional extra edges to add beyond a connected skeleton. */
  density: number;
  directed: boolean;
  weighted: boolean;
  allowCycles: boolean;
}

export const GRAPH_LIMITS = { nodeCount: { min: 3, max: 40 } } as const;

export function nodeLabel(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  const cycle = Math.floor(index / 26);
  return cycle === 0 ? letter : `${letter}${cycle}`;
}

function edgeId(from: string, to: string): string {
  return `e-${from}-${to}`;
}

/**
 * Force-directed relaxation.
 *
 * Repulsion between every pair keeps nodes apart, attraction along edges pulls
 * neighbours together, and a cooling schedule settles the result. Seeded and
 * fixed-iteration, so the same configuration always produces the same picture.
 */
function relax(nodes: GraphNode[], edges: GraphEdge[], rng: Rng, iterations = 260): void {
  const n = nodes.length;
  if (n < 2) return;

  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const k = Math.sqrt(1 / n) * 0.9;
  let temperature = 0.12;

  const dx = new Float64Array(n);
  const dy = new Float64Array(n);

  for (let step = 0; step < iterations; step++) {
    dx.fill(0);
    dy.fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ox = nodes[i].x - nodes[j].x;
        let oy = nodes[i].y - nodes[j].y;
        let distance = Math.hypot(ox, oy);
        if (distance < 1e-4) {
          ox = (rng.next() - 0.5) * 1e-2;
          oy = (rng.next() - 0.5) * 1e-2;
          distance = Math.hypot(ox, oy) || 1e-4;
        }
        const force = (k * k) / distance;
        const fx = (ox / distance) * force;
        const fy = (oy / distance) * force;
        dx[i] += fx;
        dy[i] += fy;
        dx[j] -= fx;
        dy[j] -= fy;
      }
    }

    for (const edge of edges) {
      const a = index.get(edge.from);
      const b = index.get(edge.to);
      if (a === undefined || b === undefined) continue;
      const ox = nodes[a].x - nodes[b].x;
      const oy = nodes[a].y - nodes[b].y;
      const distance = Math.hypot(ox, oy) || 1e-4;
      const force = (distance * distance) / k;
      const fx = (ox / distance) * force;
      const fy = (oy / distance) * force;
      dx[a] -= fx;
      dy[a] -= fy;
      dx[b] += fx;
      dy[b] += fy;
    }

    for (let i = 0; i < n; i++) {
      const magnitude = Math.hypot(dx[i], dy[i]) || 1e-4;
      const limit = Math.min(magnitude, temperature);
      nodes[i].x = Math.min(0.94, Math.max(0.06, nodes[i].x + (dx[i] / magnitude) * limit));
      nodes[i].y = Math.min(0.9, Math.max(0.1, nodes[i].y + (dy[i] / magnitude) * limit));
    }

    temperature *= 0.985;
  }
}

export function generateGraph(config: GraphConfig, seed: number): GraphData {
  const rng = new Rng(seed);
  const count = Math.max(
    GRAPH_LIMITS.nodeCount.min,
    Math.min(GRAPH_LIMITS.nodeCount.max, config.nodeCount),
  );

  const nodes: GraphNode[] = Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    label: nodeLabel(i),
    x: 0.5 + (rng.next() - 0.5) * 0.6,
    y: 0.5 + (rng.next() - 0.5) * 0.6,
  }));

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const weight = () => (config.weighted ? rng.int(1, 20) : 1);

  const connect = (from: number, to: number) => {
    if (from === to) return;
    const a = nodes[from].id;
    const b = nodes[to].id;
    const key = config.directed ? `${a}>${b}` : [a, b].sort().join("-");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: edgeId(a, b), from: a, to: b, weight: weight() });
  };

  const preset = config.preset;

  if (preset === "grid") {
    const cols = Math.max(2, Math.round(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    nodes.forEach((node, i) => {
      const cx = i % cols;
      const cy = Math.floor(i / cols);
      node.x = 0.12 + (cx / Math.max(1, cols - 1)) * 0.76;
      node.y = 0.16 + (cy / Math.max(1, rows - 1)) * 0.68;
    });
    for (let i = 0; i < count; i++) {
      const cx = i % cols;
      if (cx + 1 < cols && i + 1 < count) connect(i, i + 1);
      if (i + cols < count) connect(i, i + cols);
    }
    return { nodes, edges, directed: config.directed, weighted: config.weighted };
  }

  if (preset === "dag") {
    const layers = Math.max(2, Math.round(Math.sqrt(count) * 1.2));
    const assignment = nodes.map((_, i) => Math.min(layers - 1, Math.floor((i / count) * layers)));
    const perLayer = new Map<number, number[]>();
    assignment.forEach((layer, i) => {
      if (!perLayer.has(layer)) perLayer.set(layer, []);
      perLayer.get(layer)!.push(i);
    });

    for (const [layer, members] of perLayer) {
      members.forEach((i, position) => {
        nodes[i].x = 0.1 + (layer / Math.max(1, layers - 1)) * 0.8;
        nodes[i].y = 0.16 + ((position + 0.5) / members.length) * 0.68;
      });
    }

    for (let i = 0; i < count; i++) {
      const layer = assignment[i];
      const nextLayer = perLayer.get(layer + 1);
      if (!nextLayer || nextLayer.length === 0) continue;
      connect(i, rng.pick(nextLayer));
      if (rng.bool(0.3 + config.density * 0.5)) connect(i, rng.pick(nextLayer));
    }

    // Guarantee every non-source node has an incoming edge.
    for (let i = 1; i < count; i++) {
      const hasIncoming = edges.some((e) => e.to === nodes[i].id);
      if (hasIncoming) continue;
      const previous = perLayer.get(assignment[i] - 1);
      if (previous && previous.length > 0) connect(rng.pick(previous), i);
      else connect(0, i);
    }

    return { nodes, edges, directed: true, weighted: config.weighted };
  }

  // Every remaining preset starts from a spanning tree so the graph is connected.
  const order = rng.shuffle(nodes.map((_, i) => i));
  for (let i = 1; i < order.length; i++) {
    const parent = order[rng.int(0, i - 1)];
    connect(parent, order[i]);
  }

  if (preset !== "tree" && config.allowCycles) {
    const maxExtra = (count * (count - 1)) / 2 - edges.length;
    const factor =
      preset === "dense" ? 0.55 : preset === "sparse" ? 0.06 : 0.12 + config.density * 0.35;
    const extra = Math.max(0, Math.round(maxExtra * factor * (0.4 + config.density)));
    for (let i = 0; i < extra; i++) {
      connect(rng.int(0, count - 1), rng.int(0, count - 1));
    }
  }

  relax(nodes, edges, rng);

  return { nodes, edges, directed: config.directed, weighted: config.weighted };
}

/** Re-runs the layout relaxation on a user-built graph. */
export function tidyGraph(graph: GraphData, seed: number): GraphData {
  const nodes = graph.nodes.map((node) => ({ ...node }));
  relax(nodes, graph.edges, new Rng(seed), 320);
  return { ...graph, nodes };
}

export function emptyGraph(directed = false, weighted = true): GraphData {
  return { nodes: [], edges: [], directed, weighted };
}

export function nextNodeId(graph: GraphData): { id: string; label: string } {
  let index = graph.nodes.length;
  const used = new Set(graph.nodes.map((n) => n.id));
  while (used.has(`n${index}`)) index += 1;

  const usedLabels = new Set(graph.nodes.map((n) => n.label));
  let labelIndex = 0;
  while (usedLabels.has(nodeLabel(labelIndex))) labelIndex += 1;

  return { id: `n${index}`, label: nodeLabel(labelIndex) };
}

export function makeEdge(from: string, to: string, weight: number): GraphEdge {
  return { id: edgeId(from, to), from, to, weight };
}

/** True when the graph already contains this connection. */
export function hasEdge(graph: GraphData, from: string, to: string): boolean {
  return graph.edges.some(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (!graph.directed && edge.from === to && edge.to === from),
  );
}
