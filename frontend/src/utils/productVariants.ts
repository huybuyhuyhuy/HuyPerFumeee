import { clampPrice } from './formatters';
import { resolveProductImage } from './image';

export function buildProductVariants(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const mapped = variants
    .map((variant, index) => {
      const price = clampPrice(variant?.discountPrice ?? variant?.price ?? product?.discountPrice ?? product?.price);
      const originalPrice = clampPrice(variant?.originalPrice ?? variant?.price ?? product?.originalPrice ?? product?.price);
      const stock = Number.isFinite(Number(variant?.stock)) ? Number(variant.stock) : clampPrice(product?.stock);
      const variantType = String(variant?.type ?? variant?.variantType ?? '').toUpperCase();
      const isDecant = variantType === 'DECANT';
      const volume = String(variant?.size ?? variant?.volume ?? variant?.volumeMl ?? product?.volumeMl ?? '');
      const typeLabel = isDecant ? 'Chiết' : variantType === 'FULL' ? 'Chai full' : '';
      const label = [volume, typeLabel].filter(Boolean).join(' - ') || (variant?.label ?? variant?.name ?? `Phiên bản ${index + 1}`);
      return {
        id: variant?.id ?? variant?.variantId ?? `${product?.id || 'product'}-${index}`,
        label: String(label),
        size: volume,
        price,
        originalPrice: originalPrice > price ? originalPrice : price,
        stock,
        image: resolveProductImage(variant?.image ?? variant?.productImage ?? product?.image),
        sku: String(variant?.sku ?? product?.sku ?? ''),
        batchCode: String(variant?.batchCode ?? variant?.batch_code ?? product?.batchCode ?? ''),
        status: variant?.status !== false,
        isAvailable: (variant?.status !== false) && stock > 0,
        variantType,
        isDecant,
        raw: variant,
      };
    })
    .filter(Boolean);

  if (mapped.length > 0) return mapped;

  const basePrice = clampPrice(product?.discountPrice ?? product?.price);
  const baseOriginal = clampPrice(product?.originalPrice ?? product?.price);
  return [
    {
      id: product?.id ?? 'default',
      label: 'Tiêu chuẩn',
      size: product?.volumeMl ? `${product.volumeMl}ml` : '',
      price: basePrice,
      originalPrice: baseOriginal > basePrice ? baseOriginal : basePrice,
      stock: clampPrice(product?.stock),
      image: resolveProductImage(product?.image),
      sku: String(product?.sku ?? ''),
      batchCode: String(product?.batchCode ?? ''),
      status: product?.status !== false,
      isAvailable: (product?.status !== false) && clampPrice(product?.stock) > 0,
      raw: null,
    },
  ];
}
