import { getProductPurchaseOption } from './productModel.js';
import { clearGuestCart, clearUserCart, getGuestCart, getUserCart, setGuestCart, setUserCart } from '../utils/cartStore.js';
import { validateCartQuantity } from '../modules/products/product.validation.js';
import {
  clearDurableCart,
  getDurableCart,
  hasDurableCartStorage,
  removeDurableCartItem,
  upsertDurableCartItem,
} from '../modules/checkout/cart.repository.js';

function toCartResponse(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, total, itemCount };
}

function cartItemMatches(item, productId, variantId = null) {
  const currentVariantId = item.product.variantId ?? null;
  return Number(item.product.id) === Number(productId) && String(currentVariantId ?? '') === String(variantId ?? '');
}

function normalizeCartItem(selection, quantity) {
  const { product, variant, unitPrice, stockQuantity } = selection;
  return {
    product: {
      id: product.id,
      variantId: selection.variantId,
      name: product.name,
      image: selection.image,
      price: variant?.originalPrice ?? product.originalPrice,
      salePrice: variant?.salePrice ?? product.salePrice,
      discountPrice: variant?.salePrice ?? product.salePrice,
      originalPrice: variant?.originalPrice ?? product.originalPrice,
      stock: stockQuantity,
      stockQuantity,
      brand: product.brand,
      category: product.category,
      selectedVariant: variant,
    },
    quantity,
    price: unitPrice,
    subtotal: unitPrice * quantity,
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
  if (await hasDurableCartStorage()) {
    return getDurableCart(scope);
  }

  const items = getCartByScope(scope);
  return toCartResponse(items);
}

export async function addToCart(scope, productId, quantity = 1, variantId = null) {
  const quantityValidation = validateCartQuantity(quantity);
  if (!quantityValidation.valid) {
    return { code: 400, message: quantityValidation.message };
  }

  const selection = await getProductPurchaseOption(productId, variantId);
  if (selection.code) return selection;

  if (await hasDurableCartStorage()) {
    return upsertDurableCartItem(scope, selection, quantityValidation.quantity, 'add');
  }

  const currentItems = getCartByScope(scope);
  const existing = currentItems.find((item) => cartItemMatches(item, selection.productId, selection.variantId));
  const nextQuantity = existing ? existing.quantity + quantityValidation.quantity : quantityValidation.quantity;

  if (nextQuantity > selection.stockQuantity) {
    return { code: 400, message: 'So luong vuot qua ton kho' };
  }

  let nextItems;
  if (existing) {
    nextItems = currentItems.map((item) => (
      cartItemMatches(item, selection.productId, selection.variantId)
        ? {
            ...item,
            quantity: nextQuantity,
            subtotal: item.price * nextQuantity,
            product: {
              ...item.product,
              stock: selection.stockQuantity,
              stockQuantity: selection.stockQuantity,
            },
          }
        : item
    ));
  } else {
    nextItems = [...currentItems, normalizeCartItem(selection, quantityValidation.quantity)];
  }

  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function updateCartItem(scope, productId, quantity, variantId = null) {
  const quantityValidation = validateCartQuantity(quantity);
  if (!quantityValidation.valid) {
    return { code: 400, message: quantityValidation.message };
  }

  const selection = await getProductPurchaseOption(productId, variantId);
  if (selection.code) return selection;
  if (quantityValidation.quantity > selection.stockQuantity) {
    return { code: 400, message: 'So luong vuot qua ton kho' };
  }

  if (await hasDurableCartStorage()) {
    return upsertDurableCartItem(scope, selection, quantityValidation.quantity, 'set');
  }

  const currentItems = getCartByScope(scope);
  const exists = currentItems.some((item) => cartItemMatches(item, selection.productId, selection.variantId));
  if (!exists) {
    return { code: 404, message: 'San pham khong co trong gio hang' };
  }

  const nextItems = currentItems.map((item) => (
    cartItemMatches(item, selection.productId, selection.variantId)
      ? {
          ...normalizeCartItem(selection, quantityValidation.quantity),
          quantity: quantityValidation.quantity,
        }
      : item
  ));
  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function removeCartItem(scope, productId, variantId = null) {
  if (await hasDurableCartStorage()) {
    return removeDurableCartItem(scope, productId, variantId);
  }

  const currentItems = getCartByScope(scope);
  const shouldRemoveAllProductVariants = variantId === null || variantId === undefined || variantId === '';
  const nextItems = currentItems.filter((item) => {
    if (Number(item.product.id) !== Number(productId)) return true;
    if (shouldRemoveAllProductVariants) return false;
    return !cartItemMatches(item, productId, variantId);
  });
  saveCartByScope(scope, nextItems);
  return toCartResponse(nextItems);
}

export async function clearCart(scope) {
  if (await hasDurableCartStorage()) {
    return clearDurableCart(scope);
  }

  clearCartByScope(scope);
  return toCartResponse([]);
}

export async function markCartCheckedOut(scope) {
  if (await hasDurableCartStorage()) {
    return clearDurableCart(scope, 'CHECKED_OUT');
  }

  clearCartByScope(scope);
  return toCartResponse([]);
}
