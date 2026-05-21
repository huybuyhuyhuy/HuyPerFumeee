const DEFAULT_PRODUCT_IMAGE = '/assets/images/1.png';

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
    return value;
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

  return `/assets/images/${value}`;
}
