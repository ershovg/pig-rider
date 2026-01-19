import { Lane } from './common';

export interface ObstaclePattern {
  name: string;
  lanes: Lane[];
  difficulty: 1 | 2 | 3;
  weight: number;
  description: string;
  offset?: number;
}

export interface PatternStats {
  totalPatterns: number;
  byDifficulty: {
    1: number;
    2: number;
    3: number;
  };
  recentPatterns: string[];
  totalWeight: number;
}
