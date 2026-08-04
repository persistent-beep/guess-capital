// ============================================================
// leaderboard.js — экран 4: Рейтинг
// Топ игроков по accuracy (правильных / всего)
// ============================================================

const Leaderboard = (() => {

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
    const board = DB.getLeaderboard();
    const listEl = document.getElementById("leaderboard-list");
    const currentUserId = DB.getCurrentUser()?.id;

    if (board.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Нет игроков пока.<br>Создайте первого!</div>`;
      return;
    }

    listEl.innerHTML = board.map((entry, i) => {
      const rank = i + 1;
      let rankClass = "normal";
      if (rank === 1) rankClass = "gold";
      else if (rank === 2) rankClass = "silver";
      else if (rank === 3) rankClass = "bronze";

      const isCurrent = entry.id === currentUserId;
      const medal = rank === 1 ? "🏆" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

      return `
        <div class="leaderboard-entry ${isCurrent ? "current-user" : ""}">
          <div class="leaderboard-rank ${rankClass}">${medal}</div>
          <span class="avatar">${entry.avatar}</span>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${entry.name}${isCurrent ? " (вы)" : ""}</div>
            <div class="leaderboard-stats">
              ✅ ${entry.stats.correct} · ❌ ${entry.stats.wrong} · Всего: ${entry.stats.totalQuestions}
            </div>
          </div>
          <div class="leaderboard-accuracy">${entry.accuracy}%</div>
        </div>
      `;
    }).join("");
  }

  // --- События ---

  function bindEvents() {
    document.getElementById("btn-leaderboard-back").addEventListener("click", () => {
      App.showScreen("game");
    });
  }

  return { init, render };
})();
