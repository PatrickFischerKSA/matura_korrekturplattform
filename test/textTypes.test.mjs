import test from "node:test";
import assert from "node:assert/strict";
import { TASKS } from "../src/tasks.mjs";
import { getTextTypeGuidance, TEXT_TYPE_CATALOG } from "../src/textTypes.mjs";

test("alle in Aufgaben verwendeten Textsorten sind im Katalog abgedeckt", () => {
  const usedTextTypes = new Set(TASKS.flatMap((task) => task.textTypes || []));
  const missing = [...usedTextTypes].filter((type) => !TEXT_TYPE_CATALOG[type]);

  assert.deepEqual(missing, []);
});

test("Textsortenhinweise werden in den Bewertungskontext aufgeloest", () => {
  const guidance = getTextTypeGuidance("Gedichtinterpretation");

  assert.match(guidance, /Form und Sprache/);
  assert.match(guidance, /Leitfragen/);
});
