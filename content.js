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
        // Prevent adding rewards multiple times
        if (el.querySelector('.sot-rewards-text')) return;

        const name = el.innerText.trim();
        const match = data.find(item => item.commendation === name);
        if (match) {
          const rewardsText = document.createElement('div');
          rewardsText.className = 'sot-rewards-text';
          rewardsText.style.fontSize = '12px';
          rewardsText.style.color = '#ccc';
          rewardsText.innerHTML = `<strong>Rewards:</strong> ${linkifyRewardsText(match.rewards, match.links)}`;
          el.appendChild(rewardsText);
        }
      });
    }

    // Initial run
    processCommendations();

    // Observe DOM changes
    const observer = new MutationObserver(() => {
      processCommendations();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  })
  .catch(err => console.error(err));
