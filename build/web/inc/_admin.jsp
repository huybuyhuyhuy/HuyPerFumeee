<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title != null ? title : "Quản Trị Hệ Thống | Huy Perfume"}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --admin-primary: #003D2E;
            --admin-secondary: #005e47;
            --admin-bg: #f4f7f6;
            --sidebar-width: 260px;
        }
        body { font-family: 'Inter', sans-serif; background-color: var(--admin-bg); color: #333; }
        
        /* Sidebar Style */
        .sidebar-lux {
            width: var(--sidebar-width);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            background: var(--admin-primary);
            color: white;
            z-index: 1000;
            transition: all 0.3s;
            box-shadow: 4px 0 10px rgba(0,0,0,0.1);
        }
        .sidebar-brand {
            padding: 30px 25px;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 1px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-menu { padding: 20px 0; }
        .menu-item {
            padding: 12px 25px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: rgba(255,255,255,0.7);
            text-decoration: none;
            transition: 0.3s;
            font-size: 14px;
            font-weight: 500;
        }
        .menu-item:hover, .menu-item.active {
            color: white;
            background: rgba(255,255,255,0.1);
            border-left: 4px solid #ffc107;
        }
        .menu-label {
            padding: 20px 25px 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255,255,255,0.4);
            font-weight: 700;
        }

        /* Main Content */
        .main-lux {
            margin-left: var(--sidebar-width);
            padding: 30px;
            transition: all 0.3s;
        }
        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            background: white;
            padding: 15px 30px;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        
        /* Card Lux */
        .card-lux {
            border: none;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
            background: white;
            overflow: hidden;
            margin-bottom: 30px;
        }
        .card-lux-header {
            padding: 20px 25px;
            background: white;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        /* Stats Widget */
        .stat-card {
            background: linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-secondary) 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
        }
        .stat-card i {
            position: absolute;
            right: -10px;
            bottom: -10px;
            font-size: 80px;
            opacity: 0.1;
        }

        /* Table Style */
        .table-lux thead th {
            background: #f8f9fa;
            border: none;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 15px;
            color: #888;
        }
        .table-lux tbody td {
            padding: 15px;
            vertical-align: middle;
            border-bottom: 1px solid #f9f9f9;
            font-size: 14px;
        }
        .product-img-td {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 8px;
        }
        
        /* Buttons */
        .btn-lux-primary {
            background: var(--admin-primary);
            color: white;
            border-radius: 10px;
            padding: 8px 20px;
            font-weight: 600;
            border: none;
            transition: 0.3s;
        }
        .btn-lux-primary:hover {
            background: var(--admin-secondary);
            color: white;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>

    <!-- Sidebar -->
    <div class="sidebar-lux">
        <div class="sidebar-brand">
            <i class="fas fa-crown text-warning me-2"></i>HUY ADMIN
        </div>
        <div class="sidebar-menu">
            <div class="menu-label">Tổng quan</div>
            <a href="admin" class="menu-item active">
                <i class="fas fa-th-large"></i> Dashboard
            </a>
            <a href="home" class="menu-item">
                <i class="fas fa-external-link-alt"></i> Xem Website
            </a>

            <div class="menu-label">Quản lý</div>
            <a href="admin?type=products" class="menu-item">
                <i class="fas fa-box"></i> Sản phẩm
            </a>
            <a href="admin?type=orders" class="menu-item">
                <i class="fas fa-shopping-cart"></i> Đơn hàng
            </a>
            <a href="admin?type=users" class="menu-item">
                <i class="fas fa-users"></i> Khách hàng
            </a>

            <div class="menu-label">Hệ thống</div>
            <a href="admin?type=settings" class="menu-item">
                <i class="fas fa-cog"></i> Cài đặt
            </a>
            <a href="${pageContext.request.contextPath}/logout" class="menu-item text-danger mt-5">
                <i class="fas fa-sign-out-alt"></i> Đăng xuất
            </a>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-lux">
        <div class="top-header">
            <h4 class="m-0 fw-bold">Bảng điều khiển</h4>
            <div class="d-flex align-items-center gap-3">
                <span class="small text-muted">Xin chào, <strong>Admin</strong></span>
                <img src="https://ui-avatars.com/api/?name=Admin&background=003D2E&color=fff" class="rounded-circle" width="35">
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-8">
                <!-- BIỂU ĐỒ -->
                <div class="card-lux">
                    <div class="card-lux-header">
                        <h6 class="m-0 fw-bold">Thống kê doanh thu</h6>
                        <select id="chartRange" class="form-select form-select-sm w-auto border-0 bg-light">
                            <option value="day">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="year">Năm nay</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <canvas id="salesChart" height="120"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card h-100">
                    <h6 class="text-uppercase opacity-75 small fw-bold">Đơn hàng mới</h6>
                    <h2 class="display-5 fw-bold my-3">${todayUserOrderCount}</h2>
                    <p class="m-0 small">Khách hàng đã đặt trong ngày</p>
                    <i class="fas fa-shopping-bag"></i>
                </div>
            </div>
        </div>

        <!-- DANH SÁCH SẢN PHẨM -->
        <div class="card-lux">
            <div class="card-lux-header">
                <h6 class="m-0 fw-bold">Danh sách sản phẩm</h6>
                <a href="${pageContext.request.contextPath}/admin/product/add" class="btn-lux-primary btn-sm">
                    <i class="fas fa-plus me-2"></i>Thêm sản phẩm
                </a>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-lux m-0">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Giá bán</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:forEach items="${listProducts}" var="p">
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-3">
                                            <img src="${pageContext.request.contextPath}/assets/images/${p.image}" class="product-img-td border">
                                            <div>
                                                <div class="fw-bold">${p.name}</div>
                                                <div class="text-muted small">ID: #${p.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="fw-bold text-success">
                                        <fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ
                                    </td>
                                    <td>
                                        <c:choose>
                                            <c:when test="${p.status}">
                                                <span class="badge rounded-pill bg-success-subtle text-success px-3">Đang hiện</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="badge rounded-pill bg-secondary-subtle text-secondary px-3">Đang ẩn</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td class="text-end">
                                        <a href="admin/product/edit?id=${p.id}" class="btn btn-sm btn-outline-primary border-0"><i class="fas fa-edit"></i></a>
                                        <a href="admin/product/delete?id=${p.id}" class="btn btn-sm btn-outline-danger border-0" onclick="return confirm('Xóa sản phẩm này?')"><i class="fas fa-trash"></i></a>
                                    </td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Copy logic Chart từ bản cũ sang (đảm bảo dữ liệu vẫn chạy)
        const dataDayLabels = [<c:forEach items="${salesByDay}" var="e" varStatus="st">'${e.key}'${!st.last ? ',' : ''}</c:forEach>];
        const dataDayValues = [<c:forEach items="${salesByDay}" var="e" varStatus="st">${e.value}${!st.last ? ',' : ''}</c:forEach>];
        const dataWeekLabels = [<c:forEach items="${salesByWeek}" var="e" varStatus="st">'${e.key}'${!st.last ? ',' : ''}</c:forEach>];
        const dataWeekValues = [<c:forEach items="${salesByWeek}" var="e" varStatus="st">${e.value}${!st.last ? ',' : ''}</c:forEach>];
        const dataMonthLabels = [<c:forEach items="${salesByMonth}" var="e" varStatus="st">'${e.key}'${!st.last ? ',' : ''}</c:forEach>];
        const dataMonthValues = [<c:forEach items="${salesByMonth}" var="e" varStatus="st">${e.value}${!st.last ? ',' : ''}</c:forEach>];
        const dataYearLabels = [<c:forEach items="${salesByYear}" var="e" varStatus="st">'${e.key}'${!st.last ? ',' : ''}</c:forEach>];
        const dataYearValues = [<c:forEach items="${salesByYear}" var="e" varStatus="st">${e.value}${!st.last ? ',' : ''}</c:forEach>];

        const ctx = document.getElementById('salesChart').getContext('2d');
        const salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataDayLabels,
                datasets: [{
                    label: 'Số lượng bán',
                    data: dataDayValues,
                    borderColor: '#003D2E',
                    backgroundColor: 'rgba(0,61,46,0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });

        document.getElementById('chartRange').addEventListener('change', function() {
            const type = this.value;
            if(type === 'day') { salesChart.data.labels = dataDayLabels; salesChart.data.datasets[0].data = dataDayValues; }
            else if(type === 'week') { salesChart.data.labels = dataWeekLabels; salesChart.data.datasets[0].data = dataWeekValues; }
            else if(type === 'month') { salesChart.data.labels = dataMonthLabels; salesChart.data.datasets[0].data = dataMonthValues; }
            else if(type === 'year') { salesChart.data.labels = dataYearLabels; salesChart.data.datasets[0].data = dataYearValues; }
            salesChart.update();
        });
    </script>
</body>
</html>
