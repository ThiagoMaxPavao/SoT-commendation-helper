// Purpose: Build the processed reputation from the JSON. Used by the explorer

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "commendation-helper-extension" && event.data.type === "REPUTATION_JSON") {
    const reputationJson = event.data.data;
    const processedReputation = buildProcessedReputation(reputationJson);

    chrome.storage.local.set({
      processedReputation: processedReputation,
      processedReputationLastUpdated: Date.now()
    });
  }
});

function processCommendation(commendation, location, campaign = null) {
  const {
    DisplayName,
    ["#Name"]: hashName,
    Description,
    Completed,
    image,
    HasScalar,
    Grade,
    MaxGrade,
    Value,
    Threshold
  } = commendation;

  return {
    name: DisplayName || hashName || "Unknown Commendation",
    description: Description || "No description available",
    completed: Completed || false,
    image,
    hasScalar: HasScalar || false,
    grade: Grade || 0,
    maxGrade: MaxGrade || 0,
    value: Value || 0,
    threshold: Threshold || 0,
    location: location || "Unknown Location",
    campaign: campaign || null
  };
}

function buildProcessedReputation(reputationJson) {
  const processedReputation = [];

  for (const [companyName, companyData] of Object.entries(reputationJson)) {
    if (typeof companyData !== 'object') continue;

    // Base-level commendations (without campaigns)
    if (companyData.Emblems && Array.isArray(companyData.Emblems.Emblems)) {
      companyData.Emblems.Emblems.forEach(commendation => {
        processedReputation.push(processCommendation(commendation, companyName));
      });
    }

    // Campaign commendations
    if (companyData.Campaigns) {
      for (const [, campaignData] of Object.entries(companyData.Campaigns)) {
        // Map commendations inside campaign
        if (campaignData.Emblems && Array.isArray(campaignData.Emblems)) {
          campaignData.Emblems.forEach(commendation => {
            processedReputation.push(processCommendation(commendation, companyName, campaignData.Title));
          });
        }
      }
    }
  }

  return processedReputation;
}
