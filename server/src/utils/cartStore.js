const guestCarts = new Map();
const userCarts = new Map();

export function getGuestCart(cartToken) {
  return guestCarts.get(cartToken) || [];
}

export function setGuestCart(cartToken, items) {
  guestCarts.set(cartToken, items);
}

export function clearGuestCart(cartToken) {
  guestCarts.delete(cartToken);
}

export function getUserCart(userId) {
  return userCarts.get(String(userId)) || [];
}

export function setUserCart(userId, items) {
  userCarts.set(String(userId), items);
}

export function clearUserCart(userId) {
  userCarts.delete(String(userId));
}
