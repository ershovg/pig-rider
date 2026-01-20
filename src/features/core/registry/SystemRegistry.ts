import type { Renderer } from '../../../core/Renderer';
import type { GameLoop } from '../../../core/GameLoop';
import type { AssetLoader } from '../../../core/AssetLoader';
import type { Player } from '../../player/entities/Player';
import type { SpawnSystem } from '../../spawning/SpawnSystem';
import type { CollisionSystem } from '../../collision/system/CollisionSystem';
import type { GameStateManager } from '../../state/GameStateManager';
import type { DifficultyManager } from '../../progression/manager/DifficultyManager';
import type { ProgressionManager } from '../../progression/manager/ProgressionManager';
import type { BoosterManager } from '../../booster/manager/BoosterManager';
import type { SoundManager } from '../../sound/manager/SoundManager';
import type { RestartManager } from '../../restart/manager/RestartManager';
import type { GameLifecycleManager } from '../../progression/lifecycle/GameLifecycleManager';
import type { CollisionHandler } from '../../collision/handler/CollisionHandler';
import type { EffectCoordinator } from '../../effects/manager/EffectCoordinator';
import type { CullingCoordinator } from '../../rendering/culling/CullingCoordinator';
import type { CullingManager } from '../../rendering/culling/CullingManager';
import type { InterpolationManager } from '../../rendering/interpolation/InterpolationManager';
import type { PlayerPhysicsController } from '../../player/controllers/PlayerPhysicsController';
import type { UIController } from '../../ui/UIController';

export class SystemRegistry {
  renderer: Renderer | null;
  gameLoop: GameLoop | null;
  assetLoader: AssetLoader | null;

  player: Player | null;

  spawnSystem: SpawnSystem | null;
  collisionSystem: CollisionSystem | null;

  stateManager: GameStateManager | null;
  difficultyManager: DifficultyManager | null;
  progressionManager: ProgressionManager | null;
  boosterManager: BoosterManager | null;
  soundManager: SoundManager | null;
  restartManager: RestartManager | null;
  lifecycleManager: GameLifecycleManager | null;

  collisionHandler: CollisionHandler | null;
  effectCoordinator: EffectCoordinator | null;
  cullingCoordinator: CullingCoordinator | null;

  cullingManager: CullingManager | null;
  interpolationManager: InterpolationManager | null;

  playerPhysicsController: PlayerPhysicsController | null;
  ui: UIController | null;

  isColliding: boolean;
  isWaitingForUserInput: boolean;
  frameCount: number;
  poolLogInterval: number | null;

  constructor() {
    this.renderer = null;
    this.gameLoop = null;
    this.assetLoader = null;

    this.player = null;

    this.spawnSystem = null;
    this.collisionSystem = null;

    this.stateManager = null;
    this.difficultyManager = null;
    this.progressionManager = null;
    this.boosterManager = null;
    this.soundManager = null;
    this.restartManager = null;
    this.lifecycleManager = null;

    this.collisionHandler = null;
    this.effectCoordinator = null;
    this.cullingCoordinator = null;

    this.cullingManager = null;
    this.interpolationManager = null;

    this.playerPhysicsController = null;
    this.ui = null;

    this.isColliding = false;
    this.isWaitingForUserInput = false;
    this.frameCount = 0;
    this.poolLogInterval = null;
  }

  register(name: string, instance: unknown): void {
    if (!(name in this)) {
      console.warn(`SystemRegistry: Unknown system name "${name}"`);
    }
    (this as Record<string, unknown>)[name] = instance;
  }

  get(name: string): unknown {
    if (!(name in this)) {
      console.warn(`SystemRegistry: System "${name}" not found`);
    }
    return (this as Record<string, unknown>)[name];
  }

  has(name: string): boolean {
    const value = (this as Record<string, unknown>)[name];
    return value !== null && value !== undefined;
  }

  getRegisteredSystems(): Record<string, boolean> {
    const systems: Record<string, boolean> = {};
    for (const key in this) {
      if (typeof this[key] !== 'function') {
        systems[key] = this[key] !== null;
      }
    }
    return systems;
  }
}
