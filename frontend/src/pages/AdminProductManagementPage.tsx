import { Link } from 'react-router-dom';
import { AdminPageHeader } from '../components/Admin/AdminUi';

export function AdminProductManagementPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Product tools"
        title="Bảng điều khiển sản phẩm"
        description="Trang này là điểm điều phối nhanh để mở danh sách, tạo mới hoặc chuyển tới khu vực chỉnh sửa."
        action={<Link to="/admin/products" className="btn btn-dark">Đi tới sản phẩm</Link>}
      />

      <div className="row g-3">
        <div className="col-md-4">
          <div className="luxury-surface p-4 h-100">
            <h5>Danh sách sản phẩm</h5>
            <p className="mb-3">Xem toàn bộ catalog, lọc theo trạng thái và cập nhật tồn kho.</p>
            <Link to="/admin/products" className="btn btn-outline-dark">Mở danh sách</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="luxury-surface p-4 h-100">
            <h5>Thêm mới</h5>
            <p className="mb-3">Tạo sản phẩm mới trước khi hoàn thiện các thuộc tính nâng cao.</p>
            <Link to="/admin/products/add" className="btn btn-outline-dark">Tạo sản phẩm</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="luxury-surface p-4 h-100">
            <h5>Điều hướng nhanh</h5>
            <p className="mb-3">Quay lại dashboard hoặc chuyển sang đơn hàng / người dùng.</p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/admin" className="btn btn-outline-dark btn-sm">Dashboard</Link>
              <Link to="/admin/orders" className="btn btn-outline-dark btn-sm">Đơn hàng</Link>
              <Link to="/admin/users" className="btn btn-outline-dark btn-sm">Người dùng</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
