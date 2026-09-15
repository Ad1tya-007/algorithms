import { StepRecorder } from "../core/recorder";
import { NO_EXTRA, type ArrayAlgorithm, type ArrayExtra, type ArrayOp } from "../sorting/model";

const pseudocode = [
  "function binarySearch(a, target) {",
  "  let low = 0;",
  "  let high = a.length - 1;",
  "  while (low <= high) {",
  "    const mid = (low + high) >> 1;",
  "    if (a[mid] === target) return mid;",
  "    if (a[mid] < target) low = mid + 1;",
  "    else high = mid - 1;",
  "  }",
  "  return -1;",
  "}",
];

export const binarySearch: ArrayAlgorithm = {
  id: "binary-search",
  name: "Binary Search",
  category: "searching",
  lab: "sorting",
  complexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(log n)",
    space: "O(1)",
  },
  growth: "log n",
  description:
    "Repeatedly halves a sorted search interval, discarding the half that cannot contain the target.",
  howItWorks:
    "Because the array is sorted, one comparison against the middle element eliminates half of the remaining candidates. The interval shrinks from n to n/2 to n/4, so at most log₂(n) + 1 comparisons are needed — 64 elements take at most 7.",
  pseudocode,

  validate({ values }) {
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        return "Binary search requires a sorted array. Use the Sort action on the dataset first.";
      }
    }
    return null;
  },

  generate({ values, target }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    let low = 0;
    let high = a.length - 1;
    let probes = 0;

    if (a.length === 0) {
      rec.record({
        op: { type: "exhausted" },
        phase: "NOT FOUND",
        explanation: "The array is empty, so the target cannot be present.",
        extra: NO_EXTRA,
        codeLine: 9,
      });
      return rec.done();
    }

    rec.record({
      op: { type: "range", start: low, end: high },
      phase: "SCANNING",
      explanation: `Search for ${target} in the sorted range 0…${high}.`,
      fields: [
        { label: "Target", value: `${target}`, tone: "accent" },
        { label: "Low", value: `${low}` },
        { label: "High", value: `${high}` },
        { label: "Candidates", value: `${high - low + 1}` },
      ],
      extra: NO_EXTRA,
      codeLine: 1,
    });

    while (low <= high) {
      const mid = (low + high) >> 1;
      probes += 1;

      rec.record({
        op: { type: "pointer", name: "low", index: low },
        phase: "SCANNING",
        explanation: `The interval is ${low}…${high} — ${high - low + 1} candidates remain.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Low", value: `${low}`, tone: "active" },
          { label: "High", value: `${high}`, tone: "active" },
          { label: "Candidates", value: `${high - low + 1}` },
        ],
        extra: NO_EXTRA,
        codeLine: 3,
      });

      rec.record({
        op: { type: "pointer", name: "high", index: high },
        phase: "SCANNING",
        explanation: `Midpoint is (${low} + ${high}) / 2 = ${mid}.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Low", value: `${low}` },
          { label: "Mid", value: `${mid}`, tone: "accent" },
          { label: "High", value: `${high}` },
        ],
        extra: NO_EXTRA,
        codeLine: 4,
      });

      rec.record({
        op: { type: "probe", index: mid },
        phase: "PROBING",
        explanation: `Read a[${mid}] = ${a[mid]} and compare it against the target ${target}.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Low", value: `${low}` },
          { label: "Mid", value: `${mid}`, tone: "accent" },
          { label: "High", value: `${high}` },
          { label: "Array[Mid]", value: `${a[mid]}`, tone: "active" },
          { label: "Probes", value: `${probes}` },
        ],
        extra: NO_EXTRA,
        codeLine: 4,
      });

      if (a[mid] === target) {
        rec.record({
          op: { type: "compare", indices: [mid, mid] },
          phase: "COMPARING",
          explanation: `${target} = ${a[mid]} — the target is at index ${mid}.`,
          fields: [
            { label: "Target", value: `${target}`, tone: "accent" },
            { label: "Array[Mid]", value: `${a[mid]}` },
            { label: "Decision", value: `${target} = ${a[mid]}`, tone: "good" },
          ],
          extra: NO_EXTRA,
          codeLine: 5,
          count: "comparisons",
        });

        rec.record({
          op: { type: "found", index: mid },
          phase: "FOUND",
          explanation: `Found ${target} at index ${mid} after ${probes} ${
            probes === 1 ? "probe" : "probes"
          }.`,
          fields: [
            { label: "Result", value: `index ${mid}`, tone: "good" },
            { label: "Probes Used", value: `${probes}`, tone: "good" },
            { label: "Array Size", value: `${a.length}` },
          ],
          extra: NO_EXTRA,
          codeLine: 5,
        });
        return rec.done();
      }

      const goRight = a[mid] < target;
      const nextLow = goRight ? mid + 1 : low;
      const nextHigh = goRight ? high : mid - 1;

      rec.record({
        op: { type: "compare", indices: [mid, mid] },
        phase: "COMPARING",
        explanation: goRight
          ? `${target} > ${a[mid]} — the target must lie to the right of index ${mid}.`
          : `${target} < ${a[mid]} — the target must lie to the left of index ${mid}.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Array[Mid]", value: `${a[mid]}` },
          {
            label: "Decision",
            value: `${target} ${goRight ? ">" : "<"} ${a[mid]}`,
            tone: "warn",
          },
          {
            label: "Next Range",
            value: nextLow <= nextHigh ? `${nextLow} → ${nextHigh}` : "empty",
            tone: "active",
          },
        ],
        extra: NO_EXTRA,
        codeLine: goRight ? 6 : 7,
        count: "comparisons",
      });

      const discardStart = goRight ? low : mid;
      const discardEnd = goRight ? mid : high;
      rec.record({
        op: { type: "discard", start: discardStart, end: discardEnd },
        phase: "DISCARDING",
        explanation: `Eliminate indices ${discardStart}…${discardEnd} — ${
          discardEnd - discardStart + 1
        } candidates removed in one comparison.`,
        fields: [
          { label: "Target", value: `${target}`, tone: "accent" },
          { label: "Eliminated", value: `${discardEnd - discardStart + 1} elements`, tone: "warn" },
          {
            label: "Next Range",
            value: nextLow <= nextHigh ? `${nextLow} → ${nextHigh}` : "empty",
            tone: "active",
          },
          {
            label: "Candidates Left",
            value: `${Math.max(0, nextHigh - nextLow + 1)}`,
          },
        ],
        extra: NO_EXTRA,
        codeLine: goRight ? 6 : 7,
      });

      low = nextLow;
      high = nextHigh;
    }

    rec.record({
      op: { type: "exhausted" },
      phase: "NOT FOUND",
      explanation: `The interval is empty — ${target} is not in the array. ${probes} ${
        probes === 1 ? "probe" : "probes"
      } were enough to rule out all ${a.length} elements.`,
      fields: [
        { label: "Result", value: "not found", tone: "warn" },
        { label: "Probes Used", value: `${probes}` },
        { label: "Array Size", value: `${a.length}` },
      ],
      extra: NO_EXTRA,
      codeLine: 9,
    });

    return rec.done();
  },
};
