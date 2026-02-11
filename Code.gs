// ==================================================
// FEISTY ORDER - COMBINED SCRIPT
// ==================================================
// Includes: Menu API + Bot Handler
// ==================================================

const SPREADSHEET_ID = '1rGtVLbMwHrceTzJ9Nhu5H4ZTY2wAd_nXOc4LKPXFuLA';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';

// ==================================================
// BOT CONFIG
// ==================================================
const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const SHEET_CUSTOMERS = "customers";
const SHEET_ORDERS = "orders";
const ADMIN_PHONE = "6287787655880";

// Anti-duplikat cache
const PROCESSED_ORDER_IDS = {};

// ==================================================
// DOGET - MENU API
// ==================================================
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback;
  
  let result;
  
  if (action === 'getMenu') result = getMenu();
  else if (action === 'getLocation') result = getLocation();
  else if (action === 'getConfig') result = getConfig();
  else result = { error: 'Invalid action: ' + action };
  
  // JSONP support
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Return with CORS headers
  const response = ContentService.createTextOutput(JSON.stringify(result));
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}

// ==================================================
// DOPOST - ORDER WEBHOOK
// ==================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData?.contents || "{}");
    
    Logger.log("🔔 Webhook terima:", JSON.stringify(body));
    
    // Handle ORDER dari index.html
    if (body.action === 'ORDER') {
      handleOrderFromIndex(body);
      return jsonResponse({ status: 'success' });
    }
    
    // Handle normal WA messages
    const phone = normalizeNumber(body.number || body.from || body.sender || "");
    const text = (body.message || body.body || body.text || "").trim();
    
    if (!phone || !text) return jsonResponse({ status: 'ok' });
    handleIncomingWA(phone, text);
    return jsonResponse({ status: 'ok' });
    
  } catch (err) {
    Logger.log("❌ Error di doPost:", err.toString());
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================================================
// GET CONFIG (LOCATION + SHIPPING)
// ==================================================
function getConfig() {
  const location = getLocation();
  return {
    latitude: location.latitude || -6.2088,
    longitude: location.longitude || 106.8456,
    base_shipping_cost: 10000,
    shipping_cost_per_km: 2000
  };
}

// ==================================================
// GET MENU
// ==================================================
function getMenu() {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(MENU_SHEET);
    const rows = sh.getDataRange().getValues();
    const header = rows.shift().map(h => h.toString().toLowerCase());
    const idx = col => header.indexOf(col);
    
    return rows
      .filter(r => r[idx('aktif')] === true)
      .map((r, i) => ({
        id: i + 1,
        nama: r[idx('nama')],
        deskripsi: r[idx('deskripsi')],
        harga: Number(r[idx('harga')]),
        kategori: r[idx('kategori')],
        gambar: r[idx('gambar')]
      }));
  } catch (err) {
    Logger.log("❌ Error getMenu:", err.toString());
    return [];
  }
}

// ==================================================
// GET LOCATION
// ==================================================
function getLocation() {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOCATION_SHEET);
    if (!sh) return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    
    const rows = sh.getDataRange().getValues();
    if (rows.length < 2) return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    
    return {
      nama_toko: String(rows[1][0] || 'Feisty Kitchen'),
      latitude: Number(rows[1][1]) || -6.2088,
      longitude: Number(rows[1][2]) || 106.8456
    };
  } catch (err) {
    Logger.log("❌ Error getLocation:", err.toString());
    return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
  }
}

// ==================================================
// HANDLE ORDER FROM INDEX.HTML
// ==================================================
function handleOrderFromIndex(orderData) {
  try {
    const orderId = orderData.order_id || "";
    const phone = normalizeNumber(orderData.customer_phone || "");
    const name = orderData.customer_name || "Pelanggan";
    const items = orderData.items || [];
    const total = orderData.total || 0;
    const method = orderData.payment_method || "COD";
    const address = orderData.customer_address || "";
    
    Logger.log("📋 Order diterima:", { orderId, phone, name, total, method });
    
    if (!phone) {
      Logger.log("❌ Error: Nomor WA kosong");
      return;
    }
    
    // Cek duplikat dengan orderId
    if (orderId && PROCESSED_ORDER_IDS[orderId]) {
      Logger.log("⚠️ DUPLIKAT DI CACHE - ORDER ID:", orderId);
      return;
    }
    
    PROCESSED_ORDER_IDS[orderId] = true;
    
    // Save ke sheet
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_ORDERS);
    const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
    
    sheet.appendRow([
      new Date(),
      phone,
      name,
      itemsStr,
      total,
      method,
      address,
      orderId
    ]);
    
    Logger.log("✅ Order saved:", orderId);
    
    // Kirim ke customer
    const itemsList = items
      .map(i => `• ${i.name} x${i.qty} = Rp ${(i.price * i.qty).toLocaleString('id-ID')}`)
      .join('\n');
    
    const msgCustomer = `✅ *Pesanan Diterima!*

Halo Kak *${name}* 🎉

📋 *Detail Pesanan:*
${itemsList}

💰 *Total: Rp ${total.toLocaleString('id-ID')}*
💳 *Metode: ${method}

🆔 Order ID: ${orderId}

Terima kasih! Pesanan Anda akan kami proses segera 🙏`;
    
    sendWA(phone, msgCustomer);
    Utilities.sleep(1000);
    
    // Kirim ke admin
    const msgAdmin = `🔔 *PESANAN BARU MASUK!*

👤 *Nama:* ${name}
📱 *WA:* ${phone}
💳 *Metode:* ${method}

📋 *Detail:*
${itemsList}

💰 *Total: Rp ${total.toLocaleString('id-ID')}*
🆔 Order ID: ${orderId}
⏰ ${new Date().toLocaleString('id-ID')}

Segera hubungi customer!`;
    
    sendWA(ADMIN_PHONE, msgAdmin);
    Logger.log("✅ ✅ ✅ ORDER SELESAI ✅ ✅ ✅");
    
  } catch (err) {
    Logger.log("❌ Error handleOrderFromIndex:", err.toString());
  }
}

// ==================================================
// SEND WHATSAPP
// ==================================================
function sendWA(to, message) {
  try {
    const payload = {
      device_id: DEVICE_ID,
      number: to,
      message: message
    };
    
    Logger.log("📤 WA to:", to);
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30
    };
    
    const response = UrlFetchApp.fetch(WA_API, options);
    Logger.log("📥 WA Response:", response.getResponseCode());
    return response.getResponseCode();
    
  } catch (err) {
    Logger.log("❌ Error sendWA:", err.toString());
    return 0;
  }
}

// ==================================================
// HANDLE INCOMING WA (CHATBOT)
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
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        return { row: i + 1, phone: data[i][0], name: data[i][1], state: data[i][2] };
      }
    }
  } catch (err) {
    Logger.log("❌ Error getCustomer:", err.toString());
  }
  return null;
}

function saveNewCustomer(phone) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
    sheet.appendRow([phone, "", "WAIT_NAME", new Date(), new Date()]);
    Logger.log("✅ New customer:", phone);
  } catch (err) {
    Logger.log("❌ Error saveNewCustomer:", err.toString());
  }
}

function updateCustomer(row, name, state) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
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
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  if (!phone.startsWith("62")) phone = "62" + phone;
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
Silakan lanjutkan pemesanan melalui app 📱

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
