import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "./model";

const pseudocode = [
  "function heapSort(a) {",
  "  for (let i = (a.length >> 1) - 1; i >= 0; i--)",
  "    siftDown(a, i, a.length);",
  "  for (let end = a.length - 1; end > 0; end--) {",
  "    swap(a, 0, end);",
  "    siftDown(a, 0, end);",
  "  }",
  "}",
  "",
  "function siftDown(a, i, size) {",
  "  while (true) {",
  "    let big = i;",
  "    const l = 2 * i + 1, r = 2 * i + 2;",
  "    if (l < size && a[l] > a[big]) big = l;",
  "    if (r < size && a[r] > a[big]) big = r;",
  "    if (big === i) return;",
  "    swap(a, i, big);",
  "    i = big;",
  "  }",
  "}",
];

export const heapSort: ArrayAlgorithm = {
  id: "heap-sort",
  name: "Heap Sort",
  category: "sorting",
  lab: "sorting",
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(1)",
  },
  growth: "n log n",
  description:
    "Rearranges the array into a max-heap, then repeatedly moves the root to the end of the unsorted region.",
  howItWorks:
    "The array doubles as a binary tree: index i has children 2i+1 and 2i+2. Building the heap is linear, and each of the n extractions costs log n to restore the heap property. Unlike merge sort it needs no auxiliary buffer, so it sorts in place with an n log n guarantee.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;

    const siftDown = (root: number, size: number, phaseLabel: string) => {
      let i = root;

      for (;;) {
        let big = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;

        if (l < size) {
          rec.record({
            op: { type: "compare", indices: [l, big] },
            phase: "COMPARING",
            explanation: `Compare left child a[${l}] = ${a[l]} with a[${big}] = ${a[big]}.`,
            fields: [
              { label: "Phase", value: phaseLabel },
              { label: "Node", value: `a[${i}] = ${a[i]}`, tone: "accent" },
              { label: "Left Child", value: `a[${l}] = ${a[l]}`, tone: "active" },
              { label: "Heap Size", value: `${size}` },
            ],
            extra: NO_EXTRA,
            codeLine: 13,
            count: "comparisons",
          });
          if (a[l] > a[big]) big = l;
        }

        if (r < size) {
          rec.record({
            op: { type: "compare", indices: [r, big] },
            phase: "COMPARING",
            explanation: `Compare right child a[${r}] = ${a[r]} with the current largest a[${big}] = ${a[big]}.`,
            fields: [
              { label: "Phase", value: phaseLabel },
              { label: "Node", value: `a[${i}] = ${a[i]}`, tone: "accent" },
              { label: "Right Child", value: `a[${r}] = ${a[r]}`, tone: "active" },
              { label: "Heap Size", value: `${size}` },
            ],
            extra: NO_EXTRA,
            codeLine: 14,
            count: "comparisons",
          });
          if (a[r] > a[big]) big = r;
        }

        if (big === i) {
          rec.record({
            op: { type: "idle" },
            phase: "HEAPIFY",
            explanation: `a[${i}] = ${a[i]} is already larger than its children — the heap property holds here.`,
            fields: [
              { label: "Phase", value: phaseLabel },
              { label: "Settled At", value: `a[${i}] = ${a[i]}`, tone: "good" },
            ],
            extra: NO_EXTRA,
            codeLine: 15,
          });
          return;
        }

        rec.record({
          op: { type: "swap", indices: [i, big] },
          phase: "SWAPPING",
          explanation: `Child ${a[big]} is larger than parent ${a[i]} — swap them and keep sinking.`,
          fields: [
            { label: "Phase", value: phaseLabel },
            { label: "Swapping", value: `a[${i}] ↔ a[${big}]`, tone: "warn" },
            { label: "Sinking To", value: `${big}`, tone: "active" },
          ],
          extra: NO_EXTRA,
          codeLine: 16,
          count: "swaps",
        });
        [a[i], a[big]] = [a[big], a[i]];
        i = big;
      }
    };

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

    rec.record({
      op: { type: "range", start: 0, end: n - 1 },
      phase: "HEAPIFY",
      explanation:
        "Phase 1 — build a max-heap in place, starting from the last parent and working backwards.",
      fields: [
        { label: "Phase", value: "build heap", tone: "accent" },
        { label: "First Parent", value: `${(n >> 1) - 1}` },
      ],
      extra: NO_EXTRA,
      codeLine: 1,
    });

    for (let i = (n >> 1) - 1; i >= 0; i--) {
      rec.record({
        op: { type: "pointer", name: "root", index: i },
        phase: "HEAPIFY",
        explanation: `Sift a[${i}] = ${a[i]} down into place.`,
        fields: [
          { label: "Phase", value: "build heap" },
          { label: "Sifting", value: `a[${i}] = ${a[i]}`, tone: "accent" },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
      });
      siftDown(i, n, "build heap");
    }

    rec.record({
      op: { type: "pointer", name: "root", index: 0 },
      phase: "HEAPIFY",
      explanation: `The heap is built — a[0] = ${a[0]} is the largest value in the array.`,
      fields: [
        { label: "Phase", value: "extract", tone: "accent" },
        { label: "Heap Root", value: `${a[0]}`, tone: "good" },
      ],
      extra: NO_EXTRA,
      codeLine: 3,
    });

    for (let end = n - 1; end > 0; end--) {
      rec.record({
        op: { type: "swap", indices: [0, end] },
        phase: "SWAPPING",
        explanation: `Move the heap root ${a[0]} to index ${end}, its final position.`,
        fields: [
          { label: "Phase", value: "extract" },
          { label: "Extracting", value: `${a[0]} → a[${end}]`, tone: "warn" },
          { label: "Heap Size After", value: `${end}` },
        ],
        extra: NO_EXTRA,
        codeLine: 4,
        count: "swaps",
      });
      [a[0], a[end]] = [a[end], a[0]];

      rec.record({
        op: { type: "mark-sorted", index: end },
        phase: "SORTED",
        explanation: `a[${end}] = ${a[end]} is final. Shrink the heap and restore the root.`,
        fields: [
          { label: "Locked", value: `a[${end}] = ${a[end]}`, tone: "good" },
          { label: "Heap Size", value: `${end}` },
        ],
        extra: NO_EXTRA,
        codeLine: 4,
      });

      rec.record({
        op: { type: "range", start: 0, end: end - 1 },
        phase: "HEAPIFY",
        explanation: `Restore the max-heap property over the remaining ${end} elements.`,
        fields: [
          { label: "Phase", value: "extract" },
          { label: "Heap Range", value: `0 → ${end - 1}`, tone: "accent" },
        ],
        extra: NO_EXTRA,
        codeLine: 5,
      });
      siftDown(0, end, "extract");
    }

    rec.record({
      op: { type: "mark-sorted", index: 0 },
      phase: "COMPLETE",
      explanation: "The heap is empty and every element has been placed. Sorted.",
      fields: [{ label: "Status", value: "sorted", tone: "good" }],
      extra: NO_EXTRA,
      codeLine: 7,
    });

    return rec.done();
  },
};
