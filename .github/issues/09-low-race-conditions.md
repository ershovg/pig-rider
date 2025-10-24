# [LOW] Race conditions в музыкальных переходах

**Labels:** `enhancement`, `low`, `concurrency`, `edge-case`
**Priority:** 🟢 LOW
**Files:** `src/managers/sound/states/BoosterState.js:68, 100`

## ℹ️ Описание проблемы

Музыкальные переходы используют `setTimeout` без возможности отмены, что может привести к race conditions при быстром переключении состояний.

## Код с проблемой

```javascript
// BoosterState.js:68 - setTimeout без возможности отмены
async _performBeatSyncedTransition(baseTrack) {
  const currentPosition = baseTrack.seek();
  const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

  console.log(`🎼 Waiting ${delayToNextBeat.toFixed(0)}ms for next beat...`);

  // ❌ setTimeout не может быть отменен
  await new Promise(resolve => setTimeout(resolve, delayToNextBeat));

  console.log(`✅ On beat! Starting gap crossfade...`);

  await this._performGapCrossfade(baseTrack);
}

// BoosterState.js:100 - еще один неотменяемый setTimeout
async _performGapCrossfade(baseTrack) {
  const gapDelay = fadeOutDuration * 0.8;

  // ❌ setTimeout не может быть отменен
  await new Promise(resolve => setTimeout(resolve, gapDelay));

  // ...
}
```

## Сценарий race condition

1. Пользователь собирает booster → начинается переход `gameplay → booster`
2. В процессе перехода (во время `setTimeout`) пользователь проигрывает
3. Игра вызывает `setState('defeat')` → начинается новый переход
4. **Проблема:** Старый `setTimeout` все еще выполняется параллельно с новым переходом
5. **Результат:** Конфликт состояний, неожиданное поведение музыки

## Последствия

- ⚠️ Если пользователь быстро переключает состояния, переходы могут конфликтовать
- ⚠️ Нет механизма отмены pending transitions
- ⚠️ Возможны артефакты в музыке (одновременно играют несколько треков)
- ⚠️ Сложность отладки в production

## Воспроизведение

Сложно воспроизвести, но возможно в edge cases:
1. Собрать booster
2. **Сразу** врезаться в препятствие (во время музыкального перехода)
3. **Результат:** Могут играть одновременно booster музыка и defeat звук

## Решение

### Паттерн: Cancellable Timeouts

```javascript
// src/managers/sound/states/BoosterState.js

constructor(sounds, beatSyncEngine, config = {}) {
  super('booster', sounds, config);

  this.beatSyncEngine = beatSyncEngine;
  this.intensityTrack = null;
  this.masterVolume = 1.0;

  // ✅ Отслеживаем pending transitions
  this.pendingTimeouts = [];
}

/**
 * ✅ Helper для создания cancellable timeout
 * @private
 */
_createCancellableTimeout(delay) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // Удаляем из списка после выполнения
      const index = this.pendingTimeouts.indexOf(timeoutId);
      if (index > -1) {
        this.pendingTimeouts.splice(index, 1);
      }
      resolve();
    }, delay);

    // Сохраняем ID для возможности отмены
    this.pendingTimeouts.push(timeoutId);
  });
}

/**
 * ✅ Отменяет все pending transitions
 * @private
 */
_cancelPendingTransitions() {
  this.pendingTimeouts.forEach(id => clearTimeout(id));
  this.pendingTimeouts = [];

  console.log(`🚫 [${this.name}] Cancelled ${this.pendingTimeouts.length} pending transitions`);
}

async _performBeatSyncedTransition(baseTrack) {
  const currentPosition = baseTrack.seek();
  const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

  console.log(`🎼 [${this.name}] Waiting ${delayToNextBeat.toFixed(0)}ms for next beat...`);

  // ✅ Используем cancellable timeout
  try {
    await this._createCancellableTimeout(delayToNextBeat);
  } catch (error) {
    console.warn(`⚠️ [${this.name}] Transition cancelled:`, error);
    return; // Выходим, если был отменен
  }

  console.log(`✅ [${this.name}] On beat! Starting gap crossfade...`);

  await this._performGapCrossfade(baseTrack);
}

async _performGapCrossfade(baseTrack) {
  const { fadeOutDuration, fadeInDuration, intensityVolume } = this.config;
  const gapDelay = fadeOutDuration * 0.8;

  // ... fade-out logic ...

  // ✅ Используем cancellable timeout
  try {
    await this._createCancellableTimeout(gapDelay);
  } catch (error) {
    console.warn(`⚠️ [${this.name}] Crossfade cancelled:`, error);
    return;
  }

  // ... fade-in logic ...
}

async exit(context = {}) {
  // ✅ Отменяем все pending transitions перед выходом
  this._cancelPendingTransitions();

  const { fadeOutDuration } = this.config;
  // ... остальная логика exit ...

  await super.exit(context);
}
```

## Чек-лист исправления

- [ ] Добавить `this.pendingTimeouts = []` в конструктор `BoosterState`
- [ ] Создать метод `_createCancellableTimeout(delay)`
- [ ] Создать метод `_cancelPendingTransitions()`
- [ ] Заменить все `new Promise(resolve => setTimeout(...))` на `_createCancellableTimeout()`
- [ ] Вызывать `_cancelPendingTransitions()` в методе `exit()`
- [ ] Протестировать быстрое переключение состояний
- [ ] Проверить, что музыка не конфликтует

## Связанные файлы

- `src/managers/sound/states/BoosterState.js` - основной файл (требует изменений)
- `src/managers/sound/states/GameplayState.js` - может требовать аналогичных изменений
- `src/managers/sound/MusicStateManager.js` - координирует переходы

## Дополнительная информация

**Альтернативное решение:** Использовать AbortController (ES2020+):

```javascript
async _performBeatSyncedTransition(baseTrack) {
  const controller = new AbortController();
  this.abortController = controller;

  try {
    await this._delay(delayToNextBeat, controller.signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Transition aborted');
      return;
    }
    throw error;
  }
}

_delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

exit() {
  this.abortController?.abort();
  // ...
}
```

## Приоритет

**LOW** - edge case, маловероятен в нормальном геймплее, но улучшает robustness.
