<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<div class="container my-5 py-4">
    <div class="row justify-content-center">
        <div class="col-lg-11">
            <c:if test="${not empty errorMsg}">
                <div class="alert alert-danger animate__animated animate__shakeX">
                    <i class="fas fa-exclamation-triangle me-2"></i> ${errorMsg}
                </div>
            </c:if>
            <%-- Import giỏ hàng vào trung tâm trang --%>
            <c:import url="/inc/_cart.jsp"/>
        </div>
    </div>
</div>

<c:import url="/inc/footer.jsp"/>
