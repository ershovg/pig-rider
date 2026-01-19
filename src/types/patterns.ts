export interface CheckResult<T> {
  found: boolean;
  entity: T | null;
}

export interface OperationResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}
