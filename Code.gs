// ==================================================
// FEISTY ORDER - COMBINED SCRIPT
// ==================================================

const SPREADSHEET_ID = '1rGtVLbMwHrceTzJ9Nhu5H4ZTY2wAd_nXOc4LKPXFuLA';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';
const SETTINGS_SHEET = 'Pengaturan';
const CUSTOMERS_SHEET = 'Customers';
const ORDERS_SHEET = 'Orders';
const CS_KNOWLEDGE_SHEET = 'CS_Pengetahuan';

const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const ADMIN_PHONE = "6287787655880";

// Gemini API Configuration
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Bot States
const STATE_WAIT_NAME = "WAIT_NAME";
const STATE_MENU = "MENU";
const STATE_ORDER = "ORDER";
const STATE_CS_CHAT = "CS_CHAT";
const STATE_TIMEOUT = "TIMEOUT";

// Bot timeout in milliseconds (15 minutes)
const BOT_TIMEOUT_MS = 15 * 60 * 1000;

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
  const custHeaders = ['phone', 'nama', 'alamat', 'tipe_diskon', 'nilai_diskon', 'state', 'last_activity', 'created_at', 'updated_at'];
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
  
  // 6. Setup CS Knowledge Base Sheet
  sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CS_KNOWLEDGE_SHEET);
  }
  const csHeaders = ['kategori', 'keywords', 'jawaban', 'contoh_pertanyaan'];
  sh.getRange(1, 1, 1, csHeaders.length).setValues([csHeaders]);
  sh.getRange(1, 1, 1, csHeaders.length).setFontWeight('bold').setBackground('#F0E0FF');
  if (sh.getLastRow() === 1) {
    // Add sample knowledge base
    sh.appendRow(['Menu', 'menu,makanan,minuman,pilihan,ada apa', 'Feisty menyediakan berbagai pilihan makanan dan minuman. Untuk melihat menu lengkap, silakan ketik 1 untuk Order.', 'ada menu apa?']);
    sh.appendRow(['Harga', 'harga,mahal,murah,bayar,biaya', 'Harga bervariasi tergantung menu yang dipilih. Untuk informasi lengkap, silakan ketik 1 untuk melihat menu.', 'berapa harganya?']);
    sh.appendRow(['Pengiriman', 'kirim,antar,ongkir,delivery', 'Kami menyediakan layanan pengiriman dengan biaya ongkir berdasarkan jarak. Minimum pembelian Rp 50.000.', 'bisa antar?']);
    sh.appendRow(['Pembayaran', 'bayar,cod,qris,tunai', 'Kami menerima pembayaran via QRIS dan COD (Bayar di Tempat).', 'bayar lewat apa?']);
    sh.appendRow(['Jam Buka', 'buka,tutup,jam,kerja', 'Feisty beroperasi setiap hari. Untuk informasi jam operasional, silakan hubungi admin.', 'jam berapa tutup?']);
    sh.appendRow(['Lokasi', 'lokasi,alamat,cari,tempat', 'Feisty berlokasi di Jakarta. Untuk melihat lokasi kami, silakan ketik 1 untuk Order.', 'di mana?']);
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
    const body = JSON.parse(e.postData?.contents || "{}");
    
    // Handle ORDER dari index.html
    if (body.action === 'ORDER') {
      handleOrderFromIndex(body);
      return ok();
    }

    // Handle normal WA messages
    const phone = body.number || body.from || body.sender || "";
    const text = (body.message || body.body || body.text || "").trim();
    
    if (!phone || !text) {
      return ok();
    }
    
    const normalizedPhone = normalizeNumber(phone);
    handleIncomingWA(normalizedPhone, text);
    return ok();

  } catch (err) {
    return ok();
  }
}

function ok() {
  return ContentService.createTextOutput("OK");
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

// ==================================================
// BOT LOGIC - WHATSAPP CHATBOT
// ==================================================
function handleIncomingWA(phone, text) {
  try {
    logToSheet("=== INCOMING WA ===", "");
    logToSheet("Phone:", phone);
    logToSheet("Text:", text);
    
    // Update last activity
    updateLastActivity(phone);
    
    // Check if customer exists
    const customer = getCustomer(phone);
    
    if (!customer) {
      // New customer: ask for name
      logToSheet("New customer, saving...", "");
      saveNewCustomer(phone);
      sendWA(phone, msgAskName());
      return;
    }
    
    logToSheet("Customer state:", customer.state);
    logToSheet("Customer name:", customer.name);
    
    // Check for timeout
    if (customer.state === STATE_TIMEOUT) {
      logToSheet("Customer in timeout state, resetting...", "");
      updateCustomerState(phone, STATE_MENU);
      sendWA(phone, msgBotMenu(customer.name));
      return;
    }
    
    // Check timeout (15 minutes inactivity)
    if (customer.last_activity) {
      const lastActivity = new Date(customer.last_activity).getTime();
      const now = Date.now();
      if (now - lastActivity > BOT_TIMEOUT_MS) {
        logToSheet("Bot timeout (15 min), resetting...", "");
        updateCustomerState(phone, STATE_MENU);
        sendWA(phone, msgTimeout(customer.name));
        return;
      }
    }
    
    // Handle based on state
    handleState(phone, text, customer);
    
  } catch (err) {
    logToSheet("ERROR handleIncomingWA:", err.toString());
  }
}

function handleState(phone, text, customer) {
  const t = text.toLowerCase().trim();
  
  // Handle menu navigation from any state
  if (t === '0' || t === 'menu' || t === 'kembali') {
    updateCustomerState(phone, STATE_MENU);
    sendWA(phone, msgBotMenu(customer.name));
    return;
  }
  
  switch (customer.state) {
    case STATE_WAIT_NAME:
      handleWaitName(phone, text, customer);
      break;
    case STATE_MENU:
      handleMenu(phone, text, customer);
      break;
    case STATE_ORDER:
      handleOrder(phone, text, customer);
      break;
    case STATE_CS_CHAT:
      handleCSChat(phone, text, customer);
      break;
    default:
      // Unknown state, reset to menu
      logToSheet("Unknown state, resetting to MENU", customer.state);
      updateCustomerState(phone, STATE_MENU);
      sendWA(phone, msgBotMenu(customer.name));
  }
}

function handleWaitName(phone, text, customer) {
  const name = text.trim();
  if (name.length < 2) {
    sendWA(phone, "Nama minimal 2 karakter. Boleh kami tahu nama Kakak? 😊");
    return;
  }
  
  // Update customer with name and set to MENU
  updateCustomer(phone, name, STATE_MENU);
  logToSheet("Customer registered:", name);
  
  // Send welcome message with menu
  sendWA(phone, msgWelcome(name));
  sendWA(phone, msgBotMenu(name));
}

function handleMenu(phone, text, customer) {
  const t = text.toLowerCase().trim();
  
  if (t === '1' || t.includes('order') || t.includes('pesan') || t.includes('beli')) {
    updateCustomerState(phone, STATE_ORDER);
    sendWA(phone, msgOrderInfo(customer));
    return;
  }
  
  if (t === '2' || t.includes('cs') || t.includes('chat') || t.includes('tanya') || t.includes('bantuan')) {
    updateCustomerState(phone, STATE_CS_CHAT);
    sendWA(phone, msgCSWelcome(customer.name));
    return;
  }
  
  // Check for timeout trigger
  if (t === 'timeout' || t === 'habis') {
    updateCustomerState(phone, STATE_TIMEOUT);
    sendWA(phone, msgTimeout(customer.name));
    return;
  }
  
  sendWA(phone, msgInvalidMenu(customer.name));
}

function handleOrder(phone, text, customer) {
  const t = text.toLowerCase().trim();
  
  // Back to menu
  if (t === '0' || t === 'kembali' || t === 'batal') {
    updateCustomerState(phone, STATE_MENU);
    sendWA(phone, msgBotMenu(customer.name));
    return;
  }
  
  // Confirm order - send link with customer info
  if (t === '1' || t === 'ya' || t === 'oke' || t === ' lanjut') {
    sendWA(phone, msgOrderLink(customer));
    sendWA(phone, msgOrderConfirmation(customer.name));
    return;
  }
  
  // Show pricing info
  if (t === '2' || t === 'harga' || t.includes('berapa')) {
    sendWA(phone, msgOrderPricing(customer.name));
    return;
  }
  
  // Delivery info
  if (t === '3' || t.includes('kirim') || t.includes('antar') || t.includes('ongkir')) {
    sendWA(phone, msgOrderDelivery(customer.name));
    return;
  }
  
  sendWA(phone, msgInvalidOrder(customer.name));
}

function handleCSChat(phone, text, customer) {
  const t = text.toLowerCase().trim();
  
  // Back to menu
  if (t === '0' || t === 'kembali' || t === 'menu' || t === 'batal') {
    updateCustomerState(phone, STATE_MENU);
    sendWA(phone, msgBackToMenu(customer.name));
    return;
  }
  
  // End chat
  if (t === 'selesai' || t === 'udah' || t === 'stop') {
    updateCustomerState(phone, STATE_MENU);
    sendWA(phone, msgCSEnd(customer.name));
    return;
  }
  
  // Get AI response from Gemini
  const response = getGeminiResponse(text, customer);
  sendWA(phone, response);
  
  // Update last activity
  updateLastActivity(phone);
}

// ==================================================
// GEMINI AI INTEGRATION
// ==================================================
function getGeminiResponse(userMessage, customer) {
  try {
    // Get knowledge base
    const knowledgeBase = getKnowledgeBase();
    
    // Build context for Gemini
    const context = `Anda adalah Customer Service Feisty, sebuah layanan pemesanan makanan/minuman.
    
Nama customer: ${customer.name || 'Pelanggan'}

INFORMASI TENTANG FEISTY:
- Feisty adalah layanan pemesanan makanan dan minuman
- Tersedia menu lengkap dengan harga bervariasi
- Pengiriman tersedia dengan biaya ongkir berdasarkan jarak
- Pembayaran via QRIS atau COD
- Beroperasi setiap hari

PENGETAHUAN/CS KNOWLEDGE BASE:
${knowledgeBase}

ATURAN RESPONS:
1. Jawab pertanyaan customer dengan sopan dan helpful
2. Gunakan pengetahuan dari knowledge base di atas
3. Jika customer ingin memesan, arahkan ke fitur Order (ketik 1)
4. Jika pertanyaan di luar pengetahuan, katakan bahwa akan dihubungkan dengan admin
5. Respons maksimal 300 karakter
6. Selalu gunakan bahasa Indonesia yang casual dan ramah

Pertanyaan customer: ${userMessage}`;

    const payload = {
      contents: [{
        parts: [{ text: context }]
      }]
    };

    const url = GEMINI_API_URL + "?key=" + GEMINI_API_KEY;
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates.length > 0) {
      return result.candidates[0].content.parts[0].text;
    }
    
    return msgCSFallback(customer.name);
    
  } catch (err) {
    logToSheet("Gemini Error:", err.toString());
    return msgCSFallback(customer.name);
  }
}

function getKnowledgeBase() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return "";
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return "";
    
    let knowledge = "";
    for (let i = 1; i < data.length; i++) {
      const kategori = data[i][0] || "";
      const keywords = data[i][1] || "";
      const jawaban = data[i][2] || "";
      if (jawaban) {
        knowledge += `[${kategori}] Keywords: ${keywords}\nJawaban: ${jawaban}\n\n`;
      }
    }
    
    return knowledge;
  } catch (err) {
    return "";
  }
}

function msgCSFallback(name) {
  return `Halo Kak ${name} 🙏

Maaf, saya tidak memahami pertanyaan Kakak. 

Silakan:
- Ketik *1* untuk melihat menu dan memesan
- Ketik *0* untuk kembali ke menu utama
- Hubungi admin langsung jika perlu: ${ADMIN_PHONE}

Terima kasih! 😊`;
}

// ==================================================
// CUSTOMER DATABASE FUNCTIONS
// ==================================================
function getCustomer(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return null;
    
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = normalizeNumber(String(data[i][0]));
      if (rowPhone === normalizeNumber(phone)) {
        return {
          row: i + 1,
          phone: data[i][0],
          name: data[i][1] || '',
          alamat: data[i][2] || '',
          state: data[i][5] || '',
          last_activity: data[i][6] || null
        };
      }
    }
  } catch (err) {
    logToSheet("ERROR getCustomer:", err.toString());
  }
  return null;
}

function saveNewCustomer(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return;
    
    sh.appendRow([phone, "", "", "", "", STATE_WAIT_NAME, new Date(), new Date(), new Date()]);
  } catch (err) {
    logToSheet("ERROR saveNewCustomer:", err.toString());
  }
}

function updateCustomer(phone, name, state) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        const row = i + 1;
        if (name) sh.getRange(row, 2).setValue(name);
        if (state) sh.getRange(row, 6).setValue(state);
        sh.getRange(row, 7).setValue(new Date()); // last_activity
        sh.getRange(row, 9).setValue(new Date()); // updated_at
        return;
      }
    }
  } catch (err) {
    logToSheet("ERROR updateCustomer:", err.toString());
  }
}

function updateCustomerState(phone, state) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        const row = i + 1;
        sh.getRange(row, 6).setValue(state);
        sh.getRange(row, 7).setValue(new Date()); // last_activity
        sh.getRange(row, 9).setValue(new Date()); // updated_at
        return;
      }
    }
  } catch (err) {
    logToSheet("ERROR updateCustomerState:", err.toString());
  }
}

function updateLastActivity(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sh.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (normalizeNumber(String(data[i][0])) === normalizeNumber(phone)) {
        sh.getRange(i + 1, 7).setValue(new Date());
        return;
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

// ==================================================
// BOT MESSAGES
// ==================================================
function msgAskName() {
  return `👋 *Selamat Datang di Feisty*

Boleh kami tahu *nama Kakak* untuk melanjutkan? 😊`;
}

function msgWelcome(name) {
  return `✨ *Halo Kak ${name}!* ✨

Senang berkenalan dengan Kakak! 🙏

Feisty siap melayani Kakak dengan berbagai pilihan makanan dan minuman lezat.`;
}

function msgBotMenu(name) {
  return `🍽️ *MENU FEISTY*

Halo Kak ${name}! 

Silakan pilih:
1️⃣ *Order Menu* 🛒
2️⃣ *Chat CS* 💬
3️⃣ *Info Promo* 🎉

Ketik angka atau kata kunci di atas ya! 😊`;
}

function msgInvalidMenu(name) {
  return `⚠️ *Maaf Kak ${name}*

Pilihan tidak dikenali 🙏

Silakan ketik:
1️⃣ Untuk Order
2️⃣ Untuk Chat CS
3️⃣ Untuk Promo

atau ketik *0* untuk kembali ke menu.`;
}

function msgOrderInfo(customer) {
  return `🛒 *ORDER MENU*

Halo Kak ${customer.name}!

Feisty menyediakan berbagai pilihan makanan dan minuman yang lezat.

Silakan pilih:
1️⃣ *Lanjut ke Pemesanan* 
2️⃣ *Info Harga*
3️⃣ *Info Pengiriman*

Ketik angka atau *0* untuk kembali.`;
}

function msgOrderLink(customer) {
  // Create order link with customer info pre-filled
  const encodedName = encodeURIComponent(customer.name || '');
  const encodedPhone = encodeURIComponent(customer.phone || '');
  
  return `🔗 *LINK PEMESANAN*

Silakan klik link di bawah untuk melanjutkan pemesanan:

➡️ feisty.my.id/?name=${encodedName}&phone=${encodedPhone}

Data Kakak sudah terisi otomatis, jadi tinggal pilih menu dan checkout! 🎉

Ketik *1* jika sudah memesan atau ada yang ingin ditanyakan.`;
}

function msgOrderConfirmation(name) {
  return `📋 Setelah memesan, Kakak akan menerima:
- Konfirmasi pesanan via WhatsApp
- Info estimasi pengiriman
- Notifikasi status pesanan

Terima kasih sudah memesan di Feisty! 🙏

Ketik *0* untuk kembali ke menu utama.`;
}

function msgOrderPricing(name) {
  return `💰 *INFO HARGA*

Feisty menyediakan menu dengan harga mulai dari Rp 15.000 - Rp 100.000.

Untuk melihat menu lengkap dengan harga, silakan klik link:
➡️ feisty.my.id

Atau ketik *1* untuk langsung ke pemesanan! 😊`;
}

function msgOrderDelivery(name) {
  return `🚚 *INFO PENGIRIMAN*

- Pengiriman tersedia di area Jakarta dan sekitarnya
- Ongkir dihitung berdasarkan jarak
- Minimum pembelian Rp 50.000
- Gratis ongkir untuk jarak tertentu

Ketik *1* untuk memulai pemesanan! 🛒`;
}

function msgInvalidOrder(name) {
  return `⚠️ *Maaf Kak ${name}*

Pilihan tidak dikenali 🙏

Silakan ketik:
1️⃣ Lanjut ke Pemesanan
2️⃣ Info Harga  
3️⃣ Info Pengiriman
0️⃣ Kembali ke menu

atau ketik *0* untuk kembali.`;
}

function msgCSWelcome(name) {
  return `💬 *CHAT CS*

Halo Kak ${name}! 👋

Saya asisten Feisty yang siap membantu Kakak.

Silakan ketik pertanyaan Kakak tentang:
- Menu dan harga
- Pengiriman
- Pembayaran
- Promo
- Atau hal lain yang ingin ditanyakan

Ketik *0* untuk kembali ke menu utama atau *selesai* untuk mengakhiri chat.

Siap membantu Kakak! 😊`;
}

function msgCSEnd(name) {
  return `✅ *Chat Selesai*

Terima kasih sudah chatting dengan Feisty, Kak ${name}! 🙏

Jika ada pertanyaan lain, silakan hubungi kami kembali atau ketik apa saja untuk memulai chat baru.

Feisty siap membantu kapan saja! 💚

Ketik *apa saja* untuk memulai percakapan baru.`;
}

function msgBackToMenu(name) {
  return `↩️ *Kembali ke Menu*

Baik Kak ${name}, kembali ke menu utama.

Silakan pilih:
1️⃣ *Order Menu* 🛒
2️⃣ *Chat CS* 💬
3️⃣ *Info Promo* 🎉`;
}

function msgTimeout(name) {
  return `⏰ *Sesi Habis*

Halo Kak ${name}!

Maaf, sepertinya sudah ada yang bisa saya bantu? 

Sesi chat Feisty berakhir setelah 15 menit tidak aktif.

Silakan ketik *apa saja* untuk memulai chat baru dengan Feisty! 😊`;

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
    
    const response = UrlFetchApp.fetch(WA_API, options);
    return response.getResponseCode();
  } catch (err) {
    logToSheet("ERROR sendWA:", err.toString());
    return 0;
  }
}

function normalizeNumber(num) {
  if (!num) return "";
  let phone = String(num).replace(/\D/g, "");
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  if (!phone.startsWith("62")) phone = "62" + phone;
  return phone;
}

// ==================================================
// TIMEOUT CHECK TRIGGER (runs every 5 minutes)
// ==================================================
function checkBotTimeouts() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return;
    
    const data = sh.getDataRange().getValues();
    const now = Date.now();
    
    for (let i = 1; i < data.length; i++) {
      const state = data[i][5] || "";
      const lastActivity = data[i][6];
      
      // Only check customers in active states (not TIMEOUT or MENU)
      if (state === STATE_ORDER || state === STATE_CS_CHAT) {
        if (lastActivity) {
          const lastTime = new Date(lastActivity).getTime();
          if (now - lastTime > BOT_TIMEOUT_MS) {
            const phone = data[i][0];
            const name = data[i][1] || 'Kak';
            
            // Send timeout message
            updateCustomerState(phone, STATE_MENU);
            sendWA(phone, msgTimeout(name));
            
            logToSheet("Timeout sent to:", phone);
          }
        }
      }
    }
  } catch (err) {
    logToSheet("ERROR checkBotTimeouts:", err.toString());
  }
}

// ==================================================
// ADMIN FUNCTIONS (unchanged)
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
// ADMIN CRUD FUNCTIONS
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
      last_activity: row[6],
      created_at: row[7],
      updated_at: row[8]
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
      STATE_MENU,
      new Date(),
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
    sh.getRange(row, 9).setValue(new Date());
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

// ==================================================
// CS KNOWLEDGE CRUD
// ==================================================
function addCSKnowledge(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) {
      return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    }
    sh.appendRow([
      data.kategori || '',
      data.keywords || '',
      data.jawaban || '',
      data.contoh_pertanyaan || ''
    ]);
    return { success: true, message: 'Pengetahuan CS berhasil ditambahkan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function updateCSKnowledge(rowNumber, data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) {
      return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    }
    const row = parseInt(rowNumber) + 2;
    sh.getRange(row, 1).setValue(data.kategori || '');
    sh.getRange(row, 2).setValue(data.keywords || '');
    sh.getRange(row, 3).setValue(data.jawaban || '');
    sh.getRange(row, 4).setValue(data.contoh_pertanyaan || '');
    return { success: true, message: 'Pengetahuan CS berhasil diperbarui' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteCSKnowledge(rowNumber) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) {
      return { success: false, message: 'CS Knowledge sheet tidak ditemukan' };
    }
    const row = parseInt(rowNumber) + 1;
    sh.deleteRow(row);
    return { success: true, message: 'Pengetahuan CS berhasil dihapus' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getAllCSKnowledge() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CS_KNOWLEDGE_SHEET);
    if (!sh) return [];
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map((row, i) => ({
      row: i,
      kategori: String(row[0] || ''),
      keywords: String(row[1] || ''),
      jawaban: String(row[2] || ''),
      contoh_pertanyaan: String(row[3] || '')
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}
