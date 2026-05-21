import { errorResponse, successResponse } from '../utils/response.js';
import { getProductById, getProductsPaged, searchProducts } from '../models/productModel.js';

function cleanText(value) {
  return String(value || '').trim();
}

function toPrice(product) {
  return product.discountPrice > 0 ? product.discountPrice : product.price;
}

function summarizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: toPrice(product),
    priceOriginal: product.price,
    discountPrice: product.discountPrice,
    stock: product.stock,
    image: product.image,
    category: product.category?.name || '',
    brand: product.brand?.name || '',
    scentNotes: product.scentNotes || '',
    description: product.description || '',
    isDecant: product.isDecant,
    status: product.status,
  };
}

function extractBudget(query) {
  const normalized = cleanText(query).toLowerCase();
  const match = normalized.match(/(\d+[\d.]*)\s*(triệu|tr|k|nghìn)?/i);
  if (!match) return null;
  const num = Number(match[1].replace(/\./g, ''));
  if (!Number.isFinite(num)) return null;
  const unit = String(match[2] || '').toLowerCase();
  if (unit === 'triệu' || unit === 'tr') return num * 1000000;
  if (unit === 'k' || unit === 'nghìn') return num * 1000;
  return num;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function scoreProduct(query, product) {
  const q = normalizeText(query);
  const name = normalizeText(product.name);
  let score = 0;

  if (name.includes(q) || q.includes(name)) score += 5;
  for (const token of name.split(/\s+/).filter((t) => t.length >= 3)) {
    if (q.includes(token)) score += 2;
  }

  if (product.brand?.name && q.includes(normalizeText(product.brand.name))) score += 2;
  if (product.category?.name && q.includes(normalizeText(product.category.name))) score += 2;
  if (product.scentNotes && q.includes(normalizeText(product.scentNotes))) score += 1;
  return score;
}

async function buildProductCandidates(question) {
  const q = cleanText(question);
  const budget = extractBudget(q);
  const filters = {};

  const qLower = normalizeText(q);
  if (qLower.includes('nam')) filters.categoryId = 1;
  if (qLower.includes('nu') || qLower.includes('nữ')) filters.categoryId = 2;
  if (qLower.includes('unisex')) filters.categoryId = 3;

  const pool = await getProductsPaged({ page: 1, size: 50, filters });
  let products = pool.content || [];

  if (budget) {
    products = products.filter((p) => toPrice(p) <= budget);
  }

  if (!products.length && q) {
    products = await searchProducts(q);
  }

  products.sort((a, b) => scoreProduct(q, b) - scoreProduct(q, a));
  return products.slice(0, 5).map(summarizeProduct);
}

function buildFallbackAnswer(question, products) {
  if (!products.length) {
    return {
      answer: 'Mình chưa tìm thấy sản phẩm phù hợp trong database. Bạn thử hỏi theo tên sản phẩm, ngân sách hoặc nhóm hương nhé.',
      products: [],
    };
  }

  const lines = products.map((p) => {
    const price = new Intl.NumberFormat('vi-VN').format(p.price);
    return `- ${p.name} | ${price}đ | còn ${p.stock} | ${p.brand || 'N/A'}`;
  });

  return {
    answer: `Mình gợi ý từ database thật cho câu hỏi "${cleanText(question)}":\n${lines.join('\n')}`,
    products,
  };
}

async function callDeepSeek(messages) {
  const apiKey = cleanText(process.env.DEEPSEEK_API_KEY);
  const baseUrl = cleanText(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com');
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY');

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
    throw new Error(`DeepSeek error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function productChat(req, res) {
  try {
    const question = cleanText(req.body?.q || req.body?.question);
    if (!question) return errorResponse(res, 400, 'Thiếu câu hỏi q');

    const products = await buildProductCandidates(question);
    const fallback = buildFallbackAnswer(question, products);

    if (!products.length) {
      return successResponse(res, 'Trả lời từ database thành công', fallback);
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
        content: JSON.stringify({ question, products: context }),
      },
    ];

    try {
      const data = await callDeepSeek(messages);
      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error('DeepSeek returned empty answer');
      return successResponse(res, 'Tư vấn AI thành công', {
        answer,
        products,
        provider: 'deepseek',
      });
    } catch (err) {
      console.error('[AI_PRODUCT_CHAT_FALLBACK]', err);
      return successResponse(res, 'Tư vấn AI thành công bằng fallback', {
        ...fallback,
        provider: 'fallback',
      });
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
      if (!answer) throw new Error('DeepSeek returned empty answer');
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
