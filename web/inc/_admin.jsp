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
            --sidebar-width: 250px;
        }
        body { font-family: 'Inter', sans-serif; background-color: var(--admin-bg); color: #333; }
        
        /* Layout */
        .admin-container { display: flex; min-height: 100vh; }
        
        /* Sidebar */
        .admin-sidebar {
            width: var(--sidebar-width);
            background: #fff;
            border-right: 1px solid #e0e0e0;
            padding: 20px;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
        }
        .sidebar-title { font-weight: 800; color: var(--admin-primary); margin-bottom: 25px; font-size: 1.2rem; }
        .filter-section { margin-bottom: 30px; }
        .filter-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 12px; display: block; letter-spacing: 1px; }
        .filter-list { list-style: none; padding: 0; margin: 0; }
        .filter-item { margin-bottom: 5px; }
        .filter-link { 
            display: block; 
            padding: 8px 12px; 
            color: #555; 
            text-decoration: none; 
            border-radius: 6px; 
            font-size: 0.9rem;
            transition: 0.2s;
        }
        .filter-link:hover { background: #f0f0f0; color: var(--admin-primary); }
        .filter-link.active { background: var(--admin-primary); color: #fff; }

        /* Main Content */
        .admin-main { flex: 1; padding: 30px; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        
        /* Stats Cards */
        .stats-row { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-card { 
            background: #fff; 
            padding: 20px; 
            border-radius: 12px; 
            flex: 1; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            border: 1px solid #eee;
        }
        .stat-card .label { font-size: 0.8rem; color: #888; margin-bottom: 5px; display: block; }
        .stat-card .value { font-size: 1.5rem; font-weight: 800; color: #333; }

        /* Chart Section */
        .chart-container { 
            background: #fff; 
            padding: 25px; 
            border-radius: 15px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            margin-bottom: 35px;
            border: 1px solid #eee;
        }
        
        /* Table */
        .product-table-container { 
            background: #fff; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
            overflow: hidden;
            border: 1px solid #eee;
        }
        .table thead th { background: #fafafa; border-bottom: 1px solid #eee; padding: 15px; font-size: 0.8rem; text-transform: uppercase; color: #888; }
        .table tbody td { padding: 15px; vertical-align: middle; border-bottom: 1px solid #f5f5f5; }
        
        /* Toggle Switch */
        .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #28a745; }
        input:checked + .slider:before { transform: translateX(20px); }
    </style>
</head>
<body>

    <div class="admin-container">
        <!-- Sidebar: Khôi phục lại phần lọc cũ -->
        <aside class="admin-sidebar">
            <div class="sidebar-title">HUY PERFUME</div>
            
            <div class="filter-section">
                <a href="admin?type=statistics" class="filter-link ${viewType == 'statistics' ? 'active' : ''}">
                    <i class="fas fa-chart-line me-2"></i> Thống kê hệ thống
                </a>
                <a href="admin?type=orders" class="filter-link ${viewType == 'orders' ? 'active' : ''}">
                    <i class="fas fa-shopping-cart me-2"></i> Quản lý đơn hàng
                </a>
                <a href="admin?type=products" class="filter-link ${viewType == 'products' && empty param.categoryId && empty param.brandId ? 'active' : ''}">
                    <i class="fas fa-box me-2"></i> Quản lý kho hàng
                </a>
            </div>

            <c:if test="${viewType == 'products'}">
                <div class="filter-section">
                    <span class="filter-label">Danh mục</span>
                    <ul class="filter-list">
                        <c:forEach items="${listCategories}" var="c">
                            <li class="filter-item">
                                <a href="admin?type=products&categoryId=${c.id}" class="filter-link ${param.categoryId == c.id ? 'active' : ''}">
                                    ${c.name}
                                </a>
                            </li>
                        </c:forEach>
                    </ul>
                </div>

                <div class="filter-section">
                    <span class="filter-label">Thương hiệu</span>
                    <ul class="filter-list">
                        <c:forEach items="${listBrands}" var="b">
                            <li class="filter-item">
                                <a href="admin?type=products&brandId=${b.id}" class="filter-link ${param.brandId == b.id ? 'active' : ''}">
                                    ${b.name}
                                </a>
                            </li>
                        </c:forEach>
                    </ul>
                </div>
            </c:if>

            <div class="mt-5 pt-4 border-top">
                <a href="${pageContext.request.contextPath}/logout" class="filter-link text-danger">
                    <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="admin-main">
            <div class="admin-header">
                <h4 class="fw-800 m-0">${title}</h4>
                <c:if test="${viewType == 'products'}">
                    <a href="${pageContext.request.contextPath}/admin/product/add" class="btn btn-primary px-4 rounded-pill fw-bold shadow-sm">
                        <i class="fas fa-plus me-2"></i> THÊM SẢN PHẨM
                    </a>
                </c:if>
            </div>

            <!-- Dashboard / Statistics Section -->
            <c:if test="${viewType == 'statistics'}">
                <!-- Stats Row -->
                <div class="stats-row">
                    <div class="stat-card">
                        <span class="label">Tổng doanh thu</span>
                        <div class="value">₫<fmt:formatNumber value="${totalRevenue}" pattern="#,##0"/></div>
                    </div>
                    <div class="stat-card">
                        <span class="label">Số đơn hàng</span>
                        <div class="value">${totalOrders}</div>
                    </div>
                    <div class="stat-card">
                        <span class="label">Người dùng</span>
                        <div class="value">${totalUsers}</div>
                    </div>
                </div>

                <!-- Chart Section -->
                <div class="row mb-4">
                    <div class="col-lg-12">
                        <div class="chart-container">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h6 class="fw-bold m-0"><i class="fas fa-chart-pie me-2 text-primary"></i>Trạng thái đơn hàng</h6>
                                <span class="badge bg-light text-dark border">Cập nhật thời gian thực</span>
                            </div>
                            <div style="height: 350px; display: flex; align-items: center; justify-content: center;">
                                <div style="width: 300px;">
                                    <canvas id="orderStatusChart"></canvas>
                                </div>
                        <div class="ms-5 flex-grow-1">
                            <div class="row g-3">
                                <c:forEach items="${orderStatusMap}" var="entry">
                                    <c:set var="statusColor" value="#6c757d"/>
                                    <c:if test="${entry.key == 'Giao hàng thành công'}"><c:set var="statusColor" value="#28a745"/></c:if>
                                    <c:if test="${entry.key == 'Chờ xác nhận'}"><c:set var="statusColor" value="#fd7e14"/></c:if>
                                    <c:if test="${entry.key == 'Đang giao'}"><c:set var="statusColor" value="#007bff"/></c:if>
                                    <c:if test="${entry.key == 'Đã xác nhận'}"><c:set var="statusColor" value="#20c997"/></c:if>
                                    <c:if test="${entry.key == 'Đã hủy'}"><c:set var="statusColor" value="#dc3545"/></c:if>
                                    <c:if test="${entry.key == 'Đã hoàn tiền'}"><c:set var="statusColor" value="#17a2b8"/></c:if>
                                    <c:if test="${entry.key == 'Đang hoàn tiền'}"><c:set var="statusColor" value="#ffc107"/></c:if>
                                    
                                    <div class="col-md-6">
                                        <div class="d-flex justify-content-between align-items-center p-3 rounded bg-light border-start border-4" style="border-color: ${statusColor} !important;">
                                            <span class="small fw-600"><i class="fas fa-circle me-2" style="color: ${statusColor}; font-size: 8px;"></i> ${entry.key}</span>
                                            <span class="badge bg-white text-dark border fw-bold px-3 py-2">${entry.value}</span>
                                        </div>
                                    </div>
                                </c:forEach>
                            </div>
                        </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Products Table (Optional in stats) -->
                <div class="mt-4">
                    <h6 class="fw-bold mb-3">Top sản phẩm bán chạy</h6>
                    <div class="product-table-container">
                        <table class="table m-0">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Giá</th>
                                    <th>Kho</th>
                                    <th class="text-end">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <c:forEach items="${topSellingProducts}" var="p">
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center gap-3">
                                                <img src="${pageContext.request.contextPath}/assets/images/${p.image}" width="40" height="40" class="rounded">
                                                <span class="fw-600">${p.name}</span>
                                            </div>
                                        </td>
                                        <td><fmt:formatNumber value="${p.discount_price > 0 ? p.discount_price : p.price}" pattern="#,##0"/>đ</td>
                                        <td>${p.stock}</td>
                                        <td class="text-end">
                                            <span class="badge ${p.status ? 'bg-success' : 'bg-danger'}">${p.status ? 'Hiện' : 'Ẩn'}</span>
                                        </td>
                                    </tr>
                                </c:forEach>
                            </tbody>
                        </table>
                    </div>
                </div>
            </c:if>

            <!-- Order Management Section -->
            <c:if test="${viewType == 'orders'}">
                <div class="product-table-container">
                    <table class="table m-0">
                        <thead>
                            <tr>
                                <th width="80">Mã ĐH</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Thanh toán</th>
                                <th>Ngày đặt</th>
                                <th width="200">Trạng thái</th>
                                <th width="100" class="text-end">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:forEach items="${listOrders}" var="o">
                                <tr>
                                    <td class="fw-bold">#HP-${o.id}</td>
                                    <td>${o.user_name}</td>
                                    <td class="text-success fw-bold"><fmt:formatNumber value="${o.total}" pattern="#,##0"/>đ</td>
                                    <td><span class="badge bg-light text-dark border">${o.payment_method}</span></td>
                                    <td class="small"><fmt:formatDate value="${o.created_at}" pattern="dd/MM/yyyy HH:mm"/></td>
                                    <td>
                                        <form action="${pageContext.request.contextPath}/admin/order/update-status" method="POST">
                                            <input type="hidden" name="orderId" value="${o.id}">
                                            <select name="status" class="form-select form-select-sm" onchange="this.form.submit()">
                                                <option value="Giao hàng thành công" ${o.status == 'Giao hàng thành công' ? 'selected' : ''}>Giao hàng thành công</option>
                                                <option value="Chờ xác nhận" ${o.status == 'Chờ xác nhận' ? 'selected' : ''}>Chờ xác nhận</option>
                                                <option value="Đang giao" ${o.status == 'Đang giao' ? 'selected' : ''}>Đang giao</option>
                                                <option value="Đã xác nhận" ${o.status == 'Đã xác nhận' ? 'selected' : ''}>Đã xác nhận</option>
                                                <option value="Đã hủy" ${o.status == 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
                                                <option value="Đã hoàn tiền" ${o.status == 'Đã hoàn tiền' ? 'selected' : ''}>Đã hoàn tiền</option>
                                                <option value="Đang hoàn tiền" ${o.status == 'Đang hoàn tiền' ? 'selected' : ''}>Đang hoàn tiền</option>
                                            </select>
                                        </form>
                                    </td>
                                    <td class="text-end">
                                        <a href="#" class="btn btn-sm btn-light border"><i class="fas fa-eye text-primary"></i></a>
                                    </td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>
                </div>
            </c:if>

            <!-- Product Management Section -->
            <c:if test="${viewType == 'products'}">
                <div class="product-table-container">
                    <table class="table m-0">
                        <thead>
                            <tr>
                                <th width="80">Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Giá gốc</th>
                                <th>Khuyến mãi</th>
                                <th width="150">Kho hàng</th>
                                <th width="100">Trạng thái</th>
                                <th width="120" class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <c:forEach items="${listProducts}" var="p">
                                <tr>
                                    <td>
                                        <img src="${pageContext.request.contextPath}/assets/images/${p.image}" width="50" height="50" class="rounded border shadow-sm" style="object-fit: cover;">
                                    </td>
                                    <td>
                                        <div class="fw-bold text-dark">${p.name}</div>
                                        <div class="text-muted extra-small" style="font-size: 0.7rem;">ID: #HP-${p.id}</div>
                                    </td>
                                    <td><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</td>
                                    <td>
                                        <c:choose>
                                            <c:when test="${p.discount_price > 0}">
                                                <span class="text-danger fw-bold"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="text-muted small">N/A</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td>
                                        <form action="${pageContext.request.contextPath}/admin/product/edit" method="POST" class="d-flex align-items-center gap-2">
                                            <input type="hidden" name="id" value="${p.id}">
                                            <input type="hidden" name="action" value="update_stock">
                                            <input type="number" name="stock" value="${p.stock}" class="form-control form-control-sm text-center fw-bold" style="width: 70px; border-radius: 4px;">
                                            <button type="submit" class="btn btn-sm btn-outline-success border-0 p-1" title="Cập nhật kho">
                                                <i class="fas fa-check-circle"></i>
                                            </button>
                                        </form>
                                    </td>
                                    <td>
                                        <form action="${pageContext.request.contextPath}/admin/product/edit" method="POST" id="statusForm_${p.id}">
                                            <input type="hidden" name="id" value="${p.id}">
                                            <input type="hidden" name="action" value="toggle_status">
                                            <label class="switch">
                                                <input type="checkbox" name="status" ${p.status ? 'checked' : ''} onchange="this.form.submit()">
                                                <span class="slider"></span>
                                            </label>
                                        </form>
                                    </td>
                                    <td class="text-end">
                                        <div class="d-flex justify-content-end gap-2">
                                            <a href="${pageContext.request.contextPath}/admin/product/edit?id=${p.id}" class="btn btn-sm btn-light border" title="Chỉnh sửa">
                                                <i class="fas fa-edit text-warning"></i>
                                            </a>
                                            <a href="${pageContext.request.contextPath}/admin/product/delete?id=${p.id}" class="btn btn-sm btn-light border" title="Xóa" onclick="return confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')">
                                                <i class="fas fa-trash-alt text-danger"></i>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>
                </div>
            </c:if>
        </main>
    </div>

    <c:if test="${viewType == 'statistics'}">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            const ctx = document.getElementById('orderStatusChart').getContext('2d');
            
            const statusData = {
                <c:forEach items="${orderStatusMap}" var="entry" varStatus="loop">
                    '${entry.key}': ${entry.value}${!loop.last ? ',' : ''}
                </c:forEach>
            };

            const labels = Object.keys(statusData);
        const values = Object.values(statusData);
        
        // Bảng màu tương ứng với labels
        const colorMap = {
            'Giao hàng thành công': '#28a745',
            'Chờ xác nhận': '#fd7e14',
            'Đang giao': '#007bff',
            'Đã xác nhận': '#20c997',
            'Đã hủy': '#dc3545',
            'Đã hoàn tiền': '#17a2b8',
            'Đang hoàn tiền': '#ffc107'
        };
        const bgColors = labels.map(label => colorMap[label] || '#6c757d');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: bgColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 15
                }]
            },
                options: {
                    cutout: '70%',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        </script>
    </c:if>
</body>
</html>
