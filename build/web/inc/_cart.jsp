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
                                            <c:choose>
                                                <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.png'))}">
                                                    <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/assets/images/').concat(p.image)}" class="img-fluid rounded-3 shadow-sm" alt="${p.name}">
                                                </c:when>
                                                <c:otherwise>
                                                    <img src="https://loremflickr.com/200/200/perfume,bottle,${p.name}/all?lock=${p.id}" class="img-fluid rounded-3 shadow-sm" alt="${p.name}">
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                        <div class="col-md-3 col-lg-3 col-xl-4">
                                            <p class="lead fw-bold mb-2"><a href="detail?id=${p.id}" class="text-dark text-decoration-none">${p.name}</a></p>
                                            <c:choose>
                                                <c:when test="${p.discount_price > 0}">
                                                    <p class="mb-0 text-danger fw-bold small">Khuyến mãi: <fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</p>
                                                    <p class="text-muted small text-decoration-line-through">Giá gốc: <fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                </c:when>
                                                <c:otherwise>
                                                    <p class="text-muted small">Giá: <fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                        <div class="col-md-3 col-lg-3 col-xl-2 d-flex">
                                            <form action="cart" method="post" class="d-flex align-items-center">
                                                <input type="hidden" name="id_product" value="${p.id}">
                                                <input type="hidden" name="action" value="update">
                                                <input type="number" name="quantity" value="${p.quantity}" min="1" class="form-control form-control-sm text-center" style="width: 60px;" onchange="this.form.submit()"/>
                                            </form>
                                        </div>
                                        <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                                            <h5 class="mb-0 text-danger fw-bold">
                                                <fmt:formatNumber value="${(p.discount_price > 0 ? p.discount_price : p.price) * p.quantity}" pattern="#,##0"/>đ
                                            </h5>
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
                            <c:set var="total" value="${total + (p.quantity * (p.discount_price > 0 ? p.discount_price : p.price))}"/>
                        </c:forEach>

                        <div class="card shadow-sm border-0 mb-4">
                            <div class="card-body p-4 text-end">
                                <h4 class="fw-bold">Tổng thanh toán: 
                                    <span class="text-success">
                                        <fmt:formatNumber value="${total}" pattern="#,##0"/>đ
                                    </span>
                                </h4>
                                <button type="button" onclick="showPaymentMethods()" class="btn btn-warning btn-lg fw-bold mt-2">
                                    TIẾN HÀNH THANH TOÁN
                                </button>
                            </div>
                        </div>

                        <div id="payment-section" style="display: none;" class="card shadow-sm border-0 mb-5 border-top border-warning border-4">
                            <div class="card-body p-4">
                                <h4 class="fw-bold mb-4 text-center text-uppercase">Chọn phương thức thanh toán</h4>
                                
                                <!-- Thanh chọn phương thức (4 LỰA CHỌN) -->
                                <div class="row g-3 mb-4 justify-content-center">
                                    <div class="col-md-3 col-sm-6">
                                        <label class="payment-option-card border rounded p-3 d-block text-center cursor-pointer" for="creditCard">
                                            <input class="form-check-input mb-2" type="radio" name="paymentSelector" id="creditCard" value="CreditCard">
                                            <i class="fas fa-credit-card fa-2x d-block mb-2 text-primary"></i>
                                            <span class="fw-bold d-block">Thẻ tín dụng</span>
                                        </label>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <label class="payment-option-card border rounded p-3 d-block text-center cursor-pointer" for="momo">
                                            <input class="form-check-input mb-2" type="radio" name="paymentSelector" id="momo" value="Momo">
                                            <i class="fas fa-mobile-alt fa-2x d-block mb-2 text-danger"></i>
                                            <span class="fw-bold d-block">Ví MoMo</span>
                                        </label>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <label class="payment-option-card border rounded p-3 d-block text-center cursor-pointer" for="banking">
                                            <input class="form-check-input mb-2" type="radio" name="paymentSelector" id="banking" value="Banking">
                                            <i class="fas fa-university fa-2x d-block mb-2 text-info"></i>
                                            <span class="fw-bold d-block">Ngân hàng (VietQR)</span>
                                        </label>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <label class="payment-option-card border rounded p-3 d-block text-center cursor-pointer" for="cod">
                                            <input class="form-check-input mb-2" type="radio" name="paymentSelector" id="cod" value="COD">
                                            <i class="fas fa-money-bill-wave fa-2x d-block mb-2 text-success"></i>
                                            <span class="fw-bold d-block">Tiền mặt (COD)</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- FORM CREDIT CARD -->
                                <div id="form-CreditCard" class="payment-form-container border rounded p-4 mb-3" style="display: none; background: #fdfdfd;">
                                    <h5 class="fw-bold mb-3"><i class="fas fa-credit-card me-2 text-primary"></i>Thông tin thẻ tín dụng</h5>
                                    <form action="checkout" method="POST">
                                        <input type="hidden" name="paymentMethod" value="CreditCard">
                                        <div class="row g-3">
                                            <div class="col-md-12">
                                                <label class="form-label small fw-bold">Số thẻ</label>
                                                <input type="text" class="form-control" placeholder="1234 5678 9101 1121" required>
                                            </div>
                                            <div class="col-md-8">
                                                <label class="form-label small fw-bold">Tên chủ thẻ</label>
                                                <input type="text" class="form-control" placeholder="NGUYEN VAN A" required>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold">CVV</label>
                                                <input type="password" class="form-control" placeholder="***" required>
                                            </div>
                                        </div>
                                        <div class="text-center mt-4">
                                            <button type="submit" class="btn btn-primary btn-lg px-5 fw-bold shadow">XÁC NHẬN ĐẶT HÀNG</button>
                                        </div>
                                    </form>
                                </div>

                                <!-- FORM MOMO (DÙNG API VIETQR TỰ ĐỘNG CHO MOMO) -->
                                <div id="form-Momo" class="payment-form-container border rounded p-4 mb-3 text-center" style="display: none; background: #fff;">
                                    <h5 class="fw-bold mb-2 text-danger"><i class="fas fa-mobile-alt me-2"></i>Thanh toán qua Ví MoMo</h5>
                                    <p class="text-muted small mb-3">Quét mã QR MoMo bên dưới để thanh toán tự động số tiền đơn hàng.</p>
                                    <form action="checkout" method="POST">
                                        <input type="hidden" name="paymentMethod" value="Momo">
                                        <div class="qr-wrapper mb-3 p-3 border d-inline-block rounded bg-light shadow-sm">
                                            <%-- 
                                                SỬ DỤNG API VIETQR CHO MOMO:
                                                - BankID cho MoMo: 970423
                                                - Account: 0906530794 (Số điện thoại MoMo của bạn)
                                            --%>
                                            <img id="dynamic-qr-momo" 
                                               src="https://img.vietqr.io/image/970418-5511019209-compact2.png?amount=${total}&addInfo=DH${orderId}&accountName= LE NGOC QUOC HUY "
                                                 alt="MoMo QR" class="img-fluid" style="max-width: 250px;">
                                            <div class="mt-2 small fw-bold text-danger">
                                                Số tiền: <fmt:formatNumber value="${total}" pattern="#,##0"/>đ
                                            </div>
                                        </div>
                                        <div class="alert alert-danger small mx-auto" style="max-width: 450px;">
                                            <i class="fas fa-info-circle me-1"></i> Mở App MoMo, chọn "Quét mã" và quét mã QR ở trên.
                                        </div>
                                        <div class="text-center mt-3">
                                            <button type="submit" class="btn btn-danger btn-lg px-5 fw-bold shadow">XÁC NHẬN ĐÃ THANH TOÁN MOMO</button>
                                        </div>
                                    </form>
                                </div>

                                <!-- FORM BANKING (DÙNG API VIETQR - BIDV) -->
                                <div id="form-Banking" class="payment-form-container border rounded p-4 mb-3 text-center" style="display: none; background: #fff;">
                                    <h5 class="fw-bold mb-2 text-info"><i class="fas fa-university me-2"></i>Thanh toán qua Ngân hàng (VietQR)</h5>
                                    <p class="text-muted small mb-3">Sử dụng bất kỳ App Ngân hàng nào để quét mã QR BIDV thanh toán tự động.</p>
                                    <form action="checkout" method="POST">
                                        <input type="hidden" name="paymentMethod" value="Banking">
                                        <div class="qr-wrapper mb-3 p-3 border d-inline-block rounded bg-light shadow-sm">
                                            <%-- 
                                                SỬ DỤNG API VIETQR.IO VỚI BIDV:
                                                - BankID cho BIDV: 970418
                                                - Account: 5511019209 (Số tài khoản BIDV của bạn)
                                            --%>
                                            <img id="dynamic-qr-banking" 
                                                 src="https://img.vietqr.io/image/970418-0123456789-compact2.png?amount=${total}&addInfo=Huy Perfume Thanh Toan&accountName= LE NGOC QUOC HUY " 
                                                 alt="VietQR BIDV" class="img-fluid" style="max-width: 250px;">
                                            <div class="mt-2 small fw-bold text-primary">
                                                Ngân hàng: BIDV - Số tiền: <fmt:formatNumber value="${total}" pattern="#,##0"/>đ
                                            </div>
                                        </div>
                                        <div class="alert alert-info small mx-auto" style="max-width: 450px;">
                                            <i class="fas fa-info-circle me-1"></i> Sau khi chuyển khoản thành công qua BIDV, nhấn xác nhận để hoàn tất đơn hàng.
                                        </div>
                                        <div class="text-center mt-3">
                                            <button type="submit" class="btn btn-info text-white btn-lg px-5 fw-bold shadow">XÁC NHẬN ĐÃ THANH TOÁN BANKING</button>
                                        </div>
                                    </form>
                                </div>

                                <!-- FORM COD -->
                                <div id="form-COD" class="payment-form-container border rounded p-4 mb-3 text-center" style="display: none; background: #f8fff9;">
                                    <h5 class="fw-bold mb-3 text-success"><i class="fas fa-money-bill-wave me-2"></i>Thanh toán khi nhận hàng</h5>
                                    <p class="mb-4">Bạn sẽ thanh toán số tiền <strong><fmt:formatNumber value="${total}" pattern="#,##0"/> VND</strong> bằng tiền mặt khi shipper giao hàng đến.</p>
                                    <form action="checkout" method="POST">
                                        <input type="hidden" name="paymentMethod" value="COD">
                                        <div class="text-center">
                                            <button type="submit" class="btn btn-success btn-lg px-5 fw-bold shadow">XÁC NHẬN ĐẶT HÀNG (COD)</button>
                                        </div>
                                    </form>
                                </div>

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
    .payment-option-card { transition: all 0.3s; border: 2px solid #eee !important; min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .payment-option-card:hover { border-color: #ffc107 !important; background: #fffcf5; }
    .payment-option-card.active { border-color: #ffc107 !important; background: #fff8e1; box-shadow: 0 4px 12px rgba(255,193,7,0.2); }
    
    .payment-form-container { animation: fadeIn 0.4s ease-out; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .qr-wrapper img { border: 5px solid #fff; }
</style>

<script>
    function showPaymentMethods() {
        const section = document.getElementById('payment-section');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
    }

    // Xử lý chuyển đổi Form khi chọn Radio
    document.querySelectorAll('input[name="paymentSelector"]').forEach((radio) => {
        radio.addEventListener('change', function() {
            // 1. Reset class CSS cho các card
            document.querySelectorAll('.payment-option-card').forEach(card => card.classList.remove('active'));
            this.closest('.payment-option-card').classList.add('active');

            // 2. Ẩn tất cả các form
            document.querySelectorAll('.payment-form-container').forEach(form => form.style.display = 'none');

            // 3. Hiện form tương ứng
            const targetFormId = 'form-' + this.value;
            const targetForm = document.getElementById(targetFormId);
            if (targetForm) {
                targetForm.style.display = 'block';
            }
        });
    });
</script>
