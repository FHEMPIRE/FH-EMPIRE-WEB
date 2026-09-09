const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";

const trackBtn = document.getElementById("trackBtn");
const trackOrderId = document.getElementById("trackOrderId");
const trackWhatsapp = document.getElementById("trackWhatsapp");
const trackResult = document.getElementById("trackResult");

trackBtn.addEventListener("click", async function () {
    const orderId = trackOrderId.value.trim();
    const whatsapp = trackWhatsapp.value.trim();

    if (!orderId || !whatsapp) {
        trackResult.innerHTML = `
            <div class="track-error">
                Please enter both Order ID and WhatsApp Number.
            </div>
        `;
        return;
    }

    trackResult.innerHTML = `
        <div class="track-loading">
            Checking order...
        </div>
    `;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/track_order`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                    p_order_id: orderId,
                    p_whatsapp_number: whatsapp
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Tracking error:", data);

            trackResult.innerHTML = `
                <div class="track-error">
                    Unable to check order. Please try again.
                </div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            trackResult.innerHTML = `
                <div class="track-error">
                    No matching order found.
                </div>
            `;
            return;
        }

        const order = data[0];

        trackResult.innerHTML = `
            <div class="track-card">
                <h2>Order Found ✅</h2>

                <p><span>Order ID:</span> ${escapeHtml(order.order_id)}</p>
                <p><span>Coins:</span> ${Number(order.coins || 0).toLocaleString()}</p>
                <p><span>Amount:</span> Rs. ${Number(order.amount || 0).toLocaleString()}</p>
                <p><span>Payment:</span> ${escapeHtml(order.payment_method)}</p>
                <p>
    <span>Status:</span>
    <span class="status-badge status-${String(order.status).toLowerCase()}">
        ${escapeHtml(order.status)}
    </span>
</p>
            </div>
        `;

    } catch (error) {
        console.error("Track order error:", error);

        trackResult.innerHTML = `
            <div class="track-error">
                Connection error. Please try again.
            </div>
        `;
    }
});

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}