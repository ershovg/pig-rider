# 🎄 Happy New Year Plan - Pig Rider Game

**Цель:** Добавить wow-эффект к Новому году используя AI + код, без загрузки дизайнера.

**Дедлайн:** До 25 декабря 2025
**Ресурсы:** 3D Hypper AI + существующая архитектура игры

---

## 🎯 Core Concept: Snowball Booster

**Главная фича:** Вместо обычного booster'а - снежок/снежинка
**Механика:**
1. Player собирает snowball booster
2. ВСЕ obstacles превращаются в снеговиков
3. При столкновении снеговик **взрывается** → spawn 3-5 монет
4. Длительность: 6-8 секунд

**Почему это овер:**
- 🎮 Gameplay twist - препятствия становятся **наградой**
- 🎨 Визуально яркий эффект (взрыв + монеты)
- 🎄 Новогодняя атмосфера
- 💰 Incentive собирать этот booster (больше монет = быстрее победа)

---

## 📋 Roadmap (Priority Order)

### **Phase 1: AI Workflow Test (Week 1)**

**Цель:** Проверить, что pipeline AI → игра работает

#### Задачи:
- [ ] Сгенерировать в 3D Hypper AI:
  - `snowball_booster.png` (снежный ком / снежинка для сбора)
  - `snowman_obstacle.png` (снеговик - replacement для obstacle)
  - `snow_particle.png` (частичка снега для particle effects)
  - `ice_shard.png` (осколок льда для взрыва снеговика)

- [ ] Экспорт → PNG (512x512 или 1024x1024)
- [ ] Оптимизация (remove.bg если нужен transparent background)
- [ ] Добавить в `public/assets/sprites/`
- [ ] Зарегистрировать в `src/shared/config/constants.ts` (ASSET_PATHS)
- [ ] Загрузить через AssetLoader (добавить в gameplay bundle)

**Критерий успеха:** Ассеты загружаются и отображаются в игре

---

### **Phase 2: Snowball Booster Mechanic (Week 2)**

**Цель:** Реализовать core gameplay logic

#### Архитектура:

**1. SnowballBooster (новый тип бустера)**
```
features/booster/types/SnowballBooster.ts
```

**Что делает:**
- Extends `BaseBooster` или отдельный класс
- `activate()` → триггерит трансформацию obstacles
- `update(dt)` → таймер активности
- `deactivate()` → возврат обычных obstacles

**2. ObstacleTransformService**
```
features/obstacles/services/ObstacleTransformService.ts
```

**Ответственность:**
- Замена текстуры obstacle → snowman
- Добавление флага `isSnowman` (для collision behavior)
- Revert обратно после окончания booster

**3. Collision Behavior Update**
```
features/collision/handler/CollisionHandler.ts
```

**Изменения:**
- Проверка: `if (obstacle.isSnowman)` → вместо damage → spawn coins
- Trigger `SnowmanShatterEffect`
- Deactivate obstacle (remove from active pool)

#### Задачи:
- [ ] Создать `SnowballBooster.ts`
- [ ] Интегрировать в `BoosterManager.ts`
- [ ] Создать `ObstacleTransformService.ts`
- [ ] Обновить `CollisionHandler.ts` (snowman collision → spawn coins)
- [ ] Добавить spawn coins при разрушении снеговика (3-5 coins)

**Критерий успеха:**
- Собрал snowball → obstacles стали снеговиками
- Ударился об snowman → он исчез + появились монеты

---

### **Phase 3: Visual Effects (Week 2)**

**Цель:** Добавить juice - эффекты, которые делают wow

#### Effects:

**1. Snowman Shatter Effect**
```
features/effects/SnowmanShatterEffect.ts
```

**Что делает:**
- При collision → burst of particles (ice shards, snow)
- Screen shake (легкий, 0.1s)
- Sound effect (хруст льда)

**2. Transformation Effect**
```
features/effects/TransformationEffect.ts
```

**Что делает:**
- При активации booster → poof effect на каждом obstacle
- Smooth transition: obstacle → snowman (fade/scale animation)

**3. Coin Explosion**
```
Reuse: features/coins/effects/CoinCollectEffect.ts
```

**Адаптация:**
- Spawn 3-5 coins radially от точки взрыва
- Coins летят в стороны (parabolic trajectory)
- Автоматически собираются через 0.5s

#### Задачи:
- [ ] Создать particle system для shatter (10-15 particles burst)
- [ ] GSAP анимация transformation (scale up + poof)
- [ ] Screen shake при разрушении снеговика
- [ ] Coin explosion pattern (radial spawn)
- [ ] Sound effects (опционально - AI generated)

**Критерий успеха:** Разрушение снеговика выглядит **сочно**

---

### **Phase 4: New Year Decorations (Week 3)**

**Цель:** Добавить новогоднюю атмосферу в background

#### Декорации:

**1. Snowflakes (падающий снег)**
```
features/decoration/entities/Snowflake.ts
features/decoration/spawners/SnowflakeSpawner.ts
```

**Механика:**
- Copy-paste `StarSpawner` logic
- Slower speed (снег падает медленнее звезд)
- Larger sprites
- Slight sway (синусоидальное движение по X)

**2. Santa Sleigh (пролетающая в небе)**
```
features/decoration/entities/SantaSleigh.ts
features/decoration/spawners/SantaSleighSpawner.ts
```

**Механика:**
- Copy-paste `CloudSpawner` logic
- Rare spawn (каждые 15-20 секунд)
- Higher Y position (top of screen)

**3. Christmas Trees (optional)**
```
Альтернативный вид обычных obstacles
```

**Механика:**
- Random chance (30%) obstacle spawns как елка вместо обычного
- Та же collision behavior
- Просто визуальное разнообразие

#### Задачи:
- [ ] AI генерация: snowflake.png, santa_sleigh.png, (optional) christmas_tree.png
- [ ] Создать `SnowflakeSpawner` (extend BaseSpawner)
- [ ] Создать `SantaSleighSpawner` (extend BaseSpawner)
- [ ] Зарегистрировать в `SpawnSystem.ts`
- [ ] (Optional) Random obstacle skin swap

**Критерий успеха:** Игра визуально кричит "Новый Год!"

---

### **Phase 5: Polish & Balance (Week 4)**

**Цель:** Tuning + последние штрихи

#### Задачи:

**Gameplay Balance:**
- [ ] Tuning: сколько монет дает снеговик (3? 5? 10?)
- [ ] Tuning: частота spawn snowball booster
- [ ] Tuning: длительность эффекта (6s? 8s? 10s?)
- [ ] Playtest: не слишком ли легко стало собрать TARGET_COINS?

**Visual Polish:**
- [ ] Particle colors (снег должен быть белым/голубым)
- [ ] Animation timing (transformation должна быть snappy)
- [ ] UI feedback: показывать snowball booster timer (как обычный booster?)

**Sound (optional):**
- [ ] AI generated: snowman shatter sound (ElevenLabs / Soundraw)
- [ ] Background: jingle bells music loop (низкая громкость)
- [ ] Collect snowball: "whooosh" sound

**Special Touches:**
- [ ] Victory screen: snow particle background
- [ ] Start screen: "Happy New Year" text (опционально)
- [ ] End screen: snowflakes falling behind results

**Критерий успеха:** Игра feels **polished** и готова к релизу

---

## 🎨 AI Asset List (3D Hypper AI)

### **Priority 1: Core Mechanic**
1. **snowball_booster.png** - Снежный ком (collectible booster)
   - Промпт: `"cute 3D snowball, cartoony style, white and blue, transparent background, game asset"`
   - Size: 512x512 или 1024x1024
   - Format: PNG с alpha channel

2. **snowman_obstacle.png** - Снеговик (transformed obstacle)
   - Промпт: `"cute 3D snowman, cartoony style, front view, simple design, 3 snowballs stacked, transparent background, game sprite"`
   - Size: 512x512
   - Notes: Должен быть примерно того же размера, что и обычный obstacle

3. **ice_shard.png** - Осколок льда (particle)
   - Промпт: `"small ice shard fragment, crystal, transparent, game particle"`
   - Size: 128x128 или 256x256
   - Usage: Для shatter effect

4. **snow_particle.png** - Снежинка (particle)
   - Промпт: `"tiny snowflake, simple shape, white, transparent background, particle"`
   - Size: 64x64 или 128x128
   - Usage: Для transformation poof effect

### **Priority 2: Decorations**
5. **snowflake_decoration.png** - Снежинка декоративная (background)
   - Промпт: `"beautiful 3D snowflake, detailed, transparent background, game decoration"`
   - Size: 256x256
   - Usage: Падающие снежинки (как звезды)

6. **santa_sleigh.png** - Сани Санты (background)
   - Промпт: `"santa sleigh silhouette, side view, reindeer pulling, simple design, transparent background"`
   - Size: 512x512
   - Usage: Пролетает в background (как облака)

### **Priority 3: Optional**
7. **christmas_tree_obstacle.png** - Елка (alternative obstacle)
   - Промпт: `"cute 3D christmas tree, cartoony style, front view, decorated, transparent background"`
   - Size: 512x512
   - Usage: Визуальное разнообразие obstacles

8. **golden_coin.png** - Золотая монета (optional x2 multiplier)
   - Промпт: `"golden coin, shiny, front view, transparent background, game collectible"`
   - Size: 256x256
   - Usage: Редкий spawn, дает x2 coins

---

## 🔧 Technical Notes

### **Performance Considerations:**

**Particles:**
- Используй `PIXI.ParticleContainer` для shatter effects (100+ particles)
- Pool particles (reuse вместо destroy/create)
- Limit: max 50 active particles одновременно

**Texture Swapping:**
- Obstacle → Snowman трансформация через `sprite.texture = ...`
- НЕ создаем новые sprites, используем existing pool
- Minimal GC (garbage collection) pressure

**Spawn Frequency:**
- Snowball booster: rare spawn (как обычные boosters, может реже)
- Decorations: независимые spawners (не влияют на gameplay)

### **Integration Points:**

**Files to Modify:**
1. `src/features/booster/manager/BoosterManager.ts` - register SnowballBooster
2. `src/features/collision/handler/CollisionHandler.ts` - snowman collision behavior
3. `src/features/spawning/SpawnSystem.ts` - register decoration spawners
4. `src/shared/config/constants.ts` - add new asset paths + config values

**New Files to Create:**
1. `src/features/booster/types/SnowballBooster.ts`
2. `src/features/obstacles/services/ObstacleTransformService.ts`
3. `src/features/effects/SnowmanShatterEffect.ts`
4. `src/features/decoration/entities/Snowflake.ts`
5. `src/features/decoration/spawners/SnowflakeSpawner.ts`
6. (Optional) `src/features/decoration/entities/SantaSleigh.ts`
7. (Optional) `src/features/decoration/spawners/SantaSleighSpawner.ts`

### **Config Values (to add in constants.ts):**

```typescript
// New Year Event Config
NEW_YEAR: {
  SNOWBALL_BOOSTER: {
    DURATION: 8,              // секунд активности
    COINS_PER_SNOWMAN: 5,     // монет при разрушении
    SPAWN_COOLDOWN: 15,       // секунд между спавнами
  },
  DECORATIONS: {
    SNOWFLAKE_FREQUENCY: 2,   // каждые 2 секунды
    SANTA_FREQUENCY: 20,      // каждые 20 секунд
  },
  PARTICLES: {
    SHATTER_COUNT: 15,        // частиц при взрыве
    SHATTER_SPEED: 300,       // скорость разлета
  }
}
```

---

## 📊 Success Metrics

**MVP (Minimum Viable Product):**
- ✅ Snowball booster работает (collect → transform → explode)
- ✅ Visual feedback есть (particles + animation)
- ✅ Монеты spawns при разрушении снеговика
- ✅ Нет багов / crashes

**Polished Release:**
- ✅ Snowflakes падают в background
- ✅ Sound effects добавлены
- ✅ Victory screen новогодний
- ✅ Balanced gameplay (не слишком легко/сложно)

**Dream State:**
- ✅ Santa sleigh пролетает
- ✅ Golden coins (x2 multiplier)
- ✅ Christmas trees как alternative obstacles
- ✅ Special "Happy New Year" victory animation

---

## 🚀 Next Steps (Start Now)

### **Today:**
1. Open 3D Hypper AI
2. Генерируй первые 2 ассета:
   - `snowball_booster.png`
   - `snowman_obstacle.png`
3. Экспорт → добавь в `public/assets/sprites/`
4. Test: загружаются ли в игре?

### **This Week:**
1. Код `SnowballBooster.ts` (base structure)
2. Код `ObstacleTransformService.ts` (texture swap logic)
3. Test: трансформация работает?

### **Next Week:**
1. Collision behavior (snowman → coins)
2. Particle effects (shatter)
3. Playtest: fun factor?

---

## 💡 Pro Tips

**1. Start Small, Iterate Fast**
- Сначала сделай работающий MVP (без particles, без decorations)
- Протестируй core mechanic
- Потом добавляй juice

**2. Use Existing Systems**
- `CoinCollectEffect` → reuse для coin explosion
- `BaseSpawner` → template для decorations
- `BoosterManager` → просто добавь новый тип

**3. AI Iterations**
- Первый ассет из AI редко идеален
- Генерируй 3-5 вариантов, выбирай лучший
- Можешь комбинировать (лучшая голова + лучшее тело)

**4. Performance First**
- Если FPS падает → убавь particles
- Monitor через `PerformanceMonitor.ts`
- Mobile devices - приоритет

**5. Feedback Loop**
- Покажи команде/друзьям рано
- "Wow" reaction = продолжай
- "Meh" reaction = pivot

---

## 🎄 Bottom Line

**К Новому году у тебя будет:**
- 🎮 Уникальный gameplay twist (snowball booster)
- 🎨 Новогодняя атмосфера (decorations)
- ✨ Wow-эффекты (particles + animations)
- 💰 Минимум ресурсов (ты + AI)

**Это будет ОВЕР**, потому что:
1. Gameplay innovation (obstacles → rewards)
2. Seasonal relevance (New Year hype)
3. Visual polish (AAA feel with indie budget)
4. Viral potential (shareable moments)

---

**Let's make it happen! 🚀**
