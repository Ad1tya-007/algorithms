import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "./model";

const pseudocode = [
  "function insertionSort(a) {",
  "  for (let i = 1; i < a.length; i++) {",
  "    const key = a[i];",
  "    let j = i - 1;",
  "    while (j >= 0 && a[j] > key) {",
  "      a[j + 1] = a[j];",
  "      j--;",
  "    }",
  "    a[j + 1] = key;",
  "  }",
  "}",
];

export const insertionSort: ArrayAlgorithm = {
  id: "insertion-sort",
  name: "Insertion Sort",
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
    "Grows a sorted prefix one element at a time, shifting larger elements right to open a slot for each new key.",
  howItWorks:
    "Work is proportional to how far each element must travel, so nearly sorted input is handled in almost linear time. This locality is why insertion sort is used as the base case inside industrial-strength hybrid sorts.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;

    if (n > 0) {
      rec.record({
        op: { type: "mark-sorted", index: 0 },
        phase: "SORTED",
        explanation: "A single element is trivially a sorted prefix. Start from index 1.",
        fields: [{ label: "Sorted Prefix", value: "0 → 0", tone: "good" }],
        extra: NO_EXTRA,
        codeLine: 1,
      });
    }

    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;
      let shifts = 0;

      rec.record({
        op: { type: "probe", index: i },
        phase: "PROBING",
        explanation: `Lift a[${i}] = ${key} as the key and find where it belongs in the sorted prefix 0…${i - 1}.`,
        fields: [
          { label: "Key", value: `${key}`, tone: "accent" },
          { label: "From Index", value: `${i}` },
          { label: "Sorted Prefix", value: `0 → ${i - 1}`, tone: "good" },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
      });

      while (j >= 0) {
        const mustShift = a[j] > key;
        rec.record({
          op: { type: "compare", indices: [j, i] },
          phase: "COMPARING",
          explanation: mustShift
            ? `a[${j}] = ${a[j]} > key ${key} — shift it one slot right.`
            : `a[${j}] = ${a[j]} ≤ key ${key} — the insertion point is index ${j + 1}.`,
          fields: [
            { label: "Key", value: `${key}`, tone: "accent" },
            { label: "Comparing", value: `a[${j}] = ${a[j]}`, tone: "active" },
            {
              label: "Decision",
              value: mustShift ? `${a[j]} > ${key} · shift` : `${a[j]} ≤ ${key} · insert here`,
              tone: mustShift ? "warn" : "good",
            },
            { label: "Shifts", value: `${shifts}` },
          ],
          extra: NO_EXTRA,
          codeLine: 4,
          count: "comparisons",
        });

        if (!mustShift) break;

        a[j + 1] = a[j];
        shifts += 1;
        rec.record({
          op: { type: "overwrite", index: j + 1, value: a[j] },
          phase: "WRITING",
          explanation: `Copy ${a[j]} from index ${j} to index ${j + 1}, opening a gap.`,
          fields: [
            { label: "Key", value: `${key}`, tone: "accent" },
            { label: "Shift", value: `a[${j}] → a[${j + 1}]`, tone: "warn" },
            { label: "Shifts", value: `${shifts}` },
          ],
          extra: NO_EXTRA,
          codeLine: 5,
          count: "writes",
        });
        j -= 1;
      }

      a[j + 1] = key;
      rec.record({
        op: { type: "overwrite", index: j + 1, value: key },
        phase: "INSERTED",
        explanation: `Place key ${key} at index ${j + 1}. The sorted prefix is now 0…${i}.`,
        fields: [
          { label: "Inserted", value: `${key} → a[${j + 1}]`, tone: "good" },
          { label: "Shifts Used", value: `${shifts}` },
          { label: "Sorted Prefix", value: `0 → ${i}`, tone: "good" },
        ],
        extra: NO_EXTRA,
        codeLine: 8,
        count: "writes",
      });

      rec.record({
        op: { type: "mark-sorted", index: i },
        phase: "SORTED",
        explanation: `The prefix 0…${i} is ordered. ${
          i + 1 < n ? `Next key is a[${i + 1}].` : "Every element has been placed."
        }`,
        fields: [{ label: "Sorted Prefix", value: `0 → ${i}`, tone: "good" }],
        extra: NO_EXTRA,
        codeLine: 1,
      });
    }

    rec.record({
      op: { type: "idle" },
      phase: "COMPLETE",
      explanation: "Every element has been inserted into the sorted prefix. Sorted.",
      fields: [{ label: "Status", value: "sorted", tone: "good" }],
      extra: NO_EXTRA,
      codeLine: 10,
    });

    return rec.done();
  },
};
