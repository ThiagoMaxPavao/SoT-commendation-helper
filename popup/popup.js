document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsList = document.getElementById("results");
  const instruction = document.getElementById("instruction");
  const retryButton = document.getElementById("retry-button");
  const favoritesSection = document.getElementById("favorites-section");
  const favoritesList = document.getElementById("favorites-list");

  let commendationIndex = {};
  let translationMap = {};
  let currentLanguage = "en";
  let highlightedIndex = -1;
  let favorites = [];

  function loadCommendationIndex() {
    chrome.storage.local.get(["commendationIndex", "currentLanguage"], (data) => {
      if (data.commendationIndex && Object.keys(data.commendationIndex).length > 0) {
        commendationIndex = data.commendationIndex;
        currentLanguage = data.currentLanguage || "en";

        // Now load the translationMap for that language
        chrome.storage.local.get(`translationMap-${currentLanguage}`, (result) => {
          translationMap = result[`translationMap-${currentLanguage}`] || {};
          instruction.style.display = "none";
          searchInput.disabled = false;
          searchInput.focus();
        });
      } else {
        instruction.style.display = "block";
        searchInput.disabled = true;
      }
    });
  }

  function updateHighlight() {
    const items = resultsList.querySelectorAll("li");
    items.forEach((li, idx) => {
      if (idx === highlightedIndex) {
        li.classList.add("highlighted");
        li.scrollIntoView({ block: "nearest" });
      } else {
        li.classList.remove("highlighted");
      }
    });
  }

  // Load favorites from storage
  function loadFavorites(callback) {
    chrome.storage.local.get({ favorites: [] }, (data) => {
      favorites = data.favorites;
      if (callback) callback();
    });
  }

  // Save favorites to storage
  function saveFavorites() {
    chrome.storage.local.set({ favorites });
  }

  // Render favorites list
  function renderFavorites(commendationIndex) {
    favoritesList.innerHTML = "";
    if (favorites.length === 0) {
      favoritesSection.style.display = "none";
      return;
    }
    favoritesSection.style.display = "";
    favorites.forEach((fav) => {
      const commendation = commendationIndex[fav];
      if (!commendation) return;
      const li = document.createElement("li");
      li.textContent = commendation.name;
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.style.cursor = "pointer";

      // Star icon
      const star = document.createElement("span");
      star.innerHTML = getStarSVG(true);
      star.className = "star-icon";
      star.style.marginLeft = "8px";
      star.title = "Remove from favorites";
      star.onclick = (e) => {
        e.stopPropagation();
        favorites = favorites.filter((f) => f !== fav);
        saveFavorites();
        renderFavorites(commendationIndex);
        renderResults(commendationIndex, searchInput.value);
      };

      li.onclick = () => {
        // Your logic to go to the commendation
        goToCommendation(commendation);
      };
      li.appendChild(star);
      favoritesList.appendChild(li);
    });
  }

  // Render search results (add star logic)
  function renderResults(commendationIndex, query) {
    const sanitizedQuery = sanitizeName(query);
    resultsList.innerHTML = "";
    highlightedIndex = -1;

    if (query.length === 0) return;

    const matches = Object.keys(commendationIndex).filter((name) => {
      const englishName = translationMap[name] || "";
      return name.includes(sanitizedQuery) || englishName.includes(sanitizedQuery);
    });

    if (matches.length === 0) {
      const li = document.createElement("li");
      li.innerHTML = "You're on unknown waters!<br>No commendations were found.";
      li.style.fontStyle = "italic";
      li.style.textAlign = "center";
      li.style.color = "#bfa76f";
      li.style.cursor = "default"; // Remove pointer mouse
      resultsList.appendChild(li);
      return;
    }

    matches.forEach((match) => {
      const localName = commendationIndex[match].name;
      const englishName = translationMap[match];

      // Determine which one matches the query
      const localMatch = match.includes(sanitizedQuery);
      const englishMatch = englishName && englishName.includes(sanitizedQuery);

      // Choose the display name based on match
      let displayName;
      if (localMatch) {
        displayName = localName;
      } else if (englishMatch) {
        displayName = englishName;
      } else {
        // Shouldn't happen because we filtered matches already
        return;
      }

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      // Commendation name
      const nameSpan = document.createElement("span");
      nameSpan.textContent = displayName;

      // Star icon
      const star = document.createElement("span");
      star.innerHTML = getStarSVG(favorites.includes(match));
      star.className = "star-icon";
      star.title = favorites.includes(match) ? "Remove from favorites" : "Add to favorites";
      star.onclick = (e) => {
        e.stopPropagation();
        if (favorites.includes(match)) {
          favorites = favorites.filter((f) => f !== match);
        } else {
          favorites.push(match);
        }
        saveFavorites();
        renderFavorites(commendationIndex);
        renderResults(commendationIndex, searchInput.value);
      };

      li.appendChild(nameSpan);
      li.appendChild(star);

      li.addEventListener("click", () => {
        li.classList.add("clicked");
        setTimeout(() => li.classList.remove("clicked"), 300);

        const path = commendationIndex[match].path;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (
            activeTab &&
            new RegExp(`^https://www.seaofthieves.com(/[a-zA-Z-]+)?/profile/reputation(/.*)?`).test(activeTab.url)
          ) {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "navigateCommendation",
              path: path,
              commendationName: match,
            });
          } else {
            chrome.tabs.create({
              url: `https://www.seaofthieves.com/profile/reputation/${path}?highlight=${encodeURIComponent(match)}`,
            });
          }
        });
      });
      resultsList.appendChild(li);
    });
    updateHighlight();
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
    highlightedIndex = -1;

    if (query.length === 0) return;

    const sanitizedQuery = sanitizeName(query);

    const matches = Object.keys(commendationIndex).filter((name) => {
      const englishName = translationMap[name] || "";
      return name.includes(sanitizedQuery) || englishName.includes(sanitizedQuery);
    });

    if (matches.length === 0) {
      const li = document.createElement("li");
      li.innerHTML = "You're on unknown waters!<br>No commendations were found.";
      li.style.fontStyle = "italic";
      li.style.textAlign = "center";
      li.style.color = "#bfa76f";
      li.style.cursor = "default"; // Remove pointer mouse
      resultsList.appendChild(li);
      return;
    }

    matches.forEach((match) => {
      const localName = commendationIndex[match].name;
      const englishName = translationMap[match];

      // Determine which one matches the query
      const localMatch = match.includes(sanitizedQuery);
      const englishMatch = englishName && englishName.includes(sanitizedQuery);

      // Choose the display name based on match
      let displayName;
      if (localMatch) {
        displayName = localName;
      } else if (englishMatch) {
        displayName = englishName;
      } else {
        // Shouldn't happen because we filtered matches already
        return;
      }

      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";

      // Commendation name
      const nameSpan = document.createElement("span");
      nameSpan.textContent = displayName;

      // Star icon
      const star = document.createElement("span");
      star.innerHTML = getStarSVG(favorites.includes(match));
      star.className = "star-icon";
      star.title = favorites.includes(match) ? "Remove from favorites" : "Add to favorites";
      star.onclick = (e) => {
        e.stopPropagation();
        if (favorites.includes(match)) {
          favorites = favorites.filter((f) => f !== match);
        } else {
          favorites.push(match);
        }
        saveFavorites();
        renderFavorites(commendationIndex);
        renderResults(commendationIndex, searchInput.value);
      };

      li.appendChild(nameSpan);
      li.appendChild(star);

      li.addEventListener("click", () => {
        li.classList.add("clicked");
        setTimeout(() => li.classList.remove("clicked"), 300);

        const path = commendationIndex[match].path;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (
            activeTab &&
            new RegExp(`^https://www.seaofthieves.com(/[a-zA-Z-]+)?/profile/reputation(/.*)?`).test(activeTab.url)
          ) {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "navigateCommendation",
              path: path,
              commendationName: match,
            });
          } else {
            chrome.tabs.create({
              url: `https://www.seaofthieves.com/profile/reputation/${path}?highlight=${encodeURIComponent(match)}`,
            });
          }
        });
      });
      resultsList.appendChild(li);
    });
    updateHighlight();
  });

  searchInput.addEventListener("keydown", (e) => {
    const items = resultsList.querySelectorAll("li");
    if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) e.preventDefault();

    if (e.key === "ArrowDown") {
      if (items.length === 0) return;
      if (highlightedIndex === -1) highlightedIndex = 0;
      highlightedIndex = (highlightedIndex + 1) % items.length;
      updateHighlight();
    } else if (e.key === "ArrowUp") {
      if (items.length === 0) return;
      highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
      updateHighlight();
    } else if (e.key === "Enter") {
      if (items.length === 0) return;
      if (highlightedIndex === -1) highlightedIndex = 0;
      items[highlightedIndex].click();
    }
  });

  // Show/hide favorites based on search
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim() === "") {
      renderFavorites(commendationIndex);
    } else {
      favoritesSection.style.display = "none";
    }
    renderResults(commendationIndex, searchInput.value);
  });

  // On load
  loadFavorites(() => {
    // ...load commendationIndex, then:
    renderFavorites(commendationIndex);
    renderResults(commendationIndex, "");
  });
});

// Moved SVG fetching and star rendering logic here
let hollowStarSVG = "";
let filledStarSVG = "";

// Load SVGs at startup
fetch("star.svg")
  .then((res) => res.text())
  .then((svg) => {
    hollowStarSVG = svg;
    // Create filled version by replacing fill="none" or adding fill="#FFD700"
    filledStarSVG = svg.replace(/fill="none"/, 'fill="#FFD700"');
  });

function getStarSVG(filled = false) {
  return filled ? filledStarSVG : hollowStarSVG;
}
