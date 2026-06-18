import { calculateCorrectnessGrade, calculateFinalGrade, RUBRIC } from "./rubric.mjs";
import { getTextTypeGuidance } from "./textTypes.mjs";

const SYSTEM_PROMPT = `Du bist ein sehr strenger Deutschlehrer mit 20 Jahren Berufserfahrung. Beurteile und benote einen Deutsch-Maturaufsatz nach den vorgegebenen Kriterien. Stimme deinen Kommentar exakt auf Aufgabenstellung und Textsorte ab. Zaehle fuer die sprachliche Korrektheit nur Orthografie-, Interpunktions- und Grammatikfehler; Kommafehler zaehlen als halbe Fehler. Ausdrucks-, Wortwahl-, Syntax- und Kohaesionsprobleme werden in der Stilnote beruecksichtigt und duerfen erlaeutert werden, duerfen aber nicht in die Fehlerzahl der sprachlichen Korrektheit eingehen. Sei anspruchsvoll, sachlich, konkret und hilfreich.`;

export function buildEvaluationPrompt(input) {
  const textTypeGuidance = getTextTypeGuidance(input.textType);
  return `Aufgabenstellung:
${input.taskTitle}
${input.taskPrompt}

Textsorte: ${input.textType || "nicht angegeben"}
${textTypeGuidance ? `\n${textTypeGuidance}\n` : ""}
Korrekturprogramm verwendet: ${input.correctionProgram ? "ja" : "nein"}
Klassenstufe: ${input.level}. Gym/FMS

Bewertungskriterien:
- Inhalt (${RUBRIC.weights.content * 100}%): ${RUBRIC.criteria.content}
- Aufbau (${RUBRIC.weights.structure * 100}%): ${RUBRIC.criteria.structure}
- Stil (${RUBRIC.weights.style * 100}%): ${RUBRIC.criteria.style}
- Sprachliche Korrektheit (${RUBRIC.weights.correctness * 100}%): ${RUBRIC.criteria.correctness}

Auftrag:
1. Beurteile Inhalt, Aufbau und Stil streng mit Noten von 1 bis 6 in Viertelnoten.
2. Stimme alle Kommentare sichtbar auf die Aufgabenstellung und die gewaehlte Textsorte ab.
3. Zaehle fuer die Note der sprachlichen Korrektheit ausschliesslich Orthografie-, Interpunktions- und Grammatikfehler. Liste diese Fehler einzeln mit Kategorie, Fundstelle, Korrektur, kurzer Erklaerung und Gewicht auf. Kommafehler erhalten Gewicht 0.5.
4. Ausdrucks-, Wortwahl-, Syntax- und Kohaesionsprobleme gehoeren zur Stilnote. Du darfst sie in der Fehlerliste auffuehren, musst ihnen dann aber Gewicht 0 geben, damit sie nicht in die Grammatik-/Korrektheitsnote eingehen.
5. Gib konkrete Ueberarbeitungshinweise.
6. Antworte ausschliesslich als gueltiges JSON nach diesem Schema:
{
  "summary": "kurzes Gesamturteil",
  "taskComment": "Kommentar zum Aufgabenbezug",
  "grades": { "content": 4.75, "structure": 4.5, "style": 4.25 },
  "comments": {
    "content": "Kommentar",
    "structure": "Kommentar",
    "style": "Kommentar",
    "correctness": "Kommentar",
    "overall": "Kommentar"
  },
  "errors": [
    { "category": "Orthografie|Interpunktion|Grammatik|Ausdruck|Wortwahl|Syntax|Kohaesion", "quote": "Originalstelle", "correction": "Korrektur", "explanation": "kurz", "weight": 1 }
  ],
  "strengths": ["..."],
  "revisions": ["..."]
}

Aufsatz:
${input.essayText}`;
}

export async function evaluateEssay(input) {
  const prompt = buildEvaluationPrompt(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY ist nicht gesetzt.");
    error.statusCode = 503;
    error.prompt = prompt;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI-Anfrage fehlgeschlagen (${response.status}).`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const text = extractOutputText(payload);
  const parsed = parseJsonFromModel(text);
  return normalizeEvaluation(parsed, input, prompt);
}

export function normalizeEvaluation(modelResult, input, promptUsed = "") {
  const errors = Array.isArray(modelResult.errors) ? modelResult.errors : [];
  const normalizedErrors = errors.map((error) => ({
    category: String(error.category || "Fehler"),
    quote: String(error.quote || ""),
    correction: String(error.correction || ""),
    explanation: String(error.explanation || ""),
    weight: normalizeWeight(error.weight),
  }));
  const errorCount = normalizedErrors.reduce((sum, error) => sum + error.weight, 0);
  const wordCount = Number(input.wordCount) || countInputWords(input.essayText);
  const correctness = calculateCorrectnessGrade({
    errorCount,
    wordCount,
    level: input.level,
    correctionProgram: input.correctionProgram,
  });
  const content = normalizeGrade(modelResult?.grades?.content);
  const structure = normalizeGrade(modelResult?.grades?.structure);
  const style = normalizeGrade(modelResult?.grades?.style);
  const final = calculateFinalGrade({
    contentGrade: content,
    structureGrade: structure,
    styleGrade: style,
    correctnessGrade: correctness.grade,
  });

  return {
    fileName: input.fileName || "",
    taskTitle: input.taskTitle || "",
    taskComment: String(modelResult.taskComment || ""),
    summary: String(modelResult.summary || ""),
    grades: {
      content,
      structure,
      style,
      correctness: correctness.grade,
      finalRaw: final.raw,
      finalRounded: final.rounded,
    },
    counts: {
      errorCount: Number(errorCount.toFixed(2)),
      wordCount,
      errorsPer200: correctness.errorsPer200,
    },
    comments: {
      content: String(modelResult?.comments?.content || ""),
      structure: String(modelResult?.comments?.structure || ""),
      style: String(modelResult?.comments?.style || ""),
      correctness: String(modelResult?.comments?.correctness || ""),
      overall: String(modelResult?.comments?.overall || ""),
    },
    errors: normalizedErrors,
    strengths: Array.isArray(modelResult.strengths) ? modelResult.strengths.map(String) : [],
    revisions: Array.isArray(modelResult.revisions) ? modelResult.revisions.map(String) : [],
    promptUsed,
  };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const chunks = [];
  for (const output of payload.output || []) {
    for (const item of output.content || []) {
      if (typeof item.text === "string") chunks.push(item.text);
      if (typeof item.output_text === "string") chunks.push(item.output_text);
    }
  }
  return chunks.join("\n");
}

function parseJsonFromModel(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Die KI-Antwort enthielt kein auswertbares JSON.");
    return JSON.parse(match[0]);
  }
}

function normalizeGrade(value) {
  const number = Math.max(1, Math.min(6, Number(value) || 1));
  return Math.round(number * 4) / 4;
}

function normalizeWeight(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  if (number <= 0) return 0;
  return Math.round(number * 2) / 2;
}

function countInputWords(text) {
  const matches = String(text || "").match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu);
  return matches ? matches.length : 0;
}
