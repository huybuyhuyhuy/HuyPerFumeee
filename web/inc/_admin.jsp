<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title != null ? title : "Quản Trị Sản Phẩm"}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        .list-group-item.active { background-color: #212529; border-color: #212529; }
        .sidebar { min-height: 80vh; }
        .nav-link:hover { color: #ffc107 !important; }
    </style>
</head>
<body class="bg-light">

    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div class="container-fluid">
            <a class="navbar-brand fw-bold" href="${pageContext.request.contextPath}/admin">HUY PERFUME</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">DANH MỤC</a>
                        <ul class="dropdown-menu">
                            <c:forEach items="${listCategories}" var="cat">
                                <li><a class="dropdown-item" href="admin?categoryId=${cat.id}">${cat.name}</a></li>
                            </c:forEach>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">THƯƠNG HIỆU</a>
                        <ul class="dropdown-menu">
                            <c:forEach items="${listBrands}" var="b">
                                <li><a class="dropdown-item" href="admin?brandId=${b.id}">${b.name}</a></li>
                            </c:forEach>
                        </ul>
                    </li>
                </ul>
                
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link text-warning fw-bold" href="${pageContext.request.contextPath}/logout" 
                           onclick="return confirm('Bạn có chắc chắn muốn đăng xuất không?')">
                            <i class="fas fa-sign-out-alt me-1"></i> ĐĂNG XUẤT
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row px-3">
            <div class="col-md-3">
                <div class="card shadow-sm sidebar">
                    <div class="card-header bg-secondary text-white fw-bold">BỘ LỌC TÌM KIẾM</div>
                    <div class="list-group list-group-flush">
                        <a href="admin" class="list-group-item list-group-item-action fw-bold py-3">🏠 TẤT CẢ SẢN PHẨM</a>
                        
                        <div class="p-3 bg-light fw-bold text-muted small text-uppercase">Danh Mục</div>
                        <c:forEach items="${listCategories}" var="cat">
                            <a href="admin?categoryId=${cat.id}" class="list-group-item list-group-item-action ${param.categoryId == cat.id ? 'active' : ''}">📂 ${cat.name}</a>
                        </c:forEach>

                        <div class="p-3 bg-light fw-bold text-muted small text-uppercase mt-2">Thương Hiệu</div>
                        <c:forEach items="${listBrands}" var="b">
                            <a href="admin?brandId=${b.id}" class="list-group-item list-group-item-action ${param.brandId == b.id ? 'active' : ''}">✨ ${b.name}</a>
                        </c:forEach>
                        
                        <a href="${pageContext.request.contextPath}/logout" class="list-group-item list-group-item-action text-danger mt-5" onclick="return confirm('Đăng xuất?')">
                            <i class="fas fa-power-off me-2"></i>Thoát hệ thống
                        </a>
                    </div>
                </div>
            </div>

            <div class="col-md-9">
                <!-- BIỂU ĐỒ THỐNG KÊ BÁN HÀNG -->
                <div class="card shadow mb-4">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h5 class="mb-1 fw-bold">Thống kê bán hàng</h5>
                            <small class="text-muted">
                                Hôm nay có 
                                <span class="fw-bold text-success">
                                    ${todayUserOrderCount}
                                </span> 
                                khách đã đặt hàng
                            </small>
                        </div>
                        <select id="chartRange" class="form-select form-select-sm" style="width: auto;">
                            <option value="day">Theo ngày</option>
                            <option value="week">Theo tuần</option>
                            <option value="month">Theo tháng</option>
                            <option value="year">Theo năm</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <canvas id="salesChart" height="90"></canvas>
                    </div>
                </div>

                <!-- DANH SÁCH SẢN PHẨM -->
                <div class="card shadow">
                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                        <h5 class="mb-0 fw-bold">DANH SÁCH SẢN PHẨM</h5>
                        <a href="${pageContext.request.contextPath}/admin/product/add" class="btn btn-success btn-sm">+ Thêm mới</a>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover table-bordered align-middle">
                                <thead class="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Hình</th>
                                        <th>Tên</th>
                                        <th>Giá</th>
                                        <th>Trạng thái</th>
                                        <th class="text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <c:forEach items="${listProducts}" var="p">
                                        <tr>
                                            <td>${p.id}</td>
                                            <td><img src="${pageContext.request.contextPath}/assets/images/${p.image}" width="50" class="rounded border"></td>
                                            <td class="fw-bold">${p.name}</td>
                                            <td class="text-danger">${p.price} VNĐ</td>
                                            <td>${p.status ? '<span class="badge bg-success">Hiện</span>' : '<span class="badge bg-secondary">Ẩn</span>'}</td>
                                            <td class="text-center">
                                                <a href="admin/product/edit?id=${p.id}" class="btn btn-sm btn-warning">Sửa</a>
                                                <a href="admin/product/delete?id=${p.id}" class="btn btn-sm btn-danger" onclick="return confirm('Xóa?')">Xóa</a>
                                            </td>
                                        </tr>
                                    </c:forEach>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    const dataDayLabels = [
        <c:forEach items="${salesByDay}" var="e" varStatus="st">
            '${e.key}'${!st.last ? ',' : ''}
        </c:forEach>
    ];
    const dataDayValues = [
        <c:forEach items="${salesByDay}" var="e" varStatus="st">
            ${e.value}${!st.last ? ',' : ''}
        </c:forEach>
    ];

    const dataWeekLabels = [
        <c:forEach items="${salesByWeek}" var="e" varStatus="st">
            '${e.key}'${!st.last ? ',' : ''}
        </c:forEach>
    ];
    const dataWeekValues = [
        <c:forEach items="${salesByWeek}" var="e" varStatus="st">
            ${e.value}${!st.last ? ',' : ''}
        </c:forEach>
    ];

    const dataMonthLabels = [
        <c:forEach items="${salesByMonth}" var="e" varStatus="st">
            '${e.key}'${!st.last ? ',' : ''}
        </c:forEach>
    ];
    const dataMonthValues = [
        <c:forEach items="${salesByMonth}" var="e" varStatus="st">
            ${e.value}${!st.last ? ',' : ''}
        </c:forEach>
    ];

    const dataYearLabels = [
        <c:forEach items="${salesByYear}" var="e" varStatus="st">
            '${e.key}'${!st.last ? ',' : ''}
        </c:forEach>
    ];
    const dataYearValues = [
        <c:forEach items="${salesByYear}" var="e" varStatus="st">
            ${e.value}${!st.last ? ',' : ''}
        </c:forEach>
    ];

    const ctx = document.getElementById('salesChart').getContext('2d');
    const chartConfig = {
        type: 'line',
        data: {
            labels: dataDayLabels,
            datasets: [{
                label: 'Số lượng sản phẩm bán ra',
                data: dataDayValues,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13,110,253,0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const salesChart = new Chart(ctx, chartConfig);

    document.getElementById('chartRange').addEventListener('change', function () {
        const type = this.value;
        if (type === 'day') {
            salesChart.data.labels = dataDayLabels;
            salesChart.data.datasets[0].data = dataDayValues;
        } else if (type === 'week') {
            salesChart.data.labels = dataWeekLabels;
            salesChart.data.datasets[0].data = dataWeekValues;
        } else if (type === 'month') {
            salesChart.data.labels = dataMonthLabels;
            salesChart.data.datasets[0].data = dataMonthValues;
        } else if (type === 'year') {
            salesChart.data.labels = dataYearLabels;
            salesChart.data.datasets[0].data = dataYearValues;
        }
        salesChart.update();
    });
</script>
</html>