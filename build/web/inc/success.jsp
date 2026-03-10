<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt hàng thành công | Huy Perfume</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <style>
        :root {
            --primary-color: #003D2E;
            --accent-color: #ffc107;
        }
        body {
            background-color: #f4f7f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .success-container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
            position: relative;
            animation: slideUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .header-gradient {
            background: linear-gradient(135deg, var(--primary-color) 0%, #005e47 100%);
            padding: 50px 30px;
            text-align: center;
            color: white;
        }
        .check-icon {
            width: 80px;
            height: 80px;
            background: white;
            color: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin: 0 auto 20px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .order-content {
            padding: 40px 35px;
        }
        .thank-you-title {
            font-weight: 800;
            font-size: 24px;
            color: #1a1a1a;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .order-id {
            color: #6c757d;
            font-size: 14px;
            letter-spacing: 1px;
            margin-bottom: 30px;
        }
        .receipt-card {
            background: #f9f9f9;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px dashed #ddd;
        }
        .receipt-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 15px;
        }
        .receipt-label { color: #777; }
        .receipt-value { font-weight: 600; color: #333; }
        .total-row {
            border-top: 1px solid #eee;
            margin-top: 15px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 800;
            color: var(--primary-color);
        }
        .btn-continue {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-weight: 700;
            width: 100%;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
            box-shadow: 0 10px 20px rgba(0,61,46,0.2);
        }
        .btn-continue:hover {
            background-color: #005e47;
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(0,61,46,0.3);
            color: white;
        }
        .footer-note {
            text-align: center;
            font-size: 13px;
            color: #999;
            margin-top: 25px;
        }
        .status-badge {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>

    <div class="success-container">
        <div class="header-gradient">
            <div class="check-icon">
                <i class="fas fa-check"></i>
            </div>
            <h2 class="m-0 fw-bold">Tuyệt vời!</h2>
            <p class="mt-2 mb-0 opacity-75">Đơn hàng của bạn đã được tiếp nhận</p>
        </div>

        <div class="order-content text-center">
            <div class="status-badge">ĐÃ XÁC NHẬN</div>
            <h1 class="thank-you-title">Cảm ơn bạn đã tin dùng!</h1>
            <p class="order-id">MÃ ĐƠN HÀNG: #HP-${System.currentTimeMillis() % 1000000}</p>
            
            <div class="receipt-card text-start">
                <div class="receipt-item">
                    <span class="receipt-label">Phương thức:</span>
                    <span class="receipt-value">
                        <c:choose>
                            <c:when test="${paymentMethod == 'Momo'}">Ví MoMo</c:when>
                            <c:when test="${paymentMethod == 'Banking'}">Chuyển khoản Ngân hàng</c:when>
                            <c:when test="${paymentMethod == 'CreditCard'}">Thẻ tín dụng</c:when>
                            <c:otherwise>Tiền mặt (COD)</c:otherwise>
                        </c:choose>
                    </span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-label">Trạng thái:</span>
                    <span class="receipt-value text-success">Đang xử lý</span>
                </div>
                <div class="receipt-item">
                    <span class="receipt-label">Thời gian dự kiến:</span>
                    <span class="receipt-value">2 - 3 ngày làm việc</span>
                </div>
                <div class="total-row">
                    <span>Tổng cộng:</span>
                    <span class="float-end">Thành công!</span>
                </div>
            </div>

            <a href="${pageContext.request.contextPath}/home" class="btn-continue">
                TIẾP TỤC MUA SẮM <i class="fas fa-shopping-bag ms-2"></i>
            </a>

            <div class="footer-note">
                <i class="fas fa-shield-alt me-1"></i> Huy Perfume bảo mật thông tin đơn hàng của bạn.
            </div>
        </div>
    </div>

    <script>
        // Hiệu ứng pháo hoa khi vừa load trang
        window.onload = function() {
            var duration = 3 * 1000;
            var end = Date.now() + duration;

            (function frame() {
              confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#003D2E', '#ffc107', '#ffffff']
              });
              confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#003D2E', '#ffc107', '#ffffff']
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            }());
        };
    </script>
</body>
</html>
