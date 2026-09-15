import { Rng } from "@/lib/utils/random";

export type ArrayPreset =
  | "random"
  | "sorted"
  | "reverse"
  | "nearly-sorted"
  | "few-unique"
  | "mountain"
  | "wave";

export const ARRAY_PRESETS: { id: ArrayPreset; label: string; hint: string }[] = [
  { id: "random", label: "Random", hint: "Uniformly shuffled values" },
  { id: "sorted", label: "Sorted", hint: "Already ascending — best case for adaptive sorts" },
  { id: "reverse", label: "Reverse", hint: "Descending — worst case for many sorts" },
  { id: "nearly-sorted", label: "Nearly Sorted", hint: "A few elements out of place" },
  { id: "few-unique", label: "Few Unique", hint: "Many duplicate values" },
  { id: "mountain", label: "Mountain", hint: "Ascends then descends" },
  { id: "wave", label: "Wave", hint: "Smooth sinusoid" },
];

export interface ArrayConfig {
  preset: ArrayPreset;
  size: number;
  min: number;
  max: number;
}

export const ARRAY_LIMITS = {
  size: { min: 8, max: 128 },
  value: { min: 1, max: 999 },
} as const;

export function generateArray(config: ArrayConfig, seed: number): number[] {
  const rng = new Rng(seed);
  const { preset, size } = config;
  const min = Math.min(config.min, config.max);
  const max = Math.max(config.min, config.max);
  const span = Math.max(1, max - min);

  const ascending = () =>
    Array.from({ length: size }, (_, i) =>
      Math.round(min + (span * i) / Math.max(1, size - 1)),
    );

  switch (preset) {
    case "random":
      return Array.from({ length: size }, () => rng.int(min, max));

    case "sorted":
      return ascending();

    case "reverse":
      return ascending().reverse();

    case "nearly-sorted": {
      const values = ascending();
      const swaps = Math.max(1, Math.round(size * 0.08));
      for (let i = 0; i < swaps; i++) {
        const a = rng.int(0, size - 1);
        const b = Math.min(size - 1, a + rng.int(1, 3));
        [values[a], values[b]] = [values[b], values[a]];
      }
      return values;
    }

    case "few-unique": {
      const buckets = Math.max(2, Math.min(5, Math.floor(size / 6)));
      const palette = Array.from({ length: buckets }, (_, i) =>
        Math.round(min + (span * (i + 1)) / (buckets + 1)),
      );
      return Array.from({ length: size }, () => rng.pick(palette));
    }

    case "mountain": {
      const peak = Math.floor(size / 2);
      return Array.from({ length: size }, (_, i) => {
        const t = i <= peak ? i / Math.max(1, peak) : (size - 1 - i) / Math.max(1, size - 1 - peak);
        return Math.round(min + span * t);
      });
    }

    case "wave":
      return Array.from({ length: size }, (_, i) => {
        const t = (Math.sin((i / size) * Math.PI * 4) + 1) / 2;
        return Math.round(min + span * t);
      });
  }
}

/** A value that is present in the array, so searching demos can succeed. */
export function pickSearchTarget(values: number[], seed: number): number {
  if (values.length === 0) return 0;
  const rng = new Rng(seed ^ 0x5f3759df);
  return values[rng.int(0, values.length - 1)];
}
