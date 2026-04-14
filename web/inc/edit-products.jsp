<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
    <title>Sửa sản phẩm</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="card shadow mx-auto" style="max-width: 600px;">
            <div class="card-header bg-warning text-dark text-center">
                <h4 class="mb-0">CẬP NHẬT SẢN PHẨM #${product.id}</h4>
            </div>
            <div class="card-body p-4">
                <form action="${pageContext.request.contextPath}/admin/product/edit" method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="id" value="${product.id}">
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Tên sản phẩm</label>
                        <input type="text" name="name" class="form-control" value="${product.name}" required>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">Giá gốc (VND)</label>
                            <input type="number" name="price" class="form-control" value="${product.price}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">Giá khuyến mãi (VND)</label>
                            <input type="number" name="discount_price" class="form-control" value="${product.discount_price}">
                            <small class="text-muted">Nhập 0 nếu không có khuyến mãi</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Ảnh hiện tại</label>
                        <input type="text" name="image" class="form-control" value="${product.image}">
                        <small class="text-muted">Giữ nguyên nếu không muốn đổi ảnh.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Upload ảnh mới</label>
                        <input type="file" name="imageFile" class="form-control" accept=".jpg,.jpeg,.png,.webp,.gif">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Số lượng tồn kho</label>
                        <input type="number" name="stock" class="form-control" value="${product.stock}" min="0" required>
                    </div>

                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">ID Danh mục</label>
                            <input type="number" name="categoryId" class="form-control" value="${product.id_category}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">ID Thương hiệu</label>
                            <input type="number" name="brandId" class="form-control" value="${product.id_brand}" required>
                        </div>
                    </div>

                    <div class="form-check mb-4">
                        <input type="checkbox" name="status" class="form-check-input" id="st" ${product.status ? 'checked' : ''}>
                        <label class="form-check-label" for="st">Đang kinh doanh</label>
                    </div>

                    <div class="d-flex justify-content-between">
                        <a href="${pageContext.request.contextPath}/admin" class="btn btn-secondary">Hủy bỏ</a>
                        <button type="submit" class="btn btn-warning px-5">Cập nhật ngay</button>
                    </div>
                </form> </div>
        </div>
    </div>
</body>
</html>