export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return !isNaN(d.getTime());
}

export function getCurrentTimestamp(): Date {
  return new Date();
}

