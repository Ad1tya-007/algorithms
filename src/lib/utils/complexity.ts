import type { GrowthClass } from "@/lib/algorithms/core/types";

export interface GrowthCurve {
  id: GrowthClass;
  label: string;
  /** Normalised cost at t ∈ [0, 1], scaled so every curve fits one chart. */
  at: (t: number) => number;
}

const CURVES: GrowthCurve[] = [
  { id: "1", label: "O(1)", at: () => 0.02 },
  { id: "log n", label: "O(log n)", at: (t) => Math.log2(1 + t * 63) / 6 },
  { id: "n", label: "O(n)", at: (t) => t },
  { id: "n log n", label: "O(n log n)", at: (t) => (t * Math.log2(1 + t * 63)) / 6 },
  { id: "n^2", label: "O(n²)", at: (t) => t * t },
];

export const GROWTH_CURVES = CURVES;

export function curvePoints(curve: GrowthCurve, samples = 24): { x: number; y: number }[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    return { x: t, y: Math.min(1, curve.at(t)) };
  });
}
