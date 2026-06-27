import test from "node:test";
import assert from "node:assert/strict";
import { buildEvaluationPrompt, normalizeEvaluation } from "../src/evaluator.mjs";

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

test("Bewertungsprompt verlangt Umlaute, dritte Person und enthaelt die Eichskala", () => {
  const prompt = buildEvaluationPrompt({
    taskTitle: "Thema",
    taskPrompt: "Aufgabe",
    textType: "Essay",
    gradingCalibration: "demanding",
    correctionProgram: true,
    level: 4,
    essayText: "Ein kurzer Aufsatz.",
  });

  assert.match(prompt, /korrekter deutscher Standardsprache mit Umlauten/);
  assert.match(prompt, /niemals eine direkte Anrede/);
  assert.match(prompt, /Bewertungseichung: Sehr streng/);
  assert.match(prompt, /Notenskala zur Eichung/);
  assert.match(prompt, /5\.0: gut/);
  assert.doesNotMatch(prompt, /\bpraezise\b|\bmuessen\b|\bgewaehlte\b|\bKohaesion\b/);
});

test("Kommentare werden auf deutsche Umlaute und dritte Person normalisiert", () => {
  const result = normalizeEvaluation(
    {
      summary: "Du solltest praeziser ueberarbeiten.",
      taskComment: "Sie zeigen eine gewaehlte passende Idee.",
      grades: { content: 4, structure: 4, style: 4 },
      comments: {
        content: "Du zeigst gute Ansaetze.",
        structure: "Achte auf klarere Ueberleitungen.",
        style: "Deine Wortwahl muesste praeziser sein.",
        correctness: "Sie sollten Kommafehler beruecksichtigen.",
        overall: "Du kannst den Schluss staerker erlaeutern.",
      },
      errors: [
        {
          category: "Kohaesion",
          quote: "Original",
          correction: "praeziser",
          explanation: "Die Stelle muesste erlaeutert werden.",
          weight: 0,
        },
      ],
      revisions: ["Ueberarbeite den Schluss."],
    },
    {
      essayText: "Ein kurzer Testtext mit mehreren Wörtern.",
      wordCount: 200,
      level: 4,
      correctionProgram: true,
    },
  );

  assert.equal(result.summary, "Die Verfasserin sollte präziser überarbeiten.");
  assert.match(result.taskComment, /gewählte/);
  assert.doesNotMatch(result.comments.content, /\bDu\b|\bSie\b/);
  assert.match(result.comments.structure, /Überleitungen/);
  assert.match(result.comments.style, /müsste präziser/);
  assert.match(result.comments.correctness, /berücksichtigen/);
  assert.match(result.errors[0].category, /Kohäsion/);
  assert.match(result.errors[0].explanation, /müsste erläutert/);
  assert.match(result.revisions[0], /^Der Text sollte überarbeitet werden:/);
});
