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
const BOT_MESSAGES_SHEET = 'Bot_Pesan';

const DEVICE_ID = "92b2af76-130d-46f0-b811-0874e3407988";
const WA_API = "https://api.whacenter.com/api/send";
const ADMIN_PHONE = "6287787655880";

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyAVtBqASiFLBTeKWttnCNQNvyJZ-x2ojBU";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
  
  // 7. Setup Bot Messages Sheet
  sh = ss.getSheetByName(BOT_MESSAGES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(BOT_MESSAGES_SHEET);
  }
  const botMsgHeaders = ['key', 'message', 'description'];
  sh.getRange(1, 1, 1, botMsgHeaders.length).setValues([botMsgHeaders]);
  sh.getRange(1, 1, 1, botMsgHeaders.length).setFontWeight('bold').setBackground('#E0FFE0');
  if (sh.getLastRow() === 1) {
    // Default bot messages - using template literals
    sh.appendRow(['welcome', '👋 *Selamat Datang di Feisty*\n\nBoleh kami tahu *nama Kakak* untuk melanjutkan? 😊', 'Pesan saat customer baru']);
    sh.appendRow(['bot_menu', '🍽️ *MENU FEISTY*\n\nHalo Kak {nama}!\n\nSilakan pilih:\n1️⃣ *Order Menu* 🛒\n2️⃣ *Chat CS* 💬\n3️⃣ *Info Promo* 🎉\n\nKetik angka atau kata kunci di atas ya! 😊', 'Menu utama bot']);
    sh.appendRow(['order_link', '🔗 *LINK PEMESANAN*\n\nSilakan klik link di bawah untuk melanjutkan pemesanan:\n\n➡️ feisty.my.id/?name={nama}&phone={phone}\n\nData Kakak sudah terisi otomatis! 🎉', 'Link pemesanan dengan data customer']);
    sh.appendRow(['cs_welcome', '💬 *CHAT CS*\n\nHalo Kak {nama}! 👋\n\nSilakan ketik pertanyaan Kakak tentang menu, pengiriman, pembayaran, atau hal lain.\n\nKetik *0* untuk kembali ke menu utama.', 'Pesan welcome CS']);
    sh.appendRow(['timeout', '⏰ *Sesi Habis*\n\nHalo Kak {nama}!\n\nMaaf, sesi chat Feisty berakhir setelah 15 menit tidak aktif.\n\nKetik *apa saja* untuk memulai chat baru! 😊', 'Pesan timeout']);
    sh.appendRow(['cs_fallback', 'Halo Kak {nama} 🙏\n\nMaaf, saya tidak memahami pertanyaan Kakak.\n\nSilakan ketik *1* untuk memesan atau *0* untuk kembali ke menu.', 'Pesan fallback CS']);
    sh.appendRow(['order_info', '🛒 *ORDER MENU*\n\nHalo Kak {nama}!\n\nFeisty menyediakan berbagai pilihan makanan dan minuman yang lezat.\n\nSilakan pilih:\n1️⃣ *Lanjut ke Pemesanan*\n2️⃣ *Info Harga*\n3️⃣ *Info Pengiriman*', 'Info pemesanan']);
    sh.appendRow(['order_pricing', '💰 *INFO HARGA*\n\nFeisty menyediakan menu dengan harga mulai dari Rp 15.000 - Rp 100.000.\n\n➡️ feisty.my.id\n\nKetik *1* untuk langsung ke pemesanan! 😊', 'Info harga']);
    sh.appendRow(['order_delivery', '🚚 *INFO PENGIRIMAN*\n\n- Pengiriman tersedia di area Jakarta\n- Ongkir berdasarkan jarak\n- Minimum pembelian Rp 50.000\n- Gratis ongkir untuk jarak tertentu\n\nKetik *1* untuk memulai pemesanan! 🛒', 'Info pengiriman']);
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
  else if (action === 'getCSKnowledge') result = getAllCSKnowledge();
  else if (action === 'getBotMessages') result = getAllBotMessages();
  else if (action === 'updateBotMessage') {
    const key = e.parameter.key;
    const message = e.parameter.message;
    result = updateBotMessage(key, message);
  }
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
      logToSheet("Customer in timeout state, resetting to WAIT_NAME...", "");
      updateCustomerState(phone, STATE_WAIT_NAME);
      sendWA(phone, msgAskName());
      return;
    }
    
    // Check timeout (15 minutes inactivity)
    if (customer.last_activity) {
      const lastActivity = new Date(customer.last_activity).getTime();
      const now = Date.now();
      if (now - lastActivity > BOT_TIMEOUT_MS) {
        logToSheet("Bot timeout (15 min), resetting to WAIT_NAME...", "");
        updateCustomerState(phone, STATE_WAIT_NAME);
        sendWA(phone, msgAskName());
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
  
  // Order flow trigger - redirect to order
  if (t === '1' || t === 'order' || t.includes('mau pesan') || t.includes('ingin pesan') || t.includes('mau beli')) {
    updateCustomerState(phone, STATE_ORDER);
    sendWA(phone, `📦 *PEMESANAN*\n\nBaik Kak ${customer.name}, silakan klik link di bawah untuk memilih menu:\n\n➡️ feisty.my.id/?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}\n\nData Kakak sudah terisi otomatis! 🎉`);
    sendWA(phone, msgOrderConfirmation(customer.name));
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
4. JANGAN PERNAH bilang akan menghubungkan ke admin atau CS manusia
5. JANGAN PERNAH bilang "maaf saya tidak tahu" atau "saya akan hubungkan dengan admin"
6. Jika benar-benar tidak bisa menjawab, berikan response yang helpful tapi JANGAN sebut admin
7. Respons maksimal 300 karakter
8. Selalu gunakan bahasa Indonesia yang casual dan ramah

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
    
    // Check if customer already exists (prevent duplicates)
    const data = sh.getDataRange().getValues();
    const normalizedPhone = normalizeNumber(phone);
    
    for (let i = 1; i < data.length; i++) {
      const existingPhone = normalizeNumber(String(data[i][0]));
      if (existingPhone === normalizedPhone) {
        // Customer already exists, just update state to WAIT_NAME
        const row = i + 1;
        sh.getRange(row, 6).setValue(STATE_WAIT_NAME); // state
        sh.getRange(row, 7).setValue(new Date()); // last_activity
        sh.getRange(row, 9).setValue(new Date()); // updated_at
        logToSheet("Customer updated (already exists):", phone);
        return;
      }
    }
    
    // Customer not found, create new row
    sh.appendRow([phone, "", "", "", "", STATE_WAIT_NAME, new Date(), new Date(), new Date()]);
    logToSheet("New customer created:", phone);
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
// BOT MESSAGES FUNCTIONS
// ==================================================
function getBotMessage(key) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(BOT_MESSAGES_SHEET);
    if (!sh) return null;
    
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(key).toLowerCase()) {
        return String(data[i][1] || '');
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

function replaceBotVars(message, customer) {
  if (!message) return '';
  return message
    .replace(/{nama}/g, customer.name || 'Kak')
    .replace(/{phone}/g, customer.phone || '');
}

function updateBotMessage(key, newMessage) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(BOT_MESSAGES_SHEET);
    if (!sh) {
      return { success: false, message: 'Bot Messages sheet tidak ditemukan' };
    }
    
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(key).toLowerCase()) {
        sh.getRange(i + 1, 2).setValue(newMessage);
        return { success: true, message: 'Pesan bot berhasil diperbarui' };
      }
    }
    return { success: false, message: 'Key tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getAllBotMessages() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(BOT_MESSAGES_SHEET);
    if (!sh) return [];
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const rows = data.slice(1);
    return rows.map((row, i) => ({
      row: i,
      key: String(row[0] || ''),
      message: String(row[1] || ''),
      description: String(row[2] || '')
    }));
  } catch (err) {
    return { error: err.toString() };
  }
}

// ==================================================
// BOT MESSAGES (Templates - akan di-override oleh sheet)
// ==================================================
function msgAskName() {
  const msg = getBotMessage('welcome');
  if (msg) return msg;
  return '👋 *Selamat Datang di Feisty*\n\nBoleh kami tahu *nama Kakak* untuk melanjutkan? 😊';
}

function msgWelcome(name) {
  return `✨ *Halo Kak ${name}!* ✨\n\nSenang berkenalan dengan Kakak! 🙏\n\nFeisty siap melayani Kakak dengan berbagai pilihan makanan dan minuman lezat.`;
}

function msgBotMenu(customer) {
  const msg = getBotMessage('bot_menu');
  if (msg) return replaceBotVars(msg, customer);
  return `🍽️ *MENU FEISTY*\n\nHalo Kak ${customer.name}!\n\nSilakan pilih:\n1️⃣ *Order Menu* 🛒\n2️⃣ *Chat CS* 💬\n3️⃣ *Info Promo* 🎉\n\nKetik angka atau kata kunci di atas ya! 😊`;
}

function msgInvalidMenu(name) {
  return `⚠️ *Maaf Kak ${name}*\n\nPilihan tidak dikenali 🙏\n\nSilakan ketik:\n1️⃣ Untuk Order\n2️⃣ Untuk Chat CS\n3️⃣ Untuk Promo\n\natau ketik *0* untuk kembali ke menu.`;
}

function msgOrderInfo(customer) {
  const msg = getBotMessage('order_info');
  if (msg) return replaceBotVars(msg, customer);
  return `🛒 *ORDER MENU*\n\nHalo Kak ${customer.name}!\n\nFeisty menyediakan berbagai pilihan makanan dan minuman yang lezat.\n\nSilakan pilih:\n1️⃣ *Lanjut ke Pemesanan*\n2️⃣ *Info Harga*\n3️⃣ *Info Pengiriman*\n\nKetik angka atau *0* untuk kembali.`;
}

function msgOrderLink(customer) {
  const encodedName = encodeURIComponent(customer.name || '');
  const encodedPhone = encodeURIComponent(customer.phone || '');
  
  const msg = getBotMessage('order_link');
  if (msg) {
    const link = `feisty.my.id/?name=${encodedName}&phone=${encodedPhone}`;
    return replaceBotVars(msg, customer).replace('{link}', link).replace(/ feisty\.my\.id\/\?name=\{nama\}&phone=\{phone\}/g, link);
  }
  
  return `🔗 *LINK PEMESANAN*\n\nSilakan klik link di bawah untuk melanjutkan pemesanan:\n\n➡️ feisty.my.id/?name=${encodedName}&phone=${encodedPhone}\n\nData Kakak sudah terisi otomatis, jadi tinggal pilih menu dan checkout! 🎉\n\nKetik *1* jika sudah memesan atau ada yang ingin ditanyakan.`;
}

function msgOrderConfirmation(name) {
  return `📋 Setelah memesan, Kakak akan menerima:\n- Konfirmasi pesanan via WhatsApp\n- Info estimasi pengiriman\n- Notifikasi status pesanan\n\nTerima kasih sudah memesan di Feisty! 🙏\n\nKetik *0* untuk kembali ke menu utama.`;
}

function msgOrderPricing(name) {
  const msg = getBotMessage('order_pricing');
  if (msg) return replaceBotVars(msg, { name: name });
  return `💰 *INFO HARGA*\n\nFeisty menyediakan menu dengan harga mulai dari Rp 15.000 - Rp 100.000.\n\nUntuk melihat menu lengkap dengan harga, silakan klik link:\n➡️ feisty.my.id\n\nAtau ketik *1* untuk langsung ke pemesanan! 😊`;
}

function msgOrderDelivery(name) {
  const msg = getBotMessage('order_delivery');
  if (msg) return replaceBotVars(msg, { name: name });
  return `🚚 *INFO PENGIRIMAN*\n\n- Pengiriman tersedia di area Jakarta dan sekitarnya\n- Ongkir dihitung berdasarkan jarak\n- Minimum pembelian Rp 50.000\n- Gratis ongkir untuk jarak tertentu\n\nKetik *1* untuk memulai pemesanan! 🛒`;
}

function msgInvalidOrder(name) {
  return `⚠️ *Maaf Kak ${name}*\n\nPilihan tidak dikenali 🙏\n\nSilakan ketik:\n1️⃣ Lanjut ke Pemesanan\n2️⃣ Info Harga  \n3️⃣ Info Pengiriman\n0️⃣ Kembali ke menu\n\natau ketik *0* untuk kembali.`;
}

function msgCSWelcome(customer) {
  const msg = getBotMessage('cs_welcome');
  if (msg) return replaceBotVars(msg, customer);
  return `💬 *CHAT CS*\n\nHalo Kak ${customer.name}! 👋\n\nSaya asisten Feisty yang siap membantu Kakak.\n\nSilakan ketik pertanyaan Kakak tentang:\n- Menu dan harga\n- Pengiriman\n- Pembayaran\n- Promo\n- Atau hal lain yang ingin ditanyakan\n\nKetik *0* untuk kembali ke menu utama atau *selesai* untuk mengakhiri chat.\n\nSiap membantu Kakak! 😊`;
}

function msgCSEnd(name) {
  return `✅ *Chat Selesai*\n\nTerima kasih sudah chatting dengan Feisty, Kak ${name}! 🙏\n\nJika ada pertanyaan lain, silakan hubungi kami kembali atau ketik apa saja untuk memulai chat baru.\n\nFeisty siap membantu kapan saja! 💚\n\nKetik *apa saja* untuk memulai percakapan baru.`;
}

function msgBackToMenu(name) {
  return `↩️ *Kembali ke Menu*\n\nBaik Kak ${name}, kembali ke menu utama.\n\nSilakan pilih:\n1️⃣ *Order Menu* 🛒\n2️⃣ *Chat CS* 💬\n3️⃣ *Info Promo* 🎉`;
}

function msgTimeout(customer) {
  const msg = getBotMessage('timeout');
  if (msg) return replaceBotVars(msg, customer);
  return `⏰ *Sesi Habis*\n\nHalo Kak ${customer.name}!\n\nMaaf, sepertinya sudah ada yang bisa saya bantu? \n\nSesi chat Feisty berakhir setelah 15 menit tidak aktif.\n\nSilakan ketik *apa saja* untuk memulai chat baru dengan Feisty! 😊`;
}

function msgCSFallback(customer) {
  const msg = getBotMessage('cs_fallback');
  if (msg) return replaceBotVars(msg, customer);
  return `Halo Kak ${customer.name} 🙏\n\nMaaf, saya tidak memahami pertanyaan Kakak.\n\nSilakan:\n- Ketik *1* untuk melihat menu dan memesan\n- Ketik *0* untuk kembali ke menu utama\n- Hubungi admin langsung jika perlu: ${ADMIN_PHONE}\n\nTerima kasih! 😊`;
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
      
      // Only check customers in active states (not WAIT_NAME or TIMEOUT)
      if (state === STATE_ORDER || state === STATE_CS_CHAT) {
        if (lastActivity) {
          const lastTime = new Date(lastActivity).getTime();
          if (now - lastTime > BOT_TIMEOUT_MS) {
            const phone = data[i][0];
            const name = data[i][1] || 'Kak';
            
            // Reset to WAIT_NAME (initial state)
            updateCustomerState(phone, STATE_WAIT_NAME);
            
            logToSheet("Timeout reset to WAIT_NAME for:", phone);
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

// ==================================================
// DEBUG FUNCTION - Untuk Testing dan Diagnosa
// ==================================================
function debugAll() {
  const results = {
    timestamp: new Date().toISOString(),
    spreadsheet: null,
    sheets: {},
    config: null,
    menu: null,
    customers: null,
    orders: null,
    botMessages: null,
    knowledge: null,
    waTest: null,
    geminiTest: null,
    errors: []
  };
  
  try {
    // 1. Test Spreadsheet connection
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    results.spreadsheet = {
      name: ss.getName(),
      id: ss.getId(),
      url: ss.getUrl()
    };
    
    // 2. Check all sheets
    const sheetNames = ss.getSheets().map(s => s.getName());
    results.sheets.available = sheetNames;
    results.sheets.required = [MENU_SHEET, LOCATION_SHEET, SETTINGS_SHEET, CUSTOMERS_SHEET, ORDERS_SHEET, CS_KNOWLEDGE_SHEET, BOT_MESSAGES_SHEET];
    results.sheets.missing = results.sheets.required.filter(n => !sheetNames.includes(n));
    
    // 3. Test Get Config
    try {
      results.config = getConfig();
    } catch (e) {
      results.errors.push('Config: ' + e.toString());
    }
    
    // 4. Test Get Menu
    try {
      const menu = getMenu();
      results.menu = {
        count: Array.isArray(menu) ? menu.length : 0,
        error: menu.error || null
      };
    } catch (e) {
      results.errors.push('Menu: ' + e.toString());
    }
    
    // 5. Test Get Customers
    try {
      const customers = getAllCustomers();
      results.customers = {
        count: Array.isArray(customers) ? customers.length : 0
      };
    } catch (e) {
      results.errors.push('Customers: ' + e.toString());
    }
    
    // 6. Test Get Orders
    try {
      const orders = getOrders();
      results.orders = {
        count: Array.isArray(orders) ? orders.length : 0
      };
    } catch (e) {
      results.errors.push('Orders: ' + e.toString());
    }
    
    // 7. Test Get Bot Messages
    try {
      const msgs = getAllBotMessages();
      results.botMessages = {
        count: Array.isArray(msgs) ? msgs.length : 0,
        keys: Array.isArray(msgs) ? msgs.map(m => m.key) : []
      };
    } catch (e) {
      results.errors.push('Bot Messages: ' + e.toString());
    }
    
    // 8. Test Get Knowledge
    try {
      const kb = getAllCSKnowledge();
      results.knowledge = {
        count: Array.isArray(kb) ? kb.length : 0
      };
    } catch (e) {
      results.errors.push('Knowledge: ' + e.toString());
    }
    
    // 9. Test WA API (send to admin)
    try {
      const waResult = sendWA(ADMIN_PHONE, '🔧 *TEST DEBUG*\n\nBot Feisty sedang dalam mode testing.\n\nTimestamp: ' + results.timestamp);
      results.waTest = {
        success: waResult === 200,
        responseCode: waResult
      };
    } catch (e) {
      results.waTest = { success: false, error: e.toString() };
      results.errors.push('WA API: ' + e.toString());
    }
    
  } catch (err) {
    results.errors.push('Global: ' + err.toString());
  }
  
  return results;
}

// Debug: Test single function
function debugSpreadsheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets().map(s => s.getName());
    return {
      status: 'success',
      spreadsheet: ss.getName(),
      sheetCount: sheets.length,
      sheets: sheets
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: Test WhatsApp send
function debugSendWA(phone = ADMIN_PHONE, message = '🧪 Test WA dari Debug Function') {
  try {
    const result = sendWA(phone, message);
    return {
      status: 'success',
      to: phone,
      responseCode: result
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: Test Gemini AI
function debugGemini(question = 'Apa itu Feisty?') {
  try {
    const customer = { name: 'Tester', phone: ADMIN_PHONE };
    const response = getGeminiResponse(question, customer);
    return {
      status: 'success',
      question: question,
      response: response.substring(0, 500)
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: Test complete customer flow
function debugCustomerFlow(phone = '6281234567890') {
  try {
    const customer = getCustomer(phone);
    if (customer) {
      return {
        status: 'success',
        found: true,
        customer: customer
      };
    } else {
      return {
        status: 'success',
        found: false,
        message: 'Customer not found, will be created as new'
      };
    }
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: Test bot message template
function debugBotMessage(key = 'welcome') {
  try {
    const msg = getBotMessage(key);
    return {
      status: 'success',
      key: key,
      message: msg || '(not found, using default)',
      default: key === 'welcome' ? '👋 *Selamat Datang di Feisty*\n\nBoleh kami tahu *nama Kakak* untuk melanjutkan? 😊' : null
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: View all bot messages
function debugAllBotMessages() {
  try {
    const msgs = getAllBotMessages();
    if (!Array.isArray(msgs) || msgs.length === 0) {
      return { status: 'warning', message: 'No bot messages found. Run setupSheets() first.' };
    }
    return {
      status: 'success',
      count: msgs.length,
      messages: msgs.map(m => ({
        key: m.key,
        description: m.description,
        preview: (m.message || '').substring(0, 100)
      }))
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Debug: View knowledge base
function debugKnowledgeBase() {
  try {
    const kb = getAllCSKnowledge();
    if (!Array.isArray(kb) || kb.length === 0) {
      return { status: 'warning', message: 'No knowledge base found. Run setupSheets() first.' };
    }
    return {
      status: 'success',
      count: kb.length,
      knowledge: kb.map(k => ({
        kategori: k.kategori,
        keywords: k.keywords,
        jawaban: (k.jawaban || '').substring(0, 100)
      }))
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// Quick test - send test WA
function testWA() {
  const msg = '🧪 *TEST WHATSAPP*\n\n' +
    'Waktu: ' + new Date().toLocaleString('id-ID') + '\n' +
    'Device ID: ' + DEVICE_ID + '\n' +
    'API: ' + WA_API + '\n\n' +
    'Jika pesan ini diterima, konfigurasi WA sudah benar!';
  
  const result = sendWA(ADMIN_PHONE, msg);
  return 'Test WA sent. Response: ' + result;
}

// Quick test - view logs
function viewLogs(limit = 20) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sh = ss.getSheetByName('Logs');
    if (!sh) return 'Logs sheet not found';
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return 'No logs yet';
    
    const logs = data.slice(-limit);
    let output = '=== LAST ' + limit + ' LOGS ===\n\n';
    
    logs.forEach((row, i) => {
      if (i === 0) return; // Skip header
      output += row[0] + ' | ' + row[1] + ': ' + row[2].substring(0, 200) + '\n';
    });
    
    return output;
  } catch (err) {
    return 'Error: ' + err.toString();
  }
}

// Debug: Remove duplicate customers
function removeDuplicateCustomers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sh) return { status: 'error', message: 'Sheet not found' };
    
    const data = sh.getDataRange().getValues();
    if (data.length < 2) return { status: 'success', message: 'No data to clean' };
    
    const phoneMap = {};
    const toDelete = [];
    
    // Find duplicates (skip header row 0)
    for (let i = 1; i < data.length; i++) {
      const phone = normalizeNumber(String(data[i][0]));
      if (phone && phoneMap[phone]) {
        // Found duplicate, mark for deletion
        toDelete.push(i + 1); // +1 because sheet rows start at 1
      } else if (phone) {
        phoneMap[phone] = true;
      }
    }
    
    // Delete duplicates (from bottom to top to avoid index shift)
    toDelete.sort((a, b) => b - a).forEach(row => {
      sh.deleteRow(row);
    });
    
    return { 
      status: 'success', 
      message: 'Removed ' + toDelete.length + ' duplicate rows',
      remaining: Object.keys(phoneMap).length
    };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}
