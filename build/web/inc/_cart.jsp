<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@page contentType="text/html" pageEncoding="UTF-8"%>

<section class="h-100" style="background-color: #f8f9fa;">
    <div class="container py-5">
        <div class="row d-flex justify-content-center">
            <div class="col-10">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="fw-bold mb-0 text-black">Giỏ hàng của bạn</h3>
                    <p class="mb-0 text-muted">Bạn có <span class="fw-bold text-success">${not empty sessionScope.cart ? sessionScope.cart.size() : 0}</span> sản phẩm</p>
                </div>

                <c:set var="total" value="0"/>

                <c:choose>
                    <%-- Trường hợp giỏ hàng trống --%>
                    <c:when test="${empty sessionScope.cart or sessionScope.cart.size() == 0}">
                        <div class="card shadow-sm border-0 text-center p-5">
                            <div class="card-body">
                                <i class="fas fa-shopping-cart fa-4x text-light mb-3"></i>
                                <h4 class="text-muted">Giỏ hàng đang trống</h4>
                                <a href="home" class="btn btn-dark mt-3">QUAY LẠI MUA SẮM</a>
                            </div>
                        </div>
                    </c:when>
                    
                    <%-- Trường hợp có sản phẩm trong giỏ hàng --%>
                    <c:otherwise>
                        <c:forEach items="${sessionScope.cart}" var="p">
                            <div class="card shadow-sm mb-3 border-0">
                                <div class="card-body p-4">
                                    <div class="row d-flex justify-content-between align-items-center">
                                        <div class="col-md-2 col-lg-2 col-xl-2">
                                            <img src="${pageContext.request.contextPath}/assets/images/${p.image}" class="img-fluid rounded-3 shadow-sm">
                                        </div>
                                        <div class="col-md-3 col-lg-3 col-xl-3">
                                            <p class="lead fw-bold mb-2">${p.name}</p>
                                            <p class="text-muted small">Giá: <fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                        </div>
                                        <div class="col-md-3 col-lg-3 col-xl-2 d-flex">
                                            <form action="cart" method="post" class="d-flex align-items-center">
                                                <input type="hidden" name="id_product" value="${p.id}">
                                                <input type="hidden" name="action" value="update">
                                                <input type="number" name="quantity" value="${p.quantity}" min="1" class="form-control form-control-sm text-center" style="width: 60px;" onchange="this.form.submit()"/>
                                            </form>
                                        </div>
                                        <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                                            <h5 class="mb-0 text-danger fw-bold"><fmt:formatNumber value="${p.price * p.quantity}" pattern="#,##0"/>đ</h5>
                                        </div>
                                        <div class="col-md-1 col-lg-1 col-xl-1 text-end">
                                            <form action="cart" method="post">
                                                <input type="hidden" name="id_product" value="${p.id}">
                                                <input type="hidden" name="action" value="delete">
                                                <button type="submit" class="btn btn-link text-danger p-0"><i class="fas fa-trash-alt fa-lg"></i></button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <c:set var="total" value="${total + (p.quantity * p.price)}"/>
                        </c:forEach>

                        <div class="card shadow-sm border-0 mb-4">
                            <div class="card-body p-4 text-end">
                                <h4 class="fw-bold">Tổng thanh toán: 
                                    <span class="text-success">
                                        <fmt:formatNumber value="${total}" pattern="#,##0"/> VND
                                    </span>
                                </h4>
                                <button type="button" onclick="showPaymentMethods()" class="btn btn-warning btn-lg fw-bold mt-2">
                                    ĐẶT HÀNG NGAY
                                </button>
                            </div>
                        </div>

                        <div id="payment-section" style="display: none;" class="card shadow-sm border-0 mb-5 border-top border-warning border-4">
                            <div class="card-body p-4">
                                <h4 class="fw-bold mb-4 text-center">CHỌN PHƯƠNG THỨC THANH TOÁN</h4>
                               <form action="checkout" method="POST" id="payment-form">.
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label class="payment-card border rounded p-3 d-block text-center cursor-pointer" for="creditCard">
                                                <input class="form-check-input mb-2" type="radio" name="paymentMethod" id="creditCard" value="CreditCard" required>
                                                <i class="fas fa-credit-card fa-2x d-block mb-2 text-primary"></i>
                                                <span>Thẻ tín dụng</span>
                                            </label>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="payment-card border rounded p-3 d-block text-center cursor-pointer" for="momo">
                                                <input class="form-check-input mb-2" type="radio" name="paymentMethod" id="momo" value="Momo">
                                                <i class="fas fa-mobile-alt fa-2x d-block mb-2 text-danger"></i>
                                                <span>MoMo / Banking</span>
                                            </label>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="payment-card border rounded p-3 d-block text-center cursor-pointer" for="cod">
                                                <input class="form-check-input mb-2" type="radio" name="paymentMethod" id="cod" value="COD" checked>
                                                <i class="fas fa-money-bill-wave fa-2x d-block mb-2 text-success"></i>
                                                <span>Tiền mặt (COD)</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="text-center mt-5">
                                        <button type="submit" class="btn btn-success btn-lg px-5 fw-bold py-3 shadow">
                                            XÁC NHẬN ĐẶT HÀNG
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </c:otherwise>
                </c:choose>
            </div>
        </div>
    </div>
</section>

<style>
    .cursor-pointer { cursor: pointer; transition: all 0.2s; }
    .payment-card:hover { background-color: #f8f9fa; border-color: #ffc107 !important; }
    #payment-section { animation: slideUp 0.5s ease-out; }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>

<script>
    function showPaymentMethods() {
        const section = document.getElementById('payment-section');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('payment-form').onsubmit = function() {
        alert("Đang xử lý đặt hàng...");
        return true; 
    };
</script>