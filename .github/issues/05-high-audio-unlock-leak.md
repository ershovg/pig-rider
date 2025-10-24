# [HIGH] Memory Leak в SoundManager.setupAudioUnlock (Edge Case)

**Labels:** `bug`, `high`, `memory-leak`, `edge-case`
**Priority:** 🟠 HIGH
**Files:** `src/managers/sound/SoundManager.js:55-69, 261-269`

## ⚠️ Описание проблемы

Если `SoundManager.destroy()` вызывается **ДО** того, как пользователь кликнул (audio unlock), event listeners остаются в памяти.

## Код с проблемой

```javascript
// SoundManager.js:55
setupAudioUnlock() {
  const unlockAudio = () => {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    console.log('🔓 Audio context unlocked');

    // ✅ Listeners удаляются ПОСЛЕ unlock
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };

  // ❌ Но если destroy() вызывается ДО unlock, listeners остаются!
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

// SoundManager.js:261
destroy() {
  this.stopAll();

  this.sounds.forEach(sound => sound.unload());
  this.sounds.clear();

  this.musicStateManager = null;

  // ❌ НЕТ очистки unlock listeners!
  console.log('🗑️ SoundManager destroyed');
}
```

## Последствия

- ❌ Если игрок закрывает игру до первого клика, listeners остаются в памяти
- ❌ Edge case, но может произойти в реальных условиях
- ❌ 3 listeners в `document` остаются навсегда

## Воспроизведение

1. Открыть игру
2. **НЕ КЛИКАТЬ** нигде
3. Закрыть вкладку или перезагрузить страницу
4. **Результат:** 3 event listeners остались в памяти (click, touchstart, keydown)

**Сценарий когда это может произойти:**
- Пользователь открыл игру, но отвлекся
- Пользователь случайно открыл игру и сразу закрыл вкладку
- Игра загружается в фоне, но пользователь переключается на другую вкладку

## Решение

```javascript
// src/managers/sound/SoundManager.js

constructor(config = {}) {
  // ... existing code ...

  // ✅ Сохраняем ссылки на unlock listeners
  this.unlockListeners = null;

  // Setup audio unlock
  this.setupAudioUnlock();
}

setupAudioUnlock() {
  const unlockAudio = () => {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    console.log('🔓 Audio context unlocked');

    // ✅ Вызываем helper метод для очистки
    this._removeUnlockListeners();
  };

  // ✅ Сохраняем ссылку на функцию
  this.unlockListeners = { unlockAudio };

  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

/**
 * ✅ Helper метод для удаления unlock listeners
 * @private
 */
_removeUnlockListeners() {
  if (!this.unlockListeners) return;

  const { unlockAudio } = this.unlockListeners;
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('touchstart', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);

  this.unlockListeners = null;
}

destroy() {
  // ✅ Очищаем unlock listeners перед destroy
  this._removeUnlockListeners();

  this.stopAll();

  this.sounds.forEach(sound => sound.unload());
  this.sounds.clear();

  this.musicStateManager = null;

  console.log('🗑️ SoundManager destroyed');
}
```

## Чек-лист исправления

- [ ] Добавить `this.unlockListeners = null` в конструктор
- [ ] Сохранять ссылку на `unlockAudio` функцию
- [ ] Создать метод `_removeUnlockListeners()`
- [ ] Вызывать `_removeUnlockListeners()` в двух местах:
  - [ ] В `unlockAudio()` после успешного unlock
  - [ ] В `destroy()` перед очисткой ресурсов
- [ ] Протестировать сценарий: открыть игру → закрыть БЕЗ клика
- [ ] Проверить через DevTools → Event Listeners, что listeners удалены

## Связанные файлы

- `src/managers/sound/SoundManager.js:55-69` - `setupAudioUnlock()` (требует изменений)
- `src/managers/sound/SoundManager.js:261-269` - `destroy()` (требует изменений)
- `src/Game.js:110-146` - инициализирует `SoundManager`

## Дополнительная информация

**Как проверить fix:**
1. Открыть DevTools → Console
2. Открыть игру (но НЕ кликать)
3. В консоли выполнить:
   ```javascript
   getEventListeners(document).click.length // Должно быть 1
   ```
4. Перезагрузить страницу (БЕЗ клика)
5. Снова проверить:
   ```javascript
   getEventListeners(document).click.length // Должно быть 1, а не 2!
   ```

## Приоритет

**HIGH** - хотя это edge case, listeners в `document` особенно проблематичны для memory management.
