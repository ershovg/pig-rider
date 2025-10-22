/**
 * EventBus - Система событий для коммуникации между PixiJS игрой и HTML интерфейсом.
 * Реализует паттерн издатель-подписчик для слабосвязанной архитектуры.
 * Позволяет разным модулям общаться друг с другом без прямых зависимостей.
 */

class EventBusClass {
  constructor() {
    this.events = new Map();
  }

  /**
   * Подписаться на событие.
   * Добавляет функцию-обработчик, которая будет вызвана при возникновении события.
   * Можно подписать несколько обработчиков на одно событие.
   * @param {string} event - Название события, например 'coin-collected'
   * @param {Function} callback - Функция-обработчик, которая будет вызвана с данными события
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  /**
   * Отписаться от события.
   * Удаляет конкретный обработчик из списка подписчиков события.
   * Если обработчик не найден или события не существует, ничего не происходит.
   * @param {string} event - Название события
   * @param {Function} callback - Функция-обработчик, которую нужно удалить
   */
  off(event, callback) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Отправить событие.
   * Вызывает все функции-обработчики, подписанные на это событие.
   * Если событие не имеет подписчиков, ничего не происходит.
   * @param {string} event - Название события
   * @param {*} data - Данные события, которые будут переданы всем обработчикам
   */
  emit(event, data) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    callbacks.forEach(callback => callback(data));
  }

  /**
   * Очистить все события.
   * Удаляет все подписки на все события. Используется при полной очистке игры.
   */
  clear() {
    this.events.clear();
  }
}

/**
 * Единственный экземпляр EventBus для всего приложения.
 * Паттерн Singleton гарантирует, что все модули работают с одной системой событий.
 */
export const EventBus = new EventBusClass();
