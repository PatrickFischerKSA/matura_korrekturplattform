import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResearchWorkPrompt,
  calculateResearchWorkScore,
  normalizeResearchWorkEvaluation,
} from "../src/researchWork.mjs";

test("berechnet Facharbeitswertung mit Gewichtung 2/3 zu 1/3", () => {
  const score = calculateResearchWorkScore({
    problem: 6,
    topic: 6,
    accuracy: 6,
    sources: 6,
    independence: 6,
    reflection: 5,
    traceability: 5,
    structure: 5,
    visuals: 5,
    citation: 5,
    language: 5,
    journal: 4,
    time: 3,
    execution: 3,
    presentation_content: 6,
    presentation_structure: 6,
    presentation_technique: 6,
    media: 6,
    questions: 6,
  });

  assert.equal(score.workAndProcessRaw, 70);
  assert.equal(score.presentationRaw, 30);
  assert.equal(score.total, 100);
  assert.equal(score.grade, 6);
});

test("Facharbeits-Prompt verlangt Schweizer Standardsprache und Begründungen", () => {
  const prompt = buildResearchWorkPrompt({
    workType: "fachmatura",
    researchQuestion: "Wie wirkt sich X auf Y aus?",
    methods: "Interview und Literaturrecherche",
    pointsByCriterion: { problem: 4 },
    workText: "Text der Arbeit",
  });

  assert.match(prompt, /Fachmaturaarbeit/);
  assert.match(prompt, /Schweizer Standardsprache/);
  assert.match(prompt, /ss statt ß/);
  assert.match(prompt, /Wenn nicht die Maximalpunktzahl vergeben wird/);
  assert.match(prompt, /Problemstellung.*4\/6 Punkte/s);
});

test("Facharbeitsbewertung erzeugt zu jedem Kriterium Kommentar und Begründung", () => {
  const result = normalizeResearchWorkEvaluation(
    {
      summary: "Die Arbeit ist insgesamt überzeugend.",
      criteria: [
        {
          id: "problem",
          comment: "Die Problemstellung ist teilweise klar.",
          reason: "Die Fragestellung bleibt etwas breit.",
        },
      ],
    },
    {
      workType: "facharbeit",
      researchQuestion: "Wie wirkt sich X auf Y aus?",
      methods: "Interview",
      pointsByCriterion: { problem: 4 },
      workText: "Text",
    },
  );

  const problem = result.criteria.find((criterion) => criterion.id === "problem");
  const fullCriterion = result.criteria.find((criterion) => criterion.id === "topic");

  assert.equal(problem.points, 4);
  assert.equal(problem.max, 6);
  assert.match(problem.reason, /breit/);
  assert.ok(fullCriterion.comment);
  assert.ok(fullCriterion.reason);
  assert.equal(result.workType, "Facharbeit");
});
