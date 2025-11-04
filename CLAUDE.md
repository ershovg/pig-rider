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

## Архитектура: Modular Monolith (Feature-Based)

**Архитектурный стиль:** Модульный монолит с организацией по доменным фичам (features), а не по техническим слоям.

**Почему Modular:**
- ✅ Все файлы одной фичи находятся рядом
- ✅ Легко понять и изменить конкретную функциональность
- ✅ Простое масштабирование (добавление новых модулей)
- ✅ Соблюдение SOLID принципов на уровне модулей

### Структура Проекта

```
src/
├── core/                           # Engine инфраструктура (PixiJS)
│   ├── Renderer.js                # PixiJS renderer setup
│   ├── GameLoop.js                # Fixed timestep (60 FPS)
│   └── AssetLoader.js             # Background asset loading
│
├── shared/                        # Общие утилиты и конфигурация
│   ├── config/
│   │   └── constants.js           # Все константы игры
│   └── utils/
│       ├── EventBus.js            # Pub/Sub для модулей
│       ├── MathUtils.js           # Математические утилиты
│       └── ObjectPool.js          # Object pooling system
│
├── features/                      # Модули по доменам (фичам)
│   │
│   ├── player/                    # Модуль: Игрок
│   │   ├── entities/
│   │   │   └── Player.js         # Entity игрока
│   │   └── controllers/
│   │       ├── PlayerInputController.js
│   │       └── PlayerPhysicsController.js
│   │
│   ├── booster/                   # Модуль: Бустеры (power-ups)
│   │   ├── entities/
│   │   │   └── Booster.js
│   │   ├── manager/
│   │   │   └── BoosterManager.js # Логика активации/деактивации
│   │   └── spawner/
│   │       └── BoosterSpawner.js
│   │
│   ├── obstacles/                 # Модуль: Препятствия
│   │   ├── entities/
│   │   │   └── Obstacle.js
│   │   ├── spawner/
│   │   │   └── ObstacleSpawner.js
│   │   └── patterns/
│   │       └── ObstaclePatternLibrary.js
│   │
│   ├── coins/                     # Модуль: Монеты и сбор
│   │   ├── entities/
│   │   │   └── Coin.js
│   │   ├── spawner/
│   │   │   └── CoinSpawner.js
│   │   └── effects/
│   │       └── CoinCollectEffect.js
│   │
│   ├── decoration/                # Модуль: Декоративные элементы
│   │   ├── entities/
│   │   │   ├── Cloud.js
│   │   │   └── Star.js
│   │   └── spawners/
│   │       ├── CloudSpawner.js
│   │       └── StarSpawner.js
│   │
│   ├── collision/                 # Модуль: Коллизии
│   │   ├── system/
│   │   │   └── CollisionSystem.js
│   │   ├── handler/
│   │   │   └── CollisionHandler.js
│   │   └── effects/
│   │       └── CollisionEffect.js
│   │
│   ├── spawning/                  # Модуль: Spawn система (оркестратор)
│   │   ├── SpawnSystem.js        # Координирует все spawner'ы
│   │   ├── spawners/
│   │   │   └── BaseSpawner.js    # Базовый класс для spawner'ов
│   │   ├── pools/
│   │   │   └── EntityPoolManager.js
│   │   └── services/
│   │       └── LaneSafetyService.js
│   │
│   ├── sound/                     # Модуль: Аудио система
│   │   ├── manager/
│   │   │   ├── SoundManager.js
│   │   │   └── MusicStateManager.js
│   │   ├── core/
│   │   │   └── BeatSyncEngine.js
│   │   └── states/
│   │       ├── BaseMusicState.js
│   │       ├── GameplayState.js
│   │       ├── BoosterState.js
│   │       ├── VictoryState.js
│   │       ├── DefeatState.js
│   │       └── CollisionState.js
│   │
│   ├── progression/               # Модуль: Прогрессия игры
│   │   ├── manager/
│   │   │   ├── ProgressionManager.js
│   │   │   └── DifficultyManager.js
│   │   └── lifecycle/
│   │       └── GameLifecycleManager.js
│   │
│   ├── effects/                   # Модуль: Визуальные эффекты
│   │   ├── manager/
│   │   │   └── EffectCoordinator.js
│   │   └── base/
│   │       ├── Collectible.js
│   │       ├── Collidable.js
│   │       └── Renderable.js
│   │
│   ├── rendering/                 # Модуль: Рендеринг оптимизация
│   │   ├── culling/
│   │   │   ├── CullingManager.js
│   │   │   └── CullingCoordinator.js
│   │   ├── interpolation/
│   │   │   └── InterpolationManager.js
│   │   ├── interfaces/
│   │   │   ├── Cullable.js
│   │   │   └── Interpolatable.js
│   │   └── animations/
│   │       ├── gsap-buttons.js
│   │       ├── gsap-clouds.js
│   │       └── gsap-stars.js
│   │
│   ├── monitoring/                # Модуль: Performance мониторинг
│   │   └── PerformanceMonitor.js
│   │
│   ├── state/                     # Модуль: State management
│   │   └── GameStateManager.js
│   │
│   ├── confetti/                  # Модуль: Конфетти анимации
│   │   └── manager/
│   │       └── ConfettiManager.js
│   │
│   └── ui/                        # Модуль: HTML/CSS интерфейс
│       └── UIController.js
│
├── Game.js                        # Главный оркестратор (композиция модулей)
├── main.js                        # Entry: local dev
└── webflow.js                     # Entry: Webflow bundle
```

### Принципы Модульной Структуры

**Модуль** = Доменная область (feature/функциональность)

Каждый модуль:
- 📦 **Инкапсулирован** - вся логика фичи в одной папке
- 🔌 **Слабо связан** - зависит только от shared/ и других модулей через API
- 🎯 **Единая ответственность** - отвечает за одну область (SRP на уровне модуля)
- 📝 **Самодокументируемый** - структура папки отражает назначение

---

## Ключевые Системы

### 1. SpawnSystem (Modular Architecture)

**Паттерн:** Orchestrator (Facade) координирует специализированные spawner'ы.

**Компоненты:**
- `BaseSpawner` - абстрактный класс (Template Method Pattern)
- `EntityPoolManager` - централизованное управление пулами (Registry Pattern)
- `LaneSafetyService` - гарантирует, что хотя бы одна полоса всегда свободна
- Специализированные spawner'ы: `ObstacleSpawner`, `CoinSpawner`, `CloudSpawner`, `StarSpawner`, `BoosterSpawner`

**API:**
- `update(deltaTime, gameSpeed, context)` - обновляет все spawner'ы
- `fillLaneWithCoins(lane)` - заполнить полосу монетами (booster mode)
- `clearAllObstacles()` - очистить препятствия (при бустере)
- `emitCoinCollectEffect(x, y)` - эффект сбора монеты
- `getActiveObstacles/Coins/Boosters()` - получить активные объекты

**Как добавить новый тип объектов:**
1. Создай новый модуль в `features/my-feature/`
2. Создай Entity класс в `features/my-feature/entities/` (имплементируй: `activate()`, `update()`, `deactivate()`, `isActive()`, `getHitbox()`)
3. Создай Spawner в `features/my-feature/spawner/` (наследуй `BaseSpawner` из `features/spawning/spawners/`, переопредели `spawn()`)
4. В `features/spawning/SpawnSystem.js` регистрируй пул: `this.poolManager.registerPool('name', EntityClass, size)`
5. В `SpawnSystem.initializeSpawners()` создай инстанс spawner'а
6. В `SpawnSystem.update()` вызови `this.mySpawner.update(...)`

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

**Файл:** `src/shared/config/constants.js`

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

**Файл:** `src/features/ui/UIController.js`

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

### ⚠️ ПЕРЕД НАЧАЛОМ ЛЮБОЙ ЗАДАЧИ

**КРИТИЧЕСКИ ВАЖНО:** Перед добавлением нового кода, спроси себя:

1. **Это новая фича/домен?**
   - ✅ ДА → Создай новый модуль в `features/my-feature/`
   - ❌ НЕТ → Добавь в существующий модуль

2. **Соблюдаю ли я SOLID?**
   - **SRP**: Один класс = одна ответственность
   - **OCP**: Расширяю, не модифицирую базовые классы
   - **LSP**: Наследники взаимозаменяемы
   - **ISP**: Минимальные интерфейсы
   - **DIP**: Зависимость от абстракций, не реализаций

3. **Проверь аналогии в проекте:**
   - Посмотри как организованы модули `sound/`, `effects/`, `collision/`
   - Следуй той же структуре: `entities/`, `manager/`, `spawner/`, `effects/`
   - Используй те же паттерны (EventBus, ObjectPool, Dependency Injection)

**Правило:**
> Никогда не добавляй код в существующий класс, если это новая ответственность. Создай новый модуль.

**Примеры:**
- ❌ Добавил логику конфетти в UIController (нарушение SRP)
- ✅ Создал `features/confetti/manager/ConfettiManager.js` + импортировал в UIController
- ❌ Добавил логику аудио в Game.js
- ✅ Создал `features/sound/manager/SoundManager.js` + зарегистрировал в Game.js

---

### TypeScript Типизация

**Стиль:** Минималистичный TypeScript без JSDoc комментариев, без префикса `I` для интерфейсов.

**Правило размещения типов:**

```
✅ Тип используется в 1 месте → локально в файле
✅ Тип используется в 2+ местах → types/
```

**Структура types/ (Flat files):**
```
types/
├── index.ts          # Barrel (экспорт всего)
├── entities/         # Entity интерфейсы (папка)
├── events/           # EventBus события (папка)
├── rendering/        # Rendering типы (папка)
├── common.ts         # Lane, Point2D, GameState
├── managers.ts       # Интерфейсы менеджеров
├── spawning.ts       # ObjectPool, SpawnCoordinationService
├── ui.ts             # UIController interface
└── player.ts         # Player interface
```

**Примеры:**

**❌ Плохо - интерфейсы в файле класса:**
```typescript
// BoosterManager.ts
interface SpawnSystem { ... }  // Используется в других местах!
interface UIController { ... }  // Используется в других местах!
export class BoosterManager { ... }
```

**✅ Хорошо - переиспользуемые типы в types/:**
```typescript
// types/managers.ts
export interface SpawnSystem { ... }
export interface UIController { ... }

// BoosterManager.ts
import { SpawnSystem, UIController } from '../../../types/managers';
export class BoosterManager { ... }
```

**✅ Хорошо - локальный Config (используется 1 раз):**
```typescript
// BoosterSpawner.ts
interface BoosterSpawnerConfig {  // Только для этого файла
  pool: ObjectPool<ActivatableEntity>;
  stage: PIXI.Container;
}
export class BoosterSpawner { ... }
```

**Запрещено:**
- ❌ `any` типы (используй generic или `unknown`)
- ❌ JSDoc комментарии (код должен быть self-documenting)
- ❌ Префикс `I` для интерфейсов (`IUser` → `User`)

---

### Изменение Game Balance

Редактируй `src/shared/config/constants.js`:
- `TARGET_COINS` - условие победы
- `GAME_SPEED`, `MAX_SPEED`, `SPEED_INCREMENT` - прогрессия скорости
- `OBSTACLE.MIN_DISTANCE`, `MAX_DISTANCE` - расстояние между препятствиями
- `BOOSTER_DURATION`, `BOOSTER_LANE_SWITCH_INTERVAL` - механика бустера

### Добавление UI Экранов

1. Добавь HTML структуру в `index.html`
2. Добавь методы show/hide в `features/ui/UIController.js`
3. Вызывай из `Game.js` при переходах состояния
4. Используй EventBus из `shared/utils/EventBus.js` для Canvas ↔ UI коммуникации при необходимости

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
// src/shared/config/constants.js
TARGET_COINS: 500 // вместо 200
```

**Добавить новый asset:**
1. Добавь файл в `public/assets/sprites/`
2. Добавь путь в `ASSET_PATHS` (`src/shared/config/constants.js`)
3. Добавь в соответствующий бандл в `src/core/AssetLoader.js` manifest:
   - **critical** - если нужен для Start Screen
   - **gameplay** - если нужен только во время игры

**Отладка коллизий:**
Добавь визуализацию hitbox'ов в `features/collision/system/CollisionSystem.js`. Hitbox'ы масштабированы: player (0.7x), obstacles (0.8x), coins (0.6x).

**Добавить новую фичу (модуль):**
1. Создай папку в `src/features/my-feature/`
2. Организуй файлы по назначению: `entities/`, `manager/`, `spawner/`, `effects/` и т.д.
3. Импортируй необходимое из `shared/` (config, utils)
4. Зарегистрируй модуль в `Game.js` если нужна централизованная композиция
5. Следуй принципам SOLID на уровне модуля

---

## Build Output

- **Standard build:** `dist/game.min.js` + assets (standalone)
- **Webflow build:** `dist/game.bundle.js` (ожидает PixiJS CDN)
- Source maps включены в обоих режимах для дебага
- Console logs сохранены в Webflow builds для production debugging
