/**
 * ============================================================================
 * LEARNING NOTE: DOMAIN EXCEPTIONS (HEXAGONAL ARCHITECTURE)
 * ============================================================================
 * Domain exceptions represent violations of core business rules. They are
 * completely decoupled from HTTP status codes (like 400, 404, 409).
 * The presentation layer (controllers/filters) translates these into HTTP responses.
 */

export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, identifier: string | number) {
    super(`${entity} with identifier "${identifier}" was not found.`);
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists.`);
  }
}

export class KycRequiredException extends DomainException {
  constructor(message = 'Account creation requires a valid and verified BVN or NIN onboarding record.') {
    super(message);
  }
}

export class SingleAccountViolationException extends DomainException {
  constructor() {
    super('Customer is only permitted to own a maximum of one (1) bank account.');
  }
}

export class InsufficientBalanceException extends DomainException {
  constructor(currentBalance: number, requestedAmount: number) {
    super(`Insufficient funds. Available balance: ₦${currentBalance}, Requested: ₦${requestedAmount}.`);
  }
}

export class InvalidAccountException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedAccountAccessException extends DomainException {
  constructor() {
    super('Access denied: You are not authorized to view or operate on another customer\'s account or transactions.');
  }
}
