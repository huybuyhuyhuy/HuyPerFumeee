package data.utils;

public final class MomoConfig {

    private MomoConfig() {
    }

    public static final String PARTNER_CODE = env("MOMO_PARTNER_CODE", "MOMO");
    public static final String ACCESS_KEY = env("MOMO_ACCESS_KEY", "F8BBA842ECF85");
    public static final String SECRET_KEY = env("MOMO_SECRET_KEY", "K951B6PE1waDMi640xX08PD3vg6EkVlz");

    public static final String PARTNER_NAME = env("MOMO_PARTNER_NAME", "Huy");
    public static final String STORE_ID = env("MOMO_STORE_ID", "MomoTestStore");
    public static final String REQUEST_TYPE = env("MOMO_REQUEST_TYPE", "payWithMethod");
    public static final String EXTRA_DATA = env("MOMO_EXTRA_DATA", "");
    public static final String ORDER_GROUP_ID = env("MOMO_ORDER_GROUP_ID", "");
    public static final boolean AUTO_CAPTURE = Boolean.parseBoolean(env("MOMO_AUTO_CAPTURE", "true"));
    public static final String LANG = env("MOMO_LANG", "vi");

    public static final String CREATE_ENDPOINT = env("MOMO_CREATE_ENDPOINT", "https://test-payment.momo.vn/v2/gateway/api/create");
    public static final String REFUND_ENDPOINT = env("MOMO_REFUND_ENDPOINT", "https://test-payment.momo.vn/v2/gateway/api/refund");

    public static final long MIN_AMOUNT_VND = Long.parseLong(env("MOMO_MIN_AMOUNT_VND", "10000"));
    public static final boolean USE_NODE_PROXY = Boolean.parseBoolean(env("MOMO_USE_NODE_PROXY", "false"));

    public static final String NODE_PAYMENT_URL = env("MOMO_NODE_PAYMENT_URL", "http://127.0.0.1:5000/payment");
    public static final String NODE_REFUND_URL = env("MOMO_NODE_REFUND_URL", "http://127.0.0.1:5000/refund");

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }
}
