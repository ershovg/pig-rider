# [MEDIUM] handleBoosterActivation вызывается без callback параметра

**Labels:** `bug`, `medium`, `code-quality`, `dead-code`
**Priority:** 🟡 MEDIUM
**Files:** `src/managers/GameLifecycleManager.js:75`, `src/Game.js:331`

## ⚠️ Описание проблемы

Метод `handleBoosterActivation(onConfirm)` объявлен с параметром `onConfirm`, но при вызове параметр никогда не передается, что делает его бесполезным (dead code).

## Код с проблемой

```javascript
// GameLifecycleManager.js:75 - метод ОЖИДАЕТ onConfirm
async handleBoosterActivation(onConfirm) {
  this.gameLoop.pause();

  // ... логика модала ...

  if (confirmed) {
    // ...
    await this.boosterManager.activate();
    onConfirm?.();  // ❌ onConfirm всегда undefined (никогда не передается)
  }

  this.gameLoop.resume();
}

// Game.js:331 - вызывается БЕЗ параметра
if (result.collectedBooster) {
  // ...
  this.lifecycleManager.handleBoosterActivation();  // ❌ onConfirm отсутствует
}
```

## Последствия

- ⚠️ `onConfirm?.()` никогда не вызывается
- ⚠️ Код работает, но параметр бесполезен (dead code)
- ⚠️ Нарушение контракта метода (обещает callback, но не получает его)
- ⚠️ Confusion для других разработчиков

## Решение

**ВАРИАНТ 1 (рекомендуется):** Удалить unused параметр:

```diff
// src/managers/GameLifecycleManager.js:75
- async handleBoosterActivation(onConfirm) {
+ async handleBoosterActivation() {
    this.gameLoop.pause();

    // ... логика модала ...

    if (confirmed) {
      if (this.boosterManager.isFirstBooster()) {
        this.boosterManager.markFirstBoosterUsed();
      }

      await this.boosterManager.activate();
-     onConfirm?.();  // ❌ УДАЛИТЬ
    }

    this.gameLoop.resume();
  }
```

**ВАРИАНТ 2:** Передавать callback (если планируется использовать):

```diff
// src/Game.js:331
  if (result.collectedBooster) {
    this.progressionManager.addScore(result.collectedBooster.value);

    if (this.progressionManager.checkWinCondition()) {
      this.lifecycleManager.endGame(true, this.progressionManager.getScore());
      return;
    }

-   this.lifecycleManager.handleBoosterActivation();
+   this.lifecycleManager.handleBoosterActivation(() => {
+     console.log('✅ Booster confirmed by user');
+     // Дополнительная логика после подтверждения
+   });
  }
```

## Чек-лист исправления

- [ ] Выбрать ВАРИАНТ 1 или ВАРИАНТ 2
- [ ] Если ВАРИАНТ 1:
  - [ ] Удалить параметр `onConfirm` из сигнатуры метода
  - [ ] Удалить строку `onConfirm?.()`
- [ ] Если ВАРИАНТ 2:
  - [ ] Передавать callback при вызове в `Game.js:331`
  - [ ] Добавить логику внутри callback (если нужна)
- [ ] Протестировать активацию бустера
- [ ] Убедиться, что логика работает без изменений

## Связанные файлы

- `src/managers/GameLifecycleManager.js:75` - объявление метода (требует изменений)
- `src/Game.js:331` - вызов метода (может требовать изменений)

## Дополнительная информация

**Рекомендация:** ВАРИАНТ 1 предпочтительнее, так как:
1. Нет текущего использования callback
2. Упрощает код
3. Убирает confusion

Если в будущем понадобится callback, его легко добавить обратно.

## Приоритет

**MEDIUM** - не критично, но ухудшает качество кода и может вводить в заблуждение.
