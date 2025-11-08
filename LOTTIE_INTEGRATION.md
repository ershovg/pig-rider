# 🎬 Lottie Integration Guide

Инструкция по интеграции Lottie анимаций в Pig Rider Game.

---

## 📦 Что готово

✅ Установлен `lottie-web`
✅ Добавлены методы в [UIController.js](src/features/ui/UIController.js)
✅ Добавлены контейнеры в [index.html](index.html) для локальной разработки

---

## 🗂️ Шаг 1: Разместить файлы Lottie

Положи оба `.json` файла сюда:

```
public/assets/animations/
├── tutorial-hint.json      # Анимация "collect 200 coins"
└── booster-activation.json # Эффект активации бустера
```

**Важно:** Названия файлов должны быть именно такими (или измени пути в `UIController.js`).

---

## 🌐 Шаг 2: Добавить контейнеры в Webflow

### В Webflow Designer:

Добавь эти два `<div>` **внутри `#game-root`** (перед `#game-canvas`):

```html
<!-- Lottie Animations -->
<div id="lottie-tutorial" class="lottie-overlay" style="display: none;"></div>
<div id="lottie-booster" class="lottie-overlay" style="display: none;"></div>
```

### CSS для `.lottie-overlay`:

Добавь этот класс в Webflow (или в Custom Code → Head):

```css
.lottie-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Что делает этот класс:**
- `position: absolute` - наложение поверх игры
- `z-index: 9999` - всегда на переднем плане
- `pointer-events: none` - клики проходят сквозь анимацию
- `display: flex` + `align-items/justify-content: center` - центрирование анимации

---

## 🎮 Шаг 3: Использование в коде

### 3.1 Показать Tutorial Hint (в начале игры)

В [Game.js](src/Game.js), в методе `start()` или `startGameLoop()`:

```javascript
async start() {
  // ... существующий код ...

  // Показываем tutorial hint перед стартом игры
  await this.uiController.showTutorialHint();

  // После завершения анимации - стартуем игру
  this.startGameLoop();
}
```

**Что происходит:**
1. Вызывается `showTutorialHint()`
2. Проигрывается анимация "collect 200 coins"
3. После завершения анимации - Promise resolves
4. Игра стартует

---

### 3.2 Показать Booster Activation (вместо модала)

В [Game.js](src/Game.js), в методе где обрабатывается сбор бустера:

**Вариант 1: Только Lottie (без модала)**

```javascript
async handleBoosterCollected() {
  // Ставим игру на паузу
  this.gameLoop.pause();

  // Показываем Lottie анимацию
  await this.uiController.showBoosterActivation();

  // Активируем бустер
  this.activateBooster();

  // Возобновляем игру
  this.gameLoop.resume();
}
```

**Вариант 2: Lottie + Модал (дополнительно)**

```javascript
async handleBoosterCollected() {
  this.gameLoop.pause();

  // Сначала показываем Lottie
  await this.uiController.showBoosterActivation();

  // Затем модал для подтверждения
  const accepted = await this.uiController.showBoosterModal();

  if (accepted) {
    this.activateBooster();
  }

  this.gameLoop.resume();
}
```

---

## 📍 Где найти код для изменения

### Текущая логика бустера:

Ищи в [Game.js](src/Game.js) метод, который вызывает:
```javascript
this.uiController.showBoosterModal()
```

**Замени на:**
```javascript
await this.uiController.showBoosterActivation(); // Lottie анимация
```

**Или (если нужны оба):**
```javascript
await this.uiController.showBoosterActivation(); // Lottie
await this.uiController.showBoosterModal();       // Модал для подтверждения
```

---

## 🔧 Настройка анимаций

### Изменить длительность / поведение

В [UIController.js](src/features/ui/UIController.js):

```javascript
this.lottieAnimations.tutorial = lottie.loadAnimation({
  container: this.lottieContainerTutorial,
  renderer: 'svg',        // или 'canvas' для лучшей производительности
  loop: false,            // true если нужен loop
  autoplay: true,         // false если запуск вручную
  path: '/assets/animations/tutorial-hint.json',
});
```

### Ручной контроль анимации

```javascript
// Запустить вручную
this.lottieAnimations.tutorial.play();

// Остановить
this.lottieAnimations.tutorial.stop();

// Перемотать в начало
this.lottieAnimations.tutorial.goToAndStop(0, true);
```

---

## 🚀 Деплой в Webflow

### 1. Залить файлы Lottie

**Вариант A: Webflow Assets (рекомендуется)**

1. В Webflow Designer → Assets
2. Загрузи `tutorial-hint.json` и `booster-activation.json`
3. Скопируй URLs загруженных файлов
4. Измени пути в `UIController.js`:

```javascript
path: 'https://uploads-ssl.webflow.com/YOUR-SITE-ID/tutorial-hint.json'
```

**Вариант B: GitHub CDN**

Залей файлы в репозиторий и используй:
```javascript
path: 'https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pig-rider-game@main/public/assets/animations/tutorial-hint.json'
```

### 2. Добавить контейнеры в Webflow HTML

Скопируй эти `<div>` из [index.html](index.html) в Webflow:

```html
<div id="lottie-tutorial" class="lottie-overlay" style="display: none;"></div>
<div id="lottie-booster" class="lottie-overlay" style="display: none;"></div>
```

### 3. Добавить CSS класс `.lottie-overlay`

В Webflow Designer:
1. Create new class → `lottie-overlay`
2. Скопируй стили из [index.html](index.html) (строки 42-53)

---

## 🐛 Troubleshooting

### Анимация не показывается

1. **Проверь console** - есть ли ошибки загрузки JSON?
2. **Проверь пути** - правильно ли указаны пути к `.json` файлам?
3. **Проверь контейнеры** - есть ли `#lottie-tutorial` и `#lottie-booster` в DOM?

```javascript
// Debug в console браузера:
console.log(document.getElementById('lottie-tutorial')); // Должен найти элемент
```

### Анимация не центрируется

Проверь CSS класс `.lottie-overlay` - должны быть стили:
```css
display: flex;
align-items: center;
justify-content: center;
```

### Анимация слишком большая/маленькая

Оберни контейнер в дополнительный `<div>` с фиксированной шириной:

```html
<div id="lottie-tutorial" class="lottie-overlay" style="display: none;">
  <div style="width: 400px; height: 400px;">
    <!-- Lottie рендерится здесь -->
  </div>
</div>
```

И измени в `UIController.js`:
```javascript
container: this.lottieContainerTutorial.querySelector('div')
```

---

## 📚 API Reference

### UIController методы

```javascript
// Tutorial hint
await uiController.showTutorialHint();  // Promise - resolves после завершения
uiController.hideTutorialHint();        // Принудительно скрыть

// Booster activation
await uiController.showBoosterActivation(); // Promise - resolves после завершения
uiController.hideBoosterActivation();       // Принудительно скрыть
```

---

## ✅ Чеклист интеграции

- [ ] Файлы `.json` положены в `public/assets/animations/`
- [ ] Контейнеры добавлены в Webflow HTML
- [ ] CSS класс `.lottie-overlay` добавлен в Webflow
- [ ] Методы `showTutorialHint()` / `showBoosterActivation()` вызваны в `Game.js`
- [ ] Протестировано локально (`npm run dev`)
- [ ] Собрано для Webflow (`npm run build:webflow`)
- [ ] Задеплоено в Webflow с правильными путями к JSON

---

**Готово!** 🎉

Если нужна помощь - проверь консоль браузера на ошибки.
