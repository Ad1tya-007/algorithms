import type { AlgorithmDefinition, AlgorithmStep } from "../core/types";

export interface BstNode {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
}

export interface TreeData {
  nodes: Record<number, BstNode>;
  root: number | null;
  nextId: number;
}

/**
 * Which tree algorithm runs is decided by the selected algorithm, so the input
 * only needs the tree plus the operand the user typed in.
 */
export interface TreeInput {
  tree: TreeData;
  value: number;
}

export type TreeOp =
  | { type: "visit"; id: number }
  | { type: "compare"; id: number; direction: "left" | "right" | "equal" }
  | { type: "descend"; from: number; to: number }
  | { type: "attach"; parent: number | null; id: number; side: "left" | "right" | "root" }
  | { type: "found"; id: number }
  | { type: "missing"; value: number }
  | { type: "emit"; id: number }
  | { type: "remove"; id: number }
  | { type: "replace"; id: number; withValue: number }
  | { type: "idle" };

export interface TreeExtra {
  /** The tree as it exists at this step — insert and delete reshape it. */
  tree: TreeData;
  path: number[];
  visited: number[];
  output: number[];
  frontier: number[];
  frontierLabel: string;
  current: number | null;
  found: number | null;
}

export type TreeStep = AlgorithmStep<TreeOp, TreeExtra>;
export type TreeAlgorithm = AlgorithmDefinition<TreeInput, TreeOp, TreeExtra>;

export function emptyTree(): TreeData {
  return { nodes: {}, root: null, nextId: 1 };
}

export function cloneTree(tree: TreeData): TreeData {
  const nodes: Record<number, BstNode> = {};
  for (const key of Object.keys(tree.nodes)) {
    const id = Number(key);
    nodes[id] = { ...tree.nodes[id] };
  }
  return { nodes, root: tree.root, nextId: tree.nextId };
}

export function treeSize(tree: TreeData): number {
  return Object.keys(tree.nodes).length;
}

export function treeHeight(tree: TreeData, id: number | null = tree.root): number {
  if (id === null) return 0;
  const node = tree.nodes[id];
  if (!node) return 0;
  return 1 + Math.max(treeHeight(tree, node.left), treeHeight(tree, node.right));
}

export function inOrderValues(tree: TreeData): number[] {
  const out: number[] = [];
  const walk = (id: number | null) => {
    if (id === null) return;
    const node = tree.nodes[id];
    if (!node) return;
    walk(node.left);
    out.push(node.value);
    walk(node.right);
  };
  walk(tree.root);
  return out;
}

export function insertValue(tree: TreeData, value: number): TreeData {
  const next = cloneTree(tree);
  const node: BstNode = { id: next.nextId, value, left: null, right: null };
  next.nextId += 1;

  if (next.root === null) {
    next.nodes[node.id] = node;
    next.root = node.id;
    return next;
  }

  let cursor = next.nodes[next.root];
  for (;;) {
    if (value === cursor.value) return tree; // duplicates are rejected
    if (value < cursor.value) {
      if (cursor.left === null) {
        cursor.left = node.id;
        next.nodes[node.id] = node;
        return next;
      }
      cursor = next.nodes[cursor.left];
    } else {
      if (cursor.right === null) {
        cursor.right = node.id;
        next.nodes[node.id] = node;
        return next;
      }
      cursor = next.nodes[cursor.right];
    }
  }
}

export function findParent(tree: TreeData, id: number): BstNode | null {
  for (const key of Object.keys(tree.nodes)) {
    const node = tree.nodes[Number(key)];
    if (node.left === id || node.right === id) return node;
  }
  return null;
}

/** Standard BST removal, including the two-child in-order successor case. */
export function deleteValue(tree: TreeData, value: number): TreeData {
  const next = cloneTree(tree);

  let currentId = next.root;
  while (currentId !== null && next.nodes[currentId].value !== value) {
    const node = next.nodes[currentId];
    currentId = value < node.value ? node.left : node.right;
  }
  if (currentId === null) return tree;

  const detach = (id: number, replacement: number | null) => {
    const parent = findParent(next, id);
    if (!parent) {
      next.root = replacement;
      return;
    }
    if (parent.left === id) parent.left = replacement;
    else parent.right = replacement;
  };

  const target = next.nodes[currentId];

  if (target.left === null || target.right === null) {
    detach(currentId, target.left ?? target.right);
    delete next.nodes[currentId];
    return next;
  }

  let successorId = target.right;
  while (next.nodes[successorId].left !== null) {
    successorId = next.nodes[successorId].left!;
  }
  const successor = next.nodes[successorId];
  detach(successorId, successor.right);
  target.value = successor.value;
  delete next.nodes[successorId];
  return next;
}

export interface TreeLayoutNode {
  id: number;
  value: number;
  depth: number;
  /** In-order slot, used as the horizontal coordinate. */
  slot: number;
  parent: number | null;
}

export interface TreeLayout {
  nodes: TreeLayoutNode[];
  width: number;
  height: number;
}

/**
 * In-order horizontal placement: every node sits one slot right of the previous
 * node in sorted order, which guarantees no two nodes overlap and makes the BST
 * invariant visible — the tree reads left to right in ascending order.
 */
export function layoutTree(tree: TreeData): TreeLayout {
  const nodes: TreeLayoutNode[] = [];
  let slot = 0;
  let maxDepth = 0;

  const walk = (id: number | null, depth: number, parent: number | null) => {
    if (id === null) return;
    const node = tree.nodes[id];
    if (!node) return;
    walk(node.left, depth + 1, id);
    nodes.push({ id, value: node.value, depth, slot, parent });
    slot += 1;
    maxDepth = Math.max(maxDepth, depth);
    walk(node.right, depth + 1, id);
  };

  walk(tree.root, 0, null);
  return { nodes, width: Math.max(1, slot), height: maxDepth + 1 };
}
