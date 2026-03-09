<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- 1. Import Header và Navbar từ cùng thư mục inc --%>
<c:import url="header.jsp"/>
<c:import url="navbar.jsp"/>

<style>
    /* CSS tùy chỉnh cho trang Wishlist */
    .wishlist-container {
        padding: 50px 0;
        min-height: 60vh;
    }
    .wishlist-card {
        border: none;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border-radius: 12px;
        overflow: hidden;
    }
    .wishlist-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .wishlist-img {
        height: 250px;
        object-fit: cover;
    }
    .btn-remove {
        color: #dc3545;
        background: #fff5f5;
        border: 1px solid #ffc1c1;
    }
    .btn-remove:hover {
        background: #dc3545;
        color: #fff;
    }
    .empty-wishlist {
        padding: 100px 0;
    }
</style>

<div class="container wishlist-container my-5">
    <div class="row">
        <%-- Sidebar DANH MỤC + THƯƠNG HIỆU (giống trang chủ) --%>
        <div class="col-lg-3 col-md-4">
            <div class="sidebar p-3 border rounded">
                <h6 class="mb-3 text-uppercase fw-bold">DANH MỤC</h6>
                <ul class="list-unstyled mb-4">
                    <li>
                        <a href="${pageContext.request.contextPath}/home" class="text-dark d-block py-1">Tất cả Sản phẩm</a>
                    </li>
                    <c:forEach items="${listCategory}" var="c">
                        <li>
                            <a href="${pageContext.request.contextPath}/home?id_category=${c.id}" class="text-dark d-block py-1">${c.name}</a>
                        </li>
                    </c:forEach>
                </ul>
                <hr>
                <form action="${pageContext.request.contextPath}/home" method="GET">
                    <h6 class="mb-3 text-uppercase fw-bold">THƯƠNG HIỆU</h6>
                    <c:forEach items="${listBrands}" var="brand">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="brand_id" value="${brand.id}" id="wl-brand${brand.id}">
                            <label class="form-check-label" for="wl-brand${brand.id}">${brand.name}</label>
                        </div>
                    </c:forEach>
                    <button type="submit" class="btn btn-sm btn-success w-100 mt-3">Lọc sản phẩm</button>
                </form>
            </div>
        </div>

        <div class="col-lg-9 col-md-8">
            <div class="row mb-4">
                <div class="col-12">
                    <h2 class="fw-bold"><i class="fa-solid fa-heart text-danger me-2"></i>SẢN PHẨM YÊU THÍCH</h2>
                    <hr>
                </div>
            </div>

            <div class="row">
        <c:choose>
            <%-- 2. Kiểm tra danh sách trong Session --%>
            <c:when test="${not empty sessionScope.wishlist}">
                <c:forEach items="${sessionScope.wishlist}" var="p">
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                        <div class="card wishlist-card shadow-sm h-100">
                            <%-- Hiển thị ảnh sản phẩm --%>
                            <img src="${pageContext.request.contextPath}/assets/images/${p.image}" class="card-img-top wishlist-img" alt="${p.name}">
                            
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title text-truncate" title="${p.name}">${p.name}</h5>
                                <p class="card-text text-danger fw-bold fs-5">${p.price} VNĐ</p>
                                
                                <div class="mt-auto d-grid gap-2">
                                    <%-- Nút thêm vào giỏ hàng --%>
                                    <a href="${pageContext.request.contextPath}/home?add_to_cart=${p.id}" class="btn btn-gold btn-sm">
                                        <i class="fa-solid fa-cart-plus me-1"></i>Thêm vào giỏ
                                    </a>
                                    <%-- Nút xóa khỏi yêu thích (action=remove) --%>
                                    <a href="${pageContext.request.contextPath}/wishlist?action=remove&id=${p.id}" class="btn btn-remove btn-sm">
                                        <i class="fa-solid fa-trash-can me-1"></i>Xóa khỏi danh sách
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </c:forEach>
            </c:when>

            <%-- 3. Giao diện khi danh sách trống --%>
            <c:otherwise>
                <div class="col-12 text-center empty-wishlist">
                    <img src="https://cdn-icons-png.flaticon.com/512/5089/5089733.png" width="120" class="mb-3 opacity-50">
                    <h4 class="text-muted">Danh sách yêu thích của bạn đang trống!</h4>
                    <p class="mb-4">Hãy thêm những sản phẩm bạn yêu thích để dễ dàng theo dõi và mua sắm.</p>
                    <a href="${pageContext.request.contextPath}/home" class="btn btn-gold btn-lg px-5">
                        TIẾP TỤC KHÁM PHÁ
                    </a>
                </div>
            </c:otherwise>
        </c:choose>
            </div>
        </div>
    </div>
</div>
<c:import url="footer.jsp"/>