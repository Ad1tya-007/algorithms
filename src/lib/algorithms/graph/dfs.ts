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
  "function dfs(graph, u, seen = new Set()) {",
  "  seen.add(u);",
  "  for (const v of graph.neighbours(u)) {",
  "    if (seen.has(v)) continue;",
  "    parent[v] = u;",
  "    dfs(graph, v, seen);",
  "  }",
  "  // u is finished: backtrack",
  "}",
];

export const dfs: GraphAlgorithm = {
  id: "dfs",
  name: "Depth-First Search",
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
    "Follows one branch as deep as it goes, then backtracks and tries the next unexplored neighbour.",
  howItWorks:
    "The call stack is the data structure. Depth-first order finds *a* path quickly but makes no claim about it being short — compare the path it returns with the one breadth-first search finds on the same graph.",
  pseudocode,
  validate: requireStart,

  generate({ graph, start, goal }) {
    const rec = new StepRecorder<GraphOp, GraphExtra>();
    if (!start) return rec.done();

    const adjacency = buildAdjacency(graph);
    const seen = new Set<string>();
    const parent: Record<string, string | null> = { [start]: null };
    const depth: Record<string, number> = { [start]: 0 };
    const stack: string[] = [];
    const finished: string[] = [];
    const order: string[] = [];
    let reachedGoal = false;

    const snapshot = (
      current: string | null,
      activeEdge: string | null,
      pathNodes: string[] = [],
      pathEdges: string[] = [],
    ): GraphExtra => ({
      current,
      frontierLabel: "STACK",
      frontier: stack.map((id) => ({ id, key: `depth ${depth[id] ?? 0}` })),
      discovered: [...seen],
      settled: [...finished],
      parent: { ...parent },
      distances: { ...depth },
      scores: null,
      order: [...order],
      activeEdge,
      pathNodes,
      pathEdges,
    });

    const visit = (u: string, viaEdge: string | null) => {
      if (reachedGoal) return;

      seen.add(u);
      stack.push(u);
      order.push(u);

      rec.record({
        op: { type: "expand", node: u },
        phase: "EXPANDING",
        explanation: `Enter ${labelOf(graph, u)} at depth ${depth[u]}. Push it on the stack.`,
        fields: [
          { label: "Current", value: labelOf(graph, u), tone: "accent" },
          { label: "Depth", value: `${depth[u]}`, tone: "active" },
          { label: "Parent", value: labelOf(graph, parent[u] ?? null) },
          { label: "Stack Depth", value: `${stack.length}` },
          { label: "Traversal Order", value: order.map((id) => labelOf(graph, id)).join(" ") },
        ],
        extra: snapshot(u, viaEdge),
        codeLine: 1,
        count: "visits",
      });

      if (goal && u === goal) {
        reachedGoal = true;
        return;
      }

      for (const { node: v, edge } of adjacency.get(u) ?? []) {
        if (reachedGoal) return;

        if (seen.has(v)) {
          rec.record({
            op: { type: "reject-edge", edge: edge.id, node: v },
            phase: "EXPANDING",
            explanation: `${labelOf(graph, v)} is already on the visited set — do not recurse into it.`,
            fields: [
              { label: "Current", value: labelOf(graph, u), tone: "accent" },
              { label: "Neighbour", value: labelOf(graph, v) },
              { label: "Decision", value: "already visited", tone: "muted" },
            ],
            extra: snapshot(u, edge.id),
            codeLine: 3,
          });
          continue;
        }

        parent[v] = u;
        depth[v] = depth[u] + 1;

        rec.record({
          op: { type: "discover", node: v, via: u, edge: edge.id },
          phase: "DISCOVERED",
          explanation: `Descend from ${labelOf(graph, u)} into ${labelOf(graph, v)}.`,
          fields: [
            { label: "Current", value: labelOf(graph, u) },
            { label: "Descending Into", value: labelOf(graph, v), tone: "good" },
            { label: "Depth", value: `${depth[v]}`, tone: "active" },
            { label: "Stack Depth", value: `${stack.length}` },
          ],
          extra: snapshot(u, edge.id),
          codeLine: 5,
          count: "relaxations",
        });

        visit(v, edge.id);
      }

      if (reachedGoal) return;

      stack.pop();
      finished.push(u);

      rec.record({
        op: { type: "settle", node: u },
        phase: "VISITED",
        explanation: `${labelOf(graph, u)} has no unexplored neighbours left — backtrack to ${labelOf(
          graph,
          parent[u] ?? null,
        )}.`,
        fields: [
          { label: "Finished", value: labelOf(graph, u), tone: "good" },
          { label: "Backtrack To", value: labelOf(graph, parent[u] ?? null), tone: "active" },
          { label: "Stack Depth", value: `${stack.length}` },
        ],
        extra: snapshot(stack[stack.length - 1] ?? null, null),
        codeLine: 7,
      });
    };

    visit(start, null);

    if (goal && reachedGoal) {
      const path = tracePath(parent, start, goal) ?? [];
      rec.record({
        op: { type: "path", nodes: path, edges: pathEdgeIds(graph, path) },
        phase: "PATH",
        explanation: `Reached ${labelOf(graph, goal)} via ${path
          .map((id) => labelOf(graph, id))
          .join(" → ")}. Depth-first order does not guarantee this is the shortest path.`,
        fields: [
          { label: "Goal", value: labelOf(graph, goal), tone: "good" },
          { label: "Path Edges", value: `${Math.max(0, path.length - 1)}` },
          { label: "Nodes Entered", value: `${order.length}` },
        ],
        extra: snapshot(null, null, path, pathEdgeIds(graph, path)),
        codeLine: 8,
      });
      return rec.done();
    }

    rec.record({
      op: { type: "idle" },
      phase: goal ? "UNREACHABLE" : "COMPLETE",
      explanation: goal
        ? `${labelOf(graph, goal)} is not reachable from ${labelOf(graph, start)}.`
        : `Traversal complete. Order: ${order.map((id) => labelOf(graph, id)).join(" → ")}.`,
      fields: [
        { label: "Status", value: goal ? "unreachable" : "complete", tone: goal ? "warn" : "good" },
        { label: "Reached", value: `${seen.size} / ${graph.nodes.length}` },
        { label: "Traversal Order", value: order.map((id) => labelOf(graph, id)).join(" ") || "—" },
      ],
      extra: snapshot(null, null),
      codeLine: 8,
    });

    return rec.done();
  },
};
