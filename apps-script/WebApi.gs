/** 將本檔新增至原本的 Apps Script 專案，保留寄信與生成程式。
 * 如已有 doGet，請整合，不可重複宣告。
 * 僅公開 SPREADSHEET_ID 指向之「教材」工作表的儲存格顯示值。
 */
function doGet(e) {
  var callback = String((e && e.parameter && e.parameter.callback) || '');
  if (callback && !/^bloom_cb_[A-Za-z0-9_]{1,100}$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback');
  }
  var result;
  try {
    var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Missing spreadsheet configuration');
    var sheet = SpreadsheetApp.openById(id).getSheetByName('教材');
    if (!sheet) throw new Error('Missing lesson sheet');
    var values = sheet.getDataRange().getDisplayValues();
    var headers = values[0] || [];
    if (headers.length < 7) throw new Error('Invalid lesson headers');
    var rows = [];
    values.slice(1).forEach(function(cells, i) {
      if (cells.every(function(c) { return !String(c).trim(); })) return;
      rows.push({id: 'row-' + (i + 2) + '-' + cells[0], cells: cells});
    });
    result = {ok:true, headers:headers, rows:rows,
      targetDate: getTarget_(), generatedAt: new Date().toISOString()};
  } catch (error) {
    // 不將金鑰、試算表ID或內部錯誤傳給公開訪客。
    result = {ok:false, error:'Lesson data unavailable. Check server configuration.'};
  }
  var json = JSON.stringify(result).replace(/</g,'\\u003c')
    .replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(callback ? callback+'('+json+');' : json)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
