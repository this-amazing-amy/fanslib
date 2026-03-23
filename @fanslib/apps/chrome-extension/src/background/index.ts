import { addLogEntry } from "../lib/activity-log";
import { debug } from "./config";
import { registerMessageHandler } from "./message-handler";
import { processPendingCredentials, CREDENTIALS_THROTTLE_MS } from "./credential-sync";

registerMessageHandler();

chrome.runtime.onInstalled.addListener(() => {
  debug("info", "Background script installed");
  addLogEntry({ type: "success", message: "Extension started" });
  processPendingCredentials();
});

setInterval(() => {
  processPendingCredentials();
}, CREDENTIALS_THROTTLE_MS);

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
