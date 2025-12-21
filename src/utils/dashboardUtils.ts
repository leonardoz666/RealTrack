import { formatCurrency, formatPercent } from './formatters';
import { stripEsporteEmoji } from '../constants/esportes';

export const formatSignedPercent = (value: number): string => {
  const normalized = formatPercent(Math.abs(value));
  if (value > 0) return `+${normalized}`;
  if (value < 0) return `-${normalized}`;
  return normalized;
};

export const formatSignedCurrency = (value: number): string => {
  const normalized = formatCurrency(Math.abs(value));
  if (value > 0) return `+${normalized}`;
  if (value < 0) return `-${normalized}`;
  return normalized;
};

export const ESPORTE_EMOJI_REGEX = /\p{Extended_Pictographic}/u;

export const normalizeKey = (value: string) =>
  stripEsporteEmoji(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const SPORT_ICON_MAP: Record<string, string> = {
  basquetebol: '🏀', // Fixed from soccer ball
  'futebol americano': '🏈',
  basquete: '🏀',
  futebol: '⚽️',
  tenis: '🎾',
  volei: '🏐',
  corridas: '🏎️',
};

export const SPORT_NAME_MAP: Record<string, string> = {
  basquetebol: 'Basquete',
};

export const extractEmoji = (value?: string) => {
  if (!value) return null;
  const match = ESPORTE_EMOJI_REGEX.exec(value);
  return match ? match[0] : null;
};

export const getSportIcon = (name?: string) => {
  if (!name) return '🏅';
  const emoji = extractEmoji(name);
  if (emoji) return emoji;
  const key = normalizeKey(name);
  return SPORT_ICON_MAP[key] ?? '🏅';
};

export const getSportDisplayName = (name?: string) => {
  if (!name) return undefined;
  const baseName = stripEsporteEmoji(name);
  const key = normalizeKey(baseName);
  return SPORT_NAME_MAP[key] ?? baseName;
};
