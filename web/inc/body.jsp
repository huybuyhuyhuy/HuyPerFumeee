<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@page contentType="text/html" pageEncoding="UTF-8"%>

<style>
    /* Nâng cấp hiệu ứng Product Card */
    .product-card-custom {
        position: relative; 
        overflow: hidden; 
        border-radius: 12px;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); 
        border: 1px solid #f0f0f0; 
        background: #fff;
        height: 100%; 
        display: flex;
        flex-direction: column;
    }
    
    .product-card-custom:hover {
        transform: translateY(-8px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        border-color: #003D2E;
    }

    .img-container { 
        position: relative; 
        overflow: hidden; 
        background: #f8f8f8;
    }

    .img-container img { 
        transition: transform 0.6s ease; 
        width: 100%;
        height: auto;
        display: block;
    }

    /* Lớp phủ mờ khi hover */
    .img-overlay {
        position: absolute; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%;
        background: rgba(0, 61, 46, 0.6); 
        display: flex;
        flex-direction: column;
        align-items: center; 
        justify-content: center; 
        opacity: 0; 
        transition: all 0.3s ease;
        gap: 10px;
    }

    .product-card-custom:hover .img-overlay { 
        opacity: 1; 
    }

    .product-card-custom:hover .img-container img { 
        transform: scale(1.15); 
    }

    /* Nút Mua ngay & Xem chi tiết trên Overlay */
    .btn-overlay {
        transform: translateY(20px); 
        transition: all 0.4s ease;
        background-color: #ffffff !important; 
        color: #003D2E !important;
        border: none; 
        padding: 10px 20px; 
        border-radius: 50px; 
        text-decoration: none; 
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
        width: 80%;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .btn-overlay:hover {
        background-color: #003D2E !important;
        color: #ffffff !important;
    }

    .product-card-custom:hover .btn-overlay { 
        transform: translateY(0); 
    }

    /* Thông tin sản phẩm */
    .product-info { 
        padding: 18px 15px; 
        text-align: center; 
        flex-grow: 1; 
        background: #fff;
    }

    .card-title {
        font-size: 0.85rem; 
        height: 40px; 
        overflow: hidden; 
        line-height: 1.4;
        margin-bottom: 10px;
        color: #1a1a1a;
        font-weight: 600;
        transition: color 0.3s ease;
    }

    .product-card-custom:hover .card-title {
        color: #003D2E;
    }

    .product-price {
        font-weight: 800; 
        color: #003D2E; 
        font-size: 1.1rem;
        letter-spacing: 0.5px;
    }

    /* Nút Trái tim yêu thích */
    .btn-wishlist-abs {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 36px;
        height: 36px;
        background: #ffffff;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.3s ease;
        color: #ddd;
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }

    .btn-wishlist-abs:hover {
        transform: scale(1.15);
        color: #ff4757;
    }

    .btn-wishlist-abs.active {
        color: #ff4757;
        background: #fff;
    }

    /* Pagination */
    .pagination .page-link { 
        color: #003D2E; 
        border-radius: 50% !important;
        margin: 0 5px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        border: 1px solid #eee;
    }
    .pagination .page-item.active .page-link { 
        background-color: #003D2E; 
        border-color: #003D2E; 
        color: white; 
    }
</style>

<div class="breadcrumb-custom py-3 bg-light mb-4">
    <div class="container">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0 small">
                <li class="breadcrumb-item"><a href="${pageContext.request.contextPath}/home" class="text-muted text-decoration-none">Trang chủ</a></li>
                <li class="breadcrumb-item active text-dark fw-bold">${not empty pageTitle ? pageTitle : 'Sản phẩm'}</li>
            </ol>
        </nav>
    </div>
</div>

<div class="container my-5">
    <div class="row">
        <!-- Sidebar -->
        <div class="col-lg-3 col-md-4">
            <div class="sidebar p-4 border-0 shadow-sm rounded-4 bg-white mb-4">
                <h6 class="mb-4 text-uppercase fw-800 border-bottom pb-2" style="font-size: 0.9rem; letter-spacing: 1px;">Danh mục</h6>
                <ul class="list-unstyled mb-4">
                    <li class="mb-2">
                        <a href="${pageContext.request.contextPath}/home" 
                           class="text-decoration-none d-block py-1 ${empty param.id_category ? 'fw-bold text-success' : 'text-muted'}">
                           Tất cả Sản phẩm
                        </a>
                    </li>
                    <c:forEach items="${listCategory}" var="c">
                        <li class="mb-2">
                            <a href="${pageContext.request.contextPath}/home?id_category=${c.id}" 
                               class="text-decoration-none d-block py-1 ${param.id_category == c.id ? 'fw-bold text-success' : 'text-muted'}">
                               ${c.name}
                            </a>
                        </li>
                    </c:forEach>
                </ul>
                
                <h6 class="mb-4 text-uppercase fw-800 border-bottom pb-2 mt-5" style="font-size: 0.9rem; letter-spacing: 1px;">Thương hiệu</h6>
                <form action="${pageContext.request.contextPath}/home" method="GET">
                    <c:forEach items="${listBrands}" var="brand">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="brand_id" value="${brand.id}" id="brand${brand.id}" ${param.brand_id == brand.id ? 'checked' : ''}>
                            <label class="form-check-label text-muted small" for="brand${brand.id}">${brand.name}</label>
                        </div>
                    </c:forEach>
                    <button type="submit" class="btn btn-dark w-100 mt-4 py-2 fw-bold" style="font-size: 0.8rem; border-radius: 8px;">LỌC SẢN PHẨM</button>
                </form>

                <h6 class="mb-4 text-uppercase fw-800 border-bottom pb-2 mt-5" style="font-size: 0.9rem; letter-spacing: 1px;">Giá sản phẩm</h6>
                <form action="${pageContext.request.contextPath}/home" method="GET">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="price_range" value="under500" id="price1" ${param.price_range == 'under500' ? 'checked' : ''}>
                        <label class="form-check-label text-muted small" for="price1">Giá dưới 500.000đ</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="price_range" value="500to1000" id="price2" ${param.price_range == '500to1000' ? 'checked' : ''}>
                        <label class="form-check-label text-muted small" for="price2">500.000đ - 1.000.000đ</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="price_range" value="1000to2000" id="price3" ${param.price_range == '1000to2000' ? 'checked' : ''}>
                        <label class="form-check-label text-muted small" for="price3">1.000.000đ - 2.000.000đ</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="price_range" value="above2000" id="price4" ${param.price_range == 'above2000' ? 'checked' : ''}>
                        <label class="form-check-label text-muted small" for="price4">Giá trên 2.000.000đ</label>
                    </div>
                    <button type="submit" class="btn btn-outline-dark w-100 mt-3 py-2 fw-bold" style="font-size: 0.8rem; border-radius: 8px;">LỌC GIÁ</button>
                </form>
            </div>
        </div>

        <!-- Product Grid -->
        <div class="col-lg-9 col-md-8">
            <header class="mb-5 d-flex justify-content-between align-items-center">
                <h4 class="fw-800 m-0" style="letter-spacing: -0.5px;">${not empty pageTitle ? pageTitle : 'Sản phẩm'}</h4>
                <div class="small text-muted">Hiển thị <span class="fw-bold text-dark">${listProducts.size()}</span> sản phẩm</div>
            </header>

            <div class="row g-4">
                <c:choose>
                    <c:when test="${not empty listProducts}">
                        <c:forEach items="${listProducts}" var="p">
                            <c:if test="${p.status}">
                                <div class="col-lg-3 col-md-6 col-sm-6">
                                    <div class="product-card-custom">
                                        <div class="img-container">
                                            <%-- Wishlist Button --%>
                                            <c:choose>
                                                <c:when test="${sessionScope.user == null}">
                                                    <a href="${pageContext.request.contextPath}/login?target_id=${p.id}" class="btn-wishlist-abs">
                                                        <i class="fa-regular fa-heart"></i>
                                                    </a>
                                                </c:when>
                                                <c:otherwise>
                                                    <c:set var="inWishlist" value="false"/>
                                                    <c:forEach items="${sessionScope.wishlist}" var="w">
                                                        <c:if test="${w.id == p.id}"><c:set var="inWishlist" value="true"/></c:if>
                                                    </c:forEach>
                                                    <button class="btn-wishlist-abs ${inWishlist ? 'active' : ''}" onclick="addToWishlist(this, ${p.id})">
                                                        <i class="${inWishlist ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                                                    </button>
                                                </c:otherwise>
                                            </c:choose>

                                            <img src="${pageContext.request.contextPath}/assets/images/${p.image}" 
                                                 alt="${p.name}"
                                                 style="aspect-ratio: 1/1; object-fit: cover;"/>

                                            <div class="img-overlay">
                                                <c:choose>
                                                    <c:when test="${sessionScope.user == null}">
                                                        <a href="${pageContext.request.contextPath}/login?target_id=${p.id}" class="btn-overlay">
                                                            <i class="fas fa-shopping-cart me-2"></i> Mua ngay
                                                        </a>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}&page=${currentPage}" 
                                                           class="btn-overlay">
                                                            <i class="fas fa-shopping-cart me-2"></i> Mua ngay
                                                        </a>
                                                    </c:otherwise>
                                                </c:choose>
                                                <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                                    <i class="fas fa-eye me-2"></i> Chi tiết
                                                </a>
                                            </div>
                                        </div>
                                        <div class="product-info">
                                            <h5 class="card-title">${p.name}</h5>
                                            <p class="product-price mb-0">
                                                <fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </c:if>
                        </c:forEach>
                    </c:when>
                    <c:otherwise>
                        <div class="col-12 text-center py-5">
                            <div class="mb-3 text-muted opacity-50"><i class="fas fa-search fa-4x"></i></div>
                            <p class="text-muted fw-bold">Rất tiếc, chúng tôi không tìm thấy sản phẩm này.</p>
                        </div>
                    </c:otherwise>
                </c:choose>
            </div>

            <%-- Pagination --%>
            <c:if test="${totalPages > 1}">
                <nav class="mt-5 pt-4 border-top">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage == 1 ? 'disabled' : ''}">
                            <a class="page-link border-0" href="home?page=${currentPage - 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">
                                <i class="fas fa-chevron-left"></i>
                            </a>
                        </li>
                        <c:forEach begin="1" end="${totalPages}" var="i">
                            <li class="page-item ${currentPage == i ? 'active' : ''}">
                                <a class="page-link" href="home?page=${i}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">${i}</a>
                            </li>
                        </c:forEach>
                        <li class="page-item ${currentPage == totalPages ? 'disabled' : ''}">
                            <a class="page-link border-0" href="home?page=${currentPage + 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}">
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </c:if>
        </div>
    </div>
</div>

<script>
function addToWishlist(btn, productId) {
    const icon = btn.querySelector('i');
    const isActive = icon.classList.contains('fa-solid');
    
    // UI Update ngay lập tức
    icon.className = isActive ? 'fa-regular fa-heart' : 'fa-solid fa-heart';
    btn.classList.toggle('active');

    const url = '${pageContext.request.contextPath}/wishlist?action=add&id=' + productId;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(data => {
        const countBadge = document.getElementById('wishlist-count');
        if (countBadge) {
            countBadge.innerText = data.newSize;
            countBadge.style.transform = 'scale(1.4)';
            setTimeout(() => { countBadge.style.transform = 'scale(1)'; }, 200);
        }
    })
    .catch(err => console.error('Wishlist Error:', err));
}
</script>
