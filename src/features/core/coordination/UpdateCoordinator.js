/**
 * UpdateCoordinator
 *
 * Координирует игровой цикл обновления (update loop).
 * Управляет порядком выполнения всех систем каждый кадр.
 *
 * Принципы:
 * - Single Responsibility: Только координация update логики
 * - Dependency Inversion: Получает SystemRegistry извне
 * - Open/Closed: Порядок систем может быть изменен без изменения других модулей
 *
 * Порядок выполнения систем критически важен:
 * 1. Booster (влияет на spawn)
 * 2. Progression (обновляет счет, скорость)
 * 3. Player (управление, физика)
 * 4. Spawn (создает объекты на основе difficulty)
 * 5. Culling (удаляет невидимые объекты)
 * 6. Collision (проверяет столкновения)
 * 7. Win/Lose (проверяет условия окончания игры)
 */

export class UpdateCoordinator {
  /**
   * @param {SystemRegistry} registry - Реестр систем
   */
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Главный update loop игры
   * Вызывается GameLoop'ом каждый кадр (fixed timestep 60 FPS)
   *
   * @param {number} deltaTime - Время между фреймами (обычно 16.67ms)
   * @param {number} frameDeltaTime - Реальное время между фреймами (для интерполяции)
   */
  update(deltaTime, frameDeltaTime = null) {
    // Проверка: игра в состоянии "playing"
    if (!this.registry.stateManager.isPlaying()) return;

    this.registry.frameCount++;

    // 1. Сохраняем состояния для интерполяции (render)
    this.registry.interpolationManager.saveStates([
      this.registry.spawnSystem.getActiveObstacles(),
      this.registry.spawnSystem.getActiveCoins(),
      this.registry.spawnSystem.getActiveBoosters(),
      [this.registry.player]
    ]);

    // 2. Обновляем бустер (управляет временем бустера, сменой полос)
    this.registry.boosterManager.update(deltaTime);

    // 3. Обновляем прогрессию (счет, скорость игры)
    this.registry.progressionManager.update(deltaTime);

    // 4. Обновляем difficulty на основе текущего счета
    this.registry.difficultyManager.updateScore(this.registry.progressionManager.getScore());

    // 5. Обновляем игрока (физика, анимации, управление)
    this.registry.player.update(deltaTime);

    // 6. Обновляем систему спавна (создаем новые объекты)
    const boosterContext = this.registry.boosterManager.getContext();
    this.registry.spawnSystem.update(deltaTime, this.registry.progressionManager.getGameSpeed(), {
      ...boosterContext,
      difficultyManager: this.registry.difficultyManager,
      cullThreshold: this.registry.cullingManager.cullThreshold,
      frameDeltaTime: frameDeltaTime || deltaTime
    });

    // 7. Выполняем culling (удаляем объекты за экраном)
    this.registry.cullingCoordinator.performCulling(this.registry.frameCount);

    // 8. Обрабатываем коллизии
    const result = this.registry.collisionHandler.processFrame(
      this.registry.player,
      this.registry.spawnSystem.getActiveObstacles(),
      this.registry.spawnSystem.getActiveCoins(),
      this.registry.spawnSystem.getActiveBoosters()
    );

    // 9. Обработка столкновения с препятствием (Game Over)
    if (result.obstacleCollision && !this.registry.isColliding) {
      this.handleObstacleCollision(result.obstacleCollision);
      return; // Прекращаем update после столкновения
    }

    // 10. Обработка собранных монет
    if (result.collectedCoins.length > 0) {
      const shouldEndGame = this.handleCoinCollection(result.collectedCoins);
      if (shouldEndGame) return; // Игрок выиграл
    }

    // 11. Обработка собранного бустера
    if (result.collectedBooster) {
      const shouldEndGame = this.handleBoosterCollection(result.collectedBooster);
      if (shouldEndGame) return; // Игрок выиграл (редко, но возможно)
    }
  }

  /**
   * Обработка столкновения с препятствием
   * @param {Object} collision - Данные о столкновении
   */
  handleObstacleCollision(collision) {
    this.registry.isColliding = true;

    // Запускаем последовательность: эффект → задержка → Game Over
    this.registry.lifecycleManager.handleCollisionSequence(
      collision,
      this.registry.effectCoordinator,
      () => {
        // Callback после эффекта столкновения
        this.registry.lifecycleManager.endGame(
          false,
          this.registry.progressionManager.getScore()
        );
      }
    );
  }

  /**
   * Обработка собранных монет
   * @param {Array} coins - Массив собранных монет
   * @returns {boolean} True если игра должна закончиться (победа)
   */
  handleCoinCollection(coins) {
    for (const coin of coins) {
      // Добавляем очки
      this.registry.progressionManager.addScore(coin.value);

      // Показываем эффект сбора монеты
      this.registry.effectCoordinator.emitCoinCollectEffect(coin.x, coin.y);

      // Проверяем условие победы
      if (this.registry.progressionManager.checkWinCondition()) {
        this.registry.lifecycleManager.endGame(
          true,
          this.registry.progressionManager.getScore()
        );
        return true; // Игра закончена
      }
    }

    return false; // Игра продолжается
  }

  /**
   * Обработка собранного бустера
   * @param {Object} booster - Данные о собранном бустере
   * @returns {boolean} True если игра должна закончиться (победа)
   */
  handleBoosterCollection(booster) {
    // Добавляем очки за бустер
    this.registry.progressionManager.addScore(booster.value);

    // Проверяем условие победы (редко, но возможно)
    if (this.registry.progressionManager.checkWinCondition()) {
      this.registry.lifecycleManager.endGame(
        true,
        this.registry.progressionManager.getScore()
      );
      return true; // Игра закончена
    }

    // Активируем бустер (показываем модал, ждем подтверждения)
    this.registry.lifecycleManager.handleBoosterActivation();

    return false; // Игра продолжается (на паузе до подтверждения)
  }

  /**
   * Сбрасывает флаг коллизии (используется при рестарте)
   */
  resetCollisionFlag() {
    this.registry.isColliding = false;
  }

  /**
   * Сбрасывает счетчик кадров (используется при рестарте)
   */
  resetFrameCount() {
    this.registry.frameCount = 0;
  }
}
