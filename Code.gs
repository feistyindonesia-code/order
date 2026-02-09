// ========================
// GOOGLE APPS SCRIPT - MAIN FILE
// ========================

// Sample menu data (replace with your actual data source like Google Sheets)
function getMenuData() {
  return [
    { id: 1, nama: 'Nasi Goreng Spesial', deskripsi: 'Nasi goreng dengan ayam suwir dan telur', harga: 25000, gambar: 'https://via.placeholder.com/300x200?text=Nasi+Goreng' },
    { id: 2, nama: 'Mie Goreng', deskripsi: 'Mie goreng dengan sayuran dan ayam', harga: 20000, gambar: 'https://via.placeholder.com/300x200?text=Mie+Goreng' },
    { id: 3, nama: 'Ayam Bakar', deskripsi: 'Ayam bakar dengan sambal dan lalapan', harga: 30000, gambar: 'https://via.placeholder.com/300x200?text=Ayam+Bakar' },
    { id: 4, nama: 'Es Teh Manis', deskripsi: 'Es teh manis segar', harga: 5000, gambar: 'https://via.placeholder.com/300x200?text=Es+Teh' },
    { id: 5, nama: 'Jus Jeruk', deskripsi: 'Jus jeruk segar tanpa gula', harga: 10000, gambar: 'https://via.placeholder.com/300x200?text=Jus+Jeruk' }
  ];
}

// ========================
// DOGET - HANDLE GET REQUESTS
// ========================
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'get_menu') {
    return createResponse({ menu: getMenuData() });
  }
  
  return createResponse({ error: 'Invalid action' });
}

// ========================
// DOPOST - HANDLE POST REQUESTS
// ========================
function doPost(e) {
  var postData = JSON.parse(e.postData.contents);
  var action = postData.action;
  
  if (action === 'create_qris') {
    return handleCreateQRIS(postData);
  } else if (action === 'save_order') {
    return handleSaveOrder(postData);
  }
  
  return createResponse({ error: 'Invalid action' });
}

// ========================
// HANDLER FUNCTIONS
// ========================
function handleCreateQRIS(postData) {
  // Implement your QRIS creation logic here
  // This is a sample response
  var qrisData = {
    status: 'success',
    trx_id: 'TRX-' + Date.now(),
    qris_url: 'https://via.placeholder.com/300x300?text=QRIS+Payment',
    amount: postData.total
  };
  
  return createResponse(qrisData);
}

function handleSaveOrder(postData) {
  // Log order to Google Sheet (example)
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Orders');
      sheet.appendRow(['Date', 'Nama', 'WhatsApp', 'Metode', 'Status', 'Ref ID', 'Total', 'Items']);
    }
    
    var date = new Date();
    var items = postData.items.map(function(item) {
      return item.nama + ' (' + item.qty + 'x)';
    }).join(', ');
    
    sheet.appendRow([
      date.toLocaleString('id-ID'),
      postData.nama,
      postData.whatsapp,
      postData.metode,
      postData.status,
      postData.ref_id,
      postData.total,
      items
    ]);
    
    return createResponse({ status: 'success', message: 'Order saved successfully' });
  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() });
  }
}

// ========================
// RESPONSE HELPER
// ========================
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// ========================
// OPTIONS HANDLER (FOR CORS PREFLIGHT)
// ========================
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}
