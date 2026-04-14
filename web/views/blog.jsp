<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .blog-wrap { background: #f8f9fa; padding: 40px 0; }
    .side-box, .content-box { background: #fff; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 18px rgba(0,0,0,0.05); }
    .side-box { padding: 18px; }
    .content-box { padding: 26px; }
    .post-row { display: grid; grid-template-columns: 280px 1fr; gap: 18px; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; margin-bottom: 18px; transition: .25s; }
    .post-row:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.08); }
    .post-row img { width: 100%; height: 100%; min-height: 190px; object-fit: cover; }
    .post-body { padding: 16px; }
    .meta { font-size: 0.78rem; color: #6c757d; }
    .search-bar { max-width: 360px; }
    .toolbar { gap: 10px; }
    .skeleton { height: 190px; border-radius: 10px; background: linear-gradient(90deg,#f0f0f0 25%,#f7f7f7 37%,#f0f0f0 63%); background-size: 400% 100%; animation: shine 1.4s ease infinite; }
    @keyframes shine { 0% {background-position: 100% 0;} 100% {background-position: 0 0;} }
    @media (max-width: 992px) {
        .post-row { grid-template-columns: 1fr; }
    }
</style>

<div class="blog-wrap">
    <div class="container">
        <div class="row">
            <div class="col-lg-3">
                <div class="side-box mb-3">
                    <h6 class="fw-bold text-uppercase mb-3">Điều hướng</h6>
                    <ul class="list-unstyled small m-0">
                        <li class="mb-2"><a href="blog" class="text-success fw-bold text-decoration-none">Blog Huy Perfume</a></li>
                        <li class="mb-2"><a href="knowledge" class="text-dark text-decoration-none">Kiến thức nước hoa</a></li>
                        <li><a href="home" class="text-dark text-decoration-none">Mua sắm ngay</a></li>
                    </ul>
                </div>
                <div class="side-box">
                    <h6 class="fw-bold text-uppercase mb-3">Đề xuất từ Kiến thức</h6>
                    <div id="highlights"></div>
                </div>
            </div>

            <div class="col-lg-9">
                <div class="content-box">
                    <h3 class="fw-bold mb-3">Blog Huy Perfume (API)</h3>
                    <p class="text-muted">Nội dung được load động từ endpoint <code>/api/content?type=blog</code>.</p>
                    <div class="d-flex flex-wrap align-items-center toolbar mb-3">
                        <input id="blog-search" class="form-control form-control-sm search-bar" placeholder="Tìm bài blog...">
                        <select id="blog-tag" class="form-select form-select-sm" style="max-width:220px;">
                            <option value="">Tat ca chu de</option>
                        </select>
                    </div>
                    <div id="blog-list">
                        <div class="skeleton mb-3"></div>
                        <div class="skeleton"></div>
                    </div>
                    <div id="blog-pagination" class="d-flex gap-2 mt-3"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    let blogQuery = '';
    let blogTag = '';
    let blogPage = 1;

    async function loadBlog() {
        const url = '${pageContext.request.contextPath}/api/content?type=blog&page=' + blogPage + '&pageSize=2'
            + (blogTag ? '&tag=' + encodeURIComponent(blogTag) : '');
        const res = await fetch(url);
        const data = await res.json();

        const list = document.getElementById('blog-list');
        const allItems = data.items || [];
        function render(items) {
            list.innerHTML = items.map(function(item) {
                return '<article class="post-row">'
                    + '<img src="' + item.image + '" alt="' + item.title + '">'
                    + '<div class="post-body">'
                    + '<div class="meta mb-2">' + item.date + ' - ' + item.author + '</div>'
                    + '<h5 class="fw-bold"><a class="text-dark text-decoration-none" href="${pageContext.request.contextPath}/blog-detail?id=' + item.id + '">' + item.title + '</a></h5>'
                    + '<p class="text-muted mb-0">' + item.excerpt + '</p>'
                    + '</div></article>';
            }).join('');
            if (!items.length) {
                list.innerHTML = '<div class="alert alert-light border">Không tìm thấy bài phù hợp.</div>';
            }
        }
        render(allItems.filter(function (it) {
            if (!blogQuery) return true;
            const q = blogQuery.toLowerCase();
            return it.title.toLowerCase().includes(q) || it.excerpt.toLowerCase().includes(q);
        }));
        const searchInput = document.getElementById('blog-search');
        if (!searchInput.dataset.bound) {
            searchInput.addEventListener('input', function () {
                blogQuery = this.value.trim();
                render((data.items || []).filter(function (it) {
                    if (!blogQuery) return true;
                    const q = blogQuery.toLowerCase();
                    return it.title.toLowerCase().includes(q) || it.excerpt.toLowerCase().includes(q);
                }));
            });
            searchInput.dataset.bound = '1';
        }

        const tagSelect = document.getElementById('blog-tag');
        if (!tagSelect.dataset.bound) {
            tagSelect.addEventListener('change', function () {
                blogTag = this.value;
                blogPage = 1;
                loadBlog();
            });
            tagSelect.dataset.bound = '1';
        }
        if (!tagSelect.dataset.tagsLoaded) {
            (data.availableTags || []).forEach(function (tag) {
                const opt = document.createElement('option');
                opt.value = tag;
                opt.textContent = tag;
                tagSelect.appendChild(opt);
            });
            tagSelect.dataset.tagsLoaded = '1';
        }
        tagSelect.value = data.tag || '';

        const highlights = document.getElementById('highlights');
        highlights.innerHTML = (data.highlights || []).map(function(item) {
            return '<div class="d-flex gap-2 mb-3">'
                + '<img src="' + item.image + '" width="56" height="56" class="rounded object-fit-cover">'
                + '<div><div class="small fw-bold">' + item.title + '</div>'
                + '<div class="meta">' + item.date + '</div></div></div>';
        }).join('');

        const pagination = document.getElementById('blog-pagination');
        const totalPages = data.totalPages || 1;
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm ' + (i === (data.page || 1) ? 'btn-dark' : 'btn-outline-dark');
            btn.textContent = i;
            btn.addEventListener('click', function () {
                blogPage = i;
                loadBlog();
            });
            pagination.appendChild(btn);
        }
    }
    loadBlog().catch(() => {
        document.getElementById('blog-list').innerHTML = '<div class="alert alert-warning">Không tải được dữ liệu blog.</div>';
    });
</script>

<c:import url="/inc/footer.jsp"/>
