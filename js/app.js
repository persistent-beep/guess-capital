// ============================================================
// app.js — главный контроллер
// Роутинг между экранами, инициализация, Service Worker
// ============================================================

const App = (() => {
  const screens = ["welcome", "game", "settings", "leaderboard"];

  function showScreen(name) {
    // Скрываем все экраны
    screens.forEach((s) => {
      const el = document.getElementById(s + "-screen");
      if (el) el.classList.remove("active");
    });

    // Показываем нужный
    const target = document.getElementById(name + "-screen");
    if (target) target.classList.add("active");

    // Инициализация конкретного экрана
    switch (name) {
      case "welcome":
        Auth.init();
        break;
      case "game":
        Game.init();
        break;
      case "settings":
        Settings.init();
        break;
      case "leaderboard":
        Leaderboard.init();
        break;
    }

    // Скролл наверх
    window.scrollTo(0, 0);
  }

  function init() {
    // Регистрация Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch((e) => {
        console.warn("SW не зарегистрирован:", e);
      });
    }

    // Инициализация конфетти
    Confetti.init();

    // Проверяем есть ли текущий пользователь
    const user = DB.getCurrentUser();
    if (user) {
      showScreen("game");
    } else {
      showScreen("welcome");
    }
  }

  return { showScreen, init };
})();

// ============================================================
// Confetti — эффект конфетти при правильном ответе
// ============================================================

const Confetti = (() => {
  let canvas, ctx;
  let particles = [];
  let animating = false;

  function init() {
    canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function burst() {
    if (!canvas) init();
    if (!ctx) return;

    const colors = [
      "#4facfe", "#00f2fe", "#43e97b", "#38f9d7",
      "#f6d365", "#fda085", "#fa709a", "#ffffff"
    ];
    const count = 50;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 6,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        life: 1
      });
    }

    if (!animating) {
      animating = true;
      animate();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter((p) => p.life > 0);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rotation += p.rotationSpeed;
      p.life -= 0.012;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      animating = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { init, burst };
})();

// ============================================================
// Запуск приложения
// ============================================================
document.addEventListener("DOMContentLoaded", () => App.init());
