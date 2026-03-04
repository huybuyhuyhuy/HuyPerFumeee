<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<div class="container">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="login-card">
                <div class="login-header">
                    <h3 class="mb-0">
                        <i class="fas fa-sign-in-alt me-2"></i>ĐĂNG NHẬP TÀI KHOẢN
                    </h3>
                    <p class="mb-0 mt-2">Nếu bạn đã có tài khoản, đăng nhập tại đây.</p>
                </div>
                
                <div class="p-5">
                    <c:if test="${not empty login_error}">
                        <div class="alert alert-danger alert-dismissible fade show">
                            <i class="fas fa-exclamation-circle me-2"></i> ${login_error}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    </c:if>
                    
                    <div class="text-center mb-4">
                        <p class="mb-3">Hoặc đăng nhập với:</p>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <a href="#" class="social-btn social-fb d-block">
                                    <i class="fab fa-facebook-f me-2 text-white"></i>Facebook
                                </a>
                            </div>
                            <div class="col-md-6">
                                <a href="#" class="social-btn social-gg d-block">
                                    <i class="fab fa-google me-2 text-white"></i>Google
                                </a>
                            </div>
                        </div>
                    </div>

                    <style>
                        .social-btn {
                            padding: 10px;
                            border-radius: 6px;
                            color: #fff !important;
                            text-align: center;
                            font-weight: 500;
                            display: block;
                            text-decoration: none;
                        }
                        .social-fb { background-color: #1877f2; }
                        .social-gg { background-color: #ea4335; }
                        .social-btn:hover { opacity: 0.85; }
                    </style>
                    
                    <div class="divider">
                        <div class="divider-line"></div>
                        <div class="divider-text">HOẶC</div>
                        <div class="divider-line"></div>
                    </div>
                    
                    <form method="post" action="${pageContext.request.contextPath}/login">
                        <%-- QUAN TRỌNG: Thêm input ẩn để giữ ID sản phẩm khi submit form --%>
                        <input type="hidden" name="target_id" value="${param.target_id}">

                        <div class="mb-4">
                            <label class="form-label fw-bold">
                                <i class="fas fa-envelope me-2"></i>Email hoặc Số điện thoại 
                            </label>
                            <input type="text" 
                                   name="emailphone" 
                                   class="form-control form-control-custom" 
                                   placeholder="Nhập email của bạn"
                                   required>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label fw-bold">
                                <i class="fas fa-lock me-2"></i>Mật khẩu 
                            </label>
                            <input type="password" 
                                   name="password" 
                                   class="form-control form-control-custom" 
                                   placeholder="Nhập mật khẩu"
                                   required>
                        </div>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-gold btn-lg">
                                <i class="fas fa-sign-in-alt me-2"></i>ĐĂNG NHẬP
                            </button>
                        </div>
                        
                        <div class="text-center mt-4">
                            <p class="mb-2">
                                Bạn chưa có tài khoản? 
                                <a href="${pageContext.request.contextPath}/register" class="text-decoration-none fw-bold" style="color: var(--gold);">
                                    Đăng ký tại đây
                                </a>
                            </p>
                            <a href="#" class="text-decoration-none" style="color: var(--gold);">
                                <i class="fas fa-key me-1"></i>Quên mật khẩu?
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link-custom');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    });
</script>