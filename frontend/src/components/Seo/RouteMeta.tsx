import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteMetaConfig {
  title: string;
  description: string;
  robots?: string;
}

const DEFAULT_META: RouteMetaConfig = {
  title: 'Huy Perfume - Nước Hoa Chính Hãng',
  description: 'Khám phá nước hoa chính hãng, bộ sưu tập tinh tuyển và trải nghiệm mua sắm sang trọng tại Huy Perfume.',
  robots: 'index,follow',
};

function getRouteMeta(pathname: string): RouteMetaConfig {
  if (pathname === '/') {
    return {
      title: 'Huy Perfume - Nước Hoa Chính Hãng',
      description: 'Khám phá bộ sưu tập nước hoa chính hãng cho nam, nữ và unisex tại Huy Perfume.',
      robots: 'index,follow',
    };
  }

  if (pathname === '/products') {
    return {
      title: 'Sản phẩm nước hoa | Huy Perfume',
      description: 'Duyệt danh mục nước hoa, lọc theo thương hiệu, mức giá và tìm mùi hương phù hợp.',
      robots: 'index,follow',
    };
  }

  if (pathname.startsWith('/products/')) {
    return {
      title: 'Chi tiết sản phẩm | Huy Perfume',
      description: 'Xem thông tin, giá bán và chi tiết mùi hương của sản phẩm tại Huy Perfume.',
      robots: 'index,follow',
    };
  }

  if (pathname === '/wishlist') {
    return {
      title: 'Danh sách yêu thích | Huy Perfume',
      description: 'Những mùi hương bạn đã lưu để xem lại sau.',
      robots: 'noindex,nofollow',
    };
  }

  if (pathname === '/login' || pathname === '/register') {
    return {
      title: pathname === '/login' ? 'Đăng nhập | Huy Perfume' : 'Đăng ký | Huy Perfume',
      description: 'Truy cập tài khoản Huy Perfume.',
      robots: 'noindex,nofollow',
    };
  }

  if (
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/admin')
  ) {
    return {
      title: 'Huy Perfume',
      description: 'Khu vực tài khoản Huy Perfume.',
      robots: 'noindex,nofollow',
    };
  }

  return DEFAULT_META;
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

function upsertCanonical(href: string) {
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', href);
}

export function RouteMeta() {
  const location = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    const canonical = `${window.location.origin}${location.pathname}`;

    document.title = meta.title;
    upsertMeta('meta[name="description"]', { name: 'description', content: meta.description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: meta.robots || DEFAULT_META.robots || 'index,follow' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
    upsertCanonical(canonical);
  }, [location.pathname]);

  return null;
}
