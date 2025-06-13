// Purpose: Injects commendation rewards into the commendation page of Sea of Thieves.

function linkifyRewardsText(rewardText, links) {
  // Sort links by text length descending to prioritize longer matches
  links.sort((a, b) => b.text.length - a.text.length);

  const validLinks = links.filter(link => link.text.trim() !== "");
  if (validLinks.length === 0) return rewardText; // return if there are no links

  // Escape and join all texts into a single regex pattern
  const pattern = validLinks.map(link =>
    link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');

  const regex = new RegExp(pattern, 'g');

  const updatedText = rewardText.replace(regex, match => {
    const link = validLinks.find(l => l.text === match);
    return `<a href="${link.href}" target="_blank">${match}</a>`;
  });

  return updatedText;
}

function isRewardException(name) {
  if (name.endsWith("title")) return true;

  const curses = [
    "the ashen curse",
    "shores of gold curse",
    "wild seas curse",
    "order of souls eye curse",
    "curse of sunken sorrow",
  ];
  if (curses.includes(name)) return true;

  const clothing = [
    "gold hoarder jacket",
    "briggsys hat",
    "circus superstar costume",
    "cursed captains hat",
    "pirate lords hat",
    "pirate lords jacket",
    "tavern chefs uniform",
  ];
  if (clothing.includes(name)) return true;

  const ship = [
    "gold hoarder figurehead",
    "ashen dragon hull",
    "ashen dragon sails",
    "briggsys sails",
    "cannons of sunken sorrow",
    "cursed captains sails",
    "figurehead of sunken sorrow",
    "hull of sunken sorrow",
    "magpies fortune sails",
    "magpies wing cannons",
    "morningstar figurehead",
    "morningstar flag",
    "morningstar hull",
    "morningstar sails",
    "revenge of the silver blade capstan",
    "trapmakers capstan",
    "wild rose wheel",
  ];
  if (ship.includes(name)) return true;

  const equipment = [
    "ancient spyglass",
    "banjo of the damned",
    "concertina of the damned",
    "drum of the damned",
    "hurdy-gurdy of the damned",
    "tankard of the damned",
    "rum bottle spyglass",
    "roses compass",
  ];
  if (equipment.includes(name)) return true;

  const shanties = [
    "monkey island shanty",
    "yo ho a pirates life shanty",
  ];
  if (shanties.includes(name)) return true;

  const weapons = [
    "briggsys sword",
    "burning blade cutlass",
    "pendragons sword of souls",
    "pistol of sunken sorrow",
    "revenge of the silver blade cutlass",
    "the legend of monkey island cutlass",
  ];
  if (weapons.includes(name)) return true;

  const other = [
    "constellation tattoo set",
    "governor guybrush portrait",
    "idol o many hands",
    "leChuck portrait",
    "legend of monkey island figurines",
    "melee by moonlight",
  ];
  if (other.includes(name)) return true;

  return false;
}

// Declare observer in a wider scope so you can access it inside the callback
let observer;

function processCommendationsWithTranslation(wikiCommendationRewards, translationMap) {
  // Disconnect observer to prevent infinite loop
  if (observer) observer.disconnect();

  const commendations = document.querySelectorAll('.emblem-item__title');
  commendations.forEach(el => {
    // Remove existing rewards text if present
    const existing = el.querySelector('.sot-rewards-text');
    if (existing) existing.remove();

    let name = sanitizeName(el.innerText.trim());
    // Translate to English if translationMap is present
    if (translationMap && translationMap[name]) {
      name = translationMap[name];
    }
    if (isRewardException(name)) return;

    const match = wikiCommendationRewards[name];

    // Create rewardsText container
    const rewardsText = document.createElement('div');
    rewardsText.className = 'sot-rewards-text';
    rewardsText.style.fontSize = '12px';
    rewardsText.style.color = '#ccc';

    if (!match) {
      // Create warning icon
      const warningIcon = document.createElement('span');
      warningIcon.innerHTML = '⚠️';
      warningIcon.title = 'Rewards not found! Click for more info.';
      warningIcon.style.cursor = 'pointer';
      warningIcon.style.marginRight = '6px';

      // Create text
      const text = document.createElement('span');
      text.innerHTML = '<strong>Rewards not found!</strong>';
      text.style.cursor = 'pointer';

      // Style the rewardsText container
      rewardsText.style.display = 'flex';
      rewardsText.style.alignItems = 'center';
      rewardsText.style.gap = '4px';
      rewardsText.style.cursor = 'pointer';

      // Popup handler
      const showPopup = () => {
        // Create popup container
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100vw';
        popup.style.height = '100vh';
        popup.style.background = 'rgba(0,0,0,0.6)';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.justifyContent = 'center';
        popup.style.zIndex = '9999';

        // Create popup content
        const content = document.createElement('div');
        content.style.background = '#222';
        content.style.color = '#fff';
        content.style.padding = '24px 32px';
        content.style.borderRadius = '8px';
        content.style.boxShadow = '0 2px 16px rgba(0,0,0,0.5)';
        content.style.textAlign = 'center';
        content.innerHTML = `
          <h2>Commendation Rewards Not Found</h2>
          <p>
            The rewards for this commendation were not found locally.<br>
            <br>
            <strong>If your current language is not English, this may also be caused by missing translations.</strong><br>
            Please switch the website to English and visit the commendations page to update the translation table.<br>
            You can switch back to your language after that.<br>
            <br>
            You can visit the wiki page to update local commendations:<br>
            <a href="https://seaofthieves.wiki.gg/wiki/Commendations" target="_blank" style="color:#4fc3f7;">https://seaofthieves.wiki.gg/wiki/Commendations</a>
          </p>
          <button id="sot-close-warning-popup" style="margin-top:16px;margin-right:8px;padding:8px 16px;border:none;border-radius:4px;background:#4fc3f7;color:#222;font-weight:bold;cursor:pointer;">Close</button>
          <button id="sot-reload-warning-popup" style="margin-top:16px;padding:8px 16px;border:none;border-radius:4px;background:#ffb300;color:#222;font-weight:bold;cursor:pointer;">Reload</button>
        `;

        content.querySelector('#sot-close-warning-popup').onclick = () => popup.remove();
        content.querySelector('#sot-reload-warning-popup').onclick = () => location.reload();

        popup.appendChild(content);
        document.body.appendChild(popup);
      };

      // Make the whole rewardsText clickable
      rewardsText.onclick = showPopup;

      rewardsText.appendChild(warningIcon);
      rewardsText.appendChild(text);
      el.appendChild(rewardsText);
    } else if (match.rewards === 'n/a') {
      rewardsText.innerHTML = '<strong>No Rewards.</strong>';
      el.appendChild(rewardsText);
    } else {
      rewardsText.innerHTML = `<strong>Rewards:</strong> ${linkifyRewardsText(match.rewards, match.links)}`;
      el.appendChild(rewardsText);
    }
  });

  // Reconnect observer after DOM updates
  if (observer) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

chrome.storage.local.get("wikiCommendationRewards", function handleStorage({ wikiCommendationRewards }) {
  if (!wikiCommendationRewards) {
    // Create popup container
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100vw';
    popup.style.height = '100vh';
    popup.style.background = 'rgba(0,0,0,0.6)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.style.zIndex = '9999';

    // Create popup content
    const content = document.createElement('div');
    content.style.background = '#222';
    content.style.color = '#fff';
    content.style.padding = '24px 32px';
    content.style.borderRadius = '8px';
    content.style.boxShadow = '0 2px 16px rgba(0,0,0,0.5)';
    content.style.textAlign = 'center';
    content.innerHTML = `
      <h2>Commendation Rewards Not Loaded</h2>
      <p>To load rewards, please visit:<br>
        <a href="https://seaofthieves.wiki.gg/wiki/Commendations" target="_blank" style="color:#4fc3f7;">seaofthieves.wiki.gg/wiki/Commendations</a>
      </p>
      <p style="margin-top:16px;">
        If you already did... 
        <button id="sot-retry-popup" style="padding:6px 14px;border:none;border-radius:4px;background:#4fc3f7;color:#222;font-weight:bold;cursor:pointer;">Retry</button>
      </p>
      <button id="sot-close-popup" style="margin-top:16px;padding:8px 16px;border:none;border-radius:4px;background:#4fc3f7;color:#222;font-weight:bold;cursor:pointer;">Close</button>
    `;

    // Close button handler
    content.querySelector('#sot-close-popup').onclick = () => popup.remove();

    // Retry button handler
    content.querySelector('#sot-retry-popup').onclick = () => {
      popup.remove();
      chrome.storage.local.get("wikiCommendationRewards", handleStorage);
    };

    popup.appendChild(content);
    document.body.appendChild(popup);

    return;
  }

  const langMatch = location.pathname.match(/^\/([a-zA-Z-]+)(?=\/profile\/reputation)/);
  const lang = langMatch ? langMatch[1] : "en";

  if (lang === "en") {
    processCommendationsWithTranslation(wikiCommendationRewards, null);
  } else {
    chrome.storage.local.get([`translationMap-${lang}`], (result) => {
      const translationMap = result[`translationMap-${lang}`] || {};
      processCommendationsWithTranslation(wikiCommendationRewards, translationMap);
    });
  }

  observer = new MutationObserver(() => {
    if (lang === "en") {
      processCommendationsWithTranslation(wikiCommendationRewards, null);
    } else {
      chrome.storage.local.get([`translationMap-${lang}`], (result) => {
        const translationMap = result[`translationMap-${lang}`] || {};
        processCommendationsWithTranslation(wikiCommendationRewards, translationMap);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[`translationMap-${lang}`]) {
      chrome.storage.local.get([`translationMap-${lang}`], (result) => {
        const translationMap = result[`translationMap-${lang}`] || {};
        processCommendationsWithTranslation(wikiCommendationRewards, translationMap);
      });
    }
  });
});
