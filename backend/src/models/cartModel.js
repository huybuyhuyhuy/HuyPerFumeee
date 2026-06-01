import { getProductPurchaseOption } from './productModel.js';
import { validateCartQuantity } from '../modules/products/product.validation.js';
import {
  clearDurableCart,
  getDurableCart,
  hasDurableCartStorage,
  removeDurableCartItem,
  upsertDurableCartItem,
} from '../modules/checkout/cart.repository.js';

const CART_STORAGE_ERROR = 'Chua khoi tao bang gio hang. Vui long chay migration 001_create_cart_tables.sql.';

function normalizeCartSelectionOptions(options = {}) {
  return {
    itemType: String(options.itemType || 'FULL_BOTTLE').trim().toUpperCase() === 'DECANT' ? 'DECANT' : 'FULL_BOTTLE',
    volumeMl: options.volumeMl ?? options.selectedVolumeMl ?? null,
  };
}

function cartItemMatches(item, productId, variantId = null, options = {}) {
  const currentVariantId = item.product.variantId ?? null;
  const normalized = normalizeCartSelectionOptions(options);
  const currentItemType = String(item.product.itemType || 'FULL_BOTTLE').toUpperCase();
  const currentVolumeMl = item.product.selectedVolumeMl ?? item.product.volumeMl ?? null;
  return Number(item.product.id) === Number(productId) &&
    String(currentVariantId ?? '') === String(variantId ?? '') &&
    currentItemType === normalized.itemType &&
    String(currentVolumeMl ?? '') === String(normalized.volumeMl ?? '');
}

async function requireCartStorage() {
  if (!(await hasDurableCartStorage())) {
    throw new Error(CART_STORAGE_ERROR);
  }
}

function requireCartResult(cart) {
  if (!cart) throw new Error(CART_STORAGE_ERROR);
  return cart;
}

export async function getCart(scope) {
  await requireCartStorage();
  return requireCartResult(await getDurableCart(scope));
}

export async function addToCart(scope, productId, quantity = 1, variantId = null, options = {}) {
  const quantityValidation = validateCartQuantity(quantity);
  if (!quantityValidation.valid) {
    return { code: 400, message: quantityValidation.message };
  }

  const selection = await getProductPurchaseOption(productId, variantId, normalizeCartSelectionOptions(options));
  if (selection.code) return selection;

  await requireCartStorage();
  return requireCartResult(
    await upsertDurableCartItem(scope, selection, quantityValidation.quantity, 'add')
  );
}

export async function updateCartItem(scope, productId, quantity, variantId = null, options = {}) {
  const quantityValidation = validateCartQuantity(quantity);
  if (!quantityValidation.valid) {
    return { code: 400, message: quantityValidation.message };
  }

  const normalizedOptions = normalizeCartSelectionOptions(options);
  const selection = await getProductPurchaseOption(productId, variantId, normalizedOptions);
  if (selection.code) return selection;
  if (quantityValidation.quantity > selection.stockQuantity) {
    return { code: 400, message: 'So luong vuot qua ton kho' };
  }

  await requireCartStorage();
  const currentCart = requireCartResult(await getDurableCart(scope));
  const exists = currentCart.items.some((item) => (
    cartItemMatches(item, selection.productId, selection.variantId, normalizedOptions)
  ));
  if (!exists) return { code: 404, message: 'San pham khong co trong gio hang' };

  return requireCartResult(
    await upsertDurableCartItem(scope, selection, quantityValidation.quantity, 'set')
  );
}

export async function removeCartItem(scope, productId, variantId = null, options = {}) {
  await requireCartStorage();
  return requireCartResult(await removeDurableCartItem(scope, productId, variantId, normalizeCartSelectionOptions(options)));
}

export async function clearCart(scope) {
  await requireCartStorage();
  return requireCartResult(await clearDurableCart(scope));
}

export async function markCartCheckedOut(scope) {
  await requireCartStorage();
  return requireCartResult(await clearDurableCart(scope, 'CHECKED_OUT'));
}

export async function mergeGuestCartToUser(userId, cartToken) {
  const safeUserId = Number(userId);
  const safeCartToken = String(cartToken || '').trim();
  const userScope = { type: 'user', key: safeUserId };
  if (!safeUserId || !safeCartToken) {
    return getCart(userScope);
  }

  const guestScope = { type: 'guest', key: safeCartToken };
  const guestCart = await getCart(guestScope);
  let userCart = await getCart(userScope);

  for (const item of guestCart.items || []) {
    const selection = await getProductPurchaseOption(Number(item.product?.id), item.product?.variantId ?? null, {
      itemType: item.product?.itemType,
      volumeMl: item.product?.selectedVolumeMl,
    });
    if (selection.code) return selection;

    const existing = userCart.items.find((cartItem) => (
      cartItemMatches(cartItem, selection.productId, selection.variantId, {
        itemType: selection.itemType,
        volumeMl: selection.volumeMl,
      })
    ));
    const mergedQuantity = Math.min(
      Number(existing?.quantity || 0) + Number(item.quantity || 1),
      Number(selection.stockQuantity || 0)
    );
    userCart = requireCartResult(
      await upsertDurableCartItem(userScope, selection, mergedQuantity, 'set')
    );
  }

  await clearCart(guestScope);
  return userCart;
}
