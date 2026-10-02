const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    const navItems = navLinks.querySelectorAll("a");

    navItems.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
        });
    });
}

/* =========================================
   AVATAR FRAME FILTERS
========================================= */

const frameFilterButtons = document.querySelectorAll(".frame-filter");
const frameCards = document.querySelectorAll(".frame-card");

frameFilterButtons.forEach(button => {
    button.addEventListener("click", () => {

        const selectedFilter = button.getAttribute("data-filter");

        // Active button change
        frameFilterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        // Filter cards
        frameCards.forEach(card => {

            const cardType = card.getAttribute("data-type");

            if (selectedFilter === "all" || cardType === selectedFilter) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });

    });
});
/* =========================================
   AVATAR FRAME BUY NOW - WHATSAPP
========================================= */

const frameBuyButtons = document.querySelectorAll(".frame-buy-btn");

frameBuyButtons.forEach(button => {
    button.addEventListener("click", () => {

        const card = button.closest(".frame-card");

        const frameName = card.querySelector("h3").innerText.trim();
        const frameType = card.getAttribute("data-type");
        const duration = card.querySelector(".frame-duration").innerText.trim();
        const price = card.querySelector(".new-price").innerText.trim();

        const typeText =
            frameType === "animated" ? "Animated" : "Simple";

        // Contact box ke WhatsApp number ko automatically use karega
        const whatsappLink = document.querySelector(".frame-whatsapp-btn");

        if (!whatsappLink) {
            alert("WhatsApp contact link not found.");
            return;
        }

        const href = whatsappLink.getAttribute("href");
        const numberMatch = href.match(/wa\.me\/(\d+)/);

        if (!numberMatch) {
            alert("Please add a valid WhatsApp number first.");
            return;
        }

        const whatsappNumber = numberMatch[1];

        const message =
`Hello FH EMPIRE 👋

I want to order a Poppo Avatar Frame.

🖼 Frame: ${frameName}
✨ Type: ${typeText}
⏳ Duration: ${duration}
💰 Price: ${price}

Please confirm availability and payment details.`;

        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");
    });
});
const withdrawWhatsappBtn = document.getElementById("withdrawWhatsappBtn");

if (withdrawWhatsappBtn) {
    withdrawWhatsappBtn.addEventListener("click", () => {

        const message =
`Hello FH EMPIRE 👋

I want to use Poppo Withdrawal Service.

🆔 Poppo ID:
💵 Withdrawal Amount:

Please guide me about the withdrawal process and current rate.`;

        const whatsappNumber = "923475554774";

        const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");
    });
}
/* =========================================
   POPPO PROMOTION ORDER BUTTONS
========================================= */

const promoOrderButtons = document.querySelectorAll(".promo-order-btn");

promoOrderButtons.forEach(button => {
    button.addEventListener("click", () => {

        const card = button.closest(".promo-card");

        const service = card.getAttribute("data-service");
        const duration = card.getAttribute("data-duration");
        const price = Number(card.getAttribute("data-price")).toLocaleString();

        const whatsappNumber = "923475554774";

        const message =
`Hello FH EMPIRE 👋

I want to order a Poppo Promotion Service.

📢 Service: ${service}
⏳ Duration: ${duration}
💰 Price: Rs. ${price}

Please confirm availability and guide me about the next process.`;

        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");
    });
});
/* =========================================
   SERVICE WORKER REGISTRATION
========================================= */

