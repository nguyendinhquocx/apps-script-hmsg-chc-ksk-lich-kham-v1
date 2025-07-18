function syncSheetToSupabase() {
  // ==== Cấu hình ====
  const SHEET_ID = "1vSg0nFqGIf9-pBdj6pEgxhqKFkUhc4LXdTs7iQC2GHM";
  const SHEET_NAME = "chc";
  const SUPABASE_URL = "https://glppizdubinvwuncteah.supabase.co/rest/v1/lich_kham";
  const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHBpemR1Ymludnd1bmN0ZWFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg1MzYyNiwiZXhwIjoyMDY4NDI5NjI2fQ.78-AHww3LtWEl86DNN0voLD5a_xCkPBctYCrR9LeKjY";

  // ==== Lấy dữ liệu từ sheet ====
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues(); // mảng 2 chiều
  if (data.length < 2) {
    Logger.log("Không có dữ liệu để đồng bộ.");
    return;
  }
  const headers = data[0].map(h => h.toString().trim()); // Header chuẩn hóa
  const rows = data.slice(1);

  // ==== Danh sách các cột cần ép kiểu số (integer/bigint) ====
  const numericFields = [
    "so nguoi kham",
    "tong so ngay kham thuc te",
    "trung binh ngay",
    "trung binh ngay sang",
    "trung binh ngay chieu",
    "sieu am bung sang",
    "sieu am vu sang",
    "sieu am giap sang",
    "sieu am tim sang",
    "sieu am dong mach canh sang",
    "sieu am dan hoi mo gan sang",
    "x quang sang",
    "dien tam do sang",
    "kham phu khoa sang",
    "sieu am bung chieu",
    "sieu am vu chieu",
    "sieu am giap chieu",
    "sieu am tim chieu",
    "sieu am dong mach canh chieu",
    "sieu am dan hoi mo gan chieu",
    "x quang chieu",
    "dien tam do chieu",
    "kham phu khoa chieu"
  ];

  // ==== Danh sách các cột kiểu ngày ====
  const dateFields = [
    "ngay bat dau kham",
    "ngay ket thuc kham",
    "ngay lay mau"
  ];

  // ==== Chuyển mảng 2 chiều thành array of object, ép kiểu đúng ====
  let records = [];
  rows.forEach(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let value = row[i];
      if (numericFields.includes(h)) {
        obj[h] = (value === "" || value === null || typeof value === "undefined") ? null : Number(value);
      } else if (dateFields.includes(h)) {
        obj[h] = (value === "" || value === null || typeof value === "undefined") ? null : value;
      } else {
        obj[h] = value;
      }
    });
    // Bắt buộc có trường ID (khóa chính Supabase)
    if (obj["ID"] && obj["ID"].toString().trim() !== "") {
      records.push(obj);
    }
  });

  if (records.length === 0) {
    Logger.log("Không có dữ liệu để đồng bộ.");
    return;
  }

  // ==== Gửi dữ liệu lên Supabase ====
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": "Bearer " + SUPABASE_SERVICE_KEY,
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(records),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(SUPABASE_URL, options);
    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code >= 200 && code < 300) {
      Logger.log("Đồng bộ thành công: " + code);
      Logger.log(body);
    } else {
      Logger.log("LỖI đồng bộ: " + code);
      Logger.log(body);
    }
  } catch (err) {
    Logger.log("Lỗi khi gửi dữ liệu lên Supabase: " + err);
  }
}