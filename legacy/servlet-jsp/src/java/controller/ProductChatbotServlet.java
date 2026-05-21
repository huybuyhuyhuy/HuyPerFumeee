package controller;

import com.google.gson.Gson;
import data.dao.Database;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;
import model.Products;

@WebServlet(name = "ProductChatbotServlet", urlPatterns = {"/api/product-chat"})
public class ProductChatbotServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    // ── Cache ──
    private static volatile List<Products> cachedProducts;
    private static volatile long cacheLoadedAt;

    private static final String ICO_MONEY  = "💰";
    private static final String ICO_TAG    = "🏷";
    private static final String ICO_BOX    = "📦";
    private static final String ICO_CHECK  = "✅";
    private static final String ICO_CROSS  = "❌";
    private static final String ICO_WARN   = "⚠";
    private static final String ICO_FLOWER = "🌸";
    private static final String ICO_LABEL  = "🔖";
    private static final String ICO_CLIP   = "📋";
    private static final String ICO_SAD    = "😔";
    private static final String ICO_INFO   = "ℹ";
    private static final String ICO_BAN    = "🚫";
    private static final String ICO_FOLDER = "📂";
    private static final String ICO_CHAT   = "💬";
    private static final String ICO_THINK  = "🤔";
    private static final String ICO_WAVE   = "👋";
    private static final String ICO_SEARCH = "🔍";
    private static final String ICO_STAR   = "⭐";
    private static final String ARROW      = "→";
    private static final String DASH       = "—";
    private static final String BULLET     = "•";

    /** Reload cache from DB (max every 5 minutes) */
    private static List<Products> getProducts() {
        long now = System.currentTimeMillis();
        if (cachedProducts == null || now - cacheLoadedAt > 300_000L) {
            cachedProducts = Database.getProductsDao().findAll();
            cacheLoadedAt = now;
        }
        return cachedProducts;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        List<Products> all = getProducts();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        result.put("totalProducts", all.size());
        result.put("suggestions", buildGlobalSuggestions(all));
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(GSON.toJson(result));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        String q = req.getParameter("q");
        List<Products> all = getProducts();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        ChatResult chat = buildAnswer(q, all);
        result.put("answer", chat.answer);
        result.put("suggestions", chat.suggestions);
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write(GSON.toJson(result));
    }

    // ════════════════════════════════════════════════════════════════
    //  MAIN ANSWER BUILDER
    // ════════════════════════════════════════════════════════════════
    private ChatResult buildAnswer(String question, List<Products> all) {
        if (question == null || question.isBlank()) {
            return welcome(all);
        }
        String q = normalize(question);

        // ── Catalog queries ──
        // "liệt kê / danh sách / tất cả sản phẩm"
        if (containsAny(q, "liet ke", "danh sach", "tat ca san pham", "toan bo san pham", "tat ca sp", "list all", "catalog")) {
            return listAllProducts(q, all);
        }
        // "nước hoa nam / nữ / unisex"
        if (containsAny(q, "nuoc hoa nam", "perfume nam", "cho nam")) {
            return listByCategory(q, all, 1, "Nước hoa Nam");
        }
        if (containsAny(q, "nuoc hoa nu", "perfume nu", "cho nu")) {
            return listByCategory(q, all, 2, "Nước hoa Nữ");
        }
        if (containsAny(q, "unisex", "nuoc hoa unisex")) {
            return listByCategory(q, all, 3, "Nước hoa Unisex");
        }
        // "tìm / tìm kiếm / có ... không"
        if (q.startsWith("tim ") || q.startsWith("tim kiem ") || q.startsWith("search ") || q.startsWith("co ")) {
            return searchProducts(q, all);
        }

        // ── Scenario queries ──
        ChatResult scenario = handleScenario(q, all);
        if (scenario != null) return scenario;

        // ── Single product match ──
        Products best = null;
        int bestScore = 0;
        for (Products p : all) {
            int s = score(q, p);
            if (s > bestScore) { bestScore = s; best = p; }
        }
        if (best == null || bestScore < 2) {
            return new ChatResult(
                ICO_THINK + " Mình chưa nhận ra sản phẩm bạn hỏi.\n"
                + "Thử: tên sản phẩm + (giá, tồn kho, mùi hương...)\n"
                + "Hoặc gõ: " + BULLET + " liệt kê tất cả sản phẩm\n"
                + BULLET + " nước hoa nam / nữ / unisex\n"
                + BULLET + " tìm [từ khóa]",
                buildGlobalSuggestions(all)
            );
        }

        double actualPrice = best.getDiscount_price() > 0 ? best.getDiscount_price() : best.getPrice();
        return productQA(q, best, actualPrice);
    }

    // ════════════════════════════════════════════════════════════════
    //  CATALOG QUERIES
    // ════════════════════════════════════════════════════════════════
    private ChatResult listAllProducts(String q, List<Products> all) {
        boolean showScent = containsAny(q, "mui", "huong", "scent", "note");

        // Group by category
        Map<Integer, List<Products>> grouped = new LinkedHashMap<>();
        grouped.put(1, new ArrayList<>());
        grouped.put(2, new ArrayList<>());
        grouped.put(3, new ArrayList<>());
        for (Products p : all) {
            List<Products> list = grouped.get(p.getId_category());
            if (list != null) list.add(p);
        }

        String[] catNames = {"", "Nước hoa Nam", "Nước hoa Nữ", "Unisex"};
        StringBuilder sb = new StringBuilder(ICO_BOX + " Danh sách " + all.size() + " sản phẩm:\n");

        for (int catId : new int[]{1, 2, 3}) {
            List<Products> catProducts = grouped.get(catId);
            if (catProducts.isEmpty()) continue;
            sb.append("\n").append(ICO_FOLDER).append(" ").append(catNames[catId]).append(" (").append(catProducts.size()).append("):\n");
            int count = 0;
            for (Products p : catProducts) {
                if (count++ >= 15) { sb.append("  ... còn ").append(catProducts.size() - 15).append(" sản phẩm\n"); break; }
                double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                String sale = p.getDiscount_price() > 0 ? " " + ICO_TAG : "";
                sb.append(BULLET).append(" ").append(p.getName())
                  .append(" ").append(DASH).append(" ").append(formatMoney(price)).append("đ")
                  .append(sale).append(" (còn ").append(p.getStock()).append(")\n");
                if (showScent && p.getScent_notes() != null && !p.getScent_notes().isEmpty()) {
                    String[] notes = p.getScent_notes().split("\\|");
                    if (notes.length > 0) sb.append("   Hương: ").append(notes[0]).append("\n");
                }
            }
        }

        long saleCount = all.stream().filter(p -> p.getDiscount_price() > 0 && p.getDiscount_price() < p.getPrice()).count();
        long outOfStock = all.stream().filter(p -> p.getStock() <= 0).count();
        sb.append("\n").append(ICO_INFO).append(" Tổng: ").append(all.size()).append(" SP | Sale: ").append(saleCount).append(" | Hết hàng: ").append(outOfStock);

        return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
    }

    private ChatResult listByCategory(String q, List<Products> all, int catId, String catName) {
        List<Products> matched = all.stream()
            .filter(p -> p.getId_category() == catId && p.isStatus())
            .sorted(Comparator.comparingInt(Products::getStock).reversed())
            .collect(Collectors.toList());

        if (matched.isEmpty()) {
            return new ChatResult(ICO_SAD + " Không có sản phẩm nào trong danh mục " + catName + ".", buildGlobalSuggestions(all));
        }

        StringBuilder sb = new StringBuilder(ICO_FOLDER + " " + catName + " (" + matched.size() + " sản phẩm):\n");
        for (Products p : matched) {
            double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
            String sale = p.getDiscount_price() > 0 ? " " + ICO_TAG + " sale" : "";
            sb.append(BULLET).append(" ").append(p.getName())
              .append(" ").append(DASH).append(" ").append(formatMoney(price)).append("đ")
              .append(sale).append(" | còn ").append(p.getStock()).append("\n");
        }
        if (!matched.isEmpty()) {
            sb.append("\nGợi ý: Hỏi chi tiết từng sản phẩm — vd: Giá " + matched.get(0).getName() + "?");
        }
        return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
    }

    private ChatResult searchProducts(String q, List<Products> all) {
        String keyword = q.replaceFirst("^(tim|tim kiem|search|co)\\s+", "").trim();
        if (keyword.isEmpty()) return new ChatResult(ICO_SEARCH + " Bạn muốn tìm gì? Nhập từ khóa sau \"tìm\".", buildGlobalSuggestions(all));

        String kw = normalize(keyword);
        List<Products> found = new ArrayList<>();
        for (Products p : all) {
            String name = normalize(p.getName());
            if (name.contains(kw) || kw.split("\\s+").length >= 2 && score(kw, p) >= 2) {
                found.add(p);
            }
        }

        if (found.isEmpty()) {
            return new ChatResult(ICO_SAD + " Không tìm thấy sản phẩm nào với từ khóa \"" + keyword + "\".\n"
                + "Thử: liệt kê tất cả sản phẩm để xem toàn bộ catalog.", buildGlobalSuggestions(all));
        }

        StringBuilder sb = new StringBuilder(ICO_SEARCH + " Tìm thấy " + found.size() + " sản phẩm cho \"" + keyword + "\":\n");
        for (Products p : found) {
            double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
            String sale = p.getDiscount_price() > 0 ? " " + ICO_TAG : "";
            sb.append(BULLET).append(" ").append(p.getName())
              .append(" ").append(DASH).append(" ").append(formatMoney(price)).append("đ")
              .append(sale).append(" (còn ").append(p.getStock()).append(")\n");
        }
        return new ChatResult(sb.toString().trim(), buildProductSuggestions(found.get(0)));
    }

    // ════════════════════════════════════════════════════════════════
    //  SINGLE PRODUCT QA
    // ════════════════════════════════════════════════════════════════
    private ChatResult productQA(String q, Products best, double actualPrice) {
        if (containsAny(q, "gia", "bao nhieu", "price", "bao tien", "cost")) {
            if (best.getDiscount_price() > 0) {
                long pct = Math.round((1 - best.getDiscount_price() / best.getPrice()) * 100);
                return new ChatResult(
                    ICO_MONEY + " Giá " + best.getName() + ":\n"
                    + BULLET + " Giá sale: " + formatMoney(best.getDiscount_price()) + "đ (giảm " + pct + "%)\n"
                    + BULLET + " Giá gốc: " + formatMoney(best.getPrice()) + "đ",
                    buildProductSuggestions(best));
            }
            return new ChatResult(ICO_MONEY + " Giá " + best.getName() + ": " + formatMoney(actualPrice) + "đ", buildProductSuggestions(best));
        }

        if (containsAny(q, "giam", "khuyen mai", "sale", "discount", "uu dai")) {
            if (best.getDiscount_price() > 0 && best.getPrice() > 0) {
                long pct = Math.round((1 - best.getDiscount_price() / best.getPrice()) * 100);
                return new ChatResult(
                    ICO_TAG + " " + best.getName() + " đang giảm " + pct + "%!\n"
                    + BULLET + " Giá gốc: " + formatMoney(best.getPrice()) + "đ\n"
                    + BULLET + " Giá sau giảm: " + formatMoney(best.getDiscount_price()) + "đ",
                    buildProductSuggestions(best));
            }
            return new ChatResult(ICO_INFO + " " + best.getName() + " hiện chưa có khuyến mãi.", buildProductSuggestions(best));
        }

        if (containsAny(q, "con hang", "ton kho", "stock", "so luong", "con bao nhieu")) {
            int stock = best.getStock();
            String icon = stock > 20 ? ICO_BOX + " Còn nhiều" : (stock > 0 ? ICO_WARN + " Sắp hết" : ICO_CROSS + " Hết hàng");
            return new ChatResult(icon + " " + DASH + " " + best.getName() + " còn " + stock + " chai trong kho.", buildProductSuggestions(best));
        }

        if (containsAny(q, "mui", "huong", "scent", "note", "tang", "huong dau")) {
            String raw = best.getScent_notes();
            if (raw == null || raw.isBlank()) {
                return new ChatResult(ICO_FLOWER + " " + best.getName() + " chưa có thông tin nốt hương chi tiết.", buildProductSuggestions(best));
            }
            String[] parts = raw.split("\\|");
            StringBuilder sb = new StringBuilder(ICO_FLOWER + " Cấu trúc hương " + best.getName() + ":\n");
            String[] labels = {"▸ Hương đầu", "▸ Hương giữa", "▸ Hương cuối"};
            for (int i = 0; i < parts.length && i < labels.length; i++) {
                sb.append(labels[i]).append(": ").append(parts[i].trim()).append("\n");
            }
            return new ChatResult(sb.toString().trim(), buildProductSuggestions(best));
        }

        if (containsAny(q, "sku", "ma san pham", "ma hang", "ma sp")) {
            return new ChatResult(ICO_LABEL + " SKU của " + best.getName() + ": " + safeValue(best.getSku()), buildProductSuggestions(best));
        }

        if (containsAny(q, "batch", "ma lo", "lo hang", "ma batch")) {
            return new ChatResult(ICO_CLIP + " Batch code của " + best.getName() + ": " + safeValue(best.getBatch_code()), buildProductSuggestions(best));
        }

        if (containsAny(q, "decant", "chiet", "chiet le")) {
            String ans = best.isIs_decant()
                ? ICO_CHECK + " " + best.getName() + " có hỗ trợ dạng chiết (decant)."
                : ICO_CROSS + " " + best.getName() + " hiện không có dạng chiết.";
            return new ChatResult(ans, buildProductSuggestions(best));
        }

        if (containsAny(q, "dang ban", "trang thai", "status", "con ban", "ngung ban")) {
            String ans = best.isStatus()
                ? ICO_CHECK + " " + best.getName() + " đang mở bán."
                : ICO_BAN + " " + best.getName() + " hiện tạm ngưng bán.";
            return new ChatResult(ans, buildProductSuggestions(best));
        }

        if (containsAny(q, "thong so", "chi tiet", "spec", "full", "toan bo")) {
            return new ChatResult(buildFullSpec(best, actualPrice), buildProductSuggestions(best));
        }

        if (containsAny(q, "hinh", "anh", "image")) {
            String img = safeValue(best.getImage());
            return new ChatResult("🖼 Ảnh " + best.getName() + ": " + img + "\nXem tại: /api/image?name=" + img, buildProductSuggestions(best));
        }

        return new ChatResult(buildSummary(best, actualPrice), buildProductSuggestions(best));
    }

    // ════════════════════════════════════════════════════════════════
    //  SCENARIO QUERIES
    // ════════════════════════════════════════════════════════════════
    private ChatResult handleScenario(String q, List<Products> all) {
        // Budget
        if (containsAny(q, "duoi", "ngan sach", "budget", "toi da", "re nhat", "binh dan")) {
            long budget = parseBudget(q);
            if (budget <= 0) budget = 2_000_000L;
            List<Products> matched = new ArrayList<>();
            for (Products p : all) {
                double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                if (price <= budget && p.isStatus() && p.getStock() > 0) matched.add(p);
            }
            matched.sort(Comparator.comparingDouble(p -> (p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice())));
            if (matched.isEmpty()) {
                return new ChatResult(ICO_SAD + " Chưa có sản phẩm phù hợp ngân sách " + formatMoney(budget) + "đ.", buildGlobalSuggestions(all));
            }
            StringBuilder sb = new StringBuilder(ICO_MONEY + " Gợi ý trong ngân sách " + formatMoney(budget) + "đ:\n");
            int limit = Math.min(5, matched.size());
            for (int i = 0; i < limit; i++) {
                Products p = matched.get(i);
                double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(DASH).append(" ").append(formatMoney(price)).append("đ (còn ").append(p.getStock()).append(")\n");
            }
            return new ChatResult(sb.toString().trim(), buildScenarioSuggestions(matched.get(0)));
        }

        // Sale list
        if (containsAny(q, "giam gia", "khuyen mai", "dang giam", "sale", "san pham sale")) {
            List<Products> sale = all.stream()
                .filter(p -> p.getDiscount_price() > 0 && p.getDiscount_price() < p.getPrice() && p.isStatus())
                .sorted((a, b) -> Double.compare(b.getPrice() - b.getDiscount_price(), a.getPrice() - a.getDiscount_price()))
                .collect(Collectors.toList());
            if (sale.isEmpty()) {
                return new ChatResult(ICO_INFO + " Hiện chưa có sản phẩm giảm giá.", buildGlobalSuggestions(all));
            }
            StringBuilder sb = new StringBuilder(ICO_TAG + " Sản phẩm đang giảm giá:\n");
            int limit = Math.min(5, sale.size());
            for (int i = 0; i < limit; i++) {
                Products p = sale.get(i);
                long pct = p.getPrice() > 0 ? Math.round((1 - p.getDiscount_price() / p.getPrice()) * 100) : 0;
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(DASH).append(" giảm ").append(pct).append("%, còn ").append(formatMoney(p.getDiscount_price())).append("đ\n");
            }
            return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
        }

        // Most stock
        if (containsAny(q, "con hang nhieu", "san co nhieu", "goi y nhanh", "nhieu hang nhat")) {
            List<Products> avail = all.stream()
                .filter(p -> p.isStatus() && p.getStock() > 0)
                .sorted((a, b) -> Integer.compare(b.getStock(), a.getStock()))
                .collect(Collectors.toList());
            if (avail.isEmpty()) return new ChatResult(ICO_SAD + " Hiện không có sản phẩm nào còn hàng.", buildGlobalSuggestions(all));
            StringBuilder sb = new StringBuilder(ICO_BOX + " Sản phẩm còn hàng nhiều nhất:\n");
            for (int i = 0; i < Math.min(5, avail.size()); i++) {
                Products p = avail.get(i);
                double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(DASH).append(" ").append(p.getStock()).append(" chai, ").append(formatMoney(price)).append("đ\n");
            }
            return new ChatResult(sb.toString().trim(), buildScenarioSuggestions(avail.get(0)));
        }

        // Batch code all
        if (containsAny(q, "liet ke batch", "tat ca batch", "all batch")) {
            StringBuilder sb = new StringBuilder(ICO_CLIP + " Batch code tất cả sản phẩm:\n");
            for (Products p : all) {
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(ARROW).append(" ").append(safeValue(p.getBatch_code())).append("\n");
            }
            return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
        }

        // SKU all
        if (containsAny(q, "liet ke sku", "tat ca sku", "all sku")) {
            StringBuilder sb = new StringBuilder(ICO_LABEL + " SKU tất cả sản phẩm:\n");
            for (Products p : all) {
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(ARROW).append(" ").append(safeValue(p.getSku())).append("\n");
            }
            return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
        }

        // Price list
        if (containsAny(q, "bang gia", "tat ca gia", "liet ke gia")) {
            StringBuilder sb = new StringBuilder(ICO_MONEY + " Bảng giá sản phẩm:\n");
            for (Products p : all) {
                double price = p.getDiscount_price() > 0 ? p.getDiscount_price() : p.getPrice();
                String sale = p.getDiscount_price() > 0 ? " " + ICO_TAG + " sale" : "";
                sb.append(BULLET).append(" ").append(p.getName()).append(" ").append(ARROW).append(" ").append(formatMoney(price)).append("đ").append(sale).append("\n");
            }
            return new ChatResult(sb.toString().trim(), buildGlobalSuggestions(all));
        }

        return null;
    }

    // ════════════════════════════════════════════════════════════════
    //  WELCOME
    // ════════════════════════════════════════════════════════════════
    private ChatResult welcome(List<Products> all) {
        long inStock = all.stream().filter(p -> p.isStatus() && p.getStock() > 0).count();
        long onSale = all.stream().filter(p -> p.getDiscount_price() > 0 && p.getDiscount_price() < p.getPrice()).count();
        long nam = all.stream().filter(p -> p.getId_category() == 1).count();
        long nu = all.stream().filter(p -> p.getId_category() == 2).count();
        long uni = all.stream().filter(p -> p.getId_category() == 3).count();

        String msg = ICO_WAVE + " Chào bạn! Mình là trợ lý của <b>Huy Perfume</b>.\n"
            + ICO_BOX + " Hiện có <b>" + all.size() + " sản phẩm</b> (" + nam + " Nam, " + nu + " Nữ, " + uni + " Unisex)\n"
            + ICO_CHECK + " Đang mở bán: <b>" + inStock + "</b> | " + ICO_TAG + " Sale: <b>" + onSale + "</b>\n\n"
            + "Bạn có thể hỏi:\n"
            + BULLET + " <b>Liệt kê tất cả sản phẩm</b> — xem toàn bộ catalog\n"
            + BULLET + " <b>Nước hoa nam</b> / <b>nữ</b> / <b>unisex</b> — lọc theo danh mục\n"
            + BULLET + " <b>Tìm [từ khóa]</b> — tìm sản phẩm theo tên\n"
            + BULLET + " <b>Giá [tên SP]</b> — xem giá & khuyến mãi\n"
            + BULLET + " <b>Mùi hương [tên SP]</b> — xem nốt hương\n"
            + BULLET + " <b>Bảng giá</b> / <b>Sản phẩm sale</b> / <b>Dưới [số] triệu</b>";
        return new ChatResult(msg, buildGlobalSuggestions(all));
    }

    // ════════════════════════════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════════════════════════════
    private int score(String q, Products p) {
        int s = 0;
        String name = normalize(p.getName());
        for (String token : name.split("\\s+")) {
            if (token.length() >= 3 && q.contains(token)) s++;
        }
        String sku = normalize(p.getSku());
        if (!sku.isBlank() && q.contains(sku)) s += 3;
        return s;
    }

    private boolean containsAny(String q, String... keys) {
        for (String k : keys) { if (q.contains(k)) return true; }
        return false;
    }

    private String normalize(String input) {
        if (input == null) return "";
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }

    private String formatMoney(double amount) {
        return String.format(Locale.US, "%,d", Math.round(amount)).replace(",", ".");
    }

    private String safeValue(String value) {
        return (value == null || value.isBlank()) ? "N/A" : value;
    }

    private String buildFullSpec(Products p, double actualPrice) {
        String status = p.isStatus() ? ICO_CHECK + " Đang bán" : ICO_BAN + " Tạm ngưng";
        String decant = p.isIs_decant() ? ICO_CHECK + " Có chiết" : ICO_CROSS + " Không chiết";
        String saleStr = p.getDiscount_price() > 0
            ? formatMoney(p.getDiscount_price()) + "đ (gốc " + formatMoney(p.getPrice()) + "đ)" : "Không có";
        return ICO_CLIP + " Thông số " + p.getName() + "\n"
            + BULLET + " Giá bán: " + formatMoney(actualPrice) + "đ\n"
            + BULLET + " Khuyến mãi: " + saleStr + "\n"
            + BULLET + " Tồn kho: " + p.getStock() + " chai\n"
            + BULLET + " SKU: " + safeValue(p.getSku()) + "\n"
            + BULLET + " Batch code: " + safeValue(p.getBatch_code()) + "\n"
            + formatScentNotes(p.getScent_notes())
            + BULLET + " Decant: " + decant + "\n"
            + BULLET + " Trạng thái: " + status;
    }

    private String formatScentNotes(String raw) {
        if (raw == null || raw.isBlank()) return BULLET + " Hương: N/A\n";
        String[] parts = raw.split("\\|");
        String[] labels = {"Hương đầu", "Hương giữa", "Hương cuối"};
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length && i < labels.length; i++) {
            sb.append(BULLET).append(" ").append(labels[i]).append(": ").append(parts[i].trim()).append("\n");
        }
        return sb.toString();
    }

    private String buildSummary(Products p, double actualPrice) {
        return ICO_BOX + " " + p.getName() + "\n"
            + BULLET + " Giá: " + formatMoney(actualPrice) + "đ\n"
            + BULLET + " Tồn kho: " + p.getStock() + " chai\n"
            + BULLET + " SKU: " + safeValue(p.getSku()) + "\n"
            + BULLET + " Batch: " + safeValue(p.getBatch_code()) + "\n"
            + ICO_CHAT + " Hỏi thêm: giá, tồn kho, mùi hương, thông số...";
    }

    // ════════════════════════════════════════════════════════════════
    //  SUGGESTIONS
    // ════════════════════════════════════════════════════════════════
    private List<String> buildGlobalSuggestions(List<Products> all) {
        List<String> out = new ArrayList<>();
        out.add("Liệt kê tất cả sản phẩm");
        out.add("Bảng giá sản phẩm");
        out.add("Sản phẩm nào đang giảm giá?");
        out.add("Nước hoa nam");
        out.add("Nước hoa nữ");
        if (all.size() >= 3) {
            out.add("Giá " + all.get(0).getName() + " bao nhiêu?");
            out.add("Mùi hương của " + all.get(all.size() / 2).getName() + "?");
        }
        out.add("Dưới 2 triệu có sản phẩm nào?");
        return out;
    }

    private List<String> buildProductSuggestions(Products p) {
        List<String> out = new ArrayList<>();
        String n = p.getName();
        out.add("Giá " + n + " bao nhiêu?");
        out.add(n + " còn hàng không?");
        out.add("SKU của " + n + " là gì?");
        out.add("Batch code " + n + "?");
        out.add("Mùi hương của " + n + "?");
        out.add("Thông số " + n);
        return out;
    }

    private List<String> buildScenarioSuggestions(Products p) {
        List<String> out = new ArrayList<>();
        String n = p.getName();
        out.add("Batch code " + n + "?");
        out.add("Thông số " + n);
        out.add("Mùi hương của " + n + "?");
        out.add("Sản phẩm nào dưới 2 triệu?");
        out.add("Có sản phẩm nào đang giảm giá?");
        out.add("Liệt kê tất cả sản phẩm");
        return out;
    }

    // ════════════════════════════════════════════════════════════════
    //  BUDGET PARSER
    // ════════════════════════════════════════════════════════════════
    private long parseBudget(String q) {
        String digits = q.replaceAll("[^0-9]", " ").trim();
        if (digits.isBlank()) return -1;
        String[] parts = digits.split("\\s+");
        if (parts.length == 0) return -1;
        long val;
        try { val = Long.parseLong(parts[0]); } catch (Exception e) { return -1; }
        if (q.contains("triệu")) return val * 1_000_000L;
        if (q.contains("k"))    return val * 1_000L;
        if (val < 10_000)       return val * 1_000L;
        return val;
    }

    private static class ChatResult {
        final String answer;
        final List<String> suggestions;
        ChatResult(String answer, List<String> suggestions) {
            this.answer = answer;
            this.suggestions = suggestions;
        }
    }
}
