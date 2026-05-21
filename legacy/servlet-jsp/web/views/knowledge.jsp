<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .knowledge-wrap { background: #f4f7f6; padding: 50px 0; }
    .side-box, .content-box { background: #fff; border-radius: 16px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; }
    .side-box { padding: 20px; margin-bottom: 24px; }
    .content-box { padding: 30px; }
    
    .side-title { font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; color: #003D2E; border-bottom: 2px solid #003D2E; padding-bottom: 8px; display: inline-block; }
    
    .nav-list { list-style: none; padding: 0; margin: 0; }
    .nav-list li { margin-bottom: 12px; }
    .nav-list li a { color: #555; text-decoration: none; transition: all 0.2s; font-size: 14px; display: block; padding: 4px 0; }
    .nav-list li a:hover { color: #003D2E; transform: translateX(5px); }
    .nav-list li a.active { color: #003D2E; font-weight: 700; }

    .item-card { display: flex; gap: 24px; border-bottom: 1px solid #eee; padding-bottom: 24px; margin-bottom: 24px; transition: .3s; }
    .item-card:last-child { border-bottom: none; margin-bottom: 0; }
    .item-img-link { width: 300px; height: 200px; flex-shrink: 0; border-radius: 12px; overflow: hidden; display: block; }
    .item-card img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .item-card:hover img { transform: scale(1.08); }
    .item-body { flex: 1; }
    .meta { font-size: 12px; color: #999; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .item-title { font-size: 1.25rem; font-weight: 700; line-height: 1.4; margin-bottom: 12px; }
    .item-title a { color: #222; text-decoration: none; transition: 0.2s; }
    .item-title a:hover { color: #003D2E; }
    .item-excerpt { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    
    .highlight-item { display: flex; gap: 12px; margin-bottom: 15px; align-items: center; }
    .highlight-img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .highlight-title { font-size: 13px; font-weight: 600; line-height: 1.3; color: #333; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .highlight-meta { font-size: 11px; color: #999; }

    @media (max-width: 992px) {
        .item-card { flex-direction: column; }
        .item-img-link { width: 100%; }
    }
</style>

<div class="knowledge-wrap">
    <div class="container">
        <div class="row">
            <div class="col-lg-3">
                <div class="side-box">
                    <div class="side-title">DANH MỤC</div>
                    <ul class="nav-list">
                        <li><a href="home">Trang chủ</a></li>
                        <li><a href="about">Giới thiệu</a></li>
                        <li><a href="home?id_brand=1">Thương hiệu</a></li>
                        <li><a href="home?id_category=1">Nước hoa</a></li>
                        <li><a href="knowledge" class="active">Kiến thức</a></li>
                        <li><a href="blog">Blog</a></li>
                        <li><a href="contact">Liên hệ</a></li>
                    </ul>
                </div>
                <div class="side-box">
                    <div class="side-title">NỔI BẬT</div>
                    <div id="highlights"></div>
                </div>
            </div>

            <div class="col-lg-9">
                <div class="content-box">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="fw-bold m-0">Kiến thức nước hoa</h3>
                        <div class="d-flex gap-2">
                            <input id="knowledge-search" class="form-control form-control-sm" style="width: 200px;" placeholder="Tìm kiếm kiến thức...">
                            <select id="knowledge-tag" class="form-select form-select-sm" style="width: 150px;">
                                <option value="">Tất cả chủ đề</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="knowledge-list">
                        <div class="skeleton mb-4" style="height: 200px;"></div>
                        <div class="skeleton mb-4" style="height: 200px;"></div>
                    </div>
                    <div id="knowledge-pagination" class="d-flex justify-content-center gap-2 mt-4"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    let knowledgeQuery = '';
    let knowledgeTag = '';
    let knowledgePage = 1;

    async function loadKnowledge() {
        const url = '${pageContext.request.contextPath}/api/content?type=knowledge&page=' + knowledgePage + '&pageSize=4'
            + (knowledgeTag ? '&tag=' + encodeURIComponent(knowledgeTag) : '');
        const res = await fetch(url);
        const data = await res.json();

        const list = document.getElementById('knowledge-list');
        const allItems = data.items || [];
        
        function render(items) {
            list.innerHTML = items.map(function(item) {
                const fallback = 'https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-1.jpg';
                return '<article class="item-card">'
                    + '<a href="${pageContext.request.contextPath}/knowledge-detail?id=' + item.id + '" class="item-img-link">'
                    + '<img src="' + item.image + '" alt="' + item.title + '" onerror="this.onerror=null;this.src=\'' + fallback + '\'">'
                    + '</a>'
                    + '<div class="item-body">'
                    + '<div class="meta">' + item.date + ' · ' + (item.author || 'Huy Perfume') + '</div>'
                    + '<h4 class="item-title"><a href="${pageContext.request.contextPath}/knowledge-detail?id=' + item.id + '">' + item.title + '</a></h4>'
                    + '<p class="item-excerpt">' + item.excerpt + '</p>'
                    + '<a href="${pageContext.request.contextPath}/knowledge-detail?id=' + item.id + '" class="btn btn-sm btn-outline-dark rounded-pill px-3">Tìm hiểu thêm</a>'
                    + '</div></article>';
            }).join('');
            if (!items.length) {
                list.innerHTML = '<div class="alert alert-light border">Không tìm thấy bài viết nào phù hợp.</div>';
            }
        }
        
        render(allItems.filter(function (it) {
            if (!knowledgeQuery) return true;
            const q = knowledgeQuery.toLowerCase();
            return it.title.toLowerCase().includes(q) || it.excerpt.toLowerCase().includes(q);
        }));

        const highlights = document.getElementById('highlights');
        highlights.innerHTML = (data.highlights || []).map(function(item) {
            return '<a href="${pageContext.request.contextPath}/knowledge-detail?id=' + item.id + '" class="text-decoration-none highlight-item">'
                + '<img src="' + item.image + '" class="highlight-img">'
                + '<div><div class="highlight-title">' + item.title + '</div>'
                + '<div class="highlight-meta">' + item.date + '</div></div></a>';
        }).join('');

        const pagination = document.getElementById('knowledge-pagination');
        const totalPages = data.totalPages || 1;
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm ' + (i === (data.page || 1) ? 'btn-dark' : 'btn-outline-dark');
            btn.textContent = i;
            btn.style.borderRadius = '50%';
            btn.style.width = '35px';
            btn.style.height = '35px';
            btn.addEventListener('click', function () {
                knowledgePage = i;
                loadKnowledge();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(btn);
        }
    }
    loadKnowledge();
</script>

<c:import url="/inc/footer.jsp"/>
