// ============================================================
// auth.js — экран 1: Welcome / Login
// Создание, выбор, удаление игроков
// ============================================================

const Auth = (() => {

  const AVATARS = ["🦊","🐼","🦁","🐸","🦉","🐙","🦄","🐲","🦖","🐧","🦜","🐳","🦝","🐨","🐯","🦩","🦔","🐢"];

  let selectedAvatar = AVATARS[0];
  let eventsBound = false;

  // --- Инициализация экрана ---

  function init() {
    render();
    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
  }

  // --- Рендер ---

  function render() {
    const users = DB.getUsers();
    const listEl = document.getElementById("player-list");
    const titleEl = document.getElementById("player-list-title");

    if (users.length === 0) {
      titleEl.textContent = "Игроков пока нет — создайте первого!";
      listEl.innerHTML = "";
      return;
    }

    titleEl.textContent = "Выберите игрока:";
    listEl.innerHTML = users.map((u) => {
      const acc = u.stats.totalQuestions > 0
        ? Math.round((u.stats.correct / u.stats.totalQuestions) * 100)
        : 0;
      return `
        <div class="player-card" data-id="${u.id}">
          <div class="avatar">${u.avatar}</div>
          <div class="player-card-info">
            <div class="player-card-name">${u.name}</div>
            <div class="player-card-stats">🎯 ${acc}% · ✅ ${u.stats.correct} · ❌ ${u.stats.wrong}</div>
          </div>
          <button class="player-card-delete" data-delete="${u.id}" title="Удалить">🗑</button>
        </div>
      `;
    }).join("");
  }

  // --- События ---

  function bindEvents() {
    // Кнопка "Создать игрока"
    document.getElementById("btn-create-player").addEventListener("click", openCreateModal);

    // Выбор игрока (делегирование)
    document.getElementById("player-list").addEventListener("click", (e) => {
      const deleteBtn = e.target.closest("[data-delete]");
      if (deleteBtn) {
        e.stopPropagation();
        const id = deleteBtn.dataset.delete;
        if (confirm("Удалить игрока?")) {
          DB.deleteUser(id);
          render();
        }
        return;
      }
      const card = e.target.closest(".player-card");
      if (card) {
        DB.setCurrentUser(card.dataset.id);
        App.showScreen("game");
      }
    });

    // Модалка
    document.getElementById("modal-cancel").addEventListener("click", closeCreateModal);
    document.getElementById("modal-confirm").addEventListener("click", handleCreate);
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") closeCreateModal();
    });

    // Enter в поле имени
    document.getElementById("player-name-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleCreate();
    });
  }

  // --- Модалка создания ---

  function openCreateModal() {
    selectedAvatar = AVATARS[0];
    document.getElementById("player-name-input").value = "";
    renderAvatarPicker();
    document.getElementById("modal-overlay").classList.add("active");
    setTimeout(() => document.getElementById("player-name-input").focus(), 100);
  }

  function closeCreateModal() {
    document.getElementById("modal-overlay").classList.remove("active");
  }

  function renderAvatarPicker() {
    const picker = document.getElementById("avatar-picker");
    picker.innerHTML = AVATARS.map((a) => `
      <div class="avatar-option ${a === selectedAvatar ? "selected" : ""}" data-avatar="${a}">${a}</div>
    `).join("");

    picker.onclick = (e) => {
      const opt = e.target.closest(".avatar-option");
      if (opt) {
        selectedAvatar = opt.dataset.avatar;
        renderAvatarPicker();
      }
    };
  }

  function handleCreate() {
    const name = document.getElementById("player-name-input").value.trim();
    if (!name) {
      document.getElementById("player-name-input").focus();
      return;
    }

    const user = DB.createUser(name, selectedAvatar);
    DB.setCurrentUser(user.id);
    closeCreateModal();
    App.showScreen("game");
  }

  return { init, render };
})();
