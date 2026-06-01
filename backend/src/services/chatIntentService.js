const POLICY_TERMS = [
  'giao hang',
  'van chuyen',
  'ship',
  'doi tra',
  'hoan tien',
  'bao hanh',
  'chinh hang',
  'authentic',
  'lien he',
  'hotline',
  'thanh toan',
];

const SCENT_INTENTS = [
  { terms: ['go dan huong', 'sandalwood'], scent: 'sandalwood', scentGroup: 'woody' },
  { terms: ['cam bergamot', 'bergamot'], scent: 'bergamot', scentGroup: 'citrus' },
  { terms: ['hoa nhai', 'jasmine'], scent: 'jasmine', scentGroup: 'floral' },
  { terms: ['tuyet tung', 'cedar'], scent: 'cedar', scentGroup: 'woody' },
  { terms: ['tram huong', 'oud'], scent: 'oud', scentGroup: 'woody' },
  { terms: ['xa huong', 'musk'], scent: 'musk', scentGroup: 'musk' },
  { terms: ['hoa hong', 'rose'], scent: 'rose', scentGroup: 'floral' },
  { terms: ['ho phach', 'amber'], scent: 'amber', scentGroup: 'amber' },
  { terms: ['da thuoc', 'leather'], scent: 'leather', scentGroup: 'leather' },
  { terms: ['thuoc la', 'tobacco'], scent: 'tobacco', scentGroup: 'leather' },
  { terms: ['aquatic', 'bien', 'marine'], scent: 'aquatic', scentGroup: 'fresh' },
  { terms: ['vanilla', 'vani'], scent: 'vanilla', scentGroup: 'amber' },
  { terms: ['citrus', 'cam', 'chanh', 'buoi'], scent: 'citrus', scentGroup: 'citrus' },
  { terms: ['fresh'], scent: 'fresh', scentGroup: 'fresh' },
  { terms: ['woody', 'go'], scent: 'woody', scentGroup: 'woody' },
];

const KNOWN_BRANDS = [
  { terms: ['maison margiela'], brand: 'Maison Margiela' },
  { terms: ['mont blanc', 'montblanc'], brand: 'Mont Blanc' },
  { terms: ['tom ford'], brand: 'Tom Ford' },
  { terms: ['lancome'], brand: 'Lancome' },
  { terms: ['versace'], brand: 'Versace' },
  { terms: ['dior'], brand: 'Dior' },
  { terms: ['ysl', 'yves saint laurent'], brand: 'YSL' },
  { terms: ['calvin klein', 'ck'], brand: 'CK' },
  { terms: ['chanel'], brand: 'Chanel' },
  { terms: ['gucci'], brand: 'Gucci' },
  { terms: ['creed'], brand: 'Creed' },
];

function includesPhrase(text, phrase) {
  return new RegExp(`(?:^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`).test(text);
}

export function normalizeVietnameseText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[₫]/g, 'd')
    .replace(/[^a-z0-9.,\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMoneyValue(numberText, rawUnit) {
  const unit = String(rawUnit || '').trim();
  const compact = String(numberText || '').replace(/\s/g, '');
  if (!compact) return null;

  if (unit === 'tr' || unit === 'trieu') {
    const decimal = compact.match(/^(\d+)[,.](\d{1,2})$/)
      ? Number(compact.replace(',', '.'))
      : Number(compact.replace(/[.,]/g, ''));
    return Number.isFinite(decimal) ? Math.round(decimal * 1000000) : null;
  }

  if (unit === 'k' || unit === 'nghin' || unit === 'ngan') {
    const decimal = Number(compact.replace(',', '.'));
    return Number.isFinite(decimal) ? Math.round(decimal * 1000) : null;
  }

  const value = Number(compact.replace(/[.,]/g, ''));
  return Number.isFinite(value) ? Math.round(value) : null;
}

const AMOUNT_PATTERN = '(\\d+(?:[.,]\\d+)*)\\s*(trieu|tr|k|nghin|ngan|vnd|dong|d)?';

export function parsePriceIntent(question) {
  const text = normalizeVietnameseText(question);
  const result = { minPrice: null, maxPrice: null };
  const range = text.match(new RegExp(`(?:tu\\s+)?${AMOUNT_PATTERN}\\s*(?:den|toi|-)\\s*${AMOUNT_PATTERN}`));

  if (range) {
    const first = parseMoneyValue(range[1], range[2]);
    const second = parseMoneyValue(range[3], range[4]);
    if (first !== null && second !== null) {
      result.minPrice = Math.min(first, second);
      result.maxPrice = Math.max(first, second);
      return result;
    }
  }

  const maximum = text.match(new RegExp(`(?:duoi|toi da|khong qua|nho hon)\\s*${AMOUNT_PATTERN}`));
  if (maximum) {
    result.maxPrice = parseMoneyValue(maximum[1], maximum[2]);
    return result;
  }

  const minimum = text.match(new RegExp(`(?:tren|toi thieu|it nhat|tu)\\s*${AMOUNT_PATTERN}`));
  if (minimum) {
    result.minPrice = parseMoneyValue(minimum[1], minimum[2]);
    return result;
  }

  const approximate = text.match(new RegExp(`(?:khoang|tam)\\s*${AMOUNT_PATTERN}`));
  if (approximate) {
    const value = parseMoneyValue(approximate[1], approximate[2]);
    if (value !== null) {
      result.minPrice = Math.round(value * 0.8);
      result.maxPrice = Math.round(value * 1.2);
    }
  }

  return result;
}

export function parseGenderIntent(question) {
  const text = normalizeVietnameseText(question);
  if (/\b(nam hay nu|nam hoac nu|men hay women|male hay female)\b/.test(text)) return null;
  if (includesPhrase(text, 'unisex')) return 'unisex';
  if (/\b(nu|female|women)\b/.test(text)) return 'women';
  if (/\b(nam|dan ong|male|men)\b/.test(text)) return 'men';
  return null;
}

export function parseVolumeIntent(question) {
  const text = normalizeVietnameseText(question);
  const volume = text.match(/\b(\d{1,4})\s*ml\b/);
  const variantType = /\b(decant|chiet)\b/.test(text)
    ? 'decant'
    : /\b(fullbox|full box|full)\b/.test(text)
      ? 'fullbox'
      : null;

  return {
    volumeMl: volume ? Number(volume[1]) : null,
    variantType,
  };
}

export function parseScentIntent(question) {
  const text = normalizeVietnameseText(question);
  const match = SCENT_INTENTS.find((entry) => entry.terms.some((term) => includesPhrase(text, term)));
  return match ? { scent: match.scent, scentGroup: match.scentGroup } : { scent: null, scentGroup: null };
}

export function parseBrandIntent(question) {
  const text = normalizeVietnameseText(question);
  const match = KNOWN_BRANDS.find((entry) => entry.terms.some((term) => includesPhrase(text, term)));
  return match?.brand || null;
}

function removePhrase(text, phrase) {
  return text.replace(new RegExp(`(?:^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'g'), ' ');
}

export function parseProductNameIntent(question) {
  let text = normalizeVietnameseText(question);
  const brandEntry = KNOWN_BRANDS.find((entry) => entry.terms.some((term) => includesPhrase(text, term)));
  const productContext = /\b(nuoc hoa|san pham|chai|mau|mui|chi tiet|thong tin|gia cua|tim|muon mua)\b/.test(text);
  if (!brandEntry && !productContext) return null;

  const removablePhrases = [
    ...POLICY_TERMS,
    'nuoc hoa', 'san pham', 'chai', 'mau', 'mui', 'chi tiet', 'thong tin',
    'gia cua', 'gia', 'tim', 'kiem', 'goi y', 'tu van', 'muon mua', 'muon', 'cho toi', 'giup toi',
    'co huong lieu gi', 'huong lieu gi', 'co huong gi', 'huong gi', 'huong', 'mui ra sao', 'phu hop nam hay nu', 'phu hop',
    'con hang khong', 'con hang', 'bao nhieu ml', 'huong dau', 'huong giua', 'huong cuoi',
    'ra sao', 'nhu the nao', 'the nao', 'nay',
    'nam', 'dan ong', 'male', 'men', 'nu', 'female', 'women', 'unisex',
    'duoi', 'tren', 'tu', 'den', 'toi', 'khoang', 'tam', 'vnd', 'dong',
    'fullbox', 'full box', 'full', 'decant', 'chiet',
    ...SCENT_INTENTS.flatMap((entry) => entry.terms),
    ...(brandEntry?.terms || []),
  ];

  removablePhrases.sort((a, b) => b.length - a.length).forEach((phrase) => {
    text = removePhrase(text, phrase);
  });

  text = text
    .replace(/\b\d+(?:[.,]\d+)*\s*(?:trieu|tr|k|nghin|ngan|vnd|dong|d|ml)?\b/g, ' ')
    .replace(/\b(co|gi|khong|loai|hang|cua|voi|va|cho|minh|toi|can|mot|the|nao)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length >= 2 ? text : null;
}

export function parseChatIntent(question) {
  const originalQuestion = String(question || '').trim();
  const normalized = normalizeVietnameseText(originalQuestion);
  const price = parsePriceIntent(originalQuestion);
  const gender = parseGenderIntent(originalQuestion);
  const volume = parseVolumeIntent(originalQuestion);
  const scent = parseScentIntent(originalQuestion);
  const brand = parseBrandIntent(originalQuestion);
  const productName = parseProductNameIntent(originalQuestion);
  const isPolicy = POLICY_TERMS.some((term) => includesPhrase(normalized, term));
  const hasFilters = [
    price.minPrice,
    price.maxPrice,
    gender,
    volume.volumeMl,
    volume.variantType,
    scent.scent,
    brand,
    productName,
  ].some((value) => value !== null);
  const detailQuestion = /\b(chi tiet|thong tin|gia cua|con hang|ra sao|the nao|mui gi|huong lieu gi|huong gi|huong dau|huong giua|huong cuoi|bao nhieu ml|phu hop)\b/.test(normalized);
  const refersToCurrentProduct = /\b(chai|nuoc hoa|san pham)?\s*nay\b/.test(normalized);
  const asksForDetail = detailQuestion && Boolean(productName || brand || refersToCurrentProduct);
  const hasProductLanguage = /\b(nuoc hoa|san pham|goi y|tu van|tim|mua|mui huong)\b/.test(normalized);

  const intent = isPolicy && !hasFilters
    ? 'policy'
    : asksForDetail
      ? 'product_detail'
      : hasFilters || hasProductLanguage
        ? 'search_products'
        : 'unknown';

  return {
    intent,
    filters: {
      minPrice: price.minPrice,
      maxPrice: price.maxPrice,
      gender,
      volumeMl: volume.volumeMl,
      scent: scent.scent,
      scentGroup: scent.scentGroup,
      brand,
      search: productName,
      variantType: volume.variantType,
    },
    productName,
    originalQuestion,
  };
}
