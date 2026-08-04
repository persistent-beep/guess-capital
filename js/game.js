// ============================================================
// game.js — экран 2: Игровой процесс
// Бесконечный режим, генерация вопросов, проверка, анимации
// ============================================================

const Game = (() => {

  let countries = [];
  let currentQuestion = null;
  let answered = false; // блокировка повторного ответа
  let eventsBound = false;

  // --- Загрузка данных ---

  function loadCountries() {
    countries = typeof COUNTRIES_DATA !== "undefined" ? COUNTRIES_DATA : [];
  }

  // --- Инициализация ---

  function init() {
    if (countries.length === 0) {
      loadCountries();
    }
    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
    nextQuestion();
  }

  // --- Генерация вопроса ---

  function generateQuestion() {
    const user = DB.getCurrentUser();
    if (!user || countries.length === 0) return null;

    const settings = user.settings;

    // Тип подсказки
    let hintType = settings.hintType;
    if (hintType === "random") {
      const hints = ["capital", "flag", "borders"];
      hintType = hints[Math.floor(Math.random() * hints.length)];
    }

    // Тип задачи
    let taskType = settings.taskType;
    if (taskType === "random") {
      taskType = Math.random() < 0.5 ? "capital" : "country";
    }

    // Случайная страна
    const country = countries[Math.floor(Math.random() * countries.length)];

    // Путь к картинке
    let imagePath = "";
    let imageType = "svg";
    if (hintType === "flag") {
      imagePath = `assets/flags/${country.code}.svg`;
    } else if (hintType === "borders") {
      imagePath = `assets/borders/${country.code}.svg`;
    } else {
      imagePath = `assets/capitals/${country.code}.jpg`;
      imageType = "jpg";
    }

    // Что угадываем
    let target, taskLabel;
    if (taskType === "capital") {
      target = { name: country.capital, aliases: country.capitalAliases };
      taskLabel = "Назовите столицу";
    } else {
      target = { name: country.country, aliases: country.countryAliases };
      taskLabel = "Назовите страну";
    }

    return {
      country,
      hintType,
      taskType,
      imagePath,
      imageType,
      target,
      taskLabel
    };
  }

  // --- Показ вопроса ---

  function showQuestion(q) {
    currentQuestion = q;
    answered = false;

    // Картинка
    const wrap = document.getElementById("game-image-wrap");
    wrap.className = "game-image-wrap slide-in-right";
    wrap.innerHTML = `
      <img src="${q.imagePath}" alt="Подсказка" onerror="this.style.display='none';this.parentElement.querySelector('.game-image-placeholder').style.display='flex';">
      <div class="game-image-placeholder" style="display:none;flex-direction:column;gap:8px;align-items:center;">
        <span style="font-size:48px;">${q.hintType === "flag" ? "🏳️" : q.hintType === "borders" ? "🗺️" : "🏙️"}</span>
        <span style="font-size:13px;color:var(--text-light);">Изображение скоро появится</span>
      </div>
    `;

    // Метка задачи
    document.getElementById("task-label").textContent = q.taskLabel;

    // Очистка формы
    const input = document.getElementById("answer-input");
    input.value = "";
    input.className = "answer-input";
    input.disabled = false;
    input.focus();

    const btn = document.getElementById("answer-btn");
    btn.textContent = "Ответить";
    btn.disabled = false;

    document.getElementById("game-feedback").className = "game-feedback";
    document.getElementById("game-feedback").textContent = "";
    document.getElementById("btn-skip").style.display = "";
    document.getElementById("btn-next").style.display = "none";
  }

  // --- Следующий вопрос ---

  function nextQuestion() {
    const q = generateQuestion();
    if (!q) return;

    // Анимация выезда старой карточки
    const wrap = document.getElementById("game-image-wrap");
    if (wrap && currentQuestion) {
      wrap.classList.add("slide-out-left");
      setTimeout(() => showQuestion(q), 300);
    } else {
      showQuestion(q);
    }

    updateStatsDisplay();
  }

  // --- Проверка ответа ---

  function checkAnswer() {
    if (answered || !currentQuestion) return;

    const input = document.getElementById("answer-input");
    const userInput = input.value.trim();
    if (!userInput) return;

    answered = true;
    const result = AnswerChecker.check(userInput, currentQuestion.target);
    const feedback = document.getElementById("game-feedback");
    const wrap = document.getElementById("game-image-wrap");
    const user = DB.getCurrentUser();

    if (result.correct) {
      // Правильный ответ
      input.classList.add("correct");
      feedback.className = "game-feedback show correct";
      feedback.textContent = "✅ Правильно!";
      wrap.classList.add("flip-success", "glow-success");
      setTimeout(() => wrap.classList.remove("flip-success", "glow-success"), 800);

      // Конфетти
      Confetti.burst();

      DB.updateStats(user.id, true);
    } else {
      // Неправильный ответ
      input.classList.add("wrong");
      feedback.className = "game-feedback show wrong";
      feedback.textContent = `❌ Правильный ответ: ${currentQuestion.target.name}`;
      wrap.classList.add("shake");
      setTimeout(() => wrap.classList.remove("shake"), 500);

      DB.updateStats(user.id, false);
    }

    // Блокируем ввод, показываем "Дальше"
    input.disabled = true;
    const btn = document.getElementById("answer-btn");
    btn.disabled = true;
    document.getElementById("btn-skip").style.display = "none";
    document.getElementById("btn-next").style.display = "";

    updateStatsDisplay();
  }

  // --- Пропуск вопроса ---

  function skipQuestion() {
    if (!currentQuestion) return;
    const user = DB.getCurrentUser();
    DB.updateStats(user.id, false);
    nextQuestion();
  }

  // --- Обновление статистики в топ-баре ---

  function updateStatsDisplay() {
    const user = DB.getCurrentUser();
    if (!user) return;

    const s = user.stats;
    const acc = s.totalQuestions > 0
      ? Math.round((s.correct / s.totalQuestions) * 100)
      : 0;

    document.getElementById("player-badge-avatar").textContent = user.avatar;
    document.getElementById("player-badge-name").textContent = user.name;
    document.getElementById("stat-correct").textContent = `✅ ${s.correct}`;
    document.getElementById("stat-wrong").textContent = `❌ ${s.wrong}`;

    // Стрик
    const streakEl = document.getElementById("streak-badge");
    if (s.currentStreak >= 3) {
      streakEl.style.display = "";
      streakEl.textContent = `🔥 ${s.currentStreak}`;
      streakEl.classList.add("streak-pop");
      setTimeout(() => streakEl.classList.remove("streak-pop"), 500);
    } else {
      streakEl.style.display = "none";
    }
  }

  // --- События ---

  function bindEvents() {
    document.getElementById("answer-btn").addEventListener("click", checkAnswer);
    document.getElementById("btn-skip").addEventListener("click", skipQuestion);
    document.getElementById("btn-next").addEventListener("click", nextQuestion);

    document.getElementById("answer-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkAnswer();
    });

    // Кнопки в топ-баре
    document.getElementById("btn-settings").addEventListener("click", () => {
      App.showScreen("settings");
    });
    document.getElementById("btn-leaderboard").addEventListener("click", () => {
      App.showScreen("leaderboard");
    });
    document.getElementById("btn-home").addEventListener("click", () => {
      App.showScreen("welcome");
    });
  }

  return { init, nextQuestion, updateStatsDisplay };
})();
