package data.utils;

/**
 * Cấu hình sandbox MoMo (giống demo demo-payment-master/momo/config.js).
 * Khi lên production: đổi partnerCode, accessKey, secretKey và endpoint từ MoMo.
 */
public final class MomoConfig {

    private MomoConfig() {}

    /** Demo sandbox – test-payment.momo.vn */
    public static final String PARTNER_CODE = "MOMO";
    public static final String ACCESS_KEY = "F8BBA842ECF85";
    public static final String SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

    public static final String PARTNER_NAME = "Huy";
    public static final String STORE_ID = "MomoTestStore";
    public static final String REQUEST_TYPE = "payWithMethod";
    public static final String EXTRA_DATA = "";
    public static final String ORDER_GROUP_ID = "";
    public static final boolean AUTO_CAPTURE = true;
    public static final String LANG = "vi";

    public static final String CREATE_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create";

    /** Sandbox MoMo thường yêu cầu tối thiểu 10.000 VND */
    public static final long MIN_AMOUNT_VND = 10000L;

    /**
     * {@code true} = ưu tiên gọi Node ({@code npm start} trong {@code momo-node-proxy}).<br>
     * Nếu Node chưa bật → {@link controller.CheckoutServlet} tự fallback sang Java.<br>
     * {@code false} = chỉ dùng Java gọi MoMo (không cần Node).
     */
    public static final boolean USE_NODE_PROXY = false;

    /** Endpoint Node (mặc định trùng demo clip) */
    public static final String NODE_PAYMENT_URL = "http://127.0.0.1:5000/payment";
}
