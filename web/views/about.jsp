<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .about-hero {
        background: linear-gradient(135deg, #003D2E 0%, #0b7a5e 100%);
        color: #fff;
        border-radius: 18px;
        padding: 50px 40px;
        margin-top: 24px;
    }
    .about-hero h1 { font-weight: 800; }
    .about-section-card {
        background: #fff;
        border: 1px solid #eee;
        border-radius: 14px;
        padding: 28px;
        height: 100%;
        box-shadow: 0 8px 24px rgba(0,0,0,0.05);
    }
    .about-kpi {
        background: #f8f9fa;
        border-radius: 12px;
        text-align: center;
        padding: 20px 10px;
    }
    .about-kpi .num {
        font-size: 1.8rem;
        font-weight: 800;
        color: #003D2E;
    }
</style>

<div class="container my-5">
    <section class="about-hero">
        <span class="badge bg-light text-dark mb-3">Về Chúng Tôi</span>
        <h1 class="mb-3">Huy Perfume - Signature Scent For Every Story</h1>
        <p class="mb-0 fs-5">Chúng tôi giúp bạn chọn đúng mùi hương cho từng khoảnh khắc: đi làm, hẹn hò, sự kiện hay món quà dành cho người quan trọng.</p>
    </section>

    <section class="row mt-4 g-4">
        <div class="col-lg-7">
            <div class="about-section-card">
                <h4 class="fw-bold mb-3">Sứ mệnh</h4>
                <p class="text-muted mb-0">Huy Perfume không chỉ bán nước hoa. Chúng tôi tạo trải nghiệm chọn mùi hương rõ ràng, dễ hiểu và phù hợp cá tính từng khách hàng. Mỗi chai nước hoa tại cửa hàng đều được chọn lọc kỹ về độ lưu hương, độ tỏa hương và tính ứng dụng thực tế.</p>
            </div>
        </div>
        <div class="col-lg-5">
            <div class="about-section-card">
                <h4 class="fw-bold mb-3">Điểm khác biệt</h4>
                <ul class="mb-0 text-muted">
                    <li>Tư vấn theo bối cảnh sử dụng thực tế.</li>
                    <li>Ưu tiên sản phẩm chính hãng, nguồn gốc rõ ràng.</li>
                    <li>Hỗ trợ chọn quà theo ngân sách.</li>
                    <li>Đội ngũ chăm sóc sau mua tận tâm.</li>
                </ul>
            </div>
        </div>
    </section>

    <section class="row mt-2 g-3">
        <div class="col-md-3 col-6"><div class="about-kpi"><div class="num">5000+</div><small class="text-muted">Khách hàng hài lòng</small></div></div>
        <div class="col-md-3 col-6"><div class="about-kpi"><div class="num">120+</div><small class="text-muted">Mùi hương chọn lọc</small></div></div>
        <div class="col-md-3 col-6"><div class="about-kpi"><div class="num">3h</div><small class="text-muted">Hỗ trợ phản hồi trung bình</small></div></div>
        <div class="col-md-3 col-6"><div class="about-kpi"><div class="num">100%</div><small class="text-muted">Cam kết sản phẩm chính hãng</small></div></div>
    </section>

    <section class="about-section-card mt-4">
        <h4 class="fw-bold mb-3">Thông điệp thương hiệu</h4>
        <p class="mb-0 text-muted">"Magic Of Your Emotions" là cách Huy Perfume định nghĩa nước hoa: mỗi mùi hương nên kể đúng câu chuyện của người dùng. Chúng tôi mong muốn bạn tự tin hơn, chuyên nghiệp hơn và có dấu ấn riêng rõ ràng hơn trong từng lần xuất hiện.</p>
    </section>
</div>

<c:import url="/inc/footer.jsp"/>
