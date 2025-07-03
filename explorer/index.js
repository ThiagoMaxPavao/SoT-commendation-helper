// Get filter state from UI
function getFilters() {
  const hideUncompleted = document.getElementById('hide-uncompleted')?.checked;
  const hideCompleted = document.getElementById('hide-completed')?.checked;
  const locationCheckboxes = document.querySelectorAll('.location-filter');
  const enabledLocations = Array.from(locationCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  return {
    hideUncompleted,
    hideCompleted,
    enabledLocations
  };
}

// Load commendations and populate table
function updateTable() {
  chrome.storage.local.get(['processedReputation'], (result) => {
    const data = result.processedReputation;
    const tbody = document.querySelector("#commendation-table tbody");
    tbody.innerHTML = ""; // Clear previous rows

    if (!data) {
      document.querySelector('#table-container').innerHTML = "<p>No commendations found.</p>";
      return;
    }

    const filters = getFilters();

    data.forEach((item) => {
      // Filter by completed/uncompleted
      if (filters.hideUncompleted && !item.completed) return;
      if (filters.hideCompleted && item.completed) return;
      // Filter by location
      if (!filters.enabledLocations.includes(item.location)) return;

      const tr = document.createElement("tr");

      // Image
      const imgTd = document.createElement("td");
      const img = document.createElement("img");
      img.src = item.image;
      img.classList.add("commendation-icon");
      imgTd.appendChild(img);
      tr.appendChild(imgTd);

      // Name
      const nameTd = document.createElement("td");
      nameTd.textContent = item.name;
      tr.appendChild(nameTd);

      // Description
      const descTd = document.createElement("td");
      descTd.textContent = item.description;
      tr.appendChild(descTd);

      // Location
      const locationTd = document.createElement("td");
      locationTd.textContent = item.location;
      tr.appendChild(locationTd);

      // Campaign
      const campaignTd = document.createElement("td");
      campaignTd.textContent = item.campaign;
      tr.appendChild(campaignTd);

      // Completed
      const completedTd = document.createElement("td");
      const completedIcon = document.createElement("div");

      if (item.completed) {
        const tickImg = document.createElement("img");
        tickImg.src = "tick.svg";
        tickImg.alt = "Completed";
        tickImg.classList.add("tick-icon");
        completedIcon.appendChild(tickImg);
      }

      completedTd.appendChild(completedIcon);
      tr.appendChild(completedTd);

      // Progress
      const progressTd = document.createElement("td");
      if (item.hasScalar) {
        progressTd.textContent = `${item.value}/${item.threshold}`;
      } else {
        progressTd.textContent = "";
      }
      tr.appendChild(progressTd);

      // Grade
      const gradeTd = document.createElement("td");
      if (item.hasScalar && item.maxGrade > 1) {
        gradeTd.textContent = `${item.grade}/${item.maxGrade}`;
      } else {
        gradeTd.textContent = "";
      }
      tr.appendChild(gradeTd);

      tbody.appendChild(tr);
    });
  });
}

// Add event listeners for filters
function setupFilters() {
  const filterIds = ['hide-uncompleted', 'hide-completed'];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateTable);
  });
  const locationCheckboxes = document.querySelectorAll('.location-filter');
  locationCheckboxes.forEach(cb => cb.addEventListener('change', updateTable));
}

function updateLastUpdated() {
  chrome.storage.local.get(['processedReputationLastUpdated'], (result) => {
    const lastUpdatedElem = document.getElementById('last-updated');
    if (!lastUpdatedElem) return;
    if (result.processedReputationLastUpdated) {
      const date = new Date(result.processedReputationLastUpdated);
      lastUpdatedElem.textContent = `Last updated: ${date.toLocaleString()}`;
    } else {
      lastUpdatedElem.textContent = "Never updated";
    }
  });
}

// Initial load
updateTable();
updateLastUpdated();
setupFilters();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.processedReputation) {
      updateTable();
    }
    if (changes.processedReputationLastUpdated) {
      updateLastUpdated();
    }
  }
});
