/**
 * Базовый абстрактный класс для музыкальных состояний
 *
 * Следует Open/Closed Principle: открыт для расширения, закрыт для модификации.
 * Все состояния наследуют этот класс и переопределяют методы.
 */
export class BaseMusicState {
  /**
   * @param {string} name - Имя состояния (gameplay, booster, victory, etc.)
   * @param {Map} sounds - Ссылка на Map со всеми звуками
   * @param {object} config - Конфигурация состояния
   */
  constructor(name, sounds, config = {}) {
    this.name = name;
    this.sounds = sounds;
    this.config = config;
    this.isActive = false;

    console.log(`🎵 [${this.name}] State created`);
  }

  /**
   * Активирует состояние
   * @param {object} context - Контекст активации (например, текущая позиция трека)
   * @returns {Promise<void>}
   */
  async enter(context = {}) {
    this.isActive = true;
    console.log(`▶️ [${this.name}] State entered`, context);
  }

  /**
   * Деактивирует состояние
   * @param {object} context - Контекст деактивации
   * @returns {Promise<void>}
   */
  async exit(context = {}) {
    this.isActive = false;
    console.log(`⏹️ [${this.name}] State exited`, context);
  }

  /**
   * Обновление состояния (если нужно)
   * @param {number} deltaTime - Время с последнего кадра
   */
  update(deltaTime) {
    // Переопределяется в дочерних классах при необходимости
  }

  /**
   * Пауза музыки в текущем состоянии
   */
  pause() {
    console.log(`⏸️ [${this.name}] Paused`);
  }

  /**
   * Возобновление музыки в текущем состоянии
   */
  resume() {
    console.log(`▶️ [${this.name}] Resumed`);
  }

  /**
   * Получить трек по alias
   * @param {string} alias
   * @returns {Howl|null}
   */
  getTrack(alias) {
    const track = this.sounds.get(alias);
    if (!track) {
      console.warn(`⚠️ [${this.name}] Track not found: ${alias}`);
    }
    return track || null;
  }

  /**
   * Получить текущее состояние для отладки
   */
  getDebugInfo() {
    return {
      name: this.name,
      isActive: this.isActive,
      config: this.config,
    };
  }
}
