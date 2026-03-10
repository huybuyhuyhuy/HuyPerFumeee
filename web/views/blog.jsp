<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .blog-container { background: #f8f9fa; padding: 40px 0; }
    .sidebar-blog { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .sidebar-title { font-weight: 700; text-transform: uppercase; font-size: 0.9rem; margin-bottom: 20px; border-bottom: 2px solid #003D2E; padding-bottom: 10px; }
    .blog-list { background: #fff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .blog-item { display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 30px; }
    .blog-img { width: 250px; height: 180px; object-fit: cover; border-radius: 8px; }
    .blog-info h4 { font-weight: 700; font-size: 1.2rem; color: #1a1a1a; margin-bottom: 10px; }
    .blog-date { font-size: 0.8rem; color: #888; margin-bottom: 10px; }
    .blog-excerpt { font-size: 0.9rem; color: #555; line-height: 1.6; }
    .nav-sidebar-link { color: #333; text-decoration: none; display: block; padding: 8px 0; font-size: 0.9rem; border-bottom: 1px solid #f9f9f9; }
    .nav-sidebar-link:hover { color: #003D2E; padding-left: 5px; transition: all 0.3s; }
</style>

<div class="blog-container">
    <div class="container">
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb small">
                <li class="breadcrumb-item"><a href="home" class="text-muted text-decoration-none">Trang chủ</a></li>
                <li class="breadcrumb-item active text-dark fw-bold">Blog</li>
            </ol>
        </nav>

        <div class="row">
            <!-- Sidebar -->
            <div class="col-lg-3">
                <div class="sidebar-blog mb-4">
                    <h6 class="sidebar-title">Danh mục</h6>
                    <ul class="list-unstyled">
                        <li><a href="home" class="nav-sidebar-link">Trang chủ</a></li>
                        <li><a href="about" class="nav-sidebar-link">Giới thiệu</a></li>
                        <li><a href="home" class="nav-sidebar-link">Thương hiệu</a></li>
                        <li><a href="home" class="nav-sidebar-link">Nước hoa</a></li>
                        <li><a href="home" class="nav-sidebar-link">Nước hoa chiết</a></li>
                        <li><a href="knowledge" class="nav-sidebar-link">Kiến thức</a></li>
                        <li><a href="blog" class="nav-sidebar-link fw-bold text-success">Blog</a></li>
                        <li><a href="contact" class="nav-sidebar-link">Liên hệ</a></li>
                    </ul>
                </div>

                <div class="sidebar-blog">
                    <h6 class="sidebar-title">Nổi bật</h6>
                    <div class="d-flex gap-2 mb-3 align-items-start">
                        <img src="${pageContext.request.contextPath}/assets/images/blog1.png" width="60" height="60" class="rounded object-fit-cover">
                        <div>
                            <a href="#" class="text-dark text-decoration-none small fw-bold d-block">Cách chọn nước hoa cho mùa hè</a>
                            <span class="text-muted" style="font-size: 0.7rem;">09/03/2026</span>
                        </div>
                    </div>
                    <div class="d-flex gap-2 mb-3 align-items-start">
                        <img src="${pageContext.request.contextPath}/assets/images/blog2.png" width="60" height="60" class="rounded object-fit-cover">
                        <div>
                            <a href="#" class="text-dark text-decoration-none small fw-bold d-block">Top 5 mùi hương nam quyến rũ</a>
                            <span class="text-muted" style="font-size: 0.7rem;">08/03/2026</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Blog Content -->
            <div class="col-lg-9">
                <div class="blog-list">
                    <h3 class="fw-bold mb-4">Blog</h3>
                    
                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/blog1.png" class="blog-img" alt="Blog 1">
                        <div class="blog-info">
                            <div class="blog-date">09/03/2026 - Nhân viên Parfumerie</div>
                            <h4>Valentine 2026: Chọn nước hoa sớm để không chọn vội</h4>
                            <p class="blog-excerpt">14/2 năm nay lại trùng với thời điểm giao mùa, khi năm cũ sắp khép lại để nhường chỗ cho một khởi đầu mới. Món quà nước hoa lúc này không chỉ thay lời yêu thương mà còn là lời chúc an khang...</p>
                        </div>
                    </div>

                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/blog2.png" class="blog-img" alt="Blog 2">
                        <div class="blog-info">
                            <div class="blog-date">27/01/2026 - Nhân viên Parfumerie</div>
                            <h4>Chuẩn bị mùi hương cho Tết 2026: Vì sao nên mua sớm?</h4>
                            <p class="blog-excerpt">Tết 2026 gần kề, việc chọn mùi hương dùng tết sớm dần trở thành một thói quen. Không phải vì vội, mà vì khách hàng hiểu rằng: mùi hương cho Tết không chỉ là một món quà cho bản thân...</p>
                        </div>
                    </div>

                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/blog3.png" class="blog-img" alt="Blog 3">
                        <div class="blog-info">
                            <div class="blog-date">20/12/2025 - Nhân viên Parfumerie</div>
                            <h4>TOP 3 Mùi Hương Phù Hợp Để Hẹn Hò Khi Đông Về</h4>
                            <p class="blog-excerpt">Mỗi mùa lạnh trôi qua đều gắn liền với những kỷ niệm rất riêng: những buổi tối trời se lạnh, ánh đèn vàng dịu, và cảm giác ấm áp khi đứng gần một ai đó. Trong những khoảnh khắc ấy...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>
