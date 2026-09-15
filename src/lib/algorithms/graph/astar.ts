import { StepRecorder } from "../core/recorder";
import { formatDistance } from "@/lib/utils/format";
import {
  buildAdjacency,
  edgeWeight,
  euclidean,
  labelOf,
  pathEdgeIds,
  requireStart,
  tracePath,
  type GraphAlgorithm,
  type GraphData,
  type GraphExtra,
  type GraphOp,
} from "./model";

const pseudocode = [
  "function aStar(graph, start, goal) {",
  "  g = { [start]: 0 };",
  "  const open = new MinQueue([[start, h(start)]]);",
  "  while (open.size) {",
  "    const u = open.pop();      // smallest f = g + h",
  "    if (u === goal) return path(u);",
  "    closed.add(u);",
  "    for (const [v, w] of graph.edges(u)) {",
  "      if (g[u] + w < g[v]) {",
  "        g[v] = g[u] + w;",
  "        parent[v] = u;",
  "        open.push(v, g[v] + h(v));",
  "      }",
  "    }",
  "  }",
  "}",
];

/**
 * Scale factor that makes straight-line distance admissible.
 *
 * Picking the cheapest cost-per-unit-length across all edges guarantees the
 * heuristic never overestimates: any route of geometric length L costs at least
 * `k · L`, so `k · straightLine(n, goal)` is a lower bound on the true remaining
 * cost. An inadmissible heuristic would let A* return a non-optimal path.
 */
function heuristicScale(graph: GraphData): number {
  let k = Infinity;
  for (const edge of graph.edges) {
    const a = graph.nodes.find((n) => n.id === edge.from);
    const b = graph.nodes.find((n) => n.id === edge.to);
    if (!a || !b) continue;
    const length = Math.hypot(a.x - b.x, a.y - b.y);
    if (length <= 1e-6) continue;
    k = Math.min(k, edgeWeight(graph, edge) / length);
  }
  return Number.isFinite(k) ? k : 0;
}

export const graphAstar: GraphAlgorithm = {
  id: "graph-astar",
  name: "A*",
  category: "graph",
  lab: "graph",
  complexity: {
    best: "O(E)",
    average: "O(E log V)",
    worst: "O(E log V)",
    space: "O(V)",
  },
  growth: "n log n",
  description:
    "Dijkstra guided by a heuristic: nodes are expanded in order of g + h, the cost paid so far plus an estimate of the cost remaining.",
  howItWorks:
    "The heuristic here is the straight-line distance to the goal, scaled by the cheapest cost-per-distance in the graph so that it never overestimates. That admissibility is what keeps the result optimal while letting A* ignore nodes pointing away from the goal — watch how much smaller the closed set is than Dijkstra's on the same graph.",
  pseudocode,

  validate(input) {
    const missing = requireStart(input);
    if (missing) return missing;
    if (!input.goal) {
      return "A* searches toward a specific target. Select a node and press “Set Goal”.";
    }
    if (input.start === input.goal) {
      return "The start and goal are the same node. Set a different goal to watch the search progress.";
    }
    return null;
  },

  generate({ graph, start, goal }) {
    const rec = new StepRecorder<GraphOp, GraphExtra>();
    if (!start || !goal) return rec.done();

    const goalNode = graph.nodes.find((n) => n.id === goal);
    if (!goalNode) return rec.done();

    const adjacency = buildAdjacency(graph);
    const scale = heuristicScale(graph);
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

    const h = (id: string): number => {
      const node = nodeById.get(id);
      return node ? euclidean(node, goalNode, scale) : 0;
    };

    const g: Record<string, number> = {};
    for (const node of graph.nodes) g[node.id] = Infinity;
    g[start] = 0;

    const parent: Record<string, string | null> = { [start]: null };
    const closed = new Set<string>();
    const discovered = new Set<string>([start]);
    const order: string[] = [];
    let open: { id: string; key: number }[] = [{ id: start, key: h(start) }];

    const scores = () => {
      const out: Record<string, { g: number; h: number; f: number }> = {};
      for (const node of graph.nodes) {
        if (!Number.isFinite(g[node.id])) continue;
        const gv = g[node.id];
        const hv = h(node.id);
        out[node.id] = { g: gv, h: hv, f: gv + hv };
      }
      return out;
    };

    const snapshot = (
      current: string | null,
      activeEdge: string | null,
      pathNodes: string[] = [],
      pathEdges: string[] = [],
    ): GraphExtra => ({
      current,
      frontierLabel: "OPEN SET",
      frontier: open
        .filter((entry) => !closed.has(entry.id))
        .slice()
        .sort((a, b) => a.key - b.key)
        .map((entry) => ({ id: entry.id, key: `f ${formatDistance(entry.key)}` })),
      discovered: [...discovered],
      settled: [...closed],
      parent: { ...parent },
      distances: { ...g },
      scores: scores(),
      order: [...order],
      activeEdge,
      pathNodes,
      pathEdges,
    });

    rec.record({
      op: { type: "discover", node: start, via: null, edge: null },
      phase: "OPEN",
      explanation: `Put ${labelOf(graph, start)} in the open set with g = 0 and h = ${formatDistance(
        h(start),
      )}.`,
      fields: [
        { label: "Start", value: labelOf(graph, start), tone: "accent" },
        { label: "Goal", value: labelOf(graph, goal), tone: "accent" },
        { label: "G Cost", value: "0" },
        { label: "H Cost", value: formatDistance(h(start)) },
        { label: "F Cost", value: formatDistance(h(start)), tone: "active" },
      ],
      extra: snapshot(null, null),
      codeLine: 2,
    });

    while (open.length > 0) {
      open.sort((a, b) => a.key - b.key || a.id.localeCompare(b.id));
      const entry = open.shift()!;
      const u = entry.id;

      if (closed.has(u)) continue;

      closed.add(u);
      order.push(u);

      const gu = g[u];
      const hu = h(u);

      rec.record({
        op: { type: "expand", node: u },
        phase: "CURRENT",
        explanation: `Expand ${labelOf(graph, u)} — it has the lowest f = ${formatDistance(
          gu,
        )} + ${formatDistance(hu)} = ${formatDistance(gu + hu)} in the open set.`,
        fields: [
          { label: "Current", value: labelOf(graph, u), tone: "accent" },
          { label: "G Cost", value: formatDistance(gu) },
          { label: "H Cost", value: formatDistance(hu) },
          { label: "F Cost", value: formatDistance(gu + hu), tone: "active" },
          { label: "Open Set", value: `${open.filter((o) => !closed.has(o.id)).length}` },
          { label: "Closed Set", value: `${closed.size}` },
        ],
        extra: snapshot(u, null),
        codeLine: 4,
        count: "visits",
      });

      if (u === goal) {
        const path = tracePath(parent, start, goal) ?? [];
        rec.record({
          op: { type: "path", nodes: path, edges: pathEdgeIds(graph, path) },
          phase: "PATH",
          explanation: `Goal expanded, so its cost is final: ${formatDistance(
            g[goal],
          )} via ${path.map((id) => labelOf(graph, id)).join(" → ")}.`,
          fields: [
            { label: "Goal", value: labelOf(graph, goal), tone: "good" },
            { label: "Total Cost", value: formatDistance(g[goal]), tone: "good" },
            { label: "Hops", value: `${Math.max(0, path.length - 1)}` },
            { label: "Nodes Expanded", value: `${closed.size}`, tone: "accent" },
          ],
          extra: snapshot(null, null, path, pathEdgeIds(graph, path)),
          codeLine: 5,
        });
        return rec.done();
      }

      for (const { node: v, edge } of adjacency.get(u) ?? []) {
        if (closed.has(v)) {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "CLOSED",
            explanation: `${labelOf(graph, v)} is in the closed set — skip it.`,
            fields: [
              { label: "Current", value: labelOf(graph, u), tone: "accent" },
              { label: "Neighbour", value: labelOf(graph, v) },
              { label: "Decision", value: "closed", tone: "muted" },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 7,
          });
          continue;
        }

        const w = edgeWeight(graph, edge);
        const candidate = g[u] + w;
        const hv = h(v);

        rec.record({
          op: { type: "inspect-edge", edge: edge.id, node: v },
          phase: "RELAXING",
          explanation: `Through ${labelOf(graph, u)}, ${labelOf(graph, v)} would cost g = ${formatDistance(
            candidate,
          )} and f = ${formatDistance(candidate + hv)}.`,
          fields: [
            { label: "Edge", value: `${labelOf(graph, u)} → ${labelOf(graph, v)}`, tone: "active" },
            { label: "Weight", value: `${w}` },
            { label: "Candidate G", value: formatDistance(candidate) },
            { label: "H Cost", value: formatDistance(hv) },
            { label: "Candidate F", value: formatDistance(candidate + hv), tone: "accent" },
            { label: "Known G", value: formatDistance(g[v]) },
          ],
          extra: snapshot(u, edge.id),
          codeLine: 8,
          count: "comparisons",
        });

        if (candidate < g[v]) {
          const previous = g[v];
          g[v] = candidate;
          parent[v] = u;
          discovered.add(v);
          open = open.filter((o) => o.id !== v);
          open.push({ id: v, key: candidate + hv });

          rec.record({
            op: { type: "relax", edge: edge.id, node: v, from: previous, to: candidate },
            phase: "OPEN",
            explanation: `Better route to ${labelOf(graph, v)} — g: ${formatDistance(
              previous,
            )} → ${formatDistance(candidate)}. Push it into the open set with f = ${formatDistance(
              candidate + hv,
            )}.`,
            fields: [
              { label: "Improved", value: labelOf(graph, v), tone: "good" },
              {
                label: "G Cost",
                value: `${formatDistance(previous)} → ${formatDistance(candidate)}`,
                tone: "good",
              },
              { label: "F Cost", value: formatDistance(candidate + hv), tone: "accent" },
              { label: "New Parent", value: labelOf(graph, u) },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 9,
            count: "relaxations",
          });
        } else {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "RELAXING",
            explanation: `${formatDistance(candidate)} does not beat the known g = ${formatDistance(
              g[v],
            )} for ${labelOf(graph, v)}.`,
            fields: [
              { label: "Rejected", value: `${labelOf(graph, u)} → ${labelOf(graph, v)}`, tone: "muted" },
              {
                label: "Decision",
                value: `${formatDistance(candidate)} ≥ ${formatDistance(g[v])}`,
                tone: "muted",
              },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 8,
          });
        }
      }
    }

    rec.record({
      op: { type: "idle" },
      phase: "UNREACHABLE",
      explanation: `The open set is empty and ${labelOf(graph, goal)} was never reached — no path exists.`,
      fields: [
        { label: "Status", value: "no path", tone: "warn" },
        { label: "Nodes Expanded", value: `${closed.size}` },
      ],
      extra: snapshot(null, null),
      codeLine: 15,
    });

    return rec.done();
  },
};
