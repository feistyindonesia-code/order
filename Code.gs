// ==================================================
// FEISTY ORDER - COMBINED SCRIPT
// ==================================================

const SPREADSHEET_ID = '1rGtVLbMwHrceTzJ9Nhu5H4ZTY2wAd_nXOc4LKPXFuLA';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';
const SETTINGS_SHEET = 'Pengaturan';
const CUSTOMERS_SHEET = 'Customers';
const ORDERS_SHEET = 'Orders';

const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const ADMIN_PHONE = "6287787655880";

const PROCESSED_ORDER_IDS = {};

// ==================================================
// SETUP SHEETS FUNCTION
// ==================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Setup Customers Sheet
  let sh = ss.getSheetByName(CUSTOMERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CUSTOMERS_SHEET);
  }
  const custHeaders = ['phone', 'nama', 'alamat', 'tipe_diskon', 'nilai_diskon', 'state', 'created_at', 'updated_at'];
  sh.getRange(1, 1, 1, custHeaders.length).setValues([custHeaders]);
  sh.getRange(1, 1, 1, custHeaders.length).setFontWeight('bold').setBackground('#E0FFE0');
  
  // 2. Setup Orders Sheet
  sh = ss.getSheetByName(ORDERS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(ORDERS_SHEET);
  }
  const orderHeaders = ['timestamp', 'phone', 'nama', 'alamat', 'items', 'subtotal', 'ongkir', 'diskon', 'total', 'payment_method', 'order_id', 'status'];
  sh.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  sh.getRange(1, 1, 1, orderHeaders.length).setFontWeight('bold').setBackground('#E0E0FF');
  
  // 3. Setup Menu Sheet
  sh = ss.getSheetByName(MENU_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MENU_SHEET);
  }
  const menuHeaders = ['nama', 'deskripsi', 'harga', 'harga_asli', 'diskon_persen', 'kategori', 'gambar', 'aktif', 'urutan'];
  sh.getRange(1, 1, 1, menuHeaders.length).setValues([menuHeaders]);
  sh.getRange(1, 1, 1, menuHeaders.length).setFontWeight('bold').setBackground('#FFE0D6');
  
  // 4. Setup Lokasi Sheet
  sh = ss.getSheetByName(LOCATION_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOCATION_SHEET);
  }
  const locHeaders = ['nama_toko', 'latitude', 'longitude'];
  sh.getRange(1, 1, 1, locHeaders.length).setValues([locHeaders]);
  sh.getRange(1, 1, 1, locHeaders.length).setFontWeight('bold').setBackground('#FFF0E0');
  if (sh.getLastRow() === 1) {
    sh.appendRow(['Feisty Kitchen', -6.2088, 106.8456]);
  }
  
  // 5. Setup Pengaturan Sheet
  sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
  }
  const setHeaders = ['setting', 'value', 'description'];
  sh.getRange(1, 1, 1, setHeaders.length).setValues([setHeaders]);
  sh.getRange(1, 1, 1, setHeaders.length).setFontWeight('bold').setBackground('#FFF0F0');
  if (sh.getLastRow() === 1) {
    sh.appendRow(['base_shipping_cost', 10000, 'Base shipping cost in IDR']);
    sh.appendRow(['shipping_cost_per_km', 2000, 'Additional cost per km']);
    sh.appendRow(['free_shipping_min_distance', 5, 'Min distance for free shipping (km)']);
    sh.appendRow(['qris_fee', 1000, 'QRIS transaction fee']);
  }
  
  return { status: 'success', message: 'All sheets setup completed' };
}

// ==================================================
// DOGET - untuk index.html
// ==================================================
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback;
  const phone = e?.parameter?.phone;
  
  let result;
  
  if (action === 'getMenu') result = getMenu();
  else if (action === 'getLocation') result = getLocation();
  else if (action === 'getConfig') result = getConfig();
  else if (action === 'getCustomer') result = getCustomerByPhone(phone);
  else if (action === 'getOrders') result = getOrders();
  else if (action === 'getCustomers') result = getAllCustomers();
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
// DOPOST - untuk webhook Whacenter
// ==================================================
function doPost(e) {
  try {
    // Log ke sheet
    logToSheet("=== WHATSAPP WEBHOOK ===", "");
    logToSheet("PostData:", e.postData ? e.postData.contents : "empty");
    
    const body = JSON.parse(e.postData?.contents || "{}");
    logToSheet("Parsed body:", JSON.stringify(body));

    // Handle ORDER dari index.html
    if (body.action === 'ORDER') {
      logToSheet("Handling ORDER action", "");
      handleOrderFromIndex(body);
      return ok();
    }

    // Handle normal WA messages
    const phone = body.number || body.from || body.sender || "";
    const text = (body.message || body.body || body.text || "").trim();
    
    logToSheet("Phone:", phone);
    logToSheet("Text:", text);

    if (!phone || !text) {
      logToSheet("No phone or text", "");
      return ok();
    }
    
    const normalizedPhone = normalizeNumber(phone);
    logToSheet("Normalized phone:", normalizedPhone);
    
    handleIncomingWA(normalizedPhone, text);
    return ok();

  } catch (err) {
    logToSheet("ERROR:", err.toString());
    return ok();
  }
}

// ==================================================
// LOG TO SHEET
// ==================================================
function logToSheet(message, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName("Logs");
    if (!sh) {
      sh = ss.insertSheet("Logs");
      sh.appendRow(["Timestamp", "Message", "Data"]);
    }
    
    // Handle error objects
    let dataStr = "";
    if (typeof data === 'object' && data !== null) {
      dataStr = JSON.stringify(data);
    } else {
      dataStr = String(data || "");
    }
    
    sh.appendRow([new Date(), message, dataStr.substring(0, 1000)]);
  } catch (err) {
    // Ignore logging errors
  }
}

function ok() {
  return ContentService.createTextOutput("OK");
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
    shipping_cost_per_km: settings.shipping_cost_per_km,
    free_shipping_min_distance: settings.free_shipping_min_distance
  };
}

function getSettings() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    if (!sh) {
      return { base_shipping_cost: 10000, shipping_cost_per_km: 2000 };
    }
    const rows = sh.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < rows.length; i++) {
      const key = String(rows[i][0] || '').toLowerCase().trim();
      const value = rows[i][1];
      if (key === 'base_shipping_cost' || key.includes('base')) {
        settings.base_shipping_cost = Number(value) || 10000;
      }
      if (key === 'shipping_cost_per_km' || key.includes('per km')) {
        settings.shipping_cost_per_km = Number(value) || 2000;
      }
      if (key === 'free_shipping_min_distance') {
        settings.free_shipping_min_distance = Number(value) || 5;
      }
    }
    return {
      base_shipping_cost: settings.base_shipping_cost || 10000,
      shipping_cost_per_km: settings.shipping_cost_per_km || 2000,
      free_shipping_min_distance: settings.free_shipping_min_distance || 5
    };
  } catch (err) {
    return { base_shipping_cost: 10000, shipping_cost_per_km: 2000, free_shipping_min_distance: 5 };
  }
}

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
        const aktifStr = String(aktif).toLowerCase();
        return aktif === true || aktif === 'true' || aktif === 'TRUE' || aktif === 1 || aktifStr === 'true';
      })
      .map((r, i) => {
        const harga = Number(r[idx('harga')]) || 0;
        const hargaAsli = Number(r[idx('harga_asli')]) || 0;
        const diskonPersen = Number(r[idx('diskon_persen')]) || 0;
        let hargaDiskon = harga;
        if (hargaAsli > 0 && hargaAsli > harga) {
          hargaDiskon = harga;
        } else if (diskonPersen > 0) {
          hargaDiskon = Math.round(harga * (100 - diskonPersen) / 100);
        }
        return {
          id: i + 1,
          nama: r[idx('nama')] || '',
          deskripsi: r[idx('deskripsi')] || '',
          harga: harga,
          harga_asli: hargaAsli,
          diskon_persen: diskonPersen,
          harga_diskon: hargaDiskon,
          kategori: r[idx('kategori')] || 'Lainnya',
          gambar: r[idx('gambar')] || '',
          has_discount: hargaAsli > harga || diskonPersen > 0
        };
      });
    return items;
  } catch (err) {
    return { error: err.toString() };
  }
}

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

function getCustomerByPhone(phone) {
  try {
    if (!phone) return null;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return null;
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    for (let i = 1; i < data.length; i++) {
      const rowPhone = normalizeNumber(String(data[i][0] || ""));
      if (rowPhone === normalizedPhone) {
        return {
          phone: data[i][0],
          nama: data[i][1] || '',
          alamat: data[i][2] || '',
          tipe_diskon: data[i][3] || '',
          nilai_diskon: Number(data[i][4]) || 0
        };
      }
    }
  } catch (err) {
    return null;
  }
  return null;
}

// ==================================================
// HANDLE ORDER DARI INDEX.HTML
// ==================================================
function handleOrderFromIndex(orderData) {
  try {
    const orderId = orderData.order_id || "";
    const phone = normalizeNumber(orderData.customer_phone || "");
    const name = orderData.customer_name || "Pelanggan";
    const address = orderData.customer_address || "";
    const items = orderData.items || [];
    const subtotal = orderData.subtotal || 0;
    const shippingCost = orderData.shipping_cost || 0;
    const discount = orderData.discount || 0;
    const total = orderData.total || 0;
    const method = orderData.payment_method || "COD";
    
    if (!phone) return;
    
    if (orderId && PROCESSED_ORDER_IDS[orderId]) return;
    PROCESSED_ORDER_IDS[orderId] = true;
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    const itemsStr = JSON.stringify(items.map(i => ({ name: i.name, qty: i.qty, price: i.price })));
    
    sh.appendRow([
      new Date(), phone, name, address, itemsStr, 
      subtotal, shippingCost, discount, total, method, orderId, 'PENDING'
    ]);
    
    const itemsList = items
      .map(i => `• ${i.name} x${i.qty} = Rp ${(i.price * i.qty).toLocaleString('id-ID')}`)
      .join('\n');
    
    const msgCustomer = `✅ *Pesanan Diterima!*

Halo Kak *${name}*

📋 *Detail:*
${itemsList}

💰 *Subtotal: Rp ${subtotal.toLocaleString('id-ID')}*
🚚 *Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}*
${discount > 0 ? `🎁 *Diskon: Rp ${discount.toLocaleString('id-ID')}
` : ''}💳 *Total: Rp ${total.toLocaleString('id-ID')}*
💳 *Metode: ${method}

🆔 Order ID: ${orderId}

Terima kasih! 🙏`;
    
    sendWA(phone, msgCustomer);
    Utilities.sleep(1000);
    
    const msgAdmin = `🔔 *PESANAN BARU*

👤 *Nama:* ${name}
📱 *WA:* ${phone}
📍 *Alamat:* ${address}
💳 *Metode:* ${method}

📋 *Detail:*
${itemsList}

💰 *Subtotal: Rp ${subtotal.toLocaleString('id-ID')}*
🚚 *Ongkir: Rp ${shippingCost.toLocaleString('id-ID')}*
${discount > 0 ? `🎁 *Diskon: Rp ${discount.toLocaleString('id-ID')}
` : ''}💰 *Total: Rp ${total.toLocaleString('id-ID')}*
🆔 ${orderId}`;
    
    sendWA(ADMIN_PHONE, msgAdmin);
    
  } catch (err) {}
}

// ==================================================
// SEND WHATSAPP
// ==================================================
function sendWA(to, message) {
  try {
    logToSheet("=== SEND WA ===", "");
    logToSheet("To:", to);
    logToSheet("Message:", message.substring(0, 200));
    
    const payload = { device_id: DEVICE_ID, number: to, message: message };
    logToSheet("Payload:", JSON.stringify(payload));
    
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
    
    logToSheet("Response Code:", responseCode);
    logToSheet("Response Text:", responseText.substring(0, 500));
    
    return responseCode;
  } catch (err) {
    logToSheet("ERROR sendWA:", err.toString());
    return 0;
  }
}

// ==================================================
// CHATBOT - WHATSAPP BOT
// ==================================================
function handleIncomingWA(phone, text) {
  try {
    logToSheet("=== HANDLE INCOMING WA ===", "");
    logToSheet("Phone:", phone);
    logToSheet("Text:", text);
    
    const customer = getCustomer(phone);
    logToSheet("Customer object:", JSON.stringify(customer || {}));
    
    if (!customer) {
      logToSheet("New customer, saving...", "");
      saveNewCustomer(phone);
      sendWA(phone, msgAskName());
      return;
    }
    
    logToSheet("Customer state:", customer.state);
    logToSheet("Customer name:", customer.name);
    
    if (customer.state === "WAIT_NAME") {
      logToSheet("State is WAIT_NAME, asking for name...", "");
      updateCustomer(customer.row, text, "MENU");
      sendWA(phone, msgMenu(text));
      return;
    }
    
    if (customer.state === "MENU") {
      const t = text.toLowerCase().trim();
      logToSheet("Menu option:", t);
      if (t === "1" || t.includes("order") || t.includes("pesan") || t.includes("beli")) {
        sendWA(phone, msgOrderLink(customer.name));
        return;
      }
      if (t === "2" || t.includes("promo") || t.includes("diskon")) {
        sendWA(phone, msgPromo(customer.name));
        return;
      }
      sendWA(phone, msgInvalidMenu(customer.name));
      return;
    }
    
    // If state is empty or unknown, treat as new customer
    logToSheet("Unknown state, treating as new customer", customer.state);
    updateCustomer(customer.row, text, "MENU");
    sendWA(phone, msgMenu(text));
    
  } catch (err) {
    logToSheet("ERROR handleIncomingWA:", err.toString() + "\n" + err.stack);
  }
}

function getCustomer(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    
    if (!sh) {
      logToSheet("Sheet not found:", CUSTOMERS_SHEET);
      return null;
    }
    
    const data = sh.getDataRange().getValues();
    logToSheet("Total rows in sheet:", data.length);
    
    // Log all data for debugging
    for (let i = 1; i < data.length; i++) {
      logToSheet("Row " + i + " data:", 
        "phone=" + data[i][0] + ", nama=" + data[i][1] + ", state=" + data[i][5]);
      
      const rowPhone = normalizeNumber(String(data[i][0]));
      if (rowPhone === normalizeNumber(phone)) {
        logToSheet("Found match at row:", i + 1);
        return { row: i + 1, phone: data[i][0], name: data[i][1], state: data[i][5] };
      }
    }
    logToSheet("Customer not found", "");
  } catch (err) {
    logToSheet("ERROR getCustomer:", err.toString());
  }
  return null;
}

function saveNewCustomer(phone) {
  try {
    logToSheet("Saving new customer:", phone);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    
    if (!sh) {
      logToSheet("Creating Customers sheet...", "");
      return;
    }
    
    sh.appendRow([phone, "", "", "", "", "WAIT_NAME", new Date(), new Date()]);
    logToSheet("Customer saved successfully", "");
  } catch (err) {
    logToSheet("ERROR saveNewCustomer:", err.toString());
  }
}

function updateCustomer(row, name, state) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    sh.getRange(row, 2).setValue(name);
    sh.getRange(row, 6).setValue(state);
    sh.getRange(row, 8).setValue(new Date());
  } catch (err) {}
}

function normalizeNumber(num) {
  if (!num) return "";
  let phone = String(num).replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  if (!phone.startsWith("62")) phone = "62" + phone;
  return phone;
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

function msgOrderLink(name) {
  return `🛒 *Order Online Feisty*

Halo Kak *${name}* 😊  
Silakan lanjutkan pemesanan melalui app kami 📱

💳 Pembayaran:
• QRIS (TemanQRIS)
• COD (Bayar di tempat)`;
}

function msgPromo(name) {
  return `🎉 *Promo Feisty*

Halo Kak *${name}* 😄  
Promo menarik segera hadir 🔥

Stay tuned ya! 👍`;
}

// ==================================================
// ADMIN FUNCTIONS
// ==================================================
function getOrders() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map(row => ({
      timestamp: row[0],
      phone: String(row[1] || ''),
      nama: String(row[2] || ''),
      alamat: String(row[3] || ''),
      items: String(row[4] || '[]'),
      subtotal: Number(row[5]) || 0,
      shipping_cost: Number(row[6]) || 0,
      diskon: Number(row[7]) || 0,
      total: Number(row[8]) || 0,
      payment_method: String(row[9] || ''),
      order_id: String(row[10] || ''),
      status: String(row[11] || 'PENDING')
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function getAllCustomers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map(row => ({
      phone: String(row[0] || ''),
      nama: String(row[1] || ''),
      alamat: String(row[2] || ''),
      tipe_diskon: String(row[3] || ''),
      nilai_diskon: Number(row[4]) || 0,
      state: String(row[5] || ''),
      created_at: row[6],
      updated_at: row[7]
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

function updateOrderStatus(orderId, newStatus) {
  try {
    if (!orderId || !newStatus) {
      return { success: false, message: 'Order ID dan status diperlukan' };
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    if (!sh) {
      return { success: false, message: 'Sheet pesanan tidak ditemukan' };
    }
    const data = sh.getDataRange().getValues();
    let orderRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][10]) === String(orderId)) {
        orderRow = i + 1;
        break;
      }
    }
    if (orderRow === -1) {
      return { success: false, message: 'Pesanan tidak ditemukan' };
    }
    const currentStatus = data[orderRow - 1][11];
    const customerPhone = data[orderRow - 1][1];
    const customerName = data[orderRow - 1][2];
    const orderTotal = data[orderRow - 1][8];
    sh.getRange(orderRow, 12).setValue(newStatus);
    
    const statusMessages = {
      'PENDING': 'Pesanan Anda telah DITERIMA dan akan segera diproses.',
      'PROCESSING': 'Pesanan Anda sedang DIPROSES dan disiapkan.',
      'SHIPPING': '🚚 Pesanan Anda sedang DALAM PENGIRIMAN!',
      'COMPLETED': '✅ Pesanan Anda telah SELESAI. Terima kasih!',
      'CANCELLED': '❌ Pesanan Anda telah DIBATALKAN.'
    };
    
    const msg = `📋 *Update Pesanan ${orderId}*

Halo *${customerName}*,
${statusMessages[newStatus] || 'Status berubah menjadi: ' + newStatus}

💰 Total: Rp ${Number(orderTotal).toLocaleString('id-ID')}

Terima kasih! 🙏`;
    
    sendWA(customerPhone, msg);
    
    return { 
      success: true, 
      message: 'Status berhasil diubah',
      previousStatus: currentStatus,
      newStatus: newStatus
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CRUD - MENU OPERATIONS
// ==================================================
function addMenuItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) {
      return { success: false, message: 'Menu sheet tidak ditemukan' };
    }
    sh.appendRow([
      data.nama || '',
      data.deskripsi || '',
      data.harga || 0,
      data.harga_asli || 0,
      data.diskon_persen || 0,
      data.kategori || 'Lainnya',
      data.gambar || '',
      data.aktif !== false,
      data.urutan || 0
    ]);
    return { success: true, message: 'Menu item berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateMenuItem(index, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) {
      return { success: false, message: 'Menu sheet tidak ditemukan' };
    }
    const row = parseInt(index) + 2;
    sh.getRange(row, 1).setValue(data.nama || '');
    sh.getRange(row, 2).setValue(data.deskripsi || '');
    sh.getRange(row, 3).setValue(data.harga || 0);
    sh.getRange(row, 4).setValue(data.harga_asli || 0);
    sh.getRange(row, 5).setValue(data.diskon_persen || 0);
    sh.getRange(row, 6).setValue(data.kategori || 'Lainnya');
    sh.getRange(row, 7).setValue(data.gambar || '');
    sh.getRange(row, 8).setValue(data.aktif !== false);
    sh.getRange(row, 9).setValue(data.urutan || 0);
    return { success: true, message: 'Menu item berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteMenuItem(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    if (!sh) {
      return { success: false, message: 'Menu sheet tidak ditemukan' };
    }
    const row = parseInt(rowNumber) + 1;
    sh.deleteRow(row);
    return { success: true, message: 'Menu item berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CRUD - CUSTOMER OPERATIONS
// ==================================================
function addCustomer(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) {
      return { success: false, message: 'Customers sheet tidak ditemukan' };
    }
    sh.appendRow([
      data.phone || '',
      data.nama || '',
      data.alamat || '',
      data.tipe_diskon || '',
      data.nilai_diskon || 0,
      'REGISTERED',
      new Date(),
      new Date()
    ]);
    return { success: true, message: 'Customer berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateCustomerByPhone(oldPhone, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) {
      return { success: false, message: 'Customers sheet tidak ditemukan' };
    }
    const dataRange = sh.getDataRange();
    const values = dataRange.getValues();
    const normalizedOldPhone = normalizeNumber(oldPhone);
    let row = -1;
    for (let i = 1; i < values.length; i++) {
      if (normalizeNumber(String(values[i][0])) === normalizedOldPhone) {
        row = i + 1;
        break;
      }
    }
    if (row === -1) {
      return { success: false, message: 'Customer tidak ditemukan' };
    }
    sh.getRange(row, 1).setValue(data.phone || '');
    sh.getRange(row, 2).setValue(data.nama || '');
    sh.getRange(row, 3).setValue(data.alamat || '');
    sh.getRange(row, 4).setValue(data.tipe_diskon || '');
    sh.getRange(row, 5).setValue(data.nilai_diskon || 0);
    sh.getRange(row, 8).setValue(new Date());
    return { success: true, message: 'Customer berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteCustomerByPhone(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) {
      return { success: false, message: 'Customers sheet tidak ditemukan' };
    }
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    let rowToDelete = -1;
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizedPhone) {
        rowToDelete = i + 1;
        break;
      }
    }
    if (rowToDelete === -1) {
      return { success: false, message: 'Customer tidak ditemukan' };
    }
    sh.deleteRow(rowToDelete);
    return { success: true, message: 'Customer berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CRUD - SETTINGS OPERATIONS
// ==================================================
function updateSetting(key, value) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    if (!sh) {
      return { success: false, message: 'Pengaturan sheet tidak ditemukan' };
    }
    const data = sh.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(key).toLowerCase()) {
        sh.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    if (!found) {
      sh.appendRow([key, value, '']);
    }
    return { success: true, message: 'Pengaturan berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateLocation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOCATION_SHEET);
    if (!sh) {
      return { success: false, message: 'Lokasi sheet tidak ditemukan' };
    }
    sh.getRange(2, 1).setValue(data.nama_toko || 'Feisty Kitchen');
    sh.getRange(2, 2).setValue(data.latitude || -6.2088);
    sh.getRange(2, 3).setValue(data.longitude || 106.8456);
    return { success: true, message: 'Lokasi berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}
