// ============================================================
// answer-checker.js — модуль проверки ответа
// Нормализация → алиасы → fuzzy-match (Левенштейн)
// ============================================================

const AnswerChecker = (() => {

  // --- Нормализация строки ---

  function normalize(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/\b(the|a|an)\b/g, "")
      .replace(/[\s.\-_,]+/g, " ")
      .trim();
  }

  // --- Транслитерация EN ↔ RU ---

  const enToRu = {
    "a": "а", "b": "б", "v": "в", "g": "г", "d": "д",
    "e": "е", "yo": "ё", "zh": "ж", "z": "з", "i": "и",
    "j": "й", "k": "к", "l": "л", "m": "м", "n": "н",
    "o": "о", "p": "п", "r": "р", "s": "с", "t": "т",
    "u": "у", "f": "ф", "h": "х", "c": "ц", "ch": "ч",
    "sh": "ш", "sch": "щ", "y": "ы", "yu": "ю", "ya": "я"
  };

  const ruToEn = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
    "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
    "й": "j", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "h", "ц": "c", "ч": "ch",
    "ш": "sh", "щ": "sch", "ы": "y", "ю": "yu", "я": "ya"
  };

  function transliterate(str, map) {
    let result = "";
    let i = 0;
    while (i < str.length) {
      const two = str.slice(i, i + 2);
      if (map[two]) {
        result += map[two];
        i += 2;
        continue;
      }
      const one = str[i];
      result += map[one] || one;
      i++;
    }
    return result;
  }

  function toRussian(str) { return transliterate(str, enToRu); }
  function toEnglish(str) { return transliterate(str, ruToEn); }

  // --- Расстояние Левенштейна ---

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = Array(n + 1).fill(0);
    for (let j = 0; j <= n; j++) dp[j] = j;

    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(
          dp[j] + 1,
          dp[j - 1] + 1,
          prev + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
        prev = tmp;
      }
    }
    return dp[n];
  }

  // --- Допустимый порог опечаток ---

  function allowedDistance(len) {
    if (len <= 3) return 0;
    if (len <= 6) return 1;
    if (len <= 12) return 2;
    return 3;
  }

  // --- Главная функция проверки ---

  /**
   * @param {string} userInput — что ввёл игрок
   * @param {object} target — { name: "Москва", aliases: ["москва", "мск"] }
   * @returns {object} { correct: bool, matchType: "exact"|"alias"|"fuzzy"|"wrong" }
   */
  function check(userInput, target) {
    const input = normalize(userInput);
    if (!input) return { correct: false, matchType: "wrong" };

    // Собираем все варианты для сравнения
    const variants = new Set();
    const main = normalize(target.name);
    variants.add(main);
    variants.add(toRussian(main));
    variants.add(toEnglish(main));

    if (target.aliases) {
      for (const alias of target.aliases) {
        const a = normalize(alias);
        variants.add(a);
        variants.add(toRussian(a));
        variants.add(toEnglish(a));
      }
    }

    // 1. Точное совпадение
    if (variants.has(input)) {
      return { correct: true, matchType: "exact" };
    }

    // 2. Fuzzy-match по всем вариантам
    let bestDist = Infinity;
    for (const variant of variants) {
      const dist = levenshtein(input, variant);
      if (dist < bestDist) bestDist = dist;
    }

    const threshold = allowedDistance(main.length);
    if (bestDist <= threshold) {
      return { correct: true, matchType: "fuzzy" };
    }

    return { correct: false, matchType: "wrong" };
  }

  return { check, normalize, levenshtein };
})();
