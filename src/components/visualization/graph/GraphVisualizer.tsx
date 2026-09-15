"use client";

import { useCallback, useRef, useState } from "react";
import type { GraphExtra } from "@/lib/algorithms/graph/model";
import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";
export function GraphVisualizer() {
  const graph = useDatasetStore((s) => s.graph);
  const graphStart = useDatasetStore((s) => s.graphStart);
  const graphGoal = useDatasetStore((s) => s.graphGoal);
  const addNode = useDatasetStore((s) => s.addNode);
  const addEdge = useDatasetStore((s) => s.addEdge);
  const moveNode = useDatasetStore((s) => s.moveNode);
  const pushHistory = useDatasetStore((s) => s.pushHistory);
  const setGraphStart = useDatasetStore((s) => s.setGraphStart);
  const setGraphGoal = useDatasetStore((s) => s.setGraphGoal);

  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const step = index >= 0 ? steps[index] : null;
  const extra = (step?.extra as GraphExtra | undefined) ?? null;

  const select = useUiStore((s) => s.select);
  const selection = useUiStore((s) => s.selection);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== svgRef.current) return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    addNode(x, y);
  };

  const nodeState = (id: string) => {
    if (!extra) return "default";
    if (extra.current === id) return "current";
    if (extra.pathNodes.includes(id)) return "path";
    if (extra.settled.includes(id)) return "settled";
    if (extra.discovered.includes(id)) return "discovered";
    return "default";
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="label mb-2">No graph</p>
        <p className="max-w-xs text-sm text-ink-dim">
          Click anywhere to create a node, or choose a preset to generate a graph automatically.
        </p>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="h-full w-full touch-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="xMidYMid meet"
      onClick={onCanvasClick}
    >
      {graph.edges.map((edge) => {
        const from = graph.nodes.find((n) => n.id === edge.from);
        const to = graph.nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        const active = extra?.activeEdge === edge.id || extra?.pathEdges.includes(edge.id);
        const selected = selection.kind === "edge" && selection.id === edge.id;
        return (
          <g key={edge.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={active ? "var(--color-path)" : "var(--color-line-strong)"}
              strokeWidth={active || selected ? 0.004 : 0.0025}
              strokeDasharray={active ? "0.01 0.006" : undefined}
              onClick={(e) => {
                e.stopPropagation();
                select({ kind: "edge", id: edge.id });
              }}
            />
            {graph.weighted && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2}
                fill="var(--color-ink-dim)"
                fontSize="0.022"
                textAnchor="middle"
              >
                {edge.weight}
              </text>
            )}
          </g>
        );
      })}

      {graph.nodes.map((node) => {
        const state = nodeState(node.id);
        const selected = selection.kind === "node" && selection.id === node.id;
        const isStart = graphStart === node.id;
        const isGoal = graphGoal === node.id;

        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onMouseDown={(e) => {
              e.stopPropagation();
              pushHistory();
              setDragging(node.id);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (dragFrom && dragFrom !== node.id) addEdge(dragFrom, node.id);
              setDragFrom(null);
              setDragging(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              select({ kind: "node", id: node.id });
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setGraphStart(node.id);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setGraphGoal(node.id);
            }}
          >
            <circle
              r={selected ? 0.028 : 0.024}
              fill={
                state === "current"
                  ? "var(--color-active)"
                  : state === "path"
                    ? "var(--color-path)"
                    : state === "settled"
                      ? "var(--color-done)"
                      : state === "discovered"
                        ? "var(--color-open)"
                        : "var(--color-raised)"
              }
              stroke={
                isStart
                  ? "var(--color-done)"
                  : isGoal
                    ? "var(--color-pivot)"
                    : selected
                      ? "var(--color-active)"
                      : "var(--color-line-strong)"
              }
              strokeWidth={0.003}
            />
            <text
              y={0.008}
              textAnchor="middle"
              fill="var(--color-ink)"
              fontSize="0.024"
              fontFamily="var(--font-mono)"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      <rect
        width="1"
        height="1"
        fill="transparent"
        onMouseMove={(e) => {
          if (!dragging) return;
          const { x, y } = toLocal(e.clientX, e.clientY);
          moveNode(dragging, x, y);
        }}
        onMouseUp={() => setDragging(null)}
      />
    </svg>
  );
}
