# [HIGH] Memory Leak в UIController - не удаляются event listeners

**Labels:** `bug`, `high`, `memory-leak`, `performance`
**Priority:** 🟠 HIGH
**Files:** `src/ui/UIController.js:204-221, 246-249`

## ⚠️ Описание проблемы

Метод `setupEventListeners()` добавляет event listeners к кнопкам, но метод `destroy()` их не удаляет.

## Код с проблемой

```javascript
// UIController.js:204 - добавляет listeners
setupEventListeners(callbacks) {
  // Start button
  if (callbacks.onPlayClick && this.startBtn) {
    this.startBtn.addEventListener('click', (e) => {  // ❌ Listener добавлен
      e.preventDefault();
      callbacks.onPlayClick();
    });
  }

  // TODO: Добавить остальные кнопки когда будут готовы в Webflow
}

// UIController.js:246 - НЕ удаляет listeners
destroy() {
  // Remove event listeners if needed
  // ❌ НЕТ removeEventListener!
  console.log('🗑️ UIController destroyed');
}
```

## Последствия

- ❌ При каждом рестарте игры listeners накапливаются
- ❌ Multiple calls к callbacks при клике (если игра перезапускается несколько раз)
- ❌ Memory leak в long-running sessions
- ❌ Потенциальное замедление игры после множественных рестартов

## Воспроизведение

1. Запустить игру
2. Нажать "Play"
3. Проиграть/выиграть
4. Нажать "Retry" (перезапуск игры)
5. Повторить шаги 2-4 несколько раз
6. **Результат:** При каждом рестарте добавляется новый listener, старые не удаляются

## Решение

```javascript
// src/ui/UIController.js

constructor() {
  // ... existing code ...

  // ✅ Сохраняем ссылки на bound функции
  this.boundCallbacks = {};
}

setupEventListeners(callbacks) {
  // Start button
  if (callbacks.onPlayClick && this.startBtn) {
    // ✅ Сохраняем bound функцию
    this.boundCallbacks.onPlayClick = (e) => {
      e.preventDefault();
      callbacks.onPlayClick();
    };
    this.startBtn.addEventListener('click', this.boundCallbacks.onPlayClick);
  }

  // ✅ Аналогично для других кнопок (когда будут добавлены)
  // if (callbacks.onRetry && this.retryBtn) {
  //   this.boundCallbacks.onRetry = callbacks.onRetry;
  //   this.retryBtn.addEventListener('click', this.boundCallbacks.onRetry);
  // }
}

destroy() {
  // ✅ Удаляем все listeners
  if (this.startBtn && this.boundCallbacks.onPlayClick) {
    this.startBtn.removeEventListener('click', this.boundCallbacks.onPlayClick);
  }

  // ✅ Очищаем ссылки
  this.boundCallbacks = {};

  console.log('🗑️ UIController destroyed');
}
```

## Чек-лист исправления

- [ ] Добавить `this.boundCallbacks = {}` в конструктор
- [ ] Сохранять bound функции в `setupEventListeners()`
- [ ] Удалять все listeners в `destroy()`
- [ ] Протестировать многократный рестарт игры (5-10 раз)
- [ ] Проверить через DevTools → Memory, что listeners не накапливаются
- [ ] Убедиться, что кнопки работают после рестарта

## Связанные файлы

- `src/ui/UIController.js` - требует изменений
- `src/Game.js:399` - вызывает `this.ui.destroy()`

## Дополнительная информация

**Как проверить fix:**
1. Открыть DevTools → Memory
2. Сделать Heap Snapshot перед первым запуском игры
3. Запустить игру, рестартнуть 10 раз
4. Сделать еще один Heap Snapshot
5. Сравнить количество event listeners (должно остаться ~1, а не увеличиться до ~10)

## Приоритет

**HIGH** - memory leak влияет на производительность при длительной игре.
