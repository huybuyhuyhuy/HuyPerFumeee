<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .knowledge-container { background: #f8f9fa; padding: 40px 0; }
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

<div class="knowledge-container">
    <div class="container">
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb small">
                <li class="breadcrumb-item"><a href="home" class="text-muted text-decoration-none">Trang chủ</a></li>
                <li class="breadcrumb-item active text-dark fw-bold">Kiến thức</li>
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
                        <li><a href="knowledge" class="nav-sidebar-link fw-bold text-success">Kiến thức</a></li>
                        <li><a href="blog" class="nav-sidebar-link">Blog</a></li>
                        <li><a href="contact" class="nav-sidebar-link">Liên hệ</a></li>
                    </ul>
                </div>

                <div class="sidebar-blog">
                    <h6 class="sidebar-title">Nổi bật</h6>
                    <div class="d-flex gap-2 mb-3 align-items-start">
                        <img src="${pageContext.request.contextPath}/assets/images/kn1.png" width="60" height="60" class="rounded object-fit-cover">
                        <div>
                            <a href="#" class="text-dark text-decoration-none small fw-bold d-block">Phân biệt EDP và EDT</a>
                            <span class="text-muted" style="font-size: 0.7rem;">09/03/2026</span>
                        </div>
                    </div>
                    <div class="d-flex gap-2 mb-3 align-items-start">
                        <img src="${pageContext.request.contextPath}/assets/images/kn2.png" width="60" height="60" class="rounded object-fit-cover">
                        <div>
                            <a href="#" class="text-dark text-decoration-none small fw-bold d-block">Cách bảo quản nước hoa đúng cách</a>
                            <span class="text-muted" style="font-size: 0.7rem;">08/03/2026</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Knowledge Content -->
            <div class="col-lg-9">
                <div class="blog-list">
                    <h3 class="fw-bold mb-4">Kiến thức nước hoa</h3>
                    
                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/kn1.png" class="blog-img" alt="Knowledge 1">
                        <div class="blog-info">
                            <div class="blog-date">09/03/2026 - Chuyên gia Huy Perfume</div>
                            <h4>Nước hoa EDP và EDT khác nhau như thế nào?</h4>
                            <p class="blog-excerpt">Nhiều khách hàng khi mua nước hoa thường thắc mắc về các ký hiệu EDP, EDT trên thân chai. Đây là các ký hiệu chỉ nồng độ tinh dầu có trong nước hoa, ảnh hưởng trực tiếp đến độ lưu hương...</p>
                        </div>
                    </div>

                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/kn2.png" class="blog-img" alt="Knowledge 2">
                        <div class="blog-info">
                            <div class="blog-date">27/01/2026 - Chuyên gia Huy Perfume</div>
                            <h4>Bí quyết xịt nước hoa giúp lưu hương cả ngày dài</h4>
                            <p class="blog-excerpt">Xịt nước hoa đúng cách không chỉ giúp bạn tỏa sáng mà còn giúp tiết kiệm lượng nước hoa sử dụng. Hãy cùng Huy Perfume tìm hiểu các "điểm vàng" trên cơ thể giúp mùi hương lan tỏa tốt nhất...</p>
                        </div>
                    </div>

                    <div class="blog-item">
                        <img src="${pageContext.request.contextPath}/assets/images/kn3.png" class="blog-img" alt="Knowledge 3">
                        <div class="blog-info">
                            <div class="blog-date">20/12/2025 - Chuyên gia Huy Perfume</div>
                            <h4>Cách bảo quản nước hoa không bị biến chất</h4>
                            <p class="blog-excerpt">Nước hoa là một loại mỹ phẩm khá nhạy cảm với môi trường. Ánh sáng mặt trời, nhiệt độ cao và độ ẩm là những kẻ thù số một khiến nước hoa nhanh chóng bị đổi màu và mùi hương...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>
