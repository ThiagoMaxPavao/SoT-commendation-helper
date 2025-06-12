// Purpose: Build a commendation index from the reputation JSON data received from the extension.
// Saves the index to local storage for later use in the extension.

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "commendation-helper-extension" && event.data.type === "REPUTATION_JSON") {
    const reputationJson = event.data.data;
    const index = buildCommendationIndex(reputationJson);

    chrome.storage.local.set({
      commendationIndex: index,
      commendationIndexLastUpdated: Date.now()
    });
  }
});

function buildCommendationIndex(reputationJson) {
  const index = {};

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

  return index;
}
