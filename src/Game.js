/**
 * Game
 *
 * Главный facade игры. Тонкий слой композиции координаторов.
 * Делегирует всю логику специализированным координаторам.
 *
 * Архитектура:
 * - SystemRegistry: DI контейнер для всех систем
 * - InitializationCoordinator: Инициализация всех систем
 * - UpdateCoordinator: Игровой цикл обновления
 * - RenderCoordinator: Рендеринг и интерполяция
 *
 * Принципы SOLID:
 * - SRP: Game только композирует координаторы, не содержит бизнес-логики
 * - OCP: Новые системы добавляются через координаторы без изменения Game
 * - DIP: Game зависит от абстракций (координаторов), не от конкретных систем
 */

import { SystemRegistry } from './features/core/registry/SystemRegistry.js';
import { InitializationCoordinator } from './features/core/coordination/InitializationCoordinator.js';
import { UpdateCoordinator } from './features/core/coordination/UpdateCoordinator.js';
import { RenderCoordinator } from './features/core/coordination/RenderCoordinator.js';

export class Game {
  constructor() {
    // DI контейнер для всех систем
    this.registry = new SystemRegistry();

    // Координаторы (управляют жизненным циклом игры)
    this.initCoordinator = new InitializationCoordinator(this.registry);
    this.updateCoordinator = new UpdateCoordinator(this.registry);
    this.renderCoordinator = new RenderCoordinator(this.registry);
  }

  /**
   * Инициализация игры
   * Загружает critical ассеты, показывает Start Screen
   */
  async init() {
    try {
      await this.initCoordinator.init();

      // Устанавливаем UI event listeners
      this.initCoordinator.initUI({
        onPlayClick: () => this.startGame(),
        onBoosterContinue: () => this.resumeGame(),
        onRetry: () => this.restartGame(),
        onRestartGame: () => this.handleRestart(),
        onBookDemo: () => console.log('Book demo clicked')
      });
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      throw error;
    }
  }

  /**
   * Старт игры (первый раз или после рестарта)
   * Загружает gameplay ассеты, инициализирует системы, запускает игровой цикл
   */
  async startGame() {
    // Если системы еще не инициализированы (первый старт)
    if (!this.registry.player) {
      // Инициализируем gameplay системы с callback'ами на update/render
      await this.initCoordinator.initGameplaySystems(
        (dt, frameDt) => this.update(dt, frameDt),
        (alpha) => this.render(alpha)
      );

      // Устанавливаем Game reference в RestartManager
      this.registry.restartManager.setGame(this);
    }

    // Сбрасываем флаги
    this.updateCoordinator.resetCollisionFlag();
    this.updateCoordinator.resetFrameCount();

    // Запускаем игру через LifecycleManager
    this.registry.lifecycleManager.startGame();

    // Запускаем pool logging (debug)
    this.startPoolLogging();
  }

  /**
   * Возобновление игры после паузы (например, после бустер модала)
   */
  resumeGame() {
    this.registry.ui.hideBoosterModal();
    this.registry.stateManager.setState('playing');
    this.registry.gameLoop.resume();
  }

  /**
   * Перезапуск игры после Game Over
   */
  restartGame() {
    this.startGame();
  }

  /**
   * Полный рестарт игры (кнопка "Начать игру заново")
   * Очищает все системы и перезапускает с нуля
   */
  handleRestart() {
    if (!this.registry.restartManager) {
      console.error('❌ RestartManager not initialized');
      return;
    }

    this.registry.restartManager.restart();
  }

  /**
   * Update loop (вызывается GameLoop'ом каждый кадр)
   * @param {number} deltaTime - Фиксированный timestep (16.67ms для 60 FPS)
   * @param {number} frameDeltaTime - Реальное время между фреймами
   */
  update(deltaTime, frameDeltaTime = null) {
    this.updateCoordinator.update(deltaTime, frameDeltaTime);
  }

  /**
   * Render loop (вызывается GameLoop'ом каждый кадр)
   * @param {number} alpha - Прогресс интерполяции (0.0 - 1.0)
   */
  render(alpha) {
    this.renderCoordinator.render(alpha);
  }

  /**
   * Пауза игры
   */
  pause() {
    if (this.registry.stateManager.isPlaying()) {
      this.registry.stateManager.setState('paused');
      this.registry.gameLoop.pause();
    }
  }

  /**
   * Возобновление игры после паузы
   */
  resume() {
    if (this.registry.stateManager.isPaused()) {
      this.registry.stateManager.setState('playing');
      this.registry.gameLoop.resume();
    }
  }

  /**
   * Debug: Логирование статистики object pools
   */
  startPoolLogging() {
    if (this.registry.poolLogInterval) {
      clearInterval(this.registry.poolLogInterval);
    }

    this.registry.poolLogInterval = setInterval(() => {
      if (!this.registry.spawnSystem) return;

      const obstaclePool = this.registry.spawnSystem.obstacleSpawner?.pool;
      const coinPool = this.registry.spawnSystem.coinSpawner?.pool;
      const boosterPool = this.registry.spawnSystem.boosterSpawner?.pool;
      const cloudPool = this.registry.spawnSystem.cloudSpawner?.pool;
      const starPool = this.registry.spawnSystem.starSpawner?.pool;

      const obstacleStats = obstaclePool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const coinStats = coinPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const boosterStats = boosterPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const cloudStats = cloudPool?.getStats() || { active: 0, pooled: 0, total: 0 };
      const starStats = starPool?.getStats() || { active: 0, pooled: 0, total: 0 };

      console.log(
        `[POOL DEBUG] Obstacles: active=${obstacleStats.active} pooled=${obstacleStats.pooled} total=${obstacleStats.total} | ` +
        `Coins: active=${coinStats.active} pooled=${coinStats.pooled} | ` +
        `Boosters: active=${boosterStats.active} pooled=${boosterStats.pooled} | ` +
        `Clouds: active=${cloudStats.active} pooled=${cloudStats.pooled} | ` +
        `Stars: active=${starStats.active} pooled=${starStats.pooled}`
      );
    }, 5000);
  }

  /**
   * Остановка pool logging
   */
  stopPoolLogging() {
    if (this.registry.poolLogInterval) {
      clearInterval(this.registry.poolLogInterval);
      this.registry.poolLogInterval = null;
    }
  }

  /**
   * Полное уничтожение игры и освобождение ресурсов
   */
  destroy() {
    this.stopPoolLogging();
    if (this.registry.gameLoop) this.registry.gameLoop.stop();
    if (this.registry.player) this.registry.player.destroy();
    if (this.registry.ui) this.registry.ui.destroy();
    if (this.registry.renderer) this.registry.renderer.destroy();
  }
}
