/**
 * RestartManager - Модуль управления полным перезапуском игры
 *
 * Ответственность (SRP):
 * - Остановка всех активных систем (game loop, звуки, таймеры)
 * - Полная очистка состояния (managers, UI, flags)
 * - Перезапуск игры без показа start screen
 *
 * Принципы:
 * - SRP: Только логика restart, ничего больше
 * - DIP: Зависит от абстракций (managers API), не реализаций
 * - ISP: Минимальный публичный интерфейс (restart())
 */
import { CONFIG } from '../../../shared/config/constants.js';

export class RestartManager {
  /**
   * @param {Object} dependencies - Все необходимые зависимости
   * @param {GameStateManager} dependencies.stateManager
   * @param {ProgressionManager} dependencies.progressionManager
   * @param {BoosterManager} dependencies.boosterManager
   * @param {DifficultyManager} dependencies.difficultyManager
   * @param {Player} dependencies.player
   * @param {SpawnSystem} dependencies.spawnSystem
   * @param {GameLoop} dependencies.gameLoop
   * @param {UIController} dependencies.ui
   * @param {SoundManager} dependencies.soundManager
   * @param {Game} dependencies.game - Для доступа к внутренним флагам и методам
   */
  constructor(dependencies) {
    this.stateManager = dependencies.stateManager;
    this.progressionManager = dependencies.progressionManager;
    this.boosterManager = dependencies.boosterManager;
    this.difficultyManager = dependencies.difficultyManager;
    this.player = dependencies.player;
    this.spawnSystem = dependencies.spawnSystem;
    this.gameLoop = dependencies.gameLoop;
    this.ui = dependencies.ui;
    this.soundManager = dependencies.soundManager;
    this.game = dependencies.game;

    console.log('✅ RestartManager initialized');
  }

  /**
   * Выполняет полный перезапуск игры
   *
   * Flow:
   * 1. Остановка всех систем (loop, звуки, таймеры)
   * 2. Очистка UI (экраны победы/поражения, модалы)
   * 3. Сброс всех managers и систем
   * 4. Сброс флагов (включая isFirstBoosterEver)
   * 5. Перезапуск игры сразу в playing state (без start screen)
   *
   * Память/GPU:
   * - PixiJS текстуры остаются в VRAM (не пересоздаются)
   * - Object Pooling автоматически управляет entities
   * - Garbage Collection минимизирован за счет переиспользования объектов
   */
  restart() {
    console.log('🔄 RestartManager: Starting full game restart...');

    // ═══════════════════════════════════════════════════════════
    // ШАГ 1: ОСТАНОВКА ВСЕХ СИСТЕМ
    // ═══════════════════════════════════════════════════════════
    this._stopSystems();

    // ═══════════════════════════════════════════════════════════
    // ШАГ 2: ОЧИСТКА UI
    // ═══════════════════════════════════════════════════════════
    this._cleanupUI();

    // ═══════════════════════════════════════════════════════════
    // ШАГ 3: СБРОС ВСЕХ MANAGERS И СИСТЕМ
    // ═══════════════════════════════════════════════════════════
    this._resetManagers();

    // ═══════════════════════════════════════════════════════════
    // ШАГ 4: СБРОС ВНУТРЕННИХ ФЛАГОВ GAME
    // ═══════════════════════════════════════════════════════════
    this._resetGameFlags();

    // ═══════════════════════════════════════════════════════════
    // ШАГ 5: ПЕРЕЗАПУСК ИГРЫ (БЕЗ START SCREEN)
    // ═══════════════════════════════════════════════════════════
    this._startGameplay();

    console.log('✅ RestartManager: Game restarted successfully');
  }

  /**
   * Приватный метод: Остановка всех активных систем
   */
  _stopSystems() {
    console.log('  ⏹️  Stopping systems...');

    // Остановить game loop (перестает вызывать update/render)
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    // 🔧 ИСПРАВЛЕНИЕ БАГА: Используем reset() вместо stopAll()
    // reset() очищает состояния MusicStateManager (currentState/previousState)
    // Это предотвращает конфликт при повторном запуске игры
    if (this.soundManager) {
      this.soundManager.reset();
    }

    // Остановить interval логирования пулов
    if (this.game) {
      this.game.stopPoolLogging();
    }
  }

  /**
   * Приватный метод: Очистка UI (скрытие экранов)
   */
  _cleanupUI() {
    console.log('  🧹 Cleaning up UI...');

    // Скрыть экраны победы/поражения
    this.ui.hideWinScreen();
    this.ui.hideLoseScreen();

    // Скрыть модал бустера (если вдруг открыт)
    this.ui.hideBoosterModal();

    // Убрать визуальные эффекты бустера
    this.ui.removeBoosterClass();

    // Скрыть иконку бустера
    this.ui.hideBoosterIcon();
  }

  /**
   * Приватный метод: Сброс всех managers и систем
   */
  _resetManagers() {
    console.log('  🔄 Resetting managers...');

    // Сброс прогрессии (score → 0, gameSpeed → базовая)
    this.progressionManager.reset();

    // Сброс бустера (таймеры → 0, isActive → false)
    this.boosterManager.reset();

    // 🎓 КРИТИЧЕСКИ ВАЖНО: Сброс флага первого бустера
    // После restart пользователь снова увидит обучающий модал
    this.boosterManager.isFirstBoosterEver = true;
    console.log('  🎓 First booster flag reset - tutorial will show again');

    // Сброс сложности (к начальным значениям)
    this.difficultyManager.reset();

    // Сброс игрока (позиция, анимация, состояние)
    this.player.reset();

    // Сброс spawn системы (все entities → в пулы)
    // Это очищает obstacles, coins, boosters, decorations
    this.spawnSystem.reset();

    // 🧹 КРИТИЧЕСКИ ВАЖНО: Очистка всех активных эффектов
    // Без этого collision/coin effects остаются висеть на экране после restart
    this.spawnSystem.clearAllEffects();
  }

  /**
   * Приватный метод: Сброс внутренних флагов Game.js
   */
  _resetGameFlags() {
    console.log('  🏳️  Resetting game flags...');

    // Сбросить флаг коллизии (чтобы новые коллизии обрабатывались)
    if (this.game) {
      this.game.isColliding = false;
      this.game.frameCount = 0;
    }
  }

  /**
   * Приватный метод: Запуск игры в playing state (без start screen)
   */
  _startGameplay() {
    console.log('  ▶️  Starting gameplay...');

    // Установить state напрямую в playing (не menu!)
    // Пользователь нажал "Начать заново" - сразу играем
    this.stateManager.setState('playing');

    // Показать HUD
    this.ui.showHUD();

    // Обновить счетчик монет (0 из TARGET_COINS)
    this.ui.updateCoinCount(0, CONFIG.TARGET_COINS);

    // Запустить gameplay музыку
    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('  🎵 Music state: gameplay');
    }

    // Запустить рендер (если был остановлен)
    if (this.game.renderer) {
      this.game.renderer.start();
    }

    // Запустить game loop
    this.gameLoop.start();

    // Запустить логирование пулов для дебага
    if (this.game) {
      this.game.startPoolLogging();
    }
  }
}
