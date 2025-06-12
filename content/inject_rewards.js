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
  if (name.endsWith("Title")) return true;
  if (name.endsWith("Title.")) return true; // Exclude titles

  const curses = [
    "The Ashen Curse",
    "Shores of Gold Curse",
    "Wild Seas Curse",
    "Order of Souls Eye Curse",
    "Curse of Sunken Sorrow",
  ];
  if (curses.includes(name)) return true;

  const clothing = [
    "Gold Hoarder Jacket",
    "Briggsys Hat",
    "Circus Superstar Costume",
    "Cursed Captains Hat",
    "Pirate Lords Hat",
    "Pirate Lords Jacket",
    "Tavern Chefs Uniform",
  ];
  if (clothing.includes(name)) return true;

  const ship = [
    "Gold Hoarder Figurehead",
    "Ashen Dragon Hull",
    "Ashen Dragon Sails",
    "Briggsys Sails",
    "Cannons of Sunken Sorrow",
    "Cursed Captains Sails",
    "Figurehead of Sunken Sorrow",
    "Hull of Sunken Sorrow",
    "Magpies Fortune Sails",
    "Magpies Wing Cannons",
    "Morningstar Figurehead",
    "Morningstar Flag",
    "Morningstar Hull",
    "Morningstar Sails",
    "Revenge of the Silver Blade Capstan",
    "Trapmakers Capstan",
    "Wild Rose Wheel",
  ];
  if (ship.includes(name)) return true;

  const equipment = [
    "Ancient Spyglass",
    "Banjo of the Damned",
    "Concertina of the Damned",
    "Drum of the Damned",
    "Hurdy-Gurdy of the Damned",
    "Rum Bottle Spyglass",
    "Roses Compass",
  ];
  if (equipment.includes(name)) return true;

  const shanties = [
    "Monkey Island Shanty",
    "Yo Ho A Pirates Life Shanty",
  ];
  if (shanties.includes(name)) return true;

  const weapons = [
    "Briggsys Sword",
    "Burning Blade Cutlass",
    "Pendragons Sword of Souls",
    "Pistol of Sunken Sorrow",
    "Revenge of the Silver Blade Cutlass",
    "The Legend of Monkey Island Cutlass",
  ];
  if (weapons.includes(name)) return true;

  const other = [
    "Constellation Tattoo Set",
    "Governor Guybrush Portrait",
    "Idol o Many Hands",
    "LeChuck Portrait",
    "Legend of Monkey Island Figurines",
    "Mêlée by Moonlight",
  ];
  if (other.includes(name)) return true;

  return false;
}

chrome.storage.local.get(["wikiCommendationRewards", "commendationIndex"], (data) => {
  const rewards = data.wikiCommendationRewards || {};
  const index = data.commendationIndex || {};

  const missingCommendations = Object.keys(index).filter(name => !(name in rewards));

  const filteredCommendations = missingCommendations.filter(name => !isRewardException(name));

  logger.warn("Commendations missing rewards (filtered):", filteredCommendations);
});

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

  function processCommendations() {
    const commendations = document.querySelectorAll('.emblem-item__title');
    commendations.forEach(el => {
      // Impede adicionar rewards mais de uma vez
      if (el.querySelector('.sot-rewards-text')) return;

      const name = sanitizeName(el.innerText.trim());
      if(isRewardException(name)) return;

      const match = wikiCommendationRewards[name];

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

        // Popup handler
        warningIcon.onclick = () => {
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

        rewardsText.appendChild(warningIcon);
        const text = document.createElement('span');
        text.innerHTML = '<strong>Rewards not found!</strong>';
        rewardsText.appendChild(text);
      } else if (match.rewards === 'n/a')
        rewardsText.innerHTML = '<strong>No Rewards.</strong>';
      else
        rewardsText.innerHTML = `<strong>Rewards:</strong> ${linkifyRewardsText(match.rewards, match.links)}`;

      el.appendChild(rewardsText);
    });
  }

  // Primeira execução
  processCommendations();

  // Observar mudanças no DOM
  const observer = new MutationObserver(() => {
    processCommendations();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
