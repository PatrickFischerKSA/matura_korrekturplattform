export const RUBRIC = {
  weights: {
    content: 0.4,
    structure: 0.2,
    style: 0.2,
    correctness: 0.2,
  },
  criteria: {
    content:
      "Gesamtidee, gedankliche Auseinandersetzung mit dem gewaehlten Thema, gedankliche Originalitaet, Umfang des Wissens, interne Stimmigkeit, Richtigkeit von Tatsachen",
    structure:
      "Innere und aeussere Gliederung, logische Abfolge der Denkschritte, textsortengemaesse Textstruktur",
    style:
      "Richtigkeit der Sprachmittel (Wortschatz, Syntax, Kohaesion), Angemessenheit der Sprachmittel, stilistische bzw. rhetorische Eigenstaendigkeit, Rezipientenfuehrung",
    correctness:
      "Orthografie, Interpunktion, Grammatik; Kommafehler zaehlen als halbe Fehler",
  },
};

const STEP_BY_LEVEL = {
  1: { withoutProgram: 0.75, withProgram: 0.625 },
  2: { withoutProgram: 0.625, withProgram: 0.5 },
  3: { withoutProgram: 0.5, withProgram: 0.375 },
  4: { withoutProgram: 0.375, withProgram: 0.25 },
};

const BASE_THRESHOLD = {
  withoutProgram: 1,
  withProgram: 0.5,
};

export function normalizeLevel(level) {
  const parsed = Number.parseInt(level, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 4 ? parsed : 4;
}

export function roundToQuarter(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.round(value * 4) / 4;
}

export function calculateCorrectnessGrade({ errorCount, wordCount, level = 4, correctionProgram = true }) {
  const words = Math.max(1, Number(wordCount) || 1);
  const errors = Math.max(0, Number(errorCount) || 0);
  const normalizedLevel = normalizeLevel(level);
  const programKey = correctionProgram ? "withProgram" : "withoutProgram";
  const errorsPer200 = (errors / words) * 200;
  const step = STEP_BY_LEVEL[normalizedLevel][programKey];
  const base = BASE_THRESHOLD[programKey];

  let grade = 1;
  for (let index = 0; index <= 20; index += 1) {
    const note = 6 - index * 0.25;
    const threshold = base + index * step;
    if (errorsPer200 <= threshold + Number.EPSILON) {
      grade = note;
      break;
    }
  }

  return {
    errorCount: errors,
    wordCount: words,
    errorsPer200: Number(errorsPer200.toFixed(2)),
    grade,
  };
}

export function calculateFinalGrade({ contentGrade, structureGrade, styleGrade, correctnessGrade }) {
  const raw =
    (Number(contentGrade) || 1) * RUBRIC.weights.content +
    (Number(structureGrade) || 1) * RUBRIC.weights.structure +
    (Number(styleGrade) || 1) * RUBRIC.weights.style +
    (Number(correctnessGrade) || 1) * RUBRIC.weights.correctness;
  return {
    raw: Number(raw.toFixed(3)),
    rounded: roundToQuarter(raw),
  };
}
