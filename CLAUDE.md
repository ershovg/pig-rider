# CLAUDE.md

Инструкции для Claude Code при работе с этим проектом.

---

## Working Style

**ВАЖНО - Правила работы:**

- **Никогда не запускай автоматически** dev server, тесты или build команды без явного запроса
- **Используй агентов только по запросу** (faang-code-reviewer, debugger, performance-profiler)
- **Не будь чрезмерно проактивным** - делай изменения, объясняй их, дай пользователю решать, когда тестировать
- Когда пользователь спрашивает "как сделать X", **сначала ответь** - не прыгай сразу в реализацию
- Выполняй только команды, которые напрямую запрошены или явно необходимы для текущей задачи

---

## Проект: Pig Rider Game

**Endless runner** игра на PixiJS для интеграции в Webflow. Игрок управляет свиньей по трем полосам, собирает монеты, избегает препятствий.

**Ключевая особенность:** Hybrid rendering - PixiJS (WebGL) для игровых объектов, HTML/CSS для UI. Это позволяет легко стилизовать интерфейс через Webflow.

---

## Build Команды

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Стандартная сборка → dist/game.min.js
npm run build:webflow    # Webflow bundle → dist/game.bundle.js (PixiJS external)
npm run preview          # Preview production build
```

**Важно:** `build:webflow` создает IIFE bundle, который ожидает PixiJS из CDN (`window.PIXI`).

---

## Архитектура

### Entry Points

**1. Local Dev:** `src/main.js`
- Полностью автономная разработка
- Все зависимости включены

**2. Webflow:** `src/webflow.js`
- Ожидает PixiJS из CDN
- Экспортирует `window.PigRiderGame`
- Мержит `window.GAME_CONFIG` если доступен

### Hybrid Rendering Pattern

**PixiJS (WebGL):** game entities (player, obstacles, coins, decorations)
**HTML/CSS:** все UI экраны (start, HUD, modals, end screens)
**EventBus:** коммуникация между Canvas ↔ HTML UI

Это разделение - основа архитектуры. HTML UI полностью независим от PixiJS, управляется через `UIController`.

---

## Структура Проекта

```
src/
├── config/
│   ├── constants.js      # Все константы (TARGET_COINS, скорости, размеры)
│   └── env.js           # Env переменные (API keys)
│
├── core/                # PixiJS engine
│   ├── AssetLoader.js   # Загрузка assets
│   ├── Renderer.js      # PixiJS renderer setup
│   └── GameLoop.js      # Fixed timestep (60 FPS)
│
├── entities/            # Game objects (Player, Obstacle, Coin, Booster, Star, Cloud, CoinSparkle)
│
├── systems/
│   ├── SpawnSystem.js           # Orchestrator всех spawner'ов
│   ├── CollisionSystem.js       # AABB collision detection
│   ├── DifficultyManager.js     # Прогрессивное усложнение
│   │
│   ├── spawners/                # Модульные spawner'ы
│   │   ├── BaseSpawner.js       # Абстрактный базовый класс (Template Method)
│   │   ├── ObstacleSpawner.js   # Препятствия + lane safety
│   │   ├── CoinSpawner.js       # Монеты + booster mode
│   │   ├── CloudSpawner.js      # Облака (декор)
│   │   ├── StarSpawner.js       # Звезды (декор)
│   │   ├── BoosterSpawner.js    # Power-up объекты
│   │   └── SparkleSpawner.js    # Эффекты (manual trigger)
│   │
│   ├── pools/
│   │   └── EntityPoolManager.js # Централизованное управление пулами
│   │
│   └── services/
│       └── LaneSafetyService.js # Гарантирует безопасный проход
│
├── ui/
│   ├── UIController.js  # Управление HTML экранами
│   └── AIBotModal.js    # ElevenLabs AI bot (опционально)
│
├── animations/          # GSAP анимации (clouds, stars, buttons)
├── services/            # ElevenLabsService (опционально)
├── utils/               # EventBus, MathUtils, ObjectPool
│
├── Game.js              # Главный оркестратор
├── main.js              # Entry: local dev
└── webflow.js           # Entry: Webflow bundle
```

---

## Ключевые Системы

### 1. SpawnSystem (Modular Architecture)

**Паттерн:** Orchestrator (Facade) координирует специализированные spawner'ы.

**Компоненты:**
- `BaseSpawner` - абстрактный класс (Template Method Pattern)
- `EntityPoolManager` - централизованное управление пулами (Registry Pattern)
- `LaneSafetyService` - гарантирует, что хотя бы одна полоса всегда свободна
- Специализированные spawner'ы: `ObstacleSpawner`, `CoinSpawner`, `CloudSpawner`, `StarSpawner`, `BoosterSpawner`, `SparkleSpawner`

**API:**
- `update(deltaTime, gameSpeed, context)` - обновляет все spawner'ы
- `fillLaneWithCoins(lane)` - заполнить полосу монетами (booster mode)
- `clearAllObstacles()` - очистить препятствия (при бустере)
- `emitCoinSparkle(x, y)` - эффект сбора монеты
- `getActiveObstacles/Coins/Boosters()` - получить активные объекты

**Как добавить новый тип объектов:**
1. Создай Entity класс в `entities/` (имплементируй: `activate()`, `update()`, `deactivate()`, `isActive()`, `getHitbox()`)
2. Создай Spawner в `spawners/` (наследуй `BaseSpawner`, переопредели `spawn()`)
3. В `SpawnSystem.initializePools()` регистрируй пул: `this.poolManager.registerPool('name', EntityClass, size)`
4. В `SpawnSystem.initializeSpawners()` создай инстанс spawner'а
5. В `SpawnSystem.update()` вызови `this.mySpawner.update(...)`

### 2. Booster Mechanic

**Flow:**
1. Player собирает booster → игра на паузу → modal
2. User подтверждает → все препятствия удаляются
3. Одна случайная полоса заполняется монетами
4. Каждые 2 секунды полоса меняется (3 смены = 6 секунд)
5. После 6 секунд: бустер кончается, 5-секундный cooldown

**Состояние** (в `Game.js`):
- `isBoosterActive` - активен ли бустер
- `boosterTimeRemaining` - оставшееся время
- `boosterCurrentLane` - активная полоса (0, 1, 2)
- `boosterCooldownTimer` - cooldown перед следующим спавном бустера
- `preBoosterSnapshot` - сохраненное состояние difficulty manager

### 3. Configuration System

**Файл:** `src/config/constants.js`

Все параметры игры централизованы. В Webflow можно переопределить через `window.GAME_CONFIG`:

```javascript
window.GAME_CONFIG = {
  TARGET_COINS: 300,        // Условие победы
  GAME_SPEED: 1.5,          // Базовая скорость
  BOOSTER_DURATION: 8,      // Длительность бустера
  PLAYER: { SIZE: 200 }     // Размер игрока
};
```

Пути к assets используют `window.GAME_ASSETS_URL` для гибкости CDN.

### 4. UIController

**Файл:** `src/ui/UIController.js`

Управляет всеми HTML экранами без касания PixiJS:

- `showStartScreen()` / `hideStartScreen()`
- `showHUD()` / `hideHUD()`
- `updateCoinCount(current, target)`
- `showBoosterModal()` - возвращает Promise, разрешается при клике пользователя
- `showWinScreen(score)` / `showLoseScreen(score)`
- `addBoosterClass()` / `removeBoosterClass()` - визуальные эффекты HTML во время бустера

### 5. GameLoop

**Файл:** `src/core/GameLoop.js`

Fixed timestep loop (60 FPS) с поддержкой interpolation:
- Update: фиксированные шаги 16.67ms
- Render: переменная частота с alpha для интерполяции
- Pause/resume без drift

---

## Webflow Integration

### HTML Структура

Требуемые селекторы (см. `index.html`):

```html
<div id="game-root" class="game-state">
  <!-- Start Screen -->
  <div class="game-ui game-start">
    <a game-btn-start href="#">Play now</a>
  </div>

  <!-- Running Screen (HUD) -->
  <div class="game-ui game-running" style="display: none;">
    <span game-counter>0</span>/500
  </div>

  <!-- PixiJS Canvas -->
  <canvas id="game-canvas"></canvas>
</div>
```

**Селекторы:**
- `#game-canvas` - PixiJS canvas
- `.game-ui.game-start` - стартовый экран
- `.game-ui.game-running` - HUD
- `[game-btn-start]` - кнопка старта
- `[game-counter]` - текст счетчика монет

### CDN Setup

**Head:**
```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
```

**Before `</body>`:**
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pig-rider-game@main/dist/game.bundle.js"></script>
```

**Assets:** Override `window.GAME_ASSETS_URL` если нужно:
```html
<script>
  window.GAME_ASSETS_URL = 'https://uploads-ssl.webflow.com/YOUR-SITE-ID';
</script>
```

---

## Development Guidelines

### Изменение Game Balance

Редактируй `src/config/constants.js`:
- `TARGET_COINS` - условие победы
- `GAME_SPEED`, `MAX_SPEED`, `SPEED_INCREMENT` - прогрессия скорости
- `OBSTACLE.MIN_DISTANCE`, `MAX_DISTANCE` - расстояние между препятствиями
- `BOOSTER_DURATION`, `BOOSTER_LANE_SWITCH_INTERVAL` - механика бустера

### Добавление UI Экранов

1. Добавь HTML структуру в `index.html`
2. Добавь методы show/hide в `UIController.js`
3. Вызывай из `Game.js` при переходах состояния
4. Используй EventBus для Canvas ↔ UI коммуникации при необходимости

### Тестирование Webflow Build

```bash
npm run build:webflow
# Проверь, что dist/game.bundle.js создан
# Убедись, что PixiJS external (не включен в bundle)
# Протестируй в локальном HTML с PixiJS CDN перед деплоем
```

---

## Performance Notes

- **Object pooling** предотвращает GC паузы (пулы в SpawnSystem)
- **Fixed timestep** предотвращает физические проблемы при разных FPS
- **AABB collision** с пространственной оптимизацией
- **Terser minification** сжимает bundle до ~50-100KB (без PixiJS)
- **PixiJS via CDN** позволяет browser caching между страницами

---

## Common Tasks

**Изменить целевой счет:**
```javascript
// src/config/constants.js
TARGET_COINS: 500 // вместо 200
```

**Добавить новый asset:**
1. Добавь PNG в `public/assets/sprites/`
2. Добавь путь в `ASSET_PATHS` в `src/config/constants.js`
3. Загрузи в `src/core/AssetLoader.js`

**Отладка коллизий:**
Добавь визуализацию hitbox'ов в collision system. Hitbox'ы масштабированы: player (0.7x), obstacles (0.8x), coins (0.6x).

---

## Build Output

- **Standard build:** `dist/game.min.js` + assets (standalone)
- **Webflow build:** `dist/game.bundle.js` (ожидает PixiJS CDN)
- Source maps включены в обоих режимах для дебага
- Console logs сохранены в Webflow builds для production debugging

---

## ElevenLabs Integration (Optional)

Если `ELEVENLABS_API_KEY` установлен в `.env`, AI bot modal активируется при старте игры. Эта функция опциональна и отключается gracefully при отсутствии API key.
