"use client";

import type { TreeExtra } from "@/lib/algorithms/trees/model";
import { layoutTree } from "@/lib/algorithms/trees/model";
import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";
export function TreeVisualizer() {
  const tree = useDatasetStore((s) => s.tree);
  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const step = index >= 0 ? steps[index] : null;
  const extra = (step?.extra as TreeExtra | undefined) ?? null;
  const displayTree = extra?.tree ?? tree;

  const select = useUiStore((s) => s.select);
  const selection = useUiStore((s) => s.selection);

  const layout = layoutTree(displayTree);

  if (displayTree.root === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="label mb-2">Empty tree</p>
        <p className="max-w-xs text-sm text-ink-dim">
          Enter a value and insert your first node, or load a preset.
        </p>
      </div>
    );
  }

  const pos = (slot: number, depth: number) => ({
    x: layout.width <= 1 ? 0.5 : 0.08 + (slot / (layout.width - 1)) * 0.84,
    y: 0.08 + (depth / Math.max(1, layout.height - 1)) * 0.84,
  });

  const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));

  return (
    <svg className="h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet">
      {layout.nodes.map((node) => {
        if (node.parent === null) return null;
        const parent = nodeById.get(node.parent);
        if (!parent) return null;
        const a = pos(parent.slot, parent.depth);
        const b = pos(node.slot, node.depth);
        return (
          <line
            key={`e-${node.id}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--color-line-strong)"
            strokeWidth={0.002}
          />
        );
      })}

      {layout.nodes.map((node) => {
        const { x, y } = pos(node.slot, node.depth);
        const current = extra?.current === node.id;
        const visited = extra?.visited.includes(node.id);
        const onPath = extra?.path.includes(node.id);
        const selected = selection.kind === "tree-node" && selection.id === node.id;

        return (
          <g
            key={node.id}
            transform={`translate(${x}, ${y})`}
            onClick={() => select({ kind: "tree-node", id: node.id })}
          >
            <circle
              r={selected ? 0.028 : 0.024}
              fill={
                current
                  ? "var(--color-active)"
                  : onPath
                    ? "var(--color-path)"
                    : visited
                      ? "var(--color-done)"
                      : "var(--color-raised)"
              }
              stroke={selected ? "var(--color-active)" : "var(--color-line-strong)"}
              strokeWidth={0.003}
            />
            <text
              y={0.008}
              textAnchor="middle"
              fill="var(--color-ink)"
              fontSize="0.026"
              fontFamily="var(--font-mono)"
            >
              {node.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
