import { StepRecorder } from "../core/recorder";
import { formatDistance } from "@/lib/utils/format";
import {
  cellCost,
  describeCell,
  heuristic,
  neighbors,
  type GridData,
  type GridExtra,
  type GridOp,
  type GridStep,
} from "./model";

export type SearchStrategy = "astar" | "dijkstra" | "bfs";

/**
 * One search core for the whole pathfinding lab.
 *
 * All three algorithms are best-first searches that differ only in the priority
 * used to pick the next cell:
 *
 *   A*        f = g + h   — cost so far plus admissible estimate of the rest
 *   Dijkstra  f = g       — cost so far only (A* with h = 0)
 *   BFS       f = depth   — steps taken, ignoring terrain cost entirely
 *
 * Writing them as one generator keeps their traces directly comparable, which is
 * the point of running them on the same grid.
 */
export function generateGridSearch(grid: GridData, strategy: SearchStrategy): GridStep[] {
  const rec = new StepRecorder<GridOp, GridExtra>();
  const cells = grid.cols * grid.rows;

  const g = new Float32Array(cells).fill(Infinity);
  const depth = new Float32Array(cells).fill(Infinity);
  const parent = new Int32Array(cells).fill(-1);
  const closed = new Uint8Array(cells);

  const usesHeuristic = strategy === "astar";

  const hOf = (index: number) => (usesHeuristic ? heuristic(grid, index, grid.goal) : 0);
  const priorityOf = (index: number) =>
    strategy === "bfs" ? depth[index] : g[index] + hOf(index);

  /** Sorted-array priority queue; grids here stay small enough for this to be cheap. */
  let open: { index: number; key: number; order: number }[] = [];
  let insertions = 0;

  const push = (index: number) => {
    open.push({ index, key: priorityOf(index), order: insertions++ });
  };

  const pop = () => {
    // FIFO tie-breaking keeps BFS layers in order and makes traces deterministic.
    open.sort((a, b) => a.key - b.key || a.order - b.order);
    return open.shift();
  };

  const openCount = () => open.length;
  const closedCount = () => closed.reduce((total, value) => total + value, 0);

  const extra = (current: number | null, pathLength: number | null = null, pathCost: number | null = null): GridExtra => ({
    open: openCount(),
    closed: closedCount(),
    current,
    g: current === null ? Infinity : g[current],
    h: current === null ? Infinity : hOf(current),
    f: current === null ? Infinity : priorityOf(current),
    pathLength,
    pathCost,
  });

  g[grid.start] = 0;
  depth[grid.start] = 0;
  push(grid.start);

  rec.record({
    op: {
      type: "open",
      index: grid.start,
      g: 0,
      h: hOf(grid.start),
      f: priorityOf(grid.start),
      parent: -1,
      improved: false,
    },
    phase: "OPEN",
    explanation: `Add the start cell ${describeCell(grid, grid.start)} to the open set with g = 0${
      usesHeuristic ? ` and h = ${formatDistance(hOf(grid.start))}` : ""
    }.`,
    fields: [
      { label: "Start", value: describeCell(grid, grid.start), tone: "accent" },
      { label: "End", value: describeCell(grid, grid.goal), tone: "accent" },
      { label: "Open Set", value: "1", tone: "active" },
      { label: "Closed Set", value: "0" },
    ],
    extra: extra(grid.start),
    codeLine: 2,
  });

  let expansions = 0;

  while (open.length > 0) {
    const entry = pop();
    if (!entry) break;
    const u = entry.index;
    if (closed[u]) continue;

    closed[u] = 1;
    expansions += 1;

    const gu = g[u];
    const hu = hOf(u);

    rec.record({
      op: { type: "current", index: u },
      phase: "CURRENT",
      explanation:
        strategy === "bfs"
          ? `Dequeue ${describeCell(grid, u)} — it was discovered ${depth[u]} ${
              depth[u] === 1 ? "step" : "steps"
            } from the start.`
          : `Take ${describeCell(grid, u)} from the open set — it has the lowest ${
              usesHeuristic ? `f = ${formatDistance(gu)} + ${formatDistance(hu)}` : "cost"
            } = ${formatDistance(gu + hu)}.`,
      fields: [
        { label: "Current", value: describeCell(grid, u), tone: "accent" },
        { label: "G Cost", value: formatDistance(gu) },
        ...(usesHeuristic ? [{ label: "H Cost", value: formatDistance(hu) }] : []),
        { label: "F Cost", value: formatDistance(gu + hu), tone: "active" },
        { label: "Open Set", value: `${openCount()}` },
        { label: "Closed Set", value: `${closedCount()}` },
        { label: "Expansions", value: `${expansions}` },
      ],
      extra: extra(u),
      codeLine: 4,
      count: "visits",
    });

    if (u === grid.goal) {
      const path: number[] = [];
      let cursor = u;
      while (cursor !== -1) {
        path.push(cursor);
        cursor = parent[cursor];
      }
      path.reverse();

      rec.record({
        op: { type: "path", indices: path },
        phase: "PATH",
        explanation: `Reached the end cell. The path is ${path.length} cells long and costs ${formatDistance(
          g[u],
        )}. ${expansions} cells were expanded to find it.`,
        fields: [
          { label: "Result", value: "path found", tone: "good" },
          { label: "Path Length", value: `${path.length} cells`, tone: "good" },
          { label: "Path Cost", value: formatDistance(g[u]), tone: "good" },
          { label: "Cells Expanded", value: `${expansions}`, tone: "accent" },
          { label: "Closed Set", value: `${closedCount()}` },
        ],
        extra: extra(null, path.length, g[u]),
        codeLine: 5,
      });
      return rec.done();
    }

    rec.record({
      op: { type: "close", index: u },
      phase: "CLOSED",
      explanation: `${describeCell(grid, u)} is closed — its cost is final. Examine its neighbours.`,
      fields: [
        { label: "Closed", value: describeCell(grid, u), tone: "muted" },
        { label: "G Cost", value: formatDistance(gu) },
        { label: "Closed Set", value: `${closedCount()}` },
      ],
      extra: extra(u),
      codeLine: 6,
    });

    for (const { index: v, step } of neighbors(grid, u)) {
      if (closed[v]) continue;

      const terrain = cellCost(grid, v);
      /**
       * `g` always accumulates real traversal cost so every algorithm reports a
       * comparable path cost. Only the queue priority differs, which is how BFS
       * ends up choosing a route that ignores expensive terrain.
       */
      const candidate = g[u] + step * terrain;
      const candidateDepth = depth[u] + 1;
      const better = strategy === "bfs" ? !Number.isFinite(depth[v]) : candidate < g[v];

      if (!better) {
        rec.record({
          op: { type: "reject", index: v },
          phase: "CLOSED",
          explanation:
            strategy === "bfs"
              ? `${describeCell(grid, v)} was already discovered — breadth-first search never revisits a cell.`
              : `${describeCell(grid, v)} already has a route costing ${formatDistance(
                  g[v],
                )}, which ${formatDistance(candidate)} does not beat.`,
          fields: [
            { label: "Neighbour", value: describeCell(grid, v) },
            { label: "Candidate G", value: formatDistance(candidate) },
            { label: "Known G", value: formatDistance(g[v]) },
            { label: "Decision", value: "keep existing", tone: "muted" },
          ],
          extra: extra(u),
          codeLine: 8,
          count: "comparisons",
        });
        continue;
      }

      const improved = Number.isFinite(g[v]);
      const previous = g[v];
      g[v] = candidate;
      depth[v] = candidateDepth;
      parent[v] = u;
      push(v);

      const hv = hOf(v);
      rec.record({
        op: {
          type: "open",
          index: v,
          g: candidate,
          h: hv,
          f: candidate + hv,
          parent: u,
          improved,
        },
        phase: "OPEN",
        explanation: improved
          ? `Found a cheaper route to ${describeCell(grid, v)}: ${formatDistance(
              previous,
            )} → ${formatDistance(candidate)}.`
          : `Open ${describeCell(grid, v)} with g = ${formatDistance(candidate)}${
              terrain > 1 ? ` (terrain ×${terrain})` : ""
            }${usesHeuristic ? `, h = ${formatDistance(hv)}, f = ${formatDistance(candidate + hv)}` : ""}.`,
        fields: [
          { label: improved ? "Improved" : "Opened", value: describeCell(grid, v), tone: "good" },
          { label: "G Cost", value: formatDistance(candidate) },
          ...(usesHeuristic ? [{ label: "H Cost", value: formatDistance(hv) }] : []),
          { label: "F Cost", value: formatDistance(candidate + hv), tone: "active" },
          ...(terrain > 1 ? [{ label: "Terrain", value: `×${terrain}`, tone: "warn" as const }] : []),
          { label: "Open Set", value: `${openCount()}`, tone: "accent" },
        ],
        extra: extra(u),
        codeLine: 9,
        count: "relaxations",
      });
    }
  }

  rec.record({
    op: { type: "idle" },
    phase: "UNREACHABLE",
    explanation: `The open set is empty and the end cell was never reached — the walls block every route. ${expansions} cells were expanded.`,
    fields: [
      { label: "Result", value: "no path", tone: "warn" },
      { label: "Cells Expanded", value: `${expansions}` },
      { label: "Closed Set", value: `${closedCount()}` },
    ],
    extra: extra(null),
    codeLine: 12,
  });

  return rec.done();
}
