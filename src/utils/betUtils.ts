import { betStatusPillVariants } from '../constants/betStatusStyles';
import { normalizeMarketKeyword, containsStatKeyword } from '../constants/marketPatterns';

type StatusStyleKey = keyof typeof betStatusPillVariants;

export const resolveBetStatusClass = (status: string): string => {
  if (status in betStatusPillVariants) {
    return betStatusPillVariants[status as StatusStyleKey];
  }
  return betStatusPillVariants.default;
};

export const needsStatDescriptor = (segment: string): boolean => {
  if (!segment) {
    return false;
  }
  if (containsStatKeyword(segment)) {
    return false;
  }

  const normalized = normalizeMarketKeyword(segment);
  if (!normalized) {
    return false;
  }

  const raw = segment.trim();
  if (/\d+\s*\+$/.test(raw)) {
    return true;
  }
  if (/\b(?:mais|menos|over|under|abaixo|acima)\b/.test(normalized)) {
    return true;
  }
  if (/\b(?:mais|menos)\s+de\b/.test(normalized) && /\d/.test(normalized)) {
    return true;
  }
  return false;
};

export const isStatDescriptor = (segment: string): boolean => containsStatKeyword(segment);
