export function normalizeImageUrls(input?: string | string[]): string[] {
  if (!input) return [];
  const values = Array.isArray(input) ? input : [input];
  return values
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean);
}
