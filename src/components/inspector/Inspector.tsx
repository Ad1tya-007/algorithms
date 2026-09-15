"use client";

import { useAlgorithmStore } from "@/store/algorithmStore";
import { useUiStore } from "@/store/uiStore";
import { usePlaybackStore, currentStep, metricsAt } from "@/store/playbackStore";
import { getDefinition } from "@/lib/algorithms/registry";
import { formatCount } from "@/lib/utils/format";
import { GROWTH_CURVES, curvePoints } from "@/lib/utils/complexity";
import { cn } from "@/lib/utils/cn";
import { useDatasetStore } from "@/store/datasetStore";
import { labelOf } from "@/lib/algorithms/graph/model";
import { CodePanel } from "@/components/inspector/CodePanel";

const TONE: Record<string, string> = {
  default: "text-ink",
  active: "text-active",
  good: "text-done",
  warn: "text-compare",
  accent: "text-pivot",
  muted: "text-ink-dim",
};

export function Inspector() {
  const lab = useUiStore((s) => s.lab);
  const showCode = useUiStore((s) => s.showCode);
  const toggleCode = useUiStore((s) => s.toggleCode);
  const selection = useUiStore((s) => s.selection);
  const algorithmId = useAlgorithmStore((s) => s.byLab[lab]);
  const definition = getDefinition(algorithmId);

  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const step = currentStep({ steps, index });
  const metrics = metricsAt({ steps, index });

  const array = useDatasetStore((s) => s.array);
  const graph = useDatasetStore((s) => s.graph);
  const graphStart = useDatasetStore((s) => s.graphStart);
  const graphGoal = useDatasetStore((s) => s.graphGoal);
  const setArrayValue = useDatasetStore((s) => s.setArrayValue);
  const setEdgeWeight = useDatasetStore((s) => s.setEdgeWeight);

  if (!definition) return null;

  return (
    <aside className="panel flex w-72 shrink-0 flex-col border-l border-line md:w-80">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="label">Inspector</p>
        <button
          type="button"
          onClick={toggleCode}
          className="font-mono text-[10px] text-ink-dim hover:text-ink"
        >
          {showCode ? "Hide code" : "</> Show code"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <section className="mb-5">
          <h2 className="font-mono text-sm text-ink">{definition.name.toUpperCase()}</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-dim">{definition.description}</p>
        </section>

        <section className="mb-5">
          <p className="label mb-2">Complexity</p>
          <dl className="space-y-1 font-mono text-[11px]">
            <Row label="Best" value={definition.complexity.best} />
            <Row label="Average" value={definition.complexity.average} />
            <Row label="Worst" value={definition.complexity.worst} />
            <Row label="Space" value={definition.complexity.space} />
          </dl>
          <ComplexityChart highlight={definition.growth} />
        </section>

        <section className="mb-5">
          <p className="label mb-2">Visualization operations</p>
          <dl className="space-y-1 font-mono text-[11px]">
            <Row label="Comparisons" value={formatCount(metrics.comparisons)} />
            <Row label="Swaps" value={formatCount(metrics.swaps)} />
            <Row label="Writes" value={formatCount(metrics.writes)} />
            <Row label="Visits" value={formatCount(metrics.visits)} />
            <Row label="Relaxations" value={formatCount(metrics.relaxations)} />
          </dl>
        </section>

        {step && (
          <section className="mb-5">
            <p className="label mb-2">Current step</p>
            <p className="mb-2 font-mono text-[10px] text-active">{step.phase}</p>
            <p className="text-xs leading-relaxed text-ink-dim">{step.explanation}</p>
            {step.fields.length > 0 && (
              <dl className="mt-3 space-y-1.5">
                {step.fields.map((field) => (
                  <div key={field.label} className="flex justify-between gap-2 text-[11px]">
                    <dt className="text-ink-faint">{field.label}</dt>
                    <dd className={cn("font-mono text-right", TONE[field.tone ?? "default"])}>
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}

        <section className="mb-5">
          <p className="label mb-2">How it works</p>
          <p className="text-xs leading-relaxed text-ink-dim">{definition.howItWorks}</p>
        </section>

        {selection.kind === "array" && (
          <section className="mb-5">
            <p className="label mb-2">Selection</p>
            <Row label="Index" value={String(selection.index)} />
            <Row label="Value" value={String(array[selection.index] ?? "—")} />
            <input
              type="number"
              defaultValue={array[selection.index]}
              onChange={(e) => setArrayValue(selection.index, Number(e.target.value))}
              className="mt-2 w-full rounded border border-line bg-transparent px-2 py-1 font-mono text-xs"
            />
          </section>
        )}

        {selection.kind === "node" && (
          <section className="mb-5">
            <p className="label mb-2">Node</p>
            <Row label="ID" value={labelOf(graph, selection.id)} />
            <Row label="Start" value={graphStart === selection.id ? "YES" : "NO"} />
            <Row label="Goal" value={graphGoal === selection.id ? "YES" : "NO"} />
          </section>
        )}

        {selection.kind === "edge" && (() => {
          const edge = graph.edges.find((e) => e.id === selection.id);
          if (!edge) return null;
          return (
            <section className="mb-5">
              <p className="label mb-2">Edge</p>
              <Row
                label="Route"
                value={`${labelOf(graph, edge.from)} → ${labelOf(graph, edge.to)}`}
              />
              <Row label="Weight" value={String(edge.weight)} />
              {graph.weighted && (
                <input
                  type="number"
                  defaultValue={edge.weight}
                  onChange={(e) => setEdgeWeight(edge.id, Number(e.target.value))}
                  className="mt-2 w-full rounded border border-line bg-transparent px-2 py-1 font-mono text-xs"
                />
              )}
            </section>
          );
        })()}

        {showCode && definition && <CodePanel definition={definition} codeLine={step?.codeLine ?? null} />}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="font-mono text-ink">{value}</dd>
    </div>
  );
}

function ComplexityChart({ highlight }: { highlight: string }) {
  const w = 220;
  const h = 72;
  const pad = 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full opacity-80">
      {GROWTH_CURVES.map((curve) => {
        const points = curvePoints(curve);
        const d = points
          .map((p, i) => {
            const x = pad + p.x * (w - pad * 2);
            const y = h - pad - p.y * (h - pad * 2);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        const active = curve.id === highlight;
        return (
          <g key={curve.id}>
            <path
              d={d}
              fill="none"
              stroke={active ? "var(--color-active)" : "var(--color-line-strong)"}
              strokeWidth={active ? 1.5 : 1}
              opacity={active ? 1 : 0.45}
            />
            <text
              x={w - pad}
              y={h - pad - GROWTH_CURVES.indexOf(curve) * 10}
              textAnchor="end"
              fill={active ? "var(--color-active)" : "var(--color-ink-faint)"}
              fontSize="8"
              fontFamily="var(--font-mono)"
            >
              {curve.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
