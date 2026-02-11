// ==================================================
// CONFIG
// ==================================================
const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const SHEET_CUSTOMERS = "customers";
const SHEET_ORDERS = "orders";
const ADMIN_PHONE = "6287787655880";  // ✅ GANTI NOMOR ADMIN KAMU!

// Anti-duplikat cache dengan timestamp
const PROCESSED_ORDERS = {};
const PROCESSED_ORDER_IDS = {}; // ✅ TRACK Order ID unik

// ==================================================
// WEBHOOK ENTRY POINT
// ==================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData?.contents || "{}");
    
    Logger.log("🔔 Webhook terima:", JSON.stringify(body));

    // Handle ORDER dari Canva Code
    if (body.action === 'ORDER') {
      handleOrderFromCanva(body);
      return ok();
    }

    // Handle normal WA messages
    const phone = normalizeNumber(body.number || body.from || body.sender || "");
    const text = (body.message || body.body || body.text || "").trim();

    if (!phone || !text) return ok();
    handleIncomingWA(phone, text);
    return ok();

  } catch (err) {
    Logger.log("❌ Error di doPost:", err.toString());
    return ok();
  }
}

function ok() {
  return ContentService.createTextOutput("OK");
}

// ==================================================
// ✅ CEK DUPLIKAT DARI SHEET (LEBIH AKURAT)
// ==================================================
function isDuplicateOrder(orderId) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
    if (!sheet) {
      Logger.log("❌ Sheet tidak ditemukan");
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log("🔍 Cek order_id unik:", orderId);
    Logger.log("📊 Total baris di sheet:", data.length);
    
    // Cek dari belakang (data terbaru dulu)
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rowOrderId = String(row[8] || "").trim(); // Kolom I (index 8) = order_id
      
      if (rowOrderId === orderId && orderId !== "") {
        Logger.log("⚠️ ⚠️ ⚠️ DUPLIKAT TERDETEKSI! ⚠️ ⚠️ ⚠️");
        Logger.log("Order ID sudah ada di row " + (i + 1));
        return true;
      }
    }
    
    Logger.log("✅ Order ID unik - boleh diproses!");
    return false;
    
  } catch (err) {
    Logger.log("❌ Error di isDuplicateOrder:", err.toString());
    return false;
  }
}

// ==================================================
// HANDLE ORDER DARI CANVA (DENGAN ANTI-DUPLIKAT ORDER_ID)
// ==================================================
function handleOrderFromCanva(orderData) {
  try {
    const orderId = orderData.order_id || ""; // ✅ ORDER_ID UNIK DARI FRONTEND
    const phone = normalizeNumber(orderData.customer_phone || "");
    const name = orderData.customer_name || "Pelanggan";
    const items = orderData.items || [];
    const total = orderData.total || 0;
    const method = orderData.payment_method || "UNKNOWN";

    Logger.log("📋 Order diterima:", { orderId, phone, name, total, method });

    if (!phone) {
      Logger.log("❌ Error: Nomor WA kosong");
      return;
    }

    // ✅ CEK DUPLIKAT DENGAN ORDER_ID (LEBIH AKURAT DARI PHONE+TOTAL)
    if (orderId && isDuplicateOrder(orderId)) {
      Logger.log("⚠️ DUPLIKAT TERDETEKSI - ORDER ID:", orderId);
      Logger.log("⚠️ Order ini sudah diproses!");
      return; // STOP - jangan proses
    }

    // ✅ JUGA CEK CACHE (untuk response cepat)
    if (PROCESSED_ORDER_IDS[orderId]) {
      Logger.log("⚠️ DUPLIKAT DI CACHE - ORDER ID:", orderId);
      return; // STOP - jangan proses
    }

    // Tandai sebagai diproses di cache
    PROCESSED_ORDER_IDS[orderId] = true;
    Logger.log("✅ Order ditandai diproses di cache:", orderId);

    // ✅ SAVE TO SHEET
    saveOrder(phone, name, items, total, method, orderId); // ✅ PASS orderId
    Logger.log("✅ Order tersimpan ke sheet");

    // ✅ BUAT ITEM LIST
    const itemsList = items
      .map(i => `• ${i.name} x${i.qty} = Rp ${(i.price * i.qty).toLocaleString('id-ID')}`)
      .join('\n');

    // ✅ PESAN KE CUSTOMER
    const msgCustomer = `✅ *Pesanan Diterima!*

Halo Kak *${name}* 🎉

📋 *Detail Pesanan:*
${itemsList}

💰 *Total: Rp ${total.toLocaleString('id-ID')}*
💳 *Metode: ${method}*

🆔 Order ID: ${orderId}

Terima kasih! Pesanan Anda akan kami proses segera 🙏`;

    Logger.log("📱 Akan kirim ke customer:", phone);
    const sendCustomerResult = sendWA(phone, msgCustomer);
    Logger.log("📱 Response customer:", sendCustomerResult);

    // ✅ DELAY 1 DETIK untuk hindari rate limit
    Utilities.sleep(1000);

    // ✅ PESAN KE ADMIN (PENTING - JANGAN LUPA!)
    const msgAdmin = `🔔 *PESANAN BARU MASUK!*

👤 *Nama Customer:* ${name}
📱 *No WA:* ${phone}
💳 *Metode Bayar:* ${method}

📋 *DETAIL PESANAN:*
${itemsList}

💰 *TOTAL: Rp ${total.toLocaleString('id-ID')}*

🆔 Order ID: ${orderId}
⏰ Waktu: ${new Date().toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━
Segera hubungi customer untuk konfirmasi!`;

    Logger.log("📱 Akan kirim ke admin:", ADMIN_PHONE);
    const sendAdminResult = sendWA(ADMIN_PHONE, msgAdmin);
    Logger.log("📱 Response admin:", sendAdminResult);

    Logger.log("✅ ✅ ✅ ORDER SELESAI DIPROSES ✅ ✅ ✅");

  } catch (err) {
    Logger.log("❌ Error di handleOrderFromCanva:", err.toString());
    Logger.log("❌ Stack:", err.stack);
  }
}

// ==================================================
// SEND WHATSAPP MESSAGE
// ==================================================
function sendWA(to, message) {
  try {
    const payload = {
      device_id: DEVICE_ID,
      number: to,
      message: message
    };

    Logger.log("📤 Sending WA to " + to + ":", JSON.stringify(payload).substring(0, 200));

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30
    };

    const response = UrlFetchApp.fetch(WA_API, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log("📥 WA Response Code:", responseCode);
    Logger.log("📥 WA Response Text:", responseText.substring(0, 500));

    if (responseCode === 200 || responseCode === 201) {
      Logger.log("✅ WA berhasil dikirim ke:", to);
      return { success: true, code: responseCode };
    } else {
      Logger.log("⚠️ WA response code:", responseCode);
      return { success: false, code: responseCode };
    }

  } catch (err) {
    Logger.log("❌ Error sendWA:", err.toString());
    return { success: false, error: err.toString() };
  }
}

// ==================================================
// SAVE ORDER TO SHEET (✅ DENGAN ORDER_ID DI KOLOM I)
// ==================================================
function saveOrder(phone, name, items, total, method, orderId) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
    const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');

    // ✅ TAMBAHKAN orderId DI KOLOM I (INDEX 8)
    sheet.appendRow([
      new Date(),              // Kolom A: Waktu
      phone,                   // Kolom B: No WA
      name,                    // Kolom C: Nama
      itemsStr,                // Kolom D: Item
      total,                   // Kolom E: Total
      method,                  // Kolom F: Metode
      'PENDING',               // Kolom G: Status
      'Baru diterima',         // Kolom H: Catatan
      orderId                  // Kolom I: Order ID ✅ KUNCI!
    ]);

    Logger.log("✅ Order saved to sheet dengan Order ID:", orderId);
  } catch (err) {
    Logger.log("❌ Error saveOrder:", err.toString());
  }
}

// ==================================================
// HANDLE INCOMING WA MESSAGE (CHATBOT)
// ==================================================
function handleIncomingWA(phone, text) {
  try {
    const customer = getCustomer(phone);

    if (!customer) {
      saveNewCustomer(phone);
      sendWA(phone, msgAskName());
      return;
    }

    if (customer.state === "WAIT_NAME") {
      updateCustomer(customer.row, text, "MENU");
      sendWA(phone, msgMenu(text));
      return;
    }

    if (customer.state === "MENU") {
      if (isOrder(text)) {
        sendWA(phone, msgOrderLink(customer.name, phone));
        return;
      }

      if (isPromo(text)) {
        sendWA(phone, msgPromo(customer.name));
        return;
      }

      sendWA(phone, msgInvalidMenu(customer.name));
    }
  } catch (err) {
    Logger.log("❌ Error handleIncomingWA:", err.toString());
  }
}

// ==================================================
// CUSTOMER DATABASE
// ==================================================
function getCustomer(phone) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        return {
          row: i + 1,
          phone: data[i][0],
          name: data[i][1],
          state: data[i][2]
        };
      }
    }
  } catch (err) {
    Logger.log("❌ Error getCustomer:", err.toString());
  }
  return null;
}

function saveNewCustomer(phone) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMERS);
    sheet.appendRow([phone, "", "WAIT_NAME", new Date(), new Date()]);
    Logger.log("✅ New customer saved:", phone);
  } catch (err) {
    Logger.log("❌ Error saveNewCustomer:", err.toString());
  }
}

function updateCustomer(row, name, state) {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CUSTOMERS);
    sheet.getRange(row, 2).setValue(name);
    sheet.getRange(row, 3).setValue(state);
    sheet.getRange(row, 5).setValue(new Date());
  } catch (err) {
    Logger.log("❌ Error updateCustomer:", err.toString());
  }
}

// ==================================================
// UTILITIES
// ==================================================
function normalizeNumber(num) {
  if (!num) return "";
  
  let phone = String(num).replace(/\D/g, "");
  
  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  }
  if (!phone.startsWith("62")) {
    phone = "62" + phone;
  }
  
  return phone;
}

function isOrder(text) {
  const t = text.toLowerCase().trim();
  return t === "1" || t.includes("order") || t.includes("pesan") || t.includes("beli");
}

function isPromo(text) {
  const t = text.toLowerCase().trim();
  return t === "2" || t.includes("promo") || t.includes("diskon");
}

// ==================================================
// CHATBOT MESSAGES
// ==================================================
function msgAskName() {
  return `👋 *Selamat Datang di Feisty*

Boleh kami tahu *nama Kakak* untuk melanjutkan? 😊`;
}

function msgMenu(name) {
  return `✨ *Halo Kak ${name}!* ✨

Silakan pilih:
1️⃣ Order Menu  
2️⃣ Info Promo`;
}

function msgInvalidMenu(name) {
  return `⚠️ *Maaf Kak ${name}*

Pilihan tidak dikenali 🙏  
Silakan ketik *1* atau *2*.`;
}

function msgOrderLink(name, phone) {
  return `🛒 *Order Online Feisty*

Halo Kak *${name}* 😊  
Silakan lanjutkan pemesanan melalui app kami 📱

💳 Pembayaran:
• QRIS (TemanQRIS)
• COD (Bayar di Tempat)`;
}

function msgPromo(name) {
  return `🎉 *Promo Feisty*

Halo Kak *${name}* 😄  
Promo menarik segera hadir 🔥

Stay tuned ya! 👍`;
}

