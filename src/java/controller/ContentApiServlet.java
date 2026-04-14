package controller;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "ContentApiServlet", urlPatterns = {"/api/content"})
public class ContentApiServlet extends HttpServlet {
    private static final Gson GSON = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String type = request.getParameter("type");
        if (type == null || type.isBlank()) {
            type = "knowledge";
        }
        String id = request.getParameter("id");
        String tag = request.getParameter("tag");
        int page = parseIntOrDefault(request.getParameter("page"), 1);
        int pageSize = parseIntOrDefault(request.getParameter("pageSize"), 3);
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 3;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("type", type);
        if (id != null && !id.isBlank()) {
            Map<String, String> detail = findById(type, id);
            result.put("item", detail);
            if (detail != null) {
                result.put("relatedSameType", getRelatedItems(type, id, 2));
                result.put("relatedCrossType", getRelatedItems("blog".equalsIgnoreCase(type) ? "knowledge" : "blog", null, 2));
                result.put("comments", getMockComments(id));
            }
        } else {
            List<Map<String, String>> source = "blog".equalsIgnoreCase(type) ? getBlogItems() : getKnowledgeItems();
            List<Map<String, String>> filtered = filterByTag(source, tag);
            int totalItems = filtered.size();
            int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / pageSize));
            if (page > totalPages) page = totalPages;
            List<Map<String, String>> paged = paginate(filtered, page, pageSize);

            if ("blog".equalsIgnoreCase(type)) {
                result.put("items", paged);
                result.put("highlights", getKnowledgeItems().subList(0, 2));
            } else {
                result.put("items", paged);
                result.put("highlights", getBlogItems().subList(0, 2));
            }
            result.put("tag", tag == null ? "" : tag);
            result.put("page", page);
            result.put("pageSize", pageSize);
            result.put("totalItems", totalItems);
            result.put("totalPages", totalPages);
            result.put("availableTags", collectTags(source));
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(GSON.toJson(result));
    }

    private List<Map<String, String>> getKnowledgeItems() {
        List<Map<String, String>> items = new ArrayList<>();
        items.add(item(
                "kn-1",
                "Phân biệt EDP và EDT: chọn nồng độ nào cho đúng nhu cầu?",
                "Nắm rõ nồng độ tinh dầu giúp bạn chọn đúng mùi hương cho đi làm, đi chơi và các dịp đặc biệt.",
                "09/03/2026",
                "Chuyên gia Huy Perfume",
                "EDP phù hợp cho các dịp cần độ lưu hương cao như đi sự kiện tối, trong khi EDT thường nhẹ nhàng hơn, phù hợp môi trường văn phòng hoặc thời tiết nóng. Khi chọn, bạn nên thử trực tiếp trên da và theo dõi mùi hương trong 2-3 giờ để cảm nhận tầng hương rõ nhất.",
                "co-ban",
                "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80"));
        items.add(item(
                "kn-2",
                "Cách xịt nước hoa lưu hương cả ngày mà không nồng gắt",
                "Áp dụng đúng vị trí mạch đập, khoảng cách xịt và số lần xịt để mùi hương tỏa tự nhiên hơn.",
                "27/01/2026",
                "Chuyên gia Huy Perfume",
                "Hãy xịt ở cổ tay, sau tai, giữa ngực và giữ khoảng cách 10-15cm. Tránh chà xát cổ tay sau khi xịt vì sẽ làm vỡ cấu trúc hương. Với môi trường công sở, 2-3 lần xịt là đủ để giữ sự tinh tế mà vẫn chuyên nghiệp.",
                "huong-dan",
                "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=900&q=80"));
        items.add(item(
                "kn-3",
                "Bảo quản nước hoa đúng cách để không bị biến mùi",
                "Tránh ánh nắng, độ ẩm cao và nhiệt độ thay đổi đột ngột để giữ chất lượng chai nước hoa lâu dài.",
                "20/12/2025",
                "Chuyên gia Huy Perfume",
                "Nước hoa nên đặt ở nơi khô ráo, tránh ánh nắng trực tiếp và khu vực nhà tắm ẩm nóng. Luôn đóng nắp kỹ sau khi dùng để giảm bay hơi tinh dầu. Nếu bảo quản tốt, một chai nước hoa có thể giữ chất lượng ổn định trong nhiều năm.",
                "bao-quan",
                "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80"));
        return items;
    }

    private List<Map<String, String>> getBlogItems() {
        List<Map<String, String>> items = new ArrayList<>();
        items.add(item(
                "bl-1",
                "Valentine 2026: chọn nước hoa sớm để quà tặng tinh tế hơn",
                "Những gợi ý mùi hương dễ tặng, hợp nhiều phong cách và dễ tạo ấn tượng trong dịp Valentine.",
                "09/03/2026",
                "Team Nội dung",
                "Một món quà nước hoa tốt cần phù hợp tính cách người nhận: tươi trẻ, thanh lịch hay quyến rũ. Bạn nên ưu tiên các mùi hương an toàn, dễ dùng ban ngày và có thiết kế chai tinh tế để nâng trải nghiệm tặng quà.",
                "xu-huong",
                "https://images.unsplash.com/photo-1615634262417-8f5f8f283f7d?auto=format&fit=crop&w=900&q=80"));
        items.add(item(
                "bl-2",
                "3 mùi hương nam lịch lãm cho mùa lễ hội cuối năm",
                "Tập hợp các mùi hương nam tính, dễ dùng, phù hợp môi trường công sở và sự kiện.",
                "27/01/2026",
                "Team Nội dung",
                "Mùa lễ hội phù hợp với các tông hương gỗ, amber hoặc gia vị nhẹ để tạo cảm giác ấm áp và chỉn chu. Với người mới bắt đầu, nên chọn mùi có độ tỏa vừa phải để dễ dùng cả ban ngày lẫn buổi tối.",
                "goi-y",
                "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=900&q=80"));
        items.add(item(
                "bl-3",
                "Checklist chọn nước hoa theo thời tiết và bối cảnh",
                "Một checklist nhanh giúp bạn chọn mùi hương đúng dịp: ngày nắng, trời mưa, hẹn hò hay tiệc tối.",
                "20/12/2025",
                "Team Nội dung",
                "Ngày nắng nên chọn citrus hoặc aquatic nhẹ nhàng, trời lạnh hợp nhóm gỗ và vani ấm. Khi đi làm, ưu tiên mùi sạch và tinh gọn; khi hẹn hò hoặc tiệc tối có thể dùng mùi sâu hơn để tăng dấu ấn cá nhân.",
                "kinh-nghiem",
                "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=900&q=80"));
        return items;
    }

    private Map<String, String> item(String id, String title, String excerpt, String date, String author, String content, String tag, String image) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("title", title);
        item.put("excerpt", excerpt);
        item.put("date", date);
        item.put("author", author);
        item.put("content", content);
        item.put("tag", tag);
        item.put("image", image);
        return item;
    }

    private Map<String, String> findById(String type, String id) {
        List<Map<String, String>> items = "blog".equalsIgnoreCase(type) ? getBlogItems() : getKnowledgeItems();
        for (Map<String, String> item : items) {
            if (id.equals(item.get("id"))) {
                return item;
            }
        }
        return null;
    }

    private List<Map<String, String>> getRelatedItems(String type, String excludeId, int limit) {
        List<Map<String, String>> source = "blog".equalsIgnoreCase(type) ? getBlogItems() : getKnowledgeItems();
        List<Map<String, String>> related = new ArrayList<>();
        for (Map<String, String> item : source) {
            if (excludeId != null && excludeId.equals(item.get("id"))) {
                continue;
            }
            related.add(item);
            if (related.size() >= limit) {
                break;
            }
        }
        return related;
    }

    private List<Map<String, String>> getMockComments(String contentId) {
        List<Map<String, String>> comments = new ArrayList<>();
        comments.add(comment("Linh Perfume Lover", "Nội dung rất hữu ích, mình áp dụng và thấy chọn mùi đúng hơn hẳn.", "2 giờ trước", contentId));
        comments.add(comment("Minh Nguyen", "Bài viết trình bày dễ hiểu, mong shop ra thêm nhiều chủ đề như này.", "1 ngày trước", contentId));
        return comments;
    }

    private Map<String, String> comment(String name, String message, String time, String contentId) {
        Map<String, String> c = new LinkedHashMap<>();
        c.put("name", name);
        c.put("message", message);
        c.put("time", time);
        c.put("contentId", contentId);
        return c;
    }

    private int parseIntOrDefault(String raw, int defaultValue) {
        try {
            return raw == null ? defaultValue : Integer.parseInt(raw);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private List<Map<String, String>> paginate(List<Map<String, String>> items, int page, int pageSize) {
        int from = (page - 1) * pageSize;
        int to = Math.min(from + pageSize, items.size());
        if (from >= items.size() || from < 0) return new ArrayList<>();
        return new ArrayList<>(items.subList(from, to));
    }

    private List<Map<String, String>> filterByTag(List<Map<String, String>> source, String tag) {
        if (tag == null || tag.isBlank()) return source;
        List<Map<String, String>> filtered = new ArrayList<>();
        for (Map<String, String> item : source) {
            if (tag.equalsIgnoreCase(item.get("tag"))) {
                filtered.add(item);
            }
        }
        return filtered;
    }

    private List<String> collectTags(List<Map<String, String>> source) {
        List<String> tags = new ArrayList<>();
        for (Map<String, String> item : source) {
            String tag = item.get("tag");
            if (tag != null && !tags.contains(tag)) {
                tags.add(tag);
            }
        }
        return tags;
    }
}
