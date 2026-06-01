export function buildProductVariants(product) {
  const variants = [];
  const productName = product?.name || 'Sản phẩm';
  const baseStock = Number(product?.stockQuantity ?? product?.stock ?? 0);
  const basePrice = Number(product?.salePrice ?? product?.discountPrice ?? product?.price ?? 0);

  variants.push({
    id: `full-${product?.id || 'default'}`,
    variantId: product?.variantId ?? null,
    label: 'Full chai',
    size: product?.bottleVolumeMl ? `${product.bottleVolumeMl}ml` : `${product?.volumeMl || 100}ml`,
    volume: product?.bottleVolumeMl ? `${product.bottleVolumeMl}ml` : `${product?.volumeMl || 100}ml`,
    price: basePrice,
    originalPrice: Number(product?.originalPrice ?? product?.price ?? basePrice),
    stock: baseStock,
    stockQuantity: baseStock,
    isAvailable: baseStock > 0,
    isDecant: false,
    itemType: 'FULL_BOTTLE',
    raw: { label: 'Full chai', name: productName },
  });

  const decantOptions = Array.isArray(product?.decantOptions) ? product.decantOptions : [];
  const availableVolumeMl = Number(product?.availableVolumeMl ?? 0);

  for (const option of decantOptions) {
    const volumeMl = Number(option?.volumeMl ?? option?.volume_ml ?? 0);
    const price = Number(option?.price ?? 0);
    if (!volumeMl || price < 0) continue;

    variants.push({
      id: `decant-${product?.id || 'default'}-${volumeMl}`,
      variantId: null,
      label: `Chiết ${volumeMl}ml`,
      size: `${volumeMl}ml`,
      volume: `${volumeMl}ml`,
      price,
      originalPrice: price,
      stock: availableVolumeMl > 0 ? Math.floor(availableVolumeMl / volumeMl) : 0,
      stockQuantity: availableVolumeMl > 0 ? Math.floor(availableVolumeMl / volumeMl) : 0,
      isAvailable: availableVolumeMl >= volumeMl,
      isDecant: true,
      itemType: 'DECANT',
      volumeMl,
      raw: option,
    });
  }

  return variants;
}

export function getVariantPrice(variant, product) {
  return Number(variant?.price ?? product?.salePrice ?? product?.discountPrice ?? product?.price ?? 0);
}
