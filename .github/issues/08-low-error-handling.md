# [LOW] Отсутствие error handling в async методах

**Labels:** `enhancement`, `low`, `robustness`, `error-handling`
**Priority:** 🟢 LOW
**Files:** Множественные async методы

## ℹ️ Описание проблемы

Многие async методы не имеют `try/catch` блоков, что может привести к unhandled promise rejections при ошибках.

## Примеры кода с проблемой

### 1. GameLifecycleManager.handleBoosterActivation

```javascript
// GameLifecycleManager.js:75
async handleBoosterActivation(onConfirm) {
  // ❌ НЕТ try/catch
  this.gameLoop.pause();

  let volumeRestore = null;
  // ... логика ...

  await this.boosterManager.activate(); // Может упасть

  this.gameLoop.resume();
}
```

### 2. MusicStateManager.setState

```javascript
// MusicStateManager.js:97
async setState(stateName, context = {}) {
  // ❌ НЕТ try/catch
  const newState = this.states.get(stateName);

  if (!newState) {
    console.error(`❌ State not found: ${stateName}`);
    return;
  }

  // Может упасть при переходах
  await this._transitionGameplayToBooster(fullContext);
}
```

### 3. BoosterState._performBeatSyncedTransition

```javascript
// BoosterState.js:59
async _performBeatSyncedTransition(baseTrack) {
  // ❌ НЕТ try/catch
  const currentPosition = baseTrack.seek();
  const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

  await new Promise(resolve => setTimeout(resolve, delayToNextBeat));

  await this._performGapCrossfade(baseTrack); // Может упасть
}
```

## Последствия

- ⚠️ Unhandled promise rejections в консоли
- ⚠️ Игра может зависнуть в паузе при ошибке
- ⚠️ Сложность отладки (не понятно где упало)
- ⚠️ Плохой UX (пользователь не понимает что произошло)

## Решение

### Паттерн 1: Try/Catch с восстановлением состояния

```javascript
// GameLifecycleManager.js
async handleBoosterActivation() {
  try {
    this.gameLoop.pause();

    const confirmed = await this.ui.showBoosterModal();

    if (confirmed) {
      await this.boosterManager.activate();
    }

    this.gameLoop.resume();
  } catch (error) {
    console.error('❌ Booster activation failed:', error);

    // ✅ Восстанавливаем состояние игры
    this.gameLoop.resume();

    // ✅ Показываем пользователю ошибку
    alert('Ошибка активации бустера. Попробуйте еще раз.');
  }
}
```

### Паттерн 2: Try/Catch с graceful degradation

```javascript
// MusicStateManager.js
async setState(stateName, context = {}) {
  try {
    const newState = this.states.get(stateName);

    if (!newState) {
      throw new Error(`State not found: ${stateName}`);
    }

    await newState.enter(fullContext);

    this.previousState = this.currentState;
    this.currentState = newState;

    console.log(`✅ State changed to: ${stateName}`);
  } catch (error) {
    console.error(`❌ Failed to change music state to ${stateName}:`, error);

    // ✅ Graceful degradation - продолжаем с текущим состоянием
    console.warn(`⚠️ Continuing with current state: ${this.currentState?.name || 'none'}`);
  }
}
```

### Паттерн 3: Try/Catch с fallback

```javascript
// BoosterState.js
async _performBeatSyncedTransition(baseTrack) {
  try {
    const currentPosition = baseTrack.seek();
    const delayToNextBeat = this.beatSyncEngine.getDelayToNextBeat(currentPosition);

    console.log(`🎼 [${this.name}] Waiting ${delayToNextBeat.toFixed(0)}ms for next beat...`);

    await new Promise(resolve => setTimeout(resolve, delayToNextBeat));

    console.log(`✅ [${this.name}] On beat! Starting gap crossfade...`);

    await this._performGapCrossfade(baseTrack);
  } catch (error) {
    console.error(`❌ [${this.name}] Beat-synced transition failed:`, error);

    // ✅ Fallback - делаем обычный crossfade без beat sync
    console.warn(`⚠️ [${this.name}] Falling back to regular crossfade`);
    await this._performGapCrossfade(baseTrack);
  }
}
```

## Чек-лист исправления

### Приоритет 1 (критичные async методы):
- [ ] `GameLifecycleManager.handleBoosterActivation()`
- [ ] `GameLifecycleManager.handleCollisionSequence()`
- [ ] `BoosterManager.activate()`

### Приоритет 2 (музыкальная система):
- [ ] `MusicStateManager.setState()`
- [ ] `MusicStateManager._transitionGameplayToBooster()`
- [ ] `MusicStateManager._transitionBoosterToGameplay()`
- [ ] `BoosterState._performBeatSyncedTransition()`
- [ ] `BoosterState._performGapCrossfade()`

### Приоритет 3 (asset loading):
- [ ] `Game.init()` (уже есть try/catch ✅)
- [ ] `AssetLoader.loadAssets()`

## Связанные файлы

- `src/managers/GameLifecycleManager.js`
- `src/managers/BoosterManager.js`
- `src/managers/sound/MusicStateManager.js`
- `src/managers/sound/states/BoosterState.js`
- `src/managers/sound/states/GameplayState.js`

## Дополнительная информация

**Best Practices:**
1. Всегда используй `try/catch` в async методах
2. Логируй ошибки с контекстом
3. Восстанавливай состояние игры при ошибках
4. Предоставляй fallback поведение где возможно
5. Показывай пользователю понятные сообщения об ошибках

**Инструменты для отладки:**
```javascript
// DevTools → Console → Settings → Enable "Log XMLHttpRequests"
// DevTools → Sources → Enable "Pause on caught exceptions"
```

## Приоритет

**LOW** - не критично, но улучшает robustness и UX при ошибках.
