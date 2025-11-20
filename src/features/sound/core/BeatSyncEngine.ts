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

    console.log(`🎼 BeatSyncEngine initialized:`);
    console.log(`   BPM: ${bpm}, Beats per bar: ${beatsPerBar}`);
    console.log(`   Beat duration: ${this.beatDuration.toFixed(3)}s`);
    console.log(`   Bar duration: ${this.barDuration.toFixed(3)}s`);
  }

  getDelayToNextBeat(currentPosition: number): number {
    const positionInBar = currentPosition % this.barDuration;
    const currentBeat = Math.floor(positionInBar / this.beatDuration);
    const nextBeatTime = (currentBeat + 1) * this.beatDuration;
    const delay = (nextBeatTime - positionInBar) * 1000;

    console.log(`🎵 Current position: ${currentPosition.toFixed(2)}s`);
    console.log(`   Position in bar: ${positionInBar.toFixed(2)}s`);
    console.log(`   Current beat: ${currentBeat + 1}/${this.beatsPerBar}`);
    console.log(`   Delay to next beat: ${delay.toFixed(0)}ms`);

    return Math.max(0, delay);
  }

  getDelayToNextBar(currentPosition: number): number {
    const positionInBar = currentPosition % this.barDuration;
    const delay = (this.barDuration - positionInBar) * 1000;

    console.log(`🎵 Delay to next bar: ${delay.toFixed(0)}ms`);

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

    console.log(`🎼 BPM updated to ${newBpm}`);
  }
}
