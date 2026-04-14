<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    
    <style>
        .perfume-header {
            background-color: #003D2E;
            color: white;
            padding: 15px 0;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        }
        /* Glassmorphism style for dropdowns - Darker for contrast */
        .glass-dropdown {
            background: rgba(0, 61, 46, 0.8) !important; /* Dark Green Glass */
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 15px !important;
            padding: 15px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
            min-width: 250px !important;
        }
        .glass-dropdown .dropdown-item {
            color: rgba(255, 255, 255, 0.9) !important;
            border-radius: 10px;
            transition: all 0.3s;
            font-size: 0.85rem;
            padding: 10px 15px;
            font-weight: 500;
        }
        .glass-dropdown .dropdown-item:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            color: #ffc107 !important;
            transform: translateX(8px);
        }
        .user-dropdown-toggle {
            color: white !important;
            text-decoration: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        .user-info-box {
            padding: 0 0 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 12px;
        }
        .user-info-box p {
            margin: 0;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 5px;
        }
        .user-info-box .user-name {
            font-weight: 800;
            color: white;
            font-size: 1rem;
            margin-bottom: 5px;
        }
        .user-dropdown-toggle::after {
            display: none; /* Ẩn mũi tên mặc định của Bootstrap */
        }
        .user-dropdown-toggle:hover {
            opacity: 0.8;
        }
        
        /* Hiển thị dropdown khi hover để tiện lợi hơn */
        .user-area.dropdown:hover > .glass-dropdown {
            display: block;
            visibility: visible;
            opacity: 1;
            margin-top: 0;
        }
        .search-box .input-group {
            background: white;
            border-radius: 4px;
            overflow: hidden;
        }
        .search-box input {
            border: none !important;
            box-shadow: none !important;
            font-size: 0.9rem;
        }
        .search-box button {
            background: white;
            border: none;
            color: #666;
            padding-right: 15px;
        }
        .logo-text {
            color: white !important;
            font-size: 1.8rem;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-decoration: none;
        }
        .tagline {
            color: rgba(255, 255, 255, 0.9) !important;
            font-style: italic;
            font-size: 0.8rem;
        }
        .btn-login-text {
            color: white !important;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.85rem;
        }
        .cart-icon-wrapper {
            position: relative;
            margin-left: 15px;
            color: white;
            text-decoration: none;
        }
        .cart-badge {
            position: absolute;
            top: -10px;
            right: -12px;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 50%;
            background-color: #dc3545;
            color: white;
        }
        /* Style cho Wishlist tương tự như Cart */
        .wishlist-icon-wrapper {
            position: relative;
            color: white;
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .wishlist-icon-wrapper:hover {
            color: #ff4757; /* Màu đỏ khi hover */
        }

        .wishlist-badge {
            position: absolute;
            top: -10px;
            right: -12px;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 50%;
            background-color: #ff4757; /* Màu đỏ của tim */
            color: white;
            border: 1px solid #003D2E; /* Tạo viền để tách biệt với nền xanh */
        }

        /* Đồng nhất khoảng cách cho icon giỏ hàng */
        .cart-icon-wrapper:hover {
            color: #ffc107; /* Màu vàng nhẹ khi hover giỏ hàng */
        }

        .cart-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            background: #198754;
            color: #fff;
            border-radius: 10px;
            padding: 12px 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transform: translateY(-8px);
            transition: all 0.3s ease;
        }
        .cart-toast.show {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <c:if test="${param.cart == 'added'}">
        <div id="cart-toast" class="cart-toast">
            <i class="fas fa-check-circle me-2"></i> Đã thêm sản phẩm vào giỏ hàng.
        </div>
        <script>
            window.addEventListener('DOMContentLoaded', function () {
                var toast = document.getElementById('cart-toast');
                if (!toast) return;
                setTimeout(function () { toast.classList.add('show'); }, 50);
                setTimeout(function () { toast.classList.remove('show'); }, 2600);
            });
        </script>
    </c:if>
    
    <div class="perfume-header">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <a href="${pageContext.request.contextPath}/home" class="text-decoration-none">
                        <h2 class="logo-text m-0 animate__animated animate__fadeInLeft">HUY PERFUME</h2>
                    </a>
                </div>
                <div class="col-md-5">
                    <div class="search-box">
                        <form action="${pageContext.request.contextPath}/home" method="GET">
                            <div class="input-group">
                                <input type="text" name="txtSearch" class="form-control" placeholder="Tìm kiếm mùi hương của bạn..." value="${param.txtSearch}">
                                <button class="btn btn-search" type="submit">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="d-flex justify-content-end align-items-center">
                        <div class="user-area text-end dropdown me-4">
                            <c:choose>
                                <c:when test="${not empty sessionScope.user}">
                                    <div class="user-dropdown-toggle" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                                        <i class="fas fa-user-circle fa-lg"></i>
                                        <span class="small fw-bold ms-2">Hi, ${sessionScope.user.name} <i class="fas fa-chevron-down small ms-1"></i></span>
                                    </div>
                                    <ul class="dropdown-menu glass-dropdown animate__animated animate__fadeInDown" aria-labelledby="userMenu" style="right: 0; left: auto;">
                                        <div class="user-info-box">
                                            <p class="user-name">${sessionScope.user.name}</p>
                                            <p><i class="fas fa-phone-alt me-2"></i>${sessionScope.user.phone}</p>
                                            <p><i class="fas fa-map-marker-alt me-2"></i>${sessionScope.user.getAddress()}</p>
                                        </div>
                                        <li><a class="dropdown-item" href="${pageContext.request.contextPath}/profile"><i class="fas fa-user-edit me-2"></i>Thông tin cá nhân</a></li>
                                        <li><a class="dropdown-item" href="${pageContext.request.contextPath}/order-history"><i class="fas fa-history me-2"></i>Lịch sử đơn hàng</a></li>
                                        <c:if test="${sessionScope.user.role == 'admin'}">
                                            <li><a class="dropdown-item text-warning" href="${pageContext.request.contextPath}/admin"><i class="fas fa-shield-alt me-2"></i>Trang quản trị</a></li>
                                        </c:if>
                                        <li><hr class="dropdown-divider bg-light opacity-25"></li>
                                        <li><a class="dropdown-item text-danger fw-bold" href="${pageContext.request.contextPath}/logout"><i class="fas fa-sign-out-alt me-2"></i>ĐĂNG XUẤT</a></li>
                                    </ul>
                                </c:when>
                                <c:otherwise>
                                    <a href="${pageContext.request.contextPath}/login" class="btn-login-text text-decoration-none">Đăng nhập</a>
                                    <span class="mx-1 text-white-50">|</span>
                                    <a href="${pageContext.request.contextPath}/register" class="btn-login-text text-decoration-none">Đăng ký</a>
                                </c:otherwise>
                            </c:choose>
                        </div>

                        <a href="${pageContext.request.contextPath}/wishlist" class="wishlist-icon-wrapper ms-3">
                            <i class="fa-solid fa-heart fa-lg"></i>
                            <span class="wishlist-badge" id="wishlist-count">
                                ${not empty sessionScope.wishlistCount ? sessionScope.wishlistCount : (not empty sessionScope.wishlist ? sessionScope.wishlist.size() : 0)}
                            </span>
                        </a>

                        <a href="${pageContext.request.contextPath}/cart" class="cart-icon-wrapper ms-3">
                            <i class="fa-solid fa-cart-shopping fa-lg"></i>
                            <span class="cart-badge">
                                ${not empty sessionScope.cart ? sessionScope.cart.size() : 0}
                            </span>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </div>
</body>
</html>
