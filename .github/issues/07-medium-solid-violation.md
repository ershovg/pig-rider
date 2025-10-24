# [MEDIUM] Нарушение SOLID: SRP в GameLifecycleManager.handleBoosterActivation

**Labels:** `refactor`, `medium`, `architecture`, `solid`, `code-quality`
**Priority:** 🟡 MEDIUM
**Files:** `src/managers/GameLifecycleManager.js:75-114`

## ⚠️ Описание проблемы

Метод `handleBoosterActivation()` нарушает **Single Responsibility Principle** (SRP), выполняя слишком много различных обязанностей.

## Текущий код

```javascript
// GameLifecycleManager.js:75
async handleBoosterActivation(onConfirm) {
  // ✅ 1. Управление game loop
  this.gameLoop.pause();

  // ❌ 2. Управление музыкой (должно быть в SoundManager/BoosterManager)
  let volumeRestore = null;
  if (this.soundManager && this.boosterManager.isFirstBooster()) {
    console.log('🎓 First booster! Pausing music for tutorial modal...');
    volumeRestore = this.soundManager.pauseForModal(0.3);
  }

  // ❌ 3. Показ UI modal (должно быть делегировано в UIController)
  const confirmed = await this.ui.showBoosterModal();

  // ❌ 4. Восстановление музыки (должно быть в SoundManager/BoosterManager)
  if (volumeRestore) {
    volumeRestore.restore(300);
  }

  // ❌ 5. Управление booster logic (должно быть в BoosterManager)
  if (confirmed) {
    if (this.boosterManager.isFirstBooster()) {
      this.boosterManager.markFirstBoosterUsed();
    }
    await this.boosterManager.activate();
  }

  // ✅ 6. Управление game loop
  this.gameLoop.resume();
}
```

## Проблема: Too Many Responsibilities

Метод делает **6 различных вещей**:
1. ✅ Управляет game loop (pause/resume) - **правильно**
2. ❌ Управляет музыкой (volume control)
3. ❌ Показывает UI modal
4. ❌ Восстанавливает музыку
5. ❌ Проверяет "first booster" флаг
6. ❌ Активирует booster

## Последствия

- ⚠️ Высокая связанность (tight coupling)
- ⚠️ Сложность тестирования
- ⚠️ Нарушение SOLID принципов (указано в CLAUDE.md как обязательное требование)
- ⚠️ Трудно расширять без изменения этого метода

## Решение: Разделение обязанностей

**Концепция:** GameLifecycleManager должен быть только **оркестратором**, делегируя специфичную логику другим менеджерам.

### Рефакторинг:

```javascript
// src/managers/GameLifecycleManager.js
async handleBoosterActivation() {
  // ✅ Lifecycle manager - только оркестрация
  this.gameLoop.pause();

  const confirmed = await this.ui.showBoosterModal();

  if (confirmed) {
    // ✅ Делегируем всю логику в BoosterManager
    await this.boosterManager.activate();
  }

  this.gameLoop.resume();
}
```

```javascript
// src/managers/BoosterManager.js
async activate() {
  // ✅ Booster manager управляет всей booster логикой

  // 1. Управление музыкой при первом бустере
  let volumeRestore = null;
  if (this.soundManager && this.isFirstBooster()) {
    volumeRestore = this.soundManager.pauseForModal(0.3);
  }

  // 2. Проверка и пометка first booster
  if (this.isFirstBooster()) {
    this.markFirstBoosterUsed();
  }

  // 3. Восстановление музыки
  if (volumeRestore) {
    volumeRestore.restore(300);
  }

  // 4. Активация бустера
  this.preBoosterSnapshot = this.difficultyManager.createSnapshot();
  this.isActive = true;
  // ... остальная логика активации

  // 5. Музыкальный переход
  if (this.soundManager) {
    this.soundManager.setMusicState('booster');
  }
}
```

## Преимущества после рефакторинга

✅ **Single Responsibility:**
- `GameLifecycleManager` - только game flow (pause/resume/transitions)
- `BoosterManager` - вся booster логика
- `SoundManager` - вся музыкальная логика
- `UIController` - весь UI

✅ **Open/Closed:**
- Легко добавлять новые типы бустеров без изменения lifecycle

✅ **Dependency Inversion:**
- Lifecycle зависит от абстракций (managers), а не конкретных реализаций

✅ **Тестируемость:**
- Каждый менеджер можно тестировать изолированно

## Чек-лист рефакторинга

- [ ] Переместить музыкальную логику в `BoosterManager.activate()`
- [ ] Переместить проверку first booster в `BoosterManager.activate()`
- [ ] Упростить `GameLifecycleManager.handleBoosterActivation()` до оркестрации
- [ ] Обновить тесты (если есть)
- [ ] Протестировать активацию бустера
- [ ] Убедиться, что функциональность не изменилась

## Связанные файлы

- `src/managers/GameLifecycleManager.js:75-114` - требует упрощения
- `src/managers/BoosterManager.js` - принимает дополнительную логику
- `src/managers/sound/SoundManager.js` - уже имеет необходимые методы

## Дополнительная информация

**Из CLAUDE.md:**
> **⚠️ КРИТИЧЕСКИ ВАЖНО:** Весь код проекта **СТРОГО** следует **SOLID принципам**. Это не рекомендация, а обязательное требование для всего будущего кода.

Этот рефакторинг приведет код в соответствие с требованиями проекта.

## Приоритет

**MEDIUM** - архитектурная проблема, не блокирует функциональность, но ухудшает maintainability.
