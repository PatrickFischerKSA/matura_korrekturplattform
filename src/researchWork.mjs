export const RESEARCH_WORK_RUBRIC = [
  {
    id: "content",
    title: "Inhalt der schriftlichen Arbeit",
    maxPoints: 40,
    criteria: [
      {
        id: "problem",
        title: "Problemstellung",
        max: 6,
        description:
          "Die Arbeit entwickelt eine klare, eingegrenzte und bearbeitbare Fragestellung. Sie zeigt, warum das Thema relevant ist, grenzt den Untersuchungsbereich sinnvoll ein und macht deutlich, welches Erkenntnisinteresse verfolgt wird.",
      },
      {
        id: "topic",
        title: "Erfassung des Themas",
        max: 6,
        description:
          "Das Thema wird fachlich angemessen erfasst. Zentrale Begriffe werden geklärt, die Ausgangslage wird verständlich dargestellt, und die Arbeit zeigt, dass Grundlagen sorgfältig aufgearbeitet wurden.",
      },
      {
        id: "accuracy",
        title: "Sachliche Richtigkeit",
        max: 6,
        description:
          "Aussagen, Begriffe, Daten, Interpretationen und Schlussfolgerungen sind fachlich korrekt. Fehler, Vereinfachungen oder unbelegte Behauptungen beeinträchtigen die Argumentation nicht wesentlich.",
      },
      {
        id: "sources",
        title: "Quellenbezug",
        max: 6,
        description:
          "Die Arbeit stützt sich auf passende Fachliteratur und weitere geeignete Quellen. Quellen werden nicht nur gesammelt, sondern sinnvoll ausgewertet, miteinander verbunden und für die eigene Fragestellung genutzt.",
      },
      {
        id: "independence",
        title: "Eigenständigkeit",
        max: 6,
        description:
          "Die Arbeit enthält eine klar erkennbare eigene Untersuchung, Interpretation, Auswertung oder Projektleistung. Eigene Überlegungen werden von übernommenen Gedanken unterschieden.",
      },
      {
        id: "reflection",
        title: "Selbstreflexion",
        max: 5,
        description:
          "Die Arbeit reflektiert Vorgehen, Schwierigkeiten, Entscheidungen und Grenzen der Untersuchung. Die Schülerin oder der Schüler kann zeigen, was im Prozess gelernt wurde und was rückblickend anders gemacht würde.",
      },
      {
        id: "traceability",
        title: "Nachvollziehbarkeit",
        max: 5,
        description:
          "Gedankengang, Methode, Resultate und Schlussfolgerungen sind logisch verbunden. Die Leserin oder der Leser kann überprüfen, wie die Ergebnisse zustande gekommen sind.",
      },
    ],
  },
  {
    id: "form",
    title: "Form der schriftlichen Arbeit",
    maxPoints: 20,
    criteria: [
      {
        id: "structure",
        title: "Aufbau / Übersichtlichkeit",
        max: 5,
        description:
          "Die Arbeit ist logisch und systematisch gegliedert. Inhaltsverzeichnis, Einleitung, Hauptteil, Diskussion, Schluss, Quellenverzeichnis und Eigenständigkeitserklärung sind sinnvoll angeordnet.",
      },
      {
        id: "visuals",
        title: "Illustrationen / Tabellen / Visualisierungen",
        max: 5,
        description:
          "Bilder, Tabellen, Grafiken oder andere Visualisierungen sind relevant, verständlich beschriftet und in den Text eingebunden. Sie unterstützen die Aussage der Arbeit und sind nicht bloss dekorativ.",
      },
      {
        id: "citation",
        title: "Zitierregeln / Quellenverzeichnis",
        max: 5,
        description:
          "Direkte und indirekte Übernahmen sind korrekt ausgewiesen. Zitate, Fussnoten, Literaturangaben, Internetquellen, Abbildungen und Tabellen sind vollständig und einheitlich belegt.",
      },
      {
        id: "language",
        title: "Sprache / Stil",
        max: 5,
        description:
          "Die Sprache ist korrekt, anschaulich und dem fachlichen Gegenstand angemessen. Rechtschreibung, Grammatik, Zeichensetzung und Stil unterstützen die Verständlichkeit.",
      },
    ],
  },
  {
    id: "process",
    title: "Lern- und Arbeitsprozess",
    maxPoints: 10,
    criteria: [
      {
        id: "journal",
        title: "Dokumentation / Arbeitsjournal",
        max: 4,
        description:
          "Der Arbeitsprozess ist fortlaufend dokumentiert. Arbeitsjournal, Notizen, Planungsunterlagen oder Reflexionen zeigen, wie Ideen, Entscheidungen, Recherchen und Fortschritte entstanden sind.",
      },
      {
        id: "time",
        title: "Zeitmanagement",
        max: 3,
        description:
          "Die Arbeitsschritte sind realistisch geplant und über den Arbeitszeitraum verteilt. Termine, Zwischenziele und Überarbeitungsphasen wurden eingehalten oder bei Problemen nachvollziehbar angepasst.",
      },
      {
        id: "execution",
        title: "Durchführung des Projekts",
        max: 3,
        description:
          "Das Projekt wurde konsequent umgesetzt. Gespräche, Recherchen, Erhebungen, Analysen oder gestalterische Arbeitsschritte wurden sorgfältig vorbereitet und durchgeführt.",
      },
    ],
  },
  {
    id: "presentation",
    title: "Mündliche Präsentation",
    maxPoints: 30,
    criteria: [
      {
        id: "presentation_content",
        title: "Inhalt",
        max: 6,
        description:
          "Die Präsentation konzentriert sich auf Kernaussage, Fragestellung, Vorgehen und wichtigste Resultate. Sie ist keine blosse Nacherzählung der schriftlichen Arbeit.",
      },
      {
        id: "presentation_structure",
        title: "Aufbau",
        max: 6,
        description:
          "Die Präsentation ist klar strukturiert, zeitlich ausgewogen und führt nachvollziehbar durch Thema, Vorgehen, Ergebnisse und Schlussfolgerungen.",
      },
      {
        id: "presentation_technique",
        title: "Präsentationstechnik",
        max: 6,
        description:
          "Vortragsweise, Sprache, Blickkontakt, Auftreten und Umgang mit der Zeit sind sicher und adressatengerecht. Die Präsentation entspricht dem Niveau einer mündlichen Fachprüfung.",
      },
      {
        id: "media",
        title: "Medieneinsatz",
        max: 6,
        description:
          "Folien, Bilder, Grafiken, Objekte oder andere Medien unterstützen die Vermittlung der Inhalte. Sie sind lesbar, sparsam eingesetzt und technisch vorbereitet.",
      },
      {
        id: "questions",
        title: "Fragen",
        max: 6,
        description:
          "Fachfragen werden souverän, präzise und mit Bezug zur eigenen Arbeit beantwortet. Die Antworten zeigen, dass Thema, Methode und Ergebnisse verstanden und reflektiert wurden.",
      },
    ],
  },
];

const FLAT_CRITERIA = RESEARCH_WORK_RUBRIC.flatMap((section) =>
  section.criteria.map((criterion) => ({ ...criterion, sectionId: section.id, sectionTitle: section.title })),
);

const SWISS_COMMENT_RULES = [
  "Schreibe ausschliesslich in korrekter deutscher Schweizer Standardsprache mit Umlauten.",
  "Verwende ss statt ß.",
  "Formuliere jeden Kommentar sachlich in der dritten Person. Keine direkte Anrede.",
  "Jedes Kriterium braucht einen konkreten Kommentar.",
  "Wenn nicht die Maximalpunktzahl vergeben wird, muss die Begründung ausdrücklich erklären, weshalb Punkte fehlen.",
];

const WORK_TYPE_LABELS = {
  matura: "Maturaarbeit",
  facharbeit: "Facharbeit",
  fachmatura: "Fachmaturaarbeit",
};

export function calculateResearchWorkScore(pointsByCriterion = {}) {
  const sections = RESEARCH_WORK_RUBRIC.map((section) => {
    const raw = section.criteria.reduce((sum, criterion) => sum + normalizePoints(pointsByCriterion[criterion.id], criterion.max), 0);
    return {
      id: section.id,
      title: section.title,
      raw,
      max: section.maxPoints,
    };
  });
  const writtenRaw = sectionRaw(sections, "content") + sectionRaw(sections, "form");
  const processRaw = sectionRaw(sections, "process");
  const presentationRaw = sectionRaw(sections, "presentation");
  const workAndProcessRaw = writtenRaw + processRaw;
  const workWeighted = (workAndProcessRaw / 70) * (200 / 3);
  const presentationWeighted = (presentationRaw / 30) * (100 / 3);
  const total = workWeighted + presentationWeighted;
  return {
    sections,
    writtenRaw,
    processRaw,
    presentationRaw,
    workAndProcessRaw,
    workWeighted: round(workWeighted),
    presentationWeighted: round(presentationWeighted),
    total: round(total),
    grade: roundToQuarter(1 + (Math.max(0, Math.min(100, total)) / 100) * 5),
  };
}

export function buildResearchWorkPrompt(input) {
  const pointsByCriterion = normalizePointsByCriterion(input.pointsByCriterion);
  const score = calculateResearchWorkScore(pointsByCriterion);
  const workType = WORK_TYPE_LABELS[input.workType] || "Facharbeit";
  const criteriaText = FLAT_CRITERIA.map((criterion) => {
    const points = normalizePoints(pointsByCriterion[criterion.id], criterion.max);
    return [
      `- ${criterion.title} (${criterion.sectionTitle}): ${points}/${criterion.max} Punkte`,
      `  Präzisierung: ${criterion.description}`,
    ].join("\n");
  }).join("\n");

  return `Arbeitsmodus: ${workType}
Fragestellung:
${input.researchQuestion || "nicht angegeben"}

Methode(n):
${input.methods || "nicht angegeben"}

Bewertung:
- Schriftliche Arbeit: ${score.writtenRaw}/60 Rohpunkte
- Lern- und Arbeitsprozess: ${score.processRaw}/10 Rohpunkte
- Arbeit + Prozess: ${score.workAndProcessRaw}/70 Rohpunkte, gewichtet ${score.workWeighted}/66.67
- Mündliche Präsentation: ${score.presentationRaw}/30 Rohpunkte, gewichtet ${score.presentationWeighted}/33.33
- Gesamtwertung: ${score.total}/100 Punkte
- Rechnerische Note: ${score.grade}

Kriterien mit Reglerwerten:
${criteriaText}

Sprach- und Kommentarregeln:
${SWISS_COMMENT_RULES.map((rule) => `- ${rule}`).join("\n")}

Auftrag:
1. Kommentiere und begründe jedes Kriterium passend zum vergebenen Reglerwert und zur vorliegenden Arbeit.
2. Übernimm die vergebenen Punkte; ändere die Punktzahlen nicht.
3. Wenn ein Kriterium die Maximalpunktzahl hat, würdige knapp, warum es voll erfüllt ist.
4. Wenn ein Kriterium nicht die Maximalpunktzahl hat, erkläre konkret, weshalb die Maximalpunktzahl nicht erreicht wird.
5. Beziehe Fragestellung und Methode(n) in die Kommentare ein, wo es fachlich sinnvoll ist.
6. Antworte ausschliesslich als gültiges JSON nach diesem Schema:
{
  "summary": "Gesamtbeurteilung",
  "strengths": ["..."],
  "improvements": ["..."],
  "criteria": [
    { "id": "problem", "comment": "Kommentar", "reason": "Begründung bei Punktabzug oder Vollpunkt-Begründung" }
  ]
}

Text der Arbeit:
${input.workText || ""}`;
}

export async function evaluateResearchWork(input) {
  const prompt = buildResearchWorkPrompt(input);
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
        {
          role: "system",
          content:
            "Du bist eine erfahrene Deutschlehrperson und betreust Maturaarbeiten, Facharbeiten und Fachmaturaarbeiten. Du kommentierst sachlich, präzis und in korrekter Schweizer Standardsprache mit Umlauten, ohne direkte Anrede.",
        },
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

  return normalizeResearchWorkEvaluation(parseJsonFromModel(extractOutputText(payload)), input, prompt);
}

export function normalizeResearchWorkEvaluation(modelResult, input, promptUsed = "") {
  const pointsByCriterion = normalizePointsByCriterion(input.pointsByCriterion);
  const score = calculateResearchWorkScore(pointsByCriterion);
  const modelCriteria = new Map((Array.isArray(modelResult.criteria) ? modelResult.criteria : []).map((item) => [item.id, item]));
  const criteria = FLAT_CRITERIA.map((criterion) => {
    const points = normalizePoints(pointsByCriterion[criterion.id], criterion.max);
    const modelItem = modelCriteria.get(criterion.id) || {};
    const fallbackReason =
      points < criterion.max
        ? `Die Maximalpunktzahl wird nicht erreicht, weil die Leistung im Kriterium ${criterion.title} noch nicht vollständig überzeugt.`
        : `Die Maximalpunktzahl ist nachvollziehbar, weil das Kriterium ${criterion.title} überzeugend erfüllt wird.`;
    return {
      id: criterion.id,
      title: criterion.title,
      sectionId: criterion.sectionId,
      sectionTitle: criterion.sectionTitle,
      max: criterion.max,
      points,
      description: criterion.description,
      comment: normalizeSwissComment(modelItem.comment || fallbackReason),
      reason: normalizeSwissComment(modelItem.reason || fallbackReason),
    };
  });

  return {
    mode: "research-work",
    fileName: input.fileName || "",
    workType: WORK_TYPE_LABELS[input.workType] || "Facharbeit",
    researchQuestion: String(input.researchQuestion || ""),
    methods: String(input.methods || ""),
    score,
    criteria,
    summary: normalizeSwissComment(modelResult.summary || ""),
    strengths: Array.isArray(modelResult.strengths) ? modelResult.strengths.map(normalizeSwissComment) : [],
    improvements: Array.isArray(modelResult.improvements) ? modelResult.improvements.map(normalizeSwissComment) : [],
    promptUsed,
  };
}

function normalizePointsByCriterion(pointsByCriterion = {}) {
  const normalized = {};
  for (const criterion of FLAT_CRITERIA) {
    normalized[criterion.id] = normalizePoints(pointsByCriterion[criterion.id], criterion.max);
  }
  return normalized;
}

function normalizePoints(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return max;
  return Math.max(0, Math.min(max, Math.round(number)));
}

function sectionRaw(sections, id) {
  return sections.find((section) => section.id === id)?.raw || 0;
}

function round(value) {
  return Number(value.toFixed(2));
}

function roundToQuarter(value) {
  return Math.round(value * 4) / 4;
}

function normalizeSwissComment(value) {
  return String(value || "")
    .replace(/ß/g, "ss")
    .replace(/\bdu\b/gi, "die Verfasserin")
    .replace(/\bdich\b/gi, "die Verfasserin")
    .replace(/\bdir\b/gi, "der Verfasserin")
    .replace(/\bdein(e|er|em|en|es)?\b/gi, "der vorliegenden Arbeit")
    .replace(/\bSie\b/g, "die Verfasserin")
    .replace(/\bIhnen\b/g, "der Verfasserin")
    .replace(/\bIhre(n|r|s|m)?\b/g, "die vorliegende Arbeit")
    .trim();
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
