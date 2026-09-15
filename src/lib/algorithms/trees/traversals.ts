import { StepRecorder } from "../core/recorder";
import {
  cloneTree,
  treeHeight,
  treeSize,
  type TreeAlgorithm,
  type TreeData,
  type TreeExtra,
  type TreeOp,
} from "./model";

type Order = "in" | "pre" | "post" | "level";

const RECURSIVE_PSEUDOCODE: Record<Exclude<Order, "level">, string[]> = {
  in: [
    "function inOrder(node, out) {",
    "  if (node === null) return;",
    "  inOrder(node.left, out);",
    "  out.push(node.value);   // visit between subtrees",
    "  inOrder(node.right, out);",
    "}",
  ],
  pre: [
    "function preOrder(node, out) {",
    "  if (node === null) return;",
    "  out.push(node.value);   // visit before subtrees",
    "  preOrder(node.left, out);",
    "  preOrder(node.right, out);",
    "}",
  ],
  post: [
    "function postOrder(node, out) {",
    "  if (node === null) return;",
    "  postOrder(node.left, out);",
    "  postOrder(node.right, out);",
    "  out.push(node.value);   // visit after subtrees",
    "}",
  ],
};

const LEVEL_PSEUDOCODE = [
  "function levelOrder(root, out) {",
  "  const queue = [root];",
  "  while (queue.length) {",
  "    const node = queue.shift();",
  "    out.push(node.value);",
  "    if (node.left) queue.push(node.left);",
  "    if (node.right) queue.push(node.right);",
  "  }",
  "}",
];

const EMIT_LINE: Record<Order, number> = { in: 3, pre: 2, post: 4, level: 4 };

function makeRecursiveTraversal(
  order: Exclude<Order, "level">,
  meta: {
    id: string;
    name: string;
    description: string;
    howItWorks: string;
  },
): TreeAlgorithm {
  return {
    id: meta.id,
    name: meta.name,
    category: "trees",
    lab: "trees",
    complexity: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(h)",
    },
    growth: "n",
    description: meta.description,
    howItWorks: meta.howItWorks,
    pseudocode: RECURSIVE_PSEUDOCODE[order],

    validate({ tree }) {
      return tree.root === null
        ? "The tree is empty. Insert a value or load a preset before running a traversal."
        : null;
    },

    generate({ tree }) {
      const rec = new StepRecorder<TreeOp, TreeExtra>();
      const output: number[] = [];
      const visited: number[] = [];
      const stack: number[] = [];

      const snapshot = (current: number | null): TreeExtra => ({
        tree: cloneTree(tree),
        path: [...stack],
        visited: [...visited],
        output: [...output],
        frontier: [...stack],
        frontierLabel: "CALL STACK",
        current,
        found: null,
      });

      const emit = (id: number, depth: number) => {
        const node = tree.nodes[id];
        output.push(node.value);
        visited.push(id);

        rec.record({
          op: { type: "emit", id },
          phase: "VISITED",
          explanation: `Visit ${node.value} — position ${output.length} in the ${meta.name.toLowerCase()}.`,
          fields: [
            { label: "Visiting", value: `${node.value}`, tone: "good" },
            { label: "Position", value: `${output.length} / ${treeSize(tree)}`, tone: "accent" },
            { label: "Depth", value: `${depth}` },
            { label: "Output", value: output.join(" → ") },
          ],
          extra: snapshot(id),
          codeLine: EMIT_LINE[order],
          count: "visits",
        });
      };

      const walk = (id: number | null, depth: number) => {
        if (id === null) return;
        const node = tree.nodes[id];
        stack.push(id);

        rec.record({
          op: { type: "visit", id },
          phase: "TRAVERSING",
          explanation: `Enter node ${node.value} at depth ${depth}.`,
          fields: [
            { label: "Current Node", value: `${node.value}`, tone: "active" },
            { label: "Depth", value: `${depth}` },
            { label: "Stack Depth", value: `${stack.length}` },
            { label: "Emitted", value: `${output.length} / ${treeSize(tree)}` },
          ],
          extra: snapshot(id),
          codeLine: 1,
        });

        if (order === "pre") emit(id, depth);
        walk(node.left, depth + 1);
        if (order === "in") emit(id, depth);
        walk(node.right, depth + 1);
        if (order === "post") emit(id, depth);

        stack.pop();
      };

      walk(tree.root, 0);

      rec.record({
        op: { type: "idle" },
        phase: "COMPLETE",
        explanation:
          order === "in"
            ? `Traversal complete: ${output.join(" → ")}. In-order traversal of a BST always yields sorted output.`
            : `Traversal complete: ${output.join(" → ")}.`,
        fields: [
          { label: "Status", value: "complete", tone: "good" },
          { label: "Nodes Visited", value: `${output.length}` },
          { label: "Sequence", value: output.join(" → ") },
          { label: "Tree Height", value: `${treeHeight(tree)}` },
        ],
        extra: snapshot(null),
        codeLine: RECURSIVE_PSEUDOCODE[order].length - 1,
      });

      return rec.done();
    },
  };
}

export const inOrderTraversal = makeRecursiveTraversal("in", {
  id: "traverse-in-order",
  name: "In-Order Traversal",
  description:
    "Visits the left subtree, then the node, then the right subtree — which reads a binary search tree in ascending order.",
  howItWorks:
    "Because everything smaller than a node lives to its left, visiting left-node-right emits values in sorted order. This is the traversal that makes a BST a sorted container: reading it out is linear, with no comparisons at all.",
});

export const preOrderTraversal = makeRecursiveTraversal("pre", {
  id: "traverse-pre-order",
  name: "Pre-Order Traversal",
  description: "Visits the node before its subtrees, producing a sequence that can rebuild the tree.",
  howItWorks:
    "Roots appear before their descendants, so re-inserting the output in order recreates the identical tree — which is why pre-order is the natural choice for serialising a tree structure.",
});

export const postOrderTraversal = makeRecursiveTraversal("post", {
  id: "traverse-post-order",
  name: "Post-Order Traversal",
  description: "Visits both subtrees before the node itself, so children are always handled first.",
  howItWorks:
    "Every descendant is emitted before its parent, which is exactly the order needed to free or fold a tree bottom-up: no node is processed while something still depends on it.",
});

export const levelOrderTraversal: TreeAlgorithm = {
  id: "traverse-level-order",
  name: "Level-Order Traversal",
  category: "trees",
  lab: "trees",
  complexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
    space: "O(w)",
  },
  growth: "n",
  description: "Visits the tree layer by layer using a queue — breadth-first search on a tree.",
  howItWorks:
    "A queue replaces recursion, so the traversal spreads sideways instead of downwards. Space is proportional to the widest level rather than the height, the opposite trade-off from the recursive traversals.",
  pseudocode: LEVEL_PSEUDOCODE,

  validate({ tree }: { tree: TreeData }) {
    return tree.root === null
      ? "The tree is empty. Insert a value or load a preset before running a traversal."
      : null;
  },

  generate({ tree }) {
    const rec = new StepRecorder<TreeOp, TreeExtra>();
    if (tree.root === null) return rec.done();

    const output: number[] = [];
    const visited: number[] = [];
    const queue: number[] = [tree.root];
    const depthOf: Record<number, number> = { [tree.root]: 0 };

    const snapshot = (current: number | null): TreeExtra => ({
      tree: cloneTree(tree),
      path: [],
      visited: [...visited],
      output: [...output],
      frontier: [...queue],
      frontierLabel: "QUEUE",
      current,
      found: null,
    });

    rec.record({
      op: { type: "visit", id: tree.root },
      phase: "DISCOVERED",
      explanation: `Enqueue the root ${tree.nodes[tree.root].value}.`,
      fields: [
        { label: "Queue", value: `${tree.nodes[tree.root].value}`, tone: "active" },
        { label: "Level", value: "0" },
      ],
      extra: snapshot(null),
      codeLine: 1,
    });

    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = tree.nodes[id];
      const depth = depthOf[id];
      output.push(node.value);
      visited.push(id);

      rec.record({
        op: { type: "emit", id },
        phase: "VISITED",
        explanation: `Dequeue and visit ${node.value} (level ${depth}) — position ${output.length}.`,
        fields: [
          { label: "Visiting", value: `${node.value}`, tone: "good" },
          { label: "Level", value: `${depth}`, tone: "accent" },
          { label: "Position", value: `${output.length} / ${treeSize(tree)}` },
          { label: "Queue Size", value: `${queue.length}` },
          { label: "Output", value: output.join(" → ") },
        ],
        extra: snapshot(id),
        codeLine: 4,
        count: "visits",
      });

      for (const [side, childId] of [
        ["left", node.left],
        ["right", node.right],
      ] as const) {
        if (childId === null) continue;
        depthOf[childId] = depth + 1;
        queue.push(childId);

        rec.record({
          op: { type: "descend", from: id, to: childId },
          phase: "DISCOVERED",
          explanation: `Enqueue the ${side} child ${tree.nodes[childId].value} for level ${depth + 1}.`,
          fields: [
            { label: "Enqueued", value: `${tree.nodes[childId].value}`, tone: "good" },
            { label: "Side", value: side },
            { label: "Level", value: `${depth + 1}` },
            { label: "Queue Size", value: `${queue.length}`, tone: "accent" },
          ],
          extra: snapshot(id),
          codeLine: side === "left" ? 5 : 6,
        });
      }
    }

    rec.record({
      op: { type: "idle" },
      phase: "COMPLETE",
      explanation: `Traversal complete, level by level: ${output.join(" → ")}.`,
      fields: [
        { label: "Status", value: "complete", tone: "good" },
        { label: "Nodes Visited", value: `${output.length}` },
        { label: "Sequence", value: output.join(" → ") },
        { label: "Levels", value: `${treeHeight(tree)}` },
      ],
      extra: snapshot(null),
      codeLine: 8,
    });

    return rec.done();
  },
};
