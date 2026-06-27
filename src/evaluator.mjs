import { calculateCorrectnessGrade, calculateFinalGrade, RUBRIC } from "./rubric.mjs";
import { getTextTypeGuidance } from "./textTypes.mjs";

export const GRADING_CALIBRATIONS = {
  strict: {
    label: "Streng",
    instruction:
      "Strenge Maturitätskorrektur: Die Note 4.0 verlangt eine genügende, aber noch lückenhafte Leistung; Noten ab 5.0 verlangen klare Eigenständigkeit, sichere Textsortenbeherrschung und belastbare sprachliche Qualität.",
  },
  standard: {
    label: "Ausgewogen",
    instruction:
      "Ausgewogene Maturitätskorrektur: Die Bewertung orientiert sich an einer soliden Prüfungskohorte; die Note 4.0 steht für eine knapp genügende, 4.5 für eine ordentliche und 5.0 für eine deutlich gute Leistung.",
  },
  demanding: {
    label: "Sehr streng",
    instruction:
      "Sehr strenge Maturitätskorrektur: Hohe Erwartungen an Genauigkeit, gedankliche Tiefe, Textsortenprofil und sprachliche Sicherheit; gute Noten werden nur bei klar überzeugender Leistung vergeben.",
  },
  generous: {
    label: "Wohlwollend",
    instruction:
      "Wohlwollende Maturitätskorrektur: Gelungene Ansätze und erkennbare Teilleistungen werden stärker gewichtet, ohne fachliche Fehler, Textsortenbrüche oder sprachliche Mängel zu übergehen.",
  },
};

const GRADE_ANCHOR_SCALE = [
  "6.0: außergewöhnlich überzeugend, eigenständig, textsortensicher, nahezu fehlerfrei und sprachlich souverän",
  "5.5: sehr gut, differenziert, klar strukturiert, stilistisch sicher, nur kleinere Schwächen",
  "5.0: gut, tragfähige Gedankenführung, passende Beispiele, klare Textsortenmerkmale, wenige relevante Schwächen",
  "4.5: ordentlich, im Wesentlichen gelungen, aber mit spürbaren Lücken in Tiefe, Aufbau oder sprachlicher Präzision",
  "4.0: genügend, Aufgabenbezug erkennbar, aber begrenzt vertieft, teilweise schematisch oder sprachlich unsicher",
  "3.5: ungenügend, wesentliche Anforderungen nur teilweise erfüllt; deutliche Schwächen in Argumentation, Analyse, Aufbau oder Sprache",
  "3.0 und tiefer: klar ungenügend, Aufgabenstellung oder Textsorte deutlich verfehlt, Gedankengang brüchig oder sprachlich stark beeinträchtigt",
];

const COMMENT_LANGUAGE_RULES = [
  "Alle Kommentare müssen in korrekter deutscher Standardsprache mit Umlauten geschrieben sein: ä, ö, ü, Ä, Ö, Ü und ß statt ae, oe, ue, Ae, Oe, Ue oder ss-Umschreibungen, wo im Deutschen ein Umlaut oder ß erwartet wird.",
  "Kommentare dürfen niemals eine direkte Anrede enthalten. Verboten sind Formulierungen mit du, dich, dir, dein, ihr, euch, euer, Sie, Ihnen, Ihre sowie Imperative wie Überarbeite, Achte, Verwende.",
  "Alle Kommentare müssen konsequent in der dritten Person formuliert sein. Zulässige Bezugnahmen sind zum Beispiel: der Text, der Aufsatz, die Verfasserin, der Verfasser, die Arbeit, die Argumentation.",
  "Überarbeitungshinweise werden ebenfalls in der dritten Person formuliert, zum Beispiel: Der Text sollte ..., Die Argumentation müsste ..., Die Verfasserin könnte ...",
];

const SYSTEM_PROMPT = `Du bist eine sehr strenge Deutschlehrperson mit 20 Jahren Berufserfahrung. Beurteile und benote einen Deutsch-Maturaufsatz nach den vorgegebenen Kriterien. Stimme den Kommentar exakt auf Aufgabenstellung und Textsorte ab. Zähle für die sprachliche Korrektheit nur Orthografie-, Interpunktions- und Grammatikfehler; Kommafehler zählen als halbe Fehler. Ausdrucks-, Wortwahl-, Syntax- und Kohäsionsprobleme werden in der Stilnote berücksichtigt und dürfen erläutert werden, dürfen aber nicht in die Fehlerzahl der sprachlichen Korrektheit eingehen. Sei anspruchsvoll, sachlich, konkret und hilfreich. Schreibe alle Kommentare in korrektem Deutsch mit Umlauten und ausnahmslos in der dritten Person ohne direkte Anrede.`;

export function buildEvaluationPrompt(input) {
  const textTypeGuidance = getTextTypeGuidance(input.textType);
  const calibration = getGradingCalibration(input.gradingCalibration);
  return `Aufgabenstellung:
${input.taskTitle}
${input.taskPrompt}

Textsorte: ${input.textType || "nicht angegeben"}
${textTypeGuidance ? `\n${textTypeGuidance}\n` : ""}
Korrekturprogramm verwendet: ${input.correctionProgram ? "ja" : "nein"}
Klassenstufe: ${input.level}. Gym/FMS
Bewertungseichung: ${calibration.label}
${calibration.instruction}

Notenskala zur Eichung:
${GRADE_ANCHOR_SCALE.map((item) => `- ${item}`).join("\n")}

Bewertungskriterien:
- Inhalt (${RUBRIC.weights.content * 100}%): ${RUBRIC.criteria.content}
- Aufbau (${RUBRIC.weights.structure * 100}%): ${RUBRIC.criteria.structure}
- Stil (${RUBRIC.weights.style * 100}%): ${RUBRIC.criteria.style}
- Sprachliche Korrektheit (${RUBRIC.weights.correctness * 100}%): ${RUBRIC.criteria.correctness}

Auftrag:
1. Beurteile Inhalt, Aufbau und Stil streng mit Noten von 1 bis 6 in Viertelnoten.
2. Stimme alle Kommentare sichtbar auf die Aufgabenstellung und die gewählte Textsorte ab.
3. Befolge diese Sprachregeln zwingend:
${COMMENT_LANGUAGE_RULES.map((rule) => `   - ${rule}`).join("\n")}
4. Zähle für die Note der sprachlichen Korrektheit ausschließlich Orthografie-, Interpunktions- und Grammatikfehler. Liste diese Fehler einzeln mit Kategorie, Fundstelle, Korrektur, kurzer Erklärung und Gewicht auf. Kommafehler erhalten Gewicht 0.5.
5. Ausdrucks-, Wortwahl-, Syntax- und Kohäsionsprobleme gehören zur Stilnote. Du darfst sie in der Fehlerliste aufführen, musst ihnen dann aber Gewicht 0 geben, damit sie nicht in die Grammatik-/Korrektheitsnote eingehen.
6. Gib konkrete Überarbeitungshinweise ausschließlich in der dritten Person.
7. Antworte ausschließlich als gültiges JSON nach diesem Schema:
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
    { "category": "Orthografie|Interpunktion|Grammatik|Ausdruck|Wortwahl|Syntax|Kohäsion", "quote": "Originalstelle", "correction": "Korrektur", "explanation": "kurz", "weight": 1 }
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
    category: normalizeGermanCommentText(error.category || "Fehler"),
    quote: String(error.quote || ""),
    correction: normalizeGermanCommentText(error.correction || ""),
    explanation: normalizeGermanCommentText(error.explanation || ""),
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
    taskComment: normalizeCommentVoice(modelResult.taskComment || ""),
    summary: normalizeCommentVoice(modelResult.summary || ""),
    gradingCalibration: getGradingCalibration(input.gradingCalibration).label,
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
      content: normalizeCommentVoice(modelResult?.comments?.content || ""),
      structure: normalizeCommentVoice(modelResult?.comments?.structure || ""),
      style: normalizeCommentVoice(modelResult?.comments?.style || ""),
      correctness: normalizeCommentVoice(modelResult?.comments?.correctness || ""),
      overall: normalizeCommentVoice(modelResult?.comments?.overall || ""),
    },
    errors: normalizedErrors,
    strengths: Array.isArray(modelResult.strengths) ? modelResult.strengths.map(normalizeCommentVoice) : [],
    revisions: Array.isArray(modelResult.revisions) ? modelResult.revisions.map(normalizeCommentVoice) : [],
    promptUsed,
  };
}

export function getGradingCalibration(value) {
  return GRADING_CALIBRATIONS[value] || GRADING_CALIBRATIONS.strict;
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

function normalizeCommentVoice(value) {
  return forceThirdPerson(normalizeGermanCommentText(value));
}

function normalizeGermanCommentText(value) {
  let text = String(value || "");
  const replacements = [
    [/\bAeusserung(en)?\b/g, "Äußerung$1"],
    [/\baeusser/g, "äußer"],
    [/\bAeusser/g, "Äußer"],
    [/\bgrösser/g, "größer"],
    [/\bGrösse\b/g, "Größe"],
    [/\bmuss\b/g, "muss"],
    [/\bmuessen\b/g, "müssen"],
    [/\bmuessen\b/gi, (match) => preserveCase(match, "müssen")],
    [/\bmuesste(n)?\b/gi, (match) => preserveCase(match, match.toLowerCase().endsWith("n") ? "müssten" : "müsste")],
    [/\bkönnte\b/g, "könnte"],
    [/\bkoennte(n)?\b/gi, (match) => preserveCase(match, match.toLowerCase().endsWith("n") ? "könnten" : "könnte")],
    [/\bueber\b/gi, (match) => preserveCase(match, "über")],
    [/\bueber(?=[a-zäöüß])/gi, (match) => preserveCase(match, "über")],
    [/\bUeberarbeitung\b/g, "Überarbeitung"],
    [/\bueberarbeitung\b/g, "überarbeitung"],
    [/\bgewaehlte(n|r|s|m)?\b/gi, (match) => preserveCase(match, `gewählte${suffix(match, "gewaehlte")}`)],
    [/\bpraezis(e|er|ere|es|en)?\b/gi, (match) => preserveCase(match, `präzis${suffix(match, "praezis")}`)],
    [/\bpraezision\b/gi, (match) => preserveCase(match, "Präzision")],
    [/\bAnsatz\b/g, "Ansatz"],
    [/\bAnsaetze\b/g, "Ansätze"],
    [/\bansaetze\b/g, "ansätze"],
    [/\bstaerker\b/gi, (match) => preserveCase(match, "stärker")],
    [/\bschwaecher\b/gi, (match) => preserveCase(match, "schwächer")],
    [/\bfaellt\b/gi, (match) => preserveCase(match, "fällt")],
    [/\bfaellen\b/gi, (match) => preserveCase(match, "fällen")],
    [/\btraegt\b/gi, (match) => preserveCase(match, "trägt")],
    [/\btraege\b/gi, (match) => preserveCase(match, "träge")],
    [/\bwaere\b/gi, (match) => preserveCase(match, "wäre")],
    [/\bhaette\b/gi, (match) => preserveCase(match, "hätte")],
    [/\bsprachliche Korrektheit ausschliesslich\b/g, "sprachliche Korrektheit ausschließlich"],
    [/\bausschliesslich\b/g, "ausschließlich"],
    [/\bzaehlt\b/g, "zählt"],
    [/\bzaehlen\b/g, "zählen"],
    [/\bZaehlen\b/g, "Zählen"],
    [/\bberuecksichtig(t|en|e|st)?\b/gi, (match) => preserveCase(match, `berücksichtig${suffix(match, "beruecksichtig")}`)],
    [/\berlaeuter(t|n|ung|ungen)?\b/gi, (match) => preserveCase(match, `erläuter${suffix(match, "erlaeuter")}`)],
    [/\bKohäsion\b/g, "Kohäsion"],
    [/\bKohaesion\b/g, "Kohäsion"],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function forceThirdPerson(value) {
  let text = String(value || "").trim();
  const replacements = [
    [/^(Liebe Leserin|Lieber Leser|Liebe Schülerin|Lieber Schüler|Sehr geehrte[^,\n]*|Sehr geehrter[^,\n]*),?\s*/i, ""],
    [/^Du solltest\b/i, "Die Verfasserin sollte"],
    [/^Du musst\b/i, "Die Verfasserin muss"],
    [/^Du kannst\b/i, "Die Verfasserin könnte"],
    [/^Du zeigst\b/i, "Der Text zeigt"],
    [/^Du verwendest\b/i, "Der Text verwendet"],
    [/^Sie sollten\b/, "Die Verfasserin sollte"],
    [/^Sie müssen\b/, "Die Verfasserin muss"],
    [/^Sie zeigen\b/, "Der Text zeigt"],
    [/^Überarbeite\b/, "Der Text sollte überarbeitet werden:"],
    [/^Achte auf\b/, "Der Text sollte stärker auf"],
    [/^Achte\b/, "Der Text sollte beachten"],
    [/\bdein(e|er|em|en|es)?\b/gi, "der vorliegende"],
    [/\bDein(e|er|em|en|es)?\b/g, "Der vorliegende"],
    [/\bdu\b/gi, "die Verfasserin"],
    [/\bdich\b/gi, "die Verfasserin"],
    [/\bdir\b/gi, "der Verfasserin"],
    [/\bSie\b/g, "die Verfasserin"],
    [/\bIhnen\b/g, "der Verfasserin"],
    [/\bIhre(n|r|s|m)?\b/g, "die vorliegende Arbeit"],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function preserveCase(original, replacement) {
  return /^[A-ZÄÖÜ]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

function suffix(value, stem) {
  return String(value).slice(stem.length);
}

function countInputWords(text) {
  const matches = String(text || "").match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu);
  return matches ? matches.length : 0;
}
