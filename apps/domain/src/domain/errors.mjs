export class DomainError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.name = "DomainError";
    this.status = status;
  }
}
