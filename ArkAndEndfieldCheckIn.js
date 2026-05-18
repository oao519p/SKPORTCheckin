/**
 * ARKNIGHTS + ENDFIELD DAILY ATTENDANCE (Google Apps Script)
 * With Discord Notification & Auto-Scheduler
 */

// ==========================================
// 1. SETUP & CONFIGURATION
// ==========================================

// Log into SKPORT then go to https://web-api.skport.com/cookie_store/account_token and copy the code here
const ACCOUNT_TOKEN = "";

// (Optional) Paste Discord Webhook URL. Leave empty "" to disable.
const DISCORD_WEBHOOK_URL = "";


// ==========================================
// 2. TRIGGER SETUP (Run this function once)
// ==========================================

function setupDailyTrigger() {
    const functionName = "main";
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === functionName) {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }
    ScriptApp.newTrigger(functionName)
        .timeBased()
        .everyDays(1)
        .atHour(3)
        .inTimezone("Asia/Taipei")
        .create();
    Logger.log(`✅ Trigger set! The '${functionName}' function will run daily between 3 AM and 4 AM (UTC+8).`);
}


// ==========================================
// 3. MAIN LOGIC
// ==========================================

const CONSTANTS = {
    APP_CODE: "6eb76d4e13aa36e6",
    PLATFORM: "3",
    VNAME: "1.0.0",
    ENDFIELD_GAME_ID: "3",
    ARK_GAME_ID: "1",
    URLS: {
        GRANT: "https://as.gryphline.com/user/oauth2/v2/grant",
        GENERATE_CRED: "https://zonai.skport.com/web/v1/user/auth/generate_cred_by_code",
        REFRESH_TOKEN: "https://zonai.skport.com/web/v1/auth/refresh",
        BINDING: "https://zonai.skport.com/api/v1/game/player/binding",
        ENDFIELD_ATTENDANCE: "https://zonai.skport.com/web/v1/game/endfield/attendance",
        ARK_ATTENDANCE: "https://zonai.skport.com/api/v1/game/attendance"
    }
};

function alreadyRanToday() {
    const props = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd");
    if (props.getProperty("lastRun") === today) return true;
    props.setProperty("lastRun", today);
    return false;
}

function main() {
    if (alreadyRanToday()) {
        Logger.log("Already ran today, skipping.");
        return;
    }
    try {
        performCheckIn();
    } catch (e) {
        Logger.log("CRITICAL ERROR: " + e.toString());
        sendDiscordWebhook("Script Error", e.toString(), "", 15548997);
    }
}

function performCheckIn() {
    Logger.log("Starting Check-in...");

    // 1. Auth Flow
    const oauthCode = getOAuthCode(decodeURIComponent(ACCOUNT_TOKEN));
    if (!oauthCode) throw new Error("Failed to get OAuth Code (Check ACCOUNT_TOKEN)");

    const cred = getCred(oauthCode);
    if (!cred) throw new Error("Failed to get Credential");

    const signToken = getSignToken(cred);
    if (!signToken) throw new Error("Failed to get Sign Token");

    const { endfieldRoles, arkUids } = getPlayerBinding(cred, signToken);

    // 2. Endfield Attendance
    for (const gameRole of endfieldRoles) {
        Logger.log("Endfield role: " + gameRole);
        const response = sendEndfieldAttendanceRequest(cred, signToken, gameRole);
        handleResponse("Endfield", gameRole, response);
    }

    // 3. Arknights Attendance
    for (const uid of arkUids) {
        Logger.log("Arknights uid: " + uid);
        const response = sendArkAttendanceRequest(cred, signToken, uid);
        handleResponse("Arknights", uid, response);
    }
}

// --- RESULT HANDLER ---

function handleResponse(gameName, roleId, json) {
    const code = json.code;
    const msg = json.message || "";

    if (code === 0) {
        const rewards = parseRewards(json.data);
        const desc = `**Status:** Signed in successfully!\n**Rewards:** ${rewards}`;
        Logger.log(`[${gameName}] Success: ` + rewards);
        sendDiscordWebhook(`${gameName} Attendance Success`, desc, roleId, 5763719);
    }
    else if (code === 1001 || code === 10001 || msg.toLowerCase().includes("already")) {
        Logger.log(`[${gameName}] Already signed in today.`);
        sendDiscordWebhook(`${gameName} Attendance Info`, "You have already signed in today.", roleId, 16776960);
    }
    else if (code === 10002) {
        Logger.log(`[${gameName}] Token Expired.`);
        sendDiscordWebhook(`${gameName} Login Failed`, "Account Token is expired. Please update the script.", roleId, 15548997);
    }
    else {
        Logger.log(`[${gameName}] Unknown API Error: ` + msg);
        sendDiscordWebhook(`${gameName} Attendance Error`, `API Code: ${code}\nMessage: ${msg}`, roleId, 15548997);
    }
}

// --- DISCORD WEBHOOK ---

function sendDiscordWebhook(title, description, footer, color) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.trim() === "") return;

    const payload = {
        username: "SKPORT Assistant",
        avatar_url: "https://static.skport.com/asset/game/endfield_740c9ea5dd44bf4a3e6932c595e30a26.png",
        embeds: [{
            title: title,
            description: description,
            color: color,
            timestamp: new Date().toISOString(),
            footer: { text: String(footer) }
        }]
    };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    try {
        UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
    } catch (e) {
        Logger.log("Failed to send Discord webhook: " + e.toString());
    }
}

// --- HELPERS ---

function parseRewards(data) {
    if (!data) return "Unknown";
    // Endfield format
    if (data.reward) return `${data.reward.name} x${data.reward.count}`;
    if (data.awardIds && data.resourceInfoMap) {
        let list = [];
        for (let i = 0; i < data.awardIds.length; i++) {
            const id = data.awardIds[i].id;
            if (data.resourceInfoMap[id]) {
                const item = data.resourceInfoMap[id];
                list.push(`${item.name} x${item.count}`);
            }
        }
        return list.join(", ");
    }
    // Arknights format: latest record in records[0]
    if (data.records && data.records.length > 0 && data.resourceInfoMap) {
        const latest = data.records[0];
        const info = data.resourceInfoMap[latest.resourceId];
        const name = info ? info.name : latest.resourceId;
        return `${name} x${latest.count}`;
    }
    return "No rewards data found";
}

// --- API STEPS ---

function getOAuthCode(token) {
    const payload = { token: token, appCode: CONSTANTS.APP_CODE, type: 0 };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(CONSTANTS.URLS.GRANT, options);
    const json = JSON.parse(response.getContentText());
    return (json.status === 0 && json.data && json.data.code) ? json.data.code : null;
}

function getCred(oauthCode) {
    const payload = { kind: 1, code: oauthCode };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(CONSTANTS.URLS.GENERATE_CRED, options);
    const json = JSON.parse(response.getContentText());
    return (json.code === 0 && json.data && json.data.cred) ? json.data.cred : null;
}

function getSignToken(cred) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers = { "cred": cred, "platform": CONSTANTS.PLATFORM, "vname": CONSTANTS.VNAME, "timestamp": timestamp, "sk-language": "en" };
    const options = { method: 'get', headers: headers, muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(CONSTANTS.URLS.REFRESH_TOKEN, options);
    const json = JSON.parse(response.getContentText());
    return (json.code === 0 && json.data && json.data.token) ? json.data.token : null;
}

function getPlayerBinding(cred, signToken) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = "/api/v1/game/player/binding";
    const signature = computeSign(path, "", timestamp, signToken);
    const headers = { "cred": cred, "platform": CONSTANTS.PLATFORM, "vname": CONSTANTS.VNAME, "timestamp": timestamp, "sk-language": "en", "sign": signature };
    const options = { method: 'get', headers: headers, muteHttpExceptions: true };
    const response = UrlFetchApp.fetch(CONSTANTS.URLS.BINDING, options);
    const json = JSON.parse(response.getContentText());
    let endfieldRoles = [];
    let arkUids = [];

    if (json.code === 0 && json.data && json.data.list) {
        const apps = json.data.list;
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].appCode === "endfield" && apps[i].bindingList) {
                const binding = apps[i].bindingList[0];
                for (const role of binding.roles) {
                    endfieldRoles.push(`${CONSTANTS.ENDFIELD_GAME_ID}_${role.roleId}_${role.serverId}`);
                }
            }
            if (apps[i].appCode === "arknights" && apps[i].bindingList) {
                for (const binding of apps[i].bindingList) {
                    if (binding.uid) arkUids.push(binding.uid);
                }
            }
        }
    }
    return { endfieldRoles, arkUids };
}

function sendAttendance(cred, signToken, config) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = computeSign(config.path, "", timestamp, signToken);
    const headers = {
        "cred": cred, "platform": CONSTANTS.PLATFORM, "vname": CONSTANTS.VNAME, "timestamp": timestamp,
        "sk-language": "zh_Hant", "sign": signature, "Content-Type": "application/json"
    };
    if (config.extraHeaders) Object.assign(headers, config.extraHeaders);
    const options = { method: 'post', headers: headers, muteHttpExceptions: true };
    if (config.body) options.payload = JSON.stringify(config.body);
    const response = UrlFetchApp.fetch(config.url, options);
    return JSON.parse(response.getContentText());
}

function sendEndfieldAttendanceRequest(cred, signToken, gameRole) {
    return sendAttendance(cred, signToken, {
        path: "/web/v1/game/endfield/attendance",
        url: CONSTANTS.URLS.ENDFIELD_ATTENDANCE,
        extraHeaders: gameRole ? { "sk-game-role": gameRole } : {}
    });
}

function sendArkAttendanceRequest(cred, signToken, uid) {
    const signInResponse = sendAttendance(cred, signToken, {
        path: "/api/v1/game/attendance",
        url: CONSTANTS.URLS.ARK_ATTENDANCE,
        body: { uid: Number(uid) }
    });
    if (signInResponse.code !== 0) return signInResponse;

    // Fetch reward info via GET
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = "/api/v1/game/attendance";
    const params = `gameId=${CONSTANTS.ARK_GAME_ID}&uid=${uid}`;
    const signature = computeSign(path, params, timestamp, signToken);
    const headers = {
        "cred": signInResponse._cred || cred,
        "platform": CONSTANTS.PLATFORM, "vname": CONSTANTS.VNAME,
        "timestamp": timestamp, "sk-language": "zh_Hant", "sign": signature
    };
    const queryResponse = UrlFetchApp.fetch(
        `${CONSTANTS.URLS.ARK_ATTENDANCE}?${params}`,
        { method: 'get', headers: headers, muteHttpExceptions: true }
    );
    const queryJson = JSON.parse(queryResponse.getContentText());
    return { code: 0, data: queryJson.data };
}

// --- CRYPTO LOGIC ---

function computeSign(path, body, timestamp, signToken) {
    const headerObj = { "platform": CONSTANTS.PLATFORM, "timestamp": timestamp, "dId": "", "vName": CONSTANTS.VNAME };
    const headersJson = JSON.stringify(headerObj);
    const signString = path + body + timestamp + headersJson;
    const hmacBytes = Utilities.computeHmacSha256Signature(signString, signToken);
    const hmacHex = bytesToHex(hmacBytes);
    const md5Bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, hmacHex, Utilities.Charset.UTF_8);
    return bytesToHex(md5Bytes);
}

function bytesToHex(bytes) {
    return bytes.map(function (byte) { return ('0' + (byte & 0xFF).toString(16)).slice(-2); }).join('');
}
