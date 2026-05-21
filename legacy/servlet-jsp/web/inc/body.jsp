<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@page import="java.util.Random"%>
<%
    Random stockRandom = new Random();
    request.setAttribute("stockRandom", stockRandom);
%>

<style>
    /* Banner Carousel Styles */
    .banner-carousel {
        position: relative;
        width: 100%;
        height: 600px; /* Increased height */
        overflow: hidden;
        margin-bottom: 50px;
        border-radius: 30px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        background: #000;
    }
    .carousel-track {
        width: 100%;
        height: 100%;
        cursor: grab;
        position: relative;
        z-index: 1;
        overflow: hidden;
    }
    .carousel-slide {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
        overflow: hidden;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.9s ease;
        z-index: 1;
    }
    .carousel-slide.active {
        opacity: 1;
        visibility: visible;
        z-index: 2;
    }
    .carousel-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1.1); /* Subtle zoom for parallax effect */
        transition: transform 8s linear;
    }
    .carousel-slide.active img {
        transform: scale(1);
    }
    .carousel-slide::after {
        content: '';
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent);
    }
    .carousel-content {
        position: absolute;
        top: 50%;
        left: 10%;
        transform: translateY(-50%);
        color: white;
        z-index: 5;
        max-width: 600px;
        pointer-events: none;
    }
    .carousel-content h2 {
        font-size: 4.5rem;
        font-weight: 900;
        line-height: 1.1;
        margin-bottom: 25px;
        opacity: 0;
        transform: translateX(-50px);
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        text-shadow: 0 5px 15px rgba(0,0,0,0.5);
    }
    .carousel-slide.active .carousel-content h2 {
        opacity: 1;
        transform: translateX(0);
    }
    .carousel-content .btn-banner {
        display: inline-block;
        padding: 15px 40px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.9rem;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease 0.4s;
        pointer-events: auto;
    }
    .carousel-slide.active .carousel-content .btn-banner {
        opacity: 1;
        transform: translateY(0);
    }
    .carousel-content .btn-banner:hover {
        background: #fff;
        color: #000;
    }
    .carousel-nav {
        position: absolute;
        top: 50%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 30px;
        transform: translateY(-50%);
        z-index: 10;
        pointer-events: none;
    }
    .nav-btn {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: 0.3s;
        pointer-events: auto;
    }
    .nav-btn:hover {
        background: #fff;
        color: #000;
    }
    .carousel-dots {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        z-index: 10;
    }
    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        cursor: pointer;
        transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .dot.active {
        background: #fff;
        width: 40px;
        border-radius: 10px;
    }

    /* Category Banner Styles */
    .category-banner {
        width: 100%;
        border-radius: 20px;
        overflow: hidden;
        margin-bottom: 40px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        position: relative;
        cursor: pointer;
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .category-banner:hover {
        transform: translateY(-10px);
    }
    .category-banner img {
        width: 100%;
        height: 400px;
        object-fit: cover;
        transition: transform 0.6s ease;
    }
    .category-banner:hover img {
        transform: scale(1.05);
    }
    .category-banner-overlay {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 40px;
        color: white;
    }
    .category-banner-title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 10px;
        text-transform: uppercase;
    }
    .category-banner-link {
        font-weight: 600;
        color: #ffc107;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .category-header-strip {
        background: #003D2E;
        color: white;
        padding: 12px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 15px 15px 0 0;
        margin-bottom: 0;
    }
    .category-header-strip h5 { margin: 0; font-weight: 700; font-size: 1rem; text-transform: uppercase; }
    .category-header-strip span { font-size: 0.85rem; opacity: 0.9; }

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

    /* Sold Out Style */
    .sold-out-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 5px 12px;
        font-size: 0.7rem;
        font-weight: 800;
        border-radius: 5px;
        z-index: 5;
        letter-spacing: 1px;
    }
    .product-card-custom.sold-out {
        opacity: 0.7;
    }
    .product-card-custom.sold-out .img-container img {
        filter: grayscale(0.8);
    }

    .stock-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: #003D2E;
        background: rgba(0,61,46,.06);
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;
        margin-top: 6px;
    }
    .stock-badge.low { color: #c0392b; background: rgba(192,57,43,.06); }
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

<div class="container-fluid px-lg-5 py-4">
    <!-- Banner Carousel Section -->
    <div class="banner-carousel">
        <div class="carousel-track" id="carouselTrack">
            <!-- Slide 1 -->
            <div class="carousel-slide active" onclick="location.href='home'">
                <img src="${not empty bannerSlide1 ? bannerSlide1 : pageContext.request.contextPath.concat('/api/image?name=banner1.png')}" alt="Luxury Perfume Banner 1">
                <div class="carousel-content">
                    <h2 class="text-uppercase">Luxury<br>Scent Collection</h2>
                    <a href="home" class="btn-banner">Khám phá ngay</a>
                </div>
            </div>
            <!-- Slide 2 -->
            <div class="carousel-slide" onclick="location.href='home'">
                <img src="${not empty bannerSlide2 ? bannerSlide2 : pageContext.request.contextPath.concat('/api/image?name=banner2.png')}" alt="Luxury Perfume Banner 2">
                <div class="carousel-content">
                    <h2 class="text-uppercase">Elegant<br>Fragrance</h2>
                    <a href="home" class="btn-banner">Xem bộ sưu tập</a>
                </div>
            </div>
            <!-- Slide 3 -->
            <div class="carousel-slide" onclick="location.href='home'">
                <img src="${not empty bannerSlide3 ? bannerSlide3 : pageContext.request.contextPath.concat('/api/image?name=banner3.png')}" alt="Luxury Perfume Banner 3">
                <div class="carousel-content">
                    <h2 class="text-uppercase">Premium<br>Essence</h2>
                    <a href="home" class="btn-banner">Mua sắm ngay</a>
                </div>
            </div>
            <!-- Slide 4 -->
            <div class="carousel-slide" onclick="location.href='home'">
                <img src="${not empty bannerSlide4 ? bannerSlide4 : pageContext.request.contextPath.concat('/api/image?name=banner4.png')}" alt="Luxury Perfume Banner 4">
                <div class="carousel-content">
                    <h2 class="text-uppercase">Exclusive<br>Aroma</h2>
                    <a href="home" class="btn-banner">Ưu đãi đặc biệt</a>
                </div>
            </div>
        </div>
        
        <!-- Navigation Arrows -->
        <div class="carousel-nav">
            <div class="nav-btn prev" onclick="prevSlide()"><i class="fas fa-chevron-left"></i></div>
            <div class="nav-btn next" onclick="nextSlide()"><i class="fas fa-chevron-right"></i></div>
        </div>

        <div class="carousel-dots" id="carouselDots">
            <div class="dot active" onclick="goToSlide(0)"></div>
            <div class="dot" onclick="goToSlide(1)"></div>
            <div class="dot" onclick="goToSlide(2)"></div>
            <div class="dot" onclick="goToSlide(3)"></div>
        </div>
    </div>

    <div class="row g-5">
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

        <!-- Main Content -->
        <div class="col-lg-9 col-md-8">
            <c:choose>
                <%-- TRƯỜNG HỢP TRANG CHỦ: HIỂN THỊ THEO TỪNG PHẦN BANNER + SẢN PHẨM --%>
                <c:when test="${isHomePage}">
                    <!-- PHẦN 1: NƯỚC HOA NAM -->
                    <div class="category-section mb-5">
                        <div class="category-header-strip">
                            <h5>Nước hoa Nam</h5>
                            <span>Nước hoa Nam</span>
                        </div>
                        <div class="category-banner" onclick="location.href='${pageContext.request.contextPath}/home?id_category=1'">
                            <img src="${not empty bannerMen ? bannerMen : pageContext.request.contextPath.concat('/api/image?name=men-perfume-banner.png')}" alt="Men Perfume Banner">
                            <div class="category-banner-overlay">
                                <h2 class="category-banner-title">Nước hoa Nam</h2>
                                <div class="category-banner-link">Xem tất cả sản phẩm <i class="fas fa-arrow-right"></i></div>
                            </div>
                        </div>
                        <div class="row g-4">
                            <c:forEach items="${menProducts}" var="p" end="3">
                                <div class="col-xl-3 col-lg-4 col-md-6">
                                    <div class="product-card-custom ${!p.status ? 'sold-out' : ''}">
                                        <div class="img-container">
                                            <c:if test="${!p.status}"><div class="sold-out-badge">HẾT HÀNG</div></c:if>
                                            <c:choose>
                                                <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                                    <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:when>
                                                <c:otherwise>
                                                    <%-- API lấy ảnh chính xác hơn bằng cách kết hợp nhiều từ khóa và lọc tên SP --%>
                                                    <c:set var="cleanName" value="${p.name.replaceAll('(?i)(10ml|Fullbox|Chính hãng|Nước hoa|Perfume)', '').trim()}"/>
                                                    <img src="https://loremflickr.com/400/400/fragrance,perfume,${cleanName.replaceAll(' ', ',')}/all?lock=${p.id}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:otherwise>
                                            </c:choose>
                                            <div class="img-overlay">
                                                <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                                    <i class="fas fa-eye me-2"></i> Chi tiết
                                                </a>
                                                <c:if test="${p.status}">
                                                    <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}" class="btn-overlay"><i class="fas fa-shopping-cart me-2"></i> Mua ngay</a>
                                                </c:if>
                                            </div>
                                        </div>
                                        <div class="product-info">
                                            <h5 class="card-title">${p.name}</h5>
                                            <div class="price-container text-start">
                                                <c:choose>
                                                    <c:when test="${p.discount_price > 0}">
                                                        <span class="text-danger fw-800" style="font-size: 1.1rem;"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                                        <span class="text-muted small text-decoration-line-through d-block"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</span>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <p class="product-price mb-0 fw-800"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                            <c:if test="${p.status}">
                                                <c:set var="sv" value="<%= stockRandom.nextInt(10) + 1 %>"/>
                                                <span class="stock-badge ${sv <= 3 ? 'low' : ''}"><i class="fas fa-box-open" style="font-size:0.6rem;"></i> Còn ${sv} chai</span>
                                            </c:if>
                                        </div>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </div>

                    <!-- PHẦN 2: NƯỚC HOA NỮ -->
                    <div class="category-section mb-5">
                        <div class="category-header-strip mt-4">
                            <h5>Nước hoa Nữ</h5>
                            <span>Nước hoa Nữ</span>
                        </div>
                        <div class="category-banner" onclick="location.href='${pageContext.request.contextPath}/home?id_category=2'">
                            <img src="${not empty bannerWomen ? bannerWomen : pageContext.request.contextPath.concat('/api/image?name=women-perfume-banner.png')}" alt="Women Perfume Banner">
                            <div class="category-banner-overlay">
                                <h2 class="category-banner-title">Nước hoa Nữ</h2>
                                <div class="category-banner-link">Xem tất cả sản phẩm <i class="fas fa-arrow-right"></i></div>
                            </div>
                        </div>
                        <div class="row g-4">
                            <c:forEach items="${womenProducts}" var="p" end="3">
                                <div class="col-xl-3 col-lg-4 col-md-6">
                                    <div class="product-card-custom ${!p.status ? 'sold-out' : ''}">
                                        <div class="img-container">
                                            <c:if test="${!p.status}"><div class="sold-out-badge">HẾT HÀNG</div></c:if>
                                            <c:choose>
                                                <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                                    <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:when>
                                                <c:otherwise>
                                                    <img src="https://loremflickr.com/400/400/perfume,bottle,${p.name}/all?lock=${p.id}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:otherwise>
                                            </c:choose>
                                            <div class="img-overlay">
                                                <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                                    <i class="fas fa-eye me-2"></i> Chi tiết
                                                </a>
                                                <c:if test="${p.status}">
                                                    <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}" class="btn-overlay"><i class="fas fa-shopping-cart me-2"></i> Mua ngay</a>
                                                </c:if>
                                            </div>
                                        </div>
                                        <div class="product-info">
                                            <h5 class="card-title">${p.name}</h5>
                                            <div class="price-container text-start">
                                                <c:choose>
                                                    <c:when test="${p.discount_price > 0}">
                                                        <span class="text-danger fw-800" style="font-size: 1.1rem;"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                                        <span class="text-muted small text-decoration-line-through d-block"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</span>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <p class="product-price mb-0 fw-800"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                            <c:if test="${p.status}">
                                                <c:set var="sv" value="<%= stockRandom.nextInt(10) + 1 %>"/>
                                                <span class="stock-badge ${sv <= 3 ? 'low' : ''}"><i class="fas fa-box-open" style="font-size:0.6rem;"></i> Còn ${sv} chai</span>
                                            </c:if>
                                        </div>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </div>

                    <!-- PHẦN 3: NƯỚC HOA UNISEX -->
                    <div class="category-section mb-5">
                        <div class="category-header-strip mt-4">
                            <h5>Nước hoa Unisex</h5>
                            <span>Nước hoa Unisex</span>
                        </div>
                        <div class="category-banner" onclick="location.href='${pageContext.request.contextPath}/home?id_category=3'">
                            <img src="${not empty bannerUnisex ? bannerUnisex : pageContext.request.contextPath.concat('/api/image?name=unisex-perfume-banner.png')}" alt="Unisex Perfume Banner">
                            <div class="category-banner-overlay">
                                <h2 class="category-banner-title">Nước hoa Unisex</h2>
                                <div class="category-banner-link">Xem tất cả sản phẩm <i class="fas fa-arrow-right"></i></div>
                            </div>
                        </div>
                        <div class="row g-4">
                            <c:forEach items="${unisexProducts}" var="p" end="3">
                                <div class="col-xl-3 col-lg-4 col-md-6">
                                    <div class="product-card-custom ${!p.status ? 'sold-out' : ''}">
                                        <div class="img-container">
                                            <c:if test="${!p.status}"><div class="sold-out-badge">HẾT HÀNG</div></c:if>
                                            <c:choose>
                                                <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                                    <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:when>
                                                <c:otherwise>
                                                    <img src="https://loremflickr.com/400/400/perfume,bottle,${p.name}/all?lock=${p.id}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:otherwise>
                                            </c:choose>
                                            <div class="img-overlay">
                                                <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                                    <i class="fas fa-eye me-2"></i> Chi tiết
                                                </a>
                                                <c:if test="${p.status}">
                                                    <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}" class="btn-overlay"><i class="fas fa-shopping-cart me-2"></i> Mua ngay</a>
                                                </c:if>
                                            </div>
                                        </div>
                                        <div class="product-info">
                                            <h5 class="card-title">${p.name}</h5>
                                            <div class="price-container text-start">
                                                <c:choose>
                                                    <c:when test="${p.discount_price > 0}">
                                                        <span class="text-danger fw-800" style="font-size: 1.1rem;"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                                        <span class="text-muted small text-decoration-line-through d-block"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</span>
                                                    </c:when>
                                                    <c:otherwise>
                                                        <p class="product-price mb-0 fw-800"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                    </c:otherwise>
                                                </c:choose>
                                            </div>
                                            <c:if test="${p.status}">
                                                <c:set var="sv" value="<%= stockRandom.nextInt(10) + 1 %>"/>
                                                <span class="stock-badge ${sv <= 3 ? 'low' : ''}"><i class="fas fa-box-open" style="font-size:0.6rem;"></i> Còn ${sv} chai</span>
                                            </c:if>
                                        </div>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                    </div>
                </c:when>

                <%-- TRƯỜNG HỢP ĐANG LỌC: HIỂN THỊ DANH SÁCH BÌNH THƯỜNG --%>
                <c:otherwise>
                    <header class="mb-5 d-flex justify-content-between align-items-center">
                        <h4 class="fw-800 m-0" style="letter-spacing: -0.5px;">${not empty pageTitle ? pageTitle : 'Sản phẩm'}</h4>
                        <div class="d-flex align-items-center gap-3">
                            <div class="small text-muted">Hiển thị <span class="fw-bold text-dark">${listProducts.size()}</span> sản phẩm</div>
                            <form action="${pageContext.request.contextPath}/home" method="GET" class="d-flex align-items-center gap-2">
                                <input type="hidden" name="txtSearch" value="${param.txtSearch}">
                                <input type="hidden" name="keyword" value="${param.keyword}">
                                <input type="hidden" name="id_category" value="${param.id_category}">
                                <input type="hidden" name="brand_id" value="${param.brand_id}">
                                <input type="hidden" name="price_range" value="${param.price_range}">
                                <label class="small text-muted mb-0">Sắp xếp:</label>
                                <select name="sort" class="form-select form-select-sm" onchange="this.form.submit()">
                                    <option value="newest" ${param.sort == 'newest' || empty param.sort ? 'selected' : ''}>Mới nhất</option>
                                    <option value="price_asc" ${param.sort == 'price_asc' ? 'selected' : ''}>Giá tăng dần</option>
                                    <option value="price_desc" ${param.sort == 'price_desc' ? 'selected' : ''}>Giá giảm dần</option>
                                </select>
                            </form>
                        </div>
                    </header>

                    <div class="row g-4">
                        <c:choose>
                            <c:when test="${not empty listProducts}">
                                <c:forEach items="${listProducts}" var="p">
                                    <div class="col-lg-3 col-md-6 col-sm-6">
                                        <div class="product-card-custom ${!p.status ? 'sold-out' : ''}">
                                            <div class="img-container">
                                            <c:if test="${!p.status}"><div class="sold-out-badge">HẾT HÀNG</div></c:if>
                                            <c:choose>
                                                <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                                    <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:when>
                                                <c:otherwise>
                                                    <img src="https://loremflickr.com/400/400/perfume,bottle,${p.name}/all?lock=${p.id}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                                </c:otherwise>
                                            </c:choose>
                                            <div class="img-overlay">
                                                    <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                                        <i class="fas fa-eye me-2"></i> Chi tiết
                                                    </a>
                                                    <c:if test="${p.status}">
                                                        <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}&page=${currentPage}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.keyword ? '&keyword='.concat(param.keyword) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}${not empty param.price_range ? '&price_range='.concat(param.price_range) : ''}${not empty param.sort ? '&sort='.concat(param.sort) : ''}" class="btn-overlay"><i class="fas fa-shopping-cart me-2"></i> Mua ngay</a>
                                                    </c:if>
                                                </div>
                                            </div>
                                            <div class="product-info">
                                                <h5 class="card-title">${p.name}</h5>
                                                <div class="price-container text-start">
                                                    <c:choose>
                                                        <c:when test="${p.discount_price > 0}">
                                                            <span class="text-danger fw-800" style="font-size: 1.1rem;"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                                            <span class="text-muted small text-decoration-line-through d-block"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <p class="product-price mb-0 fw-800"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </div>
                                                <c:if test="${p.status}">
                                                    <c:set var="sv" value="<%= stockRandom.nextInt(10) + 1 %>"/>
                                                    <span class="stock-badge ${sv <= 3 ? 'low' : ''}"><i class="fas fa-box-open" style="font-size:0.6rem;"></i> Còn ${sv} chai</span>
                                                </c:if>
                                            </div>
                                        </div>
                                    </div>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <div class="col-12 text-center py-5">
                                    <div class="mb-3 text-muted opacity-50"><i class="fas fa-search fa-4x"></i></div>
                                    <p class="text-muted fw-bold">Rất tiếc, chúng tôi không tìm thấy sản phẩm nào.</p>
                                </div>
                            </c:otherwise>
                        </c:choose>
                    </div>

                    <%-- Pagination --%>
                    <c:if test="${totalPages > 1}">
                        <nav class="mt-5 pt-4 border-top">
                            <ul class="pagination justify-content-center">
                                <li class="page-item ${currentPage == 1 ? 'disabled' : ''}">
                                    <a class="page-link border-0" href="home?page=${currentPage - 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.keyword ? '&keyword='.concat(param.keyword) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}${not empty param.price_range ? '&price_range='.concat(param.price_range) : ''}${not empty param.sort ? '&sort='.concat(param.sort) : ''}">
                                        <i class="fas fa-chevron-left"></i>
                                    </a>
                                </li>
                                <c:forEach begin="1" end="${totalPages}" var="i">
                                    <li class="page-item ${currentPage == i ? 'active' : ''}">
                                        <a class="page-link" href="home?page=${i}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.keyword ? '&keyword='.concat(param.keyword) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}${not empty param.price_range ? '&price_range='.concat(param.price_range) : ''}${not empty param.sort ? '&sort='.concat(param.sort) : ''}">${i}</a>
                                    </li>
                                </c:forEach>
                                <li class="page-item ${currentPage == totalPages ? 'disabled' : ''}">
                                    <a class="page-link border-0" href="home?page=${currentPage + 1}${not empty param.txtSearch ? '&txtSearch='.concat(param.txtSearch) : ''}${not empty param.keyword ? '&keyword='.concat(param.keyword) : ''}${not empty param.id_category ? '&id_category='.concat(param.id_category) : ''}${not empty param.brand_id ? '&brand_id='.concat(param.brand_id) : ''}${not empty param.price_range ? '&price_range='.concat(param.price_range) : ''}${not empty param.sort ? '&sort='.concat(param.sort) : ''}">
                                        <i class="fas fa-chevron-right"></i>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </c:if>
                </c:otherwise>
            </c:choose>
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
