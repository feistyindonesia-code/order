// ============================================
// FEISTY FOOD ORDER API (NO CORS VERSION)
// ============================================

const SPREADSHEET_ID = '1rGtVLbMwHrceTzJ9Nhu5H4ZTY2wAd_nXOc4LKPXFuLA';
const MENU_SHEET = 'Menu';
const LOCATION_SHEET = 'Lokasi';
const ORDER_SHEET = 'Orders';

/* ================= GET ================= */
function doGet(e) {
  const action = e?.parameter?.action || 'getMenu';
  const callback = e?.parameter?.callback; // JSONP support

  let result;

  if (action === 'getMenu') result = getMenu();
  else if (action === 'getLocation') result = getLocation();
  else result = { error: 'Invalid action' };

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================= POST ================= */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDER_SHEET);

    sh.appendRow([
      new Date(),
      data.nama || '',
      data.whatsapp || '',
      data.metode || '',
      JSON.stringify(data.items || []),
      data.total || 0
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================= MENU ================= */
function getMenu() {
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
}

/* ================= LOCATION ================= */
function getLocation() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOCATION_SHEET);
  const rows = sh.getDataRange().getValues();

  if (rows.length < 2) return {};

  return {
    nama_toko: rows[1][0],
    latitude: Number(rows[1][1]),
    longitude: Number(rows[1][2])
  };
}
