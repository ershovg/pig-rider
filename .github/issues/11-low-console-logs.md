# [LOW] Множество console.log в production коде

**Labels:** `enhancement`, `low`, `code-quality`, `performance`
**Priority:** 🟢 LOW
**Files:** Множественные (62 файла)

## ℹ️ Описание проблемы

Проект содержит множество `console.log`, `console.warn`, `console.error` вызовов, которые остаются в production build и засоряют консоль.

## Примеры

```javascript
// Game.js:123
console.log('🎵 Sound system initialized');

// GameLoop.js:32
console.log('🎮 Game loop started');

// MusicStateManager.js:89
console.log(`✅ Initialized ${this.states.size} music states`);

// BoosterManager.js:94
console.log(`✨ Booster activated! Lane: ${this.currentLane}`);

// LaneSafetyService.js:69
console.log(`[LaneSafety] Zone: [${spawnZoneStart}, ${spawnZoneEnd.toFixed(0)}]...`);

// И многие другие...
```

## Последствия

- ⚠️ Засорение консоли в production
- ⚠️ Небольшой performance overhead (минимальный, но есть)
- ⚠️ Утечка информации о внутренней логике игры
- ⚠️ Сложность debugging (много "шума" в консоли)

## Количество console вызовов

Приблизительная оценка:
- `console.log`: ~150+ вызовов
- `console.warn`: ~20+ вызовов
- `console.error`: ~15+ вызовов

## Решение

### Вариант 1: Debug Mode Flag (рекомендуется)

```javascript
// src/utils/Logger.js (СОЗДАТЬ)

/**
 * Logger utility with debug mode support
 */
class Logger {
  constructor() {
    // ✅ DEBUG включен только в dev mode
    this.DEBUG = import.meta.env.DEV || window.GAME_DEBUG === true;
  }

  log(...args) {
    if (this.DEBUG) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (this.DEBUG) {
      console.warn(...args);
    }
  }

  error(...args) {
    // ✅ Errors логируем всегда (важны для production debugging)
    console.error(...args);
  }

  group(...args) {
    if (this.DEBUG) {
      console.group(...args);
    }
  }

  groupEnd() {
    if (this.DEBUG) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
```

**Использование:**

```diff
// Game.js
+ import { logger } from './utils/Logger.js';

  initSoundSystem() {
    this.soundManager = new SoundManager({...});
-   console.log('🎵 Sound system initialized');
+   logger.log('🎵 Sound system initialized');
  }
```

### Вариант 2: Build-time Strip (Terser)

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // ✅ Удаляет все console.* в production
        drop_console: true,

        // Или более точный контроль:
        // pure_funcs: ['console.log', 'console.warn'],  // Удаляет только эти
        // drop_debugger: true  // Удаляет debugger statements
      }
    }
  }
}
```

### Вариант 3: Комбинированный (лучший подход)

1. **Dev mode:** Все логи работают
2. **Production mode:**
   - `console.log` и `console.warn` удаляются
   - `console.error` остается для critical errors

```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // ✅ Удаляем только log и warn
        pure_funcs: ['console.log', 'console.warn'],

        // ✅ Оставляем console.error для production debugging
        // (не включаем drop_console: true)
      }
    }
  }
}
```

```javascript
// src/utils/Logger.js
class Logger {
  log(...args) {
    // ✅ В production этот вызов будет удален Terser
    console.log(...args);
  }

  error(...args) {
    // ✅ В production этот вызов ОСТАНЕТСЯ
    console.error(...args);
  }
}
```

## Чек-лист исправления

### Фаза 1: Setup Infrastructure
- [ ] Выбрать подход (рекомендуется ВАРИАНТ 3)
- [ ] Создать `src/utils/Logger.js` (если используем логгер)
- [ ] Настроить Terser в `vite.config.js`

### Фаза 2: Refactoring (опционально)
- [ ] Заменить `console.log` на `logger.log` (массовая замена)
- [ ] Заменить `console.warn` на `logger.warn`
- [ ] Оставить `console.error` как есть (или через `logger.error`)

### Фаза 3: Testing
- [ ] Запустить `npm run build`
- [ ] Проверить `dist/game.min.js` - нет ли console.log
- [ ] Запустить production build в браузере
- [ ] Убедиться, что консоль чистая
- [ ] Проверить, что console.error все еще работает

## Связанные файлы

**Высокая частота логирования:**
- `src/Game.js` - ~15 console вызовов
- `src/managers/sound/MusicStateManager.js` - ~10 вызовов
- `src/systems/services/LaneSafetyService.js` - ~5 вызовов (в цикле!)
- `src/managers/BoosterManager.js` - ~8 вызовов
- `src/core/GameLoop.js` - ~3 вызова

## Дополнительная информация

**Performance Impact:**
- Console.log в цикле может замедлить игру
- Пример: `LaneSafetyService.getBlockedLanes()` логирует каждый frame (60 FPS = 60 logs/sec!)

**Как измерить:**
```javascript
// DevTools → Performance
// Record → Start game → Stop
// Посмотреть "Scripting" time
// Сравнить с/без console.log
```

**Best Practices:**
1. ✅ Используй debug mode flag для dev logs
2. ✅ Удаляй console.log в production (Terser)
3. ✅ Оставляй console.error для critical errors
4. ✅ Используй logger wrapper для централизации
5. ❌ Никогда не логируй в hot paths (game loop)

## Пример PR

```bash
# Массовая замена через VSCode
# Find: console\.log\(
# Replace: logger.log(

# Или через sed:
find src -name "*.js" -exec sed -i 's/console\.log(/logger.log(/g' {} +
find src -name "*.js" -exec sed -i 's/console\.warn(/logger.warn(/g' {} +
```

## Приоритет

**LOW** - не критично, но улучшает профессионализм и немного performance.

---

**Рекомендация:** Начать с Terser config (быстро), потом постепенно рефакторить на Logger (если нужен более точный контроль).
