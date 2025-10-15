import { CONFIG } from '../config/constants.js';

export class CullingCoordinator {
  constructor(cullingManager, spawnSystem) {
    this.cullingManager = cullingManager;
    this.spawnSystem = spawnSystem;

    // 🆕 Stats для Performance Monitor
    this.stats = {
      lastFrameCulled: 0,
      totalCulled: 0
    };
  }

  performCulling(frameCount) {
    // Сбрасываем счётчик для текущего frame
    this.stats.lastFrameCulled = 0;

    // 🔥 ИЗМЕНЕНИЕ: BaseSpawner уже делает culling для gameplay объектов!
    // Убираем дублирование - оставляем только декорации
    // this.cullGameplayObjects(); // ← УДАЛЕНО

    if (frameCount % CONFIG.CULLING.DECORATION_INTERVAL === 0) {
      this.cullDecorations();
    }
  }

  // 🔥 DEPRECATED: BaseSpawner.updateActiveObjects() уже делает culling
  // Оставляем метод для возможного будущего использования
  cullGameplayObjects() {
    // NOOP - culling теперь делается в BaseSpawner
    //
    // Причина удаления дублирования:
    // 1. BaseSpawner уже вызывает pool.release() в updateActiveObjects()
    // 2. Двойной culling создаёт гонку: CullingManager пытается release
    //    объекты, которые уже были released в BaseSpawner
    // 3. Результат: предупреждения double-release и некорректная статистика
  }

  // 🔥 DEPRECATED: BaseSpawner.updateActiveObjects() уже делает culling для декораций
  cullDecorations() {
    // NOOP - culling теперь делается в BaseSpawner для ВСЕХ типов объектов
    //
    // CloudSpawner и StarSpawner наследуют BaseSpawner,
    // который уже вызывает pool.release() в updateActiveObjects()
  }

  /**
   * Получить статистику culling для Performance Monitor
   */
  getStats() {
    return { ...this.stats };
  }
}
