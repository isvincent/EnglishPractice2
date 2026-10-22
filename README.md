# English Bloom 每日英文學習花園

本資料夾內所有內容直接上傳GitHub儲存庫根目錄，首頁為index.html。完整後端設定見套件上層README與Word操作手冊。

## 檔案
- index.html：首頁、教材與設定對話框。
- styles.css：響應式、字級、色系、列印樣式。
- app.js：JSONP讀取、搜尋、日期、收藏、筆記、進度、設定、PWA安裝。
- config.js：公開端點網址、前景更新間隔、備用目標日。
- sw.js：靜態介面離線快取。
- manifest.webmanifest：PWA基本設定。
- demo.json：示範資料，不是你的試算表。
- assets：原創插畫、192與512 PNG圖示。

## 設定
```javascript
window.APP_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/部署ID/exec',
  refreshMinutes: 5,
  targetDate: '2028-12-31'
};
```
不放Gemini API Key。前端只讀教材，不呼叫AI、不寄信。WebApi原始碼在本資料夾上一層的apps-script/WebApi.gs，必須另於Google部署。

網站優先採用WebApi回傳的targetDate，未提供時使用config.js備用日期。瀏覽器已儲存的endpoint優先於config.js；換網址時使用「連接資料來源」重新儲存。

## GitHub Pages
Settings → Pages → Deploy from a branch → main → / (root)。所有檔案使用相對路徑，支援儲存庫子目錄。請勿多包一層website。

## 本機預覽
在此目錄執行python3 -m http.server 8000，瀏覽http://localhost:8000。不要以file://測試PWA或示範讀取。

## 操作與限制
- 日期瀏覽、全文搜尋、月份、排序、收藏與完成篩選。
- 原文完整呈現A至G，展開完整欄位可查看全部來源欄位。
- 字體16/18/21px、系統/亮/暗色、介面中英切換、裝置/版面切換、音效與全螢幕。
- 介面翻譯不改寫教材；版面切換不旋轉實體螢幕；全螢幕依裝置支援。
- 音效預設關閉，使用Web Audio於互動時播放，無音檔或第三方資源。
- 筆記、收藏、完成與設定僅存目前瀏覽器，沒有跨裝置同步。
- 前景每5分鐘、開啟、返回分頁、恢復網路時更新；離線使用上次成功快取並顯示時間。
- 關閉網站不保證背景同步；至少成功載入一次後才能離線使用已快取介面。
- Chrome/Edge可使用安裝按鈕或選單；iOS Safari分享選單加入主畫面。
- 插入歷史資料或重新排序可能改變列號，舊收藏/完成狀態可能需重設。
- JSONP會執行遠端腳本，只使用自己信任的公開教材端點，不提供私密資料。

## 更新
修改網站後提交並等待Pages部署，必要時增加sw.js的CACHE版本。不要先清除所有網站資料，以免失去筆記。手機遇到讀取問題，先直接在無痕視窗開/exec，再排查舊端點、權限、快取、網路及60秒逾時。
