import { useEffect, useMemo, useState } from 'react';

const TAB_KEYS = ['description', 'specs', 'reviews', 'policy'];

export function ProductDiscoveryTabs({ product, reviews = [] }) {
  const tabs = useMemo(() => ([
    {
      id: 'description',
      label: 'Mô tả',
      content: (
        <div className="story-copy">
          <p>{product?.description || 'Mô tả sản phẩm đang được cập nhật. Hương thơm này được tuyển chọn để giữ cảm giác sang trọng, dễ đeo và giàu tính biểu cảm.'}</p>
          <div className="occasion-chips mt-3">
            <span className="occasion-chip">Thanh lịch ban ngày</span>
            <span className="occasion-chip">Dấu ấn buổi tối</span>
            <span className="occasion-chip">Phù hợp làm quà</span>
          </div>
        </div>
      ),
    },
    {
      id: 'specs',
      label: 'Thông số',
      content: (
        <div className="scent-pyramid">
          <div><strong>Thương hiệu</strong><span>{product?.brand?.name || '—'}</span></div>
          <div><strong>Giới tính</strong><span>{product?.gender || '—'}</span></div>
          <div><strong>Tầng hương</strong><span>{product?.scentNotes ? String(product.scentNotes).replaceAll('|', ' · ') : '—'}</span></div>
          <div><strong>Dung tích</strong><span>{product?.volumeMl ? `${product.volumeMl}ml` : '—'}</span></div>
          <div><strong>Nồng độ</strong><span>{product?.concentration || '—'}</span></div>
        </div>
      ),
    },
    {
      id: 'reviews',
      label: 'Đánh giá',
      content: (
        <div className="story-copy">
          <p className="mb-2">{product?.reviewCount || 0} đánh giá và {product?.soldCount || 0} lượt bán cho thấy đây là lựa chọn được tin tưởng.</p>
          {reviews.length > 0 ? (
            <div className="d-grid gap-3 mt-3">
              {reviews.map((review) => (
                <article key={review.id} className="product-review-item">
                  <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
                    <strong>{review.user?.name || 'Khách hàng'}</strong>
                    <span className="product-rating-stars">{'★'.repeat(Math.max(0, Math.round(review.rating || 0)))}</span>
                  </div>
                  {review.title && <p className="mb-1 fw-semibold">{review.title}</p>}
                  {review.comment && <p className="mb-0">{review.comment}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="mb-0">Chưa có review đã duyệt cho sản phẩm này.</p>
          )}
        </div>
      ),
    },
    {
      id: 'policy',
      label: 'Đổi trả',
      content: (
        <div className="story-copy">
          <p>Cam kết đổi trả minh bạch, đóng gói kỹ lưỡng và hỗ trợ nếu phát hiện lỗi sản phẩm.</p>
          <p className="mb-0">Áp dụng cho sản phẩm còn nguyên seal, đúng điều kiện đổi trả của shop.</p>
        </div>
      ),
    },
  ]), [product, reviews]);

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeIndex = TAB_KEYS.indexOf(activeTab);

  useEffect(() => {
    setActiveTab(tabs[0].id);
  }, [tabs]);

  return (
    <section className="luxury-surface product-tabs-section mt-4 product-fade-in is-visible">
      <div className="product-tabs" role="tablist" aria-label="Thông tin sản phẩm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`product-tab-${tab.id}`}
            aria-controls={`product-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={`product-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') setActiveTab(TAB_KEYS[(activeIndex + 1) % TAB_KEYS.length]);
              if (event.key === 'ArrowLeft') setActiveTab(TAB_KEYS[(activeIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length]);
              if (event.key === 'Home') setActiveTab(TAB_KEYS[0]);
              if (event.key === 'End') setActiveTab(TAB_KEYS[TAB_KEYS.length - 1]);
            }}
          >
            {tab.label}
          </button>
        ))}
        <span className="product-tab-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      </div>
      <div id={`product-panel-${activeTab}`} className="product-tab-panel" role="tabpanel" aria-labelledby={`product-tab-${activeTab}`}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </section>
  );
}
