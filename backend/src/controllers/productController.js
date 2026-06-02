import { errorResponse, successResponse } from '../utils/response.js';
import { getBrands } from '../models/brandModel.js';
import { getCategories } from '../models/categoryModel.js';
import {
  getProductById,
  getProductFacets,
  getProductsPaged,
  getRandomProducts,
  searchProducts,
} from '../models/productModel.js';
import { getViewTokenFromRequest } from './recommendationController.js';
import { recordProductView } from '../modules/recommendations/recommendation.service.js';

const PRODUCT_PRICE_RANGES = [
  { value: 'under500', label: 'Dưới 500.000đ', min: 0, max: 500000 },
  { value: '500to1000', label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
  { value: '1000to2000', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
  { value: 'above2000', label: 'Trên 2.000.000đ', min: 2000000, max: null },
];

function buildProductFilters(query) {
  return {
    categoryId: query.categoryId,
    category: query.category || query.categorySlug || query.categoryName,
    brandId: query.brandId,
    brand: query.brand || query.brandSlug || query.brandName,
    search: query.search || query.q || query.keyword || query.name,
    badge: query.badge,
    priceRange: query.priceRange,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    volumeMl: query.volumeMl,
    volume: query.volume,
    scent: query.scent,
    scentGroup: query.scentGroup || query.scentFamily,
    gender: query.gender,
    sale: query.sale || query.onSale,
    bestSeller: query.bestSeller || query.bestseller,
  };
}

export async function listProducts(req, res, next) {
  try {
    const products = await getProductsPaged({
      page: req.query.page || 1,
      size: req.query.size || 12,
      sort: req.query.sort || 'newest',
      filters: buildProductFilters(req.query),
    });

    return successResponse(res, 'Lay danh sach san pham thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function detailProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, 400, 'ID san pham khong hop le');
    }

    const product = await getProductById(id, { userId: req.user?.id });
    if (!product) {
      return errorResponse(res, 404, 'Khong tim thay san pham');
    }

    recordProductView({
      productId: id,
      userId: req.user?.id || null,
      viewToken: getViewTokenFromRequest(req),
    }).catch((error) => {
      console.warn('Could not record product view:', error.message);
    });

    return successResponse(res, 'Lay chi tiet san pham thanh cong', product);
  } catch (error) {
    return next(error);
  }
}

export async function randomProducts(req, res, next) {
  try {
    const limit = req.query.limit || 4;
    const products = await getRandomProducts(limit);
    return successResponse(res, 'Lay san pham ngau nhien thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function searchProductList(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return errorResponse(res, 400, 'Thieu tu khoa tim kiem');
    }
    const products = await searchProducts(q, req.query.limit || 10);
    return successResponse(res, 'Tim kiem san pham thanh cong', products);
  } catch (error) {
    return next(error);
  }
}

export async function productFacets(_req, res, next) {
  try {
    const [categories, brands, facets] = await Promise.all([
      getCategories(),
      getBrands(),
      getProductFacets(),
    ]);

    return successResponse(res, 'Lay facets san pham thanh cong', {
      brands,
      categories,
      scentGroups: facets.scentGroups || [],
      volumes: facets.volumes || [],
      priceRanges: PRODUCT_PRICE_RANGES,
    });
  } catch (error) {
    return next(error);
  }
}

export async function homepageData(_req, res, next) {
  try {
    const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
    return successResponse(res, 'Lay du lieu homepage thanh cong', {
      categories,
      brands,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listCategories(_req, res, next) {
  try {
    const categories = await getCategories();
    return successResponse(res, 'Lay danh muc thanh cong', categories);
  } catch (error) {
    return next(error);
  }
}

export async function listBrands(_req, res, next) {
  try {
    const brands = await getBrands();
    return successResponse(res, 'Lay thuong hieu thanh cong', brands);
  } catch (error) {
    return next(error);
  }
}
