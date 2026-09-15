import { StepRecorder } from "../core/recorder";
import {
  cloneTree,
  findParent,
  treeHeight,
  treeSize,
  type BstNode,
  type TreeAlgorithm,
  type TreeExtra,
  type TreeOp,
} from "./model";

const insertPseudocode = [
  "function insert(root, value) {",
  "  if (root === null) return new Node(value);",
  "  let node = root;",
  "  while (true) {",
  "    if (value === node.value) return root;   // no duplicates",
  "    if (value < node.value) {",
  "      if (!node.left) return (node.left = new Node(value));",
  "      node = node.left;",
  "    } else {",
  "      if (!node.right) return (node.right = new Node(value));",
  "      node = node.right;",
  "    }",
  "  }",
  "}",
];

const searchPseudocode = [
  "function search(root, target) {",
  "  let node = root;",
  "  while (node !== null) {",
  "    if (target === node.value) return node;",
  "    node = target < node.value ? node.left : node.right;",
  "  }",
  "  return null;",
  "}",
];

const deletePseudocode = [
  "function remove(root, value) {",
  "  const node = find(root, value);",
  "  if (!node) return root;",
  "  if (!node.left || !node.right) {",
  "    splice(node, node.left ?? node.right);",
  "  } else {",
  "    const s = min(node.right);   // in-order successor",
  "    node.value = s.value;",
  "    splice(s, s.right);",
  "  }",
  "  return root;",
  "}",
];

export const bstInsert: TreeAlgorithm = {
  id: "bst-insert",
  name: "BST Insert",
  category: "trees",
  lab: "trees",
  complexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(n)",
    space: "O(1)",
  },
  growth: "log n",
  description:
    "Walks down from the root, going left for smaller values and right for larger, and attaches the new node at the first empty slot.",
  howItWorks:
    "The comparison at each node halves the remaining subtree only if the tree is balanced. Insert an ascending sequence and every value goes right, degrading the tree into a linked list where operations cost O(n) — which is exactly what self-balancing trees exist to prevent.",
  pseudocode: insertPseudocode,

  validate({ tree, value }) {
    if (!Number.isFinite(value)) return "Enter a numeric value to insert.";
    const exists = Object.values(tree.nodes).some((node) => node.value === value);
    if (exists) {
      return `${value} is already in the tree. A binary search tree holds distinct keys — try another value.`;
    }
    return null;
  },

  generate({ tree, value }) {
    const rec = new StepRecorder<TreeOp, TreeExtra>();
    const working = cloneTree(tree);
    const path: number[] = [];

    const snapshot = (current: number | null, found: number | null = null): TreeExtra => ({
      tree: cloneTree(working),
      path: [...path],
      visited: [...path],
      output: [],
      frontier: [],
      frontierLabel: "SEARCH PATH",
      current,
      found,
    });

    if (working.root === null) {
      const node = { id: working.nextId, value, left: null, right: null };
      working.nextId += 1;
      working.nodes[node.id] = node;
      working.root = node.id;

      rec.record({
        op: { type: "attach", parent: null, id: node.id, side: "root" },
        phase: "INSERTED",
        explanation: `The tree was empty, so ${value} becomes the root.`,
        fields: [
          { label: "Inserted", value: `${value}`, tone: "good" },
          { label: "Position", value: "root" },
          { label: "Tree Size", value: "1" },
        ],
        extra: snapshot(node.id, node.id),
        codeLine: 1,
        count: "writes",
      });
      return rec.done();
    }

    let cursorId = working.root;
    let depth = 0;

    for (;;) {
      const cursor = working.nodes[cursorId];
      path.push(cursorId);

      rec.record({
        op: { type: "visit", id: cursorId },
        phase: "TRAVERSING",
        explanation: `At node ${cursor.value} (depth ${depth}).`,
        fields: [
          { label: "Inserting", value: `${value}`, tone: "accent" },
          { label: "Current Node", value: `${cursor.value}`, tone: "active" },
          { label: "Depth", value: `${depth}` },
          { label: "Path", value: path.map((id) => working.nodes[id].value).join(" → ") },
        ],
        extra: snapshot(cursorId),
        codeLine: 3,
      });

      const goLeft = value < cursor.value;

      rec.record({
        op: { type: "compare", id: cursorId, direction: goLeft ? "left" : "right" },
        phase: "COMPARING",
        explanation: `${value} ${goLeft ? "<" : ">"} ${cursor.value} — go ${goLeft ? "left" : "right"}.`,
        fields: [
          { label: "Inserting", value: `${value}`, tone: "accent" },
          { label: "Comparing With", value: `${cursor.value}` },
          {
            label: "Decision",
            value: `${value} ${goLeft ? "<" : ">"} ${cursor.value} · ${goLeft ? "left" : "right"}`,
            tone: "active",
          },
          { label: "Depth", value: `${depth}` },
        ],
        extra: snapshot(cursorId),
        codeLine: goLeft ? 5 : 8,
        count: "comparisons",
      });

      const childId = goLeft ? cursor.left : cursor.right;

      if (childId === null) {
        const node = { id: working.nextId, value, left: null, right: null };
        working.nextId += 1;
        working.nodes[node.id] = node;
        if (goLeft) cursor.left = node.id;
        else cursor.right = node.id;

        rec.record({
          op: {
            type: "attach",
            parent: cursorId,
            id: node.id,
            side: goLeft ? "left" : "right",
          },
          phase: "INSERTED",
          explanation: `${cursor.value} has no ${goLeft ? "left" : "right"} child, so ${value} is attached there.`,
          fields: [
            { label: "Inserted", value: `${value}`, tone: "good" },
            { label: "Parent", value: `${cursor.value}` },
            { label: "Side", value: goLeft ? "left" : "right" },
            { label: "Depth", value: `${depth + 1}` },
            { label: "Tree Size", value: `${treeSize(working)}` },
            { label: "Height", value: `${treeHeight(working)}` },
          ],
          extra: snapshot(node.id, node.id),
          codeLine: goLeft ? 6 : 9,
          count: "writes",
        });
        return rec.done();
      }

      cursorId = childId;
      depth += 1;
    }
  },
};

export const bstSearch: TreeAlgorithm = {
  id: "bst-search",
  name: "BST Search",
  category: "trees",
  lab: "trees",
  complexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(n)",
    space: "O(1)",
  },
  growth: "log n",
  description:
    "Follows a single root-to-leaf path, using one comparison per level to decide which way to go.",
  howItWorks:
    "Each comparison discards an entire subtree, so the work is proportional to the tree's height rather than its size. Height is log n when balanced and n in the worst case, which is why the same search can cost wildly different amounts on trees holding identical values.",
  pseudocode: searchPseudocode,

  validate({ value }) {
    return Number.isFinite(value) ? null : "Enter a numeric value to search for.";
  },

  generate({ tree, value }) {
    const rec = new StepRecorder<TreeOp, TreeExtra>();
    const path: number[] = [];

    const snapshot = (current: number | null, found: number | null = null): TreeExtra => ({
      tree: cloneTree(tree),
      path: [...path],
      visited: [...path],
      output: [],
      frontier: [],
      frontierLabel: "SEARCH PATH",
      current,
      found,
    });

    if (tree.root === null) {
      rec.record({
        op: { type: "missing", value },
        phase: "NOT FOUND",
        explanation: "The tree is empty, so nothing can be found.",
        fields: [{ label: "Result", value: "not found", tone: "warn" }],
        extra: snapshot(null),
        codeLine: 6,
      });
      return rec.done();
    }

    let cursorId: number | null = tree.root;
    let depth = 0;

    while (cursorId !== null) {
      const cursor: BstNode = tree.nodes[cursorId];
      path.push(cursorId);

      rec.record({
        op: { type: "visit", id: cursorId },
        phase: "TRAVERSING",
        explanation: `Examine node ${cursor.value} at depth ${depth}.`,
        fields: [
          { label: "Target", value: `${value}`, tone: "accent" },
          { label: "Current Node", value: `${cursor.value}`, tone: "active" },
          { label: "Depth", value: `${depth}` },
          { label: "Comparisons", value: `${depth}` },
        ],
        extra: snapshot(cursorId),
        codeLine: 2,
      });

      if (cursor.value === value) {
        rec.record({
          op: { type: "compare", id: cursorId, direction: "equal" },
          phase: "COMPARING",
          explanation: `${value} = ${cursor.value} — match.`,
          fields: [
            { label: "Target", value: `${value}`, tone: "accent" },
            { label: "Decision", value: `${value} = ${cursor.value}`, tone: "good" },
          ],
          extra: snapshot(cursorId),
          codeLine: 3,
          count: "comparisons",
        });

        rec.record({
          op: { type: "found", id: cursorId },
          phase: "FOUND",
          explanation: `Found ${value} at depth ${depth} after ${depth + 1} ${
            depth === 0 ? "comparison" : "comparisons"
          }.`,
          fields: [
            { label: "Result", value: "found", tone: "good" },
            { label: "Depth", value: `${depth}`, tone: "good" },
            { label: "Path", value: path.map((id) => tree.nodes[id].value).join(" → ") },
          ],
          extra: snapshot(cursorId, cursorId),
          codeLine: 3,
        });
        return rec.done();
      }

      const goLeft = value < cursor.value;
      const nextId: number | null = goLeft ? cursor.left : cursor.right;

      rec.record({
        op: { type: "compare", id: cursorId, direction: goLeft ? "left" : "right" },
        phase: "COMPARING",
        explanation: `${value} ${goLeft ? "<" : ">"} ${cursor.value} — ${
          nextId === null
            ? `but there is no ${goLeft ? "left" : "right"} child, so ${value} is not in the tree.`
            : `descend ${goLeft ? "left" : "right"}.`
        }`,
        fields: [
          { label: "Target", value: `${value}`, tone: "accent" },
          { label: "Comparing With", value: `${cursor.value}` },
          {
            label: "Decision",
            value: `${value} ${goLeft ? "<" : ">"} ${cursor.value} · ${goLeft ? "left" : "right"}`,
            tone: "active",
          },
          {
            label: "Subtree Skipped",
            value: goLeft ? "right subtree" : "left subtree",
            tone: "muted",
          },
        ],
        extra: snapshot(cursorId),
        codeLine: 4,
        count: "comparisons",
      });

      cursorId = nextId;
      depth += 1;
    }

    rec.record({
      op: { type: "missing", value },
      phase: "NOT FOUND",
      explanation: `The path ran off the bottom of the tree — ${value} is not present. ${depth} ${
        depth === 1 ? "comparison was" : "comparisons were"
      } enough to rule out all ${treeSize(tree)} nodes.`,
      fields: [
        { label: "Result", value: "not found", tone: "warn" },
        { label: "Comparisons", value: `${depth}` },
        { label: "Tree Size", value: `${treeSize(tree)}` },
      ],
      extra: snapshot(null),
      codeLine: 6,
    });

    return rec.done();
  },
};

export const bstDelete: TreeAlgorithm = {
  id: "bst-delete",
  name: "BST Delete",
  category: "trees",
  lab: "trees",
  complexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(n)",
    space: "O(1)",
  },
  growth: "log n",
  description:
    "Finds the node, then removes it — splicing it out when it has at most one child, or promoting its in-order successor when it has two.",
  howItWorks:
    "The two-child case is the interesting one. The in-order successor is the smallest value in the right subtree, so it is larger than everything on the left and smaller than everything else on the right: exactly the property the vacated slot requires. It also has no left child, which makes removing it the easy case.",
  pseudocode: deletePseudocode,

  validate({ tree, value }) {
    if (!Number.isFinite(value)) return "Enter a numeric value to delete.";
    const exists = Object.values(tree.nodes).some((node) => node.value === value);
    if (!exists) return `${value} is not in the tree, so there is nothing to delete.`;
    return null;
  },

  generate({ tree, value }) {
    const rec = new StepRecorder<TreeOp, TreeExtra>();
    const working = cloneTree(tree);
    const path: number[] = [];

    const snapshot = (current: number | null, found: number | null = null): TreeExtra => ({
      tree: cloneTree(working),
      path: [...path],
      visited: [...path],
      output: [],
      frontier: [],
      frontierLabel: "SEARCH PATH",
      current,
      found,
    });

    let targetId: number | null = working.root;
    let depth = 0;

    while (targetId !== null && working.nodes[targetId].value !== value) {
      const node = working.nodes[targetId];
      path.push(targetId);
      const goLeft = value < node.value;

      rec.record({
        op: { type: "compare", id: targetId, direction: goLeft ? "left" : "right" },
        phase: "COMPARING",
        explanation: `${value} ${goLeft ? "<" : ">"} ${node.value} — descend ${goLeft ? "left" : "right"} to find the node.`,
        fields: [
          { label: "Deleting", value: `${value}`, tone: "accent" },
          { label: "Current Node", value: `${node.value}`, tone: "active" },
          { label: "Depth", value: `${depth}` },
        ],
        extra: snapshot(targetId),
        codeLine: 1,
        count: "comparisons",
      });

      targetId = goLeft ? node.left : node.right;
      depth += 1;
    }

    if (targetId === null) {
      rec.record({
        op: { type: "missing", value },
        phase: "NOT FOUND",
        explanation: `${value} is not in the tree — nothing to delete.`,
        fields: [{ label: "Result", value: "not found", tone: "warn" }],
        extra: snapshot(null),
        codeLine: 2,
      });
      return rec.done();
    }

    path.push(targetId);
    const target = working.nodes[targetId];

    rec.record({
      op: { type: "found", id: targetId },
      phase: "FOUND",
      explanation: `Found ${value} at depth ${depth}. It has ${
        (target.left !== null ? 1 : 0) + (target.right !== null ? 1 : 0)
      } ${(target.left !== null ? 1 : 0) + (target.right !== null ? 1 : 0) === 1 ? "child" : "children"}.`,
      fields: [
        { label: "Target", value: `${value}`, tone: "accent" },
        { label: "Depth", value: `${depth}` },
        {
          label: "Children",
          value: `${(target.left !== null ? 1 : 0) + (target.right !== null ? 1 : 0)}`,
          tone: "active",
        },
      ],
      extra: snapshot(targetId, targetId),
      codeLine: 1,
    });

    const splice = (id: number, replacement: number | null) => {
      const parent = findParent(working, id);
      if (!parent) {
        working.root = replacement;
        return;
      }
      if (parent.left === id) parent.left = replacement;
      else parent.right = replacement;
    };

    if (target.left === null || target.right === null) {
      const replacement = target.left ?? target.right;
      const replacementValue = replacement === null ? null : working.nodes[replacement].value;

      splice(targetId, replacement);
      delete working.nodes[targetId];
      const removedIndex = path.indexOf(targetId);
      if (removedIndex >= 0) path.splice(removedIndex, 1);

      rec.record({
        op: { type: "remove", id: targetId },
        phase: "DELETED",
        explanation:
          replacement === null
            ? `${value} is a leaf, so it is simply detached.`
            : `${value} has one child (${replacementValue}), which takes its place.`,
        fields: [
          { label: "Deleted", value: `${value}`, tone: "good" },
          {
            label: "Case",
            value: replacement === null ? "leaf" : "one child",
            tone: "active",
          },
          { label: "Promoted", value: replacementValue === null ? "—" : `${replacementValue}` },
          { label: "Tree Size", value: `${treeSize(working)}` },
          { label: "Height", value: `${treeHeight(working)}` },
        ],
        extra: snapshot(null),
        codeLine: 4,
        count: "writes",
      });
      return rec.done();
    }

    let successorId = target.right;
    rec.record({
      op: { type: "visit", id: successorId },
      phase: "TRAVERSING",
      explanation: `Two children — find the in-order successor: the smallest value in the right subtree. Start at ${
        working.nodes[successorId].value
      }.`,
      fields: [
        { label: "Case", value: "two children", tone: "active" },
        { label: "Searching", value: "min of right subtree", tone: "accent" },
      ],
      extra: snapshot(successorId),
      codeLine: 6,
    });

    while (working.nodes[successorId].left !== null) {
      successorId = working.nodes[successorId].left!;
      rec.record({
        op: { type: "visit", id: successorId },
        phase: "TRAVERSING",
        explanation: `Keep going left — ${working.nodes[successorId].value} is smaller.`,
        fields: [
          { label: "Case", value: "two children" },
          { label: "Candidate", value: `${working.nodes[successorId].value}`, tone: "active" },
        ],
        extra: snapshot(successorId),
        codeLine: 6,
        count: "comparisons",
      });
    }

    const successorValue = working.nodes[successorId].value;
    working.nodes[targetId].value = successorValue;

    rec.record({
      op: { type: "replace", id: targetId, withValue: successorValue },
      phase: "WRITING",
      explanation: `Copy the successor ${successorValue} into the node holding ${value}. The ordering invariant still holds.`,
      fields: [
        { label: "Successor", value: `${successorValue}`, tone: "good" },
        { label: "Replaces", value: `${value}`, tone: "accent" },
      ],
      extra: snapshot(targetId, targetId),
      codeLine: 7,
      count: "writes",
    });

    const successorRight = working.nodes[successorId].right;
    splice(successorId, successorRight);
    delete working.nodes[successorId];

    rec.record({
      op: { type: "remove", id: successorId },
      phase: "DELETED",
      explanation: `Remove the successor's original node. It had no left child, so splicing it out is the easy case.`,
      fields: [
        { label: "Deleted", value: `${value}`, tone: "good" },
        { label: "Case", value: "two children", tone: "active" },
        { label: "Promoted", value: `${successorValue}` },
        { label: "Tree Size", value: `${treeSize(working)}` },
        { label: "Height", value: `${treeHeight(working)}` },
      ],
      extra: snapshot(null),
      codeLine: 8,
      count: "writes",
    });

    return rec.done();
  },
};