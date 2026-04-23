import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvaluation } from "../src/evaluator.mjs";

test("Ausdruckshinweise mit Gewicht 0 erhoehen die sprachliche Fehlerzahl nicht", () => {
  const result = normalizeEvaluation(
    {
      grades: { content: 5, structure: 5, style: 4 },
      comments: {},
      errors: [
        {
          category: "Ausdruck",
          quote: "macht Sinn",
          correction: "ergibt Sinn",
          explanation: "idiomatisch ungenau",
          weight: 0,
        },
        {
          category: "Interpunktion",
          quote: "..., weil er geht",
          correction: "..., weil er geht",
          explanation: "Kommafehler",
          weight: 0.5,
        },
      ],
    },
    {
      essayText: "Ein kurzer Testtext mit mehreren Woertern.",
      wordCount: 200,
      level: 4,
      correctionProgram: true,
    },
  );

  assert.equal(result.counts.errorCount, 0.5);
  assert.equal(result.errors[0].weight, 0);
});
