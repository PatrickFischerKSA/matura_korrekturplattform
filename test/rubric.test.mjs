import test from "node:test";
import assert from "node:assert/strict";
import { calculateCorrectnessGrade, calculateFinalGrade } from "../src/rubric.mjs";

test("berechnet die sprachliche Teilnote nach Stufe und Korrekturprogramm", () => {
  const result = calculateCorrectnessGrade({
    errorCount: 19,
    wordCount: 872,
    level: 4,
    correctionProgram: true,
  });

  assert.equal(result.errorsPer200, 4.36);
  assert.equal(result.grade, 2);
});

test("berechnet die gewichtete Gesamtnote in Viertelnoten", () => {
  const result = calculateFinalGrade({
    contentGrade: 5,
    structureGrade: 4.75,
    styleGrade: 4.75,
    correctnessGrade: 2.25,
  });

  assert.equal(result.raw, 4.35);
  assert.equal(result.rounded, 4.25);
});
