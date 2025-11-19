import { CONFIG } from '../../../shared/config/constants';
import type { BoosterSnapshot, DifficultyStats } from '../../../types';

export class DifficultyManager {
  private currentScore: number;
  private baseCoinSpawnInterval: number;
  private baseObstacleSpawnInterval: number;
  private baseBoosterSpawnInterval: number;
  private currentCoinSpawnInterval: number;
  private currentObstacleSpawnInterval: number;
  private currentBoosterSpawnInterval: number;
  private coinFrequencyMultiplier: number;
  private obstacleFrequencyMultiplier: number;

  constructor() {
    this.currentScore = 0;
    this.baseCoinSpawnInterval = 0.8;
    this.baseObstacleSpawnInterval = 1.2;
    this.baseBoosterSpawnInterval = 8.0;
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval;
    this.currentBoosterSpawnInterval = this.baseBoosterSpawnInterval;
    this.coinFrequencyMultiplier = 1.0;
    this.obstacleFrequencyMultiplier = 1.0;

    console.log('📊 DifficultyManager initialized');
  }

  updateScore(score: number): void {
    this.currentScore = score;
    this.recalculateDifficulty();
  }

  recalculateDifficulty(): void {
    const progressTier = Math.floor(this.currentScore / 50);
    this.coinFrequencyMultiplier = 1.0 + Math.min(progressTier * 0.1, 0.5);
    this.obstacleFrequencyMultiplier = 1.0 + Math.min(progressTier * 0.05, 0.3);
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval / this.coinFrequencyMultiplier;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval / this.obstacleFrequencyMultiplier;
  }

  getCoinSpawnInterval(): number {
    return this.currentCoinSpawnInterval;
  }

  getObstacleSpawnInterval(): number {
    return this.currentObstacleSpawnInterval;
  }

  getBoosterSpawnInterval(): number {
    return this.currentBoosterSpawnInterval;
  }

  createSnapshot(): BoosterSnapshot {
    return {
      score: this.currentScore,
      coinSpawnInterval: this.currentCoinSpawnInterval,
      obstacleSpawnInterval: this.currentObstacleSpawnInterval,
      boosterSpawnInterval: this.currentBoosterSpawnInterval,
      coinFrequencyMultiplier: this.coinFrequencyMultiplier,
      obstacleFrequencyMultiplier: this.obstacleFrequencyMultiplier
    };
  }

  restoreSnapshot(snapshot: BoosterSnapshot): void {
    if (!snapshot) {
      console.warn('⚠️ Cannot restore: snapshot is null');
      return;
    }

    this.currentScore = snapshot.score as number;
    this.currentCoinSpawnInterval = snapshot.coinSpawnInterval as number;
    this.currentObstacleSpawnInterval = snapshot.obstacleSpawnInterval as number;
    this.currentBoosterSpawnInterval = snapshot.boosterSpawnInterval as number;
    this.coinFrequencyMultiplier = snapshot.coinFrequencyMultiplier as number;
    this.obstacleFrequencyMultiplier = snapshot.obstacleFrequencyMultiplier as number;

    console.log('📸 Difficulty state restored from snapshot');
  }

  applyBoosterEffect(): void {
    this.currentCoinSpawnInterval = CONFIG.BOOSTER_COIN_SPAWN_INTERVAL;
    console.log('✨ Booster effect applied to difficulty');
  }

  reset(): void {
    this.currentScore = 0;
    this.coinFrequencyMultiplier = 1.0;
    this.obstacleFrequencyMultiplier = 1.0;
    this.currentCoinSpawnInterval = this.baseCoinSpawnInterval;
    this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval;
    this.currentBoosterSpawnInterval = this.baseBoosterSpawnInterval;

    console.log('🔄 DifficultyManager reset');
  }

  getStats(): DifficultyStats {
    return {
      score: this.currentScore,
      coinInterval: this.currentCoinSpawnInterval.toFixed(2),
      obstacleInterval: this.currentObstacleSpawnInterval.toFixed(2),
      coinMultiplier: this.coinFrequencyMultiplier.toFixed(2),
      obstacleMultiplier: this.obstacleFrequencyMultiplier.toFixed(2)
    };
  }
}
