// ==================================================
// FEISTY ORDER - COMBINED SCRIPT
// ==================================================

const SPREADSHEET_ID = '1rGtVLbMwHrceTzJ9Nhu5H4ZTY2wAd_nXOc4LKPXFuLA';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';
const SETTINGS_SHEET = 'Pengaturan';

const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const SHEET_CUSTOMERS = "customers";
const SHEET_ORDERS = "orders";
const ADMIN_PHONE = "6287787655880";

const PROCESSED_ORDER_IDS = {};

// ==================================================
// DOGET
// ==================================================
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback;
  
  let result;
  
  if (action === 'getMenu') result = getMenu();
  else if (action === 'getLocation') result = getLocation();
  else if (action === 'getConfig') result = getConfig();
  else result = { error: 'Invalid action: ' + action };
  
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================================================
// DOPOST
// ==================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData?.contents || "{}");
    
    if (body.action === 'ORDER') {
      handleOrderFromIndex(body);
      return jsonResponse({ status: 'success' });
    }
    
    const phone = normalizeNumber(body.number || body.from || body.sender || "");
    const text = (body.message || body.body || body.text || "").trim();
    
    if (!phone || !text) return jsonResponse({ status: 'ok' });
    handleIncomingWA(phone, text);
    return jsonResponse({ status: 'ok' });
    
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================================================
// GET CONFIG (LOCATION + ONGKIR)
// ==================================================
function getConfig() {
  const location = getLocation();
  const settings = getSettings();
  
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    nama_toko: location.nama_toko,
    base_shipping_cost: settings.base_shipping_cost,
    shipping_cost_per_km: settings.shipping_cost_per_km
  };
}

// ==================================================
// GET SETTINGS FROM PENGATURAN SHEET
// Format:
// A1=base_shipping_cost, B1=shipping_cost_per_km
// A2=5000, B2=2000 (Ongkir)
// A3=1000, B3=87787655880 (Qris Fee)
// ==================================================
function getSettings() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    
    if (!sh) {
      return { base_shipping_cost: 10000, shipping_cost_per_km: 2000 };
    }
    
    const rows = sh.getDataRange().getValues();
    
    // Skip header row, read data from row 2 onwards
    for (let i = 1; i < rows.length; i++) {
      const label = String(rows[i][0] || '').toLowerCase();
      
      if (label.includes('ongkir') || label.includes('base')) {
        const base = Number(rows[i][0]) || 10000;
        const perKm = Number(rows[i][1]) || 2000;
        return {
          base_shipping_cost: base,
          shipping_cost_per_km: perKm
        };
      }
    }
    
    // Fallback: read from row 2
    if (rows.length > 1) {
      return {
        base_shipping_cost: Number(rows[1][0]) || 5000,
        shipping_cost_per_km: Number(rows[1][1]) || 2000
      };
    }
    
    return { base_shipping_cost: 10000, shipping_cost_per_km: 2000 };
    
  } catch (err) {
    return { base_shipping_cost: 10000, shipping_cost_per_km: 2000 };
  }
}

// ==================================================
// GET MENU
// ==================================================
function getMenu() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    
    if (!sh) return { error: 'Sheet not found: ' + MENU_SHEET };
    
    const rows = sh.getDataRange().getValues();
    
    if (rows.length === 0) return { error: 'Sheet kosong' };
    
    const header = rows.shift().map(h => h.toString().toLowerCase().trim());
    const idx = col => header.indexOf(col);
    
    const items = rows
      .filter(r => {
        const aktif = r[idx('aktif')];
        return aktif === true || aktif === 'true' || aktif === 1;
      })
      .map((r, i) => ({
        id: i + 1,
        nama: r[idx('nama')] || '',
        deskripsi: r[idx('deskripsi')] || '',
        harga: Number(r[idx('harga')]) || 0,
        kategori: r[idx('kategori')] || 'Lainnya',
        gambar: r[idx('gambar')] || ''
      }));
    
    return items;
    
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// GET LOCATION
// ==================================================
function getLocation() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOCATION_SHEET);
    
    if (!sh) {
      return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    }
    
    const rows = sh.getDataRange().getValues();
    
    if (rows.length < 2) {
      return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
    }
    
    return {
      nama_toko: String(rows[1][0] || 'Feisty Kitchen'),
      latitude: Number(rows[1][1]) || -6.2088,
      longitude: Number(rows[1][2]) || 106.8456
    };
  } catch (err) {
    return { latitude: -6.2088, longitude: 106.8456, nama_toko: 'Feisty Kitchen' };
  }
}

// ==================================================
// HANDLE ORDER
// ==================================================
function handleOrderFromIndex(orderData) {
  try {
    const orderId = orderData.order_id || "";
    const phone = normalizeNumber(orderData.customer_phone || "");
    const name = orderData.customer_name || "Pelanggan";
    const items = orderData.items || [];
    const total = orderData.total || 0;
    const method = orderData.payment_method || "COD";
    
    if (!phone) return;
    
    if (orderId && PROCESSED_ORDER_IDS[orderId]) return;
    PROCESSED_ORDER_IDS[orderId] = true;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_ORDERS);
    const itemsStr = items.map(i => `${i.name} x${i.qty}`).join(', ');
    
    sh.appendRow([new Date(), phone, name, itemsStr, total, method, '', orderId]);
    
    const itemsList = items.map(i => `• ${i.name} x${i.qty} = Rp ${(i.price * i.qty).toLocaleString('id-ID')}`).join('\n');
    
    const msgCustomer = `✅ *Pesanan Diterima!*

Halo Kak *${name}*

📋 *Detail:*
${itemsList}

💰 *Total: Rp ${total.toLocaleString('id-ID')}*
💳 *Metode: ${method}

🆔 Order ID: ${orderId}

Terima kasih! 🙏`;
    
    sendWA(phone, msgCustomer);
    Utilities.sleep(1000);
    
    const msgAdmin = `🔔 *PESANAN BARU*

👤 *Nama:* ${name}
📱 *WA:* ${phone}
💳 *Metode:* ${method}

📋 *Detail:*
${itemsList}

💰 *Total: Rp ${total.toLocaleString('id-ID')}*
🆔 ${orderId}`;
    
    sendWA(ADMIN_PHONE, msgAdmin);
    
  } catch (err) {}
}

// ==================================================
// SEND WHATSAPP
// ==================================================
function sendWA(to, message) {
  try {
    const payload = { device_id: DEVICE_ID, number: to, message: message };
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30
    };
    
    return UrlFetchApp.fetch(WA_API, options).getResponseCode();
  } catch (err) {
    return 0;
  }
}

// ==================================================
// CHATBOT
// ==================================================
function handleIncomingWA(phone, text) {
  try {
    const customer = getCustomer(phone);
    
    if (!customer) {
      saveNewCustomer(phone);
      sendWA(phone, "👋 *Selamat Datang di Feisty*\n\nBoleh nama Kakak?");
      return;
    }
    
    if (customer.state === "WAIT_NAME") {
      updateCustomer(customer.row, text, "MENU");
      sendWA(phone, `✨ *Halo ${text}*!\n\n1. Order Menu\n2. Info Promo`);
      return;
    }
    
    if (customer.state === "MENU") {
      if (text === "1" || text.toLowerCase().includes("order")) {
        sendWA(phone, "🛒 https://feistyindonesia-code.github.io/order/");
      } else if (text === "2" || text.toLowerCase().includes("promo")) {
        sendWA(phone, "🎉 *Promo Soon!*");
      } else {
        sendWA(phone, "Ketik *1* atau *2*");
      }
    }
  } catch (err) {}
}

function getCustomer(phone) {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        return { row: i + 1, phone: data[i][0], name: data[i][1], state: data[i][2] };
      }
    }
  } catch (err) {}
  return null;
}

function saveNewCustomer(phone) {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
    sh.appendRow([phone, "", "WAIT_NAME", new Date()]);
  } catch (err) {}
}

function updateCustomer(row, name, state) {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_CUSTOMERS);
    sh.getRange(row, 2).setValue(name);
    sh.getRange(row, 3).setValue(state);
  } catch (err) {}
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
