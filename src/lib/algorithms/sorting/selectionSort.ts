import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "./model";

const pseudocode = [
  "function selectionSort(a) {",
  "  for (let i = 0; i < a.length - 1; i++) {",
  "    let min = i;",
  "    for (let j = i + 1; j < a.length; j++) {",
  "      if (a[j] < a[min]) min = j;",
  "    }",
  "    if (min !== i) swap(a, i, min);",
  "  }",
  "}",
];

export const selectionSort: ArrayAlgorithm = {
  id: "selection-sort",
  name: "Selection Sort",
  category: "sorting",
  lab: "sorting",
  complexity: {
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  growth: "n^2",
  description:
    "Scans the unsorted region for its smallest element and swaps it into the boundary position.",
  howItWorks:
    "The scan cost does not depend on the data, so selection sort always performs the same number of comparisons — n(n−1)/2 — even on an already sorted array. It compensates with very few writes: at most one swap per position.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
      let min = i;

      rec.record({
        op: { type: "range", start: i, end: n - 1 },
        phase: "SCANNING",
        explanation: `Find the smallest value in the unsorted region ${i}…${n - 1}, then place it at index ${i}.`,
        fields: [
          { label: "Boundary", value: `a[${i}]`, tone: "accent" },
          { label: "Unsorted Range", value: `${i} → ${n - 1}` },
          { label: "Min Candidate", value: `a[${min}] = ${a[min]}`, tone: "active" },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
      });

      rec.record({
        op: { type: "pointer", name: "min", index: min },
        phase: "SCANNING",
        explanation: `Assume a[${i}] = ${a[i]} is the minimum until proven otherwise.`,
        fields: [
          { label: "Boundary", value: `a[${i}]` },
          { label: "Min Candidate", value: `a[${min}] = ${a[min]}`, tone: "active" },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
      });

      for (let j = i + 1; j < n; j++) {
        const smaller = a[j] < a[min];
        rec.record({
          op: { type: "compare", indices: [j, min] },
          phase: "COMPARING",
          explanation: smaller
            ? `a[${j}] = ${a[j]} < a[${min}] = ${a[min]} — new minimum found.`
            : `a[${j}] = ${a[j]} ≥ a[${min}] = ${a[min]} — minimum unchanged.`,
          fields: [
            { label: "Boundary", value: `a[${i}]` },
            { label: "Inspecting", value: `a[${j}] = ${a[j]}`, tone: "active" },
            { label: "Min Candidate", value: `a[${min}] = ${a[min]}` },
            {
              label: "Decision",
              value: smaller ? `${a[j]} < ${a[min]} · new min` : `${a[j]} ≥ ${a[min]} · keep`,
              tone: smaller ? "warn" : "muted",
            },
          ],
          extra: NO_EXTRA,
          codeLine: 4,
          count: "comparisons",
        });

        if (smaller) {
          min = j;
          rec.record({
            op: { type: "pointer", name: "min", index: min },
            phase: "SCANNING",
            explanation: `Minimum pointer moves to index ${min} (value ${a[min]}).`,
            fields: [
              { label: "Boundary", value: `a[${i}]` },
              { label: "Min Candidate", value: `a[${min}] = ${a[min]}`, tone: "accent" },
            ],
            extra: NO_EXTRA,
            codeLine: 4,
          });
        }
      }

      if (min !== i) {
        rec.record({
          op: { type: "swap", indices: [i, min] },
          phase: "SWAPPING",
          explanation: `Swap the minimum ${a[min]} at index ${min} into the boundary index ${i}.`,
          fields: [
            { label: "Swapping", value: `a[${i}] ↔ a[${min}]`, tone: "warn" },
            { label: "Value Placed", value: `${a[min]}`, tone: "good" },
          ],
          extra: NO_EXTRA,
          codeLine: 6,
          count: "swaps",
        });
        [a[i], a[min]] = [a[min], a[i]];
      } else {
        rec.record({
          op: { type: "idle" },
          phase: "SCANNING",
          explanation: `a[${i}] = ${a[i]} was already the smallest — no swap needed.`,
          fields: [{ label: "Decision", value: "already in place", tone: "muted" }],
          extra: NO_EXTRA,
          codeLine: 6,
        });
      }

      rec.record({
        op: { type: "mark-sorted", index: i },
        phase: "SORTED",
        explanation: `a[${i}] = ${a[i]} is final.`,
        fields: [{ label: "Locked", value: `a[${i}] = ${a[i]}`, tone: "good" }],
        extra: NO_EXTRA,
        codeLine: 1,
      });
    }

    if (n > 0) {
      rec.record({
        op: { type: "mark-sorted", index: n - 1 },
        phase: "COMPLETE",
        explanation: "The final element is largest by elimination. Sorted.",
        fields: [{ label: "Status", value: "sorted", tone: "good" }],
        extra: NO_EXTRA,
        codeLine: 8,
      });
    }

    return rec.done();
  },
};
