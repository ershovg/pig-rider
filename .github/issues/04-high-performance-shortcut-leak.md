# [HIGH] Memory Leak в Game.setupPerformanceShortcut

**Labels:** `bug`, `high`, `memory-leak`, `performance`
**Priority:** 🟠 HIGH
**Files:** `src/Game.js:67-76, 394-401`

## ⚠️ Описание проблемы

Метод `setupPerformanceShortcut()` добавляет `keydown` listener к `document`, но никогда его не удаляет при вызове `destroy()`.

## Код с проблемой

```javascript
// Game.js:67
setupPerformanceShortcut() {
  document.addEventListener('keydown', (e) => {  // ❌ Listener никогда не удаляется
    // Shift+P для toggle Performance Monitor
    if (e.shiftKey && e.key === 'P') {
      if (this.performanceMonitor) {
        this.performanceMonitor.toggle();
      }
    }
  });
}

// Game.js:394
destroy() {
  this.stopPoolLogging();
  if (this.debugOverlay) this.debugOverlay.destroy();
  if (this.gameLoop) this.gameLoop.stop();
  // ...
  // ❌ НЕТ removeEventListener для Performance shortcut!
}
```

## Последствия

- ❌ При каждом создании `new Game()` добавляется новый listener
- ❌ Множественные listeners накапливаются в `document`
- ❌ Memory leak при повторных играх
- ❌ При нажатии Shift+P могут вызваться несколько обработчиков одновременно

## Воспроизведение

1. Запустить игру (первый `new Game()`)
2. Проиграть/выиграть
3. Нажать "Retry" → создается новый `new Game()`
4. Повторить шаги 2-3 несколько раз
5. **Результат:** В `document` накопилось N keydown listeners (где N = количество рестартов)

## Решение

```javascript
// src/Game.js

constructor() {
  // ... existing code ...

  // ✅ Сохраняем ссылку на bound функцию
  this.boundPerformanceShortcut = null;

  // 🆕 Keyboard shortcut для Performance Monitor (Shift+P)
  this.setupPerformanceShortcut();
}

setupPerformanceShortcut() {
  // ✅ Создаем bound функцию и сохраняем ссылку
  this.boundPerformanceShortcut = (e) => {
    // Shift+P для toggle Performance Monitor
    if (e.shiftKey && e.key === 'P') {
      if (this.performanceMonitor) {
        this.performanceMonitor.toggle();
      }
    }
  };

  // ✅ Добавляем listener с сохраненной ссылкой
  document.addEventListener('keydown', this.boundPerformanceShortcut);
}

destroy() {
  this.stopPoolLogging();
  if (this.debugOverlay) this.debugOverlay.destroy();
  if (this.gameLoop) this.gameLoop.stop();
  if (this.player) this.player.destroy();
  if (this.ui) this.ui.destroy();
  if (this.renderer) this.renderer.destroy();

  // ✅ Удаляем keydown listener
  if (this.boundPerformanceShortcut) {
    document.removeEventListener('keydown', this.boundPerformanceShortcut);
    this.boundPerformanceShortcut = null;
  }
}
```

## Чек-лист исправления

- [ ] Добавить `this.boundPerformanceShortcut = null` в конструктор
- [ ] Сохранить bound функцию в `setupPerformanceShortcut()`
- [ ] Удалить listener в `destroy()`
- [ ] Протестировать Shift+P после рестарта игры
- [ ] Проверить через DevTools → Event Listeners, что listener удаляется
- [ ] Убедиться, что Shift+P работает корректно после нескольких рестартов

## Связанные файлы

- `src/Game.js:67-76` - `setupPerformanceShortcut()` (требует изменений)
- `src/Game.js:394-401` - `destroy()` (требует изменений)
- `src/managers/PerformanceMonitor.js` - использует toggle метод

## Дополнительная информация

**Как проверить fix:**
1. Открыть DevTools → Elements → Event Listeners
2. Выбрать `document` в инспекторе
3. Проверить количество `keydown` listeners
4. Запустить игру, рестартнуть несколько раз
5. **До fix:** Количество listeners увеличивается
6. **После fix:** Количество остается = 1

## Приоритет

**HIGH** - memory leak в global scope (`document`) особенно проблематичен.
