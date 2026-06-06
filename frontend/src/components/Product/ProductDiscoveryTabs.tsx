import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, ProductReview, ProductReviewSummary } from '../../types';

const TAB_KEYS = ['reviews', 'description', 'specs', 'policy'];

type ProductDiscoveryTabsProps = {
  product?: Product | null;
  reviews?: ProductReview[];
  reviewSummary?: ProductReviewSummary | null;
  reviewComposer?: ReactNode;
};

function formatDate(value?: string | null) {
  if (!value) return 'Vừa gửi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa gửi';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatNumber(value: unknown) {
  return Math.round(Number(value || 0)).toLocaleString('vi-VN');
}

function renderStars(value: unknown) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

export function ProductDiscoveryTabs({ product, reviews = [], reviewSummary = null, reviewComposer = null }: ProductDiscoveryTabsProps) {
  const averageRating = Number(reviewSummary?.ratingAverage || product?.rating || 0);
  const reviewCount = Number(reviewSummary?.reviewCount || product?.reviewCount || reviews.length || 0);
  const soldCount = Number(reviewSummary?.soldCount || product?.soldCount || 0);
  const breakdown = useMemo(
    () => reviewSummary?.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    [reviewSummary?.ratingBreakdown],
  );

  const tabs = useMemo(() => ([
    {
      id: 'reviews',
      label: 'Đánh giá',
      content: (
        <div className="product-review-section" id="product-reviews">
          <div className="product-review-section-head">
            <span className="story-eyebrow">Nhận xét khách hàng</span>
            <h2>Đánh giá sản phẩm</h2>
            <p>Những cảm nhận đã được kiểm duyệt từ khách hàng mua tại HuyPerfume.</p>
          </div>

          <div className="product-review-overview">
            <div className="product-review-score-card">
              <span>Điểm trung bình</span>
              <strong>{averageRating.toFixed(1)}/5</strong>
              <div className="product-rating-stars product-rating-stars-large" aria-label={`Đánh giá ${averageRating.toFixed(1)} trên 5`}>
                {renderStars(averageRating)}
              </div>
              <p>{formatNumber(reviewCount)} đánh giá{soldCount > 0 ? ` · ${formatNumber(soldCount)} đã bán` : ''}</p>
            </div>

            <div className="product-review-breakdown" aria-label="Phân bổ số sao">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = Number(breakdown[star as 1 | 2 | 3 | 4 | 5] || 0);
                const width = reviewCount > 0 ? Math.max(6, (count / reviewCount) * 100) : 0;
                return (
                  <div key={star} className="product-review-breakdown-row">
                    <span>{star} sao</span>
                    <span className="product-review-breakdown-track">
                      <span className="product-review-breakdown-fill" style={{ width: `${width}%` }} />
                    </span>
                    <small>{formatNumber(count)}</small>
                  </div>
                );
              })}
            </div>
          </div>

          {reviewComposer}

          {reviews.length > 0 ? (
            <div className="product-review-list">
              {reviews.map((review) => (
                <article key={review.id} className="product-review-item">
                  <header className="product-review-item-head">
                    <div>
                      <strong>{review.user?.name || 'Khách hàng'}</strong>
                      <time dateTime={review.createdAt || undefined}>{formatDate(review.createdAt)}</time>
                    </div>
                    <div className="product-review-item-meta">
                      {(review.verifiedPurchase || review.isVerifiedPurchase || review.orderId) && (
                        <span className="product-review-verified">Đã mua hàng</span>
                      )}
                      <span className="product-rating-stars" aria-label={`${review.rating} trên 5 sao`}>
                        {renderStars(review.rating)}
                      </span>
                    </div>
                  </header>
                  {review.title && <h3>{review.title}</h3>}
                  {review.comment && <p>{review.comment}</p>}
                </article>
              ))}
            </div>
          ) : (
            <div className="product-review-empty-state">
              <strong>Chưa có đánh giá nào cho sản phẩm này.</strong>
              <p>Hãy là người đầu tiên đánh giá sau khi mua hàng.</p>
            </div>
          )}
        </div>
      ),
    },
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
      id: 'policy',
      label: 'Đổi trả',
      content: (
        <div className="story-copy">
          <p>Cam kết đổi trả minh bạch, đóng gói kỹ lưỡng và hỗ trợ nếu phát hiện lỗi sản phẩm.</p>
          <p className="mb-0">Áp dụng cho sản phẩm còn nguyên seal, đúng điều kiện đổi trả của shop.</p>
        </div>
      ),
    },
  ]), [product, reviews, reviewSummary, reviewComposer, averageRating, reviewCount, soldCount, breakdown]);

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
