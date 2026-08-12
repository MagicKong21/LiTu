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
const ANNOTATION_MAGNIFIER_LINE_WIDTH = 5;
const IMAGE_EXPORT_WIDTH = 2000;
const SYSTEM_CORNER_RADIUS = 32;
const CONTINUOUS_CORNER_EXPONENT = 4;
const CONTINUOUS_CORNER_EXTENT = 1.52866483;
const BLUE_BG_ASSET_URL = "./assets/lizhi-blue-wallpaper.png";
const BLUE_BG_MAX_LAYERS = 3;
const BLUE_BG_HANDLE_SIZE = 28;
const LIZHI_DEFAULT_COLOR = "#8CC6FF";
const BG_DEFAULT_COLOR = "#3FB9FF";
const BG_CUSTOM_COLOR_KEY = "litu.backgroundCustomColor.v1";
const BG_ANNOTATION_CUSTOM_COLORS = {
  mask: { key: "litu.annotationCustomColor.mask.v1", fallback: "#98b2c0", input: "#bgAnnotationMaskColor" },
  number: { key: "litu.annotationCustomColor.number.v1", fallback: "#ff5a52", input: "#bgAnnotationNumberColor" },
  magnifier: { key: "litu.annotationCustomColor.magnifier.v1", fallback: "#ff594b", input: "#bgAnnotationMagnifierColor" },
};
const BG_ASPECTS = {
  default: { label: "默认", value: "default" },
  blue: { label: "蓝底（2000 / 1083）", value: "blue" },
  square: { label: "正方形（1 / 1）", value: "1:1", ratio: 1 },
  landscape: { label: "横图（4 / 3）", value: "4:3", ratio: 4 / 3 },
  portrait: { label: "竖图（3 / 4）", value: "3:4", ratio: 3 / 4 },
  widescreen: { label: "宽屏（16 / 9）", value: "16:9", ratio: 16 / 9 },
  vertical: { label: "竖屏（9 / 16）", value: "9:16", ratio: 9 / 16 },
};
const BG_GRADIENT_PRESETS = [
  { id: "sky", label: "晴空蓝", from: "#42B5F5", to: "#E8F5FF", angle: 135 },
  { id: "sunset", label: "晚霞橙粉", from: "#FF9A9E", to: "#FAD0C4", angle: 135 },
  { id: "aurora", label: "极光紫绿", from: "#A8EDEA", to: "#FED6E3", angle: 135 },
  { id: "midnight", label: "午夜蓝紫", from: "#1B2755", to: "#6B4FA1", angle: 135 },
  { id: "mint", label: "薄荷奶油", from: "#D4FC79", to: "#96E6A1", angle: 135 },
];
const MACOS_WALLPAPERS = [
  { id: "macos-11", label: "Big Sur", url: "./assets/wallpapers/macos-11-big-sur.jpg", source: "512 Pixels" },
  { id: "macos-12", label: "Monterey", url: "./assets/wallpapers/macos-12-monterey.jpg", source: "AppleWalls" },
  { id: "macos-13", label: "Ventura", url: "./assets/wallpapers/macos-13-ventura.webp", source: "AppleWalls" },
  { id: "macos-14", label: "Sonoma", url: "./assets/wallpapers/macos-14-sonoma.webp", source: "AppleWalls" },
  { id: "macos-15", label: "Sequoia", url: "./assets/wallpapers/macos-15-sequoia.webp", source: "AppleWalls" },
  { id: "macos-26", label: "Tahoe", url: "./assets/wallpapers/macos-26-tahoe.jpg", source: "512 Pixels" },
  { id: "macos-27", label: "Golden Gate", url: "./assets/wallpapers/macos-27-golden-gate.jpg", source: "Basic Apple Guy" },
];
let marchingAntsOffset = 0;
const blueBgState = {
  background: null,
  backgroundType: "lizhi",
  backgroundColor: BG_DEFAULT_COLOR,
  backgroundGradient: "sky",
  backgroundImage: null,
  backgroundImageUrl: "",
  backgroundImageName: "",
  aspectMode: "default",
  canvasWidth: 2000,
  canvasHeight: 1083,
  defaultAspect: 2000 / 1083,
  headerImage: null,
  footerImage: null,
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
  inspectorMode: "background",
  toolMode: "background",
  snapGuides: { vertical: [], horizontal: [] },
};
let bgMaterials = [];
let bgSelectedMaterialIndex = -1;
let bgSelectedMaterialIndices = [];
let bgGeneratedResults = [];
let bgHistory = [];
let bgHistoryIndex = -1;
let bgMaterialPointerDrag = null;
let suppressBgMaterialClick = false;
let bgContextMaterialIndex = -1;
let bgMaterialStackSequence = 0;
const bgRenderControllers = new WeakMap();
const blueBgLayerSurfaceCache = new WeakMap();
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
  sourceBgMaterialIndex: null,
  sourceBgLayerId: null,
};
function createAnnotationState(host = "annotation") {
  return {
  host,
  image: null,
  sourceName: "",
  mode: "view",
  items: [],
  selectedId: null,
  selectedIds: [],
  selectedPart: null,
  numberSize: ANNOTATION_NUMBER_SIZE,
  numberColor: "#ff5a52",
  blurStrength: 16,
  maskColor: "#98b2c0",
  maskRound: false,
  maskRoundRadius: 16,
  magnifierColor: ANNOTATION_MAGNIFIER_COLOR,
  magnifierWidth: ANNOTATION_MAGNIFIER_LINE_WIDTH,
  shadows: { number: false, mask: false, blur: false, magnifier: false },
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
}
const nativeAnnotationState = createAnnotationState("annotation");
const bgAnnotationState = createAnnotationState("bg");
let annotationState = nativeAnnotationState;
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
  const frame = selectionFrameBounds(canvas, bounds);
  overlay.hidden = false;
  overlay.style.left = `${canvasRect.left - stageRect.left + stage.scrollLeft + frame.x * scaleX}px`;
  overlay.style.top = `${canvasRect.top - stageRect.top + stage.scrollTop + frame.y * scaleY}px`;
  overlay.style.width = `${Math.max(2, frame.width * scaleX)}px`;
  overlay.style.height = `${Math.max(2, frame.height * scaleY)}px`;
}

function selectionFrameBounds(canvas, bounds) {
  const margin = canvasDisplayUnit(canvas);
  return {
    x: bounds.x - margin,
    y: bounds.y - margin,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2,
  };
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
  const owner = primaryOverlay.id || primaryOverlay.dataset.selectionOwner || "selection";
  $$(".multi-selection-overlay", stage)
    .filter(overlay => overlay.dataset.selectionOwner === owner)
    .forEach(overlay => overlay.remove());
  if (!selections.length) {
    syncCanvasSelectionOverlay(stage, canvas, primaryOverlay, null);
    return;
  }
  selections.forEach((selection, index) => {
    const overlay = index === 0 ? primaryOverlay : primaryOverlay.cloneNode(true);
    if (index > 0) {
      overlay.removeAttribute("id");
      overlay.classList.add("multi-selection-overlay");
      overlay.dataset.selectionOwner = owner;
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
  annotationState = id === "bg" ? bgAnnotationState : nativeAnnotationState;
  $$(".tabs button").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === id));
  $$(".panel").forEach(panel => panel.classList.toggle("active", panel.id === id));
  if ($("#bgTopbarZoom")) $("#bgTopbarZoom").hidden = id !== "bg";
  if ($("#imageEditorTopbarZoom")) $("#imageEditorTopbarZoom").hidden = id !== "imageEditor";
  if ($("#bgExportButton")) $("#bgExportButton").hidden = id !== "bg";
  if ($("#imageEditorExport")) $("#imageEditorExport").hidden = id !== "imageEditor";
  if (id === "bg") requestAnimationFrame(syncBgMaterialColumnWidth);
  if (id === "distribution") scheduleDistributionScrollAnchors();
  if (id === "distribution" && !state.distribution.loaded && !state.distribution.loading) {
    loadDistributionTasks().catch(err => {
      $("#distributionTaskList").innerHTML = `<div class="distribution-empty">${escapeHtml(err.message)}</div>`;
    });
  }
}

function syncBgMaterialColumnWidth() {
  const workbench = $("#bg .bg-workbench");
  if (!workbench) return;
  if (window.innerWidth <= 900) {
    workbench.style.removeProperty("--bg-material-column-width");
    return;
  }
  // Keep the material pane stable across the local toolbox and the two-tab
  // online shell. Deriving this width from a navigation button made the
  // online pane expand across the viewport when its tabs were right-aligned.
  const width = Math.round(Math.min(360, Math.max(240, window.innerWidth * 0.18)));
  workbench.style.setProperty("--bg-material-column-width", `${width}px`);
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
  if (!blueBgState.canvasWidth || !blueBgState.baseDisplayWidth) return;
  const canvas = blueBgCanvas();
  blueBgState.zoom = Math.max(0.5, Math.min(20, zoom));
  canvas.style.width = `${blueBgState.baseDisplayWidth * blueBgState.zoom}px`;
  canvas.style.height = `${blueBgState.baseDisplayHeight * blueBgState.zoom}px`;
  canvas.style.imageRendering = blueBgState.zoom >= 4 ? "pixelated" : "auto";
  const annotationOverlay = $("#bgAnnotationCanvas");
  if (annotationOverlay) {
    annotationOverlay.style.width = canvas.style.width;
    annotationOverlay.style.height = canvas.style.height;
    annotationOverlay.style.imageRendering = canvas.style.imageRendering;
  }
  $("#blueBgStage").classList.toggle("at-base-zoom", blueBgState.zoom <= 1.001);
  const zoomPercent = Math.round(blueBgState.zoom * 100);
  if ($("#bgCanvasZoom")) $("#bgCanvasZoom").value = String(zoomPercent);
  if ($("#bgCanvasZoomValue")) $("#bgCanvasZoomValue").textContent = `${zoomPercent}%`;
  requestAnimationFrame(() => {
    syncCanvasSelectionOverlays(
      $("#blueBgStage"),
      canvas,
      $("#blueBgSelectionOverlay"),
      blueBgSelectionEntries()
    );
    withAnnotationState(bgAnnotationState, () => {
      renderAnnotationCanvas(
        blueBgState.toolMode === "annotation" || selectedAnnotationItems().length > 0
      );
    });
  });
}

function resetBlueBgZoom() {
  const canvas = blueBgCanvas();
  canvas.style.width = "";
  canvas.style.height = "";
  canvas.style.maxWidth = "";
  canvas.style.maxHeight = "";
  const annotationOverlay = $("#bgAnnotationCanvas");
  if (annotationOverlay) {
    annotationOverlay.style.width = "";
    annotationOverlay.style.height = "";
    annotationOverlay.style.maxWidth = "";
    annotationOverlay.style.maxHeight = "";
  }
  blueBgState.zoom = 1;
  blueBgState.baseDisplayWidth = 0;
  blueBgState.baseDisplayHeight = 0;
  requestAnimationFrame(() => {
    if (!blueBgState.canvasWidth) return;
    const rect = canvas.getBoundingClientRect();
    blueBgState.baseDisplayWidth = rect.width;
    blueBgState.baseDisplayHeight = rect.height;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    applyBlueBgZoom(1);
  });
}

function setBlueBgZoomAtPoint(nextZoom, clientX, clientY) {
  const stage = $("#blueBgStage");
  const canvas = blueBgCanvas();
  const before = canvas.getBoundingClientRect();
  const relativeX = before.width ? Math.max(0, Math.min(1, (clientX - before.left) / before.width)) : 0.5;
  const relativeY = before.height ? Math.max(0, Math.min(1, (clientY - before.top) / before.height)) : 0.5;
  applyBlueBgZoom(nextZoom);
  const after = canvas.getBoundingClientRect();
  stage.scrollLeft += after.left + relativeX * after.width - clientX;
  stage.scrollTop += after.top + relativeY * after.height - clientY;
  blueBgStatus(`画布缩放 ${Math.round(blueBgState.zoom * 100)}% · 共 ${blueBgState.layers.length} 张图片`);
}

function blueBgWheel(event) {
  if (!blueBgState.canvasWidth || !event.ctrlKey) return;
  event.preventDefault();
  setBlueBgZoomAtPoint(blueBgState.zoom * Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
}

function blueBgGestureStart(event) {
  if (!blueBgState.canvasWidth) return;
  event.preventDefault();
  blueBgState.gestureStartZoom = blueBgState.zoom;
}

function blueBgGestureChange(event) {
  if (!blueBgState.canvasWidth) return;
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

function bgAspectRatioForMode(mode = blueBgState.aspectMode) {
  if (mode === "blue") return 2000 / 1083;
  if (mode === "default") return blueBgState.defaultAspect || 2000 / 1083;
  const preset = Object.values(BG_ASPECTS).find(item => item.value === mode);
  return preset?.ratio || 2000 / 1083;
}

function setUnifiedBgCanvasSize(width, height) {
  const canvas = blueBgCanvas();
  blueBgState.canvasWidth = Math.max(320, Math.round(width));
  blueBgState.canvasHeight = Math.max(240, Math.round(height));
  canvas.width = blueBgState.canvasWidth;
  canvas.height = blueBgState.canvasHeight;
  const stage = $("#blueBgStage");
  // 画布区保持与标注/编辑模块相同的固定工作区外观；真正的画布比例
  // 由 canvas 自身尺寸决定，不能把比例写到外层工作区上。
  if (stage) stage.style.removeProperty("aspect-ratio");
}

function updateUnifiedBgCanvasSize(firstImage = null) {
  if (blueBgState.aspectMode === "default" && firstImage) {
    const sourceWidth = firstImage.naturalWidth || 1;
    const sourceHeight = firstImage.naturalHeight || 1;
    const normalizedScale = IMAGE_EXPORT_WIDTH / Math.max(sourceWidth, sourceHeight);
    const normalizedWidth = sourceWidth * normalizedScale;
    const normalizedHeight = sourceHeight * normalizedScale;
    const shortSide = Math.min(normalizedWidth, normalizedHeight);
    const shadowOutset = Math.max(8, Math.min(50, Math.round(shortSide / 33))) * 2;
    const sourceWithShadow = {
      width: normalizedWidth + shadowOutset,
      height: normalizedHeight + shadowOutset,
    };
    const scaleRatio = 0.9;
    const aspect = sourceWithShadow.width / sourceWithShadow.height;
    const compensation = Math.min(Math.abs(aspect - 1), 1) * 0.15;
    let width = sourceWithShadow.width / scaleRatio;
    let height = sourceWithShadow.height / scaleRatio;
    if (aspect < 1) height *= 1 - compensation;
    if (aspect > 1) width *= 1 - compensation;
    const marginX = Math.max(40, Math.round(sourceWithShadow.width * 0.035));
    const marginY = Math.max(32, Math.round(sourceWithShadow.height * 0.035));
    width = Math.max(width, sourceWithShadow.width + marginX * 2);
    height = Math.max(height, sourceWithShadow.height + marginY * 2);
    blueBgState.defaultAspect = width / height;
  }
  const ratio = bgAspectRatioForMode();
  setUnifiedBgCanvasSize(2000, 2000 / ratio);
}

async function ensureUnifiedBgBackground(firstImage = null) {
  updateUnifiedBgCanvasSize(firstImage);
  if (blueBgState.backgroundType === "wallpaper" && !blueBgState.backgroundImage) {
    const wallpaper = MACOS_WALLPAPERS.find(item => item.id === blueBgState.backgroundImageName) || MACOS_WALLPAPERS[0];
    blueBgState.backgroundImage = await loadImageSource(wallpaper.url);
    blueBgState.backgroundImageName = wallpaper.id;
    blueBgState.backgroundImageUrl = wallpaper.url;
  }
  if (blueBgState.backgroundType === "image" && !blueBgState.backgroundImage && blueBgState.backgroundImageUrl) {
    blueBgState.backgroundImage = await loadImageSource(blueBgState.backgroundImageUrl);
  }
  if (blueBgState.backgroundType === "lizhi") {
    if (!blueBgState.headerImage) blueBgState.headerImage = await loadImageSource("./assets/IMG_header.png");
    if (!blueBgState.footerImage) blueBgState.footerImage = await loadImageSource("./assets/IMG_footer.png");
  }
  blueBgState.background = blueBgState.backgroundImage;
  blueBgCanvas().width = blueBgState.canvasWidth;
  blueBgCanvas().height = blueBgState.canvasHeight;
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

function detectImageCornerRadius(image) {
  if (!image?.naturalWidth || !image?.naturalHeight) return 0;
  const sampleScale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(8, Math.round(image.naturalWidth * sampleScale));
  const height = Math.max(8, Math.round(image.naturalHeight * sampleScale));
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const alphaAt = (x, y) => pixels[(y * width + x) * 4 + 3];
  const scans = [];
  [
    [0, 1, 0, 1],
    [width - 1, -1, 0, 1],
    [0, 1, height - 1, -1],
    [width - 1, -1, height - 1, -1],
  ].forEach(([xStart, xStep, yStart, yStep]) => {
    const limit = Math.floor(Math.min(width, height) / 2);
    let horizontal = null;
    let vertical = null;
    for (let index = 0; index < limit; index += 1) {
      if (horizontal === null && alphaAt(xStart + xStep * index, yStart) >= 16) horizontal = index;
      if (vertical === null && alphaAt(xStart, yStart + yStep * index) >= 16) vertical = index;
      if (horizontal !== null && vertical !== null) break;
    }
    if (horizontal !== null && vertical !== null) scans.push(Math.max(horizontal, vertical));
  });
  if (scans.length < 3) return 0;
  scans.sort((a, b) => a - b);
  const edgeExtent = scans[Math.floor(scans.length / 2)];
  if (edgeExtent < 4) return 0;
  return Math.max(1, Math.round(edgeExtent / CONTINUOUS_CORNER_EXTENT / sampleScale));
}

function drawBlueBgLayer(ctx, layer) {
  const storedRadius = Number(layer.cornerRadius);
  const requestedRadius = Number.isFinite(storedRadius) ? storedRadius : SYSTEM_CORNER_RADIUS;
  const preserveTransparentCorners = layer.round && layer.cornerAuto !== false && layer.hasTransparentCorners;
  const shouldClipRound = layer.round && !preserveTransparentCorners;
  const radius = shouldClipRound
    ? Math.min(Math.max(0, requestedRadius), layer.width / 2, layer.height / 2)
    : 0;
  if (layer.shadow) {
    const sigma = blueBgShadowSigma(layer);
    const surface = blueBgLayerSurface(layer, shouldClipRound, radius, sigma * 2);
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, .25)";
    ctx.shadowBlur = sigma;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(surface.canvas, layer.x - surface.padding, layer.y - surface.padding);
    ctx.restore();
  }
  if (shouldClipRound) {
    ctx.save();
    continuousRoundedRect(ctx, layer.x, layer.y, layer.width, layer.height, radius);
    ctx.clip();
    ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
    ctx.restore();
  } else {
    ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
  }
}

function blueBgShadowSigma(layer) {
  return Math.max(2, Math.min(50, Math.round(Math.min(layer.width, layer.height) / 33)));
}

function blueBgLayerSurface(layer, shouldClipRound, radius, padding) {
  const width = Math.max(1, Math.ceil(layer.width));
  const height = Math.max(1, Math.ceil(layer.height));
  const inset = Math.ceil(padding);
  const cacheKey = `${width}:${height}:${shouldClipRound ? Math.round(radius * 100) : 0}:${inset}`;
  const cached = blueBgLayerSurfaceCache.get(layer);
  if (cached?.key === cacheKey && cached.image === layer.image) return cached.surface;
  const canvas = document.createElement("canvas");
  canvas.width = width + inset * 2;
  canvas.height = height + inset * 2;
  const surfaceCtx = canvas.getContext("2d");
  if (shouldClipRound) {
    continuousRoundedRect(surfaceCtx, inset, inset, width, height, radius);
    surfaceCtx.clip();
  }
  surfaceCtx.drawImage(layer.image, inset, inset, width, height);
  const surface = { canvas, padding: inset };
  blueBgLayerSurfaceCache.set(layer, { key: cacheKey, image: layer.image, surface });
  return surface;
}

function blueBgLayerVisualGeometry(layer) {
  const shadowOutset = layer.shadow ? blueBgShadowSigma(layer) * 2 : 0;
  const left = shadowOutset;
  const right = shadowOutset;
  const top = shadowOutset;
  const bottom = shadowOutset;
  return {
    bounds: {
      x: layer.x - left,
      y: layer.y - top,
      width: layer.width + left + right,
      height: layer.height + top + bottom,
    },
    outsets: { left, right, top, bottom },
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
  if (!blueBgState.canvasWidth || !blueBgState.canvasHeight) {
    if (!forExport) {
      syncCanvasSelectionOverlays(
        $("#blueBgStage"), targetCanvas, $("#blueBgSelectionOverlay"), []
      );
    }
    return;
  }
  targetCanvas.width = blueBgState.canvasWidth;
  targetCanvas.height = blueBgState.canvasHeight;
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  if (!blueBgState.layers.length && !forExport) {
    blueBgState.snapGuides = { vertical: [], horizontal: [] };
    $("#bgAnnotationCanvas").hidden = true;
    syncCanvasSelectionOverlays(
      $("#blueBgStage"), targetCanvas, $("#blueBgSelectionOverlay"), []
    );
    return;
  }
  drawUnifiedBackground(ctx, targetCanvas);
  blueBgState.layers.forEach(layer => drawBlueBgLayer(ctx, layer));
  syncBgAnnotationSource(targetCanvas);
  if (forExport) {
    withAnnotationState(bgAnnotationState, () => {
      bgAnnotationState.items.forEach(item => drawAnnotationItem(ctx, item, false));
    });
    return;
  }
  drawCanvasSnapGuides(ctx, targetCanvas, blueBgState.snapGuides);
  const annotating = blueBgState.toolMode === "annotation";
  const annotationSelected = bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length > 0;
  $("#blueBgStage").classList.toggle("is-annotating", annotating);
  $("#bgAnnotationCanvas").hidden = !blueBgState.layers.length;
  withAnnotationState(bgAnnotationState, () => renderAnnotationCanvas(annotating || annotationSelected));
  syncCanvasSelectionOverlays(
    $("#blueBgStage"),
    targetCanvas,
    $("#blueBgSelectionOverlay"),
    annotating ? [] : blueBgSelectionEntries()
  );
}

function withAnnotationState(state, action) {
  const previous = annotationState;
  annotationState = state;
  try {
    return action();
  } finally {
    annotationState = previous;
  }
}

function syncBgAnnotationSource(sourceCanvas = blueBgCanvas()) {
  if (!sourceCanvas?.width || !sourceCanvas?.height) return;
  let snapshot = bgAnnotationState.image;
  if (!(snapshot instanceof HTMLCanvasElement)) snapshot = document.createElement("canvas");
  snapshot.width = sourceCanvas.width;
  snapshot.height = sourceCanvas.height;
  snapshot.getContext("2d").drawImage(sourceCanvas, 0, 0);
  bgAnnotationState.image = snapshot;
  const overlay = $("#bgAnnotationCanvas");
  overlay.width = sourceCanvas.width;
  overlay.height = sourceCanvas.height;
  if (sourceCanvas === blueBgCanvas()) {
    overlay.style.width = sourceCanvas.style.width;
    overlay.style.height = sourceCanvas.style.height;
    overlay.style.maxWidth = sourceCanvas.style.maxWidth;
    overlay.style.maxHeight = sourceCanvas.style.maxHeight;
  }
}

function clearBgAnnotationSelection() {
  bgAnnotationState.selectedId = null;
  bgAnnotationState.selectedIds = [];
  bgAnnotationState.selectedPart = null;
  bgAnnotationState.interaction = null;
  bgAnnotationState.snapGuides = emptySnapGuides();
  syncCanvasSelectionOverlays(
    $("#blueBgStage"), $("#bgAnnotationCanvas"), $("#bgAnnotationSelectionOverlay"), []
  );
}

function clearBlueBgSelection() {
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  blueBgState.interaction = null;
  blueBgState.snapGuides = emptySnapGuides();
  syncCanvasSelectionOverlays(
    $("#blueBgStage"), blueBgCanvas(), $("#blueBgSelectionOverlay"), []
  );
}

function clearAllBgCanvasSelections() {
  clearBlueBgSelection();
  clearBgAnnotationSelection();
}

function activateBgAnnotationMode(mode) {
  if (!blueBgState.layers.length) return;
  annotationState = bgAnnotationState;
  syncBgAnnotationSource();
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  blueBgState.interaction = null;
  blueBgState.snapGuides = emptySnapGuides();
  blueBgState.toolMode = "annotation";
  setBgInspectorMode("annotation");
  setAnnotationMode(mode);
  renderBlueBgCanvas();
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

async function selectUnifiedBgMaterial(index, additive = false) {
  const material = bgMaterials[index];
  if (!material) return;
  let layer = blueBgState.layers.find(item => item.materialIndex === index);
  if (!layer && blueBgState.layers.length < BLUE_BG_MAX_LAYERS) {
    await addBlueBgFiles([material.file]);
    layer = blueBgState.layers.find(item => item.materialIndex === index);
    syncBlueBgLayersToMaterialOrder();
  }
  if (!layer) return;
  annotationState = bgAnnotationState;
  if (!additive) clearBgAnnotationSelection();
  blueBgState.toolMode = "move";
  setBgInspectorMode("effects");
  const ids = new Set(additive ? selectedBlueBgLayers().map(item => item.id) : []);
  const adding = !additive || !ids.has(layer.id);
  if (adding) ids.add(layer.id);
  else ids.delete(layer.id);
  blueBgState.selectedIds = [...ids];
  blueBgState.selectedId = adding ? layer.id : (blueBgState.selectedIds.at(-1) ?? null);
  if (!blueBgState.selectedIds.length &&
      (bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length)) {
    setBgInspectorMode("annotation");
  } else if (!blueBgState.selectedIds.length) {
    blueBgState.toolMode = "background";
    setBgInspectorMode("background");
  }
  material.unused = false;
  updateBlueBgControls();
  renderBlueBgCanvas();
}

function selectNextBlueBgLayer() {
  if (!blueBgState.layers.length) return false;
  const topToBottom = [...blueBgState.layers].reverse();
  const currentIndex = topToBottom.findIndex(layer => layer.id === blueBgState.selectedId);
  const next = topToBottom[(currentIndex + 1 + topToBottom.length) % topToBottom.length];
  clearBgAnnotationSelection();
  blueBgState.selectedId = next.id;
  blueBgState.selectedIds = [];
  blueBgState.interaction = null;
  blueBgState.toolMode = "move";
  setBgInspectorMode("effects");
  updateBlueBgControls();
  renderBlueBgCanvas();
  $("#blueBgStage").focus();
  blueBgStatus(`已选择前景图：${next.fileName || "图片"}`);
  return true;
}

function blueBgSelectionBounds() {
  return unionBounds(selectedBlueBgLayers().map(layer => blueBgLayerVisualGeometry(layer).bounds));
}

function blueBgSelectionEntries() {
  return selectedBlueBgLayers()
    .map(layer => ({ id: layer.id, bounds: blueBgLayerVisualGeometry(layer).bounds }))
    .sort((a, b) => Number(b.id === blueBgState.selectedId) - Number(a.id === blueBgState.selectedId));
}

function drawCoverImage(ctx, image, width, height) {
  if (!image?.naturalWidth || !image?.naturalHeight) return;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawUnifiedBackground(ctx, canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const type = blueBgState.backgroundType;
  if (type === "transparent") return;
  if (type === "image" || type === "wallpaper") {
    ctx.fillStyle = "#eaf0f6";
    ctx.fillRect(0, 0, width, height);
    drawCoverImage(ctx, blueBgState.backgroundImage, width, height);
    return;
  }
  if (type === "gradient") {
    const preset = BG_GRADIENT_PRESETS.find(item => item.id === blueBgState.backgroundGradient) || BG_GRADIENT_PRESETS[0];
    const angle = (preset.angle || 135) * Math.PI / 180;
    const length = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
    const centerX = width / 2;
    const centerY = height / 2;
    const x = Math.cos(angle) * length / 2;
    const y = Math.sin(angle) * length / 2;
    const gradient = ctx.createLinearGradient(centerX - x, centerY - y, centerX + x, centerY + y);
    gradient.addColorStop(0, preset.from);
    gradient.addColorStop(1, preset.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  if (type === "lizhi") {
    // 荔枝默认背景沿用原始自动加底的浅蓝底色。这里不能复用
    // “纯色”的默认蓝色，否则页眉、页脚之间会露出一条深蓝色带。
    ctx.fillStyle = LIZHI_DEFAULT_COLOR;
    ctx.fillRect(0, 0, width, height);
    if (blueBgState.footerImage) {
      const footerHeight = blueBgState.footerImage.naturalHeight * width / blueBgState.footerImage.naturalWidth;
      ctx.drawImage(blueBgState.footerImage, 0, height - footerHeight, width, footerHeight);
    }
    if (blueBgState.headerImage) {
      const headerHeight = blueBgState.headerImage.naturalHeight * width / blueBgState.headerImage.naturalWidth;
      ctx.drawImage(blueBgState.headerImage, 0, 0, width, headerHeight);
    }
    return;
  }
  if (type === "blue") {
    ctx.fillStyle = BG_DEFAULT_COLOR;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  ctx.fillStyle = blueBgState.backgroundColor || BG_DEFAULT_COLOR;
  ctx.fillRect(0, 0, width, height);
}

function renderBgWallpaperChoices() {
  const wrap = $("#bgWallpaperChoices");
  if (!wrap) return;
  wrap.innerHTML = "";
  MACOS_WALLPAPERS.forEach(wallpaper => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bg-background-tile";
    button.dataset.bgType = "wallpaper";
    button.dataset.bgWallpaper = wallpaper.id;
    const label = wallpaper.label.replace("macOS ", "");
    const compactClass = label.length >= 10 ? " bg-background-tile-label-compact" : "";
    button.innerHTML = `<span class="bg-background-tile-preview"><img src="${wallpaper.url}" alt=""></span><strong class="${compactClass.trim()}">${label}</strong>`;
    button.title = `${wallpaper.label} · 来源：${wallpaper.source}`;
    wrap.appendChild(button);
  });
  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "bg-background-tile";
  customButton.dataset.bgType = "image";
  customButton.dataset.bgCustom = "true";
  customButton.title = "上传自定义背景图片";
  customButton.innerHTML = '<span class="bg-background-tile-preview bg-background-add-preview">＋</span><strong>自定义</strong>';
  wrap.appendChild(customButton);
}

function syncBgBackgroundTileSelection() {
  const type = $("#bgBackgroundType").value || blueBgState.backgroundType;
  const gradient = $("#bgBackgroundGradient").value || blueBgState.backgroundGradient;
  const wallpaper = $("#bgWallpaperSelect").value || blueBgState.backgroundImageName;
  $$("[data-bg-type]", $("#bgBackgroundDialog")).forEach(tile => {
    const active = tile.dataset.bgType === type &&
      (type !== "gradient" || tile.dataset.bgGradient === gradient) &&
      (type !== "wallpaper" || tile.dataset.bgWallpaper === wallpaper);
    tile.classList.toggle("active", active);
  });
  $$("[data-bg-aspect]", $("#bgBackgroundDialog")).forEach(tile => {
    tile.classList.toggle("active", tile.dataset.bgAspect === $("#bgCanvasAspect").value);
  });
  $("#bgSolidTilePreview").style.background = $("#bgBackgroundColor").value || BG_DEFAULT_COLOR;
}

function setBgInspectorMode(mode) {
  blueBgState.inspectorMode = ["background", "annotation"].includes(mode) ? mode : "effects";
  const backgroundActive = blueBgState.inspectorMode === "background";
  const annotationActive = blueBgState.inspectorMode === "annotation";
  const effectsActive = blueBgState.inspectorMode === "effects" && selectedBlueBgLayers().length > 0;
  $("#bgBackgroundDialog").hidden = !backgroundActive;
  $("#bgEffectToolbar").hidden = backgroundActive || annotationActive;
  $("#bgAnnotationInspector").hidden = !annotationActive;
  $("#bgViewMode").classList.toggle("active", backgroundActive);
  $("#bgBackgroundButton").classList.toggle("active", effectsActive);
}

function openBgBackgroundDialog() {
  const panel = $("#bgBackgroundDialog");
  if (!panel) return;
  $("#bgBackgroundType").value = blueBgState.backgroundType;
  $("#bgBackgroundColor").value = localStorage.getItem(BG_CUSTOM_COLOR_KEY) || blueBgState.backgroundColor || BG_DEFAULT_COLOR;
  $("#bgBackgroundGradient").value = blueBgState.backgroundGradient || BG_GRADIENT_PRESETS[0].id;
  $("#bgCanvasAspect").value = blueBgState.aspectMode || "default";
  renderBgWallpaperChoices();
  const wallpaper = MACOS_WALLPAPERS.find(item => item.id === blueBgState.backgroundImageName) || MACOS_WALLPAPERS[0];
  $("#bgWallpaperSelect").value = wallpaper.id;
  const feedback = $("#bgBackgroundFeedback");
  feedback.textContent = "";
  feedback.hidden = true;
  syncBgBackgroundTileSelection();
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  blueBgState.interaction = null;
  blueBgState.snapGuides = emptySnapGuides();
  blueBgState.toolMode = "background";
  clearBgAnnotationSelection();
  setBgInspectorMode("background");
  renderBlueBgCanvas();
  updateBlueBgControls();
}

function closeBgBackgroundPanel() {
  if (!selectedBlueBgLayers().length) {
    openBgBackgroundDialog();
    return;
  }
  blueBgState.toolMode = "move";
  clearBgAnnotationSelection();
  setBgInspectorMode("effects");
  $("#blueBgStage").classList.remove("is-annotating");
}

function openBgImageStylePanel() {
  if (!selectedBlueBgLayers().length) {
    openBgBackgroundDialog();
    return;
  }
  blueBgState.toolMode = "move";
  clearBgAnnotationSelection();
  setBgInspectorMode("effects");
  $("#blueBgStage").classList.remove("is-annotating");
  updateBlueBgControls();
  renderBlueBgCanvas();
  blueBgStatus("图片样式：可调节所选前景图的阴影、圆角和缩放比例。");
}

async function applyBgBackgroundFromTiles() {
  const panel = $("#bgBackgroundDialog");
  const feedback = $("#bgBackgroundFeedback");
  feedback.textContent = "";
  feedback.hidden = true;
  panel.classList.add("is-applying");
  syncBgBackgroundTileSelection();
  try {
    await applyBgBackgroundSettings();
    syncBgBackgroundTileSelection();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.hidden = false;
    blueBgStatus(error.message);
  } finally {
    panel.classList.remove("is-applying");
  }
}

async function applyBgBackgroundSettings() {
  const type = $("#bgBackgroundType").value;
  const aspectMode = $("#bgCanvasAspect").value;
  const materialValue = $("#bgBackgroundMaterial").value;
  const selectedMaterialIndex = materialValue === "" ? -1 : Number(materialValue);
  const previousCanvasWidth = blueBgState.canvasWidth;
  const previousCanvasHeight = blueBgState.canvasHeight;
  blueBgState.backgroundType = type;
  blueBgState.aspectMode = aspectMode;
  blueBgState.backgroundColor = $("#bgBackgroundColor").value || BG_DEFAULT_COLOR;
  if (type === "solid") localStorage.setItem(BG_CUSTOM_COLOR_KEY, blueBgState.backgroundColor);
  blueBgState.backgroundGradient = $("#bgBackgroundGradient").value || BG_GRADIENT_PRESETS[0].id;
  if (type === "wallpaper") {
    const wallpaper = MACOS_WALLPAPERS.find(item => item.id === $("#bgWallpaperSelect").value) || MACOS_WALLPAPERS[0];
    blueBgState.backgroundImage = await loadImageSource(wallpaper.url);
    blueBgState.backgroundImageName = wallpaper.id;
    blueBgState.backgroundImageUrl = wallpaper.url;
  } else if (type === "image") {
    const file = $("#bgBackgroundFile").files?.[0];
    if (file) {
      blueBgState.backgroundImageUrl = URL.createObjectURL(file);
      blueBgState.backgroundImageName = file.name;
      blueBgState.backgroundImage = await loadImageSource(blueBgState.backgroundImageUrl);
    } else if (Number.isInteger(selectedMaterialIndex) && selectedMaterialIndex >= 0 && bgMaterials[selectedMaterialIndex]) {
      const material = bgMaterials[selectedMaterialIndex];
      blueBgState.backgroundImageUrl = material.previewUrl;
      blueBgState.backgroundImageName = material.file.name;
      blueBgState.backgroundImage = await loadImageSource(material.previewUrl);
    } else if (!blueBgState.backgroundImage) {
      throw new Error("请选择一个自定义图片或素材库图片。");
    }
  } else {
    blueBgState.backgroundImage = null;
    blueBgState.backgroundImageUrl = "";
    blueBgState.backgroundImageName = "";
  }
  await ensureUnifiedBgBackground(blueBgState.layers[0]?.image || null);
  if (previousCanvasWidth && previousCanvasHeight &&
      (previousCanvasWidth !== blueBgState.canvasWidth || previousCanvasHeight !== blueBgState.canvasHeight)) {
    blueBgState.layers.forEach(layer => {
      const centerRatioX = (layer.x + layer.width / 2) / previousCanvasWidth;
      const centerRatioY = (layer.y + layer.height / 2) / previousCanvasHeight;
      // 导出宽度固定为 2000px。切换画布比例时只按相对中心重新定位，
      // 不允许横纵分别缩放前景图，否则图片和圆角都会被拉伸。
      const uniformScale = blueBgState.canvasWidth / previousCanvasWidth;
      layer.width *= uniformScale;
      layer.height *= uniformScale;
      layer.fitWidth *= uniformScale;
      layer.fitHeight *= uniformScale;
      layer.x = centerRatioX * blueBgState.canvasWidth - layer.width / 2;
      layer.y = centerRatioY * blueBgState.canvasHeight - layer.height / 2;
      clampBlueBgLayer(layer);
    });
  }
  renderBlueBgCanvas();
  resetBlueBgZoom();
  pushBgHistory();
  updateBgControlsAfterBackgroundChange();
  if (type === "image") $("#bgBackgroundFile").value = "";
  blueBgStatus(`背景已切换为「${backgroundTypeLabel(type)}」 · 画布 ${blueBgState.canvasWidth} × ${blueBgState.canvasHeight}`);
}

function backgroundTypeLabel(type) {
  return { lizhi: "荔枝默认", blue: "蓝色", solid: "自定义颜色", transparent: "无背景", gradient: "渐变色", image: "自定义图片", wallpaper: "macOS 壁纸" }[type] || type;
}

function updateBgControlsAfterBackgroundChange() {
  updateBlueBgControls();
  renderBgMaterialList();
  updateBgExportState();
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
  const canvasZoomDisabled = $("#blueBgEditor").hidden || !blueBgState.layers.length;
  const toolbar = $("#bgEffectToolbar");
  toolbar.classList.toggle("is-disabled", disabled);
  $("#bgDeleteSelected").disabled = disabled;
  $("#bgEffectShadow").disabled = disabled;
  $("#bgEffectRound").disabled = disabled;
  $("#bgEffectRoundRadius").disabled = disabled || selectedItems.every(item => !item.round);
  $("#bgEffectScale").disabled = disabled;
  $("#bgCanvasZoom").disabled = canvasZoomDisabled;
  $("#bgCanvasZoom").value = String(Math.round(blueBgState.zoom * 100));
  $("#bgCanvasZoomValue").textContent = `${Math.round(blueBgState.zoom * 100)}%`;
  $("#bgEffectScale").min = blueprint ? "10" : "40";
  $("#bgEffectScale").max = blueprint ? "200" : "150";
  if (selected) {
    $("#bgEffectShadow").checked = selected.shadow;
    $("#bgEffectRound").checked = selected.round;
    $("#bgEffectShadow").indeterminate = selectedItems.some(item => item.shadow !== selected.shadow);
    $("#bgEffectRound").indeterminate = selectedItems.some(item => item.round !== selected.round);
    const storedRadius = Number(selected.cornerRadius);
    const radius = Math.max(0, Math.round(Number.isFinite(storedRadius) ? storedRadius : SYSTEM_CORNER_RADIUS));
    $("#bgEffectRoundRadius").value = String(Math.min(128, radius));
    $("#bgEffectRoundRadiusValue").textContent = `${radius} px`;
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
    $("#bgEffectRoundRadius").value = String(SYSTEM_CORNER_RADIUS);
    $("#bgEffectRoundRadiusValue").textContent = `${SYSTEM_CORNER_RADIUS} px`;
    $("#bgEffectScaleValue").textContent = "—";
  }
}

function updateBlueBgControls() {
  const selectedLayers = selectedBlueBgLayers();
  $("#blueBgStage").classList.toggle("has-layers", blueBgState.layers.length > 0);
  $("#bgViewMode").disabled = false;
  $("#bgViewMode").classList.toggle("active", blueBgState.inspectorMode === "background");
  $("#bgBackgroundButton").disabled = !selectedLayers.length;
  $("#bgBackgroundButton").classList.toggle(
    "active",
    selectedLayers.length > 0 && blueBgState.inspectorMode === "effects"
  );
  withAnnotationState(bgAnnotationState, updateBgAnnotationControls);
  syncBgEffectToolbar();
  renderBgMaterialList();
  updateBgExportState();
}

function clampBlueBgLayer(layer) {
  const canvas = blueBgCanvas();
  layer.width = Math.max(Math.max(80, layer.fitWidth * 0.1), Math.min(layer.fitWidth * 2, layer.width));
  layer.height = Math.max(Math.max(60, layer.fitHeight * 0.1), Math.min(layer.fitHeight * 2, layer.height));
  const radius = Number(layer.cornerRadius);
  // 状态中的圆角值是用户设置的画布像素值；绘制时才按当前图层尺寸
  // 临时限幅，不能在缩小图层后永久改小该设置。
  layer.cornerRadius = Math.max(0, Math.min(
    128,
    Number.isFinite(radius) ? radius : SYSTEM_CORNER_RADIUS
  ));
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
    bgAnnotationState.items = [];
    bgAnnotationState.selectedId = null;
    bgAnnotationState.selectedIds = [];
    bgAnnotationState.selectedPart = null;
    bgAnnotationState.nextId = 1;
    bgAnnotationState.nextNumber = 1;
    bgAnnotationState.numberSize = ANNOTATION_NUMBER_SIZE;
  }
  const available = BLUE_BG_MAX_LAYERS - blueBgState.layers.length;
  const accepted = files.slice(0, Math.max(0, available));
  for (const file of accepted) {
    const { image, fileName } = await loadBlueBgFile(file);
    const materialIndex = bgMaterials.findIndex(candidate => candidate.file === file);
    const material = bgMaterials[materialIndex];
    if (material) material.unused = false;
    const fit = Math.min(
      blueBgCanvas().width * 0.68 / image.naturalWidth,
      blueBgCanvas().height * 0.72 / image.naturalHeight
    );
    const width = Math.max(80, image.naturalWidth * fit);
    const height = image.naturalHeight * fit;
    const detectedCornerRadius = detectImageCornerRadius(image);
    const offset = blueBgState.layers.length * 46;
    const layer = {
      id: blueBgState.nextId++,
      image,
      fileName,
      materialIndex,
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
      unused: false,
      // 圆角值使用最终 2000px 画布中的绝对像素，不随素材分辨率或缩放
      // 反复变化。已有透明圆角由绘制阶段直接保留原始 alpha。
      cornerRadius: SYSTEM_CORNER_RADIUS,
      cornerAuto: true,
      hasTransparentCorners: detectedCornerRadius > 0,
    };
    clampBlueBgLayer(layer);
    blueBgState.layers.push(layer);
    blueBgState.selectedId = layer.id;
    blueBgState.selectedIds = [];
  }
  if (accepted.length) {
    blueBgState.toolMode = "move";
    setBgInspectorMode("effects");
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
  const firstImage = await loadBlueBgFile(files[0]);
  await ensureUnifiedBgBackground(firstImage.image);
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
  const bounds = selectionFrameBounds(
    blueBgCanvas(),
    blueBgLayerVisualGeometry(layer).bounds
  );
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

function blueBgHitHandle(layer, point) {
  if (!layer) return null;
  return hitSelectionHandle(
    selectionFrameBounds(blueBgCanvas(), blueBgLayerVisualGeometry(layer).bounds),
    point,
    blueBgCanvas(),
    14
  );
}

function blueBgAlignmentTargets(excludedIds = []) {
  const canvas = blueBgCanvas();
  const excluded = new Set(excludedIds);
  const x = [0, canvas.width / 2, canvas.width];
  const y = [0, canvas.height / 2, canvas.height];
  blueBgState.layers.forEach(layer => {
    if (excluded.has(layer.id)) return;
    const bounds = blueBgLayerVisualGeometry(layer).bounds;
    x.push(bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width);
    y.push(bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height);
  });
  const unique = values => [...new Set(values.map(value => Math.round(value * 1000) / 1000))];
  return { x: unique(x), y: unique(y) };
}

function snapBlueBgBounds(bounds, excludedIds = [], tolerancePx = 12) {
  const canvas = blueBgCanvas();
  const rect = canvas.getBoundingClientRect();
  const toleranceX = tolerancePx * canvas.width / Math.max(1, rect.width);
  const toleranceY = tolerancePx * canvas.height / Math.max(1, rect.height);
  const targets = blueBgAlignmentTargets(excludedIds);
  const xEdges = [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width];
  const yEdges = [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height];
  const bestMatch = (edges, values, tolerance) => edges
    .flatMap(edge => values.map(target => ({ target, offset: target - edge, distance: Math.abs(target - edge) })))
    .filter(match => match.distance <= tolerance)
    .sort((a, b) => a.distance - b.distance)[0] || null;
  const xMatch = bestMatch(xEdges, targets.x, toleranceX);
  const yMatch = bestMatch(yEdges, targets.y, toleranceY);
  return {
    x: bounds.x + (xMatch?.offset || 0),
    y: bounds.y + (yMatch?.offset || 0),
    guides: {
      vertical: xMatch ? [xMatch.target] : [],
      horizontal: yMatch ? [yMatch.target] : [],
    },
  };
}

function blueBgPointerDown(event) {
  if (event.button > 0 || !blueBgState.layers.length) return;
  if (blueBgState.inspectorMode === "background") closeBgBackgroundPanel();
  const canvas = blueBgCanvas();
  blueBgState.snapGuides = emptySnapGuides();
  const point = blueBgPointerPosition(event);
  const selectedLayers = selectedBlueBgLayers();
  const hadSelection = selectedLayers.length > 0;
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
        startClient: { x: event.clientX, y: event.clientY },
        moved: false,
        original: { ...layer },
        originals: updatedSelection.map(candidate => ({ id: candidate.id, x: candidate.x, y: candidate.y })),
      } : null;
      if (!updatedSelection.length) {
        const hasSelectedAnnotation = bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length > 0;
        blueBgState.toolMode = hasSelectedAnnotation ? "move" : "background";
        setBgInspectorMode(hasSelectedAnnotation ? "annotation" : "background");
      }
    } else {
      blueBgState.interaction = null;
    }
    $("#blueBgStage").setPointerCapture?.(event.pointerId);
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
      startClient: { x: event.clientX, y: event.clientY },
      moved: false,
      original: { ...layer },
      originals: movingSelection
        ? selectedLayers.map(candidate => ({ id: candidate.id, x: candidate.x, y: candidate.y }))
        : null,
    } : null;
  }
  $("#blueBgStage").setPointerCapture?.(event.pointerId);
  $("#blueBgStage").focus();
  updateBlueBgControls();
  renderBlueBgCanvas();
  if (!layer && hadSelection) blueBgStatus("已取消框选。");
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
    const cursor = selectionCursorByHandle[handle] ||
      (blueBgState.layers.some(layer => blueBgPointInLayer(layer, point)) ? "move" : "default");
    blueBgCanvas().style.cursor = cursor;
    $("#blueBgStage").style.cursor = cursor;
    return;
  }
  const layer = blueBgState.layers.find(candidate => candidate.id === interaction.id);
  if (!layer) return;
  const point = blueBgPointerPosition(event);
  if (["move", "move-group"].includes(interaction.mode) && !interaction.moved) {
    const distance = Math.hypot(
      event.clientX - interaction.startClient.x,
      event.clientY - interaction.startClient.y
    );
    // 单击时触控板/鼠标会产生极小的 pointermove。超过 4px 后才进入
    // 真正拖动，避免“点选一下，图片同时往上跳”。
    if (distance < 4) return;
    interaction.moved = true;
  }
  if (interaction.mode === "move-group") {
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    interaction.originals.forEach(original => {
      const candidate = blueBgState.layers.find(item => item.id === original.id);
      if (!candidate) return;
      candidate.x = original.x + dx;
      candidate.y = original.y + dy;
    });
    const bounds = blueBgSelectionBounds();
    const snapped = snapBlueBgBounds(bounds, selectedBlueBgLayers().map(candidate => candidate.id));
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
    const visualBounds = blueBgLayerVisualGeometry(layer).bounds;
    const snapped = snapBlueBgBounds(visualBounds, [layer.id]);
    layer.x += snapped.x - visualBounds.x;
    layer.y += snapped.y - visualBounds.y;
    blueBgState.snapGuides = snapped.guides;
  } else {
    const canvas = blueBgCanvas();
    const rect = canvas.getBoundingClientRect();
    const toleranceX = 12 * canvas.width / Math.max(1, rect.width);
    const toleranceY = 12 * canvas.height / Math.max(1, rect.height);
    const frameMargin = canvasDisplayUnit(canvas);
    const targets = blueBgAlignmentTargets([layer.id]);
    const visualEdgePoint = {
      x: interaction.handle.includes("w")
        ? point.x + frameMargin
        : interaction.handle.includes("e")
          ? point.x - frameMargin
          : point.x,
      y: interaction.handle.includes("n")
        ? point.y + frameMargin
        : interaction.handle.includes("s")
          ? point.y - frameMargin
          : point.y,
    };
    const xSnap = interaction.handle.includes("w") || interaction.handle.includes("e")
      ? nearestSnap(visualEdgePoint.x, targets.x, toleranceX)
      : null;
    const ySnap = interaction.handle.includes("n") || interaction.handle.includes("s")
      ? nearestSnap(visualEdgePoint.y, targets.y, toleranceY)
      : null;
    const visualGeometry = blueBgLayerVisualGeometry(interaction.original);
    const resizePoint = {
      x: xSnap?.value ?? visualEdgePoint.x,
      y: ySnap?.value ?? visualEdgePoint.y,
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
  const interaction = blueBgState.interaction;
  blueBgState.interaction = null;
  $("#blueBgStage").releasePointerCapture?.(event.pointerId);
  const snapped = blueBgState.snapGuides.vertical.length || blueBgState.snapGuides.horizontal.length;
  blueBgState.snapGuides = emptySnapGuides();
  renderBlueBgCanvas();
  if (["move", "move-group"].includes(interaction.mode) && !interaction.moved) {
    blueBgStatus(`已选择前景图 · 共 ${blueBgState.layers.length} 张图片`);
    return;
  }
  pushBgHistory();
  blueBgStatus(`${snapped ? "已吸附到图像或画布参考线" : "已保存当前调整"} · 共 ${blueBgState.layers.length} 张图片`);
}

function bgAnnotationHitAtEvent(event) {
  if (!bgAnnotationState.items.length) return false;
  return withAnnotationState(bgAnnotationState, () => {
    const point = annotationPointerPosition(event);
    const selected = selectedAnnotationItems();
    const handle = [...selected].reverse().some(item => Boolean(hitAnnotationHandle(item, point)));
    const item = [...annotationState.items].reverse().some(candidate => pointInAnnotationItem(candidate, point));
    return handle || item;
  });
}

function selectedBlueBgHandleAtEvent(event) {
  if (!blueBgState.layers.length) return null;
  const point = blueBgPointerPosition(event);
  return [...selectedBlueBgLayers()]
    .reverse()
    .map(layer => ({ layer, handle: blueBgHitHandle(layer, point) }))
    .find(candidate => candidate.handle) || null;
}

function blueBgLayerHitAtEvent(event) {
  if (!blueBgState.layers.length) return false;
  const point = blueBgPointerPosition(event);
  return selectedBlueBgLayers().some(layer => Boolean(blueBgHitHandle(layer, point))) ||
    [...blueBgState.layers].reverse().some(layer => blueBgPointInLayer(layer, point));
}

function blueBgStagePointerDown(event) {
  if (event.button > 0 || event.target.closest(".blue-bg-context-menu")) return;
  annotationState = bgAnnotationState;
  const multiKey = event.metaKey || event.ctrlKey;
  if (event.target === $("#blueBgStage")) {
    const hadSelection = blueBgState.selectedId !== null || blueBgState.selectedIds.length ||
      bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length;
    clearAllBgCanvasSelections();
    openBgBackgroundDialog();
    $("#blueBgStage").focus();
    if (hadSelection) blueBgStatus("已取消框选。");
    event.preventDefault();
    return;
  }
  if (blueBgState.toolMode !== "annotation" && selectedBlueBgHandleAtEvent(event)) {
    blueBgState.toolMode = "move";
    setBgInspectorMode("effects");
    blueBgPointerDown(event);
    return;
  }
  if (blueBgState.toolMode === "annotation" || bgAnnotationHitAtEvent(event)) {
    if (!multiKey) {
      blueBgState.selectedId = null;
      blueBgState.selectedIds = [];
      blueBgState.interaction = null;
      syncCanvasSelectionOverlays($("#blueBgStage"), blueBgCanvas(), $("#blueBgSelectionOverlay"), []);
    }
    if (blueBgState.toolMode !== "annotation") annotationState.mode = "view";
    setBgInspectorMode("annotation");
    annotationPointerDown(event);
    return;
  }
  const hadSelection = blueBgState.selectedId !== null || blueBgState.selectedIds.length ||
    bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length;
  if (!multiKey) clearBgAnnotationSelection();
  if (!blueBgLayerHitAtEvent(event)) {
    clearBlueBgSelection();
    $("#blueBgStage").focus();
    openBgBackgroundDialog();
    if (hadSelection) blueBgStatus("已取消框选。");
    return;
  }
  blueBgState.toolMode = "move";
  setBgInspectorMode("effects");
  blueBgPointerDown(event);
}

function blueBgStagePointerMove(event) {
  annotationState = bgAnnotationState;
  if (blueBgState.interaction ||
      (blueBgState.toolMode !== "annotation" && !bgAnnotationState.interaction && selectedBlueBgHandleAtEvent(event))) {
    blueBgPointerMove(event);
  } else if (bgAnnotationState.interaction || blueBgState.toolMode === "annotation" || bgAnnotationHitAtEvent(event)) {
    annotationPointerMove(event);
  } else {
    blueBgPointerMove(event);
  }
}

function blueBgStagePointerUp(event) {
  annotationState = bgAnnotationState;
  if (bgAnnotationState.interaction) annotationPointerUp(event);
  else blueBgPointerUp(event);
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
  showBlueBgContextMenuForLayer(layer, event.clientX, event.clientY);
}

function showBlueBgContextMenuForLayer(layer, clientX, clientY) {
  if (!layer) return;
  blueBgState.selectedId = layer.id;
  blueBgState.selectedIds = [];
  clearBgAnnotationSelection();
  blueBgState.toolMode = "move";
  setBgInspectorMode("effects");
  updateBlueBgControls();
  renderBlueBgCanvas();
  showBlueBgContextMenuForMaterial(layer.materialIndex, clientX, clientY);
}

function showBlueBgContextMenuForMaterial(materialIndex, clientX, clientY) {
  const material = bgMaterials[materialIndex];
  if (!material) return;
  bgContextMaterialIndex = materialIndex;
  const layer = blueBgState.layers.find(item => item.materialIndex === materialIndex);
  if (!layer) {
    clearAllBgCanvasSelections();
    blueBgState.toolMode = "background";
    setBgInspectorMode("background");
    updateBlueBgControls();
    renderBlueBgCanvas();
  }
  const menu = $("#blueBgContextMenu");
  const order = orderedBgMaterialIndexes();
  const position = order.indexOf(materialIndex);
  $("#blueBgMoveUp").disabled = position <= 0;
  $("#blueBgMoveDown").disabled = position < 0 || position === order.length - 1;
  $("#blueBgEditSelected").disabled = !material.file;
  menu.style.left = `${Math.min(clientX, window.innerWidth - 160)}px`;
  menu.style.top = `${Math.min(clientY, window.innerHeight - 174)}px`;
  menu.hidden = false;
}

function orderedBgMaterialIndexes() {
  return bgMaterials
    .map((material, index) => ({ material, index }))
    .sort((a, b) => (Number(b.material.stackOrder) || 0) - (Number(a.material.stackOrder) || 0))
    .map(item => item.index);
}

function normalizeBgMaterialStackOrder(order) {
  order.forEach((materialIndex, position) => {
    if (bgMaterials[materialIndex]) bgMaterials[materialIndex].stackOrder = order.length - position;
  });
  bgMaterialStackSequence = order.length + 1;
}

function syncBlueBgLayersToMaterialOrder() {
  const order = orderedBgMaterialIndexes();
  const layersByMaterial = new Map(
    blueBgState.layers
      .filter(layer => Number.isInteger(layer.materialIndex))
      .map(layer => [layer.materialIndex, layer])
  );
  const orderedLayers = order.map(index => layersByMaterial.get(index)).filter(Boolean).reverse();
  const orderedIds = new Set(orderedLayers.map(layer => layer.id));
  blueBgState.layers = [
    ...blueBgState.layers.filter(layer => !orderedIds.has(layer.id)),
    ...orderedLayers,
  ];
}

function applyBgMaterialOrder(order, selectedIndex, message = "已更新素材与前景图层级。") {
  normalizeBgMaterialStackOrder(order);
  syncBlueBgLayersToMaterialOrder();
  bgContextMaterialIndex = selectedIndex;
  const selectedLayer = blueBgState.layers.find(layer => layer.materialIndex === selectedIndex);
  if (selectedLayer) {
    blueBgState.selectedId = selectedLayer.id;
    blueBgState.selectedIds = [];
  }
  hideBlueBgContextMenu();
  updateBlueBgControls();
  renderBgMaterialList();
  renderBlueBgCanvas();
  pushBgHistory();
  blueBgStatus(message);
}

function moveContextBgMaterial(direction) {
  const order = orderedBgMaterialIndexes();
  const position = order.indexOf(bgContextMaterialIndex);
  const nextPosition = position + (direction > 0 ? -1 : 1);
  if (position < 0 || nextPosition < 0 || nextPosition >= order.length) return;
  [order[position], order[nextPosition]] = [order[nextPosition], order[position]];
  applyBgMaterialOrder(
    order,
    bgContextMaterialIndex,
    direction > 0 ? "所选素材已上移一层。" : "所选素材已下移一层。"
  );
}

function reorderBgMaterial(sourceIndex, targetIndex, placement) {
  if (sourceIndex === targetIndex) return;
  const order = orderedBgMaterialIndexes().filter(index => index !== sourceIndex);
  const targetPosition = order.indexOf(targetIndex);
  if (targetPosition < 0) return;
  order.splice(targetPosition + (placement === "after" ? 1 : 0), 0, sourceIndex);
  applyBgMaterialOrder(order, sourceIndex, "已按素材库顺序更新前景图层级。");
}

async function openSelectedBlueBgLayerInEditor() {
  const selectedLayer = selectedBlueBgLayer();
  const materialIndex = Number.isInteger(bgContextMaterialIndex)
    ? bgContextMaterialIndex
    : selectedLayer?.materialIndex;
  const material = Number.isInteger(materialIndex) ? bgMaterials[materialIndex] : null;
  if (!material?.file) return;
  const layer = blueBgState.layers.find(item => item.materialIndex === materialIndex) || null;
  hideBlueBgContextMenu();
  showTab("imageEditor");
  await loadImageEditorFile(material.file, { materialIndex, layerId: layer?.id ?? null });
  imageEditorStatus("已从美化 / 标注打开素材；编辑完成后按 Ctrl/⌘ S 同步回美化 / 标注。");
}

function deleteBgMaterialCompletely(materialIndex = bgContextMaterialIndex) {
  const material = bgMaterials[materialIndex];
  if (!material) return;
  // 历史记录仍会持有这一素材；保留对象 URL，确保撤销删除后预览可以恢复。
  if (material.renderTimer) window.clearTimeout(material.renderTimer);
  bgRenderControllers.get(material)?.abort();
  const removedLayerIds = new Set(
    blueBgState.layers.filter(layer => layer.materialIndex === materialIndex).map(layer => layer.id)
  );
  blueBgState.layers = blueBgState.layers.filter(layer => layer.materialIndex !== materialIndex);
  blueBgState.layers.forEach(layer => {
    if (Number.isInteger(layer.materialIndex) && layer.materialIndex > materialIndex) layer.materialIndex -= 1;
  });
  bgMaterials.splice(materialIndex, 1);
  normalizeBgMaterialStackOrder(orderedBgMaterialIndexes());
  if (imageEditorState.sourceBgMaterialIndex === materialIndex) {
    imageEditorState.sourceBgMaterialIndex = null;
    imageEditorState.sourceBgLayerId = null;
  } else if (imageEditorState.sourceBgMaterialIndex > materialIndex) {
    imageEditorState.sourceBgMaterialIndex -= 1;
  }
  if (removedLayerIds.has(blueBgState.selectedId) || blueBgState.selectedIds.some(id => removedLayerIds.has(id))) {
    clearAllBgCanvasSelections();
    openBgBackgroundDialog();
  }
  bgContextMaterialIndex = -1;
  hideBlueBgContextMenu();
  syncBgGeneratedResults();
  updateBlueBgControls();
  renderBgMaterialList();
  renderBlueBgCanvas();
  pushBgHistory();
  blueBgStatus("已从素材库和画布中删除该图片。");
}

async function syncImageEditorToBgMaterial() {
  const materialIndex = imageEditorState.sourceBgMaterialIndex;
  const material = Number.isInteger(materialIndex) ? bgMaterials[materialIndex] : null;
  if (!imageEditorState.hasImage || !material) {
    imageEditorStatus("当前图片不是从美化 / 标注打开的素材。");
    return false;
  }
  const blob = await new Promise(resolve => imageEditorState.documentCanvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("生成编辑结果失败，请重试。");
  const baseName = (material.file?.name || imageEditorState.sourceName || "image").replace(/\.[^.]+$/, "");
  const file = new File([blob], `${baseName}.png`, { type: "image/png" });
  const previewUrl = URL.createObjectURL(file);
  let image;
  try {
    image = await loadImageSource(previewUrl);
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
  const oldPreviewUrl = material.previewUrl;
  if (material.outputUrl) URL.revokeObjectURL(material.outputUrl);
  material.file = file;
  material.previewUrl = previewUrl;
  material.outputBlob = null;
  material.outputUrl = "";
  material.renderVersion = (material.renderVersion || 0) + 1;
  const fit = Math.min(
    blueBgCanvas().width * 0.68 / image.naturalWidth,
    blueBgCanvas().height * 0.72 / image.naturalHeight
  );
  blueBgState.layers
    .filter(layer => layer.materialIndex === materialIndex)
    .forEach(layer => {
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      const scale = layer.width / Math.max(1, layer.fitWidth);
      layer.image = image;
      layer.fileName = file.name;
      layer.previewUrl = previewUrl;
      layer.baseWidth = image.naturalWidth;
      layer.baseHeight = image.naturalHeight;
      layer.fitWidth = Math.max(80, image.naturalWidth * fit);
      layer.fitHeight = image.naturalHeight * fit;
      layer.aspect = image.naturalWidth / image.naturalHeight;
      layer.width = layer.fitWidth * scale;
      layer.height = layer.fitHeight * scale;
      layer.x = centerX - layer.width / 2;
      layer.y = centerY - layer.height / 2;
      layer.hasTransparentCorners = detectImageCornerRadius(image) > 0;
      clampBlueBgLayer(layer);
    });
  if (oldPreviewUrl) URL.revokeObjectURL(oldPreviewUrl);
  renderBgMaterialList();
  updateBlueBgControls();
  renderBlueBgCanvas();
  pushBgHistory();
  imageEditorStatus("已同步到美化 / 标注：素材预览和画布前景图均已更新。");
  return true;
}

function updateBlueBgLayerOptions() {
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
  layers.forEach(layer => {
    layer.shadow = $("#bgEffectShadow").checked;
    layer.round = $("#bgEffectRound").checked;
  });
  updateBlueBgControls();
  renderBlueBgCanvas();
}

function updateBlueBgLayerRadius() {
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
  const radius = Math.max(0, Math.min(128, Number($("#bgEffectRoundRadius").value) || 0));
  layers.forEach(layer => {
    layer.cornerRadius = radius;
    layer.cornerAuto = false;
  });
  updateBlueBgControls();
  renderBlueBgCanvas();
  blueBgStatus(`所选图片圆角 ${radius}px · 可继续拖动滑杆调整`);
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

function removeSelectedBlueBgLayers() {
  const deletedLayers = selectedBlueBgLayers();
  const ids = new Set(deletedLayers.map(layer => layer.id));
  if (!ids.size) return 0;
  blueBgState.layers = blueBgState.layers.filter(layer => !ids.has(layer.id));
  const remainingMaterialIndexes = new Set(
    blueBgState.layers.map(layer => layer.materialIndex).filter(index => Number.isInteger(index))
  );
  deletedLayers.forEach(layer => {
    const index = layer.materialIndex;
    if (Number.isInteger(index) && !remainingMaterialIndexes.has(index) && bgMaterials[index]) {
      bgMaterials[index].unused = true;
      bgMaterials[index].outputBlob = null;
      if (bgMaterials[index].outputUrl) {
        URL.revokeObjectURL(bgMaterials[index].outputUrl);
        bgMaterials[index].outputUrl = "";
      }
    }
  });
  syncBgGeneratedResults();
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  return ids.size;
}

function deleteBlueBgLayer() {
  const count = removeSelectedBlueBgLayers();
  if (!count) return;
  openBgBackgroundDialog();
  pushBgHistory();
  blueBgStatus(`已移除 ${count} 张画布前景图，素材库保留并标记为未使用 · 共 ${blueBgState.layers.length} 张图片`);
}

function deleteSelectedBgCanvasItems() {
  annotationState = bgAnnotationState;
  const annotationIds = new Set(selectedAnnotationItems().map(item => item.id));
  const layerCount = removeSelectedBlueBgLayers();
  if (annotationIds.size) {
    bgAnnotationState.items = bgAnnotationState.items.filter(item => !annotationIds.has(item.id));
  }
  if (!layerCount && !annotationIds.size) return false;
  clearAllBgCanvasSelections();
  blueBgState.toolMode = "background";
  openBgBackgroundDialog();
  updateBlueBgControls();
  renderBlueBgCanvas();
  pushBgHistory();
  const parts = [];
  if (layerCount) parts.push(`${layerCount} 张前景图`);
  if (annotationIds.size) parts.push(`${annotationIds.size} 个标注`);
  blueBgStatus(`已移除 ${parts.join("和")}；前景素材仍保留在素材库 · 共 ${blueBgState.layers.length} 张图片`);
  return true;
}

function blueBgKeyDown(event) {
  if (event.key.toLowerCase() === "v" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    event.stopPropagation();
    clearAllBgCanvasSelections();
    openBgBackgroundDialog();
    blueBgStatus("已切换至背景美化。");
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    if (deleteSelectedBgCanvasItems()) event.preventDefault();
    return;
  }
  if (blueBgState.toolMode === "annotation" || bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length) {
    annotationState = bgAnnotationState;
    annotationKeyDown(event);
    return;
  }
  const layers = selectedBlueBgLayers();
  if (!layers.length) return;
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
  return `${baseName}-小编工具箱.png`;
}

function cropCanvasToVisiblePixels(source) {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  let pixels;
  try {
    pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  } catch (error) {
    console.warn("无法读取透明像素边界，保留完整画布。", error);
    return source;
  }
  let left = source.width;
  let top = source.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (pixels[(y * source.width + x) * 4 + 3] === 0) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < left || bottom < top) return source;
  const width = right - left + 1;
  const height = bottom - top + 1;
  if (left === 0 && top === 0 && width === source.width && height === source.height) return source;
  const cropped = document.createElement("canvas");
  cropped.width = width;
  cropped.height = height;
  cropped.getContext("2d").drawImage(source, left, top, width, height, 0, 0, width, height);
  return cropped;
}

function composeBlueBgOutputCanvas() {
  const output = document.createElement("canvas");
  renderBlueBgCanvas(true, output);
  if (blueBgState.backgroundType === "transparent") {
    return canvasScaledToWidth(cropCanvasToVisiblePixels(output));
  }
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
    blueBgStatus(`已导出 ${output.width} × ${output.height}px 图片。`);
  }, "image/png");
}

function sendBgToAnnotation() {
  if (!blueBgState.layers.length) return;
  composeBlueBgOutputCanvas().toBlob(blob => {
    if (!blob) {
      blueBgStatus("生成失败，请重试。");
      return;
    }
    const baseName = (blueBgState.sourceName || "image").replace(/\.[^.]+$/, "");
    const file = new File([blob], `${baseName}-小编工具箱.png`, { type: "image/png" });
    showTab("annotation");
    loadAnnotationImage(file);
  }, "image/png");
}

function toggleBlueBgMode() {
  $("#bgBlueMode").checked = true;
  $("#bgPreview").hidden = true;
  $("#blueBgEditor").hidden = !blueBgState.canvasWidth;
  renderBgMaterialList();
  syncBgEffectToolbar();
  updateBgExportState();
}

function setBgMode(blueprint) {
  $("#bgBlueMode").checked = true;
  toggleBlueBgMode();
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
  bgContextMaterialIndex = -1;
  bgMaterialStackSequence = 0;
}

function setBgFiles(fileList) {
  const files = Array.from(fileList || []);
  clearBgMaterials();
  bgMaterials = files.map((file, index) => ({
    file,
    stackOrder: index + 1,
    previewUrl: URL.createObjectURL(file),
    scale: 90,
    shadow: true,
    round: true,
    unused: false,
    cornerRadius: SYSTEM_CORNER_RADIUS,
    cornerAuto: true,
    outputBlob: null,
    outputUrl: "",
    outputLabel: "",
    filename: "",
    renderVersion: 0,
    rendering: false,
    renderTimer: null,
  }));
  bgMaterialStackSequence = bgMaterials.length + 1;
  bgSelectedMaterialIndex = bgMaterials.length ? 0 : -1;
  bgSelectedMaterialIndices = [];
  bgGeneratedResults = [];
  blueBgState.layers = [];
  blueBgState.selectedId = null;
  blueBgState.selectedIds = [];
  bgAnnotationState.items = [];
  bgAnnotationState.selectedId = null;
  bgAnnotationState.selectedIds = [];
  bgAnnotationState.selectedPart = null;
  bgAnnotationState.nextId = 1;
  bgAnnotationState.nextNumber = 1;
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
      stackOrder: bgMaterialStackSequence++,
      previewUrl: URL.createObjectURL(file),
      scale: 90,
      shadow: true,
      round: true,
      unused: false,
      cornerRadius: SYSTEM_CORNER_RADIUS,
      cornerAuto: true,
      outputBlob: null,
      outputUrl: "",
      outputLabel: "",
      filename: "",
      renderVersion: 0,
      rendering: false,
      renderTimer: null,
    })));
    await ensureUnifiedBgBackground(blueBgState.layers[0]?.image || null);
    await addBlueBgFiles(accepted);
    return;
  }
  setBgFiles(files);
}

function clipboardImageFiles(event) {
  const items = Array.from(event.clipboardData?.items || []);
  return items
    .filter(item => item.kind === "file" && item.type.startsWith("image/"))
    .map((item, index) => item.getAsFile?.())
    .filter(Boolean)
    .map((file, index) => {
      if (file.name) return file;
      const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      return new File([file], `粘贴图片-${Date.now()}-${index + 1}.${extension}`, { type: file.type });
    });
}

async function importClipboardImageIntoActiveModule(event) {
  const moduleId = activeImageModuleId();
  if (!moduleId) return false;
  const target = event.target;
  if (target?.matches?.(
    'textarea, select, [contenteditable="true"], input:not([type="file"]):not([type="button"]):not([type="checkbox"])'
  )) return false;
  const files = clipboardImageFiles(event);
  if (!files.length) return false;
  event.preventDefault();
  try {
    if (moduleId === "bg") {
      if ($("#bgBlueMode").checked) {
        await importBgFiles(files);
      } else if (bgMaterials.length) {
        setBgFiles([...bgMaterials.map(material => material.file), ...files]);
      } else {
        setBgFiles(files);
      }
      return true;
    }
    if (moduleId === "annotation") {
      loadAnnotationImage(files[0]);
      return true;
    }
    if (moduleId === "imageEditor") {
      await loadImageEditorFile(files[0]);
      return true;
    }
  } catch (error) {
    const message = error?.message || "剪贴板图片导入失败，请重试。";
    if (moduleId === "bg") {
      if ($("#bgBlueMode").checked) blueBgStatus(message);
    } else if (moduleId === "annotation") {
      annotationStatusText(message);
    } else {
      imageEditorStatus(message);
    }
  }
  return false;
}

function openBgMaterialInspector(index) {
  const material = bgMaterials[index];
  if (!material || $("#bgBlueMode").checked) return;
  if (material.unused) {
    material.unused = false;
    material.outputBlob = null;
    scheduleDefaultBgMaterialRender(index);
  }
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
  if (bgMaterials[index].unused) {
    bgMaterials[index].unused = false;
    bgMaterials[index].outputBlob = null;
    scheduleDefaultBgMaterialRender(index);
  }
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
  syncBgEffectToolbar();
  syncBgGeneratedResults();
}

function saveBgMaterialCornerRadius() {
  const indexes = selectedDefaultBgMaterialIndexes();
  if (!indexes.length || $("#bgBlueMode").checked) return;
  const radius = Math.max(0, Math.min(128, Number($("#bgEffectRoundRadius").value) || 0));
  indexes.forEach(index => {
    const material = bgMaterials[index];
    material.cornerRadius = radius;
    material.cornerAuto = false;
    material.outputBlob = null;
    scheduleDefaultBgMaterialRender(index);
  });
  $("#bgEffectRoundRadiusValue").textContent = `${radius} px`;
  syncBgEffectToolbar();
  syncBgGeneratedResults();
}

function renderBgMaterialList() {
  const wrap = $("#bgMaterialList");
  if (!wrap) return;
  $("#bgPreview").hidden = true;
  const scroller = wrap.closest(".bg-material-pane");
  const scrollTop = scroller?.scrollTop || 0;
  wrap.innerHTML = "";
  const displayIndexes = orderedBgMaterialIndexes();
  displayIndexes.forEach(index => {
    const material = bgMaterials[index];
    const layer = blueBgState.layers.find(item => item.materialIndex === index);
    const selected = layer && selectedBlueBgLayers().some(item => item.id === layer.id);
    const card = document.createElement("div");
    card.className = `bg-material-card${selected ? " active" : ""}${material.unused ? " is-unused" : ""}`;
    card.dataset.bgMaterialIndex = String(index);
    if (layer) {
      card.dataset.bgLayerId = String(layer.id);
    }
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `选择素材 ${material.file.name}${material.unused ? "（未使用）" : ""}`);
    const preview = document.createElement("div");
    preview.className = "bg-material-preview";
    const img = document.createElement("img");
    img.src = material.previewUrl;
    img.alt = "";
    img.draggable = false;
    preview.appendChild(img);
    card.appendChild(preview);
    if (material.unused) {
      const badge = document.createElement("span");
      badge.className = "bg-material-unused-badge";
      badge.textContent = "未使用";
      card.appendChild(badge);
    }
    wrap.appendChild(card);
  });
  const importButton = $("#bgImportButton");
  importButton.disabled = blueBgState.layers.length >= BLUE_BG_MAX_LAYERS;
  importButton.title = importButton.disabled
    ? `最多可导入 ${BLUE_BG_MAX_LAYERS} 张图片`
    : "导入图片 (I / Ctrl/⌘ V)";
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
  if ($("#bgBlueMode").checked) deleteSelectedBgCanvasItems();
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
  $("#bgExportButton").disabled = !blueBgState.layers.length;
  $("#bgUndo").disabled = bgHistoryIndex <= 0;
  $("#bgRedo").disabled = bgHistoryIndex < 0 || bgHistoryIndex >= bgHistory.length - 1;
}

function captureBgHistoryState() {
  return {
    materials: bgMaterials.map(material => ({ ...material, renderTimer: null })),
    layers: blueBgState.layers.map(layer => ({ ...layer })),
    background: {
      type: blueBgState.backgroundType,
      color: blueBgState.backgroundColor,
      gradient: blueBgState.backgroundGradient,
      imageUrl: blueBgState.backgroundImageUrl,
      imageName: blueBgState.backgroundImageName,
      aspectMode: blueBgState.aspectMode,
      defaultAspect: blueBgState.defaultAspect,
    },
    selectedId: blueBgState.selectedId,
    selectedIds: [...blueBgState.selectedIds],
    selectedMaterialIndex: bgSelectedMaterialIndex,
    selectedMaterialIndices: [...bgSelectedMaterialIndices],
    annotations: {
      items: bgAnnotationState.items.map(item => ({ ...item })),
      nextId: bgAnnotationState.nextId,
      nextNumber: bgAnnotationState.nextNumber,
      numberSize: bgAnnotationState.numberSize,
      numberColor: bgAnnotationState.numberColor,
      blurStrength: bgAnnotationState.blurStrength,
      maskColor: bgAnnotationState.maskColor,
      maskRound: bgAnnotationState.maskRound,
      maskRoundRadius: bgAnnotationState.maskRoundRadius,
      magnifierColor: bgAnnotationState.magnifierColor,
      magnifierWidth: bgAnnotationState.magnifierWidth,
      shadows: { ...bgAnnotationState.shadows },
    },
  };
}

function pushBgHistory() {
  const snapshot = captureBgHistoryState();
  const signature = JSON.stringify({
    materials: snapshot.materials.map(material => ({
      name: material.file?.name,
      stackOrder: material.stackOrder,
      scale: material.scale,
      shadow: material.shadow,
      round: material.round,
      cornerRadius: material.cornerRadius,
      cornerAuto: material.cornerAuto,
      unused: material.unused,
    })),
    layers: snapshot.layers.map(layer => ({
      id: layer.id, materialIndex: layer.materialIndex, x: layer.x, y: layer.y, width: layer.width, height: layer.height,
      shadow: layer.shadow, round: layer.round,
      cornerRadius: layer.cornerRadius,
      cornerAuto: layer.cornerAuto,
      unused: layer.unused,
    })),
    selectedId: snapshot.selectedId,
    selectedIds: snapshot.selectedIds,
    selectedMaterialIndex: snapshot.selectedMaterialIndex,
    selectedMaterialIndices: snapshot.selectedMaterialIndices,
    background: snapshot.background,
    annotations: snapshot.annotations,
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
  bgMaterialStackSequence = Math.max(0, ...bgMaterials.map(material => Number(material.stackOrder) || 0)) + 1;
  bgContextMaterialIndex = -1;
  bgSelectedMaterialIndex = Math.min(entry.snapshot.selectedMaterialIndex ?? bgSelectedMaterialIndex, bgMaterials.length - 1);
  bgSelectedMaterialIndices = (entry.snapshot.selectedMaterialIndices || []).filter(index => index < bgMaterials.length);
  blueBgState.layers = entry.snapshot.layers.map(layer => ({ ...layer }));
  blueBgState.selectedId = entry.snapshot.selectedId;
  blueBgState.selectedIds = (entry.snapshot.selectedIds || []).filter(id => blueBgState.layers.some(layer => layer.id === id));
  const annotations = entry.snapshot.annotations || {};
  bgAnnotationState.items = (annotations.items || []).map(item => ({ ...item }));
  bgAnnotationState.nextId = annotations.nextId || Math.max(0, ...bgAnnotationState.items.map(item => item.id)) + 1;
  bgAnnotationState.nextNumber = annotations.nextNumber || Math.max(
    0, ...bgAnnotationState.items.filter(item => item.type === "number").map(item => item.number)
  ) + 1;
  bgAnnotationState.numberSize = annotations.numberSize || ANNOTATION_NUMBER_SIZE;
  bgAnnotationState.numberColor = annotations.numberColor || "#ff5a52";
  bgAnnotationState.blurStrength = annotations.blurStrength || 16;
  bgAnnotationState.maskColor = annotations.maskColor || "#98b2c0";
  bgAnnotationState.maskRound = Boolean(annotations.maskRound);
  bgAnnotationState.maskRoundRadius = annotations.maskRoundRadius || 16;
  bgAnnotationState.magnifierColor = annotations.magnifierColor || ANNOTATION_MAGNIFIER_COLOR;
  bgAnnotationState.magnifierWidth = annotations.magnifierWidth || ANNOTATION_MAGNIFIER_LINE_WIDTH;
  bgAnnotationState.shadows = {
    number: false,
    mask: false,
    blur: false,
    magnifier: false,
    ...(annotations.shadows || {}),
  };
  clearBgAnnotationSelection();
  if (entry.snapshot.background) {
    const background = entry.snapshot.background;
    blueBgState.backgroundType = background.type || "lizhi";
    blueBgState.backgroundColor = background.color || BG_DEFAULT_COLOR;
    blueBgState.backgroundGradient = background.gradient || BG_GRADIENT_PRESETS[0].id;
    blueBgState.backgroundImageUrl = background.imageUrl || "";
    blueBgState.backgroundImageName = background.imageName || "";
    blueBgState.backgroundImage = null;
    blueBgState.aspectMode = background.aspectMode || "default";
    blueBgState.defaultAspect = background.defaultAspect || blueBgState.defaultAspect;
  }
  renderBgMaterialList();
  if ($("#bgBlueMode").checked) {
    ensureUnifiedBgBackground(blueBgState.layers[0]?.image || null).then(() => {
      updateBlueBgControls();
      renderBlueBgCanvas();
      resetBlueBgZoom();
    }).catch(err => blueBgStatus(err.message));
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
    card.className = `bg-preview-card${selectedDefaultBgMaterialIndexes().includes(index) ? " active" : ""}${material.unused ? " is-unused" : ""}`;
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
    if (material.unused) {
      const badge = document.createElement("span");
      badge.className = "bg-material-unused-badge";
      badge.textContent = "未使用";
      card.appendChild(badge);
    }
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
    const form = new FormData();
    form.append("image", file);
    form.append("scale", scale);
    form.append("shadow", shadow ? "1" : "0");
    form.append("round", round ? "1" : "0");
    form.append("cornerMode", material.cornerAuto === false ? "manual" : "auto");
    if (material.cornerAuto === false) form.append("cornerRadius", material.cornerRadius);
    const res = await fetch("/api/render-bg", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(await res.text());
    const mode = res.headers.get("X-Lizhi-Bg-Mode") || "manual";
    const appliedShadow = res.headers.get("X-Lizhi-Bg-Shadow") === "1";
    const appliedRound = res.headers.get("X-Lizhi-Bg-Round") === "1";
    const blob = await res.blob();
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
  $("#imageEditorCanvasZoom").disabled = !hasImage;
  const stage = $("#imageEditorStage");
  stage.dataset.mode = imageEditorState.mode;
  stage.classList.toggle("has-selection", hasSelection || Boolean(imageEditorState.gradient));
  syncImageEditorOverlays();
}

function intersectImageEditorSelection(selection = imageEditorState.selection) {
  if (!selection) return null;
  const source = imageEditorState.documentCanvas;
  const bounds = imageEditorSelectionVisualBounds(selection);
  const left = Math.max(0, bounds.x);
  const top = Math.max(0, bounds.y);
  const right = Math.min(source.width, bounds.x + bounds.width);
  const bottom = Math.min(source.height, bounds.y + bounds.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function imageEditorRemovalIsHorizontal(selection = imageEditorState.selection) {
  if (!selection) return true;
  const source = imageEditorState.documentCanvas;
  return selection.width / Math.max(1, source.width) >=
    selection.height / Math.max(1, source.height);
}

function imageEditorSelectionVisualBounds(selection) {
  const skew = Number(selection?.skew) || 0;
  if (!selection || !skew) return selection ? { ...selection } : null;
  if (imageEditorRemovalIsHorizontal(selection)) {
    return {
      x: selection.x,
      y: selection.y + Math.min(0, skew),
      width: selection.width,
      height: selection.height + Math.abs(skew),
    };
  }
  return {
    x: selection.x + Math.min(0, skew),
    y: selection.y,
    width: selection.width + Math.abs(skew),
    height: selection.height,
  };
}

function imageEditorSelectionPolygon(selection) {
  const skew = Number(selection?.skew) || 0;
  const x = selection.x;
  const y = selection.y;
  const right = x + selection.width;
  const bottom = y + selection.height;
  return imageEditorRemovalIsHorizontal(selection)
    ? [
        { x, y },
        { x: right, y: y + skew },
        { x: right, y: bottom + skew },
        { x, y: bottom },
      ]
    : [
        { x, y },
        { x: right, y },
        { x: right + skew, y: bottom },
        { x: x + skew, y: bottom },
      ];
}

function pointInImageEditorSelection(selection, point) {
  const polygon = imageEditorState.mode === "remove"
    ? imageEditorSelectionPolygon(selection)
    : [
        { x: selection.x, y: selection.y },
        { x: selection.x + selection.width, y: selection.y },
        { x: selection.x + selection.width, y: selection.y + selection.height },
        { x: selection.x, y: selection.y + selection.height },
      ];
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y) &&
      point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function drawImageEditorSelection(ctx) {
  const selection = imageEditorState.selection;
  if (!selection) return;
  const overlap = intersectImageEditorSelection(selection);
  ctx.save();
  if (imageEditorState.mode === "remove" && overlap) {
    ctx.fillStyle = "rgba(239, 68, 68, .28)";
    const polygon = imageEditorSelectionPolygon(selection);
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    polygon.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();
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
    ["create", "adjust", "shear", "move-selection"].includes(imageEditorState.interaction?.mode)
  );
  if (selection) {
    syncCanvasSelectionOverlay(
      $("#imageEditorStage"),
      imageEditorCanvas(),
      selectionOverlay,
      selection
    );
    const horizontalShear = imageEditorState.mode === "remove" && imageEditorRemovalIsHorizontal(selection);
    const skew = imageEditorState.mode === "remove" ? Number(selection.skew) || 0 : 0;
    const canvasRect = imageEditorCanvas().getBoundingClientRect();
    const displaySkew = horizontalShear
      ? skew * canvasRect.height / Math.max(1, imageEditorCanvas().height)
      : skew * canvasRect.width / Math.max(1, imageEditorCanvas().width);
    const displaySpan = horizontalShear
      ? selection.width * canvasRect.width / Math.max(1, imageEditorCanvas().width)
      : selection.height * canvasRect.height / Math.max(1, imageEditorCanvas().height);
    const shearAngle = Math.atan2(displaySkew, Math.max(1, displaySpan));
    selectionOverlay.style.transformOrigin = "0 0";
    selectionOverlay.style.transform = skew
      ? `${horizontalShear ? "skewY" : "skewX"}(${shearAngle}rad)`
      : "";
    selectionOverlay.style.setProperty(
      "--selection-counter-transform",
      skew ? `${horizontalShear ? "skewY" : "skewX"}(${-shearAngle}rad)` : "none"
    );
    selectionOverlay.classList.toggle("is-shear-y", horizontalShear);
    selectionOverlay.classList.toggle("is-shear-x", !horizontalShear && imageEditorState.mode === "remove");
  } else {
    selectionOverlay.style.transform = "";
    selectionOverlay.style.removeProperty("--selection-counter-transform");
    selectionOverlay.classList.remove("is-shear-y", "is-shear-x");
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
  imageEditorState.zoom = Math.max(0.5, Math.min(20, zoom));
  canvas.style.width = `${imageEditorState.baseDisplayWidth * imageEditorState.zoom}px`;
  canvas.style.height = `${imageEditorState.baseDisplayHeight * imageEditorState.zoom}px`;
  canvas.style.imageRendering = imageEditorState.zoom >= 4 ? "pixelated" : "auto";
  $("#imageEditorStage").classList.toggle("at-base-zoom", imageEditorState.zoom <= 1.001);
  const zoomPercent = Math.round(imageEditorState.zoom * 100);
  $("#imageEditorCanvasZoom").value = String(zoomPercent);
  $("#imageEditorCanvasZoomValue").textContent = `${zoomPercent}%`;
  requestAnimationFrame(syncImageEditorOverlays);
}

function resetImageEditorZoom() {
  const canvas = imageEditorCanvas();
  imageEditorState.zoom = 1;
  $("#imageEditorCanvasZoom").value = "100";
  $("#imageEditorCanvasZoomValue").textContent = "100%";
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

async function loadImageEditorFile(file, sourceBg = null) {
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
    imageEditorState.sourceBgMaterialIndex = sourceBg?.materialIndex ?? null;
    imageEditorState.sourceBgLayerId = sourceBg?.layerId ?? null;
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
    ? "区段删除：框选后拖动短边可斜切删除区域；接近矩形时会自动吸附。"
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
      const horizontalRemoval = imageEditorState.mode === "remove" &&
        imageEditorRemovalIsHorizontal(imageEditorState.selection);
      const shearHandle = imageEditorState.mode === "remove" && (
        (horizontalRemoval && ["e", "w"].includes(handle)) ||
        (!horizontalRemoval && ["n", "s"].includes(handle))
      );
      imageEditorState.interaction = {
        mode: shearHandle ? "shear" : "adjust",
        handle,
        start: point,
        original: { ...imageEditorState.selection },
        snappedToRectangle: false,
      };
    } else if (imageEditorState.selection) {
      if (!pointInImageEditorSelection(imageEditorState.selection, point)) {
        cancelImageEditorSelection();
        $("#imageEditorStage").focus();
        event.preventDefault();
        return;
      }
      imageEditorState.interaction = {
        mode: "move-selection",
        start: point,
        original: { ...imageEditorState.selection },
      };
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
  return {
    ...resizeBoundsWithModifiers(interaction.original, interaction.handle, point, {
    preserveAspect: event.shiftKey,
    centered: event.altKey || event.ctrlKey,
    }),
    skew: Number(interaction.original.skew) || 0,
  };
}

function shearImageEditorSelection(interaction, point) {
  const original = interaction.original;
  const horizontal = imageEditorRemovalIsHorizontal(original);
  const canvas = imageEditorCanvas();
  const rect = canvas.getBoundingClientRect();
  const tolerance = horizontal
    ? 10 * canvas.height / Math.max(1, rect.height)
    : 10 * canvas.width / Math.max(1, rect.width);
  const delta = horizontal ? point.y - interaction.start.y : point.x - interaction.start.x;
  let selection = { ...original };
  if (horizontal) {
    if (interaction.handle === "e") {
      selection.skew = (Number(original.skew) || 0) + delta;
    } else {
      selection.y = original.y + delta;
      selection.skew = (Number(original.skew) || 0) - delta;
    }
  } else if (interaction.handle === "s") {
    selection.skew = (Number(original.skew) || 0) + delta;
  } else {
    selection.x = original.x + delta;
    selection.skew = (Number(original.skew) || 0) - delta;
  }
  interaction.snappedToRectangle = Math.abs(selection.skew) <= tolerance;
  if (interaction.snappedToRectangle) selection.skew = 0;
  return selection;
}

function imageEditorPointerMove(event) {
  if (!imageEditorState.interaction) {
    const selection = imageEditorState.selection;
    if (selection && ["remove", "crop"].includes(imageEditorState.mode)) {
      const point = imageEditorPointerPosition(event);
      const inside = pointInImageEditorSelection(selection, point);
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
    const canvas = imageEditorCanvas();
    const frame = selectionFrameBounds(canvas, moved);
    const snapped = snapBoundsToCanvas(frame, canvas, 10, true);
    imageEditorState.selection = {
      ...moved,
      x: moved.x + snapped.x - frame.x,
      y: moved.y + snapped.y - frame.y,
    };
    imageEditorState.snapGuides = snapped.guides;
  } else if (interaction.mode === "shear") {
    imageEditorState.selection = shearImageEditorSelection(interaction, point);
    imageEditorState.snapGuides = emptySnapGuides();
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
  const snappedToRectangle = interaction.mode === "shear" && interaction.snappedToRectangle;
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
    ? (imageEditorRemovalIsHorizontal(selection)
      ? "上下拼合"
      : "左右拼合")
    : "";
  imageEditorStatus(
    imageEditorState.mode === "remove"
      ? `有效删除区域 ${dimensions} · 将自动${direction}${snapped ? " · 已吸附到边缘" : ""}${snappedToRectangle ? " · 已吸附回矩形" : ""}。`
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

function applyShearedImageEditorRemoval(source, selection, horizontal) {
  const result = document.createElement("canvas");
  const skew = Number(selection.skew) || 0;
  if (horizontal) {
    const removed = Math.max(2, Math.min(source.height - 1, Math.round(selection.height)));
    result.width = source.width;
    result.height = source.height - removed;
    const out = result.getContext("2d");
    for (let x = 0; x < source.width; x++) {
      const progress = (x - selection.x) / Math.max(1, selection.width);
      const start = Math.max(0, Math.min(source.height - removed, Math.round(selection.y + skew * progress)));
      if (start > 0) out.drawImage(source, x, 0, 1, start, x, 0, 1, start);
      const bottom = source.height - start - removed;
      if (bottom > 0) {
        out.drawImage(source, x, start + removed, 1, bottom, x, start, 1, bottom);
      }
    }
    return result;
  }
  const removed = Math.max(2, Math.min(source.width - 1, Math.round(selection.width)));
  result.width = source.width - removed;
  result.height = source.height;
  const out = result.getContext("2d");
  for (let y = 0; y < source.height; y++) {
    const progress = (y - selection.y) / Math.max(1, selection.height);
    const start = Math.max(0, Math.min(source.width - removed, Math.round(selection.x + skew * progress)));
    if (start > 0) out.drawImage(source, 0, y, start, 1, 0, y, start, 1);
    const right = source.width - start - removed;
    if (right > 0) {
      out.drawImage(source, start + removed, y, right, 1, start, y, right, 1);
    }
  }
  return result;
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
    const horizontal = imageEditorRemovalIsHorizontal(selection);
    if (Math.abs(Number(selection.skew) || 0) >= 0.5) {
      result = applyShearedImageEditorRemoval(source, selection, imageEditorRemovalIsHorizontal(selection));
    } else if (horizontal) {
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
  return annotationState.host === "bg" ? $("#bgAnnotationCanvas") : $("#annotationCanvas");
}

function annotationContext() {
  return annotationCanvas().getContext("2d");
}

function annotationStage() {
  return annotationState.host === "bg" ? $("#blueBgStage") : $("#annotationStage");
}

function annotationSelectionOverlay() {
  return annotationState.host === "bg"
    ? $("#bgAnnotationSelectionOverlay")
    : $("#annotationSelectionOverlay");
}

function annotationControl(name) {
  if (annotationState.host !== "bg") return $(`#annotation${name}`);
  return $(`#bgAnnotation${name}`);
}

function setAnnotationCursor(cursor) {
  annotationCanvas().style.cursor = cursor;
  annotationStage().style.cursor = cursor;
}

function pushAnnotationHistory() {
  if (annotationState.host === "bg") {
    pushBgHistory();
    updateBgAnnotationControls();
    return;
  }
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
  annotationState.selectedPart = annotationState.items.at(-1)?.type === "magnifier" ? "lens" : null;
  annotationState.nextId = Math.max(0, ...annotationState.items.map(item => item.id)) + 1;
  annotationState.nextNumber = Math.max(0, ...annotationState.items.filter(item => item.type === "number").map(item => item.number)) + 1;
  annotationState.numberSize = annotationState.items.find(item => item.type === "number")?.size ?? ANNOTATION_NUMBER_SIZE;
  annotationState.editingNumberId = null;
  updateAnnotationControls();
  renderAnnotationCanvas();
  annotationStatusText(`已恢复历史步骤 ${index + 1} · 共 ${annotationState.items.length} 个标注`);
}

function updateAnnotationControls() {
  if (annotationState.host === "bg") {
    updateBgAnnotationControls();
    return;
  }
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
  const numberControls = $("#annotationNumberControls");
  const showNumberControls = selected?.type === "number" && annotationState.editingNumberId === null;
  numberControls.hidden = !showNumberControls;
  if (showNumberControls) {
    const size = annotationNumberSize(selected);
    $("#annotationNumberSize").value = String(size);
    $("#annotationNumberSizeValue").textContent = `${size}px`;
  }
  $("#annotationNumberEditor").hidden = annotationState.editingNumberId === null;
}

function updateBgAnnotationControls() {
  const hasImage = blueBgState.layers.length > 0;
  const selectedItems = selectedAnnotationItems();
  const selected = selectedItems.length === 1 ? selectedItems[0] : null;
  const annotationActive = blueBgState.toolMode === "annotation";
  const creationType = ["mask", "blur", "number", "magnifier"].includes(annotationState.mode)
    ? annotationState.mode
    : null;
  const displayType = selected?.type || (annotationActive ? creationType : null);
  [
    ["#bgAddAnnotationNumber", "number"],
    ["#bgAddAnnotationMask", "mask"],
    ["#bgAddAnnotationBlur", "blur"],
    ["#bgAddAnnotationMagnifier", "magnifier"],
  ].forEach(([selector, mode]) => {
    const button = $(selector);
    button.disabled = !hasImage;
    button.classList.toggle("active", annotationActive && annotationState.mode === mode);
  });
  if (blueBgState.inspectorMode === "annotation" && !displayType) {
    const hasSelectedLayer = selectedBlueBgLayers().length > 0;
    blueBgState.toolMode = hasSelectedLayer ? "move" : "background";
    setBgInspectorMode(hasSelectedLayer ? "effects" : "background");
    return;
  }
  const inspector = $("#bgAnnotationInspector");
  const showInspector = blueBgState.inspectorMode === "annotation";
  inspector.hidden = !showInspector;
  const maskControls = $("#bgAnnotationMaskControls");
  const blurControls = $("#bgAnnotationBlurControls");
  const numberControls = $("#bgAnnotationNumberControls");
  const magnifierControls = $("#bgAnnotationMagnifierControls");
  maskControls.hidden = displayType !== "mask";
  blurControls.hidden = displayType !== "blur";
  numberControls.hidden = displayType !== "number";
  magnifierControls.hidden = displayType !== "magnifier";
  const maskColor = selected?.type === "mask"
    ? selected.color || "#98b2c0"
    : annotationState.maskColor || "#98b2c0";
  syncBgAnnotationColorTiles("mask", maskColor);
  const maskShadow = selected?.type === "mask" ? Boolean(selected.shadow) : Boolean(annotationState.shadows.mask);
  const maskRound = selected?.type === "mask" ? Boolean(selected.round) : Boolean(annotationState.maskRound);
  const maskRadius = selected?.type === "mask"
    ? Number(selected.cornerRadius) || 16
    : annotationState.maskRoundRadius || 16;
  $("#bgAnnotationMaskShadow").checked = maskShadow;
  $("#bgAnnotationMaskRound").checked = maskRound;
  $("#bgAnnotationMaskRoundRadius").disabled = !maskRound;
  $("#bgAnnotationMaskRoundRadius").value = String(maskRadius);
  $("#bgAnnotationMaskRoundRadiusValue").textContent = `${maskRadius} px`;
  if (displayType === "blur") {
    const strength = selected?.type === "blur" ? selected.strength : annotationState.blurStrength;
    $("#bgAnnotationBlurStrength").value = String(strength);
    $("#bgAnnotationBlurStrengthValue").textContent = `${strength}px`;
    $("#bgAnnotationBlurShadow").checked = selected?.type === "blur"
      ? Boolean(selected.shadow)
      : Boolean(annotationState.shadows.blur);
  }
  if (displayType === "number") {
    const size = selected?.type === "number" ? annotationNumberSize(selected) : annotationState.numberSize;
    const color = selected?.type === "number" ? selected.color || "#ff5a52" : annotationState.numberColor;
    $("#bgAnnotationNumberSize").value = String(size);
    $("#bgAnnotationNumberSizeValue").textContent = `${size}px`;
    $("#bgAnnotationNumberShadow").checked = selected?.type === "number"
      ? Boolean(selected.shadow)
      : Boolean(annotationState.shadows.number);
    syncBgAnnotationColorTiles("number", color);
  }
  if (displayType === "magnifier") {
    const color = selected?.type === "magnifier" ? selected.color : annotationState.magnifierColor;
    const width = selected?.type === "magnifier" ? selected.lineWidth : annotationState.magnifierWidth;
    $("#bgAnnotationMagnifierWidth").value = String(width);
    $("#bgAnnotationMagnifierWidthValue").textContent = `${width}px`;
    $("#bgAnnotationMagnifierShadow").checked = selected?.type === "magnifier"
      ? Boolean(selected.shadow)
      : Boolean(annotationState.shadows.magnifier);
    syncBgAnnotationColorTiles("magnifier", color);
  }
  $("#bgDeleteSelected").disabled = !selectedItems.length && !selectedBlueBgLayers().length;
}

function syncBgAnnotationColorTiles(kind, color) {
  const normalized = String(color || "").toLowerCase();
  const buttons = $$(`[data-annotation-color-kind="${kind}"]`, $("#bgAnnotationInspector"));
  const matchingPreset = buttons.find(button => button.dataset.annotationColor.toLowerCase() === normalized);
  buttons.forEach(button => {
    button.classList.toggle("active", button === matchingPreset);
  });
  const inputId = {
    mask: "#bgAnnotationMaskColor",
    number: "#bgAnnotationNumberColor",
    magnifier: "#bgAnnotationMagnifierColor",
  }[kind];
  const custom = $(inputId)?.closest(".bg-annotation-custom-color");
  if (custom) {
    custom.classList.toggle("active", !matchingPreset && storedBgAnnotationCustomColor(kind) === normalized);
  }
}

function storedBgAnnotationCustomColor(kind) {
  const config = BG_ANNOTATION_CUSTOM_COLORS[kind];
  if (!config) return "";
  return String(localStorage.getItem(config.key) || config.fallback).toLowerCase();
}

function syncBgAnnotationCustomColorTile(kind) {
  const config = BG_ANNOTATION_CUSTOM_COLORS[kind];
  if (!config) return;
  const input = $(config.input);
  const custom = input?.closest(".bg-annotation-custom-color");
  const preview = custom?.querySelector(".bg-annotation-color-preview");
  const color = storedBgAnnotationCustomColor(kind);
  if (input) input.value = color;
  if (preview) preview.style.setProperty("--swatch", color);
}

function initializeBgAnnotationCustomColors() {
  Object.keys(BG_ANNOTATION_CUSTOM_COLORS).forEach(syncBgAnnotationCustomColorTile);
  $$(".bg-annotation-color-grid > button, .bg-annotation-custom-select").forEach(button => {
    const label = button.querySelector("strong")?.textContent?.trim();
    if (!label) return;
    if (!button.title) button.title = label;
    if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", label);
  });
}

function saveBgAnnotationCustomColor(kind, color) {
  const config = BG_ANNOTATION_CUSTOM_COLORS[kind];
  if (!config) return;
  const normalized = String(color || config.fallback).toLowerCase();
  localStorage.setItem(config.key, normalized);
  syncBgAnnotationCustomColorTile(kind);
  updateBgAnnotationColor(kind, normalized);
}

function annotationStatusText(message) {
  if (annotationState.host === "bg") blueBgStatus(message);
  else $("#annotationStatus").textContent = message;
}

function annotationItemBounds(item) {
  if (item.type === "number") {
    const size = annotationNumberSize(item);
    return expandAnnotationBoundsForShadow(item, {
      x: item.x - size / 2,
      y: item.y - size / 2,
      width: size,
      height: size,
    });
  }
  if (item.type === "magnifier") {
    const left = Math.min(
      magnifierVisualBounds(item, "source").x,
      magnifierVisualBounds(item, "lens").x
    );
    const top = Math.min(
      magnifierVisualBounds(item, "source").y,
      magnifierVisualBounds(item, "lens").y
    );
    const right = Math.max(
      magnifierVisualBounds(item, "source").x + magnifierVisualBounds(item, "source").width,
      magnifierVisualBounds(item, "lens").x + magnifierVisualBounds(item, "lens").width
    );
    const bottom = Math.max(
      magnifierVisualBounds(item, "source").y + magnifierVisualBounds(item, "source").height,
      magnifierVisualBounds(item, "lens").y + magnifierVisualBounds(item, "lens").height
    );
    return expandAnnotationBoundsForShadow(item, { x: left, y: top, width: right - left, height: bottom - top });
  }
  return expandAnnotationBoundsForShadow(item, { x: item.x, y: item.y, width: item.width, height: item.height });
}

function annotationShadowOutset(item) {
  return item?.shadow ? 30 : 0;
}

function expandAnnotationBoundsForShadow(item, bounds) {
  const outset = annotationShadowOutset(item);
  return {
    x: bounds.x - outset,
    y: bounds.y - outset,
    width: bounds.width + outset * 2,
    height: bounds.height + outset * 2,
  };
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
    .flatMap(item => {
      if (item.type !== "magnifier") return [{ id: item.id, bounds: annotationItemBounds(item) }];
      return selectedMagnifierParts(item).map(part => ({
        id: `${item.id}-${part}`,
        bounds: magnifierPartBounds(item, part),
      }));
    })
    .sort((a, b) => Number(b.id === annotationState.selectedId) - Number(a.id === annotationState.selectedId));
}

function annotationNumberSize(item) {
  return Number(item?.size) || annotationState.numberSize || ANNOTATION_NUMBER_SIZE;
}

function magnifierPartBounds(item, part) {
  const prefix = part === "source" ? "source" : "lens";
  const radius = item[`${prefix}Radius`];
  const margin = magnifierStrokeMargin(item) + annotationShadowOutset(item);
  return {
    x: item[`${prefix}X`] - radius - margin,
    y: item[`${prefix}Y`] - radius - margin,
    width: (radius + margin) * 2,
    height: (radius + margin) * 2,
  };
}

function magnifierVisualBounds(item, part) {
  const prefix = part === "source" ? "source" : "lens";
  const radius = item[`${prefix}Radius`];
  const margin = magnifierStrokeMargin(item);
  return {
    x: item[`${prefix}X`] - radius - margin,
    y: item[`${prefix}Y`] - radius - margin,
    width: (radius + margin) * 2,
    height: (radius + margin) * 2,
  };
}

function magnifierStrokeMargin(item) {
  return (Number(item?.lineWidth) || ANNOTATION_MAGNIFIER_LINE_WIDTH) / 2 + 1;
}

function magnifierSelectionMargin(item) {
  return magnifierStrokeMargin(item) + annotationShadowOutset(item) + canvasDisplayUnit(annotationCanvas());
}

function selectedMagnifierParts(item) {
  if (!selectedAnnotationItems().some(candidate => candidate.id === item.id)) return [];
  const sourceCovered = Math.hypot(item.lensX - item.sourceX, item.lensY - item.sourceY) + item.sourceRadius <= item.lensRadius;
  if (item.id === annotationState.selectedId && annotationState.selectedPart) {
    return annotationState.selectedPart === "source" && sourceCovered ? [] : [annotationState.selectedPart];
  }
  return sourceCovered ? ["lens"] : ["source", "lens"];
}

function drawAnnotationItem(ctx, item, includeSelection = false) {
  if (!item.shadow) {
    drawAnnotationItemContent(ctx, item, includeSelection);
    return;
  }
  const surface = document.createElement("canvas");
  surface.width = ctx.canvas.width;
  surface.height = ctx.canvas.height;
  drawAnnotationItemContent(surface.getContext("2d"), item, false);
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, .28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(surface, 0, 0);
  ctx.restore();
}

function drawAnnotationItemContent(ctx, item, includeSelection = false) {
  if (item.type === "number") {
    const size = annotationNumberSize(item);
    const radius = size / 2;
    ctx.save();
    ctx.fillStyle = item.color || "#ff5a52";
    ctx.beginPath();
    ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    const fontSize = size * (String(item.number).length >= 3 ? 50 / 110 : 70 / 110);
    ctx.font = `450 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", MiSans, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(item.number), item.x, item.y + size * 2 / 110);
    ctx.restore();
    return;
  }
  if (item.type === "magnifier") {
    if (item.sourceRadius < 1) return;
    const hasLens = item.lensRadius >= 1;
    const dx = item.lensX - item.sourceX;
    const dy = item.lensY - item.sourceY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const unitX = dx / distance;
    const unitY = dy / distance;
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = item.lineWidth;
    ctx.lineCap = "round";
    if (hasLens) {
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
    }

    ctx.beginPath();
    ctx.arc(item.sourceX, item.sourceY, item.sourceRadius, 0, Math.PI * 2);
    ctx.stroke();
    if (!hasLens) {
      ctx.restore();
      return;
    }

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
    ctx.fillStyle = item.color || "#98b2c0";
    if (item.round) {
      continuousRoundedRect(
        ctx,
        item.x,
        item.y,
        item.width,
        item.height,
        Math.min(Number(item.cornerRadius) || 0, item.width / 2, item.height / 2)
      );
      ctx.fill();
    } else {
      ctx.fillRect(item.x, item.y, item.width, item.height);
    }
    ctx.restore();
  }
}

function drawAnnotationSelection(ctx, item) {
  const canvas = annotationCanvas();
  const bounds = selectionFrameBounds(canvas, annotationItemBounds(item));
  drawMarchingAntsSelection(ctx, canvas, bounds);
}

function renderAnnotationCanvas(includeSelection = true) {
  if (!annotationState.image) {
    syncCanvasSelectionOverlays(
      annotationStage(), annotationCanvas(), annotationSelectionOverlay(), []
    );
    return;
  }
  const canvas = annotationCanvas();
  const ctx = annotationContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (annotationState.host !== "bg") ctx.drawImage(annotationState.image, 0, 0);
  annotationState.items.forEach(item => drawAnnotationItem(ctx, item, includeSelection));
  drawCanvasSnapGuides(ctx, canvas, annotationState.snapGuides);
  if (includeSelection) {
    syncCanvasSelectionOverlays(
      annotationStage(),
      canvas,
      annotationSelectionOverlay(),
      annotationSelectionEntries()
    );
  } else {
    syncCanvasSelectionOverlays(
      annotationStage(),
      canvas,
      annotationSelectionOverlay(),
      []
    );
  }
}

function applyAnnotationZoom(zoom) {
  if (!annotationState.image || !annotationState.baseDisplayWidth) return;
  annotationState.zoom = Math.max(0.5, Math.min(20, zoom));
  const canvas = annotationCanvas();
  canvas.style.width = `${annotationState.baseDisplayWidth * annotationState.zoom}px`;
  canvas.style.height = `${annotationState.baseDisplayHeight * annotationState.zoom}px`;
  canvas.style.imageRendering = annotationState.zoom >= 4 ? "pixelated" : "auto";
  annotationStage().classList.toggle("at-base-zoom", annotationState.zoom <= 1.001);
  if (annotationState.mode === "view") {
    setAnnotationCursor(annotationState.zoom > 1.001 ? "grab" : "default");
  }
  requestAnimationFrame(() => {
    renderAnnotationCanvas();
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
    annotationState.selectedPart = null;
    annotationState.numberSize = ANNOTATION_NUMBER_SIZE;
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
  if (["number", "mask", "blur", "magnifier"].includes(mode)) {
    annotationState.selectedId = null;
    annotationState.selectedIds = [];
    annotationState.selectedPart = null;
    annotationState.editingNumberId = null;
  }
  annotationState.mode = mode;
  annotationState.interaction = null;
  annotationState.snapGuides = emptySnapGuides();
  setAnnotationCursor(
    ["number", "mask", "blur", "magnifier"].includes(mode)
      ? "crosshair"
      : annotationState.zoom > 1.001 ? "grab" : "default"
  );
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
  annotationStage().focus();
}

function clampAnnotationItem(item) {
  const canvas = annotationCanvas();
  if (item.type === "number") {
    const radius = annotationNumberSize(item) / 2;
    item.x = Math.max(radius, Math.min(canvas.width - radius, item.x));
    item.y = Math.max(radius, Math.min(canvas.height - radius, item.y));
    return;
  }
  if (item.type === "magnifier") {
    const minimumRadius = Math.min(20, canvas.width / 4, canvas.height / 4);
    const clampCircle = (xKey, yKey, radiusKey) => {
      const edgeMargin = magnifierStrokeMargin(item);
      const maximumRadius = Math.max(
        minimumRadius,
        Math.min(canvas.width / 2 - edgeMargin, canvas.height / 2 - edgeMargin)
      );
      item[radiusKey] = Math.max(minimumRadius, Math.min(maximumRadius, item[radiusKey]));
      const inset = item[radiusKey] + edgeMargin;
      item[xKey] = Math.max(inset, Math.min(canvas.width - inset, item[xKey]));
      item[yKey] = Math.max(inset, Math.min(canvas.height - inset, item[yKey]));
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
  const size = annotationState.numberSize;
  const item = {
    id: annotationState.nextId++,
    type: "number",
    number: annotationState.nextNumber++,
    size,
    color: annotationState.numberColor || "#ff5a52",
    shadow: Boolean(annotationState.shadows.number),
    x: canvas.width - size / 2 - 28 - column * (size + gap),
    y: canvas.height - size / 2 - 28 - row * (size + gap),
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  annotationState.selectedPart = null;
  finishAnnotationChange(`已添加序号 ${item.number}`);
}

function addAnnotationNumberAt(point) {
  const item = {
    id: annotationState.nextId++,
    type: "number",
    number: annotationState.nextNumber++,
    size: annotationState.numberSize,
    color: annotationState.numberColor || "#ff5a52",
    shadow: Boolean(annotationState.shadows.number),
    x: point.x,
    y: point.y,
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  annotationState.selectedPart = null;
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
    color: annotationState.maskColor || "#98b2c0",
    shadow: Boolean(annotationState.shadows.mask),
    round: Boolean(annotationState.maskRound),
    cornerRadius: annotationState.maskRoundRadius || 16,
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  annotationState.selectedPart = null;
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
    strength: annotationState.blurStrength || 16,
    shadow: Boolean(annotationState.shadows.blur),
  };
  clampAnnotationItem(item);
  annotationState.items.push(item);
  annotationState.selectedId = item.id;
  annotationState.selectedIds = [];
  annotationState.selectedPart = null;
  finishAnnotationChange("已添加高斯模糊");
}

function updateAnnotationMagnifierStyle() {
  const selected = annotationState.items.find(item => item.id === annotationState.selectedId);
  const color = annotationControl("MagnifierColor").value;
  const width = Number(annotationControl("MagnifierWidth").value);
  annotationState.magnifierColor = color;
  annotationState.magnifierWidth = width;
  if (selected?.type === "magnifier") {
    selected.color = color;
    selected.lineWidth = width;
  }
  annotationControl("MagnifierWidthValue").textContent = `${width}px`;
  renderAnnotationCanvas();
  annotationStatusText(`放大镜线条 ${width}px · 共 ${annotationState.items.length} 个标注`);
}

function updateAnnotationNumberSize() {
  const selected = annotationState.items.find(item => item.id === annotationState.selectedId);
  const size = Number(annotationControl("NumberSize").value);
  annotationState.numberSize = size;
  annotationState.items
    .filter(item => item.type === "number")
    .forEach(item => {
      item.size = size;
      clampAnnotationItem(item);
    });
  annotationControl("NumberSizeValue").textContent = `${size}px`;
  renderAnnotationCanvas();
  annotationStatusText(`全部序号大小 ${size}px · 共 ${annotationState.items.length} 个标注`);
}

function updateAnnotationBlurStrength() {
  const selected = annotationState.items.find(item => item.id === annotationState.selectedId);
  const strength = Number(annotationControl("BlurStrength").value);
  annotationState.blurStrength = strength;
  if (selected?.type === "blur") selected.strength = strength;
  annotationControl("BlurStrengthValue").textContent = `${strength}px`;
  renderAnnotationCanvas();
  annotationStatusText(`模糊强度 ${strength}px · 共 ${annotationState.items.length} 个标注`);
}

function updateBgAnnotationColor(kind, color) {
  annotationState = bgAnnotationState;
  const normalized = String(color || "#98b2c0").toLowerCase();
  const stateKey = {
    mask: "maskColor",
    number: "numberColor",
    magnifier: "magnifierColor",
  }[kind];
  if (!stateKey) return;
  annotationState[stateKey] = normalized;
  selectedAnnotationItems()
    .filter(item => item.type === kind)
    .forEach(item => { item.color = normalized; });
  updateBgAnnotationControls();
  renderAnnotationCanvas(true);
  const label = { mask: "遮挡颜色", number: "序号颜色", magnifier: "线条颜色" }[kind];
  annotationStatusText(`${label} ${normalized.toUpperCase()} · 共 ${annotationState.items.length} 个标注`);
}

function updateBgAnnotationShadow(kind, enabled) {
  annotationState = bgAnnotationState;
  annotationState.shadows[kind] = Boolean(enabled);
  selectedAnnotationItems()
    .filter(item => item.type === kind)
    .forEach(item => { item.shadow = Boolean(enabled); });
  updateBgAnnotationControls();
  renderAnnotationCanvas(true);
  annotationStatusText(`${enabled ? "已开启" : "已关闭"}阴影效果 · 共 ${annotationState.items.length} 个标注`);
}

function updateBgAnnotationMaskRound() {
  annotationState = bgAnnotationState;
  const enabled = $("#bgAnnotationMaskRound").checked;
  annotationState.maskRound = enabled;
  selectedAnnotationItems()
    .filter(item => item.type === "mask")
    .forEach(item => { item.round = enabled; });
  updateBgAnnotationControls();
  renderAnnotationCanvas(true);
  annotationStatusText(`${enabled ? "已开启" : "已关闭"}圆角效果 · 共 ${annotationState.items.length} 个标注`);
}

function updateBgAnnotationMaskRadius() {
  annotationState = bgAnnotationState;
  const radius = Number($("#bgAnnotationMaskRoundRadius").value);
  annotationState.maskRoundRadius = radius;
  selectedAnnotationItems()
    .filter(item => item.type === "mask")
    .forEach(item => { item.cornerRadius = radius; });
  $("#bgAnnotationMaskRoundRadiusValue").textContent = `${radius} px`;
  renderAnnotationCanvas(true);
  annotationStatusText(`遮挡圆角 ${radius}px · 共 ${annotationState.items.length} 个标注`);
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
  annotationState.selectedPart = null;
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

function pointInsideCanvasClientRect(event, canvas = annotationCanvas()) {
  const rect = canvas.getBoundingClientRect();
  return event.clientX >= rect.left && event.clientX <= rect.right &&
    event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function nativeAnnotationStagePointerDown(event) {
  annotationState = nativeAnnotationState;
  const hit = (() => {
    if (!annotationState.items.length) return false;
    const point = annotationPointerPosition(event);
    return selectedAnnotationItems().some(item => hitAnnotationHandle(item, point)) ||
      annotationState.items.some(item => pointInAnnotationItem(item, point));
  })();
  if (!pointInsideCanvasClientRect(event) && !hit) return;
  annotationPointerDown(event);
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
    const part = [...selectedMagnifierParts(item)].reverse().find(candidate => {
      const handle = hitSelectionHandle(
        selectionFrameBounds(annotationCanvas(), magnifierPartBounds(item, candidate)),
        point,
        annotationCanvas(),
        12
      );
      return ["nw", "ne", "se", "sw"].includes(handle);
    });
    if (part) {
      const handle = hitSelectionHandle(
        selectionFrameBounds(annotationCanvas(), magnifierPartBounds(item, part)),
        point,
        annotationCanvas(),
        12
      );
      return `magnifier-${part}-${handle}`;
    }
    return null;
  }
  if (item?.type === "number") {
    return hitSelectionHandle(
      selectionFrameBounds(annotationCanvas(), annotationItemBounds(item)),
      point,
      annotationCanvas(),
      12
    );
  }
  if (item?.type !== "mask" && item?.type !== "blur") return null;
  return hitSelectionHandle(
    selectionFrameBounds(annotationCanvas(), annotationItemBounds(item)),
    point,
    annotationCanvas(),
    12
  );
}

function pointInAnnotationItem(item, point) {
  if (item.type === "number") {
    return Math.hypot(point.x - item.x, point.y - item.y) <=
      annotationNumberSize(item) / 2 + canvasDisplayUnit(annotationCanvas());
  }
  if (item.type === "magnifier") {
    const margin = magnifierStrokeMargin(item) + canvasDisplayUnit(annotationCanvas());
    if (Math.hypot(point.x - item.lensX, point.y - item.lensY) <= item.lensRadius + margin) {
      return true;
    }
    return Math.hypot(point.x - item.sourceX, point.y - item.sourceY) <= item.sourceRadius + margin;
  }
  const bounds = selectionFrameBounds(annotationCanvas(), {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
  });
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y && point.y <= bounds.y + bounds.height;
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
  const existingPart = existingAtPoint?.type === "magnifier"
    ? magnifierPartAtPoint(existingAtPoint, point)
    : null;
  if (["number", "mask", "blur", "magnifier"].includes(annotationState.mode) && existingAtPoint) {
    annotationState.mode = "view";
    annotationStatusText("已点中现有标注，并自动切换到查看模式。");
  }
  if (annotationState.mode === "number") {
    addAnnotationNumberAt(point);
    annotationStage().focus();
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
      ...(annotationState.mode === "blur"
        ? {
            strength: annotationState.blurStrength || 16,
            shadow: Boolean(annotationState.shadows.blur),
          }
        : {
            color: annotationState.maskColor || "#98b2c0",
            shadow: Boolean(annotationState.shadows.mask),
            round: Boolean(annotationState.maskRound),
            cornerRadius: annotationState.maskRoundRadius || 16,
          }),
    };
    annotationState.items.push(item);
    annotationState.selectedId = item.id;
    annotationState.selectedIds = [];
    annotationState.selectedPart = null;
    annotationState.interaction = {
      mode: "create",
      id: item.id,
      start: point,
      original: { ...item },
    };
    annotationStage().setPointerCapture?.(event.pointerId);
    annotationStage().focus();
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
      color: annotationState.magnifierColor || ANNOTATION_MAGNIFIER_COLOR,
      lineWidth: annotationState.magnifierWidth || ANNOTATION_MAGNIFIER_LINE_WIDTH,
      shadow: Boolean(annotationState.shadows.magnifier),
    };
    annotationState.items.push(item);
    annotationState.selectedId = item.id;
    annotationState.selectedIds = [];
    annotationState.selectedPart = "source";
    annotationState.interaction = {
      mode: "create-magnifier",
      id: item.id,
      start: point,
      original: { ...item },
    };
    annotationStage().setPointerCapture?.(event.pointerId);
    annotationStage().focus();
    updateAnnotationControls();
    renderAnnotationCanvas();
    event.preventDefault();
    return;
  }
  if (annotationState.mode === "view" && !existingAtPoint && annotationState.zoom > 1.001) {
    const stage = annotationStage();
    annotationState.selectedId = null;
    annotationState.selectedIds = [];
    annotationState.selectedPart = null;
    annotationState.interaction = {
      mode: "pan-canvas",
      startClient: { x: event.clientX, y: event.clientY },
      startScroll: { left: stage.scrollLeft, top: stage.scrollTop },
    };
    setAnnotationCursor("grabbing");
    annotationStage().setPointerCapture?.(event.pointerId);
    stage.focus();
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
      const primaryItem = annotationState.items.find(candidate => candidate.id === annotationState.selectedId);
      annotationState.selectedPart = primaryItem?.type === "magnifier"
        ? (adding && primaryItem.id === item.id ? magnifierPartAtPoint(item, point) : null)
        : null;
      const updatedSelection = selectedAnnotationItems();
      annotationState.interaction = adding ? {
        mode: updatedSelection.length > 1 ? "move-group" : "move",
        id: item.id,
        part: item.type === "magnifier" ? magnifierPartAtPoint(item, point) : null,
        start: point,
        original: { ...item },
        originals: updatedSelection.map(candidate => ({ ...candidate })),
      } : null;
    } else {
      annotationState.interaction = null;
      annotationState.selectedPart = null;
    }
    annotationStage().setPointerCapture?.(event.pointerId);
    annotationStage().focus();
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
    annotationState.selectedId = handleTarget.item.id;
    annotationState.selectedIds = [];
    annotationState.selectedPart = handleTarget.item.type === "magnifier"
      ? handleTarget.handle.split("-")[1]
      : null;
    const magnifierHandle = handleTarget.item.type === "magnifier"
      ? handleTarget.handle.split("-")[2]
      : null;
    annotationState.interaction = {
      mode: handleTarget.item.type === "magnifier"
        ? "resize-magnifier"
        : handleTarget.item.type === "number"
          ? "resize-number"
          : "resize",
      id: handleTarget.item.id,
      handle: handleTarget.item.type === "magnifier"
        ? `magnifier-${annotationState.selectedPart}`
        : handleTarget.handle,
      resizeHandle: magnifierHandle,
      start: point,
      original: { ...handleTarget.item },
    };
  } else {
    const item = existingAtPoint ||
      [...annotationState.items].reverse().find(candidate => pointInAnnotationItem(candidate, point));
    const clickedPart = item?.type === "magnifier"
      ? magnifierPartAtPoint(item, point)
      : null;
    const movingSelection = item && selectedItems.some(candidate => candidate.id === item.id);
    if (!movingSelection) {
      annotationState.selectedId = item?.id ?? null;
      annotationState.selectedIds = [];
    }
    annotationState.selectedPart = clickedPart;
    if (item) {
      const itemIndex = annotationState.items.findIndex(candidate => candidate.id === item.id);
      if (itemIndex >= 0 && itemIndex < annotationState.items.length - 1) {
        annotationState.items.splice(itemIndex, 1);
        annotationState.items.push(item);
      }
    }
    annotationState.interaction = item ? {
      mode: movingSelection && selectedItems.length > 1 ? "move-group" : "move",
      id: item.id,
      part: clickedPart,
      start: point,
      original: { ...item },
      originals: movingSelection
        ? selectedItems.map(candidate => ({ ...candidate }))
        : null,
    } : null;
  }
  annotationStage().setPointerCapture?.(event.pointerId);
  annotationStage().focus();
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
    const bounds = magnifierVisualBounds(item, part);
    const snapped = snapBoundsToCanvas(bounds, annotationCanvas(), 10, true);
    item[xKey] += snapped.x - bounds.x;
    item[yKey] += snapped.y - bounds.y;
    clampAnnotationItem(item);
    annotationState.snapGuides = snapped.guides;
    return;
  }
  item.x = interaction.original.x + dx;
  item.y = interaction.original.y + dy;
  clampAnnotationItem(item);
  const canvas = annotationCanvas();
  const bounds = selectionFrameBounds(canvas, annotationItemBounds(item));
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
  const edgeMargin = magnifierStrokeMargin(item);
  const maximumRadius = Math.max(
    minimumRadius,
    Math.min(
      interaction.original[xKey] - edgeMargin,
      canvas.width - interaction.original[xKey] - edgeMargin,
      interaction.original[yKey] - edgeMargin,
      canvas.height - interaction.original[yKey] - edgeMargin
    )
  );
  const margin = magnifierSelectionMargin(item);
  const candidateRadius = interaction.resizeHandle
    ? Math.max(Math.abs(point.x - interaction.original[xKey]), Math.abs(point.y - interaction.original[yKey])) - margin
    : Math.hypot(point.x - interaction.original[xKey], point.y - interaction.original[yKey]);
  item[radiusKey] = Math.max(
    minimumRadius,
    Math.min(maximumRadius, candidateRadius)
  );
  clampAnnotationItem(item);
  annotationState.snapGuides = emptySnapGuides();
}

function resizeAnnotationNumber(item, interaction, point) {
  const canvas = annotationCanvas();
  const maximum = Math.max(40, Math.min(240, canvas.width, canvas.height));
  const outset = annotationShadowOutset(item);
  const size = Math.max(
    40,
    Math.min(
      maximum,
      Math.max(0, Math.max(Math.abs(point.x - item.x), Math.abs(point.y - item.y)) - outset) * 2
    )
  );
  annotationState.numberSize = Math.round(size / 2) * 2;
  annotationState.items
    .filter(candidate => candidate.type === "number")
    .forEach(candidate => {
      candidate.size = annotationState.numberSize;
      clampAnnotationItem(candidate);
    });
  annotationControl("NumberSize").value = String(annotationState.numberSize);
  annotationControl("NumberSizeValue").textContent = `${annotationState.numberSize}px`;
  annotationState.snapGuides = emptySnapGuides();
}

function resizeAnnotationMask(item, interaction, point, event) {
  const canvas = annotationCanvas();
  const outset = annotationShadowOutset(item);
  point = {
    x: point.x + (interaction.handle.includes("w") ? outset : interaction.handle.includes("e") ? -outset : 0),
    y: point.y + (interaction.handle.includes("n") ? outset : interaction.handle.includes("s") ? -outset : 0),
  };
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
      setAnnotationCursor("crosshair");
      return;
    }
    const point = annotationPointerPosition(event);
    const selectedItems = selectedAnnotationItems();
    const handle = [...selectedItems]
      .reverse()
      .map(item => hitAnnotationHandle(item, point))
      .find(Boolean);
    const cursorHandle = handle?.startsWith("magnifier-") ? handle.split("-").at(-1) : handle;
    const itemAtPoint = [...annotationState.items].reverse().find(item => pointInAnnotationItem(item, point));
    setAnnotationCursor(
      selectionCursorByHandle[cursorHandle] ||
      (itemAtPoint ? "move" : annotationState.zoom > 1.001 ? "grab" : "default")
    );
    return;
  }
  if (interaction.mode === "pan-canvas") {
    const stage = annotationStage();
    stage.scrollLeft = interaction.startScroll.left - (event.clientX - interaction.startClient.x);
    stage.scrollTop = interaction.startScroll.top - (event.clientY - interaction.startClient.y);
    event.preventDefault();
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
    const sourceRadius = Math.hypot(point.x - interaction.start.x, point.y - interaction.start.y);
    item.sourceX = interaction.start.x;
    item.sourceY = interaction.start.y;
    item.sourceRadius = sourceRadius;
    item.lensRadius = 0;
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
    const bounds = selectionFrameBounds(canvas, annotationSelectionBounds());
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
  } else if (interaction.mode === "resize-number") {
    resizeAnnotationNumber(item, interaction, point);
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
  annotationStage().releasePointerCapture?.(event.pointerId);
  annotationState.snapGuides = emptySnapGuides();
  if (interaction.mode === "pan-canvas") {
    setAnnotationCursor(annotationState.zoom > 1.001 ? "grab" : "default");
    annotationStatusText(`查看模式 · 画布缩放 ${Math.round(annotationState.zoom * 100)}%`);
    return;
  }
  if (interaction.mode === "create") {
    const item = annotationState.items.find(candidate => candidate.id === interaction.id);
    if (!item || item.width < 2 || item.height < 2) {
      annotationState.items = annotationState.items.filter(candidate => candidate.id !== interaction.id);
      annotationState.selectedId = null;
      annotationState.selectedIds = [];
      annotationState.selectedPart = null;
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
      annotationState.selectedPart = null;
      renderAnnotationCanvas();
      updateAnnotationControls();
      annotationStatusText("放大范围太小，未创建放大镜；当前创建模式保持不变。");
      return;
    }
    item.lensRadius = Math.max(80, item.sourceRadius * 2);
    const gap = Math.max(28, item.lineWidth * 3);
    const diagonal = (item.sourceRadius + item.lensRadius + gap) / Math.sqrt(2);
    item.lensX = item.sourceX + diagonal;
    item.lensY = item.sourceY + diagonal;
    clampAnnotationItem(item);
  }
  renderAnnotationCanvas();
  pushAnnotationHistory();
  updateAnnotationControls();
  annotationStatusText(`共 ${annotationState.items.length} 个标注 · ${snapped ? "已吸附到图像或画布参考线" : "已保存当前调整"}`);
}

function setAnnotationZoomAtPoint(nextZoom, clientX, clientY) {
  const canvas = annotationCanvas();
  const stage = annotationStage();
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
  annotationState.selectedPart = null;
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
  annotationStage().focus();
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
  annotationStage().focus();
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
    annotationState = bgAnnotationState;
    blueBgState.interaction = null;
    blueBgState.snapGuides = emptySnapGuides();
    openBgBackgroundDialog();
  }
}

const IMAGE_ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16, 20,
];

function steppedImageZoom(current, direction, minimum = 0.5) {
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
  if (moduleId === "bg" && blueBgState.canvasWidth) {
    stage = $("#blueBgStage");
    nextZoom = steppedImageZoom(blueBgState.zoom, direction);
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
  if (
    moduleId === "bg" &&
    $("#bgBlueMode").checked &&
    (blueBgState.layers.length || bgAnnotationState.items.length)
  ) {
    blueBgState.selectedIds = blueBgState.layers.map(layer => layer.id);
    blueBgState.selectedId = blueBgState.selectedIds.at(-1) ?? null;
    blueBgState.toolMode = "move";
    blueBgState.interaction = null;
    blueBgState.snapGuides = emptySnapGuides();
    bgAnnotationState.selectedIds = bgAnnotationState.items.map(item => item.id);
    bgAnnotationState.selectedId = bgAnnotationState.selectedIds.at(-1) ?? null;
    bgAnnotationState.selectedPart = null;
    bgAnnotationState.mode = "view";
    bgAnnotationState.interaction = null;
    bgAnnotationState.snapGuides = emptySnapGuides();
    setBgInspectorMode("effects");
    updateBlueBgControls();
    renderBlueBgCanvas();
    requestAnimationFrame(renderBlueBgCanvas);
    $("#blueBgStage").focus();
    blueBgStatus(`已全选 ${blueBgState.selectedIds.length} 张前景图和 ${bgAnnotationState.selectedIds.length} 个标注。`);
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
    annotationState.selectedPart = null;
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
    annotationState.selectedPart = null;
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
  if (commandKey && event.key.toLowerCase() === "d") {
    event.preventDefault();
    deselectActiveImageModule(moduleId);
    return;
  }
  if (commandKey && event.key.toLowerCase() === "s" && moduleId === "imageEditor") {
    event.preventDefault();
    syncImageEditorToBgMaterial().catch(error => imageEditorStatus(error.message));
    return;
  }
  if (moduleId === "bg" && event.key === "Escape" && blueBgState.inspectorMode !== "background") {
    event.preventDefault();
    clearAllBgCanvasSelections();
    openBgBackgroundDialog();
    $("#blueBgStage").focus();
    blueBgStatus("已切换至背景美化。");
    return;
  }
  if (editing) return;
  if (commandKey && event.key.toLowerCase() === "a" && selectAllInActiveImageTool()) {
    event.preventDefault();
    return;
  }
  if (event.defaultPrevented) return;
  const plainKey = !event.metaKey && !event.ctrlKey && !event.altKey
    ? event.key.toLowerCase()
    : "";
  if (plainKey === "i") {
    const input = moduleId === "bg"
      ? $("#bgFiles")
      : moduleId === "annotation"
        ? $("#annotationFile")
        : moduleId === "imageEditor"
          ? $("#imageEditorFile")
          : null;
    if (input) {
      event.preventDefault();
      input.click();
      return;
    }
  }
  if (moduleId === "bg") {
    const bgShortcuts = {
      b: selectNextBlueBgLayer,
      n: () => activateBgAnnotationMode("number"),
      m: () => activateBgAnnotationMode("mask"),
      f: () => activateBgAnnotationMode("blur"),
      g: () => activateBgAnnotationMode("magnifier"),
    };
    const action = bgShortcuts[plainKey];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
  }
  if (moduleId === "imageEditor" && imageEditorState.hasImage) {
    const imageEditorShortcuts = {
      r: () => setImageEditorMode("remove"),
      c: () => setImageEditorMode("crop"),
      g: () => setImageEditorMode("gradient"),
      s: () => setImageEditorMode("split"),
      b: () => setImageEditorMode("blend"),
      w: suggestImageEditorWindow,
    };
    const action = imageEditorShortcuts[plainKey];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
  }
  if (moduleId === "annotation" && !event.metaKey && !event.ctrlKey && !event.altKey) {
    const annotationShortcuts = {
      n: () => setAnnotationMode("number"),
      m: () => setAnnotationMode("mask"),
      f: () => setAnnotationMode("blur"),
      g: () => setAnnotationMode("magnifier"),
    };
    const action = annotationShortcuts[event.key.toLowerCase()];
    if (action) {
      event.preventDefault();
      action();
      return;
    }
  }
  if (commandKey && (event.key.toLowerCase() === "z" || (!event.metaKey && event.key.toLowerCase() === "y"))) {
    event.preventDefault();
    runActiveImageModuleHistory(event.shiftKey || event.key.toLowerCase() === "y");
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
    if (moduleId === "bg") {
      clearAllBgCanvasSelections();
      openBgBackgroundDialog();
      $("#blueBgStage")?.focus();
      blueBgStatus("已切换至背景美化。");
    } else {
      enterActiveImageModuleView();
    }
  }
}

function deselectActiveImageModule(moduleId = activeImageModuleId()) {
  if (moduleId === "bg") {
    const hasSelection = blueBgState.selectedId !== null || blueBgState.selectedIds.length ||
      bgAnnotationState.selectedId !== null || bgAnnotationState.selectedIds.length || bgAnnotationState.selectedPart;
    if (!hasSelection) return false;
    clearAllBgCanvasSelections();
    openBgBackgroundDialog();
    blueBgStatus("已取消框选。");
    return true;
  }
  if (moduleId === "annotation") {
    if (!annotationState.selectedId && !annotationState.selectedIds.length && !annotationState.selectedPart) return false;
    annotationState.selectedId = null;
    annotationState.selectedIds = [];
    annotationState.selectedPart = null;
    annotationState.interaction = null;
    annotationState.snapGuides = emptySnapGuides();
    annotationState.editingNumberId = null;
    updateAnnotationControls();
    renderAnnotationCanvas();
    annotationStatusText("已取消框选。");
    return true;
  }
  if (moduleId === "imageEditor") {
    if (imageEditorState.selection) {
      cancelImageEditorSelection();
      return true;
    }
    if (imageEditorState.gradient) {
      cancelImageEditorGradient();
      return true;
    }
  }
  return false;
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
  $("#bgImportButton").onclick = () => {
    $("#bgFiles").click();
  };
  $("#bgViewMode").onclick = openBgBackgroundDialog;
  $("#bgBackgroundButton").onclick = openBgImageStylePanel;
  $("#bgBackgroundFile").onchange = () => {
    if (!$("#bgBackgroundFile").files?.length) return;
    $("#bgBackgroundType").value = "image";
    applyBgBackgroundFromTiles();
  };
  $("#bgBackgroundColor").onchange = () => {
    $("#bgBackgroundType").value = "solid";
    localStorage.setItem(BG_CUSTOM_COLOR_KEY, $("#bgBackgroundColor").value);
    applyBgBackgroundFromTiles();
  };
  $("#bgBackgroundDialog").onclick = event => {
    const customTile = event.target.closest("[data-bg-custom]");
    if (customTile) {
      $("#bgBackgroundFile").click();
      return;
    }
    const backgroundTile = event.target.closest("[data-bg-type]");
    if (backgroundTile) {
      $("#bgBackgroundType").value = backgroundTile.dataset.bgType;
      if (backgroundTile.dataset.bgGradient) $("#bgBackgroundGradient").value = backgroundTile.dataset.bgGradient;
      if (backgroundTile.dataset.bgWallpaper) $("#bgWallpaperSelect").value = backgroundTile.dataset.bgWallpaper;
      applyBgBackgroundFromTiles();
      return;
    }
    const aspectTile = event.target.closest("[data-bg-aspect]");
    if (aspectTile) {
      $("#bgCanvasAspect").value = aspectTile.dataset.bgAspect;
      applyBgBackgroundFromTiles();
    }
  };
  $("#bgUndo").onclick = () => {
    closeBgBackgroundPanel();
    restoreBgHistory(bgHistoryIndex - 1);
  };
  $("#bgRedo").onclick = () => {
    closeBgBackgroundPanel();
    restoreBgHistory(bgHistoryIndex + 1);
  };
  $("#bgExportButton").onclick = () => {
    closeBgBackgroundPanel();
    confirmBlueBgRender();
  };
  $("#bgFiles").onchange = event => {
    importBgFiles(event.target.files).catch(err => alert(err.message));
    event.target.value = "";
  };
  $("#bgMaterialList").onclick = event => {
    if (suppressBgMaterialClick) {
      suppressBgMaterialClick = false;
      event.preventDefault();
      return;
    }
    const material = event.target.closest("[data-bg-material-index]");
    if (material) {
      const index = Number(material.dataset.bgMaterialIndex);
      selectUnifiedBgMaterial(index, event.metaKey || event.ctrlKey).catch(err => blueBgStatus(err.message));
    } else if (event.target.closest("[data-import-bg-material]")) {
      $("#bgFiles").click();
    }
  };
  $("#bgMaterialList").oncontextmenu = event => {
    const card = event.target.closest("[data-bg-material-index]");
    if (!card) return;
    event.preventDefault();
    const materialIndex = Number(card.dataset.bgMaterialIndex);
    const layer = blueBgState.layers.find(candidate => candidate.materialIndex === materialIndex);
    if (layer) showBlueBgContextMenuForLayer(layer, event.clientX, event.clientY);
    else showBlueBgContextMenuForMaterial(materialIndex, event.clientX, event.clientY);
  };
  $("#bgMaterialList").onpointerdown = event => {
    if (event.button !== 0) return;
    const card = event.target.closest("[data-bg-material-index]");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    bgMaterialPointerDrag = {
      pointerId: event.pointerId,
      sourceIndex: Number(card.dataset.bgMaterialIndex),
      sourceCard: card,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
      targetIndex: Number(card.dataset.bgMaterialIndex),
      placement: "before",
      placeholder: null,
    };
  };

  const positionBgMaterialDrag = event => {
    const drag = bgMaterialPointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      const placeholder = document.createElement("div");
      placeholder.className = "bg-material-drop-slot";
      placeholder.setAttribute("aria-hidden", "true");
      drag.placeholder = placeholder;
      drag.sourceCard.remove();
      document.body.appendChild(drag.sourceCard);
      drag.sourceCard.classList.add("is-dragging");
      drag.sourceCard.style.width = `${drag.width}px`;
      drag.sourceCard.style.height = `${drag.height}px`;
      document.body.classList.add("is-dragging-bg-material");
    }
    drag.sourceCard.style.left = `${event.clientX - drag.offsetX}px`;
    drag.sourceCard.style.top = `${event.clientY - drag.offsetY}px`;

    const list = $("#bgMaterialList");
    const cards = $$(".bg-material-card[data-bg-material-index]", list);
    const importCard = $(".bg-material-import-card", list);
    if (!cards.length) {
      list.insertBefore(drag.placeholder, importCard || null);
      drag.targetIndex = drag.sourceIndex;
      drag.placement = "before";
      return;
    }
    const beforeCard = cards.find(card => {
      const rect = card.getBoundingClientRect();
      return event.clientY < rect.top + rect.height / 2;
    });
    if (beforeCard) {
      list.insertBefore(drag.placeholder, beforeCard);
      drag.targetIndex = Number(beforeCard.dataset.bgMaterialIndex);
      drag.placement = "before";
      return;
    }
    list.insertBefore(drag.placeholder, importCard || null);
    drag.targetIndex = Number(cards.at(-1).dataset.bgMaterialIndex);
    drag.placement = "after";
  };

  const finishBgMaterialPointerDrag = (event, cancelled = false) => {
    const drag = bgMaterialPointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressBgMaterialClick = true;
      window.setTimeout(() => { suppressBgMaterialClick = false; }, 80);
      drag.sourceCard.remove();
      drag.placeholder?.remove();
      document.body.classList.remove("is-dragging-bg-material");
      if (cancelled) {
        renderBgMaterialList();
      } else if (drag.sourceIndex === drag.targetIndex) {
        renderBgMaterialList();
      } else {
        reorderBgMaterial(drag.sourceIndex, drag.targetIndex, drag.placement);
      }
    }
    bgMaterialPointerDrag = null;
  };
  window.addEventListener("pointermove", positionBgMaterialDrag, true);
  window.addEventListener("pointerup", event => finishBgMaterialPointerDrag(event), true);
  window.addEventListener("pointercancel", event => finishBgMaterialPointerDrag(event, true), true);
  $("#bgMaterialList").ondragstart = event => event.preventDefault();
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
  $("#bgDeleteSelected").onclick = () => {
    deleteSelectedBgItem();
  };
  $("#bgEffectScale").oninput = () => {
    updateBlueBgLayerScale();
  };
  $("#bgEffectScale").onchange = pushBgHistory;
  $("#bgEffectShadow").onchange = () => {
    updateBlueBgLayerOptions();
    pushBgHistory();
  };
  $("#bgEffectRound").onchange = () => {
    updateBlueBgLayerOptions();
    pushBgHistory();
  };
  $("#bgEffectRoundRadius").oninput = () => {
    updateBlueBgLayerRadius();
  };
  $("#bgEffectRoundRadius").onchange = pushBgHistory;
  $("#bgCanvasZoom").oninput = () => {
    const stage = $("#blueBgStage");
    const rect = stage.getBoundingClientRect();
    setBlueBgZoomAtPoint(
      Number($("#bgCanvasZoom").value) / 100,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    stage.focus();
  };
  $("#imageEditorCanvasZoom").oninput = () => {
    if (!imageEditorState.hasImage) return;
    const canvas = imageEditorCanvas();
    const rect = canvas.getBoundingClientRect();
    setImageEditorZoomAtPoint(
      Number($("#imageEditorCanvasZoom").value) / 100,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
  };
  [
    ["#bgAddAnnotationNumber", "number"],
    ["#bgAddAnnotationMask", "mask"],
    ["#bgAddAnnotationBlur", "blur"],
    ["#bgAddAnnotationMagnifier", "magnifier"],
  ].forEach(([selector, mode]) => {
    $(selector).onclick = () => activateBgAnnotationMode(mode);
  });
  $("#bgAnnotationBlurStrength").oninput = () => withAnnotationState(bgAnnotationState, updateAnnotationBlurStrength);
  $("#bgAnnotationBlurStrength").onchange = () => withAnnotationState(bgAnnotationState, pushAnnotationHistory);
  $("#bgAnnotationMagnifierWidth").oninput = () => withAnnotationState(bgAnnotationState, updateAnnotationMagnifierStyle);
  $("#bgAnnotationMagnifierWidth").onchange = () => withAnnotationState(bgAnnotationState, pushAnnotationHistory);
  $("#bgAnnotationNumberSize").oninput = () => withAnnotationState(bgAnnotationState, updateAnnotationNumberSize);
  $("#bgAnnotationNumberSize").onchange = () => withAnnotationState(bgAnnotationState, pushAnnotationHistory);
  $("#bgAnnotationNumberReset").onclick = () => {
    $("#bgAnnotationNumberSize").value = String(ANNOTATION_NUMBER_SIZE);
    withAnnotationState(bgAnnotationState, updateAnnotationNumberSize);
    pushBgHistory();
  };
  $("#bgAnnotationInspector").onclick = event => {
    const custom = event.target.closest("[data-annotation-custom-select]");
    if (custom) {
      const kind = custom.dataset.annotationCustomSelect;
      updateBgAnnotationColor(kind, storedBgAnnotationCustomColor(kind));
      pushBgHistory();
      return;
    }
    const button = event.target.closest("[data-annotation-color-kind][data-annotation-color]");
    if (!button) return;
    updateBgAnnotationColor(button.dataset.annotationColorKind, button.dataset.annotationColor);
    pushBgHistory();
  };
  [
    ["#bgAnnotationMaskColor", "mask"],
    ["#bgAnnotationNumberColor", "number"],
    ["#bgAnnotationMagnifierColor", "magnifier"],
  ].forEach(([selector, kind]) => {
    $(selector).oninput = event => saveBgAnnotationCustomColor(kind, event.target.value);
    $(selector).onchange = () => {
      saveBgAnnotationCustomColor(kind, $(selector).value);
      pushBgHistory();
    };
  });
  ["number", "mask", "blur", "magnifier"].forEach(kind => {
    const control = $(`#bgAnnotation${kind[0].toUpperCase()}${kind.slice(1)}Shadow`);
    control.onchange = () => {
      updateBgAnnotationShadow(kind, control.checked);
      pushBgHistory();
    };
  });
  $("#bgAnnotationMaskRound").onchange = () => {
    updateBgAnnotationMaskRound();
    pushBgHistory();
  };
  $("#bgAnnotationMaskRoundRadius").oninput = updateBgAnnotationMaskRadius;
  $("#bgAnnotationMaskRoundRadius").onchange = pushBgHistory;
  $("#blueBgStage").oncontextmenu = blueBgContextMenu;
  $("#blueBgStage").onpointerdown = blueBgStagePointerDown;
  $("#blueBgStage").onpointermove = blueBgStagePointerMove;
  $("#blueBgStage").onpointerup = blueBgStagePointerUp;
  $("#blueBgStage").onpointercancel = blueBgStagePointerUp;
  $("#blueBgMoveUp").onclick = () => moveContextBgMaterial(1);
  $("#blueBgMoveDown").onclick = () => moveContextBgMaterial(-1);
  $("#blueBgEditSelected").onclick = () => {
    openSelectedBlueBgLayerInEditor().catch(error => blueBgStatus(error.message));
  };
  $("#blueBgDeleteMaterial").onclick = () => deleteBgMaterialCompletely();
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
  $("#annotationNumberSize").oninput = updateAnnotationNumberSize;
  $("#annotationNumberSize").onchange = pushAnnotationHistory;
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
  $("#annotationStage").onpointerdown = nativeAnnotationStagePointerDown;
  $("#annotationStage").onpointermove = annotationPointerMove;
  $("#annotationStage").onpointerup = annotationPointerUp;
  $("#annotationStage").onpointercancel = annotationPointerUp;
  $("#annotationCanvas").ondblclick = annotationDoubleClick;
  $("#annotationStage").addEventListener("wheel", annotationWheel, { passive: false });
  $("#annotationStage").addEventListener("gesturestart", annotationGestureStart, { passive: false });
  $("#annotationStage").addEventListener("gesturechange", annotationGestureChange, { passive: false });
  $("#annotationStage").onkeydown = annotationKeyDown;
  document.addEventListener("paste", event => {
    importClipboardImageIntoActiveModule(event).catch(error => {
      const moduleId = activeImageModuleId();
      const message = error?.message || "剪贴板图片导入失败，请重试。";
      if (moduleId === "bg" && $("#bgBlueMode").checked) blueBgStatus(message);
      else if (moduleId === "annotation") annotationStatusText(message);
      else if (moduleId === "imageEditor") imageEditorStatus(message);
    });
  });
  document.addEventListener("keydown", imageModuleGlobalKeyDown);
  document.addEventListener("keyup", event => {
    if (event.key === "Alt") showImageModuleShortcutHints(false);
  });
  window.addEventListener("blur", () => showImageModuleShortcutHints(false));
  window.addEventListener("resize", syncBgMaterialColumnWidth);
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
initializeBgAnnotationCustomColors();
openBgBackgroundDialog();
toggleBlueBgMode();
showTab("bg");
