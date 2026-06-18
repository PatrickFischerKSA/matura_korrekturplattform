import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentText, extractPdfText } from "../src/docx.mjs";

test("extrahiert Text aus hochgeladenen PDF-Dateien", async () => {
  const pdf = createSimplePdf("Hallo PDF Upload");

  const text = await extractPdfText(pdf);

  assert.match(text, /Hallo PDF Upload/);
});

test("waehlt die PDF-Extraktion anhand des Dateinamens", async () => {
  const pdf = createSimplePdf("Matura Text");

  const text = await extractDocumentText({
    buffer: pdf,
    fileName: "aufsatz.pdf",
    mimeType: "application/pdf",
  });

  assert.match(text, /Matura Text/);
});

test("meldet PDFs ohne markierbaren Text als Upload-Hinweis", async () => {
  await assert.rejects(
    () => extractPdfText(createBlankPdf()),
    (error) => {
      assert.equal(error.statusCode, 422);
      assert.match(error.message, /kein Text extrahiert/);
      return true;
    },
  );
});

test("weist unbekannte Upload-Formate zurueck", async () => {
  await assert.rejects(
    () =>
      extractDocumentText({
        buffer: Buffer.from("kein dokument"),
        fileName: "aufsatz.txt",
        mimeType: "text/plain",
      }),
    /DOCX- oder PDF-Datei/,
  );
});

function createSimplePdf(text) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${pdfStream(text).length} >>\nstream\n${pdfStream(text)}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function createBlankPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function pdfStream(text) {
  return `BT /F1 24 Tf 72 720 Td (${escapePdfText(text)}) Tj ET`;
}

function escapePdfText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
