<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<c:import url="/inc/header.jsp"/>
<c:import url="/inc/navbar.jsp"/>

<style>
    .detail-wrap { background: #f8f9fa; padding: 40px 0; }
    .detail-card { background: #fff; border: 1px solid #eee; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,.06); }
    .detail-cover { width: 100%; height: 360px; object-fit: cover; }
    .detail-body { padding: 24px; }
    .meta { font-size: .82rem; color: #6c757d; }
    .related-card { border: 1px solid #eee; border-radius: 10px; overflow: hidden; background: #fff; height: 100%; }
    .related-card img { width: 100%; height: 120px; object-fit: cover; }
    .share-box { background: #f8f9fa; border: 1px solid #eee; border-radius: 10px; padding: 14px; }
    .comment-box { background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 14px; }
</style>

<div class="detail-wrap">
    <div class="container">
        <a href="${pageContext.request.contextPath}/blog" class="btn btn-outline-secondary btn-sm mb-3">← Quay lại Blog</a>
        <div id="detail-content" class="detail-card p-4">Đang tải nội dung...</div>
        <div class="share-box mt-3 d-flex align-items-center justify-content-between gap-2">
            <div class="small text-muted">Chia sẻ bài viết</div>
            <div class="d-flex gap-2">
                <button id="copyLinkBtn" class="btn btn-outline-secondary btn-sm">Copy link</button>
                <a id="shareFacebook" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Facebook</a>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="fw-bold mb-3">Bài viết liên quan</h5>
            <div id="related-content" class="row g-3"></div>
        </div>
        <div class="mt-4">
            <h5 class="fw-bold mb-3">Bình luận</h5>
            <div class="comment-box mb-3">
                <input id="comment-name" class="form-control form-control-sm mb-2" placeholder="Tên của bạn">
                <textarea id="comment-message" class="form-control form-control-sm mb-2" rows="3" placeholder="Nhập bình luận..."></textarea>
                <button id="comment-submit" class="btn btn-dark btn-sm">Gửi bình luận</button>
            </div>
            <div id="comment-list"></div>
        </div>
    </div>
</div>

<script>
    (async function () {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) {
            document.getElementById('detail-content').innerHTML = '<div class="alert alert-warning m-0">Thiếu id bài viết.</div>';
            return;
        }
        var res = await fetch('${pageContext.request.contextPath}/api/content?type=blog&id=' + encodeURIComponent(id));
        var data = await res.json();
        var item = data.item;
        if (!item) {
            document.getElementById('detail-content').innerHTML = '<div class="alert alert-warning m-0">Không tìm thấy bài viết.</div>';
            return;
        }
        document.getElementById('detail-content').innerHTML =
            '<img class="detail-cover" src="' + item.image + '" alt="' + item.title + '">' +
            '<div class="detail-body">' +
            '<div class="meta mb-2">' + item.date + ' - ' + item.author + '</div>' +
            '<h2 class="fw-bold mb-3">' + item.title + '</h2>' +
            '<p class="text-muted mb-0" style="line-height:1.8;">' + item.content + '</p>' +
            '</div>';

        var related = (data.relatedSameType || []).concat(data.relatedCrossType || []);
        document.getElementById('related-content').innerHTML = related.map(function (r) {
            var target = r.id && r.id.indexOf('kn-') === 0 ? 'knowledge-detail' : 'blog-detail';
            return '<div class="col-md-6"><a class="text-decoration-none" href="${pageContext.request.contextPath}/' + target + '?id=' + r.id + '">'
                + '<div class="related-card"><img src="' + r.image + '" alt="' + r.title + '"><div class="p-2">'
                + '<div class="small text-muted">' + r.date + '</div><div class="fw-bold text-dark">' + r.title + '</div>'
                + '</div></div></a></div>';
        }).join('');

        var currentLink = window.location.href;
        document.getElementById('shareFacebook').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currentLink);
        document.getElementById('copyLinkBtn').addEventListener('click', function () {
            navigator.clipboard.writeText(currentLink).then(function () {
                document.getElementById('copyLinkBtn').innerText = 'Da copy';
                setTimeout(function () { document.getElementById('copyLinkBtn').innerText = 'Copy link'; }, 1200);
            });
        });

        var comments = data.comments || [];
        function renderComments() {
            document.getElementById('comment-list').innerHTML = comments.map(function (c) {
                return '<div class="comment-box mb-2"><div class="small fw-bold">' + c.name + ' <span class="text-muted fw-normal">· ' + c.time + '</span></div>'
                    + '<div class="text-muted">' + c.message + '</div></div>';
            }).join('');
        }
        renderComments();
        document.getElementById('comment-submit').addEventListener('click', function () {
            var name = document.getElementById('comment-name').value.trim() || 'Khach';
            var msg = document.getElementById('comment-message').value.trim();
            if (!msg) return;
            comments.unshift({ name: name, message: msg, time: 'Vua xong' });
            document.getElementById('comment-message').value = '';
            renderComments();
        });
    })().catch(function () {
        document.getElementById('detail-content').innerHTML = '<div class="alert alert-danger m-0">Không tải được dữ liệu chi tiết.</div>';
    });
</script>

<c:import url="/inc/footer.jsp"/>
