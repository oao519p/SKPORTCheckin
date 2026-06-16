# SKPORT Daily Sign-in Script (Google Apps Script)

[中文版](README.zh-TW.md)

This is a **Google Apps Script** that automates the daily sign-in process for **Arknights** and **Arknights: Endfield** (SKPORT/Gryphline). It runs automatically on Google's servers, so you don't need to keep your computer on.

> Based on [EndfieldCheckin](https://github.com/nano-shino/EndfieldCheckin) by nano-shino, extended to support Arknights sign-in.

## 🚀 Setup Instructions

### Step 1: Get ACCOUNT_TOKEN

1.  Sign in to SKPORT at one of the following:
    - Arknights: https://game.skport.com/arknights/sign-in
    - Endfield: https://game.skport.com/endfield/sign-in
2.  Go to https://web-api.skport.com/cookie_store/account_token and copy the `data.content` value from the JSON.
    ![](https://github.com/user-attachments/assets/a8fffd7d-cc92-41e5-9bba-21cb17074142)

---

### Step 2: Install the Script

1.  Go to [script.google.com](https://script.google.com/).
2.  Click **+ New Project**.
    ![](https://github.com/user-attachments/assets/8d4291a7-007b-41b4-b24c-7d34932e3b7d)
3.  Delete any code currently in the editor (e.g., `function myFunction...`).
4.  **Paste** the [script](https://github.com/oao519p/SKPORTCheckin/blob/main/ArkAndEndfieldCheckIn.js) into the editor.
    ![](https://github.com/user-attachments/assets/5eec5cf3-7aea-46de-b3ce-a5abb738c8a3)
5.  At the top of the script, find the configuration section:
    ```javascript
    const ACCOUNT_TOKEN = "";
    ```
6.  Paste your token inside the quotation marks.
    ![](https://github.com/user-attachments/assets/3ace3da6-8e92-4b56-add3-4ad2de73e475)

---

### Step 3: Setup Discord Notification (Optional)

If you want to receive a notification on Discord when the script runs:

1.  Open **Discord** and go to your server.
2.  Right-click the text channel where you want notifications.
3.  Select **Edit Channel** → **Integrations** → **Webhooks**.
4.  Click **New Webhook**.
5.  Click **Copy Webhook URL**.
6.  Go back to your Google Script and paste the URL in:
    ```javascript
    const DISCORD_WEBHOOK_URL = "";
    ```

After each run, you will receive **a single message** containing results for all signed-in games. Each game shows its sign-in status, rewards, and role ID in the footer.
![](https://github.com/user-attachments/assets/e117076e-d9b3-4350-8ef1-b018d67c2e53)

---

### Step 4: Activate the Daily Schedule

1.  Save the script (Floppy disk icon or Ctrl+S). Give the project a name (e.g., "SKPORT Daily").
2.  In the toolbar dropdown menu (next to "Debug"), select **`setupDailyTrigger`**.
3.  Click **Run**.
    ![](https://github.com/user-attachments/assets/2db79da7-c2e4-44ec-8588-7ac8653dd1b7)
4.  **Authorization:**
    - Google will ask for permission to run. Click **Review Permissions**.
    - Select your Google Account.
    - You will likely see a screen saying "Google hasn't verified this app" (because it's a custom script you just made).
    - Click **Advanced** (bottom left) -> **Go to [Project Name] (unsafe)**.
    - Click **Allow**.
5.  Check the **Execution Log** at the bottom. It should say:
    > _✅ Trigger set! The 'main' function will run daily between 3 AM and 4 AM (UTC+8)._

---

## ❓ FAQ & Troubleshooting

**Q: The script failed with "Token Expired".** A: The `ACCOUNT_TOKEN` may expire after a few weeks or months, or if you log out of the website manually. Simply repeat **Step 1** to get a new token and update the script variable.

**Q: How do I test if it works right now?** A: In the script editor, select the function **`main`** from the dropdown and click **Run**. Check the logs or your Discord channel for the result. Note: if the script has already run today, it will skip and log `Already ran today, skipping.` To force a re-run, go to **Project Settings** (gear icon) → **Script Properties**, delete the `lastRun` entry, then run `main` again.

![](https://github.com/user-attachments/assets/e37893a8-b446-446d-b704-d1da9bb0dbd0) ![](https://github.com/user-attachments/assets/ddd1461c-8f66-4615-8da9-cc4ea555cb8b)

**Q: How do I stop the script?** A: To stop it from running, go to the **Triggers** icon (alarm clock) on the left sidebar of the script editor and delete the trigger listed there.

**Q: How do I change the time the script runs?** A: Find this section in `setupDailyTrigger()`:
```javascript
.atHour(3)
.inTimezone("Asia/Taipei")
```
Change `3` to your desired hour (0–23, in 24-hour format). If you are in a different timezone, update `"Asia/Taipei"` accordingly (e.g., `"Asia/Tokyo"`, `"America/New_York"`). After editing, run `setupDailyTrigger` once to apply the new schedule.

**Q: My account only has Arknights / only has Endfield.** A: No problem. The script automatically detects which games are bound to your account and only signs in to those.

---

## 🔧 Debugging

### Discord notification not received

1. Go to the GAS editor → **Executions** (clock icon on the left sidebar).
    ![](https://github.com/user-attachments/assets/4ecc4e30-03b9-47fc-b224-ece4d6c59a33) ![](https://github.com/user-attachments/assets/cb32d123-1bab-412b-b900-9cab6b4865bb)
2. Find the latest execution (or the day you didn't receive a notification) and expand the log.
3. Check for `Sending Discord webhook` — if it appears, look for `Discord response:` on the next line:
   - `204` = sent successfully (check Discord channel directly, may be a notification settings issue)
   - `429` = rate limited (the script will retry up to 10 times using the `retry_after` delay from Discord's response; if the total wait would exceed 60 seconds, it schedules a `retryWebhook` trigger to resend 2 minutes later — this repeats automatically until the notification is delivered)
   ![](https://github.com/user-attachments/assets/907ce62a-572f-4de4-b105-48886ab78110)
   - Other codes = webhook URL may be invalid or deleted — recreate the webhook and update `DISCORD_WEBHOOK_URL`
4. If `Sending Discord webhook` does **not** appear, the sign-in itself may have failed — check for `Script Error` or `Unknown API Error` in the log.

### Script Error / Address unavailable

This usually means GAS temporarily could not reach the SKPORT server. The script will automatically retry up to 3 times. If all retries fail, you will receive a **Script Error** Discord notification.
![](https://github.com/user-attachments/assets/66d8189a-f02f-4db7-875c-381970907d28)

To adjust retry behavior, find this line in `main()`:
```javascript
const maxRetries = 3;
```
Increase the value (e.g., `5`) to allow more retries. You can also increase the wait time between retries by modifying:
```javascript
Utilities.sleep(attempt * 10000); // currently 10s, 20s, 30s...
```

If the error persists daily, the SKPORT API endpoint may have changed — check the [repo](https://github.com/oao519p/SKPORTCheckin) for updates.
