# SKPORT 每日簽到腳本（Google Apps Script）

[English](README.md)

這是一個 **Google Apps Script**，可自動完成《明日方舟》與《明日方舟：終末地》（SKPORT/Gryphline）的每日簽到。腳本運行在 Google 的伺服器上，不需要保持電腦開機。

> 基於 [EndfieldCheckin](https://github.com/nano-shino/EndfieldCheckin)（作者：nano-shino）修改，新增明日方舟簽到支援。

## 🚀 設定步驟

### 第一步：取得 ACCOUNT_TOKEN

1.  登入 SKPORT：
    - 明日方舟：https://game.skport.com/arknights/sign-in
    - 終末地：https://game.skport.com/endfield/sign-in
2.  前往 https://web-api.skport.com/cookie_store/account_token，複製 JSON 中的 `code` 欄位內容。

---

### 第二步：安裝腳本

1.  前往 [script.google.com](https://script.google.com/)。
2.  點擊 **+ 新增專案**。
3.  刪除編輯器中現有的程式碼（例如 `function myFunction...`）。
4.  將[腳本](https://github.com/oao519p/SKPORTCheckin/blob/main/ArkAndEndfieldCheckIn.js)內容**貼上**到編輯器。
5.  在腳本最上方找到設定區塊：
    ```javascript
    const ACCOUNT_TOKEN = "";
    ```
6.  將你的 token 貼入引號內。

---

### 第三步：設定 Discord 通知（選填）

如果想在腳本執行時收到 Discord 通知：

1.  開啟 **Discord**，進入你的伺服器。
2.  右鍵點擊想接收通知的文字頻道。
3.  選擇 **編輯頻道** → **整合** → **Webhooks**。
4.  點擊 **新增 Webhook**。
5.  點擊 **複製 Webhook URL**。
6.  回到 Google Script，將 URL 貼入：
    ```javascript
    const DISCORD_WEBHOOK_URL = "";
    ```

---

### 第四步：啟動每日排程

1.  儲存腳本（磁碟圖示或 Ctrl+S），為專案命名（例如「SKPORT Daily」）。
2.  在工具列下拉選單（Debug 旁邊）選擇 **`setupDailyTrigger`**。
3.  點擊 **執行**。
4.  **授權：**
    - Google 會要求執行權限，點擊 **審查權限**。
    - 選擇你的 Google 帳號。
    - 可能會看到「Google 尚未驗證這個應用程式」的畫面（因為這是你自己建立的腳本）。
    - 點擊左下角 **進階** → **前往 [專案名稱]（不安全）**。
    - 點擊 **允許**。
5.  查看底部的**執行記錄**，應該會顯示：
    > _✅ Trigger set! The 'main' function will run daily between 3 AM and 4 AM (UTC+8)._

---

## ❓ 常見問題

**Q：腳本顯示「Token Expired」失敗。** A：`ACCOUNT_TOKEN` 可能在幾週或幾個月後過期，或手動登出網站後失效。重複**第一步**取得新 token 並更新腳本即可。

**Q：如何立即測試腳本是否正常運作？** A：在腳本編輯器的下拉選單中選擇 **`main`** 函式並點擊執行，查看記錄或 Discord 頻道確認結果。

**Q：如何停止腳本？** A：前往腳本編輯器左側的**觸發條件**圖示（鬧鐘），刪除列出的觸發條件即可。

**Q：我的帳號只有明日方舟 / 只有終末地。** A：沒問題。腳本會自動偵測帳號綁定的遊戲，只對已綁定的遊戲進行簽到。
