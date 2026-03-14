<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .history-section {
        background: #f8f9fa;
        padding: 60px 0;
        min-height: 80vh;
    }
    .order-card {
        background: #ffffff; /* Bỏ Glassmorphism cho phần này để rõ ràng hơn */
        border: 1px solid #eee;
        border-radius: 15px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        margin-bottom: 30px;
        overflow: hidden;
        transition: transform 0.3s ease;
    }
    .order-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .order-header {
        background: #003D2E;
        color: white;
        padding: 18px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        letter-spacing: 1px;
    }
    .order-body {
        padding: 0 25px;
    }
    .product-item {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 0;
        border-bottom: 1px solid #f5f5f5;
    }
    .product-item:last-child {
        border-bottom: none;
    }
    .product-img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid #eee;
        background: #f9f9f9;
        display: block; /* Đảm bảo hiển thị */
    }
    .product-info-name {
        font-weight: 700;
        color: #333;
        font-size: 1rem;
        margin-bottom: 5px;
    }
    .order-footer {
        padding: 20px 25px;
        background: rgba(0, 61, 46, 0.02);
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .btn-guna {
        background: #003D2E;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 1px;
    }
    .btn-guna:hover {
        background: #005e47;
        box-shadow: 0 5px 15px rgba(0, 61, 46, 0.2);
        color: white;
    }
    .empty-state {
        text-align: center;
        padding: 100px 0;
    }
    .empty-state i {
        font-size: 80px;
        color: #eee;
        margin-bottom: 20px;
    }
</style>

<section class="history-section">
    <div class="container">
        <h2 class="fw-bold mb-5 text-center" style="color: #003D2E;">LỊCH SỬ MUA HÀNG</h2>

        <c:choose>
            <c:when test="${empty orders}">
                <div class="empty-state animate__animated animate__fadeIn">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>Bạn chưa có đơn hàng nào</h4>
                    <p class="text-muted">Hãy khám phá các mùi hương tuyệt vời tại Huy Perfume nhé!</p>
                    <a href="home" class="btn btn-guna mt-3">Mua sắm ngay</a>
                </div>
            </c:when>
            <c:otherwise>
                <c:forEach items="${orders}" var="order">
                    <div class="order-card animate__animated animate__fadeInUp">
                        <div class="order-header">
                            <span>MÃ ĐƠN HÀNG: #HP-${order.id}</span>
                            <span class="small opacity-75">
                                <fmt:formatDate value="${order.created_at}" pattern="dd/MM/yyyy HH:mm"/>
                            </span>
                        </div>
                        <div class="order-body">
                            <c:forEach items="${order.items}" var="item">
                                <div class="product-item">
                                    <img src="${pageContext.request.contextPath}/assets/images/${item.image}" class="product-img">
                                    <div class="flex-grow-1">
                                        <h6 class="product-info-name mb-1">${item.name}</h6>
                                        <small class="text-muted">Số lượng: ${item.quantity}</small>
                                    </div>
                                    <div class="text-end">
                                        <span class="fw-bold text-dark">
                                            <fmt:formatNumber value="${item.price}" pattern="#,##0"/>đ
                                        </span>
                                    </div>
                                </div>
                            </c:forEach>
                        </div>
                        <div class="order-footer">
                            <div>
                                <span class="text-muted small">Thanh toán: </span>
                                <span class="badge bg-light text-dark border">${order.payment_method}</span>
                            </div>
                            <div class="text-end">
                                <span class="text-muted me-2">Tổng cộng:</span>
                                <h4 class="fw-bold d-inline-block m-0" style="color: #003D2E;">
                                    <fmt:formatNumber value="${order.total}" pattern="#,##0"/>đ
                                </h4>
                            </div>
                        </div>
                    </div>
                </c:forEach>
            </c:otherwise>
        </c:choose>
    </div>
</section>

<c:import url="/inc/footer.jsp"/>
