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
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .success-card {
            background: #fff;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 550px;
            width: 100%;
            text-align: center;
            animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .checkmark-wrapper {
            width: 100px;
            height: 100px;
            background-color: #d4edda;
            color: #28a745;
            font-size: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
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
    </style>
</head>
<body>

    <div class="success-card">
        <div class="checkmark-wrapper">
            <i class="fas fa-check"></i>
        </div>
        <h1 class="fw-bold text-dark mb-3">ĐẶT HÀNG THÀNH CÔNG!</h1>
        <p class="text-muted mb-4 fs-5">
            Cảm ơn bạn đã lựa chọn <strong>Huy Perfume</strong>. <br>
            Yêu cầu của bạn đã được tiếp nhận và đang trong quá trình xử lý.
        </p>
        <hr class="my-4">
        <div class="d-grid gap-2">
            <a href="${pageContext.request.contextPath}/home" class="btn-home">
                <i class="fas fa-arrow-left me-2"></i> TIẾP TỤC MUA SẮM
            </a>
        </div>
    </div>

</body>
</html>