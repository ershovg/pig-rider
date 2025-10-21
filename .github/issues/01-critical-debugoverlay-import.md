# [CRITICAL] Удалить импорт несуществующего DebugOverlay

**Labels:** `bug`, `critical`, `runtime-error`
**Priority:** 🔴 CRITICAL
**Files:** `src/Game.js:21, 198, 411`

## 🚨 Описание проблемы

Файл `src/utils/DebugOverlay.js` был удален в предыдущих коммитах, но импорт остался в `Game.js`.

## Код с проблемой

```javascript
// src/Game.js:21
import { DebugOverlay } from './utils/DebugOverlay.js'; // ❌ Файл не существует!

// src/Game.js:46
this.debugOverlay = null;

// src/Game.js:198 (закомментировано, но импорт остался)
// this.debugOverlay = new DebugOverlay(this.renderer, this.cullingManager);

// src/Game.js:411
if (this.debugOverlay) this.debugOverlay.destroy(); // ❌ Попытка вызвать метод
```

## Последствия

- ❌ Игра может не запуститься в production при включенной оптимизации
- ❌ Потенциальный runtime crash при вызове `destroy()`
- ❌ Ошибка module resolution при сборке

## Решение

Удалить все упоминания `DebugOverlay` из `Game.js`:

```diff
// src/Game.js
- import { DebugOverlay } from './utils/DebugOverlay.js';

  constructor() {
    // ...
-   this.debugOverlay = null;
  }

  destroy() {
    this.stopPoolLogging();
-   if (this.debugOverlay) this.debugOverlay.destroy();
    if (this.gameLoop) this.gameLoop.stop();
    // ...
  }
```

## Чек-лист исправления

- [ ] Удалить импорт в `src/Game.js:21`
- [ ] Удалить `this.debugOverlay = null` в конструкторе (строка 46)
- [ ] Удалить `if (this.debugOverlay) this.debugOverlay.destroy()` в методе `destroy()` (строка 411)
- [ ] Запустить `npm run build` и убедиться, что нет ошибок
- [ ] Протестировать запуск игры в dev и production режимах

## Связанные файлы

- `src/Game.js` - требует изменений
- `src/utils/DebugOverlay.js` - файл удален (причина проблемы)

## Приоритет

**КРИТИЧЕСКИЙ** - должен быть исправлен перед любым релизом.
