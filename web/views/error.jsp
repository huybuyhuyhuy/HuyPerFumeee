<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page isErrorPage="true" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lỗi - Huy Perfume</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
        }
        .error-code {
            font-size: 100px;
            font-weight: bold;
            color: #667eea;
            margin: 0;
        }
        .error-message {
            font-size: 24px;
            color: #333;
            margin: 20px 0;
        }
        .error-description {
            color: #666;
            margin-bottom: 30px;
        }
        .btn-home {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 12px 40px;
            color: white;
            border-radius: 25px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s;
        }
        .btn-home:hover {
            transform: translateY(-2px);
            color: white;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-code">
            <%= request.getAttribute("jakarta.servlet.error.status_code") != null 
                ? request.getAttribute("jakarta.servlet.error.status_code") 
                : "500" %>
        </h1>
        <h2 class="error-message">Oops! Có lỗi xảy ra</h2>
        <p class="error-description">
            <% 
                Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
                if (statusCode != null) {
                    if (statusCode == 404) {
                        out.print("Trang bạn tìm kiếm không tồn tại.");
                    } else if (statusCode == 500) {
                        out.print("Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.");
                    } else {
                        out.print("Đã xảy ra lỗi không xác định.");
                    }
                } else {
                    out.print("Đã xảy ra lỗi. Vui lòng thử lại sau.");
                }
            %>
        </p>
        <% if (request.getAttribute("jakarta.servlet.error.message") != null) { %>
            <p class="text-muted small">
                Chi tiết: <%= request.getAttribute("jakarta.servlet.error.message") %>
            </p>
        <% } %>
        <a href="<%= request.getContextPath() %>/home" class="btn-home">
            Về trang chủ
        </a>
    </div>
</body>
</html>
