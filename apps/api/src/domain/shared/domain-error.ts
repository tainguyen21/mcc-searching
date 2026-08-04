export class DomainError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode = 400,
    message = code,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
