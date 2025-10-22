/**
 * Beat Synchronization Engine
 *
 * Профессиональная система синхронизации переходов с ритмом музыки.
 * Используется для того, чтобы переходы происходили точно на бит (как в DJ миксах).
 */
export class BeatSyncEngine {
  /**
   * @param {number} bpm - Beats Per Minute (например, 130)
   * @param {number} beatsPerBar - Количество битов в такте (обычно 4)
   */
  constructor(bpm = 130, beatsPerBar = 4) {
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;

    // Рассчитываем длительности
    this.beatDuration = 60 / bpm; // Секунды на один бит
    this.barDuration = this.beatDuration * beatsPerBar; // Секунды на один такт

    console.log(`🎼 BeatSyncEngine initialized:`);
    console.log(`   BPM: ${bpm}, Beats per bar: ${beatsPerBar}`);
    console.log(`   Beat duration: ${this.beatDuration.toFixed(3)}s`);
    console.log(`   Bar duration: ${this.barDuration.toFixed(3)}s`);
  }

  /**
   * Вычисляет задержку до следующего бита
   * @param {number} currentPosition - Текущая позиция в треке (секунды)
   * @returns {number} - Задержка в миллисекундах
   */
  getDelayToNextBeat(currentPosition) {
    const positionInBar = currentPosition % this.barDuration;
    const currentBeat = Math.floor(positionInBar / this.beatDuration);
    const nextBeatTime = (currentBeat + 1) * this.beatDuration;
    const delay = (nextBeatTime - positionInBar) * 1000; // В миллисекунды

    console.log(`🎵 Current position: ${currentPosition.toFixed(2)}s`);
    console.log(`   Position in bar: ${positionInBar.toFixed(2)}s`);
    console.log(`   Current beat: ${currentBeat + 1}/${this.beatsPerBar}`);
    console.log(`   Delay to next beat: ${delay.toFixed(0)}ms`);

    return Math.max(0, delay);
  }

  /**
   * Вычисляет задержку до начала следующего такта (бара)
   * @param {number} currentPosition - Текущая позиция в треке (секунды)
   * @returns {number} - Задержка в миллисекундах
   */
  getDelayToNextBar(currentPosition) {
    const positionInBar = currentPosition % this.barDuration;
    const delay = (this.barDuration - positionInBar) * 1000;

    console.log(`🎵 Delay to next bar: ${delay.toFixed(0)}ms`);

    return Math.max(0, delay);
  }

  /**
   * Проверяет, находимся ли мы близко к биту (в пределах tolerance)
   * @param {number} currentPosition - Текущая позиция в треке (секунды)
   * @param {number} tolerance - Допуск в секундах (например, 0.05 = 50ms)
   * @returns {boolean}
   */
  isOnBeat(currentPosition, tolerance = 0.05) {
    const positionInBar = currentPosition % this.barDuration;
    const distanceToBeat = positionInBar % this.beatDuration;

    return distanceToBeat < tolerance || distanceToBeat > (this.beatDuration - tolerance);
  }

  /**
   * Обновляет BPM (если музыка меняется)
   * @param {number} newBpm
   */
  setBPM(newBpm) {
    this.bpm = newBpm;
    this.beatDuration = 60 / newBpm;
    this.barDuration = this.beatDuration * this.beatsPerBar;

    console.log(`🎼 BPM updated to ${newBpm}`);
  }
}
