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

chrome.storage.local.get("wikiCommendationRewards", ({ wikiCommendationRewards }) => {
  if (!wikiCommendationRewards) {
    console.error("Commendation rewards not found in local storage.");
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
