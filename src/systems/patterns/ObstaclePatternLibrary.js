/**
 * ObstaclePatternLibrary - Библиотека безопасных паттернов препятствий
 *
 * Паттерн: Registry + Strategy
 *
 * Назначение:
 * - Хранит предопределенные безопасные комбинации препятствий
 * - Каждый паттерн ГАРАНТИРОВАННО оставляет минимум 1 свободную полосу
 * - Поддерживает difficulty scaling через веса и сложность
 *
 * Архитектурное решение:
 * Вместо runtime проверок (что может привести к race conditions),
 * используем pre-validated паттерны. Это индустриальный стандарт
 * в endless runner играх (Temple Run, Subway Surfers).
 *
 * Паттерн состоит из:
 * - lanes: массив полос для блокировки [0, 1, 2]
 * - difficulty: сложность паттерна (1-3)
 * - weight: вес для weighted random выбора
 * - name: уникальное имя для отладки
 * - offset: (опционально) смещение по X для вариаций
 *
 * Использование:
 * const library = new ObstaclePatternLibrary();
 * const pattern = library.selectPattern(currentDifficulty);
 * // pattern.lanes = [0, 1] - блокируем 0 и 1, полоса 2 свободна
 */
export class ObstaclePatternLibrary {
  constructor() {
    this.patterns = this.initializePatterns();
    this.recentPatterns = []; // Для anti-repetition
    this.maxRecentSize = 3; // Не повторять последние N паттернов
  }

  /**
   * Инициализация библиотеки паттернов
   *
   * Организация по сложности:
   * - Difficulty 1: 1 препятствие (легко)
   * - Difficulty 2: 2 препятствия (средне)
   * - Difficulty 3: 2 препятствия с вариациями (сложно)
   *
   * @returns {Array<Pattern>} Массив паттернов
   */
  initializePatterns() {
    return [
      // === ЛЕГКИЕ ПАТТЕРНЫ (1 препятствие) ===
      // Высокий вес - появляются чаще на низкой сложности
      {
        name: 'single-left',
        lanes: [0],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие слева'
      },
      {
        name: 'single-middle',
        lanes: [1],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие по центру'
      },
      {
        name: 'single-right',
        lanes: [2],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие справа'
      },

      // === СРЕДНИЕ ПАТТЕРНЫ (2 препятствия, aligned) ===
      // Средний вес - баланс между легко и сложно
      {
        name: 'double-left',
        lanes: [0, 1],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы левая и центральная полосы'
      },
      {
        name: 'double-right',
        lanes: [1, 2],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы центральная и правая полосы'
      },
      {
        name: 'double-sides',
        lanes: [0, 2],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы боковые полосы'
      },

      // === СЛОЖНЫЕ ПАТТЕРНЫ (2 препятствия, со смещением) ===
      // Низкий вес - появляются реже, только на высокой сложности
      {
        name: 'double-left-offset',
        lanes: [0, 1],
        difficulty: 3,
        weight: 10,
        offset: 300, // Второе препятствие на 300px дальше
        description: 'Левые полосы со смещением (сложный маневр)'
      },
      {
        name: 'double-right-offset',
        lanes: [1, 2],
        difficulty: 3,
        weight: 10,
        offset: 300,
        description: 'Правые полосы со смещением (сложный маневр)'
      },
      {
        name: 'double-sides-offset',
        lanes: [0, 2],
        difficulty: 3,
        weight: 10,
        offset: 250,
        description: 'Боковые полосы со смещением (требует точности)'
      }
    ];
  }

  /**
   * Выбрать паттерн с учетом сложности
   *
   * Алгоритм:
   * 1. Фильтруем паттерны по допустимой сложности
   * 2. Исключаем недавно использованные (anti-repetition)
   * 3. Применяем weighted random selection
   *
   * @param {number} currentDifficulty - Текущая сложность игры (1.0 - 3.0)
   * @returns {Pattern} Выбранный паттерн
   */
  selectPattern(currentDifficulty = 1.0) {
    // Определяем максимальную допустимую сложность паттерна
    // На низкой сложности: только difficulty 1
    // На средней: difficulty 1-2
    // На высокой: все паттерны (1-3)
    let maxDifficulty;
    if (currentDifficulty < 1.5) {
      maxDifficulty = 1; // Только легкие
    } else if (currentDifficulty < 2.5) {
      maxDifficulty = 2; // Легкие + средние
    } else {
      maxDifficulty = 3; // Все паттерны
    }

    // Фильтруем паттерны по сложности
    let availablePatterns = this.patterns.filter(
      pattern => pattern.difficulty <= maxDifficulty
    );

    // Anti-repetition: исключаем недавно использованные
    if (this.recentPatterns.length > 0) {
      availablePatterns = availablePatterns.filter(
        pattern => !this.recentPatterns.includes(pattern.name)
      );
    }

    // Если все паттерны были недавно (маловероятно), сбрасываем историю
    if (availablePatterns.length === 0) {
      this.recentPatterns = [];
      availablePatterns = this.patterns.filter(
        pattern => pattern.difficulty <= maxDifficulty
      );
    }

    // Weighted random selection
    const selected = this.weightedRandomSelect(availablePatterns);

    // Добавляем в историю
    this.recentPatterns.push(selected.name);
    if (this.recentPatterns.length > this.maxRecentSize) {
      this.recentPatterns.shift(); // Удаляем самый старый
    }

    return selected;
  }

  /**
   * Weighted random selection
   *
   * Паттерны с большим весом выбираются чаще.
   * Например, легкие паттерны (weight=30) появляются в 3 раза чаще сложных (weight=10).
   *
   * @param {Array<Pattern>} patterns - Доступные паттерны
   * @returns {Pattern} Выбранный паттерн
   */
  weightedRandomSelect(patterns) {
    // Вычисляем общий вес
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);

    // Генерируем случайное число от 0 до totalWeight
    let random = Math.random() * totalWeight;

    // Выбираем паттерн
    for (const pattern of patterns) {
      random -= pattern.weight;
      if (random <= 0) {
        return pattern;
      }
    }

    // Fallback (не должно произойти)
    return patterns[0];
  }

  /**
   * Получить паттерн по имени (для тестирования)
   *
   * @param {string} name - Имя паттерна
   * @returns {Pattern|null}
   */
  getPatternByName(name) {
    return this.patterns.find(p => p.name === name) || null;
  }

  /**
   * Получить все паттерны для difficulty level
   *
   * @param {number} difficulty - Уровень сложности (1-3)
   * @returns {Array<Pattern>}
   */
  getPatternsByDifficulty(difficulty) {
    return this.patterns.filter(p => p.difficulty === difficulty);
  }

  /**
   * Сброс истории (при рестарте игры)
   */
  reset() {
    this.recentPatterns = [];
  }

  /**
   * Получить статистику библиотеки (для отладки)
   *
   * @returns {Object}
   */
  getStats() {
    const byDifficulty = {
      1: this.patterns.filter(p => p.difficulty === 1).length,
      2: this.patterns.filter(p => p.difficulty === 2).length,
      3: this.patterns.filter(p => p.difficulty === 3).length
    };

    return {
      totalPatterns: this.patterns.length,
      byDifficulty,
      recentPatterns: this.recentPatterns,
      totalWeight: this.patterns.reduce((sum, p) => sum + p.weight, 0)
    };
  }
}
