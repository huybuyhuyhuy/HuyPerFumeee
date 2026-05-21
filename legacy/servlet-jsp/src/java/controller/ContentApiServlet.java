package controller;

import com.google.gson.Gson;
import data.utils.UnsplashImageService;
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
                result.put("highlights", getKnowledgeItems().subList(0, Math.min(5, getKnowledgeItems().size())));
            } else {
                result.put("items", paged);
                result.put("highlights", getBlogItems().subList(0, Math.min(5, getBlogItems().size())));
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
                "EDP (Eau de Parfum) chứa 15-20% tinh dầu, cho độ lưu hương 6-8 giờ, phù hợp cho các dịp cần độ lưu hương cao như đi sự kiện tối, tiệc tùng hay hẹn hò. EDT (Eau de Toilette) chỉ chứa 5-15% tinh dầu, lưu hương khoảng 3-4 giờ, thường nhẹ nhàng hơn, phù hợp môi trường văn phòng hoặc thời tiết nóng. Ngoài ra còn có Eau de Cologne (EDC) với nồng độ 2-4%, lưu hương 1-2 giờ, thường dùng như body splash mùa hè. Parfum/Extrait có nồng độ cao nhất 20-40%, lưu hương 8-12 giờ, chỉ cần một lượng nhỏ là đủ. Lời khuyên: nếu bạn làm văn phòng, EDT là lựa chọn an toàn; nếu bạn muốn gây ấn tượng buổi tối, EDP sẽ là vũ khí bí mật.",
                "co-ban",
                resolveImage("perfume EDP EDT concentration differences", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-2.jpg")));
        items.add(item(
                "kn-2",
                "Cách xịt nước hoa lưu hương cả ngày mà không nồng gắt",
                "Áp dụng đúng vị trí mạch đập, khoảng cách xịt và số lần xịt để mùi hương tỏa tự nhiên hơn.",
                "27/01/2026",
                "Chuyên gia Huy Perfume",
                "Bí quyết xịt nước hoa đúng cách: xịt vào các điểm mạch đập như cổ tay, sau tai, khuỷu tay trong, sau đầu gối và giữa ngực — những nơi có mạch máu gần da, tỏa nhiệt giúp khuếch tán hương thơm. Giữ chai cách da 10-15cm, không xịt quá gần vì sẽ làm ướt một điểm và hương không lan tỏa đều. Tuyệt đối không chà xát cổ tay sau khi xịt vì sẽ làm vỡ cấu trúc phân tử hương, khiến hương đầu bay mất nhanh chóng. Với EDP, 2-3 lần xịt là đủ cho cả ngày; với EDT, có thể xịt thêm 1-2 lần vào giữa ngày. Một mẹo nhỏ: thoa một lớp vaseline mỏng lên da trước khi xịt sẽ giúp giữ hương lâu hơn 30-40%.",
                "huong-dan",
                resolveImage("applying perfume long lasting fragrance tips", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-1.jpg")));
        items.add(item(
                "kn-3",
                "Bảo quản nước hoa đúng cách để không bị biến mùi",
                "Tránh ánh nắng, độ ẩm cao và nhiệt độ thay đổi đột ngột để giữ chất lượng chai nước hoa lâu dài.",
                "20/12/2025",
                "Chuyên gia Huy Perfume",
                "Nước hoa là một sản phẩm tinh tế, rất nhạy cảm với môi trường. Ba kẻ thù lớn nhất của nước hoa là: ánh nắng trực tiếp (tia UV phá hủy cấu trúc phân tử hương), nhiệt độ cao (làm bay hơi và oxy hóa tinh dầu), và độ ẩm (gây nấm mốc, biến chất). Nơi lý tưởng để bảo quản là tủ tối, khô ráo, nhiệt độ ổn định 15-22°C — tránh tuyệt đối khu vực nhà tắm hoặc bệ cửa sổ. Luôn đóng nắp kỹ sau khi dùng để hạn chế tiếp xúc với oxy. Một chai nước hoa chưa mở nắp có thể giữ được 3-5 năm, nhưng sau khi mở nắp, chất lượng tốt nhất thường trong vòng 12-24 tháng.",
                "bao-quan",
                resolveImage("perfume bottle storage collection care", "https://parfumerie.vn/storage/bai-viet/6.jpg")));
        items.add(item(
                "kn-4",
                "Cách đọc Batch Code và hạn sử dụng nước hoa",
                "Hiểu các ký hiệu trên đáy chai để biết thời điểm sản xuất và hạn dùng khuyến nghị của hãng.",
                "15/11/2025",
                "Chuyên gia Huy Perfume",
                "Batch code là dãy số/chữ được in hoặc khắc dưới đáy chai hoặc trên bao bì, cho biết lô sản xuất và ngày sản xuất. Mỗi hãng có cách mã hóa khác nhau: Chanel dùng 4 chữ số (vd: 2201 = tháng 1/2022), Dior dùng kết hợp số và chữ, Creed dùng 2-3 chữ số cuối của năm + ký tự chỉ tháng. Bạn có thể tra batch code trên các website như CheckFresh.com hoặc CheckCosmetic.net để biết ngày sản xuất chính xác. Thông thường nước hoa chưa mở nắp có hạn sử dụng 3-5 năm kể từ ngày sản xuất, nhưng nếu được bảo quản tốt, nhiều chai có thể giữ được 10 năm hoặc hơn. Lưu ý: batch code khác với mã vạch (barcode) — mã vạch chỉ dùng để quét giá, không cho biết ngày sản xuất.",
                "co-ban",
                resolveImage("perfume batch code expiration date", "https://parfumerie.vn/storage/bai-viet/7.jpg")));
        items.add(item(
                "kn-5",
                "Nước hoa chiết (Decant) là gì và tại sao nên dùng?",
                "Giải pháp tiết kiệm để trải nghiệm mùi hương xa xỉ trước khi quyết định mua chai fullbox.",
                "02/11/2025",
                "Chuyên gia Huy Perfume",
                "Decant là nước hoa được chiết trực tiếp từ chai gốc (fullbox) sang lọ nhỏ hơn, thường có dung tích 5ml, 10ml hoặc 30ml. Đây là cách tuyệt vời để bạn trải nghiệm mùi hương trên da trong nhiều ngày trước khi đầu tư vào chai fullbox có giá hàng triệu đồng. Decant cũng rất tiện lợi khi đi du lịch, mang theo trong túi xách, hoặc khi bạn muốn sở hữu nhiều mùi hương khác nhau mà không cần chi quá nhiều tiền. Tại Huy Perfume, chúng tôi cam kết decant trực tiếp từ chai gốc chính hãng, sử dụng lọ thủy tinh cao cấp với vòi xịt chất lượng. Tuy nhiên, cần lưu ý decant không phải là hàng fake hay hàng nhái — đó là nước hoa thật, chỉ khác về cách đóng gói.",
                "huong-dan",
                resolveImage("perfume decant sample travel spray", "https://parfumerie.vn/storage/bai-viet/5.jpg")));
        items.add(item(
                "kn-6",
                "Tầng hương (Notes) trong nước hoa hoạt động thế nào?",
                "Khám phá sự chuyển mình từ nốt đầu tươi mát đến nốt cuối nồng nàn lưu luyến.",
                "20/10/2025",
                "Chuyên gia Huy Perfume",
                "Mỗi chai nước hoa là một bản giao hưởng 3 chương: hương đầu (top notes), hương giữa (heart/middle notes) và hương cuối (base notes). Hương đầu là những gì bạn ngửi thấy ngay khi xịt, thường là citrus, trái cây hoặc thảo mộc tươi mát, bay hơi nhanh sau 15-30 phút. Hương giữa là 'trái tim' của chai nước hoa, xuất hiện sau khi hương đầu tan, thường là hoa cỏ, gia vị nhẹ, kéo dài 2-4 giờ. Hương cuối là nền tảng, những nốt hương nặng nhất như gỗ, hổ phách, xạ hương, vanilla — bám trên da 6-12 giờ và là thứ người khác nhớ về bạn. Hiểu về tầng hương giúp bạn chọn được mùi phù hợp: nếu thích sự tươi mát, chọn chai có citrus top notes; nếu thích sự ấm áp, hãy tìm những chai có woody/amber base notes.",
                "co-ban",
                resolveImage("perfume fragrance notes top middle base layers", "https://parfumerie.vn/storage/bai-viet/8.jpg")));
        items.add(item(
                "kn-7",
                "Phân biệt nước hoa Designer và nước hoa Niche",
                "Hiểu về hai trường phái nước hoa phổ biến: sự thương mại hóa và tính nghệ thuật độc bản.",
                "05/10/2025",
                "Chuyên gia Huy Perfume",
                "Nước hoa Designer đến từ các thương hiệu thời trang lớn như Chanel, Dior, Gucci, YSL — được sản xuất hàng loạt, hướng đến số đông, dễ đeo và an toàn. Chúng có mức giá phải chăng hơn (thường 1-5 triệu VNĐ) và dễ tìm mua. Ngược lại, nước hoa Niche đến từ các nhà sản xuất chỉ chuyên về nước hoa như Creed, Byredo, Le Labo, Diptyque — tập trung vào sự độc bản, nguyên liệu quý hiếm và tính nghệ thuật. Niche perfumes thường có mức giá cao hơn (5-20 triệu VNĐ), mùi hương phức tạp và 'kén' người dùng hơn. Gần đây còn có sự xuất hiện của dòng Indie — nước hoa từ các nhà pha chế độc lập, không thuộc tập đoàn lớn nào. Không có dòng nào 'tốt hơn' — Designer phù hợp với người mới bắt đầu, Niche dành cho người chơi muốn khẳng định cá tính riêng.",
                "co-ban",
                resolveImage("designer vs niche luxury perfume art", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-2.jpg")));
        items.add(item(
                "kn-8",
                "Làm sao để biết nước hoa chính hãng hay hàng giả?",
                "Các mẹo kiểm tra bao bì, vòi xịt, mã vạch và chất lượng mùi hương để tránh mua nhầm hàng kém chất lượng.",
                "25/09/2025",
                "Chuyên gia Huy Perfume",
                "Phân biệt nước hoa thật-giả là kỹ năng quan trọng với mọi tín đồ hương. 5 dấu hiệu chính cần kiểm tra: (1) Bao bì — chữ in sắc nét, không bị nhòe, logo được dập nổi trên hộp; (2) Vòi xịt — hàng thật có vòi xịt mượt, tia sương mịn, không bị rò rỉ; (3) Mã vạch và batch code — tra cứu được trên các website kiểm tra, khớp với thông tin trên hộp; (4) Chất lỏng — nước hoa thật trong suốt hoặc có màu đồng nhất, không có cặn lạ; (5) Mùi hương — hàng thật có sự chuyển biến rõ rệt qua 3 tầng hương, hàng giả thường có mùi cồn nồng và mùi đơn điệu từ đầu đến cuối. Tại Huy Perfume, chúng tôi cam kết 100% chính hãng, có hóa đơn và truy xuất nguồn gốc rõ ràng.",
                "kinh-nghiem",
                resolveImage("authentic genuine perfume bottle quality check", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-1.jpg")));
        items.add(item(
                "kn-9",
                "Top 5 họ hương (Olfactory Families) phổ biến nhất hiện nay",
                "Tìm hiểu về các họ hương chính trong thế giới nước hoa để chọn được mùi phù hợp với cá tính.",
                "10/09/2025",
                "Chuyên gia Huy Perfume",
                "Thế giới nước hoa được chia thành các họ hương (Olfactory Families) chính: Floral (hương hoa) — nhẹ nhàng, nữ tính, phổ biến nhất với các loài hoa như hồng, nhài, lan; Citrus (cam chanh) — tươi mát, năng lượng, lý tửởng cho mùa hè với bergamot, chanh vàng, bưởi; Woody (gỗ) — ấm áp, sang trọng với gỗ đàn hương, tuyết tùng, hoắc hương; Oriental (phương Đông) — nồng nàn, quyến rũ với vanilla, hổ phách, gia vị; và Fresh/Aquatic (tươi mát đại dương) — sạch sẽ, hiện đại, gợi cảm giác biển cả và gió trời. Mỗi họ hương còn được chia thành nhiều nhánh nhỏ hơn, và phần lớn nước hoa hiện đại là sự pha trộn giữa 2-3 họ hương khác nhau. Lời khuyên: nếu bạn mới bắt đầu, hãy thử từ Floral hoặc Citrus; nếu bạn muốn sự khác biệt, hãy khám phá Woody và Oriental.",
                "co-ban",
                resolveImage("perfume olfactory families fragrance wheel", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-2.jpg")));
        items.add(item(
                "kn-10",
                "Cách chọn nước hoa theo mùa trong năm",
                "Mỗi mùa trong năm phù hợp với những nốt hương khác nhau — chọn sai mùa có thể khiến mùi hương trở nên khó chịu.",
                "01/09/2025",
                "Chuyên gia Huy Perfume",
                "Mùa xuân là thời điểm lý tửởng cho các hương hoa nhẹ nhàng như hoa anh đào, hoa mộc lan, hoa linh lan — tươi mới và tràn đầy sức sống. Mùa hè nóng bức rất hợp với citrus, aquatic và green notes — những mùi hương mát lạnh, sạch sẽ, không gây cảm giác nặng nề. Mùa thu se lạnh là lúc các hương gỗ nhẹ, lá khô, gia vị ấm lên ngôi — thử những chai có sandalwood, cedar, cinnamon. Mùa đông lạnh giá là sân khấu của các hương nồng nàn, ấm áp: vanilla, hổ phách, oud, da thuộc — những nốt hương 'nặng ký' sẽ khuếch tán tuyệt vời trong không khí lạnh. Một chai nước hoa có thể 'biến hình' hoàn toàn khi dùng sai mùa: citrus mùa đông sẽ bay hơi quá nhanh, trong khi oud mùa hè có thể gây cảm giác ngột ngạt.",
                "huong-dan",
                resolveImage("seasonal perfume fragrance guide spring summer", "https://parfumerie.vn/storage/bai-viet/6.jpg")));
        items.add(item(
                "kn-11",
                "Sự khác biệt giữa nước hoa nam, nữ và unisex",
                "Ranh giới giới tính trong nước hoa ngày càng mờ nhạt — hiểu để chọn mùi phù hợp phong cách của bạn.",
                "15/08/2025",
                "Chuyên gia Huy Perfume",
                "Truyền thống, nước hoa nam thường thiên về các nốt gỗ, gia vị, da thuộc, rêu — mang cảm giác mạnh mẽ, nam tính. Nước hoa nữ thường xoay quanh hoa cỏ, trái cây, vanilla — nhẹ nhàng, nữ tính. Tuy nhiên, ranh giới này đang dần biến mất với sự trỗi dậy của dòng unisex — những mùi hương được thiết kế để mọi giới tính đều có thể sử dụng. Unisex thường sử dụng các nốt hương trung tính như citrus, gỗ, musk, amber. Xu hướng này phản ánh sự thay đổi trong xã hội hiện đại: nước hoa không còn là công cụ khẳng định giới tính, mà là cách thể hiện cá tính và phong cách sống. Tại Huy Perfume, chúng tôi khuyến khích khách hàng chọn nước hoa dựa trên sở thích cá nhân thay vì nhãn 'nam' hay 'nữ' trên chai.",
                "co-ban",
                resolveImage("unisex gender neutral luxury fragrance", "https://parfumerie.vn/storage/bai-viet/7.jpg")));
        items.add(item(
                "kn-12",
                "Lịch sử nước hoa: Hành trình từ Ai Cập cổ đại đến thời hiện đại",
                "Khám phá hơn 5000 năm lịch sử của nghệ thuật chế tác hương thơm trên khắp thế giới.",
                "01/08/2025",
                "Chuyên gia Huy Perfume",
                "Nước hoa có lịch sử lâu đời bậc nhất trong các sản phẩm xa xỉ của loài người. Người Ai Cập cổ đại (3000 TCN) là những người đầu tiên sử dụng hương liệu trong nghi lễ tửn giáo và ướp xác, với thành phần chính là nhựa thơm, một dược và quế. Người La Mã và Hy Lạp tiếp nối truyền thống này, sử dụng dầu thơm trong nhà tắm công cộng và các buổi tiệc. Thời kỳ Phục Hưng chứng kiến sự bùng nổ của nước hoa tại châu Âu, đặc biệt là Pháp — nơi sau này trở thành kinh đô nước hoa thế giới với Grasse là trung tâm trồng hoa nguyên liệu. Thế kỷ 19-20 đánh dấu cuộc cách mạng hóa học với sự ra đời của các phân tử hương tổng hợp, cho phép tạo ra những mùi hương chưa từng tồn tại trong tự nhiên. Ngày nay, ngành công nghiệp nước hoa toàn cầu trị giá hơn 50 tỷ USD và không ngừng phát triển với các xu hướng mới như nước hoa 'sạch' (clean perfume) và cá nhân hóa mùi hương.",
                "co-ban",
                resolveImage("ancient perfume history vintage fragrance bottles", "https://parfumerie.vn/storage/bai-viet/5.jpg")));
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
                "Một món quà nước hoa tốt cần phù hợp tính cách người nhận: tươi trẻ, thanh lịch hay quyến rũ.",
                "xu-huong",
                resolveImage("valentine perfume gift romantic luxury", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-2.jpg")));
        items.add(item(
                "bl-2",
                "3 mùi hương nam lịch lãm cho mùa lễ hội cuối năm",
                "Tập hợp các mùi hương nam tính, dễ dùng, phù hợp môi trường công sở và sự kiện.",
                "27/01/2026",
                "Team Nội dung",
                "Mùa lễ hội phù hợp với các tông hương gỗ, amber hoặc gia vị nhẹ để tạo cảm giác ấm áp và chỉn chu.",
                "goi-y",
                resolveImage("men elegant cologne holiday fragrance", "https://parfumerie.vn/storage/bai-viet/6.jpg")));
        items.add(item(
                "bl-3",
                "Checklist chọn nước hoa theo thời tiết và bối cảnh",
                "Một checklist nhanh giúp bạn chọn mùi hương đúng dịp: ngày nắng, trời mưa, hẹn hò hay tiệc tối.",
                "20/12/2025",
                "Team Nội dung",
                "Ngày nắng nên chọn citrus hoặc aquatic nhẹ nhàng, trời lạnh hợp nhóm gỗ và vani ấm.",
                "kinh-nghiem",
                resolveImage("perfume weather season selection checklist", "https://parfumerie.vn/storage/bai-viet/5.jpg")));
        items.add(item(
                "bl-4",
                "Top 5 chai nước hoa unisex được săn đón nhất đầu năm 2026",
                "Khám phá những mùi hương phá vỡ rào cản giới tính, mang lại sự độc đáo và cá tính riêng.",
                "10/11/2025",
                "Team Nội dung",
                "Các dòng nước hoa unisex đang trở thành xu hướng mạnh mẽ với sự kết hợp hài hòa giữa các nốt hương hoa cỏ và gỗ trầm.",
                "xu-huong",
                resolveImage("unisex luxury perfume bottle trend 2026", "https://parfumerie.vn/storage/bai-viet/7.jpg")));
        items.add(item(
                "bl-5",
                "Trải nghiệm Le Labo Santal 33: Mùi gỗ huyền thoại có thực sự đáng tiền?",
                "Đánh giá chi tiết về chai nước hoa gây sốt toàn cầu with mùi gỗ đàn hương đặc trưng.",
                "01/11/2025",
                "Team Nội dung",
                "Santal 33 mang lại cảm giác mộc mạc nhưng cực kỳ sang trọng. Dù có nhiều ý kiến trái chiều, nhưng độ bám tỏa vẫn rất tốt.",
                "kinh-nghiem",
                resolveImage("Le Labo Santal 33 sandalwood perfume bottle", "https://parfumerie.vn/storage/bai-viet/8.jpg")));
        items.add(item(
                "bl-6",
                "Gợi ý 3 chai nước hoa cho buổi hẹn hò đầu tiên thêm ấn tượng",
                "Chinh phục đối phương bằng mùi hương nhẹ nhàng, lôi cuốn và đầy sự tinh tế.",
                "15/10/2025",
                "Team Nội dung",
                "Buổi hẹn đầu nên tránh các mùi quá nồng. Hãy chọn các nốt hương hoa trắng nhẹ nhàng hoặc citrus thanh khiết.",
                "goi-y",
                resolveImage("romantic date night first impression perfume", "https://parfumerie.vn/storage/bai-viet/phieu-khao-sat-y-kien-khach-hang-1.jpg")));
        items.add(item(
                "bl-7",
                "Huy Perfume đồng hành cùng sự kiện triển lãm nước hoa 2026",
                "Chúng tôi vinh dự được tham gia chuỗi sự kiện lớn nhất năm dành cho những tín đồ yêu hương.",
                "01/10/2025",
                "Team Nội dung",
                "Triển lãm là cơ hội để Huy Perfume giới thiệu những bộ sưu tập mới nhất và giao lưu cùng các chuyên gia.",
                "tin-tuc",
                resolveImage("perfume exhibition event showcase luxury", "https://parfumerie.vn/storage/bai-viet/6.jpg")));
        items.add(item(
                "bl-8",
                "Mở hộp siêu phẩm Dior Sauvage Elixir: Đẳng cấp nồng độ mới",
                "Cùng khám phá phiên bản Sauvage mạnh mẽ và đậm đặc nhất từ trước đến nay.",
                "15/09/2025",
                "Team Nội dung",
                "Sauvage Elixir không chỉ là một chai nước hoa, nó là một tuyên ngôn về sức mạnh và sự nam tính hiện đại.",
                "goi-y",
                resolveImage("Dior Sauvage Elixir unboxing perfume bottle", "https://parfumerie.vn/storage/bai-viet/5.jpg")));
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

    private static String resolveImage(String unsplashQuery, String fallbackUrl) {
        String url = UnsplashImageService.getImage(unsplashQuery);
        return (url != null && !url.isEmpty()) ? url : fallbackUrl;
    }
}
