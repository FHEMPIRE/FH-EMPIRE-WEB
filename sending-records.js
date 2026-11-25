
/* FH EMPIRE — Step 2: Paid Sending Records */
(() => {
  "use strict";

 const HOST_KEY = "fh_optimizer_new_hosts_v1";
  const RECORD_KEY = "fh_empire_sending_records_v1";
  const $ = id => document.getElementById(id);

 const number = value =>
  Number(String(value).replace(/,/g, "")) || 0;
  const format = value => Number(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2
  });

  function load(key, fallback = []) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(data) ? data : fallback;
    } catch {
      return fallback;
    }
  }

  function hosts() {
    return load(HOST_KEY);
  }

  function records() {
    return load(RECORD_KEY);
  }

  function save(recordsList) {
    localStorage.setItem(RECORD_KEY, JSON.stringify(recordsList));
  }

  function poppoToday() {
    return new Date(Date.now() + 8 * 3600000)
      .toISOString().slice(0, 10);
  }

  function dateShift(date, days) {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function showMessage(text, error = false) {
    const el = $("sendingMessage");
    el.textContent = text;
    el.style.color = error ? "#f87171" : "#4ade80";
  }

  function refreshHosts() {
    const select = $("sendingHost");
    const selected = select.value;
    select.replaceChildren();

   for (const host of hosts().filter(h => h.isActive !== false)) {
      const option = document.createElement("option");
      option.value = host.id;
     option.textContent = `${host.name} (${host.id})`;
      select.append(option);
    }

    if ([...select.options].some(o => o.value === selected)) {
      select.value = selected;
    }
  }

  function preview() {
    const sending = number($("sendingPoints").value);
    const normal = calculateNormalCoins(sending);
    updateRewardPreview();

$("normalHostGross").textContent =
  "$" + normal.hostGrossUSD.toFixed(2);

$("normalHostFee").textContent =
  "$" + normal.hostFee.toFixed(2);

$("normalHostNet").textContent =
  "$" + normal.hostNetUSD.toFixed(2);

$("normalAgencyUSD").textContent =
  "$" + normal.agencyUSD.toFixed(2);

$("normalTotalUSD").textContent =
  "$" + normal.totalNetUSD.toFixed(2);

$("normalCoinsTotal").textContent =
  Math.round(normal.normalCoins).toLocaleString("en-US");
    const rate = number($("sendingPurchaseRate").value);

    $("sendingReceivingPreview").textContent =
      format(sending * 0.7);

    $("sendingAgencyPreview").textContent =
      format(sending * 0.7 * 0.2);

    $("sendingCostPreview").textContent =
      "Rs " + format(sending / 100000 * rate);
  }

  function clearForm() {
    $("editingSendingId").value = "";
    $("sendingDate").value = poppoToday();
    $("sendingPoints").value = "";
    $("receivingPoints").value = "";
    $("sendingPurchaseRate").value = "2600";
    $("sendingSaleStatus").value = "unsold";
    $("sendingCoinsSold").value = "0";
    $("sendingSellingRate").value = "";
    $("sendingSaleAmount").value = "";
    $("saveSendingBtn").textContent = "Save Sending Record";
    preview();
  }

  function renderHistory() {
 const cards = document.getElementById("sendingHistoryCards");

if (cards) {
  const hostFilter = document.getElementById("historyHostFilter");
  const typeFilter = document.getElementById("historyTypeFilter");
  const dateFilter = document.getElementById("historyDateFilter");
  const summary = document.getElementById("sendingHistorySummary");

  const allHosts = hosts();
  const allRecords = [...records()].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Populate host filter without losing selection
  if (hostFilter) {
    const selected = hostFilter.value;
    hostFilter.replaceChildren(new Option("All Hosts", ""));

    const hostIds = [...new Set(allRecords.map(r => String(r.hostId)))];

    hostIds.forEach(id => {
      const host = allHosts.find(h => String(h.id) === id);
      const record = allRecords.find(r => String(r.hostId) === id);

      hostFilter.add(new Option(
        `${host?.name || record?.hostName || id} (${id})`,
        id
      ));
    });

    hostFilter.value = selected;
  }

  const filtered = allRecords.filter(record => {
    const host = allHosts.find(
      h => String(h.id) === String(record.hostId)
    );

    return (
      (!hostFilter?.value ||
        String(record.hostId) === hostFilter.value) &&
      (!typeFilter?.value ||
        host?.type === typeFilter.value) &&
      (!dateFilter?.value ||
        record.date === dateFilter.value)
    );
  });

  // Update totals
  if (summary) {
    const values = [
      filtered.length,
      filtered.reduce((sum, r) => sum + Number(r.sending || 0), 0),
      filtered.reduce((sum, r) => sum + Number(r.sending || 0) * 0.7, 0),
      filtered.reduce((sum, r) => sum + Number(r.purchaseCost || 0), 0)
    ];

    summary.querySelectorAll("strong").forEach((el, index) => {
      el.textContent =
        (index === 3 ? "Rs " : "") + format(values[index]);
    });
  }

  cards.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = "No records found for selected filters.";
    empty.style.color = "#aaa";
    cards.appendChild(empty);
  }

  filtered.forEach(record => {
    const host = allHosts.find(
      h => String(h.id) === String(record.hostId)
    );

    const card = document.createElement("div");
    card.className = "fh-history-card";

    const heading = document.createElement("strong");
    heading.textContent =
      host?.name || record.hostName || "Unknown Host";

    const details = document.createElement("div");
    details.style.cssText =
      "font-size:12px;color:#aaa;margin:8px 0;line-height:1.8;";
    details.textContent =
      `ID: ${record.hostId} | Date: ${record.date}`;

    const stats = document.createElement("div");
    stats.style.cssText =
      "font-size:13px;line-height:2;";
    stats.textContent =
      `Sending: ${format(record.sending)} | ` +
      `Receiving: ${format(record.sending * 0.7)} | ` +
      `Cost: Rs ${format(record.purchaseCost)} | ` +
      `Status: ${record.saleStatus}`;
// Record Action Buttons
const actions = document.createElement("div");
actions.style.cssText = `
  display:flex;
  gap:8px;
  margin-top:14px;
  padding-top:12px;
  border-top:1px solid #333;
`;

// Edit Button
const editBtn = document.createElement("button");
editBtn.type = "button";
editBtn.textContent = "✏️ Edit";
editBtn.style.cssText = `
  flex:1;
  background:#ffd700;
  color:#111;
  border:none;
  border-radius:8px;
  padding:10px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
`;

editBtn.addEventListener("click", () => {
  document.getElementById("closeSendingHistory")?.click();
  editRecord(record.id);
});

// Delete Button
const deleteBtn = document.createElement("button");
deleteBtn.type = "button";
deleteBtn.textContent = "🗑 Delete";
deleteBtn.style.cssText = `
  flex:1;
  background:#351818;
  color:#ff8888;
  border:1px solid #703030;
  border-radius:8px;
  padding:10px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
`;

deleteBtn.addEventListener("click", () => {
  deleteRecord(record.id);
});

actions.style.marginTop = "auto";

actions.append(editBtn, deleteBtn);
card.append(heading, details, stats, actions);
cards.appendChild(card);
  });

  // Refresh when any filter changes
  [hostFilter, typeFilter, dateFilter].forEach(filter => {
    if (filter) filter.onchange = renderHistory;
  });
}
    const body = $("sendingHistoryBody");
    body.replaceChildren();

    const allHosts = hosts();
    const list = records().sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    if (!list.length) {
      const tr = body.insertRow();
      const td = tr.insertCell();
      td.colSpan = 7;
      td.textContent = "No sending records yet.";
      return;
    }

    for (const record of list) {
     const host = allHosts.find(h => h.id === record.hostId);


const historyHostName =
  host?.name || record.hostName || "Unknown Host";


const historyHostId = record.hostId;

const tr = body.insertRow();
      [
        record.date,
       `${historyHostName} (${historyHostId})`,
        format(record.sending),
        format(record.sending * 0.7),
        "Rs " + format(record.purchaseCost),
        record.saleStatus
      ].forEach(value => {
        tr.insertCell().textContent = value;
      });

      const action = tr.insertCell();
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => editRecord(record.id));
      
      action.append(edit);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "secondary";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "8px";
      deleteBtn.style.background = "#451b1b";
      deleteBtn.style.color = "#ff9999";

      deleteBtn.addEventListener("click", () => {
        deleteRecord(record.id);
      });

      action.append(deleteBtn);

    }
  }

  async function deleteRecord(id) {
    const record = records().find(r => r.id === id);
    if (!record) return;

    const confirmed = confirm(
      "Delete this sending record permanently?"
    );

    if (!confirmed) return;
try {
  await fhDeleteSendingRecord(id);

  const remaining = records().filter(r => r.id !== id);
  save(remaining);
      if ($("editingSendingId").value === id) {
        clearForm();
      }

      renderHistory();
      showMessage("✓ Sending record deleted successfully.");
    } catch (error) {
      console.error(error);
      showMessage("Unable to delete sending record.", true);
    }
  }


  function editRecord(id) {
    const record = records().find(r => r.id === id);
    if (!record) return;

   
refreshHosts();

const editingHost = hosts().find(h => h.id === record.hostId);
const hostDropdown = $("sendingHost");

if (
  editingHost &&
  ![...hostDropdown.options].some(o => o.value === record.hostId)
) {
  const option = document.createElement("option");
  option.value = editingHost.id;
  option.textContent =
    `${editingHost.name} (${editingHost.id}) — Inactive`;
  hostDropdown.appendChild(option);
}

    $("editingSendingId").value = record.id;
    $("sendingHost").value = record.hostId;
    $("sendingDate").value = record.date;
    $("sendingPoints").value = record.sending;
    $("receivingPoints").value =
  Math.round(record.sending * 0.7).toLocaleString("en-US");
    $("sendingPurchaseRate").value = record.purchaseRate;
    $("sendingSaleStatus").value = record.saleStatus;
    $("sendingCoinsSold").value = record.coinsSold;
    $("sendingSellingRate").value = record.sellingRate;
    $("sendingSaleAmount").value = record.saleAmount;
    $("saveSendingBtn").textContent = "Update Sending Record";

    preview();
    $("sendingRecordsSection").scrollIntoView({
      behavior: "smooth"
    });
  }

 async function saveRecord() {
    const hostId = $("sendingHost").value;
    const date = $("sendingDate").value;
   const sending = number($("sendingPoints").value);
    const purchaseRate = Number($("sendingPurchaseRate").value);
    const coinsSold = Number($("sendingCoinsSold").value);
    const sellingRate = Number($("sendingSellingRate").value);
    const saleAmount = Number($("sendingSaleAmount").value);
    const saleStatus = $("sendingSaleStatus").value;
    const editingId = $("editingSendingId").value;

const selectedHost = hosts().find(h => h.id === hostId);

if (!selectedHost) {
  return showMessage("Select a saved host first.", true);
}

if (!editingId && selectedHost.isActive === false) {
  return showMessage(
    "This host is inactive. Activate the host before adding new sending.",
    true
  );
}


    if (!date || date < "2026-10-01" || date > poppoToday()) {
      return showMessage("Select a valid Poppo date.", true);
    }

    if (!Number.isSafeInteger(sending) || sending <= 0) {
      return showMessage("Enter valid sending points.", true);
    }

    if (
      !Number.isFinite(purchaseRate) || purchaseRate < 0 ||
      !Number.isFinite(coinsSold) || coinsSold < 0 ||
      !Number.isFinite(sellingRate) || sellingRate < 0 ||
      !Number.isFinite(saleAmount) || saleAmount < 0
    ) {
      return showMessage("Enter valid rates and amounts.", true);
    }

    if (saleStatus === "unsold" &&
        (coinsSold !== 0 || saleAmount !== 0)) {
      return showMessage(
        "Unsold records must have zero sold coins and sale amount.",
        true
      );
    }

    if (saleStatus !== "unsold" &&
        (coinsSold <= 0 || saleAmount <= 0)) {
      return showMessage(
        "Enter sold coins and actual sale amount.",
        true
      );
    }

    const all = records();
    const record = {
      id: editingId || crypto.randomUUID(),
      hostId,
      date,
      sending,
      purchaseRate,
      purchaseCost: sending / 100000 * purchaseRate,
      saleStatus,
      coinsSold,
      sellingRate,
      saleAmount
    };

    const index = all.findIndex(r => r.id === editingId);

    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }

   try {
  const selectedHost = hosts().find(h => h.id === hostId);

  await fhSaveSendingRecord(record, selectedHost);

  save(all);
  clearForm();
      renderHistory();
      showMessage("✓ Sending record saved successfully.");
    } catch (error) {
      console.error(error);
      showMessage("Unable to save sending record.", true);
    }
  }

  
  // Automatic Sending ↔ Receiving with commas
  const sendingInput = $("sendingPoints");
  const receivingInput = $("receivingPoints");

  function readPoints(input) {
    return Number(input.value.replace(/,/g, "")) || 0;
  }

  function formatPoints(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  sendingInput.addEventListener("input", () => {
    const raw = sendingInput.value.replace(/[^\d]/g, "");

    if (!raw) {
      sendingInput.value = "";
      receivingInput.value = "";
    } else {
      const sending = Number(raw);
      sendingInput.value = formatPoints(sending);
      receivingInput.value = formatPoints(sending * 0.7);
    }

    preview();
  });

  receivingInput.addEventListener("input", () => {
    const raw = receivingInput.value.replace(/[^\d]/g, "");

    if (!raw) {
      receivingInput.value = "";
      sendingInput.value = "";
    } else {
      const receiving = Number(raw);
      receivingInput.value = formatPoints(receiving);
      sendingInput.value = formatPoints(receiving / 0.7);
    }

    preview();
  });


  // Automatic Coins Sale Amount
  function calculateSaleAmount() {
    const coins = number($("sendingCoinsSold").value);
    const rate = number($("sendingSellingRate").value);

    const amount = coins / 100000 * rate;

    $("sendingSaleAmount").value =
      amount > 0 ? amount.toFixed(2) : "";
  }

  $("sendingCoinsSold").addEventListener(
    "input",
    calculateSaleAmount
  );

  $("sendingSellingRate").addEventListener(
    "input",
    calculateSaleAmount
  );

  // FH EMPIRE — Normal Coins Calculator
  function calculateNormalCoins(sending) {
    const receiving = sending * 0.70;
    const agencyPoints = receiving * 0.20;

    const hostGrossUSD = receiving / 10000;

    const hostFee = hostGrossUSD >= 65
      ? 1
      : hostGrossUSD * 0.015;

    const hostNetUSD = Math.max(0, hostGrossUSD - hostFee);

    const agencyUSD = agencyPoints / 10000;

    const totalNetUSD = hostNetUSD + agencyUSD;

    const normalCoins = totalNetUSD * 9900;

    return {
      receiving,
      agencyPoints,
      hostGrossUSD,
      hostFee,
      hostNetUSD,
      agencyUSD,
      totalNetUSD,
      normalCoins
    };
  }

  // Temporary console test — no records changed
  window.FHCalculateNormalCoins = calculateNormalCoins;

// Salary Base & Half-Half Reward Levels
const REWARD_LEVELS = [
  { level: "S", target: 50000000, daily: 480000 },
  { level: "A", target: 22000000, daily: 280000 },
  { level: "B", target: 10000000, daily: 150000 },
  { level: "C", target: 7000000, daily: 120000 },
  { level: "D", target: 4000000, daily: 84000 },
  { level: "E", target: 2000000, daily: 54000 },
  { level: "F", target: 1200000, daily: 36000 },
  { level: "G", target: 900000, daily: 27000 },
  { level: "H", target: 300000, daily: 10000 },
  { level: "I", target: 150000, daily: 6000 }
];

function getRewardLevel(receiving) {
  return REWARD_LEVELS.find(
    item => receiving >= item.target
  ) || null;
}

function getNextRewardLevel(receiving) {
  return [...REWARD_LEVELS].reverse().find(
    item => receiving < item.target
  ) || null;
}
// STEP 10C — Live Reward Preview
function updateRewardPreview() {
  const hostId = $("sendingHost").value;
  const host = hosts().find(h => h.id === hostId);

  const set = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  const fmt = value =>
    Math.round(value).toLocaleString("en-US");

  const reset = () => {
    set("rewardLevel", "—");
    set("rewardRolling", "0");
    set("rewardNextLevel", "—");
    set("rewardNeeded", "0");
    set("rewardDaily", "0");
    set("rewardWeekly", "0");
    set("rewardCoins", "0");
  };

  reset();

  if (!host) return;

  if (!["salarybase", "halfhalf"].includes(host.type)) {
    set("rewardLevel", "Not applicable");
    set("rewardNextLevel", "—");
    return;
  }

  const savedRolling = rollingReceiving(hostId);

const proposedSending = number($("sendingPoints").value);

const editingId = $("editingSendingId").value;

const oldRecord = editingId
  ? records().find(r => r.id === editingId)
  : null;

const today = poppoToday();
const firstDay = dateShift(today, -6);
const selectedDate = $("sendingDate").value;

const withinWindow =
  selectedDate >= firstDay && selectedDate <= today;

const oldReceiving = oldRecord &&
  oldRecord.hostId === hostId &&
  oldRecord.date >= firstDay &&
  oldRecord.date <= today
    ? oldRecord.sending * 0.7
    : 0;

const rolling = Math.max(
  0,
  savedRolling - oldReceiving +
  (withinWindow ? proposedSending * 0.7 : 0)
);
  const current = getRewardLevel(rolling);
  const next = getNextRewardLevel(rolling);

  set("rewardRolling", fmt(rolling));
  set("rewardLevel", current ? current.level : "Below I");
  set("rewardNextLevel", next ? next.level : "Maximum S");
  set("rewardNeeded", next ? fmt(next.target - rolling) : "0");

  if (!current) return;

  set("rewardDaily", fmt(current.daily));

  // Illustrative only: assumes the same tier for all 7 days.
  const weeklyPoints = current.daily * 7;

  set("rewardWeekly", fmt(weeklyPoints));

  const fhShare = host.type === "halfhalf" ? 0.5 : 1;
  const grossUSD = weeklyPoints / 10000 * fhShare;
  const feeUSD = grossUSD < 65 ? grossUSD * 0.015 : 1;
  const rewardCoins = Math.max(0, grossUSD - feeUSD) * 9900;

  set("rewardCoins", fmt(rewardCoins));
}
// FH EMPIRE — External Gift Receiving
let externalGiftRecords = [];

async function loadOptimizerExternalGifts() {
  try {
    externalGiftRecords = await fhLoadExternalGifts();
    console.log("✓ External Gifts loaded:", externalGiftRecords.length);
  } catch (error) {
    console.error("External Gifts loading failed:", error);
    externalGiftRecords = [];
  }
}

function giftReceivingForPeriod(hostId, fromDate, toDate) {
  return externalGiftRecords
    .filter(gift =>
      String(gift.host_poppo_id) === String(hostId) &&
      String(gift.gift_date).slice(0, 10) >= fromDate &&
      String(gift.gift_date).slice(0, 10) <= toDate
    )
    .reduce(
      (sum, gift) => sum + Number(gift.received_points || 0),
      0
    );
}
  // Rolling 7-day receiving, including current Poppo date
 function rollingReceiving(hostId) {
  const today = poppoToday();
  const firstDay = dateShift(today, -6);

  const paidReceiving = records()
    .filter(r =>
      String(r.hostId) === String(hostId) &&
      r.date >= firstDay &&
      r.date <= today
    )
    .reduce(
      (sum, r) => sum + Number(r.sending || 0) * 0.7,
      0
    );

  const giftReceiving = giftReceivingForPeriod(
    hostId,
    firstDay,
    today
  );

  return paidReceiving + giftReceiving;
}

  // Available for future reward-level integration
 window.FHSendingRecords = {
  hosts,
  records,
  rollingReceiving,
  giftReceivingForPeriod,
  poppoToday,
  refreshHosts,
  renderHistory
};
  $("sendingDate").max = poppoToday();

  ["sendingPoints", "sendingPurchaseRate"].forEach(id => {
    $(id).addEventListener("input", preview);
  });

  $("saveSendingBtn").addEventListener("click", saveRecord);
  $("clearSendingBtn").addEventListener("click", () => {
    clearForm();
    showMessage("");
  });
// FH EMPIRE — Record Type Open / Close
const sendingRecordType = document.getElementById("sendingRecordType");
const paidSendingForm = document.getElementById("paidSendingForm");
const externalGiftOpenPanel = document.getElementById("externalGiftOpenPanel");
const openExternalGiftCalculator = document.getElementById("openExternalGiftCalculator");

function updateSendingRecordType() {
  const isExternal = sendingRecordType.value === "external";

  paidSendingForm.style.setProperty(
  "display",
  isExternal ? "none" : "block",
  "important"
);
  externalGiftOpenPanel.style.display = isExternal ? "" : "none";
}

sendingRecordType.addEventListener("change", updateSendingRecordType);
updateSendingRecordType();

openExternalGiftCalculator.addEventListener("click", () => {
  const modal = document.getElementById("externalGiftPopup");
  const frame = document.getElementById("externalGiftFrame");

  frame.src = "sending-dashboard.html#externalGiftSection";
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
});

document.getElementById("closeExternalGiftPopup")
  .addEventListener("click", () => {
    document.getElementById("externalGiftPopup").style.display = "none";
    document.body.style.overflow = "";
  });
// FH EMPIRE — Refresh receiving after External Gift save
window.addEventListener("message", async (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type !== "FH_EXTERNAL_GIFT_SAVED") return;

  await loadOptimizerExternalGifts();

  preview();
  renderHosts();

  console.log("✓ External Gift receiving refreshed");
});
  refreshHosts();
clearForm();

async function initializeSendingHistory() {
  try {
    const cloudRecords = await fhLoadSendingRecords();
await loadOptimizerExternalGifts();
    save(cloudRecords);
    renderHistory();

    console.log("✓ Sending history loaded from Supabase");
  } catch (error) {
    console.error("Unable to load cloud sending history:", error);

    renderHistory();
    showMessage(
      "Cloud history could not load. Please check your connection.",
      true
    );
  }
}

initializeSendingHistory();
  // Refresh host dropdown after adding/editing a host
  window.addEventListener("focus", refreshHosts);
  // ==========================================
  // FH EMPIRE — MAXIMUM PROFIT OPTIMIZER
  // ==========================================

  const optimizerButton = $("runMaximumOptimizer");
  const optimizerResult = $("maximumOptimizerResult");

  function optimizerNumber(id) {
    return Number(
      String($(id)?.value || "").replace(/,/g, "")
    );
  }

  
function calculateWithdrawalFee(usd) {
  if (!Number.isFinite(usd) || usd <= 0) return 0;

  return usd >= 65 ? 1 : usd * 0.015;
}
// FH EMPIRE — Persistent Optimizer Save Batch

const FH_OPTIMIZER_BATCH_KEY =
  "fh_optimizer_pending_batch_v1";

let fhOptimizerSaving = false;

function fhGetPendingOptimizerBatch() {

  const raw = localStorage.getItem(
    FH_OPTIMIZER_BATCH_KEY
  );

  if (!raw) return null;

  const batch = JSON.parse(raw);

  if (
    !batch.id ||
    !batch.signature ||
    !Array.isArray(batch.entries) ||
    !batch.entries.length
  ) {
    throw new Error("Invalid pending sending batch.");
  }

  return batch;
}

function fhCreateOptimizerBatch(
  entries,
  date,
  purchaseRate
) {

  const sorted = [...entries].sort(
    (a, b) => String(a.host.id).localeCompare(
      String(b.host.id)
    )
  );

  const signature = JSON.stringify({
    date,
    purchaseRate,
    hosts: sorted.map(entry => ({
      id: String(entry.host.id),
      sending: entry.actual
    }))
  });

  const pending = fhGetPendingOptimizerBatch();

  if (pending) {

    if (pending.signature !== signature) {
      throw new Error(
        "An earlier sending batch is pending. " +
        "Verify that batch before saving a new plan."
      );
    }

    return pending;
  }

  const batch = {
    id: crypto.randomUUID(),
    signature,
    createdAt: new Date().toISOString(),

    entries: sorted.map(entry => ({

      host: {
        id: entry.host.id,
        name: entry.host.name,
        type: entry.host.type
      },

      record: {
        id: crypto.randomUUID(),
        hostId: entry.host.id,
        date,
        sending: entry.actual,
        purchaseRate,
        purchaseCost:
          entry.actual / 100000 * purchaseRate,
        saleStatus: "unsold",
        coinsSold: 0,
        sellingRate: 0,
        saleAmount: 0
      }
    }))
  };

  localStorage.setItem(
    FH_OPTIMIZER_BATCH_KEY,
    JSON.stringify(batch)
  );

  return batch;
}

function fhClearPendingOptimizerBatch(batchId) {

  const pending = fhGetPendingOptimizerBatch();

  if (pending && pending.id === batchId) {

    localStorage.removeItem(
      FH_OPTIMIZER_BATCH_KEY
    );
  }
}
// FH EMPIRE — Pending Batch Recovery

async function fhRecoverPendingOptimizerBatch() {

  if (fhOptimizerSaving) return;

  let batch;

  try {
    batch = fhGetPendingOptimizerBatch();
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!batch) {
    alert("No pending sending batch found.");
    return;
  }

  const total = batch.entries.reduce(
    (sum, entry) => sum + entry.record.sending,
    0
  );

  const approved = window.confirm(
    "FH EMPIRE — Pending Sending Recovery\n\n" +
    "Poppo Date: " +
    batch.entries[0].record.date + "\n" +
    "Hosts: " + batch.entries.length + "\n" +
    "Total Sending: " +
    total.toLocaleString("en-US") + "\n\n" +
    "Confirm only if this sending was actually completed.\n\n" +
    "Recover and verify these records?"
  );

  if (!approved) return;

  fhOptimizerSaving = true;
  optimizerButton.disabled = true;

  optimizerResult.textContent =
    "Recovering pending sending records...";

  try {

    await fhSaveBulkSendingRecords(
      batch.entries
    );

    const verification =
      await fhVerifyBulkSendingRecords(
        batch.entries
      );

    save(verification.records);

    renderHistory();

    fhClearPendingOptimizerBatch(batch.id);

    optimizerResult.textContent =
      "✓ Successfully recovered and verified " +
      verification.count + " sending records.";

    showMessage(
      "✓ Pending sending batch recovered successfully."
    );

  } catch (error) {

    console.error(error);

    optimizerResult.textContent =
      "Recovery failed: " + error.message +
      ". Pending records are preserved.";

  } finally {

    fhOptimizerSaving = false;
    optimizerButton.disabled = false;

    fhRenderPendingOptimizerNotice();
  }
}

function fhRenderPendingOptimizerNotice() {

  document.getElementById(
    "fhPendingOptimizerNotice"
  )?.remove();

  let batch;

  try {

    batch = fhGetPendingOptimizerBatch();

  } catch (error) {

    optimizerButton.disabled = true;

    optimizerResult.textContent =
      error.message;

    return;
  }

  if (!batch) return;

  const notice = document.createElement("div");

  notice.id = "fhPendingOptimizerNotice";

  notice.style.cssText = `
    background:#292010;
    border:1px solid #d4af37;
    color:#fbbf24;
    padding:16px;
    border-radius:10px;
    margin:15px 0;
  `;

  const title = document.createElement("strong");

  title.textContent =
    "⚠ PENDING SENDING BATCH";

  const description = document.createElement("p");

  description.textContent =
    "An earlier sending batch requires verification. " +
    "Recover it before creating another plan.";

  const recoverButton = document.createElement("button");

  recoverButton.type = "button";

  recoverButton.textContent =
    "Recover & Verify Pending Records";

  recoverButton.style.cssText = `
    background:#d4af37;
    color:#111;
    border:0;
    padding:12px 18px;
    border-radius:7px;
    font-weight:bold;
    cursor:pointer;
  `;

  recoverButton.addEventListener(
    "click",
    fhRecoverPendingOptimizerBatch
  );

  notice.append(
    title,
    description,
    recoverButton
  );

  optimizerResult.before(notice);
}

  function runMaximumProfitOptimizer() {

  if (fhOptimizerSaving) return;

  try {

    if (fhGetPendingOptimizerBatch()) {

      fhRenderPendingOptimizerNotice();

      return;
    }

  } catch (error) {

    optimizerResult.textContent =
      error.message;

    return;
  }

 
  const rawAvailable = String(
  $("optimizerAvailableSending")?.value || ""
).trim();

const autoMode = rawAvailable === "";

let available = optimizerNumber(
  "optimizerAvailableSending"
);
  const purchaseRate = optimizerNumber("optimizerPurchaseRate");
  const sellingRate = optimizerNumber("optimizerSellingRate");


  const fmt = n => Math.round(n).toLocaleString("en-US");
  const money = n => Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (
    (!autoMode && (
  !Number.isSafeInteger(available) ||
  available < 10000 ||
  available % 10000 !== 0
)) ||
    !Number.isFinite(purchaseRate) ||
    purchaseRate <= 0 ||
    !Number.isFinite(sellingRate) ||
    sellingRate <= 0
  ) {
    optimizerResult.textContent =
      "Sending 10,000 ke multiples mein aur rates positive honi chahiye.";
    return;
  }

  
const savedHosts = hosts().filter(h =>
  ["salarybase", "halfhalf"].includes(h.type) &&
  h.isActive !== false
);

  if (!savedHosts.length) {
    optimizerResult.textContent = "Please add saved hosts first.";
    return;
  }

 
  const today = poppoToday();
  const history = records();

  const dailyReward = receiving =>
    getRewardLevel(receiving)?.daily || 0;

  const hostData = savedHosts.map(host => {
    const historical = [];

    for (let day = 0; day < 7; day++) {
      const targetDate = dateShift(today, day);
      const startDate = dateShift(targetDate, -6);

     const paidReceiving = history
  .filter(r =>
    String(r.hostId) === String(host.id) &&
    r.date >= startDate &&
    r.date <= targetDate
  )
  .reduce(
    (sum, r) => sum + Number(r.sending || 0) * 0.7,
    0
  );

const giftReceiving = giftReceivingForPeriod(
  host.id,
  startDate,
  targetDate
);

const receiving = paidReceiving + giftReceiving;

      historical.push(receiving);
    }

    return {
      host,
      historical,
      options: []
    };
  });
// FH EMPIRE — Automatic Reward Capacity

const maximumRewardTarget = Math.max(
  ...REWARD_LEVELS.map(level => level.target)
);

const automaticCapacity = hostData.reduce(
  (total, item) => {

    const lowestReceiving = Math.min(
      ...item.historical
    );

    const requiredReceiving = Math.max(
      0,
      maximumRewardTarget - lowestReceiving
    );

    const requiredSending = Math.ceil(
      requiredReceiving / 7000
    ) * 10000;

    return total + requiredSending;
  },
  0
);

const normalMarginPer100K =
  100000 * 0.70 * 1.20 * 0.99 /
  100000 * sellingRate - purchaseRate;

if (autoMode) {

  if (normalMarginPer100K > 0) {
    optimizerResult.textContent =
      "Normal coin trading is profitable. " +
      "Maximum profit requires a sending budget. " +
      "Please enter available sending.";
    return;
  }

  if (automaticCapacity <= 0) {
    optimizerResult.textContent =
      "All active hosts have reached maximum reward capacity.";
    return;
  }

  available = automaticCapacity;
}
 // FH EMPIRE — Reusable Host Profit Calculator

function evaluateHostSending(item, sending) {

  const share =
    item.host.type === "halfhalf" ? 0.5 : 1;

  const addedReceiving = sending * 0.7;

  const normalCoins = sending > 0
    ? calculateNormalCoins(sending).normalCoins
    : 0;

  let extraRewardPoints = 0;
  const days = [];

  for (let day = 0; day < 7; day++) {

    const oldReceiving = item.historical[day];
    const newReceiving = oldReceiving + addedReceiving;

    const oldReward = dailyReward(oldReceiving);
    const newReward = dailyReward(newReceiving);

    const extraPoints = Math.max(
      0,
      newReward - oldReward
    );

    extraRewardPoints += extraPoints;

    days.push({
      date: dateShift(today, day),
      oldReward,
      newReward,
      extraPoints,
      level:
        getRewardLevel(newReceiving)?.level || "None"
    });
  }

  const fhRewardPoints = extraRewardPoints * share;
  const rewardGrossUSD = fhRewardPoints / 10000;
  const hostGrossUSD = sending * 0.70 / 10000;

  const combinedExtraFee = Math.max(
    0,
    calculateWithdrawalFee(
      hostGrossUSD + rewardGrossUSD
    ) - calculateWithdrawalFee(hostGrossUSD)
  );

  const separateRewardFee =
    calculateWithdrawalFee(rewardGrossUSD);

  const bestRewardCoins = Math.max(
    0,
    rewardGrossUSD - combinedExtraFee
  ) * 9900;

  const conservativeRewardCoins = Math.max(
    0,
    rewardGrossUSD - separateRewardFee
  ) * 9900;

  const rewardCoins = bestRewardCoins;

  const totalCoins = normalCoins + rewardCoins;

  const saleValue =
    totalCoins / 100000 * sellingRate;

  const cost =
    sending / 100000 * purchaseRate;

  return {
    sending,
    normalCoins,
    rewardCoins,
    bestRewardCoins,
    conservativeRewardCoins,
    extraRewardPoints,
    fhRewardPoints,
    saleValue,
    cost,
    profit: saleValue - cost,

    conservativeProfit:
      (normalCoins + conservativeRewardCoins)
      / 100000 * sellingRate - cost,

    days
  };
}
// FH EMPIRE — Smart Reward Thresholds

const BASE_STEP = 10000;

function getHostThresholds(item) {

  const amounts = new Set([0, BASE_STEP]);

  function addAmount(amount) {

    const rounded = Math.max(
      0,
      Math.ceil(amount / BASE_STEP) * BASE_STEP
    );

    if (rounded <= available) {
      amounts.add(rounded);
    }
  }

  // Withdrawal fee threshold
  addAmount(650000 / 0.70);

  // All seven days' reward thresholds
  for (const receiving of item.historical) {

    for (const level of REWARD_LEVELS) {

      const requiredReceiving = Math.max(
        0,
        level.target - receiving
      );

      const requiredSending =
        requiredReceiving / 0.70;

      addAmount(requiredSending);
    }
  }

  return [...amounts].sort((a, b) => a - b);
}

for (const item of hostData) {

  item.thresholds = getHostThresholds(item);

  item.thresholdOptions = item.thresholds.map(
    sending => evaluateHostSending(item, sending)
  );
}
 // FH EMPIRE — Hybrid Optimization Engine

const STEP = BASE_STEP;
const units = Math.floor(available / STEP);

const planMap = new Map();

function registerPlan(amounts) {

  const sending = amounts.reduce(
    (sum, amount) => sum + amount, 0
  );

  if (sending <= 0 || sending > available) return;

  const allocation = hostData.map((item, index) => ({
    ...item,
    selected: evaluateHostSending(
      item, amounts[index] || 0
    )
  })).filter(item => item.selected.sending > 0);

  const profit = allocation.reduce(
    (sum, item) =>
      sum + item.selected.conservativeProfit,
    0
  );

  const cost = sending / 100000 * purchaseRate;
  const key = sending / STEP;

  const previous = planMap.get(key);

  if (!previous || profit > previous.profit) {

    planMap.set(key, {
      units: key,
      sending,
      cost,
      profit,
      roi: cost > 0 ? profit / cost * 100 : 0,
      allocation
    });
  }
}

// Exact optimization for smaller amounts

if (units <= 3000) {

  for (const item of hostData) {

    item.options = [];

    for (let u = 0; u <= units; u++) {

      item.options.push(
        evaluateHostSending(item, u * STEP)
      );
    }
  }

  let dp = new Float64Array(units + 1);

  dp.fill(-Infinity);
  dp[0] = 0;

  const decisions = [];

  for (const item of hostData) {

    const next = new Float64Array(units + 1);
    next.fill(-Infinity);

    const choice = new Int32Array(units + 1);
    choice.fill(-1);

    for (let used = 0; used <= units; used++) {

      if (!Number.isFinite(dp[used])) continue;

      for (let u = 0; u + used <= units; u++) {

        const total = used + u;

        const profit =
          dp[used] +
          item.options[u].conservativeProfit;

        if (profit > next[total]) {

          next[total] = profit;
          choice[total] = u;
        }
      }
    }

    dp = next;
    decisions.push(choice);
  }

  for (let u = 1; u <= units; u++) {

    if (!Number.isFinite(dp[u])) continue;

    let remaining = u;

    const amounts = hostData.map(() => 0);

    for (let i = hostData.length - 1; i >= 0; i--) {

      const chosen = decisions[i][remaining];

      amounts[i] = chosen * STEP;

      remaining -= chosen;
    }

    registerPlan(amounts);
  }

} else {

  // Smart large-scale threshold search

  let states = [{
    amounts: [],
    sending: 0,
    profit: 0
  }];

  const SEARCH_WIDTH = 2000;

  for (const item of hostData) {

    const nextStates = new Map();

    for (const state of states) {

      for (const option of item.thresholdOptions) {

        const sending =
          state.sending + option.sending;

        if (sending > available) continue;

        const profit =
          state.profit + option.conservativeProfit;

        const previous = nextStates.get(sending);

        if (!previous || profit > previous.profit) {

          nextStates.set(sending, {
            amounts: [
              ...state.amounts,
              option.sending
            ],
            sending,
            profit
          });
        }
      }
    }

    const ranked = [...nextStates.values()];

    const byProfit = [...ranked].sort(
      (a, b) => b.profit - a.profit
    );

    const byROI = [...ranked].sort(
      (a, b) =>
        (b.sending ? b.profit / b.sending : 0) -
        (a.sending ? a.profit / a.sending : 0)
    );

    const bySending = [...ranked].sort(
      (a, b) => a.sending - b.sending
    );

    const retained = new Map();

    function retain(state) {
      retained.set(state.sending, state);
    }

    byProfit.slice(0, SEARCH_WIDTH / 2)
      .forEach(retain);

    byROI.slice(0, SEARCH_WIDTH / 4)
      .forEach(retain);

    const sampleCount = SEARCH_WIDTH / 4;

    for (let i = 0; i < sampleCount; i++) {

      const index = Math.floor(
        i * (bySending.length - 1) /
        Math.max(1, sampleCount - 1)
      );

      if (bySending[index]) {
        retain(bySending[index]);
      }
    }

    if (nextStates.has(0)) {
      retain(nextStates.get(0));
    }

    states = [...retained.values()];
  }

  for (const state of states) {

    registerPlan(state.amounts);
  }

  // Complete entered sending allocation

  if (!autoMode) {

    for (const state of states) {

      const remaining =
        available - state.sending;

      if (remaining === 0) {

        registerPlan(state.amounts);
        continue;
      }

      // Compare every host for remaining sending

      for (let i = 0; i < hostData.length; i++) {

        const amounts = [...state.amounts];

        amounts[i] += remaining;

        registerPlan(amounts);
      }
    }
  }
}

// FH EMPIRE — Smart Profit Suggestions

const candidates = [...planMap.values()].sort(
  (a, b) => a.sending - b.sending
);

if (!candidates.length) {

  optimizerResult.textContent =
    "No valid sending plan found.";

  return;
}

const profitable = candidates.filter(
  item => item.profit > 0
);

const best = candidates.reduce(
  (a, b) => b.profit > a.profit ? b : a
);

const suggestions = [];

function addSuggestion(name, description, plan) {

  if (!plan) return;

  suggestions.push({
    ...plan,
    name,
    description
  });
}

if (profitable.length) {

  const highestROI = profitable.reduce(
    (a, b) => b.roi > a.roi ? b : a
  );

  const profitTarget = percentage =>
    profitable.find(
      item => item.profit >= best.profit * percentage
    ) || best;

  addSuggestion(
    "Minimum Profitable",
    "Lowest profitable sending found",
    profitable[0]
  );

  addSuggestion(
    "Low Investment",
    "25% of maximum projected profit",
    profitTarget(0.25)
  );

  addSuggestion(
    "Highest ROI",
    "Highest percentage return found",
    highestROI
  );

  addSuggestion(
    "Best Balanced",
    "60% of maximum projected profit",
    profitTarget(0.60)
  );

  addSuggestion(
    "High Profit",
    "90% of maximum projected profit",
    profitTarget(0.90)
  );

  addSuggestion(
    "Maximum Profit",
    "Highest conservative profit found",
    best
  );

} else {

  addSuggestion(
    "Lowest Projected Loss",
    "No profitable sending found at current rates",
    best
  );
}

function reconstructPlan(planUnits) {

  const plan = planMap.get(planUnits);

  if (!plan) {
    throw new Error("Invalid sending plan.");
  }

  return [...plan.allocation];
}
function renderSelectedPlan(activePlan) {

const selected = reconstructPlan(activePlan.units);

  const totalSending = selected.reduce(
    (sum, item) => sum + item.selected.sending, 0
  );

  const normalCoins = selected.reduce(
    (sum, item) => sum + item.selected.normalCoins, 0
  );

  const rewardCoins = selected.reduce(
    (sum, item) => sum + item.selected.rewardCoins, 0
  );

  const totalCoins = normalCoins + rewardCoins;
  
const conservativeCoins = normalCoins + selected.reduce(
  (sum, item) => sum + item.selected.conservativeRewardCoins,
  0
);

const conservativeSaleValue =
  conservativeCoins / 100000 * sellingRate;

const normalOnlySaleValue =
  normalCoins / 100000 * sellingRate;

const normalOnlyProfit =
  normalOnlySaleValue - totalSending / 100000 * purchaseRate;

const conservativeProfit =
  conservativeSaleValue - totalSending / 100000 * purchaseRate;

  const cost = totalSending / 100000 * purchaseRate;
  const saleValue = totalCoins / 100000 * sellingRate;
  const profit = saleValue - cost;

  const breakEvenRate = totalCoins > 0
    ? cost / totalCoins * 100000
    : 0;

  optimizerResult.replaceChildren();

// FH EMPIRE — Suggested Profit Plans

const suggestionHeading = document.createElement("h3");
suggestionHeading.textContent = "Smart Profit Suggestions";
suggestionHeading.style.color = "#d4af37";

optimizerResult.append(suggestionHeading);

const suggestionNote = document.createElement("p");

suggestionNote.textContent =
  "Select a recommended plan to view its complete host distribution.";

optimizerResult.append(suggestionNote);

const suggestionGrid = document.createElement("div");

suggestionGrid.style.cssText = `
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:12px;
  margin:18px 0 25px;
`;

suggestions.forEach(plan => {

  const isSelected = plan.units === activePlan.units &&
    plan.name === activePlan.name;

  const planCard = document.createElement("button");

  planCard.type = "button";

  planCard.style.cssText = `
    background:${isSelected ? "#292310" : "#141414"};
    color:#ffffff;
    border:${isSelected ? "2px solid #d4af37" : "1px solid #454545"};
    border-radius:12px;
    padding:16px;
    text-align:left;
    cursor:pointer;
    width:100%;
    font-family:inherit;
  `;

  planCard.innerHTML = `
    <div style="color:#d4af37;font-size:16px;font-weight:700;">
      ${plan.name}
    </div>

    <div style="color:#aaaaaa;font-size:12px;margin:8px 0 15px;">
      ${plan.description}
    </div>

    <div style="font-size:12px;color:#aaaaaa;">
      RECOMMENDED SENDING
    </div>

    <div style="font-size:23px;font-weight:700;margin:5px 0 12px;">
      ${fmt(plan.sending)}
    </div>

    <div style="margin-bottom:8px;">
      Investment: Rs ${money(plan.cost)}
    </div>

    <div style="font-size:12px;color:#aaaaaa;">
      CONSERVATIVE 7-DAY PROFIT
    </div>

    <div style="
      font-size:21px;
      font-weight:bold;
      color:${plan.profit >= 0 ? "#22c55e" : "#ef4444"};
      margin:5px 0;
    ">
      Rs ${money(plan.profit)}
    </div>

    <div style="margin:8px 0;">
      ROI: ${plan.roi.toFixed(2)}%
    </div>

    <div style="
      margin-top:15px;
      padding:10px;
      border-radius:7px;
      text-align:center;
      font-weight:bold;
      background:${isSelected ? "#d4af37" : "#262626"};
      color:${isSelected ? "#111111" : "#ffffff"};
    ">
      ${isSelected ? "✓ SELECTED PLAN" : "SELECT PLAN"}
    </div>
  `;

  planCard.addEventListener("click", () => {
    renderSelectedPlan(plan);
  });

  suggestionGrid.append(planCard);
});

optimizerResult.append(suggestionGrid);

const planDivider = document.createElement("hr");

planDivider.style.cssText =
  "border:0;border-top:1px solid #8b741d;margin:25px 0;";

optimizerResult.append(planDivider);

  const heading = document.createElement("h3");
  heading.textContent =
  "FH EMPIRE — " + activePlan.name;
  optimizerResult.append(heading);

  const summary = document.createElement("p");
  
summary.innerHTML = `
  <strong>Decision:</strong>
  ${conservativeProfit > 0
  ? "PROJECTED PROFIT"
  : conservativeProfit < 0
    ? "PROJECTED LOSS"
    : "BREAK EVEN"}<br>
 <strong>Calculation Mode:</strong> ${
  autoMode
    ? "Automatic Profit Finder"
    : "Available Sending Allocation"
}<br>

<strong>${autoMode
  ? "Recommended Sending"
  : "Available Sending"}:</strong>
${fmt(autoMode ? totalSending : available)}<br>

<strong>Allocated Sending:</strong>
${fmt(totalSending)}<br>

${!autoMode ? `
<strong>Unused Sending:</strong>
${fmt(available - totalSending)}<br>
` : ""}
  <strong>Normal Coins:</strong> ${fmt(normalCoins)}<br>
  <strong>7-Day Extra Reward Coins:</strong> ${fmt(rewardCoins)}<br>
  <strong>Total Saleable Coins:</strong> ${fmt(totalCoins)}<br>
  <strong>Sender Payment:</strong> Rs ${money(cost)}<br>
  <strong>Projected Sale:</strong> Rs ${money(saleValue)}<br>
  <strong>Break-even Selling Rate:</strong>
  Rs ${money(breakEvenRate)} / 100K<br>
  <strong>Normal Only Profit/Loss:</strong>
  Rs ${money(normalOnlyProfit)}<br>
  <strong>Conservative 7-Day Profit:</strong>
  Rs ${money(conservativeProfit)}<br>
  <strong>Best Case 7-Day Profit:</strong>
  Rs ${money(profit)}
`;

  optimizerResult.append(summary);

  const title = document.createElement("h3");
  title.textContent = "Best Immediate Host Distribution";
  optimizerResult.append(title);

 selected.sort((a, b) =>
  b.selected.profit - a.selected.profit ||
  b.selected.sending - a.selected.sending ||
  String(a.host.id).localeCompare(String(b.host.id))
);


   // Copy All Recommended Sending
const copyAllBtn = document.createElement("button");
copyAllBtn.type = "button";
copyAllBtn.textContent = "📋 Copy All Sending";
copyAllBtn.style.cssText =
  "background:#d4af37;color:#111;border:0;" +
  "padding:12px 18px;border-radius:8px;" +
  "font-weight:bold;cursor:pointer;margin:15px 0;";

copyAllBtn.addEventListener("click", async () => {
  const allMessage =
    "FH EMPIRE - Recommended Sending\n\n" +
    selected.map((item, index) =>
      `${index + 1}. ${item.host.name}\n` +
      `Poppo ID: ${item.host.id}\n` +
      `Sending: ${fmt(item.selected.sending)} Coins\n` +
      `Receiving: ${fmt(item.selected.sending * 0.7)} Points`
    ).join("\n\n");

  try {
    await navigator.clipboard.writeText(allMessage);
    copyAllBtn.textContent = "✅ All Copied!";
    setTimeout(() => {
      copyAllBtn.textContent = "📋 Copy All Sending";
    }, 1500);
  } catch (error) {
    alert("Copy All failed. Please try again.");
  }
});

optimizerResult.append(copyAllBtn); 
// FH EMPIRE — Confirm Sending Plan

const confirmPlanBtn = document.createElement("button");

confirmPlanBtn.type = "button";

confirmPlanBtn.textContent = "✓ Confirm & Save Sending Plan";

confirmPlanBtn.style.cssText = `
  background:#15803d;
  color:#ffffff;
  border:0;
  padding:12px 18px;
  border-radius:8px;
  font-weight:bold;
  cursor:pointer;
  margin:15px 8px;
`;

const incompletePlan =
  !autoMode && totalSending !== available;

if (incompletePlan) {

  confirmPlanBtn.textContent =
    "✓ Confirm Partial Sending";

  confirmPlanBtn.style.background = "#b45309";
}

confirmPlanBtn.addEventListener("click", () => {



  if (document.getElementById("fhConfirmPlanModal")) {
    return;
  }

  const modal = document.createElement("div");

  modal.id = "fhConfirmPlanModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.85);
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:15px;
  `;

  const panel = document.createElement("div");

  panel.style.cssText = `
    background:#141414;
    color:#ffffff;
    border:1px solid #d4af37;
    border-radius:16px;
    width:100%;
    max-width:620px;
    max-height:90vh;
    overflow-y:auto;
    padding:22px;
    box-sizing:border-box;
    box-shadow:0 15px 60px rgba(0,0,0,0.6);
  `;

  panel.innerHTML = `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
    ">
      <div>
        <h2 style="color:#d4af37;margin:0;">
          CONFIRM SENDING PLAN
        </h2>

        <p style="color:#999;font-size:12px;">
          FH EMPIRE — SENDING MANAGEMENT
        </p>
      </div>

      <button id="fhClosePlanModal" type="button"
        style="
          background:#292929;
          color:white;
          border:0;
          border-radius:8px;
          padding:10px 15px;
          cursor:pointer;
        ">
        ✕
      </button>
    </div>

    <div style="
      background:#1d1a10;
      border:1px solid #66551c;
      border-radius:10px;
      padding:15px;
      line-height:1.9;
      margin:15px 0;
    ">
      <strong>Selected Plan:</strong>
      ${activePlan.name}<br>

      <strong>Poppo Date:</strong>
      ${today}<br>

      <strong>Total Hosts:</strong>
      ${selected.length}<br>

      <strong>Total Sending:</strong>
      ${fmt(totalSending)}<br>

      <strong>Purchase Rate:</strong>
      Rs ${money(purchaseRate)} / 100K<br>

      <strong>Sender Payment:</strong>
      Rs ${money(cost)}<br>

      <strong>Projected 7-Day Profit:</strong>

      <span style="
        color:${conservativeProfit >= 0
          ? "#22c55e"
          : "#ef4444"};
        font-weight:bold;
      ">
        Rs ${money(conservativeProfit)}
      </span><br>

      <strong>Sale Status:</strong>

      <span style="color:#fbbf24;">
        UNSOLD
      </span>
    </div>

    <h3 style="color:#d4af37;">
      Host-wise Sending Distribution
    </h3>

    <div id="fhConfirmHostList"></div>

    <div style="
      background:#252015;
      color:#fbbf24;
      border-radius:8px;
      padding:12px;
      font-size:13px;
      margin:15px 0;
    ">
      Only confirm after sending has actually been
      completed for every listed host.

      Projected sales and rewards will not be
      recorded as actual sales.
    </div>

    <label style="
      display:flex;
      gap:10px;
      align-items:flex-start;
      font-size:14px;
      cursor:pointer;
      margin:20px 0;
    ">
      <input
        type="checkbox"
        id="fhConfirmSendingCompleted"
        style="
          width:18px;
          height:18px;
          accent-color:#d4af37;
        "
      >

      <span>
      I confirm that the actual sending amounts
entered for the selected hosts are correct.
      </span>
    </label>

    <button
      type="button"
      id="fhSaveConfirmedPlan"
      disabled
      style="
        background:#d4af37;
        color:#111111;
        width:100%;
        padding:15px;
        border:0;
        border-radius:9px;
        font-weight:bold;
        font-size:15px;
        cursor:not-allowed;
        opacity:0.5;
      "
    >
     CONFIRM & SAVE SELECTED HOSTS
    </button>

    <p id="fhConfirmPlanStatus"
      style="
        text-align:center;
        font-size:13px;
        margin-top:12px;
      ">
    </p>
  `;

  modal.append(panel);
  document.body.append(modal);
// FH EMPIRE — Professional Confirmation Layout

panel.style.maxWidth = "850px";
panel.style.width = "100%";
panel.style.padding = "24px";
panel.style.maxHeight = "88vh";
panel.style.overflowX = "hidden";
panel.style.scrollbarWidth = "thin";
panel.style.scrollbarColor = "#806c28 #141414";

const modalStyles = document.createElement("style");

modalStyles.textContent = `
  #fhConfirmPlanModal * {
    box-sizing: border-box;
  }

  #fhConfirmPlanModal input[type="checkbox"] {
    appearance: auto !important;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    max-width: 18px !important;
    min-height: 18px !important;
    flex: 0 0 18px !important;
    margin: 0 !important;
    padding: 0 !important;
    accent-color: #d4af37 !important;
    cursor: pointer;
    box-shadow: none !important;
  }

  #fhConfirmHostList > div {
    max-width: 100%;
  }

  #fhConfirmHostList input[type="text"] {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    height: 42px !important;
    font-size: 15px !important;
    box-shadow: none !important;
  }

  #fhConfirmHostList .fh-actual-host-row {
    display: grid !important;
    grid-template-columns: 20px minmax(0, 1fr) 155px;
    align-items: center;
    gap: 14px !important;
    padding: 14px !important;
    background: #191919 !important;
    border: 1px solid #333 !important;
    border-radius: 9px !important;
  }

  #fhConfirmHostList .fh-host-details {
    min-width: 0 !important;
    overflow-wrap: anywhere;
  }

  #fhConfirmHostList .fh-amount-box {
    width: 100% !important;
    min-width: 0 !important;
  }

  #fhConfirmHostList .fh-actual-host-row:hover {
    border-color: #806c28 !important;
  }

  @media (max-width: 480px) {

    #fhConfirmPlanModal {
      padding: 8px !important;
    }

    #fhConfirmPlanModal > div {
      padding: 14px !important;
    }

    #fhConfirmHostList .fh-actual-host-row {
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 10px !important;
    }

    #fhConfirmHostList .fh-amount-box {
      grid-column: 2;
    }
  }
`;

modal.append(modalStyles);
 const hostList =
  panel.querySelector("#fhConfirmHostList");

// FH EMPIRE — Actual Sending Selection

const actualEntries = selected.map(item => ({
  host: item.host,
  recommended: item.selected.sending,
  actual: item.selected.sending,
  checked: true
}));

const selectAllLabel = document.createElement("label");

selectAllLabel.style.cssText = `
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px;
  background:#292310;
  border-radius:8px;
  margin-bottom:12px;
  cursor:pointer;
`;

const selectAll = document.createElement("input");

selectAll.type = "checkbox";
selectAll.checked = true;

selectAll.style.cssText = `
  width:18px;
  height:18px;
  flex:0 0 18px;
  accent-color:#d4af37;
  margin:0;
  padding:0;
`;

selectAllLabel.append(
  selectAll,
  document.createTextNode("Select All Hosts")
);

hostList.append(selectAllLabel);

const hostControls = [];

actualEntries.forEach((entry, index) => {

  const hostRow = document.createElement("div");
hostRow.className = "fh-actual-host-row";
  hostRow.style.cssText = `
    display:flex;
    align-items:center;
    gap:12px;
    background:#202020;
    border:1px solid #444;
    border-radius:10px;
    padding:12px;
    margin:8px 0;
    flex-wrap:wrap;
  `;

  const hostCheck = document.createElement("input");

  hostCheck.type = "checkbox";
  hostCheck.checked = true;

  hostCheck.style.cssText = `
    width:18px;
    height:18px;
    flex:0 0 18px;
    accent-color:#d4af37;
    margin:0;
    padding:0;
  `;

  const details = document.createElement("div");
details.className = "fh-host-details";
  details.style.cssText =
    "flex:1;min-width:120px;";

  const name = document.createElement("strong");

  name.textContent =
    `${index + 1}. ${entry.host.name}`;

  const id = document.createElement("div");

  id.style.cssText =
    "font-size:11px;color:#999;margin-top:4px;";

  id.textContent = `ID: ${entry.host.id}`;

  const recommended = document.createElement("div");

  recommended.style.cssText =
    "font-size:12px;color:#d4af37;margin-top:5px;";

  recommended.textContent =
    `Recommended: ${fmt(entry.recommended)}`;

  details.append(name, id, recommended);

  const amountBox = document.createElement("div");
amountBox.className = "fh-amount-box";
  amountBox.style.cssText =
    "width:145px;max-width:100%;";

  const amountLabel = document.createElement("div");

  amountLabel.textContent = "ACTUAL SENDING";

  amountLabel.style.cssText =
    "font-size:10px;color:#aaa;margin-bottom:5px;";

  const amountInput = document.createElement("input");

  amountInput.type = "text";
  amountInput.inputMode = "numeric";
  amountInput.value = fmt(entry.actual);

  amountInput.style.cssText = `
    width:100%;
    box-sizing:border-box;
    background:#101010;
    color:#d4af37;
    border:1px solid #666;
    border-radius:7px;
    padding:10px;
    font-size:15px;
    font-weight:bold;
    text-align:right;
  `;

  amountBox.append(amountLabel, amountInput);

  hostRow.append(
    hostCheck,
    details,
    amountBox
  );

  hostList.append(hostRow);

  hostControls.push({
    entry,
    hostCheck,
    amountInput,
    hostRow
  });

  hostCheck.addEventListener("change", () => {

    entry.checked = hostCheck.checked;

    amountInput.disabled = !entry.checked;

    hostRow.style.opacity =
      entry.checked ? "1" : "0.45";

    updateActualSummary();
  });

  amountInput.addEventListener("input", () => {

    const raw = amountInput.value.replace(
      /[^\d]/g, ""
    );

    entry.actual = Number(raw || 0);

    amountInput.value =
      raw ? fmt(entry.actual) : "";

    updateActualSummary();
  });
});

// Live Actual Sending Summary

const actualSummary = document.createElement("div");

actualSummary.style.cssText = `
  background:#1d1a10;
  border:1px solid #d4af37;
  border-radius:10px;
  padding:15px;
  margin:18px 0;
  line-height:2;
`;

hostList.append(actualSummary);

function getActualSendingData() {

  const entries = actualEntries.filter(
    entry => entry.checked
  );

  const valid = entries.length > 0 &&
    entries.every(entry =>
      Number.isSafeInteger(entry.actual) &&
      entry.actual > 0
    );

  const actualTotal = entries.reduce(
    (sum, entry) => sum + entry.actual,
    0
  );

  const limit = autoMode
    ? totalSending
    : available;

  const actualCost =
    actualTotal / 100000 * purchaseRate;

  return {
    entries,
    actualTotal,
    actualCost,
    remaining: limit - actualTotal,
    valid:
      valid &&
      Number.isSafeInteger(actualTotal) &&
      actualTotal <= limit
  };
}

function updateActualSummary() {

  const data = getActualSendingData();

  selectAll.checked = actualEntries.every(
    entry => entry.checked
  );

  selectAll.indeterminate =
    actualEntries.some(entry => entry.checked) &&
    !selectAll.checked;

  let actualProfit = 0;

  if (data.valid) {

    actualProfit = data.entries.reduce(
      (sum, entry) => {

        const item = hostData.find(
          h => String(h.host.id) ===
            String(entry.host.id)
        );

        return sum + evaluateHostSending(
          item,
          entry.actual
        ).conservativeProfit;
      },
      0
    );
  }

  actualSummary.innerHTML = `
    <h3 style="color:#d4af37;margin:0 0 10px;">
      ACTUAL SENDING SUMMARY
    </h3>

    <strong>Selected Hosts:</strong>
    ${data.entries.length} / ${selected.length}<br>

    <strong>Recommended Sending:</strong>
    ${fmt(totalSending)}<br>

    <strong>Actual Sending:</strong>
    <span style="color:#22c55e;font-weight:bold;">
      ${fmt(data.actualTotal)}
    </span><br>

    <strong>Remaining Sending:</strong>
    <span style="color:${
      data.remaining === 0
        ? "#22c55e"
        : data.remaining < 0
          ? "#ef4444"
          : "#fbbf24"
    };">
      ${fmt(data.remaining)}
    </span><br>

    <strong>Actual Sender Payment:</strong>
    Rs ${money(data.actualCost)}<br>

    <strong>Updated Projected Profit:</strong>
    <span style="color:${
      actualProfit >= 0 ? "#22c55e" : "#ef4444"
    };">
      ${data.valid
        ? "Rs " + money(actualProfit)
        : "Invalid sending amount"}
    </span>
  `;

  const confirmation = panel.querySelector(
    "#fhConfirmSendingCompleted"
  );

  const button = panel.querySelector(
    "#fhSaveConfirmedPlan"
  );

  confirmation.checked = false;

  button.disabled = true;
  button.style.opacity = "0.5";
  button.style.cursor = "not-allowed";
}

selectAll.addEventListener("change", () => {

  hostControls.forEach(control => {

    control.entry.checked = selectAll.checked;

    control.hostCheck.checked = selectAll.checked;

    control.amountInput.disabled = !selectAll.checked;

    control.hostRow.style.opacity =
      selectAll.checked ? "1" : "0.45";
  });

  updateActualSummary();
});

updateActualSummary();

  const checkbox = panel.querySelector(
    "#fhConfirmSendingCompleted"
  );

  const saveButton = panel.querySelector(
    "#fhSaveConfirmedPlan"
  );

  const status = panel.querySelector(
    "#fhConfirmPlanStatus"
  );

  const closeButton = panel.querySelector(
    "#fhClosePlanModal"
  );

  closeButton.addEventListener("click", () => {
    modal.remove();
  });

 checkbox.addEventListener("change", () => {

  const data = getActualSendingData();

  const allowed =
    checkbox.checked && data.valid;

  saveButton.disabled = !allowed;

  saveButton.style.opacity =
    allowed ? "1" : "0.5";

  saveButton.style.cursor =
    allowed ? "pointer" : "not-allowed";

  status.style.color = "#ef4444";

  status.textContent = data.valid
    ? ""
    : "Please select hosts and enter valid sending amounts.";
});

  // FH EMPIRE — Bulk Database Save Handler

// FH EMPIRE — Actual Bulk Sending Save

saveButton.addEventListener("click", async () => {

  if (fhOptimizerSaving) return;

  const data = getActualSendingData();

  if (!checkbox.checked || !data.valid) {

    status.style.color = "#ef4444";

    status.textContent =
      "Please confirm valid actual sending amounts.";

    return;
  }

  if (today !== poppoToday()) {

    status.style.color = "#ef4444";

    status.textContent =
      "Poppo date has changed. Please calculate again.";

    return;
  }

  const currentHosts = hosts();

  const invalidHost = data.entries.some(entry => {

    const current = currentHosts.find(
      h => String(h.id) === String(entry.host.id)
    );

    return !current ||
      current.isActive === false ||
      current.type !== entry.host.type;
  });

  if (invalidHost) {

    status.style.color = "#ef4444";

    status.textContent =
      "Host details have changed. Please review the plan.";

    return;
  }

  fhOptimizerSaving = true;

  saveButton.disabled = true;
  closeButton.disabled = true;
  checkbox.disabled = true;
  selectAll.disabled = true;
  optimizerButton.disabled = true;

  hostControls.forEach(control => {
    control.hostCheck.disabled = true;
    control.amountInput.disabled = true;
  });

  saveButton.textContent = "SAVING RECORDS...";

  saveButton.style.opacity = "0.6";
  saveButton.style.cursor = "wait";

  status.style.color = "#d4af37";

  status.textContent =
    "Saving actual sending records to Supabase...";

  let completed = false;
  let batch = null;

  try {

    batch = fhCreateOptimizerBatch(
      data.entries,
      today,
      purchaseRate
    );

    await fhSaveBulkSendingRecords(
      batch.entries
    );

    status.textContent =
      "Verifying saved sending records...";

    const verification =
      await fhVerifyBulkSendingRecords(
        batch.entries
      );

    save(verification.records);

    renderHistory();

    fhClearPendingOptimizerBatch(batch.id);

    completed = true;
// Update remaining sending after successful save
if (!autoMode) {
  $("optimizerAvailableSending").value =
    fmt(data.remaining);
}
    status.style.color = "#22c55e";

    status.textContent =
      `Successfully saved ${verification.count} ` +
      `host sending records.`;

    saveButton.textContent =
      "✓ RECORDS SAVED SUCCESSFULLY";

    saveButton.style.background = "#15803d";
    saveButton.style.color = "#ffffff";
    saveButton.style.opacity = "1";
    saveButton.style.cursor = "default";

    confirmPlanBtn.disabled = true;

    confirmPlanBtn.textContent =
      "✓ Sending Records Saved";

    confirmPlanBtn.style.opacity = "0.6";

    optimizerResult.replaceChildren();

    const successBox = document.createElement("div");

    successBox.style.cssText = `
      background:#102218;
      border:1px solid #15803d;
      border-radius:12px;
      padding:22px;
      line-height:2;
      margin:15px 0;
    `;

    successBox.innerHTML = `
      <h3 style="color:#22c55e;margin-top:0;">
        ✓ SENDING SAVED SUCCESSFULLY
      </h3>

      <strong>Saved Hosts:</strong>
      ${verification.count}<br>

      <strong>Actual Sending:</strong>
      ${fmt(data.actualTotal)}<br>

      <strong>Purchase Cost:</strong>
      Rs ${money(data.actualCost)}<br>

      <strong>Remaining Sending:</strong>
      ${fmt(data.remaining)}<br>

      <strong>Sale Status:</strong>
      UNSOLD<br>

      <strong>Poppo Date:</strong>
      ${today}<br>

      <p style="color:#aaa;">
        Records are available in Sending History.
        Calculate again to create a fresh plan.
      </p>
    `;

    optimizerResult.append(successBox);

    showMessage(
      "✓ Optimizer sending records saved successfully."
    );

    closeButton.textContent = "Done";

  } catch (error) {

    console.error(
      "Optimizer bulk saving failed:",
      error
    );

    status.style.color = "#ef4444";

    status.textContent =
      error.message ||
      "Saving could not be verified. Please retry.";

    saveButton.textContent =
      "RETRY & VERIFY SAVING";

    saveButton.disabled = false;

    saveButton.style.opacity = "1";
    saveButton.style.cursor = "pointer";

  } finally {

    fhOptimizerSaving = false;

    closeButton.disabled = false;
    optimizerButton.disabled = false;

    // Once a batch exists, keep its amounts locked
    // so retry uses the same record IDs and values.

    if (!completed && !batch) {

      checkbox.disabled = false;
      selectAll.disabled = false;

      hostControls.forEach(control => {

        control.hostCheck.disabled = false;

        control.amountInput.disabled =
          !control.entry.checked;
      });
    }
   }
});

}); // Close confirmPlanBtn event listener

optimizerResult.append(confirmPlanBtn);
// Host cards start here
selected.forEach((item, index) => {
    const result = item.selected;

    const card = document.createElement("div");
    card.style.cssText =
      "border:1px solid #8b741d;border-radius:10px;" +
      "padding:14px;margin:12px 0;";

    const name = document.createElement("h4");
    name.textContent =
      `${index + 1}. ${item.host.name} (${item.host.id})`;

    const details = document.createElement("p");
    
    details.innerHTML = `
      <strong>Send Now:</strong> ${fmt(result.sending)}<br>
      <strong>Expected Receiving:</strong>
      ${fmt(result.sending * 0.7)}<br>
      <strong>Today's Reward Level:</strong>
      ${result.days[0].level}<br>
      <strong>Normal Coins:</strong>
      ${fmt(result.normalCoins)}<br>
      <strong>Extra 7-Day Reward Points:</strong>
      ${fmt(result.extraRewardPoints)}<br>
      <strong>FH Reward Share Points:</strong>
      ${fmt(result.fhRewardPoints)}<br>
      <strong>FH Extra Reward Coins:</strong>
      ${fmt(result.rewardCoins)}<br>
      <strong>Host Projected Profit:</strong>
      Rs ${money(result.profit)}
    `;

    card.append(name, details);
// Copy & Send — Recommended Host Sending
const sendingMessage =
  `FH EMPIRE - Sending Details\n` +
  `Host: ${item.host.name}\n` +
  `Poppo ID: ${item.host.id}\n` +
  `Sending: ${fmt(result.sending)} Coins\n` +
  `Receiving: ${fmt(result.sending * 0.7)} Points`;

const actionRow = document.createElement("div");
actionRow.style.cssText =
  "display:flex;gap:10px;flex-wrap:wrap;margin:12px 0;";

const copyBtn = document.createElement("button");
copyBtn.type = "button";
copyBtn.textContent = "📋 Copy";
copyBtn.style.cssText =
  "background:#d4af37;color:#111;border:0;" +
  "padding:10px 16px;border-radius:8px;" +
  "font-weight:bold;cursor:pointer;";

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(sendingMessage);
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "📋 Copy";
    }, 1500);
  } catch (error) {
    alert("Copy failed. Please try again.");
  }
});

const sendBtn = document.createElement("button");
sendBtn.type = "button";
sendBtn.textContent = "📤 Send WhatsApp";
sendBtn.style.cssText =
  "background:#176b45;color:white;border:0;" +
  "padding:10px 16px;border-radius:8px;" +
  "font-weight:bold;cursor:pointer;";

sendBtn.addEventListener("click", () => {
  const url =
    "https://wa.me/?text=" +
    encodeURIComponent(sendingMessage);

  window.open(url, "_blank", "noopener,noreferrer");
});

actionRow.append(copyBtn, sendBtn);
card.append(actionRow);
    const dailyTitle = document.createElement("strong");
    dailyTitle.textContent = "7-Day Reward Comparison";
    card.append(dailyTitle);

    result.days.forEach((day, i) => {
      const line = document.createElement("p");
      line.style.margin = "5px 0";
      line.textContent =
        `Day ${i + 1} (${day.date}) | ` +
        `Level ${day.level} | ` +
        `Without: ${fmt(day.oldReward)} | ` +
        `With: ${fmt(day.newReward)} | ` +
        `Extra: ${fmt(day.extraPoints)}`;

      card.append(line);
    });

    optimizerResult.append(card);
  });

  const note = document.createElement("p");
  note.style.marginTop = "15px";
  note.textContent =
    "IMPORTANT: Ye 7-day incremental profit projection hai. " +
    "Nayi sending aaj poori allocate hoti hai. " +
    "Future mein koi additional sending assume nahi ki gayi. " +
    "Reward tabhi milega jab daily tasks complete aur claim hon. " +
    "Existing monthly salary ko per-deal cost mein dobara nahi jora. " +
    "Reward conversion aur selling rates estimates hain.";

  optimizerResult.append(note);

} // End renderSelectedPlan
const fullSendingPlan = candidates.find(
  plan => plan.units === units
);

if (!autoMode && fullSendingPlan) {
  suggestions.unshift({
    ...fullSendingPlan,
    name: "Full Sending Plan",
    description:
      "Best distribution for the complete entered sending amount"
  });
}
const defaultPlan =
  suggestions.find(
    plan => plan.name === (
      autoMode
        ? "Maximum Profit"
        : "Full Sending Plan"
    )
  ) || suggestions[0];

renderSelectedPlan(defaultPlan);

} // End runMaximumProfitOptimizer

  // Automatic comma formatting — Available Sending
  const availableSendingInput = $("optimizerAvailableSending");

  availableSendingInput?.addEventListener("input", () => {
    const raw = availableSendingInput.value.replace(/[^\d]/g, "");

    availableSendingInput.value = raw
      ? Number(raw).toLocaleString("en-US")
      : "";
  });
    // STEP 11E — Host-wise next reward target
  function calculateHostRecommendation(host, purchaseRate) {
    if (!["salarybase", "halfhalf"].includes(host.type)) {
      return null;
    }

    const receiving = rollingReceiving(host.id);
    const next = getNextRewardLevel(receiving);

    if (!next) {
      return {
        host,
        receiving,
        nextLevel: "Maximum S",
        sendingNeeded: 0,
        cost: 0
      };
    }

    const receivingNeeded = Math.max(0, next.target - receiving);
    const sendingNeeded = Math.ceil(receivingNeeded / 0.7);

    return {
      host,
      receiving,
      nextLevel: next.level,
      receivingNeeded,
      sendingNeeded,
      cost: sendingNeeded / 100000 * purchaseRate
    };
  }
  optimizerButton?.addEventListener(
    "click",
    runMaximumProfitOptimizer
  );
  fhRenderPendingOptimizerNotice();
  // ==========================================
// FH EMPIRE - REWARD ADJUSTMENT RECORDS
// ==========================================


const REWARD_ADJUSTMENT_KEY = "fh_reward_adjustments_v1";
const rewardElement = id => document.getElementById(id);
const rewardFmt = n => Number(n).toLocaleString("en-US");

let editingRewardId = null;

async function loadRewardAdjustmentsFromSupabase() {
  try {
    const remoteRecords = await fhLoadRewardAdjustments();

    if (!Array.isArray(remoteRecords)) {
      throw new Error("Invalid reward records response.");
    }

    const localRecords = getRewardAdjustments();

    // Same host + date ko ek hi record samjho.
    const merged = new Map();

    localRecords.forEach(record => {
      const key = `${record.hostId}|${record.date}`;
      merged.set(key, record);
    });

    // Supabase ko latest shared source samjho.
    // Existing local-only records preserve rahenge.
    remoteRecords.forEach(record => {
      const key = `${record.hostId}|${record.date}`;
      merged.set(key, record);
    });

    saveRewardAdjustments([...merged.values()]);
    renderRewardAdjustments();

    console.log(
      "FH Reward Sync Complete:",
      remoteRecords.length,
      "Supabase records"
    );

    return remoteRecords;

  } catch (error) {
    console.error("Reward Loading Error:", error);
    return null;
  }
}

function getRewardAdjustments() {
  try {
    const data = JSON.parse(
      localStorage.getItem(REWARD_ADJUSTMENT_KEY) || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveRewardAdjustments(data) {
  localStorage.setItem(
    REWARD_ADJUSTMENT_KEY,
    JSON.stringify(data)
  );
}
async function syncRewardAdjustmentToSupabase(record) {
  if (typeof fhSaveRewardAdjustment !== "function") {
    throw new Error("Supabase reward helper not available.");
  }

  await fhSaveRewardAdjustment(record);

  console.log(
    "Reward synced to Supabase:",
    record.hostId,
    record.date
  );
}
function refreshRewardHosts() {
  const select = rewardElement("rewardHost");
  if (!select) return;

  const selected = select.value;
  select.replaceChildren(new Option("Select Host", ""));

  hosts().forEach(host => {
    select.add(new Option(
      `${host.name} (${host.id})`,
      String(host.id)
    ));
  });

  if ([...select.options].some(o => o.value === selected)) {
    select.value = selected;
  }
}

// Selected date + previous 6 days

function rewardRollingReceiving(hostId, selectedDate) {
  const start = dateShift(selectedDate, -6);

  return records()
    .filter(r =>
      String(r.hostId) === String(hostId) &&
      r.date >= start &&
      r.date <= selectedDate
    )
    .reduce((sum, r) => sum + Number(r.sending) * 0.7, 0);
}


function getSelectedRewardInfo() {
  const hostId = rewardElement("rewardHost")?.value;
  const date = rewardElement("rewardDate")?.value;

  if (!hostId || !date) return null;

  const host = hosts().find(
    h => String(h.id) === String(hostId)
  );

  if (!host) return null;

  const rolling = rewardRollingReceiving(hostId, date);
  const level = getRewardLevel(rolling);
  const expected = level ? level.daily : 0;

  return {
    host,
    date,
    rolling,
    level: level?.level || "No Level",
    expected,
   perTask: expected / (["S", "A"].includes(level?.level) ? 4 : 3)
  };
}

function updateAdvancedHourlyInputs() {
  const mode = rewardElement("rewardMode")?.value;
  const section = rewardElement("advancedHourlySection");
  const container = rewardElement("hourlyRewardInputs");
  const info = getSelectedRewardInfo();

  if (!section || !container) return;

  section.style.display =
    mode === "advanced" ? "block" : "none";

  container.replaceChildren();

  if (mode !== "advanced" || !info) return;

  const hours = ["S", "A"].includes(info.level) ? 4 : 3;

  for (let hour = 1; hour <= hours; hour++) {
    const field = document.createElement("div");
    field.className = "reward-field";

    const label = document.createElement("label");
    label.textContent = `Hour ${hour} — Collected Points`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.id = `rewardHour${hour}`;
    input.placeholder = `Example: ${info.perTask}`;
    input.value = String(info.perTask);

    field.append(label, input);
    container.append(field);
  }
}

function updateAdvancedHourlyInputs() {
  const mode = rewardElement("rewardMode")?.value;
  const section = rewardElement("advancedHourlySection");
  const container = rewardElement("hourlyRewardInputs");
  const info = getSelectedRewardInfo();

  if (!section || !container) return;

  section.style.display =
    mode === "advanced" ? "block" : "none";

  container.replaceChildren();

  if (mode !== "advanced" || !info) return;

  const hours = ["S", "A"].includes(info.level) ? 4 : 3;

  const currentLevelIndex = REWARD_LEVELS.findIndex(
    level => level.level === info.level
  );

  for (let hour = 1; hour <= hours; hour++) {
    const field = document.createElement("div");
    field.className = "reward-field";

    const label = document.createElement("label");
    label.textContent = `Hour ${hour} — Reward`;

    const select = document.createElement("select");
    select.id = `rewardHour${hour}`;

    select.add(new Option(
      `Current Reward — ${rewardFmt(info.perTask)}`,
      "current"
    ));

    select.add(new Option("Higher Reward", "higher"));
    select.add(new Option("Missed Reward — 0", "missed"));

    const higherLevel = document.createElement("select");
    higherLevel.id = `rewardHigherLevel${hour}`;
    higherLevel.style.display = "none";

    higherLevel.add(new Option("Select Higher Level", ""));

    REWARD_LEVELS
      .slice(0, Math.max(0, currentLevelIndex))
      .forEach(level => {
        const levelHours =
          ["S", "A"].includes(level.level) ? 4 : 3;

        const points = level.daily / levelHours;

        higherLevel.add(new Option(
          `Level ${level.level} — ${rewardFmt(points)} Points`,
          level.level
        ));
      });

    
select.addEventListener("change", () => {
  higherLevel.style.display =
    select.value === "higher" ? "block" : "none";

  updateRewardCollectionSummary();
});

higherLevel.addEventListener("change", () => {
  updateRewardCollectionSummary();
});


    field.append(label, select, higherLevel);
    container.append(field);
  }
}

rewardElement("rewardMode")?.addEventListener("change", () => {
  updateAdvancedHourlyInputs();
  updateRewardCollectionSummary();
});

function updateRewardCollectionPreview() {
  const info = getSelectedRewardInfo();
  const dropdown = rewardElement("rewardReceivedTasks");
  const previous = dropdown?.value || "";

  if (!dropdown) return;

  dropdown.replaceChildren();

  if (!info) {
    dropdown.add(new Option("Select host and date first", ""));
  } else {
    dropdown.add(new Option("Select received reward", ""));

   const maxTasks = ["S", "A"].includes(info.level) ? 4 : 3;

for (let tasks = 0; tasks <= maxTasks; tasks++) {
      dropdown.add(new Option(
        `${rewardFmt(info.perTask * tasks)} Points — ${tasks} Task${tasks === 1 ? "" : "s"}`,
        String(tasks)
      ));
    }

   if (
  previous !== "" &&
  Number.isInteger(Number(previous)) &&
  Number(previous) >= 0 &&
  Number(previous) <= maxTasks
) {
  dropdown.value = previous;
}
  }

  rewardElement("rewardLevelDisplay").textContent =
    info?.level || "—";

  rewardElement("rewardPerTaskDisplay").textContent =
    rewardFmt(info?.perTask || 0);

  rewardElement("rewardExpectedDisplay").textContent =
    rewardFmt(info?.expected || 0);

  updateRewardCollectionSummary();
  updateAdvancedHourlyInputs();
}


function updateRewardCollectionSummary() {
  const info = getSelectedRewardInfo();
  const mode = rewardElement("rewardMode")?.value || "normal";
  const tasksRaw = rewardElement("rewardReceivedTasks")?.value;

  const expected = info?.expected || 0;
  let received = 0;
  let valid = false;

  if (info && mode === "advanced") {
    const hours = ["S", "A"].includes(info.level) ? 4 : 3;
    valid = true;

    for (let hour = 1; hour <= hours; hour++) {
      const choice = rewardElement(`rewardHour${hour}`)?.value;

      if (choice === "current") {
        received += info.perTask;

      } else if (choice === "higher") {
        const selectedLevel =
          rewardElement(`rewardHigherLevel${hour}`)?.value;

        const level = REWARD_LEVELS.find(
          item => item.level === selectedLevel
        );

        if (!level) {
          valid = false;
          continue;
        }

        const levelHours =
          ["S", "A"].includes(level.level) ? 4 : 3;

        received += level.daily / levelHours;

      } else if (choice === "missed") {
        received += 0;

      } else {
        valid = false;
      }
    }

  } else if (info) {
    const maxTasks = ["S", "A"].includes(info.level) ? 4 : 3;

    valid =
      tasksRaw !== "" &&
      Number.isInteger(Number(tasksRaw)) &&
      Number(tasksRaw) >= 0 &&
      Number(tasksRaw) <= maxTasks;

    if (valid) {
      received = info.perTask * Number(tasksRaw);
    }
  }

  // Incomplete selection ko zero received na samjho.
  const missed = valid
    ? Math.max(0, expected - received)
    : 0;

  rewardElement("rewardSummaryExpected").textContent =
    rewardFmt(expected);

  rewardElement("rewardSummaryReceived").textContent =
    valid ? rewardFmt(received) : "—";

  rewardElement("rewardSummaryMissed").textContent =
    valid ? rewardFmt(missed) : "—";


const extra = valid ? Math.max(0, received - expected) : 0;

const extraElement = rewardElement("rewardSummaryExtra");

if (extraElement) {
  extraElement.textContent =
    valid ? rewardFmt(extra) : "—";
}

}
document.getElementById("rewardHistoryHost")
  ?.addEventListener("change", renderRewardAdjustments);

document.getElementById("rewardHistoryDate")
  ?.addEventListener("change", renderRewardAdjustments);
function renderRewardAdjustments() {
  const container = rewardElement("rewardAdjustmentHistory");
  if (!container) return;

  container.replaceChildren();

  const hostFilter = rewardElement("rewardHistoryHost");
const dateFilter = rewardElement("rewardHistoryDate");

const allRecords = getRewardAdjustments();

if (hostFilter) {
  const selectedHost = hostFilter.value;

  const uniqueHosts = [
    ...new Set(allRecords.map(r => String(r.hostId)))
  ];

  hostFilter.replaceChildren(new Option("All Hosts", ""));

  uniqueHosts.forEach(hostId => {
    const host = hosts().find(
      h => String(h.id) === hostId
    );

    const record = allRecords.find(
      r => String(r.hostId) === hostId
    );

    hostFilter.add(
      new Option(
        host?.name || record?.hostName || hostId,
        hostId
      )
    );
  });

  hostFilter.value = selectedHost;
}

const selectedHost = hostFilter?.value || "";
const selectedDate = dateFilter?.value || "";

const data = allRecords
  .filter(record =>
    (!selectedHost ||
      String(record.hostId) === selectedHost) &&
    (!selectedDate ||
      String(record.date) === selectedDate)
  )
  .sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );

  if (!data.length) {
    container.textContent = "No reward records yet.";
    return;
  }

  data.forEach(record => {
    const card = document.createElement("div");
    const details = document.createElement("p");
card.style.cssText = `
  background: #141414;
  border: 1px solid #665000;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  transition: 0.2s ease;
`;

details.style.cssText = `
  color: #eeeeee;
  font-size: 13px;
  line-height: 1.9;
  margin: 0 0 12px;
  overflow-wrap: anywhere;
`;

card.addEventListener("mouseenter", () => {
  card.style.borderColor = "#ffcc00";
  card.style.boxShadow = "0 0 12px rgba(255,204,0,0.12)";
});

card.addEventListener("mouseleave", () => {
  card.style.borderColor = "#665000";
  card.style.boxShadow = "none";
});
    const received = record.received ??
      (Number(record.expected) - Number(record.minus));

    
const latestHost = hosts().find(
  host => String(host.id) === String(record.hostId)
);

const displayHostName =
  latestHost?.name || record.hostName || "Unknown Host";

const categoryNames = {
  host: "Host Mistake",
  technical: "Technical / Poppo Issue",
  emergency: "Genuine Emergency",
  other: "Other / Manual Review"
};

const rewardInfo = document.createElement("div");

rewardInfo.style.cssText = `
  color: #eeeeee;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 14px;
`;

const infoRow = (label, value) => {
  const row = document.createElement("div");
  row.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px solid #292929;
  `;

  const left = document.createElement("span");
  left.textContent = label;
  left.style.color = "#aaaaaa";

  const right = document.createElement("strong");
  right.textContent = value;
  right.style.cssText = `
    color: #ffffff;
    text-align: right;
    overflow-wrap: anywhere;
  `;

  row.append(left, right);
  return row;
};

const title = document.createElement("div");
title.textContent = displayHostName;
title.style.cssText = `
  color: #ffcc00;
  font-size: 16px;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

const subtitle = document.createElement("div");
subtitle.textContent =
  `Poppo ID: ${record.hostId} | ${record.date} | Level: ${record.level || "N/A"}`;

subtitle.style.cssText = `
  color: #aaaaaa;
  font-size: 11px;
  margin: 5px 0 14px;
  overflow-wrap: anywhere;
`;

const stats = document.createElement("div");
stats.style.cssText = `
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
`;

[
  ["Expected", record.expected, "#ffcc00"],
  ["Received", received, "#22c55e"],
  ["Missed", record.minus, "#ef4444"]
].forEach(([label, value, color]) => {
  const box = document.createElement("div");
  box.style.cssText = `
    background: #1b1b1b;
    border: 1px solid #48402a;
    border-radius: 8px;
    padding: 10px 5px;
    text-align: center;
    min-width: 0;
  `;

  const heading = document.createElement("div");
  heading.textContent = label;
  heading.style.cssText = `
    font-size: 10px;
    color: #aaaaaa;
    margin-bottom: 5px;
  `;

  const number = document.createElement("strong");
  number.textContent = rewardFmt(value);
  number.style.cssText = `
    color: ${color};
    font-size: clamp(11px, 2vw, 16px);
    overflow-wrap: anywhere;
  `;

  box.append(heading, number);
  stats.append(box);
});

rewardInfo.append(
  title,
  subtitle,
  stats,
  infoRow("Missed Reason", record.reason || "None"),
  infoRow(
    "Category",
    categoryNames[record.deductionReason] || "None"
  ),
  infoRow(
    "Salary Deduction",
    record.deductionApproved === true
      ? "Approved"
      : "Not Approved"
  ),
  infoRow(
    "Deduction Amount",
    `Rs ${Number(record.deductionAmount || 0).toLocaleString("en-PK")}`
  )
);

details.replaceChildren(rewardInfo);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.style.marginRight = "10px";

edit.addEventListener("click", () => {
  if (record.tasks === undefined) {
    rewardElement("rewardAdjustmentMessage").textContent =
      "Old manual record cannot be edited here.";
    return;
  }

  refreshRewardHosts();

  rewardElement("rewardHost").value = String(record.hostId);
  rewardElement("rewardDate").value = record.date;

  const mode = record.rewardMode === "advanced"
    ? "advanced"
    : "normal";

  rewardElement("rewardMode").value = mode;

  // Host, date aur mode ke mutabiq inputs create karo.
  updateRewardCollectionPreview();
  updateAdvancedHourlyInputs();

  if (mode === "advanced") {
    const savedHours = Array.isArray(record.hourlyRewards)
      ? record.hourlyRewards
      : [];

    if (!savedHours.length) {
      rewardElement("rewardAdjustmentMessage").textContent =
        "Hourly details missing. Cannot edit this record safely.";
      return;
    }

    for (const item of savedHours) {
      const hour = Number(item.hour);
      const select = rewardElement(`rewardHour${hour}`);
      const higherLevel =
        rewardElement(`rewardHigherLevel${hour}`);

      if (!select) {
        rewardElement("rewardAdjustmentMessage").textContent =
          `Hour ${hour} input unavailable. Edit cancelled.`;
        return;
      }

      select.value = item.choice;

      if (item.choice === "higher" && higherLevel) {
        higherLevel.style.display = "block";
        higherLevel.value = item.level || "";
      } else if (higherLevel) {
        higherLevel.style.display = "none";
      }
    }

  } else {
    rewardElement("rewardReceivedTasks").value =
      String(record.tasks);
  }

  rewardElement("rewardMinusReason").value =
    record.reason || "";

const deductionSelect =
  rewardElement("rewardDeductionReason");

if (deductionSelect) {
  deductionSelect.value =
    record.deductionReason || "none";
}

const approvalCheckbox =
  rewardElement("rewardDeductionApproved");

if (approvalCheckbox) {
  approvalCheckbox.checked =
    record.deductionApproved === true;
}

  editingRewardId = record.id;

  updateRewardCollectionSummary();

  rewardElement("rewardAdjustmentMessage").textContent =
    "Editing record. Click Save to update.";

  rewardElement("rewardAdjustmentSection")
    .scrollIntoView({ behavior: "smooth" });
});

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
remove.addEventListener("click", async () => {
  if (!confirm("Delete this reward record?")) return;

  remove.disabled = true;
  remove.textContent = "Deleting...";

  try {
    await fhDeleteRewardAdjustment(record.hostId, record.date);

    saveRewardAdjustments(
      getRewardAdjustments().filter(r =>
        !(
          String(r.hostId) === String(record.hostId) &&
          r.date === record.date
        )
      )
    );

   if (editingRewardId === record.id) {
  editingRewardId = null;

  rewardElement("rewardHost").value = "";
  rewardElement("rewardDate").value = "";
  rewardElement("rewardReceivedTasks").value = "";
  rewardElement("rewardMinusReason").value = "";
  rewardElement("rewardDeductionReason").value = "none";
  rewardElement("rewardDeductionApproved").checked = false;

  updateRewardCollectionPreview();

  rewardElement("rewardAdjustmentMessage").textContent =
    "Record deleted. Form reset.";
}

    renderRewardAdjustments();

  } catch (error) {
    console.error("Reward Delete Error:", error);
    alert("Reward delete failed: " + error.message);

    remove.disabled = false;
    remove.textContent = "Delete";
  }
});

    card.append(details, edit, remove);
    container.append(card);
  });
}

const FH_DEDUCTION_SELLING_RATE = 2900;
const FH_DAILY_DEDUCTION_CAP = 1000;
const FH_MONTHLY_DEDUCTION_CAP = 2500;

function calculateRewardDeduction(missedPoints) {
  const points = Math.max(0, Number(missedPoints) || 0);

  const grossUSD = points / 10000;

  const feeUSD = grossUSD >= 65
    ? 1
    : grossUSD * 0.015;

  const coins = Math.max(0, grossUSD - feeUSD) * 9900;

  const lossPKR =
    (coins / 100000) * FH_DEDUCTION_SELLING_RATE;

  return Math.min(
    FH_DAILY_DEDUCTION_CAP,
    Math.round(lossPKR)
  );
}

function calculateMonthlyDeduction(
  hostId,
  date,
  proposedAmount,
  records,
  editingId = null
) {
  const month = String(date).slice(0, 7);

  const existingTotal = records
    .filter(record =>
      String(record.hostId) === String(hostId) &&
      String(record.date).slice(0, 7) === month &&
      record.id !== editingId &&
      record.deductionApproved === true
    )
    .reduce(
      (sum, record) =>
        sum + Number(record.deductionAmount || 0),
      0
    );

  const remaining = Math.max(
    0,
    FH_MONTHLY_DEDUCTION_CAP - existingTotal
  );

  return Math.min(
    Math.max(0, Number(proposedAmount) || 0),
    remaining
  );
}

async function saveRewardAdjustmentRecord() {
  const info = getSelectedRewardInfo();
  const mode = rewardElement("rewardMode")?.value || "normal";
  const tasksRaw = rewardElement("rewardReceivedTasks")?.value;
  const reason = rewardElement("rewardMinusReason")?.value.trim() || "";
  const deductionReason =
  rewardElement("rewardDeductionReason")?.value || "none";
  const message = rewardElement("rewardAdjustmentMessage");

  if (!info) {
    message.textContent = "Please select host and date.";
    return;
  }

  const maxTasks = ["S", "A"].includes(info.level) ? 4 : 3;

  let tasks = 0;
  let received = 0;
  let hourlyRewards = null;

  if (mode === "advanced") {
    hourlyRewards = [];

    for (let hour = 1; hour <= maxTasks; hour++) {
      const choice = rewardElement(`rewardHour${hour}`)?.value;

      if (!["current", "higher", "missed"].includes(choice)) {
        message.textContent = `Hour ${hour}: Select reward.`;
        return;
      }

      let points = 0;
      let selectedLevel = null;

      if (choice === "current") {
        points = info.perTask;
        selectedLevel = info.level;
      }

      if (choice === "higher") {
        selectedLevel =
          rewardElement(`rewardHigherLevel${hour}`)?.value;

        const level = REWARD_LEVELS.find(
          item => item.level === selectedLevel
        );

        const currentIndex = REWARD_LEVELS.findIndex(
          item => item.level === info.level
        );

        const higherIndex = REWARD_LEVELS.findIndex(
          item => item.level === selectedLevel
        );

        if (
          !level ||
          currentIndex < 0 ||
          higherIndex < 0 ||
          higherIndex >= currentIndex
        ) {
          message.textContent =
            `Hour ${hour}: Select a valid higher level.`;
          return;
        }

        const levelHours =
          ["S", "A"].includes(level.level) ? 4 : 3;

        points = level.daily / levelHours;
      }

      hourlyRewards.push({
        hour,
        choice,
        level: selectedLevel,
        points
      });

      received += points;
    }

    tasks = hourlyRewards.filter(
      item => item.choice !== "missed"
    ).length;

  } else {
    if (
      tasksRaw === "" ||
      !Number.isInteger(Number(tasksRaw)) ||
      Number(tasksRaw) < 0 ||
      Number(tasksRaw) > maxTasks
    ) {
      message.textContent =
        "Please select received reward.";
      return;
    }

    tasks = Number(tasksRaw);
    received = info.perTask * tasks;
  }

  const minus = info.expected - received;

  if (minus > 0 && !reason) {
    message.textContent =
      "Missed reward ka reason zaroori hai.";
    return;
  }

if (minus > 0 && deductionReason === "none") {
  message.textContent =
    "Please select missed reward category.";
  return;
}

  const data = getRewardAdjustments();


  const duplicate = data.some(record =>
    String(record.hostId) === String(info.host.id) &&
    record.date === info.date &&
    record.id !== editingRewardId
  );

  if (duplicate) {
    message.textContent =
      "This host already has a reward record for this date. Please edit the existing record.";
    return;
  }

  // FH EMPIRE — Salary Deduction Details
  // Existing records ke liye default: no deduction.
  
 const deductionApproved =
  rewardElement("rewardDeductionApproved")?.checked === true &&
  deductionReason === "host" &&
  minus > 0 &&
  String(info.host.type).toLowerCase() === "salarybase";

const deductionAmount =
  deductionReason === "host" &&
  minus > 0 &&
  String(info.host.type).toLowerCase() === "salarybase"
    ? calculateRewardDeduction(minus)
    : 0;
    
const finalDeductionAmount = deductionApproved
  ? calculateMonthlyDeduction(
      info.host.id,
      info.date,
      deductionAmount,
      data,
      editingRewardId
    )
  : 0;
  const record = {
    id: editingRewardId || (
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    ),
    hostId: String(info.host.id),
    hostName: info.host.name,
    date: info.date,
    rolling: info.rolling,
    level: info.level,
    expected: info.expected,
    tasks,
    received,
    minus,
    reason: minus > 0 ? reason : "",
    rewardMode: mode,
   hourlyRewards,
deductionReason,
deductionApproved,
deductionAmount: finalDeductionAmount
  };

  if (editingRewardId) {
    const index = data.findIndex(
      item => item.id === editingRewardId
    );

    if (index === -1) {
      message.textContent = "Original record not found.";
      return;
    }

    data[index] = record;
  } else {
    data.push(record);
  }

  const saveButton = rewardElement("saveRewardAdjustment");

  try {
    if (saveButton) saveButton.disabled = true;

    await syncRewardAdjustmentToSupabase(record);

    saveRewardAdjustments(data);
    editingRewardId = null;

  } catch (error) {
    console.error("Reward Supabase Save Error:", error);
    message.textContent =
      "Reward save failed: " + error.message;
    return;

  } finally {
    if (saveButton) saveButton.disabled = false;
  }

  rewardElement("rewardReceivedTasks").value = "";
  rewardElement("rewardMinusReason").value = "";
  const deductionSelect =
  rewardElement("rewardDeductionReason");

if (deductionSelect) {
  deductionSelect.value = "none";
}

const approvalCheckbox =
  rewardElement("rewardDeductionApproved");

if (approvalCheckbox) {
  approvalCheckbox.checked = false;
}

  message.textContent = "Reward record saved successfully.";

  updateRewardCollectionSummary();
  renderRewardAdjustments();
}


rewardElement("rewardHost")?.addEventListener(
  "focus",
  refreshRewardHosts
);

rewardElement("rewardHost")?.addEventListener(
  "change",
  updateRewardCollectionPreview
);

rewardElement("rewardDate")?.addEventListener(
  "change",
  updateRewardCollectionPreview
);

rewardElement("rewardReceivedTasks")?.addEventListener(
  "change",
  updateRewardCollectionSummary
);

rewardElement("saveRewardAdjustment")?.addEventListener(
  "click",
  saveRewardAdjustmentRecord
);

refreshRewardHosts();
renderRewardAdjustments();
updateRewardCollectionPreview();
loadRewardAdjustmentsFromSupabase();
 
 
window.addEventListener("fh-hosts-updated", () => {
  refreshHosts();
  refreshRewardHosts();
  renderHistory();
  renderRewardAdjustments();
  updateRewardCollectionPreview();
 
  
});

  console.log("FH EMPIRE — Sending Records loaded.");
})();
