const state = {
  tasks: [],
  workRubric: [],
  selectedGroup: "",
  selectedTask: null,
  fileName: "",
  evaluation: null,
};

const DEFAULT_TASK_GROUP = "Matura-Aufgaben 2026";
const DEFAULT_API_ORIGIN = "https://matura-korrekturplattform.onrender.com";

const els = {
  status: document.querySelector("#status"),
  docxInput: document.querySelector("#docxInput"),
  fileName: document.querySelector("#fileName"),
  fileMeta: document.querySelector("#fileMeta"),
  modeSelect: document.querySelector("#modeSelect"),
  taskGroupSelect: document.querySelector("#taskGroupSelect"),
  taskSelect: document.querySelector("#taskSelect"),
  textTypeSelect: document.querySelector("#textTypeSelect"),
  levelSelect: document.querySelector("#levelSelect"),
  gradingCalibration: document.querySelector("#gradingCalibration"),
  correctionProgram: document.querySelector("#correctionProgram"),
  workTypeSelect: document.querySelector("#workTypeSelect"),
  researchQuestion: document.querySelector("#researchQuestion"),
  methodsInput: document.querySelector("#methodsInput"),
  wordCount: document.querySelector("#wordCount"),
  evaluateBtn: document.querySelector("#evaluateBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  essayText: document.querySelector("#essayText"),
  taskPrompt: document.querySelector("#taskPrompt"),
  contextPanelTitle: document.querySelector("#contextPanelTitle"),
  selectedTaskBadge: document.querySelector("#selectedTaskBadge"),
  workRubricPanel: document.querySelector("#workRubricPanel"),
  charCount: document.querySelector("#charCount"),
  finalGrade: document.querySelector("#finalGrade"),
  gradeContent: document.querySelector("#gradeContent"),
  gradeStructure: document.querySelector("#gradeStructure"),
  gradeStyle: document.querySelector("#gradeStyle"),
  gradeCorrectness: document.querySelector("#gradeCorrectness"),
  errorCount: document.querySelector("#errorCount"),
  errorsPer200: document.querySelector("#errorsPer200"),
  commentBlock: document.querySelector("#commentBlock"),
  errorHeadCategory: document.querySelector("#errorHeadCategory"),
  errorHeadQuote: document.querySelector("#errorHeadQuote"),
  errorHeadCorrection: document.querySelector("#errorHeadCorrection"),
  errorHeadWeight: document.querySelector("#errorHeadWeight"),
  errorTable: document.querySelector("#errorTable"),
};

init();

async function init() {
  bindEvents();
  try {
    await loadTasks();
  } catch (error) {
    renderError(error);
    setStatus(error.message, true);
  }
  updateTextStats();
}

function bindEvents() {
  els.docxInput.addEventListener("change", handleFileUpload);
  els.modeSelect.addEventListener("change", updateMode);
  els.taskGroupSelect.addEventListener("change", selectTaskGroup);
  els.taskSelect.addEventListener("change", selectTask);
  els.essayText.addEventListener("input", updateTextStats);
  els.evaluateBtn.addEventListener("click", evaluate);
  els.exportBtn.addEventListener("click", exportDocx);
}

async function loadTasks() {
  const [taskPayload, rubricPayload] = await Promise.all([
    requestJson("/api/tasks"),
    requestJson("/api/research-work/rubric"),
  ]);
  state.tasks = taskPayload.tasks || [];
  state.workRubric = rubricPayload.rubric || [];
  const groups = [...new Set(state.tasks.map(getTaskGroup))];
  els.taskGroupSelect.innerHTML = groups
    .map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`)
    .join("");
  state.selectedGroup = groups[0] || DEFAULT_TASK_GROUP;
  els.taskGroupSelect.value = state.selectedGroup;
  renderTaskOptions();
  renderWorkRubric();
  selectTask();
  updateMode();
}

function selectTaskGroup() {
  state.selectedGroup = els.taskGroupSelect.value;
  renderTaskOptions();
  selectTask();
}

function renderTaskOptions() {
  const tasks = getVisibleTasks();
  els.taskSelect.innerHTML = tasks
    .map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.title)}</option>`)
    .join("");
}

function selectTask() {
  const visibleTasks = getVisibleTasks();
  state.selectedTask = visibleTasks.find((task) => task.id === els.taskSelect.value) || visibleTasks[0];
  if (!state.selectedTask) return;
  els.taskPrompt.value = state.selectedTask.prompt;
  els.selectedTaskBadge.textContent = state.selectedTask.title;
  els.textTypeSelect.innerHTML = (state.selectedTask.textTypes || ["Aufsatz"])
    .map((type) => `<option>${escapeHtml(type)}</option>`)
    .join("");
}

function updateMode() {
  const isWorkMode = currentMode() === "research-work";
  document.querySelectorAll(".essay-only").forEach((el) => el.classList.toggle("hidden", isWorkMode));
  document.querySelectorAll(".work-only").forEach((el) => el.classList.toggle("hidden", !isWorkMode));
  els.taskPrompt.classList.toggle("hidden", isWorkMode);
  els.workRubricPanel.classList.toggle("hidden", !isWorkMode);
  els.contextPanelTitle.textContent = isWorkMode ? "Kriterienraster" : "Aufgabenbezug";
  els.selectedTaskBadge.textContent = isWorkMode ? "Facharbeit / Maturaarbeit" : state.selectedTask?.title || "Matura 2026";
  els.evaluateBtn.textContent = isWorkMode ? "Arbeit kommentieren und bewerten" : "Streng korrigieren";
  resetEvaluation();
}

function currentMode() {
  return els.modeSelect.value;
}

function renderWorkRubric() {
  els.workRubricPanel.innerHTML = state.workRubric
    .map(
      (section) => `<section class="rubric-section">
        <h3>${escapeHtml(section.title)} <span>${escapeHtml(section.maxPoints)} Punkte</span></h3>
        ${(section.criteria || []).map(renderCriterionSlider).join("")}
      </section>`,
    )
    .join("");
  els.workRubricPanel.querySelectorAll('input[type="range"]').forEach((input) => {
    input.addEventListener("input", () => {
      const output = els.workRubricPanel.querySelector(`[data-score-for="${CSS.escape(input.dataset.criterionId)}"]`);
      if (output) output.textContent = `${input.value} / ${input.max}`;
    });
  });
}

function renderCriterionSlider(criterion) {
  return `<div class="criterion-row">
    <div>
      <strong>${escapeHtml(criterion.title)}</strong>
      <small>${escapeHtml(criterion.description)}</small>
    </div>
    <input type="range" min="0" max="${escapeHtml(criterion.max)}" step="1" value="${escapeHtml(criterion.max)}" data-criterion-id="${escapeHtml(criterion.id)}" />
    <div class="criterion-score" data-score-for="${escapeHtml(criterion.id)}">${escapeHtml(criterion.max)} / ${escapeHtml(criterion.max)}</div>
  </div>`;
}

function getVisibleTasks() {
  return state.tasks.filter((task) => getTaskGroup(task) === state.selectedGroup);
}

function getTaskGroup(task) {
  return task.group || DEFAULT_TASK_GROUP;
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  setStatus("Dokument wird gelesen ...");
  try {
    const fileBase64 = await toBase64(file);
    const payload = await requestJson("/api/documents/read", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileBase64 }),
    });
    state.fileName = payload.fileName;
    els.fileName.textContent = payload.fileName;
    els.fileMeta.textContent = `${payload.wordCount} Wörter erkannt`;
    els.essayText.value = payload.text;
    els.wordCount.value = payload.wordCount;
    updateTextStats();
    setStatus("Dokument geladen");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function evaluate() {
  setStatus("Korrektur läuft ...");
  els.evaluateBtn.disabled = true;
  try {
    const payload = currentMode() === "research-work" ? await evaluateResearchWork() : await evaluateEssay();
    state.evaluation = payload.evaluation;
    renderEvaluation(state.evaluation);
    els.exportBtn.disabled = false;
    setStatus("Korrektur abgeschlossen");
  } catch (error) {
    renderError(error);
    setStatus("Korrektur blockiert", true);
  } finally {
    els.evaluateBtn.disabled = false;
  }
}

function evaluateEssay() {
  return requestJson("/api/evaluate", {
    method: "POST",
    body: JSON.stringify({
      fileName: state.fileName,
      taskTitle: state.selectedTask?.title || els.taskSelect.value,
      taskPrompt: els.taskPrompt.value,
      textType: els.textTypeSelect.value,
      level: els.levelSelect.value,
      gradingCalibration: els.gradingCalibration.value,
      correctionProgram: els.correctionProgram.checked,
      wordCount: Number(els.wordCount.value) || countWords(els.essayText.value),
      essayText: els.essayText.value,
    }),
  });
}

function evaluateResearchWork() {
  return requestJson("/api/evaluate-work", {
    method: "POST",
    body: JSON.stringify({
      fileName: state.fileName,
      workType: els.workTypeSelect.value,
      researchQuestion: els.researchQuestion.value,
      methods: els.methodsInput.value,
      pointsByCriterion: getWorkPoints(),
      wordCount: Number(els.wordCount.value) || countWords(els.essayText.value),
      workText: els.essayText.value,
    }),
  });
}

function getWorkPoints() {
  const points = {};
  els.workRubricPanel.querySelectorAll('input[type="range"][data-criterion-id]').forEach((input) => {
    points[input.dataset.criterionId] = Number(input.value);
  });
  return points;
}

async function exportDocx() {
  if (!state.evaluation) return;
  setStatus("Word-Datei wird erstellt ...");
  try {
    const requestUrl = apiUrl("/api/export");
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluation: state.evaluation }),
    });
    if (!response.ok) {
      const payload = await readResponsePayload(response, requestUrl);
      throw new Error(payload.error || "Export fehlgeschlagen.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(state.evaluation.fileName || "maturaufsatz").replace(/\.(docx|pdf)$/i, "")}-korrektur.docx`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Word-Export erstellt");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderEvaluation(evaluation) {
  if (evaluation.mode === "research-work") {
    renderResearchWorkEvaluation(evaluation);
    return;
  }
  setResultTableHeaders("Kategorie", "Fundstelle", "Korrektur", "Zählung");
  els.finalGrade.textContent = formatGrade(evaluation.grades.finalRounded);
  els.gradeContent.textContent = formatGrade(evaluation.grades.content);
  els.gradeStructure.textContent = formatGrade(evaluation.grades.structure);
  els.gradeStyle.textContent = formatGrade(evaluation.grades.style);
  els.gradeCorrectness.textContent = formatGrade(evaluation.grades.correctness);
  els.errorCount.textContent = evaluation.counts.errorCount;
  els.errorsPer200.textContent = evaluation.counts.errorsPer200;
  const comments = evaluation.comments || {};
  els.commentBlock.innerHTML = `
    <h3>Aufgabenbezug</h3><p>${escapeHtml(evaluation.taskComment || "")}</p>
    <h3>Inhalt</h3><p>${escapeHtml(comments.content || "")}</p>
    <h3>Aufbau</h3><p>${escapeHtml(comments.structure || "")}</p>
    <h3>Stil</h3><p>${escapeHtml(comments.style || "")}</p>
    <h3>Sprachliche Korrektheit</h3><p>${escapeHtml(comments.correctness || "")}</p>
    <h3>Gesamturteil</h3><p>${escapeHtml(comments.overall || evaluation.summary || "")}</p>
  `;
  renderErrors(evaluation.errors || []);
}

function renderResearchWorkEvaluation(evaluation) {
  setResultTableHeaders("Kriterium", "Punkte", "Kommentar", "Begründung");
  const score = evaluation.score || {};
  els.finalGrade.textContent = formatGrade(score.grade);
  els.gradeContent.textContent = `${score.writtenRaw ?? 0}/60`;
  els.gradeStructure.textContent = `${score.processRaw ?? 0}/10`;
  els.gradeStyle.textContent = `${score.presentationRaw ?? 0}/30`;
  els.gradeCorrectness.textContent = `${score.total ?? 0}/100`;
  els.errorCount.textContent = score.workWeighted ?? "--";
  els.errorsPer200.textContent = score.presentationWeighted ?? "--";
  const criteria = evaluation.criteria || [];
  els.commentBlock.innerHTML = `
    <h3>${escapeHtml(evaluation.workType || "Facharbeit")}</h3>
    <p><strong>Fragestellung:</strong> ${escapeHtml(evaluation.researchQuestion || "")}</p>
    <p><strong>Methode(n):</strong> ${escapeHtml(evaluation.methods || "")}</p>
    <h3>Gesamtbeurteilung</h3><p>${escapeHtml(evaluation.summary || "")}</p>
    <h3>Stärken der Arbeit</h3>${renderList(evaluation.strengths || [])}
    <h3>Wichtige Verbesserungsmöglichkeiten</h3>${renderList(evaluation.improvements || [])}
  `;
  els.errorTable.innerHTML = criteria
    .map(
      (criterion) => `<tr>
        <td>${escapeHtml(criterion.sectionTitle)}<br><strong>${escapeHtml(criterion.title)}</strong></td>
        <td>${escapeHtml(`${criterion.points} / ${criterion.max}`)}</td>
        <td>${escapeHtml(criterion.comment)}</td>
        <td>${escapeHtml(criterion.reason)}</td>
      </tr>`,
    )
    .join("");
}

function setResultTableHeaders(first, second, third, fourth) {
  els.errorHeadCategory.textContent = first;
  els.errorHeadQuote.textContent = second;
  els.errorHeadCorrection.textContent = third;
  els.errorHeadWeight.textContent = fourth;
}

function renderList(items) {
  if (!items.length) return "<p>Keine Angaben.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderErrors(errors) {
  if (!errors.length) {
    els.errorTable.innerHTML = '<tr><td colspan="4">Keine Fehlerliste vorhanden.</td></tr>';
    return;
  }
  els.errorTable.innerHTML = errors
    .map(
      (error) => `<tr>
        <td>${escapeHtml(error.category)}</td>
        <td>${escapeHtml(error.quote)}</td>
        <td>${escapeHtml(error.correction)}</td>
        <td>${escapeHtml(error.weight)}</td>
      </tr>`,
    )
    .join("");
}

function renderError(error) {
  const prompt = error.prompt
    ? `<h3>Prompt</h3><pre>${escapeHtml(error.prompt)}</pre>`
    : "";
  els.commentBlock.innerHTML = `<h3>Hinweis</h3><p>${escapeHtml(error.message)}</p>${prompt}`;
}

function updateTextStats() {
  const text = els.essayText.value;
  els.charCount.textContent = `${text.length} Zeichen`;
  els.wordCount.value = countWords(text);
}

function resetEvaluation() {
  state.evaluation = null;
  els.exportBtn.disabled = true;
  els.finalGrade.textContent = "--";
}

async function requestJson(url, options = {}) {
  const requestUrl = apiUrl(url);
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await readResponsePayload(response, requestUrl);
  if (!response.ok) {
    const error = new Error(payload.error || "Anfrage fehlgeschlagen.");
    if (payload.prompt) error.prompt = payload.prompt;
    throw error;
  }
  if (payload.ok === false) {
    throw new Error(payload.error || "Anfrage fehlgeschlagen.");
  }
  return payload;
}

async function readResponsePayload(response, url) {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text);
    const message = isHtml
      ? "Die Server-API ist gerade nicht erreichbar. Bitte die Seite neu laden; falls das wieder passiert, ist das Deployment noch nicht fertig gestartet."
      : `Die API ${url} liefert keine gueltige JSON-Antwort.`;
    throw new Error(message);
  }
}

function apiUrl(path) {
  const origin = apiOrigin();
  return origin ? `${origin}${path}` : path;
}

function apiOrigin() {
  if (typeof window.MATURA_API_ORIGIN === "string" && window.MATURA_API_ORIGIN.trim()) {
    return window.MATURA_API_ORIGIN.trim().replace(/\/$/, "");
  }
  const hostname = window.location.hostname;
  const runsOnApiServer =
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname.endsWith(".onrender.com");
  return runsOnApiServer ? "" : DEFAULT_API_ORIGIN;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("error", isError);
}

function countWords(text) {
  return (String(text || "").match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu) || []).length;
}

function formatGrade(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2).replace(/\.00$/, "") : "--";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
