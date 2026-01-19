# Collectibles Architecture

Архитектура системы собираемых объектов в Pig Rider Game с примерами расширения.

---

## Обзор

Система построена на гибкой типизации, позволяющей легко добавлять новые типы собираемых объектов (power-ups) без изменения базовой архитектуры.

### Ключевые компоненты

1. **`types/collectibles.ts`** - Определения типов и интерфейсов
2. **`features/effects/base/Collectible.ts`** - Абстрактный базовый класс
3. **`features/*/entities/*.ts`** - Конкретные реализации (Coin, Booster)
4. **`features/collision/handler/CollisionHandler.js`** - Обработка сбора

---

## Текущие типы собираемых объектов

### 1. Coin (Монета)
**Тип:** `'coin'`
**Ценность:** 1 очко
**Описание:** Базовый collectible для набора счета

```typescript
{
  type: 'coin',
  value: 1
}
```

### 2. Booster (Бустер)
**Тип:** `'booster'`
**Ценность:** 10 очков
**Описание:** Активирует режим с заполнением полосы монетами

```typescript
{
  type: 'booster',
  value: 10
}
```

---

## Как добавить новый тип собираемого объекта

### Пример: Shield (Щит)

#### Шаг 1: Обновить типы

Добавить тип в `types/collectibles.ts`:

```typescript
export type CollectibleType = 'coin' | 'booster' | 'shield' | 'magnet' | 'doubler';
```

#### Шаг 2: Создать Entity класс

Создать `features/shield/entities/Shield.ts`:

```typescript
import * as PIXI from 'pixi.js';
import { Collectible } from '../../effects/base/Collectible';
import type { CollectResult, Lane, Hitbox } from '../../../types';

export class Shield extends Collectible {
  private sprite: PIXI.Sprite;
  private active: boolean;
  private collected: boolean;
  // ... остальные свойства

  constructor(texture: PIXI.Texture, container: PIXI.Container) {
    super();
    this.sprite = new PIXI.Sprite(texture);
    // ... инициализация
  }

  activate(lane: Lane, x: number): void {
    this.active = true;
    this.collected = false;
    // ... логика активации
  }

  deactivate(): void {
    this.active = false;
    // ... логика деактивации
  }

  collect(): CollectResult | null {
    if (this.collected) return null;
    this.collected = true;
    this.deactivate();

    return {
      type: 'shield',
      value: 0  // Shield не дает очков, только эффект
    };
  }

  update(deltaTime: number, gameSpeed: number): void {
    if (!this.active || this.collected) return;
    // ... логика обновления позиции
  }

  getHitbox(): Hitbox | null {
    if (!this.active || this.collected) return null;
    // ... возврат hitbox
  }

  isActive(): boolean {
    return this.active && !this.collected;
  }

  // ... остальные методы (saveState, interpolate, shouldCull)
}
```

#### Шаг 3: Создать Spawner

Создать `features/shield/spawner/ShieldSpawner.ts`:

```typescript
import { BaseSpawner } from '../../spawning/spawners/BaseSpawner';
import type { Lane, ObjectPool, SpawnCoordinationService } from '../../../types';

export class ShieldSpawner extends BaseSpawner {
  private minDistance: number = 3000;  // Редкий spawn
  private maxDistance: number = 5000;

  constructor(config: {
    pool: ObjectPool;
    stage: PIXI.Container;
    coordinationService: SpawnCoordinationService;
  }) {
    super(config.pool, config.stage, config.coordinationService);
  }

  protected spawn(lane: Lane, x: number): void {
    const shield = this.pool.acquire();
    if (shield && shield.activate) {
      shield.activate(lane, x);
      this.coordinationService.registerSpawn(lane, x, 'shield');
    }
  }

  protected getSpawnDistance(): number {
    return this.minDistance + Math.random() * (this.maxDistance - this.minDistance);
  }

  protected shouldSpawn(context: any): boolean {
    // Shield не спавнится во время бустера
    return !context.isBoosterActive;
  }
}
```

#### Шаг 4: Создать Manager для эффекта

Создать `features/shield/manager/ShieldManager.ts`:

```typescript
import { EventBus } from '../../../shared/utils/EventBus';
import type { Player } from '../../../types';

export class ShieldManager {
  private isActive: boolean = false;
  private duration: number = 5.0;  // 5 секунд
  private timeRemaining: number = 0;
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  activate(): void {
    this.isActive = true;
    this.timeRemaining = this.duration;

    // Визуальный эффект (например, свечение вокруг игрока)
    this.player.addShieldEffect();

    EventBus.emit('shield:activated');
    console.log('🛡️ Shield activated');
  }

  deactivate(): void {
    this.isActive = false;
    this.timeRemaining = 0;

    this.player.removeShieldEffect();

    EventBus.emit('shield:deactivated');
    console.log('🛡️ Shield deactivated');
  }

  update(deltaTime: number): void {
    if (!this.isActive) return;

    this.timeRemaining -= deltaTime;

    if (this.timeRemaining <= 0) {
      this.deactivate();
    }
  }

  isShieldActive(): boolean {
    return this.isActive;
  }

  getRemainingTime(): number {
    return this.timeRemaining;
  }

  reset(): void {
    this.deactivate();
  }
}
```

#### Шаг 5: Интегрировать в CollisionHandler

Обновить `features/collision/handler/CollisionHandler.js`:

```javascript
processFrame(player, obstacles, coins, boosters, shields) {
  const collisions = this.collisionSystem.processCollisions(player, obstacles, coins);

  return {
    obstacleCollision: this.handleObstacleCollision(player, collisions),
    collectedCoins: this.handleCoinCollection(collisions.coinsCollected),
    collectedBooster: this.handleBoosterCollection(player, boosters),
    collectedShield: this.handleShieldCollection(player, shields)  // НОВОЕ
  };
}

handleShieldCollection(player, shields) {
  const playerHitbox = player.getHitbox();

  for (const shield of shields) {
    if (!shield.isActive()) continue;

    const shieldHitbox = shield.getHitbox();
    if (!shieldHitbox) continue;

    if (MathUtils.checkAABB(playerHitbox, shieldHitbox)) {
      const result = shield.collect();
      if (result) {
        if (this.soundManager) {
          this.soundManager.play('shieldCollect');
        }
        return result.value;  // Возвращаем value из CollectResult
      }
    }
  }

  return null;
}
```

#### Шаг 6: Обработать в UpdateCoordinator

Обновить `features/core/coordination/UpdateCoordinator.js`:

```javascript
update(deltaTime, frameDeltaTime = null) {
  // ... существующий код

  // Обработка собранного щита
  if (result.collectedShield !== null) {
    this.handleShieldCollection(result.collectedShield);
  }

  // Обработка столкновения с препятствием (теперь с учетом щита!)
  if (result.obstacleCollision && !this.registry.isColliding) {
    // Проверяем активен ли щит
    if (!this.registry.shieldManager.isShieldActive()) {
      this.handleObstacleCollision(result.obstacleCollision);
      return;
    } else {
      // Щит поглотил удар - только деактивируем щит
      this.registry.shieldManager.deactivate();
      console.log('🛡️ Shield absorbed collision!');
    }
  }
}

handleShieldCollection(shieldValue) {
  // Shield может не давать очки (value = 0), только эффект
  if (shieldValue > 0) {
    this.registry.progressionManager.addScore(shieldValue);
  }

  // Активируем щит
  this.registry.shieldManager.activate();
}
```

#### Шаг 7: Зарегистрировать в SpawnSystem

Обновить `features/spawning/SpawnSystem.js`:

```javascript
constructor(stage, coordinationService) {
  // ... существующий код

  // Регистрация пула для Shield
  this.poolManager.registerPool('shields', Shield, 5);

  this.initializeSpawners(stage, coordinationService);
}

initializeSpawners(stage, coordinationService) {
  // ... существующие spawner'ы

  // Shield spawner
  this.shieldSpawner = new ShieldSpawner({
    pool: this.poolManager.getPool('shields'),
    stage: stage,
    coordinationService: coordinationService
  });
}

update(deltaTime, gameSpeed, context) {
  // ... обновление существующих spawner'ов

  this.shieldSpawner.update(deltaTime, gameSpeed, context);
}

getActiveShields() {
  return this.poolManager.getPool('shields').getActiveEntities();
}
```

#### Шаг 8: Добавить в Game.js

```javascript
constructor(canvas) {
  // ... существующий код

  // Shield Manager
  this.shieldManager = new ShieldManager(this.player);
}

update(deltaTime) {
  // ... существующий код

  this.shieldManager.update(deltaTime);
}
```

---

## Идеи для будущих типов собираемых объектов

### 1. **Magnet (Магнит)**
**Тип:** `'magnet'`
**Эффект:** Автоматически притягивает монеты в радиусе
**Длительность:** 8 секунд
**Ценность:** 5 очков

### 2. **Doubler (Удвоитель)**
**Тип:** `'doubler'`
**Эффект:** Все монеты дают ×2 очка
**Длительность:** 10 секунд
**Ценность:** 15 очков

### 3. **Jetpack (Реактивный ранец)**
**Тип:** `'jetpack'`
**Эффект:** Полет над препятствиями
**Длительность:** 5 секунд
**Ценность:** 20 очков

### 4. **Slow Motion (Замедление)**
**Тип:** `'slowmo'`
**Эффект:** Игра замедляется на 50%
**Длительность:** 6 секунд
**Ценность:** 10 очков

---

## Преимущества архитектуры

✅ **Type-safe:** TypeScript гарантирует корректность типов
✅ **Расширяемость:** Добавление новых типов не требует изменения существующего кода
✅ **Инкапсуляция:** Каждый тип живет в своем модуле
✅ **SOLID principles:** Следует принципам SRP, OCP, DIP
✅ **Maintainability:** Легко понять и изменить конкретную механику

---

## Рекомендации

1. **Не злоупотребляйте типами:** Слишком много power-ups = сложность балансировки
2. **Визуальная ясность:** Каждый тип должен быть визуально различим
3. **Тестируйте баланс:** Длительность/частота спавна критична для game feel
4. **Звуки:** Уникальные звуки для каждого типа улучшают feedback
5. **UI индикаторы:** Показывайте активные эффекты и оставшееся время

---

## Связанные документы

- `CLAUDE.md` - Основная документация проекта
- `types/collectibles.ts` - Определения типов
- `features/effects/base/Collectible.ts` - Базовый класс
