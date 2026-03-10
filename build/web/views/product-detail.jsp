<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .product-detail-container { background: #fff; padding: 40px 0; }
    .product-gallery { position: sticky; top: 100px; display: flex; justify-content: center; }
    .product-main-img { border-radius: 15px; width: 85%; max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    
    .product-info-section h1 { font-weight: 800; font-size: 1.8rem; color: #1a1a1a; margin-bottom: 12px; }
    .product-meta { color: #888; font-size: 0.8rem; margin-bottom: 20px; display: flex; gap: 15px; }
    .product-meta span strong { color: #333; }
    
    .product-price-large { font-size: 1.6rem; font-weight: 800; color: #003D2E; margin-bottom: 25px; }
    
    .product-desc-short { color: #555; font-size: 0.9rem; line-height: 1.6; margin-bottom: 30px; border-left: 3px solid #003D2E; padding-left: 15px; }
    
    .scent-notes { background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
    .scent-notes h5 { font-weight: 700; margin-bottom: 15px; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; }
    .note-item { margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; }
    .note-label { font-weight: 700; color: #003D2E; min-width: 90px; font-size: 0.85rem; }
    .note-value { font-size: 0.85rem; color: #444; }
    
    .action-btns { display: flex; gap: 15px; margin-bottom: 35px; }
    .btn-add-cart { background: #003D2E; color: #fff; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 700; transition: all 0.3s; flex-grow: 1; font-size: 0.9rem; }
    .btn-add-cart:hover { background: #005e47; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,61,46,0.2); color: #fff; }
    .btn-wishlist-large { border: 2px solid #eee; background: #fff; width: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ff4757; transition: all 0.3s; }
    .btn-wishlist-large:hover { background: #fff1f2; border-color: #ff4757; }
    
    .product-tabs { border-top: 1px solid #eee; padding-top: 40px; margin-top: 40px; }
    .nav-tabs { border: none; gap: 30px; margin-bottom: 25px; }
    .nav-tabs .nav-link { border: none; padding: 0 0 10px 0; color: #888; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; position: relative; }
    .nav-tabs .nav-link.active { color: #003D2E; background: transparent; }
    .nav-tabs .nav-link.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: #003D2E; }
    
    .tab-content { color: #555; font-size: 0.95rem; line-height: 1.8; }
    .tab-content ul { padding-left: 20px; list-style: none; }
    .tab-content ul li { margin-bottom: 12px; position: relative; padding-left: 20px; }
    .tab-content ul li::before { content: '✓'; position: absolute; left: 0; color: #003D2E; font-weight: bold; }
    
    /* Service Sidebar */
    .service-sidebar { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 25px; }
    .service-item { display: flex; gap: 15px; margin-bottom: 25px; align-items: flex-start; }
    .service-item:last-child { margin-bottom: 0; }
    .service-icon { color: #003D2E; font-size: 1.5rem; width: 30px; text-align: center; }
    .service-text h6 { font-weight: 700; font-size: 0.9rem; margin-bottom: 5px; color: #333; }
    .service-text p { font-size: 0.8rem; color: #777; line-height: 1.4; margin: 0; }
</style>

<div class="product-detail-container">
    <div class="container">
        <nav aria-label="breadcrumb" class="mb-5">
            <ol class="breadcrumb small">
                <li class="breadcrumb-item"><a href="home" class="text-muted text-decoration-none">Trang chủ</a></li>
                <li class="breadcrumb-item"><a href="home?id_category=${product.id_category}" class="text-muted text-decoration-none">Sản phẩm</a></li>
                <li class="breadcrumb-item active text-dark fw-bold">${product.name}</li>
            </ol>
        </nav>

        <div class="row g-5">
            <!-- Cột trái: Hình ảnh -->
            <div class="col-lg-6">
                <div class="product-gallery">
                    <img src="${pageContext.request.contextPath}/assets/images/${product.image}" class="product-main-img" alt="${product.name}">
                </div>
            </div>

            <!-- Cột phải: Thông tin -->
            <div class="col-lg-6">
                <div class="row">
                    <div class="col-md-8">
                        <div class="product-info-section">
                            <div class="product-meta">
                                <span>Thương hiệu: <strong>${brandName != null ? brandName : 'Đang cập nhật'}</strong></span>
                                <span>Mã sản phẩm: <strong>#HP-${product.id}</strong></span>
                            </div>
                            
                            <h1>${product.name}</h1>
                            
                            <div class="product-price-large">
                                <fmt:formatNumber value="${product.price}" pattern="#,##0"/>đ
                            </div>
                            
                            <div class="product-desc-short">
                                Một outfit đầy tươi tắn và chút làn hương nước hoa <strong>${product.name}</strong> đầy quyến rũ trên da, đó chính là dấu ấn sâu sắc nhất về tính cách và bản sắc khi người khác luôn nhớ đến.
                            </div>

                            <div class="scent-notes">
                                <h5>Cấu trúc mùi hương</h5>
                                <div class="note-item">
                                    <span class="note-label">Hương đầu:</span>
                                    <span class="note-value">Hạt tiêu hồng, Quả quýt hồng, Quả lê.</span>
                                </div>
                                <div class="note-item">
                                    <span class="note-label">Hương giữa:</span>
                                    <span class="note-value">Hoa huệ, Ylang-Ylang và Frangipani.</span>
                                </div>
                                <div class="note-item">
                                    <span class="note-label">Hương cuối:</span>
                                    <span class="note-value">Đậu Tonka và Gỗ tuyết tùng.</span>
                                </div>
                            </div>

                            <div class="action-btns">
                                <c:choose>
                                    <c:when test="${sessionScope.user == null}">
                                        <a href="login?target_id=${product.id}" class="btn-add-cart text-decoration-none text-center">
                                            <i class="fas fa-shopping-bag me-2"></i> MUA NGAY
                                        </a>
                                    </c:when>
                                    <c:otherwise>
                                        <a href="home?add_to_cart=${product.id}" class="btn-add-cart text-decoration-none text-center">
                                            <i class="fas fa-shopping-bag me-2"></i> THÊM VÀO GIỎ HÀNG
                                        </a>
                                    </c:otherwise>
                                </c:choose>
                                <button class="btn-wishlist-large" onclick="addToWishlist(this, ${product.id})">
                                    <i class="fa-regular fa-heart fa-xl"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar Dịch vụ -->
                    <div class="col-md-4">
                        <div class="service-sidebar">
                            <div class="service-item">
                                <div class="service-icon"><i class="fas fa-shipping-fast"></i></div>
                                <div class="service-text">
                                    <h6>Giao hàng nhanh chóng</h6>
                                    <p>Giao hàng nhanh tận nơi trên toàn quốc, giao hỏa tốc trong 2h tại nội thành.</p>
                                </div>
                            </div>
                            <div class="service-item">
                                <div class="service-icon"><i class="fas fa-shield-alt"></i></div>
                                <div class="service-text">
                                    <h6>Bảo đảm chất lượng</h6>
                                    <p>Cam kết nước hoa chính hãng 100%, hoàn tiền nếu phát hiện hàng giả.</p>
                                </div>
                            </div>
                            <div class="service-item">
                                <div class="service-icon"><i class="fas fa-headset"></i></div>
                                <div class="service-text">
                                    <h6>Chăm sóc tận tâm</h6>
                                    <p>Hotline 24/7: 0888.070.308 luôn sẵn sàng hỗ trợ quý khách.</p>
                                </div>
                            </div>
                            <div class="service-item">
                                <div class="service-icon"><i class="fas fa-th-large"></i></div>
                                <div class="service-text">
                                    <h6>Đa dạng lựa chọn</h6>
                                    <p>Hàng ngàn sản phẩm từ Fullbox đến Nước hoa chiết tiện lợi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="product-tabs">
                    <ul class="nav nav-tabs" id="myTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="usage-tab" data-bs-toggle="tab" data-bs-target="#usage" type="button" role="tab">Hướng dẫn sử dụng</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="storage-tab" data-bs-toggle="tab" data-bs-target="#storage" type="button" role="tab">Bảo quản</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="policy-tab" data-bs-toggle="tab" data-bs-target="#policy" type="button" role="tab">Chính sách đổi trả</button>
                        </li>
                    </ul>
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active" id="usage" role="tabpanel">
                            <ul>
                                <li>Xịt nước hoa khi cơ thể sạch, khô, hoặc sau khi thoa dưỡng ẩm để giữ mùi lâu hơn.</li>
                                <li>Giữ chai xịt cách cơ thể khoảng 12cm – 15cm và hướng đầu vòi xịt về mình.</li>
                                <li>Xịt vào các điểm mạch đập (cổ, ngực, cổ tay, khuỷu tay) - nơi nhiệt ấm giúp khuếch tán mùi hương tốt nhất.</li>
                                <li>Chờ điểm mạch khô tự nhiên mà không chà xát để tránh làm bay mùi và biến mùi nước hoa.</li>
                            </ul>
                        </div>
                        <div class="tab-pane fade" id="storage" role="tabpanel">
                            <ul>
                                <li><strong>Ánh sáng:</strong> Tránh tiếp xúc trực tiếp với ánh sáng mặt trời để ngăn chặn nước hoa bị biến chất.</li>
                                <li><strong>Nhiệt độ:</strong> Tránh nơi có nhiệt độ dao động quá cao. Không nên để nước hoa trong nhà tắm.</li>
                                <li><strong>Vị trí:</strong> Nên bảo quản trong hộp gốc hoặc trong tủ đồ, kệ tủ khô ráo, thoáng mát.</li>
                            </ul>
                        </div>
                        <div class="tab-pane fade" id="policy" role="tabpanel">
                            <ul>
                                <li><strong>Thời hạn:</strong> Đổi trả trong vòng 03 ngày kể từ khi nhận sản phẩm.</li>
                                <li><strong>Phạm vi:</strong> Chỉ áp dụng cho nước hoa Fullbox bị lỗi kỹ thuật từ nhà sản xuất.</li>
                                <li><strong>Yêu cầu:</strong> Cung cấp video khui hộp (unboxing) rõ ràng để được hỗ trợ nhanh nhất.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function addToWishlist(btn, productId) {
    const icon = btn.querySelector('i');
    const isActive = icon.classList.contains('fa-solid');
    
    // UI Update ngay lập tức
    icon.className = isActive ? 'fa-regular fa-heart fa-xl' : 'fa-solid fa-heart fa-xl';
    
    const url = '${pageContext.request.contextPath}/wishlist?action=add&id=' + productId;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(data => {
        const countBadge = document.getElementById('wishlist-count');
        if (countBadge) {
            countBadge.innerText = data.newSize;
            // Hiệu ứng nháy nhẹ cho badge
            countBadge.style.transform = 'scale(1.4)';
            setTimeout(() => { countBadge.style.transform = 'scale(1)'; }, 200);
        }
    })
    .catch(err => console.error('Wishlist Error:', err));
}
</script>

<c:import url="/inc/footer.jsp"/>
