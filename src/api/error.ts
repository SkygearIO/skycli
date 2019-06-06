export enum ErrorName {
  NotFound = 'NotFound'
}

export class NotFoundError extends Error {
  public name: ErrorName;

  constructor(message?: string) {
    super(message);
    this.name = ErrorName.NotFound;
  }
}
