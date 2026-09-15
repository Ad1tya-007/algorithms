"use client";

import type { LabId } from "@/lib/algorithms/core/types";
import { ARRAY_PRESETS } from "@/lib/datasets/arrays";
import { GRAPH_PRESETS } from "@/lib/datasets/graphs";
import { GRID_PRESETS } from "@/lib/datasets/grids";
import { TREE_PRESETS } from "@/lib/datasets/trees";
import { useDatasetStore } from "@/store/datasetStore";
import { useUiStore } from "@/store/uiStore";

export function DatasetControls({ lab }: { lab: LabId }) {
  const seed = useDatasetStore((s) => s.seed);
  const randomizeSeed = useDatasetStore((s) => s.randomizeSeed);
  const setGridTool = useUiStore((s) => s.setGridTool);
  const gridTool = useUiStore((s) => s.gridTool);

  const regenerateArray = useDatasetStore((s) => s.regenerateArray);
  const shuffle = useDatasetStore((s) => s.shuffle);
  const reverse = useDatasetStore((s) => s.reverse);
  const sortArray = useDatasetStore((s) => s.sortArray);
  const setArrayConfig = useDatasetStore((s) => s.setArrayConfig);
  const arrayConfig = useDatasetStore((s) => s.arrayConfig);

  const regenerateGraph = useDatasetStore((s) => s.regenerateGraph);
  const setGraphConfig = useDatasetStore((s) => s.setGraphConfig);
  const graphConfig = useDatasetStore((s) => s.graphConfig);

  const regenerateGrid = useDatasetStore((s) => s.regenerateGrid);
  const setGridConfig = useDatasetStore((s) => s.setGridConfig);
  const gridConfig = useDatasetStore((s) => s.gridConfig);
  const clearWalls = useDatasetStore((s) => s.clearWalls);

  const regenerateTree = useDatasetStore((s) => s.regenerateTree);
  const setTreeConfig = useDatasetStore((s) => s.setTreeConfig);
  const treeConfig = useDatasetStore((s) => s.treeConfig);
  const clearTree = useDatasetStore((s) => s.clearTree);
  const suggestTreeValue = useDatasetStore((s) => s.suggestTreeValue);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label">Seed</span>
      <span className="font-mono text-[10px] text-ink-dim">{seed}</span>
      <button
        type="button"
        onClick={randomizeSeed}
        className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-ink-dim hover:text-ink"
      >
        Randomize
      </button>

      {lab === "sorting" && (
        <>
          <Action onClick={regenerateArray}>Generate</Action>
          <Action onClick={shuffle}>Shuffle</Action>
          <Action onClick={reverse}>Reverse</Action>
          <Action onClick={sortArray}>Sort</Action>
          <select
            value={arrayConfig.preset}
            onChange={(e) => setArrayConfig({ preset: e.target.value as typeof arrayConfig.preset })}
            className="rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
          >
            {ARRAY_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={arrayConfig.target}
            onChange={(e) => setArrayConfig({ target: Number(e.target.value) })}
            className="w-14 rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
            title="Search target"
          />
        </>
      )}

      {lab === "graph" && (
        <>
          <Action onClick={regenerateGraph}>Generate</Action>
          <select
            value={graphConfig.preset}
            onChange={(e) => setGraphConfig({ preset: e.target.value as typeof graphConfig.preset })}
            className="rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
          >
            {GRAPH_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <Toggle
            label="Directed"
            checked={graphConfig.directed}
            onChange={(v) => setGraphConfig({ directed: v })}
          />
          <Toggle
            label="Weighted"
            checked={graphConfig.weighted}
            onChange={(v) => setGraphConfig({ weighted: v })}
          />
        </>
      )}

      {lab === "pathfinding" && (
        <>
          <Action onClick={regenerateGrid}>Generate</Action>
          <Action onClick={clearWalls}>Clear</Action>
          <select
            value={gridConfig.preset}
            onChange={(e) => setGridConfig({ preset: e.target.value as typeof gridConfig.preset })}
            className="rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
          >
            {GRID_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {(["wall", "erase", "start", "end"] as const).map((tool) => (
            <Action key={tool} active={gridTool === tool} onClick={() => setGridTool(tool)}>
              {tool}
            </Action>
          ))}
        </>
      )}

      {lab === "trees" && (
        <>
          <Action onClick={regenerateTree}>Generate</Action>
          <Action onClick={clearTree}>Clear</Action>
          <Action onClick={suggestTreeValue}>Suggest</Action>
          <select
            value={treeConfig.preset}
            onChange={(e) => setTreeConfig({ preset: e.target.value as typeof treeConfig.preset })}
            className="rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
          >
            {TREE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={treeConfig.value}
            onChange={(e) => setTreeConfig({ value: Number(e.target.value) })}
            className="w-14 rounded border border-line bg-transparent px-1.5 py-0.5 font-mono text-[10px] text-ink-dim"
          />
        </>
      )}
    </div>
  );
}

function Action({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-0.5 font-mono text-[10px] capitalize transition-colors ${
        active
          ? "border-active/40 bg-active/10 text-active"
          : "border-line text-ink-dim hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
        checked ? "border-active/40 text-active" : "border-line text-ink-dim"
      }`}
    >
      {label}
    </button>
  );
}
