<%@page contentType="text/html" pageEncoding="UTF-8"%>

<style>
    :root {
        --footer-gold: #c9a96e;
        --footer-dark: #0a0a0a;
        --footer-surface: #111111;
        --footer-muted: #999;
        --footer-border: rgba(201,169,110,0.1);
        --footer-accent: #003D2E;
    }

    .site-footer {
        background: linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 30%, #0a0a0a 100%);
        color: #bbb;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        position: relative;
        overflow: hidden;
    }

    .site-footer::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #c9a96e, #003D2E, #c9a96e, transparent);
        opacity: 0.7;
    }

    /* ── Top row ── */
    .footer-top {
        padding: 70px 0 50px;
        border-bottom: 1px solid var(--footer-border);
    }

    .footer-brand {
        font-size: 26px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 1px;
        margin-bottom: 4px;
    }
    .footer-brand span { color: var(--footer-gold); }

    .footer-tagline {
        color: var(--footer-muted);
        font-size: 13px;
        line-height: 1.7;
        margin-bottom: 20px;
        max-width: 280px;
    }

    .footer-heading {
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 22px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .footer-heading::before {
        content: '';
        width: 18px;
        height: 2px;
        background: var(--footer-gold);
        border-radius: 1px;
    }

    .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .footer-links li { margin-bottom: 12px; }
    .footer-links a {
        color: var(--footer-muted);
        text-decoration: none;
        font-size: 13px;
        transition: all 0.25s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .footer-links a i { font-size: 10px; color: var(--footer-gold); opacity: 0; transition: all 0.25s; }
    .footer-links a:hover {
        color: var(--footer-gold);
        transform: translateX(4px);
    }
    .footer-links a:hover i { opacity: 1; }

    /* ── Contact ── */
    .footer-contact-item {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        font-size: 13px;
        color: var(--footer-muted);
    }
    .footer-contact-icon {
        width: 36px; height: 36px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--footer-gold);
        flex-shrink: 0;
        font-size: 14px;
    }

    /* ── Social ── */
    .footer-social {
        display: flex;
        gap: 10px;
        margin-top: 24px;
    }
    .footer-social a {
        width: 38px; height: 38px;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 15px;
        transition: all 0.3s;
    }
    .footer-social a:hover {
        background: var(--footer-gold);
        color: #0d0d0d;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(201,169,110,0.25);
    }

    /* ── Newsletter ── */
    .footer-newsletter-text {
        color: var(--footer-muted);
        font-size: 13px;
        line-height: 1.7;
        margin-bottom: 16px;
    }
    .footer-newsletter-group {
        display: flex;
        background: rgba(255,255,255,0.04);
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.08);
        transition: border-color 0.3s;
    }
    .footer-newsletter-group:focus-within {
        border-color: var(--footer-gold);
    }
    .footer-newsletter-group input {
        flex: 1;
        background: transparent;
        border: none;
        padding: 12px 16px;
        color: #fff;
        font-size: 13px;
        outline: none;
    }
    .footer-newsletter-group input::placeholder { color: rgba(255,255,255,0.3); }
    .footer-newsletter-group button {
        background: var(--footer-gold);
        border: none;
        color: #0d0d0d;
        padding: 0 20px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s;
        letter-spacing: 0.5px;
    }
    .footer-newsletter-group button:hover {
        background: #d4b87a;
    }
    #footer-newsletter-msg {
        font-size: 12px;
        margin-top: 8px;
        display: none;
    }

    /* ── Bottom bar ── */
    .footer-bottom {
        padding: 20px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
    }
    .footer-copy {
        font-size: 12px;
        color: #555;
        letter-spacing: 0.5px;
    }
    .footer-bottom-links {
        display: flex;
        gap: 24px;
        list-style: none;
        margin: 0; padding: 0;
    }
    .footer-bottom-links a {
        color: #555;
        font-size: 12px;
        text-decoration: none;
        transition: color 0.3s;
    }
    .footer-bottom-links a:hover { color: var(--footer-gold); }

    /* ── Payment icons ── */
    .footer-payment {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .footer-payment img {
        height: 18px;
        opacity: 0.35;
        transition: all 0.3s;
    }
    .footer-payment img:hover {
        opacity: 0.8;
        transform: translateY(-2px);
    }

    /* ── Back to top ── */
    .back-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--footer-gold);
        color: #0d0d0d;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
        transition: all 0.35s;
        z-index: 999;
        box-shadow: 0 4px 20px rgba(201,169,110,0.3);
    }
    .back-to-top.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    .back-to-top:hover {
        background: #d4b87a;
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(201,169,110,0.4);
    }

    @media (max-width: 767px) {
        .footer-top { padding: 50px 0 30px; }
        .footer-bottom { flex-direction: column; text-align: center; }
        .back-to-top { bottom: 20px; right: 20px; width: 40px; height: 40px; }
    }
</style>

<footer class="site-footer">
    <div class="footer-top">
        <div class="container">
            <div class="row g-5">
                <!-- Brand -->
                <div class="col-lg-4">
                    <div class="footer-brand">Huy<span>.</span>Perfume</div>
                    <p class="footer-tagline">
                        Mang hương thơm đẳng cấp thế giới đến gần hơn với bạn. Mỗi chai nước hoa là một câu chuyện — hãy tìm mùi hương kể câu chuyện của riêng bạn.
                    </p>
                    <div class="footer-newsletter-text">Đăng ký nhận tin để cập nhật những dòng nước hoa mới nhất và ưu đãi độc quyền.</div>
                    <div class="footer-newsletter-group mb-3">
                        <input type="email" id="newsletter-email" placeholder="Email của bạn...">
                        <button type="button" onclick="subscribeNewsletter()">Đăng ký</button>
                    </div>
                    <div id="footer-newsletter-msg"></div>
                    <div class="footer-social">
                        <a href="https://www.facebook.com/qhuy.29/" target="_blank" title="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/quochuy29_/" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.youtube.com/@quochuy4739" target="_blank" title="Youtube"><i class="fab fa-youtube"></i></a>
                        <a href="https://www.tiktok.com" target="_blank" title="TikTok"><i class="fab fa-tiktok"></i></a>
                    </div>
                </div>

                <!-- Explore -->
                <div class="col-lg-2 col-md-4 col-6">
                    <h5 class="footer-heading">Khám phá</h5>
                    <ul class="footer-links">
                        <li><a href="${pageContext.request.contextPath}/home"><i class="fas fa-chevron-right"></i>Trang chủ</a></li>
                        <li><a href="${pageContext.request.contextPath}/about"><i class="fas fa-chevron-right"></i>Giới thiệu</a></li>
                        <li><a href="${pageContext.request.contextPath}/blog"><i class="fas fa-chevron-right"></i>Blog kiến thức</a></li>
                        <li><a href="${pageContext.request.contextPath}/contact"><i class="fas fa-chevron-right"></i>Liên hệ</a></li>
                    </ul>
                </div>

                <!-- Services -->
                <div class="col-lg-3 col-md-4 col-6">
                    <h5 class="footer-heading">Dịch vụ</h5>
                    <ul class="footer-links">
                        <li><a href="#"><i class="fas fa-chevron-right"></i>Hướng dẫn mua hàng</a></li>
                        <li><a href="#"><i class="fas fa-chevron-right"></i>Chính sách bảo mật</a></li>
                        <li><a href="#"><i class="fas fa-chevron-right"></i>Chính sách đổi trả</a></li>
                        <li><a href="#"><i class="fas fa-chevron-right"></i>Vận chuyển & Giao hàng</a></li>
                    </ul>
                </div>

                <!-- Contact -->
                <div class="col-lg-3 col-md-4">
                    <h5 class="footer-heading">Liên hệ</h5>
                    <div class="footer-contact-item">
                        <div class="footer-contact-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div>Khu Royal Park, Thừa Thiên Huế</div>
                    </div>
                    <div class="footer-contact-item">
                        <div class="footer-contact-icon"><i class="fas fa-phone-alt"></i></div>
                        <div><a href="tel:0906530794" style="color:inherit;text-decoration:none;">0906.530.794</a></div>
                    </div>
                    <div class="footer-contact-item">
                        <div class="footer-contact-icon"><i class="fas fa-envelope"></i></div>
                        <div><a href="mailto:info@huyperfume.vn" style="color:inherit;text-decoration:none;">info@huyperfume.vn</a></div>
                    </div>
                    <div class="footer-contact-item">
                        <div class="footer-contact-icon" style="background:#0180c7;color:#fff;"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.5 2C6.8 2 2.1 5.8 2.1 10.5c0 2.7 1.5 5.2 3.8 6.8l-1 3.7 4-2.1c1 .3 2.1.5 3.2.5 5.7 0 10.4-3.8 10.4-8.9S18.2 2 12.5 2zm0 15.5c-1 0-2-.2-2.9-.5l-.3-.2-2.4 1.3.7-2.2-.2-.3c-.9-1.4-1.4-2.9-1.4-4.5 0-4.3 4-7.8 8.9-7.8s8.9 3.5 8.9 7.8-4 7.8-8.9 7.8z"/><path d="M10.5 9h.8v4h-.8zm3 0h.8l-1.3 4h-.8zm-1.8.5c-.3 0-.5.2-.5.5v2.5c0 .3.2.5.5.5s.5-.2.5-.5V11c0-.3-.2-.5-.5-.5z"/></svg></div>
                        <div><a href="https://zalo.me/0906530794" target="_blank" style="color:inherit;text-decoration:none;">Chat Zalo</a></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom bar -->
    <div class="container">
        <div class="footer-bottom">
            <div class="footer-copy">&copy; 2026 Huy Perfume. All rights reserved.</div>
            <ul class="footer-bottom-links">
                <li><a href="#">Điều khoản</a></li>
                <li><a href="#">Bảo mật</a></li>
                <li><a href="#">Sitemap</a></li>
            </ul>
            <div class="footer-payment">
                <img src="${pageContext.request.contextPath}/assets/icon/visa.png" alt="Visa">
                <img src="${pageContext.request.contextPath}/assets/icon/master.png" alt="Mastercard">
                <img src="${pageContext.request.contextPath}/assets/icon/jcb.png" alt="JCB">
                <img src="${pageContext.request.contextPath}/assets/icon/cod.png" alt="COD">
                <img src="${pageContext.request.contextPath}/assets/icon/bank.png" alt="Banking">
                <img src="${pageContext.request.contextPath}/assets/icon/momo.png" alt="MoMo">
            </div>
        </div>
    </div>
</footer>

<!-- Back to Top -->
<button class="back-to-top" id="backToTop" title="Lên đầu trang">
    <i class="fas fa-arrow-up"></i>
</button>

<script>
    // Back to top
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Newsletter subscription
    function subscribeNewsletter() {
        const email = document.getElementById('newsletter-email');
        const msg = document.getElementById('footer-newsletter-msg');
        if (!email || !email.value || !email.value.includes('@')) {
            if (msg) { msg.style.color = '#e74c3c'; msg.innerText = 'Vui lòng nhập email hợp lệ.'; msg.style.display = 'block'; }
            return;
        }
        if (msg) {
            msg.style.color = '#2ecc71';
            msg.innerText = 'Cảm ơn bạn đã đăng ký!';
            msg.style.display = 'block';
        }
        if (email) email.value = '';
        setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
    }
</script>

<!-- Sales Notification Popup -->
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/footer-popup.css">

<div id="salesPopup" class="sales-popup">
    <div class="sales-popup-close" onclick="closeSalesPopup()">&times;</div>
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
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/footer-popup.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/iconly-replacer.js"></script>
<script src="${pageContext.request.contextPath}/assets/js/product-chatbox.js"></script>
</body>
</html>
