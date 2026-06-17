const START_COUNTS = {
  city: 1248,
  dacha: 1391,
};

const STORAGE_KEY = "summer-battle-submissions";

const seedPhotos = [
  {
    side: "city",
    name: "Вечер на террасе",
    src: "assets/city-summer-tilda.jpg",
  },
  {
    side: "dacha",
    name: "Рассада и ужин в саду",
    src: "assets/dacha-summer-tilda.jpg",
  },
  {
    side: "city",
    name: "Прогулка после работы",
    src: "assets/city-summer-tilda.jpg",
  },
  {
    side: "dacha",
    name: "Теплица открыта",
    src: "assets/dacha-summer-tilda.jpg",
  },
  {
    side: "city",
    name: "Лето в центре",
    src: "assets/city-summer-tilda.jpg",
  },
  {
    side: "dacha",
    name: "Полив перед закатом",
    src: "assets/dacha-summer-tilda.jpg",
  },
];

const sideLabels = {
  city: "Город",
  dacha: "Дача",
};

const bonusCopy = {
  city:
    "Сейчас впереди городские: бонусный приз уйдет на культурные выходные, поездку или вечер в театре.",
  dacha:
    "Сейчас впереди дачники: бонусный приз уйдет на теплицу, летний душ, рассаду или садовый сюрприз.",
  tie:
    "Команды идут ровно: бонусный приз определится по финальному счетчику.",
};

const state = {
  side: "city",
  filter: "all",
  previewData: "",
  submissions: loadSubmissions(),
};

const cityCount = document.querySelector("#cityCount");
const dachaCount = document.querySelector("#dachaCount");
const cityBar = document.querySelector("#cityBar");
const dachaBar = document.querySelector("#dachaBar");
const leaderText = document.querySelector("#leaderText");
const bonusPrize = document.querySelector("#bonusPrize");
const quickSideButtons = document.querySelectorAll(".quick-side");
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
const photoGrid = document.querySelector("#photoGrid");

quickSideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSide(button.dataset.side);
    document.querySelector("#join").scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

sideButtons.forEach((button) => {
  button.addEventListener("click", () => setSide(button.dataset.side));
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderGallery();
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
  };

  state.submissions = [submission, ...state.submissions].slice(0, 12);
  const saved = saveSubmissions();
  resetForm();
  render();
  showMessage(
    saved ? "Заявка добавлена в демо-ленту." : "Заявка добавлена до перезагрузки страницы.",
    true,
  );
});

function setSide(side) {
  state.side = side;
  quickSideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.side === side);
  });
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
  cityBar.parentElement.style.setProperty("--city-share", `${cityShare}%`);
  dachaBar.parentElement.style.setProperty("--dacha-share", `${dachaShare}%`);

  if (leader === "tie") {
    leaderText.textContent = "Команды идут ровно";
  } else {
    leaderText.textContent = `Сейчас выигрывает: ${sideLabels[leader]}`;
  }

  bonusPrize.textContent = bonusCopy[leader];
}

function renderGallery() {
  const allPhotos = [...state.submissions, ...seedPhotos];
  const photos =
    state.filter === "all"
      ? allPhotos
      : allPhotos.filter((item) => item.side === state.filter);

  photoGrid.innerHTML = "";

  photos.slice(0, 12).forEach((photo, index) => {
    const tile = document.createElement("article");
    tile.className = "photo-tile";
    tile.innerHTML = `
      <img src="${photo.src}" alt="${escapeHtml(photo.name)}" loading="${index < 4 ? "eager" : "lazy"}" />
      <div class="photo-meta">
        <span class="${photo.side}-badge">${sideLabels[photo.side]}</span>
        <strong>${escapeHtml(photo.name)}</strong>
      </div>
    `;
    photoGrid.append(tile);
  });
}

function render() {
  renderCounts();
  renderGallery();
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

render();
