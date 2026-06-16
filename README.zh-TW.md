# SKPORT 每日簽到腳本（Google Apps Script）

[English](README_CheckIn.md)

這是一個 **Google Apps Script**，可自動完成《明日方舟》與《明日方舟：終末地》（SKPORT/Gryphline）的每日簽到。腳本運行在 Google 的伺服器上，不需要保持電腦開機。

> 基於 [EndfieldCheckin](https://github.com/nano-shino/EndfieldCheckin)（作者：nano-shino）修改，新增明日方舟簽到支援。

## 🚀 設定步驟

### 第一步：取得 ACCOUNT_TOKEN

1.  登入 SKPORT：
    - 明日方舟：https://game.skport.com/arknights/sign-in
    - 終末地：https://game.skport.com/endfield/sign-in
2.  前往 https://web-api.skport.com/cookie_store/account_token ，複製 JSON 中 `data.content` 的值。
    ![](https://github.com/user-attachments/assets/a8fffd7d-cc92-41e5-9bba-21cb17074142)

---

### 第二步：安裝腳本

1.  前往 [script.google.com](https://script.google.com/)。
2.  點擊 **+ 新增專案**。
    ![](https://github.com/user-attachments/assets/8d4291a7-007b-41b4-b24c-7d34932e3b7d)
3.  刪除編輯器中現有的程式碼（例如 `function myFunction...`）。
4.  將[腳本](https://github.com/oao519p/SKPORTCheckin/blob/main/ArkAndEndfieldCheckIn.js)內容**貼上**到編輯器。
    ![](https://github.com/user-attachments/assets/5eec5cf3-7aea-46de-b3ce-a5abb738c8a3)
5.  在腳本最上方找到設定區塊：
    ```javascript
    const ACCOUNT_TOKEN = "";
    ```
6.  將你的 token 貼入引號內。
    ![](https://github.com/user-attachments/assets/3ace3da6-8e92-4b56-add3-4ad2de73e475)

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

每次執行後會收到**一則訊息**，包含所有遊戲的簽到結果。每個遊戲顯示簽到狀態、獎勵內容，以及角色 ID（顯示於 footer）。
![](https://github.com/user-attachments/assets/e117076e-d9b3-4350-8ef1-b018d67c2e53)

---

### 第四步：啟動每日排程

1.  儲存腳本（磁碟圖示或 Ctrl+S），為專案命名（例如「SKPORT Daily」）。
2.  在工具列下拉選單（Debug 旁邊）選擇 **`setupDailyTrigger`**。
3.  點擊 **執行**。
    ![](https://github.com/user-attachments/assets/2db79da7-c2e4-44ec-8588-7ac8653dd1b7)
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

注意：若腳本今天已執行過，會直接跳過並顯示 `Already ran today, skipping.`。若要強制重新執行，請前往**專案設定**（齒輪圖示）→ **指令碼屬性**，刪除 `lastRun` 項目後再執行 `main`。

![](https://github.com/user-attachments/assets/e37893a8-b446-446d-b704-d1da9bb0dbd0) ![](https://github.com/user-attachments/assets/ddd1461c-8f66-4615-8da9-cc4ea555cb8b)

**Q：如何停止腳本？** A：前往腳本編輯器左側的**觸發條件**圖示（鬧鐘），刪除列出的觸發條件即可。

**Q：如何更改腳本執行時間？** A：找到 `setupDailyTrigger()` 裡的這段：
```javascript
.atHour(3)
.inTimezone("Asia/Taipei")
```
將 `3` 改為你想要的小時（0–23，24 小時制）。若你在不同時區，也請一併更新 `"Asia/Taipei"`（例如 `"Asia/Tokyo"`、`"America/New_York"`）。修改完成後執行一次 `setupDailyTrigger` 套用新排程。

**Q：我的帳號只有明日方舟 / 只有終末地。** A：沒問題。腳本會自動偵測帳號綁定的遊戲，只對已綁定的遊戲進行簽到。

---

## 🔧 除錯指南

### Discord 沒有收到通知

1. 前往 GAS 編輯器 → 左側**執行記錄**（時鐘圖示）。
    ![](https://github.com/user-attachments/assets/4ecc4e30-03b9-47fc-b224-ece4d6c59a33) ![](https://github.com/user-attachments/assets/cb32d123-1bab-412b-b900-9cab6b4865bb)
2. 找到最新一筆（或沒收到通知的那一天）執行記錄並展開 log。
3. 確認有沒有 `Sending Discord webhook`，若有，查看下一行的 `Discord response:`：
   - `204` = 已成功送出（直接去 Discord 頻道確認，可能是通知設定問題）
   - `429` = 被 rate limit（腳本會依照 Discord 回應的 `retry_after` 自動重試最多 10 次；若總等待時間超過 60 秒，會自動排程一個 `retryWebhook` trigger，2 分鐘後重新嘗試發送，直到通知成功送出為止）
   ![](https://github.com/user-attachments/assets/907ce62a-572f-4de4-b105-48886ab78110)
   - 其他代碼 = webhook URL 可能已失效或被刪除，重新建立 webhook 並更新 `DISCORD_WEBHOOK_URL`
4. 若 `Sending Discord webhook` **沒有出現**，代表簽到本身失敗，查看 log 中是否有 `Script Error` 或 `Unknown API Error`。

### Script Error / Address unavailable

通常代表 GAS 暫時無法連線到 SKPORT 伺服器。腳本會自動重試最多 3 次，全部失敗後才會發送 **Script Error** Discord 通知。
![](https://github.com/user-attachments/assets/66d8189a-f02f-4db7-875c-381970907d28)

調整重試次數，找到 `main()` 裡的這行：
```javascript
const maxRetries = 3;
```
增加數值（例如 `5`）可允許更多次重試。也可以調整每次重試的等待時間：
```javascript
Utilities.sleep(attempt * 10000); // 目前為 10秒、20秒、30秒...
```

若每天都持續出現錯誤，可能是 SKPORT API 端點有變動，請查看 [repo](https://github.com/oao519p/SKPORTCheckin) 是否有更新。
