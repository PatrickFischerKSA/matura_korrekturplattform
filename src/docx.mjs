import JSZip from "jszip";
import { PDFParse } from "pdf-parse";

const WORD_NAMESPACE =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

export async function extractDocxText(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Die Datei enthaelt kein lesbares Word-Dokument.");
  }

  const documentXml = await documentFile.async("string");
  return xmlToText(documentXml);
}

export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = normalizeExtractedText(result.text);
    if (!text) {
      throw new Error(
        "Aus dem PDF konnte kein Text extrahiert werden. Bitte ein PDF mit markierbarem Text oder eine DOCX-Datei hochladen.",
      );
    }
    return text;
  } catch (error) {
    if (error?.message?.includes("kein Text extrahiert")) throw error;
    throw new Error("Die PDF-Datei konnte nicht gelesen werden. Bitte ein ungeschuetztes PDF mit Textinhalt hochladen.");
  } finally {
    await parser.destroy();
  }
}

export async function extractDocumentText({ buffer, fileName = "", mimeType = "" }) {
  const kind = detectDocumentKind(fileName, mimeType);
  if (kind === "docx") {
    return extractDocxText(buffer);
  }
  if (kind === "pdf") {
    return extractPdfText(buffer);
  }
  throw new Error("Bitte eine DOCX- oder PDF-Datei hochladen.");
}

export function countWords(text) {
  const matches = String(text || "").match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu);
  return matches ? matches.length : 0;
}

function detectDocumentKind(fileName, mimeType) {
  const normalizedName = String(fileName || "").toLowerCase();
  const normalizedMime = String(mimeType || "").toLowerCase();
  if (normalizedName.endsWith(".docx") || normalizedMime.includes("wordprocessingml.document")) {
    return "docx";
  }
  if (normalizedName.endsWith(".pdf") || normalizedMime === "application/pdf") {
    return "pdf";
  }
  return "";
}

function normalizeExtractedText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/^-- \d+ of \d+ --$/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function createCorrectionDocx(evaluation) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels").file(".rels", relsXml());
  const word = zip.folder("word");
  word.file("document.xml", documentXml(evaluation));
  word.file("styles.xml", stylesXml());
  word.file("settings.xml", settingsXml());
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function xmlToText(xml) {
  const paragraphMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  const paragraphs = paragraphMatches
    .map((paragraph) => {
      const withBreaks = paragraph.replace(/<w:br\/>/g, "\n").replace(/<w:tab\/>/g, "\t");
      const textRuns = [...withBreaks.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) =>
        decodeXml(match[1]),
      );
      return textRuns.join("");
    })
    .map((line) => line.replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean);

  return paragraphs.join("\n\n").trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text = "", style = null) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  const lines = String(text || "").split(/\n/);
  const runs = lines
    .map((line, index) => `${index ? "<w:r><w:br/></w:r>" : ""}<w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r>`)
    .join("");
  return `<w:p>${styleXml}${runs}</w:p>`;
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/></w:pPr><w:r><w:t xml:space="preserve">- ${esc(text)}</w:t></w:r></w:p>`;
}

function table(rows) {
  const body = rows
    .map(
      (row) =>
        `<w:tr>${row
          .map(
            (cell) =>
              `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${paragraph(cell)}</w:tc>`,
          )
          .join("")}</w:tr>`,
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/><w:left w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/><w:right w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="B8C0CC"/></w:tblBorders></w:tblPr>${body}</w:tbl>`;
}

function documentXml(evaluation) {
  const grades = evaluation.grades || {};
  const counts = evaluation.counts || {};
  const comments = evaluation.comments || {};
  const errors = Array.isArray(evaluation.errors) ? evaluation.errors : [];
  const revisions = Array.isArray(evaluation.revisions) ? evaluation.revisions : [];

  const errorRows = [
    ["Kategorie", "Fundstelle", "Korrektur", "Erklaerung", "Zaehlung"],
    ...errors.map((error) => [
      error.category || "Fehler",
      error.quote || "",
      error.correction || "",
      error.explanation || "",
      String(error.weight ?? 1),
    ]),
  ];

  const gradeRows = [
    ["Kriterium", "Gewicht", "Note"],
    ["Inhalt", "40%", grades.content ?? ""],
    ["Aufbau", "20%", grades.structure ?? ""],
    ["Stil", "20%", grades.style ?? ""],
    ["Sprachliche Korrektheit", "20%", grades.correctness ?? ""],
    ["Gesamtnote", "100%", grades.finalRounded ?? grades.finalRaw ?? ""],
  ];

  const body = [
    paragraph("Korrekturkommentar Maturaufsatz", "Title"),
    paragraph(evaluation.fileName ? `Dokument: ${evaluation.fileName}` : ""),
    paragraph(evaluation.taskTitle || "", "Heading1"),
    paragraph(evaluation.taskComment || ""),
    paragraph("Noten", "Heading1"),
    table(gradeRows),
    paragraph(
      `Fehler: ${counts.errorCount ?? 0} | Woerter: ${counts.wordCount ?? 0} | Fehler pro 200 Woerter: ${counts.errorsPer200 ?? 0}`,
    ),
    paragraph("Kommentar", "Heading1"),
    paragraph("Inhalt", "Heading2"),
    paragraph(comments.content || ""),
    paragraph("Aufbau", "Heading2"),
    paragraph(comments.structure || ""),
    paragraph("Stil", "Heading2"),
    paragraph(comments.style || ""),
    paragraph("Sprachliche Korrektheit", "Heading2"),
    paragraph(comments.correctness || ""),
    paragraph("Gesamturteil", "Heading2"),
    paragraph(comments.overall || evaluation.summary || ""),
    paragraph("Fehlerliste", "Heading1"),
    errors.length ? table(errorRows) : paragraph("Keine Fehlerliste vorhanden."),
    paragraph("Prioritaeten fuer die Ueberarbeitung", "Heading1"),
    ...(revisions.length ? revisions.map((item) => bullet(item)) : [paragraph("Keine Angaben.")]),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${WORD_NAMESPACE}><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ${WORD_NAMESPACE}><w:zoom w:percent="100"/></w:settings>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${WORD_NAMESPACE}><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="220"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="180" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style></w:styles>`;
}
