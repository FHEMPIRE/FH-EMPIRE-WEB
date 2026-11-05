
"use strict";

window.fhGenerateAssistantCommissionInvoice = function (data) {
  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const safe = escapeHtml;

  const money = value =>
    "Rs " + Number(value || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const formatDate = value => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });
  };

  const monthValue = String(data.invoiceMonth || "");
  const monthDate = /^\d{4}-\d{2}$/.test(monthValue)
    ? new Date(monthValue + "-01T12:00:00")
    : null;

  const monthLabel = monthDate && !Number.isNaN(monthDate.getTime())
    ? monthDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric"
      })
    : monthValue || "—";

  const invoiceId = Number(data.invoiceId);
  const invoiceNumber =
    Number.isSafeInteger(invoiceId) && invoiceId > 0
      ? `FH-COM-${monthValue.replace("-", "")}-${String(invoiceId).padStart(4, "0")}`
      : "—";

  const status = String(data.status || "unpaid").toLowerCase();
  const isPaid = status === "paid";

  const logoUrl = new URL(
    "images/logo.png",
    window.location.href
  ).href;

  const popup = window.open("", "_blank");

  if (!popup) {
    alert("Please allow pop-ups to generate the invoice.");
    return;
  }

  popup.document.open();
  popup.document.write(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FH EMPIRE - Commission Invoice</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 30px;
      background: #edf0f4;
      color: #20232b;
      font-family: Arial, sans-serif;
    }

    .actions {
      text-align: center;
      margin-bottom: 20px;
    }

    .actions button {
      padding: 12px 25px;
      background: #171717;
      color: #eac36c;
      border: 1px solid #c9a44d;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }

    .paper {
      max-width: 800px;
      margin: auto;
      padding: 42px;
      background: #fff;
      border-top: 8px solid #c9a44d;
      box-shadow: 0 10px 35px #00000018;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 18px;
      padding-bottom: 24px;
      border-bottom: 2px solid #d8bb75;
    }

    .header img {
      width: 75px;
      height: 75px;
      object-fit: contain;
    }

    .brand h1 {
      margin: 0;
      color: #171717;
      font-size: 29px;
    }

    .brand p {
      margin: 6px 0 0;
      color: #777;
      font-size: 13px;
    }

    .invoice-label {
      margin-left: auto;
      font-size: 18px;
      letter-spacing: 2px;
      font-weight: bold;
      color: #b48a2b;
    }

    .details {
      display: flex;
      justify-content: space-between;
      gap: 25px;
      margin: 30px 0;
    }

    .details p {
      margin: 10px 0;
      font-size: 13px;
    }

    .details strong {
      color: #303030;
    }

    .summary-title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th {
      background: #191919;
      color: #f2d17c;
      text-align: left;
      padding: 15px;
    }

    td {
      padding: 18px 15px;
      border-bottom: 1px solid #e5e5e5;
    }

    .right { text-align: right; }

    .total-row {
      background: #faf4e5;
      font-weight: bold;
      font-size: 17px;
    }

    .payment {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fb;
      border: 1px solid #e3e6eb;
      border-radius: 8px;
    }

    .payment p {
      margin: 10px 0;
      font-size: 13px;
    }

    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 5px;
      font-weight: bold;
      background: ${isPaid ? "#e5f6eb" : "#fff2d6"};
      color: ${isPaid ? "#18713c" : "#9a6200"};
    }

    .footer {
      margin-top: 45px;
      padding-top: 20px;
      border-top: 1px solid #e3e3e3;
      text-align: center;
      color: #777;
      font-size: 11px;
      line-height: 1.8;
    }

    @media print {
      @page { size: A4; margin: 12mm; }

      body {
        padding: 0;
        background: #fff;
      }

      .paper {
        max-width: none;
        padding: 15px;
        box-shadow: none;
      }

      .actions { display: none; }

      th, .total-row {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="actions">
    <button onclick="window.print()">Print / Save PDF</button>
  </div>

  <div class="paper">
    <div class="header">
      <img src="${safe(logoUrl)}" alt="FH EMPIRE Logo">

      <div class="brand">
        <h1>FH EMPIRE</h1>
        <p>Monthly Commission Settlement</p>
      </div>

      <div class="invoice-label">INVOICE</div>
    </div>

    <div class="details">
      <div>
        <p><strong>Assistant:</strong> ${safe(data.assistantName || "—")}</p>
        <p><strong>Poppo ID:</strong> ${safe(data.poppoId || "—")}</p>
        <p><strong>Invoice No:</strong> ${safe(invoiceNumber)}</p>
      </div>

      <div>
        <p><strong>Invoice Month:</strong> ${safe(monthLabel)}</p>
        <p><strong>Issued:</strong> ${safe(formatDate(data.createdAt))}</p>
      </div>
    </div>

    <div class="summary-title">Commission Summary</div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Amount (PKR)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="total-row">
          <td>Monthly Commission</td>
          <td class="right">${money(data.commissionAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="payment">
      <p>
        <strong>Payment Status:</strong>
        <span class="status">${isPaid ? "PAID" : "UNPAID"}</span>
      </p>
      <p>
        <strong>Payment Date:</strong>
        ${safe(isPaid ? formatDate(data.paidAt) : "—")}
      </p>
    </div>

    <div class="footer">
      <strong>FH EMPIRE</strong><br>
      Official Monthly Commission Settlement Record<br>
      fhempire.com
    </div>
  </div>

</body>
</html>
  `);

  popup.document.close();
};
