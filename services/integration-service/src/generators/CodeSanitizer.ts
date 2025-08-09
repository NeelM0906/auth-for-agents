export class CodeSanitizer {
  static sanitizeConfigValue(value: string): string {
    return value
      .replace(/[<>]/g, '')
      .replace(/["']/g, '\\"')
      .slice(0, 1000);
  }
}
