<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<style>
    .reg-section {
        background: #f4f7f6;
        padding: 80px 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
    }
    .reg-card {
        border: none;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 15px 35px rgba(0,0,0,0.08);
        background: #fff;
    }
    .reg-image {
        background: url('https://images.unsplash.com/photo-1594035910387-fea47794261f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') center/cover;
        min-height: 100%;
    }
    .reg-form-container {
        padding: 50px;
    }
    .reg-title {
        font-weight: 800;
        color: #003D2E;
        margin-bottom: 10px;
        font-size: 2rem;
    }
    .reg-subtitle {
        color: #888;
        margin-bottom: 40px;
        font-size: 0.9rem;
    }
    .form-group-lux {
        margin-bottom: 20px;
        position: relative;
    }
    .form-group-lux i {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: #003D2E;
        opacity: 0.5;
    }
    .form-control-lux {
        padding: 12px 15px 12px 45px;
        border-radius: 10px;
        border: 1px solid #eee;
        background: #f9f9f9;
        font-size: 0.9rem;
        transition: all 0.3s;
    }
    .form-control-lux:focus {
        background: #fff;
        border-color: #003D2E;
        box-shadow: 0 0 0 4px rgba(0,61,46,0.05);
        outline: none;
    }
    .btn-reg-lux {
        background: #003D2E;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 10px;
        font-weight: 700;
        width: 100%;
        margin-top: 20px;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .btn-reg-lux:hover {
        background: #005e47;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,61,46,0.2);
    }
    .err-text {
        font-size: 0.75rem;
        color: #dc3545;
        margin-top: 5px;
        display: block;
    }
    .login-link {
        text-align: center;
        margin-top: 25px;
        font-size: 0.85rem;
        color: #666;
    }
    .login-link a {
        color: #003D2E;
        font-weight: 700;
        text-decoration: none;
    }
</style>

<section class="reg-section">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="reg-card">
                    <div class="row g-0">
                        <div class="col-lg-6 d-none d-lg-block">
                            <div class="reg-image"></div>
                        </div>
                        <div class="col-lg-6">
                            <div class="reg-form-container">
                                <h2 class="reg-title">Tạo tài khoản</h2>
                                <p class="reg-subtitle">Tham gia cộng đồng yêu nước hoa cùng Huy Perfume</p>

                                <c:if test="${not empty requestScope.exist_user}">
                                    <div class="alert alert-danger small mb-3" role="alert">${requestScope.exist_user}</div>
                                </c:if>

                                <c:set var="path" value="${pageContext.request.contextPath}" />
                                <form action="${path}/register" method="post">
                                    <div class="form-group-lux">
                                        <i class="fas fa-user"></i>
                                        <input type="text" name="name" class="form-control-lux w-100" placeholder="Họ và tên" required value="${sessionScope.name}">
                                        <span class="err-text">${sessionScope.err_name}</span>
                                    </div>

                                    <div class="form-group-lux">
                                        <i class="fas fa-envelope"></i>
                                        <input type="email" name="email" class="form-control-lux w-100" placeholder="Địa chỉ Email" required value="${sessionScope.email}">
                                        <span class="err-text">${sessionScope.err_email}${sessionScope.err_exist_email}</span>
                                    </div>

                                    <div class="form-group-lux">
                                        <i class="fas fa-phone"></i>
                                        <input type="text" name="phone" class="form-control-lux w-100" placeholder="Số điện thoại" required value="${sessionScope.phone}">
                                        <span class="err-text">${sessionScope.err_phone}${sessionScope.err_exist_phone}</span>
                                    </div>

                                    <div class="form-group-lux">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <input type="text" name="address" class="form-control-lux w-100" placeholder="Địa chỉ giao hàng" required value="${sessionScope.address}">
                                    </div>

                                    <div class="form-group-lux">
                                        <i class="fas fa-lock"></i>
                                        <input type="password" name="password" class="form-control-lux w-100" placeholder="Mật khẩu (tối thiểu 6 ký tự)" required minlength="6">
                                        <span class="err-text">${sessionScope.err_pass}</span>
                                    </div>

                                    <div class="form-group-lux">
                                        <i class="fas fa-check-circle"></i>
                                        <input type="password" name="repassword" class="form-control-lux w-100" placeholder="Nhập lại mật khẩu" required>
                                        <span class="err-text">${sessionScope.err_repass}</span>
                                    </div>

                                    <div class="form-check mb-4 small">
                                        <input class="form-check-input" type="checkbox" id="terms" required>
                                        <label class="form-check-label text-muted" for="terms">
                                            Tôi đồng ý với <a href="#" class="text-dark fw-bold">Điều khoản & Chính sách</a> của cửa hàng.
                                        </label>
                                    </div>

                                    <button type="submit" class="btn-reg-lux">Đăng ký ngay</button>

                                    <div class="login-link">
                                        Đã có tài khoản? <a href="${path}/login">Đăng nhập tại đây</a>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
