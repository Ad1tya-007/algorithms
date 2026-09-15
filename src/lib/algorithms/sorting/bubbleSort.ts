import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "./model";

const pseudocode = [
  "function bubbleSort(a) {",
  "  for (let end = a.length - 1; end > 0; end--) {",
  "    let swapped = false;",
  "    for (let i = 0; i < end; i++) {",
  "      if (a[i] > a[i + 1]) {",
  "        swap(a, i, i + 1);",
  "        swapped = true;",
  "      }",
  "    }",
  "    if (!swapped) return;",
  "  }",
  "}",
];

export const bubbleSort: ArrayAlgorithm = {
  id: "bubble-sort",
  name: "Bubble Sort",
  category: "sorting",
  lab: "sorting",
  complexity: {
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
  },
  growth: "n^2",
  description:
    "Repeatedly walks the array, swapping adjacent elements that are out of order until a full pass makes no swaps.",
  howItWorks:
    "Each pass pushes the largest remaining element to the end of the unsorted region, so the sorted tail grows by one every pass. If a pass completes without a single swap the array is already ordered and the algorithm stops early — which is why the best case is linear.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;

    if (n === 0) {
      rec.record({
        op: { type: "idle" },
        phase: "COMPLETE",
        explanation: "The array is empty — nothing to sort.",
        extra: NO_EXTRA,
        codeLine: 0,
      });
      return rec.done();
    }

    let pass = 0;

    for (let end = n - 1; end > 0; end--) {
      pass += 1;
      let swaps = 0;

      rec.record({
        op: { type: "range", start: 0, end },
        phase: "SCANNING",
        explanation: `Pass ${pass}: scan indices 0…${end}. The ${n - 1 - end} largest ${
          n - 1 - end === 1 ? "value is" : "values are"
        } already in place.`,
        fields: [
          { label: "Pass", value: `${pass}`, tone: "accent" },
          { label: "Unsorted Range", value: `0 → ${end}` },
          { label: "Sorted Tail", value: `${n - 1 - end} / ${n}`, tone: "good" },
        ],
        extra: NO_EXTRA,
        codeLine: 1,
      });

      for (let i = 0; i < end; i++) {
        const ordered = a[i] <= a[i + 1];
        rec.record({
          op: { type: "compare", indices: [i, i + 1] },
          phase: "COMPARING",
          explanation: ordered
            ? `a[${i}] = ${a[i]} ≤ a[${i + 1}] = ${a[i + 1]} — already ordered, move on.`
            : `a[${i}] = ${a[i]} > a[${i + 1}] = ${a[i + 1]} — these two must swap.`,
          fields: [
            { label: "Pass", value: `${pass}` },
            { label: "Comparing", value: `a[${i}] ↔ a[${i + 1}]`, tone: "active" },
            {
              label: "Decision",
              value: ordered ? `${a[i]} ≤ ${a[i + 1]} · keep` : `${a[i]} > ${a[i + 1]} · swap`,
              tone: ordered ? "muted" : "warn",
            },
            { label: "Swaps This Pass", value: `${swaps}` },
          ],
          extra: NO_EXTRA,
          codeLine: 4,
          count: "comparisons",
        });

        if (!ordered) {
          [a[i], a[i + 1]] = [a[i + 1], a[i]];
          swaps += 1;
          rec.record({
            op: { type: "swap", indices: [i, i + 1] },
            phase: "SWAPPING",
            explanation: `Swap a[${i}] and a[${i + 1}] — ${a[i + 1]} moves left, ${a[i]} moves right.`,
            fields: [
              { label: "Pass", value: `${pass}` },
              { label: "Swapping", value: `a[${i}] ↔ a[${i + 1}]`, tone: "warn" },
              { label: "Swaps This Pass", value: `${swaps}`, tone: "accent" },
            ],
            extra: NO_EXTRA,
            codeLine: 5,
            count: "swaps",
          });
        }
      }

      rec.record({
        op: { type: "mark-sorted", index: end },
        phase: "SORTED",
        explanation: `a[${end}] = ${a[end]} is the largest of the scanned region and is now final.`,
        fields: [
          { label: "Pass", value: `${pass}` },
          { label: "Locked", value: `a[${end}] = ${a[end]}`, tone: "good" },
          { label: "Swaps This Pass", value: `${swaps}` },
        ],
        extra: NO_EXTRA,
        codeLine: 1,
      });

      if (swaps === 0) {
        for (let i = 0; i < end; i++) {
          rec.record({
            op: { type: "mark-sorted", index: i },
            phase: "SORTED",
            explanation: `No swaps occurred during pass ${pass}, so everything below index ${end} is already ordered.`,
            fields: [{ label: "Early Exit", value: "no swaps in pass", tone: "good" }],
            extra: NO_EXTRA,
            codeLine: 9,
          });
        }
        break;
      }
    }

    rec.record({
      op: { type: "mark-sorted", index: 0 },
      phase: "COMPLETE",
      explanation: `Sorted. ${n} elements ordered in ${pass} ${pass === 1 ? "pass" : "passes"}.`,
      fields: [
        { label: "Status", value: "sorted", tone: "good" },
        { label: "Passes", value: `${pass}` },
      ],
      extra: NO_EXTRA,
      codeLine: 11,
    });

    return rec.done();
  },
};
