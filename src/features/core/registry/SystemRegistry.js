/**
 * SystemRegistry
 *
 * DI контейнер для всех систем и менеджеров игры.
 * Обеспечивает централизованное хранение и доступ к зависимостям.
 *
 * Принципы:
 * - Single Responsibility: Только хранение и предоставление систем
 * - Dependency Inversion: Системы регистрируются извне, а не создаются внутри
 */

export class SystemRegistry {
  constructor() {
    // Core systems (Engine)
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    // Game entities
    this.player = null;

    // Game systems
    this.spawnSystem = null;
    this.collisionSystem = null;

    // Managers
    this.stateManager = null;
    this.difficultyManager = null;
    this.progressionManager = null;
    this.boosterManager = null;
    this.soundManager = null;
    this.restartManager = null;
    this.lifecycleManager = null;

    // Handlers & Coordinators
    this.collisionHandler = null;
    this.effectCoordinator = null;
    this.cullingCoordinator = null;

    // Rendering optimization
    this.cullingManager = null;
    this.interpolationManager = null;

    // Controllers
    this.playerPhysicsController = null;
    this.ui = null;

    // State flags
    this.isColliding = false;
    this.isWaitingForUserInput = false;
    this.frameCount = 0;
    this.poolLogInterval = null;
  }

  /**
   * Регистрирует систему/менеджер в реестре
   * @param {string} name - Имя системы
   * @param {*} instance - Экземпляр системы
   */
  register(name, instance) {
    if (this[name] === undefined) {
      console.warn(`⚠️ SystemRegistry: Unknown system name "${name}"`);
    }
    this[name] = instance;
  }

  /**
   * Получить систему по имени
   * @param {string} name - Имя системы
   * @returns {*} Экземпляр системы
   */
  get(name) {
    if (this[name] === undefined) {
      console.warn(`⚠️ SystemRegistry: System "${name}" not found`);
    }
    return this[name];
  }

  /**
   * Проверить, зарегистрирована ли система
   * @param {string} name - Имя системы
   * @returns {boolean}
   */
  has(name) {
    return this[name] !== null && this[name] !== undefined;
  }

  /**
   * Получить все зарегистрированные системы для debug
   * @returns {Object} Объект с именами и статусом систем
   */
  getRegisteredSystems() {
    const systems = {};
    for (const key in this) {
      if (typeof this[key] !== 'function') {
        systems[key] = this[key] !== null;
      }
    }
    return systems;
  }
}
