<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<style>
    /* Reset & Base Navbar Style */
    .nav-main {
        background: #ffffff;
        border-bottom: 1px solid #f0f0f0;
        padding: 0;
        font-family: 'Montserrat', sans-serif;
    }

    .nav-main .navbar-nav {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .nav-main .nav-item {
        padding: 0 10px;
    }

    .nav-main .nav-link {
        color: #000000 !important;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        padding: 20px 5px !important;
        letter-spacing: 0.5px;
        position: relative;
        transition: color 0.3s ease;
    }

    /* Hiệu ứng gạch chân khi hover */
    .nav-main .nav-link::after {
        content: '';
        position: absolute;
        bottom: 15px;
        left: 5px;
        right: 5px;
        height: 2px;
        background: #003D2E;
        transform: scaleX(0);
        transition: transform 0.3s ease;
    }

    .nav-main .nav-link:hover::after {
        transform: scaleX(1);
    }

    .nav-main .nav-link:hover {
        color: #003D2E !important;
    }

    /* Dropdown Arrow Style */
    .nav-main .dropdown-toggle::after {
        content: '\f105'; /* FontAwesome angle-right */
        font-family: 'Font Awesome 6 Free';
        font-weight: 900;
        border: none;
        vertical-align: middle;
        margin-left: 5px;
        font-size: 12px;
    }

    /* Dropdown Menu Style - Mega Menu Style */
    .nav-main .dropdown-menu {
        border: 1px solid #eee;
        border-radius: 0; /* Chuyển sang dạng cứng cáp */
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        padding: 25px;
        margin-top: 0;
        min-width: 800px;
        left: 50%;
        transform: translateX(-50%);
        border-top: 3px solid #003D2E; /* Tạo điểm nhấn cứng cáp */
    }

    /* Đảm bảo Dropdown hiển thị khi Hover - Dạng phẳng */
    .nav-main .nav-item.dropdown:hover > .dropdown-menu {
        display: block;
        visibility: visible;
        opacity: 1;
    }

    .nav-main .mega-menu-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
    }

    .mega-menu-column h6 {
        font-size: 12px;
        font-weight: 700;
        color: #003D2E;
        text-transform: uppercase;
        margin-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 6px;
    }

    .nav-main .dropdown-item {
        font-size: 12px;
        font-weight: 500;
        padding: 5px 0;
        text-transform: none;
        color: #555;
        white-space: normal;
        border: none !important;
    }

    .nav-main .dropdown-item:hover {
        background: transparent;
        color: #003D2E;
        text-decoration: underline;
    }

    /* Mobile Style */
    @media (max-width: 991px) {
        .nav-main .navbar-nav { flex-direction: column; align-items: flex-start; }
        .nav-main .nav-link { padding: 10px 20px !important; }
        .nav-main .nav-link::after { display: none; }
    }

    .nav-search {
        border-top: 1px solid #f0f0f0;
        background: #fff;
        padding: 12px 0;
    }
</style>

<nav class="navbar navbar-expand-lg nav-main">
    <div class="container">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarMain">
            <ul class="navbar-nav">
                
                <li class="nav-item">
                    <a class="nav-link" href="${pageContext.request.contextPath}/home">TRANG CHỦ</a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="${pageContext.request.contextPath}/about">GIỚI THIỆU</a>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="brandsDropdown" role="button" data-bs-toggle="dropdown">
                        THƯƠNG HIỆU
                    </a>
                    <ul class="dropdown-menu">
                        <div class="mega-menu-grid">
                            <div class="mega-menu-column">
                                <h6>Thương hiệu HOT</h6>
                                <c:forEach items="${listBrands}" var="brand" end="5">
                                    <a class="dropdown-item" href="${pageContext.request.contextPath}/home?brand_id=${brand.id}">
                                        ${brand.name}
                                    </a>
                                </c:forEach>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Thương hiệu Cao cấp</h6>
                                <c:forEach items="${listBrands}" var="brand" begin="6" end="11">
                                    <a class="dropdown-item" href="${pageContext.request.contextPath}/home?brand_id=${brand.id}">
                                        ${brand.name}
                                    </a>
                                </c:forEach>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Sản phẩm mới</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/all-products">Tất cả sản phẩm</a>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/blog">Kiến thức nước hoa</a>
                            </div>
                        </div>
                    </ul>
                </li>
                
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="perfumeDropdown" role="button" data-bs-toggle="dropdown">
                        NƯỚC HOA
                    </a>
                    <ul class="dropdown-menu">
                        <div class="mega-menu-grid">
                            <div class="mega-menu-column">
                                <h6>Dành cho Nam</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=1">Nước hoa Nam</a>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5">Nước hoa chiết Nam</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Dành cho Nữ</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=2">Nước hoa Nữ</a>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5">Nước hoa chiết Nữ</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Unisex</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=3">Nước hoa Unisex</a>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=4">Nước hoa Mini</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Phân loại khác</h6>
                                <c:forEach items="${listCategory}" var="c">
                                    <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=${c.id}">
                                        ${c.name}
                                    </a>
                                </c:forEach>
                            </div>
                        </div>
                    </ul>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="decantDropdown" role="button" data-bs-toggle="dropdown">
                        NƯỚC HOA CHIẾT
                    </a>
                    <ul class="dropdown-menu">
                        <div class="mega-menu-grid">
                            <div class="mega-menu-column">
                                <h6>Chiết bán chạy</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5&brand_id=1">Dior Chiết</a>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5&brand_id=2">Chanel Chiết</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Chiết Nam</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5">Tất cả chiết Nam</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Chiết Nữ</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5">Tất cả chiết Nữ</a>
                            </div>
                            <div class="mega-menu-column">
                                <h6>Ưu đãi</h6>
                                <a class="dropdown-item" href="${pageContext.request.contextPath}/home?id_category=5">Combo chiết tiết kiệm</a>
                            </div>
                        </div>
                    </ul>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="${pageContext.request.contextPath}/knowledge">KIẾN THỨC</a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="${pageContext.request.contextPath}/blog">BLOG</a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="${pageContext.request.contextPath}/contact">LIÊN HỆ</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<div class="nav-search">
    <div class="container">
        <form action="${pageContext.request.contextPath}/home" method="get" class="d-flex gap-2">
            <input
                type="text"
                name="keyword"
                class="form-control"
                placeholder="Tìm kiếm sản phẩm..."
                value="${not empty param.keyword ? param.keyword : param.txtSearch}">
            <button type="submit" class="btn btn-dark px-4">Tìm</button>
        </form>
    </div>
</div>
