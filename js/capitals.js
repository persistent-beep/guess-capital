// ============================================================
// capitals.js — фото столиц из русской Википедии
// (первое изображение статьи о городе)
// ============================================================

const Capitals = (() => {
  const API =
    "https://ru.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1" +
    "&prop=pageimages&piprop=thumbnail&pithumbsize=640&titles=";

  const cache = new Map(); // "Москва" -> Promise<string|null>

  async function fetchPhotoUrl(capital) {
    const r = await fetch(API + encodeURIComponent(capital));
    if (!r.ok) return null;
    const data = await r.json();
    const pages = data && data.query && data.query.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return (page && page.thumbnail && page.thumbnail.source) || null;
  }

  /** Promise<string|null> — URL фото столицы */
  function getPhoto(capital) {
    if (!cache.has(capital)) {
      cache.set(capital, fetchPhotoUrl(capital).catch(() => null));
    }
    return cache.get(capital);
  }

  return { getPhoto };
})();
