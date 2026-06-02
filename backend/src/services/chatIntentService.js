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

const ORDER_TRACKING_TERMS = [
  'don hang',
  'ma don',
  'tracking',
  'theo doi don',
  'kiem tra don',
  'trang thai don',
  'van don',
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
  { terms: ['fresh', 'tuoi mat', 'mat me', 'sach se'], scent: 'fresh', scentGroup: 'fresh' },
  { terms: ['woody', 'go'], scent: 'woody', scentGroup: 'woody' },
  { terms: ['ngot', 'sweet', 'gourmand', 'keo'], scent: 'sweet', scentGroup: 'sweet' },
  { terms: ['hoa trang', 'floral', 'hoa co'], scent: 'floral', scentGroup: 'floral' },
  { terms: ['cay', 'spicy', 'gia vi'], scent: 'spicy', scentGroup: 'spicy' },
];

const PURPOSE_INTENTS = [
  { terms: ['di hoc', 'di lam', 'van phong', 'cong so'], purpose: 'work_school' },
  { terms: ['di choi', 'ca phe', 'hang ngay', 'daily'], purpose: 'casual' },
  { terms: ['di tiec', 'party', 'su kien'], purpose: 'party' },
  { terms: ['di date', 'hen ho', 'di hen', 'crush'], purpose: 'date' },
  { terms: ['tang qua', 'qua tang', 'sinh nhat', 'ky niem'], purpose: 'gift' },
];

const WEATHER_INTENTS = [
  { terms: ['troi nong', 'thoi tiet nong', 'mua he', 'he', 'nong'], weather: 'hot' },
  { terms: ['troi lanh', 'thoi tiet lanh', 'mua dong', 'dong', 'lanh'], weather: 'cold' },
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

export function parsePurposeIntent(question) {
  const text = normalizeVietnameseText(question);
  const match = PURPOSE_INTENTS.find((entry) => entry.terms.some((term) => includesPhrase(text, term)));
  return match?.purpose || null;
}

export function parseWeatherIntent(question) {
  const text = normalizeVietnameseText(question);
  const match = WEATHER_INTENTS.find((entry) => entry.terms.some((term) => includesPhrase(text, term)));
  return match?.weather || null;
}

export function parseStockIntent(question) {
  const text = normalizeVietnameseText(question);
  return /\b(con hang|san co|dang con|available|stock|ton kho)\b/.test(text) && !/\b(het hang|out of stock)\b/.test(text);
}

function parseOrderCodeIntent(question) {
  const raw = String(question || '').trim();
  const match = raw.match(/\b(?:HP|DH|ORD)[-_]?[A-Z0-9]{4,}\b/i) || raw.match(/\b\d{5,}\b/);
  return match ? match[0] : null;
}

function splitCompareTerms(question) {
  let text = normalizeVietnameseText(question);
  text = text
    .replace(/\b(so sanh|compare|nen chon|chon|khac nhau|giua|nuoc hoa|san pham|chai|mui)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = text
    .split(/\s+(?:voi|va|hay|vs|versus)\s+/g)
    .map((part) => part.replace(/\b(loai nao|chai nao|tot hon|hop hon|hon|nen mua|mua)\b/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((part) => part.length >= 2);

  return [...new Set(parts)].slice(0, 3);
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
    'ra sao', 'nhu the nao', 'the nao', 'nay', 'nhung mui nao', 'mui nao',
    'nam', 'dan ong', 'male', 'men', 'nu', 'female', 'women', 'unisex',
    'duoi', 'tren', 'tu', 'den', 'toi', 'khoang', 'tam', 'vnd', 'dong',
    'fullbox', 'full box', 'full', 'decant', 'chiet',
    'di hoc', 'di lam', 'di choi', 'di tiec', 'di date', 'hen ho', 'tang qua', 'qua tang',
    'troi nong', 'troi lanh', 'mua he', 'mua dong', 'cong so', 'van phong',
    'con hang', 'ton kho', 'stock', 'so sanh', 'compare', 'voi', 'hay',
    ...SCENT_INTENTS.flatMap((entry) => entry.terms),
    ...PURPOSE_INTENTS.flatMap((entry) => entry.terms),
    ...WEATHER_INTENTS.flatMap((entry) => entry.terms),
    ...(brandEntry?.terms || []),
  ];

  removablePhrases.sort((a, b) => b.length - a.length).forEach((phrase) => {
    text = removePhrase(text, phrase);
  });

  text = text
    .replace(/\b\d+(?:[.,]\d+)*\s*(?:trieu|tr|k|nghin|ngan|vnd|dong|d|ml)?\b/g, ' ')
    .replace(/\b(co|con|nhung|gi|khong|loai|hang|cua|voi|va|cho|minh|toi|can|mot|the|nao)\b/g, ' ')
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
  const purpose = parsePurposeIntent(originalQuestion);
  const weather = parseWeatherIntent(originalQuestion);
  const inStockOnly = parseStockIntent(originalQuestion);
  const productName = parseProductNameIntent(originalQuestion);
  const isOrderTracking = ORDER_TRACKING_TERMS.some((term) => includesPhrase(normalized, term));
  const isPolicy = POLICY_TERMS.some((term) => includesPhrase(normalized, term));
  const isCompare = /\b(so sanh|compare|khac nhau|nen chon|chon.*hay|vs|versus)\b/.test(normalized);
  const isDecant = /\b(decant|chiet|mini size|dung thu|sample)\b/.test(normalized);
  const asksPrice = /\b(gia|bao nhieu tien|duoi|tren|tam|khoang|ngan sach|budget)\b/.test(normalized)
    || price.minPrice !== null
    || price.maxPrice !== null;
  const asksStock = /\b(con hang|het hang|ton kho|stock|available)\b/.test(normalized);
  const hasFilters = [
    price.minPrice,
    price.maxPrice,
    gender,
    volume.volumeMl,
    volume.variantType,
    scent.scent,
    brand,
    purpose,
    weather,
    inStockOnly ? 'in_stock' : null,
    productName,
  ].some((value) => value !== null);
  const detailQuestion = /\b(chi tiet|thong tin|ra sao|the nao|mui gi|huong lieu gi|huong gi|huong dau|huong giua|huong cuoi|bao nhieu ml|phu hop)\b/.test(normalized);
  const refersToCurrentProduct = /\b(chai|nuoc hoa|san pham)?\s*nay\b/.test(normalized);
  const asksForDetail = detailQuestion && Boolean(productName || brand || refersToCurrentProduct);
  const hasProductLanguage = /\b(nuoc hoa|san pham|goi y|tu van|tim|mua|mui huong|recommend)\b/.test(normalized);

  let intent = 'unknown';
  if (isOrderTracking) {
    intent = 'order_tracking';
  } else if (isDecant) {
    intent = 'decant_question';
  } else if (isCompare) {
    intent = 'compare_product';
  } else if (isPolicy && !hasFilters) {
    intent = 'policy_question';
  } else if (asksStock) {
    intent = 'stock_question';
  } else if (asksPrice) {
    intent = 'price_question';
  } else if (asksForDetail) {
    intent = 'product_detail';
  } else if (hasFilters || hasProductLanguage) {
    intent = 'recommend_product';
  }

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
      purpose,
      weather,
      inStockOnly,
    },
    compareProducts: isCompare ? splitCompareTerms(originalQuestion) : [],
    orderCode: isOrderTracking ? parseOrderCodeIntent(originalQuestion) : null,
    isDefinitionQuestion: /\b(la gi|nghia la gi|la sao|giai thich)\b/.test(normalized),
    productName,
    originalQuestion,
  };
}
