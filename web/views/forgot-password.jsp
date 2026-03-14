<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@taglib uri ="http://java.sun.com/jsp/jstl/core" prefix ="c" %>
<c:import url="/inc/header.jsp" />
<c:import url="/inc/navbar.jsp" />

<style>
    .forgot-section {
        background: #f4f7f6;
        padding: 100px 0;
        min-height: 80vh;
        display: flex;
        align-items: center;
    }
    .forgot-card {
        max-width: 450px;
        margin: auto;
        background: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.05);
        text-align: center;
    }
    .forgot-icon {
        width: 70px;
        height: 70px;
        background: rgba(0,61,46,0.05);
        color: #003D2E;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        margin: 0 auto 25px;
    }
    .forgot-title {
        font-weight: 800;
        color: #003D2E;
        margin-bottom: 10px;
    }
    .forgot-text {
        color: #888;
        font-size: 0.9rem;
        margin-bottom: 30px;
    }
    .form-control-lux {
        padding: 12px 20px;
        border-radius: 10px;
        border: 1px solid #eee;
        background: #f9f9f9;
        font-size: 0.9rem;
        width: 100%;
        margin-bottom: 20px;
        transition: all 0.3s;
    }
    .form-control-lux:focus {
        background: #fff;
        border-color: #003D2E;
        outline: none;
        box-shadow: 0 0 0 4px rgba(0,61,46,0.05);
    }
    .btn-forgot {
        background: #003D2E;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 10px;
        font-weight: 700;
        width: 100%;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: 0.3s;
    }
    .btn-forgot:hover {
        background: #005e47;
        transform: translateY(-2px);
    }
    .back-to-login {
        display: block;
        margin-top: 25px;
        color: #666;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .back-to-login:hover {
        color: #003D2E;
    }
</style>

<section class="forgot-section">
    <div class="container">
        <div class="forgot-card animate__animated animate__zoomIn">
            <div class="forgot-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h3 class="forgot-title">Quên mật khẩu?</h3>
            <p class="forgot-text">Đừng lo lắng, hãy nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.</p>
            
            <c:if test="${not empty successMsg}">
                <div class="alert alert-success small mb-4" role="alert">
                    <i class="fas fa-check-circle me-2"></i> ${successMsg}
                </div>
            </c:if>
            
            <c:if test="${not empty errorMsg}">
                <div class="alert alert-danger small mb-4" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i> ${errorMsg}
                </div>
            </c:if>
            
            <form action="forgot-password" method="post">
                <input type="email" name="email" class="form-control-lux" placeholder="Nhập địa chỉ Email của bạn" required value="${email}">
                <button type="submit" class="btn-forgot">Gửi yêu cầu</button>
            </form>
            
            <a href="${pageContext.request.contextPath}/login" class="back-to-login">
                <i class="fas fa-arrow-left me-2"></i> Quay lại Đăng nhập
            </a>
        </div>
    </div>
</section>

<c:import url="/inc/footer.jsp" />
