/**
 * Generic Result Patterns
 * Унифицированные паттерны для возврата результатов операций во всех модулях
 */

/**
 * Результат check/find операции
 * Используется для collision checks, find operations, targeting, etc.
 *
 * @template T - тип найденной сущности
 *
 * @example
 * function findTarget(targets: Target[]): CheckResult<Target> {
 *   const target = targets.find(t => t.isVisible());
 *   return { found: !!target, entity: target || null };
 * }
 */
export interface CheckResult<T> {
  found: boolean;
  entity: T | null;
}

/**
 * Результат операции с возможной ошибкой
 * Inspired by Rust's Result<T, E>
 * Используется для async operations, validation, API calls
 *
 * @template T - тип успешного результата
 * @template E - тип ошибки (по умолчанию Error)
 *
 * @example
 * async function loadAsset(path: string): Promise<OperationResult<Texture>> {
 *   try {
 *     const texture = await PIXI.Assets.load(path);
 *     return { success: true, data: texture };
 *   } catch (error) {
 *     return { success: false, error: error as Error };
 *   }
 * }
 */
export interface OperationResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Результат валидации
 * Используется для проверки конфигураций, user input, game state
 *
 * @template T - тип валидируемого объекта
 *
 * @example
 * function validateConfig(config: unknown): ValidationResult<GameConfig> {
 *   const errors: string[] = [];
 *   if (!config.targetCoins) errors.push('targetCoins is required');
 *   if (errors.length > 0) return { valid: false, errors };
 *   return { valid: true, errors: [], data: config as GameConfig };
 * }
 */
export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}
