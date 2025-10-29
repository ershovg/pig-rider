/**
 * SystemRegistry - DI контейнер для всех систем и менеджеров игры.
 */

export class SystemRegistry {
  constructor() {
    // Core Engine
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    // Entities
    this.player = null;

    // Systems
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

    // Coordinators & Handlers
    this.collisionHandler = null;
    this.effectCoordinator = null;
    this.cullingCoordinator = null;

    // Rendering
    this.cullingManager = null;
    this.interpolationManager = null;

    // Controllers & UI
    this.playerPhysicsController = null;
    this.ui = null;

    // State
    this.isColliding = false;
    this.isWaitingForUserInput = false;
    this.frameCount = 0;
    this.poolLogInterval = null;
  }

  register(name, instance) {
    if (this[name] === undefined) {
      console.warn(`⚠️ SystemRegistry: Unknown system name "${name}"`);
    }
    this[name] = instance;
  }

  get(name) {
    if (this[name] === undefined) {
      console.warn(`⚠️ SystemRegistry: System "${name}" not found`);
    }
    return this[name];
  }

  has(name) {
    return this[name] !== null && this[name] !== undefined;
  }

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
