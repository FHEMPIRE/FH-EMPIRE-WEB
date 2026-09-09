const SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";

const accessToken = localStorage.getItem("fh_admin_access_token");

if (!accessToken) {
    window.location.href = "login.html";
}

const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const completedOrdersEl = document.getElementById("completedOrders");
const logoutBtn = document.getElementById("logoutBtn");
const processingOrdersEl = document.getElementById("processingOrders");
const cancelledOrdersEl = document.getElementById("cancelledOrders");
const ordersTable = document.getElementById("ordersTable");

async function loadOrders() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("fh_admin_access_token");
            localStorage.removeItem("fh_admin_refresh_token");
            window.location.href = "login.html";
            return;
        }

        const orders = await response.json();

        if (!response.ok) {
            console.error("Load orders error:", orders);

            ordersTable.innerHTML = `
                <tr>
                    <td colspan="8">
                        Unable to load orders.
                    </td>
                </tr>
            `;
            return;
        }

        const total = orders.length;

        const pending = orders.filter(order =>
            String(order.status).toLowerCase() === "pending"
        ).length;

        const completed = orders.filter(order =>
            String(order.status).toLowerCase() === "completed"
        ).length;

        const processing = orders.filter(order =>
    String(order.status).toLowerCase() === "processing"
).length;

const cancelled = orders.filter(order =>
    String(order.status).toLowerCase() === "cancelled"
).length;

        totalOrdersEl.textContent = total;
        pendingOrdersEl.textContent = pending;
        completedOrdersEl.textContent = completed;
        processingOrdersEl.textContent = processing;
        cancelledOrdersEl.textContent = cancelled;

        if (orders.length === 0) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="9">No orders found.</td>
                </tr>
            `;
            return;
        }

        ordersTable.innerHTML = "";

      orders.forEach(order => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${escapeHtml(order.order_id)}</td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td>${escapeHtml(order.whatsapp_number)}</td>
        <td>${escapeHtml(order.poppo_id)}</td>
        <td>${Number(order.coins || 0).toLocaleString()}</td>
        <td>Rs. ${Number(order.amount || 0).toLocaleString()}</td>
        <td>${escapeHtml(order.payment_method)}</td>
        <td>${escapeHtml(order.status)}</td>

       <td>
    <select class="status-select">
        <option value="pending" ${String(order.status).toLowerCase() === "pending" ? "selected" : ""}>Pending</option>
        <option value="processing" ${String(order.status).toLowerCase() === "processing" ? "selected" : ""}>Processing</option>
        <option value="completed" ${String(order.status).toLowerCase() === "completed" ? "selected" : ""}>Completed</option>
        <option value="cancelled" ${String(order.status).toLowerCase() === "cancelled" ? "selected" : ""}>Cancelled</option>
    </select>

    <button class="accept-whatsapp-btn">
        Accept & WhatsApp
    </button>
</td>
    `;

    const statusSelect = row.querySelector(".status-select");
    const acceptWhatsappBtn = row.querySelector(".accept-whatsapp-btn");

acceptWhatsappBtn.addEventListener("click", async () => {

    try {

        // Order ko Processing kar do
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    status: "processing"
                })
            }
        );

        if (!response.ok) {
            alert("Order status update nahi ho saka.");
            return;
        }

        // Dashboard dropdown bhi Processing show kare
        statusSelect.value = "processing";

        // Customer WhatsApp number clean karo
        let whatsappNumber = String(order.whatsapp_number || "")
            .replace(/\D/g, "");

        // Pakistani 03XX number ko 923XX bana do
        if (whatsappNumber.startsWith("0")) {
            whatsappNumber = "92" + whatsappNumber.substring(1);
        }

        if (!whatsappNumber) {
            alert("Customer WhatsApp number missing hai.");
            return;
        }

        const message =
`Hi ${order.customer_name || "Dear"} 👋

We have received your order to buy ${Number(order.coins || 0).toLocaleString()} Poppo Coins.

🪙 Coins: ${Number(order.coins || 0).toLocaleString()}
💰 Amount: Rs. ${Number(order.amount || 0).toLocaleString()}
🆔 Poppo ID: ${order.poppo_id || "-"}
📦 Order ID: ${order.order_id || "-"}

Please send payment to the given payment number and send us the payment screenshot for processing.

Thank you for choosing FH EMPIRE.`;

        const whatsappURL =
            `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");
        statusSelect.value = "processing";

// Refresh dashboard orders + counters
await loadOrders();

    } catch (error) {
        console.error("Accept & WhatsApp error:", error);
        alert("Something went wrong.");
    }

});

    statusSelect.addEventListener("change", async function () {
        const newStatus = this.value;

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Status update failed:", errorText);
            alert("Status update failed.");
            await loadOrders();
            return;
        }

        await loadOrders();
    });

    ordersTable.appendChild(row);
});

    } catch (error) {
        console.error("Admin error:", error);

        ordersTable.innerHTML = `
            <tr>
                <td colspan="9">
                    Connection error. Please refresh.
                </td>
            </tr>
        `;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadOrders();
async function completeOrder(orderId) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    status: "completed"
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Update error:", errorText);
            alert("Order status update nahi hua.");
            return;
        }

        await loadOrders();

    } catch (error) {
        console.error("Complete order error:", error);
        alert("Connection error.");
    }
    async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Status update error:", errorText);
            alert("Status update nahi hua.");
            await loadOrders();
            return;
        }

        await loadOrders();

    } catch (error) {
        console.error("Status update error:", error);
        alert("Connection error.");
        await loadOrders();
    }
}
}
logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("fh_admin_access_token");
    localStorage.removeItem("fh_admin_refresh_token");

    window.location.href = "login.html";
});