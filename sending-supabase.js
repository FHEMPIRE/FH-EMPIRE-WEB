
const FH_SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const FH_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";
// Supabase REST API connection
const FH_SENDING_API = `${FH_SUPABASE_URL}/rest/v1`;

function getSendingAdminToken() {
  return localStorage.getItem("fh_admin_access_token");
}
async function fhSendingRequest(table, options = {}) {
  const token = getSendingAdminToken();

  function redirectToAdmin() {
    window.location.replace("admin.html");
  }

  if (!token) {
    redirectToAdmin();
    throw new Error("Admin session expired. Redirecting...");
  }

  const response = await fetch(`${FH_SENDING_API}/${table}`, {
    ...options,
    headers: {
      apikey: FH_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    redirectToAdmin();
    throw new Error("Admin session expired. Redirecting...");
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  if (response.status === 204) return null;

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
async function fhLoadHosts() {
  const rows = await fhSendingRequest(
    "fh_sending_hosts?select=poppo_id,host_name,host_type,is_active&order=created_at.asc",
    { method: "GET" }
  );

  return rows.map(row => ({
    id: row.poppo_id,
    name: row.host_name,
    type: row.host_type,
    isActive: row.is_active !== false
  }));
}


async function fhSaveHost(host) {
  return fhSendingRequest("fh_sending_hosts?on_conflict=poppo_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      poppo_id: host.id,
      host_name: host.name,
      host_type: host.type,
is_active: host.isActive !== false
    })
  });
}

async function fhDeleteHost(poppoId) {
  return fhSendingRequest(
    `fh_sending_hosts?poppo_id=eq.${encodeURIComponent(poppoId)}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=representation"
      }
    }
  );
}

async function fhSaveSendingRecord(record, host) {
  if (!host) {
    throw new Error("Host details are missing.");
  }

  return fhSendingRequest(
    "fh_sending_records?on_conflict=local_record_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        local_record_id: record.id,
        host_poppo_id: host.id,
        host_name: host.name,
        host_type: host.type,
        sending_date: record.date,
        sending: record.sending,
        purchase_rate: record.purchaseRate,
        purchase_cost: record.purchaseCost,
        selling_rate: record.sellingRate,
        sale_status: record.saleStatus,
        coins_sold: record.coinsSold,
        sale_amount: record.saleAmount
      })
    }
  );
}

async function fhLoadSendingRecords() {
  const rows = await fhSendingRequest(
    "fh_sending_records?select=*&order=created_at.asc",
    { method: "GET" }
  );

  return rows.map(row => ({
    id: row.local_record_id,
    hostId: row.host_poppo_id,
    hostName: row.host_name,
    hostType: row.host_type,
    date: row.sending_date,
    sending: Number(row.sending),
    purchaseRate: Number(row.purchase_rate || 0),
    purchaseCost: Number(row.purchase_cost || 0),
    saleStatus: row.sale_status,
    coinsSold: Number(row.coins_sold || 0),
    sellingRate: Number(row.selling_rate || 0),
    saleAmount: Number(row.sale_amount || 0)
  }));
}

async function fhDeleteSendingRecord(recordId) {
  if (!recordId) {
    throw new Error("Sending record ID is missing.");
  }

  const result = await fhSendingRequest(
    `fh_sending_records?local_record_id=eq.${encodeURIComponent(recordId)}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=representation"
      }
    }
  );

  if (!Array.isArray(result) || result.length !== 1) {
    throw new Error("Sending record was not found or could not be deleted.");
  }

  return result;
}

async function fhSaveRocketEsportsHost(host) {
  return fhSendingRequest(
   "fh_rocket_esports_hosts",
    {
      method: "POST",
      headers: {
       Prefer: "return=representation"
      },
      body: JSON.stringify({
        poppo_id: host.id,
        host_name: host.name,
        host_category: host.category,
        receiving_target: host.receivingTarget,
        sending_target: host.sendingTarget,
        charge_rate: host.chargeRate,
        whatsapp_number: host.whatsappNumber || null,
        is_active: host.isActive
      })
    }
  );
}
async function fhSaveRocketEsportsHost(host) {
  return fhSendingRequest(
    "fh_rocket_esports_hosts?on_conflict=poppo_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({
        poppo_id: host.id,
        host_name: host.name,
        host_category: host.category,
        receiving_target: host.receivingTarget,
        sending_target: host.sendingTarget,
        charge_rate: host.chargeRate,
        is_active: host.isActive
      })
    }
  );
}
async function fhLoadRocketEsportsHosts() {
  const rows = await fhSendingRequest(
   "fh_rocket_esports_hosts?select=poppo_id,host_name,host_category,receiving_target,sending_target,charge_rate,whatsapp_number,is_active&order=created_at.asc",
    { method: "GET" }
  );

  return rows.map(row => ({
    id: row.poppo_id,
    name: row.host_name,
    category: row.host_category,
    receivingTarget: Number(row.receiving_target),
    sendingTarget: Number(row.sending_target),
    chargeRate: Number(row.charge_rate),
    whatsappNumber: row.whatsapp_number || "",
    isActive: row.is_active !== false
  }));
}

async function fhUpdateRocketEsportsHost(poppoId, changes) {
  const allowedFields = [
    "host_category",
    "receiving_target",
    "sending_target",
    "charge_rate",
    "whatsapp_number",
    "is_active"
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(changes, field)) {
      updates[field] = changes[field];
    }
  }

  if (!Object.keys(updates).length) {
    throw new Error("No valid changes provided.");
  }

  updates.updated_at = new Date().toISOString();

  const rows = await fhSendingRequest(
    "fh_rocket_esports_hosts?poppo_id=eq." +
      encodeURIComponent(poppoId) +
      "&select=poppo_id",
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify(updates)
    }
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Host update failed or host not found.");
  }

  return rows[0];
}

/* ==========================================
   FH EMPIRE — ROCKET WEEKLY RECORDS
   ========================================== */

// Poppo week starts Monday 00:00 UTC+8
// Pakistan: Sunday 09:00 PM

function fhGetPoppoWeek(date = new Date()) {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const POPPO_OFFSET = 8 * 60 * 60 * 1000;

  const shifted = new Date(date.getTime() + POPPO_OFFSET);

  const day = shifted.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  const startMs =
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate()
    ) -
    daysSinceMonday * DAY_MS;

  const start = new Date(startMs);
  const end = new Date(startMs + WEEK_MS - DAY_MS);

  const formatDate = d => d.toISOString().slice(0, 10);

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

// Get existing weekly record
async function fhLoadRocketWeeklyRecord(poppoId, weekStart) {
  const rows = await fhSendingRequest(
    "fh_rocket_weekly_records" +
      "?poppo_id=eq." + encodeURIComponent(poppoId) +
      "&week_start=eq." + encodeURIComponent(weekStart) +
      "&select=*",
    { method: "GET" }
  );

  return rows[0] || null;
}

// Create weekly snapshot only if missing
async function fhGetOrCreateRocketWeeklyRecord(
  host,
  selectedWeek = null
) {
  const week = selectedWeek || fhGetPoppoWeek();

  if (!week.start || !week.end) {
    throw new Error("Invalid selected week.");
  }
  const existing = await fhLoadRocketWeeklyRecord(
    host.id,
    week.start
  );

  if (existing) return existing;

  const rows = await fhSendingRequest(
    "fh_rocket_weekly_records?on_conflict=poppo_id,week_start",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates,return=representation"
      },
      body: JSON.stringify({
        poppo_id: host.id,
        week_start: week.start,
        week_end: week.end,
        receiving_target: host.receivingTarget,
        sending_target: host.sendingTarget,
        charge_rate: host.chargeRate
      })
    }
  );

  if (Array.isArray(rows) && rows.length) {
    return rows[0];
  }

  const saved = await fhLoadRocketWeeklyRecord(
    host.id,
    week.start
  );

  if (!saved) {
    throw new Error("Weekly record could not be created.");
  }

  return saved;
}

/* ==========================================
   FH EMPIRE — ROCKET TRANSACTIONS
   ========================================== */

// Save confirmed sending OR random receiving
async function fhAddRocketTransaction(weeklyRecordId, type, amount, notes = "", requestId = null) {
  if (!["sending", "random_receiving"].includes(type)) {
    throw new Error("Invalid transaction type.");
  }

  const value = Number(amount);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Enter a valid positive whole number.");
  }

  if (type === "sending" && value % 10000 !== 0) {
    throw new Error("Sending must be in multiples of 10,000 coins.");
  }

  const sendingCoins = type === "sending" ? value : 0;
  const receivingPoints = type === "sending" ? value * 0.70 : value;

  // Load saved weekly charge rate (not current host rate)
  const weeklyRows = await fhSendingRequest(
    "fh_rocket_weekly_records?id=eq." +
      encodeURIComponent(weeklyRecordId) +
      "&select=id,charge_rate",
    { method: "GET" }
  );

  if (!weeklyRows.length) {
    throw new Error("Weekly record not found.");
  }

  const chargeRate = Number(weeklyRows[0].charge_rate);
  const sendingCharge =
    type === "sending" ? (sendingCoins / 100000) * chargeRate : 0;

  const rows = await fhSendingRequest(
    "fh_rocket_transactions",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        weekly_record_id: weeklyRecordId,
        transaction_type: type,
        sending_coins: sendingCoins,
        receiving_points: receivingPoints,
        sending_charge: sendingCharge,
        notes: notes,
request_id: requestId
      })
    }
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Transaction could not be saved.");
  }

  return rows[0];
}

async function fhUpdateRocketSending(transactionId, newCoins) {
  const coins = Number(newCoins);

  if (
    !Number.isSafeInteger(coins) ||
    coins <= 0 ||
    coins % 10000 !== 0
  ) {
    throw new Error(
      "Sending must be a positive multiple of 10,000 coins."
    );
  }

  if (!transactionId) {
    throw new Error("Transaction ID is required.");
  }

  const existing = await fhSendingRequest(
    "fh_rocket_transactions?id=eq." +
      encodeURIComponent(transactionId) +
      "&select=id,weekly_record_id,transaction_type,sending_coins",
    { method: "GET" }
  );

  if (
    existing.length !== 1 ||
    existing[0].transaction_type !== "sending"
  ) {
    throw new Error("Sending transaction not found.");
  }

  const weeklyRows = await fhSendingRequest(
    "fh_rocket_weekly_records?id=eq." +
      encodeURIComponent(existing[0].weekly_record_id) +
      "&select=id,charge_rate",
    { method: "GET" }
  );

  if (weeklyRows.length !== 1) {
    throw new Error("Weekly record not found.");
  }

  const chargeRate = Number(weeklyRows[0].charge_rate);

  if (!Number.isFinite(chargeRate) || chargeRate < 0) {
    throw new Error("Invalid weekly charge rate.");
  }

  const updated = await fhSendingRequest(
    "fh_rocket_transactions?id=eq." +
      encodeURIComponent(transactionId) +
      "&transaction_type=eq.sending" +
      "&sending_coins=eq." +
      encodeURIComponent(existing[0].sending_coins),
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        sending_coins: coins,
        receiving_points: coins * 0.70,
        sending_charge: (coins / 100000) * chargeRate
      })
    }
  );

  if (!Array.isArray(updated) || updated.length !== 1) {
    throw new Error(
      "Update could not be verified. Refresh records before retrying."
    );
  }

  return updated[0];
}

// Load all transactions for one host/week
async function fhLoadRocketTransactions(weeklyRecordId) {
  return fhSendingRequest(
    "fh_rocket_transactions" +
      "?weekly_record_id=eq." +
      encodeURIComponent(weeklyRecordId) +
      "&select=*" +
      "&order=transaction_date.asc",
    { method: "GET" }
  );
}

// Calculate weekly totals
function fhCalculateRocketWeeklyTotals(weeklyRecord, transactions) {
  const sendingTransactions = transactions.filter(
    t => t.transaction_type === "sending"
  );

  const sendingCoins = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.sending_coins || 0), 0
  );

  const sendingPoints = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.receiving_points || 0), 0
  );

  const randomPoints = transactions
    .filter(t => t.transaction_type === "random_receiving")
    .reduce((sum, t) => sum + Number(t.receiving_points || 0), 0);

  const sendingCharges = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.sending_charge || 0), 0
  );

  const totalReceivingPoints = sendingPoints + randomPoints;
  const receivingTargetPoints =
    Number(weeklyRecord.receiving_target) * 10000;

  const remainingPoints = Math.max(
    0,
    receivingTargetPoints - totalReceivingPoints
  );

  const remainingSendingCoins = remainingPoints === 0
    ? 0
    : Math.ceil(remainingPoints / 7000) * 10000;

  return {
    sendingCoins,
    sendingPoints,
    randomPoints,
    totalReceivingPoints,
    receivingUSD: totalReceivingPoints / 10000,
    sendingUSD: sendingPoints / 10000,
    sendingCharges,
    remainingPoints,
    remainingSendingCoins,
    status: totalReceivingPoints >= receivingTargetPoints
      ? "target_completed"
      : totalReceivingPoints > 0
        ? "in_progress"
        : "not_started"
  };
}

/* ==========================================
   FH EMPIRE — ROCKET WITHDRAWAL CALCULATOR
   ========================================== */

// Calculate withdrawal using confirmed sending only.
// Does not save or change any database records.
function fhCalculateRocketWithdrawal(
  withdrawalUSD,
  pkrRate,
  transactions
) {
  const withdrawal = Number(withdrawalUSD);
  const rate = Number(pkrRate);

  if (!Number.isFinite(withdrawal) || withdrawal < 0) {
    throw new Error("Invalid withdrawal USD.");
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid PKR rate.");
  }

  if (!Array.isArray(transactions)) {
    throw new Error("Transactions must be an array.");
  }

  const sendingTransactions = transactions.filter(
    t => t.transaction_type === "sending"
  );

  const sendingCoins = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.sending_coins || 0),
    0
  );

  const sendingPoints = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.receiving_points || 0),
    0
  );

  const sendingCharges = sendingTransactions.reduce(
    (sum, t) => sum + Number(t.sending_charge || 0),
    0
  );

  const sendingUSD = sendingPoints / 10000;
  const remainingUSD = withdrawal - sendingUSD;
  const grossPKR = remainingUSD * rate;
  const finalPayable = grossPKR - sendingCharges;

  return {
    withdrawalUSD: withdrawal,
    sendingCoins,
    sendingPoints,
    sendingUSD,
    remainingUSD,
    pkrRate: rate,
    grossPKR,
    sendingCharges,
    finalPayable
  };
}

// Save a withdrawal settlement after admin confirmation.
async function fhSaveRocketSettlement(
  weeklyRecordId,
  calculation
) {
  if (!weeklyRecordId || !calculation) {
    throw new Error("Missing settlement information.");
  }

  const rows = await fhSendingRequest(
    "fh_rocket_settlements",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        weekly_record_id: weeklyRecordId,
        withdrawal_usd: calculation.withdrawalUSD,
        usd_pkr_rate: calculation.pkrRate,
        sending_usd: calculation.sendingUSD,
        sending_charges: calculation.sendingCharges,
        final_payable: calculation.finalPayable,
        payment_status: "calculation_ready"
      })
    }
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("Settlement could not be saved.");
  }

  return rows[0];
}

// Load settlement history for a host/week.
async function fhLoadRocketSettlements(weeklyRecordId) {
  return fhSendingRequest(
    "fh_rocket_settlements" +
      "?weekly_record_id=eq." +
      encodeURIComponent(weeklyRecordId) +
      "&select=*" +
      "&order=withdrawal_date.desc",
    { method: "GET" }
  );
}


