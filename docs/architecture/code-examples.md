# Примеры Кода: SOLID в Действии

> **Практические примеры** того, как правильно писать код в этом проекте

---

## 🎯 Правильные vs Неправильные Подходы

### ❌ Неправильно: Нарушение SRP

```javascript
// ❌ BoosterManager делает ВСЁ - это нарушение Single Responsibility
class BoosterManager {
  activateBooster() {
    // Логика бустера
    this.clearObstacles();
    this.spawnCoins();

    // Визуальные эффекты (НЕ ЕГО ОТВЕТСТВЕННОСТЬ!)
    this.playSparkle(x, y);
    this.shakeScreen();

    // UI управление (НЕ ЕГО ОТВЕТСТВЕННОСТЬ!)
    this.showBoosterModal();
    this.updateHUD();
  }
}
```

### ✅ Правильно: Разделение Ответственности

```javascript
// ✅ BoosterManager - только логика бустеров
class BoosterManager {
  activateBooster() {
    // Только логика бустеров
    this.isActive = true;
    this.clearObstacles();
    this.spawnCoins();

    // Делегируем эффекты
    this.effectManager.playBoosterActivation(x, y);

    // Делегируем UI (через EventBus - loose coupling)
    EventBus.emit('booster:activated');
  }
}

// ✅ EffectManager - только эффекты
class EffectManager {
  playBoosterActivation(x, y) {
    this.playSparkle(x, y);
    this.shakeScreen();
  }
}

// ✅ UIController - только UI
class UIController {
  constructor() {
    EventBus.on('booster:activated', () => this.showBoosterUI());
  }

  showBoosterUI() {
    this.addBoosterClass();
    this.updateHUD();
  }
}
```

**Почему лучше:**
- Каждый класс делает одно дело
- Легко тестировать изолированно
- Легко менять implementation без затрагивания других частей

---

## 🔄 Open/Closed Principle (OCP)

### ❌ Неправильно: Модификация Базового Класса

```javascript
// ❌ Добавляем специфичную логику в базовый класс
class BaseSpawner {
  update(deltaTime, gameSpeed, context) {
    this.timer += deltaTime * gameSpeed;

    if (this.timer >= this.spawnInterval) {
      // ❌ Специальная логика для coins - нарушение OCP
      if (this.entityType === 'coin' && context.isBoosterActive) {
        this.spawnInActiveLane(context.boosterLane);
      } else {
        this.spawn(context);
      }

      this.timer = 0;
    }
  }
}
```

### ✅ Правильно: Расширение Через Наследование

```javascript
// ✅ Базовый класс остается неизменным
class BaseSpawner {
  update(deltaTime, gameSpeed, context) {
    this.timer += deltaTime * gameSpeed;

    if (this.timer >= this.spawnInterval) {
      this.spawn(context); // Шаблонный метод
      this.timer = 0;
    }
  }

  spawn(context) {
    // Переопределяется в наследниках
  }
}

// ✅ Специфичная логика в наследнике
class CoinSpawner extends BaseSpawner {
  spawn(context) {
    // Специфичная логика для монет
    if (context.isBoosterActive) {
      this.spawnInActiveLane(context.boosterLane);
    } else {
      this.spawnNormally(context);
    }
  }
}

// ✅ Другой наследник с другой логикой
class ObstacleSpawner extends BaseSpawner {
  spawn(context) {
    // Своя логика для препятствий
    const safeLanes = this.laneSafety.getSafeLanes(context);
    this.spawnInLane(safeLanes[0]);
  }
}
```

**Почему лучше:**
- Базовый класс закрыт для модификаций
- Каждый spawner расширяет функциональность своим способом
- Добавление новых типов не требует изменений в существующем коде

---

## 🔁 Liskov Substitution Principle (LSP)

### ❌ Неправильно: Нарушение Контракта

```javascript
// ❌ Базовый класс ожидает определенное поведение
class BaseEntity {
  activate(x, y, data) {
    this.x = x;
    this.y = y;
    this.sprite.visible = true;
    return this; // Контракт: всегда возвращаем this
  }
}

// ❌ Наследник нарушает контракт
class SpecialEntity extends BaseEntity {
  activate(x, y, data) {
    if (!this.isReady) {
      return null; // ❌ Нарушение контракта!
    }
    super.activate(x, y, data);
    return this;
  }
}

// ❌ Код ломается при подстановке наследника
const entity = pool.acquire().activate(100, 200);
entity.update(); // ОШИБКА! entity может быть null
```

### ✅ Правильно: Соблюдение Контракта

```javascript
// ✅ Базовый класс определяет четкий контракт
class BaseEntity {
  activate(x, y, data) {
    this.x = x;
    this.y = y;
    this.sprite.visible = true;
    return this; // Контракт: ВСЕГДА возвращаем this
  }
}

// ✅ Наследник соблюдает контракт
class SpecialEntity extends BaseEntity {
  activate(x, y, data) {
    super.activate(x, y, data);

    // Дополнительная логика, НО контракт соблюден
    if (this.isReady) {
      this.applySpecialEffects();
    }

    return this; // ✅ Всегда возвращаем this
  }
}

// ✅ Код работает с любым наследником
const entity = pool.acquire().activate(100, 200);
entity.update(); // Всегда работает
```

**Почему лучше:**
- Наследники взаимозаменяемы
- Код не ломается при подстановке
- Предсказуемое поведение

---

## 🔌 Interface Segregation Principle (ISP)

### ❌ Неправильно: "Толстый" Интерфейс

```javascript
// ❌ Manager с кучей методов, которые не все нужны
class GameManager {
  // Логика бустера
  activateBooster() {}
  deactivateBooster() {}
  updateBooster(dt) {}

  // Логика эффектов
  playEffect(name, x, y) {}
  updateEffects(dt) {}

  // Логика достижений
  unlockAchievement(id) {}
  checkAchievements() {}

  // Логика звуков
  playSound(name) {}
  stopAllSounds() {}
}

// ❌ Game.js вынужден зависеть от ВСЕХ методов
class Game {
  constructor() {
    this.manager = new GameManager(); // Зависимость от всего
  }

  update(dt) {
    this.manager.updateBooster(dt); // Используем 1 метод из 10
  }
}
```

### ✅ Правильно: Минимальные Интерфейсы

```javascript
// ✅ Каждый manager - минимальный интерфейс
class BoosterManager {
  activate() {}
  deactivate() {}
  update(dt) {}
}

class EffectManager {
  play(name, x, y) {}
  update(dt) {}
}

class AchievementManager {
  unlock(id) {}
  check() {}
}

// ✅ Game.js зависит только от нужных интерфейсов
class Game {
  constructor() {
    this.boosterManager = new BoosterManager();
    this.effectManager = new EffectManager();
    // Достижения не нужны в update - не создаем
  }

  update(dt) {
    this.boosterManager.update(dt);
    this.effectManager.update(dt);
  }
}
```

**Почему лучше:**
- Минимальные зависимости
- Легче тестировать
- Не заставляем классы зависеть от ненужных методов

---

## 🔀 Dependency Inversion Principle (DIP)

### ❌ Неправильно: Зависимость от Конкретных Реализаций

```javascript
// ❌ Game.js знает о конкретных implementations
class Game {
  constructor() {
    // ❌ Прямая зависимость от конкретных классов
    this.obstacleSpawner = new ObstacleSpawner();
    this.coinSpawner = new CoinSpawner();
    this.boosterSpawner = new BoosterSpawner();
  }

  update(dt) {
    // ❌ Знаем о деталях каждого spawner'а
    this.obstacleSpawner.update(dt, this.gameSpeed, {
      lanes: this.lanes,
      blockedLanes: this.getBlockedLanes()
    });
    this.coinSpawner.update(dt, this.gameSpeed, {
      lanes: this.lanes,
      isBoosterActive: this.isBoosterActive
    });
    // ... повторяющийся код
  }
}
```

### ✅ Правильно: Зависимость от Абстракций

```javascript
// ✅ Game.js зависит от абстракции (SpawnSystem)
class Game {
  constructor() {
    // ✅ Зависимость от высокоуровневого API
    this.spawnSystem = new SpawnSystem(this.container);
  }

  update(dt) {
    // ✅ Не знаем о деталях spawner'ов
    this.spawnSystem.update(dt, this.gameSpeed, this.getContext());
  }
}

// ✅ SpawnSystem - абстракция, скрывающая детали
class SpawnSystem {
  constructor(container) {
    // Dependency Injection
    this.obstacleSpawner = new ObstacleSpawner(/* ... */);
    this.coinSpawner = new CoinSpawner(/* ... */);
    this.boosterSpawner = new BoosterSpawner(/* ... */);
  }

  update(dt, gameSpeed, context) {
    // Скрываем детали от Game.js
    this.obstacleSpawner.update(dt, gameSpeed, context);
    this.coinSpawner.update(dt, gameSpeed, context);
    this.boosterSpawner.update(dt, gameSpeed, context);
  }
}
```

**Почему лучше:**
- Game.js не знает о конкретных spawner'ах
- Легко заменить implementation SpawnSystem
- High-level модули не зависят от low-level деталей

---

## 🚀 Реальный Пример: Добавление Новой Фичи

### Задача: Добавить Combo System

#### ❌ Неправильный Подход (без SOLID)

```javascript
// ❌ Добавляем логику combo прямо в Game.js
class Game {
  update(dt) {
    // ... существующий код ...

    // ❌ Логика combo прямо здесь
    if (this.coinCollected) {
      this.comboTimer = 2.0;
      this.comboCount++;

      if (this.comboCount >= 5) {
        this.showComboEffect();
        this.multiplyScore(2);
      }
    }

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.comboCount = 0;
    }
  }
}
```

**Проблемы:**
- Game.js раздувается
- Нет переиспользования
- Сложно тестировать
- Нарушение SRP

#### ✅ Правильный Подход (SOLID)

**1. Создаем ComboManager (Single Responsibility):**

```javascript
// managers/ComboManager.js
export class ComboManager {
  constructor(config = {}) {
    this.comboTimeout = config.comboTimeout || 2.0;
    this.comboThreshold = config.comboThreshold || 5;

    this.comboCount = 0;
    this.comboTimer = 0;
    this.isComboActive = false;
  }

  // Публичный API
  addHit() {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;

    if (this.comboCount >= this.comboThreshold && !this.isComboActive) {
      this.#activateCombo();
    }
  }

  update(deltaTime) {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;

      if (this.comboTimer <= 0) {
        this.#resetCombo();
      }
    }
  }

  getMultiplier() {
    return this.isComboActive ? 2 : 1;
  }

  // Приватные методы
  #activateCombo() {
    this.isComboActive = true;
    EventBus.emit('combo:activated', { count: this.comboCount });
  }

  #resetCombo() {
    this.comboCount = 0;
    this.isComboActive = false;
    EventBus.emit('combo:ended');
  }
}
```

**2. Интегрируем в Game.js (Dependency Inversion):**

```javascript
// Game.js
class Game {
  constructor() {
    // ... существующий код ...

    // ✅ Зависимость от абстракции
    this.comboManager = new ComboManager({
      comboTimeout: 2.0,
      comboThreshold: 5
    });
  }

  update(dt) {
    // ... существующий код ...

    // ✅ Чистый, минимальный код
    this.comboManager.update(dt);
  }

  handleCoinCollected(coin) {
    this.score += 10 * this.comboManager.getMultiplier();
    this.comboManager.addHit();
  }
}
```

**3. Добавляем UI (Interface Segregation):**

```javascript
// ui/UIController.js
class UIController {
  constructor() {
    // ✅ Подписываемся на события (loose coupling)
    EventBus.on('combo:activated', (data) => this.showCombo(data));
    EventBus.on('combo:ended', () => this.hideCombo());
  }

  showCombo(data) {
    this.comboElement.textContent = `COMBO x${data.count}!`;
    this.comboElement.classList.add('active');
  }

  hideCombo() {
    this.comboElement.classList.remove('active');
  }
}
```

**4. Добавляем эффекты (Open/Closed):**

```javascript
// managers/EffectManager.js
class EffectManager {
  constructor() {
    // ✅ Расширяем без модификации
    EventBus.on('combo:activated', (data) => {
      this.playComboEffect(data.count);
    });
  }

  playComboEffect(count) {
    this.play('combo-explosion', 0, 0);
    this.shakeScreen(0.5);
  }
}
```

**Преимущества SOLID подхода:**
- ✅ **SRP**: ComboManager делает только combo логику
- ✅ **OCP**: Добавили фичу без изменения существующего кода
- ✅ **LSP**: ComboManager взаимозаменяем с другими managers
- ✅ **ISP**: Минимальный API (`addHit()`, `update()`, `getMultiplier()`)
- ✅ **DIP**: Game.js зависит от абстракции, не от деталей

---

## 📝 Чеклист для Нового Кода

Перед коммитом проверь:

- [ ] **SRP**: Класс делает ровно одну вещь?
- [ ] **OCP**: Можно расширить без модификации?
- [ ] **LSP**: Наследники взаимозаменяемы?
- [ ] **ISP**: API минимален и специфичен?
- [ ] **DIP**: Зависимость от абстракций, не implementations?
- [ ] EventBus для loose coupling между модулями
- [ ] Object Pooling для entities и effects
- [ ] Комментарии объясняют "почему", не "что"
- [ ] Нет дублирования кода (DRY)

---

## 🎓 Рекомендации

### Когда Создавать Новый Manager?

✅ **Создавай**, если:
- Логика превышает 200 строк
- Выделяется отдельная domain область
- Нужна инкапсуляция сложности
- Будет переиспользоваться

❌ **НЕ создавай**, если:
- Логика простая (<100 строк)
- Используется в одном месте
- Нет четкой responsibility

### Когда Использовать EventBus?

✅ **Используй**, если:
- Коммуникация между несвязанными модулями (Game ↔ UI)
- Нужна loose coupling
- Один источник → много подписчиков

❌ **НЕ используй**, если:
- Прямой вызов проще и понятнее
- Tight coupling допустим (manager ↔ его зависимости)

### Когда Использовать Inheritance vs Composition?

**Inheritance** (`extends`):
- ✅ Четкая "is-a" связь (ObstacleSpawner **is a** BaseSpawner)
- ✅ Нужен polymorphism

**Composition** (dependency injection):
- ✅ "has-a" связь (Game **has a** SpawnSystem)
- ✅ Гибкость в runtime
- ✅ Избегаем deep inheritance chains

**Правило:** Prefer composition over inheritance, но inheritance допустим для template method pattern.

---

**Последнее обновление:** 2025-01-13
