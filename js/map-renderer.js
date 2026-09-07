// ============================================================
// map-renderer.js — силуэт страны из одного файла assets/world.svg
// Подходит любая карта мира, где у страны id = ISO-код
// (регистр не важен). Отдельные borders/{code}.svg не нужны.
// ============================================================

const MapRenderer = (() => {
  const MAP_URL = "assets/world.svg";
  const RENDERABLES =
    "path, circle, ellipse, rect, polygon, polyline, line, text, image, use";

  let mapTextPromise = null;
  const svgCache = new Map(); // code -> Promise<string|null>

  function loadMapText() {
    if (!mapTextPromise) {
      mapTextPromise = fetch(MAP_URL)
        .then((r) => {
          if (!r.ok) throw new Error("world.svg не загружен: " + r.status);
          return r.text();
        })
        .catch((e) => {
          mapTextPromise = null; // при ошибке можно попробовать снова
          throw e;
        });
    }
    return mapTextPromise;
  }

  function parseViewBox(str) {
    const p = (str || "").trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p.every((n) => isFinite(n))) {
      return { x: p[0], y: p[1], w: p[2], h: p[3] };
    }
    return null;
  }

  function findByCode(root, code) {
    const c = (code || "").toLowerCase();
    if (!c) return null;
    return root.querySelector(
      '[id="' + c + '"], [id="' + c.toUpperCase() + '"]',
    );
  }

  async function buildCountrySVG(code, opts) {
    const fill = (opts && opts.fill) || "#4facfe";
    const stroke = (opts && opts.stroke) || "#0b3d66";

    const text = await loadMapText();

    // 1. Рендерим полную карту вне экрана, чтобы измерить страну
    const stage = document.createElement("div");
    stage.style.cssText =
      "position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;";
    stage.innerHTML = text;
    document.body.appendChild(stage);

    try {
      const svg = stage.querySelector("svg");
      if (!svg) return null;

      const vb = parseViewBox(svg.getAttribute("viewBox"));
      if (!vb) return null; // карта без viewBox не поддерживается

      const el = findByCode(stage, code);
      if (!el) return null; // этой страны нет на карте

      // размер сэмпла строго по пропорциям viewBox,
      // чтобы пиксели пересчитывались в координаты без искажений
      const W = 1200;
      const H = Math.max(1, Math.round((W * vb.h) / vb.w));
      svg.removeAttribute("style");
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);

      const r1 = el.getBoundingClientRect();
      const r2 = svg.getBoundingClientRect();
      if (!r2.width || !r2.height) return null;

      // 2. Пиксели -> координаты viewBox
      const sx = vb.w / r2.width;
      const sy = vb.h / r2.height;
      const bx = vb.x + (r1.left - r2.left) * sx;
      const by = vb.y + (r1.top - r2.top) * sy;
      const bw = r1.width * sx;
      const bh = r1.height * sy;
      if (bw <= 0 || bh <= 0) return null;

      // 3. Копия карты, в которой оставлена только нужная страна
      const out = svg.cloneNode(true);
      const target = findByCode(out, code);
      if (!target) return null;

      out.querySelectorAll(RENDERABLES).forEach((node) => {
        if (node === target || target.contains(node)) return;
        node.style.display = "none"; // всё остальное прячем
      });

      // 4. Перекрашиваем страну
      const parts = target.matches(RENDERABLES)
        ? [target]
        : Array.from(target.querySelectorAll(RENDERABLES));
      const strokeWidth = Math.max(bw, bh) / 150;
      parts.forEach((node) => {
        node.removeAttribute("class");
        node.removeAttribute("style");
        node.style.fill = fill;
        node.style.fillOpacity = "0.92";
        node.style.stroke = stroke;
        node.style.strokeWidth = strokeWidth;
        node.style.strokeLinejoin = "round";
      });

      // 5. Обрезаем viewBox по стране (+ отступ)
      const pad = Math.max(bw, bh) * 0.06;
      out.setAttribute(
        "viewBox",
        (bx - pad) + " " + (by - pad) + " " + (bw + pad * 2) + " " +
          (bh + pad * 2),
      );
      out.removeAttribute("width");
      out.removeAttribute("height");
      out.removeAttribute("style");
      out.removeAttribute("class");
      out.setAttribute("preserveAspectRatio", "xMidYMid meet");

      // 6. Готовая SVG-строка
      return new XMLSerializer().serializeToString(out);
    } finally {
      stage.remove();
    }
  }

  /** Promise<string|null> — inline-SVG с силуэтом страны (кешируется) */
  function getCountrySVG(code, opts) {
    if (!svgCache.has(code)) {
      svgCache.set(
        code,
        buildCountrySVG(code, opts).catch((e) => {
          console.warn("MapRenderer:", e);
          svgCache.delete(code);
          return null;
        }),
      );
    }
    return svgCache.get(code);
  }

  return { getCountrySVG };
})();
