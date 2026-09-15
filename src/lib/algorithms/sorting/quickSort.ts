import { StepRecorder } from "../core/recorder";
import type { ArrayAlgorithm, ArrayExtra, ArrayFrame, ArrayOp } from "./model";

const pseudocode = [
  "function quickSort(a, lo, hi) {",
  "  if (lo >= hi) return;",
  "  const p = partition(a, lo, hi);",
  "  quickSort(a, lo, p - 1);",
  "  quickSort(a, p + 1, hi);",
  "}",
  "",
  "function partition(a, lo, hi) {",
  "  const pivot = a[hi];",
  "  let i = lo;",
  "  for (let j = lo; j < hi; j++) {",
  "    if (a[j] < pivot) swap(a, i++, j);",
  "  }",
  "  swap(a, i, hi);",
  "  return i;",
  "}",
];

export const quickSort: ArrayAlgorithm = {
  id: "quick-sort",
  name: "Quick Sort",
  category: "sorting",
  lab: "sorting",
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
  },
  growth: "n log n",
  description:
    "Selects a pivot and partitions the array around it, then sorts the two sides recursively.",
  howItWorks:
    "Every partition places its pivot in its final position and splits the remaining work in two. Balanced splits give n log n; a pivot that is always the extreme value degenerates into n² — which is exactly what happens to this last-element pivot on already sorted input. Space is the recursion stack, O(log n) when splits are balanced.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;
    const stack: ArrayFrame[] = [];
    const extra = (): ArrayExtra => ({ frames: [...stack], aux: null });

    const partition = (lo: number, hi: number, depth: number): number => {
      const pivot = a[hi];
      let i = lo;

      rec.record({
        op: { type: "pivot", index: hi },
        phase: "PIVOT",
        explanation: `Choose the last element of the range, a[${hi}] = ${pivot}, as the pivot.`,
        fields: [
          { label: "Range", value: `${lo} → ${hi}`, tone: "accent" },
          { label: "Pivot", value: `a[${hi}] = ${pivot}`, tone: "accent" },
          { label: "Depth", value: `${depth}` },
        ],
        extra: extra(),
        codeLine: 8,
      });

      rec.record({
        op: { type: "pointer", name: "i", index: i },
        phase: "PARTITION",
        explanation: `Pointer i marks the boundary of values smaller than the pivot. It starts at ${lo}.`,
        fields: [
          { label: "Range", value: `${lo} → ${hi}` },
          { label: "Pivot", value: `${pivot}`, tone: "accent" },
          { label: "Left Pointer i", value: `${i}`, tone: "active" },
        ],
        extra: extra(),
        codeLine: 9,
      });

      for (let j = lo; j < hi; j++) {
        rec.record({
          op: { type: "pointer", name: "j", index: j },
          phase: "PARTITION",
          explanation: `Scan pointer j advances to index ${j}.`,
          fields: [
            { label: "Pivot", value: `${pivot}`, tone: "accent" },
            { label: "Left Pointer i", value: `${i}` },
            { label: "Scan Pointer j", value: `${j}`, tone: "active" },
          ],
          extra: extra(),
          codeLine: 10,
        });

        const smaller = a[j] < pivot;
        rec.record({
          op: { type: "compare", indices: [j, hi] },
          phase: "COMPARING",
          explanation: smaller
            ? `a[${j}] = ${a[j]} < pivot ${pivot} — it belongs on the left side.`
            : `a[${j}] = ${a[j]} ≥ pivot ${pivot} — leave it on the right side.`,
          fields: [
            { label: "Pivot", value: `${pivot}`, tone: "accent" },
            { label: "Comparing", value: `a[${j}] = ${a[j]}`, tone: "active" },
            {
              label: "Decision",
              value: smaller ? `${a[j]} < ${pivot} · move left` : `${a[j]} ≥ ${pivot} · stay`,
              tone: smaller ? "warn" : "muted",
            },
            { label: "Left Pointer i", value: `${i}` },
            { label: "Scan Pointer j", value: `${j}` },
          ],
          extra: extra(),
          codeLine: 11,
          count: "comparisons",
        });

        if (smaller) {
          if (i !== j) {
            rec.record({
              op: { type: "swap", indices: [i, j] },
              phase: "SWAPPING",
              explanation: `Swap a[${i}] and a[${j}] to move ${a[j]} into the smaller-than-pivot region.`,
              fields: [
                { label: "Swapping", value: `a[${i}] ↔ a[${j}]`, tone: "warn" },
                { label: "Pivot", value: `${pivot}`, tone: "accent" },
              ],
              extra: extra(),
              codeLine: 11,
              count: "swaps",
            });
            [a[i], a[j]] = [a[j], a[i]];
          }
          i += 1;
          rec.record({
            op: { type: "pointer", name: "i", index: i },
            phase: "PARTITION",
            explanation: `The smaller-than-pivot region grew; i advances to ${i}.`,
            fields: [
              { label: "Left Pointer i", value: `${i}`, tone: "accent" },
              { label: "Smaller Than Pivot", value: `${i - lo} elements`, tone: "good" },
            ],
            extra: extra(),
            codeLine: 11,
          });
        }
      }

      if (i !== hi) {
        rec.record({
          op: { type: "swap", indices: [i, hi] },
          phase: "SWAPPING",
          explanation: `Swap the pivot into index ${i} — every value left of it is smaller, every value right is not.`,
          fields: [
            { label: "Pivot Lands At", value: `${i}`, tone: "good" },
            { label: "Swapping", value: `a[${i}] ↔ a[${hi}]`, tone: "warn" },
          ],
          extra: extra(),
          codeLine: 13,
          count: "swaps",
        });
        [a[i], a[hi]] = [a[hi], a[i]];
      }

      rec.record({
        op: { type: "mark-sorted", index: i },
        phase: "SORTED",
        explanation: `a[${i}] = ${pivot} is in its final position. Recurse on ${lo}…${i - 1} and ${i + 1}…${hi}.`,
        fields: [
          { label: "Pivot Final", value: `a[${i}] = ${pivot}`, tone: "good" },
          { label: "Left Side", value: i - 1 >= lo ? `${lo} → ${i - 1}` : "empty" },
          { label: "Right Side", value: i + 1 <= hi ? `${i + 1} → ${hi}` : "empty" },
        ],
        extra: extra(),
        codeLine: 14,
      });

      return i;
    };

    const sort = (lo: number, hi: number, depth: number) => {
      if (lo > hi) return;

      if (lo === hi) {
        rec.record({
          op: { type: "mark-sorted", index: lo },
          phase: "SORTED",
          explanation: `A single element range (${lo}) is already sorted.`,
          fields: [{ label: "Base Case", value: `a[${lo}] = ${a[lo]}`, tone: "good" }],
          extra: extra(),
          codeLine: 1,
        });
        return;
      }

      stack.push({ start: lo, end: hi, depth, label: `${lo}…${hi}` });
      rec.record({
        op: { type: "range", start: lo, end: hi },
        phase: "PARTITION",
        explanation: `Partition the range ${lo}…${hi}.`,
        fields: [
          { label: "Range", value: `${lo} → ${hi}`, tone: "accent" },
          { label: "Depth", value: `${depth}` },
          { label: "Open Frames", value: `${stack.length}` },
        ],
        extra: extra(),
        codeLine: 2,
      });

      const p = partition(lo, hi, depth);
      stack.pop();

      sort(lo, p - 1, depth + 1);
      sort(p + 1, hi, depth + 1);
    };

    if (n === 0) {
      rec.record({
        op: { type: "idle" },
        phase: "COMPLETE",
        explanation: "The array is empty — nothing to sort.",
        extra: extra(),
        codeLine: 1,
      });
      return rec.done();
    }

    sort(0, n - 1, 0);

    rec.record({
      op: { type: "pivot", index: null },
      phase: "COMPLETE",
      explanation: "Every pivot has been placed, so the array is fully sorted.",
      fields: [{ label: "Status", value: "sorted", tone: "good" }],
      extra: extra(),
      codeLine: 5,
    });

    return rec.done();
  },
};
