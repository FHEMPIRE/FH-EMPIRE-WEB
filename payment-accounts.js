// FH EMPIRE - Payment Accounts Management

const PAYMENT_SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const PAYMENT_SUPABASE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";

const paymentAccessToken = localStorage.getItem("fh_admin_access_token");

if (!paymentAccessToken) {
    window.location.href = "login.html";
}

const paymentAccountForm = document.getElementById("paymentAccountForm");
const paymentFormMessage = document.getElementById("paymentFormMessage");
const paymentAccountsList = document.getElementById("paymentAccountsList");
// Save Payment Account
paymentAccountForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const method = document.getElementById("paymentMethod").value;
    const title = document.getElementById("accountTitle").value.trim();
    const number = document.getElementById("accountNumber").value.trim();
    const iban = document.getElementById("accountIban").value.trim();
    const bank = document.getElementById("bankName").value.trim();
    const ownerType = document.getElementById("accountOwnerType").value;
    const assistantId = document.getElementById("accountAssistantId").value;

    if (ownerType === "assistant" && !assistantId) {
        paymentFormMessage.textContent = "Please select an assistant.";
        return;
    }

    paymentFormMessage.textContent = "Saving account...";

    try {
        const response = await fetch(
            `${PAYMENT_SUPABASE_URL}/rest/v1/fh_payment_accounts`,
            {
                method: "POST",
                headers: {
                    "apikey": PAYMENT_SUPABASE_KEY,
                    "Authorization": `Bearer ${paymentAccessToken}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    owner_user_id: ownerType === "assistant"
                        ? assistantId
                        : "f02e6f84-cce7-4838-8547-5b721a29f51f",
                    payment_method: method,
                    account_title: title,
                    account_number: number || null,
                    iban: iban || null,
                    bank_name: bank || null,
                    is_active: true
                })
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        paymentFormMessage.textContent = "Account saved successfully!";
        paymentAccountForm.reset();
await loadPaymentAccounts();

    } catch (error) {
        console.error("Payment account save error:", error);
        paymentFormMessage.textContent = "Account save failed. Check console.";
    }
});
// Load Saved Payment Accounts
async function loadPaymentAccounts() {
    paymentAccountsList.textContent = "Loading accounts...";

    try {
        const response = await fetch(
            `${PAYMENT_SUPABASE_URL}/rest/v1/fh_payment_accounts?select=*&order=created_at.desc`,
            {
                headers: {
                    "apikey": PAYMENT_SUPABASE_KEY,
                    "Authorization": `Bearer ${paymentAccessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const accounts = await response.json();
        paymentAccountsList.replaceChildren();

        if (!accounts.length) {
            paymentAccountsList.textContent = "No payment accounts added yet.";
            return;
        }

        accounts.forEach(account => {
            const card = document.createElement("div");

            card.style.cssText = `
                padding:15px;
                margin:12px 0;
                background:#0c0c0c;
                border:1px solid #444;
                border-radius:10px;
                line-height:1.9;
            `;

            const details = [
                ["Method", account.payment_method],
                ["Account Title", account.account_title],
                ["Account Number", account.account_number],
                ["IBAN", account.iban],
                ["Bank", account.bank_name],
                ["Account For",
    account.owner_user_id === "f02e6f84-cce7-4838-8547-5b721a29f51f"
        ? "Admin"
        : "Assistant"
],
                ["Status", account.is_active ? "Active" : "Inactive"]
            ];

            details.forEach(([label, value]) => {
                if (value === null || value === undefined || value === "") return;

                const line = document.createElement("div");
                const heading = document.createElement("strong");
                heading.textContent = `${label}: `;
                line.append(heading, document.createTextNode(String(value)));
                card.appendChild(line);
            });

            const toggleBtn = document.createElement("button");
            toggleBtn.className = "payment-btn";
            toggleBtn.style.marginTop = "10px";
            toggleBtn.textContent = account.is_active
                ? "Deactivate"
                : "Activate";

            toggleBtn.addEventListener("click", async () => {
                toggleBtn.disabled = true;

                try {
                    const updateResponse = await fetch(
                        `${PAYMENT_SUPABASE_URL}/rest/v1/fh_payment_accounts?id=eq.${account.id}`,
                        {
                            method: "PATCH",
                            headers: {
                                "apikey": PAYMENT_SUPABASE_KEY,
                                "Authorization": `Bearer ${paymentAccessToken}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                is_active: !account.is_active
                            })
                        }
                    );

                    if (!updateResponse.ok) {
                        throw new Error(await updateResponse.text());
                    }

                    await loadPaymentAccounts();

                } catch (error) {
                    console.error("Account status error:", error);
                    alert("Account status update failed.");
                    toggleBtn.disabled = false;
                }
            });

            card.appendChild(toggleBtn);
            const deleteBtn = document.createElement("button");

deleteBtn.className = "payment-btn";
deleteBtn.textContent = "🗑 Delete Account";
deleteBtn.style.cssText = `
    margin:10px 0 0 10px;
    background:#8b2020;
    color:white;
`;

deleteBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to permanently delete this payment account?")) {
        return;
    }

    deleteBtn.disabled = true;

    try {
        const response = await fetch(
            `${PAYMENT_SUPABASE_URL}/rest/v1/fh_payment_accounts?id=eq.${account.id}`,
            {
                method: "DELETE",
                headers: {
                    "apikey": PAYMENT_SUPABASE_KEY,
                    "Authorization": `Bearer ${paymentAccessToken}`,
                    "Prefer": "return=representation"
                }
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const deleted = await response.json();

        if (!deleted.length) {
            throw new Error("Account was not deleted.");
        }

        await loadPaymentAccounts();

    } catch (error) {
        console.error("Delete account error:", error);
        alert("Account delete nahi ho saka.");
        deleteBtn.disabled = false;
    }
});

card.appendChild(deleteBtn);
            paymentAccountsList.appendChild(card);
        });

    } catch (error) {
        console.error("Load payment accounts error:", error);
        paymentAccountsList.textContent = "Unable to load accounts.";
    }
}

loadPaymentAccounts();


/* ==========================================
   FH EMPIRE - ASSISTANT PAYMENT ACCOUNT LINK
========================================== */

let paymentAssistants = [];

async function loadPaymentAssistants() {
    const assistantSelect =
        document.getElementById("accountAssistantId");

    assistantSelect.innerHTML =
        '<option value="">Loading assistants...</option>';

    assistantSelect.disabled = true;

    try {
        const token = localStorage.getItem(
            "fh_admin_access_token"
        );

        const response = await fetch(
            `${PAYMENT_SUPABASE_URL}/functions/v1/manage-assistants`,
            {
                method: "POST",
                headers: {
                    "apikey": PAYMENT_SUPABASE_KEY,
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "list"
                })
            }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(
                result.error || "Failed to load assistants"
            );
        }

        // Support both array and wrapped response formats.
        const assistants = Array.isArray(result)
            ? result
            : Array.isArray(result.assistants)
                ? result.assistants
                : Array.isArray(result.data)
                    ? result.data
                    : null;

        if (!assistants) {
            throw new Error(
                "Unexpected assistant list response format"
            );
        }

        paymentAssistants = assistants.filter(
            assistant => assistant.is_active === true
        );

        assistantSelect.replaceChildren();

        const placeholder = new Option(
            "Select Assistant",
            ""
        );

        assistantSelect.add(placeholder);

        paymentAssistants.forEach(assistant => {
            const name =
                assistant.assistant_name ||
                assistant.display_name ||
                assistant.login_id ||
                "Unnamed Assistant";

            const poppoId = assistant.poppo_id
                ? ` | Poppo ID: ${assistant.poppo_id}`
                : "";

            assistantSelect.add(
                new Option(
                    `${name}${poppoId}`,
                    assistant.id
                )
            );
        });

        if (!paymentAssistants.length) {
            assistantSelect.options[0].text =
                "No active assistants found";
        }

        assistantSelect.disabled = false;

        console.log(
            "Payment assistants loaded:",
            paymentAssistants.length
        );

    } catch (error) {
        console.error(
            "Assistant loading error:",
            error
        );

        assistantSelect.replaceChildren(
            new Option(
                "Unable to load assistants",
                ""
            )
        );

        document.getElementById(
            "paymentFormMessage"
        ).textContent =
            "Assistant list load nahi hui: " + error.message;
    }
}

loadPaymentAssistants();
