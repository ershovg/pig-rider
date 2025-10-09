# 🔧 Рефакторинг архитектуры - Summary

## ✅ Что сделано

### 1. Разделение ответственности: PixiJS (WebGL) + HTML/CSS

**ДО:**
- ❌ Весь UI создавался в PixiJS (StartModal.js, EndModal.js, HUD.js)
- ❌ Тексты, кнопки, модалки рендерились через PixiJS Graphics/Text
- ❌ Сложно стилизовать и менять дизайн

**ПОСЛЕ:**
- ✅ PixiJS (WebGL) - только игровой рендеринг (свинка, монеты, препятствия)
- ✅ HTML/CSS - весь UI (экраны, модалки, кнопки, HUD)
- ✅ Легко менять стили через CSS

---

## 📁 Новая структура файлов

```
game/
├── index.html                    # HTML структура UI (NEW!)
│   ├── #loading-screen          # Экран загрузки
│   ├── #start-screen            # Стартовый экран
│   ├── #game-hud                # HUD (счётчик монет)
│   ├── #booster-modal           # Модалка бустера
│   ├── #win-screen              # Экран победы
│   └── #lose-screen             # Экран проигрыша
│
├── src/
│   ├── Game.js                  # ОБНОВЛЁН - работает с UIController
│   ├── config/constants.js      # ОБНОВЛЁН - добавлены TARGET_COINS, BOOSTER_DURATION
│   │
│   ├── ui/
│   │   └── UIController.js      # NEW! - управление HTML UI
│   │
│   └── utils/
│       └── EventBus.js          # NEW! - связь PixiJS ↔ HTML UI
│
└── УДАЛЕНЫ:
    ├── src/ui/StartModal.js     # ❌ Удалён (был PixiJS)
    ├── src/ui/EndModal.js       # ❌ Удалён (был PixiJS)
    └── src/ui/HUD.js            # ❌ Удалён (был PixiJS)
```

---

## 🎯 Ключевые изменения

### 1. **index.html** - Добавлена HTML структура UI

```html
<!-- ДО: только canvas и loading -->
<div id="game-container">
  <canvas id="game-canvas"></canvas>
  <div id="loading">Loading...</div>
</div>

<!-- ПОСЛЕ: полная UI структура -->
<div id="game-container">
  <!-- PixiJS Canvas создаётся автоматически -->

  <div id="loading-screen" class="screen">...</div>
  <div id="start-screen" class="screen hidden">...</div>
  <div id="game-hud" class="hud hidden">...</div>
  <div id="booster-modal" class="modal hidden">...</div>
  <div id="win-screen" class="screen hidden">...</div>
  <div id="lose-screen" class="screen hidden">...</div>
</div>
```

**Минимальные стили:**
- `position: absolute` для наложения поверх canvas
- `z-index: 10` для UI, `z-index: 1` для canvas
- `.hidden { display: none }` для переключения экранов
- **НЕТ** цветов, шрифтов, размеров - будут добавлены позже

---

### 2. **UIController.js** - NEW! Управление HTML UI

```javascript
export class UIController {
  // Методы для управления UI:
  showStartScreen()
  hideStartScreen()
  showHUD()
  hideHUD()
  updateCoinCount(current, target)
  showBoosterModal()
  hideBoosterModal()
  showWinScreen(score)
  showLoseScreen(score)
  setupEventListeners(callbacks)
}
```

**Использование в Game.js:**
```javascript
this.ui = new UIController();
this.ui.showStartScreen();
this.ui.updateCoinCount(10, 500);
```

---

### 3. **EventBus.js** - NEW! Связь PixiJS ↔ HTML UI

```javascript
// Пример использования:
EventBus.on('coin:collected', (data) => {
  this.ui.updateCoinCount(data.score, CONFIG.TARGET_COINS);
});

EventBus.emit('coin:collected', { score: 10 });
```

**Для будущего:**
- Можно использовать для GSAP анимаций
- Для связи геймплея с UI
- Для звуков и эффектов

---

### 4. **Game.js** - Обновлён для работы с HTML UI

**Изменения:**

```javascript
// ДО:
import { HUD } from './ui/HUD.js';
import { StartModal } from './ui/StartModal.js';
import { EndModal } from './ui/EndModal.js';

this.hud = new HUD();
this.startModal = new StartModal();
this.endModal = new EndModal();

// ПОСЛЕ:
import { UIController } from './ui/UIController.js';
import { EventBus } from './utils/EventBus.js';

this.ui = new UIController();

// Инициализация:
this.ui.setupEventListeners({
  onPlayClick: () => this.startGame(),
  onBoosterContinue: () => this.resumeGame(),
  onRetry: () => this.restartGame(),
  onBookDemo: () => console.log('Book demo')
});
```

**Методы обновлены:**
- `startGame()` → `this.ui.hideStartScreen()`, `this.ui.showHUD()`
- `endGame(isWin)` → `this.ui.showWinScreen()` / `this.ui.showLoseScreen()`
- `update()` → `this.ui.updateCoinCount(this.score, CONFIG.TARGET_COINS)`

---

### 5. **config/constants.js** - Добавлены переменные

```javascript
// NEW:
TARGET_COINS: 500,        // Целевое количество монет (легко менять)
BOOSTER_DURATION: 5,      // Длительность бустера в секундах
BOOSTER_SPAWN_RATE: 0.1,  // Частота появления бустера
```

**Использование:**
```javascript
if (this.score >= CONFIG.TARGET_COINS) {
  this.endGame(true);
}
```

---

## 🎨 Что НЕ сделано (намеренно)

### ❌ НЕТ стилей и дизайна
- Минимальные CSS стили (только позиционирование)
- НЕТ цветов, шрифтов, размеров
- Тексты-заглушки ("Want a pig ride?", "Loading...")

**Почему?**
- Стили будут добавлены вручную, согласно дизайн-макету
- Последовательно, через согласование

---

## 🚀 Как работает новая архитектура

### Флоу игры:

```
1. Loading Screen (HTML) → UIController.hideLoading()
   ↓
2. Start Screen (HTML) → UIController.showStartScreen()
   ↓ [Play button click]
3. Game HUD (HTML) + PixiJS Canvas (геймплей)
   ↓
4. Coin collected → UIController.updateCoinCount()
   ↓
5. Win/Lose → UIController.showWinScreen() / showLoseScreen()
   ↓ [Try Again]
6. Restart → startGame()
```

### Разделение ответственности:

```
PixiJS (WebGL)          │  HTML/CSS
────────────────────────┼──────────────────────
✅ Свинка               │  ✅ Стартовый экран
✅ Монетки              │  ✅ HUD (счётчик)
✅ Препятствия          │  ✅ Модалки
✅ Облака               │  ✅ Кнопки
✅ Физика               │  ✅ Экраны победы/поражения
✅ Коллизии             │  ✅ GSAP анимации (позже)
```

---

## ✅ Следующие шаги

1. **Протестировать рефакторинг** - запустить игру, проверить работу
2. **Добавить стили** - последовательно, по дизайн-макету
3. **Добавить GSAP анимации** - звёзды, кнопки, облака
4. **Интегрировать Lottie** - анимации персонажей от Вани

---

## 📊 Резюме

**Что получили:**
- ✅ Чистая архитектура: PixiJS для геймплея, HTML для UI
- ✅ UIController для управления HTML элементами
- ✅ EventBus для связи Canvas ↔ UI
- ✅ Настраиваемые переменные (TARGET_COINS, BOOSTER_DURATION)
- ✅ Готово к стилизации и GSAP анимациям

**Что удалили:**
- ❌ Старые PixiJS UI компоненты (StartModal, EndModal, HUD)
- ❌ Лишние стили и цвета

**Технический долг:**
- 🔜 Добавить CSS стили по дизайн-макету
- 🔜 Реализовать GSAP анимации
- 🔜 Добавить механику Mellow Booster
- 🔜 Интегрировать Lottie анимации

---

🎉 **Рефакторинг завершён! Готово к стилизации.**
