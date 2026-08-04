// ============================================================
// settings.js — экран 3: Настройки
// Выбор типа подсказки и типа задачи
// ============================================================

const Settings = (() => {

  const HINT_OPTIONS = [
    { value: "flag",    icon: "🏳️", text: "Флаг" },
    { value: "borders", icon: "🗺️", text: "Границы страны" },
    { value: "capital", icon: "🏙️", text: "Миниатюра столицы" },
    { value: "random",  icon: "🎲", text: "Случайно" }
  ];

  const TASK_OPTIONS = [
    { value: "capital", icon: "🏛️", text: "Угадать столицу" },
    { value: "country",  icon: "🌍", text: "Угадать страну" },
    { value: "random",  icon: "🎲", text: "Случайно" }
  ];

  // --- Инициализация ---

  let eventsBound = false;

  function init() {
    render();
    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
  }

  // --- Рендер ---

  function render() {
    const user = DB.getCurrentUser();
    if (!user) return;

    const s = user.settings;

    // Тип подсказки
    const hintEl = document.getElementById("hint-options");
    hintEl.innerHTML = HINT_OPTIONS.map((opt) => `
      <div class="setting-option ${s.hintType === opt.value ? "selected" : ""}" data-hint="${opt.value}">
        <div class="radio-dot"></div>
        <span class="setting-option-icon">${opt.icon}</span>
        <span class="setting-option-text">${opt.text}</span>
      </div>
    `).join("");

    // Тип задачи
    const taskEl = document.getElementById("task-options");
    taskEl.innerHTML = TASK_OPTIONS.map((opt) => `
      <div class="setting-option ${s.taskType === opt.value ? "selected" : ""}" data-task="${opt.value}">
        <div class="radio-dot"></div>
        <span class="setting-option-icon">${opt.icon}</span>
        <span class="setting-option-text">${opt.text}</span>
      </div>
    `).join("");
  }

  // --- События ---

  function bindEvents() {
    // Выбор подсказки
    document.getElementById("hint-options").addEventListener("click", (e) => {
      const opt = e.target.closest("[data-hint]");
      if (!opt) return;
      const value = opt.dataset.hint;
      DB.updateSettings(DB.getCurrentUser().id, { hintType: value });
      render();
    });

    // Выбор задачи
    document.getElementById("task-options").addEventListener("click", (e) => {
      const opt = e.target.closest("[data-task]");
      if (!opt) return;
      const value = opt.dataset.task;
      DB.updateSettings(DB.getCurrentUser().id, { taskType: value });
      render();
    });

    // Кнопка "Назад"
    document.getElementById("btn-settings-back").addEventListener("click", () => {
      App.showScreen("game");
    });
  }

  return { init, render };
})();
