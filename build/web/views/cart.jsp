<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<div class="container my-5">
    <div class="row">
        <%-- Sidebar DANH MỤC + THƯƠNG HIỆU (giống trang chủ) --%>
        <div class="col-lg-3 col-md-4">
            <div class="sidebar p-3 border rounded">
                <h6 class="mb-3 text-uppercase fw-bold">DANH MỤC</h6>
                <ul class="list-unstyled mb-4">
                    <li>
                        <a href="${pageContext.request.contextPath}/home" class="text-dark d-block py-1">Tất cả Sản phẩm</a>
                    </li>
                    <c:forEach items="${listCategory}" var="c">
                        <li>
                            <a href="${pageContext.request.contextPath}/home?id_category=${c.id}" class="text-dark d-block py-1">${c.name}</a>
                        </li>
                    </c:forEach>
                </ul>
                <hr>
                <form action="${pageContext.request.contextPath}/home" method="GET">
                    <h6 class="mb-3 text-uppercase fw-bold">THƯƠNG HIỆU</h6>
                    <c:forEach items="${listBrands}" var="brand">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" name="brand_id" value="${brand.id}" id="cart-brand${brand.id}">
                            <label class="form-check-label" for="cart-brand${brand.id}">${brand.name}</label>
                        </div>
                    </c:forEach>
                    <button type="submit" class="btn btn-sm btn-success w-100 mt-3">Lọc sản phẩm</button>
                </form>
            </div>
        </div>
        <div class="col-lg-9 col-md-8">
            <c:import url="/inc/_cart.jsp"/>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>