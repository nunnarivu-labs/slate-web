/** Convex permits at most 16 terms; normalization also detects empty punctuation. */
export function normalizeSearchQuery(value: string): string {
  return (value.normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? [])
    .slice(0, 16)
    .join(' ');
}
