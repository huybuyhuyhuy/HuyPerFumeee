<%@page contentType="text/html" pageEncoding="UTF-8"%>

<style>
footer {
    background: #022e25;
    color: #ffffff;
    font-family: "Segoe UI", sans-serif;
    padding: 50px 0 0;
}

footer .row {
    max-width: 1200px;
    margin: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 20px;
}

footer .col {
    width: 22%;
    min-width: 200px;
}

footer h4 {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 15px;
    color: #d5ffef;
}

footer ul {
    padding: 0;
    list-style: none;
}

footer ul li {
    margin-bottom: 8px;
}

footer ul li a {
    color: #dcdcdc;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s ease;
}

footer ul li a:hover {
    color: #ffffff;
    padding-left: 4px;
}

/* PAYMENT / SOCIAL */
.center-box {
    text-align: center;
    margin: 40px auto;
}

.logo-row img,
.social img {
    transition: 0.2s;
}

.logo-row img {
    width: 55px;
    margin: 8px;
    opacity: 0.9;
}

.logo-row img:hover {
    opacity: 1;
    transform: scale(1.05);
}

.social img {
    width: 42px;
    margin: 6px;
    opacity: 0.85;
}

.social img:hover {
    opacity: 1;
    transform: scale(1.1);
}

/* Contact */
.contact {
    text-align: center;
    line-height: 1.8;
    margin-top: 40px;
    font-size: 15px;
    color: #dcdcdc;
}

/* Divider */
footer .divider {
    width: 80%;
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 40px auto 20px;
}

/* Copyright */
.copy {
    background: #011f19;
    text-align: center;
    padding: 15px;
    margin-top: 10px;
    font-size: 14px;
    letter-spacing: 0.4px;
    color: #9ae0cf;
}
</style>

<footer>

    <!-- 4 CỘT -->
    <div class="row">
        <div class="col">
            <h4>VỀ PARFUMERIE</h4>
            <ul>
                <li><a href="#">Trang chủ</a></li>
                <li><a href="#">Giới thiệu</a></li>
                <li><a href="#">Sản phẩm</a></li>
                <li><a href="#">Liên hệ</a></li>
            </ul>
        </div>

        <div class="col">
            <h4>HƯỚNG DẪN</h4>
            <ul>
                <li><a href="#">Hướng dẫn mua hàng</a></li>
                <li><a href="#">Hướng dẫn thanh toán</a></li>
                <li><a href="#">Hướng dẫn kiểm hàng</a></li>
                <li><a href="#">Điều khoản sử dụng</a></li>
            </ul>
        </div>

        <div class="col">
            <h4>CHÍNH SÁCH</h4>
            <ul>
                <li><a href="#">Chính sách mua hàng</a></li>
                <li><a href="#">Chính sách bảo mật</a></li>
                <li><a href="#">Chính sách giao hàng</a></li>
                <li><a href="#">Chính sách đổi trả</a></li>
            </ul>
        </div>

        <div class="col">
            <h4>HỖ TRỢ</h4>
            <ul>
                <li><a href="#">Tìm kiếm</a></li>
                <li><a href="#">Đăng nhập</a></li>
                <li><a href="#">Đăng ký</a></li>
                <li><a href="#">Cộng tác viên</a></li>
            </ul>
        </div>
    </div>

    <!-- PAYMENT -->
    <div class="center-box">
        <h4>PHƯƠNG THỨC THANH TOÁN</h4>
        <div class="logo-row">
            <img src="assets/icon/visa.png">
            <img src="assets/icon/master.png">
            <img src="assets/icon/jcb.png">
            <img src="assets/icon/napas.png">
            <img src="assets/icon/cod.png">
            <img src="assets/icon/bank.png">
            <img src="assets/icon/vnpay.png">
            <img src="assets/icon/momo.png">
        </div>
    </div>

    <!-- SOCIAL -->
    <div class="center-box">
        <h4>KẾT NỐI VỚI CHÚNG TÔI</h4>
        <div class="social">
            <img src="assets/icon/fb.png">
            <img src="assets/icon/ig.png">
            <img src="assets/icon/yt.png">
            <img src="assets/icon/gg.png">
        </div>
    </div>

    <div class="divider"></div>

    <!-- CONTACT -->
    <div class="contact">
        <h4>THÔNG TIN LIÊN HỆ</h4>
        Hộ Kinh doanh HUYPERFUME<br>
        Số ĐKKD 0238308374 – UBND Thành Phố Huế<br>
        Khu Royal Park<br>
        Điện thoại: 0888070308<br>
        Email: info@huyperfume.vn
    </div>

    <div class="copy">
        HuyPerfume.vn | Cung cấp bởi Huyy
    </div>

</footer>
