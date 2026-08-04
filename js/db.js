// ============================================================
// db.js — слой данных поверх localStorage
// Хранение пользователей, настроек, статистики
// ============================================================

const DB = (() => {
  const KEY = "gc_users";

  function _read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { users: [], currentUserId: null };
    } catch (e) {
      console.error("DB: ошибка чтения", e);
      return { users: [], currentUserId: null };
    }
  }

  function _write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.error("DB: ошибка записи", e);
    }
  }

  function _uuid() {
    return "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  /** Получить всех пользователей */
  function getUsers() {
    return _read().users;
  }

  /** Получить пользователя по ID */
  function getUser(id) {
    return _read().users.find((u) => u.id === id) || null;
  }

  /** Получить текущего активного пользователя */
  function getCurrentUser() {
    const data = _read();
    return data.users.find((u) => u.id === data.currentUserId) || null;
  }

  /** Создать нового пользователя */
  function createUser(name, avatar) {
    const data = _read();
    const user = {
      id: _uuid(),
      name: name,
      avatar: avatar || "🦊",
      createdAt: new Date().toISOString(),
      stats: {
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        bestStreak: 0,
        currentStreak: 0
      },
      settings: {
        hintType: "flag",
        taskType: "random"
      }
    };
    data.users.push(user);
    _write(data);
    return user;
  }

  /** Удалить пользователя */
  function deleteUser(id) {
    const data = _read();
    data.users = data.users.filter((u) => u.id !== id);
    if (data.currentUserId === id) {
      data.currentUserId = null;
    }
    _write(data);
  }

  /** Установить текущего пользователя */
  function setCurrentUser(id) {
    const data = _read();
    data.currentUserId = id;
    _write(data);
  }

  /** Обновить статистику пользователя */
  function updateStats(userId, isCorrect) {
    const data = _read();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return;

    user.stats.totalQuestions++;
    if (isCorrect) {
      user.stats.correct++;
      user.stats.currentStreak++;
      if (user.stats.currentStreak > user.stats.bestStreak) {
        user.stats.bestStreak = user.stats.currentStreak;
      }
    } else {
      user.stats.wrong++;
      user.stats.currentStreak = 0;
    }
    _write(data);
  }

  /** Обновить настройки пользователя */
  function updateSettings(userId, settings) {
    const data = _read();
    const user = data.users.find((u) => u.id === userId);
    if (!user) return;
    user.settings = { ...user.settings, ...settings };
    _write(data);
  }

  /** Получить рейтинг — топ пользователей по accuracy */
  function getLeaderboard() {
    const users = _read().users;
    return users
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        stats: u.stats,
        accuracy: u.stats.totalQuestions > 0
          ? Math.round((u.stats.correct / u.stats.totalQuestions) * 100)
          : 0
      }))
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return b.stats.correct - a.stats.correct;
      });
  }

  return {
    getUsers,
    getUser,
    getCurrentUser,
    createUser,
    deleteUser,
    setCurrentUser,
    updateStats,
    updateSettings,
    getLeaderboard
  };
})();
