// Purpose: Injects commendation rewards into the commendation page of Sea of Thieves.

function linkifyRewardsText(rewardText, links) {
  let updatedText = rewardText;

  links.forEach(link => {
    const escapedText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedText}\\b`, 'g');
    updatedText = updatedText.replace(regex, `<a href="${link.href}" target="_blank">${link.text}</a>`);
  });

  return updatedText;
}

fetch(chrome.runtime.getURL('commendations.json'))
.then(response => response.json())
.then(data => {
  function processCommendations() {
    const commendations = document.querySelectorAll('.emblem-item__title');
    commendations.forEach(el => {
      if (el.querySelector('.sot-rewards-text')) return;

      const name = el.innerText.trim();
      const match = data.find(item => item.commendation === name);

      const rewardsText = document.createElement('div');
      rewardsText.className = 'sot-rewards-text';
      rewardsText.style.fontSize = '12px';
      rewardsText.style.color = '#ccc';

      if (!match)
        rewardsText.innerHTML = '<strong>Rewards not found!</strong>';
      else if (match.rewards == 'n/a')
        rewardsText.innerHTML = '<strong>No Rewards.</strong>';
      else
        rewardsText.innerHTML = `<strong>Rewards:</strong> ${linkifyRewardsText(match.rewards, match.links)}`;

      el.appendChild(rewardsText);
    });
  }

  processCommendations();

  const observer = new MutationObserver(() => {
    processCommendations();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})
.catch(err => console.error(err));
