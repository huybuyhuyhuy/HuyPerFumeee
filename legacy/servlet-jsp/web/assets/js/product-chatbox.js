(function () {
    const ctx = window.APP_CONTEXT_PATH || "";
    const rootId = "product-chatbox-root";

    function init() {
        if (document.getElementById(rootId)) return;
        if (!document.body) { setTimeout(init, 100); return; }

        // ── Root HTML ──
        const root = document.createElement("div");
        root.id = rootId;
        root.innerHTML = `
            <div id="cb-fab-group" class="cb-collapsed">
                <div id="cb-fab-sub-zalo" class="cb-fab-sub" title="Chat Zalo">
                    <a href="https://zalo.me/0906530794" target="_blank" class="cb-sub-btn cb-btn-zalo" aria-label="Zalo">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.5 2C6.8 2 2.1 5.8 2.1 10.5c0 2.7 1.5 5.2 3.8 6.8l-1 3.7 4-2.1c1 .3 2.1.5 3.2.5 5.7 0 10.4-3.8 10.4-8.9S18.2 2 12.5 2zm0 15.5c-1 0-2-.2-2.9-.5l-.3-.2-2.4 1.3.7-2.2-.2-.3c-.9-1.4-1.4-2.9-1.4-4.5 0-4.3 4-7.8 8.9-7.8s8.9 3.5 8.9 7.8-4 7.8-8.9 7.8z"/><path d="M10.5 9h.8v4h-.8zm3 0h.8l-1.3 4h-.8zm-1.8.5c-.3 0-.5.2-.5.5v2.5c0 .3.2.5.5.5s.5-.2.5-.5V11c0-.3-.2-.5-.5-.5z"/></svg>
                    </a>
                    <span class="cb-sub-label">Zalo</span>
                </div>
                <div id="cb-fab-sub-phone" class="cb-fab-sub" title="Gọi điện">
                    <a href="tel:0906530794" class="cb-sub-btn cb-btn-phone" aria-label="Phone">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                    <span class="cb-sub-label">Gọi</span>
                </div>
                <div id="cb-fab-sub-ai" class="cb-fab-sub" title="Tư vấn AI">
                    <button id="chatbox-toggle-ai" class="cb-sub-btn cb-btn-ai" aria-label="Chat AI">
                        <i class="fas fa-robot"></i>
                    </button>
                    <span class="cb-sub-label">AI</span>
                </div>
                <button id="cb-fab-main" class="cb-main-btn" title="Hỗ trợ" aria-label="Hỗ trợ">
                    <i class="fas fa-headset"></i>
                </button>
            </div>
            <div id="chatbox-panel" hidden>
                <div id="chatbox-header">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div id="chatbox-avatar"><i class="fas fa-store"></i></div>
                        <div>
                            <div style="font-weight:700;font-size:0.88rem;">Huy Perfume AI</div>
                            <div style="font-size:0.7rem;opacity:0.85;">
                                <span style="color:#4ade80;">&#9679;</span> Đang hoạt động
                            </div>
                        </div>
                    </div>
                    <button id="chatbox-close" type="button" title="Đóng" aria-label="Đóng chatbox">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="chatbox-messages">
                    <div class="chat-msg bot">
                        Xin chào! 👋 Mình là trợ lý tư vấn của <b>Huy Perfume</b>.<br>
                        Bạn có thể hỏi:<br>
                        &bull; <i>Giá Dior Sauvage?</i><br>
                        &bull; <i>Batch code Chanel No.5?</i><br>
                        &bull; <i>Thông số Gucci Bloom?</i><br>
                        &bull; <i>Bảng giá sản phẩm</i>
                    </div>
                </div>
                <div id="chatbox-suggestions"></div>
                <form id="chatbox-form" autocomplete="off">
                    <input id="chatbox-input" type="text" placeholder="Vd: Batch code Dior Sauvage?" />
                    <button type="submit" title="Gửi"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        `;
        document.body.appendChild(root);

        // ── Styles ──
        const style = document.createElement("style");
        style.textContent = `
            #product-chatbox-root {
                position: fixed;
                right: 24px;
                bottom: 100px;
                z-index: 2147483646;
                display: flex;
                flex-direction: row-reverse;
                align-items: flex-end;
                gap: 12px;
                pointer-events: none;
            }
            #product-chatbox-root > * { pointer-events: auto; }

            /* ── FAB Group ── */
            #cb-fab-group {
                display: flex;
                flex-direction: column-reverse;
                align-items: center;
                gap: 10px;
            }

            /* ── Sub buttons (hidden by default, show when expanded) ── */
            .cb-fab-sub {
                display: flex;
                flex-direction: row-reverse;
                align-items: center;
                gap: 8px;
                opacity: 0;
                transform: translateY(10px) scale(0.6);
                pointer-events: none;
                transition: all .3s cubic-bezier(.4,0,.2,1);
            }
            #cb-fab-group.cb-expanded .cb-fab-sub {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }
            #cb-fab-sub-phone { transition-delay: 0.05s; }
            #cb-fab-sub-ai    { transition-delay: 0.1s; }

            .cb-sub-label {
                background: rgba(0,0,0,.7);
                color: #fff;
                font-size: 0.65rem;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 10px;
                white-space: nowrap;
                letter-spacing: 0.5px;
            }
            .cb-sub-btn {
                width: 44px; height: 44px;
                border-radius: 50%;
                color: #fff; border: none;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.1rem; cursor: pointer;
                text-decoration: none;
                box-shadow: 0 4px 14px rgba(0,0,0,.25);
                transition: transform .2s, box-shadow .2s;
            }
            .cb-sub-btn:hover { transform: scale(1.1); }
            .cb-btn-zalo  { background: linear-gradient(135deg, #0180c7, #0068a8); }
            .cb-btn-phone { background: linear-gradient(135deg, #e74c3c, #c0392b); }
            .cb-btn-ai    { background: linear-gradient(135deg, #003D2E, #006B50); }

            /* ── Main FAB button ── */
            .cb-main-btn {
                width: 54px; height: 54px;
                border-radius: 50%;
                background: linear-gradient(135deg, #c9a96e 0%, #b8943f 100%);
                color: #0d0d0d; border: none;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.35rem; cursor: pointer;
                box-shadow: 0 6px 24px rgba(201,169,110,.45);
                transition: all .3s cubic-bezier(.4,0,.2,1);
                position: relative; z-index: 2;
            }
            .cb-main-btn:hover { transform: scale(1.08); }
            .cb-main-btn i { transition: transform .3s; }
            #cb-fab-group.cb-expanded .cb-main-btn i { transform: rotate(135deg); }

            /* ── Chat panel ── */
            #chatbox-panel {
                width: 340px; max-height: 500px;
                background: #fff; border-radius: 16px;
                box-shadow: 0 16px 55px rgba(0,0,0,.22);
                display: flex; flex-direction: column; overflow: hidden;
                border: 1px solid rgba(0,61,46,.12);
                animation: cbSlideUp .3s ease;
            }
            #chatbox-panel[hidden] { display: none !important; }
            @keyframes cbSlideUp {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            #chatbox-header { background: linear-gradient(135deg, #003D2E, #006B50); color: #fff; padding: 13px 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
            #chatbox-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; }
            #chatbox-close { background: none; border: none; color: #fff; cursor: pointer; opacity: 0.7; transition: .2s; font-size: 1.1rem; }
            #chatbox-close:hover { opacity: 1; transform: scale(1.1); }
            #chatbox-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
            .chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 0.88rem; line-height: 1.5; word-break: break-word; }
            .chat-msg.bot { background: #fff; color: #1f2937; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,.04); border: 1px solid #f0f0f0; }
            .chat-msg.user { background: #003D2E; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(0,61,46,.2); }
            #chatbox-suggestions { padding: 10px 16px; background: #fff; border-top: 1px solid #f0f0f0; display: flex; flex-wrap: wrap; gap: 8px; flex-shrink: 0; }
            .chat-sugg { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; transition: .2s; color: #003D2E; font-weight: 600; }
            .chat-sugg:hover { background: #003D2E; color: #fff; border-color: #003D2E; }
            #chatbox-form { padding: 12px 16px; background: #fff; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
            #chatbox-input { flex: 1; border: 1px solid #e5e7eb; border-radius: 20px; padding: 8px 16px; font-size: 0.88rem; outline: none; transition: .2s; }
            #chatbox-input:focus { border-color: #003D2E; box-shadow: 0 0 0 3px rgba(0,61,46,.1); }
            #chatbox-form button { background: #003D2E; color: #fff; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: .2s; flex-shrink: 0; }
            #chatbox-form button:hover { transform: scale(1.05); background: #006B50; }
            #chatbox-form button:disabled { background: #9ca3af; cursor: not-allowed; }
            .chat-loader { display: flex; gap: 4px; padding: 10px 14px; background: #fff; border: 1px solid #f0f0f0; border-radius: 14px; align-self: flex-start; width: fit-content; }
            .chat-loader span { width: 6px; height: 6px; background: #003D2E; border-radius: 50%; animation: cbBounce 1.4s infinite ease-in-out; opacity: 0.6; }
            .chat-loader span:nth-child(2) { animation-delay: 0.2s; }
            .chat-loader span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes cbBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

            @media (max-width: 480px) {
                #product-chatbox-root { right: 10px; bottom: 80px; }
                #chatbox-panel { width: calc(100vw - 24px); max-height: 65vh; }
            }
        `;
        document.head.appendChild(style);

        // ── Elements ──
        const fabGroup    = document.getElementById("cb-fab-group");
        const mainBtn     = document.getElementById("cb-fab-main");
        const aiToggle    = document.getElementById("chatbox-toggle-ai");
        const panel       = document.getElementById("chatbox-panel");
        const closeBtn    = document.getElementById("chatbox-close");
        const form        = document.getElementById("chatbox-form");
        const input       = document.getElementById("chatbox-input");
        const msgs        = document.getElementById("chatbox-messages");
        const suggs       = document.getElementById("chatbox-suggestions");
        const submitBtn   = form.querySelector("button");
        let isSending     = false;

        // ── Expand / Collapse FAB ──
        mainBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            fabGroup.classList.toggle("cb-expanded");
        });

        // Click outside to collapse
        document.addEventListener("click", (e) => {
            if (!fabGroup.contains(e.target)) {
                fabGroup.classList.remove("cb-expanded");
            }
        });

        // ── AI Chatbox toggle ──
        aiToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            panel.hidden = !panel.hidden;
            if (!panel.hidden) { input.focus(); msgs.scrollTop = msgs.scrollHeight; }
        });
        closeBtn.addEventListener("click", () => { panel.hidden = true; });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; }
        });

        // ── Chat logic ──
        function appendMsg(role, text) {
            const div = document.createElement("div");
            div.className = `chat-msg ${role}`;
            if (role === "bot") { div.innerHTML = text; }
            else { div.textContent = text; }
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
            return div;
        }
        function appendLoader() {
            const div = document.createElement("div");
            div.className = "chat-loader";
            div.innerHTML = "<span></span><span></span><span></span>";
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
            return div;
        }
        function renderSuggs(list) {
            suggs.innerHTML = "";
            list.slice(0, 5).forEach(s => {
                const b = document.createElement("div");
                b.className = "chat-sugg";
                b.textContent = s;
                b.onclick = () => {
                    if (isSending) return;
                    input.value = s;
                    form.dispatchEvent(new Event("submit"));
                };
                suggs.appendChild(b);
            });
        }
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text || isSending) return;
            isSending = true; submitBtn.disabled = true;
            appendMsg("user", text);
            input.value = "";
            const loader = appendLoader();
            try {
                const body = new URLSearchParams({ q: text });
                const res = await fetch(ctx + "/api/product-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
                    body: body.toString()
                });
                const data = await res.json();
                loader.remove();
                appendMsg("bot", data.answer || "Mình chưa có câu trả lời.");
                renderSuggs(data.suggestions || []);
            } catch {
                loader.remove();
                appendMsg("bot", "⚠ Hệ thống tạm thời lỗi, bạn thử lại sau nhé.");
            } finally {
                isSending = false; submitBtn.disabled = false;
            }
        });
        fetch(ctx + "/api/product-chat").then(r => r.json()).then(d => renderSuggs(d.suggestions || [])).catch(() => {});
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }
})();
