import { useMemo } from 'react';

type ProductPurchaseVariant = {
  id: number | string;
  label?: string;
  size?: string;
  stock?: number;
  isAvailable?: boolean;
  isDecant?: boolean;
  variantType?: string;
};

type ProductVariantsProps = {
  variants?: ProductPurchaseVariant[];
  activeVariantId?: number | string | null;
  onChange?: (variant: ProductPurchaseVariant) => void;
};

export function ProductVariants({ variants, activeVariantId, onChange }: ProductVariantsProps) {
  const list = useMemo(() => variants || [], [variants]);

  return (
    <div className="product-variant-list" role="radiogroup" aria-label="Chọn phiên bản sản phẩm">
      {list.map((variant) => {
        const active = variant.id === activeVariantId;
        const disabled = !variant.isAvailable;
        const stock = Number(variant.stock || 0);
        const variantType = String(variant.variantType || 'STANDARD');

        return (
          <button
            key={variant.id}
            type="button"
            className={`product-variant-pill ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange?.(variant)}
            aria-pressed={active}
            aria-disabled={disabled}
            disabled={disabled}
          >
            <span className="product-variant-pill-label">
              {variant.label || 'Phiên bản'}
              {variantType !== 'STANDARD' && (
                <span className={`variant-type-badge variant-type-${variantType.toLowerCase()}`}>
                  {variant.isDecant ? 'Chiết' : variantType === 'FULL' ? 'Full' : variantType}
                </span>
              )}
            </span>
            <span className="product-variant-pill-meta">
              {variant.size ? `${variant.size} - ` : ''}
              {variant.isDecant && stock > 0
                ? `~${stock} lọ`
                : stock > 0
                  ? `${stock} còn lại`
                  : 'Hết hàng'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
