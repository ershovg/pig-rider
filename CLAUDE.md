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

### 🏛️ Архитектурные Принципы

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Весь код проекта **СТРОГО** следует **SOLID принципам**. Это не рекомендация, а обязательное требование для всего будущего кода.

#### SOLID Принципы в Проекте

**1. Single Responsibility Principle (SRP)**
- Каждый класс/модуль отвечает за **одну** задачу
- ✅ `BoosterManager` - только логика бустеров, ничего больше
- ✅ `EffectManager` - только визуальные эффекты
- ✅ `SpawnSystem` - только оркестрация спавнеров
- ❌ НЕ смешивай responsibilities в одном классе

**2. Open/Closed Principle (OCP)**
- Открыт для расширения, закрыт для модификации
- ✅ Новые spawner'ы наследуют `BaseSpawner` без изменения базового класса
- ✅ Новые эффекты добавляются через `EffectManager` API
- ✅ Новые managers добавляются в `Game.js` без изменения существующих

**3. Liskov Substitution Principle (LSP)**
- Наследники должны быть взаимозаменяемы с базовым классом
- ✅ Все spawner'ы реализуют единый интерфейс `BaseSpawner`
- ✅ Все entities имеют стандартные методы: `activate()`, `update()`, `deactivate()`, `isActive()`, `getHitbox()`

**4. Interface Segregation Principle (ISP)**
- Минимальные, специфичные интерфейсы вместо "толстых"
- ✅ Managers предоставляют только необходимые публичные методы
- ✅ EventBus для loosely coupled коммуникации между модулями
- ✅ Не заставляй классы зависеть от методов, которые они не используют

**5. Dependency Inversion Principle (DIP)**
- Зависимость от абстракций, а не конкретных реализаций
- ✅ `Game.js` работает с managers через их публичные API
- ✅ Managers не зависят от конкретных implementations entities
- ✅ Используй dependency injection где возможно

**Правило для нового кода:**
> Перед написанием нового класса/модуля, спроси себя: "Соблюдаю ли я все 5 принципов SOLID?" Если нет - рефактори дизайн, прежде чем писать код.

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
│   └── constants.js      # Все константы (TARGET_COINS, скорости, размеры)
│
├── core/                # PixiJS engine
│   ├── AssetLoader.js   # Background asset loading (PixiJS manifest)
│   ├── Renderer.js      # PixiJS renderer setup
│   └── GameLoop.js      # Fixed timestep (60 FPS)
│
├── entities/            # Game objects (Player, Obstacle, Coin, Booster, Star, Cloud)
│
├── effects/             # 🆕 Визуальные эффекты (PixiJS sprites)
│   └── CoinSparkle.js   # Эффект сбора монеты
│
├── managers/            # 🆕 High-level игровая логика (SOLID)
│   ├── BoosterManager.js     # Вся логика бустеров (Single Responsibility)
│   └── EffectManager.js      # Управление визуальными эффектами
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
│   │   └── BoosterSpawner.js    # Power-up объекты
│   │
│   ├── pools/
│   │   └── EntityPoolManager.js # Централизованное управление пулами
│   │
│   └── services/
│       └── LaneSafetyService.js # Гарантирует безопасный проход
│
├── ui/
│   └── UIController.js  # Управление HTML экранами
│
├── animations/          # GSAP анимации (clouds, stars, buttons)
├── utils/               # EventBus, MathUtils, ObjectPool
│
├── Game.js              # Главный оркестратор
├── main.js              # Entry: local dev
└── webflow.js           # Entry: Webflow bundle
```

### 🆕 Новые Папки (Manager Pattern)

**`managers/`** - High-level игровая логика, следующая SOLID:
- Каждый manager отвечает за одну domain область (SRP)
- Инкапсулирует сложную логику из `Game.js`
- Предоставляет чистый публичный API
- Примеры: `BoosterManager`, `EffectManager`

**`effects/`** - Визуальные эффекты (PixiJS sprites):
- Отделены от game entities для clarity
- Управляются через `EffectManager`
- Используют object pooling через `EntityPoolManager`

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

### 6. AssetLoader

**Файл:** `src/core/AssetLoader.js`

**Паттерн:** Background Loading (PixiJS v8 best practices)

**Flow:**
1. `init()` - регистрация manifest с двумя бандлами (critical, gameplay)
2. `startBackgroundLoading()` - запуск фоновой загрузки gameplay assets (non-blocking)
3. `loadCriticalAssets()` - загрузка минимума для показа Start Screen
4. `ensureGameplayAssetsReady()` - проверка готовности перед стартом игры

**Бандлы:**
- **critical** - player, obstacle, coin, star, cloud, coin effect (для UI)
- **gameplay** - large obstacles, booster, collision effect, boost animation

**Почему это быстрее:**
```
Traditional:  [Load All Assets] → [Show UI]  (2s blocking)
Background:   [Load Critical]   → [Show UI]  (1s blocking)
                    ↓
              [Load Gameplay in background] (1s parallel)
```

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

- **Background asset loading** (PixiJS manifest + backgroundLoadBundle) для быстрого First Paint
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
1. Добавь файл в `public/assets/sprites/`
2. Добавь путь в `ASSET_PATHS` (`src/config/constants.js`)
3. Добавь в соответствующий бандл в `AssetLoader.js` manifest:
   - **critical** - если нужен для Start Screen
   - **gameplay** - если нужен только во время игры

**Отладка коллизий:**
Добавь визуализацию hitbox'ов в collision system. Hitbox'ы масштабированы: player (0.7x), obstacles (0.8x), coins (0.6x).

---

## Build Output

- **Standard build:** `dist/game.min.js` + assets (standalone)
- **Webflow build:** `dist/game.bundle.js` (ожидает PixiJS CDN)
- Source maps включены в обоих режимах для дебага
- Console logs сохранены в Webflow builds для production debugging
