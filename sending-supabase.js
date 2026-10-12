
const FH_SUPABASE_URL = "https://vmllowldjzwmzsvxccui.supabase.co";
const FH_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4_cDtsB6pZJHW-2dQW8NHQ_LQhpCn1Q";
// Supabase REST API connection
const FH_SENDING_API = `${FH_SUPABASE_URL}/rest/v1`;

function getSendingAdminToken() {
  return localStorage.getItem("fh_admin_access_token");
}

async function fhSendingRequest(table, options = {}) {
  const token = getSendingAdminToken();

  if (!token) {
    throw new Error("Admin login required. Please login again.");
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

