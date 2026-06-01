import { clampPrice } from './formatters';
import { resolveProductImage } from './image';

function resolveVariantImage(variant: any, product: any) {
  const variantImage = String(variant?.image ?? variant?.productImage ?? '').trim();
  return resolveProductImage(variantImage || product?.image);
}

function normalizeVariantType(value: any) {
  return String(value || '').toUpperCase();
}

export function buildProductVariants(product: any) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const mapped = variants
    .map((variant, index) => {
      const price = clampPrice(variant?.discountPrice ?? variant?.price ?? product?.discountPrice ?? product?.price);
      const originalPrice = clampPrice(variant?.originalPrice ?? variant?.price ?? product?.originalPrice ?? product?.price);
      const stock = Number.isFinite(Number(variant?.stock)) ? Number(variant.stock) : clampPrice(product?.parentStockQuantity ?? product?.stock);
      const variantType = normalizeVariantType(variant?.type ?? variant?.variantType);
      const isDecant = variantType === 'DECANT';
      const volumeMl = Number(variant?.volumeMl ?? variant?.volume_ml ?? 0) || null;
      const volume = String(variant?.size ?? variant?.volume ?? (volumeMl ? `${volumeMl}ml` : product?.volumeMl ?? ''));
      const typeLabel = isDecant ? 'Chiết' : variantType === 'FULL' ? 'Full chai' : '';
      const label = [volume, typeLabel].filter(Boolean).join(' - ') || (variant?.label ?? variant?.name ?? `Phiên bản ${index + 1}`);
      return {
        id: variant?.id ?? variant?.variantId ?? `${product?.id || 'product'}-${index}`,
        variantId: variant?.variantId ?? variant?.id ?? null,
        label: String(label),
        size: volume,
        price,
        originalPrice: originalPrice > price ? originalPrice : price,
        stock,
        image: resolveVariantImage(variant, product),
        sku: String(variant?.sku ?? product?.sku ?? ''),
        batchCode: String(variant?.batchCode ?? variant?.batch_code ?? product?.batchCode ?? ''),
        status: variant?.status !== false,
        isAvailable: (variant?.status !== false) && stock > 0 && price > 0,
        variantType: variantType || 'STANDARD',
        itemType: isDecant ? 'DECANT' : 'FULL_BOTTLE',
        volumeMl: isDecant ? volumeMl : null,
        isDecant,
        raw: variant,
      };
    })
    .filter(Boolean);

  const decantOptions = Array.isArray(product?.decantOptions) ? product.decantOptions : [];
  if (decantOptions.length > 0) {
    const fullVariant = mapped.find((variant) => !variant.isDecant) || null;
    const basePrice = clampPrice(fullVariant?.price ?? product?.discountPrice ?? product?.price);
    const baseOriginal = clampPrice(fullVariant?.originalPrice ?? product?.originalPrice ?? product?.price);
    const fullStock = Number.isFinite(Number(fullVariant?.stock)) ? Number(fullVariant.stock) : clampPrice(product?.stock);
    const fullOption = {
      id: fullVariant?.id ?? 'full-bottle',
      variantId: fullVariant?.variantId ?? null,
      label: fullVariant?.label || 'Full chai',
      size: fullVariant?.size || (product?.volumeMl ? `${product.volumeMl}ml` : ''),
      price: basePrice,
      originalPrice: baseOriginal > basePrice ? baseOriginal : basePrice,
      stock: fullStock,
      image: fullVariant?.image || resolveProductImage(product?.image),
      sku: fullVariant?.sku || String(product?.sku ?? ''),
      batchCode: fullVariant?.batchCode || String(product?.batchCode ?? ''),
      status: product?.status !== false && fullVariant?.status !== false,
      isAvailable: (product?.status !== false) && (fullVariant?.status !== false) && fullStock > 0 && basePrice > 0,
      variantType: 'FULL',
      itemType: 'FULL_BOTTLE',
      volumeMl: null,
      isDecant: false,
      raw: fullVariant?.raw ?? null,
    };

    const availableVolumeMl = clampPrice(product?.availableVolumeMl);
    const decants = decantOptions
      .map((option: any) => {
        const volumeMl = Number(option?.volumeMl ?? option?.volume_ml);
        const price = clampPrice(option?.price);
        const stock = volumeMl > 0 ? Math.floor(availableVolumeMl / volumeMl) : 0;
        return {
          id: `decant-${volumeMl}`,
          variantId: null,
          label: `Chiết ${volumeMl}ml`,
          size: `${volumeMl}ml`,
          price,
          originalPrice: price,
          stock,
          image: resolveProductImage(product?.image),
          sku: String(product?.sku ?? ''),
          batchCode: String(product?.batchCode ?? ''),
          status: option?.status !== false,
          isAvailable: option?.status !== false && stock > 0 && price > 0,
          variantType: 'DECANT',
          itemType: 'DECANT',
          volumeMl,
          isDecant: true,
          raw: option,
        };
      })
      .filter((option: any) => Number.isFinite(option.volumeMl) && option.volumeMl > 0);

    return [fullOption, ...decants];
  }

  if (mapped.length > 0) return mapped;

  const basePrice = clampPrice(product?.discountPrice ?? product?.price);
  const baseOriginal = clampPrice(product?.originalPrice ?? product?.price);
  return [
    {
      id: product?.id ?? 'default',
      variantId: null,
      label: 'Tiêu chuẩn',
      size: product?.volumeMl ? `${product.volumeMl}ml` : '',
      price: basePrice,
      originalPrice: baseOriginal > basePrice ? baseOriginal : basePrice,
      stock: clampPrice(product?.stock),
      image: resolveProductImage(product?.image),
      sku: String(product?.sku ?? ''),
      batchCode: String(product?.batchCode ?? ''),
      status: product?.status !== false,
      isAvailable: (product?.status !== false) && clampPrice(product?.stock) > 0 && basePrice > 0,
      variantType: 'STANDARD',
      itemType: 'FULL_BOTTLE',
      volumeMl: null,
      isDecant: false,
      raw: null,
    },
  ];
}
