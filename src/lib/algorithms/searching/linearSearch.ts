import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "../sorting/model";

const pseudocode = [
  "function linearSearch(a, target) {",
  "  for (let i = 0; i < a.length; i++) {",
  "    if (a[i] === target) return i;",
  "  }",
  "  return -1;",
  "}",
];

export const linearSearch: ArrayAlgorithm = {
  id: "linear-search",
  name: "Linear Search",
  category: "searching",
  lab: "sorting",
  complexity: {
    best: "O(1)",
    average: "O(n)",
    worst: "O(n)",
    space: "O(1)",
  },
  growth: "n",
  description: "Inspects each element in order until the target is found or the array ends.",
  howItWorks:
    "No structure is assumed, so every element may need to be examined — but that also means it works on unsorted data, which binary search cannot. Run both on the same array to see the difference in probe counts.",
  pseudocode,

  generate({ values, target }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];

    rec.record({
      op: { type: "range", start: 0, end: Math.max(0, a.length - 1) },
      phase: "SCANNING",
      explanation: `Scan left to right looking for ${target}.`,
      fields: [
        { label: "Target", value: `${target}`, tone: "accent" },
        { label: "Array Size", value: `${a.length}` },
      ],
      extra: NO_EXTRA,
      codeLine: 1,
    });

    for (let i = 0; i < a.length; i++) {
      const hit = a[i] === target;

      rec.record({
        op: { type: "probe", index: i },
        phase: "PROBING",
        explanation: `Read a[${i}] = ${a[i]}.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Index", value: `${i}`, tone: "active" },
          { label: "Value", value: `${a[i]}` },
          { label: "Checked", value: `${i + 1} / ${a.length}` },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
      });

      rec.record({
        op: { type: "compare", indices: [i, i] },
        phase: "COMPARING",
        explanation: hit
          ? `a[${i}] = ${a[i]} matches the target.`
          : `a[${i}] = ${a[i]} ≠ ${target} — keep going.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Value", value: `${a[i]}` },
          {
            label: "Decision",
            value: hit ? "match" : `${a[i]} ≠ ${target}`,
            tone: hit ? "good" : "muted",
          },
        ],
        extra: NO_EXTRA,
        codeLine: 2,
        count: "comparisons",
      });

      if (hit) {
        rec.record({
          op: { type: "found", index: i },
          phase: "FOUND",
          explanation: `Found ${target} at index ${i} after ${i + 1} ${
            i === 0 ? "comparison" : "comparisons"
          }.`,
          fields: [
            { label: "Result", value: `index ${i}`, tone: "good" },
            { label: "Comparisons", value: `${i + 1}` },
          ],
          extra: NO_EXTRA,
          codeLine: 2,
        });
        return rec.done();
      }

      rec.record({
        op: { type: "discard", start: i, end: i },
        phase: "DISCARDING",
        explanation: `Index ${i} is ruled out. One comparison eliminated exactly one candidate.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Eliminated", value: `${i + 1} of ${a.length}`, tone: "warn" },
        ],
        extra: NO_EXTRA,
        codeLine: 1,
      });
    }

    rec.record({
      op: { type: "exhausted" },
      phase: "NOT FOUND",
      explanation: `Every element was examined — ${target} is not in the array.`,
      fields: [
        { label: "Result", value: "not found", tone: "warn" },
        { label: "Comparisons", value: `${a.length}` },
      ],
      extra: NO_EXTRA,
      codeLine: 4,
    });

    return rec.done();
  },
};
