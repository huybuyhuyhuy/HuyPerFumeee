export function parseLocalizedNumber(value) {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'number') return value;

  const raw = String(value).trim();
  if (!raw) return raw;

  const normalized = raw
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '');

  if (!normalized || normalized === '-' || normalized === '.' || normalized === ',') return raw;

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    const compact = normalized
      .split(thousandsSeparator)
      .join('')
      .replace(decimalSeparator, '.');

    return Number(compact);
  }

  if (hasDot) {
    const parts = normalized.split('.');
    const usesDotThousands = parts.length > 1 && parts.slice(1).every((part) => part.length === 3);
    return Number(usesDotThousands ? parts.join('') : normalized);
  }

  if (hasComma) {
    const parts = normalized.split(',');
    const usesCommaThousands = parts.length > 1 && parts.slice(1).every((part) => part.length === 3);
    return Number(usesCommaThousands ? parts.join('') : normalized.replace(',', '.'));
  }

  return Number(normalized);
}
