import type { ObstaclePattern, PatternStats } from '../../../types/obstacles';

export class ObstaclePatternLibrary {
  private patterns: ObstaclePattern[];
  private recentPatterns: string[];
  private readonly maxRecentSize: number;

  constructor() {
    this.patterns = this.initializePatterns();
    this.recentPatterns = [];
    this.maxRecentSize = 3;
  }

  private initializePatterns(): ObstaclePattern[] {
    return [
      {
        name: 'single-left',
        lanes: [0],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие слева'
      },
      {
        name: 'single-middle',
        lanes: [1],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие по центру'
      },
      {
        name: 'single-right',
        lanes: [2],
        difficulty: 1,
        weight: 30,
        description: 'Одно препятствие справа'
      },
      {
        name: 'double-left',
        lanes: [0, 1],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы левая и центральная полосы'
      },
      {
        name: 'double-right',
        lanes: [1, 2],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы центральная и правая полосы'
      },
      {
        name: 'double-sides',
        lanes: [0, 2],
        difficulty: 2,
        weight: 20,
        description: 'Блокированы боковые полосы'
      },
      {
        name: 'double-left-offset',
        lanes: [0, 1],
        difficulty: 3,
        weight: 10,
        offset: 300,
        description: 'Левые полосы со смещением (сложный маневр)'
      },
      {
        name: 'double-right-offset',
        lanes: [1, 2],
        difficulty: 3,
        weight: 10,
        offset: 300,
        description: 'Правые полосы со смещением (сложный маневр)'
      },
      {
        name: 'double-sides-offset',
        lanes: [0, 2],
        difficulty: 3,
        weight: 10,
        offset: 250,
        description: 'Боковые полосы со смещением (требует точности)'
      }
    ];
  }

  selectPattern(currentDifficulty: number = 1.0): ObstaclePattern {
    let maxDifficulty: 1 | 2 | 3;
    if (currentDifficulty < 1.5) {
      maxDifficulty = 1;
    } else if (currentDifficulty < 2.5) {
      maxDifficulty = 2;
    } else {
      maxDifficulty = 3;
    }

    let availablePatterns = this.patterns.filter(
      pattern => pattern.difficulty <= maxDifficulty
    );

    if (this.recentPatterns.length > 0) {
      availablePatterns = availablePatterns.filter(
        pattern => !this.recentPatterns.includes(pattern.name)
      );
    }

    if (availablePatterns.length === 0) {
      this.recentPatterns = [];
      availablePatterns = this.patterns.filter(
        pattern => pattern.difficulty <= maxDifficulty
      );
    }

    const selected = this.weightedRandomSelect(availablePatterns);

    this.recentPatterns.push(selected.name);
    if (this.recentPatterns.length > this.maxRecentSize) {
      this.recentPatterns.shift();
    }

    return selected;
  }

  private weightedRandomSelect(patterns: ObstaclePattern[]): ObstaclePattern {
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const pattern of patterns) {
      random -= pattern.weight;
      if (random <= 0) {
        return pattern;
      }
    }

    return patterns[0];
  }

  getPatternByName(name: string): ObstaclePattern | null {
    return this.patterns.find(p => p.name === name) || null;
  }

  getPatternsByDifficulty(difficulty: 1 | 2 | 3): ObstaclePattern[] {
    return this.patterns.filter(p => p.difficulty === difficulty);
  }

  reset(): void {
    this.recentPatterns = [];
  }

  getStats(): PatternStats {
    const byDifficulty = {
      1: this.patterns.filter(p => p.difficulty === 1).length,
      2: this.patterns.filter(p => p.difficulty === 2).length,
      3: this.patterns.filter(p => p.difficulty === 3).length
    };

    return {
      totalPatterns: this.patterns.length,
      byDifficulty,
      recentPatterns: this.recentPatterns,
      totalWeight: this.patterns.reduce((sum, p) => sum + p.weight, 0)
    };
  }
}
