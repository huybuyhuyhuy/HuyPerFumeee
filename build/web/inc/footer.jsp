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
<style>
    .sales-popup {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.98);
        padding: 12px;
        border-radius: 16px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.12);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        max-width: 320px;
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform: translateY(150%) scale(0.8);
        opacity: 0;
        border: 1px solid rgba(0,0,0,0.05);
        backdrop-filter: blur(10px);
    }
    .sales-popup.active {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    .sales-popup-img {
        width: 55px;
        height: 55px;
        border-radius: 12px;
        object-fit: cover;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .sales-popup-content {
        flex: 1;
        overflow: hidden;
    }
    .sales-popup-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .sales-popup-time {
        font-size: 0.72rem;
        color: #666;
        margin: 2px 0 0 0;
    }
    .sales-popup-close {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #999;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #eee;
        opacity: 0;
        transition: 0.3s;
    }
    .sales-popup:hover .sales-popup-close {
        opacity: 1;
    }
    .sales-popup-close:hover {
        background: #ff4757;
        color: #fff;
        border-color: #ff4757;
    }
    .sales-popup-link {
        text-decoration: none !important;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
    }
    .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #28a745;
        font-size: 0.65rem;
        font-weight: 600;
        margin-bottom: 4px;
        text-transform: uppercase;
    }
</style>

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
    // Banner Carousel Logic
    let currentSlide = 0;
    let autoPlayInterval;

    function initBannerCarousel() {
        const track = document.getElementById('carouselTrack');
        const dots = document.querySelectorAll('.dot');
        const slides = document.querySelectorAll('.carousel-slide');
        
        if (!track || slides.length === 0) return;

        function updateCarousel() {
            track.style.transform = `translateX(-${currentSlide * 25}%)`;
            dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
            slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
        }

        window.goToSlide = function(index) {
            currentSlide = index;
            updateCarousel();
            resetAutoPlay();
        };

        window.nextSlide = function() {
            currentSlide = (currentSlide + 1) % 4;
            updateCarousel();
        };

        window.prevSlide = function() {
            currentSlide = (currentSlide - 1 + 4) % 4;
            updateCarousel();
            resetAutoPlay();
        };

        function resetAutoPlay() {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(() => {
                nextSlide();
            }, 5000);
        }

        // Khởi tạo chạy tự động ngay lập tức
        resetAutoPlay();

        // Drag functionality
        let startX, isDragging = false;

        track.addEventListener('mousedown', e => {
            isDragging = true;
            startX = e.pageX;
            if (autoPlayInterval) clearInterval(autoPlayInterval);
        });

        track.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const x = e.pageX;
            const walk = x - startX;
            if (Math.abs(walk) > 100) {
                if (walk > 0) prevSlide();
                else nextSlide();
                isDragging = false;
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resetAutoPlay();
            }
        });
    }

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        initBannerCarousel();
        fetchProductsForPopup();
    });

    // Sales Popup Logic
    let popupTimer;

    async function fetchProductsForPopup() {
        try {
            const response = await fetch('${pageContext.request.contextPath}/api/products/random');
            if (!response.ok) throw new Error('Network response was not ok');
            popupProducts = await response.json();
            
            if (popupProducts && popupProducts.length > 0) {
                // Show first popup after 3 seconds
                setTimeout(showRandomSale, 3000);
            }
        } catch (error) {
            console.error('Sales Popup Error:', error);
        }
    }

    function showRandomSale() {
        const popup = document.getElementById('salesPopup');
        if (!popup || popupProducts.length === 0) return;
        
        const randomProduct = popupProducts[Math.floor(Math.random() * popupProducts.length)];
        const randomMinutes = Math.floor(Math.random() * 50) + 2;
        
        const imgElement = document.getElementById('salesPopupImg');
        const nameElement = document.getElementById('salesPopupName');
        const timeElement = document.getElementById('salesPopupTime');
        const linkElement = document.getElementById('salesPopupLink');
        
        if (imgElement) {
            if (randomProduct.image && (randomProduct.image.startsWith('http') || randomProduct.image.endsWith('.jpg') || randomProduct.image.endsWith('.png'))) {
                imgElement.src = randomProduct.image.startsWith('http') ? randomProduct.image : '${pageContext.request.contextPath}/assets/images/' + randomProduct.image;
            } else {
                imgElement.src = 'https://loremflickr.com/100/100/perfume,bottle,' + encodeURIComponent(randomProduct.name) + '/all?lock=' + randomProduct.id;
            }
        }
        if (nameElement) nameElement.innerText = randomProduct.name;
        if (timeElement) timeElement.innerText = `Một khách hàng vừa đặt mua cách đây ${randomMinutes} phút`;
        if (linkElement) linkElement.href = '${pageContext.request.contextPath}/product-detail?id=' + randomProduct.id;
        
        popup.classList.add('active');
        
        // Hide after 6 seconds
        setTimeout(() => {
            closeSalesPopup();
            // Schedule next popup after 15-25 seconds
            const nextDelay = Math.floor(Math.random() * 10000) + 15000;
            popupTimer = setTimeout(showRandomSale, nextDelay);
        }, 6000);
    }

    function closeSalesPopup() {
        const popup = document.getElementById('salesPopup');
        if (popup) popup.classList.remove('active');
    }

    // Initialize on load
    document.addEventListener('DOMContentLoaded', fetchProductsForPopup);
</script>
