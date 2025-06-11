document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsList = document.getElementById("results");

  let commendationIndex = {};

  chrome.storage.local.get("commendationIndex", (data) => {
    commendationIndex = data.commendationIndex || {};
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    resultsList.innerHTML = "";

    if (query.length === 0) return;

    const matches = Object.keys(commendationIndex).filter(name =>
      name.toLowerCase().includes(query)
    );

    matches.forEach(match => {
      const li = document.createElement("li");
      li.textContent = match;
      li.addEventListener("click", () => {
        const path = commendationIndex[match];

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.url.startsWith("https://www.seaofthieves.com/profile/reputation")) {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "navigateCommendation",
              path: path,
              commendationName: match
            });
          } else {
            chrome.tabs.create({
              url: `https://www.seaofthieves.com/profile/reputation/${path}?highlight=${encodeURIComponent(match)}`
            });
          }
        });
      });
      resultsList.appendChild(li);
    });
  });
});
