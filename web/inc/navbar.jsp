<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>


<style>
    /* Hiệu ứng hover cho màn hình máy tính (Desktop) */
    @media (min-width: 992px) {
        .nav-item.dropdown:hover .dropdown-menu {
            display: block;
            margin-top: 0; 
            animation: fadeIn 0.3s ease; /* Thêm hiệu ứng hiện ra mượt hơn */
        }
    }

    /* Hiệu ứng hiện ra mượt mà */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* CSS giúp dropdown đẹp hơn */
    .dropdown-menu-hover {
        border: none;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        border-radius: 8px;
        padding: 10px 0;
    }
    
    .dropdown-item.active.fw-bold {
        background-color: #f8f9fa;
        color: #000;
    }
</style>

<nav class="navbar navbar-expand-lg nav-main">
    <div class="container">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarMain">
            <ul class="navbar-nav mx-auto">
                
                <li class="nav-item">
                    <a class="nav-link nav-link-custom ${(empty param.brand_id && empty param.id_category) ? 'active' : ''}" 
                       href="${pageContext.request.contextPath}/home">
                        <i class="fas fa-wine-bottle me-1"></i>TRANG CHỦ
                    </a>
                </li>

                <li class="nav-item dropdown">
                    <a class="nav-link nav-link-custom dropdown-toggle ${not empty param.brand_id ? 'active' : ''}" 
                       href="#" id="brandsDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-crown me-1"></i>THƯƠNG HIỆU
                    </a>
                    <ul class="dropdown-menu dropdown-menu-hover" aria-labelledby="brandsDropdown">
                        <c:choose>
                            <c:when test="${not empty listBrands}">
                                <c:forEach items="${listBrands}" var="brand">
                                    <li>
                                        <a class="dropdown-item ${param.brand_id == brand.id ? 'active fw-bold' : ''}" 
                                           href="${pageContext.request.contextPath}/home?brand_id=${brand.id}">
                                            ${brand.name}
                                        </a>
                                    </li>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <li><a class="dropdown-item disabled">Đang tải thương hiệu...</a></li>
                            </c:otherwise>
                        </c:choose>
                    </ul>
                </li>
                
                <li class="nav-item dropdown">
                    <a class="nav-link nav-link-custom dropdown-toggle ${not empty param.id_category ? 'active' : ''}" 
                       href="#" id="perfumeOilDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-tint me-1"></i>DANH MỤC
                    </a>
                    <ul class="dropdown-menu dropdown-menu-hover" aria-labelledby="perfumeOilDropdown">
                        <c:choose>
                            <c:when test="${not empty listCategory}">
                                 <c:forEach items="${listCategory}" var="c">
                                    <li>
                                        <a class="dropdown-item ${param.id_category == c.id ? 'active fw-bold' : ''}" 
                                           href="${pageContext.request.contextPath}/home?id_category=${c.id}">
                                            ${c.name}
                                        </a>
                                    </li>
                                </c:forEach>
                            </c:when>
                            <c:otherwise>
                                <li><a class="dropdown-item disabled">Đang tải danh mục...</a></li>
                            </c:otherwise>
                        </c:choose>
                    </ul>
                </li>

                <li class="nav-item">
                    <a class="nav-link nav-link-custom" href="#">
                        <i class="fas fa-info-circle me-1"></i>GIỚI THIỆU
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>