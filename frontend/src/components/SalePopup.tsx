import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productService } from '../services/productService.js';
import type { Product } from '../types';
import { resolveProductImage } from '../utils/image';

const salePopupConfig = {
  delayMs: 2800,
  visibleDurationMs: 3000,
  rotationMs: 30000,
  storageKey: 'huyperfume.salePopup.dismissed.v3',
  purchaseMinuteOptions: [2, 3, 5, 7, 9, 12],
  viewerCountOptions: [1, 2, 3, 4],
  ctaFallbackPath: '/products',
};

type PopupProduct = {
  id: number | null;
  name: string;
  brandName: string;
  image: string;
  price: number;
  discountPrice: number;
};

type SocialProof = {
  purchaseMinutesAgo: number;
  viewerCount: number;
};

const fallbackProduct: PopupProduct = {
  id: null,
  name: 'Dior Sauvage EDT',
  brandName: 'HuyPerfume tuyển chọn',
  image: '/assets/images/1.png',
  price: 2950000,
  discountPrice: 0,
};

function trackPopup(eventName: 'popup_open' | 'popup_close' | 'popup_cta_click') {
  console.log(`[HuyPerfume] ${eventName}`);
}

function toPopupProduct(product: Product): PopupProduct {
  return {
    id: product.id,
    name: product.name,
    brandName: product.brand?.name || 'HuyPerfume tuyển chọn',
    image: resolveProductImage(product.image),
    price: product.price,
    discountPrice: product.discountPrice,
  };
}

function formatCurrency(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')}₫`;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createSocialProof(): SocialProof {
  return {
    purchaseMinutesAgo: pickRandom(salePopupConfig.purchaseMinuteOptions),
    viewerCount: pickRandom(salePopupConfig.viewerCountOptions),
  };
}

export function SalePopup() {
  const [visible, setVisible] = useState(false);
  const [product, setProduct] = useState<PopupProduct>(fallbackProduct);
  const [socialProof, setSocialProof] = useState<SocialProof>(() => createSocialProof());
  const location = useLocation();
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const rotationTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (rotationTimerRef.current) window.clearTimeout(rotationTimerRef.current);

    showTimerRef.current = null;
    hideTimerRef.current = null;
    rotationTimerRef.current = null;
  };

  useEffect(() => {
    if (location.pathname !== '/') {
      clearTimers();
      setVisible(false);
      return;
    }

    if (window.sessionStorage.getItem(salePopupConfig.storageKey) === '1') {
      return;
    }

    let active = true;
    let productPool: PopupProduct[] = [fallbackProduct];
    let productIndex = 0;

    productService
      .getProducts({ page: 1, size: 8, sort: 'best_seller' })
      .then((data) => {
        const products = Array.isArray(data?.content) ? data.content : [];
        if (!active || products.length === 0) return;

        productPool = products.slice(0, 8).map(toPopupProduct);
      })
      .catch(() => {
        productPool = [fallbackProduct];
      });

    const showNextProduct = () => {
      if (!active || window.sessionStorage.getItem(salePopupConfig.storageKey) === '1') return;

      const nextProduct = productPool[productIndex % productPool.length] || fallbackProduct;
      productIndex += 1;
      setProduct(nextProduct);
      setSocialProof(createSocialProof());
      setVisible(true);
      trackPopup('popup_open');

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, salePopupConfig.visibleDurationMs);

      rotationTimerRef.current = window.setTimeout(showNextProduct, salePopupConfig.rotationMs);
    };

    showTimerRef.current = window.setTimeout(showNextProduct, salePopupConfig.delayMs);

    return () => {
      active = false;
      clearTimers();
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleChatOpened = () => {
      window.sessionStorage.setItem(salePopupConfig.storageKey, '1');
      clearTimers();
      setVisible(false);
    };
    window.addEventListener('huyperfume:chat-opened', handleChatOpened);

    return () => window.removeEventListener('huyperfume:chat-opened', handleChatOpened);
  }, []);

  const closePopup = () => {
    window.sessionStorage.setItem(salePopupConfig.storageKey, '1');
    clearTimers();
    setVisible(false);
    trackPopup('popup_close');
    window.dispatchEvent(new CustomEvent('huyperfume:sale-popup-closed'));
  };

  const handleCtaClick = () => {
    window.sessionStorage.setItem(salePopupConfig.storageKey, '1');
    clearTimers();
    trackPopup('popup_cta_click');
    window.dispatchEvent(new CustomEvent('huyperfume:sale-popup-closed'));
  };

  if (!visible) return null;

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const productPath = product.id ? `/products/${product.id}` : salePopupConfig.ctaFallbackPath;

  return (
    <aside className="sale-popup" aria-label="Thông báo sản phẩm vừa được mua">
      <button type="button" className="sale-popup-close" onClick={closePopup} aria-label="Đóng ưu đãi">
        <span aria-hidden="true">×</span>
      </button>

      <Link to={productPath} className="sale-popup-mark" onClick={handleCtaClick} aria-label={`Xem ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      </Link>

      <div className="sale-popup-content">
        <p className="sale-popup-eyebrow">Vừa có khách đặt mua</p>
        <h2>{product.name}</h2>
        <p className="sale-popup-brand">{product.brandName}</p>
        <div className="sale-popup-proof-list">
          <p className="sale-popup-proof">
            Đã được 1 người mua {socialProof.purchaseMinutesAgo} phút trước
          </p>
          <p className="sale-popup-proof sale-popup-viewers">
            {socialProof.viewerCount} người đang ghé xem sản phẩm này
          </p>
        </div>

        <Link to={productPath} className="btn luxury-primary-btn sale-popup-cta" onClick={handleCtaClick}>
          Xem ngay · {formatCurrency(effectivePrice)}
        </Link>
      </div>
    </aside>
  );
}
