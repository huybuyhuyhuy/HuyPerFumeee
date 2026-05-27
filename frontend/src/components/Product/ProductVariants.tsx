import { useMemo } from 'react';

export function ProductVariants({ variants, activeVariantId, onChange }) {
  const list = useMemo(() => variants || [], [variants]);

  return (
    <div className="product-variant-list" role="radiogroup" aria-label="Chọn phiên bản sản phẩm">
      {list.map((variant) => {
        const active = variant.id === activeVariantId;
        const disabled = !variant.isAvailable;
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
              {variant.label}
              {variant.variantType && variant.variantType !== 'STANDARD' && (
                <span className={`variant-type-badge variant-type-${variant.variantType.toLowerCase()}`}>
                  {variant.isDecant ? 'Chiết' : variant.variantType === 'FULL' ? 'Full' : variant.variantType}
                </span>
              )}
            </span>
            <span className="product-variant-pill-meta">
              {variant.size ? `${variant.size} · ` : ''}
              {variant.isDecant && variant.stock > 0
                ? `~${variant.stock} lọ`
                : variant.stock > 0
                  ? `${variant.stock} còn lại`
                  : 'Hết hàng'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
