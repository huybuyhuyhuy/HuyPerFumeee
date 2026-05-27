import { errorResponse, successResponse } from '../utils/response.js';
import { getProductById, getProductsPaged, searchProducts } from '../models/productModel.js';
import { normalizeVietnameseText, parseChatIntent } from '../services/chatIntentService.js';

function cleanText(value) {
  return String(value || '').trim();
}

function toPrice(product) {
  return product.effectivePrice ?? (product.discountPrice > 0 ? product.discountPrice : product.price);
}

function selectDisplayProductOption(product, filters = {}) {
  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  const hasMinPrice = filters.minPrice !== null && filters.minPrice !== undefined && Number.isFinite(minPrice);
  const hasMaxPrice = filters.maxPrice !== null && filters.maxPrice !== undefined && Number.isFinite(maxPrice);
  if ((!hasMinPrice && !hasMaxPrice) || !Array.isArray(product.variants) || !product.variants.length) {
    return product;
  }

  const matchingVariants = product.variants
    .filter((variant) => {
      const price = toPrice(variant);
      if (!variant.isAvailable || !Number.isFinite(price)) return false;
      return (!hasMinPrice || price >= minPrice) && (!hasMaxPrice || price <= maxPrice);
    })
    .sort((left, right) => toPrice(left) - toPrice(right));

  if (!matchingVariants.length) return product;
  const selectedVariant = matchingVariants[0];
  return {
    ...product,
    price: selectedVariant.price,
    originalPrice: selectedVariant.originalPrice,
    discountPrice: selectedVariant.discountPrice,
    effectivePrice: selectedVariant.effectivePrice,
    volumeMl: selectedVariant.volumeMl ?? product.volumeMl,
    selectedVariant,
  };
}

function summarizeProduct(product, filters = {}) {
  const displayProduct = selectDisplayProductOption(product, filters);
  const effectivePrice = toPrice(displayProduct);
  return {
    id: displayProduct.id,
    name: displayProduct.name,
    brand: displayProduct.brand?.name || '',
    price: effectivePrice,
    priceOriginal: displayProduct.originalPrice ?? displayProduct.price,
    originalPrice: displayProduct.originalPrice ?? displayProduct.price,
    discountPrice: displayProduct.discountPrice ?? null,
    effectivePrice,
    volumeMl: displayProduct.volumeMl ?? null,
    gender: displayProduct.gender || null,
    scentGroup: displayProduct.scentGroup || '',
    scentNotes: displayProduct.scentNotes || '',
    topNotes: displayProduct.topNotes || '',
    middleNotes: displayProduct.middleNotes || '',
    baseNotes: displayProduct.baseNotes || '',
    description: displayProduct.description || '',
    image: displayProduct.image || '',
    detailUrl: `/products/${displayProduct.id}`,
    isInStock: Boolean(displayProduct.isInStock ?? displayProduct.stock > 0),
    stock: displayProduct.stock,
    category: displayProduct.category?.name || '',
    isDecant: displayProduct.isDecant,
    status: displayProduct.status,
    selectedVariant: displayProduct.selectedVariant || null,
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          id: variant.id,
          label: variant.label,
          volumeMl: variant.volumeMl ?? null,
          type: variant.type || '',
          effectivePrice: variant.effectivePrice ?? null,
          stock: variant.stock ?? variant.stockQuantity ?? 0,
          isAvailable: Boolean(variant.isAvailable),
        }))
      : [],
  };
}

function scoreProduct(query, product) {
  const q = normalizeVietnameseText(query);
  const name = normalizeVietnameseText(product.name);
  let score = 0;

  if (name.includes(q) || q.includes(name)) score += 5;
  for (const token of name.split(/\s+/).filter((t) => t.length >= 3)) {
    if (q.includes(token)) score += 2;
  }

  if (product.brand?.name && q.includes(normalizeVietnameseText(product.brand.name))) score += 2;
  if (product.category?.name && q.includes(normalizeVietnameseText(product.category.name))) score += 2;
  if (product.scentNotes && q.includes(normalizeVietnameseText(product.scentNotes))) score += 1;
  return score;
}

function compactFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== null && value !== ''));
}

async function buildProductCandidates(question, contextProductId = null) {
  const q = cleanText(question);
  const chatIntent = parseChatIntent(q);
  if (chatIntent.intent === 'policy') {
    return { chatIntent, products: [] };
  }

  if (chatIntent.intent === 'product_detail' && contextProductId && !chatIntent.productName && !chatIntent.filters.brand) {
    const contextualProduct = await getProductById(Number(contextProductId));
    return {
      chatIntent,
      products: contextualProduct ? [summarizeProduct(contextualProduct)] : [],
    };
  }

  const filters = compactFilters(chatIntent.filters);
  let products = [];
  if (chatIntent.intent === 'product_detail' && chatIntent.filters.brand && !chatIntent.productName) {
    const brandQuery = chatIntent.filters.brand;
    const brandMatches = await searchProducts(brandQuery, 20);
    const normalizedBrand = normalizeVietnameseText(brandQuery);
    const namedBrandMatches = brandMatches.filter((product) => (
      normalizeVietnameseText(product.name).includes(normalizedBrand)
    ));
    products = namedBrandMatches.length ? namedBrandMatches : brandMatches;
  } else if (Object.keys(filters).length > 0 || chatIntent.intent === 'search_products') {
    const pool = await getProductsPaged({ page: 1, size: 50, filters });
    products = pool.content || [];
  } else if (q) {
    products = await searchProducts(q, 20);
  }

  // Exact scent is preferred; group fallback handles aliases such as vani/vanilla.
  if (!products.length && filters.scent && filters.scentGroup) {
    const relaxedScentFilters = { ...filters };
    delete relaxedScentFilters.scent;
    const relaxedPool = await getProductsPaged({ page: 1, size: 50, filters: relaxedScentFilters });
    products = relaxedPool.content || [];
  }

  if (!products.length && chatIntent.productName) {
    const detailKeyword = [chatIntent.filters.brand, chatIntent.productName].filter(Boolean).join(' ');
    products = await searchProducts(detailKeyword || chatIntent.productName, 20);
  } else if (!products.length && chatIntent.intent === 'unknown' && q && Object.keys(filters).length === 0) {
    products = await searchProducts(q, 20);
  }

  products.sort((a, b) => scoreProduct(q, b) - scoreProduct(q, a));
  if (chatIntent.intent === 'product_detail') {
    const details = await Promise.all(
      products.slice(0, 3).map((product) => getProductById(Number(product.id))),
    );
    return {
      chatIntent,
      products: details.filter(Boolean).map(summarizeProduct),
    };
  }

  if (chatIntent.filters.minPrice !== null || chatIntent.filters.maxPrice !== null) {
    const details = await Promise.all(
      products.slice(0, 5).map((product) => getProductById(Number(product.id))),
    );
    return {
      chatIntent,
      products: details.filter(Boolean).map((product) => summarizeProduct(product, chatIntent.filters)),
    };
  }

  return {
    chatIntent,
    products: products.slice(0, 5).map(summarizeProduct),
  };
}

function buildPolicyAnswer(question) {
  const normalized = normalizeVietnameseText(question);
  if (/\b(giao hang|van chuyen|ship)\b/.test(normalized)) {
    return 'HuyPerfume hỗ trợ giao hàng toàn quốc. Thời gian giao cụ thể phụ thuộc khu vực và sẽ được xác nhận khi đặt hàng.';
  }
  if (/\b(doi tra|hoan tien|bao hanh)\b/.test(normalized)) {
    return 'Sản phẩm được hỗ trợ đổi trả khi lỗi do shop hoặc giao sai sản phẩm. Bạn vui lòng giữ nguyên tem, hộp và hóa đơn.';
  }
  if (/\b(chinh hang|authentic)\b/.test(normalized)) {
    return 'HuyPerfume cam kết cung cấp sản phẩm chính hãng với thông tin sản phẩm rõ ràng.';
  }
  return 'Bạn có thể liên hệ HuyPerfume qua hotline hoặc email hỗ trợ để được giải đáp nhanh nhất.';
}

function buildFallbackAnswer(question, products, chatIntent = null) {
  if (chatIntent?.intent === 'policy') {
    return {
      answer: buildPolicyAnswer(question),
      products: [],
    };
  }

  if (!products.length) {
    return {
      answer: 'Hiện tại shop chưa có sản phẩm phù hợp với yêu cầu này. Bạn có muốn mình gợi ý sản phẩm gần giống không?',
      products: [],
    };
  }

  return {
    answer: buildDatabaseAnswer(products, chatIntent),
    products,
  };
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatGender(value) {
  const normalized = cleanText(value).toUpperCase();
  if (normalized === 'MEN') return 'nam';
  if (normalized === 'WOMEN') return 'nữ';
  if (normalized === 'UNISEX') return 'unisex';
  return cleanText(value);
}

function buildProductDetailAnswer(question, product) {
  const normalized = normalizeVietnameseText(question);
  const name = cleanText(product.name);
  const notes = cleanText(product.scentNotes || product.scentGroup).replace(/\s*\|\s*/g, ' / ');
  const hasSeparatedNotes = Boolean(product.topNotes || product.middleNotes || product.baseNotes);
  const answers = [];
  const asksScent = /\b(huong|mui|note)\b/.test(normalized);
  const asksGender = /\b(phu hop|nam hay nu|gioi tinh)\b/.test(normalized);
  const asksStock = /\b(con hang|het hang|ton kho)\b/.test(normalized);
  const asksVolume = /\b(bao nhieu ml|dung tich|ml)\b/.test(normalized);

  if (asksScent) {
    if (hasSeparatedNotes) {
      const layers = [
        product.topNotes ? `Hương đầu: ${product.topNotes}` : '',
        product.middleNotes ? `Hương giữa: ${product.middleNotes}` : '',
        product.baseNotes ? `Hương cuối: ${product.baseNotes}` : '',
      ].filter(Boolean);
      answers.push(`${name}: ${layers.join('; ')}.`);
    } else if (notes) {
      answers.push(`${name}. Hiện dữ liệu shop đang có phần note hương tổng quát: ${notes}.`);
    } else {
      answers.push(`Hiện shop chưa có dữ liệu note hương cho ${name}.`);
    }
  }

  if (asksGender) {
    answers.push(product.gender
      ? `${name} được phân loại phù hợp cho ${formatGender(product.gender)}.`
      : `Hiện shop chưa có dữ liệu giới tính phù hợp cho ${name}.`);
  }

  if (asksStock) {
    answers.push(product.isInStock
      ? `${name} hiện còn hàng, tổng tồn kho khả dụng là ${product.stock} sản phẩm.`
      : `${name} hiện đã hết hàng.`);
  }

  if (asksVolume) {
    const volumeList = Array.isArray(product.variants)
      ? [...new Set(product.variants.map((variant) => variant.volumeMl).filter(Boolean))]
      : [];
    if (volumeList.length) {
      answers.push(`${name} hiện có các dung tích: ${volumeList.map((value) => `${value}ml`).join(', ')}.`);
    } else if (product.volumeMl) {
      answers.push(`${name} có dung tích ${product.volumeMl}ml.`);
    } else {
      answers.push(`Hiện shop chưa có dữ liệu dung tích cho ${name}.`);
    }
  }

  if (answers.length) return answers.join(' ');

  const detailParts = [
    product.brand ? `thương hiệu ${product.brand}` : '',
    product.gender ? `phù hợp cho ${formatGender(product.gender)}` : '',
    product.volumeMl ? `dung tích ${product.volumeMl}ml` : '',
  ].filter(Boolean);
  return detailParts.length
    ? `${name}: ${detailParts.join(', ')}.`
    : `Shop đã tìm thấy ${name}; bạn có thể xem card sản phẩm để mở trang chi tiết.`;
}

function buildDatabaseAnswer(products, chatIntent) {
  const { minPrice, maxPrice } = chatIntent?.filters || {};
  if (minPrice && maxPrice) {
    return `Shop tìm thấy các sản phẩm trong khoảng ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}:`;
  }
  if (maxPrice) {
    return `Shop tìm thấy các sản phẩm dưới ${formatPrice(maxPrice)}:`;
  }
  if (minPrice) {
    return `Shop tìm thấy các sản phẩm từ ${formatPrice(minPrice)}:`;
  }
  if (chatIntent?.productName) {
    return `Shop tìm thấy thông tin sản phẩm phù hợp với "${chatIntent.productName}":`;
  }
  return 'Shop tìm thấy các sản phẩm phù hợp với yêu cầu của bạn:';
}

function buildProductDetailResponse(question, products) {
  if (products.length > 1) {
    return 'Mình tìm thấy vài sản phẩm gần giống, bạn chọn chai muốn xem chi tiết nhé.';
  }
  return buildProductDetailAnswer(question, products[0]);
}

function createDatabasePayload(answer, products, chatIntent) {
  return {
    answer,
    products,
    intent: chatIntent.intent,
    filters: chatIntent.filters,
    provider: 'database',
  };
}

async function callDeepSeek(messages) {
  const apiKey = cleanText(process.env.DEEPSEEK_API_KEY);
  const baseUrl = cleanText(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com');
  if (!apiKey) throw new Error('Thiếu khóa API DeepSeek');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lỗi DeepSeek ${response.status}: ${text}`);
  }

  return response.json();
}

export async function productChat(req, res) {
  try {
    const question = cleanText(req.body?.q || req.body?.question);
    if (!question) return errorResponse(res, 400, 'Thiếu câu hỏi q');

    const contextProductId = Number(req.body?.productId || req.body?.contextProductId) || null;
    const { chatIntent, products } = await buildProductCandidates(question, contextProductId);
    const fallback = buildFallbackAnswer(question, products, chatIntent);

    if (!products.length) {
      return successResponse(res, 'Trả lời từ database thành công', createDatabasePayload(fallback.answer, [], chatIntent));
    }

    if (chatIntent.intent === 'product_detail') {
      return successResponse(
        res,
        'Tư vấn chi tiết sản phẩm từ database thành công',
        createDatabasePayload(buildProductDetailResponse(question, products), products, chatIntent),
      );
    }

    if (!cleanText(process.env.DEEPSEEK_API_KEY)) {
      return successResponse(
        res,
        'Tư vấn sản phẩm từ database thành công',
        createDatabasePayload(fallback.answer, products, chatIntent),
      );
    }

    const context = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      brand: p.brand,
      scentNotes: p.scentNotes,
      description: p.description,
      image: p.image,
      isDecant: p.isDecant,
      status: p.status,
    }));

    const messages = [
      {
        role: 'system',
        content:
          'Bạn là tư vấn viên nước hoa. Chỉ được dùng dữ liệu sản phẩm được cung cấp. Không bịa sản phẩm, không thêm sản phẩm ngoài danh sách. Nếu thiếu dữ liệu thì nói chưa có thông tin.',
      },
      {
        role: 'user',
        content: JSON.stringify({ question, intent: chatIntent, products: context }),
      },
    ];

    try {
      const data = await callDeepSeek(messages);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error('DeepSeek trả về câu trả lời trống');
      return successResponse(res, 'Tư vấn AI thành công', {
        ...createDatabasePayload(answer, products, chatIntent),
      });
    } catch (err) {
      console.error('[AI_PRODUCT_CHAT_FALLBACK]', err);
      return successResponse(
        res,
        'Tư vấn sản phẩm từ database thành công',
        createDatabasePayload(fallback.answer, products, chatIntent),
      );
    }
  } catch (error) {
    console.error('[AI_PRODUCT_CHAT_ERROR]', error);
    return errorResponse(res, 500, 'Lỗi chatbot sản phẩm: ' + error.message);
  }
}

export async function contentAI(req, res) {
  try {
    const topic = cleanText(req.body?.topic);
    const productIds = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    if (!topic) return errorResponse(res, 400, 'Thiếu topic');

    const products = [];
    for (const id of productIds.slice(0, 5)) {
      const product = await getProductById(Number(id));
      if (product) products.push(summarizeProduct(product));
    }

    const fallback = buildFallbackAnswer(topic, products);
    const messages = [
      {
        role: 'system',
        content:
          'Bạn là AI viết nội dung cho website nước hoa. Chỉ dùng dữ liệu được cung cấp. Không bịa thông tin về sản phẩm. Nếu thiếu dữ liệu, hãy nói ngắn gọn rằng chưa đủ thông tin.',
      },
      {
        role: 'user',
        content: JSON.stringify({ topic, products }),
      },
    ];

    try {
      const data = await callDeepSeek(messages);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error('DeepSeek trả về câu trả lời trống');
      return successResponse(res, 'Tạo nội dung AI thành công', {
        answer,
        products,
        provider: 'deepseek',
      });
    } catch (err) {
      console.error('[AI_CONTENT_FALLBACK]', err);
      return successResponse(res, 'Tạo nội dung AI thành công bằng fallback', {
        ...fallback,
        provider: 'fallback',
      });
    }
  } catch (error) {
    console.error('[AI_CONTENT_ERROR]', error);
    return errorResponse(res, 500, 'Lỗi AI content: ' + error.message);
  }
}
