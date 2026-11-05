const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";

const trackBtn = document.getElementById("trackBtn");
const trackOrderId = document.getElementById("trackOrderId");
const trackWhatsapp = document.getElementById("trackWhatsapp");
// FH EMPIRE - Auto-fill Order ID from Processing Page
const urlParams = new URLSearchParams(window.location.search);
const orderIdFromUrl = urlParams.get("order_id");

if (orderIdFromUrl && trackOrderId) {
    trackOrderId.value = orderIdFromUrl;
}
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
            `${SUPABASE_URL}/rest/v1/rpc/track_order_with_payment_v2`,
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

const paymentStatus = String(order.payment_status || "").toLowerCase();

const paymentLabels = {
    pending: "🟡 Receipt Submitted — Under Verification",
    on_hold: "🟠 Payment On Hold — Banking Review",
    unresolved: "⚠️ Unresolved Banking Dispute",
    verified: "✅ Payment Verified",
    rejected: "❌ Payment Rejected"
};

let paymentStatusHtml = "";
const holdReason = String(order.hold_reason || "").trim();
const reviewReason = String(order.review_reason || "").trim();
if (paymentStatus) {
    paymentStatusHtml = `
        <p>
            <span>Payment Verification:</span>
            ${escapeHtml(paymentLabels[paymentStatus] || "Under Review")}
        </p>
    `;

    if (
        ["on_hold", "unresolved"].includes(paymentStatus) &&
        order.hold_deadline_at
    ) {
        const deadline = new Date(order.hold_deadline_at);

        const formattedDeadline = deadline.toLocaleString("en-PK", {
            timeZone: "Asia/Karachi",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        paymentStatusHtml += `
            <p>
                <span>Banking Review Deadline:</span>
                ${escapeHtml(formattedDeadline)}
            </p>
            <p>
                Please do not make another payment while your
                banking review is in progress.
            </p>
        `;
    }
}
if (holdReason && ["on_hold", "unresolved", "rejected"].includes(paymentStatus)) {
    paymentStatusHtml += `
        <p>
            <span>🟠 Original Hold Reason:</span>
            ${escapeHtml(holdReason)}
        </p>
    `;
}

if (reviewReason && paymentStatus === "rejected") {
    paymentStatusHtml += `
        <p>
            <span>❌ Final Rejection Reason:</span>
            ${escapeHtml(reviewReason)}
        </p>
    `;
}
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
${String(order.status).toLowerCase() === "cancelled" && order.cancel_reason
    ? `<p class="cancel-reason">
         <span>Reason:</span> ${escapeHtml(order.cancel_reason)}
       </p>`
    : ""
}
${paymentStatusHtml}
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

/* FH EMPIRE - Auto-fill Order ID inside tracking popup */

const trackingParams = new URLSearchParams(window.location.search);
const autoTrackOrderId = trackingParams.get("order_id");

if (autoTrackOrderId && trackOrderId) {
    trackOrderId.value = autoTrackOrderId.trim();
}

