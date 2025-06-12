// Listen for messages from the injected script
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.source === "commendation-helper-extension" && event.data.type === "REPUTATION_JSON") {
        const reputationJson = event.data.data;
        const languageMap = buildLanguageIdMap(reputationJson);

        const langMatch = location.pathname.match(/^\/([a-zA-Z-]+)(?=\/profile\/reputation)/);
        const lang = langMatch ? langMatch[1] : "en";

        if(lang === "en") {
            chrome.storage.local.set({
                [`languageMap`]: invertDictionary(languageMap),
                [`languageMap-LastUpdated`]: Date.now()
            });
        }
        else {
            chrome.storage.local.get(["languageMap"], (result) => {
                const englishMap = result["languageMap"];
                if (!englishMap) {
                    console.warn("No English languageMap found in storage.");
                    return;
                }

                const foreignToEnglishMap = {};

                // Loop through each foreign language commendation name → ID
                for (const [foreignName, id] of Object.entries(languageMap)) {
                    const englishName = englishMap[id];
                    if (englishName) {
                        foreignToEnglishMap[foreignName] = englishName;
                    }
                }

                // Save this mapping for the current language
                chrome.storage.local.set({
                    [`translationMap-${lang}`]: foreignToEnglishMap,
                    [`translationMap-${lang}-LastUpdated`]: Date.now()
                });
            });
        }
    }
});

function buildLanguageIdMap(reputationJson) {
  const languageMap = {};

  for (const [companyName, companyData] of Object.entries(reputationJson)) {
    if (typeof companyData !== 'object') continue;

    // Base-level commendations (without campaigns)
    if (companyData.Emblems && Array.isArray(companyData.Emblems.Emblems)) {
      companyData.Emblems.Emblems.forEach(commendation => {
        if (commendation.DisplayName && commendation.Image) {
            languageMap[sanitizeName(commendation.DisplayName)] = commendation.Image.split('.')[0];
        }
      });
    }

    // Campaign commendations
    if (companyData.Campaigns) {
      for (const [campaignName, campaignData] of Object.entries(companyData.Campaigns)) {
        // Map commendations inside campaign
        if (campaignData.Emblems && Array.isArray(campaignData.Emblems)) {
          campaignData.Emblems.forEach(commendation => {
            if (commendation.DisplayName && commendation.Image) {
                languageMap[sanitizeName(commendation.DisplayName)] = commendation.Image.split('.')[0];
            }
          });
        }
      }
    }
  }

  return languageMap;
}

function invertDictionary(obj) {
  const inverted = {};
  for (const [key, value] of Object.entries(obj)) {
    inverted[value] = key;
  }
  return inverted;
}
