# Архитектура Проекта: Pig Rider Game

> **Быстрый старт для новых разработчиков**
> Этот документ поможет вам быстро разобраться в структуре проекта и начать работу.

---

## 🎯 Что Это За Проект?

**Pig Rider** - endless runner игра на PixiJS для интеграции в Webflow.

**Ключевые особенности:**
- 🎮 Игрок управляет свиньей по 3 полосам
- 🪙 Собирает монеты, избегает препятствий
- ⚡ Система бустеров с временными эффектами
- 🎨 Hybrid rendering: PixiJS (игра) + HTML/CSS (UI)

---

## 🏗️ Архитектурная Философия

### SOLID Принципы - Это Закон

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Весь код строго следует SOLID принципам.

#### Краткая Шпаргалка SOLID

1. **Single Responsibility** - один класс = одна задача
   - ✅ `BoosterManager` - только бустеры
   - ❌ НЕ добавляй логику эффектов в `BoosterManager`

2. **Open/Closed** - открыт для расширения, закрыт для изменений
   - ✅ Новый spawner? Наследуй `BaseSpawner`
   - ❌ НЕ изменяй `BaseSpawner` для добавления функционала

3. **Liskov Substitution** - наследники взаимозаменяемы
   - ✅ Все spawner'ы реализуют единый интерфейс
   - ❌ НЕ нарушай контракт базового класса

4. **Interface Segregation** - минимальные интерфейсы
   - ✅ Manager предоставляет только нужные методы
   - ❌ НЕ создавай "толстые" интерфейсы

5. **Dependency Inversion** - зависимость от абстракций
   - ✅ `Game.js` работает с API managers
   - ❌ НЕ привязывайся к конкретным реализациям

**Правило:**
> Перед написанием класса спроси: "Соблюдаю ли я все 5 SOLID?" Если нет - переделай дизайн.

---

## 📁 Структура Кодбейза

### Главные Папки

```
src/
├── config/         # Константы и настройки
├── core/           # PixiJS engine (AssetLoader, Renderer, GameLoop)
├── entities/       # Игровые объекты (Player, Obstacle, Coin, Booster)
├── effects/        # Визуальные эффекты (CoinSparkle)
├── managers/       # High-level логика (BoosterManager, EffectManager)
├── systems/        # Игровые системы (Spawn, Collision, Difficulty)
├── ui/             # HTML UI (UIController, modals)
├── utils/          # Утилиты (EventBus, MathUtils, ObjectPool)
└── Game.js         # Главный оркестратор
```

### Зачем Нужна Каждая Папка?

#### `config/`
**Назначение:** Все настраиваемые параметры игры
**Файлы:**
- `constants.js` - игровые константы (скорости, размеры, балансы)
- `env.js` - environment переменные (API keys)

**Когда редактировать:** Изменение баланса игры, добавление новых констант

---

#### `core/`
**Назначение:** PixiJS engine - низкоуровневая работа с рендерингом
**Файлы:**
- `AssetLoader.js` - загрузка текстур и ассетов
- `Renderer.js` - настройка PixiJS renderer
- `GameLoop.js` - Fixed timestep игровой цикл (60 FPS)

**Когда трогать:** Редко. Только если нужно изменить rendering pipeline

---

#### `entities/`
**Назначение:** Игровые объекты (PixiJS sprites)
**Примеры:** `Player.js`, `Obstacle.js`, `Coin.js`, `Booster.js`

**Обязательные методы для каждой entity:**
```javascript
class MyEntity {
  activate(x, y, data) {}    // Активировать из пула
  update(deltaTime) {}        // Обновить состояние
  deactivate() {}             // Вернуть в пул
  isActive() {}               // Проверка активности
  getHitbox() {}              // Для коллизий
}
```

**Когда добавлять:** Новый тип игрового объекта

---

#### `effects/` 🆕
**Назначение:** Визуальные эффекты (PixiJS sprites)
**Примеры:** `CoinSparkle.js` - эффект сбора монеты

**Отличие от entities:** Effects - это чисто визуал, не участвуют в геймплее

**Когда добавлять:** Новый визуальный эффект (взрывы, trails, particles)

---

#### `managers/` 🆕
**Назначение:** High-level игровая логика (SOLID-compliant)
**Примеры:**
- `BoosterManager.js` - вся логика бустеров
- `EffectManager.js` - управление визуальными эффектами

**Философия Managers:**
- Каждый manager - одна domain область (SRP)
- Инкапсулирует сложность из `Game.js`
- Предоставляет чистый публичный API
- Не знает о деталях implementation

**Когда добавлять:** Большая логическая система (achievements, power-ups, etc.)

---

#### `systems/`
**Назначение:** Игровые системы (spawning, collision, difficulty)

**Подпапки:**
- `spawners/` - модульные spawner'ы (наследники `BaseSpawner`)
- `pools/` - object pooling (`EntityPoolManager`)
- `services/` - вспомогательные сервисы (`LaneSafetyService`)

**Ключевые файлы:**
- `SpawnSystem.js` - оркестратор всех spawner'ов
- `CollisionSystem.js` - AABB collision detection
- `DifficultyManager.js` - прогрессивное усложнение

---

#### `ui/`
**Назначение:** HTML UI (полностью независим от PixiJS)

**Файлы:**
- `UIController.js` - управление HTML экранами (start, HUD, end screens)

**Hybrid Rendering:**
- PixiJS рендерит игровые объекты (WebGL)
- HTML/CSS для UI (легко стилизовать через Webflow)
- Коммуникация через `EventBus`

---

#### `utils/`
**Назначение:** Утилиты общего назначения

**Файлы:**
- `EventBus.js` - pub/sub для коммуникации между модулями
- `MathUtils.js` - математические хелперы
- `ObjectPool.js` - базовый класс для пулинга

---

#### `Game.js`
**Назначение:** Главный оркестратор игры

**Ответственности:**
- Инициализация всех систем
- Координация game loop
- Переходы между состояниями игры
- Делегирование логики managers

**НЕ должен содержать:** Детали implementation конкретных систем

---

## 🔄 Как Работает Игра?

### Игровой Цикл (Game Loop)

```
GameLoop (60 FPS fixed timestep)
    ↓
Game.update(deltaTime)
    ↓
    ├─> Player.update()              # Движение игрока
    ├─> SpawnSystem.update()         # Спавн объектов
    ├─> BoosterManager.update()      # Логика бустера
    ├─> DifficultyManager.update()   # Усложнение
    ├─> CollisionSystem.checkAll()   # Проверка коллизий
    └─> EffectManager.update()       # Обновление эффектов
    ↓
Renderer.render()                    # Отрисовка
```

### Как Спавнятся Объекты?

```
SpawnSystem (Orchestrator)
    ↓
    ├─> ObstacleSpawner      # Препятствия
    ├─> CoinSpawner          # Монеты
    ├─> BoosterSpawner       # Бустеры
    ├─> CloudSpawner         # Облака (декор)
    └─> StarSpawner          # Звезды (декор)
    ↓
EntityPoolManager            # Object pooling
```

**Object Pooling:** Объекты не создаются/удаляются каждый раз, а переиспользуются из пула для производительности.

### Booster Механика

```
1. Player собирает booster
    ↓
2. Game на паузу → modal
    ↓
3. User подтверждает
    ↓
4. BoosterManager.activate()
    ├─> SpawnSystem.clearAllObstacles()
    ├─> SpawnSystem.fillLaneWithCoins(lane)
    └─> UI эффекты (blur, glow)
    ↓
5. Каждые 2 секунды: смена полосы (3 смены)
    ↓
6. После 6 секунд: deactivate + 5 сек cooldown
```

---

## 🛠️ Частые Задачи

### 1. Добавить Новый Тип Объекта

**Шаги:**

1. Создай Entity в `entities/`:
```javascript
// entities/NewEntity.js
export class NewEntity {
  activate(x, y, data) { /* активация */ }
  update(deltaTime) { /* логика */ }
  deactivate() { /* деактивация */ }
  isActive() { /* проверка */ }
  getHitbox() { /* для коллизий */ }
}
```

2. Создай Spawner в `systems/spawners/`:
```javascript
// systems/spawners/NewEntitySpawner.js
import { BaseSpawner } from './BaseSpawner.js';

export class NewEntitySpawner extends BaseSpawner {
  spawn(context) {
    // логика спавна
  }
}
```

3. Зарегистрируй в `SpawnSystem`:
```javascript
// SpawnSystem.js

// В initializePools():
this.poolManager.registerPool('newEntity', NewEntity, 20);

// В initializeSpawners():
this.newEntitySpawner = new NewEntitySpawner(
  this.poolManager,
  'newEntity',
  config
);

// В update():
this.newEntitySpawner.update(deltaTime, gameSpeed, context);
```

---

### 2. Изменить Баланс Игры

Редактируй `src/config/constants.js`:

```javascript
// Условие победы
TARGET_COINS: 300,

// Скорость игры
GAME_SPEED: 4,
MAX_SPEED: 10,
SPEED_INCREMENT: 0.0005,

// Бустер
BOOSTER_DURATION: 6,
BOOSTER_LANE_SWITCH_INTERVAL: 2,
```

---

### 3. Добавить Новый Manager

**Когда нужно:** Большая логическая система (achievements, combos, etc.)

**Шаги:**

1. Создай manager в `managers/`:
```javascript
// managers/MyManager.js
export class MyManager {
  constructor(dependencies) {
    // Single Responsibility: только одна задача
  }

  // Публичный API
  update(deltaTime) {}
  activate() {}
  deactivate() {}

  // Приватные методы
  #privateMethod() {}
}
```

2. Добавь в `Game.js`:
```javascript
// В конструкторе
this.myManager = new MyManager(dependencies);

// В update()
this.myManager.update(deltaTime);
```

---

### 4. Добавить Визуальный Эффект

1. Создай effect в `effects/`:
```javascript
// effects/ExplosionEffect.js
export class ExplosionEffect {
  activate(x, y, data) { /* ... */ }
  update(deltaTime) { /* ... */ }
  deactivate() { /* ... */ }
  // ... остальные методы
}
```

2. Зарегистрируй в `EffectManager`:
```javascript
// EffectManager.js
this.poolManager.registerPool('explosion', ExplosionEffect, 10);
```

3. Вызови через API:
```javascript
this.effectManager.playExplosion(x, y);
```

---

## 🎨 Hybrid Rendering

**Концепция:** Разделение ответственности между PixiJS и HTML/CSS

### PixiJS (WebGL Canvas)
**Что рендерит:**
- Игровые объекты (Player, Obstacles, Coins)
- Декорации (Clouds, Stars)
- Эффекты (Sparkles, Trails)

**Почему:** Высокая производительность для динамичных объектов

### HTML/CSS
**Что рендерит:**
- Стартовый экран
- HUD (счетчик монет)
- Modals (booster, win/lose screens)

**Почему:** Легко стилизовать в Webflow, доступность

### Коммуникация: EventBus

```javascript
// Game.js → UI
EventBus.emit('coin:collected', { count: 10 });

// UI → Game
EventBus.on('button:start', () => this.startGame());
```

**Преимущество:** Полная развязка (loose coupling) между Canvas и UI

---

## 🚀 Webflow Integration

### Build Commands

```bash
npm run dev              # Local dev (localhost:3000)
npm run build:webflow    # Webflow bundle (PixiJS external)
```

### Webflow Setup

**1. Head:**
```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
```

**2. Before `</body>`:**
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-REPO/dist/game.bundle.js"></script>
```

**3. HTML Структура:**
```html
<div id="game-root" class="game-state">
  <div class="game-ui game-start">...</div>
  <div class="game-ui game-running">...</div>
  <canvas id="game-canvas"></canvas>
</div>
```

### Кастомизация через Config

```html
<script>
  window.GAME_CONFIG = {
    TARGET_COINS: 300,
    GAME_SPEED: 1.5,
    BOOSTER_DURATION: 8
  };
  window.GAME_ASSETS_URL = 'https://your-cdn.com/assets';
</script>
```

---

## 📊 Performance Best Practices

### Object Pooling
**Что:** Переиспользование объектов вместо create/destroy
**Где:** Все entities, effects через `EntityPoolManager`
**Зачем:** Предотвращает garbage collection паузы

### Fixed Timestep
**Что:** Игровая логика обновляется фиксированными шагами 60 FPS
**Где:** `GameLoop.js`
**Зачем:** Консистентная физика независимо от FPS

### AABB Collision
**Что:** Axis-Aligned Bounding Box collision detection
**Где:** `CollisionSystem.js`
**Зачем:** Быстрые проверки коллизий

### Hitbox Scaling
**Для более мягкого gameplay:**
- Player: 0.7x
- Obstacles: 0.8x
- Coins: 0.6x

---

## 🧭 Навигация по Коду

### Ты Хочешь...

**...изменить баланс игры**
→ `src/config/constants.js`

**...добавить новый тип препятствия**
→ `src/entities/` + `src/systems/spawners/`

**...изменить логику бустера**
→ `src/managers/BoosterManager.js`

**...добавить новый экран UI**
→ `src/ui/UIController.js` + `index.html`

**...изменить collision detection**
→ `src/systems/CollisionSystem.js`

**...добавить визуальный эффект**
→ `src/effects/` + `src/managers/EffectManager.js`

**...изменить difficulty progression**
→ `src/systems/DifficultyManager.js`

---

## 🔍 Debugging Tips

### Визуализация Hitbox'ов
Добавь в `CollisionSystem.js`:
```javascript
drawHitbox(hitbox) {
  const graphics = new PIXI.Graphics();
  graphics.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  graphics.stroke({ width: 2, color: 0xff0000 });
  this.container.addChild(graphics);
}
```

### Console Logs
Build команды **не удаляют** console.logs для production debugging

### Source Maps
Включены в обоих build режимах для дебага минифицированного кода

---

## ❓ Частые Вопросы

**Q: Почему `managers/` и `systems/` отдельно?**
A: `systems/` - low-level (spawning, collision). `managers/` - high-level игровая логика (бустеры, достижения). Разделение по уровню абстракции.

**Q: Зачем EventBus если можно прямые вызовы?**
A: Loose coupling. UI не знает о Game, Game не знает о UI. Легче тестировать и менять.

**Q: Когда создавать новый Manager?**
A: Когда логика становится сложной (>200 строк) или выделяется отдельная domain область.

**Q: Обязательно следовать SOLID?**
A: ДА. Это не рекомендация, а требование. Экономит часы рефакторинга в будущем.

---

## 📚 Дополнительные Ресурсы

- **CLAUDE.md** - полные инструкции для AI ассистента
- **README.md** - setup и quick start
- Этот файл - архитектурный overview

---

## ✅ Чеклист: Я Готов Работать

- [ ] Прочитал этот документ полностью
- [ ] Понимаю 5 SOLID принципов
- [ ] Знаю структуру папок и их назначение
- [ ] Понимаю Hybrid Rendering концепцию
- [ ] Знаю, где искать конкретную логику
- [ ] Запустил `npm run dev` и увидел игру

**Если все галочки стоят - добро пожаловать в команду! 🎉**

---

**Последнее обновление:** 2025-01-13
**Версия:** 2.0 (после рефакторинга с managers/)
