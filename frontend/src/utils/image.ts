export const DEFAULT_PRODUCT_IMAGE = '/assets/images/product-placeholder.svg';

function preferOptimizedProductAsset(value: string) {
  if (/^\/assets\/images\/\d+\.png(?:[?#].*)?$/i.test(value)) {
    return value.replace(/\.png(?=([?#]|$))/i, '.webp');
  }

  return value;
}

function getBackendBaseUrl() {
  const raw = String(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
}

export function resolveProductImage(image?: string | null) {
  const value = String(image || '').trim();
  if (!value) return DEFAULT_PRODUCT_IMAGE;

  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/assets/') || value.startsWith('/images/') || value.startsWith('/icon/')) {
    return preferOptimizedProductAsset(value);
  }

  if (value.startsWith('/upload') || value.startsWith('/uploads')) {
    return `${getBackendBaseUrl()}${value}`;
  }

  if (value.startsWith('upload/') || value.startsWith('uploads/')) {
    return `${getBackendBaseUrl()}/${value}`;
  }

  if (value.startsWith('/')) {
    return value;
  }

  return preferOptimizedProductAsset(`/assets/images/${value}`);
}
