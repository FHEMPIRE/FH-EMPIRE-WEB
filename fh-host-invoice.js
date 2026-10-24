
"use strict";

window.fhGenerateHostInvoice = function (data) {
  const escapeHtml = value => String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char])
  );

  const rs = value => "Rs " + Number(value || 0).toLocaleString(
    "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const safe = escapeHtml;
  const logoUrl = new URL(
    data.logo || "images/logo.png",
    window.location.href
  ).href;
const giftRows = (data.gifts || [])
  .slice()
  .sort((a, b) => String(a.gift_date || "").localeCompare(String(b.gift_date || "")))
  .map((g, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${safe(String(g.gift_date || "").slice(0, 10))}</td>
      <td class="num">${Number(g.received_points || 0).toLocaleString("en-US")}</td>
      <td class="num">${rs(g.payable_pkr)}</td>
    </tr>
  `).join("");
  const paymentRows = (data.payments || []).map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${safe(String(p.payment_date || "").slice(0, 10))}</td>
      <td>${safe(p.notes || "—")}</td>
      <td class="num">${rs(p.amount_pkr)}</td>
    </tr>
  `).join("");

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
      <title>FH EMPIRE Invoice - ${safe(data.poppoId)}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #edf1f7;
          color: #152238;
          margin: 0;
          padding: 30px;
        }
        .paper {
          max-width: 850px;
          margin: auto;
          background: white;
          padding: 38px;
          border-top: 8px solid #cba74b;
          box-shadow: 0 8px 30px #15223820;
        }
        .head {
          display: flex;
          align-items: center;
          gap: 18px;
          border-bottom: 2px solid #d7bd77;
          padding-bottom: 20px;
        }
        .head img {
          width: 74px;
          height: 74px;
          object-fit: contain;
        }
        .head h1 {
          margin: 0;
          color: #10254b;
          font-size: 28px;
        }
        .head p { margin: 6px 0; color: #64748b; }
        .tag {
          margin-left: auto;
          color: #b38b2d;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .info {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin: 25px 0;
        }
        .info p { margin: 7px 0; }
        h2 {
          font-size: 16px;
          color: #10254b;
          margin: 28px 0 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          background: #10254b;
          color: #fff;
          text-align: left;
          padding: 12px;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .num { text-align: right; }
        .total {
          font-weight: bold;
          background: #f7f1df;
        }
        .balance {
          color: #b42336;
          font-weight: bold;
        }
        .foot {
          text-align: center;
          margin-top: 36px;
          color: #64748b;
          font-size: 11px;
        }
        .actions {
          text-align: center;
          margin-bottom: 20px;
        }
        .actions button {
          background: #10254b;
          color: white;
          border: 0;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
        }
        @media print {
          body { background: white; padding: 0; }
          .paper {
            box-shadow: none;
            max-width: none;
            padding: 20px;
          }
          .actions { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="actions">
        <button onclick="window.print()">Print / Save PDF</button>
      </div>
      <div class="paper">
        <div class="head">
          <img src="${safe(logoUrl)}" alt="FH EMPIRE Logo">
          <div>
            <h1>FH EMPIRE</h1>
            <p>Host Settlement Statement</p>
          </div>
          <div class="tag">INVOICE</div>
        </div>

        <div class="info">
          <div>
            <p><strong>Host:</strong> ${safe(data.hostName)}</p>
            <p><strong>Poppo ID:</strong> ${safe(data.poppoId)}</p>
          </div>
          <div>
            <p><strong>Settlement Month:</strong> ${safe(data.month)}</p>
            <p><strong>Issued:</strong> ${safe(new Date().toLocaleDateString("en-GB"))}</p>
          </div>
        </div>

        <h2>Settlement Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Monthly Salary</td><td class="num">${rs(data.salary)}</td></tr>
            
<tr><td>Gross Settlement Payable</td><td class="num">${rs(data.grossPayable)}</td></tr>
<tr><td>Host Deduction</td><td class="num" style="color:#b42336;">− ${rs(data.hostDeduction)}</td></tr>

            <tr><td>External Gifts / Other Settlement Amount</td><td class="num">${rs(data.externalGifts)}</td></tr>
            <tr class="total"><td>Total Payable</td><td class="num">${rs(data.totalPayable)}</td></tr>
            <tr><td>Total Paid</td><td class="num">${rs(data.totalPaid)}</td></tr>
            <tr class="total balance"><td>Remaining Balance</td><td class="num">${rs(data.remaining)}</td></tr>
          </tbody>
        </table>

<h2>External Gift Details</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Gift Date</th>
      <th class="num">Received Points</th>
      <th class="num">Amount (PKR)</th>
    </tr>
  </thead>
  <tbody>
    ${giftRows || '<tr><td colspan="4">No external gifts recorded.</td></tr>'}
  </tbody>
</table>


        <h2>Payment History</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Date</th><th>Note</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows || '<tr><td colspan="4">No payments recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="foot">
          FH EMPIRE • Settlement statement based on confirmed records
        </div>
      </div>
    </body>
    </html>
  `);

  popup.document.close();
};
