const START_COUNTS = {
  city: 1248,
  dacha: 1391,
};

const STORAGE_KEY = "summer-battle-submissions";
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 920;

const seedPhotos = [
  {
    side: "city",
    name: "Вечер на террасе",
    src: "assets/city-summer-tilda.jpg",
    x: 88,
    y: 86,
    width: 230,
    rotation: -3,
  },
  {
    side: "city",
    name: "Прогулка после работы",
    src: "assets/city-summer-tilda.jpg",
    x: 380,
    y: 152,
    width: 210,
    rotation: 2,
  },
  {
    side: "city",
    name: "Лето в центре",
    src: "assets/city-summer-tilda.jpg",
    x: 180,
    y: 390,
    width: 250,
    rotation: 1,
  },
  {
    side: "city",
    name: "Кино под открытым небом",
    src: "assets/city-summer-tilda.jpg",
    x: 470,
    y: 540,
    width: 220,
    rotation: -2,
  },
  {
    side: "dacha",
    name: "Рассада и ужин в саду",
    src: "assets/dacha-summer-tilda.jpg",
    x: 910,
    y: 96,
    width: 240,
    rotation: 3,
  },
  {
    side: "dacha",
    name: "Теплица открыта",
    src: "assets/dacha-summer-tilda.jpg",
    x: 1230,
    y: 170,
    width: 210,
    rotation: -2,
  },
  {
    side: "dacha",
    name: "Полив перед закатом",
    src: "assets/dacha-summer-tilda.jpg",
    x: 970,
    y: 438,
    width: 250,
    rotation: 1,
  },
  {
    side: "dacha",
    name: "Дачный завтрак",
    src: "assets/dacha-summer-tilda.jpg",
    x: 1270,
    y: 600,
    width: 220,
    rotation: -3,
  },
];

const sideLabels = {
  city: "Город",
  dacha: "Дача",
};

const bonusCopy = {
  city:
    "Сейчас впереди город: бонусный приз уйдет на культурные выходные, поездку или вечер в театре.",
  dacha:
    "Сейчас впереди дача: бонусный приз уйдет на теплицу, летний душ, рассаду или садовый приз.",
  tie: "Команды идут ровно: бонусный приз определится по финальному счетчику.",
};

const state = {
  side: "city",
  filter: "all",
  previewData: "",
  submissions: loadSubmissions(),
  board: {
    scale: 1,
    x: 0,
    y: 0,
    pointerId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    dragged: false,
  },
};

const cityCount = document.querySelector("#cityCount");
const dachaCount = document.querySelector("#dachaCount");
const cityTotal = document.querySelector("#cityTotal");
const dachaTotal = document.querySelector("#dachaTotal");
const leaderBadge = document.querySelector("#leaderBadge");
const cityBar = document.querySelector("#cityBar");
const dachaBar = document.querySelector("#dachaBar");
const leaderText = document.querySelector("#leaderText");
const bonusPrize = document.querySelector("#bonusPrize");
const sideButtons = document.querySelectorAll(".side-option");
const filterButtons = document.querySelectorAll(".filter-tab");
const photoInput = document.querySelector("#photoInput");
const previewWrap = document.querySelector("#previewWrap");
const photoPreview = document.querySelector("#photoPreview");
const removePhoto = document.querySelector("#removePhoto");
const form = document.querySelector(".entry-panel");
const formMessage = document.querySelector("#formMessage");
const nameInput = document.querySelector("#nameInput");
const contactInput = document.querySelector("#contactInput");
const maxPetrovich = document.querySelector("#maxPetrovich");
const maxGorbilet = document.querySelector("#maxGorbilet");
const consentInput = document.querySelector("#consentInput");
const photoBoard = document.querySelector("#photoBoard");
const boardCanvas = document.querySelector("#boardCanvas");
const zoomIn = document.querySelector("#zoomIn");
const zoomOut = document.querySelector("#zoomOut");
const zoomReset = document.querySelector("#zoomReset");
const zoomValue = document.querySelector("#zoomValue");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxName = document.querySelector("#lightboxName");
const lightboxSide = document.querySelector("#lightboxSide");
const lightboxClose = document.querySelector("#lightboxClose");

sideButtons.forEach((button) => {
  button.addEventListener("click", () => setSide(button.dataset.side));
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderBoard();
  });
});

photoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showMessage("Нужно выбрать изображение.", false);
    photoInput.value = "";
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showMessage("Для демо лучше выбрать фото до 15 МБ.", false);
    photoInput.value = "";
    return;
  }

  readAndCompressImage(file)
    .then((dataUrl) => {
      state.previewData = dataUrl;
      photoPreview.src = state.previewData;
      previewWrap.hidden = false;
      showMessage("", true);
    })
    .catch(() => {
      showMessage("Не получилось прочитать фото. Попробуйте другое изображение.", false);
      photoInput.value = "";
    });
});

removePhoto.addEventListener("click", () => {
  state.previewData = "";
  photoInput.value = "";
  photoPreview.removeAttribute("src");
  previewWrap.hidden = true;
  photoInput.click();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();

  if (!state.previewData) {
    showMessage("Добавьте фото для участия.", false);
    return;
  }

  if (!name || !contact) {
    showMessage("Заполните имя и контакт.", false);
    return;
  }

  if (!maxPetrovich.checked || !maxGorbilet.checked) {
    showMessage("Откройте оба MAX-бота и отметьте участие.", false);
    return;
  }

  if (!consentInput.checked) {
    showMessage("Нужно разрешение на публикацию фото.", false);
    return;
  }

  const submission = {
    side: state.side,
    name,
    src: state.previewData,
    createdAt: Date.now(),
    ...getSubmissionPosition(state.side, state.submissions.length),
  };

  state.submissions = [submission, ...state.submissions].slice(0, 12);
  const saved = saveSubmissions();
  resetForm();
  render();
  showMessage(
    saved ? "Заявка добавлена на демо-доску." : "Заявка добавлена до перезагрузки страницы.",
    true,
  );
  document.querySelector("#board").scrollIntoView({ behavior: "smooth", block: "center" });
});

zoomIn.addEventListener("click", () => zoomBoard(1.18));
zoomOut.addEventListener("click", () => zoomBoard(0.84));
zoomReset.addEventListener("click", resetBoardView);

photoBoard.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomBoard(event.deltaY < 0 ? 1.08 : 0.92, event.offsetX, event.offsetY);
}, { passive: false });

photoBoard.addEventListener("pointerdown", (event) => {
  state.board.pointerId = event.pointerId;
  state.board.startX = event.clientX;
  state.board.startY = event.clientY;
  state.board.startPanX = state.board.x;
  state.board.startPanY = state.board.y;
  state.board.dragged = false;
  photoBoard.setPointerCapture(event.pointerId);
  photoBoard.classList.add("dragging");
});

photoBoard.addEventListener("pointermove", (event) => {
  if (state.board.pointerId !== event.pointerId) {
    return;
  }

  const dx = event.clientX - state.board.startX;
  const dy = event.clientY - state.board.startY;

  if (Math.abs(dx) + Math.abs(dy) > 5) {
    state.board.dragged = true;
  }

  state.board.x = state.board.startPanX + dx;
  state.board.y = state.board.startPanY + dy;
  clampBoard();
  applyBoardTransform();
});

photoBoard.addEventListener("pointerup", endBoardDrag);
photoBoard.addEventListener("pointercancel", endBoardDrag);

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("open")) {
    closeLightbox();
  }
});

function setSide(side) {
  state.side = side;
  sideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.side === side);
  });
}

function loadSubmissions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSubmissions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.submissions));
    return true;
  } catch {
    return false;
  }
}

function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", reject);
    reader.addEventListener("load", () => {
      compressImage(String(reader.result)).then(resolve).catch(() => resolve(String(reader.result)));
    });
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("error", reject);
    image.addEventListener("load", () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas is unavailable"));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    });
    image.src = dataUrl;
  });
}

function getCounts() {
  return state.submissions.reduce(
    (counts, item) => {
      counts[item.side] += 1;
      return counts;
    },
    { ...START_COUNTS },
  );
}

function renderCounts() {
  const counts = getCounts();
  const total = counts.city + counts.dacha;
  const cityShare = Math.round((counts.city / total) * 100);
  const dachaShare = 100 - cityShare;
  const leader =
    counts.city === counts.dacha ? "tie" : counts.city > counts.dacha ? "city" : "dacha";

  cityCount.textContent = formatNumber(counts.city);
  dachaCount.textContent = formatNumber(counts.dacha);
  cityTotal.textContent = formatNumber(counts.city);
  dachaTotal.textContent = formatNumber(counts.dacha);
  cityBar.parentElement.style.setProperty("--city-share", `${cityShare}%`);
  dachaBar.parentElement.style.setProperty("--dacha-share", `${dachaShare}%`);
  leaderText.textContent =
    leader === "tie" ? "Команды идут ровно" : `Сейчас выигрывает: ${sideLabels[leader]}`;
  leaderBadge.textContent =
    leader === "tie"
      ? "Команды идут ровно"
      : `Сейчас лидирует ${sideLabels[leader]} · ${Math.abs(counts.city - counts.dacha)} впереди`;
  bonusPrize.textContent = bonusCopy[leader];
}

function renderBoard() {
  const allPhotos = [...normalizeSubmissions(), ...seedPhotos];
  const photos =
    state.filter === "all"
      ? allPhotos
      : allPhotos.filter((item) => item.side === state.filter);

  boardCanvas.innerHTML = "";

  photos.forEach((photo, index) => {
    const pin = document.createElement("article");
    pin.className = "photo-pin";
    pin.dataset.side = photo.side;
    pin.style.left = `${photo.x}px`;
    pin.style.top = `${photo.y}px`;
    pin.style.width = `${photo.width}px`;
    pin.style.transform = `rotate(${photo.rotation}deg)`;
    pin.innerHTML = `
      <img src="${photo.src}" alt="${escapeHtml(photo.name)}" loading="${index < 5 ? "eager" : "lazy"}" />
      <div class="pin-meta">
        <span>${escapeHtml(photo.name)}</span>
        <b>${sideLabels[photo.side]}</b>
      </div>
    `;
    pin.addEventListener("click", () => {
      if (!state.board.dragged) {
        openLightbox(photo);
      }
    });
    boardCanvas.append(pin);
  });
}

function normalizeSubmissions() {
  return state.submissions.map((item, index) => ({
    ...getSubmissionPosition(item.side, index),
    ...item,
  }));
}

function getSubmissionPosition(side, index) {
  const columnOffset = side === "city" ? 0 : 820;
  const positions = [
    { x: 72, y: 230, width: 210, rotation: -2 },
    { x: 332, y: 320, width: 230, rotation: 2 },
    { x: 138, y: 650, width: 220, rotation: 1 },
    { x: 470, y: 90, width: 205, rotation: -3 },
    { x: 518, y: 690, width: 230, rotation: 3 },
    { x: 250, y: 40, width: 220, rotation: -1 },
  ];
  const base = positions[index % positions.length];

  return {
    x: base.x + columnOffset,
    y: Math.min(740, base.y + Math.floor(index / positions.length) * 22),
    width: base.width,
    rotation: base.rotation,
  };
}

function resetBoardView() {
  const rect = photoBoard.getBoundingClientRect();
  const minScale = rect.width < 640 ? 0.42 : 0.62;
  state.board.scale = Math.min(1, Math.max(minScale, rect.width / BOARD_WIDTH));
  state.board.x = (rect.width - BOARD_WIDTH * state.board.scale) / 2;
  state.board.y = Math.max(0, (rect.height - BOARD_HEIGHT * state.board.scale) / 2);
  applyBoardTransform();
}

function zoomBoard(multiplier, originX = photoBoard.clientWidth / 2, originY = photoBoard.clientHeight / 2) {
  const nextScale = Math.max(0.45, Math.min(1.7, state.board.scale * multiplier));
  const boardX = (originX - state.board.x) / state.board.scale;
  const boardY = (originY - state.board.y) / state.board.scale;

  state.board.scale = nextScale;
  state.board.x = originX - boardX * nextScale;
  state.board.y = originY - boardY * nextScale;
  clampBoard();
  applyBoardTransform();
}

function clampBoard() {
  const rect = photoBoard.getBoundingClientRect();
  const scaledWidth = BOARD_WIDTH * state.board.scale;
  const scaledHeight = BOARD_HEIGHT * state.board.scale;
  const minX = Math.min(0, rect.width - scaledWidth) - 80;
  const minY = Math.min(0, rect.height - scaledHeight) - 80;

  state.board.x = Math.min(80, Math.max(minX, state.board.x));
  state.board.y = Math.min(80, Math.max(minY, state.board.y));
}

function applyBoardTransform() {
  boardCanvas.style.transform = `translate(${state.board.x}px, ${state.board.y}px) scale(${state.board.scale})`;
  zoomValue.textContent = `${Math.round(state.board.scale * 100)}%`;
}

function endBoardDrag(event) {
  if (state.board.pointerId === event.pointerId) {
    photoBoard.releasePointerCapture(event.pointerId);
    state.board.pointerId = null;
    photoBoard.classList.remove("dragging");
    window.setTimeout(() => {
      state.board.dragged = false;
    }, 40);
  }
}

function openLightbox(photo) {
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.name;
  lightboxName.textContent = photo.name;
  lightboxSide.textContent = sideLabels[photo.side];
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
}

function render() {
  renderCounts();
  renderBoard();
  applyNoHangingWords(document.body);
}

function resetForm() {
  form.reset();
  state.previewData = "";
  photoPreview.removeAttribute("src");
  previewWrap.hidden = true;
  setSide(state.side);
}

function showMessage(message, success) {
  formMessage.textContent = message;
  formMessage.classList.toggle("success", Boolean(success));
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function applyNoHangingWords(root) {
  const skipTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;

      if (!parent || skipTags.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const glueWords =
    "а|в|во|и|к|ко|на|не|но|о|об|от|по|с|со|у|до|за|из|или|же|бы|для|как|что|чтобы|если|когда";
  const gluePattern = new RegExp(`(^|[\\s([{«"„])(${glueWords})\\s+`, "giu");
  const dashPattern = /(\s+[—–])\s+/g;

  while (walker.nextNode()) {
    walker.currentNode.nodeValue = walker.currentNode.nodeValue
      .replace(gluePattern, "$1$2\u00a0")
      .replace(dashPattern, "$1\u00a0");
  }
}

render();
resetBoardView();
window.addEventListener("resize", resetBoardView);
