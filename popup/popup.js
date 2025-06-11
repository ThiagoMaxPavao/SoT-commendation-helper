document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsList = document.getElementById("results");
  const instruction = document.getElementById("instruction");
  const retryButton = document.getElementById("retry-button");

  let commendationIndex = {};

  function loadCommendationIndex() {
    chrome.storage.local.get("commendationIndex", (data) => {
      if (data.commendationIndex && Object.keys(data.commendationIndex).length > 0) {
        commendationIndex = data.commendationIndex;
        instruction.style.display = "none";
        searchInput.disabled = false;
      } else {
        instruction.style.display = "block";
        searchInput.disabled = true;
      }
    });
  }

  // Initial load
  loadCommendationIndex();

  // Retry button click
  retryButton.addEventListener("click", () => {
    loadCommendationIndex();
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    resultsList.innerHTML = "";

    if (query.length === 0) return;

    const matches = Object.keys(commendationIndex).filter(name =>
      name.toLowerCase().includes(sanitizeName(query))
    );

    matches.forEach(match => {
      const li = document.createElement("li");
      const name = commendationIndex[match].name;
      li.textContent = name;
      li.addEventListener("click", () => {
        const path = commendationIndex[match].path;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && activeTab.url.startsWith("https://www.seaofthieves.com/profile/reputation")) {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "navigateCommendation",
              path: path,
              commendationName: name
            });
          } else {
            chrome.tabs.create({
              url: `https://www.seaofthieves.com/profile/reputation/${path}?highlight=${encodeURIComponent(name)}`
            });
          }
        });
      });
      resultsList.appendChild(li);
    });
  });
});
