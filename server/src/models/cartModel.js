import { getProductById } from './productModel.js';
import { clearGuestCart, clearUserCart, getGuestCart, getUserCart, setGuestCart, setUserCart } from '../utils/cartStore.js';

function toCartResponse(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, itemCount };
}

function normalizeCartItem(product, quantity) {
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  return {
    product: {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      brand: product.brand,
      category: product.category,
    },
    quantity,
    price,
    subtotal: price * quantity,
  };
}

function getCartByScope(scope) {
  if (scope.type === 'user') return getUserCart(scope.key);
  return getGuestCart(scope.key);
}

function saveCartByScope(scope, items) {
  if (scope.type === 'user') return setUserCart(scope.key, items);
  return setGuestCart(scope.key, items);
}

function clearCartByScope(scope) {
  if (scope.type === 'user') return clearUserCart(scope.key);
  return clearGuestCart(scope.key);
}

export async function getCart(scope) {
  const items = getCartByScope(scope);
  return toCartResponse(items);
}

export async function addToCart(scope, productId, quantity = 1) {
  const product = await getProductById(productId);
  if (!product) {
    return { code: 404, message: 'Không tìm thấy sản phẩm' };
  }
  if (product.stock <= 0) {
    return { code: 400, message: 'Sản phẩm đã hết hàng' };
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return { code: 400, message: 'Số lượng không hợp lệ' };
  }

  const currentItems = getCartByScope(scope);
  const existing = currentItems.find((item) => item.product.id === product.id);
  const nextQuantity = existing ? existing.quantity + qty : qty;

  if (nextQuantity > product.stock) {
    return { code: 400, message: 'Số lượng vượt quá tồn kho' };
  }

  let nextItems;
  if (existing) {
    nextItems = currentItems.map((item) => (
      item.product.id === product.id
        ? { ...item, quantity: nextQuantity, subtotal: item.price * nextQuantity }
        : item
    ));
  } else {
    nextItems = [...currentItems, normalizeCartItem(product, qty)];
  }

  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function updateCartItem(scope, productId, quantity) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return { code: 400, message: 'Số lượng không hợp lệ' };
  }

  const product = await getProductById(productId);
  if (!product) {
    return { code: 404, message: 'Không tìm thấy sản phẩm' };
  }
  if (qty > product.stock) {
    return { code: 400, message: 'Số lượng vượt quá tồn kho' };
  }

  const currentItems = getCartByScope(scope);
  const exists = currentItems.some((item) => item.product.id === product.id);
  if (!exists) {
    return { code: 404, message: 'Sản phẩm không có trong giỏ hàng' };
  }

  const nextItems = currentItems.map((item) => (
    item.product.id === product.id
      ? { ...item, quantity: qty, subtotal: item.price * qty }
      : item
  ));
  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function removeCartItem(scope, productId) {
  const currentItems = getCartByScope(scope);
  const nextItems = currentItems.filter((item) => item.product.id !== Number(productId));
  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function clearCart(scope) {
  clearCartByScope(scope);
  return toCartResponse([]);
}
