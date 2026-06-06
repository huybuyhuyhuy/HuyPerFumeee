import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatGrid,
  formatAdminDate,
} from '../components/Admin/AdminUi';
import {
  getAdminReviewDetail,
  getAdminReviews,
  hideReview,
  moderateReview,
  type AdminReview,
  type AdminReviewDetail,
  type AdminReviewStatus,
} from '../services/adminReviewApi';
import { useToast } from '../store/ToastContext';

const PAGE_SIZE = 12;

const STATUS_OPTIONS: Array<{ value: AdminReviewStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'FLAGGED', label: 'Đã ẩn' },
];

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    FLAGGED: 'Đã ẩn',
  };
  return labels[status] || status;
}

function getStatusClass(status: string) {
  if (status === 'APPROVED') return 'positive';
  if (status === 'REJECTED' || status === 'FLAGGED') return 'negative';
  return 'progress';
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return (
    <span className="admin-review-stars" aria-label={`${rounded} trên 5 sao`}>
      {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  return <span className={`admin-status-badge ${getStatusClass(status)}`}>{getStatusLabel(status)}</span>;
}

function ReviewModalShell({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="admin-supplier-modal-backdrop" role="presentation">
      <section className="admin-supplier-modal admin-review-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-supplier-modal-head">
          <div>
            <span className="admin-eyebrow">Đánh giá</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="admin-supplier-modal-close" aria-label="Đóng" onClick={onClose}>
            x
          </button>
        </header>
        <div className="admin-supplier-modal-body">{children}</div>
        {footer && <footer className="admin-supplier-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function AdminReviewsPage() {
  const { pushToast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState<AdminReviewStatus>('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE, totalElements: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<AdminReviewDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminReviews({ page, pageSize: PAGE_SIZE, status });
      setReviews(Array.isArray(data.content) ? data.content : []);
      setPagination({
        page: data.page || page,
        size: data.size || PAGE_SIZE,
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (requestError: any) {
      const message = getErrorMessage(requestError, 'Không tải được danh sách đánh giá.');
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, [page, status]);

  const stats = useMemo(() => {
    const pending = reviews.filter((review) => review.status === 'PENDING').length;
    const approved = reviews.filter((review) => review.status === 'APPROVED').length;
    const rejected = reviews.filter((review) => review.status === 'REJECTED' || review.status === 'FLAGGED').length;
    return [
      { label: 'Tổng đánh giá', value: pagination.totalElements.toLocaleString('vi-VN'), hint: 'Theo bộ lọc hiện tại', icon: '★' },
      { label: 'Chờ duyệt', value: pending.toLocaleString('vi-VN'), hint: 'Trên trang này', tone: 'warning', icon: 'P' },
      { label: 'Đã duyệt', value: approved.toLocaleString('vi-VN'), hint: 'Đang hiển thị public', tone: 'positive', icon: 'A' },
      { label: 'Từ chối/ẩn', value: rejected.toLocaleString('vi-VN'), hint: 'Trên trang này', tone: 'negative', icon: 'R' },
    ];
  }, [pagination.totalElements, reviews]);

  const openDetail = async (review: AdminReview) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await getAdminReviewDetail(review.id));
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không tải được chi tiết đánh giá.'), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
  };

  const handleModerate = async (review: AdminReview, nextStatus: 'APPROVED' | 'REJECTED' | 'FLAGGED') => {
    const note = nextStatus === 'APPROVED' ? 'Duyệt hiển thị public' : 'Không phù hợp để hiển thị public';
    setActionBusy(true);
    try {
      await moderateReview(review.id, nextStatus, note);
      pushToast(nextStatus === 'APPROVED' ? 'Đã duyệt đánh giá.' : 'Đã cập nhật trạng thái đánh giá.', 'success');
      closeDetail();
      await loadReviews();
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không cập nhật được đánh giá.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const handleHide = async (review: AdminReview) => {
    if (!window.confirm('Ẩn đánh giá này khỏi hệ thống?')) return;
    setActionBusy(true);
    try {
      await hideReview(review.id);
      pushToast('Đã ẩn đánh giá.', 'success');
      closeDetail();
      await loadReviews();
    } catch (requestError: any) {
      pushToast(getErrorMessage(requestError, 'Không ẩn được đánh giá.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const selectedReview = detail || null;

  return (
    <section className="admin-review-page">
      <AdminPageHeader
        eyebrow="Đánh giá"
        title="Quản lý đánh giá"
        description="Duyệt nhận xét khách hàng, kiểm soát nội dung public và theo dõi chất lượng trải nghiệm sau mua hàng."
        action={null}
      />

      <AdminStatGrid items={stats} />

      <form className="admin-filter-bar admin-review-filter-bar" onSubmit={(event) => event.preventDefault()}>
        <div className="admin-filter-field">
          <label htmlFor="review-status-filter">Trạng thái</label>
          <select
            id="review-status-filter"
            className="form-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminReviewStatus);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </form>

      {error && <div className="alert alert-danger admin-alert">{error}</div>}

      <section className="admin-table-panel admin-review-table-panel">
        <div className="admin-table-title">
          <div>
            <span className="admin-eyebrow">Danh sách</span>
            <h2>Nhận xét khách hàng</h2>
          </div>
          <strong className="admin-supplier-count">{pagination.totalElements.toLocaleString('vi-VN')} đánh giá</strong>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner-border" /> Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <AdminEmptyState title="Chưa có đánh giá phù hợp" description="Khi khách gửi nhận xét mới, danh sách duyệt sẽ hiển thị tại đây." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table admin-table admin-review-table align-middle">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Số sao</th>
                    <th>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Ngày gửi</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td>
                        <div className="admin-contact-cell">
                          <span>{review.userName || 'Khách hàng'}</span>
                          <small>{review.userEmail || `#${review.userId}`}</small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-review-product-cell">
                          <strong>{review.productName || `Sản phẩm #${review.productId}`}</strong>
                          {review.verifiedPurchase && <span>Đã mua hàng</span>}
                        </div>
                      </td>
                      <td><Stars rating={review.rating} /></td>
                      <td><strong>{review.title || '-'}</strong></td>
                      <td className="admin-review-comment-cell">{review.comment || '-'}</td>
                      <td><ReviewStatusBadge status={review.status} /></td>
                      <td>{formatAdminDate(review.createdAt)}</td>
                      <td>
                        <div className="admin-row-actions justify-content-end">
                          <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => void openDetail(review)}>
                            Chi tiết
                          </button>
                          {review.status === 'PENDING' && (
                            <>
                              <button type="button" className="btn btn-sm luxury-primary-btn" disabled={actionBusy} onClick={() => void handleModerate(review, 'APPROVED')}>
                                Duyệt
                              </button>
                              <button type="button" className="btn btn-sm btn-outline-danger" disabled={actionBusy} onClick={() => void handleModerate(review, 'REJECTED')}>
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onChange={setPage}
            />
          </>
        )}
      </section>

      {(detailLoading || selectedReview) && (
        <ReviewModalShell
          title={selectedReview ? selectedReview.title || `Đánh giá #${selectedReview.id}` : 'Chi tiết đánh giá'}
          onClose={closeDetail}
          footer={selectedReview && (
            <>
              <button type="button" className="btn btn-outline-dark" onClick={closeDetail}>Đóng</button>
              {selectedReview.status === 'PENDING' && (
                <>
                  <button type="button" className="btn luxury-primary-btn" disabled={actionBusy} onClick={() => void handleModerate(selectedReview, 'APPROVED')}>
                    Duyệt
                  </button>
                  <button type="button" className="btn btn-outline-danger" disabled={actionBusy} onClick={() => void handleModerate(selectedReview, 'REJECTED')}>
                    Từ chối
                  </button>
                </>
              )}
              <button type="button" className="btn btn-outline-danger" disabled={actionBusy} onClick={() => void handleHide(selectedReview)}>
                Ẩn
              </button>
            </>
          )}
        >
          {detailLoading ? (
            <div className="admin-loading"><div className="spinner-border" /> Đang tải chi tiết...</div>
          ) : selectedReview ? (
            <div className="admin-review-detail">
              <div className="admin-review-detail-head">
                <div>
                  <span className="admin-eyebrow">Khách hàng</span>
                  <h3>{selectedReview.user?.name || selectedReview.userName || 'Khách hàng'}</h3>
                  <p>{selectedReview.user?.email || selectedReview.userEmail || `#${selectedReview.userId}`}</p>
                </div>
                <ReviewStatusBadge status={selectedReview.status} />
              </div>
              <div className="admin-review-detail-grid">
                <article><span>Sản phẩm</span><strong>{selectedReview.product?.name || selectedReview.productName || `#${selectedReview.productId}`}</strong></article>
                <article><span>Số sao</span><strong><Stars rating={selectedReview.rating} /></strong></article>
                <article><span>Ngày gửi</span><strong>{formatAdminDate(selectedReview.createdAt)}</strong></article>
                <article><span>Xác thực</span><strong>{selectedReview.verifiedPurchase ? 'Đã mua hàng' : 'Chưa xác thực đơn'}</strong></article>
              </div>
              <div className="admin-review-detail-copy">
                <span>Tiêu đề</span>
                <strong>{selectedReview.title || '-'}</strong>
                <span>Nội dung</span>
                <p>{selectedReview.comment || '-'}</p>
                {selectedReview.moderationNote && (
                  <>
                    <span>Ghi chú kiểm duyệt</span>
                    <p>{selectedReview.moderationNote}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <AdminEmptyState title="Không tải được chi tiết" description="Vui lòng đóng modal và thử lại." />
          )}
        </ReviewModalShell>
      )}
    </section>
  );
}
