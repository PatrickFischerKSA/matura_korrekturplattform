import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCorrectionDocx, countWords, extractDocumentText } from "./src/docx.mjs";
import { evaluateEssay } from "./src/evaluator.mjs";
import { TASKS } from "./src/tasks.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = resolve(__dirname, "public");
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const port = Number(process.env.PORT || 3031);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/healthz") {
      return sendJson(res, { ok: true });
    }
    if (req.method === "GET" && url.pathname === "/api/tasks") {
      return sendJson(res, { tasks: TASKS });
    }
    if (req.method === "POST" && (url.pathname === "/api/documents/read" || url.pathname === "/api/docx/read")) {
      return handleDocumentRead(req, res);
    }
    if (req.method === "POST" && url.pathname === "/api/evaluate") {
      return handleEvaluate(req, res);
    }
    if (req.method === "POST" && url.pathname === "/api/export") {
      return handleExport(req, res);
    }
    if (req.method === "GET") {
      return serveStatic(url.pathname, res);
    }
    sendJson(res, { error: "Nicht gefunden." }, 404);
  } catch (error) {
    const payload = { error: error.message || "Unerwarteter Fehler." };
    if (error.prompt) payload.prompt = error.prompt;
    sendJson(res, payload, error.statusCode || 500);
  }
});

server.listen(port, host, () => {
  console.log(`Matura-Korrekturplattform laeuft unter http://${host}:${port}`);
});

async function handleDocumentRead(req, res) {
  const body = await readJsonBody(req, 18 * 1024 * 1024);
  const buffer = decodeBase64(body.fileBase64);
  const text = await extractDocumentText({
    buffer,
    fileName: body.fileName,
    mimeType: body.mimeType,
  });
  sendJson(res, {
    fileName: String(body.fileName || "aufsatz"),
    text,
    wordCount: countWords(text),
  });
}

async function handleEvaluate(req, res) {
  const body = await readJsonBody(req, 20 * 1024 * 1024);
  if (!String(body.essayText || "").trim()) {
    return sendJson(res, { error: "Bitte zuerst einen Aufsatz hochladen oder Text einfuegen." }, 400);
  }
  const result = await evaluateEssay({
    ...body,
    correctionProgram: Boolean(body.correctionProgram),
    wordCount: Number(body.wordCount) || countWords(body.essayText),
  });
  sendJson(res, { evaluation: result });
}

async function handleExport(req, res) {
  const body = await readJsonBody(req, 10 * 1024 * 1024);
  if (!body.evaluation) {
    return sendJson(res, { error: "Es liegt noch keine Korrektur fuer den Export vor." }, 400);
  }
  const buffer = await createCorrectionDocx(body.evaluation);
  const safeName = safeFileName(body.evaluation.fileName || "maturaufsatz").replace(/\.(docx|pdf)$/i, "");
  res.writeHead(200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="${safeName}-korrektur.docx"`,
    "Content-Length": buffer.length,
  });
  res.end(buffer);
}

async function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(decodeURIComponent(requested)).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = resolve(join(publicDir, normalized));
  if (!filePath.startsWith(publicDir)) {
    return sendJson(res, { error: "Ungueltiger Pfad." }, 403);
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(content);
  } catch {
    sendJson(res, { error: "Nicht gefunden." }, 404);
  }
}

function readJsonBody(req, limit) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("Die Datei ist zu gross."), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error("Ungueltiges JSON."), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function decodeBase64(value) {
  const text = String(value || "");
  const commaIndex = text.indexOf(",");
  return Buffer.from(commaIndex >= 0 ? text.slice(commaIndex + 1) : text, "base64");
}

function sendJson(res, payload, status = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function safeFileName(value) {
  return String(value || "korrektur")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
