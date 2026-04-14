<%@page contentType="text/html" pageEncoding="UTF-8"%>

<style>
    .lux-footer {
        background: #001a15; /* Tone tối hơn sang trọng hơn */
        color: #e0e0e0;
        font-family: 'Montserrat', sans-serif;
        padding: 80px 0 0;
        font-size: 14px;
        border-top: 4px solid #003D2E;
    }

    .lux-footer h4 {
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 30px;
        letter-spacing: 2px;
        position: relative;
    }

    .lux-footer h4::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 0;
        width: 25px;
        height: 1px;
        background: #ffc107;
    }

    .lux-footer ul {
        list-style: none;
        padding: 0;
    }

    .lux-footer ul li {
        margin-bottom: 15px;
    }

    .lux-footer ul li a {
        color: #999;
        text-decoration: none;
        transition: all 0.3s ease;
        font-size: 13px;
    }

    .lux-footer ul li a:hover {
        color: #ffc107;
        padding-left: 8px;
    }

    .lux-footer .contact-info p {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 12px;
        color: #999;
        font-size: 13px;
    }

    .lux-footer .contact-info i {
        color: #ffc107;
        font-size: 14px;
    }

    .lux-footer .social-icons {
        margin-top: 35px;
        display: flex;
        gap: 12px;
    }

    .lux-footer .social-icons a {
        width: 35px;
        height: 35px;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .lux-footer .social-icons a:hover {
        background: #ffc107;
        color: #001a15;
        border-color: #ffc107;
        transform: translateY(-5px);
    }

    .lux-footer .payment-methods {
        padding: 40px 0;
        margin-top: 60px;
        text-align: center;
        border-top: 1px solid rgba(255,255,255,0.05);
    }

    .lux-footer .payment-methods img {
        height: 22px;
        margin: 0 15px;
        filter: grayscale(1) invert(1) brightness(0.8);
        transition: all 0.4s ease;
        opacity: 0.4;
    }

    .lux-footer .payment-methods img:hover {
        filter: none;
        opacity: 1;
        transform: scale(1.1);
    }

    .lux-footer .copyright {
        background: #000;
        padding: 25px 0;
        text-align: center;
        font-size: 11px;
        color: #444;
        letter-spacing: 2px;
        text-transform: uppercase;
    }
</style>

<footer class="lux-footer">
    <div class="container">
        <div class="row g-4">
            <div class="col-lg-4 col-md-6">
                <h4>Huy Perfume</h4>
                <div class="contact-info mt-4">
                    <p><i class="fas fa-map-marker-alt"></i> Khu Royal Park, Thừa Thiên Huế</p>
                    <p><i class="fas fa-phone-alt"></i> 0906.530.794</p>
                    <p><i class="fas fa-envelope"></i> info@huyperfume.vn</p>
                </div>
                <div class="social-icons">
                    <a href="https://www.facebook.com/qhuy.29/" target="_blank"><i class="fab fa-facebook-f"></i></a>
                    <a href="https://www.instagram.com/quochuy29_/" target="_blank"><i class="fab fa-instagram"></i></a>
                    <a href="https://www.youtube.com/@quochuy4739" target="_blank"><i class="fab fa-youtube"></i></a>
                    <a href="https://www.google.com/search?q=huy+perfume" target="_blank"><i class="fab fa-google"></i></a>
                </div>
            </div>

            <div class="col-lg-2 col-md-6">
                <h4>Khám phá</h4>
                <ul>
                    <li><a href="${pageContext.request.contextPath}/home">Trang chủ</a></li>
                    <li><a href="${pageContext.request.contextPath}/about">Giới thiệu</a></li>
                    <li><a href="${pageContext.request.contextPath}/blog">Blog kiến thức</a></li>
                    <li><a href="${pageContext.request.contextPath}/contact">Liên hệ</a></li>
                </ul>
            </div>

            <div class="col-lg-3 col-md-6">
                <h4>Dịch vụ</h4>
                <ul>
                    <li><a href="#">Hướng dẫn mua hàng</a></li>
                    <li><a href="#">Chính sách bảo mật</a></li>
                    <li><a href="#">Chính sách đổi trả</a></li>
                    <li><a href="#">Vận chuyển & Giao hàng</a></li>
                </ul>
            </div>

            <div class="col-lg-3 col-md-6">
                <h4>Đăng ký nhận tin</h4>
                <p class="text-muted small mb-3">Nhận cập nhật về các dòng nước hoa mới nhất và ưu đãi đặc quyền.</p>
                <div class="input-group mb-3">
                    <input type="text" class="form-control form-control-sm bg-transparent border-secondary text-white" placeholder="Email của bạn">
                    <button class="btn btn-outline-warning btn-sm" type="button">Gửi</button>
                </div>
            </div>
        </div>
    </div>

    <div class="payment-methods">
        <div class="container">
            <img src="${pageContext.request.contextPath}/assets/icon/visa.png" alt="Visa">
            <img src="${pageContext.request.contextPath}/assets/icon/master.png" alt="Mastercard">
            <img src="${pageContext.request.contextPath}/assets/icon/jcb.png" alt="JCB">
            <img src="${pageContext.request.contextPath}/assets/icon/cod.png" alt="COD">
            <img src="${pageContext.request.contextPath}/assets/icon/bank.png" alt="Banking">
            <img src="${pageContext.request.contextPath}/assets/icon/momo.png" alt="MoMo">
        </div>
    </div>

    <div class="copyright">
        <div class="container">
            &copy; 2026 HUY PERFUME. ALL RIGHTS RESERVED. DESIGNED BY HUYY
        </div>
    </div>
</footer>

<!-- Sales Notification Popup -->
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/footer-popup.css">

<div id="salesPopup" class="sales-popup">
    <div class="sales-popup-close" onclick="closeSalesPopup()">×</div>
    <a href="#" id="salesPopupLink" class="sales-popup-link">
        <img src="" id="salesPopupImg" class="sales-popup-img" alt="Product">
        <div class="sales-popup-content">
            <div class="verified-badge">
                <i class="fas fa-check-circle"></i> Đã xác thực
            </div>
            <h6 id="salesPopupName" class="sales-popup-title">Sản phẩm đang tải...</h6>
            <p id="salesPopupTime" class="sales-popup-time">Một khách hàng vừa đặt mua</p>
        </div>
    </a>
</div>

<script>
    window.APP_CONTEXT_PATH = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/assets/js/footer-popup.js"></script>
