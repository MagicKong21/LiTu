const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  taskSource: "wechat",
  tasks: [],
  manualTasks: [],
  completedKeys: new Set(),
  skippedKeys: new Set(),
  selectedTask: null,
  productInfo: null,
  revealTaskKey: "",
  settings: null,
  productDescriptions: [],
  productPreviewUrls: new Map(),
  productMatches: [],
  buttonResults: [],
  buttonResultId: 0,
  distribution: {
    loaded: false,
    loading: false,
    tasks: [],
    counts: { pending: 0, synced: 0, skipped: 0 },
    filter: "pending",
    selectedId: "",
    detail: null,
    selectedVersion: 0,
  },
};
const CID = "53qvofdc";
const MANUAL_TASKS_KEY = "lizhi.manualTasks.v1";
const COMPLETED_TASKS_KEY = "lizhi.completedTasks.v1";
const SKIPPED_TASKS_KEY = "lizhi.skippedTasks.v1";
const TASK_SOURCE_KEY = "lizhi.taskSource.v1";
const DOWNLOAD_DIR_KEY = "lizhi.downloadDir.v1";
const MAX_DISTRIBUTION_VERSIONS = 4;
const ANNOTATION_NUMBER_SIZE = 110;
const ANNOTATION_HANDLE_SIZE = 18;
const ANNOTATION_MAGNIFIER_COLOR = "#ff594b";
const ANNOTATION_MAGNIFIER_LINE_WIDTH = 8;
const IMAGE_EXPORT_WIDTH = 2000;
const SYSTEM_CORNER_RADIUS = 32;
const CONTINUOUS_CORNER_EXPONENT = 4;
const CONTINUOUS_CORNER_EXTENT = 1.52866483;
const BLUE_BG_SHADOW_BLUR = 38;
const BLUE_BG_SHADOW_OFFSET_Y = 18;
const BLUE_BG_ASSET_URL = "./assets/lizhi-blue-wallpaper.png";
const BG_HEADER_ASSET_URL = "./assets/IMG_header.png";
const BG_FOOTER_ASSET_URL = "./assets/IMG_footer.png";
const BLUE_BG_MAX_LAYERS = 3;
const BLUE_BG_HANDLE_SIZE = 28;
let marchingAntsOffset = 0;
const blueBgState = {
  background: null,
  layers: [],
  selectedId: null,
  selectedIds: [],
  nextId: 1,
  interaction: null,
  sourceName: "",
  outputUrl: "",
  zoom: 1,
  baseDisplayWidth: 0,
  baseDisplayHeight: 0,
  gestureStartZoom: 1,
  snapGuides: { vertical: [], horizontal: [] },
};
let bgMaterials = [];
let bgSelectedMaterialIndex = -1;
let bgSelectedMaterialIndices = [];
let bgGeneratedResults = [];
let bgHistory = [];
let bgHistoryIndex = -1;
const bgRenderControllers = new WeakMap();
let bgDecorAssetsPromise = null;
const imageEditorState = {
  documentCanvas: document.createElement("canvas"),
  sourceName: "",
  hasImage: false,
  mode: "view",
  selection: null,
  interaction: null,
  gradient: null,
  snapGuides: { vertical: [], horizontal: [] },
  history: [],
  historyIndex: -1,
  zoom: 1,
  baseDisplayWidth: 0,
  baseDisplayHeight: 0,
  gestureStartZoom: 1,
  secondImage: null,
};
const annotationState = {
  image: null,
  sourceName: "",
  mode: "view",
  items: [],
  selectedId: null,
  selectedIds: [],
  nextNumber: 1,
  nextId: 1,
  interaction: null,
  snapGuides: { vertical: [], horizontal: [] },
  zoom: 1,
  baseDisplayWidth: 0,
  baseDisplayHeight: 0,
  gestureStartZoom: 1,
  editingNumberId: null,
  history: [],
  historyIndex: -1,
};
let completionAudioCtx = null;

function canvasDisplayUnit(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width > 0 ? rect.width / canvas.width : 1;
  return 1 / Math.max(scale, 0.0001);
}

function drawMarchingAntsSelection(ctx, canvas, bounds, handles = true) {
  const unit = canvasDisplayUnit(canvas);
  const dash = 5 * unit;
  ctx.save();
  ctx.lineWidth = unit;
  ctx.strokeStyle = "#ffffff";
  ctx.setLineDash([]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeStyle = "#111111";
  ctx.setLineDash([dash, dash]);
  ctx.lineDashOffset = -marchingAntsOffset * unit;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  if (handles) {
    const radius = 3.5 * unit;
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = unit;
    [
      [bounds.x, bounds.y],
      [bounds.x + bounds.width, bounds.y],
      [bounds.x + bounds.width, bounds.y + bounds.height],
      [bounds.x, bounds.y + bounds.height],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.restore();
}

function syncCanvasSelectionOverlay(stage, canvas, overlay, bounds) {
  if (!stage || !canvas || !overlay || !bounds) {
    if (overlay) overlay.hidden = true;
    return;
  }
  const stageRect = stage.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / Math.max(1, canvas.width);
  const scaleY = canvasRect.height / Math.max(1, canvas.height);
  overlay.hidden = false;
  overlay.style.left = `${canvasRect.left - stageRect.left + stage.scrollLeft + bounds.x * scaleX}px`;
  overlay.style.top = `${canvasRect.top - stageRect.top + stage.scrollTop + bounds.y * scaleY}px`;
  overlay.style.width = `${Math.max(2, bounds.width * scaleX)}px`;
  overlay.style.height = `${Math.max(2, bounds.height * scaleY)}px`;
}

function unionBounds(boundsList) {
  const valid = boundsList.filter(Boolean);
  if (!valid.length) return null;
  const left = Math.min(...valid.map(bounds => bounds.x));
  const top = Math.min(...valid.map(bounds => bounds.y));
  const right = Math.max(...valid.map(bounds => bounds.x + bounds.width));
  const bottom = Math.max(...valid.map(bounds => bounds.y + bounds.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function syncCanvasSelectionOverlays(stage, canvas, primaryOverlay, selections) {
  if (!stage || !canvas || !primaryOverlay) return;
  $$(".multi-selection-overlay", stage).forEach(overlay => overlay.remove());
  if (!selections.length) {
    syncCanvasSelectionOverlay(stage, canvas, primaryOverlay, null);
    return;
  }
  selections.forEach((selection, index) => {
    const overlay = index === 0 ? primaryOverlay : primaryOverlay.cloneNode(true);
    if (index > 0) {
      overlay.removeAttribute("id");
      overlay.classList.add("multi-selection-overlay");
      stage.appendChild(overlay);
    }
    syncCanvasSelectionOverlay(stage, canvas, overlay, selection.bounds);
  });
}

const selectionCursorByHandle = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
};

function hitSelectionHandle(bounds, point, canvas, tolerancePx = 12) {
  const rect = canvas.getBoundingClientRect();
  const toleranceX = tolerancePx * canvas.width / Math.max(1, rect.width);
  const toleranceY = tolerancePx * canvas.height / Math.max(1, rect.height);
  const left = bounds.x;
  const top = bounds.y;
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  const nearX = (value, target) => Math.abs(value - target) <= toleranceX;
  const nearY = (value, target) => Math.abs(value - target) <= toleranceY;
  if (nearX(point.x, left) && nearY(point.y, top)) return "nw";
  if (nearX(point.x, right) && nearY(point.y, top)) return "ne";
  if (nearX(point.x, right) && nearY(point.y, bottom)) return "se";
  if (nearX(point.x, left) && nearY(point.y, bottom)) return "sw";
  if (point.x >= left && point.x <= right && nearY(point.y, top)) return "n";
  if (point.x >= left && point.x <= right && nearY(point.y, bottom)) return "s";
  if (point.y >= top && point.y <= bottom && nearX(point.x, left)) return "w";
  if (point.y >= top && point.y <= bottom && nearX(point.x, right)) return "e";
  return null;
}

function emptySnapGuides() {
  return { vertical: [], horizontal: [] };
}

function nearestSnap(value, targets, tolerance) {
  let best = null;
  targets.forEach(target => {
    const distance = Math.abs(value - target);
    if (distance <= tolerance && (!best || distance < best.distance)) {
      best = { value: target, distance };
    }
  });
  return best;
}

function snapBoundsToCanvas(bounds, canvas, tolerancePx = 10, includeCenter = true) {
  const rect = canvas.getBoundingClientRect();
  const toleranceX = tolerancePx * canvas.width / Math.max(1, rect.width);
  const toleranceY = tolerancePx * canvas.height / Math.max(1, rect.height);
  const xCandidates = [
    { edge: bounds.x, target: 0, offset: 0 },
    { edge: bounds.x + bounds.width, target: canvas.width, offset: bounds.width },
  ];
  const yCandidates = [
    { edge: bounds.y, target: 0, offset: 0 },
    { edge: bounds.y + bounds.height, target: canvas.height, offset: bounds.height },
  ];
  if (includeCenter) {
    xCandidates.push({
      edge: bounds.x + bounds.width / 2,
      target: canvas.width / 2,
      offset: bounds.width / 2,
    });
    yCandidates.push({
      edge: bounds.y + bounds.height / 2,
      target: canvas.height / 2,
      offset: bounds.height / 2,
    });
  }
  const xMatch = xCandidates
    .map(candidate => ({ ...candidate, distance: Math.abs(candidate.edge - candidate.target) }))
    .filter(candidate => candidate.distance <= toleranceX)
    .sort((a, b) => a.distance - b.distance)[0];
  const yMatch = yCandidates
    .map(candidate => ({ ...candidate, distance: Math.abs(candidate.edge - candidate.target) }))
    .filter(candidate => candidate.distance <= toleranceY)
    .sort((a, b) => a.distance - b.distance)[0];
  return {
    x: xMatch ? xMatch.target - xMatch.offset : bounds.x,
    y: yMatch ? yMatch.target - yMatch.offset : bounds.y,
    guides: {
      vertical: xMatch ? [xMatch.target] : [],
      horizontal: yMatch ? [yMatch.target] : [],
    },
  };
}

function drawCanvasSnapGuides(ctx, canvas, guides) {
  if (!guides?.vertical?.length && !guides?.horizontal?.length) return;
  const unit = canvasDisplayUnit(canvas);
  ctx.save();
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = unit;
  ctx.setLineDash([5 * unit, 5 * unit]);
  guides.vertical.forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  });
  guides.horizontal.forEach(y => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  });
  ctx.restore();
}

function animateMarchingAnts() {
  if (document.hidden) return;
  marchingAntsOffset = (marchingAntsOffset + 1) % 10;
}

function workflowDate() {
  return new Date().toLocaleDateString("sv-SE");
}

function prepareCompletionSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!completionAudioCtx) completionAudioCtx = new AudioContextClass();
  if (completionAudioCtx.state === "suspended") completionAudioCtx.resume().catch(() => {});
}

function playCompletionSound() {
  try {
    prepareCompletionSound();
    if (!completionAudioCtx) return;
    const now = completionAudioCtx.currentTime;
    [
      [0, 660],
      [0.16, 880],
    ].forEach(([offset, frequency]) => {
      const osc = completionAudioCtx.createOscillator();
      const gain = completionAudioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      osc.connect(gain).connect(completionAudioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.19);
    });
  } catch (err) {
    console.warn("completion sound failed", err);
  }
}

function showTab(id) {
  $$(".tabs button").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === id));
  $$(".panel").forEach(panel => panel.classList.toggle("active", panel.id === id));
  if (id === "distribution") scheduleDistributionScrollAnchors();
  if (id === "distribution" && !state.distribution.loaded && !state.distribution.loading) {
    loadDistributionTasks().catch(err => {
      $("#distributionTaskList").innerHTML = `<div class="distribution-empty">${escapeHtml(err.message)}</div>`;
    });
  }
}

async function api(path, payload) {
  let res;
  try {
    res = await fetch(path, {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
  } catch (err) {
    throw new Error(`无法连接本地工具服务。请确认页面是从 http://127.0.0.1:8765 打开的，并且 server.py 正在运行。原始错误：${err.message}`);
  }
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!res.ok) throw new Error(text || res.statusText);
    throw new Error(`接口返回格式异常：${text.slice(0, 120)}`);
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function fetchBlob(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch (err) {
    throw new Error(`无法连接本地工具服务。请确认页面是从 http://127.0.0.1:8765 打开的，并且 server.py 正在运行。原始错误：${err.message}`);
  }
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

async function shutdownToolbox() {
  const btn = $("#shutdownToolbox");
  if (!confirm("关闭当前中控台标签页，并停止本地后台服务？")) return;
  btn.disabled = true;
  btn.textContent = "正在关闭...";
  try {
    await api("/api/shutdown", {});
  } catch (err) {
    // The server may close before the browser finishes reading the response.
    console.warn(err);
  }

  window.open("", "_self");
  window.close();
  setTimeout(() => {
    document.body.innerHTML = '<main class="shutdown-message"><h1>后台服务已关闭</h1><p>如果这个标签页没有自动关闭，可以手动关闭它。</p></main>';
  }, 250);
}

async function loadTasks() {
  const data = await api(state.taskSource === "wp" ? "/api/wp-tasks" : "/api/tasks");
  state.tasks = data.tasks || [];
  if (data.error) $("#packageResult").textContent = data.error;
  updateTaskSourceUi();
  renderTasks();
}

async function loadSettings() {
  const data = await api("/api/settings");
  state.settings = data;
  const input = $("#downloadDir");
  const saved = localStorage.getItem(DOWNLOAD_DIR_KEY) || "";
  input.value = saved || data.defaultDownloadDir || "";
  input.placeholder = data.platform === "win32" ? "C:\\Users\\用户名\\Downloads" : "/Users/用户名/Downloads";
}

function renderTasks() {
  const q = $("#taskSearch").value.trim().toLowerCase();
  const list = $("#taskList");
  const completedList = $("#completedTaskList");
  const skippedList = $("#skippedTaskList");
  const allTasks = [...(state.taskSource === "wechat" ? state.manualTasks : []), ...state.tasks];
  const activeTasks = allTasks.filter(task => !isTaskCompleted(task) && !isTaskSkipped(task));
  const completedTasks = allTasks.filter(task => isTaskCompleted(task));
  const skippedTasks = allTasks.filter(task => isTaskSkipped(task));
  list.innerHTML = "";
  completedList.innerHTML = "";
  skippedList.innerHTML = "";
  $("#taskCount").textContent = `(${activeTasks.length} 篇)`;
  $("#completedCount").textContent = `(${completedTasks.length} 篇)`;
  $("#skippedCount").textContent = `(${skippedTasks.length} 篇)`;
  activeTasks
    .filter(task => !q || task.title.toLowerCase().includes(q))
    .forEach(task => list.appendChild(taskRow(task, "active")));
  completedTasks
    .filter(task => !q || task.title.toLowerCase().includes(q))
    .forEach(task => completedList.appendChild(taskRow(task, "completed")));
  skippedTasks
    .filter(task => !q || task.title.toLowerCase().includes(q))
    .forEach(task => skippedList.appendChild(taskRow(task, "skipped")));
}

function taskRow(task, mode) {
  const div = document.createElement("div");
  const key = taskKey(task);
  div.dataset.taskKey = key;
  div.className = "task" + (taskKey(state.selectedTask) === key ? " active" : "") + (mode === "completed" || mode === "skipped" ? " completed" : "") + (state.revealTaskKey === key ? " reveal" : "");
  const actionLabel = mode === "active" ? "完成" : "恢复";
  const skipButton = mode === "active" ? '<button class="task-skip" type="button">不处理</button>' : "";
  const sourceLink = task.url
    ? `<a class="task-source" href="${escapeAttr(task.url || "#")}" target="_blank" rel="noopener" title="打开公众号原文">原文</a>`
    : `<a class="task-source" href="${escapeAttr(task.localUrl || "#")}" target="_blank" rel="noopener" title="打开 WordPress 原文">原文</a>`;
  const publishLink = mode === "completed" && task.publishUrl
    ? `<a class="task-publish" href="${escapeAttr(task.publishUrl)}" target="_blank" rel="noopener" title="打开这篇文章的发布信息">发布信息</a>`
    : "";
  const articleLink = mode === "completed" && task.articleUrl
    ? `<a class="task-article" href="${escapeAttr(task.articleUrl)}" target="_blank" rel="noopener" title="打开线上文章">链接</a>`
    : "";
  const metaReads = task.reads ? ` · ${task.reads} 阅读` : "";
  const statusText = task.status && task.status !== "pending" ? ` · ${task.status}` : "";
  const productText = task.manualProduct ? ` · 商品：${task.manualProduct}` : "";
  div.innerHTML = `<div class="task-main">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">${task.date || workflowDate()} · ${task.type || "手动"}${metaReads}${statusText}${escapeHtml(productText)}</div>
    </div>
    ${sourceLink}
    ${publishLink}
    ${articleLink}
    ${skipButton}
    <button class="task-done" type="button">${actionLabel}</button>`;
  div.onclick = () => mode === "active" ? selectTask(task) : null;
  $(".task-source", div).onclick = event => event.stopPropagation();
  const publishEl = $(".task-publish", div);
  if (publishEl) publishEl.onclick = event => event.stopPropagation();
  const skipEl = $(".task-skip", div);
  if (skipEl) {
    skipEl.onclick = event => {
      event.stopPropagation();
      skipTask(task).catch(err => $("#packageResult").textContent = err.message);
    };
  }
  $(".task-done", div).onclick = event => {
    event.stopPropagation();
    if (mode === "completed" || mode === "skipped") restoreTask(task).catch(err => $("#packageResult").textContent = err.message);
    else completeTask(task).catch(err => $("#packageResult").textContent = err.message);
  };
  return div;
}

async function editWpManualProduct(task) {
  const current = task.manualProduct || "";
  const value = prompt(
    "请输入这篇 WP 文章要插入商品按钮的软件名或数码荔枝商品页链接。\n留空并确认 = 清除手动指定，继续按标题自动匹配。",
    current
  );
  if (value === null) return;
  const manualProduct = value.trim();
  await api("/api/wp-manual-product", {
    articleId: task.articleId,
    manualProduct,
  });
  $("#packageResult").textContent = manualProduct
    ? `已为「${task.title}」指定商品：${manualProduct}`
    : `已清除「${task.title}」的手动商品指定，将按默认规则处理。`;
  await loadTasks();
}

function taskKey(task) {
  return task ? (task.taskKey || `${task.sourceKind || state.taskSource}\n${task.articleId || ""}\n${task.date || ""}\n${task.title || ""}\n${task.url || ""}`) : "";
}

function isTaskCompleted(task) {
  return state.completedKeys.has(taskKey(task)) || ["ready", "cover-selected", "completed"].includes(task?.status || "");
}

function isTaskSkipped(task) {
  return state.skippedKeys.has(taskKey(task)) || task?.status === "skipped";
}

function updateTaskSourceUi() {
  const isWp = state.taskSource === "wp";
  $("#reloadTasks").textContent = isWp ? "切换到公众号文章" : "切换到 WP 文章";
  $("#taskSourceLabel").textContent = isWp ? "WordPress 文章" : "公众号文章";
  $(".manual-task-row").style.display = isWp ? "none" : "";
  $("#downloadDir").closest("label").style.display = isWp ? "none" : "";
  $("#callAi").style.display = isWp ? "none" : "";
}

async function toggleTaskSource() {
  state.taskSource = state.taskSource === "wp" ? "wechat" : "wp";
  localStorage.setItem(TASK_SOURCE_KEY, state.taskSource);
  state.selectedTask = null;
  clearPackageWorkspace();
  await loadTasks();
}

function normalizeTaskUrl(url) {
  const raw = String(url || "").trim().replace(/&amp;/g, "&");
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (host === "mp.weixin.qq.com" && parsed.pathname === "/s") {
      const parts = ["__biz", "mid", "idx", "sn"]
        .map(name => `${name}=${parsed.searchParams.get(name) || ""}`)
        .join("&");
      return `mp.weixin.qq.com/s?${parts}`;
    }
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = host;
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/#.*$/, "").replace(/\/$/, "");
  }
}

function findTaskByUrl(url) {
  const normalized = normalizeTaskUrl(url);
  const allTasks = [...state.manualTasks, ...state.tasks];
  const task = allTasks.find(item => normalizeTaskUrl(item.url) === normalized);
  if (!task) return null;
  const key = taskKey(task);
  const listName = isTaskCompleted(task) ? "已完成" : isTaskSkipped(task) ? "不处理" : "当前任务";
  return { task, key, listName };
}

function revealTask(task, message) {
  const key = taskKey(task);
  state.selectedTask = task;
  state.revealTaskKey = key;
  $("#taskSearch").value = "";
  renderTasks();
  requestAnimationFrame(() => {
    const row = document.querySelector(`[data-task-key="${CSS.escape(key)}"]`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#packageResult").textContent = message;
  setTimeout(() => {
    if (state.revealTaskKey === key) {
      state.revealTaskKey = "";
      renderTasks();
    }
  }, 2200);
}

function selectTask(task) {
  if (taskKey(state.selectedTask) !== taskKey(task)) {
    clearPackageWorkspace();
  }
  state.selectedTask = task;
  renderTasks();
}

function loadLocalTaskState() {
  state.taskSource = localStorage.getItem(TASK_SOURCE_KEY) === "wp" ? "wp" : "wechat";
  try {
    state.manualTasks = JSON.parse(localStorage.getItem(MANUAL_TASKS_KEY) || "[]");
  } catch {
    state.manualTasks = [];
  }
  try {
    state.completedKeys = new Set(JSON.parse(localStorage.getItem(COMPLETED_TASKS_KEY) || "[]"));
  } catch {
    state.completedKeys = new Set();
  }
  try {
    state.skippedKeys = new Set(JSON.parse(localStorage.getItem(SKIPPED_TASKS_KEY) || "[]"));
  } catch {
    state.skippedKeys = new Set();
  }
}

function saveManualTasks() {
  localStorage.setItem(MANUAL_TASKS_KEY, JSON.stringify(state.manualTasks));
}

function saveCompletedTasks() {
  localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...state.completedKeys]));
}

function saveSkippedTasks() {
  localStorage.setItem(SKIPPED_TASKS_KEY, JSON.stringify([...state.skippedKeys]));
}

async function addManualTask() {
  let title = $("#manualTitle").value.trim();
  const url = $("#manualUrl").value.trim();
  if (!url) {
    $("#packageResult").textContent = "请填写公众号原文 URL。";
    return;
  }
  const existing = findTaskByUrl(url);
  if (existing) {
    revealTask(existing.task, `该文章已经在「${existing.listName}」列表中：${existing.task.title}`);
    return;
  }
  if (!title) {
    $("#packageResult").textContent = "正在自动读取文章标题...";
    const data = await api("/api/article-title", { url });
    title = data.title || "";
    if (!title) {
      $("#packageResult").textContent = "没有读取到标题，请手动填写文章标题。";
      return;
    }
  }
  const task = { title, url, date: workflowDate(), type: "手动", reads: 0, manual: true };
  const key = taskKey(task);
  state.manualTasks = state.manualTasks.filter(item => taskKey(item) !== key);
  state.manualTasks.unshift(task);
  state.completedKeys.delete(key);
  state.skippedKeys.delete(key);
  saveManualTasks();
  saveCompletedTasks();
  saveSkippedTasks();
  $("#manualTitle").value = "";
  $("#manualUrl").value = "";
  selectTask(task);
}

async function persistTaskStatus(task, status) {
  await api("/api/task-status", {
    taskKey: taskKey(task),
    sourceKind: task.sourceKind || state.taskSource,
    articleId: task.articleId || "",
    date: task.date || "",
    title: task.title || "",
    url: task.url || "",
    status,
  });
}

async function completeTask(task) {
  const key = taskKey(task);
  state.completedKeys.add(key);
  state.skippedKeys.delete(key);
  task.status = "completed";
  if (taskKey(state.selectedTask) === taskKey(task)) {
    state.selectedTask = null;
    clearPackageWorkspace();
  }
  saveCompletedTasks();
  saveSkippedTasks();
  await persistTaskStatus(task, "completed");
  await loadTasks();
  renderTasks();
}

async function skipTask(task) {
  const key = taskKey(task);
  state.skippedKeys.add(key);
  state.completedKeys.delete(key);
  task.status = "skipped";
  if (taskKey(state.selectedTask) === key) {
    state.selectedTask = null;
    clearPackageWorkspace();
  }
  saveSkippedTasks();
  saveCompletedTasks();
  await persistTaskStatus(task, "skipped");
  await loadTasks();
  renderTasks();
}

async function restoreTask(task) {
  const key = taskKey(task);
  if ((task.sourceKind || state.taskSource) === "wp" && task.articleId) {
    await api("/api/wp-reset", { articleId: task.articleId });
    await loadTasks();
  }
  state.completedKeys.delete(key);
  state.skippedKeys.delete(key);
  await persistTaskStatus(task, "pending");
  saveCompletedTasks();
  saveSkippedTasks();
  await loadTasks();
  renderTasks();
}

function clearPackageWorkspace() {
  $("#aiText").value = "";
  $("#optimizedMarkdown").value = "";
  $("#packageResult").textContent = "";
}

async function callAi() {
  const task = state.selectedTask;
  if (!task) throw new Error("请先选择一篇文章");
  const downloadDir = $("#downloadDir").value.trim();
  if (!downloadDir) throw new Error("请填写下载目录路径");
  $("#packageResult").textContent = "正在调用 AI...";
  const source = await fetchSourceMarkdown(downloadDir);
  const data = await api("/api/openrouter", {
    model: $("#model").value.trim(),
    downloadDir,
    markdown: source,
    title: task.title,
    workflowDate: workflowDate(),
  });
  $("#aiText").value = `# Stage 1\n\n${data.stage1 || ""}\n\n# Stage 2\n\n${data.stage2 || ""}`;
  if (data.optimizedMarkdown) $("#optimizedMarkdown").value = data.optimizedMarkdown;
  if (data.fields?.utm_campaign) $("#campaign").value = data.fields.utm_campaign;
  $("#packageResult").textContent = "AI 两阶段输出已填入，优化后 Markdown 已自动提取。请检查后生成发布包。";
}

async function fetchSourceMarkdown(downloadDir) {
  // 后端生成包时会读取目录；前端无法直接读任意路径，所以这里返回空串并让用户可粘贴。
  return $("#optimizedMarkdown").value.trim();
}

async function buildPackage() {
  if (state.taskSource === "wp") {
    await buildWpPackage();
    return;
  }
  let progress;
  try {
    const task = state.selectedTask;
    if (!task) throw new Error("请先选择一篇文章");
    const basePayload = {
      title: task.title,
      date: task.date,
      sourceUrl: task.url,
      downloadDir: $("#downloadDir").value.trim(),
      model: $("#model").value.trim(),
      bgScale: Number($("#bgScale")?.value || 90),
      workflowDate: workflowDate(),
    };
    progress = createProgress(task.title, [
      "创建单篇项目文件夹",
      "检测本地项目资源",
      "导入 Markdown、封面图、正文图片",
      "调用 AI 进行 SEO 优化",
      "提取 URL、跟踪参数、摘要",
      "生成官网版本正文与发布页",
    ]);

    progress.set(0, "active");
    progress.message("正在处理：" + task.title);
    progress.set(1, "active");
    const initial = await api("/api/package", { ...basePayload, autoAi: false, probeOnly: true });
    progress.set(0, "done");
    progress.set(1, initial.status === "pending-download" ? "error" : "done");
    if (initial.status === "pending-download") {
      renderPackageResult(initial);
      progress.waitForDownload(
        `下载目录里还没有找到这篇文章的 Markdown。\n已创建本地项目文件夹：${initial.downloadProjectDir || ""}\n请打开公众号原文，用油猴脚本下载；下载完成后回到这里点击「已完成下载」。`,
        [
        { label: "打开公众号原文", href: initial.sourceUrl },
        ],
        () => continuePackage(progress, basePayload, task)
      );
      return;
    }

    progress.set(2, "done");
    await finishPackage(progress, basePayload, task);
  } catch (err) {
    if (progress) {
      progress.fail(err.message);
    } else {
      $("#packageResult").textContent = err.message;
    }
  }
}

async function buildWpPackage() {
  let progress;
  try {
    const task = state.selectedTask;
    if (!task) throw new Error("请先选择一篇 WordPress 文章");
    progress = createProgress(task.title, [
      "提交 WordPress 迁移任务",
      "后端完整处理：图片、链接、SEO、封面、压缩与回填",
      "生成发布包并更新迁移进度",
    ]);
    progress.set(0, "active");
    progress.message(`正在处理：${task.title}\n当前步骤：读取 WordPress Markdown。`);
    progress.set(0, "done");
    progress.set(1, "active");
    progress.message(`正在处理：${task.title}\n当前步骤：后端完整处理，包含链接检查、AI SEO、模板封面、Zipic 压缩和下载目录回填，可能需要几十秒。`);
    const data = await api("/api/wp-package", {
      articlePath: task.articlePath,
      model: $("#model").value.trim(),
      downloadDir: $("#downloadDir").value.trim(),
      manualProduct: task.manualProduct || "",
      workflowDate: workflowDate(),
    });
    progress.set(1, "done");
    progress.set(2, "done");
    renderPackageResult(data);
    await loadTasks();
    playCompletionSound();
    progress.complete(
      "WordPress 发布包已生成，可以打开发布页检查和复制正文。",
      packageCompleteActions(data, text => progress.message(text))
    );
  } catch (err) {
    if (progress) progress.fail(err.message);
    else $("#packageResult").textContent = err.message;
  }
}

async function continuePackage(progress, basePayload, task) {
  try {
    progress.disableActions();
    progress.set(1, "active");
    progress.message("正在重新检测下载目录，准备继续生成发布包。");
    const data = await api("/api/package", { ...basePayload, autoAi: false, probeOnly: true });
    if (data.status === "pending-download") {
      renderPackageResult(data);
      progress.set(1, "error");
      progress.waitForDownload(
        "仍然没有找到这篇文章的 Markdown。请确认油猴脚本已经下载完成，然后再点「已完成下载」。",
        [
          { label: "打开公众号原文", href: data.sourceUrl },
        ],
        () => continuePackage(progress, basePayload, task)
      );
      return;
    }
    progress.set(1, "done");
    progress.set(2, "done");
    await finishPackage(progress, basePayload, task);
  } catch (err) {
    progress.fail(err.message);
  }
}

async function finishPackage(progress, basePayload, task) {
    let aiText = $("#aiText").value;
    let optimizedMarkdown = $("#optimizedMarkdown").value;
    if (!aiText && !optimizedMarkdown) {
      progress.set(3, "active");
      progress.message(`正在处理：${task.title}\n当前步骤：调用 AI 进行 SEO 优化，可能需要几十秒。`);
      const ai = await api("/api/openrouter", {
        model: basePayload.model,
        downloadDir: basePayload.downloadDir,
        title: task.title,
        date: task.date,
      });
      aiText = `# Stage 1\n\n${ai.stage1 || ""}\n\n# Stage 2\n\n${ai.stage2 || ""}`;
      optimizedMarkdown = ai.optimizedMarkdown || "";
      $("#aiText").value = aiText;
      $("#optimizedMarkdown").value = optimizedMarkdown;
      if (ai.fields?.utm_campaign) $("#campaign").value = ai.fields.utm_campaign;
      progress.set(3, "done");
      progress.set(4, "done");
    } else {
      progress.set(3, "done");
      progress.set(4, "done");
    }

    progress.set(5, "active");
    progress.message(`正在处理：${task.title}\n当前步骤：生成官网版本正文与发布页。`);
    const finalPayload = {
      ...basePayload,
      aiText: $("#aiText").value,
      optimizedMarkdown: $("#optimizedMarkdown").value,
      autoAi: false,
    };
    const data = await api("/api/package", finalPayload);
    progress.set(5, "done");
    renderPackageResult(data);
    playCompletionSound();
    progress.complete(
      "发布包已生成，可以打开发布页检查和复制正文。",
      packageCompleteActions(data, text => progress.message(text))
    );
}

function packageCompleteActions(data, status) {
  return [{ label: "打开 publish.html", href: data.publishUrl }];
}

function createProgress(title, steps) {
  $("#progressOverlay")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "progressOverlay";
  overlay.className = "progress-overlay";
  overlay.innerHTML = `
    <div class="progress-dialog" role="dialog" aria-modal="true" aria-labelledby="progressTitle">
      <h2 id="progressTitle">正在生成发布包</h2>
      <pre id="progressMessage">正在处理：${escapeHtml(title)}</pre>
      <ul class="progress-list">
        ${steps.map(step => `<li class="pending">${escapeHtml(step)}</li>`).join("")}
      </ul>
      <div id="progressActions" class="progress-actions"></div>
      <button id="closeProgress" class="progress-close" disabled aria-label="关闭">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18"></path>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  $("#packageResult").textContent = "任务执行中，请在中央进度窗口查看当前状态。";
  const items = $$(".progress-list li", overlay);
  const close = $("#closeProgress", overlay);
  close.onclick = () => overlay.remove();
  return {
    set(index, stateName) {
      if (!items[index]) return;
      items[index].className = stateName;
    },
    message(text) {
      $("#progressMessage").textContent = text;
    },
    complete(text, actions = []) {
      this.message(text);
      renderProgressActions(actions, $("#progressActions", overlay));
      close.disabled = false;
      close.focus();
    },
    waitForDownload(text, actions = [], onContinue) {
      this.message(text);
      renderProgressActions(
        [
          ...actions,
          { label: "已完成下载", onClick: onContinue, primary: true },
        ],
        $("#progressActions", overlay)
      );
      close.disabled = false;
    },
    disableActions() {
      $$(".progress-action", overlay).forEach(action => {
        action.disabled = true;
        action.classList.add("disabled");
      });
    },
    fail(text) {
      const active = items.find(item => item.classList.contains("active"));
      if (active) active.className = "error";
      this.message("处理失败：" + text);
      renderProgressActions([], $("#progressActions", overlay));
      close.disabled = false;
      close.focus();
    },
  };
}

function renderProgressActions(actions, target) {
  target.innerHTML = "";
  actions.forEach(action => {
    if (action.href) {
      const link = document.createElement("a");
      link.className = "progress-action";
      link.href = action.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = action.label;
      target.appendChild(link);
      return;
    }
    if (action.onClick) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "progress-action" + (action.primary ? " primary" : "");
      button.textContent = action.label;
      button.onclick = async () => {
        try {
          button.disabled = true;
          await action.onClick();
        } catch (err) {
          alert(err.message || String(err));
        } finally {
          button.disabled = false;
        }
      };
      target.appendChild(button);
    }
  });
}

function renderPackageResult(data) {
  if (data.status === "pending-download") {
    $("#packageResult").innerHTML = `
      <div><strong>需要先下载原文</strong></div>
      <div>本地项目文件夹已创建。请点击进度窗口里的「打开公众号原文」下载，下载完成后点击「已完成下载」。</div>
      <div class="result-actions">
        <a href="${escapeAttr(data.sourceUrl || "#")}" target="_blank" rel="noopener">打开公众号原文</a>
      </div>
    `;
    return;
  }
  $("#packageResult").innerHTML = `
    <div><strong>发布包已生成</strong></div>
    ${data.originalTitle ? `<div>原标题：${escapeHtml(data.originalTitle)}</div>` : ""}
    <div>图片：${data.imageCount || 0} 张，封面：${data.coverCount || 0} 张</div>
    ${data.imageDownloads && data.imageDownloads.downloaded && data.imageDownloads.downloaded.length ? `<div>远程原图：成功下载 ${data.imageDownloads.downloaded.length} 张</div>` : ""}
    ${data.imageDownloads && data.imageDownloads.missing && data.imageDownloads.missing.length ? `<div class="result-error">有 ${data.imageDownloads.missing.length} 张原文图片下载失败：${data.imageDownloads.missing.map(item => `图 ${escapeHtml(String(item.slot || ""))}（${escapeHtml(item.reason || "未知错误")}）`).join("；")}。详细地址见图片下载失败清单.txt。</div>` : ""}
    ${data.coverGeneration && data.coverGeneration.mode === "ai" ? `<div>封面：已使用 ${escapeHtml(data.coverGeneration.model || "AI 图像模型")} 生成</div>` : ""}
    ${data.coverGeneration && data.coverGeneration.mode === "template" ? `<div>封面：已使用本地模板生成</div>` : ""}
    ${data.coverGeneration && data.coverGeneration.mode === "fallback-template" ? `<div class="result-error">AI 封面生成失败，已回退模板封面：${escapeHtml(data.coverGeneration.error || "")}</div>` : ""}
    ${data.media ? `<div>自动加底：${data.media.backgroundsGenerated || 0} 张；购买按钮：${data.media.purchaseButtonsGenerated || 0} 张，待处理：${data.media.purchaseButtonsPending || 0} 张；Zipic：${data.media.zipicLargeImages || 0} 张（静态 ${data.media.zipicStaticImages || 0}，GIF ${data.media.zipicGifImages || 0}，原超限 ${data.media.zipicOverLimitImages || 0}，WebP ${data.media.zipicWebpImages || 0}）${data.media.zipicLargeImages ? (data.media.zipicLaunched ? "，已调用" : "，调用失败") : ""}</div>` : ""}
    ${data.media && data.media.zipicLargeImages && !data.media.zipicCompleted ? `<div class="result-error">Zipic 压缩未完成：${(data.media.zipicOverLimitAfterCompression || []).length} 张图片仍超过限制。请查看 8 media-report.json。</div>` : ""}
    ${data.media && data.media.zipicErrors && data.media.zipicErrors.length ? `<div class="result-error">Zipic 错误：${escapeHtml(data.media.zipicErrors.join("；"))}</div>` : ""}
    <div class="result-actions">
      <a href="${escapeAttr(data.publishUrl || "#")}" target="_blank" rel="noopener">打开 publish.html</a>
    </div>
  `;
}

function genLinks() {
  const url = $("#linkUrl").value.trim().split("?")[0].split("#")[0];
  const campaign = $("#campaign").value.trim();
  const other = $("#otherMedium").value.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("URL 必须以 http 或 https 开头");
  const isLizhi = url.includes("lizhi.shop");
  const buildParams = medium => ({
    utm_source: "lizhi-shop",
    ...(campaign ? { utm_campaign: campaign } : {}),
    ...(medium ? { utm_medium: medium } : {}),
  });
  const buildLizhi = medium => withParams(url, { cid: CID, ...buildParams(medium) });
  const buildExternal = medium => withParams(url, buildParams(medium));
  const build = isLizhi ? buildLizhi : buildExternal;
  const rows = [
    { type: "site", url: isLizhi ? withParams(url, { cid: CID }) : withParams(url, { utm_source: "lizhi-shop" }) },
    { type: "wechat", url: build("wechat") },
    { type: "wechat-hmpl", url: withParams(url, { cid: CID, hmsr: "wechat", hmpl: `p${trackingDatePart()}` }) },
    { type: "email", url: build("email") },
    { type: "twitter", url: build("twitter") },
  ];
  if (other) rows.push({ type: other, url: build(other) });
  renderLinksTable(rows);
}

function withParams(rawUrl, params) {
  const parsed = new URL(rawUrl);
  parsed.search = "";
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") parsed.searchParams.set(key, value);
  });
  return parsed.toString();
}

function trackingDatePart() {
  const [year, month, day] = workflowDate().split("-");
  return `${year.slice(-2)}${month}${day}`;
}

function renderLinksTable(rows) {
  const result = $("#linksResult");
  result.textContent = "";
  result.classList.add("links-result-table");
  const table = document.createElement("table");
  table.className = "links-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>类型</th>
        <th>链接</th>
        <th>操作</th>
      </tr>
    </thead>
  `;
  const body = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    const typeCell = document.createElement("td");
    const linkCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const link = document.createElement("a");
    const button = document.createElement("button");

    typeCell.textContent = row.type;
    link.href = row.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = row.url;
    button.type = "button";
    button.className = "link-copy";
    button.dataset.link = row.url;
    button.textContent = "复制";

    linkCell.appendChild(link);
    actionCell.appendChild(button);
    tr.append(typeCell, linkCell, actionCell);
    body.appendChild(tr);
  });
  table.appendChild(body);
  result.appendChild(table);
}

function withProductCid(rawUrl) {
  const parsed = new URL(rawUrl);
  parsed.searchParams.set("cid", CID);
  return parsed.toString();
}

function processMdLinks() {
  const campaign = $("#campaign").value.trim();
  let md = $("#mdForLinks").value;
  md = md.replace(/!\[[^\]]*]\(([^)]+\.(?:png|jpe?g|gif|webp))\)/gi, (_, path) => {
    const file = path.split("/").pop().replace(/\.[^.]+$/, "");
    return `【${file}】`;
  });
  md = md.replace(/\[([^\]]*)]\((https?:\/\/[^)]*lizhi\.shop[^)]*)\)/gi, (_, text, link) => {
    const clean = link.split("?")[0];
    return `[${text}](${clean}?cid=${CID}&utm_source=lizhi-shop${campaign ? `&utm_campaign=${campaign}` : ""}&utm_medium=wechat)`;
  });
  md = md.replace(/\[([^\]]*)]\((https?:\/\/(?![^)]*lizhi\.shop)[^)]*)\)/gi, (_, text, link) => {
    const sep = link.includes("?") ? "&" : "?";
    return `[${text}](${link}${sep}utm_source=lizhi-shop)`;
  });
  $("#linksResult").classList.remove("links-result-table");
  $("#linksResult").textContent = md;
}

async function copyLinkFromButton(button) {
  const text = button.dataset.link || "";
  const originalText = button.textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    button.textContent = "已复制";
    button.classList.add("copied");
  } catch (err) {
    button.textContent = "复制失败";
    console.warn("copy link failed", err);
  } finally {
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1400);
  }
}

async function makeShort(action) {
  const apiUrl = $("#yourlsApi").value.trim();
  const token = $("#yourlsToken").value.trim();
  const input = $("#shortInput").value.trim();
  const keyword = $("#shortKeyword").value.trim();
  const params = new URLSearchParams({
    signature: token,
    action,
    format: "json",
  });
  if (action === "shorturl") {
    params.set("url", input);
    if (keyword) params.set("keyword", keyword);
  } else {
    params.set("shorturl", input.replace(/^https?:\/\/go\.lizhi\.shop\//, ""));
  }
  const res = await fetch(`${apiUrl}?${params}`);
  const data = await res.json();
  $("#shortResult").textContent = JSON.stringify(data, null, 2);
}

function blueBgCanvas() {
  return $("#blueBgCanvas");
}

function blueBgStatus(message) {
  $("#blueBgStatus").textContent = message;
}

function applyBlueBgZoom(zoom) {
  if (!blueBgState.background || !blueBgState.baseDisplayWidth) return;
  const canvas = blueBgCanvas();
  blueBgState.zoom = Math.max(1, Math.min(20, zoom));
  canvas.style.width = `${blueBgState.baseDisplayWidth * blueBgState.zoom}px`;
  canvas.style.height = `${blueBgState.baseDisplayHeight * blueBgState.zoom}px`;
  canvas.style.imageRendering = blueBgState.zoom >= 4 ? "pixelated" : "auto";
  $("#blueBgStage").classList.toggle("at-base-zoom", blueBgState.zoom <= 1.001);
  requestAnimationFrame(() => {
    syncCanvasSelectionOverlays(
      $("#blueBgStage"),
      canvas,
      $("#blueBgSelectionOverlay"),
      blueBgSelectionEntries()
    );
  });
}

function resetBlueBgZoom() {
  const canvas = blueBgCanvas();
  blueBgState.zoom = 1;
  canvas.style.width = "";
  canvas.style.height = "";
  requestAnimationFrame(() => {
    const rect = canvas.getBoundingClientRect();
    blueBgState.baseDisplayWidth = rect.width;
    blueBgState.baseDisplayHeight = rect.height;
    applyBlueBgZoom(1);
  });
}

function setBlueBgZoomAtPoint(nextZoom, clientX, clientY) {
  const stage = $("#blueBgStage");
  const canvas = blueBgCanvas();
  const rect = canvas.getBoundingClientRect();
  const ratioX = rect.width ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0.5;
  const ratioY = rect.height ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) : 0.5;
  const beforeWidth = rect.width;
  const beforeHeight = rect.height;
  applyBlueBgZoom(nextZoom);
  const after = canvas.getBoundingClientRect();
  stage.scrollLeft += ratioX * (after.width - beforeWidth);
  stage.scrollTop += ratioY * (after.height - beforeHeight);
  blueBgStatus(`画布缩放 ${Math.round(blueBgState.zoom * 100)}% · 共 ${blueBgState.layers.length} 张图片`);
}

function blueBgWheel(event) {
  if (!blueBgState.background || !event.ctrlKey) return;
  event.preventDefault();
  setBlueBgZoomAtPoint(blueBgState.zoom * Math.exp(-event.deltaY * 0.006), event.clientX, event.clientY);
}

function blueBgGestureStart(event) {
  if (!blueBgState.background) return;
  event.preventDefault();
  blueBgState.gestureStartZoom = blueBgState.zoom;
}

function blueBgGestureChange(event) {
  if (!blueBgState.background) return;
  event.preventDefault();
  setBlueBgZoomAtPoint(blueBgState.gestureStartZoom * event.scale, event.clientX, event.clientY);
}

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取图片，请换一张重试。"));
    image.src = source;
  });
}

async function ensureBlueBgBackground() {
  if (!blueBgState.background) {
    blueBgState.background = await loadImageSource(BLUE_BG_ASSET_URL);
  }
  const canvas = blueBgCanvas();
  canvas.width = blueBgState.background.naturalWidth;
  canvas.height = blueBgState.background.naturalHeight;
}

async function loadBlueBgFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImageSource(url);
    return { image, fileName: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadBgDecorAssets() {
  if (!bgDecorAssetsPromise) {
    bgDecorAssetsPromise = Promise.all([
      loadImageSource(BG_HEADER_ASSET_URL),
      loadImageSource(BG_FOOTER_ASSET_URL),
    ]);
  }
  return bgDecorAssetsPromise;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器无法生成 PNG，请换一张图片重试。"));
    }, "image/png");
  });
}

function detectClientBgMode(ctx, width, height) {
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const step = Math.max(1, Math.round(Math.min(width, height) / 180));
  const border = Math.max(step, Math.round(Math.min(width, height) * 0.015));
  let sampled = 0;
  let transparent = 0;
  let edgeOpaque = 0;
  let edgeWhite = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const offset = (y * width + x) * 4;
      const alpha = pixels[offset + 3];
      sampled += 1;
      if (alpha < 245) transparent += 1;
      const edge = x < border || y < border || x >= width - border || y >= height - border;
      if (!edge || alpha < 245) continue;
      edgeOpaque += 1;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
      if ((red >= 245 && green >= 245 && blue >= 245) || (luminance >= 235 && saturation <= 18)) {
        edgeWhite += 1;
      }
    }
  }
  if (sampled && transparent / sampled >= 0.03) return "transparent";
  if (edgeOpaque && edgeWhite / edgeOpaque >= 0.4) return "white-edge";
  return "manual";
}

function bgCanvasDimensions(width, height, scalePercent) {
  const scaleRatio = Math.min(scalePercent, 100) / 100;
  const aspect = width / height;
  const compensation = Math.min(Math.abs(aspect - 1), 1) * 0.15;
  let canvasWidth;
  let canvasHeight;
  if (aspect < 1) {
    canvasWidth = Math.round(width / scaleRatio);
    canvasHeight = Math.round(height / scaleRatio * (1 - compensation));
  } else if (aspect > 1) {
    canvasWidth = Math.round(width / scaleRatio * (1 - compensation));
    canvasHeight = Math.round(height / scaleRatio);
  } else {
    canvasWidth = Math.round(width / scaleRatio);
    canvasHeight = Math.round(height / scaleRatio);
  }
  const tightness = scalePercent > 100 ? Math.min((scalePercent - 100) / 50, 1) : 0;
  const marginRatio = scalePercent > 100 ? Math.max(0.01, 0.035 * (1 - tightness)) : 0.035;
  const minXMargin = scalePercent > 100 ? Math.max(8, Math.round(width * marginRatio)) : Math.max(40, Math.round(width * marginRatio));
  const minYMargin = scalePercent > 100 ? Math.max(6, Math.round(height * marginRatio)) : Math.max(32, Math.round(height * marginRatio));
  return {
    width: Math.max(canvasWidth, width + minXMargin * 2),
    height: Math.max(canvasHeight, height + minYMargin * 2),
  };
}

async function renderBgInBrowser(file, scalePercent, withShadow, withRound, signal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const [{ image }, [header, footer]] = await Promise.all([
    loadBlueBgFile(file),
    loadBgDecorAssets(),
  ]);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const workingScale = IMAGE_EXPORT_WIDTH / Math.max(image.naturalWidth, image.naturalHeight);
  const foregroundScale = Math.max(1, Number(scalePercent) / 100);
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth * workingScale * foregroundScale));
  const sourceHeight = Math.max(1, Math.round(image.naturalHeight * workingScale * foregroundScale));
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceCtx.imageSmoothingEnabled = true;
  sourceCtx.imageSmoothingQuality = "high";
  sourceCtx.drawImage(image, 0, 0, sourceWidth, sourceHeight);
  const mode = detectClientBgMode(sourceCtx, sourceWidth, sourceHeight);

  const sigma = Math.max(2, Math.min(50, Math.round(Math.min(sourceWidth, sourceHeight) / 33)));
  const pad = withShadow ? Math.max(8, sigma * 2) : 0;
  const preliminary = bgCanvasDimensions(sourceWidth + pad * 2, sourceHeight + pad * 2, Number(scalePercent));
  const cornerRadius = Math.max(1, Math.round(SYSTEM_CORNER_RADIUS * preliminary.width / IMAGE_EXPORT_WIDTH));
  const foreground = document.createElement("canvas");
  foreground.width = sourceWidth + pad * 2;
  foreground.height = sourceHeight + pad * 2;
  const foregroundCtx = foreground.getContext("2d");
  if (withShadow) {
    foregroundCtx.save();
    foregroundCtx.shadowColor = "rgba(0, 0, 0, .25)";
    foregroundCtx.shadowBlur = sigma * 2;
    foregroundCtx.fillStyle = "rgba(255, 255, 255, 1)";
    continuousRoundedRect(foregroundCtx, pad, pad, sourceWidth, sourceHeight, withRound ? cornerRadius : 0);
    foregroundCtx.fill();
    foregroundCtx.restore();
  }
  foregroundCtx.save();
  continuousRoundedRect(foregroundCtx, pad, pad, sourceWidth, sourceHeight, withRound ? cornerRadius : 0);
  foregroundCtx.clip();
  foregroundCtx.drawImage(sourceCanvas, pad, pad);
  foregroundCtx.restore();

  const dimensions = bgCanvasDimensions(foreground.width, foreground.height, Number(scalePercent));
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8cc6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const headerHeight = Math.round(header.naturalHeight * canvas.width / header.naturalWidth);
  const footerHeight = Math.round(footer.naturalHeight * canvas.width / footer.naturalWidth);
  ctx.drawImage(header, 0, 0, canvas.width, headerHeight);
  ctx.drawImage(footer, 0, canvas.height - footerHeight, canvas.width, footerHeight);
  ctx.drawImage(foreground, Math.floor((canvas.width - foreground.width) / 2), Math.floor((canvas.height - foreground.height) / 2));

  const output = canvasScaledToWidth(canvas);
  const blob = await canvasToPngBlob(output);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return { blob, mode, appliedShadow: withShadow, appliedRound: withRound };
}

function continuousRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius * CONTINUOUS_CORNER_EXTENT, width / 2, height / 2));
  const power = 2 / CONTINUOUS_CORNER_EXPONENT;
  const steps = 24;
  const addCorner = (centerX, centerY, xSign, ySign, start, end) => {
    for (let index = 0; index <= steps; index++) {
      const angle = start + (end - start) * index / steps;
      const offsetX = r * Math.pow(Math.abs(Math.cos(angle)), power);
      const offsetY = r * Math.pow(Math.abs(Math.sin(angle)), power);
      ctx.lineTo(centerX + xSign * offsetX, centerY + ySign * offsetY);
    }
  };
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  addCorner(x + width - r, y + r, 1, -1, Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - r);
  addCorner(x + width - r, y + height - r, 1, 1, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + height);
  addCorner(x + r, y + height - r, -1, 1, Math.PI / 2, 0);
  ctx.lineTo(x, y + r);
  addCorner(x + r, y + r, -1, -1, 0, Math.PI / 2);
  ctx.closePath();
}

function drawBlueBgLayer(ctx, layer) {
  const radius = layer.round ? Math.min(SYSTEM_CORNER_RADIUS, layer.width / 2, layer.height / 2) : 0;
  if (layer.shadow) {
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, .28)";
    ctx.shadowBlur = BLUE_BG_SHADOW_BLUR;
    ctx.shadowOffsetY = BLUE_BG_SHADOW_OFFSET_Y;
    ctx.fillStyle = "rgba(255, 255, 255, .96)";
    continuousRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  continuousRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
  ctx.clip();
  ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
  ctx.restore();
}

function blueBgLayerVisualGeometry(layer) {
  return {
    bounds: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
    outsets: { left: 0, right: 0, top: 0, bottom: 0 },
  };
}

function blueBgHandles(layer) {
  return [
    { key: "nw", x: layer.x, y: layer.y },
    { key: "ne", x: layer.x + layer.width, y: layer.y },
    { key: "sw", x: layer.x, y: layer.y + layer.height },
    { key: "se", x: layer.x + layer.width, y: layer.y + layer.height },
  ];
}

function renderBlueBgCanvas(forExport = false, targetCanvas = blueBgCanvas()) {
  if (!blueBgState.background) {
    if (!forExport) {
      syncCanvasSelectionOverlays(
        $("#blueBgStage"), targetCanvas, $("#blueBgSelectionOverlay"), []
      );
    }
    return;
  }
  targetCanvas.width = blueBgState.background.naturalWidth;
  targetCanvas.height = blueBgState.background.naturalHeight;
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(blueBgState.background, 0, 0, targetCanvas.width, targetCanvas.height);
  blueBgState.layers.forEach(layer => drawBlueBgLayer(ctx, layer));
  if (forExport) return;
  drawCanvasSnapGuides(ctx, targetCanvas, blueBgState.snapGuides);
  syncCanvasSelectionOverlays(
    $("#blueBgStage"),
    targetCanvas,
    $("#blueBgSelectionOverlay"),
    blueBgSelectionEntries()
  );
}

function selectedBlueBgLayer() {
  return blueBgState.layers.find(layer => layer.id === blueBgState.selectedId) || null;
}

function selectedBlueBgLayers() {
  const ids = blueBgState.selectedIds.length
    ? new Set(blueBgState.selectedIds)
    : new Set(blueBgState.selectedId === null ? [] : [blueBgState.selectedId]);
  return blueBgState.layers.filter(layer => ids.has(layer.id));
}

function blueBgSelectionBounds() {
  return unionBounds(selectedBlueBgLayers().map(layer => blueBgLayerVisualGeometry(layer).bounds));
}

function blueBgSelectionEntries() {
  return selectedBlueBgLayers()
    .map(layer => ({ id: layer.id, bounds: blueBgLayerVisualGeometry(layer).bounds }))
    .sort((a, b) => Number(b.id === blueBgState.selectedId) - Number(a.id === blueBgState.selectedId));
}

function selectedDefaultBgMaterial() {
  return bgMaterials[bgSelectedMaterialIndex] || null;
}

function selectedDefaultBgMaterialIndexes() {
  if (bgSelectedMaterialIndices.length) {
    return bgSelectedMaterialIndices.filter(index => index >= 0 && index < bgMaterials.length);
  }
  return bgSelectedMaterialIndex >= 0 ? [bgSelectedMaterialIndex] : [];
}

function selectedDefaultBgMaterials() {
  return selectedDefaultBgMaterialIndexes().map(index => bgMaterials[index]).filter(Boolean);
}

function syncBgEffectToolbar() {
  const blueprint = $("#bgBlueMode").checked;
  const selectedItems = blueprint ? selectedBlueBgLayers() : selectedDefaultBgMaterials();
  const selected = selectedItems[0] || null;
  const disabled = !selected;
  const toolbar = $("#bgEffectToolbar");
  toolbar.classList.toggle("is-disabled", disabled);
  $("#bgDeleteSelected").disabled = disabled;
  $("#bgEffectShadow").disabled = disabled;
  $("#bgEffectRound").disabled = disabled;
  $("#bgEffectScale").disabled = disabled;
  $("#bgEffectScale").min = blueprint ? "10" : "40";
  $("#bgEffectScale").max = blueprint ? "200" : "150";
  if (selected) {
    $("#bgEffectShadow").checked = selected.shadow;
    $("#bgEffectRound").checked = selected.round;
    $("#bgEffectShadow").indeterminate = selectedItems.some(item => item.shadow !== selected.shadow);
    $("#bgEffectRound").indeterminate = selectedItems.some(item => item.round !== selected.round);
    const scale = blueprint
      ? Math.round(selected.width / selected.fitWidth * 100)
      : selected.scale;
    $("#bgEffectScale").value = String(scale);
    $("#bgEffectScaleValue").textContent = `${scale}%`;
  } else {
    $("#bgEffectShadow").checked = false;
    $("#bgEffectRound").checked = false;
    $("#bgEffectShadow").indeterminate = false;
    $("#bgEffectRound").indeterminate = false;
    $("#bgEffectScaleValue").textContent = "—";
  }
}

function updateBlueBgControls() {
  const selected = selectedBlueBgLayer();
  $("#blueBgStage").classList.toggle("has-layers", blueBgState.layers.length > 0);
  $("#sendBlueBgToAnnotation").disabled = !blueBgState.layers.length;
  syncBgEffectToolbar();
  renderBgMaterialList();
  updateBgExportState();
}

function clampBlueBgLayer(layer) {
  const canvas = blueBgCanvas();
  layer.width = Math.max(Math.max(80, layer.fitWidth * 0.1), Math.min(layer.fitWidth * 2, layer.width));
  layer.height = Math.max(Math.max(60, layer.fitHeight * 0.1), Math.min(layer.fitHeight * 2, layer.height));
  const minVisible = 24;
  layer.x = Math.max(-layer.width + minVisible, Math.min(canvas.width - minVisible, layer.x));
  layer.y = Math.max(-layer.height + minVisible, Math.min(canvas.height - minVisible, layer.y));
}

async function addBlueBgFiles(fileList, reset = false) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  if (reset) {
    blueBgState.layers = [];
    blueBgState.selectedId = null;
    blueBgState.selectedIds = [];
    blueBgState.nextId = 1;
    blueBgState.sourceName = files[0].name;
  }
  const available = BLUE_BG_MAX_LAYERS - blueBgState.layers.length;
  const accepted = files.slice(0, Math.max(0, available));
  for (const file of accepted) {
    const { image, fileName } = await loadBlueBgFile(file);
    const material = bgMaterials.find(candidate => candidate.file === file);
    const fit = Math.min(
      blueBgCanvas().width * 0.68 / image.naturalWidth,
      blueBgCanvas().height * 0.72 / image.naturalHeight
    );
    const width = Math.max(80, image.naturalWidth * fit);
    const height = image.naturalHeight * fit;
    const offset = blueBgState.layers.length * 46;
    const layer = {
      id: blueBgState.nextId++,
      image,
      fileName,
      previewUrl: material?.previewUrl || "",
      baseWidth: image.naturalWidth,
      baseHeight: image.naturalHeight,
      fitWidth: width,
      fitHeight: height,
      aspect: image.naturalWidth / image.naturalHeight,
      width,
      height,
      x: (blueBgCanvas().width - width) / 2 + offset,
      y: (blueBgCanvas().height - height) / 2 + offset,
      shadow: true,
      round: true,
    };
    clampBlueBgLayer(layer);
    blueBgState.layers.push(layer);
    blueBgState.selectedId = layer.id;
    blueBgState.selectedIds = [];
  }
  updateBlueBgControls();
  renderBlueBgCanvas();
  pushBgHistory();
  const ignored = files.length - accepted.length;
  blueBgStatus(
    ignored > 0
      ? `最多支持 ${BLUE_BG_MAX_LAYERS} 张图片，已忽略 ${ignored} 张。`
      : `已放入 ${blueBgState.layers.length} 张图片。拖动调整位置，拖动四角调整大小。`
  );
}

async function startBlueBgPreview(files) {
  if (!files?.length) throw new Error("请先选择至少一张图片。");
  await ensureBlueBgBackground();
  $("#blueBgEditor").hidden = false;
  await addBlueBgFiles(files, true);
  resetBlueBgZoom();
}

function blueBgPointerPosition(event) {
  const canvas = blueBgCanvas();
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height,
  };
}

function blueBgPointInLayer(layer, point) {
  const bounds = blueBgLayerVisualGeometry(layer).bounds;
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

function blueBgHitHandle(layer, point) {
  if (!layer) return null;
  return hitSelectionHandle(blueBgLayerVisualGeometry(layer).bounds, point, blueBgCanvas(), 14);
}

function blueBgPointerDown(event) {
  if (event.button > 0 || !blueBgState.layers.length) return;
  const canvas = blueBgCanvas();
  blueBgState.snapGuides = emptySnapGuides();
  const point = blueBgPointerPosition(event);
  const selectedLayers = selectedBlueBgLayers();
  const layer = [...blueBgState.layers].reverse().find(candidate => blueBgPointInLayer(candidate, point));
  const multiKey = event.metaKey || event.ctrlKey;
  if (multiKey) {
    if (layer) {
      const ids = new Set(selectedLayers.map(candidate => candidate.id));
      const adding = !ids.has(layer.id);
      if (adding) ids.add(layer.id);
      else ids.delete(layer.id);
      blueBgState.selectedIds = [...ids];
      blueBgState.selectedId = adding ? layer.id : (blueBgState.selectedIds.at(-1) ?? null);
      const updatedSelection = selectedBlueBgLayers();
      blueBgState.interaction = adding ? {
        mode: updatedSelection.length > 1 ? "move-group" : "move",
        id: layer.id,
        start: point,
        original: { ...layer },
        originals: updatedSelection.map(candidate => ({ id: candidate.id, x: candidate.x, y: candidate.y })),
      } : null;
    } else {
      blueBgState.interaction = null;
    }
    canvas.setPointerCapture?.(event.pointerId);
    $("#blueBgStage").focus();
    updateBlueBgControls();
    renderBlueBgCanvas();
    event.preventDefault();
    return;
  }
  const handleTarget = [...selectedLayers]
    .reverse()
    .map(candidate => ({ layer: candidate, handle: blueBgHitHandle(candidate, point) }))
    .find(candidate => candidate.handle);
  if (handleTarget) {
    blueBgState.interaction = {
      mode: "resize",
      id: handleTarget.layer.id,
      handle: handleTarget.handle,
      start: point,
      original: { ...handleTarget.layer },
    };
  } else {
    const movingSelection = layer && selectedLayers.some(candidate => candidate.id === layer.id);
    if (!movingSelection) {
      blueBgState.selectedId = layer?.id ?? null;
      blueBgState.selectedIds = [];
    }
    blueBgState.interaction = layer ? {
      mode: movingSelection && selectedLayers.length > 1 ? "move-group" : "move",
      id: layer.id,
      start: point,
      original: { ...layer },
      originals: movingSelection
        ? selectedLayers.map(candidate => ({ id: candidate.id, x: candidate.x, y: candidate.y }))
        : null,
    } : null;
  }
  canvas.setPointerCapture?.(event.pointerId);
  $("#blueBgStage").focus();
  updateBlueBgControls();
  renderBlueBgCanvas();
  event.preventDefault();
}

function blueBgPointerMove(event) {
  const interaction = blueBgState.interaction;
  if (!interaction) {
    const selectedLayers = selectedBlueBgLayers();
    const point = blueBgPointerPosition(event);
    const handle = [...selectedLayers]
      .reverse()
      .map(layer => blueBgHitHandle(layer, point))
      .find(Boolean);
    blueBgCanvas().style.cursor = selectionCursorByHandle[handle] ||
      (selectedLayers.some(layer => blueBgPointInLayer(layer, point)) ? "move" : "default");
    return;
  }
  const layer = blueBgState.layers.find(candidate => candidate.id === interaction.id);
  if (!layer) return;
  const point = blueBgPointerPosition(event);
  if (interaction.mode === "move-group") {
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    interaction.originals.forEach(original => {
      const candidate = blueBgState.layers.find(item => item.id === original.id);
      if (!candidate) return;
      candidate.x = original.x + dx;
      candidate.y = original.y + dy;
    });
    const canvas = blueBgCanvas();
    const bounds = blueBgSelectionBounds();
    const snapped = snapBoundsToCanvas(bounds, canvas, 12, true);
    const offsetX = snapped.x - bounds.x;
    const offsetY = snapped.y - bounds.y;
    selectedBlueBgLayers().forEach(candidate => {
      candidate.x += offsetX;
      candidate.y += offsetY;
      clampBlueBgLayer(candidate);
    });
    blueBgState.snapGuides = snapped.guides;
  } else if (interaction.mode === "move") {
    layer.x = interaction.original.x + point.x - interaction.start.x;
    layer.y = interaction.original.y + point.y - interaction.start.y;
    const canvas = blueBgCanvas();
    const visualBounds = blueBgLayerVisualGeometry(layer).bounds;
    const snapped = snapBoundsToCanvas(visualBounds, canvas, 12, true);
    layer.x += snapped.x - visualBounds.x;
    layer.y += snapped.y - visualBounds.y;
    blueBgState.snapGuides = snapped.guides;
  } else {
    const canvas = blueBgCanvas();
    const rect = canvas.getBoundingClientRect();
    const toleranceX = 12 * canvas.width / Math.max(1, rect.width);
    const toleranceY = 12 * canvas.height / Math.max(1, rect.height);
    const xSnap = interaction.handle.includes("w") || interaction.handle.includes("e")
      ? nearestSnap(point.x, [0, canvas.width / 2, canvas.width], toleranceX)
      : null;
    const ySnap = interaction.handle.includes("n") || interaction.handle.includes("s")
      ? nearestSnap(point.y, [0, canvas.height / 2, canvas.height], toleranceY)
      : null;
    const visualGeometry = blueBgLayerVisualGeometry(interaction.original);
    const resizePoint = {
      x: xSnap?.value ?? point.x,
      y: ySnap?.value ?? point.y,
    };
    if (interaction.handle.includes("w")) resizePoint.x += visualGeometry.outsets.left;
    if (interaction.handle.includes("e")) resizePoint.x -= visualGeometry.outsets.right;
    if (interaction.handle.includes("n")) resizePoint.y += visualGeometry.outsets.top;
    if (interaction.handle.includes("s")) resizePoint.y -= visualGeometry.outsets.bottom;
    blueBgState.snapGuides = {
      vertical: xSnap ? [xSnap.value] : [],
      horizontal: ySnap ? [ySnap.value] : [],
    };
    const centered = event.altKey || event.ctrlKey;
    const resized = resizeBoundsWithModifiers(interaction.original, interaction.handle, resizePoint, {
      minWidth: 20,
      minHeight: 20,
      preserveAspect: !event.shiftKey,
      centered,
    });
    if (!event.shiftKey || centered) {
      const minScale = 0.1;
      const maxScale = 2;
      const scale = Math.max(
        minScale,
        Math.min(maxScale, resized.width / interaction.original.fitWidth)
      );
      const width = interaction.original.fitWidth * scale;
      const height = interaction.original.fitHeight * scale;
      if (centered) {
        const centerX = interaction.original.x + interaction.original.width / 2;
        const centerY = interaction.original.y + interaction.original.height / 2;
        layer.x = centerX - width / 2;
        layer.y = centerY - height / 2;
      } else {
        layer.x = interaction.handle.includes("w")
          ? interaction.original.x + interaction.original.width - width
          : interaction.handle.includes("e")
            ? interaction.original.x
            : interaction.original.x + (interaction.original.width - width) / 2;
        layer.y = interaction.handle.includes("n")
          ? interaction.original.y + interaction.original.height - height
          : interaction.handle.includes("s")
            ? interaction.original.y
            : interaction.original.y + (interaction.original.height - height) / 2;
      }
      layer.width = width;
      layer.height = height;
    } else {
      Object.assign(layer, resized);
    }
  }
  clampBlueBgLayer(layer);
  updateBlueBgControls();
  renderBlueBgCanvas();
  event.preventDefault();
}

function blueBgPointerUp(event) {
  if (!blueBgState.interaction) return;
  blueBgState.interaction = null;
  blueBgCanvas().releasePointerCapture?.(event.pointerId);
  const snapped = blueBgState.snapGuides.vertical.length || blueBgState.snapGuides.horizontal.length;
  blueBgState.snapGuides = emptySnapGuides();
  renderBlueBgCanvas();
  pushBgHistory();
  blueBgStatus(`${snapped ? "已吸附到图像或画布参考线" : "已保存当前调整"} · 共 ${blueBgState.layers.length} 张图片`);
}

function hideBlueBgContextMenu() {
  $("#blueBgContextMenu").hidden = true;
}

function blueBgContextMenu(event) {
  if (!blueBgState.layers.length) return;
  const point = blueBgPointerPosition(event);
  const layer = [...blueBgState.layers].reverse().find(candidate => blueBgPointInLayer(candidate, point));
  if (!layer) return;
  event.preventDefault();
  blueBgState.selectedId = layer.id;
  blueBgState.selectedIds = [];
  updateBlueBgControls();
  renderBlueBgCanvas();
  const menu = $("#blueBgContextMenu");
  const index = blueBgState.layers.findIndex(candidate => candidate.id === layer.id);
  $("#blueBgMoveUp").disabled = index === blueBgState.layers.length - 1;
  $("#blueBgMoveDown").disabled = index === 0;
  menu.style.left = `${Math.min(event.clientX, window.innerWidth - 150)}px`;
  menu.style.top = `${Math.min(event.clientY, window.innerHeight - 100)}px`;
  menu.hidden = false;
}

function moveSelectedBlueBgLayer(direction) {
  const index = blueBgState.layers.findIndex(layer => layer.id === blueBgState.selectedId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= blueBgState.layers.length) return;
  const [layer] = blueBgState.layers.splice(index, 1);
  blueBgState.layers.splice(nextIndex, 0, layer);
  hideBlueBgContextMenu();
  renderBlueBgCanvas();
  pushBgHistory();
  blueBgStatus(direction > 0 ? "所选图片已上移一层。" : "所选图片已下移一层。");
}

function updateBlueBgLayerOptions() {
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
  layers.forEach(layer => {
    layer.shadow = $("#bgEffectShadow").checked;
    layer.round = $("#bgEffectRound").checked;
  });
  renderBlueBgCanvas();
}

function updateBlueBgLayerScale() {
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
  const scale = Number($("#bgEffectScale").value) / 100;
  layers.forEach(layer => {
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    layer.width = layer.fitWidth * scale;
    layer.height = layer.fitHeight * scale;
    layer.x = centerX - layer.width / 2;
    layer.y = centerY - layer.height / 2;
  });
  updateBlueBgControls();
  renderBlueBgCanvas();
  blueBgStatus(`所选图片缩放比例 ${Math.round(scale * 100)}% · 中心位置保持不变`);
}

function deleteBlueBgLayer() {
  const ids = new Set(selectedBlueBgLayers().map(layer => layer.id));
  if (!ids.size) return;
  blueBgState.layers = blueBgState.layers.filter(layer => !ids.has(layer.id));
  blueBgState.selectedId = blueBgState.layers.at(-1)?.id ?? null;
  blueBgState.selectedIds = [];
  updateBlueBgControls();
  renderBlueBgCanvas();
  pushBgHistory();
  blueBgStatus(`已删除 ${ids.size} 张所选图片 · 共 ${blueBgState.layers.length} 张图片`);
}

function blueBgKeyDown(event) {
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteBlueBgLayer();
    return;
  }
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  const step = event.shiftKey ? 10 : 1;
  layers.forEach(layer => {
    layer.x += direction[0] * step;
    layer.y += direction[1] * step;
    clampBlueBgLayer(layer);
  });
  renderBlueBgCanvas();
  blueBgStatus(`已微调 ${step}px · 共 ${blueBgState.layers.length} 张图片`);
}

function blueBgFilename() {
  const baseName = (blueBgState.sourceName || "image").replace(/\.[^.]+$/, "");
  return `${baseName}-蓝色底图.png`;
}

function composeBlueBgOutputCanvas() {
  const output = document.createElement("canvas");
  renderBlueBgCanvas(true, output);
  return output;
}

function confirmBlueBgRender() {
  if (!blueBgState.layers.length) {
    blueBgStatus("请至少添加一张图片。");
    return;
  }
  const output = composeBlueBgOutputCanvas();
  output.toBlob(blob => {
    if (!blob) {
      blueBgStatus("生成失败，请重试。");
      return;
    }
    const filename = blueBgFilename();
    bgGeneratedResults = [{ blob, filename }];
    downloadBlob(blob, filename);
    updateBgExportState();
    blueBgStatus(`已导出 2000 × 1083px 图片。`);
  }, "image/png");
}

function sendBgToAnnotation() {
  const blueprint = $("#bgBlueMode").checked;
  if (!blueprint) {
    const material = selectedDefaultBgMaterial();
    if (!material?.outputBlob) return;
    const file = new File([material.outputBlob], material.filename || `${material.file.name}-加底.png`, { type: "image/png" });
    showTab("annotation");
    loadAnnotationImage(file);
    return;
  }
  if (!blueBgState.layers.length) return;
  composeBlueBgOutputCanvas().toBlob(blob => {
    if (!blob) {
      blueBgStatus("生成失败，请重试。");
      return;
    }
    const baseName = (blueBgState.sourceName || "image").replace(/\.[^.]+$/, "");
    const file = new File([blob], `${baseName}-蓝色底图.png`, { type: "image/png" });
    showTab("annotation");
    loadAnnotationImage(file);
  }, "image/png");
}

function toggleBlueBgMode() {
  const enabled = $("#bgBlueMode").checked;
  $("#bgModeToggleLabel").textContent = enabled ? "默认模式" : "蓝底模式";
  $("#bgModeToggleButton").classList.toggle("active", !enabled);
  $("#bgModeToggleButton").setAttribute("aria-label", enabled ? "切换到默认模式" : "切换到蓝底模式");
  $("#bgModeToggleButton").title = enabled ? "切换到默认模式" : "切换到蓝底模式";
  $("#bgPreview").hidden = enabled;
  $("#blueBgEditor").hidden = !enabled || !blueBgState.layers.length;
  renderBgMaterialList();
  renderBgPreviewList();
  syncBgEffectToolbar();
  updateBgExportState();
}

function setBgMode(blueprint) {
  if (blueprint) {
    bgMaterials.forEach(material => {
      if (material.renderTimer) {
        window.clearTimeout(material.renderTimer);
        material.renderTimer = null;
      }
      bgRenderControllers.get(material)?.abort();
      material.renderVersion += 1;
      material.rendering = false;
    });
  }
  $("#bgBlueMode").checked = blueprint;
  toggleBlueBgMode();
  if (blueprint && bgMaterials.length && !blueBgState.layers.length) {
    startBlueBgPreview(bgMaterials.map(material => material.file)).catch(err => alert(err.message));
  } else if (blueprint && !blueBgState.layers.length) {
    ensureBlueBgBackground().then(() => {
      $("#blueBgEditor").hidden = false;
      renderBlueBgCanvas();
      resetBlueBgZoom();
      updateBlueBgControls();
    }).catch(err => alert(err.message));
  } else if (!blueprint && bgMaterials.some(material => !material.outputBlob)) {
    processBgImages().catch(err => alert(err.message));
  }
}

function clearBgMaterials() {
  bgMaterials.forEach(material => {
    if (material.previewUrl) URL.revokeObjectURL(material.previewUrl);
    if (material.outputUrl) URL.revokeObjectURL(material.outputUrl);
    if (material.renderTimer) window.clearTimeout(material.renderTimer);
    bgRenderControllers.get(material)?.abort();
  });
  bgMaterials = [];
  bgSelectedMaterialIndex = -1;
  bgSelectedMaterialIndices = [];
}

function setBgFiles(fileList) {
  const files = Array.from(fileList || []);
  clearBgMaterials();
  bgMaterials = files.map(file => ({
    file,
    previewUrl: URL.createObjectURL(file),
    scale: 90,
    shadow: true,
    round: true,
    outputBlob: null,
    outputUrl: "",
    outputLabel: "",
    filename: "",
    renderVersion: 0,
    rendering: false,
    renderTimer: null,
  }));
  bgSelectedMaterialIndex = bgMaterials.length ? 0 : -1;
  bgSelectedMaterialIndices = [];
  bgGeneratedResults = [];
  blueBgState.layers = [];
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  resetBgHistory();
  renderBgMaterialList();
  renderBgPreviewList();
  updateBgExportState();
  if ($("#bgBlueMode").checked && files.length) {
    startBlueBgPreview(files).catch(err => alert(err.message));
  } else if (bgMaterials.length) {
    openBgMaterialInspector(0);
    processBgImages().catch(err => alert(err.message));
  }
}

async function importBgFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  if ($("#bgBlueMode").checked && blueBgState.layers.length) {
    const available = BLUE_BG_MAX_LAYERS - blueBgState.layers.length;
    const accepted = files.slice(0, Math.max(0, available));
    bgMaterials.push(...accepted.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      scale: 90,
      shadow: true,
      round: true,
      outputBlob: null,
      outputUrl: "",
      outputLabel: "",
      filename: "",
      renderVersion: 0,
      rendering: false,
      renderTimer: null,
    })));
    await ensureBlueBgBackground();
    await addBlueBgFiles(accepted);
    return;
  }
  setBgFiles(files);
}

function openBgMaterialInspector(index) {
  const material = bgMaterials[index];
  if (!material || $("#bgBlueMode").checked) return;
  bgSelectedMaterialIndex = index;
  bgSelectedMaterialIndices = [];
  syncBgEffectToolbar();
  renderBgMaterialList();
  renderBgPreviewList();
  updateBgExportState();
}

function toggleDefaultBgMaterialSelection(index) {
  if ($("#bgBlueMode").checked || index < 0 || index >= bgMaterials.length) return;
  const ids = new Set(selectedDefaultBgMaterialIndexes());
  const adding = !ids.has(index);
  if (adding) ids.add(index);
  else ids.delete(index);
  bgSelectedMaterialIndices = [...ids].sort((a, b) => a - b);
  bgSelectedMaterialIndex = adding ? index : (bgSelectedMaterialIndices.at(-1) ?? -1);
  renderBgMaterialList();
  renderBgPreviewList();
  syncBgEffectToolbar();
  updateBgExportState();
}

function saveBgMaterialInspector() {
  const indexes = selectedDefaultBgMaterialIndexes();
  if (!indexes.length || $("#bgBlueMode").checked) return;
  const scale = Math.max(40, Math.min(150, Number($("#bgEffectScale").value) || 90));
  indexes.forEach(index => {
    const material = bgMaterials[index];
    material.scale = scale;
    material.shadow = $("#bgEffectShadow").checked;
    material.round = $("#bgEffectRound").checked;
    material.outputBlob = null;
    scheduleDefaultBgMaterialRender(index);
  });
  $("#bgEffectScaleValue").textContent = `${scale}%`;
  syncBgGeneratedResults();
}

function renderBgMaterialList() {
  const wrap = $("#bgMaterialList");
  if (!wrap) return;
  const scroller = wrap.closest(".bg-material-pane");
  const scrollTop = scroller?.scrollTop || 0;
  wrap.innerHTML = "";
  if ($("#bgBlueMode").checked) {
    blueBgState.layers.forEach((layer, index) => {
      const card = document.createElement("div");
      card.className = `bg-material-card${selectedBlueBgLayers().some(item => item.id === layer.id) ? " active" : ""}`;
      card.dataset.blueLayerId = String(layer.id);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `选择素材 ${layer.fileName || `图片 ${index + 1}`}`);
      const preview = document.createElement("div");
      preview.className = "bg-material-preview";
      const img = document.createElement("img");
      img.src = layer.previewUrl;
      img.alt = "";
      preview.appendChild(img);
      card.appendChild(preview);
      wrap.appendChild(card);
    });
  } else {
    bgMaterials.forEach((material, index) => {
      const card = document.createElement("div");
      card.className = `bg-material-card${selectedDefaultBgMaterialIndexes().includes(index) ? " active" : ""}`;
      card.dataset.bgMaterialIndex = String(index);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `选择素材 ${material.file.name}`);
      const img = document.createElement("img");
      img.src = material.previewUrl;
      img.alt = "";
      const preview = document.createElement("div");
      preview.className = "bg-material-preview";
      preview.appendChild(img);
      card.appendChild(preview);
      wrap.appendChild(card);
    });
  }
  const importCard = document.createElement("div");
  importCard.className = "bg-material-import-card";
  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.className = "bg-material-import-button canvas-empty-import";
  importButton.dataset.importBgMaterial = "";
  importButton.textContent = "导入图片";
  importButton.disabled = $("#bgBlueMode").checked && blueBgState.layers.length >= 3;
  importButton.title = importButton.disabled ? "蓝底模式最多可导入 3 张图片" : "导入图片";
  importCard.appendChild(importButton);
  wrap.appendChild(importCard);
  if (scroller) scroller.scrollTop = scrollTop;
}

function deleteDefaultBgMaterial(index) {
  if ($("#bgBlueMode").checked || index < 0 || index >= bgMaterials.length) return;
  bgMaterials.splice(index, 1);
  if (!bgMaterials.length) bgSelectedMaterialIndex = -1;
  else if (bgSelectedMaterialIndex >= bgMaterials.length) bgSelectedMaterialIndex = bgMaterials.length - 1;
  else if (index < bgSelectedMaterialIndex) bgSelectedMaterialIndex--;
  renderBgMaterialList();
  renderBgPreviewList();
  syncBgGeneratedResults();
  syncBgEffectToolbar();
  pushBgHistory();
}

function deleteSelectedDefaultBgMaterials() {
  const indexes = selectedDefaultBgMaterialIndexes().sort((a, b) => b - a);
  if (!indexes.length) return;
  indexes.forEach(index => bgMaterials.splice(index, 1));
  bgSelectedMaterialIndices = [];
  bgSelectedMaterialIndex = bgMaterials.length ? Math.min(indexes.at(-1), bgMaterials.length - 1) : -1;
  renderBgMaterialList();
  renderBgPreviewList();
  syncBgGeneratedResults();
  syncBgEffectToolbar();
  pushBgHistory();
}

function deleteSelectedBgItem() {
  if ($("#bgBlueMode").checked) deleteBlueBgLayer();
  else deleteSelectedDefaultBgMaterials();
}

function scrollToDefaultBgPreview(index) {
  const scroller = $(".bg-preview");
  const preview = $(`[data-bg-preview-index="${index}"]`, scroller);
  if (!scroller || !preview) return;
  const scrollerRect = scroller.getBoundingClientRect();
  const previewRect = preview.getBoundingClientRect();
  const paddingTop = Number.parseFloat(getComputedStyle(scroller).paddingTop) || 0;
  const targetTop = scroller.scrollTop + previewRect.top - scrollerRect.top - scroller.clientTop - paddingTop;
  scroller.scrollTo({
    top: Math.max(0, Math.min(targetTop, scroller.scrollHeight - scroller.clientHeight)),
    behavior: "smooth",
  });
}

function batchDownloadBgResults() {
  bgGeneratedResults.forEach(({ blob, filename }, index) => {
    window.setTimeout(() => downloadBlob(blob, filename), index * 120);
  });
}

function updateBgExportState() {
  const blueprint = $("#bgBlueMode").checked;
  $("#bgExportButton").disabled = blueprint ? !blueBgState.layers.length : !bgGeneratedResults.length;
  $("#sendBlueBgToAnnotation").disabled = blueprint
    ? !blueBgState.layers.length
    : !selectedDefaultBgMaterial()?.outputBlob;
  $("#bgUndo").disabled = bgHistoryIndex <= 0;
  $("#bgRedo").disabled = bgHistoryIndex < 0 || bgHistoryIndex >= bgHistory.length - 1;
}

function captureBgHistoryState() {
  return {
    materials: bgMaterials.map(material => ({ ...material, renderTimer: null })),
    layers: blueBgState.layers.map(layer => ({ ...layer })),
    selectedId: blueBgState.selectedId,
    selectedIds: [...blueBgState.selectedIds],
    selectedMaterialIndex: bgSelectedMaterialIndex,
    selectedMaterialIndices: [...bgSelectedMaterialIndices],
  };
}

function pushBgHistory() {
  const snapshot = captureBgHistoryState();
  const signature = JSON.stringify({
    materials: snapshot.materials.map(material => ({
      name: material.file?.name,
      scale: material.scale,
      shadow: material.shadow,
      round: material.round,
    })),
    layers: snapshot.layers.map(layer => ({
      id: layer.id, x: layer.x, y: layer.y, width: layer.width, height: layer.height,
      shadow: layer.shadow, round: layer.round,
    })),
    selectedId: snapshot.selectedId,
    selectedIds: snapshot.selectedIds,
    selectedMaterialIndex: snapshot.selectedMaterialIndex,
    selectedMaterialIndices: snapshot.selectedMaterialIndices,
  });
  if (bgHistory[bgHistoryIndex]?.signature === signature) return;
  bgHistory = bgHistory.slice(0, bgHistoryIndex + 1);
  bgHistory.push({ snapshot, signature });
  if (bgHistory.length > 40) bgHistory.shift();
  bgHistoryIndex = bgHistory.length - 1;
  updateBgExportState();
}

function resetBgHistory() {
  bgHistory = [];
  bgHistoryIndex = -1;
  pushBgHistory();
}

function restoreBgHistory(index) {
  const entry = bgHistory[index];
  if (!entry) return;
  bgMaterials.forEach(material => {
    if (material.renderTimer) window.clearTimeout(material.renderTimer);
    bgRenderControllers.get(material)?.abort();
  });
  bgHistoryIndex = index;
  bgMaterials = entry.snapshot.materials.map(material => ({ ...material, renderTimer: null }));
  bgSelectedMaterialIndex = Math.min(entry.snapshot.selectedMaterialIndex ?? bgSelectedMaterialIndex, bgMaterials.length - 1);
  bgSelectedMaterialIndices = (entry.snapshot.selectedMaterialIndices || []).filter(index => index < bgMaterials.length);
  blueBgState.layers = entry.snapshot.layers.map(layer => ({ ...layer }));
  blueBgState.selectedId = entry.snapshot.selectedId;
  blueBgState.selectedIds = (entry.snapshot.selectedIds || []).filter(id => blueBgState.layers.some(layer => layer.id === id));
  renderBgMaterialList();
  if ($("#bgBlueMode").checked) {
    updateBlueBgControls();
    renderBlueBgCanvas();
  } else {
    if (bgSelectedMaterialIndex >= 0) openBgMaterialInspector(bgSelectedMaterialIndex);
    processBgImages().catch(err => alert(err.message));
  }
  updateBgExportState();
}

function renderBgPreviewList() {
  const wrap = $("#bgPreview");
  if (!wrap || $("#bgBlueMode").checked) return;
  const scroller = wrap;
  const scrollTop = scroller?.scrollTop || 0;
  wrap.innerHTML = "";
  wrap.classList.toggle("is-empty", bgMaterials.length === 0);
  bgMaterials.forEach((material, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `bg-preview-card${selectedDefaultBgMaterialIndexes().includes(index) ? " active" : ""}`;
    card.dataset.bgPreviewIndex = String(index);
    if (material.outputUrl) {
      const img = document.createElement("img");
      img.src = material.outputUrl;
      img.alt = `${material.file.name} 预览`;
      card.appendChild(img);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "preview-placeholder";
      placeholder.textContent = material.rendering ? "正在生成预览…" : "等待生成预览";
      card.appendChild(placeholder);
    }
    const label = document.createElement("small");
    label.textContent = material.outputLabel || material.file.name;
    card.appendChild(label);
    wrap.appendChild(card);
  });
  if (!wrap.children.length) {
    wrap.innerHTML = '<div class="bg-preview-empty-state">暂无预览</div>';
  }
  if (scroller) scroller.scrollTop = scrollTop;
}

function syncBgGeneratedResults() {
  bgGeneratedResults = bgMaterials
    .filter(material => material.outputBlob)
    .map(material => ({ blob: material.outputBlob, filename: material.filename }));
  updateBgExportState();
}

function refreshDefaultBgPreviewCard(index) {
  const material = bgMaterials[index];
  const card = $(`[data-bg-preview-index="${index}"]`, $("#bgPreview"));
  if (!material || !card) {
    renderBgPreviewList();
    return;
  }
  let visual = $("img, .preview-placeholder", card);
  if (material.outputUrl) {
    if (!visual?.matches("img")) {
      const img = document.createElement("img");
      visual?.replaceWith(img);
      if (!visual) card.prepend(img);
      visual = img;
    }
    visual.src = material.outputUrl;
    visual.alt = `${material.file.name} 预览`;
  } else {
    if (!visual?.matches(".preview-placeholder")) {
      const placeholder = document.createElement("span");
      placeholder.className = "preview-placeholder";
      visual?.replaceWith(placeholder);
      if (!visual) card.prepend(placeholder);
      visual = placeholder;
    }
    visual.textContent = material.rendering ? "正在生成预览…" : "等待生成预览";
  }
  let label = $("small", card);
  if (!label) {
    label = document.createElement("small");
    card.appendChild(label);
  }
  label.textContent = material.outputLabel || material.file.name;
}

async function renderDefaultBgMaterial(index, scheduledVersion = null) {
  const material = bgMaterials[index];
  if (!material || $("#bgBlueMode").checked) return;
  const version = scheduledVersion ?? ++material.renderVersion;
  if (version !== material.renderVersion) return;
  bgRenderControllers.get(material)?.abort();
  const controller = new AbortController();
  bgRenderControllers.set(material, controller);
  material.rendering = true;
  if (!material.outputUrl) refreshDefaultBgPreviewCard(index);
  try {
    const { file, scale, shadow, round } = material;
    const { blob, mode, appliedShadow, appliedRound } = await renderBgInBrowser(
      file,
      scale,
      shadow,
      round,
      controller.signal,
    );
    if (version !== material.renderVersion) return;
    const previousOutputUrl = material.outputUrl;
    material.outputBlob = blob;
    material.outputUrl = URL.createObjectURL(blob);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    material.filename = `${baseName}-bg-auto.png`;
    material.outputLabel = `${file.name} · ${bgModeLabel(mode, appliedShadow, appliedRound)}`;
    if (previousOutputUrl) {
      window.setTimeout(() => URL.revokeObjectURL(previousOutputUrl), 1000);
    }
  } catch (error) {
    if (error.name !== "AbortError") throw error;
  } finally {
    if (bgRenderControllers.get(material) === controller) {
      bgRenderControllers.delete(material);
    }
    if (version === material.renderVersion) {
      material.rendering = false;
      refreshDefaultBgPreviewCard(index);
      syncBgGeneratedResults();
    }
  }
}

function scheduleDefaultBgMaterialRender(index) {
  const material = bgMaterials[index];
  if (!material || $("#bgBlueMode").checked) return;
  if (material.renderTimer) window.clearTimeout(material.renderTimer);
  bgRenderControllers.get(material)?.abort();
  const version = ++material.renderVersion;
  material.renderTimer = window.setTimeout(() => {
    material.renderTimer = null;
    renderDefaultBgMaterial(index, version).catch(err => alert(err.message));
  }, 180);
}

async function processBgImages() {
  if ($("#bgBlueMode").checked) return;
  await Promise.all(bgMaterials.map((_, index) => renderDefaultBgMaterial(index)));
}

function bgModeLabel(mode, withShadow, withRound) {
  const shadowText = withShadow ? "带阴影" : "无阴影";
  const roundText = withRound ? "带圆角" : "无圆角";
  return { "white-edge": `白边截图，${shadowText}，${roundText}`, transparent: `透明底，${shadowText}，${roundText}`, manual: `手动加底，${shadowText}，${roundText}` }[mode] || mode;
}

function imageEditorCanvas() {
  return $("#imageEditorCanvas");
}

function imageEditorStatus(message) {
  $("#imageEditorStatus").textContent = message;
}

function cloneCanvas(source) {
  const clone = document.createElement("canvas");
  clone.width = source.width;
  clone.height = source.height;
  clone.getContext("2d").drawImage(source, 0, 0);
  return clone;
}

function canvasScaledToWidth(source, targetWidth = IMAGE_EXPORT_WIDTH) {
  if (source.width === targetWidth) return source;
  const output = document.createElement("canvas");
  output.width = targetWidth;
  output.height = Math.max(1, Math.round(source.height * targetWidth / source.width));
  const ctx = output.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, output.width, output.height);
  return output;
}

function pushImageEditorHistory() {
  imageEditorState.history = imageEditorState.history.slice(0, imageEditorState.historyIndex + 1);
  imageEditorState.history.push(cloneCanvas(imageEditorState.documentCanvas));
  if (imageEditorState.history.length > 6) imageEditorState.history.shift();
  imageEditorState.historyIndex = imageEditorState.history.length - 1;
}

function updateImageEditorControls() {
  const hasImage = imageEditorState.hasImage;
  const hasSelection = Boolean(imageEditorState.selection);
  [
    "#imageEditorMoveMode",
    "#imageEditorRemoveMode",
    "#imageEditorCropMode",
    "#imageEditorGradientMode",
    "#imageEditorMoreButton",
    "#imageEditorSplitMode",
    "#imageEditorBlendMode",
    "#imageEditorWindowMode",
    "#imageEditorExport",
  ].forEach(selector => {
    $(selector).disabled = !hasImage;
  });
  $("#imageEditorUndo").disabled = !hasImage || imageEditorState.historyIndex <= 0;
  $("#imageEditorRedo").disabled = !hasImage || imageEditorState.historyIndex >= imageEditorState.history.length - 1;
  $("#imageEditorMoveMode").classList.toggle("active", imageEditorState.mode === "view");
  $("#imageEditorRemoveMode").classList.toggle("active", imageEditorState.mode === "remove");
  $("#imageEditorCropMode").classList.toggle("active", imageEditorState.mode === "crop");
  $("#imageEditorGradientMode").classList.toggle("active", imageEditorState.mode === "gradient");
  $("#imageEditorSplitMode").classList.toggle("active", imageEditorState.mode === "split");
  $("#imageEditorBlendMode").classList.toggle("active", imageEditorState.mode === "blend");
  $("#imageEditorMoreButton").classList.toggle("active", ["split", "blend"].includes(imageEditorState.mode));
  $("#imageEditorCompositeControls").hidden = !["split", "blend"].includes(imageEditorState.mode);
  $("#imageEditorOptions").hidden = !["split", "blend"].includes(imageEditorState.mode);
  $("#imageEditorBlendWidthField").hidden = imageEditorState.mode !== "blend";
  $("#imageEditorApplyComposite").disabled = !imageEditorState.secondImage;
  const stage = $("#imageEditorStage");
  stage.dataset.mode = imageEditorState.mode;
  stage.classList.toggle("has-selection", hasSelection || Boolean(imageEditorState.gradient));
  syncImageEditorOverlays();
}

function intersectImageEditorSelection(selection = imageEditorState.selection) {
  if (!selection) return null;
  const source = imageEditorState.documentCanvas;
  const left = Math.max(0, selection.x);
  const top = Math.max(0, selection.y);
  const right = Math.min(source.width, selection.x + selection.width);
  const bottom = Math.min(source.height, selection.y + selection.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function drawImageEditorSelection(ctx) {
  const selection = imageEditorState.selection;
  if (!selection) return;
  const overlap = intersectImageEditorSelection(selection);
  ctx.save();
  if (imageEditorState.mode === "remove" && overlap) {
    ctx.fillStyle = "rgba(239, 68, 68, .28)";
    ctx.fillRect(overlap.x, overlap.y, overlap.width, overlap.height);
  } else if (imageEditorState.mode === "crop") {
    const canvas = imageEditorState.documentCanvas;
    ctx.fillStyle = "rgba(15, 23, 42, .48)";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(selection.x, selection.y, selection.width, selection.height);
    ctx.fill("evenodd");
  }
  ctx.restore();
}

function drawImageEditorGradient(ctx, width, height, gradient = imageEditorState.gradient) {
  if (!gradient) return;
  const dx = gradient.end.x - gradient.start.x;
  const dy = gradient.end.y - gradient.start.y;
  if (Math.hypot(dx, dy) < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createLinearGradient(gradient.start.x, gradient.start.y, gradient.end.x, gradient.end.y);
  mask.addColorStop(0, "rgba(0,0,0,0)");
  mask.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function renderImageEditorCanvas() {
  if (!imageEditorState.hasImage) return;
  const canvas = imageEditorCanvas();
  const source = imageEditorState.documentCanvas;
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (["split", "blend"].includes(imageEditorState.mode) && imageEditorState.secondImage) {
    drawImageEditorComposite(ctx, canvas.width, canvas.height, true);
  } else {
    ctx.drawImage(source, 0, 0);
  }
  if (imageEditorState.mode === "gradient" && imageEditorState.gradient) {
    drawImageEditorGradient(ctx, canvas.width, canvas.height);
  }
  drawImageEditorSelection(ctx);
  requestAnimationFrame(syncImageEditorOverlays);
}

function imageEditorCanvasPointToStage(point) {
  const stage = $("#imageEditorStage");
  const canvas = imageEditorCanvas();
  const stageRect = stage.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  return {
    x: canvasRect.left - stageRect.left + stage.scrollLeft + point.x * canvasRect.width / canvas.width,
    y: canvasRect.top - stageRect.top + stage.scrollTop + point.y * canvasRect.height / canvas.height,
  };
}

function imageEditorSnapTargets() {
  const stage = $("#imageEditorStage");
  const canvas = imageEditorCanvas();
  const stageRect = stage.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(1, canvasRect.width);
  const scaleY = canvas.height / Math.max(1, canvasRect.height);
  const unique = values => [...new Set(values.map(value => Math.round(value * 1000) / 1000))];
  return {
    x: unique([
      0,
      canvas.width,
      (stageRect.left - canvasRect.left) * scaleX,
      (stageRect.right - canvasRect.left) * scaleX,
    ]),
    y: unique([
      0,
      canvas.height,
      (stageRect.top - canvasRect.top) * scaleY,
      (stageRect.bottom - canvasRect.top) * scaleY,
    ]),
    toleranceX: 10 * scaleX,
    toleranceY: 10 * scaleY,
  };
}

function snapImageEditorPoint(point, axes = "both") {
  const targets = imageEditorSnapTargets();
  const xMatch = axes !== "y" ? nearestSnap(point.x, targets.x, targets.toleranceX) : null;
  const yMatch = axes !== "x" ? nearestSnap(point.y, targets.y, targets.toleranceY) : null;
  return {
    point: {
      x: xMatch?.value ?? point.x,
      y: yMatch?.value ?? point.y,
    },
    guides: {
      vertical: xMatch ? [xMatch.value] : [],
      horizontal: yMatch ? [yMatch.value] : [],
    },
  };
}

function renderImageEditorSnapGuides() {
  const host = $("#imageEditorSnapGuides");
  host.innerHTML = "";
  const guides = imageEditorState.snapGuides;
  guides.vertical.forEach(x => {
    const line = document.createElement("i");
    line.className = "vertical";
    line.style.left = `${imageEditorCanvasPointToStage({ x, y: 0 }).x}px`;
    host.appendChild(line);
  });
  guides.horizontal.forEach(y => {
    const line = document.createElement("i");
    line.className = "horizontal";
    line.style.top = `${imageEditorCanvasPointToStage({ x: 0, y }).y}px`;
    host.appendChild(line);
  });
  host.hidden = !host.children.length;
}

function syncImageEditorOverlays() {
  const selectionOverlay = $("#imageEditorSelectionOverlay");
  const gradientOverlay = $("#imageEditorGradientOverlay");
  const selection = imageEditorState.selection;
  selectionOverlay.hidden = !selection;
  selectionOverlay.classList.toggle(
    "is-adjusting",
    ["create", "adjust", "move-selection"].includes(imageEditorState.interaction?.mode)
  );
  if (selection) {
    syncCanvasSelectionOverlay(
      $("#imageEditorStage"),
      imageEditorCanvas(),
      selectionOverlay,
      selection
    );
  }
  const gradient = imageEditorState.gradient;
  gradientOverlay.hidden = !gradient;
  gradientOverlay.classList.toggle(
    "is-adjusting",
    Boolean(imageEditorState.interaction?.mode?.startsWith("gradient"))
  );
  if (gradient) {
    const start = imageEditorCanvasPointToStage(gradient.start);
    const end = imageEditorCanvasPointToStage(gradient.end);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const actionX = dx + 12;
    const actionY = dy;
    gradientOverlay.style.left = `${start.x}px`;
    gradientOverlay.style.top = `${start.y}px`;
    gradientOverlay.style.setProperty("--gradient-length", `${length}px`);
    gradientOverlay.style.setProperty("--gradient-angle", `${Math.atan2(dy, dx)}rad`);
    gradientOverlay.style.setProperty("--gradient-end-x", `${dx}px`);
    gradientOverlay.style.setProperty("--gradient-end-y", `${dy}px`);
    gradientOverlay.style.setProperty("--gradient-actions-x", `${actionX}px`);
    gradientOverlay.style.setProperty("--gradient-actions-y", `${actionY}px`);
  }
  renderImageEditorSnapGuides();
}

function drawImageCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawImageEditorDivider(ctx, width, height) {
  const position = Number($("#imageEditorDividerPosition").value) / 100;
  const angle = Number($("#imageEditorDividerAngle").value) * Math.PI / 180;
  const lineWidth = Number($("#imageEditorDividerWidth").value);
  if (lineWidth <= 0) return;
  const style = $("#imageEditorDividerStyle").value;
  const span = Math.hypot(width, height) * 1.5;
  ctx.save();
  ctx.translate(width * position, height / 2);
  ctx.rotate(angle);
  ctx.strokeStyle = $("#imageEditorDividerColor").value;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (style === "wave") {
    for (let y = -span; y <= span; y += 12) {
      const x = Math.sin(y / 34) * 18;
      if (y === -span) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else if (style === "lightning") {
    ctx.moveTo(0, -span);
    for (let y = -span + 38, direction = 1; y <= span; y += 38, direction *= -1) {
      ctx.lineTo(direction * 22, y);
    }
  } else {
    ctx.moveTo(0, -span);
    ctx.lineTo(0, span);
  }
  ctx.stroke();
  ctx.restore();
}

function drawImageEditorComposite(ctx, width, height, withGuide) {
  const source = imageEditorState.documentCanvas;
  const second = imageEditorState.secondImage;
  const position = Number($("#imageEditorDividerPosition").value) / 100;
  const angle = Number($("#imageEditorDividerAngle").value) * Math.PI / 180;
  drawImageCover(ctx, source, width, height);
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext("2d");
  drawImageCover(layerCtx, second, width, height);
  layerCtx.globalCompositeOperation = "destination-in";
  layerCtx.translate(width * position, height / 2);
  layerCtx.rotate(angle);
  const span = Math.hypot(width, height) * 2;
  if (imageEditorState.mode === "blend") {
    const blend = Number($("#imageEditorBlendWidth").value);
    const gradient = layerCtx.createLinearGradient(-blend / 2, 0, blend / 2, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");
    layerCtx.fillStyle = gradient;
    layerCtx.fillRect(-blend / 2, -span, span, span * 2);
  } else {
    layerCtx.fillStyle = "#000";
    layerCtx.fillRect(0, -span, span, span * 2);
  }
  layerCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(layer, 0, 0);
  if (withGuide && imageEditorState.mode === "split") drawImageEditorDivider(ctx, width, height);
}

function applyImageEditorZoom(zoom) {
  if (!imageEditorState.hasImage || !imageEditorState.baseDisplayWidth) return;
  const canvas = imageEditorCanvas();
  imageEditorState.zoom = Math.max(0.25, Math.min(20, zoom));
  canvas.style.width = `${imageEditorState.baseDisplayWidth * imageEditorState.zoom}px`;
  canvas.style.height = `${imageEditorState.baseDisplayHeight * imageEditorState.zoom}px`;
  canvas.style.imageRendering = imageEditorState.zoom >= 4 ? "pixelated" : "auto";
  $("#imageEditorStage").classList.toggle("at-base-zoom", imageEditorState.zoom <= 1.001);
  requestAnimationFrame(syncImageEditorOverlays);
}

function resetImageEditorZoom() {
  const canvas = imageEditorCanvas();
  imageEditorState.zoom = 1;
  imageEditorState.baseDisplayWidth = 0;
  imageEditorState.baseDisplayHeight = 0;
  canvas.style.width = "";
  canvas.style.height = "";
  canvas.style.maxWidth = "";
  canvas.style.maxHeight = "";
  requestAnimationFrame(() => {
    if (!imageEditorState.hasImage) return;
    const rect = canvas.getBoundingClientRect();
    imageEditorState.baseDisplayWidth = rect.width;
    imageEditorState.baseDisplayHeight = rect.height;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    applyImageEditorZoom(1);
  });
}

async function loadImageEditorFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImageSource(url);
    const documentCanvas = document.createElement("canvas");
    documentCanvas.width = image.naturalWidth;
    documentCanvas.height = image.naturalHeight;
    documentCanvas.getContext("2d").drawImage(image, 0, 0);
    imageEditorState.documentCanvas = documentCanvas;
    imageEditorState.sourceName = file.name;
    imageEditorState.hasImage = true;
    imageEditorState.mode = "view";
    imageEditorState.selection = null;
    imageEditorState.interaction = null;
    imageEditorState.gradient = null;
    imageEditorState.snapGuides = emptySnapGuides();
    imageEditorState.history = [];
    imageEditorState.historyIndex = -1;
    pushImageEditorHistory();
    $("#imageEditorStage").classList.add("has-image");
    renderImageEditorCanvas();
    resetImageEditorZoom();
    updateImageEditorControls();
    imageEditorStatus(`${image.naturalWidth} × ${image.naturalHeight}px · 已导入原图`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setImageEditorMode(mode) {
  if (!imageEditorState.hasImage) return;
  $("#imageEditorMoreMenu").hidden = true;
  $("#imageEditorMoreButton").setAttribute("aria-expanded", "false");
  imageEditorState.mode = mode;
  imageEditorState.selection = mode === "crop"
    ? {
      x: 0,
      y: 0,
      width: imageEditorState.documentCanvas.width,
      height: imageEditorState.documentCanvas.height,
    }
    : null;
  imageEditorState.interaction = null;
  imageEditorState.gradient = null;
  imageEditorState.snapGuides = emptySnapGuides();
  $("#imageEditorStage").style.cursor = "";
  renderImageEditorCanvas();
  updateImageEditorControls();
  const message = mode === "remove"
    ? "区段删除：可从画布空白处开始框选；方向会按选区与图像的重叠形状自动判断。"
    : mode === "crop"
      ? "画布裁切：拖动画出要保留的画面范围，再点击“应用所选区域”。"
      : mode === "split"
        ? "线条分隔：导入图 B，然后调节分隔线位置、角度和样式。"
      : mode === "blend"
          ? "图片融合：导入图 B，然后调节交汇位置、角度和融合宽度。"
        : mode === "gradient"
          ? "渐变：从全透明的起点拖向完全不透明的终点；按住 Shift 可吸附到 45° 倍数角度。"
      : "查看模式：按 C 可快速进入画布裁切。";
  imageEditorStatus(message);
  $("#imageEditorStage").focus();
}

function imageEditorPointerPosition(event) {
  const canvas = imageEditorCanvas();
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height,
  };
}

function normalizedEditorSelection(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  return {
    x: left,
    y: top,
    width: Math.max(0, Math.max(start.x, end.x) - left),
    height: Math.max(0, Math.max(start.y, end.y) - top),
  };
}

function selectionFromPoints(start, end, square = false) {
  if (!square) return normalizedEditorSelection(start, end);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));
  return normalizedEditorSelection(start, {
    x: start.x + (dx < 0 ? -size : size),
    y: start.y + (dy < 0 ? -size : size),
  });
}

function resizeBoundsWithModifiers(original, handle, point, {
  minWidth = 2,
  minHeight = 2,
  preserveAspect = false,
  centered = false,
} = {}) {
  const originalRight = original.x + original.width;
  const originalBottom = original.y + original.height;
  const centerX = original.x + original.width / 2;
  const centerY = original.y + original.height / 2;
  const aspect = Math.max(0.0001, original.width / Math.max(0.0001, original.height));
  const keepAspect = preserveAspect || centered;

  if (!keepAspect) {
    let left = original.x;
    let top = original.y;
    let right = originalRight;
    let bottom = originalBottom;
    if (handle.includes("w")) left = Math.min(point.x, right - minWidth);
    if (handle.includes("e")) right = Math.max(point.x, left + minWidth);
    if (handle.includes("n")) top = Math.min(point.y, bottom - minHeight);
    if (handle.includes("s")) bottom = Math.max(point.y, top + minHeight);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  let scale;
  if (centered) {
    const scaleX = handle.includes("w") || handle.includes("e")
      ? Math.abs(point.x - centerX) / Math.max(1, original.width / 2)
      : 0;
    const scaleY = handle.includes("n") || handle.includes("s")
      ? Math.abs(point.y - centerY) / Math.max(1, original.height / 2)
      : 0;
    scale = Math.max(scaleX, scaleY);
  } else {
    const anchorX = handle.includes("w") ? originalRight : original.x;
    const anchorY = handle.includes("n") ? originalBottom : original.y;
    const scaleX = handle.includes("w") || handle.includes("e")
      ? Math.abs(point.x - anchorX) / Math.max(1, original.width)
      : 0;
    const scaleY = handle.includes("n") || handle.includes("s")
      ? Math.abs(point.y - anchorY) / Math.max(1, original.height)
      : 0;
    scale = (scaleX && scaleY) ? Math.max(scaleX, scaleY) : (scaleX || scaleY);
  }
  const minimumScale = Math.max(minWidth / original.width, minHeight / original.height);
  scale = Math.max(minimumScale, scale || minimumScale);
  const width = original.width * scale;
  const height = width / aspect;

  if (centered) {
    return {
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    };
  }

  let x;
  let y;
  if (handle.includes("w")) x = originalRight - width;
  else if (handle.includes("e")) x = original.x;
  else x = centerX - width / 2;
  if (handle.includes("n")) y = originalBottom - height;
  else if (handle.includes("s")) y = original.y;
  else y = centerY - height / 2;
  return { x, y, width, height };
}

function imageEditorPointerDown(event) {
  if (!imageEditorState.hasImage || event.button > 0) return;
  if (event.target.closest(".image-editor-selection-actions")) return;
  imageEditorState.snapGuides = emptySnapGuides();
  const point = imageEditorPointerPosition(event);
  if (imageEditorState.mode === "gradient") {
    const gradientHandle = event.target.closest("[data-gradient-handle]")?.dataset.gradientHandle;
    if (gradientHandle && imageEditorState.gradient) {
      imageEditorState.interaction = { mode: "gradient-adjust", handle: gradientHandle };
    } else if (imageEditorState.gradient) {
      return;
    } else {
      imageEditorState.gradient = { start: point, end: point };
      imageEditorState.interaction = { mode: "gradient" };
    }
  } else if (["remove", "crop"].includes(imageEditorState.mode)) {
    const handle = event.target.closest("[data-selection-handle]")?.dataset.selectionHandle;
    if (handle && imageEditorState.selection) {
      imageEditorState.interaction = {
        mode: "adjust",
        handle,
        start: point,
        original: { ...imageEditorState.selection },
      };
    } else if (
      imageEditorState.selection &&
      point.x >= imageEditorState.selection.x &&
      point.x <= imageEditorState.selection.x + imageEditorState.selection.width &&
      point.y >= imageEditorState.selection.y &&
      point.y <= imageEditorState.selection.y + imageEditorState.selection.height
    ) {
      imageEditorState.interaction = {
        mode: "move-selection",
        start: point,
        original: { ...imageEditorState.selection },
      };
    } else if (imageEditorState.selection) {
      return;
    } else {
      const snapped = snapImageEditorPoint(point);
      imageEditorState.snapGuides = snapped.guides;
      imageEditorState.interaction = {
        mode: "create",
        start: snapped.point,
        baseGuides: snapped.guides,
      };
      imageEditorState.selection = normalizedEditorSelection(snapped.point, snapped.point);
    }
  } else {
    return;
  }
  $("#imageEditorStage").setPointerCapture?.(event.pointerId);
  $("#imageEditorStage").focus();
  renderImageEditorCanvas();
  updateImageEditorControls();
  event.preventDefault();
}

function snapGradientPoint(anchor, point, shiftKey) {
  if (!shiftKey) return point;
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.001) return point;
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return {
    x: anchor.x + Math.cos(angle) * length,
    y: anchor.y + Math.sin(angle) * length,
  };
}

function resizeImageEditorSelection(interaction, point, event) {
  const axes = (interaction.handle === "n" || interaction.handle === "s")
    ? "y"
    : (interaction.handle === "e" || interaction.handle === "w")
      ? "x"
      : "both";
  const snapped = snapImageEditorPoint(point, axes);
  point = snapped.point;
  imageEditorState.snapGuides = snapped.guides;
  return resizeBoundsWithModifiers(interaction.original, interaction.handle, point, {
    preserveAspect: event.shiftKey,
    centered: event.altKey || event.ctrlKey,
  });
}

function imageEditorPointerMove(event) {
  if (!imageEditorState.interaction) {
    const selection = imageEditorState.selection;
    if (selection && ["remove", "crop"].includes(imageEditorState.mode)) {
      const point = imageEditorPointerPosition(event);
      const inside = point.x >= selection.x && point.x <= selection.x + selection.width &&
        point.y >= selection.y && point.y <= selection.y + selection.height;
      $("#imageEditorStage").style.cursor = inside ? "move" : "";
    }
    return;
  }
  const point = imageEditorPointerPosition(event);
  const interaction = imageEditorState.interaction;
  if (interaction.mode === "gradient") {
    imageEditorState.gradient.end = snapGradientPoint(
      imageEditorState.gradient.start,
      point,
      event.shiftKey
    );
  } else if (interaction.mode === "gradient-adjust") {
    const moving = interaction.handle;
    const anchor = moving === "start"
      ? imageEditorState.gradient.end
      : imageEditorState.gradient.start;
    imageEditorState.gradient[moving] = snapGradientPoint(anchor, point, event.shiftKey);
  } else if (interaction.mode === "create") {
    const snapped = snapImageEditorPoint(point);
    imageEditorState.snapGuides = {
      vertical: [...new Set([
        ...interaction.baseGuides.vertical,
        ...snapped.guides.vertical,
      ])],
      horizontal: [...new Set([
        ...interaction.baseGuides.horizontal,
        ...snapped.guides.horizontal,
      ])],
    };
    imageEditorState.selection = selectionFromPoints(interaction.start, snapped.point, event.shiftKey);
  } else if (interaction.mode === "move-selection") {
    const moved = {
      ...interaction.original,
      x: interaction.original.x + point.x - interaction.start.x,
      y: interaction.original.y + point.y - interaction.start.y,
    };
    const snapped = snapBoundsToCanvas(moved, imageEditorCanvas(), 10, true);
    imageEditorState.selection = {
      ...moved,
      x: snapped.x,
      y: snapped.y,
    };
    imageEditorState.snapGuides = snapped.guides;
  } else {
    imageEditorState.selection = resizeImageEditorSelection(interaction, point, event);
  }
  renderImageEditorCanvas();
  updateImageEditorControls();
  event.preventDefault();
}

function imageEditorPointerUp(event) {
  if (!imageEditorState.interaction) return;
  const interaction = imageEditorState.interaction;
  imageEditorState.interaction = null;
  $("#imageEditorStage").releasePointerCapture?.(event.pointerId);
  if (interaction.mode === "gradient" || interaction.mode === "gradient-adjust") {
    const gradient = imageEditorState.gradient;
    if (!gradient || Math.hypot(gradient.end.x - gradient.start.x, gradient.end.y - gradient.start.y) < 3) {
      imageEditorState.gradient = null;
      renderImageEditorCanvas();
      updateImageEditorControls();
      return;
    }
    imageEditorStatus("渐变辅助线已完成：起点全透明，终点完全不透明。");
    syncImageEditorOverlays();
    return;
  }
  const snapped = imageEditorState.snapGuides.vertical.length || imageEditorState.snapGuides.horizontal.length;
  imageEditorState.snapGuides = emptySnapGuides();
  const selection = imageEditorState.selection;
  if (!selection || selection.width < 2 || selection.height < 2) {
    imageEditorState.selection = null;
    renderImageEditorCanvas();
    updateImageEditorControls();
    return;
  }
  const effective = imageEditorState.mode === "remove" ? intersectImageEditorSelection(selection) : selection;
  if (!effective) {
    imageEditorStatus("选区没有与图像重叠，请拖动边缘或四角重新调整。");
    syncImageEditorOverlays();
    return;
  }
  const dimensions = `${Math.round(effective.width)} × ${Math.round(effective.height)}px`;
  const direction = imageEditorState.mode === "remove"
    ? (effective.width / imageEditorState.documentCanvas.width >= effective.height / imageEditorState.documentCanvas.height
      ? "上下拼合"
      : "左右拼合")
    : "";
  imageEditorStatus(
    imageEditorState.mode === "remove"
      ? `有效删除区域 ${dimensions} · 将自动${direction}${snapped ? " · 已吸附到边缘" : ""}。`
      : `已框选保留区域 ${dimensions}${snapped ? " · 已吸附到边缘" : ""}。`
  );
  renderImageEditorCanvas();
}

function cancelImageEditorSelection() {
  imageEditorState.selection = null;
  imageEditorState.interaction = null;
  imageEditorState.snapGuides = emptySnapGuides();
  renderImageEditorCanvas();
  updateImageEditorControls();
  imageEditorStatus("已取消当前框选。");
}

function applyImageEditorSelection() {
  const selection = imageEditorState.selection;
  const source = imageEditorState.documentCanvas;
  if (!selection || !imageEditorState.hasImage) return;
  let result = document.createElement("canvas");
  if (imageEditorState.mode === "crop") {
    const x = Math.round(selection.x);
    const y = Math.round(selection.y);
    const width = Math.round(selection.width);
    const height = Math.round(selection.height);
    if (width < 2 || height < 2) return;
    result.width = width;
    result.height = height;
    result.getContext("2d").drawImage(source, -x, -y);
  } else {
    const overlap = intersectImageEditorSelection(selection);
    if (!overlap) return;
    const x = Math.round(overlap.x);
    const y = Math.round(overlap.y);
    const width = Math.round(overlap.width);
    const height = Math.round(overlap.height);
    const horizontal = width / source.width >= height / source.height;
    if (horizontal) {
      if (height < 2 || height >= source.height) return;
      result.width = source.width;
      result.height = source.height - height;
      const out = result.getContext("2d");
      if (y > 0) out.drawImage(source, 0, 0, source.width, y, 0, 0, source.width, y);
      const bottomHeight = source.height - y - height;
      if (bottomHeight > 0) {
        out.drawImage(source, 0, y + height, source.width, bottomHeight, 0, y, source.width, bottomHeight);
      }
    } else {
      if (width < 2 || width >= source.width) return;
      result.width = source.width - width;
      result.height = source.height;
      const out = result.getContext("2d");
      if (x > 0) out.drawImage(source, 0, 0, x, source.height, 0, 0, x, source.height);
      const rightWidth = source.width - x - width;
      if (rightWidth > 0) {
        out.drawImage(source, x + width, 0, rightWidth, source.height, x, 0, rightWidth, source.height);
      }
    }
  }
  imageEditorState.documentCanvas = result;
  imageEditorState.selection = null;
  pushImageEditorHistory();
  renderImageEditorCanvas();
  resetImageEditorZoom();
  updateImageEditorControls();
  imageEditorStatus(
    `${imageEditorState.mode === "crop" ? "画布裁切" : "区段删除拼合"}完成 · 当前 ${result.width} × ${result.height}px`
  );
}

function cancelImageEditorGradient() {
  imageEditorState.gradient = null;
  imageEditorState.interaction = null;
  imageEditorState.snapGuides = emptySnapGuides();
  renderImageEditorCanvas();
  updateImageEditorControls();
  imageEditorStatus("已取消透明度渐变。");
}

function applyImageEditorGradient() {
  if (!imageEditorState.gradient || !imageEditorState.hasImage) return;
  const source = imageEditorState.documentCanvas;
  const result = cloneCanvas(source);
  drawImageEditorGradient(result.getContext("2d"), result.width, result.height);
  imageEditorState.documentCanvas = result;
  imageEditorState.gradient = null;
  imageEditorState.mode = "view";
  pushImageEditorHistory();
  renderImageEditorCanvas();
  updateImageEditorControls();
  imageEditorStatus(`渐变透明已应用 · 当前 ${result.width} × ${result.height}px PNG 画布`);
}

function restoreImageEditorHistory(index) {
  if (index < 0 || index >= imageEditorState.history.length) return;
  imageEditorState.historyIndex = index;
  imageEditorState.documentCanvas = cloneCanvas(imageEditorState.history[index]);
  imageEditorState.selection = null;
  imageEditorState.gradient = null;
  renderImageEditorCanvas();
  resetImageEditorZoom();
  updateImageEditorControls();
  imageEditorStatus(`已恢复到历史步骤 ${index + 1} · 当前 ${imageEditorState.documentCanvas.width} × ${imageEditorState.documentCanvas.height}px`);
}

function exportImageEditorImage() {
  if (!imageEditorState.hasImage) return;
  const exportCanvas = canvasScaledToWidth(imageEditorState.documentCanvas);
  exportCanvas.toBlob(blob => {
    if (!blob) return;
    const baseName = imageEditorState.sourceName.replace(/\.[^.]+$/, "") || "image";
    downloadBlob(blob, `${baseName}-编辑.png`);
    imageEditorStatus(`已导出 ${exportCanvas.width} × ${exportCanvas.height}px PNG`);
  }, "image/png");
}

async function loadImageEditorSecondFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    imageEditorState.secondImage = await loadImageSource(url);
    renderImageEditorCanvas();
    updateImageEditorControls();
    imageEditorStatus(`已导入图 B：${file.name}`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function applyImageEditorComposite() {
  if (!imageEditorState.secondImage || !["split", "blend"].includes(imageEditorState.mode)) return;
  const compositeMode = imageEditorState.mode;
  const result = document.createElement("canvas");
  result.width = imageEditorState.documentCanvas.width;
  result.height = imageEditorState.documentCanvas.height;
  drawImageEditorComposite(result.getContext("2d"), result.width, result.height, false);
  if (compositeMode === "split") drawImageEditorDivider(result.getContext("2d"), result.width, result.height);
  imageEditorState.documentCanvas = result;
  imageEditorState.secondImage = null;
  imageEditorState.mode = "view";
  pushImageEditorHistory();
  renderImageEditorCanvas();
  updateImageEditorControls();
  imageEditorStatus(`图片${compositeMode === "blend" ? "融合" : "分隔拼接"}完成 · ${result.width} × ${result.height}px`);
}

function suggestImageEditorWindow() {
  if (!imageEditorState.hasImage) return;
  $("#imageEditorMoreMenu").hidden = true;
  $("#imageEditorMoreButton").setAttribute("aria-expanded", "false");
  const source = imageEditorState.documentCanvas;
  const maxSide = 520;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const sample = document.createElement("canvas");
  sample.width = Math.max(2, Math.round(source.width * scale));
  sample.height = Math.max(2, Math.round(source.height * scale));
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, sample.width, sample.height);
  const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
  const gray = (x, y) => {
    const i = (y * sample.width + x) * 4;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  };
  const vertical = new Array(sample.width).fill(0);
  const horizontal = new Array(sample.height).fill(0);
  for (let y = 1; y < sample.height - 1; y++) {
    for (let x = 1; x < sample.width - 1; x++) {
      vertical[x] += Math.abs(gray(x + 1, y) - gray(x - 1, y));
      horizontal[y] += Math.abs(gray(x, y + 1) - gray(x, y - 1));
    }
  }
  const strongest = (values, start, end) => {
    let best = start;
    for (let i = start + 1; i < end; i++) if (values[i] > values[best]) best = i;
    return best;
  };
  const left = strongest(vertical, Math.round(sample.width * 0.05), Math.round(sample.width * 0.48));
  const right = strongest(vertical, Math.round(sample.width * 0.52), Math.round(sample.width * 0.95));
  const top = strongest(horizontal, Math.round(sample.height * 0.05), Math.round(sample.height * 0.48));
  const bottom = strongest(horizontal, Math.round(sample.height * 0.52), Math.round(sample.height * 0.95));
  const inset = 2 / scale;
  imageEditorState.mode = "crop";
  imageEditorState.selection = {
    x: left / scale + inset,
    y: top / scale + inset,
    width: Math.max(2, (right - left) / scale - inset * 2),
    height: Math.max(2, (bottom - top) / scale - inset * 2),
  };
  renderImageEditorCanvas();
  updateImageEditorControls();
  imageEditorStatus("已生成窗口内边候选框；请拖动四边精修，确认后再应用裁切。");
}

function setImageEditorZoomAtPoint(nextZoom, clientX, clientY) {
  const stage = $("#imageEditorStage");
  const canvas = imageEditorCanvas();
  const rect = canvas.getBoundingClientRect();
  const ratioX = rect.width ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0.5;
  const ratioY = rect.height ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) : 0.5;
  const beforeWidth = rect.width;
  const beforeHeight = rect.height;
  applyImageEditorZoom(nextZoom);
  stage.scrollLeft += ratioX * (canvas.getBoundingClientRect().width - beforeWidth);
  stage.scrollTop += ratioY * (canvas.getBoundingClientRect().height - beforeHeight);
  imageEditorStatus(`画布缩放 ${Math.round(imageEditorState.zoom * 100)}% · ${canvas.width} × ${canvas.height}px`);
}

function imageEditorWheel(event) {
  if (!imageEditorState.hasImage || !event.ctrlKey) return;
  event.preventDefault();
  setImageEditorZoomAtPoint(
    imageEditorState.zoom * Math.exp(-event.deltaY * 0.006),
    event.clientX,
    event.clientY
  );
}

function imageEditorGestureStart(event) {
  if (!imageEditorState.hasImage) return;
  event.preventDefault();
  imageEditorState.gestureStartZoom = imageEditorState.zoom;
}

function imageEditorGestureChange(event) {
  if (!imageEditorState.hasImage) return;
  event.preventDefault();
  setImageEditorZoomAtPoint(
    imageEditorState.gestureStartZoom * event.scale,
    event.clientX,
    event.clientY
  );
}

function imageEditorKeyDown(event) {
  if (event.key.toLowerCase() === "v" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    setImageEditorMode("view");
  } else if (event.key.toLowerCase() === "c" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    setImageEditorMode(imageEditorState.mode === "crop" ? "view" : "crop");
  } else if (event.key === "Enter" && imageEditorState.selection && !imageEditorState.interaction) {
    event.preventDefault();
    applyImageEditorSelection();
  } else if (event.key === "Enter" && imageEditorState.gradient && !imageEditorState.interaction) {
    event.preventDefault();
    applyImageEditorGradient();
  } else if (event.key === "Escape" && imageEditorState.selection && !imageEditorState.interaction) {
    event.preventDefault();
    cancelImageEditorSelection();
  } else if (event.key === "Escape" && imageEditorState.gradient && !imageEditorState.interaction) {
    event.preventDefault();
    cancelImageEditorGradient();
  }
}

function annotationCanvas() {
  return $("#annotationCanvas");
}

function annotationContext() {
  return annotationCanvas().getContext("2d");
}

function pushAnnotationHistory() {
  const snapshot = annotationState.items.map(item => ({ ...item }));
  const signature = JSON.stringify(snapshot);
  if (annotationState.history[annotationState.historyIndex]?.signature === signature) return;
  annotationState.history = annotationState.history.slice(0, annotationState.historyIndex + 1);
  annotationState.history.push({ snapshot, signature });
  if (annotationState.history.length > 60) annotationState.history.shift();
  annotationState.historyIndex = annotationState.history.length - 1;
  updateAnnotationControls();
}

function resetAnnotationHistory() {
  annotationState.history = [];
  annotationState.historyIndex = -1;
  pushAnnotationHistory();
}

function restoreAnnotationHistory(index) {
  const entry = annotationState.history[index];
  if (!entry) return;
  annotationState.historyIndex = index;
  annotationState.items = entry.snapshot.map(item => ({ ...item }));
  annotationState.selectedId = annotationState.items.at(-1)?.id ?? null;
  annotationState.selectedIds = [];
  annotationState.nextId = Math.max(0, ...annotationState.items.map(item => item.id)) + 1;
  annotationState.nextNumber = Math.max(0, ...annotationState.items.filter(item => item.type === "number").map(item => item.number)) + 1;
  annotationState.editingNumberId = null;
  updateAnnotationControls();
  renderAnnotationCanvas();
  annotationStatusText(`已恢复历史步骤 ${index + 1} · 共 ${annotationState.items.length} 个标注`);
}

function updateAnnotationControls() {
  const hasImage = Boolean(annotationState.image);
  const selectedItems = selectedAnnotationItems();
  const selected = selectedItems.length === 1 ? selectedItems[0] : null;
  const hasSelection = selectedItems.length > 0;
  $("#annotationViewMode").disabled = !hasImage;
  $("#addAnnotationNumber").disabled = !hasImage;
  $("#addAnnotationMask").disabled = !hasImage;
  $("#addAnnotationBlur").disabled = !hasImage;
  $("#addAnnotationMagnifier").disabled = !hasImage;
  $("#exportAnnotation").disabled = !hasImage;
  $("#deleteAnnotation").disabled = !hasSelection;
  $("#annotationUndo").disabled = annotationState.historyIndex <= 0;
  $("#annotationRedo").disabled = annotationState.historyIndex < 0 ||
    annotationState.historyIndex >= annotationState.history.length - 1;
  $("#annotationViewMode").classList.toggle("active", annotationState.mode === "view");
  $("#addAnnotationNumber").classList.toggle("active", annotationState.mode === "number");
  $("#addAnnotationMask").classList.toggle("active", annotationState.mode === "mask");
  $("#addAnnotationBlur").classList.toggle("active", annotationState.mode === "blur");
  $("#addAnnotationMagnifier").classList.toggle("active", annotationState.mode === "magnifier");
  $("#annotationStage").dataset.mode = annotationState.mode;
  const blurControls = $("#annotationBlurControls");
  const showBlurControls = selected?.type === "blur";
  blurControls.hidden = !showBlurControls;
  if (showBlurControls) {
    $("#annotationBlurStrength").value = String(selected.strength);
    $("#annotationBlurStrengthValue").textContent = `${selected.strength}px`;
  }
  const magnifierControls = $("#annotationMagnifierControls");
  const showMagnifierControls = selected?.type === "magnifier";
  magnifierControls.hidden = !showMagnifierControls;
  if (showMagnifierControls) {
    $("#annotationMagnifierColor").value = selected.color;
    $("#annotationMagnifierWidth").value = String(selected.lineWidth);
    $("#annotationMagnifierWidthValue").textContent = `${selected.lineWidth}px`;
  }
  $("#annotationNumberEditor").hidden = annotationState.editingNumberId === null;
}

function annotationStatusText(message) {
  $("#annotationStatus").textContent = message;
}

function annotationItemBounds(item) {
  if (item.type === "number") {
    return {
      x: item.x - ANNOTATION_NUMBER_SIZE / 2,
      y: item.y - ANNOTATION_NUMBER_SIZE / 2,
      width: ANNOTATION_NUMBER_SIZE,
      height: ANNOTATION_NUMBER_SIZE,
    };
  }
  if (item.type === "magnifier") {
    const left = Math.min(item.sourceX - item.sourceRadius, item.lensX - item.lensRadius);
    const top = Math.min(item.sourceY - item.sourceRadius, item.lensY - item.lensRadius);
    const right = Math.max(item.sourceX + item.sourceRadius, item.lensX + item.lensRadius);
    const bottom = Math.max(item.sourceY + item.sourceRadius, item.lensY + item.lensRadius);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  return { x: item.x, y: item.y, width: item.width, height: item.height };
}

function selectedAnnotationItems() {
  const ids = annotationState.selectedIds.length
    ? new Set(annotationState.selectedIds)
    : new Set(annotationState.selectedId === null ? [] : [annotationState.selectedId]);
  return annotationState.items.filter(item => ids.has(item.id));
}

function annotationSelectionBounds() {
  return unionBounds(selectedAnnotationItems().map(annotationItemBounds));
}

function annotationSelectionEntries() {
  return selectedAnnotationItems()
    .map(item => ({ id: item.id, bounds: annotationItemBounds(item) }))
    .sort((a, b) => Number(b.id === annotationState.selectedId) - Number(a.id === annotationState.selectedId));
}

function drawAnnotationItem(ctx, item) {
  if (item.type === "number") {
    const radius = ANNOTATION_NUMBER_SIZE / 2;
    ctx.save();
    ctx.fillStyle = "#ff5a52";
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    const fontSize = String(item.number).length >= 3 ? 50 : 70;
    ctx.font = `450 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", MiSans, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(item.number), item.x, item.y + 2);
    ctx.restore();
    return;
  }
  if (item.type === "magnifier") {
    if (item.sourceRadius < 1 || item.lensRadius < 1) return;
    const dx = item.lensX - item.sourceX;
    const dy = item.lensY - item.sourceY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const unitX = dx / distance;
    const unitY = dy / distance;
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = item.lineWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(
      item.sourceX + unitX * item.sourceRadius,
      item.sourceY + unitY * item.sourceRadius
    );
    ctx.lineTo(
      item.lensX - unitX * item.lensRadius,
      item.lensY - unitY * item.lensRadius
    );
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(item.lensX, item.lensY, item.lensRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      item.lensX - item.lensRadius,
      item.lensY - item.lensRadius,
      item.lensRadius * 2,
      item.lensRadius * 2
    );
    ctx.drawImage(
      annotationState.image,
      item.sourceX - item.sourceRadius,
      item.sourceY - item.sourceRadius,
      item.sourceRadius * 2,
      item.sourceRadius * 2,
      item.lensX - item.lensRadius,
      item.lensY - item.lensRadius,
      item.lensRadius * 2,
      item.lensRadius * 2
    );
    ctx.restore();

    ctx.beginPath();
    ctx.arc(item.sourceX, item.sourceY, item.sourceRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(item.lensX, item.lensY, item.lensRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (item.type === "blur") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(item.x, item.y, item.width, item.height);
    ctx.clip();
    ctx.filter = `blur(${item.strength}px)`;
    ctx.drawImage(annotationState.image, 0, 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = "#98b2c0";
    ctx.fillRect(item.x, item.y, item.width, item.height);
    ctx.restore();
  }
}

function drawAnnotationSelection(ctx, item) {
  const bounds = annotationItemBounds(item);
  drawMarchingAntsSelection(ctx, annotationCanvas(), bounds);
}

function renderAnnotationCanvas(includeSelection = true) {
  if (!annotationState.image) {
    syncCanvasSelectionOverlays(
      $("#annotationStage"), annotationCanvas(), $("#annotationSelectionOverlay"), []
    );
    return;
  }
  const canvas = annotationCanvas();
  const ctx = annotationContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(annotationState.image, 0, 0);
  annotationState.items.forEach(item => drawAnnotationItem(ctx, item));
  drawCanvasSnapGuides(ctx, canvas, annotationState.snapGuides);
  if (includeSelection) {
    syncCanvasSelectionOverlays(
      $("#annotationStage"),
      canvas,
      $("#annotationSelectionOverlay"),
      annotationSelectionEntries()
    );
  } else {
    syncCanvasSelectionOverlays(
      $("#annotationStage"),
      canvas,
      $("#annotationSelectionOverlay"),
      []
    );
  }
}

function applyAnnotationZoom(zoom) {
  if (!annotationState.image || !annotationState.baseDisplayWidth) return;
  annotationState.zoom = Math.max(0.25, Math.min(20, zoom));
  const canvas = annotationCanvas();
  canvas.style.width = `${annotationState.baseDisplayWidth * annotationState.zoom}px`;
  canvas.style.height = `${annotationState.baseDisplayHeight * annotationState.zoom}px`;
  canvas.style.imageRendering = annotationState.zoom >= 4 ? "pixelated" : "auto";
  $("#annotationStage").classList.toggle("at-base-zoom", annotationState.zoom <= 1.001);
  requestAnimationFrame(() => {
    syncCanvasSelectionOverlays(
      $("#annotationStage"),
      canvas,
      $("#annotationSelectionOverlay"),
      annotationSelectionEntries()
    );
  });
}

function resetAnnotationZoom() {
  const canvas = annotationCanvas();
  canvas.style.width = "";
  canvas.style.height = "";
  canvas.style.maxWidth = "";
  canvas.style.maxHeight = "";
  annotationState.zoom = 1;
  annotationState.baseDisplayWidth = 0;
  annotationState.baseDisplayHeight = 0;
  requestAnimationFrame(() => {
    if (!annotationState.image) return;
    const rect = canvas.getBoundingClientRect();
    annotationState.baseDisplayWidth = rect.width;
    annotationState.baseDisplayHeight = rect.height;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    applyAnnotationZoom(1);
  });
}

function loadAnnotationImage(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    const canvas = annotationCanvas();
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    annotationState.image = image;
    annotationState.sourceName = file.name;
    annotationState.mode = "view";
    annotationState.items = [];
    annotationState.selectedId = null;
    annotationState.selectedIds = [];
    annotationState.nextNumber = 1;
    annotationState.nextId = 1;
    annotationState.interaction = null;
    annotationState.snapGuides = emptySnapGuides();
    annotationState.editingNumberId = null;
    resetAnnotationHistory();
    $("#annotationStage").classList.add("has-image");
    renderAnnotationCanvas();
    resetAnnotationZoom();
    updateAnnotationControls();
    annotationStatusText(`${image.naturalWidth} × ${image.naturalHeight}px · 0 个标注`);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    annotationStatusText("无法读取这张图片，请换一张重试。");
  };
  image.src = url;
}

function setAnnotationMode(mode) {
  if (!annotationState.image) return;
  annotationState.mode = mode;
  annotationState.interaction = null;
  annotationState.snapGuides = emptySnapGuides();
  annotationCanvas().style.cursor = ["number", "mask", "blur", "magnifier"].includes(mode) ? "crosshair" : "default";
  updateAnnotationControls();
  renderAnnotationCanvas();
  const messages = {
    view: "查看模式：可选择、移动和调整现有标注。",
    number: "序号模式：在图像中点击即可放置序号。",
    mask: "遮挡模式：在图像中拖动框选遮挡区域。",
    blur: "模糊模式：在图像中拖动框选高斯模糊区域。",
    magnifier: "放大镜模式：拖动划定小圆范围，松开后会在右下角创建实时放大圆。",
  };
  annotationStatusText(messages[mode]);
  $("#annotationStage").focus();
}

function clampAnnotationItem(item) {
  const canvas = annotationCanvas();
  if (item.type === "number") {
    const radius = ANNOTATION_NUMBER_SIZE / 2;
    item.x = Math.max(radius, Math.min(canvas.width - radius, item.x));
    item.y = Math.max(radius, Math.min(canvas.height - radius, item.y));
    return;
  }
  if (item.type === "magnifier") {
    const minimumRadius = Math.min(20, canvas.width / 4, canvas.height / 4);
    const clampCircle = (xKey, yKey, radiusKey) => {
      const maximumRadius = Math.max(minimumRadius, Math.min(canvas.width / 2, canvas.height / 2));
      item[radiusKey] = Math.max(minimumRadius, Math.min(maximumRadius, item[radiusKey]));
      item[xKey] = Math.max(item[radiusKey], Math.min(canvas.width - item[radiusKey], item[xKey]));
      item[yKey] = Math.max(item[radiusKey], Math.min(canvas.height - item[radiusKey], item[yKey]));
    };
    clampCircle("sourceX", "sourceY", "sourceRadius");
    clampCircle("lensX", "lensY", "lensRadius");
    return;
  }
  item.width = Math.max(40, Math.min(canvas.width, item.width));
  item.height = Math.max(30, Math.min(canvas.height, item.height));
  item.x = Math.max(0, Math.min(canvas.width - item.width, item.x));
  item.y = Math.max(0, Math.min(canvas.height - item.height, item.y));
}

function addAnnotationNumber() {
  if (!annotationState.image) return;
  const canvas = annotationCanvas();
  const column = (annotationState.nextNumber - 1) % 8;
  const row = Math.floor((annotationState.nextNumber - 1) / 8) % 3;
  const gap = 20;
  const item = {
    id: annotationState.nextId++,
    type: "number",
    number: annotationState.nextNumber++,
    x: canvas.width - ANNOTATION_NUMBER_SIZE / 2 - 28 - column * (ANNOTATION_NUMBER_SIZE + gap),
    y: canvas.height - ANNOTATION_NUMBER_SIZE / 2 - 28 - row * (ANNOTATION_NUMBER_SIZE + gap),
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  finishAnnotationChange(`已添加序号 ${item.number}`);
}

function addAnnotationNumberAt(point) {
  const item = {
    id: annotationState.nextId++,
    type: "number",
    number: annotationState.nextNumber++,
    x: point.x,
    y: point.y,
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  finishAnnotationChange(`已在点击位置添加序号 ${item.number}`);
}

function addAnnotationMask() {
  if (!annotationState.image) return;
  const canvas = annotationCanvas();
  const width = Math.max(40, Math.min(280, canvas.width * 0.3));
  const height = Math.max(30, Math.min(80, canvas.height * 0.12));
  const item = {
    id: annotationState.nextId++,
    type: "mask",
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
    width,
    height,
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  finishAnnotationChange("已添加遮挡块");
}

function addAnnotationBlur() {
  if (!annotationState.image) return;
  const canvas = annotationCanvas();
  const width = Math.max(40, Math.min(360, canvas.width * 0.34));
  const height = Math.max(30, Math.min(120, canvas.height * 0.16));
  const item = {
    id: annotationState.nextId++,
    type: "blur",
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
    width,
    height,
    strength: 16,
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  finishAnnotationChange("已添加高斯模糊");
}

function updateAnnotationMagnifierStyle() {
  const selected = annotationState.items.find(item => item.id === annotationState.selectedId);
  if (selected?.type !== "magnifier") return;
  selected.color = $("#annotationMagnifierColor").value;
  selected.lineWidth = Number($("#annotationMagnifierWidth").value);
  $("#annotationMagnifierWidthValue").textContent = `${selected.lineWidth}px`;
  renderAnnotationCanvas();
  annotationStatusText(`放大镜线条 ${selected.lineWidth}px · 共 ${annotationState.items.length} 个标注`);
}

function updateAnnotationBlurStrength() {
  const selected = annotationState.items.find(item => item.id === annotationState.selectedId);
  if (selected?.type !== "blur") return;
  selected.strength = Number($("#annotationBlurStrength").value);
  $("#annotationBlurStrengthValue").textContent = `${selected.strength}px`;
  renderAnnotationCanvas();
  annotationStatusText(`模糊强度 ${selected.strength}px · 共 ${annotationState.items.length} 个标注`);
}

function finishAnnotationChange(message) {
  annotationState.editingNumberId = null;
  pushAnnotationHistory();
  renderAnnotationCanvas();
  updateAnnotationControls();
  annotationStatusText(`${message} · 共 ${annotationState.items.length} 个标注`);
}

function deleteSelectedAnnotation() {
  const selected = selectedAnnotationItems();
  const ids = new Set(selected.map(item => item.id));
  if (!ids.size) return;
  annotationState.items = annotationState.items.filter(item => !ids.has(item.id));
  annotationState.selectedId = null;
  annotationState.selectedIds = [];
  finishAnnotationChange(`已删除 ${ids.size} 个标注`);
}

function annotationPointerPosition(event) {
  const canvas = annotationCanvas();
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height,
  };
}

function annotationResizeHandles(item) {
  return [
    { key: "nw", x: item.x, y: item.y },
    { key: "n", x: item.x + item.width / 2, y: item.y },
    { key: "ne", x: item.x + item.width, y: item.y },
    { key: "e", x: item.x + item.width, y: item.y + item.height / 2 },
    { key: "se", x: item.x + item.width, y: item.y + item.height },
    { key: "s", x: item.x + item.width / 2, y: item.y + item.height },
    { key: "sw", x: item.x, y: item.y + item.height },
    { key: "w", x: item.x, y: item.y + item.height / 2 },
  ];
}

function hitAnnotationHandle(item, point) {
  if (item?.type === "magnifier") {
    const canvas = annotationCanvas();
    const rect = canvas.getBoundingClientRect();
    const tolerance = 12 * canvas.width / Math.max(1, rect.width);
    const lensDistance = Math.abs(Math.hypot(point.x - item.lensX, point.y - item.lensY) - item.lensRadius);
    if (lensDistance <= tolerance) return "magnifier-lens";
    const sourceDistance = Math.abs(Math.hypot(point.x - item.sourceX, point.y - item.sourceY) - item.sourceRadius);
    if (sourceDistance <= tolerance) return "magnifier-source";
    return null;
  }
  if (item?.type !== "mask" && item?.type !== "blur") return null;
  return hitSelectionHandle(
    { x: item.x, y: item.y, width: item.width, height: item.height },
    point,
    annotationCanvas(),
    12
  );
}

function pointInAnnotationItem(item, point) {
  if (item.type === "number") {
    return Math.hypot(point.x - item.x, point.y - item.y) <= ANNOTATION_NUMBER_SIZE / 2;
  }
  if (item.type === "magnifier") {
    return Boolean(magnifierPartAtPoint(item, point));
  }
  return point.x >= item.x && point.x <= item.x + item.width &&
    point.y >= item.y && point.y <= item.y + item.height;
}

function magnifierPartAtPoint(item, point) {
  if (Math.hypot(point.x - item.lensX, point.y - item.lensY) <= item.lensRadius) return "lens";
  if (Math.hypot(point.x - item.sourceX, point.y - item.sourceY) <= item.sourceRadius) return "source";
  return null;
}

function annotationPointerDown(event) {
  if (!annotationState.image || event.button > 0) return;
  annotationState.editingNumberId = null;
  annotationState.snapGuides = emptySnapGuides();
  const canvas = annotationCanvas();
  const point = annotationPointerPosition(event);
  const existingAtPoint = [...annotationState.items]
    .reverse()
    .find(candidate => pointInAnnotationItem(candidate, point));
  if (["number", "mask", "blur", "magnifier"].includes(annotationState.mode) && existingAtPoint) {
    annotationState.mode = "view";
    annotationStatusText("已点中现有标注，并自动切换到查看模式。");
  }
  if (annotationState.mode === "number") {
    addAnnotationNumberAt(point);
    $("#annotationStage").focus();
    event.preventDefault();
    return;
  }
  if (annotationState.mode === "mask" || annotationState.mode === "blur") {
    const item = {
      id: annotationState.nextId++,
      type: annotationState.mode,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      ...(annotationState.mode === "blur" ? { strength: 16 } : {}),
    };
    annotationState.items.push(item);
    annotationState.selectedId = item.id;
    annotationState.selectedIds = [];
    annotationState.interaction = {
      mode: "create",
      id: item.id,
      start: point,
      original: { ...item },
    };
    canvas.setPointerCapture?.(event.pointerId);
    $("#annotationStage").focus();
    updateAnnotationControls();
    renderAnnotationCanvas();
    event.preventDefault();
    return;
  }
  if (annotationState.mode === "magnifier") {
    const item = {
      id: annotationState.nextId++,
      type: "magnifier",
      sourceX: point.x,
      sourceY: point.y,
      sourceRadius: 0,
      lensX: point.x,
      lensY: point.y,
      lensRadius: 0,
      color: ANNOTATION_MAGNIFIER_COLOR,
      lineWidth: ANNOTATION_MAGNIFIER_LINE_WIDTH,
    };
    annotationState.items.push(item);
    annotationState.selectedId = item.id;
    annotationState.selectedIds = [];
    annotationState.interaction = {
      mode: "create-magnifier",
      id: item.id,
      start: point,
      original: { ...item },
    };
    canvas.setPointerCapture?.(event.pointerId);
    $("#annotationStage").focus();
    updateAnnotationControls();
    renderAnnotationCanvas();
    event.preventDefault();
    return;
  }
  const selectedItems = selectedAnnotationItems();
  const multiKey = event.metaKey || event.ctrlKey;
  if (multiKey) {
    const item = existingAtPoint ||
      [...annotationState.items].reverse().find(candidate => pointInAnnotationItem(candidate, point));
    if (item) {
      const ids = new Set(selectedItems.map(candidate => candidate.id));
      const adding = !ids.has(item.id);
      if (adding) ids.add(item.id);
      else ids.delete(item.id);
      annotationState.selectedIds = [...ids];
      annotationState.selectedId = adding ? item.id : (annotationState.selectedIds.at(-1) ?? null);
      const updatedSelection = selectedAnnotationItems();
      annotationState.interaction = adding ? {
        mode: updatedSelection.length > 1 ? "move-group" : "move",
        id: item.id,
        start: point,
        original: { ...item },
        originals: updatedSelection.map(candidate => ({ ...candidate })),
      } : null;
    } else {
      annotationState.interaction = null;
    }
    canvas.setPointerCapture?.(event.pointerId);
    $("#annotationStage").focus();
    updateAnnotationControls();
    renderAnnotationCanvas();
    event.preventDefault();
    return;
  }
  const handleTarget = [...selectedItems]
    .reverse()
    .map(candidate => ({ item: candidate, handle: hitAnnotationHandle(candidate, point) }))
    .find(candidate => candidate.handle);
  if (handleTarget) {
    annotationState.interaction = {
      mode: handleTarget.item.type === "magnifier" ? "resize-magnifier" : "resize",
      id: handleTarget.item.id,
      handle: handleTarget.handle,
      start: point,
      original: { ...handleTarget.item },
    };
  } else {
    const item = existingAtPoint ||
      [...annotationState.items].reverse().find(candidate => pointInAnnotationItem(candidate, point));
    const movingSelection = item && selectedItems.some(candidate => candidate.id === item.id);
    if (!movingSelection) {
      annotationState.selectedId = item?.id ?? null;
      annotationState.selectedIds = [];
    }
    if (item && !movingSelection) {
      const itemIndex = annotationState.items.findIndex(candidate => candidate.id === item.id);
      if (itemIndex >= 0 && itemIndex < annotationState.items.length - 1) {
        annotationState.items.splice(itemIndex, 1);
        annotationState.items.push(item);
      }
    }
    annotationState.interaction = item ? {
      mode: movingSelection && selectedItems.length > 1 ? "move-group" : "move",
      id: item.id,
      part: item.type === "magnifier" ? magnifierPartAtPoint(item, point) : null,
      start: point,
      original: { ...item },
      originals: movingSelection
        ? selectedItems.map(candidate => ({ ...candidate }))
        : null,
    } : null;
  }
  canvas.setPointerCapture?.(event.pointerId);
  $("#annotationStage").focus();
  updateAnnotationControls();
  renderAnnotationCanvas();
  event.preventDefault();
}

function moveAnnotationItem(item, interaction, point) {
  const dx = point.x - interaction.start.x;
  const dy = point.y - interaction.start.y;
  if (item.type === "magnifier") {
    const part = interaction.part || "lens";
    const xKey = part === "source" ? "sourceX" : "lensX";
    const yKey = part === "source" ? "sourceY" : "lensY";
    item[xKey] = interaction.original[xKey] + dx;
    item[yKey] = interaction.original[yKey] + dy;
    clampAnnotationItem(item);
    annotationState.snapGuides = emptySnapGuides();
    return;
  }
  item.x = interaction.original.x + dx;
  item.y = interaction.original.y + dy;
  clampAnnotationItem(item);
  const canvas = annotationCanvas();
  const bounds = annotationItemBounds(item);
  const snapped = snapBoundsToCanvas(bounds, canvas, 10, true);
  const offsetX = snapped.x - bounds.x;
  const offsetY = snapped.y - bounds.y;
  item.x += offsetX;
  item.y += offsetY;
  annotationState.snapGuides = snapped.guides;
}

function translateAnnotationItem(item, original, dx, dy) {
  if (item.type === "magnifier") {
    item.sourceX = original.sourceX + dx;
    item.sourceY = original.sourceY + dy;
    item.lensX = original.lensX + dx;
    item.lensY = original.lensY + dy;
  } else {
    item.x = original.x + dx;
    item.y = original.y + dy;
  }
}

function resizeAnnotationMagnifier(item, interaction, point) {
  const source = interaction.handle === "magnifier-source";
  const xKey = source ? "sourceX" : "lensX";
  const yKey = source ? "sourceY" : "lensY";
  const radiusKey = source ? "sourceRadius" : "lensRadius";
  const canvas = annotationCanvas();
  const minimumRadius = Math.min(20, canvas.width / 4, canvas.height / 4);
  const maximumRadius = Math.max(
    minimumRadius,
    Math.min(
      interaction.original[xKey],
      canvas.width - interaction.original[xKey],
      interaction.original[yKey],
      canvas.height - interaction.original[yKey]
    )
  );
  item[radiusKey] = Math.max(
    minimumRadius,
    Math.min(maximumRadius, Math.hypot(point.x - interaction.original[xKey], point.y - interaction.original[yKey]))
  );
  clampAnnotationItem(item);
  annotationState.snapGuides = emptySnapGuides();
}

function resizeAnnotationMask(item, interaction, point, event) {
  const canvas = annotationCanvas();
  const rect = canvas.getBoundingClientRect();
  const toleranceX = 10 * canvas.width / Math.max(1, rect.width);
  const toleranceY = 10 * canvas.height / Math.max(1, rect.height);
  const xSnap = interaction.handle.includes("w") || interaction.handle.includes("e")
    ? nearestSnap(point.x, [0, canvas.width / 2, canvas.width], toleranceX)
    : null;
  const ySnap = interaction.handle.includes("n") || interaction.handle.includes("s")
    ? nearestSnap(point.y, [0, canvas.height / 2, canvas.height], toleranceY)
    : null;
  point = {
    x: xSnap?.value ?? point.x,
    y: ySnap?.value ?? point.y,
  };
  annotationState.snapGuides = {
    vertical: xSnap ? [xSnap.value] : [],
    horizontal: ySnap ? [ySnap.value] : [],
  };
  const resized = resizeBoundsWithModifiers(interaction.original, interaction.handle, point, {
    minWidth: 40,
    minHeight: 30,
    preserveAspect: event.shiftKey,
    centered: event.altKey || event.ctrlKey,
  });
  Object.assign(item, resized);
  clampAnnotationItem(item);
}

function annotationPointerMove(event) {
  const interaction = annotationState.interaction;
  if (!interaction) {
    if (!annotationState.image) return;
    if (["number", "mask", "blur", "magnifier"].includes(annotationState.mode)) {
      annotationCanvas().style.cursor = "crosshair";
      return;
    }
    const point = annotationPointerPosition(event);
    const selectedItems = selectedAnnotationItems();
    const handle = [...selectedItems]
      .reverse()
      .map(item => hitAnnotationHandle(item, point))
      .find(Boolean);
    annotationCanvas().style.cursor = (handle?.startsWith("magnifier-") ? "nwse-resize" : selectionCursorByHandle[handle]) ||
      (selectedItems.some(item => pointInAnnotationItem(item, point)) ? "move" : "default");
    return;
  }
  const item = annotationState.items.find(candidate => candidate.id === interaction.id);
  if (!item) return;
  let point = annotationPointerPosition(event);
  if (interaction.mode === "create") {
    const canvas = annotationCanvas();
    const rect = canvas.getBoundingClientRect();
    const xSnap = nearestSnap(
      point.x,
      [0, canvas.width / 2, canvas.width],
      10 * canvas.width / Math.max(1, rect.width)
    );
    const ySnap = nearestSnap(
      point.y,
      [0, canvas.height / 2, canvas.height],
      10 * canvas.height / Math.max(1, rect.height)
    );
    point = {
      x: xSnap?.value ?? point.x,
      y: ySnap?.value ?? point.y,
    };
    annotationState.snapGuides = {
      vertical: xSnap ? [xSnap.value] : [],
      horizontal: ySnap ? [ySnap.value] : [],
    };
    const selection = selectionFromPoints(interaction.start, point, event.shiftKey);
    Object.assign(item, selection);
  } else if (interaction.mode === "create-magnifier") {
    const canvas = annotationCanvas();
    const sourceRadius = Math.hypot(point.x - interaction.start.x, point.y - interaction.start.y);
    item.sourceX = interaction.start.x;
    item.sourceY = interaction.start.y;
    item.sourceRadius = sourceRadius;
    item.lensRadius = Math.max(80, sourceRadius * 2);
    const gap = Math.max(28, item.lineWidth * 3);
    const diagonal = (sourceRadius + item.lensRadius + gap) / Math.sqrt(2);
    item.lensX = item.sourceX + diagonal;
    item.lensY = item.sourceY + diagonal;
    clampAnnotationItem(item);
    annotationState.snapGuides = emptySnapGuides();
  } else if (interaction.mode === "move-group") {
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    interaction.originals.forEach(original => {
      const candidate = annotationState.items.find(item => item.id === original.id);
      if (!candidate) return;
      translateAnnotationItem(candidate, original, dx, dy);
    });
    const canvas = annotationCanvas();
    const bounds = annotationSelectionBounds();
    const snapped = snapBoundsToCanvas(bounds, canvas, 10, true);
    const offsetX = snapped.x - bounds.x;
    const offsetY = snapped.y - bounds.y;
    selectedAnnotationItems().forEach(candidate => {
      const translated = { ...candidate };
      translateAnnotationItem(candidate, translated, offsetX, offsetY);
      clampAnnotationItem(candidate);
    });
    annotationState.snapGuides = snapped.guides;
  } else if (interaction.mode === "move") {
    moveAnnotationItem(item, interaction, point);
  } else if (interaction.mode === "resize-magnifier") {
    resizeAnnotationMagnifier(item, interaction, point);
  } else {
    resizeAnnotationMask(item, interaction, point, event);
  }
  renderAnnotationCanvas();
  event.preventDefault();
}

function annotationPointerUp(event) {
  if (!annotationState.interaction) return;
  const interaction = annotationState.interaction;
  const snapped = annotationState.snapGuides.vertical.length || annotationState.snapGuides.horizontal.length;
  annotationState.interaction = null;
  annotationCanvas().releasePointerCapture?.(event.pointerId);
  annotationState.snapGuides = emptySnapGuides();
  if (interaction.mode === "create") {
    const item = annotationState.items.find(candidate => candidate.id === interaction.id);
    if (!item || item.width < 2 || item.height < 2) {
      annotationState.items = annotationState.items.filter(candidate => candidate.id !== interaction.id);
      annotationState.selectedId = null;
      annotationState.selectedIds = [];
      renderAnnotationCanvas();
      updateAnnotationControls();
      annotationStatusText("框选范围太小，未创建标注；当前创建模式保持不变。");
      return;
    }
    clampAnnotationItem(item);
  } else if (interaction.mode === "create-magnifier") {
    const item = annotationState.items.find(candidate => candidate.id === interaction.id);
    if (!item || item.sourceRadius < 8) {
      annotationState.items = annotationState.items.filter(candidate => candidate.id !== interaction.id);
      annotationState.selectedId = null;
      annotationState.selectedIds = [];
      renderAnnotationCanvas();
      updateAnnotationControls();
      annotationStatusText("放大范围太小，未创建放大镜；当前创建模式保持不变。");
      return;
    }
    clampAnnotationItem(item);
  }
  renderAnnotationCanvas();
  pushAnnotationHistory();
  updateAnnotationControls();
  annotationStatusText(`共 ${annotationState.items.length} 个标注 · ${snapped ? "已吸附到图像或画布参考线" : "已保存当前调整"}`);
}

function setAnnotationZoomAtPoint(nextZoom, clientX, clientY) {
  const canvas = annotationCanvas();
  const stage = $("#annotationStage");
  const before = canvas.getBoundingClientRect();
  const relativeX = before.width ? Math.max(0, Math.min(1, (clientX - before.left) / before.width)) : 0.5;
  const relativeY = before.height ? Math.max(0, Math.min(1, (clientY - before.top) / before.height)) : 0.5;
  applyAnnotationZoom(nextZoom);
  const after = canvas.getBoundingClientRect();
  stage.scrollLeft += after.left + relativeX * after.width - clientX;
  stage.scrollTop += after.top + relativeY * after.height - clientY;
  annotationStatusText(`画布缩放 ${Math.round(annotationState.zoom * 100)}% · 共 ${annotationState.items.length} 个标注`);
}

function annotationWheel(event) {
  if (!annotationState.image || !event.ctrlKey) return;
  event.preventDefault();
  const factor = Math.exp(-event.deltaY * 0.01);
  setAnnotationZoomAtPoint(annotationState.zoom * factor, event.clientX, event.clientY);
}

function annotationGestureStart(event) {
  if (!annotationState.image) return;
  event.preventDefault();
  annotationState.gestureStartZoom = annotationState.zoom;
}

function annotationGestureChange(event) {
  if (!annotationState.image) return;
  event.preventDefault();
  setAnnotationZoomAtPoint(
    annotationState.gestureStartZoom * event.scale,
    event.clientX,
    event.clientY
  );
}

function annotationDoubleClick(event) {
  if (!annotationState.image) return;
  const point = annotationPointerPosition(event);
  const item = [...annotationState.items]
    .reverse()
    .find(candidate => candidate.type === "number" && pointInAnnotationItem(candidate, point));
  if (!item) return;
  event.preventDefault();
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  annotationState.editingNumberId = item.id;
  $("#annotationNumberInput").value = String(item.number);
  updateAnnotationControls();
  renderAnnotationCanvas();
  $("#annotationNumberInput").focus();
  $("#annotationNumberInput").select();
}

function closeAnnotationNumberEditor() {
  annotationState.editingNumberId = null;
  updateAnnotationControls();
  $("#annotationStage").focus();
}

function confirmAnnotationNumberEdit() {
  const item = annotationState.items.find(candidate => candidate.id === annotationState.editingNumberId);
  if (!item || item.type !== "number") {
    closeAnnotationNumberEditor();
    return;
  }
  const normalized = $("#annotationNumberInput").value.trim();
  if (!/^\d+$/.test(normalized) || Number(normalized) < 1) {
    annotationStatusText("序号修改失败：请输入大于 0 的整数。");
    $("#annotationNumberInput").focus();
    $("#annotationNumberInput").select();
    return;
  }
  item.number = Number(normalized);
  annotationState.nextNumber = Math.max(annotationState.nextNumber, item.number + 1);
  annotationState.editingNumberId = null;
  finishAnnotationChange(`序号已修改为 ${item.number}`);
  $("#annotationStage").focus();
}

function annotationKeyDown(event) {
  if (event.key.toLowerCase() === "v" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    setAnnotationMode("view");
    return;
  }
  if ((event.key === "Delete" || event.key === "Backspace") && selectedAnnotationItems().length) {
    event.preventDefault();
    deleteSelectedAnnotation();
    return;
  }
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directions[event.key];
  if (!direction) return;
  const selected = selectedAnnotationItems();
  if (!selected.length) return;
  event.preventDefault();
  const step = event.shiftKey ? 10 : 1;
  selected.forEach(item => {
    const original = { ...item };
    translateAnnotationItem(item, original, direction[0] * step, direction[1] * step);
    clampAnnotationItem(item);
  });
  pushAnnotationHistory();
  renderAnnotationCanvas();
  annotationStatusText(`已微调 ${step}px · 共 ${annotationState.items.length} 个标注`);
}

function exportAnnotationImage() {
  if (!annotationState.image) return;
  const previewCanvas = annotationCanvas();
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = previewCanvas.width;
  exportCanvas.height = previewCanvas.height;
  const ctx = exportCanvas.getContext("2d");
  ctx.drawImage(annotationState.image, 0, 0);
  annotationState.items.forEach(item => drawAnnotationItem(ctx, item));
  const normalizedCanvas = canvasScaledToWidth(exportCanvas);
  normalizedCanvas.toBlob(blob => {
    if (!blob) {
      annotationStatusText("导出失败，请重试。");
      return;
    }
    const baseName = annotationState.sourceName.replace(/\.[^.]+$/, "") || "图片";
    downloadBlob(blob, `${baseName}-标注.png`);
    annotationStatusText(`已导出 ${normalizedCanvas.width} × ${normalizedCanvas.height}px · ${baseName}-标注.png`);
  }, "image/png");
}

function normalizeProductNameForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*[-–—]\s*.*$/, "")
    .replace(/\s+/g, "")
    .trim();
}

async function buttonTitleFromKnownDescription(name) {
  const cleanName = String(name || "").trim();
  if (!cleanName || /\s[-–—]\s/.test(cleanName)) return cleanName;
  if (!state.productDescriptions.length) {
    await loadProductDescriptions();
  }
  const needle = normalizeProductNameForMatch(cleanName);
  const item = state.productDescriptions.find(entry => normalizeProductNameForMatch(entry.name) === needle);
  if (!item) return cleanName;
  if (!item.selectedDescription) return cleanName;
  return item.buttonTitle || `${item.name || cleanName} - ${item.selectedDescription}`;
}

async function makeButtonImage(options = {}) {
  const rawName = $("#appName").value.trim() || "软件名称";
  const name = await buttonTitleFromKnownDescription(rawName);
  if (name !== rawName) {
    $("#appName").value = name;
    $("#productInfoResult").textContent = `已套用短描述：${name}`;
  }
  const iconFile = $("#iconFile").files[0];
  if (!iconFile && !state.productInfo?.iconUrl) throw new Error("请先选择软件图标，或先读取商品详情页");
  const platforms = $$(".platform:checked").map(x => x.value);
  const form = new FormData();
  if (options.preferProductIcon && state.productInfo?.iconUrl) {
    form.append("iconUrl", state.productInfo.iconUrl);
  } else if (iconFile) {
    form.append("icon", iconFile);
  } else if (state.productInfo?.iconUrl) {
    form.append("iconUrl", state.productInfo.iconUrl);
  }
  form.append("appName", name);
  form.append("platforms", platforms.join(","));
  const blob = await fetchBlob("/api/render-button", { method: "POST", body: form });
  const url = URL.createObjectURL(blob);
  const img = $("#buttonPreview");
  $("#buttonPreviewBox").classList.add("has-image");
  const filename = `button-go-${name}.png`;
  img.src = url;
  img.title = `点击下载 ${filename}`;
  img.onclick = () => downloadBlob(blob, filename);
  return { blob, url, filename, name };
}

function splitProductQueries(value) {
  return Array.from(new Set(String(value || "")
    .split(/[\n,，、;；]+/)
    .map(item => item.trim())
    .filter(Boolean)));
}

function renderProductMatches() {
  const target = $("#productMatchList");
  target.innerHTML = state.productMatches.map((match, index) => {
    if (match.status === "not_found") {
      return `<div class="product-match-group"><p class="product-match-title"><strong>${escapeHtml(match.query)}</strong>：未匹配到商品</p></div>`;
    }
    const options = (match.candidates || []).map((candidate, candidateIndex) => `
      <label class="product-match-option">
        <input type="radio" name="product-match-${index}" value="${candidateIndex}"${candidateIndex === 0 ? " checked" : ""}>
        <span><strong>${escapeHtml(candidate.displayName)}</strong><br><span class="muted">${escapeHtml(candidate.catalogTitle)}</span></span>
      </label>`).join("");
    return `<div class="product-match-group" data-match-index="${index}">
      <p class="product-match-title"><strong>${escapeHtml(match.query)}</strong> 匹配到 ${(match.candidates || []).length} 个版本，请选择：</p>
      <div class="product-match-options">${options}</div>
      <button type="button" class="generate-selected-product primary">生成所选版本</button>
    </div>`;
  }).join("");
}

function renderButtonResults() {
  const section = $("#buttonResultsSection");
  const target = $("#buttonResultList");
  section.hidden = state.buttonResults.length === 0;
  $("#buttonResultCount").textContent = `${state.buttonResults.length} 项`;
  target.innerHTML = state.buttonResults.map(item => {
    if (item.error) {
      return `<article class="button-result-card" data-result-id="${item.id}">
        <div class="button-result-info button-result-error"><strong>${escapeHtml(item.query)}</strong><span>${escapeHtml(item.error)}</span></div>
        <div></div><div class="button-result-actions"><button type="button" class="remove-button-result">移除</button></div>
      </article>`;
    }
    return `<article class="button-result-card" data-result-id="${item.id}">
      <img src="${escapeAttr(item.previewUrl)}" alt="${escapeAttr(item.title)}">
      <div class="button-result-info">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="muted">${escapeHtml(item.platformText || "未识别平台")}</span>
        <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.url)}</a>
      </div>
      <div class="button-result-actions">
        <button type="button" class="copy-button-result-link">复制链接</button>
        <button type="button" class="download-button-result primary">下载 PNG</button>
        <button type="button" class="remove-button-result">移除</button>
      </div>
    </article>`;
  }).join("");
}

async function generateProductCandidate(candidate, query) {
  try {
    $("#productInfoResult").textContent = `正在生成：${candidate.displayName || candidate.name || query}`;
    const info = await api("/api/product-info", { url: candidate.url });
    applyProductInfo(info);
    $("#productUrl").value = info.siteUrl || info.url || candidate.url;
    const generated = await makeButtonImage({ preferProductIcon: true });
    state.buttonResults.unshift({
      id: ++state.buttonResultId,
      query,
      title: info.buttonTitle || info.appName || candidate.name || query,
      platformText: (info.platforms || []).join(" / "),
      url: info.siteUrl || info.url || candidate.url,
      blob: generated.blob,
      previewUrl: generated.url,
      filename: generated.filename,
    });
    renderButtonResults();
    return true;
  } catch (err) {
    state.buttonResults.unshift({ id: ++state.buttonResultId, query, error: err.message || String(err) });
    renderButtonResults();
    return false;
  }
}

async function searchProductsAndGenerate() {
  const queries = splitProductQueries($("#productKeywords").value);
  if (!queries.length) throw new Error("请先输入软件名或关键词");
  const button = $("#searchProducts");
  button.disabled = true;
  try {
    $("#productInfoResult").textContent = `正在匹配 ${queries.length} 个关键词...`;
    const data = await api("/api/product-search", { queries });
    state.productMatches = (data.results || []).filter(item => item.status !== "matched");
    renderProductMatches();
    let generated = 0;
    for (const match of data.results || []) {
      if (match.status !== "matched" || !match.candidates?.length) continue;
      if (await generateProductCandidate(match.candidates[0], match.query)) generated += 1;
    }
    const ambiguous = state.productMatches.filter(item => item.status === "ambiguous").length;
    const missing = state.productMatches.filter(item => item.status === "not_found").length;
    $("#productInfoResult").textContent = `已生成 ${generated} 项${ambiguous ? `，${ambiguous} 项待选择版本` : ""}${missing ? `，${missing} 项未匹配` : ""}`;
  } finally {
    button.disabled = false;
  }
}

async function generateSelectedProduct(group, button) {
  const index = Number(group.dataset.matchIndex);
  const match = state.productMatches[index];
  const selected = $("input[type=radio]:checked", group);
  const candidate = match?.candidates?.[Number(selected?.value)];
  if (!candidate) throw new Error("请选择要生成的商品版本");
  button.disabled = true;
  try {
    const ok = await generateProductCandidate(candidate, match.query);
    if (ok) {
      state.productMatches.splice(index, 1);
      renderProductMatches();
      $("#productInfoResult").textContent = `已生成：${candidate.displayName}`;
    }
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}

async function fetchProductInfo() {
  const rawUrl = $("#productUrl").value.trim();
  if (!rawUrl) throw new Error("请先输入商品详情页 URL");
  const url = withProductCid(rawUrl);
  $("#productUrl").value = url;
  $("#productInfoResult").textContent = "正在读取商品信息...";
  const info = await api("/api/product-info", { url });
  $("#productUrl").value = info.siteUrl || info.url || url;
  applyProductInfo(info);
  const buttonTitle = info.buttonTitle || info.appName || "软件名称";
  $("#productInfoResult").textContent = `已读取：${buttonTitle} · ${(info.platforms || []).join(" / ") || "未识别平台"}`;
  $("#productInfoResult").textContent = `已读取：${buttonTitle}，正在生成按钮...`;
  await makeButtonImage({ preferProductIcon: true });
  $("#productInfoResult").textContent = `已生成：${buttonTitle} · ${(info.platforms || []).join(" / ") || "未识别平台"}`;
  loadProductDescriptions().catch(err => console.warn(err));
}

function applyProductInfo(info) {
  state.productInfo = info || null;
  if (!info) return;
  $("#appName").value = info.buttonTitle || info.appName || "";
  $$(".platform").forEach(input => {
    input.checked = (info.platforms || []).includes(input.value);
  });
}

async function loadProductDescriptions() {
  const data = await api("/api/product-descriptions");
  state.productDescriptions = data.items || [];
  renderProductDescriptions();
}

function productDescriptionMode(item) {
  return ["auto", "manual", "empty"].includes(item.mode) ? item.mode : "auto";
}

function selectedDescriptionFromCard(card) {
  const mode = $(`input[name="mode-${CSS.escape(card.dataset.key)}"]:checked`, card)?.value || "auto";
  const autoDescription = card.dataset.autoDescription || "";
  const manualDescription = $(".product-description-manual", card)?.value.trim() || "";
  if (mode === "auto") return autoDescription;
  if (mode === "manual") return manualDescription;
  return "";
}

function buttonTitleFromCard(card) {
  const name = card.dataset.name || "软件名称";
  const description = selectedDescriptionFromCard(card);
  return description ? `${name} - ${description}` : name;
}

function draftFromProductDescriptionCard(card) {
  const key = card.dataset.key;
  return {
    key,
    mode: $(`input[name="mode-${CSS.escape(key)}"]:checked`, card)?.value || "auto",
    manualDescription: $(".product-description-manual", card)?.value || "",
  };
}

function applyProductDescriptionDraft(card, draft) {
  if (!card || !draft) return;
  const modeInput = $(`input[name="mode-${CSS.escape(card.dataset.key)}"][value="${draft.mode}"]`, card);
  if (modeInput) modeInput.checked = true;
  const manualInput = $(".product-description-manual", card);
  if (manualInput) manualInput.value = draft.manualDescription || "";
  updateProductDescriptionTitle(card);
}

function updateProductDescriptionTitle(card) {
  const target = $(".product-description-foot strong", card);
  if (target) target.textContent = buttonTitleFromCard(card);
}

function renderProductDescriptions() {
  const list = $("#productDescriptionList");
  const query = ($("#productDescriptionSearch")?.value || "").trim().toLowerCase();
  const pendingOnly = Boolean($("#pendingDescriptionsOnly")?.checked);
  const usedOnly = Boolean($("#usedDescriptionsOnly")?.checked);
  const items = state.productDescriptions.filter(item => {
    if (pendingOnly && item.status !== "pending") return false;
    if (usedOnly && !item.generatedButtonCount) return false;
    if (!query) return true;
    return [
      item.name,
      item.productUrl,
      item.subtitle,
      item.autoDescription,
      item.manualDescription,
      item.suggestedDescription,
      item.selectedDescription,
    ].some(value => String(value || "").toLowerCase().includes(query));
  });
  const pendingItems = items.filter(item => item.status !== "confirmed" && item.status !== "skipped");
  const confirmedItems = items.filter(item => item.status === "confirmed");
  const skippedItems = items.filter(item => item.status === "skipped");
  $("#productDescriptionCount").textContent = `(${items.length}/${state.productDescriptions.length} 款)`;
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">没有匹配的商品短描述记录。</div>';
    return;
  }
  const renderGroup = (title, groupItems) => groupItems.length
    ? `<section class="product-description-group">
        <h3>${title} <span class="muted">(${groupItems.length} 款)</span></h3>
        ${groupItems.map(renderProductDescriptionCard).join("")}
      </section>`
    : "";
  list.innerHTML = [
    renderGroup("待确认", pendingItems),
    renderGroup("已确认", confirmedItems),
    renderGroup("不处理", skippedItems),
  ].filter(Boolean).join("");
}

function renderProductDescriptionCard(item) {
    const mode = productDescriptionMode(item);
    const manualValue = item.manualDescription || item.suggestedDescription || "";
    const effectiveMode = mode === "auto" && !item.autoDescription && manualValue ? "manual" : mode;
    const key = escapeAttr(item.key);
    const radioName = `mode-${key}`;
    const statusMap = { pending: "待确认", confirmed: "已确认", skipped: "不处理" };
    const statusKey = statusMap[item.status] ? item.status : "pending";
    const status = statusMap[statusKey];
    const selectedDescription = effectiveMode === "manual"
      ? manualValue
      : (effectiveMode === "auto" ? item.autoDescription || "" : "");
    const currentTitle = selectedDescription ? `${item.name || "软件名称"} - ${selectedDescription}` : (item.name || "");
    const previewUrl = state.productPreviewUrls.get(item.key) || "";
    const usageText = item.generatedButtonCount
      ? `已生成过 ${item.generatedButtonCount} 次${item.generatedButtonPackages?.length ? ` · ${item.generatedButtonPackages[0]}` : ""}`
      : "未在发布包中发现按钮记录";
    return `<article class="product-description-card" data-key="${key}" data-name="${escapeAttr(item.name || "软件名称")}" data-product-url="${escapeAttr(item.productUrl || "")}" data-auto-description="${escapeAttr(item.autoDescription || "")}" data-icon-url="${escapeAttr(item.iconUrl || "")}" data-platforms="${escapeAttr((item.platforms || []).join(","))}" data-subtitle="${escapeAttr(item.subtitle || "")}">
      <div class="product-description-preview ${previewUrl ? "has-image" : ""}">
        <span>按钮预览</span>
        <img alt="${escapeAttr(item.name || "商品")} 按钮预览" ${previewUrl ? `src="${escapeAttr(previewUrl)}"` : ""}>
      </div>
      <div class="product-description-main">
        <div class="product-description-head">
          <div>
            <h3>${escapeHtml(item.name || "未命名商品")} <span class="status-pill ${statusKey}">${status}</span></h3>
            <a href="${escapeAttr(item.productUrl || "#")}" target="_blank" rel="noopener">${escapeHtml(item.productUrl || "缺少商品链接")}</a>
          </div>
          <div class="product-description-actions">
            <button type="button" class="skip-product-description">不处理</button>
            <button type="button" class="preview-product-description">预览</button>
            <button type="button" class="save-product-description primary">保存</button>
          </div>
        </div>
        <div class="product-description-meta">原始副标题：${escapeHtml(item.subtitle || "无")}</div>
        <div class="product-description-meta">使用记录：${escapeHtml(usageText)}</div>
        <div class="product-description-options">
          <label><input type="radio" name="${radioName}" value="auto" ${effectiveMode === "auto" ? "checked" : ""}> 自动：${escapeHtml(item.autoDescription || "留空")}</label>
          <label><input type="radio" name="${radioName}" value="manual" ${effectiveMode === "manual" ? "checked" : ""}> 手动</label>
          <label><input type="radio" name="${radioName}" value="empty" ${effectiveMode === "empty" ? "checked" : ""}> 留空</label>
        </div>
        <input class="product-description-manual" value="${escapeAttr(manualValue)}" placeholder="手动短描述，例如 菜单栏整理工具">
        <div class="product-description-foot">当前标题：<strong>${escapeHtml(currentTitle || item.buttonTitle || item.name || "")}</strong></div>
      </div>
    </article>`;
}

async function saveProductDescription(card) {
  const key = card.dataset.key;
  const mode = $(`input[name="mode-${CSS.escape(key)}"]:checked`, card)?.value || "auto";
  const payload = {
    key,
    productUrl: card.dataset.productUrl || "",
    name: card.dataset.name || "",
    subtitle: card.dataset.subtitle || "",
    autoDescription: card.dataset.autoDescription || "",
    manualDescription: $(".product-description-manual", card)?.value.trim() || "",
    mode,
    iconUrl: card.dataset.iconUrl || "",
    platforms: (card.dataset.platforms || "").split(",").filter(Boolean),
  };
  const item = await api("/api/product-description-save", payload);
  const idx = state.productDescriptions.findIndex(entry => entry.key === key);
  if (idx >= 0) state.productDescriptions[idx] = item;
  renderProductDescriptions();
  state.productPreviewUrls.delete(key);
  const savedCard = $(`.product-description-card[data-key="${CSS.escape(key)}"]`);
  if (savedCard) {
    $("#productDescriptionResult").textContent = `已保存，正在生成最终预览：${item.buttonTitle || item.name}`;
    await previewProductDescription(savedCard, { useCurrentDraft: false, afterSave: true });
  } else {
    $("#productDescriptionResult").textContent = `已保存：${item.buttonTitle || item.name}`;
  }
}

async function skipProductDescription(card) {
  const key = card.dataset.key;
  const payload = {
    ...draftFromProductDescriptionCard(card),
    productUrl: card.dataset.productUrl || "",
    name: card.dataset.name || "",
    subtitle: card.dataset.subtitle || "",
    autoDescription: card.dataset.autoDescription || "",
    iconUrl: card.dataset.iconUrl || "",
    platforms: (card.dataset.platforms || "").split(",").filter(Boolean),
  };
  const item = await api("/api/product-description-skip", payload);
  const idx = state.productDescriptions.findIndex(entry => entry.key === key);
  if (idx >= 0) state.productDescriptions[idx] = item;
  state.productPreviewUrls.delete(key);
  renderProductDescriptions();
  $("#productDescriptionResult").textContent = `已移入不处理：${item.name || item.productUrl || key}`;
}

async function previewProductDescription(card, options = {}) {
  const useCurrentDraft = options.useCurrentDraft !== false;
  const draft = useCurrentDraft ? draftFromProductDescriptionCard(card) : null;
  let iconUrl = card.dataset.iconUrl || "";
  if (card.dataset.productUrl) {
    $("#productDescriptionResult").textContent = `正在刷新：${card.dataset.name || card.dataset.productUrl || "商品"}...`;
    const data = await api("/api/product-description-add", { url: card.dataset.productUrl || "" });
    const item = data.item || {};
    const idx = state.productDescriptions.findIndex(entry => entry.key === item.key);
    if (idx >= 0) state.productDescriptions[idx] = item;
    renderProductDescriptions();
    card = $(`.product-description-card[data-key="${CSS.escape(item.key || "")}"]`) || card;
    if (draft) applyProductDescriptionDraft(card, draft);
    iconUrl = card.dataset.iconUrl || "";
  }
  if (!iconUrl) throw new Error("这条记录缺少图标 URL，请确认商品链接仍然可访问");
  const platforms = (card.dataset.platforms || "").split(",").filter(Boolean);
  const title = buttonTitleFromCard(card);
  const form = new FormData();
  form.append("iconUrl", iconUrl);
  form.append("appName", title);
  form.append("platforms", platforms.join(","));
  const blob = await fetchBlob("/api/render-button", { method: "POST", body: form });
  const img = $(".product-description-preview img", card);
  $(".product-description-preview", card).classList.add("has-image");
  const url = URL.createObjectURL(blob);
  state.productPreviewUrls.set(card.dataset.key, url);
  img.src = url;
  img.title = title;
  updateProductDescriptionTitle(card);
  $("#productDescriptionResult").textContent = options.afterSave ? `已保存并更新最终预览：${title}` : `已预览：${title}`;
}

async function addProductDescriptionFromUrl() {
  const input = $("#productDescriptionUrl");
  const url = withProductCid(input.value.trim());
  if (!url) throw new Error("请输入商品详情页 URL");
  $("#productDescriptionResult").textContent = "正在读取商品信息...";
  const data = await api("/api/product-description-add", { url });
  input.value = "";
  await loadProductDescriptions();
  $("#productDescriptionResult").textContent = `已添加：${data.item?.buttonTitle || data.item?.name || url}`;
}

async function scanProductDescriptions() {
  $("#productDescriptionResult").textContent = "正在检查新上架商品...";
  const data = await api("/api/product-description-scan", { limit: 30 });
  state.productDescriptions = data.items || [];
  renderProductDescriptions();
  const errorText = data.errors?.length ? `，失败 ${data.errors.length} 个` : "";
  $("#productDescriptionResult").textContent = `发现链接 ${data.found || 0} 个，新增 ${data.added?.length || 0} 款${errorText}`;
}

async function previewTopProductDescriptions() {
  const cards = $$(".product-description-group:first-of-type .product-description-card")
    .filter(card => !state.productPreviewUrls.has(card.dataset.key))
    .slice(0, 10);
  if (!cards.length) {
    $("#productDescriptionResult").textContent = "当前待确认列表没有需要生成预览的商品。";
    return;
  }
  let done = 0;
  let failed = 0;
  let attempted = 0;
  for (const card of cards) {
    attempted += 1;
    $("#productDescriptionResult").textContent = `正在批量预览 ${attempted}/${cards.length}：${card.dataset.name || card.dataset.key}`;
    try {
      await previewProductDescription(card);
      done += 1;
    } catch (err) {
      failed += 1;
      console.warn("preview product description failed", card.dataset.productUrl || card.dataset.key, err);
      $("#productDescriptionResult").textContent = `已跳过：${card.dataset.name || card.dataset.key}（${err.message || err}）`;
    }
  }
  $("#productDescriptionResult").textContent = `已生成 ${done} 款预览${failed ? `，跳过 ${failed} 款` : ""}。`;
}

async function scanProductQr() {
  const file = $("#productQrFile").files[0];
  if (!file) throw new Error("请先选择包含二维码的商品卡片图");
  if (!("BarcodeDetector" in window)) {
    throw new Error("当前浏览器不支持二维码识别，请直接粘贴商品详情页 URL");
  }
  $("#productInfoResult").textContent = "正在识别二维码...";
  const bitmap = await createImageBitmap(file);
  const detector = new BarcodeDetector({ formats: ["qr_code"] });
  const codes = await detector.detect(bitmap);
  const value = codes[0]?.rawValue || "";
  if (!value) throw new Error("没有识别到二维码，请换一张更清晰的商品卡片图");
  $("#productUrl").value = value;
  $("#productInfoResult").textContent = "二维码已识别，正在读取商品信息...";
  await fetchProductInfo();
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.click();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function escapeAttr(text) {
  return escapeHtml(text || "");
}

const distributionStatusLabels = {
  pending: "未同步",
  synced: "已同步",
  skipped: "不同步",
};
let distributionScrollAnchors = [];
let distributionAnchorFrame = 0;
let distributionScrollFrame = 0;
let distributionSyncedElement = null;
let distributionSyncedUntil = 0;

function distributionAnchorKey(element) {
  const imageAlt = element.querySelector("img")?.alt || "";
  let text = `${element.textContent || ""} ${imageAlt}`.normalize("NFKC");
  if (
    /搜索「数码荔枝」或访问网站\s+lizhi\.shop/i.test(text)
    || /请在「数码荔枝」搜索软件名/.test(text)
    || /(?:本文|原文).*(?:首发|原发|发布|刊载|原载)于.*(?:微信公众号|微信公众平台|数码荔枝)/i.test(text)
  ) {
    return "";
  }
  text = text
    .replace(/(?:数码荔枝|荔枝)(?:正版)?(?:软件)?(?:商店|商城)/gi, "数码荔枝")
    .replace(/https?:\/\//gi, "")
    .replace(/[\s，。；：、,.!?！？"'“”‘’（）()[\]【】<>《》—_\-]+/g, "")
    .toLowerCase();
  if (!text) return "";
  const kind = /^H[1-6]$/.test(element.tagName)
    ? "heading"
    : element.tagName === "FIGURE"
      ? "figure"
      : element.tagName === "LI"
        ? "item"
        : "paragraph";
  return `${kind}:${text.slice(0, 240)}`;
}

function distributionAnchorElements(preview) {
  return $$("h1,h2,h3,h4,h5,h6,p,li,figure", preview).filter(element => {
    const parentBlock = element.parentElement?.closest("p,li,figure");
    return !parentBlock || !preview.contains(parentBlock);
  });
}

function distributionElementMetrics(element, scroller) {
  const scrollerRect = scroller.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const offset = scroller.scrollTop - scrollerRect.top;
  const lineRects = [];
  const range = document.createRange();
  range.selectNodeContents(element);
  Array.from(range.getClientRects()).forEach(lineRect => {
    if (!lineRect.width && !lineRect.height) return;
    const last = lineRects.at(-1);
    if (last && Math.abs(last.top - lineRect.top) < 2) {
      last.bottom = Math.max(last.bottom, lineRect.bottom);
    } else {
      lineRects.push({ top: lineRect.top, bottom: lineRect.bottom });
    }
  });
  return {
    top: rect.top + offset,
    bottom: rect.bottom + offset,
    lines: lineRects.map(line => ((line.top + line.bottom) / 2) + offset),
  };
}

function distributionElementBounds(element, scroller) {
  const scrollerRect = scroller.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const offset = scroller.scrollTop - scrollerRect.top;
  return {
    top: rect.top + offset,
    bottom: rect.bottom + offset,
  };
}

function addDistributionMetricPairs(points, originalMetric, optimizedMetric) {
  points.push({ original: originalMetric.top, optimized: optimizedMetric.top });
  if (originalMetric.lines.length && optimizedMetric.lines.length) {
    originalMetric.lines.forEach((position, index) => {
      const denominator = Math.max(1, originalMetric.lines.length - 1);
      const targetIndex = Math.round((index / denominator) * Math.max(0, optimizedMetric.lines.length - 1));
      points.push({ original: position, optimized: optimizedMetric.lines[targetIndex] });
    });
  }
  points.push({ original: originalMetric.bottom, optimized: optimizedMetric.bottom });
}

function rebuildDistributionScrollAnchors() {
  distributionAnchorFrame = 0;
  const grid = $(".distribution-grid");
  const originalScroller = $(".distribution-original");
  const optimizedScroller = $(".distribution-optimized");
  const originalPreview = $("#distributionOriginalPreview");
  const optimizedPreview = $("#distributionOptimizedPreview");
  if (!grid || getComputedStyle(grid).display !== "grid" || !originalPreview || !optimizedPreview) {
    distributionScrollAnchors = [];
    return;
  }

  const optimizedByKey = new Map();
  distributionAnchorElements(optimizedPreview).forEach(element => {
    const key = distributionAnchorKey(element);
    if (!key) return;
    if (!optimizedByKey.has(key)) optimizedByKey.set(key, []);
    optimizedByKey.get(key).push(element);
  });

  const pairs = [];
  distributionAnchorElements(originalPreview).forEach(originalElement => {
    const key = distributionAnchorKey(originalElement);
    const matches = key ? optimizedByKey.get(key) : null;
    const optimizedElement = matches?.shift();
    if (optimizedElement) pairs.push([originalElement, optimizedElement]);
  });

  const originalBounds = distributionElementBounds(originalPreview, originalScroller);
  const optimizedBounds = distributionElementBounds(optimizedPreview, optimizedScroller);
  const points = [{
    original: originalBounds.top,
    optimized: optimizedBounds.top,
  }];
  pairs.forEach(([originalElement, optimizedElement]) => {
    addDistributionMetricPairs(
      points,
      distributionElementMetrics(originalElement, originalScroller),
      distributionElementMetrics(optimizedElement, optimizedScroller),
    );
  });
  points.push({
    original: originalBounds.bottom,
    optimized: optimizedBounds.bottom,
  });

  points.sort((a, b) => a.original - b.original || a.optimized - b.optimized);
  let lastOptimized = -Infinity;
  distributionScrollAnchors = points.filter(point => {
    if (point.optimized + 1 < lastOptimized) return false;
    lastOptimized = Math.max(lastOptimized, point.optimized);
    return true;
  });
}

function scheduleDistributionScrollAnchors() {
  if (distributionAnchorFrame) cancelAnimationFrame(distributionAnchorFrame);
  distributionAnchorFrame = requestAnimationFrame(() => {
    rebuildDistributionScrollAnchors();
    $$("#distributionOriginalPreview img, #distributionOptimizedPreview img").forEach(image => {
      if (!image.complete) image.addEventListener("load", scheduleDistributionScrollAnchors, { once: true });
    });
  });
}

function mapDistributionAnchorPosition(position, from, to) {
  const points = distributionScrollAnchors
    .map(point => ({ from: point[from], to: point[to] }))
    .sort((a, b) => a.from - b.from);
  if (!points.length) return null;
  if (position <= points[0].from) return points[0].to + position - points[0].from;
  for (let index = 1; index < points.length; index += 1) {
    const before = points[index - 1];
    const after = points[index];
    if (position > after.from) continue;
    if (after.from === before.from) return after.to;
    const localOffset = (position - before.from) / (after.from - before.from);
    return before.to + localOffset * (after.to - before.to);
  }
  const last = points.at(-1);
  return last.to + position - last.from;
}

function syncDistributionScroll(source, target, from, to) {
  if (source === distributionSyncedElement && performance.now() < distributionSyncedUntil) return;
  if (distributionScrollFrame) cancelAnimationFrame(distributionScrollFrame);
  distributionScrollFrame = requestAnimationFrame(() => {
    distributionScrollFrame = 0;
    if (!distributionScrollAnchors.length) rebuildDistributionScrollAnchors();
    const focusRatio = 0.35;
    const sourceFocus = source.scrollTop + source.clientHeight * focusRatio;
    const targetFocus = mapDistributionAnchorPosition(sourceFocus, from, to);
    if (targetFocus == null) return;
    const maximum = Math.max(0, target.scrollHeight - target.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maximum, targetFocus - target.clientHeight * focusRatio));
    distributionSyncedElement = target;
    distributionSyncedUntil = performance.now() + 120;
    target.scrollTop = nextScrollTop;
  });
}

function bindDistributionScrollSync() {
  const original = $(".distribution-original");
  const optimized = $(".distribution-optimized");
  original.addEventListener("scroll", () => {
    syncDistributionScroll(original, optimized, "original", "optimized");
  }, { passive: true });
  optimized.addEventListener("scroll", () => {
    syncDistributionScroll(optimized, original, "optimized", "original");
  }, { passive: true });
  window.addEventListener("resize", scheduleDistributionScrollAnchors);
}

function distributionTaskById(id) {
  return state.distribution.tasks.find(task => task.id === id) || null;
}

async function loadDistributionTasks({ keepSelection = true } = {}) {
  state.distribution.loading = true;
  try {
    const data = await api("/api/distribution/tasks");
    state.distribution.tasks = data.tasks || [];
    state.distribution.counts = data.counts || { pending: 0, synced: 0, skipped: 0 };
    state.distribution.loaded = true;
    $("#distributionTaskCount").textContent = `(${state.distribution.tasks.length} 篇)`;
    $("#distributionPendingCount").textContent = state.distribution.counts.pending || 0;
    $("#distributionSyncedCount").textContent = state.distribution.counts.synced || 0;
    $("#distributionSkippedCount").textContent = state.distribution.counts.skipped || 0;
    renderDistributionTasks();

    const visible = filteredDistributionTasks();
    const selectedIsVisible = keepSelection && visible.some(task => task.id === state.distribution.selectedId);
    if (!selectedIsVisible && visible.length) {
      await selectDistributionTask(visible[0].id);
    } else if (selectedIsVisible) {
      renderDistributionTasks();
    }
  } finally {
    state.distribution.loading = false;
  }
}

function filteredDistributionTasks() {
  const query = ($("#distributionSearch")?.value || "").trim().toLowerCase();
  return state.distribution.tasks.filter(task => {
    if (task.status !== state.distribution.filter) return false;
    return !query || task.title.toLowerCase().includes(query);
  });
}

function renderDistributionTasks() {
  const list = $("#distributionTaskList");
  if (!list) return;
  const tasks = filteredDistributionTasks();
  if (!tasks.length) {
    list.innerHTML = '<div class="distribution-empty">当前状态下没有匹配的文章。</div>';
    return;
  }
  list.innerHTML = tasks.map(task => `
    <button type="button" class="distribution-task ${task.id === state.distribution.selectedId ? "active" : ""}" data-distribution-id="${escapeAttr(task.id)}">
      <span class="distribution-task-title">${escapeHtml(task.title)}</span>
      <span class="distribution-task-meta">
        <span>${task.versionCount ? `已有 ${task.versionCount} 个版本` : "未生成优化版"}</span>
        <span>${escapeHtml(task.date || "")}</span>
      </span>
    </button>
  `).join("");
}

async function selectDistributionTask(id) {
  if (!id) return;
  state.distribution.selectedId = id;
  renderDistributionTasks();
  $("#distributionOptimizeStatus").textContent = "";
  $(".distribution-original").scrollTop = 0;
  $(".distribution-optimized").scrollTop = 0;
  $("#distributionOriginalPreview").innerHTML = '<div class="distribution-empty">正在读取文章...</div>';
  $("#distributionOptimizedPreview").innerHTML = '<div class="distribution-empty">正在读取优化版本...</div>';
  const detail = await api(`/api/distribution/article?id=${encodeURIComponent(id)}`);
  if (state.distribution.selectedId !== id) return;
  state.distribution.detail = detail;
  state.distribution.selectedVersion = Number(detail.selectedVersion || detail.versions?.at(-1)?.number || 0);
  renderDistributionDetail();
}

function selectedDistributionVersion() {
  const detail = state.distribution.detail;
  if (!detail) return null;
  return detail.versions.find(version => Number(version.number) === Number(state.distribution.selectedVersion)) || null;
}

function renderDistributionDetail() {
  const detail = state.distribution.detail;
  const hasDetail = Boolean(detail);
  $("#optimizeDistribution").disabled = !hasDetail;
  $("#distributionStatus").disabled = !hasDetail;
  if (!detail) return;

  const officialDate = String(detail.date || "").replace(/\D/g, "").slice(0, 8);
  $("#distributionOriginalMeta").textContent = `官网发布日期：${officialDate || "未知"}`;
  $("#distributionOriginalPreview").innerHTML = detail.originalHtml || '<div class="distribution-empty">没有可预览的正文。</div>';
  $("#distributionStatus").value = detail.status;
  $("#distributionCover").innerHTML = detail.coverUrl
    ? `<img src="${escapeAttr(detail.coverUrl)}" alt="${escapeAttr(detail.title)}封面">`
    : "<span>暂无封面图</span>";
  $("#distributionFacts").innerHTML = `
    <span class="distribution-fact">${detail.imageCount || 0} 张图</span>
    <span class="distribution-fact">${detail.purchaseButtons?.length || 0} 个购买按钮</span>
    <span class="distribution-fact">${detail.versions?.length || 0} 个优化版本</span>
  `;
  renderDistributionVersions();
  scheduleDistributionScrollAnchors();
}

function renderDistributionVersions() {
  const detail = state.distribution.detail;
  const versions = detail?.versions || [];
  const tabs = $("#distributionVersionTabs");
  const preview = $("#distributionOptimizedPreview");
  tabs.innerHTML = Array.from({ length: MAX_DISTRIBUTION_VERSIONS }, (_, index) => {
    const number = index + 1;
    const version = versions.find(item => Number(item.number) === number);
    const selected = version && number === Number(state.distribution.selectedVersion);
    return `<button type="button" class="${selected ? "active" : ""}" ${version ? `data-distribution-version="${number}"` : "disabled"}>版本 ${number}</button>`;
  }).join("");
  if (!versions.length) {
    preview.innerHTML = '<div class="distribution-empty">尚未生成优化版本。点击原文区域的「AI 优化」开始。</div>';
    $("#distributionSummary").textContent = "生成优化版本后显示摘要。";
    $("#distributionSummaryCount").textContent = "0 / 30 字";
    $("#exportDistribution").disabled = true;
    scheduleDistributionScrollAnchors();
    return;
  }
  if (!versions.some(version => Number(version.number) === Number(state.distribution.selectedVersion))) {
    state.distribution.selectedVersion = Number(versions.at(-1).number);
  }
  tabs.querySelector(`[data-distribution-version="${state.distribution.selectedVersion}"]`)?.classList.add("active");
  const version = selectedDistributionVersion();
  preview.innerHTML = version?.html || '<div class="distribution-empty">该版本没有正文。</div>';
  const summary = version?.summary || detail.summary || "";
  $("#distributionSummary").textContent = summary || "该版本没有生成摘要。";
  $("#distributionSummaryCount").textContent = `${Array.from(summary).length} / 30 字`;
  $("#exportDistribution").disabled = !version;
  $("#distributionExportDescription").textContent = `${detail.title} · 优化版本 ${state.distribution.selectedVersion}`;
  scheduleDistributionScrollAnchors();
}

async function chooseDistributionVersion(number) {
  const detail = state.distribution.detail;
  if (!detail) return;
  number = Number(number);
  state.distribution.selectedVersion = number;
  renderDistributionVersions();
  try {
    await api("/api/distribution/select-version", { id: detail.id, version: number });
    detail.selectedVersion = number;
    const task = distributionTaskById(detail.id);
    if (task) task.selectedVersion = number;
  } catch (err) {
    $("#distributionOptimizeStatus").textContent = err.message;
  }
}

function openDistributionVersionLimitDialog() {
  const detail = state.distribution.detail;
  if (!detail) return;
  $("#distributionDeleteVersionOptions").innerHTML = detail.versions
    .slice()
    .sort((a, b) => Number(a.number) - Number(b.number))
    .map(version => `
      <label>
        <input type="checkbox" value="${version.number}">
        <span>版本 ${version.number}</span>
      </label>
    `).join("");
  $("#confirmDistributionVersionDelete").disabled = true;
  const dialog = $("#distributionVersionLimitDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

async function deleteDistributionVersionsAndRegenerate() {
  const detail = state.distribution.detail;
  if (!detail) return;
  const versions = $$("#distributionDeleteVersionOptions input:checked").map(input => Number(input.value));
  if (!versions.length) return;
  const button = $("#confirmDistributionVersionDelete");
  button.disabled = true;
  button.textContent = "正在删除...";
  try {
    await api("/api/distribution/delete-versions", { id: detail.id, versions });
    $("#distributionVersionLimitDialog").close?.();
    await selectDistributionTask(detail.id);
    await optimizeDistributionArticle({ skipVersionLimit: true });
  } finally {
    button.textContent = "删除并重新生成";
  }
}

async function optimizeDistributionArticle({ skipVersionLimit = false } = {}) {
  const detail = state.distribution.detail;
  if (!detail) throw new Error("请先选择一篇文章");
  if (!skipVersionLimit && detail.versions.length >= MAX_DISTRIBUTION_VERSIONS) {
    openDistributionVersionLimitDialog();
    return;
  }
  const optimizeButton = $("#optimizeDistribution");
  optimizeButton.disabled = true;
  optimizeButton.textContent = "AI 优化中...";
  $("#distributionOptimizeStatus").textContent = "正在进行局部规范调整并生成 30 字内摘要，请稍候...";
  try {
    const result = await api("/api/distribution/optimize", { id: detail.id });
    $("#distributionOptimizeStatus").textContent = result.warnings?.length
      ? `已生成版本 ${result.version}。AI 草稿改动过大，已自动改用保守规则版本：${result.warnings.join("；")}`
      : `已生成版本 ${result.version}，原文结构与图片顺序校验通过。`;
    await selectDistributionTask(detail.id);
    await loadDistributionTasks({ keepSelection: true });
  } finally {
    optimizeButton.textContent = "AI 优化";
    optimizeButton.disabled = false;
  }
}

async function updateDistributionStatus() {
  const detail = state.distribution.detail;
  if (!detail) return;
  const status = $("#distributionStatus").value;
  $("#distributionStatus").disabled = true;
  $("#distributionInfoStatus").textContent = "正在保存状态...";
  try {
    await api("/api/distribution/status", { id: detail.id, status });
    detail.status = status;
    const task = distributionTaskById(detail.id);
    if (task) task.status = status;
    $("#distributionInfoStatus").textContent = `已手动标记为「${distributionStatusLabels[status]}」。`;
    await loadDistributionTasks({ keepSelection: true });
  } finally {
    $("#distributionStatus").disabled = false;
  }
}

function openDistributionExportDialog() {
  if (!selectedDistributionVersion()) return;
  const dialog = $("#distributionExportDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

async function exportDistributionVersion(type) {
  const detail = state.distribution.detail;
  const version = selectedDistributionVersion();
  if (!detail || !version) throw new Error("请先选择一个优化版本");
  const dialog = $("#distributionExportDialog");
  dialog.close?.();
  $("#distributionOptimizeStatus").textContent = type === "docx" ? "正在生成带图片的 Word 文档..." : "正在导出 Markdown...";
  const blob = await fetchBlob("/api/distribution/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: detail.id, version: version.number, type }),
  });
  const safeTitle = detail.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").slice(0, 120);
  const extension = type === "docx" ? "docx" : "md";
  downloadBlob(blob, `${safeTitle}-分发版-v${version.number}.${extension}`);
  $("#distributionOptimizeStatus").textContent = type === "docx"
    ? `已导出版本 ${version.number}：Word 正文包含对应图片，不包含封面和摘要。`
    : `已导出版本 ${version.number}：Markdown 保留【图 X】占位符，并已写入该文章发布包的「CSDN 发布版.md」。`;
}

function activeImageModuleId() {
  return ["bg", "annotation", "imageEditor"].find(id => $(`#${id}`)?.classList.contains("active")) || null;
}

function imageModuleToolVisuals(moduleId = activeImageModuleId()) {
  const toolbar = moduleId === "bg"
    ? $(".bg-mode-toolbar")
    : moduleId === "annotation"
      ? $(".annotation-actions")
      : moduleId === "imageEditor"
        ? $(".image-editor-actions")
        : null;
  if (!toolbar) return [];
  return Array.from(toolbar.children)
    .map(element => {
      if (element.matches("button")) return element;
      if (element.matches("label")) return element.querySelector(":scope > span");
      if (element.matches(".image-editor-more")) return element.querySelector(":scope > button");
      return null;
    })
    .filter(element => element && !element.hidden && getComputedStyle(element).display !== "none");
}

function showImageModuleShortcutHints(show) {
  $$(".tool-shortcut-hint").forEach(element => {
    element.classList.remove("tool-shortcut-hint");
    delete element.dataset.shortcutNumber;
  });
  if (!show) return;
  imageModuleToolVisuals().slice(0, 10).forEach((element, index) => {
    element.classList.add("tool-shortcut-hint");
    element.dataset.shortcutNumber = String(index + 1);
  });
}

function runActiveImageModuleHistory(redo) {
  const moduleId = activeImageModuleId();
  if (moduleId === "bg") restoreBgHistory(bgHistoryIndex + (redo ? 1 : -1));
  else if (moduleId === "annotation") {
    restoreAnnotationHistory(annotationState.historyIndex + (redo ? 1 : -1));
  } else if (moduleId === "imageEditor") {
    restoreImageEditorHistory(imageEditorState.historyIndex + (redo ? 1 : -1));
  }
}

function enterActiveImageModuleView() {
  const moduleId = activeImageModuleId();
  if (moduleId === "annotation" && annotationState.image) {
    setAnnotationMode("view");
  } else if (moduleId === "imageEditor" && imageEditorState.hasImage) {
    setImageEditorMode("view");
  } else if (moduleId === "bg") {
    blueBgState.interaction = null;
    blueBgState.selectedId = null;
    blueBgState.selectedIds = [];
    blueBgState.snapGuides = emptySnapGuides();
    renderBlueBgCanvas();
    updateBlueBgControls();
    blueBgStatus("查看模式");
  }
}

const IMAGE_ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16, 20,
];

function steppedImageZoom(current, direction, minimum = 0.25) {
  const steps = IMAGE_ZOOM_STEPS.filter(value => value >= minimum);
  if (direction > 0) {
    return steps.find(value => value > current + 0.001) ?? steps.at(-1);
  }
  return [...steps].reverse().find(value => value < current - 0.001) ?? steps[0];
}

function stepActiveImageModuleZoom(direction) {
  const moduleId = activeImageModuleId();
  let stage;
  let nextZoom;
  let apply;
  if (moduleId === "bg" && $("#bgBlueMode").checked && blueBgState.background) {
    stage = $("#blueBgStage");
    nextZoom = steppedImageZoom(blueBgState.zoom, direction, 1);
    apply = setBlueBgZoomAtPoint;
  } else if (moduleId === "annotation" && annotationState.image) {
    stage = $("#annotationStage");
    nextZoom = steppedImageZoom(annotationState.zoom, direction);
    apply = setAnnotationZoomAtPoint;
  } else if (moduleId === "imageEditor" && imageEditorState.hasImage) {
    stage = $("#imageEditorStage");
    nextZoom = steppedImageZoom(imageEditorState.zoom, direction);
    apply = setImageEditorZoomAtPoint;
  } else {
    return false;
  }
  const rect = stage.getBoundingClientRect();
  apply(nextZoom, rect.left + rect.width / 2, rect.top + rect.height / 2);
  stage.focus();
  return true;
}

function selectAllInActiveImageTool() {
  const moduleId = activeImageModuleId();
  if (moduleId === "bg" && $("#bgBlueMode").checked && blueBgState.layers.length) {
    blueBgState.selectedIds = blueBgState.layers.map(layer => layer.id);
    blueBgState.selectedId = blueBgState.selectedIds.at(-1) ?? null;
    updateBlueBgControls();
    renderBlueBgCanvas();
    $("#blueBgStage").focus();
    blueBgStatus(`已全选 ${blueBgState.selectedIds.length} 层前景图。`);
    return true;
  }
  if (moduleId === "bg" && !$("#bgBlueMode").checked && bgMaterials.length) {
    bgSelectedMaterialIndices = bgMaterials.map((_, index) => index);
    bgSelectedMaterialIndex = bgSelectedMaterialIndices[0];
    renderBgMaterialList();
    renderBgPreviewList();
    syncBgEffectToolbar();
    updateBgExportState();
    $("#bgPreview").focus?.();
    return true;
  }
  if (moduleId === "annotation" && annotationState.image && annotationState.items.length) {
    annotationState.selectedIds = annotationState.items.map(item => item.id);
    annotationState.selectedId = annotationState.selectedIds.at(-1) ?? null;
    annotationState.mode = "view";
    annotationState.interaction = null;
    annotationState.snapGuides = emptySnapGuides();
    updateAnnotationControls();
    renderAnnotationCanvas();
    $("#annotationStage").focus();
    annotationStatusText(`已全选 ${annotationState.selectedIds.length} 个标注。`);
    return true;
  }
  if (
    moduleId === "imageEditor" &&
    imageEditorState.hasImage &&
    ["remove", "crop"].includes(imageEditorState.mode)
  ) {
    imageEditorState.selection = {
      x: 0,
      y: 0,
      width: imageEditorState.documentCanvas.width,
      height: imageEditorState.documentCanvas.height,
    };
    imageEditorState.interaction = null;
    imageEditorState.snapGuides = emptySnapGuides();
    renderImageEditorCanvas();
    updateImageEditorControls();
    imageEditorStatus("已全选图像区域。");
    return true;
  }
  if (
    moduleId === "annotation" &&
    annotationState.image &&
    ["mask", "blur"].includes(annotationState.mode)
  ) {
    const canvas = annotationCanvas();
    const item = {
      id: annotationState.nextId++,
      type: annotationState.mode,
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      ...(annotationState.mode === "blur" ? { strength: 16 } : {}),
    };
    annotationState.items.push(item);
    annotationState.selectedId = item.id;
    annotationState.selectedIds = [];
    finishAnnotationChange(
      annotationState.mode === "blur" ? "已全选图像并创建高斯模糊" : "已全选图像并创建遮挡块"
    );
    return true;
  }
  return false;
}

function exportActiveImageModule() {
  const moduleId = activeImageModuleId();
  const button = moduleId === "bg"
    ? $("#bgExportButton")
    : moduleId === "annotation"
      ? $("#exportAnnotation")
      : moduleId === "imageEditor"
        ? $("#imageEditorExport")
        : null;
  if (!button || button.disabled) return false;
  button.click();
  return true;
}

function imageModuleGlobalKeyDown(event) {
  const moduleId = activeImageModuleId();
  if (!moduleId) return;
  const target = event.target;
  const editing = target?.matches?.(
    'textarea, select, [contenteditable="true"], input:not([type="file"]):not([type="button"]):not([type="checkbox"])'
  );
  const commandKey = event.metaKey || event.ctrlKey;
  const zoomIn = commandKey && (
    event.code === "Equal" || event.code === "NumpadAdd" || event.key === "+"
  );
  const zoomOut = commandKey && (
    event.code === "Minus" || event.code === "NumpadSubtract" || event.key === "-"
  );
  if (zoomIn || zoomOut) {
    if (stepActiveImageModuleZoom(zoomIn ? 1 : -1)) event.preventDefault();
    return;
  }
  if (commandKey && event.key.toLowerCase() === "e") {
    event.preventDefault();
    exportActiveImageModule();
    return;
  }
  if (editing) return;
  if (commandKey && event.key.toLowerCase() === "a" && selectAllInActiveImageTool()) {
    event.preventDefault();
    return;
  }
  if (event.defaultPrevented) return;
  if (moduleId === "annotation" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const annotationShortcuts = {
      i: () => $("#annotationFile").click(),
      n: () => setAnnotationMode("number"),
      m: () => setAnnotationMode("mask"),
      b: () => setAnnotationMode("blur"),
      g: () => setAnnotationMode("magnifier"),
    };
    const action = annotationShortcuts[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
  }
  if (commandKey && event.key.toLowerCase() === "z") {
    event.preventDefault();
    runActiveImageModuleHistory(event.shiftKey);
    return;
  }
  if (event.altKey) {
    showImageModuleShortcutHints(true);
    const digitMatch = /^(?:Digit|Numpad)([0-9])$/.exec(event.code);
    if (digitMatch) {
      event.preventDefault();
      const digit = Number(digitMatch[1]);
      const index = digit === 0 ? 9 : digit - 1;
      imageModuleToolVisuals(moduleId)[index]?.click();
      return;
    }
  }
  if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "v") {
    event.preventDefault();
    enterActiveImageModuleView();
  }
}

function bind() {
  $$(".tabs button").forEach(btn => btn.onclick = () => showTab(btn.dataset.tab));
  $("#reloadDistributionTasks").onclick = () => loadDistributionTasks({ keepSelection: true }).catch(err => {
    $("#distributionTaskList").innerHTML = `<div class="distribution-empty">${escapeHtml(err.message)}</div>`;
  });
  $("#distributionSearch").oninput = renderDistributionTasks;
  $$(".distribution-filters button").forEach(button => {
    button.onclick = () => {
      state.distribution.filter = button.dataset.distributionFilter;
      $$(".distribution-filters button").forEach(item => item.classList.toggle("active", item === button));
      renderDistributionTasks();
      const visible = filteredDistributionTasks();
      if (visible.length && !visible.some(task => task.id === state.distribution.selectedId)) {
        selectDistributionTask(visible[0].id).catch(err => $("#distributionInfoStatus").textContent = err.message);
      }
    };
  });
  $("#distributionTaskList").onclick = event => {
    const task = event.target.closest("[data-distribution-id]");
    if (task) selectDistributionTask(task.dataset.distributionId).catch(err => $("#distributionInfoStatus").textContent = err.message);
  };
  $("#distributionVersionTabs").onclick = event => {
    const version = event.target.closest("[data-distribution-version]");
    if (version) chooseDistributionVersion(version.dataset.distributionVersion);
  };
  $("#distributionDeleteVersionOptions").onchange = () => {
    $("#confirmDistributionVersionDelete").disabled = !$("#distributionDeleteVersionOptions input:checked");
  };
  $("#confirmDistributionVersionDelete").onclick = () => deleteDistributionVersionsAndRegenerate().catch(err => {
    $("#distributionOptimizeStatus").textContent = err.message;
    $("#distributionVersionLimitDialog").close?.();
  });
  $("#optimizeDistribution").onclick = () => optimizeDistributionArticle().catch(err => {
    $("#distributionOptimizeStatus").textContent = err.message;
  });
  $("#exportDistribution").onclick = openDistributionExportDialog;
  $("#distributionStatus").onchange = () => updateDistributionStatus().catch(err => {
    $("#distributionInfoStatus").textContent = err.message;
  });
  $$("#distributionExportDialog [data-export-type]").forEach(button => {
    button.onclick = () => exportDistributionVersion(button.dataset.exportType).catch(err => {
      $("#distributionOptimizeStatus").textContent = err.message;
    });
  });
  $("#reloadTasks").onclick = () => toggleTaskSource().catch(err => alert(err.message));
  $("#taskSearch").oninput = renderTasks;
  $("#addManualTask").onclick = () => addManualTask().catch(err => $("#packageResult").textContent = err.message);
  $("#manualUrl").onkeydown = event => {
    if (event.key === "Enter") addManualTask().catch(err => $("#packageResult").textContent = err.message);
  };
  $("#downloadDir").onchange = () => localStorage.setItem(DOWNLOAD_DIR_KEY, $("#downloadDir").value.trim());
  $("#buildPackage").onclick = () => {
    prepareCompletionSound();
    buildPackage();
  };
  $("#callAi").onclick = () => callAi().catch(err => $("#packageResult").textContent = err.message);
  $("#genLinks").onclick = () => {
    try {
      genLinks();
    } catch (err) {
      $("#linksResult").classList.remove("links-result-table");
      $("#linksResult").textContent = err.message;
    }
  };
  $("#processMdLinks").onclick = processMdLinks;
  $("#linksResult").onclick = event => {
    const button = event.target.closest(".link-copy");
    if (button) copyLinkFromButton(button);
  };
  $("#makeShort").onclick = () => makeShort("shorturl").catch(err => $("#shortResult").textContent = err.message);
  $("#expandShort").onclick = () => makeShort("expand").catch(err => $("#shortResult").textContent = err.message);
  $("#bgModeToggleButton").onclick = () => setBgMode(!$("#bgBlueMode").checked);
  $("#bgImportButton").onclick = () => $("#bgFiles").click();
  $("#bgUndo").onclick = () => restoreBgHistory(bgHistoryIndex - 1);
  $("#bgRedo").onclick = () => restoreBgHistory(bgHistoryIndex + 1);
  $("#bgExportButton").onclick = () => {
    if ($("#bgBlueMode").checked) confirmBlueBgRender();
    else batchDownloadBgResults();
  };
  $("#bgFiles").onchange = event => {
    importBgFiles(event.target.files).catch(err => alert(err.message));
    event.target.value = "";
  };
  $("#bgMaterialList").onclick = event => {
    const blueLayer = event.target.closest("[data-blue-layer-id]");
    const material = event.target.closest("[data-bg-material-index]");
    if (blueLayer) {
      blueBgState.selectedId = Number(blueLayer.dataset.blueLayerId);
      blueBgState.selectedIds = [];
      updateBlueBgControls();
      renderBlueBgCanvas();
    } else if (material) {
      const index = Number(material.dataset.bgMaterialIndex);
      if (event.metaKey || event.ctrlKey) toggleDefaultBgMaterialSelection(index);
      else openBgMaterialInspector(index);
      scrollToDefaultBgPreview(index);
    } else if (event.target.closest("[data-import-bg-material]")) {
      $("#bgFiles").click();
    }
  };
  $("#bgPreview").onclick = event => {
    const preview = event.target.closest("[data-bg-preview-index]");
    if (preview) {
      const index = Number(preview.dataset.bgPreviewIndex);
      if (event.metaKey || event.ctrlKey) toggleDefaultBgMaterialSelection(index);
      else openBgMaterialInspector(index);
      preview.focus();
    }
  };
  $("#bgPreview").onkeydown = event => {
    if ((event.key === "Delete" || event.key === "Backspace") &&
        event.target.closest("[data-bg-preview-index]")) {
      event.preventDefault();
      deleteSelectedDefaultBgMaterials();
    }
  };
  $("#bgDeleteSelected").onclick = deleteSelectedBgItem;
  $("#bgEffectScale").oninput = () => {
    if ($("#bgBlueMode").checked) updateBlueBgLayerScale();
    else saveBgMaterialInspector();
  };
  $("#bgEffectScale").onchange = pushBgHistory;
  $("#bgEffectShadow").onchange = () => {
    if ($("#bgBlueMode").checked) updateBlueBgLayerOptions();
    else saveBgMaterialInspector();
    pushBgHistory();
  };
  $("#bgEffectRound").onchange = () => {
    if ($("#bgBlueMode").checked) updateBlueBgLayerOptions();
    else saveBgMaterialInspector();
    pushBgHistory();
  };
  $("#sendBlueBgToAnnotation").onclick = sendBgToAnnotation;
  $("#blueBgCanvas").onpointerdown = blueBgPointerDown;
  $("#blueBgCanvas").onpointermove = blueBgPointerMove;
  $("#blueBgCanvas").onpointerup = blueBgPointerUp;
  $("#blueBgCanvas").onpointercancel = blueBgPointerUp;
  $("#blueBgCanvas").oncontextmenu = blueBgContextMenu;
  $("#blueBgMoveUp").onclick = () => moveSelectedBlueBgLayer(1);
  $("#blueBgMoveDown").onclick = () => moveSelectedBlueBgLayer(-1);
  $("#blueBgStage").addEventListener("wheel", blueBgWheel, { passive: false });
  $("#blueBgStage").addEventListener("gesturestart", blueBgGestureStart, { passive: false });
  $("#blueBgStage").addEventListener("gesturechange", blueBgGestureChange, { passive: false });
  $("#blueBgStage").onkeydown = blueBgKeyDown;
  $("#imageEditorFile").onchange = event => loadImageEditorFile(event.target.files[0]).catch(err => alert(err.message));
  $("#imageEditorMoveMode").onclick = () => setImageEditorMode("view");
  $("#imageEditorRemoveMode").onclick = () => setImageEditorMode("remove");
  $("#imageEditorCropMode").onclick = () => setImageEditorMode("crop");
  $("#imageEditorGradientMode").onclick = () => setImageEditorMode("gradient");
  $("#imageEditorMoreButton").onclick = () => {
    const menu = $("#imageEditorMoreMenu");
    menu.hidden = !menu.hidden;
    $("#imageEditorMoreButton").setAttribute("aria-expanded", String(!menu.hidden));
  };
  $("#imageEditorSplitMode").onclick = () => setImageEditorMode("split");
  $("#imageEditorBlendMode").onclick = () => setImageEditorMode("blend");
  $("#imageEditorWindowMode").onclick = suggestImageEditorWindow;
  $("#imageEditorSecondFileButton").onclick = () => $("#imageEditorSecondFile").click();
  $("#imageEditorSecondFile").onchange = event => {
    loadImageEditorSecondFile(event.target.files[0]).catch(err => alert(err.message));
    event.target.value = "";
  };
  [
    "#imageEditorDividerPosition",
    "#imageEditorDividerAngle",
    "#imageEditorDividerWidth",
    "#imageEditorDividerColor",
    "#imageEditorDividerStyle",
    "#imageEditorBlendWidth",
  ].forEach(selector => {
    $(selector).oninput = renderImageEditorCanvas;
    $(selector).onchange = renderImageEditorCanvas;
  });
  $("#imageEditorApplyComposite").onclick = applyImageEditorComposite;
  $("#imageEditorApplySelection").onclick = applyImageEditorSelection;
  $("#imageEditorCancelSelection").onclick = cancelImageEditorSelection;
  $("#imageEditorApplyGradient").onclick = applyImageEditorGradient;
  $("#imageEditorCancelGradient").onclick = cancelImageEditorGradient;
  $("#imageEditorUndo").onclick = () => restoreImageEditorHistory(imageEditorState.historyIndex - 1);
  $("#imageEditorRedo").onclick = () => restoreImageEditorHistory(imageEditorState.historyIndex + 1);
  $("#imageEditorExport").onclick = exportImageEditorImage;
  $("#imageEditorStage").onpointerdown = imageEditorPointerDown;
  $("#imageEditorStage").onpointermove = imageEditorPointerMove;
  $("#imageEditorStage").onpointerup = imageEditorPointerUp;
  $("#imageEditorStage").onpointercancel = imageEditorPointerUp;
  $("#imageEditorStage").onscroll = syncImageEditorOverlays;
  $("#imageEditorStage").addEventListener("wheel", imageEditorWheel, { passive: false });
  $("#imageEditorStage").addEventListener("gesturestart", imageEditorGestureStart, { passive: false });
  $("#imageEditorStage").addEventListener("gesturechange", imageEditorGestureChange, { passive: false });
  document.addEventListener("keydown", event => {
    if (!$("#imageEditor").classList.contains("active")) return;
    const target = event.target;
    if (target?.matches?.('textarea, select, [contenteditable="true"], input:not([type="file"]):not([type="button"]):not([type="checkbox"])')) return;
    imageEditorKeyDown(event);
  });
  document.addEventListener("pointerdown", event => {
    if (!event.target.closest("#blueBgContextMenu")) hideBlueBgContextMenu();
    if (!event.target.closest(".image-editor-more")) {
      $("#imageEditorMoreMenu").hidden = true;
      $("#imageEditorMoreButton").setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("wheel", event => {
    if (event.ctrlKey && !event.target.closest(".annotation-stage, .image-editor-stage, .blue-bg-stage")) {
      event.preventDefault();
    }
  }, { passive: false });
  document.addEventListener("gesturestart", event => {
    if (!event.target.closest(".annotation-stage, .image-editor-stage, .blue-bg-stage")) event.preventDefault();
  }, { passive: false });
  document.addEventListener("gesturechange", event => {
    if (!event.target.closest(".annotation-stage, .image-editor-stage, .blue-bg-stage")) event.preventDefault();
  }, { passive: false });
  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && ["+", "=", "-", "0"].includes(event.key)) event.preventDefault();
  });
  $("#annotationFile").onchange = event => loadAnnotationImage(event.target.files[0]);
  $("#annotationEmptyImport").onclick = () => $("#annotationFile").click();
  $("#imageEditorEmptyImport").onclick = () => $("#imageEditorFile").click();
  $("#annotationViewMode").onclick = () => setAnnotationMode("view");
  $("#addAnnotationNumber").onclick = () => setAnnotationMode("number");
  $("#addAnnotationMask").onclick = () => setAnnotationMode("mask");
  $("#addAnnotationBlur").onclick = () => setAnnotationMode("blur");
  $("#addAnnotationMagnifier").onclick = () => setAnnotationMode("magnifier");
  $("#annotationBlurStrength").oninput = updateAnnotationBlurStrength;
  $("#annotationBlurStrength").onchange = pushAnnotationHistory;
  $("#annotationMagnifierColor").oninput = updateAnnotationMagnifierStyle;
  $("#annotationMagnifierColor").onchange = pushAnnotationHistory;
  $("#annotationMagnifierWidth").oninput = updateAnnotationMagnifierStyle;
  $("#annotationMagnifierWidth").onchange = pushAnnotationHistory;
  $("#annotationUndo").onclick = () => restoreAnnotationHistory(annotationState.historyIndex - 1);
  $("#annotationRedo").onclick = () => restoreAnnotationHistory(annotationState.historyIndex + 1);
  $("#confirmAnnotationNumber").onclick = confirmAnnotationNumberEdit;
  $("#cancelAnnotationNumber").onclick = closeAnnotationNumberEditor;
  $("#annotationNumberInput").onkeydown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmAnnotationNumberEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAnnotationNumberEditor();
    }
  };
  $("#deleteAnnotation").onclick = deleteSelectedAnnotation;
  $("#exportAnnotation").onclick = exportAnnotationImage;
  $("#annotationCanvas").onpointerdown = annotationPointerDown;
  $("#annotationCanvas").onpointermove = annotationPointerMove;
  $("#annotationCanvas").onpointerup = annotationPointerUp;
  $("#annotationCanvas").onpointercancel = annotationPointerUp;
  $("#annotationCanvas").ondblclick = annotationDoubleClick;
  $("#annotationStage").addEventListener("wheel", annotationWheel, { passive: false });
  $("#annotationStage").addEventListener("gesturestart", annotationGestureStart, { passive: false });
  $("#annotationStage").addEventListener("gesturechange", annotationGestureChange, { passive: false });
  $("#annotationStage").onkeydown = annotationKeyDown;
  document.addEventListener("keydown", imageModuleGlobalKeyDown);
  document.addEventListener("keyup", event => {
    if (event.key === "Alt") showImageModuleShortcutHints(false);
  });
  window.addEventListener("blur", () => showImageModuleShortcutHints(false));
  $("#makeButton").onclick = () => makeButtonImage().catch(err => alert(err.message));
  $("#searchProducts").onclick = () => searchProductsAndGenerate().catch(err => $("#productInfoResult").textContent = err.message);
  $("#productKeywords").onkeydown = event => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) searchProductsAndGenerate().catch(err => $("#productInfoResult").textContent = err.message);
  };
  $("#productMatchList").onclick = event => {
    const button = event.target.closest(".generate-selected-product");
    const group = button?.closest(".product-match-group");
    if (button && group) generateSelectedProduct(group, button).catch(err => $("#productInfoResult").textContent = err.message);
  };
  $("#buttonResultList").onclick = async event => {
    const card = event.target.closest(".button-result-card");
    if (!card) return;
    const index = state.buttonResults.findIndex(item => item.id === Number(card.dataset.resultId));
    if (index < 0) return;
    const item = state.buttonResults[index];
    if (event.target.closest(".copy-button-result-link")) {
      await navigator.clipboard.writeText(item.url);
      event.target.textContent = "已复制";
    } else if (event.target.closest(".download-button-result")) {
      downloadBlob(item.blob, item.filename);
    } else if (event.target.closest(".remove-button-result")) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      state.buttonResults.splice(index, 1);
      renderButtonResults();
    }
  };
  $("#fetchProductInfo").onclick = () => fetchProductInfo().catch(err => $("#productInfoResult").textContent = err.message);
  $("#scanProductQr").onclick = () => scanProductQr().catch(err => $("#productInfoResult").textContent = err.message);
  $("#productDescriptionSearch").oninput = renderProductDescriptions;
  $("#pendingDescriptionsOnly").onchange = renderProductDescriptions;
  $("#usedDescriptionsOnly").onchange = renderProductDescriptions;
  $("#addProductDescription").onclick = () => addProductDescriptionFromUrl().catch(err => $("#productDescriptionResult").textContent = err.message);
  $("#productDescriptionUrl").onkeydown = event => {
    if (event.key === "Enter") addProductDescriptionFromUrl().catch(err => $("#productDescriptionResult").textContent = err.message);
  };
  $("#scanProductDescriptions").onclick = () => scanProductDescriptions().catch(err => $("#productDescriptionResult").textContent = err.message);
  $("#previewTopProductDescriptions").onclick = () => previewTopProductDescriptions().catch(err => $("#productDescriptionResult").textContent = err.message);
  $("#productDescriptionList").onclick = event => {
    const card = event.target.closest(".product-description-card");
    if (!card) return;
    if (event.target.closest(".save-product-description")) {
      saveProductDescription(card).catch(err => $("#productDescriptionResult").textContent = err.message);
    }
    if (event.target.closest(".skip-product-description")) {
      skipProductDescription(card).catch(err => $("#productDescriptionResult").textContent = err.message);
    }
    if (event.target.closest(".preview-product-description")) {
      previewProductDescription(card).catch(err => $("#productDescriptionResult").textContent = err.message);
    }
  };
  $("#productDescriptionList").oninput = event => {
    const card = event.target.closest(".product-description-card");
    if (card && event.target.classList.contains("product-description-manual")) {
      const manualMode = $(`input[name="mode-${CSS.escape(card.dataset.key)}"][value="manual"]`, card);
      if (manualMode) manualMode.checked = true;
    }
    if (card) updateProductDescriptionTitle(card);
  };
  $("#productDescriptionList").onchange = event => {
    const card = event.target.closest(".product-description-card");
    if (card) updateProductDescriptionTitle(card);
  };
  $("#shutdownToolbox").onclick = () => shutdownToolbox();
  window.setInterval(animateMarchingAnts, 120);
}

bind();
toggleBlueBgMode();
