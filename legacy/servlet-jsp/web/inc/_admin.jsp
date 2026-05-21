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
                <a href="admin?type=products" class="filter-link ${viewType == 'products' && empty param.categoryId && empty param.brandId && empty param.decantType ? 'active' : ''}">
                    <i class="fas fa-box me-2"></i> Quản lý kho hàng
                </a>
                <a href="admin/migrate-images" class="filter-link">
                    <i class="fas fa-images me-2"></i> Migrate ảnh Unsplash
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

                <div class="filter-section">
                    <span class="filter-label">Loại hàng</span>
                    <ul class="filter-list">
                        <li class="filter-item">
                            <a href="admin?type=products" class="filter-link ${empty param.decantType ? 'active' : ''}">
                                Tất cả
                            </a>
                        </li>
                        <li class="filter-item">
                            <a href="admin?type=products&decantType=fullbox" class="filter-link ${param.decantType == 'fullbox' ? 'active' : ''}">
                                Fullbox
                            </a>
                        </li>
                        <li class="filter-item">
                            <a href="admin?type=products&decantType=decant" class="filter-link ${param.decantType == 'decant' ? 'active' : ''}">
                                Decant
                            </a>
                        </li>
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
            <c:if test="${not empty adminError}">
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i> ${adminError}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </c:if>
            <div class="admin-header">
                <h4 class="fw-800 m-0">${title}</h4>
                <c:if test="${viewType == 'products'}">
                    <div class="d-flex gap-2">
                        <form action="${pageContext.request.contextPath}/admin/product/reset-stock" method="POST" onsubmit="return confirm('Reset toàn bộ kho về trạng thái mặc định?')">
                            <input type="hidden" name="csrfToken" value="${sessionScope.adminCsrfToken}">
                            <button type="submit" class="btn btn-outline-danger rounded-pill fw-bold">
                                <i class="fas fa-undo me-2"></i> RESET KHO
                            </button>
                        </form>
                        <a href="${pageContext.request.contextPath}/admin/product/add" class="btn btn-primary px-4 rounded-pill fw-bold shadow-sm">
                            <i class="fas fa-plus me-2"></i> THÊM SẢN PHẨM
                        </a>
                    </div>
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
                        <div class="ms-lg-5 flex-grow-1">
                            <div class="row g-2">
                                <c:forEach items="${orderStatusMap}" var="entry">
                                    <c:if test="${entry.value > 0}">
                                        <c:set var="statusColor" value="#6c757d"/>
                                        <c:if test="${entry.key == 'Giao hàng thành công'}"><c:set var="statusColor" value="#28a745"/></c:if>
                                        <c:if test="${entry.key == 'Chờ xác nhận'}"><c:set var="statusColor" value="#fd7e14"/></c:if>
                                        <c:if test="${entry.key == 'Đang giao'}"><c:set var="statusColor" value="#007bff"/></c:if>
                                        <c:if test="${entry.key == 'Đã xác nhận'}"><c:set var="statusColor" value="#20c997"/></c:if>
                                        <c:if test="${entry.key == 'Đã hủy'}"><c:set var="statusColor" value="#dc3545"/></c:if>
                                        <c:if test="${entry.key == 'Đã hoàn tiền'}"><c:set var="statusColor" value="#17a2b8"/></c:if>
                                        <c:if test="${entry.key == 'Đang hoàn tiền'}"><c:set var="statusColor" value="#ffc107"/></c:if>
                                        
                                        <div class="col-sm-6">
                                            <div class="d-flex justify-content-between align-items-center p-2 px-3 rounded bg-white border shadow-sm" style="border-left: 4px solid ${statusColor} !important;">
                                                <span class="small fw-600 text-secondary">${entry.key}</span>
                                                <span class="badge rounded-pill bg-light text-dark border px-2 py-1">${entry.value}</span>
                                            </div>
                                        </div>
                                    </c:if>
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
                                                <c:choose>
                                                    <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                                        <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" width="40" height="40" class="rounded">
                                                    </c:when>
                                                    <c:otherwise>
                                                        <img src="https://loremflickr.com/100/100/perfume,bottle,${p.name}/all?lock=${p.id}" width="40" height="40" class="rounded">
                                                    </c:otherwise>
                                                </c:choose>
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

                <!-- Bảng Cung Cầu -->
                <div class="mt-5">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <h6 class="fw-bold m-0"><i class="fas fa-balance-scale me-2 text-warning"></i>Phân tích Cung – Cầu</h6>
                        <span class="badge bg-light text-dark border small">Top 10 sản phẩm</span>
                    </div>
                    <div class="product-table-container">
                        <table class="table m-0 align-middle">
                            <thead>
                                <tr>
                                    <th style="width:35%">Sản phẩm</th>
                                    <th style="width:13%">Cung (Tồn kho)</th>
                                    <th style="width:13%">Cầu (Đã bán)</th>
                                    <th style="width:27%">Tỷ lệ Cung/Cầu</th>
                                    <th style="width:12%" class="text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <c:choose>
                                    <c:when test="${not empty supplyDemandData}">
                                        <c:forEach items="${supplyDemandData}" var="sd">
                                            <c:set var="sdTotal" value="${sd.supply + sd.demand}"/>
                                            <tr>
                                                <td>
                                                    <div class="fw-semibold small">${sd.name}</div>
                                                    <div class="text-muted" style="font-size:0.7rem;">ID #${sd.id}</div>
                                                </td>
                                                <td><span class="fw-bold text-primary">${sd.supply}</span> <span class="text-muted small">units</span></td>
                                                <td><span class="fw-bold text-danger">${sd.demand}</span> <span class="text-muted small">units</span></td>
                                                <td>
                                                    <c:choose>
                                                        <c:when test="${sdTotal > 0}">
                                                            <div class="d-flex align-items-center gap-2">
                                                                <div style="flex:1;background:#f0f0f0;border-radius:20px;height:10px;overflow:hidden;display:flex;">
                                                                    <c:set var="supplyPct" value="${sd.supply * 100 / sdTotal}"/>
                                                                    <div style="width:${supplyPct}%;background:#3b82f6;height:100%;"></div>
                                                                    <div style="width:${100 - supplyPct}%;background:#ef4444;height:100%;"></div>
                                                                </div>
                                                                <span style="font-size:0.7rem;white-space:nowrap;color:#888">
                                                                    <fmt:formatNumber value="${sd.supply * 100 / sdTotal}" maxFractionDigits="0"/>%/<fmt:formatNumber value="${sd.demand * 100 / sdTotal}" maxFractionDigits="0"/>%
                                                                </span>
                                                            </div>
                                                        </c:when>
                                                        <c:otherwise><span class="text-muted small">Chưa có dữ liệu</span></c:otherwise>
                                                    </c:choose>
                                                </td>
                                                <td class="text-center">
                                                    <c:choose>
                                                        <c:when test="${sd.state == 'HET_HANG'}">
                                                            <span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i>Hết hàng</span>
                                                        </c:when>
                                                        <c:when test="${sd.state == 'HOT'}">
                                                            <span class="badge bg-warning text-dark"><i class="fas fa-fire me-1"></i>Cầu cao</span>
                                                        </c:when>
                                                        <c:when test="${sd.state == 'TON_KHO'}">
                                                            <span class="badge bg-info text-dark"><i class="fas fa-warehouse me-1"></i>Tồn kho</span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="badge bg-success"><i class="fas fa-check me-1"></i>Cân bằng</span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </td>
                                            </tr>
                                        </c:forEach>
                                    </c:when>
                                    <c:otherwise>
                                        <tr><td colspan="5" class="text-center text-muted py-4">Chưa có dữ liệu cung cầu.</td></tr>
                                    </c:otherwise>
                                </c:choose>
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex gap-4 mt-2" style="font-size:0.75rem;color:#888;">
                        <span><span style="color:#3b82f6;">━━</span> Cung (Tồn kho)</span>
                        <span><span style="color:#ef4444;">━━</span> Cầu (Đã bán)</span>
                        <span><i class="fas fa-fire text-warning me-1"></i>Cầu cao: cầu &gt; 2× cung</span>
                        <span><i class="fas fa-warehouse text-info me-1"></i>Tồn kho dư: cung &gt; 3× cầu</span>
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
                                                <option value="Waiting" ${o.status == 'Waiting' ? 'selected' : ''}>Waiting</option>
                                                <option value="Paid" ${o.status == 'Paid' ? 'selected' : ''}>Paid</option>
                                                <option value="Refunded" ${o.status == 'Refunded' ? 'selected' : ''}>Refunded</option>
                                                <option value="Returned" ${o.status == 'Returned' ? 'selected' : ''}>Returned</option>
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
                                        <button type="button" class="btn btn-sm btn-light border" onclick="showOrderDetail(${o.id})">
                                            <i class="fas fa-eye text-primary"></i>
                                        </button>
                                    </td>
                                </tr>
                            </c:forEach>
                        </tbody>
                    </table>
                </div>

                <!-- Modal Chi Tiết Đơn Hàng -->
                <div class="modal fade" id="orderDetailModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title fw-bold">Chi tiết đơn hàng <span id="modalOrderId"></span></h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="table-responsive">
                                    <table class="table table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Giá</th>
                                                <th>Số lượng</th>
                                                <th>Thành tiền</th>
                                                <th>Trạng thái</th>
                                                <th class="text-end">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody id="orderItemsBody">
                                            <!-- Items will be loaded here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    function showOrderDetail(orderId) {
                        document.getElementById('modalOrderId').innerText = '#HP-' + orderId;
                        const body = document.getElementById('orderItemsBody');
                        body.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';
                        
                        const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
                        modal.show();

                        fetch('${pageContext.request.contextPath}/admin/order/detail?id=' + orderId)
                            .then(res => res.json())
                            .then(items => {
                                body.innerHTML = '';
                                items.forEach(item => {
                                    const row = document.createElement('tr');
                                    const isReturned = item.status === 'Returned';
                                    row.innerHTML = `
                                        <td>
                                            <div class="d-flex align-items-center gap-2">
                                                <img src="\${item.image && item.image.startsWith('http') ? item.image : '${pageContext.request.contextPath}/api/image?name=' + (item.image || '')}" width="40" height="40" class="rounded">
                                                <span class="small fw-bold">\${item.name}</span>
                                            </div>
                                        </td>
                                        <td>\${new Intl.NumberFormat().format(item.price)}đ</td>
                                        <td>\${item.quantity}</td>
                                        <td>\${new Intl.NumberFormat().format(item.price * item.quantity)}đ</td>
                                        <td>
                                            <span class="badge \${isReturned ? 'bg-danger' : 'bg-success'}">
                                                \${isReturned ? 'Đã hoàn hàng' : 'Bình thường'}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            \${!isReturned ? `
                                                <form action="${pageContext.request.contextPath}/admin/order/update-status" method="POST" onsubmit="return confirm('Xác nhận hoàn hàng cho sản phẩm này? Tổng tiền đơn hàng sẽ tự động trừ đi giá trị sản phẩm.')">
                                                    <input type="hidden" name="action" value="return_item">
                                                    <input type="hidden" name="orderId" value="\${orderId}">
                                                    <input type="hidden" name="itemId" value="\${item.itemId}">
                                                    <button type="submit" class="btn btn-sm btn-outline-danger">Hoàn hàng</button>
                                                </form>
                                            ` : '-'}
                                        </td>
                                    `;
                                    body.appendChild(row);
                                });
                            });
                    }
                </script>
                <c:if test="${totalOrderPages > 1}">
                    <nav class="mt-3 d-flex justify-content-center" aria-label="Order pagination">
                        <ul class="pagination">
                            <li class="page-item ${currentOrderPage <= 1 ? 'disabled' : ''}">
                                <a class="page-link" href="${pageContext.request.contextPath}/admin?type=orders&page=${currentOrderPage - 1}">Trước</a>
                            </li>
                            <c:forEach begin="1" end="${totalOrderPages}" var="i">
                                <li class="page-item ${i == currentOrderPage ? 'active' : ''}">
                                    <a class="page-link" href="${pageContext.request.contextPath}/admin?type=orders&page=${i}">${i}</a>
                                </li>
                            </c:forEach>
                            <li class="page-item ${currentOrderPage >= totalOrderPages ? 'disabled' : ''}">
                                <a class="page-link" href="${pageContext.request.contextPath}/admin?type=orders&page=${currentOrderPage + 1}">Sau</a>
                            </li>
                        </ul>
                    </nav>
                </c:if>
            </c:if>

            <!-- Product Management Section -->
            <c:if test="${viewType == 'products'}">
                <c:if test="${param.success == 'decanted'}">
                    <div class="alert alert-success">Chiết hàng thành công. Đã trừ những ml đã chiết khỏi chai gốc và tạo/cộng số lượng decant.</div>
                </c:if>
                <c:if test="${param.error == 'decant_failed' || param.error == 'decant_invalid'}">
                    <div class="alert alert-danger">Chiết hàng thất bại. Vui lòng kiểm tra tồn kho hoặc cấu hình sản phẩm.</div>
                </c:if>
                <div class="product-table-container">
                    <table class="table m-0">
                        <thead>
                            <tr>
                                <th width="80">Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>SKU</th>
                                <th>Batch</th>
                                <th>Loại</th>
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
                                    <c:choose>
                                        <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                            <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" width="50" height="50" class="rounded border shadow-sm" style="object-fit: cover;">
                                        </c:when>
                                        <c:otherwise>
                                             <img src="https://loremflickr.com/100/100/perfume,bottle,${p.name}/all?lock=${p.id}" width="50" height="50" class="rounded border shadow-sm" style="object-fit: cover;">
                                         </c:otherwise>
                                    </c:choose>
                                </td>
                                    <td>
                                        <div class="fw-bold text-dark">${p.name}</div>
                                        <div class="text-muted extra-small" style="font-size: 0.7rem;">ID: #HP-${p.id}</div>
                                    </td>
                                    <td><span class="small text-muted">${empty p.sku ? '-' : p.sku}</span></td>
                                    <td><span class="small text-muted">${empty p.batch_code ? '-' : p.batch_code}</span></td>
                                    <td>
                                        <span class="badge ${p.is_decant ? 'bg-info text-dark' : 'bg-secondary'}">
                                            ${p.is_decant ? 'Decant' : 'Fullbox'}
                                        </span>
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
                                        <div class="d-flex justify-content-end gap-2 align-items-center">
                                            <c:if test="${!p.is_decant}">
                                                <button type="button" class="btn btn-sm btn-light border" title="Chiết hàng"
                                                    onclick="openDecantModal(${p.id}, '${p.name.replace("'", "\\'")}', ${p.stock})">
                                                    <i class="fas fa-vial text-info"></i>
                                                </button>
                                            </c:if>
                                            <a href="${pageContext.request.contextPath}/admin/product/edit?id=${p.id}" class="btn btn-sm btn-light border" title="Chỉnh sửa">
                                                <i class="fas fa-edit text-warning"></i>
                                            </a>
                                            <form action="${pageContext.request.contextPath}/admin/product/delete" method="POST" class="d-inline" onsubmit="return confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')">
                                                <input type="hidden" name="id" value="${p.id}">
                                                <input type="hidden" name="csrfToken" value="${sessionScope.adminCsrfToken}">
                                                <button type="submit" class="btn btn-sm btn-light border" title="Xóa">
                                                    <i class="fas fa-trash-alt text-danger"></i>
                                                </button>
                                            </form>
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
            
            const statusData = {};
            <c:forEach items="${orderStatusMap}" var="entry">
                statusData['${entry.key.replace("'", "\\'")}'] = ${entry.value};
            </c:forEach>

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
    
    <!-- Modal Chiết Hàng -->
    <div class="modal fade" id="decantModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header" style="background: linear-gradient(135deg,#003D2E,#006B50); color:#fff;">
                    <h5 class="modal-title fw-bold"><i class="fas fa-vial me-2"></i>Chiết hàng</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="alert alert-info py-2 px-3 mb-3" id="decantProductInfo" style="font-size:0.88rem;"></div>
                    <form id="decantForm" action="${pageContext.request.contextPath}/admin/product/decant" method="POST">
                        <input type="hidden" name="id" id="decantProductId">
                        <input type="hidden" name="csrfToken" value="${sessionScope.adminCsrfToken}">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Số ml muốn chiết mỗi chai <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="number" name="decantVolume" id="decantVolumeInput"
                                       class="form-control" min="1" value="10" required>
                                <span class="input-group-text">ml/chai</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Số chai decant tạo ra <span class="text-danger">*</span></label>
                            <div class="input-group">
                                <input type="number" name="decantQty" id="decantQtyInput"
                                       class="form-control" min="1" value="1" required>
                                <span class="input-group-text">chai</span>
                            </div>
                        </div>
                        <div id="decantPreview" class="p-3 rounded mb-2" style="background:#f8f9fa; border:1px solid #dee2e6; font-size:0.85rem;">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="button" class="btn btn-success fw-bold" onclick="submitDecant()">
                        <i class="fas fa-check me-1"></i>Xác nhận chiết
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        var _decantStock = 0;
        function openDecantModal(productId, productName, currentStock) {
            _decantStock = currentStock;
            document.getElementById('decantProductId').value = productId;
            document.getElementById('decantProductInfo').innerHTML =
                '<strong>' + productName + '</strong><br>Tồn kho hiện tại: <b>' + currentStock + ' ml</b>';
            document.getElementById('decantVolumeInput').value = 10;
            document.getElementById('decantQtyInput').value = 1;
            updateDecantPreview();
            var modal = new bootstrap.Modal(document.getElementById('decantModal'));
            modal.show();
        }

        function updateDecantPreview() {
            var vol = parseInt(document.getElementById('decantVolumeInput').value) || 0;
            var qty = parseInt(document.getElementById('decantQtyInput').value) || 0;
            var totalMl = vol * qty;
            var remaining = _decantStock - totalMl;
            var preview = document.getElementById('decantPreview');
            var valid = remaining >= 0 && vol > 0 && qty > 0;
            preview.innerHTML =
                '<div>Tổng ml cần chiết: <b>' + totalMl + ' ml</b></div>' +
                '<div>Chai gốc còn lại: <b class="' + (remaining < 0 ? 'text-danger' : 'text-success') + '">' + remaining + ' ml</b></div>' +
                '<div>Số chai decant tạo ra: <b>' + qty + ' chai x ' + vol + ' ml</b></div>';
            if (!valid || remaining < 0) {
                preview.style.borderColor = '#dc3545';
                preview.style.background = '#fff5f5';
            } else {
                preview.style.borderColor = '#28a745';
                preview.style.background = '#f0fff4';
            }
        }

        function submitDecant() {
            var vol = parseInt(document.getElementById('decantVolumeInput').value) || 0;
            var qty = parseInt(document.getElementById('decantQtyInput').value) || 0;
            var totalMl = vol * qty;
            if (vol <= 0 || qty <= 0) {
                alert('Vui lòng nhập số ml và số chai hợp lệ (lớn hơn 0).');
                return;
            }
            if (totalMl > _decantStock) {
                alert('Không đủ ml! Cần ' + totalMl + 'ml nhưng chai chỉ còn ' + _decantStock + 'ml.');
                return;
            }
            if (confirm('Xác nhận chiết ' + qty + ' chai x ' + vol + 'ml = ' + totalMl + 'ml?\nChai gốc sẽ còn ' + (_decantStock - totalMl) + 'ml.')) {
                document.getElementById('decantForm').submit();
            }
        }

        // Live preview khi thay đổi input
        document.addEventListener('DOMContentLoaded', function() {
            var volInput = document.getElementById('decantVolumeInput');
            var qtyInput = document.getElementById('decantQtyInput');
            if (volInput) {
                volInput.addEventListener('input', updateDecantPreview);
                qtyInput.addEventListener('input', updateDecantPreview);
            }
        });
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
