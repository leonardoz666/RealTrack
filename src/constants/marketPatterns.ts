export const STATUS_WITH_RETURNS = ['Ganha', 'Meio Ganha', 'Cashout'];

export const MARKET_LABEL_PATTERN = /^(aposta|odd|retorno|retornos?\spotenciais?|valor|stake|cotação|apostas?)[:]?/i;
export const MARKET_CONNECTOR_PATTERN = /^(?:o|e|ou)\s+/i;

export const MARKET_STAT_KEYWORDS = [
  'ponto',
  'pontos',
  'rebote',
  'rebotes',
  'assistencia',
  'assistencias',
  'assist',
  'gol',
  'gols',
  'escanteio',
  'escanteios',
  'cartao',
  'cartoes',
  'cartao amarelo',
  'cartao vermelho',
  'faltas',
  'finalizacao',
  'finalizacoes',
  'finalizacao no alvo',
  'finalizacoes no alvo',
  'arremesso',
  'arremessos',
  'chutes',
  'triplos',
  'duplos',
  'p+r',
  'p+a',
  'r+a',
  'rebotes+pontos',
  'rebotes+assistencias',
  'pontos+assistencias',
  'pontos+rebotes',
  'rebotes+assist',
  'pontos+rebotes+assistencias',
  'passes',
  'tackles',
  'defesas',
  'interceptacoes',
  'steals',
  'roubos',
  'bloqueios',
  'aces',
  'games',
  'sets',
  'breaks',
  'quebras'
];

export const normalizeMarketKeyword = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+&\s]/g, '')
    .trim()
    .toLowerCase();

export const containsStatKeyword = (value: string): boolean => {
  const normalized = normalizeMarketKeyword(value);
  return MARKET_STAT_KEYWORDS.some((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(normalized);
  });
};
