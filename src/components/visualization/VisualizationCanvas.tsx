"use client";

import { useUiStore } from "@/store/uiStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { SortingVisualizer } from "@/components/visualization/sorting/SortingVisualizer";
import { GraphVisualizer } from "@/components/visualization/graph/GraphVisualizer";
import { GridVisualizer } from "@/components/visualization/pathfinding/GridVisualizer";
import { TreeVisualizer } from "@/components/visualization/trees/TreeVisualizer";

export function VisualizationCanvas() {
  const lab = useUiStore((s) => s.lab);
  const notice = useUiStore((s) => s.notice);
  const requirement = usePlaybackStore((s) => s.requirement);
  const failure = usePlaybackStore((s) => s.failure);

  const message = notice ?? requirement ?? failure;

  return (
    <main className="relative min-w-0 flex-1 overflow-hidden bg-base grid-paper">
      {lab === "sorting" && <SortingVisualizer />}
      {lab === "graph" && <GraphVisualizer />}
      {lab === "pathfinding" && <GridVisualizer />}
      {lab === "trees" && <TreeVisualizer />}

      {message && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
          <div className="panel max-w-lg rounded px-4 py-2 text-center text-sm text-ink-dim">
            {message}
          </div>
        </div>
      )}
    </main>
  );
}
