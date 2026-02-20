/**
 * Shared parsing utilities used across services and controllers.
 */

/** Parse an unknown value to boolean. Returns undefined when the value is absent. */
export function parseBool(value: unknown): boolean | undefined {
  if (value == null || String(value).trim() === '') return undefined;
  return (
    value === true ||
    value === 1 ||
    String(value).toLowerCase() === 'true' ||
    String(value) === '1'
  );
}

/** Parse an unknown value to a finite number, or undefined. */
export function parseId(value: unknown): number | undefined {
  if (value == null || String(value).trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse a numeric limit with sane defaults and bounds. */
export function parseLimit(value: unknown, defaultLimit = 50, maxLimit = 200): number {
  if (value == null || String(value).trim() === '') return defaultLimit;
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultLimit;
  return Math.min(Math.max(1, n), maxLimit);
}
