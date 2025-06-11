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

      const name = el.innerText.trim();
      const match = wikiCommendationRewards[name];

      const rewardsText = document.createElement('div');
      rewardsText.className = 'sot-rewards-text';
      rewardsText.style.fontSize = '12px';
      rewardsText.style.color = '#ccc';

      if (!match)
        rewardsText.innerHTML = '<strong>Rewards not found!</strong>';
      else if (match.rewards === 'n/a')
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
