(function () {
    const contextPath = window.APP_CONTEXT_PATH || "";
    const base = contextPath + "/assets/iconly/animated/";
    const map = {
        "fa-lock": "lock.gif",
        "fa-envelope": "mail.gif",
        "fa-key": "key.gif",
        "fa-search": "search.gif",
        "fa-shopping-cart": "cart.gif",
        "fa-cart-shopping": "cart.gif",
        "fa-trash-alt": "trash.gif",
        "fa-check": "success.gif",
        "fa-check-circle": "success.gif",
        "fa-exclamation-circle": "error.gif",
        "fa-arrow-left": "arrow-left.gif",
        "fa-phone-alt": "phone.gif",
        "fa-map-marker-alt": "location.gif",
        "fa-history": "history.gif",
        "fa-sign-out-alt": "logout.gif",
        "fa-user-circle": "user.gif",
        "fa-wallet": "wallet.gif",
        "fa-credit-card": "card.gif",
        "fa-mobile-alt": "mobile.gif",
        "fa-money-bill-wave": "cash.gif",
        "fa-university": "bank.gif"
    };

    function buildImage(classes, file) {
        const img = document.createElement("img");
        img.src = base + file;
        img.alt = "icon";
        img.className = "iconly-anim " + classes
            .filter((c) => c.startsWith("me-") || c.startsWith("ms-"))
            .join(" ");
        img.style.width = "20px";
        img.style.height = "20px";
        img.style.objectFit = "contain";
        img.style.verticalAlign = "middle";
        return img;
    }

    document.querySelectorAll("i[class*='fa']").forEach((icon) => {
        const classes = Array.from(icon.classList);
        const file = classes.find((c) => map[c] != null);
        if (!file) return;

        const img = buildImage(classes, map[file]);
        img.addEventListener("load", () => {
            icon.replaceWith(img);
        }, { once: true });

        // Keep the original Font Awesome icon when the animated asset is missing.
        img.addEventListener("error", () => {}, { once: true });
    });
})();
