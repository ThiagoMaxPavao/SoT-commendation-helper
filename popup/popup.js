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
        const url = `https://www.seaofthieves.com/profile/reputation/${path}`;
        chrome.tabs.create({ url: url });
      });
      resultsList.appendChild(li);
    });
  });
});
