/**
 * SPARTA KOPINKA
 * Sistem Pencatatan & Redeem Piutang Anggota KOPINKA
 * Backend utama Google Apps Script.
 */

var SHEET_NAMES = {
  ANGGOTA: 'Anggota',
  PIUTANG: 'Piutang',
  PIUTANG_KARYAWAN: 'Piutang Karyawan Internal',
  TRANSAKSI: 'Transaksi',
  USERS: 'Users',
  PENGATURAN: 'Pengaturan',
  UNIT: 'Unit'
};

var APP_VERSION = '2.0.26';

var KOLOM = {
  ANGGOTA: ['NoAnggota', 'Nama', 'Alamat', 'NoHP', 'TanggalDaftar', 'Status'],
  PIUTANG: ['ID', 'NoAnggota', 'Tanggal', 'Uraian', 'Jumlah', 'JatuhTempo', 'Sisa', 'Status'],
  PIUTANG_KARYAWAN: ['ID', 'NIP', 'Tanggal', 'Uraian', 'Jumlah', 'JatuhTempo', 'Sisa', 'Status'],
  TRANSAKSI: ['ID', 'IDPiutang', 'NoAnggota', 'TanggalRedeem', 'JumlahRedeem', 'SisaSetelah', 'MetodeBayar', 'Keterangan', 'Jenis'],
  USERS: ['Username', 'Password', 'NamaToko', 'Role', 'KodeToko', 'Foto']
};

// Folder Google Drive untuk penyimpanan foto avatar user
var AVATAR_FOLDER_ID = '1hqHPBr0duB5Ffyrmy5K7mzcpzMZ8DWC';

// Folder Google Drive untuk foto bukti transaksi piutang karyawan
var BUKTI_PIUTANG_FOLDER_ID = '1hqHPBr0duB5Ffyrmy5K7mzcpzMZ8DWC';

/**
 * KONFIGURASI (ubah langsung di sini)
 */
// Voucher ANGGOTA (sheet "Voucher" di MyKopinka)
var VOUCHER_SPREADSHEET_ID = '1z47xmDUep-X37mOo3aa5LVt0-g0CouGFpKq0wKP626s';
var VOUCHER_SHEET_NAME = 'Voucher';

// Voucher KARYAWAN (sheet "Voucher" di HRIS)
var VOUCHER_KARYAWAN_SPREADSHEET_ID = '19vCyTDfnwI2ImQinHoPVJSI4IeN4nCJMAWM8E9f8v6Y';
var VOUCHER_KARYAWAN_SHEET_NAME = 'Voucher';

// Piutang KARYAWAN (sheet "Piutang" di HRIS)
var PIUTANG_KARYAWAN_SPREADSHEET_ID = '19vCyTDfnwI2ImQinHoPVJSI4IeN4nCJMAWM8E9f8v6Y';
var PIUTANG_KARYAWAN_SHEET_NAME = 'Piutang';

// Mutasi Voucher (sheet "Mutasi" di MyKopinka / HRIS, dua arah)
var MUTASI_ANGGOTA_SHEET_NAME = 'Mutasi';
var MUTASI_KARYAWAN_SHEET_NAME = 'Mutasi';

// Data master KARYAWAN (sheet "Data_Karyawan" di HRIS)
var DATA_KARYAWAN_SPREADSHEET_ID = '19vCyTDfnwI2ImQinHoPVJSI4IeN4nCJMAWM8E9f8v6Y';
var DATA_KARYAWAN_SHEET_NAME = 'Data_Karyawan';

// Data master ANGGOTA (sheet "Users" di MyKopinka, difilter Role = "Anggota")
var DATA_ANGGOTA_SPREADSHEET_ID = '1z47xmDUep-X37mOo3aa5LVt0-g0CouGFpKq0wKP626s';
var DATA_ANGGOTA_SHEET_NAME = 'Users';

// Kolom sheet Piutang Karyawan (HRIS)
var KOLOM_PIUTANG_KARYAWAN_EXT = ['Waktu', 'ID System', 'Nota Toko', 'Toko', 'Petugas', 'Nominal', 'NIP', 'Verifikasi', 'Status Notif'];

// Piutang ANGGOTA (sheet "Piutang" di MyKopinka)
var PIUTANG_ANGGOTA_SPREADSHEET_ID = '1z47xmDUep-X37mOo3aa5LVt0-g0CouGFpKq0wKP626s';
var PIUTANG_ANGGOTA_SHEET_NAME = 'Piutang';
var KOLOM_PIUTANG_ANGGOTA_EXT = ['Waktu', 'ID System', 'Nota Toko', 'Toko', 'Petugas', 'Nominal', 'No Anggota', 'Verifikasi', 'Status Notif'];

// Notifikasi broadcast (sheet "Notifikasi" di MyKopinka/HRIS, kolom seragam)
var NOTIF_ANGGOTA_SPREADSHEET_ID = '1z47xmDUep-X37mOo3aa5LVt0-g0CouGFpKq0wKP626s'; // MyKopinka
var NOTIF_ANGGOTA_SHEET_NAME = 'Notifikasi';
var NOTIF_KARYAWAN_SPREADSHEET_ID = '19vCyTDfnwI2ImQinHoPVJSI4IeN4nCJMAWM8E9f8v6Y'; // HRIS
var NOTIF_KARYAWAN_SHEET_NAME = 'Notifikasi';
var KOLOM_NOTIF = ['Waktu', 'Tipe', 'Target', 'Detail Target', 'Judul', 'Pesan', 'Status', 'Lampiran', 'Pengirim Toko', 'Pengirim User', 'Dibaca Oleh'];

// Notifikasi per toko (sheet "Notifikasi" di spreadsheet SPARTA, ditulis admin / broadcast target Toko)
var SPARTA_NOTIF_SHEET_NAME = 'Notifikasi';
var KOLOM_NOTIF_TOKO = ['Waktu', 'Tipe Target', 'Detail Target', 'Judul', 'Pesan', 'Status', 'Lampiran', 'Dibaca Oleh', 'Dibuat Oleh'];

// Sheet mirror di spreadsheet SPARTA (dua arah: MyKopinka/HRIS -> SPARTA)
var SPARTA_SHEET_NAMES = {
  VOUCHER_ANGGOTA: 'Voucher Anggota',
  VOUCHER_KARYAWAN: 'Voucher Karyawan',
  PIUTANG_ANGGOTA: 'Piutang Anggota',
  PIUTANG_KARYAWAN: 'Piutang Karyawan',
  MUTASI_ANGGOTA: 'Mutasi Anggota',
  MUTASI_KARYAWAN: 'Mutasi Karyawan',
  NOTIF_ANGGOTA: 'Notifikasi Anggota',
  NOTIF_KARYAWAN: 'Notifikasi Karyawan'
};

/** ------------------------------------------------------------------ */
/** MENU & SETUP                                                       */
/** ------------------------------------------------------------------ */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SPARTA KOPINKA')
    .addItem('Buka Aplikasi', 'bukaAplikasi')
    .addSeparator()
    .addItem('Sinkronisasi Data', 'sinkronisasiData')
    .addItem('Setup Database', 'setupDatabase')
    .addSeparator()
    .addItem('Tentang', 'tentang')
    .addToUi();
}

function onInstall() {
  onOpen();
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wajib = [SHEET_NAMES.PENGATURAN, SHEET_NAMES.USERS, SHEET_NAMES.UNIT].concat([
    SPARTA_SHEET_NAMES.PIUTANG_KARYAWAN, SPARTA_SHEET_NAMES.PIUTANG_ANGGOTA,
    SPARTA_SHEET_NAMES.MUTASI_KARYAWAN, SPARTA_SHEET_NAMES.MUTASI_ANGGOTA,
    SPARTA_SHEET_NAMES.VOUCHER_KARYAWAN, SPARTA_SHEET_NAMES.VOUCHER_ANGGOTA,
    SPARTA_SHEET_NAMES.NOTIF_KARYAWAN, SPARTA_SHEET_NAMES.NOTIF_ANGGOTA
  ]);
  var hilang = [];
  wajib.forEach(function (n) {
    if (!ss.getSheetByName(n)) hilang.push(n);
  });
  if (hilang.length) {
    var pesan = 'Sheet berikut TIDAK BOLEH dihapus/diubah nama pada dokumen SPARTA:\n\n- ' + hilang.join('\n- ') +
      '\n\nSPARTA tidak membuat sheet secara otomatis. Buat/rawat sheet sesuai struktur, lalu jalankan Sinkronisasi Data.';
    SpreadsheetApp.getUi().alert(pesan);
    return 'Sheet hilang: ' + hilang.join(', ');
  }

  seedAdminUser_();
  ensurePengaturanLayout_();
  ss.toast('Struktur sheet SPARTA KOPINKA sudah sesuai. Jalankan menu SPARTA KOPINKA > Sinkronisasi Data untuk menyalin data dari MyKopinka/HRIS ke sheet mirror.', 'Cek Struktur', 6);
  return 'Struktur sheet SPARTA KOPINKA sudah sesuai.';
}

function prepareSheet(ss, name, headers) {
  return function (header) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    setHeader_(sheet, headers);
  };
}

function setHeader_(sheet, headers) {
  if (!headers || !headers.length) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function migrateTransaksiJenis_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  if (!sheet || sheet.getLastRow() === 0) return;
  var headers = getLeaders_(sheet);
  if (headers.indexOf('Jenis') >= 0) return;
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue('Jenis').setFontWeight('bold');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var seen = {};
    getObjects_(getSheet_(SHEET_NAMES.ANGGOTA)).forEach(function (a) { seen[String(a.NoAnggota)] = true; });
    var idPiutangCol = headers.indexOf('IDPiutang') + 1;
    var noCol = headers.indexOf('NoAnggota') + 1;
    var maxCol = Math.max(idPiutangCol, noCol);
    var values = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();
    var jenis = values.map(function (row) {
      var idp = idPiutangCol > 0 ? String(row[idPiutangCol - 1] || '') : '';
      var no = noCol > 0 ? String(row[noCol - 1] || '') : '';
      if (idp.indexOf('VOUCHER') === 0 && no && !seen[no]) return ['Karyawan'];
      return ['Anggota'];
    });
    if (jenis.length) sheet.getRange(2, col, jenis.length, 1).setValues(jenis);
  }
  clearDataCache_();
}

function ensureTransaksiJenis_(sheet) {
  var headers = getLeaders_(sheet);
  if (headers.indexOf('Jenis') >= 0) return;
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Jenis').setFontWeight('bold');
}

function getSummarySheet_() {}

/** Pastikan sheet Pengaturan memakai layout [ID | Key | Value] bila masih kosong. */
function ensurePengaturanLayout_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PENGATURAN);
  if (!sheet) return;
  var lr = sheet.getLastRow();
  if (lr > 0) {
    try {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
      if (headers.indexOf('Key') > -1 && headers.indexOf('Value') > -1) return;
    } catch (e) {}
  }
  if (lr === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['ID', 'Key', 'Value']]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function tentang() {
  SpreadsheetApp.getUi().alert(
    'SPARTA KOPINKA v' + APP_VERSION + '\n\nSistem Pencatatan & Redeem Kredit Anggota KOPINKA.\n\nGunakan menu "Buka Aplikasi" untuk membuka dashboard.'
  );
}

function getProfile(token) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var username = String(u.Username || '');
  var namaToko = String(u.NamaToko || '');
  var foto = String(u.Foto || '');
  return {
    ok: true,
    username: username,
    name: namaToko || username || 'Akun',
    email: username,
    role: u.Role,
    NamaToko: namaToko,
    KodeToko: String(u.KodeToko || ''),
    photoUrl: foto || ''
  };
}

function doGet() {
  return serveHtml_('Index', 'SPARTA KOPINKA - Sistem Pencatatan & Redeem Kredit');
}

function bukaAplikasi() {
  var html = serveHtml_('Index', 'SPARTA KOPINKA - Pencatatan & Redeem Kredit')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'SPARTA KOPINKA');
}

/**
 * Menyusun HTML dari template dan menyimpannya di cache sehingga
 * halaman berikutnya disajikan lebih cepat (tanpa baca file template lagi).
 */
function servirHtmlCacheKey_(filename) {
  return 'sparta_html_' + APP_VERSION + '_' + filename;
}

function serveHtml_(filename, title) {
  var cacheKey = servirHtmlCacheKey_(filename);
  var cache = CacheService.getScriptCache();
  var content = null;
  try { content = cache.get(cacheKey); } catch (e) {}
  if (!content) {
    try {
      content = HtmlService.createHtmlOutputFromFile(filename).getContent();
      cache.put(cacheKey, content, 21600);
    } catch (e) {
      content = null;
    }
  }
  if (!content) {
    content = HtmlService.createHtmlOutputFromFile(filename).getContent();
  }
  return HtmlService.createHtmlOutput(content)
    .setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** ------------------------------------------------------------------ */
/** HELPERS                                                             */
/** ------------------------------------------------------------------ */

function getSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss;
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  return sheet;
}

function getTimeZone_() {
  var tz = getSpreadsheet_().getSpreadsheetTimeZone();
  return tz || 'Asia/Jakarta';
}

function todayStr_() {
  return Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd');
}

function bulanKey_(val) {
  if (val instanceof Date) return Utilities.formatDate(val, getTimeZone_(), 'yyyy-MM');
  var s = String(val || '').trim();
  var m = s.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m) return m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2]);
  return s.slice(0, 7);
}

function getRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  return values.filter(function (row) {
    return String(row[0]).trim() !== '';
  });
}

function getLeaders_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getObjects_(sheet) {
  var headers = getLeaders_(sheet);
  return getRows_(sheet).map(function (row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] === undefined ? '' : row[i];
    }
    return obj;
  });
}

function nextId_(sheet, column, prefix) {
  var colIndex = column + 1;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var data = sheet.getRange(2, colIndex, lastRow - 1).getValues();
  var maxNum = 0;
  data.forEach(function (r) {
    var m = String(r[0]).match(new RegExp(prefix + '-(\\d+)'));
    if (m) {
      var n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return prefix + '-' + pad_(maxNum + 1, 4);
}

function nextIdTanggal_(sheet, column, prefix, tanggalStr) {
  var colIndex = column + 1;
  var dayKey = '';
  var d = null;
  if (typeof tanggalStr === 'string') {
    var mtch = String(tanggalStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mtch) d = new Date(Number(mtch[1]), Number(mtch[2]) - 1, Number(mtch[3]));
  }
  if (!d || isNaN(d.getTime())) d = new Date();
  dayKey = Utilities.formatDate(d, getTimeZone_(), 'yy') + Utilities.formatDate(d, getTimeZone_(), 'MMdd');
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var re = new RegExp('^' + prefix + dayKey + '(\\d+)$');
  var maxNum = 0;
  if (lastRow > 1) {
    // Baris mutasi selalu ditambahkan di bawah secara kronologis, jadi
    // maksimum ID harian pasti ada di ekor sheet — scan 10 ribu baris terakhir.
    var scanStart = Math.max(2, lastRow - 9998);
    var data = sheet.getRange(scanStart, colIndex, lastRow - scanStart + 1).getValues();
    data.forEach(function (r) {
      var m = String(r[0]).match(re);
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
  }
  return prefix + dayKey + pad_(maxNum + 1, 4);
}

/** Generate ID redeem (RVP...) bertumpu pada kolom "ID System" sheet mirror Mutasi. */
function nextMutasiId_(kind, prefix, tanggalStr) {
  var sheet = getSpartaMirrorSheet_(kind, 'mutasi');
  if (!sheet) {
    var d = new Date();
    var mtch = String(tanggalStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mtch) d = new Date(Number(mtch[1]), Number(mtch[2]) - 1, Number(mtch[3]));
    var dayKey = Utilities.formatDate(d, getTimeZone_(), 'yy') + Utilities.formatDate(d, getTimeZone_(), 'MMdd');
    return prefix + dayKey + '0001';
  }
  var col = 0;
  if (sheet.getLastRow() > 0) {
    try {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        .map(function (h) { return String(h).trim(); });
      var i = headers.indexOf('ID System');
      if (i > -1) col = i;
    } catch (e) {}
  }
  return nextIdTanggal_(sheet, col, prefix, tanggalStr);
}

function pad_(num, size) {
  var s = '000000000' + num;
  return s.substr(-size);
}

function cleanNum_(val) {
  var n = Number(String(val).replace(/[^\d\-.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatIDR_(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
}

function appendBody_(sheet, row) {
  var headers = getLeaders_(sheet);
  var values = headers.map(function (h) {
    return row[h] === undefined ? '' : row[h];
  });
  sheet.appendRow(values);
}

function findRowIndex_(sheet, colName, value) {
  var headers = getLeaders_(sheet);
  var colIndex = headers.indexOf(colName) + 1;
  if (colIndex === 0) return -1;
  var rows = getRows_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][colIndex - 1]) === String(value)) {
      return i + 2;
    }
  }
  return -1;
}

function getErrorObj_(msg) {
  return { ok: false, message: msg };
}

/** ------------------------------------------------------------------ */
/** PAGINATION & SEARCH (diproses di backend)                          */
/** ------------------------------------------------------------------ */

function pageResult_(full, page, pageSize) {
  page = Math.max(parseInt(page, 10) || 1, 1);
  pageSize = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 500);
  var total = full.length;
  var pages = Math.max(Math.ceil(total / pageSize), 1);
  var start = (page - 1) * pageSize;
  return {
    ok: true,
    list: full.slice(start, start + pageSize),
    total: total,
    page: Math.min(page, pages),
    pageSize: pageSize,
    pages: pages
  };
}

function fieldsMatch_(obj, fields, q) {
  for (var i = 0; i < fields.length; i++) {
    if (String(obj[fields[i]] || '').toLowerCase().indexOf(q) >= 0) return true;
  }
  return false;
}

function sortBy_(arr, key, desc) {
  return arr.slice().sort(function (a, b) {
    var r = String(a[key] || '').localeCompare(String(b[key] || ''));
    return desc ? -r : r;
  });
}

/** ------------------------------------------------------------------ */
/** CACHE DATA SHEET (dibersihkan otomatis saat ada perubahan)         */
/** ------------------------------------------------------------------ */

var CACHE_DEF = {
  ANGGOTA: { key: 'sparta_d_anggota', ttl: 3600 },
  PIUTANG: { key: 'sparta_d_piutang', ttl: 3600 },
  PIUTANG_K: { key: 'sparta_d_piutangk', ttl: 3600 },
  TRX: { key: 'sparta_d_trx', ttl: 3600 },
  USERS: { key: 'sparta_d_users', ttl: 3600 }
};

var MEM_CACHE_ = {};

/** Catat waktu operasi (Logger) bila >= 100 ms — untuk diagnostik performa. */
function perf_(label, t0) {
  var ms = Date.now() - t0;
  if (ms >= 100) Logger.log('PERF [' + label + '] ' + ms + 'ms');
}

function getCacheRows_(def, fetchFn) {
  if (Object.prototype.hasOwnProperty.call(MEM_CACHE_, def.key)) return MEM_CACHE_[def.key];
  var hit = cacheGetBig_(def.key);
  if (hit) {
    try {
      MEM_CACHE_[def.key] = hit;
      return hit;
    } catch (e) {}
  }
  var data = fetchFn();
  MEM_CACHE_[def.key] = data;
  cachePutBig_(def.key, data, def.ttl);
  return data;
}

function clearDataCache_() {
  try {
    var keys = [CACHE_DEF.ANGGOTA.key, CACHE_DEF.PIUTANG.key, CACHE_DEF.PIUTANG_K.key, CACHE_DEF.TRX.key, CACHE_DEF.USERS.key, 'sparta_d_anggota_ext', 'piutanga_ext_' + PIUTANG_ANGGOTA_SPREADSHEET_ID + '_' + PIUTANG_ANGGOTA_SHEET_NAME];
    keys.forEach(function (k) { delete MEM_CACHE_[k]; cacheRemoveBig_(k); });
  } catch (e) {}
}

function getAnggotaCache_() { return getCacheRows_(CACHE_DEF.ANGGOTA, getAnggotaList); }
function getPiutangCache_() { return getCacheRows_(CACHE_DEF.PIUTANG, getPiutangList); }
function getTrxCache_() { return getCacheRows_(CACHE_DEF.TRX, getRedeemList); }

/**
 * Cache pendukung data besar yang TIDAK muat dalam satu nilai CacheService
 * (batas ~100 KB per nilai). Bila JSON melebihi CACHE_CHUNK_MAX, nilai dipecah
 * menjadi beberapa kunci cache "key#1..key#n" dengan meta singkat
 * "key = '#c<n>'" (di file, bila muat satu nilai, key berisi JSON penuh).
 * Semua operasi transparan; bila salah satu chunk hilang, miss => baca ulang.
 */
var CACHE_CHUNK_MAX = 50000;

function cachePutBig_(key, obj, ttl) {
  var _t0 = Date.now();
  try {
    var cache = CacheService.getScriptCache();
    var j = JSON.stringify(obj);
    if (!j) return;
    var t = ttl || 900;
    var old = cache.get(key);
    if (old && old.indexOf('#c') === 0) {
      var oldN = parseInt(old.substring(2), 10) || 0;
      for (var o = 1; o <= oldN; o++) cache.remove(key + '#' + o);
    }
    if (j.length <= CACHE_CHUNK_MAX) {
      cache.put(key, j, t);
      cache.remove(key + '#1');
      perf_('cachePut ' + key + ' (1)', _t0);
      return;
    }
    var chunks = Math.ceil(j.length / CACHE_CHUNK_MAX);
    var objAll = {};
    for (var i = 1; i <= chunks; i++) {
      objAll[key + '#' + i] = j.substr((i - 1) * CACHE_CHUNK_MAX, CACHE_CHUNK_MAX);
    }
    objAll[key] = '#c' + chunks;
    try {
      cache.putAll(objAll, t);
    } catch (e2) {
      for (var k in objAll) cache.put(k, objAll[k], t);
    }
    perf_('cachePut ' + key + ' (n=' + chunks + ')', _t0);
  } catch (e) {}
}

function cacheGetBig_(key) {
  var _t0 = Date.now();
  var cache = CacheService.getScriptCache();
  var v = null;
  try { v = cache.get(key); } catch (e) {}
  if (!v) return null;
  if (v.indexOf('#c') === 0) {
    var chunks = parseInt(v.substring(2), 10) || 0;
    var parts = [];
    var gotAll = false;
    if (chunks > 1) {
      try {
        var keys = [];
        for (var i = 1; i <= chunks; i++) keys.push(key + '#' + i);
        var all = cache.getAll(keys);
        for (var j = 1; j <= chunks; j++) {
          var pv = all[key + '#' + j];
          if (pv === null || pv === undefined) return null;
          parts.push(pv);
        }
        gotAll = true;
      } catch (e2) {}
    }
    if (!gotAll) {
      for (var k = 1; k <= chunks; k++) {
        var pv2 = cache.get(key + '#' + k);
        if (pv2 === null || pv2 === undefined) return null;
        parts.push(pv2);
      }
    }
    v = parts.join('');
  }
  try {
    var r = JSON.parse(v);
    perf_('cacheGet ' + key, _t0);
    return r;
  } catch (e) { return null; }
}

function cacheRemoveBig_(key) {
  try {
    var cache = CacheService.getScriptCache();
    var v = cache.get(key);
    var chunks = 0;
    if (v && v.indexOf('#c') === 0) chunks = parseInt(v.substring(2), 10) || 0;
    cache.remove(key);
    for (var i = 1; i <= Math.max(chunks, 1); i++) cache.remove(key + '#' + i);
  } catch (e) {}
}

/**
 * Perbaiki isi list pada cache secara in-place (tanpa baca ulang sheet).
 * Dipakai agar hasil transaksi langsung tercermin di cache, sehingga
 * load halaman berikutnya tidak perlu membaca spreadsheet dari nol.
 */
function patchCacheList_(key, ttl, patchFn) {
  var list = cacheGetBig_(key);
  if (!Array.isArray(list)) return;
  patchFn(list);
  cachePutBig_(key, list, ttl);
}

/**
 * Format kompak cache voucher: { h: [header...], v: [[nilai...]...] }.
 * ~45% lebih kecil dari array-objek sehingga getAll/putAll lebih cepat.
 * decode(skipEmpty=false) dipakai saat patch agar jumlah baris (dan Row)
 * tidak berubah; decode(skipEmpty=true) dipakai saat dibaca utk dipakai.
 */
function voucherCacheDecode_(hit, normalizeFn, skipEmpty) {
  if (Array.isArray(hit)) return hit; // format lama — biarkan seperti apa adanya
  if (!hit || !Array.isArray(hit.h) || !Array.isArray(hit.v)) return null;
  var nf = normalizeFn || function (o) { return o; };
  var out = [];
  hit.v.forEach(function (rowVals, i) {
    var obj = { Row: i + 2 };
    hit.h.forEach(function (h, c) {
      obj[h] = rowVals[c] === undefined || rowVals[c] === null ? '' : rowVals[c];
    });
    if (skipEmpty && String(obj[hit.h[0] || 'Kode']).trim() === '') return;
    out.push(nf(obj));
  });
  return out;
}

/** Patch cache voucher dengan format kompak (baris & Row tetap konsisten). */
function patchVoucherCacheCompact_(key, ttl, patchFn) {
  var hit = cacheGetBig_(key);
  if (!hit) return;
  if (Array.isArray(hit)) {
    var hdr0 = ['Row'];
    if (hit.length) {
      hit[0] || {};
      Object.keys(hit[0] || {}).forEach(function (h) { if (hdr0.indexOf(h) < 0) hdr0.push(h); });
    }
    patchFn(hit);
    var rowsO = hit.map(function (o) {
      return hdr0.map(function (h) { return (o[h] === undefined || o[h] === null) ? '' : o[h]; });
    });
    cachePutBig_(key, { h: hdr0, v: rowsO }, ttl);
    return;
  }
  if (!hit || !Array.isArray(hit.h) || !Array.isArray(hit.v)) return;
  var list = voucherCacheDecode_(hit, function (o) { return o; }, false);
  if (!list) return;
  patchFn(list);
  var hdr = hit.h;
  var rows2 = list.map(function (o) {
    return hdr.map(function (h) { return (o[h] === undefined || o[h] === null) ? '' : o[h]; });
  });
  cachePutBig_(key, { h: hdr, v: rows2 }, ttl);
}

/** ------------------------------------------------------------------ */
/** PENGATURAN                                                         */
/** ------------------------------------------------------------------ */

function getVoucherConfig_() {
  return {
    spreadsheetId: String(VOUCHER_SPREADSHEET_ID || '').trim(),
    sheetName: String(VOUCHER_SHEET_NAME || 'Voucher').trim()
  };
}

function getVoucherConfigStatus() {
  var c = getVoucherConfig_();
  return {
    spreadsheetId: c.spreadsheetId,
    sheetName: c.sheetName,
    terkonfigurasi: !!c.spreadsheetId
  };
}

/** ------------------------------------------------------------------ */
/** VOUCHER (sumber: MyKopinka BASE spreadsheet eksternal)             */
/** ------------------------------------------------------------------ */

function getVoucherList() {
  return readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
}

function getVoucherKaryawanConfig_() {
  return {
    spreadsheetId: String(VOUCHER_KARYAWAN_SPREADSHEET_ID || '').trim(),
    sheetName: String(VOUCHER_KARYAWAN_SHEET_NAME || 'Voucher').trim()
  };
}

function getVoucherKaryawanConfigStatus() {
  var c = getVoucherKaryawanConfig_();
  return {
    spreadsheetId: c.spreadsheetId,
    sheetName: c.sheetName,
    terkonfigurasi: !!c.spreadsheetId
  };
}

function getKaryawanVoucherList() {
  return readMirrorSheet_('karyawan', 'voucher', normalizeVoucherKaryawan_, 'voucher karyawan');
}

function readVoucherSheet_(spreadsheetId, sheetName, normalizeFn) {
  if (!spreadsheetId) {
    return { ok: false, message: 'Spreadsheet voucher belum dikonfigurasi di Code.gs.', list: [] };
  }
  var cacheKey = 'voucher_' + spreadsheetId + '_' + (sheetName || 'Voucher');
  var hit = cacheGetBig_(cacheKey);
  if (hit) {
    try {
      var hitList = voucherCacheDecode_(hit, normalizeFn, true);
      if (hitList) return { ok: true, message: 'Data voucher dimuat (cache) dari ' + sheetName + '.', list: hitList };
    } catch (e) {}
  }
  try {
    var useApiRead = sheetsApiProbe_();
    var headers;
    var rows;
    if (useApiRead) {
      var full = sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(sheetName)) + '?valueRenderOption=UNFORMATTED_VALUE');
      var m = (full && full.values) || [];
      if (!m.length || !m[0].length) return { ok: true, message: 'Sheet voucher kosong.', list: [] };
      headers = m[0].map(function (h) { return String(h).trim(); });
      rows = m.slice(1);
      headers.forEach(function (h, c) { if (isKodeTextCol_(h)) {
        var disp = getExtFormattedColumn_(spreadsheetId, sheetName, c + 1);
        rows.forEach(function (row, r) {
          if (disp[r] !== undefined && disp[r] !== null) row[c] = disp[r];
        });
      } });
    } else {
      var ss = SpreadsheetApp.openById(spreadsheetId);
      var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
      if (!sheet) {
        return { ok: false, message: 'Sheet "' + sheetName + '" tidak ditemukan pada spreadsheet voucher.', list: [] };
      }
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return { ok: true, message: 'Sheet voucher kosong.', list: [] };
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        .map(function (h) { return String(h).trim(); });
      rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
      // Baca nilai tampilan (getDisplayValues) HANYA untuk kolom kode (nol di
      // depan perlu dipertahankan). Menghindari render display seluruh kolom
      // sheet yang besar — penyebab lambat 30-50 detik saat cache dingin.
      headers.forEach(function (h, c) { if (isKodeTextCol_(h)) {
        var disp = sheet.getRange(2, c + 1, lastRow - 1, 1).getDisplayValues();
        rows.forEach(function (row, r) {
          if (disp[r] && disp[r][0] !== undefined && disp[r][0] !== null) row[c] = disp[r][0];
        });
      } });
    }
    var list = [];
    rows.forEach(function (row, i) {
      var obj = { Row: i + 2 };
      headers.forEach(function (h, c) {
        obj[h] = row[c] === undefined || row[c] === null ? '' : row[c];
      });
      if (String(obj[headers[0] || 'Kode']).trim() === '') return;
      list.push(normalizeFn(obj));
    });
    cachePutBig_(cacheKey, { h: headers, v: rows }, 43200);
    return { ok: true, message: 'Data voucher dimuat dari ' + sheetName + '.', list: list };
  } catch (e) {
    var m = String(e.message || '');
    if (m.indexOf('tidak memiliki akses') >= 0 || m.indexOf('cannot access') >= 0 || m.indexOf('not found') >= 0) {
      return { ok: false, message: 'Tidak bisa mengakses spreadsheet voucher. Pastikan akun ini diberi akses ke spreadsheet sumber voucher.', list: [] };
    }
    return { ok: false, message: 'Gagal memuat voucher: ' + e.message, list: [] };
  }
}

function getVoucherPage(data) {
  data = data || {};
  var res = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  if (!res.ok) return { ok: false, message: res.message, list: [], total: 0, page: 1, pageSize: 0, pages: 0 };
  var search = String(data.search || '').toLowerCase().trim();
  var status = String(data.status || 'semua');
  var filt = res.list.filter(function (v) {
    var sOk = status === 'semua' || String(v.Status) === status;
    var qOk = !search || fieldsMatch_(v, ['Kode', 'NoAnggota', 'Nama', 'Kelompok', 'Label'], search);
    return sOk && qOk;
  });
  filt = sortBy_(filt, 'Row', true);
  var r = pageResult_(filt, data.page, data.pageSize);
  r.message = res.message;
  return r;
}

function getKaryawanVoucherPage(data) {
  data = data || {};
  var res = readMirrorSheet_('karyawan', 'voucher', normalizeVoucherKaryawan_, 'voucher karyawan');
  if (!res.ok) return { ok: false, message: res.message, list: [], total: 0, page: 1, pageSize: 0, pages: 0 };
  var search = String(data.search || '').toLowerCase().trim();
  var status = String(data.status || 'semua');
  var filt = res.list.filter(function (v) {
    var sOk = status === 'semua' || String(v.Status) === status;
    var qOk = !search || fieldsMatch_(v, ['Kode', 'NIP', 'Nama', 'Unit', 'Label'], search);
    return sOk && qOk;
  });
  filt = sortBy_(filt, 'Row', true);
  var r = pageResult_(filt, data.page, data.pageSize);
  r.message = res.message;
  return r;
}

/**
 * Satu panggilan untuk seluruh kebutuhan tab voucher (data halaman, ringkasan,
 * dan konfigurasi) sehingga frontend cukup 1 round-trip, bukan 3.
 */
function getVoucherBundle(data) {
  data = data || {};
  var isKaryawan = data.kind === 'karyawan';
  var conf = isKaryawan ? getVoucherKaryawanConfig_() : getVoucherConfig_();
  var norm = isKaryawan ? normalizeVoucherKaryawan_ : normalizeVoucher_;
  var res = readMirrorSheet_(isKaryawan ? 'karyawan' : 'anggota', 'voucher', norm, isKaryawan ? 'voucher karyawan' : 'voucher anggota');
  var base = {
    ok: res.ok,
    message: res.message,
    config: { spreadsheetId: conf.spreadsheetId, sheetName: conf.sheetName },
    summary: voucherSummaryFromList_(res)
  };
  if (!res.ok) {
    base.list = [];
    base.total = 0;
    base.page = 1;
    base.pageSize = 0;
    base.pages = 0;
    return base;
  }
  res.list.forEach(function (v) {
    if (!String(v.TotalRedeem || '').trim()) v.TotalRedeem = String(v.Status) === 'Used' ? 1 : '';
  });
  var search = String(data.search || '').toLowerCase().trim();
  var status = String(data.status || 'semua');
  var fields = isKaryawan ? ['Kode', 'NIP', 'Nama', 'Unit', 'Label'] : ['Kode', 'NoAnggota', 'Nama', 'Kelompok', 'Label'];
  var filt = res.list.filter(function (v) {
    var sOk = status === 'semua' || String(v.Status) === status;
    var qOk = !search || fieldsMatch_(v, fields, search);
    return sOk && qOk;
  });
  var size = Math.max(parseInt(data.pageSize, 10) || 25, 1);
  var r = data.full
    ? { ok: true, list: filt, total: filt.length, page: 1, pages: Math.max(Math.ceil(filt.length / size), 1), pageSize: size }
    : pageResult_(filt, data.page, data.pageSize);
  r.message = res.message;
  r.config = base.config;
  r.summary = base.summary;
  return r;
}

function clearVoucherCache() {
  try {
    cacheRemoveBig_('voucher_' + getVoucherConfig_().spreadsheetId + '_' + getVoucherConfig_().sheetName);
    cacheRemoveBig_('voucher_' + getVoucherKaryawanConfig_().spreadsheetId + '_' + getVoucherKaryawanConfig_().sheetName);
    cacheRemoveBig_('voucher_' + getMutasiConfig_('anggota').spreadsheetId + '_' + getMutasiConfig_('anggota').sheetName);
    cacheRemoveBig_('voucher_' + getMutasiConfig_('karyawan').spreadsheetId + '_' + getMutasiConfig_('karyawan').sheetName);
    cacheRemoveBig_('vstats_' + VOUCHER_SPREADSHEET_ID);
  } catch (e) {}
  clearMirrorCache_('anggota', 'voucher');
  clearMirrorCache_('karyawan', 'voucher');
  clearMirrorCache_('anggota', 'mutasi');
  clearMirrorCache_('karyawan', 'mutasi');
  return { ok: true };
}

function clearAllCache() {
  clearDataCache_();
  clearDataKaryawanCache_();
  clearNotifikasiCacheAll_();
  return clearVoucherCache();
}

function voucherStatsMap_() {
  var key = 'vstats_' + VOUCHER_SPREADSHEET_ID;
  var hit = cacheGetBig_(key);
  if (hit) {
    try { return hit; } catch (e) {}
  }
  var res = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  var map = {};
  (res.list || []).forEach(function (v) {
    var keys = [];
    var no = String(v.NoAnggota || '').trim();
    if (no) keys.push(no, no.replace(/^A/i, ''));
    var nm = String(v.Nama || '').trim().toUpperCase();
    if (nm.length > 3) keys.push(nm);
    keys.forEach(function (k) {
      if (!k) return;
      map[k] = map[k] || { count: 0, total: 0 };
      map[k].count += 1;
      map[k].total += Number(v.Nilai || 0);
    });
  });
  cachePutBig_(key, map, 3600);
  return map;
}

function voucherSummaryFromList_(res) {
  var s = { total: 0, active: 0, used: 0, diblokir: 0, nilaiActive: 0, ok: !!res.ok, message: res.message || '' };
  if (!res.ok) return s;
  res.list.forEach(function (v) {
    s.total += 1;
    if (String(v.Status) === 'Active') { s.active += 1; s.nilaiActive += Number(v.Nilai || 0); }
    else if (String(v.Status) === 'Used') { s.used += 1; }
    else if (String(v.Status) === 'Diblokir') { s.diblokir += 1; }
  });
  return s;
}

function getVoucherSummary() {
  return voucherSummaryFromList_(readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota'));
}

function getKaryawanVoucherSummary() {
  return voucherSummaryFromList_(readMirrorSheet_('karyawan', 'voucher', normalizeVoucherKaryawan_, 'voucher karyawan'));
}

function getVouchersByAnggota(noAnggota, nama) {
  var res = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  if (!res.ok) return { ok: false, list: [], total: 0, count: 0, message: res.message };
  noAnggota = String(noAnggota || '');
  var nm = String(nama || '').toUpperCase();
  var list = res.list.filter(function (v) {
    var vNo = String(v.NoAnggota || '').trim();
    return vNo === noAnggota || vNo === noAnggota.replace(/^A/i, '') ||
      (nm.length > 3 && String(v.Nama || '').toUpperCase() === nm);
  });
  var total = list.reduce(function (s, v) { return s + Number(v.Nilai || 0); }, 0);
  return { ok: true, list: list, total: total, count: list.length };
}

function normalizeVoucher_(v) {
  return {
    Kode: normalizeKodeVoucher_(v.Kode),
    NoAnggota: formatCell_(v['No Anggota']),
    Nama: formatCell_(v.Nama),
    Label: formatCell_(v.Label),
    Kelompok: formatCell_(v.Kelompok),
    Nilai: cleanNum_(v.Nilai),
    Status: formatCell_(v.Status),
    ExpDate: formatDateCell_(v.ExpDate),
    AktifMulai: formatDateCell_(v['Aktif Mulai Tanggal']),
    TotalRedeem: formatCell_(v['Total Redeem']),
    Foto: formatCell_(v.Foto || v['Foto Anggota']),
    Row: Number(v.Row) || 0
  };
}

function normalizeVoucherKaryawan_(v) {
  return {
    Kode: normalizeKodeVoucher_(v.Kode),
    NIP: formatCell_(v.NIP),
    Nama: formatCell_(v.Nama),
    Label: formatCell_(v.Label),
    Unit: formatCell_(v.Unit || v.Bagian),
    Bagian: formatCell_(v.Bagian || v.Unit),
    Nilai: cleanNum_(v.Nilai),
    Status: formatCell_(v.Status),
    ExpDate: formatDateCell_(v.ExpDate),
    AktifMulai: formatDateCell_(v['Aktif Mulai Tanggal']),
    TotalRedeem: formatCell_(v['Total Redeem']),
    Foto: formatCell_(v.Foto || v['Foto Karyawan']),
    Row: Number(v.Row) || 0
  };
}

/** ------------------------------------------------------------------ */
/** MUTASI VOUCHER (log transaksi voucher, read-only)                  */
/** ------------------------------------------------------------------ */

function getMutasiConfig_(kind) {
  if (kind === 'karyawan') {
    return {
      spreadsheetId: String(VOUCHER_KARYAWAN_SPREADSHEET_ID || '').trim(),
      sheetName: String(MUTASI_KARYAWAN_SHEET_NAME || 'Mutasi').trim()
    };
  }
  return {
    spreadsheetId: String(VOUCHER_SPREADSHEET_ID || '').trim(),
    sheetName: String(MUTASI_ANGGOTA_SHEET_NAME || 'Mutasi').trim()
  };
}

/** Ambil sheet tujuan sinkron di dokumen SPARTA (suffix "Anggota"/"Karyawan"). */
function getSpartaMirrorSheet_(kind, table) {
  var key = null;
  if (table === 'voucher') key = kind === 'karyawan' ? SPARTA_SHEET_NAMES.VOUCHER_KARYAWAN : SPARTA_SHEET_NAMES.VOUCHER_ANGGOTA;
  else if (table === 'piutang') key = kind === 'karyawan' ? SPARTA_SHEET_NAMES.PIUTANG_KARYAWAN : SPARTA_SHEET_NAMES.PIUTANG_ANGGOTA;
  else if (table === 'mutasi') key = kind === 'karyawan' ? SPARTA_SHEET_NAMES.MUTASI_KARYAWAN : SPARTA_SHEET_NAMES.MUTASI_ANGGOTA;
  else if (table === 'notifikasi') key = kind === 'karyawan' ? SPARTA_SHEET_NAMES.NOTIF_KARYAWAN : SPARTA_SHEET_NAMES.NOTIF_ANGGOTA;
  if (!key) return null;
  try {
    var sheet = getSpreadsheet_().getSheetByName(key);
    return sheet || null;
  } catch (e) {
    return null;
  }
}

/** Tambahkan baris ke sheet mirror SPARTA mengikuti urutan kolom sheet tujuan. */
function mirrorAppendRow_(kind, table, headers, values) {
  var sheet = getSpartaMirrorSheet_(kind, table);
  if (!sheet) return;
  var dstHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  if (!dstHeaders.length) return;
  var row = [];
  dstHeaders.forEach(function (h) {
    var idx = headers.indexOf(h);
    row.push(idx > -1 ? (values[idx] === undefined ? '' : values[idx]) : '');
  });
  sheet.appendRow(row);
}

/**
 * Tambah banyak baris ke sheet mirror SPARTA dalam satu setValues.
 * Mengembalikan array objek baris mentah (dengan kunci header + Row) yang
 * baru ditulis, untuk keperluan patch cache mirror secara in-place.
 */
function mirrorAppendRows_(kind, table, headers, valuesList) {
  var sheet = getSpartaMirrorSheet_(kind, table);
  if (!sheet || !valuesList || !valuesList.length) return [];
  var dstHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  if (!dstHeaders.length) return [];
  var startRow = Math.max(sheet.getLastRow(), 1) + 1;
  var matrix = valuesList.map(function (values) {
    return dstHeaders.map(function (h) {
      var idx = headers.indexOf(h);
      return idx > -1 ? (values[idx] === undefined || values[idx] === null ? '' : values[idx]) : '';
    });
  });
  var sname = sheet.getName();
  var fbAppend = function () { sheet.getRange(startRow, 1, matrix.length, dstHeaders.length).setValues(matrix); };
  if (mirrorBatchActive_()) {
    mirrorBatchPush_({
      range: sname + '!A' + startRow + ':' + colLetter_(dstHeaders.length) + (startRow + matrix.length - 1),
      values: matrix
    }, fbAppend);
  } else {
    var localId = localSpreadsheetId_();
    if (localId && sheetsApiProbe_()) {
      try {
        Sheets.Spreadsheets.Values.append({ values: matrix }, localId, sname + '!A1', { valueInputOption: 'USER_ENTERED' });
      } catch (e) { fbAppend(); }
    } else {
      fbAppend();
    }
  }
  var out = [];
  for (var i = 0; i < matrix.length; i++) {
    var obj = { Row: startRow + i };
    dstHeaders.forEach(function (h, c) { obj[h] = matrix[i][c]; });
    out.push(obj);
  }
  return out;
}

/** ------------------------------------------------------------------ */
/** BATCH TULIS MIRROR LOKAL (satu workbook) dalam 1 panggilan REST.    */
/** ------------------------------------------------------------------ */
var _mirrorBatch_ = null;

function mirrorBatchBegin_() {
  _mirrorBatch_ = null;
  var localId = localSpreadsheetId_();
  if (localId && sheetsApiProbe_()) _mirrorBatch_ = { id: localId, data: [], fbs: [] };
  return _mirrorBatch_;
}

function mirrorBatchActive_() {
  return !!_mirrorBatch_;
}

function mirrorBatchPush_(entry, fallbackFn) {
  if (!_mirrorBatch_) return false;
  _mirrorBatch_.data.push(entry);
  if (typeof fallbackFn === 'function') {
    var dup = false;
    for (var i = 0; i < _mirrorBatch_.fbs.length; i++) {
      if (_mirrorBatch_.fbs[i].fn === fallbackFn) { dup = true; break; }
    }
    if (!dup) _mirrorBatch_.fbs.push({ fn: fallbackFn });
  }
  return true;
}

function mirrorBatchCommit_() {
  var b = _mirrorBatch_;
  _mirrorBatch_ = null;
  if (!b || !b.data.length) return;
  try {
    Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'USER_ENTERED', data: b.data }, b.id);
  } catch (e) {
    for (var i = 0; i < b.fbs.length; i++) {
      try { b.fbs[i].fn(); } catch (e2) {}
    }
  }
}

/** Perbarui satu kolom (by match) pada sheet mirror SPARTA. */
function mirrorSetCell_(kind, table, matchHeader, matchValue, setHeader, setValue) {
  var sheet = getSpartaMirrorSheet_(kind, table);
  if (!sheet) return;
  var dstHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  if (!dstHeaders.length) return;
  var matchCol = dstHeaders.indexOf(matchHeader) + 1;
  var setCol = dstHeaders.indexOf(setHeader) + 1;
  if (matchCol < 1 || setCol < 1) return;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var ids = lastRow > 1 ? sheet.getRange(2, matchCol, lastRow - 1, 1).getValues() : [];
  var kodeCol = isKodeTextCol_(matchHeader);
  for (var i = 0; i < ids.length; i++) {
    var cocok = kodeCol ? samakanKode_(ids[i][0], matchValue) : String(ids[i][0]).trim() === String(matchValue).trim();
    if (cocok) {
      sheet.getRange(i + 2, setCol).setValue(setValue);
      return;
    }
  }
}

/**
 * ---------- Akses spreadsheet eksternal via Sheets REST API ----------
 * (menghindari SpreadsheetApp.openById + getLastRow + header berulang yang
 * menumpuk jadi puluhan panggilan API mahal saat redeem / catat kredit.)
 */
function sheetRefA1_(sheetName) {
  var s = String(sheetName || '');
  return /^[a-zA-Z0-9_]+$/.test(s) ? s : "'" + s.replace(/'/g, "''") + "'";
}

function colLetter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || 'A';
}

/** Baca baris header (nilai) sheet eksternal — cache per eksekusi. */
var _extHdrCache_ = {};
function getSheetHeadersExt_(spreadsheetId, sheetName) {
  var ck = spreadsheetId + '::' + (sheetName || '');
  if (_extHdrCache_[ck]) return _extHdrCache_[ck];
  var resp = sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(sheetName) + '!1:1'));
  var vals = (resp && resp.values) || [];
  var hdr = (vals[0] || []).map(function (h) { return String(h == null ? '' : h).trim(); });
  _extHdrCache_[ck] = hdr;
  return hdr;
}

/** Baca satu kolom mulai dari startRow (default 2) hingga data terakhir. */
function getExtColumnValues_(spreadsheetId, sheetName, colNum, startRow) {
  var r = startRow || 2;
  var pref = sheetRefA1_(sheetName) + '!' + colLetter_(colNum);
  var resp = sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(pref + r + ':' + colLetter_(colNum)));
  var vals = (resp && resp.values) || [];
  var out = [];
  vals.forEach(function (row) { out.push(row[0] == null ? '' : row[0]); });
  return out;
}

/** Tulis status pada baris-baris tertentu (satu kolom) — 1 panggilan batch. */
function setStatusExtBatch_(spreadsheetId, sheetName, statusCol, rowValues) {
  var pref = sheetRefA1_(sheetName) + '!' + colLetter_(statusCol);
  var data = [];
  Object.keys(rowValues || {}).forEach(function (r) {
    var v = rowValues[r];
    if (v === undefined || v === null) return;
    data.push({ range: pref + Number(r), values: [[v]] });
  });
  if (!data.length) return;
  sheetsApiFetch_(spreadsheetId, '/values:batchUpdate', { valueInputOption: 'USER_ENTERED', data: data }, 'POST');
}

/** Tambah baris ke sheet eksternal (posisi setelah baris terakhir) — 1 panggilan. */
function appendRowsExt_(spreadsheetId, sheetName, valuesList) {
  if (!valuesList || !valuesList.length) return;
  sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(sheetName) + '!A1') + ':append?valueInputOption=USER_ENTERED', { values: valuesList }, 'POST');
}

/** Panggilan umum ke Google Sheets API v4 via Advanced Service (tidak
 *  butuh API Sheets di-enable manual di GCP project). */
function sheetsApiFetch_(spreadsheetId, path, payload) {
  var p = String(path || '');
  if (p.indexOf('/values:batchUpdate') === 0) {
    return Sheets.Spreadsheets.Values.batchUpdate({
      valueInputOption: (payload && payload.valueInputOption) || 'USER_ENTERED',
      data: (payload && payload.data) || []
    }, spreadsheetId);
  }
  var after = p.charAt(0) === '/' ? p.slice(1) : p;
  after = after.slice('values/'.length);
  var appendQ = after.indexOf(':append');
  var isAppend = appendQ >= 0;
  var q = after.indexOf('?');
  var rangeRaw = isAppend ? after.slice(0, appendQ) : after.slice(0, q >= 0 ? q : after.length);
  var range = decodeURIComponent(rangeRaw);
  var query = q >= 0 ? after.slice(q) : '';
  if (isAppend) {
    Sheets.Spreadsheets.Values.append({ values: (payload && payload.values) || [] }, spreadsheetId, range, {
      valueInputOption: (payload && payload.valueInputOption) || 'USER_ENTERED'
    });
    return {};
  }
  var vr = query.indexOf('valueRenderOption=UNFORMATTED_VALUE') >= 0 ? 'UNFORMATTED_VALUE'
    : query.indexOf('valueRenderOption=FORMATTED_VALUE') >= 0 ? 'FORMATTED_VALUE' : 'FORMATTED_VALUE';
  return Sheets.Spreadsheets.Values.get(spreadsheetId, range, { valueRenderOption: vr });
}

/** Deteksi izin Sheets REST API (script.external_request) sekali per eksekusi.
 *  Bila izin belum ada, jalur SpreadsheetApp dipakai sebagai pengganti otomatis. */
var _sheetsApiErr_ = '';
var _sheetsApiOk_ = null;
function sheetsApiProbe_() {
  if (_sheetsApiOk_ !== null) return _sheetsApiOk_;
  var v = getVoucherConfig_();
  _sheetsApiOk_ = false;
  _sheetsApiErr_ = 'no config';
  if (v.spreadsheetId) {
    try {
      sheetsApiFetch_(v.spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(v.sheetName || 'Voucher') + '!1:1'));
      _sheetsApiOk_ = true;
      _sheetsApiErr_ = '';
    } catch (e) {
      _sheetsApiErr_ = String(e.message || e).slice(0, 160);
    }
  }
  return _sheetsApiOk_;
}

/** Baca baris header via SpreadsheetApp (fallback bila izin API belum ada). */
function headersFromOpen_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sh = ss.getSheetByName(sheetName) || ss.getSheets()[0];
  if (!sh || sh.getLastColumn() < 1) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
}

/** Baca satu kolom dengan nilai tampilan (display) via Sheets API. */
function getExtFormattedColumn_(spreadsheetId, sheetName, colNum, startRow) {
  var r = startRow || 2;
  var letter = colLetter_(colNum);
  var resp = sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(sheetName) + '!' + letter + r + ':' + letter) + '?valueRenderOption=FORMATTED_VALUE');
  var vals = (resp && resp.values) || [];
  var out = [];
  vals.forEach(function (row) { out.push(row[0] == null ? '' : row[0]); });
  return out;
}

/** Hitung Nota Toko + ID System piutang dalam SATU pembacaan rentang (2 kolom).
 *  Menggantikan buatNotaTokoExt_ + nextIdPiutangExt_ yang masing-masing
 *  membaca header + satu kolom (3 RPC serial). */
function catatIdPiutangExt_(spreadsheetId, sheetName, kodeToko, dayKey, nota4, tgl, prefix) {
  var nota = nota4 ? String(kodeToko) + dayKey + pad_(cleanNum_(nota4), 4) : '';
  var dateKey = Utilities.formatDate(tgl, getTimeZone_(), 'yyMMdd');
  var urut = 0;
  var maxSeq = 0;
  try {
    var headers = getSheetHeadersExt_(spreadsheetId, sheetName);
      var cN = headers.indexOf('Nota Toko') + 1;
      var cI = headers.indexOf('ID System') + 1;
      if (cN > 0 || cI > 0) {
        var minCol = Math.min(cN || cI, cI || cN);
        var maxCol = Math.max(cN || cI, cI || cN);
        var resp = sheetsApiFetch_(spreadsheetId, '/values/' + encodeURIComponent(sheetRefA1_(sheetName) + '!' + colLetter_(minCol) + '2:' + colLetter_(maxCol)));
        var vals = (resp && resp.values) || [];
        var reN = cN > 0 ? new RegExp('^' + String(kodeToko) + dayKey + '(\\d{4})$') : null;
        var reI = cI > 0 ? new RegExp('^' + prefix + dateKey + '(\\d+)$') : null;
        vals.forEach(function (row) {
          if (reN && cN >= minCol && row[cN - minCol] !== undefined && row[cN - minCol] !== null) {
            var m = String(row[cN - minCol]).match(reN);
            if (m) { var n = parseInt(m[1], 10); if (n > urut) urut = n; }
          }
          if (reI && cI >= minCol && row[cI - minCol] !== undefined && row[cI - minCol] !== null) {
            var m2 = String(row[cI - minCol]).match(reI);
            if (m2) { var n2 = parseInt(m2[1], 10); if (n2 > maxSeq) maxSeq = n2; }
          }
        });
      }
    } catch (e) {}
  if (!nota) nota = String(kodeToko) + dayKey + pad_(urut + 1, 4);
  var idSystem = prefix + dateKey + pad_(maxSeq + 1, 4);
  return { notaLengkap: nota, idSystem: idSystem };
}

/** ID spreadsheet lokal (workbook main SPARTA yang terikat script). */
var _localSsId_ = null;
function localSpreadsheetId_() {
  if (_localSsId_) return _localSsId_;
  try { _localSsId_ = SpreadsheetApp.getActiveSpreadsheet().getId(); } catch (e) { _localSsId_ = ''; }
  return _localSsId_;
}

/** ------------------------------------------------------------------ */
/** MIRROR SPARTA (sheet kerja utama)                                   */

/**
 * Tulis nilai pada satu kolom untuk banyak baris; baris yang berurutan
 * digabung menjadi satu panggilan setValues (hemat round-trip API).
 * `rowValues` adalah objek: nomor baris absolut -> nilai.
 */
function setColBatch_(sheet, col, rowValues) {
  if (!sheet || col < 1) return;
  var writes = {};
  Object.keys(rowValues || {}).forEach(function (r) {
    var v = rowValues[r];
    if (v === undefined || v === null) return;
    writes[Number(r)] = v;
  });
  var rows = Object.keys(writes).map(Number).sort(function (a, b) { return a - b; });
  var run = [];
  var commit = function () {
    if (!run.length) return;
    var vals = run.map(function (r) { return [writes[r]]; });
    sheet.getRange(run[0], col, run.length, 1).setValues(vals);
    run = [];
  };
  for (var i = 0; i < rows.length; i++) {
    if (run.length && rows[i] !== run[run.length - 1] + 1) commit();
    run.push(rows[i]);
  }
  commit();
}

/**
 * Perbarui satu kolom (dengan pencocokan kode) pada sheet mirror SPARTA
 * secara batch: 1 scan kolom kunci + setValues per kelompok baris berurutan,
 * lalu patch cache mirror yang bersangkutan (tanpa baca ulang).
 */
function mirrorSetCellsBulk_(kind, table, matchHeader, setHeader, kodeList, setValue) {
  try {
    var sheet = getSpartaMirrorSheet_(kind, table);
    if (!sheet || !kodeList.length) return;
    var dstHeaders = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
      : [];
    if (!dstHeaders.length) return;
    var matchCol = dstHeaders.indexOf(matchHeader) + 1;
    var setCol = dstHeaders.indexOf(setHeader) + 1;
    if (matchCol < 1 || setCol < 1) return;
    var lastRow = Math.max(sheet.getLastRow(), 1);
    var isKode = isKodeTextCol_(matchHeader);
    var rowValues = {};
    var cached = cacheGetBig_(mirrorCacheKey_(kind, table));
    if (Array.isArray(cached) && cached.length) {
      // Bila cache mirror hangat, petakan kode -> baris dari cache sehingga
      // TIDAK perlu scan kolom kunci seluruh sheet mirror.
      var posByKey = {};
      cached.forEach(function (item) {
        var raw = String(item[matchHeader] === undefined || item[matchHeader] === null ? '' : item[matchHeader]).trim().replace(/^'/, '');
        var r = Number(item.Row) || 0;
        if (raw && r > 0) posByKey[isKode ? raw.replace(/^0+/, '') : raw] = r;
      });
      kodeList.forEach(function (kode) {
        var k = String(kode || '').trim().replace(/^'/, '');
        if (!k) return;
        var key = isKode ? k.replace(/^0+/, '') : k;
        if (posByKey[key] !== undefined) rowValues[posByKey[key]] = setValue;
      });
    }
    if (Object.keys(rowValues).length !== kodeList.length && lastRow > 1) {
      var ids = sheet.getRange(2, matchCol, lastRow - 1, 1).getValues();
      var rowByKey = {};
      for (var i = 0; i < ids.length; i++) {
        var raw2 = String(ids[i][0] === undefined || ids[i][0] === null ? '' : ids[i][0]).trim().replace(/^'/, '');
        if (!raw2) continue;
        rowByKey[isKode ? raw2.replace(/^0+/, '') : raw2] = i + 2;
      }
      rowValues = {};
      kodeList.forEach(function (kode) {
        var k = String(kode || '').trim().replace(/^'/, '');
        if (!k) return;
        var key = isKode ? k.replace(/^0+/, '') : k;
        if (rowByKey[key] !== undefined) rowValues[rowByKey[key]] = setValue;
      });
    }
    var sname = sheet.getName();
    if (mirrorBatchActive_()) {
      var _fbSet = function () { setColBatch_(sheet, setCol, rowValues); };
      Object.keys(rowValues).forEach(function (r2) {
        var v2 = rowValues[r2];
        if (v2 === undefined || v2 === null) return;
        mirrorBatchPush_({ range: sname + '!' + colLetter_(setCol) + Number(r2), values: [[v2]] }, _fbSet);
      });
    } else {
      var localId = localSpreadsheetId_();
      if (localId && sheetsApiProbe_()) {
        var dataB = [];
        Object.keys(rowValues).forEach(function (r2) {
          var v2 = rowValues[r2];
          if (v2 === undefined || v2 === null) return;
          dataB.push({ range: sname + '!' + colLetter_(setCol) + Number(r2), values: [[v2]] });
        });
        if (dataB.length) {
          try {
            Sheets.Spreadsheets.Values.batchUpdate({ valueInputOption: 'USER_ENTERED', data: dataB }, localId);
          } catch (e) {
            setColBatch_(sheet, setCol, rowValues);
          }
        }
      } else {
        setColBatch_(sheet, setCol, rowValues);
      }
    }
    patchMirrorCacheStatus_(kind, table, matchHeader, setHeader, kodeList, setValue);
  } catch (e) {}
}
function patchMirrorCacheStatus_(kind, table, matchHeader, setHeader, kodeList, setValue) {
  patchCacheList_(mirrorCacheKey_(kind, table), 43200, function (list) {
    var set = {};
    kodeList.forEach(function (k) { set[String(k || '').trim().replace(/^'/, '').replace(/^0+/, '')] = true; });
    list.forEach(function (item) {
      var code = String(item[matchHeader] || '').trim().replace(/^'/, '').replace(/^0+/, '');
      if (set[code]) item[setHeader] = setValue;
    });
  });
}

/** Nama kolom mirror untuk tabel (voucher/piutang/mutasi/notifikasi) per jenis. */
function spartaMirrorSheetName_(kind, table) {
  if (table === 'voucher') return kind === 'karyawan' ? SPARTA_SHEET_NAMES.VOUCHER_KARYAWAN : SPARTA_SHEET_NAMES.VOUCHER_ANGGOTA;
  if (table === 'piutang') return kind === 'karyawan' ? SPARTA_SHEET_NAMES.PIUTANG_KARYAWAN : SPARTA_SHEET_NAMES.PIUTANG_ANGGOTA;
  if (table === 'mutasi') return kind === 'karyawan' ? SPARTA_SHEET_NAMES.MUTASI_KARYAWAN : SPARTA_SHEET_NAMES.MUTASI_ANGGOTA;
  if (table === 'notifikasi') return kind === 'karyawan' ? SPARTA_SHEET_NAMES.NOTIF_KARYAWAN : SPARTA_SHEET_NAMES.NOTIF_ANGGOTA;
  return null;
}

function mirrorCacheKey_(kind, table) {
  return 'sparta_mirror_' + (spartaMirrorSheetName_(kind, table) || 'x');
}

function clearMirrorCache_(kind, table) {
  try {
    var key = mirrorCacheKey_(kind, table);
    delete MEM_CACHE_[key];
    cacheRemoveBig_(key);
  } catch (e) {}
}

/** Baca data DISPLAY dari sheet mirror SPARTA (bukan dari spreadsheet sumber). */
function readMirrorSheet_(kind, table, normalizeFn, label) {
  var sheetName = spartaMirrorSheetName_(kind, table);
  var cacheKey = mirrorCacheKey_(kind, table);
  var hit = cacheGetBig_(cacheKey);
  if (hit) {
    try { return { ok: true, message: 'Data ' + label + ' dimuat (cache) dari sheet "' + sheetName + '".', list: hit }; } catch (e) {}
  }
  if (!sheetName) return { ok: false, message: 'Jenis tabel tidak dikenal.', list: [] };
  var sheet = getSpartaMirrorSheet_(kind, table);
  if (!sheet) {
    return { ok: false, message: 'Sheet "' + sheetName + '" tidak ditemukan pada spreadsheet SPARTA. Jalankan Setup Database untuk cek struktur.', list: [] };
  }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: false, message: 'Sheet "' + sheetName + '" masih kosong. Jalankan menu SPARTA KOPINKA > Sinkronisasi Data untuk menyalin data dari MyKopinka/HRIS.', list: [] };
  }
  try {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var list = [];
    rows.forEach(function (row, i) {
      var obj = { Row: i + 2 };
      headers.forEach(function (h, c) {
        obj[h] = row[c] === undefined || row[c] === null ? '' : row[c];
      });
      if (String(obj[headers[0] || '']).trim() === '') return;
      var n = normalizeFn(obj);
      if (n) list.push(n);
    });
    cachePutBig_(cacheKey, list, 3600);
    return { ok: true, message: 'Data ' + label + ' dimuat dari sheet "' + sheetName + '".', list: list };
  } catch (e) {
    return { ok: false, message: 'Gagal memuat data ' + label + ': ' + e.message, list: [] };
  }
}

/** ------------------------------------------------------------------ */
/** SINKRONISASI DATA (MyKopinka/HRIS -> sheet mirror SPARTA)           */
/** ------------------------------------------------------------------ */

function sinkronisasiData() {
  var ui = SpreadsheetApp.getUi();
  var defs = [
    { kind: 'karyawan', table: 'piutang', conf: getPiutangKaryawanConfig_() },
    { kind: 'anggota', table: 'piutang', conf: getPiutangAnggotaConfig_() },
    { kind: 'karyawan', table: 'voucher', conf: getVoucherKaryawanConfig_() },
    { kind: 'anggota', table: 'voucher', conf: getVoucherConfig_() },
    { kind: 'karyawan', table: 'mutasi', conf: getMutasiConfig_('karyawan') },
    { kind: 'anggota', table: 'mutasi', conf: getMutasiConfig_('anggota') },
    { kind: 'karyawan', table: 'notifikasi', conf: getNotifikasiConfig_('karyawan') },
    { kind: 'anggota', table: 'notifikasi', conf: getNotifikasiConfig_('anggota') }
  ];
  var hasil = [];
  var gagal = [];
  defs.forEach(function (d) {
    var r = syncSatu_(d.kind, d.table, d.conf);
    hasil.push(r);
    if (!r.ok) gagal.push(r.table + ' (' + r.kind + '): ' + r.message);
  });
  clearAllCache();
  var ok = hasil.filter(function (h) { return h.ok; }).length;
  var jumlah = hasil.reduce(function (s, h) { return s + (h.rows || 0); }, 0);
  var pesan = 'Sinkronisasi selesai: ' + ok + '/' + hasil.length + ' tabel berhasil, ' + jumlah + ' baris disalin.';
  if (gagal.length) pesan += '\nGagal:\n- ' + gagal.join('\n- ');
  ui.alert('Sinkronisasi Data', pesan, ui.ButtonSet.OK);
  return { ok: ok === hasil.length, pesan: pesan, detail: hasil };
}

function syncSatu_(kind, table, conf) {
  var sheetName = spartaMirrorSheetName_(kind, table);
  if (!conf.spreadsheetId) {
    return { ok: false, kind: kind, table: table, rows: 0, message: 'Spreadsheet sumber belum dikonfigurasi di Code.gs.' };
  }
  var mirror = getSpartaMirrorSheet_(kind, table);
  if (!mirror) {
    return { ok: false, kind: kind, table: table, rows: 0, message: 'Sheet mirror "' + sheetName + '" tidak ditemukan.' };
  }
  try {
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var ext = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
    if (!ext) {
      return { ok: false, kind: kind, table: table, rows: 0, message: 'Sheet "' + conf.sheetName + '" tidak ditemukan di spreadsheet sumber.' };
    }
    var lr = ext.getLastRow();
    if (lr < 1) {
      mirror.clear();
      return { ok: true, kind: kind, table: table, rows: 0, message: 'Sumber kosong.' };
    }
    var lc = ext.getLastColumn();
    var head = ext.getRange(1, 1, 1, lc).getValues()[0];
    var data = lr > 1 ? ext.getRange(2, 1, lr - 1, lc).getValues() : [];
    var headNames = head.map(function (h) { return String(h).trim(); });
    if (data.length) {
      applyKodeDisplayValues_(headNames, data, ext.getRange(2, 1, lr - 1, lc).getDisplayValues());
    }
    mirror.clear();
    // Paksa kolom kode berformat teks agar nol di depan (mis. "03260001") tidak hilang.
    headNames.forEach(function (h, i) {
      if (isKodeTextCol_(h)) mirror.getRange(1, i + 1, lr, 1).setNumberFormat('@');
    });
    var all = [head].concat(data);
    mirror.getRange(1, 1, all.length, lc).setValues(all);
    mirror.setFrozenRows(1);
    return { ok: true, kind: kind, table: table, rows: data.length, message: data.length + ' baris disalin dari ' + conf.sheetName + ' ke "' + sheetName + '".' };
  } catch (e) {
    return { ok: false, kind: kind, table: table, rows: 0, message: String(e.message || e) };
  }
}

/** ------------------------------------------------------------------ */
/** NOTIFIKASI & BROADCAST (sheet "Notifikasi" MyKopinka & HRIS)       */
/** ------------------------------------------------------------------ */

function getNotifikasiConfig_(kind) {
  var isK = kind === 'karyawan';
  return {
    spreadsheetId: String((isK ? NOTIF_KARYAWAN_SPREADSHEET_ID : NOTIF_ANGGOTA_SPREADSHEET_ID) || '').trim(),
    sheetName: String((isK ? NOTIF_KARYAWAN_SHEET_NAME : NOTIF_ANGGOTA_SHEET_NAME) || 'Notifikasi').trim()
  };
}

function getNotifikasiConfigStatus() {
  var a = getNotifikasiConfig_('anggota');
  var k = getNotifikasiConfig_('karyawan');
  return {
    anggota: { spreadsheetId: a.spreadsheetId, sheetName: a.sheetName, terkonfigurasi: !!a.spreadsheetId },
    karyawan: { spreadsheetId: k.spreadsheetId, sheetName: k.sheetName, terkonfigurasi: !!k.spreadsheetId }
  };
}

function normalizeNotifikasi_(n) {
  return {
    Waktu: formatDateCell_(n['Waktu']),
    Tipe: formatCell_(n['Tipe']),
    Target: formatCell_(n['Target']),
    DetailTarget: formatCell_(n['Detail Target']),
    Judul: formatCell_(n['Judul']),
    Pesan: formatCell_(n['Pesan']),
    Status: formatCell_(n['Status']),
    Lampiran: formatCell_(n['Lampiran']),
    PengirimToko: formatCell_(n['Pengirim Toko']),
    PengirimUser: formatCell_(n['Pengirim User']),
    DibacaOleh: formatCell_(n['Dibaca Oleh']),
    Row: Number(n.Row) || 0
  };
}

/** Pastikan semua kolom yang diinginkan ADA di baris header sheet; kolom baru ditambahkan di akhir. */
function ensureHeaderCols_(sheet, desired) {
  if (!sheet) return;
  var lc = sheet.getLastColumn();
  var headers = lc > 0
    ? sheet.getRange(1, 1, 1, lc).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  var missing = desired.filter(function (h) { return headers.indexOf(h) < 0; });
  if (!missing.length) return;
  if (!headers.length) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var startCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, startCol, 1, missing.length).setValues([missing]).setFontWeight('bold');
}

function readNotifikasiExt_(kind) {
  var res = readMirrorSheet_(kind, 'notifikasi', normalizeNotifikasi_, 'notifikasi ' + kind);
  if (res.ok) res.list.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
  return res;
}

function normalizeNotifikasiToko_(n) {
  return {
    Waktu: formatDateCell_(n['Waktu']),
    Tipe: formatCell_(n['Tipe Target']),
    Target: formatCell_(n['Detail Target']),
    DetailTarget: formatCell_(n['Detail Target']),
    Judul: formatCell_(n['Judul']),
    Pesan: formatCell_(n['Pesan']),
    Status: formatCell_(n['Status']),
    Lampiran: formatCell_(n['Lampiran']),
    PengirimToko: '',
    PengirimUser: '',
    DibacaOleh: formatCell_(n['Dibaca Oleh']),
    DibuatOleh: formatCell_(n['Dibuat Oleh']),
    Kind: 'Toko',
    Row: Number(n.Row) || 0
  };
}

/** Baca notifikasi per toko langsung dari sheet "Notifikasi" di spreadsheet SPARTA. */
function readNotifikasiToko_() {
  var cacheKey = 'sparta_notif_toko';
  try {
    var hit = cacheGetBig_(cacheKey);
    if (hit) {
      try { return { ok: true, message: 'Data toko dimuat (cache) dari sheet "Notifikasi".', list: hit }; } catch (e) {}
    }
  } catch (e) {}
  var sheet = getSpreadsheet_().getSheetByName(SPARTA_NOTIF_SHEET_NAME);
  if (!sheet) return { ok: false, message: 'Sheet "Notifikasi" tidak ditemukan pada spreadsheet SPARTA.', list: [] };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, message: 'Sheet "Notifikasi" masih kosong.', list: [] };
  try {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var list = [];
    rows.forEach(function (row, i) {
      var obj = { Row: i + 2 };
      headers.forEach(function (h, c) { obj[h] = row[c] === undefined || row[c] === null ? '' : row[c]; });
      if (String(obj[headers[0] || '']).trim() === '') return;
      var n = normalizeNotifikasiToko_(obj);
      if (n) list.push(n);
    });
    list.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
    cachePutBig_(cacheKey, list, 3600);
    return { ok: true, message: 'Data toko dimuat dari sheet "Notifikasi".', list: list };
  } catch (e) {
    return { ok: false, message: 'Gagal memuat notifikasi toko: ' + e.message, list: [] };
  }
}

function clearNotifikasiTokoCache_() {
  try { cacheRemoveBig_('sparta_notif_toko'); } catch (e) {}
}

/** Apakah notifikasi per toko terlihat oleh sesi saat ini (Semua / toko ini / admin). */
function notifTokoVisibleFor_(n, u) {
  var tipe = String(n.Tipe || '').trim().toLowerCase();
  if (!tipe || tipe === 'semua') return true;
  if (String(u.Role || '').toLowerCase() === 'admin') return true;
  var nama = String(u.NamaToko || '').trim().toLowerCase();
  var kode = String(u.KodeToko || '').trim().toLowerCase();
  if (!nama && !kode) return false;
  return String(n.DetailTarget || '').split(';').some(function (p) {
    p = String(p || '').trim().toLowerCase();
    return !!p && (p === nama || p === kode);
  });
}

/** Notifikasi anggota/karyawan yang DITERIMA: hanya admin melihat semua (toko hanya menerima notifikasi kind toko). */
function notifPribadiVisibleFor_(n, u) {
  return String(u.Role || '').toLowerCase() === 'admin';
}

/** Notifikasi anggota/karyawan yang DIKIRIM oleh toko saat ini (untuk riwayat broadcast). */
function notifPribadiSentBy_(n, u) {
  var pt = String(n.PengirimToko || '').trim().toLowerCase();
  if (!pt) return false;
  var nama = String(u.NamaToko || '').trim().toLowerCase();
  return !!nama && pt === nama;
}

function resolveTokoRecipients_(tipe, target) {
  var stores = readUnitList_();
  if (tipe === 'semua') return stores;
  var wanted = String(target || '').split(';').map(function (p) { return String(p).trim().toLowerCase(); }).filter(function (p) { return p; });
  if (!wanted.length) return [];
  return stores.filter(function (s) {
    var nama = String(s.NamaToko || '').trim().toLowerCase();
    var kode = String(s.KodeToko || '').trim().toLowerCase();
    return wanted.indexOf(nama) > -1 || wanted.indexOf(kode) > -1;
  });
}

function clearNotifikasiCache_(kind) {
  clearMirrorCache_(kind, 'notifikasi');
  try {
    cacheRemoveBig_('sparta_notif_' + kind);
    cacheRemoveBig_('sparta_notif_opts_' + kind);
  } catch (e) {}
}

function clearNotifikasiCacheAll_() {
  clearNotifikasiCache_('anggota');
  clearNotifikasiCache_('karyawan');
}

/** Peta Nilai kelompok per No Anggota (dari voucher mirror + master anggota). */
function kelompokMapAnggota_() {
  var map = {};
  var res = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  (res.list || []).forEach(function (v) {
    var k = String(v.Kelompok || '').trim();
    var no = String(v.NoAnggota || '').trim();
    if (k && no) map[no] = k;
  });
  getAnggotaCache_().forEach(function (a) {
    var k = String(a.Kelompok || '').trim();
    var no = String(a.NoAnggota || '').trim();
    if (k && no) map[no] = k;
  });
  return map;
}

function kelompokList_() {
  var map = kelompokMapAnggota_();
  var out = {};
  Object.keys(map).forEach(function (no) { if (map[no]) out[map[no]] = true; });
  return Object.keys(out).sort();
}

function bagianList_() {
  var res = readDataKaryawan_();
  var out = {};
  (res && res.ok ? res.list : []).forEach(function (k) {
    var b = String(k.Bagian || '').trim();
    if (b) out[b] = true;
  });
  return Object.keys(out).sort();
}

function resolveAnggotaRecipients_(tipe, target) {
  var t = String(target || '').trim();
  if (tipe === 'semua') return getAnggotaCache_();
  if (tipe === 'noanggota') {
    return getAnggotaCache_().filter(function (a) { return String(a.NoAnggota).trim() === t; });
  }
  if (tipe === 'kelompok') {
    var km = kelompokMapAnggota_();
    return getAnggotaCache_().filter(function (a) {
      return String(km[String(a.NoAnggota)] || a.Kelompok || '').trim() === t;
    });
  }
  return [];
}

function resolveKaryawanRecipients_(tipe, target) {
  var res = readDataKaryawan_();
  var list = (res && res.ok ? res.list : []);
  var t = String(target || '').trim();
  if (tipe === 'semua') return list;
  if (tipe === 'nip') {
    return list.filter(function (k) {
      return String(k.NIPBaru).trim() === t || String(k.NIPLama).trim() === t;
    });
  }
  if (tipe === 'bagian') {
    return list.filter(function (k) { return String(k.Bagian).trim() === t; });
  }
  return [];
}

function tipeLabel_(t) {
  var map = { semua: 'Semua', bagian: 'Bagian', kelompok: 'Kelompok', nip: 'NIP', noanggota: 'No Anggota', toko: 'Toko' };
  return map[String(t || '').toLowerCase()] || String(t || '').trim() || 'Semua';
}

function residKey_(kind, r) {
  return kind === 'karyawan' ? String(r.NIPBaru || r.NIPLama || '') : String(r.NoAnggota || '');
}

/** Opsi target broadcast: anggota, karyawan, kelompok, bagian. */
function getNotifikasiOptions(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var anggota = getAnggotaCache_().map(function (a) {
    return { NoAnggota: String(a.NoAnggota || ''), Nama: String(a.Nama || ''), Kelompok: String(a.Kelompok || '') };
  });
  var listK = [];
  try {
    var resK = readDataKaryawan_();
    listK = (resK && resK.ok ? resK.list : []).map(function (k) {
      return { NIP: String(k.NIPBaru || k.NIPLama || ''), Nama: String(k.NamaLengkap || ''), Bagian: String(k.Bagian || '') };
    });
  } catch (e) {}
  return {
    ok: true,
    anggota: anggota,
    karyawan: listK,
    kelompok: kelompokList_(),
    bagian: bagianList_(),
    toko: readUnitList_().map(function (u2) { return { KodeToko: u2.KodeToko, NamaToko: u2.NamaToko }; })
  };
}

/** Broadcast notifikasi: tulis ke sheet "Notifikasi" (MyKopinka/HRIS) + mirror SPARTA. */
function sendNotifikasi(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var kind = String(data.kind || '').trim().toLowerCase();
  if (kind !== 'toko' && kind !== 'karyawan') kind = 'anggota';
  var tipe = String(data.tipe || '').trim();
  var judul = String(data.judul || '').trim();
  var pesan = String(data.pesan || '').trim();
  if (!tipe) return getErrorObj_('Pilih tipe target broadcast.');
  if (!judul) return getErrorObj_('Judul notifikasi wajib diisi.');
  if (!pesan) return getErrorObj_('Pesan notifikasi wajib diisi.');
  if (kind === 'toko' && tipe !== 'semua' && tipe !== 'toko') {
    return getErrorObj_('Jenis target tidak valid untuk broadcast toko.');
  }

  var recipients = kind === 'toko'
    ? resolveTokoRecipients_(tipe, data.target)
    : kind === 'karyawan'
      ? resolveKaryawanRecipients_(tipe, data.target)
      : resolveAnggotaRecipients_(tipe, data.target);
  if (!recipients.length) {
    return getErrorObj_('Tidak ada penerima yang cocok dengan target "' + (String(data.target || '').trim() || 'semua') + '".');
  }
  if (recipients.length > 5000) {
    return getErrorObj_('Terlalu banyak penerima (' + recipients.length + '). Broadcast dibatasi maksimal 5000 baris.');
  }

  if (kind === 'toko') return sendNotifikasiToko_(tipe, judul, pesan, recipients, String(u.Username || ''));

  var conf = getNotifikasiConfig_(kind);
  if (!conf.spreadsheetId) {
    return getErrorObj_('Spreadsheet notifikasi ' + kind + ' belum dikonfigurasi di Code.gs.');
  }

  var waktu = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
  var tipeLabel = tipeLabel_(tipe);
  var targetVal = String(data.target || '').trim() || 'Semua';

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var sheet = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
    if (!sheet) return getErrorObj_('Sheet "' + conf.sheetName + '" tidak ditemukan pada spreadsheet notifikasi.');
    ensureHeaderCols_(sheet, KOLOM_NOTIF);
    var headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
      : KOLOM_NOTIF.slice();

    var pengirimToko = String(u.NamaToko || '');
    var pengirimUser = String(u.Username || '');
    var allRows = recipients.map(function (r) {
      var detail = residKey_(kind, r);
      return headers.map(function (h) {
        if (h === 'Waktu') return waktu;
        if (h === 'Tipe') return tipeLabel;
        if (h === 'Target') return targetVal;
        if (h === 'Detail Target') return detail;
        if (h === 'Judul') return judul;
        if (h === 'Pesan') return pesan;
        if (h === 'Status') return 'Terkirim';
        if (h === 'Pengirim Toko') return pengirimToko;
        if (h === 'Pengirim User') return pengirimUser;
        return '';
      });
    });
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, allRows.length, headers.length).setValues(allRows);

    var mirror = getSpartaMirrorSheet_(kind, 'notifikasi');
    if (mirror) {
      ensureHeaderCols_(mirror, KOLOM_NOTIF);
      var mHeaders = mirror.getLastColumn() > 0
        ? mirror.getRange(1, 1, 1, mirror.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
        : KOLOM_NOTIF.slice();
      var mRows = allRows.map(function (rowVals) {
        return mHeaders.map(function (h) {
          var i = headers.indexOf(h);
          return i > -1 ? rowVals[i] : '';
        });
      });
      mirror.getRange(mirror.getLastRow() + 1, 1, mRows.length, mHeaders.length).setValues(mRows);
    }

    clearNotifikasiCache_(kind);
    return { ok: true, jumlah: recipients.length, pesan: recipients.length + ' notifikasi ' + kind + ' terkirim (target: ' + tipeLabel + ').' };
  } catch (e) {
    return getErrorObj_('Gagal mengirim broadcast: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

function notifWaktuKey_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, getTimeZone_(), 'yyyy-MM-dd');
  var s = String(v || '');
  var m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

/** Broadcast notifikasi per toko: tulis ke sheet "Notifikasi" pada spreadsheet SPARTA. */
function sendNotifikasiToko_(tipe, judul, pesan, stores, dibuatOleh) {
  var sheet = getSpreadsheet_().getSheetByName(SPARTA_NOTIF_SHEET_NAME);
  if (!sheet) return getErrorObj_('Sheet "Notifikasi" tidak ditemukan pada spreadsheet SPARTA.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureHeaderCols_(sheet, KOLOM_NOTIF_TOKO);
    var headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
      : KOLOM_NOTIF_TOKO.slice();
    var waktu = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');
    var tipeNilai = tipe === 'semua' ? 'Semua' : 'Toko';
    var allRows = stores.map(function (s) {
      var detail = tipe === 'semua' ? '' : String(s.NamaToko || s.KodeToko || '');
      return headers.map(function (h) {
        if (h === 'Waktu') return waktu;
        if (h === 'Tipe Target') return tipeNilai;
        if (h === 'Detail Target') return detail;
        if (h === 'Judul') return judul;
        if (h === 'Pesan') return pesan;
        if (h === 'Status') return 'Terkirim';
        if (h === 'Dibuat Oleh') return dibuatOleh || '';
        return '';
      });
    });
    if (allRows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, allRows.length, headers.length).setValues(allRows);
    }
    clearNotifikasiTokoCache_();
    return { ok: true, jumlah: stores.length, pesan: stores.length + ' notifikasi toko terkirim (target: ' + tipeNilai + ').' };
  } catch (e) {
    return getErrorObj_('Gagal mengirim broadcast: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

/** Daftar notifikasi (dari sheet mirror SPARTA) dengan filter & paginasi. */
function getNotifikasiList(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var kind = String(data.kind || 'semua');
  var search = String(data.search || '').toLowerCase().trim();
  var merge = [];
  var msg = '';
  [['anggota', 'Anggota'], ['karyawan', 'Karyawan']].forEach(function (pair) {
    if (kind !== 'semua' && kind !== pair[0]) return;
    var res = readNotifikasiExt_(pair[0]);
    if (msg.indexOf(res.message || '') < 0) msg = (msg ? msg + ' ' : '') + (res.message || '');
    (res.list || []).forEach(function (n) {
      n.Kind = pair[1];
      if (notifPribadiVisibleFor_(n, u)) merge.push(n);
    });
  });
  if (kind === 'semua' || kind === 'toko') {
    var resT = readNotifikasiToko_();
    if (msg.indexOf(resT.message || '') < 0) msg = (msg ? msg + ' ' : '') + (resT.message || '');
    (resT.list || []).forEach(function (n) {
      if (notifTokoVisibleFor_(n, u)) merge.push(n);
    });
  }
  if (search) {
    merge = merge.filter(function (n) {
      return fieldsMatch_(n, ['Judul', 'Pesan', 'Target', 'DetailTarget', 'Tipe'], search);
    });
  }
  merge.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
  var r = {};
  if (data.full) {
    r = { ok: true, list: merge, total: merge.length, page: 1, pages: Math.max(Math.ceil(merge.length / (parseInt(data.pageSize, 10) || 25)), 1), pageSize: parseInt(data.pageSize, 10) || 25 };
  } else {
    r = pageResult_(merge, data.page, data.pageSize);
  }
  r.message = msg;
  return r;
}

/** Riwayat broadcast yang DIKIRIM oleh sesi saat ini (toko: ke anggota/karyawan; admin: ke toko). */
function getBroadcastRiwayat(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var search = String(data.search || '').toLowerCase().trim();
  var merge = [];
  var msg = '';
  if (String(u.Role || '').toLowerCase() === 'admin') {
    var resT = readNotifikasiToko_();
    if (msg.indexOf(resT.message || '') < 0) msg = (msg ? msg + ' ' : '') + (resT.message || '');
    var aku = String(u.Username || '');
    (resT.list || []).forEach(function (n) {
      if (String(n.DibuatOleh || '').trim() === aku) merge.push(n);
    });
  } else {
    [['anggota', 'Anggota'], ['karyawan', 'Karyawan']].forEach(function (pair) {
      var res = readNotifikasiExt_(pair[0]);
      if (msg.indexOf(res.message || '') < 0) msg = (msg ? msg + ' ' : '') + (res.message || '');
      (res.list || []).forEach(function (n) {
        n.Kind = pair[1];
        if (notifPribadiSentBy_(n, u)) merge.push(n);
      });
    });
  }
  if (search) {
    merge = merge.filter(function (n) {
      return fieldsMatch_(n, ['Judul', 'Pesan', 'Target', 'DetailTarget', 'Tipe'], search);
    });
  }
  merge.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
  var size = parseInt(data.pageSize, 10) || 25;
  var r;
  if (data.full) {
    r = { ok: true, list: merge, total: merge.length, page: 1, pages: Math.max(Math.ceil(merge.length / size), 1), pageSize: size };
  } else {
    r = pageResult_(merge, data.page, size);
  }
  r.message = msg;
  return r;
}

/** Jumlah notifikasi belum dibaca untuk sesi saat ini (untuk badge navbar). */
function getNotifUnread(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  try {
    var merge = [];
    ['anggota', 'karyawan'].forEach(function (kind) {
      (readNotifikasiExt_(kind).list || []).forEach(function (n) {
        if (notifPribadiVisibleFor_(n, u)) merge.push(n);
      });
    });
    (readNotifikasiToko_().list || []).forEach(function (n) {
      if (notifTokoVisibleFor_(n, u)) merge.push(n);
    });
    var username = String(u.Username || '');
    var belum = merge.filter(function (n) {
      return String(n.DibacaOleh || '').split(';').map(function (s) { return String(s).trim(); }).indexOf(username) < 0;
    }).length;
    return { ok: true, belum: belum };
  } catch (e) {
    return getErrorObj_('Gagal memuat jumlah notifikasi: ' + e.message);
  }
}

function tandaiDibacaOnSheet_(sheet, tgl, judul, detail, username) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var waktuCol = headers.indexOf('Waktu') + 1;
  var judulCol = headers.indexOf('Judul') + 1;
  var detCol = headers.indexOf('Detail Target') + 1;
  var tarCol = headers.indexOf('Target') + 1;
  var readCol = headers.indexOf('Dibaca Oleh') + 1;
  if (judulCol < 1 || readCol < 1) return false;
  var maxCol = Math.max(waktuCol, judulCol, detCol, tarCol, 1);
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, maxCol).getValues() : [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var rowTgl = notifWaktuKey_(row[waktuCol - 1]);
    var rowJudul = String(row[judulCol - 1]);
    if (rowTgl !== tgl || rowJudul !== judul) continue;
    if (detail) {
      var rowDet = detCol > 0 ? String(row[detCol - 1]) : '';
      var rowTar = tarCol > 0 ? String(row[tarCol - 1]) : '';
      if (rowDet !== detail && rowTar !== detail) continue;
    }
    var r = i + 2;
    var cur = '';
    try { cur = sheet.getRange(r, readCol).getValue(); } catch (e) {}
    var list = String(cur || '').split(';').map(function (s) { return String(s).trim(); }).filter(function (s) { return s; });
    if (list.indexOf(username) < 0) {
      list.push(username);
      sheet.getRange(r, readCol).setValue(list.join('; '));
    }
    return true;
  }
  return false;
}

/** Tandai notifikasi telah dibaca (mirror SPARTA + sheet "Notifikasi" eksternal). */
function tandaiDibaca(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var kind = String(data.kind || '').trim().toLowerCase();
  if (kind !== 'toko' && kind !== 'karyawan') kind = 'anggota';
  var tgl = String(data.Waktu || '').slice(0, 10);
  var judul = String(data.Judul || '').trim();
  var detail = String(data.DetailTarget || data.Target || '').trim();
  if (!tgl || !judul) return getErrorObj_('Data notifikasi tidak valid.');
  var username = String(u.Username || '');
  if (kind === 'toko') {
    var ketemuT = false;
    try {
      var sheetT = getSpreadsheet_().getSheetByName(SPARTA_NOTIF_SHEET_NAME);
      if (sheetT && tandaiDibacaOnSheet_(sheetT, tgl, judul, detail, username)) ketemuT = true;
    } catch (e) {}
    clearNotifikasiTokoCache_();
    return { ok: true, pesan: ketemuT ? 'Notifikasi ditandai telah dibaca.' : 'Notifikasi tidak ditemukan di sheet.' };
  }
  var mirror = getSpartaMirrorSheet_(kind, 'notifikasi');
  var ketemu = false;
  if (mirror && tandaiDibacaOnSheet_(mirror, tgl, judul, detail, username)) ketemu = true;
  try {
    var conf = getNotifikasiConfig_(kind);
    if (conf.spreadsheetId) {
      var ss = SpreadsheetApp.openById(conf.spreadsheetId);
      var sheet = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
      if (sheet) tandaiDibacaOnSheet_(sheet, tgl, judul, detail, username);
    }
  } catch (e) {}
  clearNotifikasiCache_(kind);
  return { ok: true, pesan: ketemu ? 'Notifikasi ditandai telah dibaca.' : 'Notifikasi tidak ditemukan di sheet mirror.' };
}

/** ------------------------------------------------------------------ */
/** UNIT (referensi toko: filter & notif WA)                            */
/** ------------------------------------------------------------------ */

function readUnitList_() {
  var sheet = getSheet_(SHEET_NAMES.UNIT);
  if (!sheet) return [];
  var headers = getLeaders_(sheet);
  if (!headers.length) return [];
  var out = [];
  getRows_(sheet).forEach(function (row) {
    var obj = {};
    headers.forEach(function (h, c) { obj[h] = row[c] === undefined || row[c] === null ? '' : row[c]; });
    var kode = formatCell_(obj['Kode Toko']) || formatCell_(obj['KodeToko']);
    var nama = formatCell_(obj['NamaToko']);
    var wa = formatCell_(obj['No WA']) || formatCell_(obj['NoWA']) || formatCell_(obj['NoHP']);
    var alamat = formatCell_(obj['Alamat Toko']) || formatCell_(obj['Alamat']);
    if (!kode && !nama) return;
    out.push({ KodeToko: kode, NamaToko: nama, NoWA: wa, Alamat: alamat });
  });
  return out;
}

function getUnitOptions() {
  return readUnitList_().map(function (u) {
    return { KodeToko: u.KodeToko, NamaToko: u.NamaToko, NoWA: u.NoWA };
  });
}

function getUnitNoWAForToko_(toko, kodeToko) {
  var list = readUnitList_();
  for (var i = 0; i < list.length; i++) {
    if (kodeToko && list[i].KodeToko === String(kodeToko)) return list[i].NoWA;
  }
  for (var j = 0; j < list.length; j++) {
    if (toko && String(list[j].NamaToko).trim() === String(toko).trim()) return list[j].NoWA;
  }
  return '';
}

/**
 * Resolve nama toko untuk petugas yang aktif. Prioritas: NamaToko di akun user,
 * lalu cari lewat KodeToko di sheet Unit (agar nama toko tetap tersimpan walau
 * kolom NamaToko akun dikosongkan).
 */
function getTokoSesi_(u) {
  var nama = String(u && u.NamaToko || '').trim();
  if (nama) return nama;
  var kode = String(u && u.KodeToko || '').trim();
  if (!kode) return '';
  var units = readUnitList_();
  for (var i = 0; i < units.length; i++) {
    if (String(units[i].KodeToko).trim() === kode) return String(units[i].NamaToko || '').trim();
  }
  return '';
}

function normalizeMutasiAnggota_(m) {
  return {
    Waktu: formatDateTimeCell_(m['Waktu']),
    IDSystem: formatCell_(m['ID System']),
    NotaToko: formatCell_(m['Nota Toko']),
    KodeVoucher: normalizeKodeVoucher_(m['Kode Voucher']),
    Toko: formatCell_(m['Toko']),
    Petugas: formatCell_(m['Petugas']),
    Nilai: cleanNum_(m['Nilai']),
    Nama: formatCell_(m['Nama Anggota'] || m['Nama']),
    NoAnggota: formatCell_(m['No Anggota']),
    Kelompok: formatCell_(m['Kelompok']),
    Row: Number(m.Row) || 0
  };
}

function normalizeMutasiKaryawan_(m) {
  return {
    Waktu: formatDateTimeCell_(m['Waktu']),
    IDSystem: formatCell_(m['ID System']),
    NotaToko: formatCell_(m['Nota Toko']),
    KodeVoucher: normalizeKodeVoucher_(m['Kode Voucher']),
    Toko: formatCell_(m['Toko']),
    Petugas: formatCell_(m['Petugas']),
    Nilai: cleanNum_(m['Nilai']),
    Nama: formatCell_(m['Nama']),
    NIP: formatCell_(m['NIP']),
    Kelompok: formatCell_(m['Bagian'] || m['Unit'] || m['Kelompok']),
    Row: Number(m.Row) || 0
  };
}

function cocokToko_(u, p) {
  if (String(u.Role).toLowerCase() === 'admin') return true;
  var namaTok = String(u.NamaToko || '').trim();
  var kodeTok = String(u.KodeToko || '').trim();
  var rowToko = String((p && p.Toko) || '').trim();
  var nota = String((p && p.NotaToko) || '');
  if (namaTok && rowToko === namaTok) return true;
  if (kodeTok && nota.indexOf(kodeTok) === 0) return true;
  return false;
}

function getMutasiBundle(data) {
  data = data || {};
  var kind = data.kind === 'karyawan' ? 'karyawan' : 'anggota';
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  return mutasiCore_(kind, u, data);
}

function mutasiCore_(kind, u, data) {
  var norm = kind === 'karyawan' ? normalizeMutasiKaryawan_ : normalizeMutasiAnggota_;
  var res = readMirrorSheet_(kind, 'mutasi', norm, 'mutasi ' + kind);
  if (!res.ok) {
    return { ok: false, message: res.message, kind: kind, list: [], total: 0, page: 1, pages: 1, pageSize: 0, kelompok: [] };
  }
  var search = String(data.search || '').toLowerCase().trim();
  var kelompok = String(data.kelompok || 'semua');
  var bulan = String(data.bulan || '').trim();
  var fields = kind === 'karyawan'
    ? ['KodeVoucher', 'NotaToko', 'Toko', 'Petugas', 'Nama', 'NIP', 'Kelompok']
    : ['KodeVoucher', 'NotaToko', 'Toko', 'Petugas', 'Nama', 'NoAnggota', 'Kelompok'];
  var list = res.list.filter(function (m) {
    if (!cocokToko_(u, m)) return false;
    if (kelompok && kelompok !== 'semua' && String(m.Kelompok) !== kelompok) return false;
    if (bulan && bulanKey_(m.Waktu) !== bulan) return false;
    return !search || fieldsMatch_(m, fields, search);
  });
  list = sortBy_(list, 'Waktu', true);
  var opts = {};
  res.list.forEach(function (m) { var g = String(m.Kelompok || '').trim(); if (g) opts[g] = true; });
  var size = Math.max(parseInt(data.pageSize, 10) || 25, 1);
  var r = data.full
    ? { ok: true, list: list, total: list.length, page: 1, pages: Math.max(Math.ceil(list.length / size), 1), pageSize: size }
    : pageResult_(list, data.page, data.pageSize);
  r.kind = kind;
  r.message = res.message;
  r.kelompok = Object.keys(opts).sort();
  return r;
}

function formatDateTimeCell_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, getTimeZone_(), 'yyyy-MM-dd HH:mm');
  }
  return formatCell_(val);
}


function formatCell_(val) {
  return String(val === undefined || val === null ? '' : val).trim().replace(/^'/, '');
}

/** Prefix apostrof (marker teks) supaya angka nol di depan NIP / No Anggota tidak hilang di sheet. */
function kodeTeks_(val) {
  var s = String(val === undefined || val === null ? '' : val).trim();
  return s === '' ? '' : "'" + s;
}

/**
 * Kolom yang harus diperlakukan sebagai teks kode.
 * Dipakai agar angka nol di depan (mis. "03260001") tidak hilang saat dibaca
 * dengan getValues() yang hanya mengembalikan nilai mentah tanpa format.
 */
function isKodeTextCol_(header) {
  var h = String(header || '').toLowerCase().replace(/\s+/g, '');
  return h === 'kode' || h === 'kodevoucher' || h === 'id' || h === 'idsystem' ||
    h === 'idpiutang' || h === 'idtransaksi' || h === 'nota' || h === 'notatoko' ||
    h === 'nip' || h === 'nipbaru' || h === 'niplama' || h === 'noanggota' ||
    h === 'nopegawai' || h === 'notelp' || h === 'notelepon' || h === 'nohp' ||
    h === 'kodetoko' || h === 'username';
}

/**
 * Ganti nilai kolom kode dengan nilai tampilan (getDisplayValues) supaya
 * format nol di depan ikut tersalin. `headNames` adalah header ter-trim,
 * `data` nilai mentah, `displayData` nilai tampilan dengan ukuran sama.
 */
function applyKodeDisplayValues_(headNames, data, displayData) {
  if (!data || !data.length || !displayData || !displayData.length) return data;
  var idx = [];
  (headNames || []).forEach(function (h, i) { if (isKodeTextCol_(h)) idx.push(i); });
  if (!idx.length) return data;
  data.forEach(function (row, r) {
    var disp = displayData[r] || [];
    idx.forEach(function (c) {
      if (disp[c] !== undefined && disp[c] !== null) row[c] = disp[c];
    });
  });
  return data;
}

/** Panjang baku kode voucher, dipakai untuk memulihkan nol di depan yang hilang. */
var PANJANG_KODE_VOUCHER = 8;

/**
 * Pastikan kode voucher berbentuk teks dan nol di depan tetap ada.
 * Contoh: 3260001 -> "03260001". Kode non-angka atau yang sudah cukup
 * panjang dibiarkan apa adanya.
 */
function normalizeKodeVoucher_(val) {
  var s = formatCell_(val);
  if (s.charAt(0) === "'") s = s.substring(1).trim();
  if (/^\d+$/.test(s) && s.length < PANJANG_KODE_VOUCHER) {
    s = ('0000000000' + s).slice(-PANJANG_KODE_VOUCHER);
  }
  return s;
}

/** Bandingkan dua kode dengan mengabaikan nol di depan (untuk pencocokan baris). */
function samakanKode_(a, b) {
  var x = String(a === undefined || a === null ? '' : a).trim().replace(/^'/, '');
  var y = String(b === undefined || b === null ? '' : b).trim().replace(/^'/, '');
  return x === y || x.replace(/^0+/, '') === y.replace(/^0+/, '');
}

function formatDateCell_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, getTimeZone_(), 'yyyy-MM-dd');
  }
  var s = formatCell_(val);
  return s;
}

/** ------------------------------------------------------------------ */
/** ANGGOTA                                                            */
/** ------------------------------------------------------------------ */

function getAnggotaList() {
  var res = readDataAnggotaExt_();
  return (res && res.ok ? res.list : []).slice();
}

function getDataAnggotaConfig_() {
  return {
    spreadsheetId: String(DATA_ANGGOTA_SPREADSHEET_ID || '').trim(),
    sheetName: String(DATA_ANGGOTA_SHEET_NAME || 'Users').trim()
  };
}

function readDataAnggotaExt_() {
  var conf = getDataAnggotaConfig_();
  var cacheKey = 'sparta_d_anggota_ext';
  var hit = cacheGetBig_(cacheKey);
  if (hit) {
    try { return { ok: true, message: 'Data anggota dimuat (cache).', list: hit }; } catch (e) {}
  }
  if (!conf.spreadsheetId) return getErrorObj_('Spreadsheet data anggota belum dikonfigurasi di Code.gs.');
  try {
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var sheet = ss.getSheetByName(conf.sheetName);
    if (!sheet) return getErrorObj_('Sheet "' + conf.sheetName + '" tidak ditemukan pada spreadsheet data anggota.');
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: true, message: 'Sheet data anggota kosong.', list: [] };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var list = [];
    rows.forEach(function (row, i) {
      var raw = { Row: i + 2 };
      headers.forEach(function (h, c) { raw[h] = row[c] === undefined || row[c] === null ? '' : row[c]; });
      var a = normalizeDataAnggotaExt_(raw);
      if (a) list.push(a);
    });
    list.sort(function (a, b) { return String(a.NoAnggota).localeCompare(String(b.NoAnggota)); });
    cachePutBig_(cacheKey, list, 3600);
    return { ok: true, message: 'Data anggota dimuat dari ' + conf.sheetName + '.', list: list };
  } catch (e) {
    var m = String(e.message || '');
    if (m.indexOf('tidak memiliki akses') >= 0 || m.indexOf('cannot access') >= 0 || m.indexOf('not found') >= 0) {
      return getErrorObj_('Tidak bisa mengakses spreadsheet data anggota. Pastikan akun ini diberi akses ke spreadsheet sumber.');
    }
    return getErrorObj_('Gagal memuat data anggota: ' + e.message);
  }
}

function clearDataAnggotaExtCache_() {
  try { cacheRemoveBig_('sparta_d_anggota_ext'); } catch (e) {}
}

function normalizeDataAnggotaExt_(row) {
  var m = {};
  Object.keys(row).forEach(function (h) {
    var key = String(h).toLowerCase().replace(/[\s_\-.]+/g, '');
    m[key] = row[h];
  });
  if (formatCell_(m['role']).toLowerCase() !== 'anggota') return null;
  var noAnggota = formatCell_(m['noanggota']) || formatCell_(m['nip']);
  if (!noAnggota) return null;
  return {
    NoAnggota: noAnggota,
    Nama: formatCell_(m['namatoko']) || formatCell_(m['atasnamarekening']) || formatCell_(m['username']),
    Alamat: formatCell_(m['alamatdomisili']) || formatCell_(m['alamatktp']),
    NoHP: formatCell_(m['nohp']),
    TanggalDaftar: formatDateCell_(m['tanggalmasuk']),
    Status: normalizeStatusAnggota_(m['statusanggota'] || m['statuspegawai']),
    StatusPiutang: formatCell_(m['statuspiutang']),
    Kelompok: formatCell_(m['kelompok'] || m['grup'] || m['group']),
    Username: formatCell_(m['username']),
    NIP: formatCell_(m['nip']),
    Jabatan: formatCell_(m['jabatan']),
    Kota: formatCell_(m['kota']),
    Email: formatCell_(m['alamatemail']),
    JenisKelamin: formatCell_(m['jeniskelamin']),
    Row: Number(row.Row) || 0
  };
}

function normalizeStatusAnggota_(s) {
  var raw = String(s || '').trim();
  var v = raw.toLowerCase();
  if (!v) return 'Aktif';
  if (v.indexOf('diblo') > -1 || v.indexOf('block') > -1 || v.indexOf('suspend') > -1) return 'Diblokir';
  if (v.indexOf('non') > -1 || v.indexOf('tidak') > -1 || v.indexOf('keluar') > -1) return 'Nonaktif';
  if (v.indexOf('aktif') > -1) return 'Aktif';
  return raw;
}

function isAnggotaDiblokir_(noAnggota) {
  var a = findAnggota_(noAnggota);
  return !!(a && String(a.Status || '').toLowerCase().indexOf('diblo') > -1);
}

function findAnggota_(noAnggota) {
  var list = getAnggotaCache_();
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].NoAnggota) === String(noAnggota)) return list[i];
  }
  return null;
}

function addAnggota(data) {
  return getErrorObj_('Data anggota bersumber dari sheet Users (read-only). Perubahan dilakukan langsung di spreadsheet sumber.');
}

function updateAnggota(noAnggotaOrObj, dataOrUndef) {
  return getErrorObj_('Data anggota bersumber dari sheet Users (read-only). Perubahan dilakukan langsung di spreadsheet sumber.');
}

function toggleStatusAnggota(noAnggota) {
  return getErrorObj_('Data anggota bersumber dari sheet Users (read-only). Perubahan dilakukan langsung di spreadsheet sumber.');
}

function getAnggotaOptions() {
  return sortBy_(getAnggotaCache_().map(function (a) {
    return { NoAnggota: a.NoAnggota, Nama: a.Nama };
  }), 'NoAnggota');
}

function getAnggotaPage(data) {
  data = data || {};
  var search = String(data.search || '').toLowerCase().trim();
  var status = String(data.status || '').toLowerCase().trim();
  var res = readDataAnggotaExt_();
  if (!res || !res.ok) return { ok: false, message: (res && res.message) || 'Gagal memuat data anggota.', list: [], total: 0 };
  var stats = voucherStatsMap_();
  var list = res.list.filter(function (a) {
    if (search) {
      var hit = fieldsMatch_(a, ['NoAnggota', 'Nama', 'Alamat', 'NoHP', 'Username', 'NIP', 'Jabatan', 'Kota'], search);
      if (!hit) return false;
    }
    if (status && String(a.Status || '').toLowerCase() !== status) return false;
    return true;
  });
  list.forEach(function (a) {
    var k = String(a.NoAnggota);
    var k2 = k.replace(/^A/i, '');
    var nm = String(a.Nama || '').toUpperCase();
    var st = stats[k] || stats[k2] || (nm.length > 3 ? stats[nm] : null) || { count: 0, total: 0 };
    a.voucherCount = st.count;
    a.voucherTotal = st.total;
  });
  list = sortBy_(list, 'NoAnggota');
  if (data.full) return { ok: true, list: list, total: list.length };
  return pageResult_(list, data.page, data.pageSize);
}

/** ------------------------------------------------------------------ */
/** KARYAWAN (master, sheet "Data_Karyawan" spreadsheet eksternal)     */
/** ------------------------------------------------------------------ */

function getDataKaryawanConfig_() {
  return {
    spreadsheetId: String(DATA_KARYAWAN_SPREADSHEET_ID || '').trim(),
    sheetName: String(DATA_KARYAWAN_SHEET_NAME || 'Data_Karyawan').trim()
  };
}

function readDataKaryawan_() {
  var conf = getDataKaryawanConfig_();
  var cacheKey = 'sparta_d_karyawan@' + APP_VERSION;
  var hit = cacheGetBig_(cacheKey);
  if (hit) {
    try { return { ok: true, message: 'Data karyawan dimuat (cache).', list: hit }; } catch (e) {}
  }
  if (!conf.spreadsheetId) return getErrorObj_('Spreadsheet data karyawan belum dikonfigurasi di Code.gs.');
  try {
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var sheet = ss.getSheetByName(conf.sheetName);
    if (!sheet) return getErrorObj_('Sheet "' + conf.sheetName + '" tidak ditemukan pada spreadsheet data karyawan.');
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: true, message: 'Sheet data karyawan kosong.', list: [] };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var list = [];
    rows.forEach(function (row, i) {
      var raw = { Row: i + 2 };
      headers.forEach(function (h, c) { raw[h] = row[c] === undefined || row[c] === null ? '' : row[c]; });
      var k = normalizeDataKaryawan_(raw);
      if (String(k.NIPBaru || k.NIPLama || k.NamaLengkap || '').trim() !== '') list.push(k);
    });
    cachePutBig_(cacheKey, list, 3600);
    return { ok: true, message: 'Data karyawan dimuat dari ' + conf.sheetName + '.', list: list };
  } catch (e) {
    var m = String(e.message || '');
    if (m.indexOf('tidak memiliki akses') >= 0 || m.indexOf('cannot access') >= 0 || m.indexOf('not found') >= 0) {
      return getErrorObj_('Tidak bisa mengakses spreadsheet data karyawan. Pastikan akun ini diberi akses ke spreadsheet sumber.');
    }
    return getErrorObj_('Gagal memuat data karyawan: ' + e.message);
  }
}

function clearDataKaryawanCache_() {
  try {
    var cache = CacheService.getScriptCache();
    var all = cache.getAll();
    Object.keys(all).forEach(function (key) {
      if (String(key).indexOf('sparta_d_karyawan') === 0) cache.remove(String(key));
    });
  } catch (e) {}
}

function normalizeDataKaryawan_(row) {
  var m = {};
  Object.keys(row).forEach(function (h) {
    var key = String(h).toLowerCase().replace(/[\s_\-.\\/|]+/g, '');
    m[key] = row[h];
  });
  return {
    NIPLama: formatCell_(m['niplama']),
    NIPBaru: formatCell_(m['nipbaru']),
    NamaLengkap: formatCell_(m['namalengkap'] || m['nama']),
    Jabatan: formatCell_(m['jabatan']),
    Bagian: formatCell_(m['bagian']),
    Unit: formatCell_(m['unit']),
    Kategori: formatCell_(m['kategori']),
    Penempatan: formatCell_(m['penempatan']),
    TempatLahir: formatCell_(m['tempatlahir']),
    TanggalLahir: formatDateCell_(m['tanggallahir']),
    NIK: formatCell_(m['nik']),
    Alamat: formatCell_(m['alamat']),
    Email: formatCell_(m['email']),
    NoRekening: formatCell_(m['norekening']),
    Bank: formatCell_(m['bank']),
    DPLKNoRek: formatCell_(m['dplknorek']),
    DPLKMulai: formatDateCell_(m['dplkmulai']),
    StatusPegawai: formatCell_(m['statuspegawai']),
    StatusPiutang: formatCell_(m['statuspiutang']),
    MasukKerja: formatDateCell_(m['masukkerja']),
    TanggalPengangkatan: formatDateCell_(m['tanggalpengangkatan']),
    AkhirMasaBhakti: formatDateCell_(m['akhirmasabhakti']),
    AktifNonAktif: normalizeStatusAktif_(m['aktifnonaktif'] || m['aktif'] || m['statusaktif']),
    TanggalBerhenti: formatDateCell_(m['tanggalberhenti']),
    KeteranganBerhenti: formatCell_(m['keteranganberhenti']),
    Password: formatCell_(m['password']),
    NIPAtasan: formatCell_(m['nipatasan']),
    StatusKawin: formatCell_(m['statuskawin']),
    JumlahAnak: formatCell_(m['jumlahanak']),
    NoKartuKeluarga: formatCell_(m['nokartukeluarga']),
    NoWA: formatCell_(m['nowa']),
    LinkAja: formatCell_(m['linkaja']),
    TglTerakhirUpdate: formatCell_(m['tglterakhirupdate']),
    CutiTerpakai: formatCell_(m['cutiterpakai']),
    Avatar: formatCell_(m['avatar']),
    Row: Number(m['row']) || 0
  };
}

function normalizeStatusAktif_(v) {
  var s = String(v || '').toLowerCase().replace(/[\s_\-.\\/|]+/g, '');
  if (s === '') return '';
  if (s === 'aktif' || s === 'active' || (s.indexOf('non') < 0 && s.indexOf('tidak') < 0)) return 'Aktif';
  return 'Non Aktif';
}

function isKaryawanAktif_(k) {
  return String(k.AktifNonAktif || '').toLowerCase() === 'aktif';
}

function getKaryawanPage(data) {
  data = data || {};
  var search = String(data.search || '').toLowerCase().trim();
  var res = readDataKaryawan_();
  if (!res.ok) return res;
  var list = res.list.filter(function (k) {
    if (!search) return true;
    return fieldsMatch_(k, ['NIPBaru', 'NIPLama', 'NamaLengkap', 'Jabatan', 'Bagian', 'Unit', 'Kategori', 'Penempatan', 'StatusPegawai', 'NoWA', 'Email', 'Alamat'], search);
  });
  list = sortBy_(list, 'NamaLengkap');
  if (data.full) return { ok: true, list: list, total: list.length };
  return pageResult_(list, data.page, data.pageSize);
}

/** ------------------------------------------------------------------ */
/** PIUTANG                                                            */
/** ------------------------------------------------------------------ */

function getPiutangList() {
  var sheet = getSheet_(SHEET_NAMES.PIUTANG);
  if (!sheet) return [];
  return getObjects_(sheet);
}

function addPiutang(data) {
  try {
    var sheet = getSheet_(SHEET_NAMES.PIUTANG);
    if (!sheet) return getErrorObj_('Sheet "Piutang" legacy sudah tidak dipakai. Pencatatan kredit dilakukan lewat aplikasi (Catat Kredit).');
    var noAnggota = String(data.NoAnggota || '').trim();
    if (!findAnggota_(noAnggota)) return getErrorObj_('No Anggota tidak terdaftar.');

    var jumlah = cleanNum_(data.Jumlah);
    if (jumlah <= 0) return getErrorObj_('Jumlah kredit harus lebih dari 0.');

    var id = nextId_(sheet, 0, 'PIUT');
    var sisa = jumlah;
    appendBody_(sheet, {
      ID: id,
      NoAnggota: noAnggota,
      Tanggal: data.Tanggal || todayStr_(),
      Uraian: String(data.Uraian || '').trim(),
      Jumlah: jumlah,
      JatuhTempo: data.JatuhTempo || '',
      Sisa: sisa,
      Status: 'Belum Lunas'
    });
    clearDataCache_();
    return { ok: true, message: 'Kredit ' + id + ' tercatat.', ID: id };
  } catch (e) {
    return getErrorObj_('Gagal mencatat kredit: ' + e.message);
  }
}

function getPiutangHidup_() {
  return getPiutangCache_().filter(function (p) {
    return String(p.Status) !== 'Lunas';
  });
}

function getRedeemPiutangOptions() {
  return getPiutangHidup_().map(function (p) {
    return { ID: p.ID, NoAnggota: p.NoAnggota, Sisa: cleanNum_(p.Sisa), Jumlah: cleanNum_(p.Jumlah), Uraian: String(p.Uraian || '') };
  }).sort(function (a, b) { return String(a.NoAnggota).localeCompare(String(b.NoAnggota)); });
}

function getPiutangPage(data) {
  data = data || {};
  var search = String(data.search || '').toLowerCase().trim();
  var status = String(data.status || 'semua');
  var list = getPiutangCache_().filter(function (p) {
    var sOk = status === 'semua' || String(p.Status) === status;
    var qOk = !search || fieldsMatch_(p, ['ID', 'NoAnggota', 'Uraian'], search);
    return sOk && qOk;
  });
  list = sortBy_(list, 'Tanggal', true);
  if (data.full) return { ok: true, list: list, total: list.length };
  return pageResult_(list, data.page, data.pageSize);
}

/** ------------------------------------------------------------------ */
/** PIUTANG KARYAWAN (sumber: sheet "Piutang" eksternal)               */
/** ------------------------------------------------------------------ */

function getPiutangKaryawanConfig_() {
  return {
    spreadsheetId: String(PIUTANG_KARYAWAN_SPREADSHEET_ID || '').trim(),
    sheetName: String(PIUTANG_KARYAWAN_SHEET_NAME || 'Piutang').trim()
  };
}

function getPiutangKaryawanConfigStatus() {
  var c = getPiutangKaryawanConfig_();
  return {
    spreadsheetId: c.spreadsheetId,
    sheetName: c.sheetName,
    terkonfigurasi: !!c.spreadsheetId
  };
}

function readPiutangKaryawanExt_() {
  var res = readMirrorSheet_('karyawan', 'piutang', normalizePiutangKaryawan_, 'kredit karyawan');
  if (res.ok) res.list.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
  return res;
}

function clearPiutangKaryawanCache_() {
  try {
    var conf = getPiutangKaryawanConfig_();
    cacheRemoveBig_('piutangk_ext_' + conf.spreadsheetId + '_' + (conf.sheetName || 'Piutang'));
  } catch (e) {}
  clearMirrorCache_('karyawan', 'piutang');
}

/** Patch cache mirror piutang (tambah baris kredit baru yang baru dicatat). */
function patchPiutangCacheAppend_(kind, rawRow) {
  var norm = kind === 'karyawan' ? normalizePiutangKaryawan_ : normalizePiutangAnggota_;
  patchCacheList_(mirrorCacheKey_(kind, 'piutang'), 43200, function (list) {
    var n = norm(rawRow);
    if (n) list.unshift(n);
  });
}

/** Patch cache mirror piutang: isi kolom Verifikasi untuk ID yang bersangkutan. */
function patchPiutangVerifikasiCache_(kind, idSystem, link) {
  patchCacheList_(mirrorCacheKey_(kind, 'piutang'), 43200, function (list) {
    list.forEach(function (p) {
      if (String(p.IDSystem || '').trim() === String(idSystem || '').trim()) p.Verifikasi = link;
    });
  });
}

function normalizePiutangKaryawan_(p) {
  var nominal = cleanNum_(p.Nominal);
  return {
    Waktu: formatDateCell_(p.Waktu),
    IDSystem: formatCell_(p['ID System']),
    NotaToko: formatCell_(p['Nota Toko']),
    Toko: formatCell_(p.Toko),
    Petugas: formatCell_(p.Petugas),
    Nominal: nominal,
    NIP: formatCell_(p.NIP),
    Verifikasi: formatCell_(p.Verifikasi),
    StatusNotif: formatCell_(p['Status Notif']),
    Row: Number(p.Row) || 0
  };
}

function getPiutangKaryawanPage(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var res = readPiutangKaryawanExt_();
  if (!res.ok) return { ok: false, message: res.message, list: [], total: 0, page: 1, pageSize: 0, pages: 0 };
  var dk = readDataKaryawan_();
  var kmap = {};
  if (dk && dk.ok) dk.list.forEach(function (k) {
    var nm = String(k.NamaLengkap || '');
    if (String(k.NIPBaru)) kmap[String(k.NIPBaru)] = nm;
    if (String(k.NIPLama)) kmap[String(k.NIPLama)] = nm;
  });
  res.list.forEach(function (p) { p.Nama = kmap[String(p.NIP).trim()] || '(tidak terdaftar)'; });
  var search = String(data.search || '').toLowerCase().trim();
  var filter = String(data.filter || data.status || 'semua');
  var bulan = String(data.bulan || '').trim();
  var list = res.list.filter(function (p) {
    if (!cocokToko_(u, p)) return false;
    var fOk = filter === 'semua' || String(p.StatusNotif) === filter;
    var bOk = !bulan || bulanKey_(p.Waktu) === bulan;
    var qOk = !search || fieldsMatch_(p, ['IDSystem', 'NotaToko', 'Toko', 'Petugas', 'NIP', 'Nama'], search);
    return fOk && bOk && qOk;
  });
  if (data.full) {
    var fSizeK = Math.max(parseInt(data.pageSize, 10) || 25, 1);
    return { ok: true, list: list, total: list.length, page: 1, pages: Math.max(Math.ceil(list.length / fSizeK), 1), pageSize: fSizeK, message: res.message };
  }
  var r = pageResult_(list, data.page, data.pageSize);
  r.message = res.message;
  return r;
}

function catatPiutangKaryawanExt(data, internal) {
  var _tK0 = Date.now();
  data = data || {};
  var conf = getPiutangKaryawanConfig_();
  if (!conf.spreadsheetId) return getErrorObj_('Spreadsheet kredit karyawan belum dikonfigurasi.');
  var token = String(data.token || '').trim();
  if (!token) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var u = internal && data._u ? data._u : validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');

  var no = String(data.No || '').trim();
  if (!no) return getErrorObj_('Isi nomor NIP / No Anggota terlebih dahulu.');
  var nominal = cleanNum_(data.Nominal);
  if (nominal <= 0) return getErrorObj_('Nominal harus lebih dari 0.');

  var nota4 = String(data.Nota || '').replace(/\D/g, '').trim();
  if (!/^\d{4}$/.test(nota4)) return getErrorObj_('4 digit akhir nota wajib diisi (4 digit angka).');
  var kodeToko = String(u.KodeToko || '').trim();
  if (!kodeToko) return getErrorObj_('KodeToko belum diatur untuk akun ini. Hubungi admin untuk mengisi KodeToko pada sheet Pengguna.');
  perf_('catatK1 validasiSesi+cek', _tK0);

  var lock = null;
  if (!internal) {
    lock = LockService.getScriptLock();
    lock.waitLock(30000);
  }
  var notaLengkap = '';
  try {
    var now = new Date();
    var waktu = Utilities.formatDate(now, getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');

    var tglNota = now;
    var tglInput = String(data.Tanggal || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(tglInput)) {
      var parts = tglInput.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) tglNota = d;
    }
    var yy = Utilities.formatDate(tglNota, getTimeZone_(), 'yy');
    var mmdd = Utilities.formatDate(tglNota, getTimeZone_(), 'MMdd');

    var useApi = sheetsApiProbe_();
    var _shC = null;
    if (!useApi) {
      _shC = SpreadsheetApp.openById(conf.spreadsheetId).getSheetByName(conf.sheetName) || SpreadsheetApp.openById(conf.spreadsheetId).getSheets()[0];
      perf_('catatK2 openById', _tK0);
    }
    var idSystem;
    if (useApi) {
      var idg = catatIdPiutangExt_(conf.spreadsheetId, conf.sheetName, kodeToko, yy + mmdd, nota4, tglNota, 'PIU');
      notaLengkap = idg.notaLengkap;
      idSystem = idg.idSystem;
    } else {
      notaLengkap = buatNotaToko_(_shC, kodeToko, yy + mmdd, nota4);
      idSystem = nextIdPiutang_(_shC, tglNota, 'PIU');
    }
    perf_('catatK3 buatNota+nextId', _tK0);

    var row = {};
    KOLOM_PIUTANG_KARYAWAN_EXT.forEach(function (h) {
      if (h === 'Waktu') row[h] = waktu;
      else if (h === 'ID System') row[h] = idSystem;
      else if (h === 'Nota Toko') row[h] = notaLengkap;
      else if (h === 'Toko') row[h] = getTokoSesi_(u);
      else if (h === 'Petugas') row[h] = String(u.Username || '').trim();
      else if (h === 'Nominal') row[h] = nominal;
      else if (h === 'NIP') row[h] = kodeTeks_(no);
      else row[h] = '';
    });
    var valuesK = KOLOM_PIUTANG_KARYAWAN_EXT.map(function (h) { return row[h] === undefined ? '' : row[h]; });
    if (useApi) appendRowsExt_(conf.spreadsheetId, conf.sheetName, [valuesK]);
    else _shC.appendRow(valuesK);
    var mirK = mirrorAppendRows_('karyawan', 'piutang', KOLOM_PIUTANG_KARYAWAN_EXT, [valuesK]);
    if (mirK.length) patchPiutangCacheAppend_('karyawan', mirK[0]);
    perf_('catatK4 append+mirror+patch', _tK0);
    return { ok: true, message: 'Kredit karyawan ' + idSystem + ' tercatat. Nota: ' + notaLengkap, ID: idSystem, ms: Date.now() - _tK0 };
  } catch (e) {
    return getErrorObj_('Gagal mencatat kredit karyawan: ' + e.message);
  } finally {
    if (lock) lock.releaseLock();
  }
}

function buatNotaToko_(sheet, kodeToko, dayKey, nota4) {
  if (nota4) return String(kodeToko) + dayKey + pad_(cleanNum_(nota4), 4);
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var headers = lastRow > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); }) : [];
  var colIndex = headers.indexOf('Nota Toko') + 1;
  var urut = 0;
  if (colIndex > 0 && lastRow > 1) {
    var data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
    var re = new RegExp('^' + String(kodeToko) + dayKey + '(\\d{4})$');
    data.forEach(function (r) {
      var m = String(r[0]).match(re);
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > urut) urut = n;
      }
    });
  }
  return String(kodeToko) + dayKey + pad_(urut + 1, 4);
}

function nextIdPiutang_(sheet, tgl, prefix) {
  var dateKey = Utilities.formatDate(tgl, getTimeZone_(), 'yyMMdd');
  var headers = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  var colIndex = headers.indexOf('ID System') + 1;
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var maxSeq = 0;
  if (colIndex > 0 && lastRow > 1) {
    // Baris piutang selalu ditambahkan di bawah secara kronologis, jadi
    // maksimum ID harian pasti ada di ekor sheet — scan 10 ribu baris terakhir.
    var scanStart = Math.max(2, lastRow - 9998);
    var data = sheet.getRange(scanStart, colIndex, lastRow - scanStart + 1).getValues();
    var re = new RegExp('^' + prefix + dateKey + '(\\d+)$');
    data.forEach(function (r) {
      var m = String(r[0]).match(re);
      if (m) {
        var n = parseInt(m[1], 10);
        if (n > maxSeq) maxSeq = n;
      }
    });
  }
  return prefix + dateKey + pad_(maxSeq + 1, 4);
}

/** Upload foto bukti dan isi kolom Verifikasi dengan link foto */
function uploadBuktiPiutangKaryawan(data) {
  data = data || {};
  var token = String(data.token || '').trim();
  if (!token) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  var base64 = String(data.base64 || '');
  if (base64.indexOf('base64,') < 0) return getErrorObj_('Data foto tidak valid.');
  try {
    var conf = getPiutangKaryawanConfig_();
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var sheet = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
    if (!sheet) return getErrorObj_('Sheet "' + conf.sheetName + '" tidak ditemukan.');
    var headers = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
      : [];
    var idCol = headers.indexOf('ID System') + 1;
    if (idCol < 1) return getErrorObj_('Kolom "ID System" tidak ditemukan.');
    var lastRow = Math.max(sheet.getLastRow(), 1);
    var dataIds = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < dataIds.length; i++) {
      if (String(dataIds[i][0]).trim() === idSystem) { rowIndex = i + 2; break; }
    }
    if (rowIndex < 2) return getErrorObj_('Kredit karyawan tidak ditemukan.');

    var file = simpanFotoBukti_(base64, 'bukti_' + idSystem);
    var link = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800';
    var vCol = headers.indexOf('Verifikasi') + 1;
    if (vCol >= 1) sheet.getRange(rowIndex, vCol).setValue(link);
    mirrorSetCell_('karyawan', 'piutang', 'ID System', idSystem, 'Verifikasi', link);
    patchPiutangVerifikasiCache_('karyawan', idSystem, link);
    return { ok: true, message: 'Bukti foto tersimpan.', link: link };
  } catch (e) {
    return getErrorObj_('Gagal menyimpan bukti foto: ' + e.message);
  }
}

function simpanFotoBukti_(base64, nama) {
  var parts = base64.split(',');
  var mime = /^data:(image\/[a-z+]+);/.exec(parts[0]);
  if (!mime) throw new Error('Format foto harus berupa image (JPG/PNG).');
  var bytes = Utilities.base64Decode(parts[1]);
  var folder = DriveApp.getFolderById(BUKTI_PIUTANG_FOLDER_ID);
  var blob = Utilities.newBlob(bytes, mime[1], nama + '_' + new Date().getTime() + '.png');
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file;
}

/** Set kolom Status Notif menjadi "Terkirim" */
function kirimNotifPiutangKaryawan(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  try {
    setStatusNotif_('karyawan', idSystem);
    return { ok: true, message: 'Status notifikasi WA untuk ' + idSystem + ' diubah menjadi Terkirim.' };
  } catch (e) {
    return getErrorObj_('Gagal mengirim notifikasi: ' + e.message);
  }
}

/** ------------------------------------------------------------------ */
/** PIUTANG ANGGOTA (sumber: sheet "Piutang" eksternal)                 */
/** ------------------------------------------------------------------ */

function getPiutangAnggotaConfig_() {
  return {
    spreadsheetId: String(PIUTANG_ANGGOTA_SPREADSHEET_ID || '').trim(),
    sheetName: String(PIUTANG_ANGGOTA_SHEET_NAME || 'Piutang').trim()
  };
}

function getPiutangAnggotaConfigStatus() {
  var c = getPiutangAnggotaConfig_();
  return { spreadsheetId: c.spreadsheetId, sheetName: c.sheetName, configured: !!c.spreadsheetId };
}

function readPiutangAnggotaExt_() {
  var res = readMirrorSheet_('anggota', 'piutang', normalizePiutangAnggota_, 'kredit anggota');
  if (res.ok) res.list.sort(function (a, b) { return String(b.Waktu).localeCompare(String(a.Waktu)); });
  return res;
}

function clearPiutangAnggotaCache_() {
  try {
    var conf = getPiutangAnggotaConfig_();
    cacheRemoveBig_('piutanga_ext_' + conf.spreadsheetId + '_' + (conf.sheetName || 'Piutang'));
  } catch (e) {}
  clearMirrorCache_('anggota', 'piutang');
}

function normalizePiutangAnggota_(p) {
  return {
    Waktu: formatDateCell_(p.Waktu),
    IDSystem: formatCell_(p['ID System']),
    NotaToko: formatCell_(p['Nota Toko']),
    Toko: formatCell_(p.Toko),
    Petugas: formatCell_(p.Petugas),
    Nominal: cleanNum_(p.Nominal),
    NoAnggota: formatCell_(p['No Anggota']),
    Verifikasi: formatCell_(p.Verifikasi),
    StatusNotif: formatCell_(p['Status Notif']),
    Row: Number(p.Row) || 0
  };
}

function getPiutangAnggotaPage(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var res = readPiutangAnggotaExt_();
  if (!res.ok) return { ok: false, message: res.message, list: [], total: 0, page: 1, pageSize: 0, pages: 0 };
  var da = readDataAnggotaExt_();
  var amap = {};
  if (da && da.ok) da.list.forEach(function (a) { if (String(a.NoAnggota)) amap[String(a.NoAnggota)] = a.Nama; });
  res.list.forEach(function (p) { p.Nama = amap[String(p.NoAnggota)] || '(tidak terdaftar)'; });
  var search = String(data.search || '').toLowerCase().trim();
  var filter = String(data.filter || data.status || 'semua');
  var bulan = String(data.bulan || '').trim();
  var list = res.list.filter(function (p) {
    if (!cocokToko_(u, p)) return false;
    var fOk = filter === 'semua' || String(p.StatusNotif) === filter;
    var bOk = !bulan || bulanKey_(p.Waktu) === bulan;
    var qOk = !search || fieldsMatch_(p, ['IDSystem', 'NotaToko', 'Toko', 'Petugas', 'NoAnggota', 'Nama'], search);
    return fOk && bOk && qOk;
  });
  list = sortBy_(list, 'Waktu', true);
  if (data.full) {
    var fSizeP = Math.max(parseInt(data.pageSize, 10) || 25, 1);
    return { ok: true, list: list, total: list.length, page: 1, pages: Math.max(Math.ceil(list.length / fSizeP), 1), pageSize: fSizeP, message: res.message };
  }
  var r = pageResult_(list, data.page, data.pageSize);
  r.message = res.message;
  return r;
}

function catatPiutangAnggotaExt(data, internal) {
  var _tA0 = Date.now();
  data = data || {};
  var conf = getPiutangAnggotaConfig_();
  if (!conf.spreadsheetId) return getErrorObj_('Spreadsheet kredit anggota belum dikonfigurasi.');
  var token = String(data.token || '').trim();
  if (!token) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var u = internal && data._u ? data._u : validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');

  var no = String(data.No || '').trim();
  if (!no) return getErrorObj_('Isi nomor No Anggota terlebih dahulu.');
  if (isAnggotaDiblokir_(no)) {
    return getErrorObj_('Status anggota ' + no + ' Diblokir. Transaksi kredit diblokir, hanya voucher yang boleh diredeem.');
  }
  var nominal = cleanNum_(data.Nominal);
  if (nominal <= 0) return getErrorObj_('Nominal harus lebih dari 0.');

  var nota4 = String(data.Nota || '').replace(/\D/g, '').trim();
  if (!/^\d{4}$/.test(nota4)) return getErrorObj_('4 digit akhir nota wajib diisi (4 digit angka).');
  var kodeToko = String(u.KodeToko || '').trim();
  if (!kodeToko) return getErrorObj_('KodeToko belum diatur untuk akun ini. Hubungi admin untuk mengisi KodeToko pada sheet Pengguna.');
  perf_('catatA1 validasiSesi+cek', _tA0);

  var lock = null;
  if (!internal) {
    lock = LockService.getScriptLock();
    lock.waitLock(30000);
  }
  var notaLengkap = '';
  try {
    var now = new Date();
    var waktu = Utilities.formatDate(now, getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');

    var tglNota = now;
    var tglInput = String(data.Tanggal || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(tglInput)) {
      var parts = tglInput.split('-');
      var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) tglNota = d;
    }
    var yy = Utilities.formatDate(tglNota, getTimeZone_(), 'yy');
    var mmdd = Utilities.formatDate(tglNota, getTimeZone_(), 'MMdd');

    var useApi = sheetsApiProbe_();
    var _shC = null;
    if (!useApi) {
      _shC = SpreadsheetApp.openById(conf.spreadsheetId).getSheetByName(conf.sheetName) || SpreadsheetApp.openById(conf.spreadsheetId).getSheets()[0];
      perf_('catatA2 openById', _tA0);
    }
    var idSystem;
    if (useApi) {
      var idg = catatIdPiutangExt_(conf.spreadsheetId, conf.sheetName, kodeToko, yy + mmdd, nota4, tglNota, 'PIU');
      notaLengkap = idg.notaLengkap;
      idSystem = idg.idSystem;
    } else {
      notaLengkap = buatNotaToko_(_shC, kodeToko, yy + mmdd, nota4);
      idSystem = nextIdPiutang_(_shC, tglNota, 'PIU');
    }
    perf_('catatA3 buatNota+nextId', _tA0);

    var row = {};
    KOLOM_PIUTANG_ANGGOTA_EXT.forEach(function (h) {
      if (h === 'Waktu') row[h] = waktu;
      else if (h === 'ID System') row[h] = idSystem;
      else if (h === 'Nota Toko') row[h] = notaLengkap;
      else if (h === 'Toko') row[h] = getTokoSesi_(u);
      else if (h === 'Petugas') row[h] = String(u.Username || '').trim();
      else if (h === 'Nominal') row[h] = nominal;
      else if (h === 'No Anggota') row[h] = kodeTeks_(no);
      else row[h] = '';
    });
    var valuesA = KOLOM_PIUTANG_ANGGOTA_EXT.map(function (h) { return row[h] === undefined ? '' : row[h]; });
    if (useApi) appendRowsExt_(conf.spreadsheetId, conf.sheetName, [valuesA]);
    else _shC.appendRow(valuesA);
    var mirA = mirrorAppendRows_('anggota', 'piutang', KOLOM_PIUTANG_ANGGOTA_EXT, [valuesA]);
    if (mirA.length) patchPiutangCacheAppend_('anggota', mirA[0]);
    perf_('catatA4 append+mirror+patch', _tA0);
    return { ok: true, message: 'Kredit anggota ' + idSystem + ' tercatat. Nota: ' + notaLengkap, ID: idSystem, ms: Date.now() - _tA0 };
  } catch (e) {
    return getErrorObj_('Gagal mencatat kredit anggota: ' + e.message);
  } finally {
    if (lock) lock.releaseLock();
  }
}

/** Upload foto bukti dan isi kolom Verifikasi dengan link foto */
function uploadBuktiPiutangAnggota(data) {
  data = data || {};
  var token = String(data.token || '').trim();
  if (!token) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  var base64 = String(data.base64 || '');
  if (base64.indexOf('base64,') < 0) return getErrorObj_('Data foto tidak valid.');
  try {
    var conf = getPiutangAnggotaConfig_();
    var ss = SpreadsheetApp.openById(conf.spreadsheetId);
    var sheet = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
    if (!sheet) return getErrorObj_('Sheet "' + conf.sheetName + '" tidak ditemukan.');
    var headers = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
      : [];
    var idCol = headers.indexOf('ID System') + 1;
    if (idCol < 1) return getErrorObj_('Kolom "ID System" tidak ditemukan.');
    var lastRow = Math.max(sheet.getLastRow(), 1);
    var dataIds = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    var rowIndex = -1;
    for (var i = 0; i < dataIds.length; i++) {
      if (String(dataIds[i][0]).trim() === idSystem) { rowIndex = i + 2; break; }
    }
    if (rowIndex < 2) return getErrorObj_('Kredit anggota tidak ditemukan.');

    var file = simpanFotoBukti_(base64, 'bukti_' + idSystem);
    var link = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800';
    var vCol = headers.indexOf('Verifikasi') + 1;
    if (vCol >= 1) sheet.getRange(rowIndex, vCol).setValue(link);
    mirrorSetCell_('anggota', 'piutang', 'ID System', idSystem, 'Verifikasi', link);
    patchPiutangVerifikasiCache_('anggota', idSystem, link);
    return { ok: true, message: 'Bukti foto tersimpan.', link: link };
  } catch (e) {
    return getErrorObj_('Gagal menyimpan bukti foto: ' + e.message);
  }
}

/** Set kolom Status Notif menjadi "Terkirim" */
function kirimNotifPiutangAnggota(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  try {
    setStatusNotif_('anggota', idSystem);
    return { ok: true, message: 'Status notifikasi WA untuk ' + idSystem + ' diubah menjadi Terkirim.' };
  } catch (e) {
    return getErrorObj_('Gagal mengirim notifikasi: ' + e.message);
  }
}

/** ------------------------------------------------------------------ */
/** NOTIFIKASI WA & PENGATURAN PESAN                                    */
/** ------------------------------------------------------------------ */

function setStatusNotif_(kind, idSystem) {
  var conf = kind === 'karyawan' ? getPiutangKaryawanConfig_() : getPiutangAnggotaConfig_();
  var ss = SpreadsheetApp.openById(conf.spreadsheetId);
  var sheet = ss.getSheetByName(conf.sheetName) || ss.getSheets()[0];
  if (!sheet) throw new Error('Sheet "' + conf.sheetName + '" tidak ditemukan.');
  var headers = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); })
    : [];
  var idCol = headers.indexOf('ID System') + 1;
  if (idCol < 1) throw new Error('Kolom "ID System" tidak ditemukan.');
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var dataIds = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  var rowIndex = -1;
  for (var i = 0; i < dataIds.length; i++) {
    if (String(dataIds[i][0]).trim() === idSystem) { rowIndex = i + 2; break; }
  }
  if (rowIndex < 2) throw new Error('Kredit ' + (kind === 'karyawan' ? 'karyawan' : 'anggota') + ' tidak ditemukan.');
  var snCol = headers.indexOf('Status Notif') + 1;
  if (snCol >= 1) sheet.getRange(rowIndex, snCol).setValue('Terkirim');
  mirrorSetCell_(kind, 'piutang', 'ID System', idSystem, 'Status Notif', 'Terkirim');
  patchCacheList_(mirrorCacheKey_(kind, 'piutang'), 43200, function (list) {
    list.forEach(function (p) {
      if (String(p.IDSystem || '').trim() === String(idSystem || '').trim()) p.StatusNotif = 'Terkirim';
    });
  });
}

function formatRupiah_(n) {
  n = Math.round(Number(n) || 0);
  var s = String(n);
  var out = '';
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    out = s.charAt(i) + out;
    count++;
    if (count % 3 === 0 && i > 0) out = '.' + out;
  }
  return 'Rp ' + out;
}

function pesanWaPiutangDefault_(kind) {
  var ident = kind === 'karyawan' ? 'No. Kepegawaian: {nip}' : 'No. Anggota: {noanggota}';
  return 'Halo {nama},\n\nKredit Anda telah dicatat di KOPINKA dengan detail:\n' + ident +
    '\nID Kredit: {id}\nNota: {nota}\nToko: {toko}\nPetugas: {petugas}\nNominal: {nominal}\nWaktu: {waktu}\n\nTerima kasih.';
}

function getPengaturanMap_() {
  var map = {};
  try {
    var sheet = getSheet_(SHEET_NAMES.PENGATURAN);
    if (!sheet) return map;
    var lr = sheet.getLastRow();
    if (lr < 1) return map;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).trim(); });
    var keyCol = headers.indexOf('Key');
    var valCol = headers.indexOf('Value');
    var kc = keyCol > -1 ? keyCol : 0;
    var vc = valCol > -1 ? valCol : 1;
    var cols = Math.max(kc, vc) + 1;
    var data = sheet.getRange(1, 1, lr, cols).getValues();
    for (var i = 1; i < data.length; i++) {
      var k = String(data[i][kc] || '').trim();
      if (k) map[k] = data[i][vc] === null || data[i][vc] === undefined ? '' : String(data[i][vc]);
    }
  } catch (e) {}
  return map;
}

function getSetting_(key, dflt) {
  var m = getPengaturanMap_();
  return Object.prototype.hasOwnProperty.call(m, key) ? m[key] : (dflt === undefined ? '' : dflt);
}

function setSetting_(key, value) {
  var sheet = getSheet_(SHEET_NAMES.PENGATURAN);
  if (!sheet) return;
  var lr = Math.max(sheet.getLastRow(), 1);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var keyCol = headers.indexOf('Key');
  var valCol = headers.indexOf('Value');
  var kc = keyCol > -1 ? keyCol : 0;
  var vc = valCol > -1 ? valCol : 1;
  var cols = Math.max(kc, vc) + 1;
  var data = sheet.getRange(1, 1, lr, cols).getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][kc] || '').trim() === key) {
      sheet.getRange(i + 1, vc + 1).setValue(value);
      return;
    }
  }
  if (keyCol > -1) sheet.appendRow(['', key, value]);
  else sheet.appendRow([key, value]);
}

function getPengaturanWa(data) {
  data = data || {};
  if (!validasiSesi(String(data.token || '').trim())) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  return {
    ok: true,
    pesanAnggota: getSetting_('PESAN_WA_PIUTANG_ANGGOTA', pesanWaPiutangDefault_('anggota')),
    pesanKaryawan: getSetting_('PESAN_WA_PIUTANG_KARYAWAN', pesanWaPiutangDefault_('karyawan'))
  };
}

function setPengaturanWa(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  if (String(u.Role || '') !== 'admin') return getErrorObj_('Hanya admin yang dapat mengubah pengaturan pesan.');
  setSetting_('PESAN_WA_PIUTANG_ANGGOTA', String(data.pesanAnggota || ''));
  setSetting_('PESAN_WA_PIUTANG_KARYAWAN', String(data.pesanKaryawan || ''));
  return { ok: true, message: 'Pesan notifikasi WhatsApp diperbarui.' };
}

/** Susun data & pesan WhatsApp untuk transaksi piutang (tanpa mengubah status). */
function buildWaPiutang_(kind, idSystem) {
  var res = kind === 'karyawan' ? readPiutangKaryawanExt_() : readPiutangAnggotaExt_();
  if (!res.ok) return getErrorObj_(res.message);
  var row = null;
  for (var i = 0; i < res.list.length; i++) {
    if (String(res.list[i].IDSystem) === idSystem) { row = res.list[i]; break; }
  }
  if (!row) return getErrorObj_('Kredit ' + (kind === 'karyawan' ? 'karyawan' : 'anggota') + ' tidak ditemukan.');

  var nama = '';
  var phone = '';
  if (kind === 'karyawan') {
    var resK = readDataKaryawan_();
    if (resK && resK.ok) {
      for (var j = 0; j < resK.list.length; j++) {
        var k = resK.list[j];
        var nipRow = String(row.NIP || '').trim();
        if (nipMatch_(String(k.NIPBaru || ''), nipRow) || nipMatch_(String(k.NIPLama || ''), nipRow)) {
          nama = k.NamaLengkap; phone = k.NoWA; break;
        }
      }
    }
  } else {
    var resA = readDataAnggotaExt_();
    if (resA && resA.ok) {
      for (var j2 = 0; j2 < resA.list.length; j2++) {
        if (String(resA.list[j2].NoAnggota) === String(row.NoAnggota)) {
          nama = resA.list[j2].Nama; phone = resA.list[j2].NoHP; break;
        }
      }
    }
  }
  if (!phone) phone = getUnitNoWAForToko_(String(row.Toko || ''), '');

  var template = getSetting_('PESAN_WA_PIUTANG_' + (kind === 'karyawan' ? 'KARYAWAN' : 'ANGGOTA'), pesanWaPiutangDefault_(kind));
  var msg = template
    .replace(/\{nama\}/g, nama)
    .replace(/\{noanggota\}/g, row.NoAnggota || '')
    .replace(/\{nip\}/g, row.NIP || '')
    .replace(/\{id\}/g, row.IDSystem)
    .replace(/\{nota\}/g, row.NotaToko)
    .replace(/\{toko\}/g, row.Toko)
    .replace(/\{petugas\}/g, row.Petugas)
    .replace(/\{nominal\}/g, formatRupiah_(cleanNum_(row.Nominal)))
    .replace(/\{waktu\}/g, row.Waktu);

  var tel = String(phone || '').replace(/\D/g, '');
  if (!tel) return { ok: false, message: 'Nomor WA ' + (nama || (kind === 'karyawan' ? 'karyawan' : 'anggota')) + ' tidak tersedia. Lengkapi di sheet ' + (kind === 'karyawan' ? 'Data_Karyawan' : 'Users') + ' atau isi No WA toko pada sheet Unit.' };
  if (tel.indexOf('0') === 0) tel = '62' + tel.substring(1);
  else if (tel.indexOf('8') === 0) tel = '62' + tel;

  return { ok: true, row: row, nama: nama, phone: phone, tel: tel, msg: msg };
}

/** Siapkan pesan WhatsApp untuk transaksi piutang dan tandai Status Notif = Terkirim */
function waPiutang(data) {
  data = data || {};
  var token = String(data.token || '').trim();
  if (!token) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var kind = data.kind === 'karyawan' ? 'karyawan' : 'anggota';
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  try {
    var b = buildWaPiutang_(kind, idSystem);
    if (!b.ok) return b;
    setStatusNotif_(kind, idSystem);
    var url = 'https://wa.me/' + b.tel + '?text=' + encodeURIComponent(b.msg);
    return { ok: true, url: url, noHP: b.tel, nama: b.nama, id: idSystem, message: 'WhatsApp dibuka dengan detail kredit; status notif ditandai Terkirim.' };
  } catch (e) {
    return getErrorObj_('Gagal menyiapkan notifikasi WA: ' + e.message);
  }
}

/** Preview pesan WhatsApp tanpa mengubah status notif */
function previewWaPiutang(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var kind = data.kind === 'karyawan' ? 'karyawan' : 'anggota';
  var idSystem = String(data.ID || '').trim();
  if (!idSystem) return getErrorObj_('ID System tidak valid.');
  try {
    var b = buildWaPiutang_(kind, idSystem);
    if (!b.ok) return b;
    return {
      ok: true, noHP: b.tel, nama: b.nama, id: idSystem, pesan: b.msg,
      noAnggota: b.row.NoAnggota || '',
      nip: b.row.NIP || '',
      nominal: formatRupiah_(cleanNum_(b.row.Nominal)),
      nota: b.row.NotaToko || '',
      toko: b.row.Toko || '',
      petugas: b.row.Petugas || '',
      waktu: b.row.Waktu || ''
    };
  } catch (e) {
    return getErrorObj_('Gagal membuat preview notifikasi WA: ' + e.message);
  }
}

/** Warm semua data eksternal yang dibutuhkan fitur WA agar tombol WA cepat dibuka. */
function warmWaData(data) {
  data = data || {};
  if (!validasiSesi(String(data.token || '').trim())) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  return warmWaDataInt_();
}

function warmWaDataInt_() {
  readVoucherSheet_(getVoucherConfig_().spreadsheetId, getVoucherConfig_().sheetName, normalizeVoucher_);
  readVoucherSheet_(getVoucherKaryawanConfig_().spreadsheetId, getVoucherKaryawanConfig_().sheetName, normalizeVoucherKaryawan_);
  readMirrorSheet_('karyawan', 'voucher', normalizeVoucherKaryawan_, 'voucher karyawan');
  readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  readMirrorSheet_('karyawan', 'mutasi', normalizeMutasiKaryawan_, 'mutasi karyawan');
  readMirrorSheet_('anggota', 'mutasi', normalizeMutasiAnggota_, 'mutasi anggota');
  readPiutangKaryawanExt_();
  readDataKaryawan_();
  readDataAnggotaExt_();
  readPiutangAnggotaExt_();
  return { ok: true };
}

/** Dijalankan otomatis oleh time trigger (tanpa token/URL). */
function warmWaDataReguler() {
  try { return warmWaDataInt_(); } catch (e) { return { ok: false, message: String(e.message || '') }; }
}

/** JALANKAN SEKALI di editor Apps Script agar cache dipanaskan tiap 30 menit. */
function setupWarmTrigger() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (String(t.getHandlerFunction()) === 'warmWaDataReguler') n++;
  });
  if (n > 0) return { ok: true, pesan: 'Trigger pemanasan cache sudah aktif (' + n + ').' };
  ScriptApp.newTrigger('warmWaDataReguler').timeBased().everyMinutes(30).create();
  return { ok: true, pesan: 'Trigger pemanasan cache dibuat: tiap 30 menit.' };
}

/** ------------------------------------------------------------------ */
/** REDEEM                                                             */
/** ------------------------------------------------------------------ */

function getRedeemList() {
  var out = [];
  var adminTok = { Role: 'admin' };
  [['karyawan', 'Karyawan'], ['anggota', 'Anggota']].forEach(function (pair) {
    var kind = pair[0];
    var norm = kind === 'karyawan' ? normalizeMutasiKaryawan_ : normalizeMutasiAnggota_;
    var res = readMirrorSheet_(kind, 'mutasi', norm, 'mutasi ' + kind);
    if (!res.ok) return;
    (res.list || []).filter(function (m) { return cocokToko_(adminTok, m); }).forEach(function (m) {
      out.push({
        ID: String(m.IDSystem || '') || ('RVP-' + String(m.KodeVoucher || '')),
        IDPiutang: 'VOUCHER-' + String(m.KodeVoucher || ''),
        NoAnggota: kind === 'karyawan' ? String(m.NIP || '') : String(m.NoAnggota || ''),
        TanggalRedeem: String(m.Waktu || '').slice(0, 10),
        JumlahRedeem: cleanNum_(m.Nilai),
        SisaSetelah: 0,
        MetodeBayar: 'Voucher',
        Toko: m.Toko,
        NotaToko: m.NotaToko,
        Keterangan: 'Redeem voucher ' + String(m.KodeVoucher || ''),
        Jenis: pair[1]
      });
    });
  });
  return out;
}

function getRedeemPage(data) {
  data = data || {};
  var search = String(data.search || '').toLowerCase().trim();
  var kind = String(data.kind || '').toLowerCase().trim();
  var list = getTrxCache_().filter(function (t) {
    var jenis = String(t.Jenis || 'Anggota');
    if (kind === 'karyawan' && jenis !== 'Karyawan') return false;
    if (kind === 'anggota' && jenis === 'Karyawan') return false;
    return !search || fieldsMatch_(t, ['ID', 'IDPiutang', 'NoAnggota', 'MetodeBayar', 'Keterangan'], search);
  });
  list = sortBy_(list, 'TanggalRedeem', true);
  if (data.full) return { ok: true, list: list, total: list.length };
  return pageResult_(list, data.page, data.pageSize);
}

function redeemPiutang(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheetPiutang = getSheet_(SHEET_NAMES.PIUTANG);
    var sheetTrx = getSheet_(SHEET_NAMES.TRANSAKSI);
    if (!sheetPiutang || !sheetTrx) {
      return getErrorObj_('Fitur redeem lama tidak tersedia pada struktur sheet baru. Gunakan aplikasi (Redeem Voucher).');
    }

    var idPiutang = String(data.IDPiutang || '').trim();
    var rowIndex = findRowIndex_(sheetPiutang, 'ID', idPiutang);
    if (rowIndex < 1) return getErrorObj_('Kredit tidak ditemukan.');

    var row = sheetPiutang.getRange(rowIndex, 1, 1, KOLOM.PIUTANG.length).getValues()[0];
    var headers = getLeaders_(sheetPiutang);
    var piutang = {};
    headers.forEach(function (h, i) { piutang[h] = row[i]; });

    if (piutang.NoAnggota && isAnggotaDiblokir_(String(piutang.NoAnggota).trim())) {
      return getErrorObj_('Status anggota ' + String(piutang.NoAnggota).trim() + ' Diblokir. Transaksi kredit diblokir, hanya voucher yang boleh diredeem.');
    }

    var jumlahRedeem = cleanNum_(data.JumlahRedeem);
    if (jumlahRedeem <= 0) return getErrorObj_('Jumlah redeem harus lebih dari 0.');

    var sisaLama = cleanNum_(piutang.Sisa);
    if (sisaLama <= 0 || String(piutang.Status) === 'Lunas') {
      return getErrorObj_('Kredit ini sudah lunas.');
    }
    if (jumlahRedeem > sisaLama) return getErrorObj_('Jumlah redeem melebihi sisa kredit (sisa: ' + formatIDR_(sisaLama) + ').');

    var sisaBaru = Math.round((sisaLama - jumlahRedeem) * 100) / 100;
    var statusBaru = sisaBaru <= 0 ? 'Lunas' : 'Belum Lunas';

    var idTrx = nextId_(sheetTrx, 0, 'RDM');
    var newRow = {
      ID: idTrx,
      IDPiutang: idPiutang,
      NoAnggota: piutang.NoAnggota,
      TanggalRedeem: data.TanggalRedeem || todayStr_(),
      JumlahRedeem: typeof data.JumlahRedeem === 'number' ? data.JumlahRedeem : jumlahRedeem,
      SisaSetelah: sisaBaru,
      MetodeBayar: String(data.MetodeBayar || 'Tunai').trim(),
      Keterangan: String(data.Keterangan || '').trim(),
      Jenis: 'Anggota'
    };
    sisaBaru = Math.max(sisaBaru, 0);
    ensureTransaksiJenis_(sheetTrx);
    appendBody_(sheetTrx, newRow);

    var updatedRow = KOLOM.PIUTANG.map(function (h) {
      if (h === 'Sisa') return sisaBaru;
      if (h === 'Status') return statusBaru;
      return piutang[h];
    });
    sheetPiutang.getRange(rowIndex, 1, 1, KOLOM.PIUTANG.length).setValues([updatedRow]);
    clearDataCache_();

    return {
      ok: true,
      message: 'Redeem ' + idTrx + ' tercatat. ' + (statusBaru === 'Lunas' ? 'Kredit lunas!' : 'Sisa: ' + formatIDR_(sisaBaru)),
      ID: idTrx
    };
  } catch (e) {
    return getErrorObj_('Gagal proses redeem: ' + e.message);
  } finally {
    lock.releaseLock();
  }
}

function cariPemegang(data) {
  data = data || {};
  var isKaryawan = data.kind === 'karyawan';
  var conf = isKaryawan ? getVoucherKaryawanConfig_() : getVoucherConfig_();
  var norm = isKaryawan ? normalizeVoucherKaryawan_ : normalizeVoucher_;
  var res = readMirrorSheet_(isKaryawan ? 'karyawan' : 'anggota', 'voucher', norm, isKaryawan ? 'voucher karyawan' : 'voucher anggota');
  if (!res.ok) return { ok: false, message: res.message };
  var no = String(data.no || '').trim();
  if (!no) return getErrorObj_('Masukkan ' + (isKaryawan ? 'NIP' : 'No Anggota') + '.');
  var list = res.list.filter(function (v) {
    var k = String(isKaryawan ? v.NIP : v.NoAnggota || '').trim();
    return isKaryawan ? nipMatch_(k, no) : (k === no || k === no.replace(/^A/i, ''));
  });
  if (!list.length) {
    var fb = isKaryawan ? cariPemegangFallbackKaryawan_(no) : cariPemegangFallbackAnggota_(no);
    if (fb) return {
      ok: true,
      perluVoucher: true,
      holder: lengkapiHolderPiutang_(isKaryawan, no, fb),
      message: 'Voucher belum dibuat untuk ' + no + '. Klik "Buat Voucher" untuk mencatat voucher baru atas nama ini.'
    };
    return getErrorObj_('Identitas tidak ditemukan untuk ' + no + '.');
  }
  var h = list[0];
  var holder = lengkapiHolderPiutang_(isKaryawan, no, {
    Nama: String(h.Nama || ''),
    NIP: String(h.NIP || ''),
    NoAnggota: String(h.NoAnggota || ''),
    Kelompok: String(h.Kelompok || ''),
    Bagian: String(h.Bagian || ''),
    Foto: String(h.Foto || '')
  });
  return {
    ok: true,
    perluVoucher: false,
    holder: holder
  };
}

function akumulasiPiutangBulanBerjalan_(isKaryawan, no) {
  no = String(no || '').trim();
  if (!no) return 0;
  var bln = bulanKey_(new Date());
  var sum = 0;
  var res = isKaryawan ? readPiutangKaryawanExt_() : readPiutangAnggotaExt_();
  if (res && res.ok && res.list) {
    res.list.forEach(function (p) {
      var k = String(isKaryawan ? p.NIP : p.NoAnggota || '').trim();
      if (k && nipMatch_(k, no) && bulanKey_(String(p.Waktu || '')) === bln) {
        sum += Number(p.Nominal) || 0;
      }
    });
  }
  return Math.round(sum * 100) / 100;
}

function statusPiutangPemegang_(isKaryawan, no) {
  no = String(no || '').trim();
  if (!no) return '';
  var res = isKaryawan ? readDataKaryawan_() : readDataAnggotaExt_();
  if (!res || !res.ok || !res.list) return '';
  var found = '';
  res.list.forEach(function (m) {
    if (found) return;
    var k = String(isKaryawan ? (m.NIPBaru || m.NIPLama) : m.NoAnggota || '').trim();
    if (k && nipMatch_(k, no)) found = String(m.StatusPiutang || '');
  });
  return found;
}

function lengkapiHolderPiutang_(isKaryawan, no, holder) {
  holder = holder || {};
  holder = {
    Nama: String(holder.Nama || ''),
    NIP: String(holder.NIP || ''),
    NoAnggota: String(holder.NoAnggota || ''),
    Kelompok: String(holder.Kelompok || ''),
    Bagian: String(holder.Bagian || ''),
    Foto: String(holder.Foto || ''),
    AkumulasiBulan: akumulasiPiutangBulanBerjalan_(isKaryawan, no),
    StatusPiutang: statusPiutangPemegang_(isKaryawan, no)
  };
  holder.Diblokir = /diblo|blok/i.test(String(holder.StatusPiutang || ''));
  return holder;
}

function cariPemegangFallbackKaryawan_(no) {
  var res = readDataKaryawan_();
  if (!res.ok || !res.list) return null;
  var q = String(no || '').trim();
  if (!q) return null;
  var exact = null, exactLama = null, numeric = null;
  for (var a = 0; a < res.list.length; a++) {
    if (String(res.list[a].NIPBaru || '').trim() === q) { exact = res.list[a]; break; }
  }
  if (!exact) {
    for (var b = 0; b < res.list.length; b++) {
      if (String(res.list[b].NIPLama || '').trim() === q) { exactLama = res.list[b]; break; }
    }
  }
  for (var c = 0; c < res.list.length; c++) {
    if (nipMatch_(String(res.list[c].NIPBaru || ''), q) || nipMatch_(String(res.list[c].NIPLama || ''), q)) { numeric = res.list[c]; break; }
  }
  var src = exact || exactLama || numeric;
  if (!src) return null;
  return {
    Nama: String(src.NamaLengkap || ''),
    NIP: String(src.NIPBaru || src.NIPLama || ''),
    NoAnggota: String(src.NoAnggota || ''),
    Kelompok: String(src.Kategori || ''),
    Bagian: String(src.Bagian || src.Unit || ''),
    Foto: String(src.Foto || '')
  };
}

function cariPemegangFallbackAnggota_(no) {
  var res = getDataAnggotaConfig_();
  var list = getAnggotaList();
  if (!list.length) return null;
  var q = no.replace(/^A/i, '');
  for (var i = 0; i < list.length; i++) {
    var a = list[i];
    if (nipMatch_(String(a.NoAnggota || ''), no) || nipMatch_(String(a.NoAnggota || ''), q)) {
      return {
        Nama: String(a.Nama || ''),
        NIP: '',
        NoAnggota: String(a.NoAnggota || ''),
        Kelompok: String(a.Kelompok || ''),
        Bagian: String(a.Bagian || ''),
        Foto: String(a.Foto || '')
      };
    }
  }
  return null;
}

function nipMatch_(val, no) {
  val = String(val || '').trim();
  no = String(no || '').trim().replace(/^A/i, '');
  if (val === no) return true;
  if (!val || !no) return false;
  return parseInt(val, 10) === parseInt(no, 10);
}

/** ------------------------------------------------------------------ */
/** DIAGNOSTIK: cek apakah sebuah NIP/NoAnggota dapat ditemukan.       */
/** Dipanggil manual via Konsol/Developer (google.script.run.alatCekNIP) */
/** ------------------------------------------------------------------ */
function alatCekNIP(no) {
  no = String((no || {}).no || no || '').trim();
  if (!no) return getErrorObj_('Masukkan NIP yang dicek.');
  var out = [];
  out.push('=== CEK IDENTITAS: "' + no + '" ===');

  /* 1) Master Data_Karyawan */
  var resK = readDataKaryawan_();
  if (resK.ok) {
    out.push('[Master Data_Karyawan] OK, ' + (resK.list || []).length + ' baris dimuat.');
    var ket1 = false;
    (resK.list || []).forEach(function (k, i) {
      var nipB = String(k.NIPBaru || '').trim();
      var nipL = String(k.NIPLama || '').trim();
      var cocokB = nipMatch_(nipB, no);
      var cocokL = nipMatch_(nipL, no);
      if (cocokB || cocokL) {
        ket1 = true;
        out.push('  >> [Master] KETEMU, Row ' + (Number(k.Row) || i + 2) +
          ' | NIPBaru="' + nipB + '"' + (cocokB ? ' ✔' : '') +
          ' | NIPLama="' + nipL + '"' + (cocokL ? ' ✔' : '') +
          ' | Nama="' + String(k.NamaLengkap || '') + '"');
      }
    });
    if (!ket1) {
      var contoh = [];
      (resK.list || []).slice(0, 3).forEach(function (k) {
        contoh.push(String(k.NIPBaru || k.NIPLama || '').trim());
      });
      out.push('  >> [Master] NIP ' + no + ' TIDAK ditemukan pada NIPBaru/NIPLama.');
      out.push('     (Contoh NIP pada master: ' + (contoh.length ? contoh.join(', ') : 'master kosong') + ')');
    }
  } else {
    out.push('[Master Data_Karyawan] GAGAL: ' + resK.message);
  }

  /* 2) Sheet Voucher Karyawan (mirror) */
  var conf = getVoucherKaryawanConfig_();
  out.push('[Voucher Karyawan] Spreadsheet ID: "' + conf.spreadsheetId + '" Sheet: "' + conf.sheetName + '"' +
    (conf.spreadsheetId ? '' : '  → BELUM DIKONFIGURASI'));
  var resV = readMirrorSheet_('karyawan', 'voucher', normalizeVoucherKaryawan_, 'voucher karyawan');
  if (resV.ok) {
    out.push('[Voucher Karyawan] OK, ' + (resV.list || []).length + ' voucher dimuat.');
    var ket2 = false;
    (resV.list || []).forEach(function (v) {
      if (nipMatch_(String(v.NIP || ''), no)) {
        ket2 = true;
        out.push('  >> [Voucher] KETEMU: kode="' + String(v.Kode || '') + '" NIP="' + String(v.NIP || '') +
          '" Nilai=' + String(v.Nilai) + ' Status="' + String(v.Status || '') + '"');
      }
    });
    if (!ket2) out.push('  >> [Voucher] NIP ' + no + ' TIDAK ditemukan pada sheet voucher karyawan.');
    out.push('  >> [Voucher] Isi sheet voucher karyawan (mirror):');
    (resV.list || []).forEach(function (v, i) {
      out.push('     ' + (i + 1) + '. Kode="' + String(v.Kode || '') + '" | NIP="' + String(v.NIP || '') +
        '" | Unit/Bagian="' + String(v.Bagian || v.Unit || '') + '" | Nama="' + String(v.Nama || '') +
        '" | Nilai=' + String(v.Nilai) + ' | Status="' + String(v.Status || '') + '"');
    });
  } else {
    out.push('[Voucher Karyawan] GAGAL: ' + resV.message);
  }

  return { ok: true, message: out.join('\n') };
}

function getVouchersPemegang(data) {
  data = data || {};
  var isKaryawan = data.kind === 'karyawan';
  var conf = isKaryawan ? getVoucherKaryawanConfig_() : getVoucherConfig_();
  var norm = isKaryawan ? normalizeVoucherKaryawan_ : normalizeVoucher_;
  var res = readMirrorSheet_(isKaryawan ? 'karyawan' : 'anggota', 'voucher', norm, isKaryawan ? 'voucher karyawan' : 'voucher anggota');
  if (!res.ok) return { ok: false, message: res.message, list: [] };
  var no = String(data.no || '').trim();
  if (!no) return { ok: false, message: 'Masukkan ' + (isKaryawan ? 'NIP' : 'No Anggota') + ' pemegang voucher.', list: [] };
  var list = res.list.filter(function (v) {
    var k = String(isKaryawan ? v.NIP : v.NoAnggota || '').trim();
    return isKaryawan ? nipMatch_(k, no) : (k === no || k === no.replace(/^A/i, ''));
  });
  var active = list.filter(function (v) { return String(v.Status) === 'Active'; });
  var total = list.reduce(function (s, v) { return s + cleanNum_(v.Nilai); }, 0);
  var totalActive = active.reduce(function (s, v) { return s + cleanNum_(v.Nilai); }, 0);
  var ident = isKaryawan ? 'NIP' : 'NoAnggota';
  var grup = isKaryawan ? 'Bagian' : 'Kelompok';
  var holder = null;
  var perluVoucher = false;
  var message = res.message;
  if (list.length) {
    var pem = isKaryawan ? cariPemegangFallbackKaryawan_(no) : null;
    holder = lengkapiHolderPiutang_(isKaryawan, no, {
      Nama: String((pem && pem.Nama) || list[0].Nama || ''),
      No: String((pem && pem.NIP) || (isKaryawan ? list[0].NIP : list[0].NoAnggota) || ''),
      NIP: String((pem && pem.NIP) || list[0].NIP || ''),
      NoAnggota: String(list[0].NoAnggota || ''),
      Kelompok: String((pem && pem.Kelompok) || list[0].Kelompok || ''),
      Bagian: String((pem && pem.Bagian) || list[0].Bagian || list[0].Unit || ''),
      Foto: String((pem && pem.Foto) || list[0].Foto || '')
    });
  } else {
    var fb = isKaryawan ? cariPemegangFallbackKaryawan_(no) : cariPemegangFallbackAnggota_(no);
    if (fb) {
      perluVoucher = true;
      holder = lengkapiHolderPiutang_(isKaryawan, no, fb);
      message = 'Voucher belum dibuat untuk ' + no + '. Klik "Buat Voucher" untuk mencatat voucher baru atas nama ini.';
    }
  }
  return {
    ok: true,
    message: message,
    list: list,
    active: active.length,
    total: Math.round(total * 100) / 100,
    totalActive: Math.round(totalActive * 100) / 100,
    nama: list.length ? list[0].Nama : '',
    identKunci: ident,
    grupKunci: grup,
    holder: holder,
    perluVoucher: perluVoucher
  };
}

/**
 * Tulis semua baris mutasi baru ke sheet Mutasi eksternal (MyKopinka / HRIS)
 * dalam satu setValues, satu baris mirror SPARTA (setValues), lalu patch
 * cache mirror mutasi supaya load berikutnya langsung segar tanpa baca ulang.
 */
function appendMutasiRedeemBulk_(kind, u, items, tanggal, nota, piutangId) {
  var conf = getMutasiConfig_(kind);
  if (!conf.spreadsheetId) return { ok: true, message: 'Spreadsheet mutasi belum dikonfigurasi (dilewati).', count: 0 };
  try {
    var useApi = sheetsApiProbe_();
    var headers = useApi ? getSheetHeadersExt_(conf.spreadsheetId, conf.sheetName) : headersFromOpen_(conf.spreadsheetId, conf.sheetName);
    if (!headers.length) return getErrorObj_('Sheet mutasi masih kosong. Isi baris header terlebih dahulu.');

    var waktu = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd HH:mm:ss');

    var find = function (candidates) {
      for (var i = 0; i < candidates.length; i++) {
        var idx = headers.indexOf(candidates[i]);
        if (idx > -1) return idx;
      }
      return -1;
    };
    var idxWaktu = find(['Waktu']);
    var idxId = find(['ID System']);
    var idxNota = find(['Nota Toko']);
    var idxKode = find(['Kode Voucher']);
    var idxToko = find(['Toko']);
    var idxPetugas = find(['Petugas']);
    var idxNilai = find(['Nilai']);
    var idxNama = find(['Nama Anggota', 'Nama', 'Nama Pemegang']);
    var idxNo = find(kind === 'karyawan' ? ['NIP', 'No Pegawai'] : ['No Anggota', 'NoAnggota']);
    var idxKelompok = find(kind === 'karyawan' ? ['Bagian', 'Unit', 'Kelompok'] : ['Kelompok']);
    var idxPiutang = find(['ID Piutang', 'Piutang', 'IDPiutang']);

    var norm = kind === 'karyawan' ? normalizeMutasiKaryawan_ : normalizeMutasiAnggota_;
    var rows = items.map(function (info) {
      var nama = String(info.v.Nama || '');
      var no = String(info.no || '');
      var kelompok = kind === 'karyawan'
        ? String(info.v.Bagian || info.v.Unit || '')
        : String(info.v.Kelompok || '');
      var row = [];
      for (var c = 0; c < headers.length; c++) row.push('');
      if (idxWaktu > -1) row[idxWaktu] = waktu;
      if (idxId > -1) row[idxId] = String(info.idTrx || '');
      if (idxNota > -1) row[idxNota] = String(nota || '');
      if (idxKode > -1) row[idxKode] = "'" + String(info.kode || '');
      if (idxToko > -1) row[idxToko] = getTokoSesi_(u);
      if (idxPetugas > -1) row[idxPetugas] = String(u.Username || '');
      if (idxNilai > -1) row[idxNilai] = cleanNum_(info.v.Nilai);
      if (idxNama > -1) row[idxNama] = nama;
      if (idxNo > -1) row[idxNo] = kodeTeks_(no);
      if (idxKelompok > -1) row[idxKelompok] = kelompok;
      if (idxPiutang > -1) row[idxPiutang] = String(piutangId || '');
      return row;
    });

    if (useApi) {
      appendRowsExt_(conf.spreadsheetId, conf.sheetName, rows);
    } else {
      var _shM = SpreadsheetApp.openById(conf.spreadsheetId).getSheetByName(conf.sheetName) || SpreadsheetApp.openById(conf.spreadsheetId).getSheets()[0];
      var _srM = Math.max(_shM.getLastRow(), 1);
      _shM.getRange(_srM + 1, 1, rows.length, headers.length).setValues(rows);
    }

    var mirrorRows = mirrorAppendRows_(kind, 'mutasi', headers, rows);
    if (mirrorRows.length) {
      patchCacheList_(mirrorCacheKey_(kind, 'mutasi'), 43200, function (list) {
        mirrorRows.forEach(function (rawRow) {
          var n = norm(rawRow);
          if (n) list.push(n);
        });
      });
    }
    return { ok: true, message: 'Mutasi ' + (kind === 'karyawan' ? 'HRIS' : 'MyKOPINKA') + ' tersimpan (' + rows.length + ').', count: rows.length };
  } catch (e) {
    return getErrorObj_('Gagal menulis mutasi: ' + e.message);
  }
}

/** Susun pesan + tautan wa.me untuk struk hasil redeem voucher. */
function buildStrukWa_(kind, struk) {
  var phone = '';
  var nama = String(struk.nama || '');
  var no = String(struk.no || '');
  if (kind === 'karyawan') {
    var resK = readDataKaryawan_();
    if (resK && resK.ok) {
      for (var j = 0; j < resK.list.length; j++) {
        var k = resK.list[j];
        if (nipMatch_(String(k.NIPBaru || ''), no) || nipMatch_(String(k.NIPLama || ''), no)) {
          nama = nama || k.NamaLengkap; phone = k.NoWA; break;
        }
      }
    }
  } else {
    var resA = readDataAnggotaExt_();
    if (resA && resA.ok) {
      for (var j2 = 0; j2 < resA.list.length; j2++) {
        if (String(resA.list[j2].NoAnggota) === no) {
          nama = nama || resA.list[j2].Nama; phone = resA.list[j2].NoHP; break;
        }
      }
    }
  }
  var tel = String(phone || '').replace(/\D/g, '');
  if (!tel) tel = String(getUnitNoWAForToko_(String(struk.toko || ''), '') || '').replace(/\D/g, '');
  if (!tel) return { ok: false, tel: '', url: '' };

  var lines = [];
  lines.push('STRUK REDEEM VOUCHER');
  lines.push('SPARTA KOPINKA');
  lines.push('ID: ' + struk.id + (Number(struk.jumlah) > 1 ? ' (+' + Number(struk.jumlah) + ' voucher)' : ''));
  lines.push('Tanggal: ' + struk.tanggal);
  lines.push('Jenis: ' + (kind === 'karyawan' ? 'KARYAWAN' : 'ANGGOTA'));
  lines.push('Nama: ' + nama);
  lines.push(kind === 'karyawan' ? 'NIP: ' + no : 'No Anggota: ' + no);
  var grup = String(struk.kelompok || '');
  if (grup) lines.push((kind === 'karyawan' ? 'Bagian' : 'Kelompok') + ': ' + grup);
  lines.push('----------------------');
  (struk.items || []).forEach(function (it) {
    lines.push(it.Kode + '  ' + it.Label + '  ' + formatRupiah_(cleanNum_(it.Nilai)));
  });
  lines.push('----------------------');
  lines.push('TOTAL: ' + formatRupiah_(cleanNum_(struk.total)));
  if (struk.piutangId) lines.push('Kredit: ' + struk.piutangId + ' ' + formatRupiah_(cleanNum_(struk.piutangNominal)));
  lines.push('Toko: ' + struk.toko);
  lines.push('Kasir: ' + struk.petugas);
  lines.push('MOHON SIMPAN STRUK INI');
  var msg = lines.join('\n');

  if (tel.indexOf('0') === 0) tel = '62' + tel.substring(1);
  else if (tel.indexOf('8') === 0) tel = '62' + tel;
  return { ok: true, tel: tel, url: 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), pesan: msg };
}

/** Tautan struk WA untuk satu baris Mutasi (redeem voucher). */
function mutasiWa(data) {
  data = data || {};
  var kind = data.kind === 'karyawan' ? 'karyawan' : 'anggota';
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var id = String(data.id || '').trim();
  if (!id) return getErrorObj_('ID mutasi kosong.');
  var res = mutasiCore_(kind, u, { full: true });
  if (!res.ok) return res;
  var pilih = null;
  for (var i = 0; i < res.list.length; i++) {
    if (String(res.list[i].IDSystem) === id) { pilih = res.list[i]; break; }
  }
  if (!pilih) return getErrorObj_('Mutasi ' + id + ' tidak ditemukan.');
  var nota = String(pilih.NotaToko || '');
  var identPilih = String(pilih.NoAnggota || pilih.NIP || '');
  var group = res.list.filter(function (x) {
    return String(x.NotaToko || '') === nota &&
      String(x.NoAnggota || x.NIP || '') === identPilih;
  });
  group.sort(function (a, b) { return String(a.KodeVoucher || '').localeCompare(String(b.KodeVoucher || '')); });
  var items = group.map(function (x) {
    return { Kode: String(x.KodeVoucher || ''), Label: 'Voucher', Nilai: x.Nilai };
  });
  var total = group.reduce(function (s, x) { return s + cleanNum_(x.Nilai); }, 0);
  var first = group[0] || pilih;
  var struk = {
    id: String(first.IDSystem || ''),
    jumlah: group.length,
    tanggal: String(first.Waktu || ''),
    nama: String(first.Nama || ''),
    no: String(first.NoAnggota || first.NIP || ''),
    kelompok: String(first.Kelompok || ''),
    toko: String(first.Toko || ''),
    petugas: String(first.Petugas || ''),
    items: items,
    total: total
  };
  var wa = buildStrukWa_(kind, struk);
  return {
    ok: wa.ok,
    url: wa.ok ? wa.url : '',
    tel: wa.ok ? wa.tel : '',
    message: wa.ok ? 'Struk siap dikirim.' : 'Nomor WA pemegang/toko tidak ditemukan.'
  };
}

function catatPiutang_(isKaryawan, no, jumlah, tanggal, uraian, jatuhTempo) {
  var sheet = isKaryawan ? getSheet_(SHEET_NAMES.PIUTANG_KARYAWAN) : getSheet_(SHEET_NAMES.PIUTANG);
  if (!sheet) return { id: '', isKaryawan: isKaryawan };
  var idPrefix = isKaryawan ? 'PIUTK' : 'PIUT';
  var id = nextId_(sheet, 0, idPrefix);
  var kolom = isKaryawan ? KOLOM.PIUTANG_KARYAWAN : KOLOM.PIUTANG;
  var row = {};
  kolom.forEach(function (h) {
    if (h === 'ID') row[h] = id;
    else if (h === 'NoAnggota' || h === 'NIP') row[h] = kodeTeks_(no);
    else if (h === 'Tanggal') row[h] = tanggal || todayStr_();
    else if (h === 'Uraian') row[h] = String(uraian || '').trim();
    else if (h === 'Jumlah') row[h] = jumlah;
    else if (h === 'JatuhTempo') row[h] = jatuhTempo || '';
    else if (h === 'Sisa') row[h] = jumlah;
    else if (h === 'Status') row[h] = 'Belum Lunas';
  });
  appendBody_(sheet, row);
  return { id: id, isKaryawan: isKaryawan };
}

function catatPiutang(data) {
  try {
    data = data || {};
    var isKaryawan = data.kind === 'karyawan';
    var no = String(data.No || '').trim();
    if (!no) return getErrorObj_('Isi nomor ' + (isKaryawan ? 'NIP' : 'No Anggota') + ' terlebih dahulu.');
    var jumlah = cleanNum_(data.Jumlah);
    if (jumlah <= 0) return getErrorObj_('Jumlah kredit harus lebih dari 0.');

    if (isKaryawan) {
      return catatPiutangKaryawanExt({
        token: String(data.token || '').trim(),
        No: no,
        Nominal: jumlah,
        Nota: String(data.Nota || '').trim(),
        Tanggal: String(data.Tanggal || '').trim()
      });
    }

    return catatPiutangAnggotaExt({
      token: String(data.token || '').trim(),
      No: no,
      Nominal: jumlah,
      Nota: String(data.Nota || '').trim(),
      Tanggal: String(data.Tanggal || '').trim()
    });
  } catch (e) {
    return getErrorObj_('Gagal mencatat kredit: ' + e.message);
  }
}

function redeemVoucher(data) {
  data = data || {};
  var _tStart = Date.now();
  var _seg = _tStart;
  var _perf = {};
  _perf.probeApi = sheetsApiProbe_();
  _perf.probeErr = _sheetsApiErr_;
  _perf.scriptId = ScriptApp.getScriptId();
  _perf.ver = APP_VERSION;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  _perf.lock = Date.now() - _seg;
  perf_('redeem0 lockWait', _seg);
  _seg = Date.now();
  try {
    var u = validasiSesi(String(data.token || '').trim());
    if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
    var isKaryawan = data.kind === 'karyawan';
    var conf = isKaryawan ? getVoucherKaryawanConfig_() : getVoucherConfig_();
    var norm = isKaryawan ? normalizeVoucherKaryawan_ : normalizeVoucher_;
    var res = readVoucherSheet_(conf.spreadsheetId, conf.sheetName, norm);
    _perf.sesiRead = Date.now() - _seg;
    perf_('redeem1 validasiSesi+readVoucherSheet', _seg);
    _seg = Date.now();
    if (!res.ok) return { ok: false, message: res.message };

    var kodes = (data.kode || []).map(function (k) { return String(k).trim(); }).filter(Boolean);
    if (!kodes.length) return getErrorObj_('Pilih minimal satu voucher untuk diredeem.');

    var svHeaders = sheetsApiProbe_()
      ? getSheetHeadersExt_(conf.spreadsheetId, conf.sheetName)
      : headersFromOpen_(conf.spreadsheetId, conf.sheetName);
    var statusCol = svHeaders.indexOf('Status') + 1;
    if (statusCol < 1) return getErrorObj_('Kolom Status tidak ditemukan pada sheet voucher.');

    var tanggal = data.Tanggal || todayStr_();

    var kodeToko = String(u.KodeToko || '').trim();
    var notaLengkap = '';
    if (kodeToko) {
      var mtchN = String(tanggal).match(/^(\d{4})-(\d{2})-(\d{2})/);
      var dN = mtchN ? new Date(Number(mtchN[1]), Number(mtchN[2]) - 1, Number(mtchN[3])) : new Date();
      var yy = Utilities.formatDate(dN, getTimeZone_(), 'yy');
      var mmdd = Utilities.formatDate(dN, getTimeZone_(), 'MMdd');
      var nota4 = String((data.piutang && data.piutang.Nota) || '').replace(/\D/g, '').trim();
      notaLengkap = kodeToko + yy + mmdd + (nota4 ? pad_(cleanNum_(nota4), 4) : pad_(0, 4));
    }

    var kind = isKaryawan ? 'karyawan' : 'anggota';
    var redeemed = [];
    var skipped = [];
    var extRowValues = {};
    var redeemedKodes = [];
    kodes.forEach(function (kode) {
      var v = null;
      for (var i = 0; i < res.list.length; i++) {
        if (String(res.list[i].Kode) === kode) { v = res.list[i]; break; }
      }
      if (!v || String(v.Status) !== 'Active') { skipped.push(kode); return; }
      if (isKaryawan && !nipMatch_(String(v.NIP || ''), String(data.no || ''))) { skipped.push(kode); return; }
      var row = Number(v.Row) || 0;
      if (row > 0) extRowValues[row] = 'Used';
      redeemedKodes.push(kode);
      var no = isKaryawan ? String(v.NIP || data.no || '') : String(v.NoAnggota || data.no || '');
      redeemed.push({ v: v, kode: kode, no: no });
    });
    if (!redeemed.length) return getErrorObj_('Tidak ada voucher Active yang bisa diredeem.' + (skipped.length ? ' Diblokir: ' + skipped.join(', ') : ''));
    _perf.cekNota = Date.now() - _seg;
    perf_('redeem2 cekPemegang+nota', _seg);
    _seg = Date.now();

    // Buka batch custom tulis mirror lokal (voucher/piutang/mutasi) supaya
    // semua jadi SATU panggilan REST ke workbook SPARTA.
    mirrorBatchBegin_();

    // Perbarui status voucher eksternal & mirror SPARTA secara batch (1-2 setValues).
    if (sheetsApiProbe_()) {
      setStatusExtBatch_(conf.spreadsheetId, conf.sheetName, statusCol, extRowValues);
    } else {
      var _shV = SpreadsheetApp.openById(conf.spreadsheetId).getSheetByName(conf.sheetName) || SpreadsheetApp.openById(conf.spreadsheetId).getSheets()[0];
      setColBatch_(_shV, statusCol, extRowValues);
    }
    mirrorSetCellsBulk_(kind, 'voucher', 'Kode', 'Status', redeemedKodes, 'Used');
    _perf.statusWrite = Date.now() - _seg;
    perf_('redeem3 statusWrite', _seg);
    _seg = Date.now();

    // ID mutasi dihitung sekali lalu dinaikkan berurutan (hindari N kali scan sheet mutasi).
    var idTrxList = [];
    var firstId = nextMutasiId_(kind, 'RVP', tanggal);
    var mt = String(firstId).match(/^(.*?)(\d+)$/);
    var baseTrx = mt ? mt[1] : firstId;
    var baseSeq = mt ? parseInt(mt[2], 10) : 1;
    var padSize = mt ? Math.max(mt[2].length, 4) : 4;
    redeemed.forEach(function (item, idx) {
      var idTrx = baseTrx + pad_(baseSeq + idx, padSize);
      item.idTrx = idTrx;
      idTrxList.push(idTrx);
    });
    _perf.idGen = Date.now() - _seg;
    perf_('redeem4 idGen', _seg);
    _seg = Date.now();
    var piutangMsg = '';
    var piutangId = '';
    var piutangNominal = 0;
    var p = data.piutang || {};
    if (p.catat) {
      var pJumlah = cleanNum_(p.Jumlah);
      piutangNominal = pJumlah;
      if (pJumlah > 0) {
        if (isKaryawan) {
          var rk = catatPiutangKaryawanExt({
            token: String(data.token || '').trim(),
            _u: u,
            No: String(data.no || '').trim(),
            Nominal: pJumlah,
            Nota: String(p.Nota || '').trim(),
            Tanggal: String(tanggal || '').trim()
          }, true);
          if (rk.ok) {
            piutangId = rk.ID;
            piutangMsg = ' Kredit ' + rk.ID + ' juga dicatat.';
          } else piutangMsg = ' Catat kredit gagal: ' + rk.message;
        } else {
          var ra = catatPiutangAnggotaExt({
            token: String(data.token || '').trim(),
            _u: u,
            No: String(data.no || '').trim(),
            Nominal: pJumlah,
            Nota: String(p.Nota || '').trim(),
            Tanggal: String(tanggal || '').trim()
          }, true);
          if (ra.ok) {
            piutangId = ra.ID;
            piutangMsg = ' Kredit ' + ra.ID + ' juga dicatat.';
          } else piutangMsg = ' Catat kredit gagal: ' + ra.message;
        }
      }
    }

    _perf.catat = Date.now() - _seg;
    perf_('redeem5 catat', _seg);
    _seg = Date.now();
    var mutasiMsg = '';
    var mRes = appendMutasiRedeemBulk_(kind, u, redeemed, tanggal, notaLengkap, piutangId);
    if (!mRes.ok) mutasiMsg = ' Mutasi gagal: ' + mRes.message + '.';
    _perf.appendMutasi = Date.now() - _seg;
    perf_('redeem6 appendMutasi', _seg);
    mirrorBatchCommit_();
    _seg = Date.now();

    var items = redeemed.map(function (item) {
      return { Kode: item.kode, Label: String(item.v.Label || ''), Nilai: cleanNum_(item.v.Nilai) };
    });
    var total = items.reduce(function (s, it) { return s + it.Nilai; }, 0);
    var holder = redeemed[0].v;
    var nama = String(holder.Nama || '');
    var no = redeemed[0].no;
    var kelompok = isKaryawan ? String(holder.Bagian || holder.Unit || '') : String(holder.Kelompok || '');
    if (isKaryawan) {
      var mk = cariPemegangFallbackKaryawan_(no);
      if (mk) {
        nama = String(mk.Nama && mk.Nama !== '(tidak terdaftar)' ? mk.Nama : nama);
        no = String(mk.NIP || no);
        kelompok = String(mk.Bagian || kelompok);
      }
    }

    var struk = {
      id: idTrxList.join(', '),
      ids: idTrxList,
      jumlah: redeemed.length,
      tanggal: tanggal,
      nota: notaLengkap,
      jenis: isKaryawan ? 'Karyawan' : 'Anggota',
      nama: nama,
      no: no,
      kelompok: kelompok,
      toko: getTokoSesi_(u),
      petugas: String(u.Username || ''),
      items: items,
      total: total,
      piutangId: piutangId,
      piutangNominal: piutangNominal
    };
    var wa = buildStrukWa_(isKaryawan ? 'karyawan' : 'anggota', struk);
    struk.waUrl = wa.ok ? wa.url : '';
    struk.waTel = wa.ok ? wa.tel : '';
    struk.waMsg = wa.ok ? wa.pesan : '';

    // Segarkan cache hasil transaksi secara in-place (tanpa membuang cache
    // lain seperti ANGGOTA/USERS/piutang/voucher yang tidak berubah),
    // agar load halaman berikutnya cepat (tidak baca ulang dari nol).
    var extVoucherKey = 'voucher_' + conf.spreadsheetId + '_' + (conf.sheetName || 'Voucher');
    patchVoucherCacheCompact_(extVoucherKey, 43200, function (list) {
      var s = {};
      redeemedKodes.forEach(function (k) { s[String(k || '').trim().replace(/^'/, '').replace(/^0+/, '')] = true; });
      list.forEach(function (item) {
        var c = String(item.Kode || '').trim().replace(/^'/, '').replace(/^0+/, '');
        if (s[c]) item.Status = 'Used';
      });
    });
    try {
      delete MEM_CACHE_[extVoucherKey];
      delete MEM_CACHE_[CACHE_DEF.TRX.key];
      cacheRemoveBig_(CACHE_DEF.TRX.key);
      cacheRemoveBig_('vstats_' + VOUCHER_SPREADSHEET_ID);
    } catch (e) {}
    _perf.patchCache = Date.now() - _seg;
    perf_('redeem7 patchCache+remove', _seg);
    perf_('redeem TOTAL', _tStart);
return {
      ok: true,
      message: redeemed.length + ' voucher diredeem.' + (skipped.length ? ' Dilewati (bukan Active): ' + skipped.join(', ') + '.' : '') + piutangMsg + mutasiMsg,
      piutangId: piutangId,
      piutangNominal: piutangNominal,
      struk: struk,
      ms: Date.now() - _tStart,
      perf: _perf
    };
  } catch (e) {
    return getErrorObj_('Gagal redeem voucher: ' + e.message);
  } finally {
    if (_mirrorBatch_ && _mirrorBatch_.data.length) mirrorBatchCommit_();
    lock.releaseLock();
  }
}

/** ------------------------------------------------------------------ */
/** LAPORAN & DASHBOARD                                                */
/** ------------------------------------------------------------------ */

function getDashboardData(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var bln = String(data.bulan || '').trim();
  if (!/^\d{4}-\d{2}$/.test(bln)) bln = bulanKey_(new Date());
  var anggota = getAnggotaCache_();
  var resPa = readPiutangAnggotaExt_();
  var piutang = (resPa && resPa.ok ? resPa.list : []).filter(function (p) {
    return cocokToko_(u, p) && bulanKey_(String(p.Waktu || '')) === bln;
  });
  var trx = getTrxCache_().filter(function (t) {
    return cocokToko_(u, t) && bulanKey_(String(t.TanggalRedeem || '')) === bln;
  });

  var resK = readDataKaryawan_();
  var karyawan = (resK && resK.ok ? resK.list : []);
  var resPk = readPiutangKaryawanExt_();
  var piutangKaryawan = (resPk && resPk.ok ? resPk.list : []).filter(function (p) {
    return cocokToko_(u, p) && bulanKey_(String(p.Waktu || '')) === bln;
  });

  var kmap = {};
  karyawan.forEach(function (k) {
    [k.NIPBaru, k.NIPLama].forEach(function (nip) {
      nip = String(nip || '').trim();
      if (nip) kmap[nip] = k;
    });
  });

  var amap = {};
  anggota.forEach(function (a) { amap[String(a.NoAnggota)] = a; });

  // ----- Anggota -----
  var totalAnggota = anggota.length;
  var anggotaAktif = anggota.filter(function (a) { return String(a.Status) === 'Aktif'; }).length;
  var piutangLunas = piutang.filter(function (p) { return !!String(p.Verifikasi || '').trim(); });
  var piutangBelum = piutang.filter(function (p) { return !String(p.Verifikasi || '').trim(); });
  var totalPiutangBeredar = piutangBelum.reduce(function (sum, p) { return sum + cleanNum_(p.Nominal); }, 0);
  var totalPiutangLunas = piutangLunas.reduce(function (sum, p) { return sum + cleanNum_(p.Nominal); }, 0);
  var jumlahPiutang = piutang.length;
  var jumlahLunas = piutangLunas.length;
  var jumlahBelumLunas = piutangBelum.length;

  // ----- Karyawan -----
  var totalKaryawan = karyawan.length;
  var karyawanAktif = karyawan.filter(isKaryawanAktif_).length;
  var totalPiutangKaryawan = piutangKaryawan.reduce(function (sum, p) { return sum + cleanNum_(p.Nominal); }, 0);
  var jumlahPiutangKaryawan = piutangKaryawan.length;

  // ----- Transaksi (redeem dipisah per jenis, tren digabung) -----
  var totalRedeem = 0;
  var totalRedeemKaryawan = 0;
  trx.forEach(function (t) {
    var val = cleanNum_(t.JumlahRedeem);
    if (String(t.Jenis || 'Anggota') === 'Karyawan') totalRedeemKaryawan += val;
    else totalRedeem += val;
  });

  // ----- Tren & terbaru dari Mutasi (log redeem voucher dari SPARTA Kasir) -----
  var mutasiAnggota = mutasiCore_('anggota', u, { full: true });
  var mutasiKaryawan = mutasiCore_('karyawan', u, { full: true });
  var mutasiAll = (mutasiAnggota.list || []).map(function (m) {
    return { Waktu: m.Waktu, KodeVoucher: m.KodeVoucher, Nama: m.Nama, NoAnggota: m.NoAnggota, Nilai: m.Nilai, Kelompok: m.Kelompok, Jenis: 'Anggota' };
  }).concat((mutasiKaryawan.list || []).map(function (m) {
    return { Waktu: m.Waktu, KodeVoucher: m.KodeVoucher, Nama: m.Nama, NoAnggota: m.NIP, Nilai: m.Nilai, Kelompok: m.Kelompok, Jenis: 'Karyawan' };
  }));
  mutasiAll.sort(function (a, b) { return String(b.Waktu || '').localeCompare(String(a.Waktu || '')); });

  var tanggalUnik = {};
  mutasiAll.forEach(function (m) {
    var d = bulanKey_(m.Waktu || '');
    if (d) tanggalUnik[d] = (tanggalUnik[d] || 0) + 1;
  });
  var trend = Object.keys(tanggalUnik).sort().map(function (bulan) {
    return { bulan: bulan, total: tanggalUnik[bulan] };
  });

  // ----- Voucher (ringkasan dari sheet voucher) -----
  var vocA = getVoucherSummary();
  var vocK = getKaryawanVoucherSummary();
  var totalVoucher = vocA.total || 0;
  var usedVoucher = trx.filter(function (t) { return String(t.Jenis || 'Anggota') !== 'Karyawan'; }).length;
  var totalVoucherKaryawan = vocK.total || 0;
  var usedVoucherKaryawan = trx.filter(function (t) { return String(t.Jenis || 'Anggota') === 'Karyawan'; }).length;

  var kreditor = {};
  piutang.forEach(function (p) {
    var val = cleanNum_(p.Nominal);
    var noA = String(p.NoAnggota || '').trim();
    if (val > 0 && noA) {
      var keyA = 'A:' + noA;
      kreditor[keyA] = kreditor[keyA] || { Ident: noA, Nama: '', total: 0, jumlah: 0, jenis: 'Anggota' };
      var a = amap[noA];
      kreditor[keyA].Nama = a ? a.Nama : '(tidak terdaftar)';
      kreditor[keyA].total += val;
      kreditor[keyA].jumlah += 1;
    }
  });
  piutangKaryawan.forEach(function (p) {
    var val = cleanNum_(p.Nominal);
    var nip = String(p.NIP || '').trim();
    if (val > 0 && nip) {
      var keyK = 'K:' + nip;
      kreditor[keyK] = kreditor[keyK] || { Ident: nip, Nama: '', total: 0, jumlah: 0, jenis: 'Karyawan' };
      var k = kmap[nip];
      kreditor[keyK].Nama = k ? k.NamaLengkap : '(tidak terdaftar)';
      kreditor[keyK].total += val;
      kreditor[keyK].jumlah += 1;
    }
  });

  var terbaru = mutasiAll.filter(function (m) { return bulanKey_(m.Waktu) === bln; }).slice(0, 5).map(function (m) {
    var waktuStr = m.Waktu instanceof Date
      ? Utilities.formatDate(m.Waktu, getTimeZone_(), 'yyyy-MM-dd HH:mm')
      : String(m.Waktu || '');
    return { ID: m.KodeVoucher, IDPiutang: m.KodeVoucher, NoAnggota: m.NoAnggota, Nama: m.Nama, Jenis: m.Jenis, TanggalRedeem: waktuStr, JumlahRedeem: cleanNum_(m.Nilai) };
  });

  return {
    bulan: bln,
    totalAnggota: totalAnggota,
    anggotaAktif: anggotaAktif,
    totalPiutangBeredar: Math.round(totalPiutangBeredar * 100) / 100,
    totalPiutangLunas: Math.round(totalPiutangLunas * 100) / 100,
    jumlahPiutang: jumlahPiutang,
    jumlahLunas: jumlahLunas,
    jumlahBelumLunas: jumlahBelumLunas,
    totalRedeem: Math.round(totalRedeem * 100) / 100,
    usedVoucher: usedVoucher,
    totalVoucher: totalVoucher,
    totalKaryawan: totalKaryawan,
    karyawanAktif: karyawanAktif,
    totalPiutangKaryawan: Math.round(totalPiutangKaryawan * 100) / 100,
    jumlahPiutangKaryawan: jumlahPiutangKaryawan,
    totalRedeemKaryawan: Math.round(totalRedeemKaryawan * 100) / 100,
    usedVoucherKaryawan: usedVoucherKaryawan,
    totalVoucherKaryawan: totalVoucherKaryawan,
    trend: trend,
    topKreditor: Object.keys(kreditor).map(function (k) { return kreditor[k]; })
      .sort(function (a, b) { return b.total - a.total; }).slice(0, 5),
    terbaru: terbaru
  };
}

function piutangEffektif_(piutang) {
  return piutang.filter(function (p) {
    return String(p.Status) !== 'Lunas';
  });
}

function getLaporanData(data) {
  data = data || {};
  var kind = data.kind === 'karyawan' ? 'karyawan' : 'anggota';
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  var fromS = data.from || '1900-01-01';
  var toS = data.to || '2100-12-31';
  var trx = getTrxCache_().filter(function (t) {
    if (!cocokToko_(u, t)) return false;
    var jenis = String(t.Jenis || 'Anggota');
    if (kind === 'karyawan' ? jenis !== 'Karyawan' : jenis === 'Karyawan') return false;
    var d = String(t.TanggalRedeem || '');
    return d >= fromS && d <= toS;
  });
  var piutang;
  if (kind === 'karyawan') {
    var resK = readPiutangKaryawanExt_();
    piutang = (resK && resK.ok ? resK.list : []).filter(function (p) {
      if (!cocokToko_(u, p)) return false;
      var d = String(p.Waktu || '');
      return d >= fromS && d <= toS;
    });
  } else {
    var resA = readPiutangAnggotaExt_();
    piutang = (resA && resA.ok ? resA.list : []).filter(function (p) {
      if (!cocokToko_(u, p)) return false;
      var d = String(p.Waktu || '');
      return d >= fromS && d <= toS;
    });
  }

  // ----- KPI: piutang (tercatat / lunas / beredar) -----
  var totalPiutang = 0;
  var jumlahPiutang = 0;
  var totalLunas = 0;
  var jumlahLunas = 0;
  var totalBeredar = 0;
  var jumlahBeredar = 0;
  piutang.forEach(function (p) {
    var v = cleanNum_(p.Nominal);
    totalPiutang += v;
    jumlahPiutang += 1;
    if (String(p.Verifikasi || '').trim()) { totalLunas += v; jumlahLunas += 1; }
    else { totalBeredar += v; jumlahBeredar += 1; }
  });

  var totalRedeem = trx.reduce(function (s, t) { return s + cleanNum_(t.JumlahRedeem); }, 0);
  var jumlahTrx = trx.length;

  // ----- Analisis per metode bayar -----
  var perMetode = {};
  trx.forEach(function (t) {
    var m = String(t.MetodeBayar || 'Tunai');
    perMetode[m] = (perMetode[m] || 0) + cleanNum_(t.JumlahRedeem);
  });

  // ----- Tren bulanan: piutang tercatat vs lunas vs redeem -----
  var trenMap = {};
  piutang.forEach(function (p) {
    var b = bulanKey_(p.Waktu);
    if (!b) return;
    if (!trenMap[b]) trenMap[b] = { bulan: b, tercatat: 0, lunas: 0, beredar: 0, redeem: 0, jumlah: 0 };
    var v = cleanNum_(p.Nominal);
    trenMap[b].tercatat += v;
    trenMap[b].jumlah += 1;
    if (String(p.Verifikasi || '').trim()) trenMap[b].lunas += v;
    else trenMap[b].beredar += v;
  });
  trx.forEach(function (t) {
    var b = bulanKey_(t.TanggalRedeem);
    if (!b) return;
    if (!trenMap[b]) trenMap[b] = { bulan: b, tercatat: 0, lunas: 0, beredar: 0, redeem: 0, jumlah: 0 };
    trenMap[b].redeem += cleanNum_(t.JumlahRedeem);
  });
  var tren = Object.keys(trenMap).sort().map(function (k) { return trenMap[k]; });

  // ----- Analisis per toko (piutang) -----
  var tokoMap = {};
  piutang.forEach(function (p) {
    var t = String(p.Toko || '-').trim() || '-';
    if (!tokoMap[t]) tokoMap[t] = { toko: t, tercatat: 0, lunas: 0, beredar: 0, jumlah: 0 };
    var v = cleanNum_(p.Nominal);
    tokoMap[t].tercatat += v;
    tokoMap[t].jumlah += 1;
    if (String(p.Verifikasi || '').trim()) tokoMap[t].lunas += v;
    else tokoMap[t].beredar += v;
  });
  var perToko = Object.keys(tokoMap).map(function (k) { return tokoMap[k]; })
    .sort(function (a, b) { return b.beredar - a.beredar; });

  // ----- Rekap voucher (kind ini) -----
  var voucher = kind === 'karyawan' ? getKaryawanVoucherSummary() : getVoucherSummary();
  var voucherRek = {
    total: voucher.total || 0,
    aktif: voucher.active || 0,
    used: voucher.used || 0,
    diblokir: voucher.diblokir || 0,
    nilaiAktif: voucher.nilaiActive || 0
  };
  var voucherRasio = voucherRek.total ? Math.round((voucherRek.used / voucherRek.total) * 100) : 0;

  // ----- Top piutang beredar per anggota/karyawan -----
  var anggota = getAnggotaCache_();
  var amap = {};
  anggota.forEach(function (a) { amap[String(a.NoAnggota)] = a; });
  var kmap = {};
  var karyawanRes = readDataKaryawan_();
  var karyawanList = (karyawanRes && karyawanRes.ok ? karyawanRes.list : []);
  karyawanList.forEach(function (k) {
    var nm = String(k.NamaLengkap || '');
    if (String(k.NIPBaru)) kmap[String(k.NIPBaru)] = nm;
    if (String(k.NIPLama)) kmap[String(k.NIPLama)] = nm;
  });
  var topMap = {};
  piutang.forEach(function (p) {
    if (String(p.Verifikasi || '').trim()) return;
    var ident = kind === 'karyawan' ? String(p.NIP || '') : String(p.NoAnggota || '');
    if (!ident) return;
    if (!topMap[ident]) topMap[ident] = { ident: ident, nama: '', total: 0, jumlah: 0, jenis: kind === 'karyawan' ? 'Karyawan' : 'Anggota' };
    if (kind === 'karyawan') topMap[ident].nama = kmap[ident] || '';
    else topMap[ident].nama = (amap[ident] && amap[ident].Nama) || '';
    topMap[ident].total += cleanNum_(p.Nominal);
    topMap[ident].jumlah += 1;
  });
  var topBeredar = Object.keys(topMap).map(function (k) { return topMap[k]; })
    .sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

  // ----- Rekomendasi otomatis (analisis untuk langkah berikutnya) -----
  var rekom = [];
  if (jumlahBeredar > 0) {
    rekom.push({ ikon: 'bi-exclamation-triangle', teks: 'Masih ada <b>' + jumlahBeredar + ' kredit beredar</b> senilai ' + formatRupiah_(totalBeredar) + ' (' + (totalPiutang ? Math.round((totalBeredar / totalPiutang) * 100) : 0) + '% dari total).' });
  } else if (jumlahPiutang > 0) {
    rekom.push({ ikon: 'bi-check-circle', teks: 'Semua kredit pada periode ini sudah terverifikasi lunas.' });
  }
  if (topBeredar.length) {
    rekom.push({ ikon: 'bi-person-lines-fill', teks: 'Prioritas tagih: <b>' + (topBeredar[0].nama || topBeredar[0].ident) + '</b> (' + formatRupiah_(topBeredar[0].total) + ').' });
  }
  var tokoPrioritas = perToko[0];
  if (tokoPrioritas && tokoPrioritas.beredar > 0) {
    rekom.push({ ikon: 'bi-shop', teks: 'Kredit beredar terbesar di toko <b>' + tokoPrioritas.toko + '</b> (' + formatRupiah_(tokoPrioritas.beredar) + ').' });
  }
  if (voucherRek.aktif > 0 && voucherRek.total > 0) {
    rekom.push({ ikon: 'bi-ticket-perforated', teks: 'Pemanfaatan voucher ' + voucherRasio + '% (' + voucherRek.used + '/' + voucherRek.total + ' dipakai, ' + voucherRek.aktif + ' masih aktif).' });
  }
  if (tren.length >= 2) {
    var bl = tren[tren.length - 1];
    var bl2 = tren[tren.length - 2];
    if (bl && bl2 && bl.tercatat > bl2.tercatat) {
      rekom.push({ ikon: 'bi-graph-up-arrow', teks: 'Kredit baru naik bulan <b>' + bl.bulan + '</b> (' + formatRupiah_(bl.tercatat) + ') dibanding bulan sebelumnya.' });
    }
  }
  if (totalRedeem > 0) {
    rekom.push({ ikon: 'bi-cash-stack', teks: 'Total redeem periode ini <b>' + formatRupiah_(totalRedeem) + '</b> dari ' + jumlahTrx + ' transaksi' + (jumlahBeredar > 0 ? '.' : ' (kredit bersih).') });
  }
  if (!rekom.length) rekom.push({ ikon: 'bi-info-circle', teks: 'Belum ada data pada periode ini.' });

  var sorted = sortBy_(trx, 'TanggalRedeem', true);
  var r;
  if (data.full) {
    var fSize = Math.max(parseInt(data.pageSize, 10) || 25, 1);
    r = { ok: true, list: sorted, total: sorted.length, page: 1, pages: Math.max(Math.ceil(sorted.length / fSize), 1), pageSize: fSize };
  } else {
    r = pageResult_(sorted, data.page, data.pageSize);
  }

  return {
    ok: true,
    kind: kind,
    totalPiutang: Math.round(totalPiutang * 100) / 100,
    jumlahPiutang: jumlahPiutang,
    totalLunas: Math.round(totalLunas * 100) / 100,
    jumlahLunas: jumlahLunas,
    totalBeredar: Math.round(totalBeredar * 100) / 100,
    jumlahBeredar: jumlahBeredar,
    totalRedeem: Math.round(totalRedeem * 100) / 100,
    jumlahTrx: jumlahTrx,
    tren: tren,
    perToko: perToko,
    perMetode: Object.keys(perMetode).map(function (m) { return { metode: m, total: perMetode[m] }; }),
    voucher: voucherRek,
    voucherRasio: voucherRasio,
    topBeredar: topBeredar,
    rekomendasi: rekom,
    trx: r.list,
    total: r.total,
    page: r.page,
    pages: r.pages,
    pageSize: r.pageSize
  };
}

/** ------------------------------------------------------------------ */
/** LAPORAN VOUCHER ANGGOTA (rekap lembar & nilai voucher per anggota) */
/** ------------------------------------------------------------------ */

function statusVoucherRekap_(v, today) {
  var s = String(v.Status || '').toLowerCase();
  if (s === 'used') return 'used';
  var d = parseDateStr_(v.ExpDate);
  if (d && d < today) return 'expired';
  return 'active';
}

function parseDateStr_(s) {
  s = String(s || '').trim();
  if (!s) return '';
  var iso = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (iso) return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);
  var d = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (d) return d[3] + '-' + ('0' + d[2]).slice(-2) + '-' + ('0' + d[1]).slice(-2);
  return '';
}

function emptyLaporanVoucherSummary_() {
  return {
    anggota: 0,
    used: 0, active: 0, expired: 0, activeExpired: 0,
    nilaiUsed: 0, nilaiActive: 0, nilaiExpired: 0, nilaiActiveExpired: 0
  };
}

function getLaporanVoucherAnggota(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return { ok: false, message: 'Sesi berakhir. Silakan login kembali.', list: [], total: 0, page: 1, pages: 1, pageSize: 0, summary: emptyLaporanVoucherSummary_(), kelompok: [] };

  var res = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  if (!res.ok) return { ok: false, message: res.message, list: [], total: 0, page: 1, pages: 1, pageSize: 0, summary: emptyLaporanVoucherSummary_(), kelompok: [] };

  var da = readDataAnggotaExt_();
  var amap = {};
  if (da && da.ok) da.list.forEach(function (a) {
    var no = String(a.NoAnggota || '');
    if (no && !amap[no]) amap[no] = a;
  });

  var paket = {};
  var today = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd');
  (res.list || []).forEach(function (v) {
    var rawNo = formatCell_(v.NoAnggota);
    var no = rawNo.replace(/^A/i, '');
    if (!no) return;
    var src = amap[no] || amap['A' + no] || amap[rawNo] || {};
    var p = paket[no] || {
      NoAnggota: formatCell_(src.NoAnggota || rawNo || no),
      Nama: formatCell_(src.Nama || v.Nama),
      NIP: formatCell_(src.NIP),
      Kelompok: formatCell_(src.Kelompok || v.Kelompok),
      used: 0, active: 0, expired: 0,
      nilaiUsed: 0, nilaiActive: 0, nilaiExpired: 0
    };
    if (!p.Nama) p.Nama = formatCell_(v.Nama);
    if (!p.Kelompok) p.Kelompok = formatCell_(v.Kelompok);
    var kat = statusVoucherRekap_(v, today);
    var nilai = cleanNum_(v.Nilai);
    if (kat === 'used') { p.used += 1; p.nilaiUsed += nilai; }
    else if (kat === 'active') { p.active += 1; p.nilaiActive += nilai; }
    else if (kat === 'expired') { p.expired += 1; p.nilaiExpired += nilai; }
    paket[no] = p;
  });

  var group = Object.keys(paket).map(function (no) {
    var p = paket[no];
    return {
      NoAnggota: p.NoAnggota,
      Nama: p.Nama,
      NIP: p.NIP,
      Kelompok: p.Kelompok,
      used: p.used,
      active: p.active,
      expired: p.expired,
      activeExpired: p.active + p.expired,
      nilaiUsed: Math.round(p.nilaiUsed * 100) / 100,
      nilaiActive: Math.round(p.nilaiActive * 100) / 100,
      nilaiExpired: Math.round(p.nilaiExpired * 100) / 100,
      nilaiActiveExpired: Math.round((p.nilaiActive + p.nilaiExpired) * 100) / 100
    };
  });

  var search = String(data.search || '').toLowerCase().trim();
  var kelompok = String(data.kelompok || 'semua');
  var optSet = {};
  group.forEach(function (r) { if (r.Kelompok) optSet[r.Kelompok] = true; });
  group = group.filter(function (r) {
    if (kelompok && kelompok !== 'semua' && r.Kelompok !== kelompok) return false;
    return !search || fieldsMatch_(r, ['NoAnggota', 'Nama', 'NIP', 'Kelompok'], search);
  });
  group = sortBy_(group, 'NoAnggota');

  var summary = emptyLaporanVoucherSummary_();
  summary.anggota = group.length;
  group.forEach(function (r) {
    summary.used += r.used;
    summary.active += r.active;
    summary.expired += r.expired;
    summary.activeExpired += r.activeExpired;
    summary.nilaiUsed += r.nilaiUsed;
    summary.nilaiActive += r.nilaiActive;
    summary.nilaiExpired += r.nilaiExpired;
    summary.nilaiActiveExpired += r.nilaiActiveExpired;
  });
  summary.nilaiUsed = Math.round(summary.nilaiUsed * 100) / 100;
  summary.nilaiActive = Math.round(summary.nilaiActive * 100) / 100;
  summary.nilaiExpired = Math.round(summary.nilaiExpired * 100) / 100;
  summary.nilaiActiveExpired = Math.round(summary.nilaiActiveExpired * 100) / 100;

  var size = Math.max(parseInt(data.pageSize, 10) || 25, 1);
  var r = data.full
    ? { ok: true, list: group, total: group.length, page: 1, pages: Math.max(Math.ceil(group.length / size), 1), pageSize: size }
    : pageResult_(group, data.page, data.pageSize);

  r.message = res.message;
  r.summary = summary;
  r.kelompok = Object.keys(optSet).sort();
  return r;
}

/** ------------------------------------------------------------------ */
/** LAPORAN PROGRAM WAJIB BELANJA ANGGOTA (rekap bulanan + per outlet) */
/** ------------------------------------------------------------------ */

function getLaporanWajibBelanja(data) {
  data = data || {};
  var u = validasiSesi(String(data.token || '').trim());
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');

  var voucherRes = readMirrorSheet_('anggota', 'voucher', normalizeVoucher_, 'voucher anggota');
  if (!voucherRes.ok) return getErrorObj_(voucherRes.message);
  var mutasiRes = readMirrorSheet_('anggota', 'mutasi', normalizeMutasiAnggota_, 'mutasi anggota');
  if (!mutasiRes.ok) return getErrorObj_(mutasiRes.message);

  var tahun = parseInt(data.tahun, 10);
  if (!tahun) tahun = new Date().getFullYear();
  var tahunPf = String(tahun) + '-';

  var issuer = {};
  var bulanSet = {};
  (voucherRes.list || []).forEach(function (v) {
    var kode = normalizeKodeVoucher_(v.Kode);
    var bln = bulanKey_(v.AktifMulai);
    if (!kode || !bln || bln.indexOf(tahunPf) !== 0) return;
    issuer[kode] = { bulan: bln, nilai: cleanNum_(v.Nilai) };
    bulanSet[bln] = true;
  });

  var bulanan = {};
  function initBln(b) { if (!bulanan[b]) bulanan[b] = { dJml: 0, dNom: 0, rJml: 0, rNom: 0 }; }
  Object.keys(bulanSet).forEach(initBln);
  Object.keys(issuer).forEach(function (k) {
    var it = issuer[k];
    initBln(it.bulan);
    bulanan[it.bulan].dJml += 1;
    bulanan[it.bulan].dNom += it.nilai;
  });

  var unmatched = 0;
  var lastDate = '';
  (mutasiRes.list || []).forEach(function (m) {
    var bln = bulanKey_(m.Waktu);
    var kode = normalizeKodeVoucher_(m.KodeVoucher);
    var it = issuer[kode];
    var b = it ? it.bulan : bln;
    if (!b || b.indexOf(tahunPf) !== 0) return;
    if (!it) unmatched += 1;
    initBln(b);
    bulanan[b].rJml += 1;
    bulanan[b].rNom += cleanNum_(m.Nilai);
    var dd = parseDateStr_(m.Waktu);
    if (dd && dd > lastDate) lastDate = dd;
  });

  var today = Utilities.formatDate(new Date(), getTimeZone_(), 'yyyy-MM-dd');
  var dataUpdate = lastDate && lastDate > today ? lastDate : today;

  var rows = Object.keys(bulanan).sort().map(function (b) {
    var x = bulanan[b];
    return {
      bulan: b,
      diterbitkanJml: x.dJml,
      diterbitkanNominal: Math.round(x.dNom * 100) / 100,
      redeemJml: x.rJml,
      redeemNominal: Math.round(x.rNom * 100) / 100,
      sisaJml: x.dJml - x.rJml,
      sisaNominal: Math.round((x.dNom - x.rNom) * 100) / 100,
      persen: x.dNom > 0 ? Math.round((x.rNom / x.dNom) * 100) : 0
    };
  });

  var total = { diterbitkanJml: 0, diterbitkanNominal: 0, redeemJml: 0, redeemNominal: 0, sisaJml: 0, sisaNominal: 0 };
  rows.forEach(function (r) {
    total.diterbitkanJml += r.diterbitkanJml;
    total.diterbitkanNominal += r.diterbitkanNominal;
    total.redeemJml += r.redeemJml;
    total.redeemNominal += r.redeemNominal;
    total.sisaJml += r.sisaJml;
    total.sisaNominal += r.sisaNominal;
  });
  total.diterbitkanNominal = Math.round(total.diterbitkanNominal * 100) / 100;
  total.redeemNominal = Math.round(total.redeemNominal * 100) / 100;
  total.sisaNominal = Math.round(total.sisaNominal * 100) / 100;
  total.persen = total.diterbitkanNominal > 0 ? Math.round((total.redeemNominal / total.diterbitkanNominal) * 100) : 0;

  var outlet = {};
  (mutasiRes.list || []).forEach(function (m) {
    var bln = bulanKey_(m.Waktu);
    if (bln.indexOf(tahunPf) !== 0) return;
    var nama = String(m.Toko || '').trim() || '(Outlet tidak terisi)';
    var o = outlet[nama] || { nominal: 0, jml: 0 };
    o.nominal += cleanNum_(m.Nilai);
    o.jml += 1;
    outlet[nama] = o;
  });
  var outletList = Object.keys(outlet).map(function (n) {
    return { outlet: n, nominal: Math.round(outlet[n].nominal * 100) / 100, jml: outlet[n].jml };
  }).sort(function (a, b) { return b.nominal - a.nominal; });
  var outletTotal = { nominal: 0, jml: 0 };
  outletList.forEach(function (o) { outletTotal.nominal += o.nominal; outletTotal.jml += o.jml; });
  outletTotal.nominal = Math.round(outletTotal.nominal * 100) / 100;

  var tahunList = {};
  (voucherRes.list || []).forEach(function (v) {
    var b = bulanKey_(v.AktifMulai);
    if (b) tahunList[b.slice(0, 4)] = true;
  });
  (mutasiRes.list || []).forEach(function (m) {
    var b = bulanKey_(m.Waktu);
    if (b) tahunList[b.slice(0, 4)] = true;
  });

  var msg = 'Rekap per ' + Utilities.formatDate(new Date(), getTimeZone_(), 'dd/MM/yyyy');
  if (unmatched) msg += '. Sebanyak ' + unmatched + ' redeem tanpa voucher induk dikelompokkan ke bulan redeem-nya.';

  return {
    ok: true,
    message: msg,
    tahun: Object.keys(tahunList).sort().reverse(),
    tahunPilih: String(tahun),
    dataUpdate: dataUpdate,
    bulanan: rows,
    bulananTotal: total,
    outlet: outletList,
    outletTotal: outletTotal
  };
}

/** ------------------------------------------------------------------ */
/** DATA CONTOH (uji coba)                                             */
/** ------------------------------------------------------------------ */

function tambahDataContoh() {
  var contoh = [
    { Nama: 'Budi Santoso', NoHP: '0812-1111-0001', Alamat: 'Jl. Merdeka No.1' },
    { Nama: 'Siti Rahayu', NoHP: '0812-1111-0002', Alamat: 'Jl. Sudirman No.2' },
    { Nama: 'Agus Wijaya', NoHP: '0812-1111-0003', Alamat: 'Jl. Ahmad Yani No.3' },
    { Nama: 'Dewi Lestari', NoHP: '0812-1111-0004', Alamat: 'Jl. Gatot Subroto No.4' },
    { Nama: 'Rudi Hartono', NoHP: '0812-1111-0005', Alamat: 'Jl. Diponegoro No.5' }
  ];
  contoh.forEach(function (c) { addAnggota(c); });

  var piutangs = [
    { NoAnggota: 'A0001', Uraian: 'Pinjaman Modal Usaha', Jumlah: 5000000 },
    { NoAnggota: 'A0001', Uraian: 'Kebutuhan Sembako', Jumlah: 1200000 },
    { NoAnggota: 'A0002', Uraian: 'Biaya Pendidikan', Jumlah: 3000000 },
    { NoAnggota: 'A0003', Uraian: 'Modal Warung', Jumlah: 2500000 },
    { NoAnggota: 'A0004', Uraian: 'Pengobatan', Jumlah: 1000000 },
    { NoAnggota: 'A0005', Uraian: 'Pinjaman Usaha Ternak', Jumlah: 4000000 }
  ];
  piutangs.forEach(function (p, i) {
    addPiutang({ NoAnggota: p.NoAnggota, Uraian: p.Uraian, Jumlah: p.Jumlah, Tanggal: shiftDate(-i * 10) });
  });

  redeemPiutang({ IDPiutang: 'PIUT-0001', JumlahRedeem: 1000000, MetodeBayar: 'Tunai' });
  redeemPiutang({ IDPiutang: 'PIUT-0002', JumlahRedeem: 500000, MetodeBayar: 'Transfer' });
  redeemPiutang({ IDPiutang: 'PIUT-0002', JumlahRedeem: 700000, MetodeBayar: 'Tunai', TanggalRedeem: shiftDate(-3) });

  SpreadsheetApp.getUi().alert('Data contoh berhasil ditambahkan. Buka aplikasi untuk melihat dashboard.');
}

function shiftDate(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, getTimeZone_(), 'yyyy-MM-dd');
}

/** ------------------------------------------------------------------ */
/** AUTH LOGIN & USER (Sheet: Users)                                    */
/** ------------------------------------------------------------------ */

function seedAdminUser_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return;
    if (sheet.getLastRow() > 1) return pewangiCache_();
    sheet.appendRow(['admin', 'admin', 'KOPINKA SPARTA', 'admin', 'KOPINKA', '']);
    Utilities.sleep(50);
    clearUsersCache_();
  } catch (e) {}
}

function clearUsersCache_() {
  try {
    cacheRemoveBig_(CACHE_DEF.USERS.key);
  } catch (e) {}
}

function getUsersCache_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return [];
  return getObjects_(sheet).map(function (u) {
    u.KodeToko = u.KodeToko !== undefined ? u.KodeToko : u['Kode Toko'];
    u.Role = normRole_(u.Role);
    return u;
  });
}

function normRole_(v) {
  return String(v || '').toLowerCase() === 'admin' ? 'admin' : 'kasir';
}

function login(data) {
  try {
    var username = String(data.Username || '').trim();
    var password = String(data.Password || '');
    if (!username || !password) return getErrorObj_('Username dan password wajib diisi.');

    var users = getUsersCache_();
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].Username).trim() === username) { user = users[i]; break; }
    }
    if (!user) return getErrorObj_('Username tidak terdaftar.');

    var passSheet = String(user.Password || '');
    var verified = (passSheet === password) || (hashPass_(password) === String(passSheet).toLowerCase());
    if (!verified) return getErrorObj_('Password salah.');

    var token = tokenBaru_();
    CacheService.getScriptCache().put('sparta_sesi_' + token, JSON.stringify({ U: username, T: new Date().getTime() }), 21600);
    return {
      ok: true,
      token: token,
      user: {
        Username: username,
        NamaToko: String(user.NamaToko || ''),
        Role: normRole_(user.Role),
        KodeToko: String(user.KodeToko || ''),
        Foto: String(user.Foto || '')
      },
      pesan: 'Selamat datang, ' + username + '!'
    };
  } catch (e) {
    return getErrorObj_('Gagal login: ' + e.message);
  }
}

function tokenBaru_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

function hashPass_(pass) {
  try {
    var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pass));
    var hex = [];
    for (var i = 0; i < raw.length; i++) {
      var b = (raw[i] + 256) % 256;
      hex.push((b < 16 ? '0' : '') + b.toString(16));
    }
    return hex.join('');
  } catch (e) {
    return String(pass);
  }
}

function validasiSesi(token) {
  try {
    if (!token) return null;
    var j = CacheService.getScriptCache().get('sparta_sesi_' + token);
    if (!j) return null;
    var s = JSON.parse(j);
    var users = getUsersCache_();
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].Username).trim() === s.U) {
        return {
          Username: s.U,
          NamaToko: String(users[i].NamaToko || ''),
          Role: normRole_(users[i].Role),
          KodeToko: String(users[i].KodeToko || ''),
          Foto: String(users[i].Foto || '')
        };
      }
    }
  } catch (e) {}
  return null;
}

function getSesi(token) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  u.ok = true;
  return u;
}

function keluarAplikasi(token) {
  try {
    if (token) CacheService.getScriptCache().remove('sparta_sesi_' + token);
  } catch (e) {}
  return { ok: true, pesan: 'Anda telah keluar.' };
}

/** CRUD data Pengguna (halaman admin) */
function getUsersPage(token) {
  var admin = validasiSesi(token);
  if (!admin) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  if (String(admin.Role).toLowerCase() !== 'admin') return getErrorObj_('Anda tidak memiliki akses ke halaman ini.');
  try {
    var users = getUsersCache_().map(function (u) {
      return {
        Username: String(u.Username || ''),
        Role: String(u.Role || 'kasir'),
        NamaToko: String(u.NamaToko || ''),
        KodeToko: String(u.KodeToko || ''),
        Foto: String(u.Foto || '')
      };
    });
    return { ok: true, users: users };
  } catch (e) {
    return getErrorObj_('Gagal memuat pengguna: ' + e.message);
  }
}

function simpanUser(token, data) {
  var admin = validasiSesi(token);
  if (!admin) return getErrorObj_('Sesi berakhir.');
  if (String(admin.Role).toLowerCase() !== 'admin') return getErrorObj_('Hanya admin yang dapat mengelola pengguna.');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return getErrorObj_('Sheet Users belum dibuat. Jalankan Setup Database.');

    var username = String(data.Username || '').trim();
    if (!username) return getErrorObj_('Username wajib diisi.');
    var password = String(data.Password || '');
    if (data.UbahPassword && !password) return getErrorObj_('Password baru wajib diisi.');

    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, KOLOM.USERS.length).getValues() : [];
    var ketemu = false;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === username) {
        var row = i + 2;
        var setPass = data.UbahPassword ? (data.PassHashed ? password : hashPass_(password)) : rows[i][1];
        sheet.getRange(row, 2, 1, KOLOM.USERS.length - 1).setValues([[setPass,
          String(data.NamaToko || rows[i][2]),
          normRole_(data.Role || rows[i][3]),
          String(data.KodeToko || rows[i][4]),
          String(data.Foto || rows[i][5])]]);
        ketemu = true;
        break;
      }
    }
    if (ketemu) {
      clearUsersCache_();
      return { ok: true, pesan: 'Data "' + username + '" berhasil diperbarui.' };
    }

    sheet.appendRow([username, data.PassHashed ? password : hashPass_(password),
      String(data.NamaToko || ''), normRole_(data.Role || 'kasir'), String(data.KodeToko || ''), String(data.Foto || '')]);
    clearUsersCache_();
    return { ok: true, pesan: 'Pengguna "' + username + '" berhasil ditambahkan.' };
  } catch (e) {
    return getErrorObj_('Gagal menyimpan pengguna: ' + e.message);
  }
}

function hapusUser(token, username) {
  var admin = validasiSesi(token);
  if (!admin) return getErrorObj_('Sesi berakhir.');
  if (String(admin.Role).toLowerCase() !== 'admin') return getErrorObj_('Hanya admin yang dapat menghapus pengguna.');
  if (String(admin.Username) === String(username)) return getErrorObj_('Tidak dapat menghapus akun sendiri.');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return getErrorObj_('Sheet Users belum dibuat.');
    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(username)) {
        sheet.deleteRow(i + 2);
        clearUsersCache_();
        return { ok: true, pesan: 'Pengguna "' + username + '" dihapus.' };
      }
    }
    return getErrorObj_('Pengguna tidak ditemukan.');
  } catch (e) {
    return getErrorObj_('Gagal menghapus pengguna: ' + e.message);
  }
}

/** Avatar: upload base64 ke folder Drive, kembalikan fileId */
function uploadAvatar(token, base64) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir.');
  try {
    if (!base64 || base64.indexOf('base64,') < 0) return getErrorObj_('Data foto tidak valid.');
    var parts = base64.split(',');
    var mime = /^data:(image\/[a-z+]+);/.exec(parts[0]);
    if (!mime) return getErrorObj_('Format foto harus berupa image (JPG/PNG).');
    var bytes = Utilities.base64Decode(parts[1]);
    var folder = DriveApp.getFolderById(AVATAR_FOLDER_ID);
    var blob = Utilities.newBlob(bytes, mime[1], 'avatar_' + u.Username + '_' + new Date().getTime() + '.png');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { ok: true, photo: { fileId: file.getId() } };
  } catch (e) {
    return getErrorObj_('Gagal mengunggah foto: ' + e.message);
  }
}

function getAvatar(token, fileId) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir.');
  try {
    if (!fileId) return { ok: true, dataUrl: '' };
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    if (!/^image\//.test(blob.getContentType())) return { ok: true, dataUrl: '' };
    return { ok: true, dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
  } catch (e) {
    return { ok: true, dataUrl: '' };
  }
}

/**
 * Update profil mandiri (tanpa peran admin):
 * - Ganti password (wajib verifikasi password lama)
 * - Ganti foto avatar (base64 data URL)
 * NamaToko/KodeToko/Role tidak dapat diubah sendiri agar filter toko tetap konsisten.
 */
function updateProfil(token, data) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir. Silakan login kembali.');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return getErrorObj_('Sheet Users belum dibuat. Jalankan Setup Database.');

    var username = String(u.Username || '');
    var passwordBaru = String(data.PasswordBaru || '');
    var passwordLama = String(data.PasswordLama || '');
    var foto = String(data.Foto || '');
    if (!passwordBaru && !foto) return getErrorObj_('Tidak ada perubahan yang disimpan.');

    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, KOLOM.USERS.length).getValues() : [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === username) {
        var row = i + 2;
        var newPass = rows[i][1];
        var newFoto = rows[i][5];
        if (passwordBaru) {
          if (!passwordLama) return getErrorObj_('Masukkan password lama untuk mengganti password.');
          if (passwordBaru.length < 4) return getErrorObj_('Password baru minimal 4 karakter.');
          if (passwordBaru === passwordLama) return getErrorObj_('Password baru tidak boleh sama dengan password lama.');
          var passSheet = String(rows[i][1] || '');
          var ok = (passSheet === passwordLama) || (hashPass_(passwordLama) === String(passSheet).toLowerCase());
          if (!ok) return getErrorObj_('Password lama salah.');
          newPass = hashPass_(passwordBaru);
        }
        if (foto && foto.indexOf('data:') === 0) newFoto = foto;
        sheet.getRange(row, 2, 1, KOLOM.USERS.length - 1).setValues([[newPass, rows[i][2], rows[i][3], rows[i][4], String(newFoto)]]);
        clearUsersCache_();
        u.Foto = String(newFoto);
        return { ok: true, pesan: 'Profil Anda berhasil diperbarui.', user: u };
      }
    }
    return getErrorObj_('Akun tidak ditemukan.');
  } catch (e) {
    return getErrorObj_('Gagal memperbarui profil: ' + e.message);
  }
}

/** Menautkan hasil upload avatar ke kolom Foto user */
function pasangFotoUser(token, fileId) {
  var u = validasiSesi(token);
  if (!u) return getErrorObj_('Sesi berakhir.');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return getErrorObj_('Sheet Users belum dibuat.');
    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues() : [];
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(u.Username)) {
        sheet.getRange(i + 2, KOLOM.USERS.indexOf('Foto') + 1).setValue(String(fileId || ''));
        clearUsersCache_();
        u.Foto = String(fileId || '');
        return { ok: true, user: u, pesan: 'Foto profil diperbarui.' };
      }
    }
    return getErrorObj_('Akun tidak ditemukan.');
  } catch (e) {
    return getErrorObj_('Gagal menyimpan foto: ' + e.message);
  }
}

/** DIAGNOSTIK PERFORMA: ukuran sheet/cache + waktu baca. Jalankan di editor Apps Script lalu kirim hasilnya. */
function diagnostik() {
  var lines = ['=== DIAGNOSTIK SPARTA v' + APP_VERSION + ' ==='];
  var t0 = Date.now();
  function idc(label, ssId, sheetName) {
    var id = String(ssId || '').trim();
    if (!id) { lines.push(label + ': TIDAK DIKONFIGURASI'); return; }
    try {
      var ss = SpreadsheetApp.openById(id);
      var sh = ss.getSheetByName(sheetName) || ss.getSheets()[0];
      lines.push(label + ': sheet=' + sh.getName() + ' lastRow=' + sh.getLastRow() + ' lastCol=' + sh.getLastColumn());
    } catch (e) { lines.push(label + ': ERR ' + e.message); }
  }
  idc('VOUCHER anggota', VOUCHER_SPREADSHEET_ID, VOUCHER_SHEET_NAME || 'Voucher');
  idc('VOUCHER karyawan', VOUCHER_KARYAWAN_SPREADSHEET_ID, VOUCHER_KARYAWAN_SHEET_NAME || 'Voucher');
  idc('PIUTANG anggota', PIUTANG_ANGGOTA_SPREADSHEET_ID, PIUTANG_ANGGOTA_SHEET_NAME || 'Piutang');
  idc('PIUTANG karyawan', PIUTANG_KARYAWAN_SPREADSHEET_ID, PIUTANG_KARYAWAN_SHEET_NAME || 'Piutang');
  try {
    var main = SpreadsheetApp.getActiveSpreadsheet();
    ['karyawan', 'anggota'].forEach(function (kind) {
      ['voucher', 'piutang', 'mutasi', 'trx'].forEach(function (table) {
        var sh = getSpartaMirrorSheet_(kind, table);
        if (sh) lines.push('mirror ' + kind + '/' + table + ': lastRow=' + sh.getLastRow() + ' lastCol=' + sh.getLastColumn());
      });
    });
  } catch (e) { lines.push('mirror: ERR ' + e.message); }

  var keys = [];
  Object.keys(CACHE_DEF).forEach(function (k) { keys.push(CACHE_DEF[k].key); });
  ['karyawan', 'anggota'].forEach(function (kind) {
    ['voucher', 'piutang', 'mutasi', 'trx'].forEach(function (table) { keys.push(mirrorCacheKey_(kind, table)); });
  });
  keys.push('voucher_' + String(VOUCHER_SPREADSHEET_ID || '').trim() + '_' + (VOUCHER_SHEET_NAME || 'Voucher'));
  keys.push('voucher_' + String(VOUCHER_KARYAWAN_SPREADSHEET_ID || '').trim() + '_' + (VOUCHER_KARYAWAN_SHEET_NAME || 'Voucher'));
  keys = keys.filter(function (k, i) { return keys.indexOf(k) === i && String(k).indexOf('undefined') < 0; });
  keys.forEach(function (k) {
    var s = Date.now();
    var list = cacheGetBig_(k);
    var ms = Date.now() - s;
    var jk = 0;
    if (Array.isArray(list)) { try { jk = Math.round(JSON.stringify(list).length / 1024); } catch (e) {} }
    lines.push('cache [' + k + ']: ' + (list ? 'HIT count=' + list.length + ' jsonKb=' + jk : 'MISS') + ' (baca=' + ms + 'ms)');
  });

  lines.push('total waktu: ' + (Date.now() - t0) + 'ms');
  var out = lines.join('\n');
  Logger.log(out);
  return { ok: true, info: out };
}

/** JALANKAN SEKALI di editor Apps Script untuk memicu izin script.external_request
 *  (dipakai akses Sheets REST API). Read-only, aman. */
function tesSheetsApi() {
  var v = getVoucherConfig_();
  if (!v.spreadsheetId) return { ok: false, pesan: 'Voucher spreadsheet belum dikonfigurasi.' };
  try {
    var headers = getSheetHeadersExt_(v.spreadsheetId, v.sheetName);
    return { ok: true, jumlahKolom: (headers || []).length, kolom: (headers || []).slice(0, 15), pesan: 'Akses Sheets API BERHASIL. Coba redeem lagi di web app.' };
  } catch (e) {
    return { ok: false, error: String(e.message || ''), pesan: 'Masih gagal. Pastikan muncul dialog izin lalu pilih Allow.' };
  }
}
