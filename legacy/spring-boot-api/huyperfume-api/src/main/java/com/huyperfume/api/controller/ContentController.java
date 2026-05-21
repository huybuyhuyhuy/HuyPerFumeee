package com.huyperfume.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/content")
@Tag(name = "Content", description = "API nội dung blog và kiến thức")
public class ContentController {

    @GetMapping
    @Operation(summary = "Lấy nội dung blog hoặc knowledge")
    public ResponseEntity<Map<String, Object>> getContent(
            @RequestParam(defaultValue = "knowledge") String type,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "3") int pageSize) {

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("type", type);

        var source = "blog".equalsIgnoreCase(type) ? getBlogItems() : getKnowledgeItems();
        var filtered = tag != null && !tag.isBlank() ? filterByTag(source, tag) : source;

        if (id != null && !id.isBlank()) {
            var detail = findById(source, id);
            result.put("item", detail);
        } else {
            int totalItems = filtered.size();
            int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / pageSize));
            if (page > totalPages) page = totalPages;
            var paged = paginate(filtered, page, pageSize);

            result.put("items", paged);
            result.put("tag", tag != null ? tag : "");
            result.put("page", page);
            result.put("pageSize", pageSize);
            result.put("totalItems", totalItems);
            result.put("totalPages", totalPages);
            result.put("availableTags", collectTags(source));
        }

        return ResponseEntity.ok(result);
    }

    private List<Map<String, String>> getKnowledgeItems() {
        List<Map<String, String>> items = new ArrayList<>();
        items.add(item("kn-1", "Phân biệt EDP và EDT", "Nắm rõ nồng độ tinh dầu giúp bạn chọn đúng mùi hương.", "09/03/2026", "Chuyên gia Huy Perfume", "co-ban"));
        items.add(item("kn-2", "Cách xịt nước hoa lưu hương cả ngày", "Áp dụng đúng vị trí mạch đập.", "27/01/2026", "Chuyên gia Huy Perfume", "huong-dan"));
        items.add(item("kn-3", "Bảo quản nước hoa đúng cách", "Tránh ánh nắng, độ ẩm cao.", "20/12/2025", "Chuyên gia Huy Perfume", "bao-quan"));
        items.add(item("kn-4", "Batch Code và hạn sử dụng", "Hiểu các ký hiệu trên đáy chai.", "15/11/2025", "Chuyên gia Huy Perfume", "co-ban"));
        items.add(item("kn-5", "Nước hoa chiết (Decant) là gì?", "Giải pháp tiết kiệm để trải nghiệm.", "02/11/2025", "Chuyên gia Huy Perfume", "huong-dan"));
        items.add(item("kn-6", "Tầng hương hoạt động thế nào?", "Nốt đầu, giữa, cuối.", "20/10/2025", "Chuyên gia Huy Perfume", "co-ban"));
        return items;
    }

    private List<Map<String, String>> getBlogItems() {
        List<Map<String, String>> items = new ArrayList<>();
        items.add(item("bl-1", "Valentine 2026: chọn nước hoa", "Gợi ý mùi hương dễ tặng.", "09/03/2026", "Team Nội dung", "xu-huong"));
        items.add(item("bl-2", "3 mùi hương nam lịch lãm", "Mùa lễ hội cuối năm.", "27/01/2026", "Team Nội dung", "goi-y"));
        items.add(item("bl-3", "Checklist chọn nước hoa theo thời tiết", "Nhanh chóng chọn đúng dịp.", "20/12/2025", "Team Nội dung", "kinh-nghiem"));
        return items;
    }

    private Map<String, String> item(String id, String title, String excerpt, String date, String author, String tag) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("title", title);
        item.put("excerpt", excerpt);
        item.put("date", date);
        item.put("author", author);
        item.put("tag", tag);
        return item;
    }

    private Map<String, String> findById(List<Map<String, String>> items, String id) {
        return items.stream().filter(i -> id.equals(i.get("id"))).findFirst().orElse(null);
    }

    private List<Map<String, String>> paginate(List<Map<String, String>> items, int page, int pageSize) {
        int from = (page - 1) * pageSize;
        int to = Math.min(from + pageSize, items.size());
        if (from >= items.size() || from < 0) return new ArrayList<>();
        return new ArrayList<>(items.subList(from, to));
    }

    private List<Map<String, String>> filterByTag(List<Map<String, String>> source, String tag) {
        return source.stream().filter(i -> tag.equalsIgnoreCase(i.get("tag"))).toList();
    }

    private List<String> collectTags(List<Map<String, String>> source) {
        return source.stream().map(i -> i.get("tag")).distinct().toList();
    }
}
