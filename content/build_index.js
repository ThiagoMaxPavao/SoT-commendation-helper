// Purpose: Build a commendation index from the reputation JSON data received from the extension.
// Saves the index to local storage for later use in the extension.

// Inject the page-inject script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('intercept_reputation.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "commendation-helper-extension" && event.data.type === "REPUTATION_JSON") {
    const reputationJson = event.data.data;
    const { index, campaignTitleMap } = buildCommendationIndex(reputationJson);

    chrome.storage.local.set({
      commendationIndex: index,
      commendationIndexLastUpdated: Date.now(),
      campaignTitleMap: campaignTitleMap,
      campaignTitleMapLastUpdated: Date.now(),
    });
  }
});

function buildCommendationIndex(reputationJson) {
  const index = {};
  const campaignTitleMap = {};

  for (const [companyName, companyData] of Object.entries(reputationJson)) {
    if (typeof companyData !== 'object') continue;

    // Base-level commendations (without campaigns)
    if (companyData.Emblems && Array.isArray(companyData.Emblems.Emblems)) {
      companyData.Emblems.Emblems.forEach(commendation => {
        if (commendation.DisplayName) {
          index[sanitizeName(commendation.DisplayName)] = {
            name: commendation.DisplayName,
            path: `${companyName}`
          };
        }
      });
    }

    // Campaign commendations
    if (companyData.Campaigns) {
      for (const [campaignName, campaignData] of Object.entries(companyData.Campaigns)) {
        // Map path to Campaign Title
        if (campaignData.Title) {
          campaignTitleMap[`${companyName}/${campaignName}`] = sanitizeName(campaignData.Title);
        }

        // Map commendations inside campaign
        if (campaignData.Emblems && Array.isArray(campaignData.Emblems)) {
          campaignData.Emblems.forEach(commendation => {
            if (commendation.DisplayName) {
              index[sanitizeName(commendation.DisplayName)] = {
                name: commendation.DisplayName,
                path: `${companyName}/${campaignName}`
              };
            }
          });
        }
      }
    }
  }

  return { index, campaignTitleMap };
}
