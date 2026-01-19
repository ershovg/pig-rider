import { CONFIG } from '../../../shared/config/constants';
import {
  Lane,
  BoosterSnapshot,
  BoosterContext,
  SpawnSystem,
  DifficultyManager,
  ProgressionManager,
  SoundManager,
  UIController,
  Player
} from '../../../types';

export class BoosterManager {
  private spawnSystem: SpawnSystem;
  private difficultyManager: DifficultyManager;
  private ui: UIController;
  private player: Player;
  private soundManager: SoundManager | null;
  private progressionManager: ProgressionManager | null;

  private isActive: boolean;
  private timeRemaining: number;
  private currentLane: Lane;
  private laneSwitchTimer: number;
  private cooldownTimer: number;
  private preBoosterSnapshot: BoosterSnapshot | null;

  private isFirstBoosterEver: boolean;

  constructor(
    spawnSystem: SpawnSystem,
    difficultyManager: DifficultyManager,
    ui: UIController,
    player: Player,
    soundManager: SoundManager | null = null,
    progressionManager: ProgressionManager | null = null
  ) {
    this.spawnSystem = spawnSystem;
    this.difficultyManager = difficultyManager;
    this.ui = ui;
    this.player = player;
    this.soundManager = soundManager;
    this.progressionManager = progressionManager;

    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;

    this.isFirstBoosterEver = true;
  }

  isFirstBooster(): boolean {
    return this.isFirstBoosterEver;
  }

  markFirstBoosterUsed(): void {
    this.isFirstBoosterEver = false;
    console.log('First booster used, future boosters will skip tutorial modal');
  }

  update(deltaTime: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }

    if (this.isActive) {
      this.timeRemaining -= deltaTime;
      this.laneSwitchTimer -= deltaTime;

      if (this.laneSwitchTimer <= 0) {
        this.switchLane();
      }

      if (this.timeRemaining <= 0) {
        this.deactivate();
      }
    }
  }

  private switchLane(): void {
    this.laneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;

    const availableLanes = ([0, 1, 2] as Lane[]).filter(l => l !== this.currentLane);
    this.currentLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    this.spawnSystem.fillLaneWithCoins(this.currentLane);
    console.log(`Booster lane switched to: ${this.currentLane}`);
  }

  async activate(): Promise<void> {
    this.preBoosterSnapshot = this.difficultyManager.createSnapshot();
    this.isActive = true;
    this.timeRemaining = CONFIG.BOOSTER_DURATION;
    this.laneSwitchTimer = CONFIG.BOOSTER_LANE_SWITCH_INTERVAL;
    this.currentLane = Math.floor(Math.random() * CONFIG.LANES.TOTAL) as Lane;

    this.difficultyManager.applyBoosterEffect();
    this.spawnSystem.clearAllObstacles();
    this.spawnSystem.fillLaneWithCoins(this.currentLane);
    this.ui.addBoosterClass();
    this.ui.showBoosterIcon();

    if (this.progressionManager) {
      this.progressionManager.activateBoosterSpeed();
    }

    if (this.player) {
      this.player.switchAnimation(true);
    }

    if (this.soundManager) {
      this.soundManager.setMusicState('booster');
      console.log('Music state: booster (gap crossfade + beat-sync)');
    }

    console.log(`Booster activated! Lane: ${this.currentLane}`);
  }

  deactivate(): void {
    this.isActive = false;
    this.timeRemaining = 0;
    this.laneSwitchTimer = 0;

    this.spawnSystem.clearBoosterCoins();

    if (this.preBoosterSnapshot) {
      this.difficultyManager.restoreSnapshot(this.preBoosterSnapshot);
      this.preBoosterSnapshot = null;
    }

    this.cooldownTimer = CONFIG.BOOSTER_COOLDOWN_DURATION;
    this.ui.removeBoosterClass();
    this.ui.hideBoosterIcon();

    if (this.progressionManager) {
      this.progressionManager.deactivateBoosterSpeed();
    }

    if (this.player) {
      this.player.switchAnimation(false);
    }

    if (this.soundManager) {
      this.soundManager.setMusicState('gameplay');
      console.log('Music state: gameplay (gap crossfade back)');
    }

    console.log(`Booster deactivated. Cooldown: ${CONFIG.BOOSTER_COOLDOWN_DURATION}s`);
  }

  reset(): void {
    this.isActive = false;
    this.timeRemaining = 0;
    this.currentLane = 0;
    this.laneSwitchTimer = 0;
    this.cooldownTimer = 0;
    this.preBoosterSnapshot = null;
  }

  getContext(): BoosterContext {
    return {
      isBoosterMode: this.isActive,
      boosterActiveLane: this.currentLane,
      isBoosterActive: this.isActive,
      boosterCooldown: this.cooldownTimer
    };
  }
}
