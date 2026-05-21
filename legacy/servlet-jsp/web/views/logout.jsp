
<% 
    request.getSession().invalidate();  // XOÁ TOÀN B? SESSION
response.sendRedirect(request.getContextPath()+"/home");

%>
