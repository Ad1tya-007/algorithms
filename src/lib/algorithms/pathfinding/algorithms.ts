import { validateGrid, type GridAlgorithm } from "./model";
import { generateGridSearch } from "./search";

const astarPseudocode = [
  "function aStar(grid, start, goal) {",
  "  g[start] = 0;",
  "  open.push(start, h(start));",
  "  while (open.size) {",
  "    const u = open.popMin();      // lowest f = g + h",
  "    if (u === goal) return path(u);",
  "    closed.add(u);",
  "    for (const v of neighbours(u)) {",
  "      if (g[u] + cost(v) < g[v]) {",
  "        g[v] = g[u] + cost(v);",
  "        open.push(v, g[v] + h(v));",
  "      }",
  "    }",
  "  }",
  "  return null;",
  "}",
];

const dijkstraPseudocode = [
  "function dijkstra(grid, start, goal) {",
  "  g[start] = 0;",
  "  open.push(start, 0);",
  "  while (open.size) {",
  "    const u = open.popMin();      // lowest g",
  "    if (u === goal) return path(u);",
  "    closed.add(u);",
  "    for (const v of neighbours(u)) {",
  "      if (g[u] + cost(v) < g[v]) {",
  "        g[v] = g[u] + cost(v);",
  "        open.push(v, g[v]);",
  "      }",
  "    }",
  "  }",
  "  return null;",
  "}",
];

const bfsPseudocode = [
  "function bfs(grid, start, goal) {",
  "  depth[start] = 0;",
  "  const queue = [start];",
  "  while (queue.length) {",
  "    const u = queue.shift();      // first in, first out",
  "    if (u === goal) return path(u);",
  "    closed.add(u);",
  "    for (const v of neighbours(u)) {",
  "      if (seen(v)) continue;",
  "      depth[v] = depth[u] + 1;",
  "      queue.push(v);",
  "    }",
  "  }",
  "  return null;",
  "}",
];

export const gridAstar: GridAlgorithm = {
  id: "grid-astar",
  name: "A*",
  category: "pathfinding",
  lab: "pathfinding",
  complexity: {
    best: "O(b·d)",
    average: "O(E log V)",
    worst: "O(E log V)",
    space: "O(V)",
  },
  growth: "n log n",
  description:
    "Expands the cell with the lowest g + h, so the search leans toward the goal instead of spreading evenly.",
  howItWorks:
    "h is the distance to the goal ignoring walls — Manhattan for 4-way movement, octile for 8-way. Since every cell costs at least 1, h can never overestimate, and an admissible heuristic keeps the returned path optimal. Compare the size of the closed set against Dijkstra on the same grid: identical path, far fewer expansions.",
  pseudocode: astarPseudocode,
  validate: validateGrid,
  generate: ({ grid }) => generateGridSearch(grid, "astar"),
};

export const gridDijkstra: GridAlgorithm = {
  id: "grid-dijkstra",
  name: "Dijkstra",
  category: "pathfinding",
  lab: "pathfinding",
  complexity: {
    best: "O(E log V)",
    average: "O(E log V)",
    worst: "O(E log V)",
    space: "O(V)",
  },
  growth: "n log n",
  description:
    "Expands the cheapest reachable cell regardless of direction — A* with the heuristic switched off.",
  howItWorks:
    "With no heuristic the frontier grows outward in cost order, forming rings around the start that bulge inward wherever terrain is expensive. It finds the same optimal path as A* but examines many more cells, because nothing tells it which direction the goal is in.",
  pseudocode: dijkstraPseudocode,
  validate: validateGrid,
  generate: ({ grid }) => generateGridSearch(grid, "dijkstra"),
};

export const gridBfs: GridAlgorithm = {
  id: "grid-bfs",
  name: "Breadth-First Search",
  category: "pathfinding",
  lab: "pathfinding",
  complexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
    space: "O(V)",
  },
  growth: "n",
  description:
    "Explores cells in order of step count with a plain queue, treating every open cell as equally cheap.",
  howItWorks:
    "BFS finds the route with the fewest steps, which is only the cheapest route when all terrain costs are equal. Paint some expensive terrain and run it against Dijkstra: BFS will walk straight through the costly cells because its queue has no notion of cost.",
  pseudocode: bfsPseudocode,
  validate: validateGrid,
  generate: ({ grid }) => generateGridSearch(grid, "bfs"),
};
