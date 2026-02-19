console.log("[SF Extractor] Background service worker loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("[SF Extractor] BG got message:", msg);

  if (msg.type !== "SAVE_DATA") return;

  (async () => {
    const { salesforce_data } = await chrome.storage.local.get(["salesforce_data"]);

    const db = salesforce_data || {
      leads: [],
      contacts: [],
      accounts: [],
      opportunities: [],
      tasks: [],
      lastSync: {}
    };

    const object = msg.object; // "leads" | "contacts" | ...
    const record = msg.data;

    if (!db[object]) db[object] = [];

    // Merge by id (dedupe + update)
    const idx = db[object].findIndex((x) => x.id === record.id);
    if (idx >= 0) db[object][idx] = { ...db[object][idx], ...record };
    else db[object].push(record);

    db.lastSync[object] = Date.now();

    await chrome.storage.local.set({ salesforce_data: db });

    console.log(`[SF Extractor] Saved to storage: ${object}`, record);

    sendResponse({ success: true, object, id: record.id });
  })().catch((err) => {
    console.error("[SF Extractor] SAVE_DATA failed:", err);
    sendResponse({ success: false, error: String(err) });
  });

  // keep the message channel open for async sendResponse
  return true;
});
