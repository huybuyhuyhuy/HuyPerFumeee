import { errorResponse, successResponse } from '../utils/response.js';
import { getBrands } from '../models/brandModel.js';
import { getCategories } from '../models/categoryModel.js';
import { getProductById, getProductsPaged, getRandomProducts, searchProducts } from '../models/productModel.js';

export async function listProducts(req, res) {
  const products = await getProductsPaged({
    page: req.query.page || 1,
    size: req.query.size || 12,
    sort: req.query.sort || 'newest',
    filters: {
      categoryId: req.query.categoryId,
      brandId: req.query.brandId,
      priceRange: req.query.priceRange,
      search: req.query.search,
    },
  });

  return successResponse(res, 'Lấy danh sách sản phẩm thành công', products);
}

export async function detailProduct(req, res) {
  const id = Number(req.params.id);
  if (!id) {
    return errorResponse(res, 400, 'ID sản phẩm không hợp lệ');
  }

  const product = await getProductById(id);
  if (!product) {
    return errorResponse(res, 404, 'Không tìm thấy sản phẩm');
  }

  return successResponse(res, 'Lấy chi tiết sản phẩm thành công', product);
}

export async function randomProducts(req, res) {
  const limit = req.query.limit || 4;
  const products = await getRandomProducts(limit);
  return successResponse(res, 'Lấy sản phẩm ngẫu nhiên thành công', products);
}

export async function searchProductList(req, res) {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return errorResponse(res, 400, 'Thiếu từ khóa tìm kiếm');
  }
  const products = await searchProducts(q);
  return successResponse(res, 'Tìm kiếm sản phẩm thành công', products);
}

export async function listCategories(_req, res) {
  const categories = await getCategories();
  return successResponse(res, 'Lấy danh mục thành công', categories);
}

export async function listBrands(_req, res) {
  const brands = await getBrands();
  return successResponse(res, 'Lấy thương hiệu thành công', brands);
}
