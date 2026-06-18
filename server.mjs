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
const appVersion = process.env.RENDER_GIT_COMMIT || process.env.APP_VERSION || "local";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (isReadRequest(req) && url.pathname === "/healthz") {
      return sendJson(res, { ok: true, version: appVersion });
    }
    if (isReadRequest(req) && url.pathname === "/api/tasks") {
      return sendJson(res, { tasks: TASKS });
    }
    if (req.method === "POST" && url.pathname === "/api/ping") {
      await readJsonBody(req, 64 * 1024);
      return sendJson(res, { ok: true });
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
    if (isReadRequest(req)) {
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

async function readJsonBody(req, limit) {
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        throw Object.assign(new Error("Die Datei ist zu gross."), { statusCode: 413 });
      }
      chunks.push(chunk);
    }
  } catch (error) {
    if (error.statusCode) throw error;
    throw Object.assign(new Error("Die Anfrage konnte nicht gelesen werden."), { statusCode: 400 });
  }

  try {
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw Object.assign(new Error("Ungueltiges JSON."), { statusCode: 400 });
  }
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

function isReadRequest(req) {
  return req.method === "GET" || req.method === "HEAD";
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
  res.setHeader("Vary", "Origin");
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return (
      protocol === "https:" &&
      (hostname === "patrickfischerksa.github.io" ||
        hostname === "matura-korrekturplattform.onrender.com")
    );
  } catch {
    return false;
  }
}

function safeFileName(value) {
  return String(value || "korrektur")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
