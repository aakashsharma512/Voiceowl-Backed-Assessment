export function isValidString(value: any, minLength: number = 1, maxLength: number = 255): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

export function isValidId(id: string, maxLength: number = 255): boolean {
  return isValidString(id, 1, maxLength);
}

export function sanitizeMetadata(metadata: any): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') return {};
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

