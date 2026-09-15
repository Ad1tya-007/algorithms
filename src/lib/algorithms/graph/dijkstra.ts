import { StepRecorder } from "../core/recorder";
import { formatDistance } from "@/lib/utils/format";
import {
  buildAdjacency,
  edgeWeight,
  labelOf,
  pathEdgeIds,
  requireStart,
  tracePath,
  type GraphAlgorithm,
  type GraphExtra,
  type GraphOp,
} from "./model";

const pseudocode = [
  "function dijkstra(graph, start) {",
  "  dist = { [start]: 0 };  // every other node is ∞",
  "  const pq = new MinQueue([[start, 0]]);",
  "  while (pq.size) {",
  "    const u = pq.pop();       // smallest tentative distance",
  "    if (settled.has(u)) continue;",
  "    settled.add(u);",
  "    for (const [v, w] of graph.edges(u)) {",
  "      if (dist[u] + w < dist[v]) {",
  "        dist[v] = dist[u] + w;",
  "        parent[v] = u;",
  "        pq.push(v, dist[v]);",
  "      }",
  "    }",
  "  }",
  "}",
];

export const dijkstra: GraphAlgorithm = {
  id: "dijkstra",
  name: "Dijkstra",
  category: "graph",
  lab: "graph",
  complexity: {
    best: "O((V + E) log V)",
    average: "O((V + E) log V)",
    worst: "O((V + E) log V)",
    space: "O(V)",
  },
  growth: "n log n",
  description:
    "Grows a set of nodes with known shortest distances, always settling the unsettled node that is currently closest.",
  howItWorks:
    "Each node leaves the priority queue with its final distance, because any later route would have to pass through a node that is already further away. That argument depends on non-negative weights — with a negative edge, a settled node could still be improved later.",
  pseudocode,

  validate(input) {
    const missing = requireStart(input);
    if (missing) return missing;
    if (!input.graph.weighted) {
      return "Dijkstra ranks nodes by path cost, so it needs edge weights. Enable “Weighted” in the graph configuration — or run BFS, which finds shortest paths by edge count.";
    }
    if (input.graph.edges.some((e) => e.weight < 0)) {
      return "Dijkstra requires non-negative edge weights. Edit the negative weight, or the settled-distance guarantee no longer holds.";
    }
    return null;
  },

  generate({ graph, start, goal }) {
    const rec = new StepRecorder<GraphOp, GraphExtra>();
    if (!start) return rec.done();

    const adjacency = buildAdjacency(graph);
    const distances: Record<string, number> = {};
    const parent: Record<string, string | null> = { [start]: null };
    for (const node of graph.nodes) distances[node.id] = Infinity;
    distances[start] = 0;

    const settled = new Set<string>();
    const discovered = new Set<string>([start]);
    const order: string[] = [];
    /** Sorted ascending by tentative distance; small graphs make this cheap. */
    let queue: { id: string; key: number }[] = [{ id: start, key: 0 }];

    const sortQueue = () => {
      queue.sort((a, b) => a.key - b.key || a.id.localeCompare(b.id));
    };

    const snapshot = (
      current: string | null,
      activeEdge: string | null,
      pathNodes: string[] = [],
      pathEdges: string[] = [],
    ): GraphExtra => ({
      current,
      frontierLabel: "PRIORITY QUEUE",
      frontier: queue
        .filter((entry) => !settled.has(entry.id))
        .map((entry) => ({ id: entry.id, key: formatDistance(entry.key) })),
      discovered: [...discovered],
      settled: [...settled],
      parent: { ...parent },
      distances: { ...distances },
      scores: null,
      order: [...order],
      activeEdge,
      pathNodes,
      pathEdges,
    });

    rec.record({
      op: { type: "discover", node: start, via: null, edge: null },
      phase: "DISCOVERED",
      explanation: `Set distance(${labelOf(graph, start)}) = 0 and every other node to ∞.`,
      fields: [
        { label: "Start", value: labelOf(graph, start), tone: "accent" },
        { label: "Distance", value: "0", tone: "good" },
        { label: "Queue Size", value: "1" },
      ],
      extra: snapshot(null, null),
      codeLine: 1,
    });

    while (queue.length > 0) {
      sortQueue();
      const entry = queue.shift()!;
      const u = entry.id;

      if (settled.has(u)) {
        rec.record({
          op: { type: "idle" },
          phase: "EXPANDING",
          explanation: `${labelOf(graph, u)} is already settled — this is a stale queue entry, discard it.`,
          fields: [{ label: "Decision", value: "stale entry", tone: "muted" }],
          extra: snapshot(null, null),
          codeLine: 5,
        });
        continue;
      }

      if (!Number.isFinite(distances[u])) break;

      settled.add(u);
      order.push(u);

      rec.record({
        op: { type: "expand", node: u },
        phase: "EXPANDING",
        explanation: `${labelOf(graph, u)} has the smallest tentative distance (${formatDistance(
          distances[u],
        )}), so that distance is now final.`,
        fields: [
          { label: "Current", value: labelOf(graph, u), tone: "accent" },
          { label: "Final Distance", value: formatDistance(distances[u]), tone: "good" },
          { label: "Parent", value: labelOf(graph, parent[u] ?? null) },
          { label: "Settled", value: `${settled.size} / ${graph.nodes.length}` },
          { label: "Queue Size", value: `${queue.filter((q) => !settled.has(q.id)).length}` },
        ],
        extra: snapshot(u, null),
        codeLine: 6,
        count: "visits",
      });

      if (goal && u === goal) break;

      for (const { node: v, edge } of adjacency.get(u) ?? []) {
        const w = edgeWeight(graph, edge);
        const candidate = distances[u] + w;
        const current = distances[v];

        if (settled.has(v)) {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "EXPANDING",
            explanation: `${labelOf(graph, v)} is already settled at ${formatDistance(
              current,
            )} — it cannot be improved.`,
            fields: [
              { label: "Current", value: labelOf(graph, u), tone: "accent" },
              { label: "Neighbour", value: labelOf(graph, v) },
              { label: "Decision", value: "already settled", tone: "muted" },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 7,
          });
          continue;
        }

        rec.record({
          op: { type: "inspect-edge", edge: edge.id, node: v },
          phase: "RELAXING",
          explanation: `Try ${labelOf(graph, u)} → ${labelOf(graph, v)} with weight ${w}: ${formatDistance(
            distances[u],
          )} + ${w} = ${formatDistance(candidate)} versus current ${formatDistance(current)}.`,
          fields: [
            { label: "Edge", value: `${labelOf(graph, u)} → ${labelOf(graph, v)}`, tone: "active" },
            { label: "Weight", value: `${w}` },
            { label: "Candidate", value: formatDistance(candidate), tone: "accent" },
            { label: "Known", value: formatDistance(current) },
          ],
          extra: snapshot(u, edge.id),
          codeLine: 8,
          count: "comparisons",
        });

        if (candidate < current) {
          distances[v] = candidate;
          parent[v] = u;
          discovered.add(v);
          queue = queue.filter((q) => q.id !== v);
          queue.push({ id: v, key: candidate });

          rec.record({
            op: { type: "relax", edge: edge.id, node: v, from: current, to: candidate },
            phase: "RELAXING",
            explanation: `Improve distance(${labelOf(graph, v)}): ${formatDistance(
              current,
            )} → ${formatDistance(candidate)} through ${labelOf(graph, u)}.`,
            fields: [
              { label: "Improved", value: labelOf(graph, v), tone: "good" },
              {
                label: "Distance",
                value: `${formatDistance(current)} → ${formatDistance(candidate)}`,
                tone: "good",
              },
              { label: "New Parent", value: labelOf(graph, u), tone: "accent" },
              { label: "Queue Size", value: `${queue.filter((q) => !settled.has(q.id)).length}` },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 9,
            count: "relaxations",
          });
        } else {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "RELAXING",
            explanation: `${formatDistance(candidate)} is not better than ${formatDistance(
              current,
            )} — keep the existing route to ${labelOf(graph, v)}.`,
            fields: [
              { label: "Rejected", value: `${labelOf(graph, u)} → ${labelOf(graph, v)}`, tone: "muted" },
              {
                label: "Decision",
                value: `${formatDistance(candidate)} ≥ ${formatDistance(current)}`,
                tone: "muted",
              },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 8,
          });
        }
      }
    }

    if (goal) {
      if (Number.isFinite(distances[goal])) {
        const path = tracePath(parent, start, goal) ?? [];
        rec.record({
          op: { type: "path", nodes: path, edges: pathEdgeIds(graph, path) },
          phase: "PATH",
          explanation: `Shortest path to ${labelOf(graph, goal)} costs ${formatDistance(
            distances[goal],
          )}: ${path.map((id) => labelOf(graph, id)).join(" → ")}.`,
          fields: [
            { label: "Goal", value: labelOf(graph, goal), tone: "good" },
            { label: "Total Cost", value: formatDistance(distances[goal]), tone: "good" },
            { label: "Hops", value: `${Math.max(0, path.length - 1)}` },
            { label: "Nodes Settled", value: `${settled.size}` },
          ],
          extra: snapshot(null, null, path, pathEdgeIds(graph, path)),
          codeLine: 14,
        });
      } else {
        rec.record({
          op: { type: "idle" },
          phase: "UNREACHABLE",
          explanation: `${labelOf(graph, goal)} is unreachable from ${labelOf(graph, start)} — its distance stays ∞.`,
          fields: [{ label: "Status", value: "unreachable", tone: "warn" }],
          extra: snapshot(null, null),
          codeLine: 14,
        });
      }
      return rec.done();
    }

    const unreachable = graph.nodes.filter((n) => !Number.isFinite(distances[n.id])).length;
    rec.record({
      op: { type: "idle" },
      phase: "COMPLETE",
      explanation: `Every reachable node has a final distance. ${settled.size} settled, ${unreachable} unreachable.`,
      fields: [
        { label: "Status", value: "complete", tone: "good" },
        { label: "Settled", value: `${settled.size} / ${graph.nodes.length}` },
        { label: "Unreachable", value: `${unreachable}` },
      ],
      extra: snapshot(null, null),
      codeLine: 14,
    });

    return rec.done();
  },
};
