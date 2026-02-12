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
// Automatically creates/modifies sheets with required columns
// ==================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Setup Menu Sheet
  setupMenuSheet(ss);
  
  // 2. Setup Customers Sheet
  setupCustomersSheet(ss);
  
  // 3. Setup Orders Sheet
  setupOrdersSheet(ss);
  
  // 4. Setup Lokasi Sheet
  setupLokasiSheet(ss);
  
  // 5. Setup Pengaturan Sheet
  setupPengaturanSheet(ss);
  
  return { status: 'success', message: 'All sheets setup completed' };
}

function setupMenuSheet(ss) {
  let sh = ss.getSheetByName(MENU_SHEET);
  
  if (!sh) {
    sh = ss.insertSheet(MENU_SHEET);
  }
  
  // Set headers for Menu sheet
  const headers = [
    'nama',           // Item name
    'deskripsi',      // Description
    'harga',          // Selling price
    'harga_asli',     // Original price (for discounts)
    'diskon_persen',  // Percentage discount (0-100)
    'kategori',       // Category
    'gambar',         // Image URL
    'aktif',          // Active status (TRUE/FALSE)
    'urutan'          // Sort order
  ];
  
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FFE0D6');
  
  // Set column widths
  sh.setColumnWidth(1, 200);  // nama
  sh.setColumnWidth(2, 250);  // deskripsi
  sh.setColumnWidth(3, 100);  // harga
  sh.setColumnWidth(4, 100);  // harga_asli
  sh.setColumnWidth(5, 100);  // diskon_persen
  sh.setColumnWidth(6, 120);  // kategori
  sh.setColumnWidth(7, 250);  // gambar
  sh.setColumnWidth(8, 80);   // aktif
  sh.setColumnWidth(9, 80);   // urutan
  
  // Add sample data if empty
  if (sh.getLastRow() === 1) {
    sh.appendRow(['Nasi Goreng Special', 'Nasi goreng dengan ayam, telur, dan sayuran', 25000, 30000, 17, 'Makanan', '', true, 1]);
    sh.appendRow(['Ayam Goreng', 'Ayam goreng krispi dengan sambal', 20000, 25000, 20, 'Makanan', '', true, 2]);
    sh.appendRow(['Es Teh Manis', 'Es teh manis segar', 5000, 0, 0, 'Minuman', '', true, 3]);
  }
}

function setupCustomersSheet(ss) {
  let sh = ss.getSheetByName(CUSTOMERS_SHEET);
  
  if (!sh) {
    sh = ss.insertSheet(CUSTOMERS_SHEET);
  }
  
  // Set headers for Customers sheet
  const headers = [
    'phone',         // Phone number (primary key)
    'nama',          // Customer name
    'alamat',        // Address
    'tipe_diskon',   // Discount type (persen/fix)
    'nilai_diskon',  // Discount value
    'state',         // Bot state
    'created_at',    // Created timestamp
    'updated_at'     // Updated timestamp
  ];
  
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E0FFE0');
  
  // Set column widths
  sh.setColumnWidth(1, 130);  // phone
  sh.setColumnWidth(2, 180);  // nama
  sh.setColumnWidth(3, 300);  // alamat
  sh.setColumnWidth(4, 100);  // tipe_diskon
  sh.setColumnWidth(5, 100);  // nilai_diskon
  sh.setColumnWidth(6, 100);  // state
  sh.setColumnWidth(7, 150);  // created_at
  sh.setColumnWidth(8, 150);  // updated_at
}

function setupOrdersSheet(ss) {
  let sh = ss.getSheetByName(ORDERS_SHEET);
  
  if (!sh) {
    sh = ss.insertSheet(ORDERS_SHEET);
  }
  
  // Set headers for Orders sheet
  const headers = [
    'timestamp',       // Order timestamp
    'phone',          // Customer phone
    'nama',           // Customer name
    'alamat',         // Customer address
    'items',          // Items (JSON)
    'subtotal',       // Subtotal
    'ongkir',         // Shipping cost
    'diskon',         // Discount
    'total',          // Total
    'payment_method', // Payment method
    'order_id',       // Unique order ID
    'status'          // Order status
  ];
  
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E0E0FF');
  
  // Set column widths
  sh.setColumnWidth(1, 150);  // timestamp
  sh.setColumnWidth(2, 130);  // phone
  sh.setColumnWidth(3, 150);  // nama
  sh.setColumnWidth(4, 250);  // alamat
  sh.setColumnWidth(5, 300);  // items
  sh.setColumnWidth(6, 100);  // subtotal
  sh.setColumnWidth(7, 100);  // ongkir
  sh.setColumnWidth(8, 100);  // diskon
  sh.setColumnWidth(9, 100);  // total
  sh.setColumnWidth(10, 100); // payment_method
  sh.setColumnWidth(11, 180); // order_id
  sh.setColumnWidth(12, 100); // status
}

function setupLokasiSheet(ss) {
  let sh = ss.getSheetByName(LOCATION_SHEET);
  
  if (!sh) {
    sh = ss.insertSheet(LOCATION_SHEET);
  }
  
  // Set headers for Lokasi sheet
  const headers = [
    'nama_toko',   // Store name
    'latitude',   // Store latitude
    'longitude'   // Store longitude
  ];
  
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FFF0E0');
  
  // Add default data if empty
  if (sh.getLastRow() === 1) {
    sh.appendRow(['Feisty Kitchen', -6.2088, 106.8456]);
  }
}

function setupPengaturanSheet(ss) {
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET);
  }
  
  // Set headers for Pengaturan sheet
  const headers = [
    'setting',    // Setting name
    'value',      // Setting value
    'description' // Description
  ];
  
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FFF0F0');
  
  // Add default settings if empty
  if (sh.getLastRow() === 1) {
    sh.appendRow(['base_shipping_cost', 10000, 'Base shipping cost in IDR']);
    sh.appendRow(['shipping_cost_per_km', 2000, 'Additional cost per km']);
    sh.appendRow(['free_shipping_min_distance', 5, 'Min distance for free shipping (km)']);
    sh.appendRow(['qris_fee', 1000, 'QRIS transaction fee']);
  }
  
  // Set column widths
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 150);
  sh.setColumnWidth(3, 300);
}

// ==================================================
// DOGET
// ==================================================
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback;
  const phone = e?.parameter?.phone; // Customer phone from URL
  
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
// DOPOST
// ==================================================
function doPost(e) {
  try {
    let body = {};
    const contentType = e?.postData?.contentType || '';
    const postData = e?.postData?.contents || '';
    
    if (contentType.includes('application/json')) {
      body = JSON.parse(postData);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse URL-encoded data
      const params = postData.split('&');
      params.forEach(p => {
        const [key, value] = p.split('=');
        if (key) {
          body[decodeURIComponent(key)] = decodeURIComponent((value || '').replace(/\+/g, ' '));
        }
      });
    } else {
      // Try parsing as JSON anyway
      try {
        body = JSON.parse(postData);
      } catch (err) {
        // Try URL-encoded anyway
        const params = postData.split('&');
        params.forEach(p => {
          const [key, value] = p.split('=');
          if (key) {
            body[decodeURIComponent(key)] = decodeURIComponent((value || '').replace(/\+/g, ' '));
          }
        });
      }
    }
    
    const action = body.action;
    
    // CRUD Actions
    if (action === 'addMenu') {
      return jsonResponse(addMenuItem(body));
    }
    if (action === 'updateMenu') {
      return jsonResponse(updateMenuItem(body.row, body));
    }
    if (action === 'deleteMenu') {
      return jsonResponse(deleteMenuItem(body.row));
    }
    if (action === 'addCustomer') {
      return jsonResponse(addCustomer(body));
    }
    if (action === 'updateCustomer') {
      return jsonResponse(updateCustomerByPhone(body.phone, body));
    }
    if (action === 'deleteCustomer') {
      return jsonResponse(deleteCustomerByPhone(body.phone));
    }
    if (action === 'updateSetting') {
      return jsonResponse(updateSetting(body.key, body.value));
    }
    if (action === 'updateLocation') {
      return jsonResponse(updateLocation(body));
    }
    
    if (action === 'ORDER') {
      handleOrderFromIndex(body);
      return jsonResponse({ status: 'success' });
    }
    
    if (action === 'updateStatus') {
      const result = updateOrderStatus(body.order_id, body.status);
      return jsonResponse(result);
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
    shipping_cost_per_km: settings.shipping_cost_per_km,
    free_shipping_min_distance: settings.free_shipping_min_distance
  };
}

// ==================================================
// GET SETTINGS FROM PENGATURAN SHEET
// ==================================================
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

// ==================================================
// GET MENU (with discount support)
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
        const aktifStr = String(aktif).toLowerCase();
        return aktif === true || aktif === 'true' || aktif === 'TRUE' || aktif === 1 || aktifStr === 'true';
      })
      .map((r, i) => {
        const harga = Number(r[idx('harga')]) || 0;
        const hargaAsli = Number(r[idx('harga_asli')]) || 0;
        const diskonPersen = Number(r[idx('diskon_persen')]) || 0;
        
        // Calculate final price
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
          harga: harga,           // Original selling price
          harga_asli: hargaAsli,   // Original price (for display)
          diskon_persen: diskonPersen, // Percentage discount
          harga_diskon: hargaDiskon,  // Final price after discount
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
// GET CUSTOMER BY PHONE
// ==================================================
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
// HANDLE ORDER
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
        sendWA(phone, "🛒 https://feisty.my.id/");
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
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        return { row: i + 1, phone: data[i][0], name: data[i][1], state: data[i][5] };
      }
    }
  } catch (err) {}
  return null;
}

function saveNewCustomer(phone) {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET);
    sh.appendRow([phone, "", "", "", "", "WAIT_NAME", new Date(), new Date()]);
  } catch (err) {}
}

function updateCustomer(row, name, state) {
  try {
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CUSTOMERS_SHEET);
    sh.getRange(row, 2).setValue(name);
    sh.getRange(row, 6).setValue(state);
    sh.getRange(row, 8).setValue(new Date());
  } catch (err) {}
}

// ==================================================
// ADMIN FUNCTIONS
// ==================================================

// Get all orders for admin dashboard
function getOrders() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(ORDERS_SHEET);
    
    if (!sh) return [];
    
    const data = sh.getDataRange().getValues();
    
    if (data.length < 2) return [];
    
    // Remove header
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

// Get all customers for admin dashboard
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

// Update order status
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
    
    // Find the order (column K = index 10 is order_id)
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
    
    // Get current order data
    const currentStatus = data[orderRow - 1][11];
    const customerPhone = data[orderRow - 1][1];
    const customerName = data[orderRow - 1][2];
    const orderTotal = data[orderRow - 1][8];
    
    // Update status
    sh.getRange(orderRow, 12).setValue(newStatus);
    
    // Send WA notification
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

// Add new menu item
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

// Update menu item
function updateMenuItem(index, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Menu sheet tidak ditemukan' };
    }
    
    // Row 1 = header, Row 2 = first data item
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

// Delete menu item
function deleteMenuItem(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(MENU_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Menu sheet tidak ditemukan' };
    }
    
    const row = parseInt(rowNumber) + 1; // +1 for header
    sh.deleteRow(row);
    
    return { success: true, message: 'Menu item berhasil dihapus' };
    
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==================================================
// CRUD - CUSTOMER OPERATIONS
// ==================================================

// Add new customer
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

// Update customer
function updateCustomer(rowNumber, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Customers sheet tidak ditemukan' };
    }
    
    const row = parseInt(rowNumber) + 1; // +1 for header
    
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

// Delete customer by phone
function deleteCustomerByPhone(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Customers sheet tidak ditemukan' };
    }
    
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    
    // Find the row
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

// Update customer by phone (for admin)
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
    
    // Find the row by old phone number
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
    
    // Update all columns
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

// ==================================================
// CRUD - SETTINGS OPERATIONS
// ==================================================

// Update setting by key
function updateSetting(key, value) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Pengaturan sheet tidak ditemukan' };
    }
    
    const data = sh.getDataRange().getValues();
    
    // Find setting by key
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

// Get all settings
function getAllSettings() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SETTINGS_SHEET);
    
    if (!sh) return {};
    
    const data = sh.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < data.length; i++) {
      settings[String(data[i][0])] = data[i][1];
    }
    
    return settings;
    
  } catch (err) {
    return {};
  }
}

// Update location
function updateLocation(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(LOCATION_SHEET);
    
    if (!sh) {
      return { success: false, message: 'Lokasi sheet tidak ditemukan' };
    }
    
    // Update row 2 (after header)
    sh.getRange(2, 1).setValue(data.nama_toko || 'Feisty Kitchen');
    sh.getRange(2, 2).setValue(data.latitude || -6.2088);
    sh.getRange(2, 3).setValue(data.longitude || 106.8456);
    
    return { success: true, message: 'Lokasi berhasil diperbarui' };
    
  } catch (err) {
    return { success: false, message: err.toString() };
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
