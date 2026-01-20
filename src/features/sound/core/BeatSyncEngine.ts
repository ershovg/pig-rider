export class BeatSyncEngine {
  private bpm: number;
  private beatsPerBar: number;
  private beatDuration: number;
  private barDuration: number;

  constructor(bpm: number = 130, beatsPerBar: number = 4) {
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;

    this.beatDuration = 60 / bpm;
    this.barDuration = this.beatDuration * beatsPerBar;
  }

  getDelayToNextBeat(currentPosition: number): number {
    const positionInBar = currentPosition % this.barDuration;
    const currentBeat = Math.floor(positionInBar / this.beatDuration);
    const nextBeatTime = (currentBeat + 1) * this.beatDuration;
    const delay = (nextBeatTime - positionInBar) * 1000;

    return Math.max(0, delay);
  }

  getDelayToNextBar(currentPosition: number): number {
    const positionInBar = currentPosition % this.barDuration;
    const delay = (this.barDuration - positionInBar) * 1000;

    return Math.max(0, delay);
  }

  isOnBeat(currentPosition: number, tolerance: number = 0.05): boolean {
    const positionInBar = currentPosition % this.barDuration;
    const distanceToBeat = positionInBar % this.beatDuration;

    return distanceToBeat < tolerance || distanceToBeat > (this.beatDuration - tolerance);
  }

  setBPM(newBpm: number): void {
    this.bpm = newBpm;
    this.beatDuration = 60 / newBpm;
    this.barDuration = this.beatDuration * this.beatsPerBar;
  }
}
