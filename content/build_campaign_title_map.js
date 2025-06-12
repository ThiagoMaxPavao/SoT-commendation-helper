// Purpose: Build a campaign title map from the reputation JSON data received from the extension.
// Saves the index to local storage for later use in the extension.

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "commendation-helper-extension" && event.data.type === "REPUTATION_JSON") {
    const reputationJson = event.data.data;
    const campaignTitleMap = buildCampaignTitleMap(reputationJson);

    chrome.storage.local.set({
      campaignTitleMap: campaignTitleMap,
      campaignTitleMapLastUpdated: Date.now()
    });
  }
});

function buildCampaignTitleMap(reputationJson) {
  const campaignTitleMap = {};

  for (const [companyName, companyData] of Object.entries(reputationJson)) {
    if (typeof companyData !== 'object') continue;

    if (companyData.Campaigns) {
      for (const [campaignName, campaignData] of Object.entries(companyData.Campaigns)) {
        if (campaignData.Title) {
          campaignTitleMap[`${companyName}/${campaignName}`] = sanitizeName(campaignData.Title);
        }
      }
    }
  }

  return campaignTitleMap;
}
