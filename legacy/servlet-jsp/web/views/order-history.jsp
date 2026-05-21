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
                                    <c:choose>
                                        <c:when test="${not empty item.image && (item.image.startsWith('http') || item.image.endsWith('.jpg') || item.image.endsWith('.jpeg') || item.image.endsWith('.png') || item.image.endsWith('.webp') || item.image.endsWith('.gif'))}">
                                            <img src="${item.image.startsWith('http') ? item.image : pageContext.request.contextPath.concat('/api/image?name=').concat(item.image)}" class="product-img">
                                        </c:when>
                                        <c:otherwise>
                                            <img src="https://loremflickr.com/100/100/perfume,bottle,${item.name}/all?lock=${item.id}" class="product-img">
                                        </c:otherwise>
                                    </c:choose>
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
                            <div class="d-flex flex-column gap-2">
                                <div>
                                    <span class="text-muted small">Thanh toán: </span>
                                    <span class="badge bg-light text-dark border">${order.payment_method}</span>
                                    <span class="badge ${order.status == 'Đã hủy' ? 'bg-danger' : (order.status == 'Giao hàng thành công' ? 'bg-success' : 'bg-warning')} ms-2">${order.status}</span>
                                </div>
                                <c:if test="${order.status == 'Giao hàng thành công'}">
                                    <div class="alert alert-info py-2 px-3 m-0" style="font-size: 0.75rem;">
                                        <i class="fas fa-info-circle me-1"></i> 
                                        Nếu sản phẩm không đúng, vui lòng liên hệ <b>Chatbox</b> để được hỗ trợ đổi trả.
                                    </div>
                                </c:if>
                            </div>
                            <div class="text-end">
                                <div class="mb-2">
                                    <span class="text-muted me-2">Tổng cộng:</span>
                                    <h4 class="fw-bold d-inline-block m-0" style="color: #003D2E;">
                                        <fmt:formatNumber value="${order.total}" pattern="#,##0"/>đ
                                    </h4>
                                </div>
                                
                                <jsp:useBean id="now" class="java.util.Date" />
                                <c:set var="diff" value="${now.time - order.created_at.time}" />
                                <c:set var="diffMin" value="${diff / (1000 * 60)}" />
                                
                                <c:if test="${diffMin <= 5 && order.status != 'Đã hủy' && order.status != 'Paid'}">
                                    <form action="${pageContext.request.contextPath}/order/cancel" method="POST" onsubmit="return confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')">
                                        <input type="hidden" name="orderId" value="${order.id}">
                                        <button type="submit" class="btn btn-sm btn-outline-danger rounded-pill px-3">Hủy đơn hàng</button>
                                    </form>
                                </c:if>
                            </div>
                        </div>
                    </div>
                </c:forEach>
            </c:otherwise>
        </c:choose>
    </div>
</section>

<c:import url="/inc/footer.jsp"/>
