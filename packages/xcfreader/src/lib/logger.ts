// Simple logger utility to replace console usage
export class Logger {
  static info(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.info(...args);
  }
  static warn(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
  static error(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
  static log(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(...args, "fred");
  }
}
