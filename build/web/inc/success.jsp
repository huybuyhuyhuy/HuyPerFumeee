<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh toán thành công | Huy Perfume</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            background-color: #f0f2f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .success-wrapper {
            max-width: 1100px;
            width: 100%;
        }
        .success-card {
            background: #fff;
            padding: 30px 40px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
            margin-bottom: 25px;
            animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .checkmark-wrapper {
            width: 90px;
            height: 90px;
            background-color: #d4edda;
            color: #28a745;
            font-size: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }
        .btn-home {
            background-color: #1a1a1a;
            color: white;
            padding: 12px 35px;
            border-radius: 10px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
        }
        .btn-home:hover {
            background-color: #333;
            color: #fff;
            transform: scale(1.05);
        }
        .pm-card {
            border-radius: 12px;
            padding: 18px 16px;
            background: #fff;
            border: 1px solid #e0e0e0;
            width: 100%;
            text-align: center;
            cursor: pointer;
            transition: all 0.25s;
        }
        .pm-card i {
            font-size: 30px;
            margin-bottom: 8px;
        }
        .pm-card span {
            display: block;
            font-weight: 600;
            margin-top: 4px;
        }
        .pm-card.active {
            border-color: #198754;
            box-shadow: 0 0 0 2px rgba(25,135,84,0.2);
            background: #f5fffa;
        }
        .pm-detail {
            display: none;
            border-radius: 14px;
            background: #fff;
            padding: 20px 24px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .pm-detail.active {
            display: block;
        }
        .pm-detail h5 {
            font-weight: 700;
            margin-bottom: 15px;
        }
        .pm-detail small {
            color: #6c757d;
        }
        .form-label {
            font-weight: 500;
        }
    </style>
</head>
<body data-payment-method="${paymentMethod}">

    <div class="success-wrapper container">
        <div class="success-card text-center">
            <div class="checkmark-wrapper">
                <i class="fas fa-check"></i>
            </div>
            <h1 class="fw-bold text-dark mb-2">ĐẶT HÀNG THÀNH CÔNG!</h1>
            <p class="text-muted mb-3 fs-5">
                Cảm ơn bạn đã lựa chọn <strong>Huy Perfume</strong>.<br>
                Đơn hàng của bạn đã được ghi nhận, chúng tôi sẽ liên hệ và xử lý trong thời gian sớm nhất.
            </p>
        </div>

        <!-- KHU VỰC THÔNG TIN PHƯƠNG THỨC THANH TOÁN -->
        <div class="row g-4 mb-4">
            <div class="col-md-4">
                <button type="button" class="pm-card" data-method="CreditCard">
                    <i class="fas fa-credit-card text-primary"></i>
                    <span>Thẻ tín dụng</span>
                    <small class="text-muted d-block mt-1">Thanh toán online qua Visa/MasterCard</small>
                </button>
            </div>
            <div class="col-md-4">
                <button type="button" class="pm-card" data-method="Momo">
                    <i class="fas fa-mobile-alt text-danger"></i>
                    <span>MoMo / Banking</span>
                    <small class="text-muted d-block mt-1">Quét QR hoặc chuyển khoản nhanh</small>
                </button>
            </div>
            <div class="col-md-4">
                <button type="button" class="pm-card" data-method="COD">
                    <i class="fas fa-money-bill-wave text-success"></i>
                    <span>Tiền mặt (COD)</span>
                    <small class="text-muted d-block mt-1">Thanh toán khi nhận hàng</small>
                </button>
            </div>
        </div>

        <div class="row">
            <div class="col-md-8 mb-3">
                <!-- Chi tiết thẻ tín dụng -->
                <div id="pm-detail-CreditCard" class="pm-detail">
                    <h5><i class="fas fa-credit-card me-2 text-primary"></i>Thanh toán qua thẻ tín dụng</h5>
                    <small>Đây là form minh họa (demo), không thực hiện thanh toán thật.</small>
                    <div class="row mt-3">
                        <div class="col-md-8">
                            <div class="mb-3">
                                <label class="form-label">Số thẻ</label>
                                <input type="text" class="form-control" placeholder="1234 5678 9012 3456">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Tên chủ thẻ</label>
                                <input type="text" class="form-control" placeholder="NGUYEN VAN A">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Ngày hết hạn</label>
                                <input type="text" class="form-control" placeholder="MM/YY">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Mã CVV</label>
                                <input type="password" class="form-control" placeholder="***">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chi tiết MoMo / Banking -->
                <div id="pm-detail-Momo" class="pm-detail">
                    <h5><i class="fas fa-mobile-alt me-2 text-danger"></i>Thanh toán qua MoMo / Banking</h5>
                    <small>Quét mã QR hoặc chuyển khoản theo thông tin bên dưới (minh họa).</small>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="border rounded p-3 mb-2">
                                <p class="mb-1 fw-bold">Ngân hàng: Vietcombank</p>
                                <p class="mb-1">Số tài khoản: 0123 456 789</p>
                                <p class="mb-1">Chủ TK: HUY PERFUME</p>
                                <p class="mb-0 text-muted"><small>Nội dung: Thanh toan don hang #${orderId}</small></p>
                            </div>
                        </div>
                        <div class="col-md-6 text-center">
                            <div class="border rounded p-3">
                                <p class="mb-2 fw-bold">Quét QR MoMo</p>
                                <div class="bg-light d-flex align-items-center justify-content-center" style="height:140px;">
                                    <span class="text-muted">[QR DEMO]</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chi tiết COD -->
                <div id="pm-detail-COD" class="pm-detail">
                    <h5><i class="fas fa-money-bill-wave me-2 text-success"></i>Thanh toán khi nhận hàng (COD)</h5>
                    <p class="mb-1">Nhân viên giao hàng sẽ liên hệ với bạn để xác nhận đơn và giao hàng trong thời gian sớm nhất.</p>
                    <p class="mb-0 text-muted"><small>Vui lòng chuẩn bị đủ số tiền mặt khi nhận hàng.</small></p>
                </div>
            </div>

            <div class="col-md-4 d-flex align-items-center justify-content-center">
                <a href="${pageContext.request.contextPath}/home" class="btn-home">
                    <i class="fas fa-arrow-left me-2"></i> TIẾP TỤC MUA SẮM
                </a>
            </div>
        </div>
    </div>

<script>
    (function() {
        const defaultMethod = document.body.dataset.paymentMethod || 'COD';
        const cards = document.querySelectorAll('.pm-card');
        const details = document.querySelectorAll('.pm-detail');

        function showMethod(method) {
            cards.forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-method') === method);
            });
            details.forEach(d => {
                d.classList.toggle('active', d.id === 'pm-detail-' + method);
            });
        }

        cards.forEach(c => {
            c.addEventListener('click', () => {
                showMethod(c.getAttribute('data-method'));
            });
        });

        showMethod(defaultMethod);
    })();
</script>
</body>
</html>