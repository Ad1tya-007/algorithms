import { StepRecorder } from "../core/recorder";
import {
  buildAdjacency,
  labelOf,
  pathEdgeIds,
  requireStart,
  tracePath,
  type GraphAlgorithm,
  type GraphExtra,
  type GraphOp,
} from "./model";

const pseudocode = [
  "function bfs(graph, start) {",
  "  const queue = [start];",
  "  const seen = new Set([start]);",
  "  while (queue.length) {",
  "    const u = queue.shift();",
  "    for (const v of graph.neighbours(u)) {",
  "      if (seen.has(v)) continue;",
  "      seen.add(v);",
  "      parent[v] = u;",
  "      queue.push(v);",
  "    }",
  "  }",
  "}",
];

export const bfs: GraphAlgorithm = {
  id: "bfs",
  name: "Breadth-First Search",
  category: "graph",
  lab: "graph",
  complexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
    space: "O(V)",
  },
  growth: "n",
  description:
    "Explores the graph in layers using a queue, reaching every node at distance k before any node at distance k+1.",
  howItWorks:
    "The queue is what creates the layered order: a node is appended when it is discovered and expanded only after everything discovered before it. On an unweighted graph this makes the first path found to any node a shortest path by edge count.",
  pseudocode,
  validate: requireStart,

  generate({ graph, start, goal }) {
    const rec = new StepRecorder<GraphOp, GraphExtra>();
    if (!start) return rec.done();

    const adjacency = buildAdjacency(graph);
    const queue: string[] = [start];
    const distances: Record<string, number> = { [start]: 0 };
    const parent: Record<string, string | null> = { [start]: null };
    const discovered = new Set<string>([start]);
    const settled: string[] = [];
    const order: string[] = [];

    const snapshot = (
      current: string | null,
      activeEdge: string | null,
      pathNodes: string[] = [],
      pathEdges: string[] = [],
    ): GraphExtra => ({
      current,
      frontierLabel: "QUEUE",
      frontier: queue.map((id) => ({
        id,
        key: `d ${distances[id] ?? "?"}`,
      })),
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
      explanation: `Enqueue the start node ${labelOf(graph, start)} at distance 0.`,
      fields: [
        { label: "Start", value: labelOf(graph, start), tone: "accent" },
        { label: "Queue", value: `[${labelOf(graph, start)}]`, tone: "active" },
        { label: "Layer", value: "0" },
      ],
      extra: snapshot(null, null),
      codeLine: 1,
    });

    while (queue.length > 0) {
      const u = queue.shift()!;
      order.push(u);

      rec.record({
        op: { type: "expand", node: u },
        phase: "EXPANDING",
        explanation: `Dequeue ${labelOf(graph, u)} (distance ${distances[u]}) and examine its neighbours.`,
        fields: [
          { label: "Current", value: labelOf(graph, u), tone: "accent" },
          { label: "Distance", value: `${distances[u]}` },
          { label: "Parent", value: labelOf(graph, parent[u] ?? null) },
          { label: "Queue Size", value: `${queue.length}` },
          { label: "Expanded", value: `${order.length} / ${graph.nodes.length}` },
        ],
        extra: snapshot(u, null),
        codeLine: 4,
        count: "visits",
      });

      for (const { node: v, edge } of adjacency.get(u) ?? []) {
        if (discovered.has(v)) {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "EXPANDING",
            explanation: `${labelOf(graph, v)} was already discovered at distance ${distances[v]} — skip it.`,
            fields: [
              { label: "Current", value: labelOf(graph, u), tone: "accent" },
              { label: "Neighbour", value: labelOf(graph, v) },
              { label: "Decision", value: "already discovered", tone: "muted" },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 6,
          });
          continue;
        }

        discovered.add(v);
        parent[v] = u;
        distances[v] = distances[u] + 1;
        queue.push(v);

        rec.record({
          op: { type: "discover", node: v, via: u, edge: edge.id },
          phase: "DISCOVERED",
          explanation: `Discover ${labelOf(graph, v)} through ${labelOf(graph, u)} — distance ${
            distances[v]
          }. Append it to the queue.`,
          fields: [
            { label: "Current", value: labelOf(graph, u), tone: "accent" },
            { label: "Discovered", value: labelOf(graph, v), tone: "good" },
            { label: "Distance", value: `${distances[v]}`, tone: "active" },
            { label: "Parent", value: labelOf(graph, u) },
            { label: "Queue Position", value: `${queue.length}` },
          ],
          extra: snapshot(u, edge.id),
          codeLine: 9,
          count: "relaxations",
        });
      }

      settled.push(u);
      rec.record({
        op: { type: "settle", node: u },
        phase: "VISITED",
        explanation: `${labelOf(graph, u)} is fully expanded — every neighbour has been seen.`,
        fields: [
          { label: "Visited", value: labelOf(graph, u), tone: "good" },
          { label: "Queue Size", value: `${queue.length}` },
          { label: "Visited Count", value: `${settled.length} / ${graph.nodes.length}` },
        ],
        extra: snapshot(null, null),
        codeLine: 3,
      });

      if (goal && u === goal) break;
    }

    if (goal && discovered.has(goal)) {
      const path = tracePath(parent, start, goal) ?? [];
      rec.record({
        op: { type: "path", nodes: path, edges: pathEdgeIds(graph, path) },
        phase: "PATH",
        explanation: `Shortest path to ${labelOf(graph, goal)} by edge count: ${path
          .map((id) => labelOf(graph, id))
          .join(" → ")}.`,
        fields: [
          { label: "Goal", value: labelOf(graph, goal), tone: "good" },
          { label: "Edges", value: `${Math.max(0, path.length - 1)}`, tone: "good" },
          { label: "Nodes Expanded", value: `${order.length}` },
        ],
        extra: snapshot(null, null, path, pathEdgeIds(graph, path)),
        codeLine: 11,
      });
      return rec.done();
    }

    const unreached = graph.nodes.filter((n) => !discovered.has(n.id));
    rec.record({
      op: { type: "idle" },
      phase: goal ? "UNREACHABLE" : "COMPLETE",
      explanation: goal
        ? `${labelOf(graph, goal)} is not reachable from ${labelOf(graph, start)}.`
        : `Traversal complete. ${settled.length} of ${graph.nodes.length} nodes reached from ${labelOf(
            graph,
            start,
          )}.`,
      fields: [
        { label: "Status", value: goal ? "unreachable" : "complete", tone: goal ? "warn" : "good" },
        { label: "Reached", value: `${settled.length} / ${graph.nodes.length}` },
        { label: "Unreachable", value: `${unreached.length}` },
        { label: "Order", value: order.map((id) => labelOf(graph, id)).join(" ") || "—" },
      ],
      extra: snapshot(null, null),
      codeLine: 11,
    });

    return rec.done();
  },
};
