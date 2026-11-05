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


const ORDERS_PER_PAGE = 10;
let currentOrdersPage = 1;
let allAdminOrders = [];

const ordersDateFilter = document.getElementById("ordersDateFilter");
const orderSearchInput = document.getElementById("orderSearch");
const prevOrdersPage = document.getElementById("prevOrdersPage");
const nextOrdersPage = document.getElementById("nextOrdersPage");
const ordersPageInfo = document.getElementById("ordersPageInfo");

function getFilteredOrders() {
    const selectedDate = ordersDateFilter?.value || "";
    const search = (orderSearchInput?.value || "").trim().toLowerCase();

    return allAdminOrders.filter(order => {
        // Convert Supabase UTC timestamp to Pakistan date
        const pakistanDate = order.created_at
            ? new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Karachi",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).format(new Date(order.created_at))
            : "";

        const matchesDate = !selectedDate || pakistanDate === selectedDate;

        const matchesSearch = !search ||
            String(order.order_id || "").toLowerCase().includes(search) ||
            String(order.whatsapp_number || "").toLowerCase().includes(search);

        return matchesDate && matchesSearch;
    });
}

function updateOrdersPagination(totalOrders) {
    const totalPages = Math.max(
        1,
        Math.ceil(totalOrders / ORDERS_PER_PAGE)
    );

    currentOrdersPage = Math.min(currentOrdersPage, totalPages);

    if (ordersPageInfo) {
        ordersPageInfo.textContent =
            `Page ${currentOrdersPage} of ${totalPages} (${totalOrders} orders)`;
    }

    if (prevOrdersPage) {
        prevOrdersPage.disabled = currentOrdersPage <= 1;
    }

    if (nextOrdersPage) {
        nextOrdersPage.disabled = currentOrdersPage >= totalPages;
    }
}

function refreshOrdersView() {
    currentOrdersPage = 1;
    renderOrders();
}

ordersDateFilter?.addEventListener("change", refreshOrdersView);
orderSearchInput?.addEventListener("input", refreshOrdersView);

document.getElementById("clearOrdersDate")
   
document.getElementById("clearOrdersDate")
    ?.addEventListener("click", () => {
        if (ordersDateFilter) {
            ordersDateFilter.value = "";
        }

        currentOrdersPage = 1;
        renderOrders();
    });


prevOrdersPage?.addEventListener("click", () => {
    if (currentOrdersPage > 1) {
        currentOrdersPage--;
        renderOrders();
    }
});

nextOrdersPage?.addEventListener("click", () => {
    const totalPages = Math.ceil(
        getFilteredOrders().length / ORDERS_PER_PAGE
    );

    if (currentOrdersPage < totalPages) {
        currentOrdersPage++;
        renderOrders();
    }
});

function renderOrders() {
    loadOrders();
}

let fhAssistantNames = new Map();

async function loadAssistantNamesForOrders(orders) {
    const assistantIds = [...new Set(
        orders
            .filter(order =>
                order.accepted_role === "assistant" &&
                order.accepted_by
            )
            .map(order => order.accepted_by)
    )];

    if (!assistantIds.length) return;

    // Assistant records are protected by RLS.
    // Admin must load these through an authorized Edge Function.
    const token = localStorage.getItem("fh_admin_access_token");

    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-assistants`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ action: "list" })
        }
    );

    if (!response.ok) {
        console.error("Unable to load assistant names");
        return;
    }

    const result = await response.json();

    const assistants = Array.isArray(result.assistants)
        ? result.assistants
        : [];

    fhAssistantNames = new Map(
        assistants.map(assistant => [
            assistant.id,
            {
                name: assistant.display_name ||
                      assistant.assistant_name ||
                      assistant.login_id ||
                      "Assistant",
                poppoId: assistant.poppo_id || "—"
            }
        ])
    );
}
// FH EMPIRE — Smart Admin Orders Refresh
let lastAdminOrdersSnapshot = "";
let lastAdminReceiptsSnapshot = "";
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
        let adminReceipts = [];

if (response.ok) {
    const receiptResponse = await fetch(
       
`${SUPABASE_URL}/rest/v1/order_payment_proofs?select=id,order_id,sender_account_name,receipt_path,status,submitted_at,hold_started_at,hold_deadline_at,hold_reason,review_reason`,

{
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );

    if (receiptResponse.ok) {
        adminReceipts = await receiptResponse.json();
    } else {
        console.error(
            "Receipt loading failed:",
            await receiptResponse.text()
        );
    }
}
if (!response.ok) {
    throw new Error("Unable to load orders");
}

// FH EMPIRE — Only rebuild when data changes
const ordersSnapshot = JSON.stringify(orders);
const receiptsSnapshot = JSON.stringify(adminReceipts);

if (
    ordersSnapshot === lastAdminOrdersSnapshot &&
    receiptsSnapshot === lastAdminReceiptsSnapshot
) {
    return;
}

lastAdminOrdersSnapshot = ordersSnapshot;
lastAdminReceiptsSnapshot = receiptsSnapshot;

allAdminOrders = orders;

await loadAssistantNamesForOrders(orders);
        if (!response.ok) {
            console.error("Load orders error:", orders);

            ordersTable.innerHTML = `
                <tr>
                    <td colspan="11">
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

        const receiptByOrderId = new Map(
    adminReceipts.map(receipt => [
        String(receipt.order_id),
        receipt
    ])
);
      
const filteredOrders = getFilteredOrders();

updateOrdersPagination(filteredOrders.length);

const startIndex = (currentOrdersPage - 1) * ORDERS_PER_PAGE;
const visibleOrders = filteredOrders.slice(
    startIndex,
    startIndex + ORDERS_PER_PAGE
);
async function getAdminPoppoName(poppoId) {
    try {
        const response = await fetch(
            "https://vmllowldjzwmzsvxccui.supabase.co/functions/v1/poppo-profile",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    poppoId: String(poppoId)
                })
            }
        );

        const data = await response.json();

        if (
            response.ok &&
            data.success &&
            String(data.id) === String(poppoId)
        ) {
            return data.nickname || "—";
        }

        return "—";
    } catch (error) {
        console.error("Poppo name fetch error:", error);
        return "—";
    }
}
const poppoNameCache = new Map();
visibleOrders.forEach(order => {
    const orderReceipt = receiptByOrderId.get(String(order.order_id));
    const paymentDeadline = order.payment_deadline
    ? new Date(order.payment_deadline)
    : null;

const paymentExpired =
    !orderReceipt &&
    paymentDeadline &&
    !Number.isNaN(paymentDeadline.getTime()) &&
    Date.now() > paymentDeadline.getTime() &&
    ["accepted", "processing"].includes(
        String(order.status || "").toLowerCase()
    );
    console.log("RECEIPT CHECK:", {
    orderId: order.order_id,
    totalReceipts: adminReceipts.length,
    matchedReceipt: orderReceipt
});
    console.log("FH ORDER DATA:", order);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${escapeHtml(order.order_id)}</td>
        <td>${escapeHtml(order.customer_name)}</td>
        <td>${escapeHtml(order.whatsapp_number)}</td>
        <td>
    <div class="poppo-id-cell">
        <span>${escapeHtml(order.poppo_id)}</span>
        <button type="button" class="copy-poppo-id"
            data-poppo-id="${escapeHtml(order.poppo_id)}"
            title="Copy Poppo ID">📋</button>
    </div>
</td>
        <td class="admin-poppo-name">Loading...</td>
<td>
    <span class="account-type-badge ${
        String(order.account_type || "").toLowerCase() === "agent"
            ? "agent-badge"
            : "user-badge"
    }">
        ${escapeHtml(order.account_type || "—").toUpperCase()}
    </span>
</td>
        <td>${Number(order.coins || 0).toLocaleString()}</td>
        <td>Rs. ${Number(order.amount || 0).toLocaleString()}</td>
        <td>${escapeHtml(order.payment_method)}</td>
        <td>
    <div>${escapeHtml(order.status)}</div>

    ${order.accepted_role === "assistant" ? `
        <div style="
            margin-top:6px;
            font-size:12px;
            color:#facc15;
            line-height:1.6;
        ">
            👤 ${escapeHtml(
                fhAssistantNames.get(order.accepted_by)?.name ||
                "Assigned Assistant"
            )}

            <div style="color:#aaa;">
                Poppo ID:
                ${escapeHtml(
                    fhAssistantNames.get(order.accepted_by)?.poppoId ||
                    "—"
                )}
            </div>
        </div>
    ` : order.accepted_role === "admin" ? `
        <div style="font-size:12px;color:#4ade80;">
            👑 Accepted by Admin
        </div>
    ` : ""}
</td>

       <td>
    <select class="status-select">
        <option value="pending" ${String(order.status).toLowerCase() === "pending" ? "selected" : ""}>Pending</option>
        <option value="accepted" ${order.status === "accepted" ? "selected" : ""}>Accepted</option>
        <option value="processing" ${String(order.status).toLowerCase() === "processing" ? "selected" : ""}>Processing</option>
        <option value="completed" ${String(order.status).toLowerCase() === "completed" ? "selected" : ""}>Completed</option>
        <option value="cancelled" ${String(order.status).toLowerCase() === "cancelled" ? "selected" : ""}>Cancelled</option>
    </select>

   ${String(order.status).toLowerCase() === "pending" &&
  !order.accepted_at &&
  !order.accepted_by ? `
    <button class="accept-whatsapp-btn">
        Accept Order
    </button>
` : ""}
   ${orderReceipt ? `
    <div class="order-receipt-status">
       
${(() => {
    const status = orderReceipt.status;

    const badges = {
        pending: "🟡 RECEIPT SUBMITTED",
        on_hold: "🟠 PAYMENT ON HOLD",
        unresolved: "⚠️ UNRESOLVED DISPUTE",
        verified: "✅ PAYMENT VERIFIED",
        rejected: "❌ PAYMENT REJECTED"
    };

    if (
        status === "on_hold" &&
        orderReceipt.hold_deadline_at &&
        new Date(orderReceipt.hold_deadline_at).getTime() <= Date.now()
    ) {
        return "⚠️ HOLD EXPIRED — REVIEW REQUIRED";
    }

    return badges[status] || "● UNKNOWN PAYMENT STATUS";
})()}

    </div>
    <button type="button" class="view-receipt-btn">
        📄 View Receipt
    </button>
` : paymentExpired ? `
    <div class="order-receipt-status"
         style="color:#ef4444;font-weight:700;">
        ⏰ PAYMENT EXPIRED — NO RECEIPT
    </div>
` : ""}
</td>
    `;
    const poppoNameCell = row.querySelector(".admin-poppo-name");
const poppoId = String(order.poppo_id || "").trim();

if (!poppoId) {
    poppoNameCell.textContent = "—";
} else {
    if (!poppoNameCache.has(poppoId)) {
        poppoNameCache.set(poppoId, getAdminPoppoName(poppoId));
    }

    poppoNameCache.get(poppoId).then(name => {
        if (poppoNameCell.isConnected) {
            poppoNameCell.textContent = name;
        }
    });
}
const viewReceiptBtn = row.querySelector(".view-receipt-btn");

if (viewReceiptBtn && orderReceipt) {
    viewReceiptBtn.addEventListener("click", async () => {
        viewReceiptBtn.disabled = true;
        viewReceiptBtn.textContent = "Loading...";

        try {
            const response = await fetch(
                `${SUPABASE_URL}/storage/v1/object/sign/payment-receipts/${orderReceipt.receipt_path.split("/").map(encodeURIComponent).join("/")}`,
                {
                    method: "POST",
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ expiresIn: 60 })
                }
            );

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();

            if (!data.signedURL) {
                throw new Error("Signed URL unavailable");
            }

            const imageUrl = data.signedURL.startsWith("http")
    ? data.signedURL
    : `${SUPABASE_URL}/storage/v1${data.signedURL}`;

            const modal = document.getElementById("receiptModal");

document.getElementById("receiptOrderId").textContent =
    order.order_id;

document.getElementById("receiptSenderName").textContent =
    orderReceipt.sender_account_name || "—";

document.getElementById("receiptAmount").textContent =
    "Rs. " + Number(order.amount || 0).toLocaleString();

document.getElementById("adminReceiptImage").src = imageUrl;


const verifyBtn = document.getElementById("verifyReceiptBtn");
const holdBtn = document.getElementById("holdReceiptBtn");
const rejectBtn = document.getElementById("rejectReceiptBtn");

const receiptStatus = orderReceipt.status || "pending";

// Current receipt details popup ke saath store karo
modal.dataset.receiptId = String(orderReceipt.id);
modal.dataset.orderId = order.order_id;
modal.dataset.receiptStatus = receiptStatus;

const existingReason = document.getElementById("receiptReviewReason");
if (existingReason) existingReason.remove();

const reasonContainer = document.createElement("div");
reasonContainer.id = "receiptReviewReason";
reasonContainer.style.cssText = `
    display:grid;
    gap:10px;
    margin-top:12px;
`;

const holdReason = String(orderReceipt.hold_reason || "").trim();
const reviewReason = String(orderReceipt.review_reason || "").trim();

function addAdminReasonBox(title, reason, color) {
    if (!reason) return;

    const box = document.createElement("div");
    box.style.cssText = `
        padding:12px;
        background:#171717;
        border:1px solid ${color};
        border-left:4px solid ${color};
        border-radius:8px;
        color:#e5e7eb;
        font-size:13px;
        line-height:1.6;
        overflow-wrap:anywhere;
        white-space:pre-wrap;
    `;

    const heading = document.createElement("strong");
    heading.textContent = title;
    heading.style.color = color;

    const description = document.createElement("div");
    description.textContent = reason;
    description.style.marginTop = "5px";

    box.append(heading, description);
    reasonContainer.appendChild(box);
}

if (["on_hold", "unresolved", "rejected"].includes(receiptStatus)) {
    if (holdReason) {
        addAdminReasonBox(
            "🟠 Original Hold Reason",
            holdReason,
            "#fbbf24"
        );
    }

    if (receiptStatus === "rejected") {
        addAdminReasonBox(
            "❌ Final Rejection Reason",
            reviewReason,
            "#f87171"
        );
    } else if (!holdReason && reviewReason) {
        addAdminReasonBox(
            "🟠 Hold / Review Reason",
            reviewReason,
            "#fbbf24"
        );
    }
}

if (reasonContainer.childElementCount > 0) {
    document.getElementById("receiptSenderName")
        .parentElement.appendChild(reasonContainer);
}
const holdDetails = document.getElementById("receiptHoldDetails");
const holdStartEl = document.getElementById("receiptHoldStart");
const holdDeadlineEl = document.getElementById("receiptHoldDeadline");
const holdRemainingEl = document.getElementById("receiptHoldRemaining");

const holdStatuses = ["on_hold", "unresolved"];

if (
    holdStatuses.includes(receiptStatus) &&
    orderReceipt.hold_started_at &&
    orderReceipt.hold_deadline_at
) {
    const startDate = new Date(orderReceipt.hold_started_at);
    const deadlineDate = new Date(orderReceipt.hold_deadline_at);

    const formatDate = (date) =>
        date.toLocaleString("en-PK", {
            timeZone: "Asia/Karachi",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    holdStartEl.textContent = formatDate(startDate);
    holdDeadlineEl.textContent = formatDate(deadlineDate);

    const remainingMs = deadlineDate.getTime() - Date.now();

    if (receiptStatus === "unresolved") {
        holdRemainingEl.textContent = "Unresolved — Manual Review Required";
    } else if (remainingMs <= 0) {
        holdRemainingEl.textContent = "Deadline Passed — Review Required";
    } else {
        const remainingDays = Math.ceil(
            remainingMs / (1000 * 60 * 60 * 24)
        );

        holdRemainingEl.textContent =
            `${remainingDays} day(s) remaining`;
    }

    holdDetails.hidden = false;
} else {
    holdDetails.hidden = true;
}


verifyBtn.disabled = !["pending", "on_hold", "unresolved"].includes(receiptStatus);
holdBtn.disabled = receiptStatus !== "pending";
const unresolvedBtn = document.getElementById("unresolvedReceiptBtn");

const holdExpired =
    receiptStatus === "on_hold" &&
    orderReceipt.hold_deadline_at &&
    new Date(orderReceipt.hold_deadline_at).getTime() <= Date.now();

unresolvedBtn.hidden = !holdExpired;
unresolvedBtn.disabled = !holdExpired;
rejectBtn.disabled = !["pending", "on_hold", "unresolved"].includes(receiptStatus);

modal.hidden = false;


modal.hidden = false;

        } catch (error) {
            console.error("Receipt viewing error:", error);
            alert("Unable to open receipt.");
        } finally {
            viewReceiptBtn.disabled = false;
            viewReceiptBtn.textContent = "📄 View Receipt";
        }
    });
}
    const copyIdBtn = row.querySelector(".copy-poppo-id");

copyIdBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(copyIdBtn.dataset.poppoId);
        copyIdBtn.textContent = "✓";
        setTimeout(() => {
            copyIdBtn.textContent = "📋";
        }, 1500);
    } catch (error) {
        alert("ID copy nahi ho saki.");
    }
});

    const statusSelect = row.querySelector(".status-select");
    const acceptWhatsappBtn = row.querySelector(".accept-whatsapp-btn");
acceptWhatsappBtn?.addEventListener("click", async () => {

    if (order.status !== "pending") {
        alert("Sirf Pending orders accept ho sakte hain.");
        return;
    }

    acceptWhatsappBtn.disabled = true;
    acceptWhatsappBtn.textContent = "Loading Accounts...";

    try {
        // Load active Admin payment accounts
        const accountsResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/fh_payment_accounts?select=id,payment_method,account_title,account_number,bank_name&is_active=eq.true&owner_user_id=eq.f02e6f84-cce7-4838-8547-5b721a29f51f&order=id.asc`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!accountsResponse.ok) {
            throw new Error(await accountsResponse.text());
        }

        const accounts = await accountsResponse.json();

        if (!accounts.length) {
            alert("Koi active payment account nahi mila.");
            return;
        }

      
        // FH EMPIRE — Admin Payment Account Selection Popup
        const selectedAccounts = await new Promise(resolve => {
            const overlay = document.createElement("div");

            overlay.style.cssText = `
                position:fixed;
                inset:0;
                background:rgba(0,0,0,.78);
                display:flex;
                align-items:center;
                justify-content:center;
                z-index:999999;
                padding:16px;
            `;

            const modal = document.createElement("div");

            modal.style.cssText = `
                width:100%;
                max-width:480px;
                max-height:85vh;
                overflow-y:auto;
                background:#17191f;
                border:1px solid #b99443;
                border-radius:16px;
                padding:24px;
                color:#fff;
                box-shadow:0 20px 60px rgba(0,0,0,.5);
            `;

            const heading = document.createElement("h3");
            heading.textContent = "Select Payment Accounts";
            heading.style.cssText =
                "color:#ffcc33;margin:0 0 8px;";

            const subtitle = document.createElement("p");
            subtitle.textContent =
                `Order: ${order.order_id} | Select 1–3 accounts`;
            subtitle.style.cssText =
                "font-size:13px;color:#aab0ba;margin-bottom:18px;";

            const list = document.createElement("div");
            const checkboxes = [];

            accounts.forEach(account => {
                const label = document.createElement("label");

                label.style.cssText = `
                    display:flex;
                    gap:12px;
                    align-items:flex-start;
                    padding:14px;
                    margin-bottom:10px;
                    background:#232630;
                    border:1px solid #414550;
                    border-radius:10px;
                    cursor:pointer;
                `;

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = String(account.id);
                checkbox.style.cssText =
                    "width:18px;height:18px;accent-color:#d4aa42;flex-shrink:0;";

                const details = document.createElement("div");
                details.style.cssText =
                    "display:flex;flex-direction:column;gap:5px;min-width:0;";

                const method = document.createElement("strong");
                method.textContent = account.payment_method || "Account";
                method.style.color = "#ffcc33";

                const title = document.createElement("span");
                title.textContent = account.account_title || "—";

                const number = document.createElement("small");
                number.textContent =
                    account.account_number || account.bank_name || "—";
                number.style.color = "#aab0ba";

                details.append(method, title, number);
                label.append(checkbox, details);
                list.appendChild(label);
                checkboxes.push(checkbox);

                checkbox.addEventListener("change", () => {
                    const count = checkboxes.filter(c => c.checked).length;

                    if (count > 3) {
                        checkbox.checked = false;
                        alert("Maximum 3 payment accounts select kar sakte hain.");
                    }
                });
            });

            const buttons = document.createElement("div");
            buttons.style.cssText =
                "display:flex;gap:10px;margin-top:20px;";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.textContent = "Cancel";
            cancelBtn.style.cssText = `
                flex:1;padding:12px;
                background:#343741;color:#fff;
                border:0;border-radius:9px;cursor:pointer;
            `;

            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.textContent = "Continue";
            confirmBtn.style.cssText = `
                flex:1;padding:12px;
                background:linear-gradient(135deg,#ffdc70,#d7a72c);
                color:#171100;border:0;border-radius:9px;
                font-weight:bold;cursor:pointer;
            `;

            let finished = false;

            function close(result) {
                if (finished) return;
                finished = true;
                document.removeEventListener("keydown", onKeyDown);
                overlay.remove();
                resolve(result);
            }

            function onKeyDown(event) {
                if (event.key === "Escape") close(null);
            }

            cancelBtn.onclick = () => close(null);

            overlay.addEventListener("click", event => {
                if (event.target === overlay) close(null);
            });

            confirmBtn.onclick = () => {
                const selected = checkboxes
                    .filter(c => c.checked)
                    .map(c => accounts.find(
                        a => String(a.id) === c.value
                    ));

                if (selected.length < 1 || selected.length > 3) {
                    alert("Please select 1 to 3 payment accounts.");
                    return;
                }

                close(selected);
            };

            buttons.append(cancelBtn, confirmBtn);
            modal.append(heading, subtitle, list, buttons);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.addEventListener("keydown", onKeyDown);
        });

        if (!selectedAccounts) return;

        if (!confirm(
            `Accept Order ${order.order_id}?\n\n` +
            selectedAccounts.map(account =>
                `${account.payment_method} - ${account.account_title}`
            ).join("\n") +
            "\n\nCustomer ko 10 minutes milenge."
        )) {
            return;
        }


        // Secure atomic acceptance
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/accept_order_admin_multi`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`
                },
               body: JSON.stringify({
    p_order_id: order.order_id,
    p_payment_account_ids: selectedAccounts.map(account => account.id)
})
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const accepted = await response.json();

        if (!accepted) {
            alert("Order already accepted ya Pending nahi hai.");
            return;
        }

        alert("Order Accepted Successfully!");
        await loadOrders();

    } catch (error) {
        console.error("Accept Order error:", error);
        alert("Order accept nahi ho saka. Console check karo.");

    } finally {
        acceptWhatsappBtn.disabled = false;
        acceptWhatsappBtn.textContent = "Accept Order";
    }

});

    statusSelect.addEventListener("change", async function () {
    const newStatus = this.value;

    let cancelReason = null;

    // Cancelled ho to reason lena zaroori hai
    if (newStatus === "cancelled") {
        cancelReason = prompt(
            "Please enter cancellation reason for the customer:"
        );

        if (!cancelReason || !cancelReason.trim()) {
            alert("Cancellation reason is required.");
            await loadOrders();
            return;
        }

        cancelReason = cancelReason.trim();
    }

    const updateData = {
        status: newStatus,
        cancel_reason: newStatus === "cancelled" ? cancelReason : null
    };

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
            body: JSON.stringify(updateData)
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
const receiptModal = document.getElementById("receiptModal");
const closeReceiptModal = document.getElementById("closeReceiptModal");

function closeAdminReceiptModal() {
    receiptModal.hidden = true;
    document.getElementById("adminReceiptImage").removeAttribute("src");
}

closeReceiptModal.addEventListener("click", closeAdminReceiptModal);

receiptModal.addEventListener("click", (event) => {
    if (event.target === receiptModal) {
        closeAdminReceiptModal();
    }
});

/* =========================================
   FH EMPIRE - SECURE PAYMENT REVIEW
========================================= */

const verifyReceiptBtn = document.getElementById("verifyReceiptBtn");
const holdReceiptBtn = document.getElementById("holdReceiptBtn");
const rejectReceiptBtn = document.getElementById("rejectReceiptBtn");

let paymentReviewInProgress = false;

async function reviewReceiptPayment(decision) {
    if (paymentReviewInProgress) return;

    const receiptId = Number(receiptModal.dataset.receiptId);
    const orderId = receiptModal.dataset.orderId;
    const currentStatus = receiptModal.dataset.receiptStatus;

    if (!Number.isSafeInteger(receiptId) || receiptId <= 0) {
        alert("Invalid receipt ID.");
        return;
    }

  const allowed = {
    pending: ["verified", "on_hold", "rejected"],
    on_hold: ["verified", "rejected", "unresolved"],
    unresolved: ["verified", "rejected"],
    
};

    if (!allowed[currentStatus]?.includes(decision)) {
        alert("This payment action is not allowed.");
        return;
    }

    const messages = {
    verified:
        `Order ${orderId}\n\nHave you independently confirmed receiving the payment in FH EMPIRE's account?`,

    on_hold:
        `Order ${orderId}\n\nPut this payment on hold for 27 days?`,

    rejected:
        `Order ${orderId}\n\nReject this payment? This action cannot be reversed.`,

    unresolved:
        `Order ${orderId}\n\n27-day hold period complete ho chuka hai?\n\nMark this payment as Unresolved Dispute?`
};

    if (!confirm(messages[decision])) return;

    paymentReviewInProgress = true;

    verifyReceiptBtn.disabled = true;
    holdReceiptBtn.disabled = true;
    rejectReceiptBtn.disabled = true;
    unresolvedReceiptBtn.disabled = true;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/review_order_payment`,
            {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    p_receipt_id: receiptId,
                    p_decision: decision
                })
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const success = await response.json();

        if (success !== true) {
            throw new Error("Payment status was not updated.");
        }

        const labels = {
            verified: "Payment verified successfully.",
            on_hold: "Payment placed on hold.",
            rejected: "Payment receipt rejected."
        };

        alert(labels[decision]);

        closeAdminReceiptModal();
        await loadOrders();

    } catch (error) {
        console.error("Payment review error:", error);
        alert("Payment review failed. Please check the console.");

        if (!receiptModal.hidden) {
            const status = receiptModal.dataset.receiptStatus;

            verifyReceiptBtn.disabled =
                !["pending", "on_hold", "unresolved"].includes(status);

            holdReceiptBtn.disabled = status !== "pending";

            rejectReceiptBtn.disabled =
                !["pending", "on_hold", "unresolved"].includes(status);
           const deadline = receiptModal.dataset.holdDeadline;

unresolvedReceiptBtn.disabled = !(
    status === "on_hold" &&
    deadline &&
    new Date(deadline).getTime() <= Date.now()
);
        }
    } finally {
        paymentReviewInProgress = false;
    }
}

verifyReceiptBtn.addEventListener("click", () => {
    reviewReceiptPayment("verified");
});

holdReceiptBtn.addEventListener("click", () => {
    reviewReceiptPayment("on_hold");
});

rejectReceiptBtn.addEventListener("click", () => {
    reviewReceiptPayment("rejected");
});
const unresolvedReceiptBtn =
    document.getElementById("unresolvedReceiptBtn");

unresolvedReceiptBtn.addEventListener("click", () => {
    if (paymentReviewInProgress) return;

    const deadline = receiptModal.dataset.holdDeadline;

    if (
        receiptModal.dataset.receiptStatus !== "on_hold" ||
        !deadline ||
        new Date(deadline).getTime() > Date.now()
    ) {
        alert("27-day hold deadline abhi complete nahi hui.");
        return;
    }

    reviewReceiptPayment("unresolved");
});
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
/* =========================================
   ENABLE NOTIFICATIONS
========================================= */


const VAPID_PUBLIC_KEY = "BJdm1LjY9h2kVkB4U1ybIispwPpWQPZ6xlM3E_hfymiijjYy2lXVA1Xm0EjTXPn7R5EevbQRGPm3qsx8GojglbE";
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(char => char.charCodeAt(0))
    );
}

const enableNotificationsBtn =
    document.getElementById("enableNotificationsBtn");

if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener("click", async () => {
        try {
            const permission = await Notification.requestPermission();

            if (permission !== "granted") {
                alert("Please allow notifications.");
                return;
            }

            const registration = await navigator.serviceWorker.register("sw.js");
            await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey:
                        urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            const data = subscription.toJSON();

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/push_subscriptions`,
                {
                    method: "POST",
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    body: JSON.stringify({
                        endpoint: data.endpoint,
                        p256dh: data.keys.p256dh,
                        auth: data.keys.auth
                    })
                }
            );

            if (!response.ok) {
                throw new Error(await response.text());
            }

            enableNotificationsBtn.textContent = "🔔 Notifications Enabled";
            enableNotificationsBtn.disabled = true;

            alert("Push notifications enabled successfully ✅");

        } catch (error) {
            console.error("Push notification error:", error);
            alert("Error! F12 Console check karo.");
        }
    });
}
// Admin Order Search
const orderSearch = document.getElementById("orderSearch");

if (orderSearch) {
    orderSearch.addEventListener("input", function () {
        const searchValue = this.value.toLowerCase().trim();
        const rows = document.querySelectorAll(".admin-table tbody tr");

        rows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();

            if (rowText.includes(searchValue)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
}
// FH EMPIRE - Orders Table Top Scrollbar

const ordersTopScroll = document.getElementById("ordersTopScroll");
const ordersTopScrollInner = document.getElementById("ordersTopScrollInner");
const ordersTableWrapper = document.querySelector(".admin-table-wrapper");

if (ordersTopScroll && ordersTopScrollInner && ordersTableWrapper) {

    function syncOrdersScrollWidth() {
        ordersTopScrollInner.style.width =
            ordersTableWrapper.scrollWidth + "px";
    }

    ordersTopScroll.addEventListener("scroll", () => {
        ordersTableWrapper.scrollLeft = ordersTopScroll.scrollLeft;
    });

    ordersTableWrapper.addEventListener("scroll", () => {
        ordersTopScroll.scrollLeft = ordersTableWrapper.scrollLeft;
    });

    new ResizeObserver(syncOrdersScrollWidth).observe(ordersTableWrapper);
    new ResizeObserver(syncOrdersScrollWidth).observe(
        ordersTableWrapper.querySelector("table")
    );

    syncOrdersScrollWidth();
}

/* ==========================================
   FH EMPIRE — ADMIN ORDER AVAILABILITY
========================================== */

const ADMIN_AVAILABILITY_ENDPOINT =
  "https://vmllowldjzwmzsvxccui.supabase.co/functions/v1/admin-order-availability";

let adminAvailabilityBusy = false;

function renderAdminAvailability(settings) {
  const active = settings.admin_is_active === true;

  const activeBtn = document.getElementById("adminActiveBtn");
  const inactiveBtn = document.getElementById("adminInactiveBtn");
  const status = document.getElementById("adminAvailabilityStatus");

  if (!activeBtn || !inactiveBtn || !status) return;

  activeBtn.disabled = adminAvailabilityBusy || active;
  inactiveBtn.disabled = adminAvailabilityBusy || !active;

  activeBtn.style.background = active ? "#14532d" : "transparent";
  activeBtn.style.color = active ? "#4ade80" : "#aaa";

  inactiveBtn.style.background = !active ? "#7f1d1d" : "transparent";
  inactiveBtn.style.color = !active ? "#fca5a5" : "#aaa";

  status.style.color = active ? "#4ade80" : "#fca5a5";
  status.textContent = active
    ? "🟢 ACTIVE — Admin gets 2-minute priority."
    : "🔴 INACTIVE — New orders go directly to Assistants.";


activeBtn.classList.toggle("is-active", active);
inactiveBtn.classList.toggle("is-inactive", !active);

const badge = document.getElementById("adminAvailabilityBadge");

if (badge) {
  badge.textContent = active ? "● ACTIVE" : "● INACTIVE";

  badge.style.background = active ? "#123b28" : "#40191b";
  badge.style.color = active ? "#4ade80" : "#fca5a5";
}
}

async function adminAvailabilityRequest(action, active) {
  const token = localStorage.getItem("fh_admin_access_token");

  if (!token) {
    throw new Error("Admin login required.");
  }

  const response = await fetch(ADMIN_AVAILABILITY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(
      action === "set"
        ? { action, active }
        : { action }
    )
  });

  const result = await response.json();

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.error || "Availability request failed."
    );
  }

  return result.settings;
}

async function loadAdminAvailability() {
  const status = document.getElementById("adminAvailabilityStatus");
  if (!status) return;

  adminAvailabilityBusy = true;

  try {
    const settings = await adminAvailabilityRequest("get");
    adminAvailabilityBusy = false;
    renderAdminAvailability(settings);
  } catch (error) {
    adminAvailabilityBusy = false;
    status.style.color = "#fca5a5";
    status.textContent = "⚠️ " + error.message;
  }
}

async function setAdminAvailability(active) {
  if (adminAvailabilityBusy) return;

  const activeBtn = document.getElementById("adminActiveBtn");
  const inactiveBtn = document.getElementById("adminInactiveBtn");
  const status = document.getElementById("adminAvailabilityStatus");

  adminAvailabilityBusy = true;
  activeBtn.disabled = true;
  inactiveBtn.disabled = true;
  status.textContent = "Updating availability...";

  try {
    const settings = await adminAvailabilityRequest("set", active);
    adminAvailabilityBusy = false;
    renderAdminAvailability(settings);
  } catch (error) {
    adminAvailabilityBusy = false;
    status.style.color = "#fca5a5";
    status.textContent = "⚠️ " + error.message;
    await loadAdminAvailability();
  }
}

document.getElementById("adminActiveBtn")
  ?.addEventListener("click", () => setAdminAvailability(true));

document.getElementById("adminInactiveBtn")
  ?.addEventListener("click", () => setAdminAvailability(false));

loadAdminAvailability();


/* ==========================================
   FH EMPIRE — ADMIN ORDERS AUTO REFRESH
========================================== */

let fhOrdersRefreshBusy = false;

async function refreshAdminOrders() {
    if (document.hidden || fhOrdersRefreshBusy) return;

    const receiptModal = document.getElementById("receiptModal");

    // Do not interrupt payment receipt review.
    if (receiptModal && !receiptModal.hidden) return;

    fhOrdersRefreshBusy = true;

    try {
        await loadOrders();
    } catch (error) {
        console.error("Admin orders auto-refresh failed:", error);
    } finally {
        fhOrdersRefreshBusy = false;
    }
}

// Check for new orders every 5 seconds.
setInterval(refreshAdminOrders, 5000);

// Refresh immediately when returning to Admin Panel.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshAdminOrders();
    }
});

// Refresh when browser window gets focus.
window.addEventListener("focus", refreshAdminOrders);
