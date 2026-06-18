const state = {
  tasks: [],
  selectedGroup: "",
  selectedTask: null,
  fileName: "",
  evaluation: null,
};

const DEFAULT_TASK_GROUP = "Matura-Aufgaben 2026";

const els = {
  status: document.querySelector("#status"),
  docxInput: document.querySelector("#docxInput"),
  fileName: document.querySelector("#fileName"),
  fileMeta: document.querySelector("#fileMeta"),
  taskGroupSelect: document.querySelector("#taskGroupSelect"),
  taskSelect: document.querySelector("#taskSelect"),
  textTypeSelect: document.querySelector("#textTypeSelect"),
  levelSelect: document.querySelector("#levelSelect"),
  correctionProgram: document.querySelector("#correctionProgram"),
  wordCount: document.querySelector("#wordCount"),
  evaluateBtn: document.querySelector("#evaluateBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  essayText: document.querySelector("#essayText"),
  taskPrompt: document.querySelector("#taskPrompt"),
  selectedTaskBadge: document.querySelector("#selectedTaskBadge"),
  charCount: document.querySelector("#charCount"),
  finalGrade: document.querySelector("#finalGrade"),
  gradeContent: document.querySelector("#gradeContent"),
  gradeStructure: document.querySelector("#gradeStructure"),
  gradeStyle: document.querySelector("#gradeStyle"),
  gradeCorrectness: document.querySelector("#gradeCorrectness"),
  errorCount: document.querySelector("#errorCount"),
  errorsPer200: document.querySelector("#errorsPer200"),
  commentBlock: document.querySelector("#commentBlock"),
  errorTable: document.querySelector("#errorTable"),
};

init();

async function init() {
  bindEvents();
  await loadTasks();
  updateTextStats();
}

function bindEvents() {
  els.docxInput.addEventListener("change", handleFileUpload);
  els.taskGroupSelect.addEventListener("change", selectTaskGroup);
  els.taskSelect.addEventListener("change", selectTask);
  els.essayText.addEventListener("input", updateTextStats);
  els.evaluateBtn.addEventListener("click", evaluate);
  els.exportBtn.addEventListener("click", exportDocx);
}

async function loadTasks() {
  const payload = await requestJson("/api/tasks");
  state.tasks = payload.tasks || [];
  const groups = [...new Set(state.tasks.map(getTaskGroup))];
  els.taskGroupSelect.innerHTML = groups
    .map((group) => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`)
    .join("");
  state.selectedGroup = groups[0] || DEFAULT_TASK_GROUP;
  els.taskGroupSelect.value = state.selectedGroup;
  renderTaskOptions();
  selectTask();
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
    const payload = await requestJson("/api/evaluate", {
      method: "POST",
      body: JSON.stringify({
        fileName: state.fileName,
        taskTitle: state.selectedTask?.title || els.taskSelect.value,
        taskPrompt: els.taskPrompt.value,
        textType: els.textTypeSelect.value,
        level: els.levelSelect.value,
        correctionProgram: els.correctionProgram.checked,
        wordCount: Number(els.wordCount.value) || countWords(els.essayText.value),
        essayText: els.essayText.value,
      }),
    });
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

async function exportDocx() {
  if (!state.evaluation) return;
  setStatus("Word-Datei wird erstellt ...");
  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluation: state.evaluation }),
    });
    if (!response.ok) throw new Error((await response.json()).error || "Export fehlgeschlagen.");
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

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "Anfrage fehlgeschlagen.");
    if (payload.prompt) error.prompt = payload.prompt;
    throw error;
  }
  return payload;
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
