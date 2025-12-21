import { MARKET_CONNECTOR_PATTERN, MARKET_LABEL_PATTERN, MARKET_STAT_KEYWORDS } from '../constants/marketPatterns';
import { betStatusPillVariants } from '../constants/betStatusStyles';

export const resolveBetStatusClass = (status: string): string => {
  return betStatusPillVariants[status as keyof typeof betStatusPillVariants] || betStatusPillVariants.default;
};

const needsStatDescriptor = (text: string): boolean => {
  return /[\d.,]+$/.test(text.trim());
};

const isStatDescriptor = (text: string): boolean => {
  const normalized = text.toLowerCase().trim();
  return MARKET_STAT_KEYWORDS.some((keyword) => normalized === keyword || normalized.startsWith(keyword));
};

export const extractMarketSelections = (market?: string | null): string[] => {
  if (typeof market !== 'string') {
    return [];
  }

  const normalized = market.trim();
  if (normalized === '' || normalized === 'N/D') {
    return [];
  }

  const fragments = normalized
    .replace(/\r/g, '\n')
    .replace(/R\$\s*[\d.,]+/gi, '\n')
    .replace(/Odd[s]?[^\n]*[\d.,]+/gi, '\n')
    .split(/\n+/)
    .flatMap((segment) => segment.split(/\s{2,}|[|]/))
    .map((segment) =>
      segment
        .replace(/R\$\s*[\d.,]+/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[^a-zA-ZÀ-ÿ0-9]+/, '')
        .replace(/^[\d\s.,:;()-]+/, '')
        .replace(MARKET_CONNECTOR_PATTERN, '')
        .trim()
    )
    .filter((segment) => segment.length > 0)
    .filter((segment) => {
      if (!/[a-zA-ZÀ-ÿ]/.test(segment)) {
        return false;
      }
      if (MARKET_LABEL_PATTERN.test(segment)) {
        return false;
      }
      if (/^[\d.,]+$/.test(segment.replace(',', '.'))) {
        return false;
      }
      return true;
    });

  const mergedFragments: string[] = [];
  for (let i = 0; i < fragments.length; i += 1) {
    const fragment = fragments[i];
    const next = fragments[i + 1];
    if (next && needsStatDescriptor(fragment) && isStatDescriptor(next)) {
      mergedFragments.push(`${fragment} ${next}`);
      i += 1;
      continue;
    }
    mergedFragments.push(fragment);
  }

  const deduped: string[] = [];
  for (const fragment of mergedFragments) {
    const normalizedFragment = fragment.toLowerCase();
    if (!deduped.some((existing) => existing.toLowerCase() === normalizedFragment)) {
      deduped.push(fragment);
    }
  }

  return deduped;
};
