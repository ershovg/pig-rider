# [CRITICAL] Добавить отсутствующую константу CONFIG.CULLING.THRESHOLD

**Labels:** `bug`, `critical`, `undefined-reference`
**Priority:** 🔴 CRITICAL
**Files:** `src/systems/SpawnSystem.js:99`, `src/config/constants.js`

## 🚨 Описание проблемы

`SpawnSystem.js` использует константу `CONFIG.CULLING.THRESHOLD`, которая не определена в `constants.js`.

## Код с проблемой

```javascript
// src/systems/SpawnSystem.js:99
update(deltaTime, gameSpeed, context = {}) {
  // ...
  const cullThreshold = CONFIG.CULLING.THRESHOLD; // ❌ undefined!

  this.obstacleSpawner.update(deltaTime, gameSpeed, { difficultyManager, cullThreshold });
  // ...
}
```

В `src/config/constants.js` константа отсутствует:

```javascript
CULLING: {
  LEFT_MULTIPLIER: 0.08,
  RIGHT_MULTIPLIER: 1.15,
  TIME_BUDGET_MS: 1,
  DECORATION_INTERVAL: 5
  // ❌ THRESHOLD - НЕТ!
}
```

## Последствия

- ❌ `cullThreshold` будет `undefined`
- ❌ Culling система работает некорректно (объекты не удаляются вовремя)
- ❌ Performance degradation при длительной игре
- ❌ Возможная утечка памяти из-за неудаленных объектов

## Решение

**ВАРИАНТ 1 (рекомендуется):** Добавить константу в `constants.js`:

```diff
// src/config/constants.js
export const CONFIG = {
  // ...
  CULLING: {
    LEFT_MULTIPLIER: 0.08,
    RIGHT_MULTIPLIER: 1.15,
    TIME_BUDGET_MS: 1,
    DECORATION_INTERVAL: 5,
+   THRESHOLD: -200  // Левая граница за экраном для culling
  }
}
```

**ВАРИАНТ 2:** Использовать вычисляемое значение в `SpawnSystem.js`:

```diff
// src/systems/SpawnSystem.js:99
- const cullThreshold = CONFIG.CULLING.THRESHOLD;
+ const cullThreshold = -(CONFIG.CANVAS_WIDTH * CONFIG.CULLING.LEFT_MULTIPLIER);
```

## Чек-лист исправления

- [ ] Выбрать ВАРИАНТ 1 или ВАРИАНТ 2
- [ ] Внести изменения в соответствующий файл
- [ ] Проверить, что `cullThreshold` корректно вычисляется
- [ ] Протестировать culling систему (объекты должны удаляться за левым краем экрана)
- [ ] Запустить игру и проверить через Performance Monitor, что объекты удаляются
- [ ] Проверить через console.log, что `cullThreshold` не `undefined`

## Связанные файлы

- `src/systems/SpawnSystem.js` - использует константу
- `src/config/constants.js` - должна содержать константу
- `src/managers/CullingManager.js` - использует CULLING конфигурацию

## Приоритет

**КРИТИЧЕСКИЙ** - ломает culling систему и может вызвать performance проблемы.
