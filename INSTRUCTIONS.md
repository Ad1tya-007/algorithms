# Algorithm Observatory

Build a polished, single-page interactive web application called **Algorithm Observatory**.

The application is an interactive algorithm visualization laboratory.

The user should be able to create data structures, manipulate them, select algorithms, execute them step-by-step, and visually understand exactly what the algorithm is doing.

This should NOT feel like a typical "sorting visualizer" with bars on a screen.

It should feel like a **professional interactive computer science laboratory**.

The core experience is:

> Create → Configure → Run → Observe → Understand

The application must be contained entirely within **one page**.

---

# 1. Technology

Use:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Three.js only where it genuinely improves visualization
- React Three Fiber if a 3D visualization is used
- Zustand for application state
- Motion / Framer Motion for UI animation
- Lucide React for icons

Use the Next.js App Router.

Keep dependencies minimal.

Do not introduce a backend.

Do not introduce authentication.

Do not introduce a database.

Everything should run locally in the browser.

---

# 2. Product Vision

The user is entering an algorithm laboratory.

The application should allow them to visually construct problems and watch algorithms solve them.

Instead of:

```text
[ 4 ][ 8 ][ 2 ][ 9 ][ 1 ]

SORT
```

the experience should feel more like:

```text
┌───────────────────────────────────────────────────────────────┐
│ ALGORITHM OBSERVATORY                         ● READY         │
├───────────────┬───────────────────────────────┬───────────────┤
│               │                               │               │
│ ALGORITHMS    │                               │   INSPECTOR   │
│               │                               │               │
│ Sorting       │       VISUALIZATION           │   Current     │
│ Searching     │                               │   State       │
│ Graphs        │                               │               │
│ Trees         │                               │   Variables   │
│ Pathfinding   │                               │               │
│               │                               │               │
├───────────────┴───────────────────────────────┴───────────────┤
│ STEP BACK    ▶ PLAY    STEP FORWARD      SPEED       42 OPS  │
└───────────────────────────────────────────────────────────────┘
```

The central visualization should always be the primary focus.

---

# 3. Core Features

Focus on exactly these core experiences:

### 1. Sorting Laboratory

Visualize sorting algorithms.

### 2. Graph Laboratory

Create graphs and visualize graph algorithms.

### 3. Pathfinding Laboratory

Create a grid and visualize pathfinding.

### 4. Data Structure Laboratory

Visualize trees and common data-structure operations.

Do not expand into dozens of unrelated algorithms.

The goal is depth and polish rather than quantity.

---

# 4. Single Page Architecture

There must be only one main route:

```text
/
```

Do not create separate pages for:

```text
/sorting
/graphs
/pathfinding
/trees
```

Instead, use a mode selector inside the same page.

The URL does not need to change.

---

# 5. Visual Design

The application should feel like:

- a scientific laboratory
- a developer tool
- a sophisticated IDE
- a data visualization environment

Design language:

```text
Dark
Minimal
Technical
Precise
Premium
Dense but readable
```

Use:

- dark background
- translucent floating panels
- subtle borders
- backdrop blur
- restrained accent colors
- monospace typography for algorithm/data output
- clean sans-serif typography for navigation
- subtle animations

Avoid:

- generic SaaS cards
- excessive gradients
- giant headings
- excessive neon
- unnecessary glassmorphism
- childish educational visuals

The interface should look like a tool a serious developer might actually use.

---

# 6. Layout

Use a full-screen layout.

Suggested structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ ALGORITHM OBSERVATORY             MODE       ● READY         │
├──────────────┬────────────────────────────────┬──────────────┤
│              │                                │              │
│ ALGORITHM    │                                │   INSPECTOR  │
│ LIBRARY      │        MAIN CANVAS             │              │
│              │                                │              │
│ Sorting      │                                │ State        │
│ Searching    │                                │ Variables    │
│ Graphs       │                                │ Complexity   │
│ Pathfinding  │                                │              │
│ Trees        │                                │              │
│              │                                │              │
├──────────────┴────────────────────────────────┴──────────────┤
│ DATASET │ STEP CONTROLS │ PLAYBACK │ SPEED │ OPERATIONS      │
└──────────────────────────────────────────────────────────────┘
```

The center should occupy roughly 65–75% of the available visual area.

The left panel controls the algorithm.

The right panel explains what is happening.

The bottom controls execution.

---

# 7. Algorithm Library

The left sidebar should contain algorithm categories.

```text
ALGORITHMS

SORTING
  Bubble Sort
  Selection Sort
  Insertion Sort
  Merge Sort
  Quick Sort
  Heap Sort

SEARCH
  Linear Search
  Binary Search

GRAPH
  BFS
  DFS
  Dijkstra
  A*

PATHFINDING
  A*
  Dijkstra
  BFS

TREES
  BST Insert
  BST Search
  BST Delete
  Tree Traversal
```

Do not implement every item immediately.

Build the architecture so algorithms can be added easily.

Initial implementation priority:

```text
Bubble Sort
Merge Sort
Quick Sort

Binary Search

BFS
DFS
Dijkstra

A*

BST Insert
BST Search
In-order Traversal
```

---

# 8. Algorithm Selection

Selecting an algorithm should update the entire laboratory context.

For example:

```text
QUICK SORT

Average: O(n log n)
Worst:   O(n²)
Space:   O(log n)
```

The visualization should update accordingly.

Show a short explanation:

```text
Quick Sort repeatedly selects a pivot
and partitions the array around it.
```

Keep explanations concise.

The application is for visualization, not a textbook.

---

# 9. Sorting Laboratory

Create a high-quality sorting visualization.

The array should be displayed as vertical bars.

Example:

```text
               █
       █       █
 █     █       █
 █  █  █   █   █
 █  █  █   █   █
────────────────────
```

Each bar represents one value.

Allow the user to control:

```text
Array Size
Value Range
Initial Order
```

Initial order presets:

```text
Random
Sorted
Reverse Sorted
Nearly Sorted
Few Unique
```

---

# 10. Sorting Interaction

During execution:

- compared elements should visibly react
- swapped elements should animate
- sorted elements should become visually distinct
- pivot should be highlighted
- active range should be visible
- recursion boundaries should be shown for recursive algorithms

Do not simply move bars instantly.

The user should understand the operation.

---

# 11. Sorting Step System

Every algorithm must generate explicit operations.

Do NOT tightly couple the algorithm implementation to React rendering.

Create an intermediate operation model.

Example:

```ts
type AlgorithmOperation =
  | {
      type: 'compare';
      indices: [number, number];
    }
  | {
      type: 'swap';
      indices: [number, number];
    }
  | {
      type: 'overwrite';
      index: number;
      value: number;
    }
  | {
      type: 'mark-sorted';
      index: number;
    }
  | {
      type: 'pivot';
      index: number;
    }
  | {
      type: 'range';
      start: number;
      end: number;
    };
```

The algorithm produces operations.

The visualization consumes operations.

This separation is extremely important.

---

# 12. Playback

The user must be able to execute algorithms in multiple ways.

Controls:

```text
⏮ Reset

◀ Step Back

▶ Play

Step Forward ▶

⏭ Finish
```

Also support:

```text
Space
```

to play/pause.

Allow playback speed:

```text
0.25x
0.5x
1x
2x
4x
8x
```

The user should be able to pause at any moment.

---

# 13. Operation Counter

Display:

```text
OPERATIONS

1,482
```

Break down operations:

```text
Comparisons     842
Swaps           392
Writes          248
```

Update these live.

---

# 14. Complexity Panel

The right inspector should show:

```text
QUICK SORT

TIME

Best       O(n log n)
Average    O(n log n)
Worst      O(n²)

SPACE

O(log n)
```

Also show live execution information:

```text
ARRAY SIZE
64

CURRENT STEP
182 / 1,204

COMPARISONS
102

SWAPS
47
```

Do not claim the visual operation count is equivalent to actual CPU operations.

Label it:

```text
VISUALIZATION OPERATIONS
```

---

# 15. Array Manipulation

The user should be able to edit the dataset before running an algorithm.

Controls:

```text
Generate
Shuffle
Reverse
Sort
Randomize
```

Allow direct manipulation.

Clicking a bar should select it.

The inspector should show:

```text
INDEX
17

VALUE
82
```

Allow editing the value.

---

# 16. Graph Laboratory

The graph laboratory should be one of the most impressive parts of the application.

Display a node-edge graph on the main canvas.

Example:

```text
       A
      / \
     /   \
    B     C
   / \     \
  D   E     F
```

Nodes should be interactive.

Edges should be visible and animated.

---

# 17. Graph Creation

Allow the user to create a graph manually.

Interaction:

```text
Click empty canvas
→ Create node

Drag from node → another node
→ Create edge
```

Node creation should animate in.

Edge creation should animate in.

Allow deleting:

```text
Node
Edge
```

with keyboard Delete.

---

# 18. Graph Configuration

Allow:

```text
Directed / Undirected

Weighted / Unweighted

Allow Cycles

Node Count

Edge Density
```

Presets:

```text
Random
Tree
Dense
Sparse
DAG
Grid
```

---

# 19. Graph Node Inspector

Selecting a node shows:

```text
NODE

A

ID
A

DISTANCE
14

VISITED
YES

PARENT
C

QUEUE POSITION
3
```

Values should update while the algorithm runs.

---

# 20. Graph Edge Inspector

Selecting an edge:

```text
EDGE

A → B

WEIGHT
12

DIRECTED
YES
```

Allow weight editing.

---

# 21. BFS Visualization

For BFS, visualize:

```text
QUEUE

[A, B, C, F]
```

Show:

```text
Current Node
Visited Nodes
Queue
Parent Map
```

Animate the algorithm's progression.

When a node is discovered:

```text
DISCOVERED
```

When processed:

```text
EXPANDED
```

When finished:

```text
COMPLETE
```

Use distinct but restrained visual states.

---

# 22. DFS Visualization

For DFS, show:

```text
STACK

[A, B, D]
```

Also show:

```text
Current Node
Visited Nodes
Parent
Traversal Order
```

Animate traversal.

---

# 23. Dijkstra

For weighted graphs, show:

```text
DISTANCES

A    0
B    4
C    7
D    12
E    ∞
```

Visually display shortest-path updates.

When a distance changes, animate:

```text
∞ → 12
12 → 9
9 → 7
```

Show the currently selected minimum-distance node.

---

# 24. Pathfinding Laboratory

Create a grid-based environment.

Example:

```text
S . . . . . #
# # # . # . #
. . . . # . E
```

Where:

```text
S = Start
E = End
# = Wall
. = Empty
```

The user should be able to draw walls with the mouse.

---

# 25. Pathfinding Controls

Allow:

```text
Grid Size
Wall Density
Diagonal Movement
Weighted Terrain
```

Tools:

```text
Draw Wall
Erase Wall
Place Start
Place End
Random Maze
Clear
```

---

# 26. A\* Visualization

During A\*:

Show:

```text
OPEN SET
CLOSED SET
CURRENT NODE
G COST
H COST
F COST
```

When hovering/selecting a grid cell:

```text
G: 12
H: 18
F: 30
```

The user should be able to understand why the algorithm selected a particular cell.

---

# 27. Weighted Terrain

Allow cells to have different traversal costs.

Example:

```text
1x
2x
5x
10x
```

Visualize them subtly.

A\* should prefer cheaper terrain when appropriate.

---

# 28. Tree Laboratory

Create an interactive Binary Search Tree.

Example:

```text
             50
           /    \
         25      75
        /  \    /  \
      10   30  60   90
```

Nodes should animate when inserted.

---

# 29. Tree Operations

Controls:

```text
Insert
Search
Delete
Randomize
Clear
```

The user enters:

```text
Value: 42
```

Then presses:

```text
INSERT
```

The traversal path should animate.

Example:

```text
50
 ↓
25
 ↓
30
 ↓
42
```

---

# 30. Tree Traversals

Support:

```text
In-order
Pre-order
Post-order
Level-order
```

Show the traversal sequence:

```text
10 → 25 → 30 → 42 → 50 → 60 → 75 → 90
```

Highlight the node currently being visited.

---

# 31. Algorithm State Inspector

This is one of the most important features.

The right panel should not merely show statistics.

It should expose the algorithm's actual state.

For example, during binary search:

```text
BINARY SEARCH

Target
42

Low
0

Mid
16

High
31

Array[Mid]
37

Decision
42 > 37

Next Range
17 → 31
```

For Dijkstra:

```text
DIJKSTRA

Current
C

Priority Queue
B: 4
D: 8
F: 12

Distances
A: 0
B: 4
C: 7
D: 8
F: 12
```

For Quick Sort:

```text
QUICK SORT

Range
12 → 31

Pivot
18

Left Pointer
14

Right Pointer
27
```

This makes the project much more educational and technically interesting.

---

# 32. Code View

Add an optional code panel.

Button:

```text
</> SHOW CODE
```

When opened, show pseudocode or TypeScript implementation for the selected algorithm.

Example:

```text
function binarySearch(array, target) {
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid = ...
  }
}
```

Highlight the currently executing logical section.

For example:

```text
while (low <= high)
```

gets highlighted while that step is active.

Do not attempt to execute arbitrary user code.

The code view is illustrative.

---

# 33. Algorithm Explanation

Provide a compact explanation panel.

Example:

```text
HOW IT WORKS

Binary Search repeatedly divides
the search interval in half.

Because the array is sorted,
half of the remaining elements
can be eliminated after each comparison.
```

Keep this contextual.

The user should learn from observing the visualization.

---

# 34. Complexity Visualization

Instead of only writing:

```text
O(n log n)
```

show a small visual complexity chart.

Compare:

```text
O(1)
O(log n)
O(n)
O(n log n)
O(n²)
```

The selected algorithm should be highlighted.

Keep the chart small.

Do not make it dominate the UI.

---

# 35. Dataset Presets

Provide useful presets.

Sorting:

```text
Random
Nearly Sorted
Reverse
Few Unique
Mountain
Wave
```

Graph:

```text
Tree
DAG
Dense
Sparse
Grid
Random
```

Pathfinding:

```text
Open
Maze
Spiral
Rooms
Random
```

Trees:

```text
Balanced
Left Heavy
Right Heavy
Random
```

---

# 36. Random Seed

Every generated dataset should use a seed.

Show:

```text
SEED
849201
```

Allow:

```text
Randomize Seed
```

This makes experiments reproducible.

Example:

```text
Seed: 849201
Algorithm: Quick Sort
Array Size: 64
```

Reloading the same configuration should produce the same dataset.

---

# 37. Experiment Mode

Add an elegant button:

```text
NEW EXPERIMENT
```

This resets the environment and lets the user quickly choose:

```text
Sorting
Graph
Pathfinding
Trees
```

Do not navigate away.

---

# 38. Comparison Mode

This can be implemented after the core system works.

Allow the user to compare two algorithms on the same dataset.

Example:

```text
QUICK SORT                 MERGE SORT

1,204 operations          1,011 operations

comparisons               comparisons
swaps                     writes
```

Both visualizations should run side-by-side.

Keep this feature secondary.

Do not sacrifice the main experience for it.

---

# 39. Command Palette

Add:

```text
⌘ K
```

to open a command palette.

Commands:

```text
New Experiment
Sorting Laboratory
Graph Laboratory
Pathfinding Laboratory
Tree Laboratory

Generate Dataset
Randomize
Run
Pause
Reset
Step Forward
Step Back

Show Code
Show Complexity
Toggle Inspector
Toggle Cinematic Mode
```

Use keyboard navigation.

---

# 40. Keyboard Shortcuts

Implement:

```text
Space
Play / Pause

→
Step Forward

←
Step Back

R
Reset

G
Generate

⌘ K
Command Palette

Delete
Delete selected node/object

Esc
Deselect
```

Display shortcuts in tooltips.

---

# 41. Undo / Redo

Implement undo/redo for user modifications.

Examples:

```text
Add node
Delete node
Move node
Add edge
Delete edge
Change weight
Modify array value
Add wall
Remove wall
```

Keyboard:

```text
⌘ Z
⌘ Shift Z
```

Do not necessarily undo algorithm playback state.

Focus undo/redo on user-created data.

---

# 42. Camera and Canvas

For graph visualization:

Support:

- pan
- zoom
- fit graph
- center selected node

For pathfinding:

Support:

- zoom
- pan
- fit grid

For sorting:

Keep the camera fixed.

For trees:

Support:

- zoom
- pan
- center tree

Transitions should be smooth.

---

# 43. Object Selection

Everything interactive should have a selection state.

Selected:

```text
Node
Edge
Array element
Grid cell
Tree node
```

The selection should appear in the inspector.

Do not use browser alerts.

---

# 44. Animation Principles

Animations should communicate algorithmic state.

Good:

```text
Compare A ↔ B
Swap A ↔ B
Discover node
Expand node
Update distance
Visit tree node
```

Bad:

```text
Random floating UI
Excessive spinning
Unnecessary transitions
```

Animation speed must respect the selected playback speed.

---

# 45. Data Architecture

Create a generic algorithm execution architecture.

The most important abstraction is:

```ts
AlgorithmEngine;
```

Algorithms should produce deterministic steps.

For example:

```ts
interface AlgorithmStep {
  id: number;

  operation: AlgorithmOperation;

  state: AlgorithmState;

  explanation: string;

  metrics: AlgorithmMetrics;
}
```

Then:

```text
Algorithm
   ↓
Step Generator
   ↓
AlgorithmStep[]
   ↓
Playback Engine
   ↓
Visualization
   ↓
Inspector
```

This architecture should make adding algorithms straightforward.

---

# 46. Algorithm Interface

Create a common interface.

Example:

```ts
interface AlgorithmDefinition<TInput, TState> {
  id: string;
  name: string;
  category: AlgorithmCategory;

  complexity: {
    best: string;
    average: string;
    worst: string;
    space: string;
  };

  description: string;

  createInitialState(input: TInput): TState;

  generateSteps(input: TInput): AlgorithmStep[];
}
```

Algorithms should not know anything about React.

---

# 47. Playback Engine

Create a reusable playback engine.

Responsibilities:

```text
Current step
Play/pause
Speed
Step forward
Step backward
Reset
Finish
```

The visualization should simply receive:

```text
currentStep
```

and render it.

---

# 48. State Management

Use Zustand.

Suggested stores:

```text
algorithmStore
datasetStore
playbackStore
uiStore
```

Avoid putting everything into one massive Zustand object.

Keep responsibilities clear.

---

# 49. Suggested File Structure

```text
app/
  page.tsx

components/
  observatory/
    AlgorithmObservatory.tsx

  layout/
    TopBar.tsx
    Sidebar.tsx
    BottomControls.tsx

  algorithms/
    AlgorithmLibrary.tsx
    AlgorithmCard.tsx
    AlgorithmInfo.tsx

  visualization/
    VisualizationCanvas.tsx

    sorting/
      SortingVisualizer.tsx
      ArrayBars.tsx
      SortingControls.tsx

    graph/
      GraphVisualizer.tsx
      GraphNode.tsx
      GraphEdge.tsx
      GraphControls.tsx

    pathfinding/
      GridVisualizer.tsx
      GridCell.tsx
      PathfindingControls.tsx

    trees/
      TreeVisualizer.tsx
      TreeNode.tsx
      TreeControls.tsx

  inspector/
    Inspector.tsx
    StateInspector.tsx
    ComplexityPanel.tsx
    MetricsPanel.tsx
    CodePanel.tsx

  controls/
    PlaybackControls.tsx
    SpeedControl.tsx
    DatasetControls.tsx

  command/
    CommandPalette.tsx

lib/
  algorithms/
    core/
      AlgorithmDefinition.ts
      AlgorithmStep.ts
      AlgorithmOperation.ts
      AlgorithmEngine.ts

    sorting/
      bubbleSort.ts
      mergeSort.ts
      quickSort.ts

    searching/
      binarySearch.ts

    graph/
      bfs.ts
      dfs.ts
      dijkstra.ts

    pathfinding/
      astar.ts

    trees/
      bst.ts
      traversals.ts

  datasets/
    arrays.ts
    graphs.ts
    grids.ts
    trees.ts

  utils/
    random.ts
    complexity.ts

store/
  algorithmStore.ts
  datasetStore.ts
  playbackStore.ts
  uiStore.ts
```

---

# 50. Performance

Performance is important.

Do not create excessive React components for:

```text
large arrays
large graphs
large grids
```

Use appropriate rendering techniques.

For large datasets:

- Canvas
- SVG
- DOM virtualization
- memoization

Use whichever is most appropriate.

For graphs, SVG is acceptable for moderate graph sizes because interaction and accessibility are useful.

For large graphs, consider Canvas.

Do not use Three.js simply because it looks advanced.

Use it only if 3D meaningfully improves the visualization.

---

# 51. Responsive Behavior

Desktop is the primary target.

On smaller screens:

```text
Left Sidebar
↓
Collapsible Drawer

Right Inspector
↓
Bottom Sheet

Main Visualization
↓
Full Width
```

Do not try to fit everything simultaneously on mobile.

---

# 52. Loading Experience

Use a very short startup animation.

Example:

```text
ALGORITHM OBSERVATORY

Initializing runtime...
Loading algorithm library...
Preparing visualization engine...

READY
```

Keep it under approximately 1–2 seconds.

Do not artificially delay the application.

---

# 53. Empty States

If there is no graph:

```text
NO GRAPH

Click anywhere to create a node.

Or choose a preset to generate
a graph automatically.
```

If there is no tree:

```text
EMPTY TREE

Enter a value and insert your
first node.
```

If the pathfinding grid is empty:

```text
READY

Place a start and end point
to begin.
```

---

# 54. Error Handling

Do not allow algorithm errors to crash the interface.

If an invalid operation occurs:

```text
Unable to execute algorithm.

Reset the dataset and try again.
```

For unsupported configurations:

```text
This algorithm requires a weighted graph.
```

Explain the requirement instead of silently failing.

---

# 55. Accessibility

Implement:

- keyboard navigation
- visible focus states
- semantic buttons
- tooltips
- accessible labels
- sufficient contrast
- reduced motion support

Do not make algorithm state understandable through color alone.

Use:

```text
icons
labels
patterns
text
```

where appropriate.

---

# 56. Advanced UI Details

Add small details that make the application feel premium.

Examples:

Top status:

```text
● ENGINE READY
```

During execution:

```text
● RUNNING
```

Paused:

```text
Ⅱ PAUSED
```

Completed:

```text
✓ COMPLETE
```

Show timestamps or elapsed execution time where useful.

---

# 57. Visualization State Language

Use consistent terminology.

For algorithms:

```text
UNVISITED
DISCOVERED
ACTIVE
PROCESSING
VISITED
COMPLETE
```

For sorting:

```text
UNSORTED
COMPARING
SWAPPING
SORTED
PIVOT
```

For pathfinding:

```text
UNVISITED
OPEN
CLOSED
CURRENT
PATH
WALL
```

For trees:

```text
CURRENT
COMPARING
FOUND
INSERTED
VISITED
```

---

# 58. Scientific / Technical Precision

Be careful with complexity descriptions.

For example:

Quick Sort:

```text
Best: O(n log n)
Average: O(n log n)
Worst: O(n²)
```

Merge Sort:

```text
Best: O(n log n)
Average: O(n log n)
Worst: O(n log n)
Space: O(n)
```

Do not oversimplify in a way that makes the information incorrect.

---

# 59. Educational Philosophy

The app should teach through interaction.

The user should be able to answer:

```text
What is the algorithm doing?

Why did it choose this element?

What state is it maintaining?

What changed during this step?

What is the algorithm's complexity?
```

without reading a long tutorial.

The visualization itself should answer these questions.

---

# 60. Final Experience

A user should be able to open the website and immediately:

```text
1. Pick Quick Sort
2. Generate an array
3. Press Play
4. Watch comparisons and swaps
5. Pause
6. Step through the algorithm
7. Inspect the current state
8. Read the complexity
9. Open the pseudocode
10. Try another algorithm
```

Then:

```text
Switch → Graphs

Draw nodes

Connect them

Select Dijkstra

Choose start/end

Press Play

Watch shortest-path discovery
```

Then:

```text
Switch → Pathfinding

Draw walls

Place start/end

Run A*

Watch OPEN/CLOSED sets
```

The transition between these modes should feel like changing instruments inside the same laboratory.

---

# 61. What NOT To Build

Do not add:

- authentication
- database
- backend
- user accounts
- social sharing
- comments
- leaderboards
- payments
- analytics dashboard
- blog
- multiple pages
- tutorials section
- AI chatbot
- unnecessary settings

Do not turn this into a general-purpose developer platform.

The core product is:

> **An interactive laboratory for understanding algorithms.**

---

# 62. Development Order

Build in this order.

## Phase 1 — Application Shell

Create:

- full-screen layout
- top bar
- sidebar
- central canvas
- inspector
- bottom playback controls

Do not implement algorithms yet.

---

## Phase 2 — Algorithm Engine

Create:

- AlgorithmDefinition
- AlgorithmStep
- AlgorithmOperation
- AlgorithmEngine
- PlaybackEngine

Test these independently.

---

## Phase 3 — Sorting

Implement:

- Bubble Sort
- Merge Sort
- Quick Sort

Build:

- array generator
- sorting visualizer
- operation system
- playback
- inspector

Make this experience excellent before moving on.

---

## Phase 4 — Searching

Implement:

- Binary Search

Reuse the same dataset/playback architecture.

---

## Phase 5 — Graphs

Implement:

- node creation
- edge creation
- deletion
- dragging
- graph presets
- BFS
- DFS
- Dijkstra

---

## Phase 6 — Pathfinding

Implement:

- grid
- walls
- start/end
- A\*
- Dijkstra
- BFS

---

## Phase 7 — Trees

Implement:

- BST
- insert
- search
- delete
- traversals

---

## Phase 8 — Advanced UI

Implement:

- command palette
- keyboard shortcuts
- code view
- complexity visualization
- animated metrics
- presets
- undo/redo

---

## Phase 9 — Polish

Improve:

- animation
- typography
- spacing
- transitions
- performance
- responsive behavior
- accessibility
- error handling

---

# 63. Important Engineering Principle

Do not implement each algorithm as a completely different system.

The application should be built around the idea:

```text
DATA
 ↓
ALGORITHM
 ↓
STEPS
 ↓
PLAYBACK
 ↓
VISUALIZATION
 ↓
INSPECTOR
```

This is the most important architectural decision in the entire project.

If the user selects a different algorithm, the visualization system should remain largely unchanged.

Only the algorithm-specific state and renderer should differ.

---

# 64. Final Quality Bar

The final website should demonstrate serious frontend engineering.

It should showcase:

- algorithm implementation
- data structures
- state machines
- animation
- interactive visualization
- graph manipulation
- algorithmic complexity
- state management
- performance optimization
- TypeScript architecture
- component design

It should also be visually impressive enough to work as a portfolio project.

The final reaction should be:

> "This isn't just an algorithm visualizer. This feels like an actual tool for exploring algorithms."

Build the simplest technically sound version first.

Then make the visualization exceptionally polished.

Do not sacrifice architecture for visual effects.

Do not sacrifice usability for visual effects.

The algorithm should always remain the star of the application.
