const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

const navItems = navLinks.querySelectorAll("a");

navItems.forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});
const coinPackage = document.getElementById("coinPackage");
const customAmountBox = document.getElementById("customAmountBox");
const customAmount = document.getElementById("customAmount");
const coinCalculation = document.getElementById("coinCalculation");

coinPackage.addEventListener("change", function () {

    if (this.value === "custom") {
        customAmountBox.style.display = "block";
        customAmount.required = true;
    } else {
        customAmountBox.style.display = "none";
        customAmount.required = false;
        customAmount.value = "";
        coinCalculation.textContent = "You will receive: 0 Coins";
    }

});

customAmount.addEventListener("input", function () {

    const amount = Number(this.value);

    if (amount >= 250) {

        let coins;

if (amount % 1500 === 0) {
    coins = (amount / 1500) * 50000;
} else {
    coins = amount * 32;
}

        coinCalculation.textContent =
            "You will receive: " +
            coins.toLocaleString() +
            " Coins";

    } else {

        coinCalculation.textContent =
            "Minimum order is Rs. 250";

    }

});
const poppoOrderForm = document.getElementById("poppoOrderForm");
const orderResult = document.getElementById("orderResult");

poppoOrderForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const whatsappNumber = document.getElementById("whatsappNumber").value.trim();
    const poppoId = document.getElementById("poppoId").value.trim();
    const paymentMethod = document.getElementById("paymentMethod").value;

    let amount = 0;
    let coins = 0;

    if (coinPackage.value === "custom") {
    amount = Number(customAmount.value);
} else {
    amount = Number(coinPackage.value);
}

if (amount % 1500 === 0) {
    coins = (amount / 1500) * 50000;
} else {
    coins = amount * 32;
}

    if (amount < 250) {
        orderResult.innerHTML = `
            <div class="order-error">
                Minimum order is Rs. 250.
            </div>
        `;
        return;
    }

    const now = new Date();

    const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const randomPart = Math.floor(1000 + Math.random() * 9000);

    const orderId = `FH-${datePart}-${randomPart}`;
    

    const response = await fetch(`${SUPABASE_URL}/orders`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
    },
    body: JSON.stringify({
        order_id: orderId,
        customer_name: customerName,
        whatsapp_number: whatsappNumber,
        poppo_id: poppoId,
        coins: coins,
        amount: amount,
        payment_method: paymentMethod,
        status: "pending"
    })
});

if (!response.ok) {
    const errorText = await response.text();

    console.error("Supabase error:", errorText);

    orderResult.innerHTML = `
        <div class="order-error">
            Order save nahi hua. Please try again.
        </div>
    `;

    return;
}
// NEW ORDER PUSH NOTIFICATION
try {
    const projectUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");

    await fetch(`${projectUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
            title: "🛒 New FH EMPIRE Order",
            body: `${coins.toLocaleString()} Coins - Rs. ${amount.toLocaleString()} | Poppo ID: ${poppoId} | Order: ${orderId}`,
            url: "admin.html"
        })
    });

} catch (pushError) {
    console.error("Push notification failed:", pushError);
}

    orderResult.innerHTML = `
        <div class="order-success">

            <h3>Order Received ✅</h3>

            <p class="order-id">
                Order ID: <strong>${orderId}</strong>
            </p>

            <div class="order-summary">
                <p><span>Name:</span> ${customerName}</p>
                <p><span>Poppo ID:</span> ${poppoId}</p>
                <p><span>Coins:</span> ${coins.toLocaleString()}</p>
                <p><span>Amount:</span> Rs. ${amount.toLocaleString()}</p>
                <p><span>Payment:</span> ${paymentMethod}</p>
                <p><span>Status:</span> Pending</p>
            </div>

            <p class="order-note">
                Please save your Order ID for tracking.
            </p>

        </div>
    `;

    console.log({
        orderId,
        customerName,
        whatsappNumber,
        poppoId,
        coins,
        amount,
        paymentMethod,
        status: "Pending"
    });
});
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

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("sw.js");
            console.log("Service Worker registered:", registration.scope);
        } catch (error) {
            console.error("Service Worker registration failed:", error);
        }
    });
}