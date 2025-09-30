import { UserError, ValidationError, UpstreamError } from "../agent/schemas";

export class NLQError extends Error {
  constructor(
    message: string,
    public type: "UserError" | "ValidationError" | "UpstreamError",
    public details?: any
  ) {
    super(message);
    this.name = "NLQError";
  }
}

export function createUserError(message: string, isNonFootballQuery = false): UserError {
  return {
    type: "UserError",
    message,
    isNonFootballQuery,
  };
}

export function createValidationError(
  message: string,
  validationErrors: string[],
  plan: any,
  compiledQuery: string
): ValidationError {
  return {
    type: "ValidationError",
    message,
    validationErrors,
    plan,
    compiledQuery,
  };
}

export function createUpstreamError(message: string, details?: string): UpstreamError {
  return {
    type: "UpstreamError",
    message,
    details,
  };
}
