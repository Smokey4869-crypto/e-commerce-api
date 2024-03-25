export class CustomError extends Error {
  public statusCode: number;
  public code: string;
  public originalError?: string;

  constructor(code: string, statusCode: number, message: string, originalError?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}