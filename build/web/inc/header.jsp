<%@ page contentType="text/html; charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        .perfume-header {
            background-color: #003D2E;
            color: white;
            padding: 15px 0;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
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
    </style>
</head>
<body>
    
    <div class="perfume-header">
        <div class="container">
            <div class="row align-items-center">
                
                <div class="col-md-4">
                    <form action="${pageContext.request.contextPath}/home" method="get" class="search-box">
                        <div class="input-group">
                            <input type="text" name="txtSearch" class="form-control" placeholder="Tìm kiếm sản phẩm...">
                            <button type="submit"><i class="fas fa-search"></i></button>
                        </div>
                    </form>
                </div>
                    <div class="col-md-4 text-center">
                        <a href="${pageContext.request.contextPath}/home" class="logo-text">HUY PERFUME</a>
                        <div class="tagline">Magic Of Your Emotions</div>
                    </div>

                    <div class="col-md-4">
                  <div class="d-flex justify-content-end align-items-center">
        <div class="user-area text-end">
            <c:choose>
                <c:when test="${not empty sessionScope.user}">
                    <span class="text-white me-2 small">Hi, ${sessionScope.user.name}</span>
                    <a href="${pageContext.request.contextPath}/logout" class="btn-login-text text-decoration-none">Đăng xuất</a>
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
                ${not empty sessionScope.wishlist ? sessionScope.wishlist.size() : 0}
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