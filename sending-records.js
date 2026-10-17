
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
  // Rolling 7-day receiving, including current Poppo date
  function rollingReceiving(hostId) {
    const today = poppoToday();
    const firstDay = dateShift(today, -6);

    return records()
      .filter(r =>
        r.hostId === hostId &&
        r.date >= firstDay &&
        r.date <= today
      )
      .reduce((sum, r) => sum + r.sending * 0.7, 0);
  }

  // Available for future reward-level integration
  window.FHSendingRecords = {
    hosts,
    records,
    rollingReceiving,
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

  refreshHosts();
clearForm();

async function initializeSendingHistory() {
  try {
    const cloudRecords = await fhLoadSendingRecords();

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

function runMaximumProfitOptimizer() {
  const available = optimizerNumber("optimizerAvailableSending");
  const purchaseRate = optimizerNumber("optimizerPurchaseRate");
  const sellingRate = optimizerNumber("optimizerSellingRate");

  const STEP = 10000;
  const fmt = n => Math.round(n).toLocaleString("en-US");
  const money = n => Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (
    !Number.isSafeInteger(available) ||
    available < STEP ||
    available % STEP !== 0 ||
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

  const units = available / STEP;

  if (units > 3000) {
  optimizerResult.textContent =
    "30 million se zyada sending ke liye large-scale optimization required hai.";
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

      const receiving = history
        .filter(r =>
          String(r.hostId) === String(host.id) &&
          r.date >= startDate &&
          r.date <= targetDate
        )
        .reduce(
          (sum, r) => sum + Number(r.sending) * 0.7,
          0
        );

      historical.push(receiving);
    }

    return {
      host,
      historical,
      options: []
    };
  });

  // Har host ke liye 0, 10K, 20K ... available
  // sending tak 7-day profit calculate karo.
  for (const item of hostData) {
    const share = item.host.type === "halfhalf" ? 0.5 : 1;

    for (let u = 0; u <= units; u++) {
      const sending = u * STEP;
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
          level: getRewardLevel(newReceiving)?.level || "None"
        });
      }

      // Sirf FH EMPIRE ka reward share.
      const fhRewardPoints = extraRewardPoints * share;

      // Reward points ko estimated coins mein convert karo.
     
const rewardGrossUSD = fhRewardPoints / 10000;

// Best case: rewards existing sending withdrawal ke
// saath combine hon, sirf additional fee count hogi.
const hostGrossUSD = sending * 0.70 / 10000;

const combinedExtraFee = Math.max(
  0,
  calculateWithdrawalFee(hostGrossUSD + rewardGrossUSD) -
  calculateWithdrawalFee(hostGrossUSD)
);

// Conservative: extra rewards separate withdraw hon.
const separateRewardFee = calculateWithdrawalFee(rewardGrossUSD);

const bestRewardCoins = Math.max(
  0,
  rewardGrossUSD - combinedExtraFee
) * 9900;

const conservativeRewardCoins = Math.max(
  0,
  rewardGrossUSD - separateRewardFee
) * 9900;

// Existing optimizer ka profit best-case par optimize hoga.
const rewardCoins = bestRewardCoins;


      const totalCoins = normalCoins + rewardCoins;
      const saleValue = totalCoins / 100000 * sellingRate;
      const cost = sending / 100000 * purchaseRate;

      item.options.push({
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
  (normalCoins + conservativeRewardCoins) / 100000 * sellingRate - cost,
        days
      });
    }
  }

  // Exact distribution search:
  // Har possible 10K allocation compare hoti hai.
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
      const profit = dp[used] + item.options[u].conservativeProfit;

        if (profit > next[total]) {
          next[total] = profit;
          choice[total] = u;
        }
      }
    }

    dp = next;
    decisions.push(choice);
  }

  // Best distribution reconstruct karo.
  let remainingUnits = units;

  for (let i = hostData.length - 1; i >= 0; i--) {
    const selectedUnits = decisions[i][remainingUnits];

    hostData[i].selected = hostData[i].options[selectedUnits];
    remainingUnits -= selectedUnits;
  }

  const selected = hostData.filter(
    item => item.selected.sending > 0
  );

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
  normalOnlySaleValue - available / 100000 * purchaseRate;

const conservativeProfit =
  conservativeSaleValue - available / 100000 * purchaseRate;

  const cost = available / 100000 * purchaseRate;
  const saleValue = totalCoins / 100000 * sellingRate;
  const profit = saleValue - cost;

  const breakEvenRate = totalCoins > 0
    ? cost / totalCoins * 100000
    : 0;

  optimizerResult.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "FH EMPIRE — 7-Day Maximum Profit";
  optimizerResult.append(heading);

  const summary = document.createElement("p");
  
summary.innerHTML = `
  <strong>Decision:</strong>
  ${profit >= 0 ? "PROJECTED PROFIT" : "PROJECTED LOSS"}<br>
  <strong>Total Sending:</strong> ${fmt(available)}<br>
  <strong>Allocated:</strong> ${fmt(totalSending)}<br>
  <strong>Unused:</strong> ${fmt(available - totalSending)}<br>
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

  selected.sort(
    (a, b) => b.selected.sending - a.selected.sending
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
}

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
  // ==========================================
// FH EMPIRE - REWARD ADJUSTMENT RECORDS
// ==========================================


const REWARD_ADJUSTMENT_KEY = "fh_reward_adjustments_v1";
const rewardElement = id => document.getElementById(id);
const rewardFmt = n => Number(n).toLocaleString("en-US");

let editingRewardId = null;

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
    perTask: expected / 3
  };
}

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

    for (let tasks = 0; tasks <= 3; tasks++) {
      dropdown.add(new Option(
        `${rewardFmt(info.perTask * tasks)} Points — ${tasks} Task${tasks === 1 ? "" : "s"}`,
        String(tasks)
      ));
    }

    if (["0", "1", "2", "3"].includes(previous)) {
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
}

function updateRewardCollectionSummary() {
  const info = getSelectedRewardInfo();
  const tasksRaw = rewardElement("rewardReceivedTasks")?.value;

  const received = info && ["0", "1", "2", "3"].includes(tasksRaw)
    ? info.perTask * Number(tasksRaw)
    : 0;

  const expected = info?.expected || 0;
  const missed = Math.max(0, expected - received);

  rewardElement("rewardSummaryExpected").textContent =
    rewardFmt(expected);

  rewardElement("rewardSummaryReceived").textContent =
    rewardFmt(received);

  rewardElement("rewardSummaryMissed").textContent =
    rewardFmt(missed);
}

function renderRewardAdjustments() {
  const container = rewardElement("rewardAdjustmentHistory");
  if (!container) return;

  container.replaceChildren();

  const data = getRewardAdjustments().sort(
    (a, b) => String(b.date).localeCompare(String(a.date))
  );

  if (!data.length) {
    container.textContent = "No reward records yet.";
    return;
  }

  data.forEach(record => {
    const card = document.createElement("div");
    const details = document.createElement("p");

    const received = record.received ??
      (Number(record.expected) - Number(record.minus));

    
const latestHost = hosts().find(
  host => String(host.id) === String(record.hostId)
);

const displayHostName =
  latestHost?.name || record.hostName || "Unknown Host";

details.textContent =
  `${displayHostName} | ${record.date} | ` +

      `Level: ${record.level || "Old Record"} | ` +
      `Expected: ${rewardFmt(record.expected)} | ` +
      `Received: ${rewardFmt(received)} | ` +
      `Missed: ${rewardFmt(record.minus)} | ` +
      `Reason: ${record.reason || "None"}`;

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.style.marginRight = "10px";

    edit.addEventListener("click", () => {
      if (record.tasks === undefined) {
        rewardElement("rewardAdjustmentMessage").textContent =
          "Old manual record cannot be edited here. Delete it and create a new daily record.";
        return;
      }

      refreshRewardHosts();

      rewardElement("rewardHost").value = String(record.hostId);
      rewardElement("rewardDate").value = record.date;

      updateRewardCollectionPreview();

      rewardElement("rewardReceivedTasks").value =
        String(record.tasks);

      rewardElement("rewardMinusReason").value =
        record.reason || "";

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

    remove.addEventListener("click", () => {
      if (!confirm("Delete this reward record?")) return;

      saveRewardAdjustments(
        getRewardAdjustments().filter(r => r.id !== record.id)
      );

      if (editingRewardId === record.id) {
        editingRewardId = null;
      }

      renderRewardAdjustments();
    });

    card.append(details, edit, remove);
    container.append(card);
  });
}

function saveRewardAdjustmentRecord() {
  const info = getSelectedRewardInfo();
  const tasksRaw = rewardElement("rewardReceivedTasks")?.value;
  const reason = rewardElement("rewardMinusReason")?.value.trim();
  const message = rewardElement("rewardAdjustmentMessage");

  if (!info || !["0", "1", "2", "3"].includes(tasksRaw)) {
    message.textContent =
      "Please select host, date and received reward.";
    return;
  }

  const tasks = Number(tasksRaw);
  const received = info.perTask * tasks;
  const minus = info.expected - received;

  if (minus > 0 && !reason) {
    message.textContent =
      "Missed reward ka reason zaroori hai.";
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
    reason: minus > 0 ? reason : ""
  };

  if (editingRewardId) {
    const index = data.findIndex(r => r.id === editingRewardId);

    if (index === -1) {
      message.textContent = "Original record not found.";
      return;
    }

    data[index] = record;
  } else {
    data.push(record);
  }

  saveRewardAdjustments(data);
  editingRewardId = null;

  rewardElement("rewardReceivedTasks").value = "";
  rewardElement("rewardMinusReason").value = "";

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

 
 
window.addEventListener("fh-hosts-updated", () => {
  refreshHosts();
  refreshRewardHosts();
  renderHistory();
  renderRewardAdjustments();
  updateRewardCollectionPreview();
});

  console.log("FH EMPIRE — Sending Records loaded.");
})();
