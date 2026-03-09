<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@page contentType="text/html" pageEncoding="UTF-8"%>

<style>
    /* CSS Tối ưu cho hiển thị 4 cột - Giữ nguyên của bạn */
    .product-card-custom {
        position: relative; 
        overflow: hidden; 
        border-radius: 8px;
        transition: all 0.3s ease; 
        border: 1px solid #eee; 
        background: #fff;
        height: 100%; 
        display: flex;
        flex-direction: column;
    }
    .img-container { 
        position: relative; 
        overflow: hidden; 
    }
    .img-container img { 
        transition: transform 0.5s ease; 
    }
    .img-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 61, 46, 0.4); 
        display: flex;
        align-items: center; 
        justify-content: center; 
        opacity: 0; 
        transition: opacity 0.3s ease;
    }
    .product-card-custom:hover { 
        box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
    }
    .product-card-custom:hover .img-overlay { 
        opacity: 1; 
    }
    .product-card-custom:hover .img-container img { 
        transform: scale(1.1); 
    }
    .btn-overlay {
        transform: translateY(20px); 
        transition: transform 0.3s ease;
        background-color: #003D2E !important; 
        color: white !important;
        border: none; 
        padding: 8px 15px; 
        border-radius: 4px; 
        text-decoration: none; 
        font-weight: bold;
        font-size: 0.8rem;
    }
    .product-card-custom:hover .btn-overlay { 
        transform: translateY(0); 
    }
    .product-info { 
        padding: 12px; 
        text-align: center; 
        flex-grow: 1; 
    }
    .card-title {
        font-size: 0.9rem; 
        height: 40px; 
        overflow: hidden; 
        line-height: 1.3;
        margin-bottom: 8px;
        color: #333;
    }
    .product-price {
        font-weight: bold; 
        color: #dc3545; 
        font-size: 1rem;
    }
    .pagination .page-link { color: #003D2E; }
    .pagination .page-item.active .page-link { 
        background-color: #003D2E; 
        border-color: #003D2E; 
        color: white; 
    }
<<<<<<< HEAD
    /* CSS cho nút Trái tim yêu thích */
    .btn-wishlist-abs {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        transition: all 0.3s ease;
        color: #888; /* Màu xám mặc định */
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .btn-wishlist-abs:hover {
        transform: scale(1.1);
        color: #dc3545; /* Đổi sang đỏ khi di chuột */
    }
    .btn-wishlist-abs.active i {
        color: #dc3545; /* Màu đỏ khi đã thích */
        font-weight: 900; /* fas */
    }
    a.btn-wishlist-abs {
        text-decoration: none;
        color: inherit;
    }
=======
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
</style>

<div class="breadcrumb-custom">
    <div class="container">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="${pageContext.request.contextPath}/home">Trang chủ</a></li>
                <li class="breadcrumb-item active">${not empty pageTitle ? pageTitle : 'Sản phẩm'}</li>
            </ol>
        </nav>
    </div>
</div>

<div class="container my-5">
    <div class="row">
        <div class="col-lg-3 col-md-4">
            <div class="sidebar p-3 border rounded">
                <h6 class="mb-3 text-uppercase fw-bold">DANH MỤC</h6>
                <ul class="list-unstyled mb-4">
                    <li>
                        <a href="${pageContext.request.contextPath}/home" 
                           class="text-dark d-block py-1 ${empty param.id_category ? 'fw-bold text-success' : ''}">
                           Tất cả Sản phẩm
                        </a>
                    </li>
                    <c:forEach items="${listCategory}" var="c">
                        <li>
                            <a href="${pageContext.request.contextPath}/home?id_category=${c.id}" 
                               class="text-dark d-block py-1 ${param.id_category == c.id ? 'fw-bold text-success' : ''}">
                               ${c.name}
                            </a>
                        </li>
                    </c:forEach>
                </ul>
                <hr>
                <form action="${pageContext.request.contextPath}/home" method="GET">
                    <h6 class="mb-3 text-uppercase fw-bold">THƯƠNG HIỆU</h6>
                    <c:forEach items="${listBrands}" var="brand">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="brand_id" value="${brand.id}" id="brand${brand.id}">
                            <label class="form-check-label" for="brand${brand.id}">${brand.name}</label>
                        </div>
                    </c:forEach>
                    <button type="submit" class="btn btn-sm btn-success w-100 mt-3">Lọc sản phẩm</button>
                </form>
            </div>
        </div>

        <div class="col-lg-9 col-md-8">
            <header class="mb-4 d-flex justify-content-between align-items-center">
                <h4 class="fw-bold">${not empty pageTitle ? pageTitle : 'Sản phẩm'}</h4>
            </header>

            <div class="row">
                <c:choose>
                    <c:when test="${not empty listProducts}">
                        <c:forEach items="${listProducts}" var="p">
                            <c:if test="${p.status}">
                                <div class="col-lg-3 col-md-6 col-sm-6 mb-4">
                                    <div class="product-card-custom">
<<<<<<< HEAD
                              <div class="img-container">
                                    <c:choose>
                                        <c:when test="${sessionScope.user == null}">
                                            <a href="${pageContext.request.contextPath}/login?target_id=${p.id}" class="btn-wishlist-abs" title="Yêu thích">
                                                <i class="far fa-heart"></i>
                                            </a>
                                        </c:when>
                                        <c:otherwise>
                                            <c:set var="inWishlist" value="false"/>
                                            <c:forEach items="${sessionScope.wishlist}" var="w"><c:if test="${w.id == p.id}"><c:set var="inWishlist" value="true"/></c:if></c:forEach>
                                            <button class="btn-wishlist-abs ${inWishlist ? 'active' : ''}" onclick="addToWishlist(this, ${p.id})" title="Yêu thích">
                                                <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
                                            </button>
                                        </c:otherwise>
                                    </c:choose>

                                    <img src="${pageContext.request.contextPath}/assets/images/${p.image}" 
                                         class="w-100" 
                                         style="aspect-ratio: 1/1; object-fit: cover;"/>

                                    <div class="img-overlay">
                                        <c:choose>
                                            <%-- THAY ĐỔI: Kiểm tra session "user" để đồng bộ --%>
                                            <c:when test="${sessionScope.user == null}">
                                                <%-- Nếu chưa đăng nhập: chuyển hướng đến trang login kèm ID sản phẩm --%>
                                                <a href="${pageContext.request.contextPath}/login?target_id=${p.id}" class="btn btn-overlay">
                                                    <i class="fas fa-shopping-cart"></i> Mua ngay
                                                </a>
                                            </c:when>
                                            <c:otherwise>
                                                <%-- Nếu đã đăng nhập: thực hiện thêm vào giỏ hàng --%>
                                                <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}&page=${currentPage}" 
                                                   class="btn btn-overlay">
                                                    <i class="fas fa-shopping-cart"></i> Mua ngay
                                                </a>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                </div>
                                                                        <div class="product-info">
=======
                                        <div class="img-container">
                                            <img src="${pageContext.request.contextPath}/assets/images/${p.image}" 
                                                 class="w-100" 
                                                 style="aspect-ratio: 1/1; object-fit: cover;"/>
                                            <div class="img-overlay">
                                                <c:choose>
                                                    <%-- THAY ĐỔI: Kiểm tra session "user" để đồng bộ --%>
                                                    <c:when test="${sessionScope.user == null}">
                                                        <%-- Nếu chưa đăng nhập: chuyển hướng đến trang login kèm ID sản phẩm --%>
                                                        <a href="${pageContext.request.contextPath}/login?target_id=${p.id}" class="btn btn-overlay">
                                                            <i class="fas fa-shopping-cart"></i> Mua ngay
                                                        </a>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <%-- Nếu đã đăng nhập: thực hiện thêm vào giỏ hàng --%>
                                                        <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}&page=${currentPage}" 
                                                           class="btn btn-overlay">
                                                            <i class="fas fa-shopping-cart"></i> Mua ngay
                                                        </a>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                        </div>
                                        <div class="product-info">
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
                                            <h5 class="card-title">${p.name}</h5>
                                            <p class="product-price mb-0">${p.price} VND</p>
                                        </div>
                                    </div>
                                </div>
                            </c:if>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <div class="col-12 text-center py-5">
                            <p class="text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
                        </div>
                    </c:otherwise>
                </c:choose>
            </div>

            <c:if test="${totalPages > 1}">
                <nav aria-label="Page navigation" class="mt-4">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage == 1 ? 'disabled' : ''}">
<<<<<<< HEAD
                            <a class="page-link" href="home?page=${currentPage - 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">Trước</a>
                        </li>
                        <c:forEach begin="1" end="${totalPages}" var="i">
                            <li class="page-item ${currentPage == i ? 'active' : ''}">
                                <a class="page-link" href="home?page=${i}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">${i}</a>
                            </li>
                        </c:forEach>
                        <li class="page-item ${currentPage == totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="home?page=${currentPage + 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">Sau</a>
=======
                            <a class="page-link" href="home?page=${currentPage - 1}${not empty txtSearch ? '&txtSearch='.concat(txtSearch) : ''}${not empty id_category ? '&id_category='.concat(id_category) : ''}">Trước</a>
                        </li>
                        <c:forEach begin="1" end="${totalPages}" var="i">
                            <li class="page-item ${currentPage == i ? 'active' : ''}">
                                <a class="page-link" href="home?page=${i}${not empty txtSearch ? '&txtSearch='.concat(txtSearch) : ''}${not empty id_category ? '&id_category='.concat(id_category) : ''}">${i}</a>
                            </li>
                        </c:forEach>
                        <li class="page-item ${currentPage == totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="home?page=${currentPage + 1}${not empty txtSearch ? '&txtSearch='.concat(txtSearch) : ''}${not empty id_category ? '&id_category='.concat(id_category) : ''}">Sau</a>
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
                        </li>
                    </ul>
                </nav>
            </c:if>
        </div>
    </div>
<<<<<<< HEAD
</div>
            <script>
function addToWishlist(btn, productId) {
    // 1. Hiệu ứng đổi màu trái tim trên giao diện ngay lập tức
    const icon = btn.querySelector('i');
    icon.classList.toggle('fas'); // Đổi thành tim đặc
    icon.classList.toggle('far'); // Bỏ tim rỗng
    btn.classList.toggle('active');

    // 2. Gửi lệnh yêu thích lên Servlet bằng AJAX
    const url = '${pageContext.request.contextPath}/wishlist?action=add&id=' + productId;

    fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            // 3. Cập nhật con số trên Header
            const countBadge = document.getElementById('wishlist-count');
            if (countBadge) {
                countBadge.innerText = data.newSize;
                
                // Hiệu ứng rung nhẹ con số để gây chú ý
                countBadge.style.transform = 'translate(20%, -20%) scale(1.5)';
                setTimeout(() => {
                    countBadge.style.transform = 'translate(20%, -20%) scale(1)';
                }, 300);
            }
        })
        .catch(err => console.error('Lỗi Wishlist:', err));
}
</script>
=======
</div>
>>>>>>> 5f028194b71b897525d3cafdfb1497588c826870
