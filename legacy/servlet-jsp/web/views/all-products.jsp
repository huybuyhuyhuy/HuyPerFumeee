<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@page import="java.util.Random"%>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<%
    Random stockRandom = new Random();
    request.setAttribute("stockRandom", stockRandom);
%>

<style>
    .all-products-hero {
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
        padding: 60px 0 40px;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .all-products-hero::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #c9a96e, transparent);
    }
    .all-products-hero h2 {
        color: #fff;
        font-weight: 700;
        font-size: 2rem;
        letter-spacing: 1px;
        margin-bottom: 6px;
    }
    .all-products-hero h2 span { color: #c9a96e; }
    .all-products-hero p { color: #888; font-size: 0.9rem; margin: 0; }

    /* Filter bar */
    .filter-bar {
        background: #fff;
        border-bottom: 1px solid #eee;
        padding: 12px 0;
        position: sticky;
        top: 0;
        z-index: 100;
    }
    .filter-bar .container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
    }
    .filter-bar .result-count {
        font-size: 0.85rem;
        color: #666;
        font-weight: 500;
    }
    .filter-bar select {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.85rem;
        color: #333;
        background: #fafafa;
        cursor: pointer;
        outline: none;
    }
    .filter-bar select:focus { border-color: #c9a96e; }

    /* Stock badge */
    .stock-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: #003D2E;
        background: rgba(0,61,46,.06);
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;
        margin-top: 4px;
    }
    .stock-badge.low { color: #c0392b; background: rgba(192,57,43,.06); }

    /* Pagination */
    .pagination-wrap {
        display: flex;
        justify-content: center;
        padding: 40px 0;
    }
    .pagination-wrap .page-link {
        border-radius: 8px;
        margin: 0 3px;
        color: #333;
        border: 1px solid #e0e0e0;
        padding: 10px 16px;
        font-weight: 500;
        transition: all .2s;
    }
    .pagination-wrap .page-item.active .page-link {
        background: #c9a96e;
        border-color: #c9a96e;
        color: #0d0d0d;
    }
    .pagination-wrap .page-link:hover { background: #f5f5f5; }

    .empty-state { text-align: center; padding: 80px 20px; }
    .empty-state i { font-size: 4rem; color: #ddd; margin-bottom: 20px; }
</style>

<!-- Hero -->
<div class="all-products-hero">
    <div class="container">
        <h2>Tất cả <span>Sản phẩm</span></h2>
        <p>Khám phá bộ sưu tập nước hoa chính hãng — ${totalProducts} sản phẩm</p>
    </div>
</div>

<!-- Filter bar -->
<div class="filter-bar">
    <div class="container">
        <div class="result-count">Hiển thị <b>${totalProducts}</b> sản phẩm</div>
        <form method="get" action="${pageContext.request.contextPath}/all-products" class="d-flex align-items-center gap-2">
            <input type="hidden" name="page" value="1">
            <label class="small text-muted mb-0">Sắp xếp:</label>
            <select name="sort" onchange="this.form.submit()">
                <option value="newest" ${sort == 'newest' || empty sort ? 'selected' : ''}>Mới nhất</option>
                <option value="price_asc" ${sort == 'price_asc' ? 'selected' : ''}>Giá tăng dần</option>
                <option value="price_desc" ${sort == 'price_desc' ? 'selected' : ''}>Giá giảm dần</option>
            </select>
        </form>
    </div>
</div>

<!-- Product Grid -->
<div class="container py-4">
    <c:choose>
        <c:when test="${not empty listProducts}">
            <div class="row g-4">
                <c:forEach items="${listProducts}" var="p">
                    <c:set var="stockVal" value="<%= stockRandom.nextInt(10) + 1 %>"/>
                    <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                        <div class="product-card-custom ${!p.status ? 'sold-out' : ''}">
                            <div class="img-container">
                                <c:if test="${!p.status}"><div class="sold-out-badge">HẾT HÀNG</div></c:if>
                                <c:choose>
                                    <c:when test="${not empty p.image && (p.image.startsWith('http') || p.image.endsWith('.jpg') || p.image.endsWith('.jpeg') || p.image.endsWith('.png') || p.image.endsWith('.webp') || p.image.endsWith('.gif'))}">
                                        <img src="${p.image.startsWith('http') ? p.image : pageContext.request.contextPath.concat('/api/image?name=').concat(p.image)}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                    </c:when>
                                    <c:otherwise>
                                        <c:set var="cleanName" value="${p.name.replaceAll('(?i)(10ml|Fullbox|Chính hãng|Nước hoa|Perfume)', '').trim()}"/>
                                        <img src="https://loremflickr.com/400/400/fragrance,perfume,${cleanName.replaceAll(' ', ',')}/all?lock=${p.id}" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;"/>
                                    </c:otherwise>
                                </c:choose>
                                <div class="img-overlay">
                                    <a href="${pageContext.request.contextPath}/product-detail?id=${p.id}" class="btn-overlay bg-transparent text-white border-white" style="border: 1px solid white !important;">
                                        <i class="fas fa-eye me-2"></i> Chi tiết
                                    </a>
                                    <c:if test="${p.status}">
                                        <a href="${pageContext.request.contextPath}/all-products?add_to_cart=${p.id}&page=${currentPage}${not empty sort ? '&sort='.concat(sort) : ''}" class="btn-overlay"><i class="fas fa-shopping-cart me-2"></i> Mua ngay</a>
                                    </c:if>
                                </div>
                            </div>
                            <div class="product-info">
                                <h5 class="card-title">${p.name}</h5>
                                <div class="price-container text-start">
                                    <c:choose>
                                        <c:when test="${p.discount_price > 0}">
                                            <span class="text-danger fw-800" style="font-size: 1.1rem;"><fmt:formatNumber value="${p.discount_price}" pattern="#,##0"/>đ</span>
                                            <span class="text-muted small text-decoration-line-through d-block"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</span>
                                        </c:when>
                                        <c:otherwise>
                                            <p class="product-price mb-0 fw-800"><fmt:formatNumber value="${p.price}" pattern="#,##0"/>đ</p>
                                        </c:otherwise>
                                    </c:choose>
                                </div>
                                <c:if test="${p.status}">
                                    <span class="stock-badge ${stockVal <= 3 ? 'low' : ''}">
                                        <i class="fas fa-box-open" style="font-size:0.6rem;"></i> Còn ${stockVal} chai
                                    </span>
                                </c:if>
                            </div>
                        </div>
                    </div>
                </c:forEach>
            </div>
        </c:when>
        <c:otherwise>
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p class="text-muted fw-bold">Không có sản phẩm nào.</p>
            </div>
        </c:otherwise>
    </c:choose>

    <%-- Pagination --%>
    <c:if test="${totalPages > 1}">
        <div class="pagination-wrap">
            <nav>
                <ul class="pagination">
                    <c:if test="${currentPage > 1}">
                        <li class="page-item">
                            <a class="page-link" href="${pageContext.request.contextPath}/all-products?page=${currentPage - 1}${not empty sort ? '&sort='.concat(sort) : ''}">
                                <i class="fas fa-chevron-left"></i>
                            </a>
                        </li>
                    </c:if>
                    <c:forEach begin="1" end="${totalPages}" var="i">
                        <li class="page-item ${i == currentPage ? 'active' : ''}">
                            <a class="page-link" href="${pageContext.request.contextPath}/all-products?page=${i}${not empty sort ? '&sort='.concat(sort) : ''}">${i}</a>
                        </li>
                    </c:forEach>
                    <c:if test="${currentPage < totalPages}">
                        <li class="page-item">
                            <a class="page-link" href="${pageContext.request.contextPath}/all-products?page=${currentPage + 1}${not empty sort ? '&sort='.concat(sort) : ''}">
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        </li>
                    </c:if>
                </ul>
            </nav>
        </div>
    </c:if>
</div>

<c:import url="/inc/footer.jsp"/>
