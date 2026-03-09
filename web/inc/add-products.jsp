<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
    <title>Thêm sản phẩm mới</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <div class="card shadow mx-auto" style="max-width: 600px;">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0 text-center">THÊM SẢN PHẨM MỚI</h4>
            </div>
            <div class="card-body p-4">
                <form action="${pageContext.request.contextPath}/admin/product/add" method="POST">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Tên sản phẩm</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Giá bán (VND)</label>
                        <input type="number" name="price" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Tên file ảnh (trong assets/images/)</label>
                        <input type="text" name="image" class="form-control" placeholder="vi-du.png">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">ID Danh mục</label>
                            <input type="number" name="categoryId" class="form-control" value="1" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-bold">ID Thương hiệu</label>
                            <input type="number" name="brandId" class="form-control" value="1" required>
                        </div>
                    </div>
                    <div class="form-check mb-4">
                        <input type="checkbox" name="status" class="form-check-input" id="st" checked>
                        <label class="form-check-label" for="st">Kích hoạt bán hàng</label>
                    </div>
                    <div class="d-flex justify-content-between">
                        <a href="${pageContext.request.contextPath}/admin" class="btn btn-secondary">Quay lại</a>
                        <button type="submit" class="btn btn-success px-5">Lưu sản phẩm</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>