// Purpose: Extracts commendation rewards from the Sea of Thieves wiki page and saves them to local storage for later use in the extension.

function extractCommendationsFromWiki() {
  const rows = document.querySelectorAll('table tbody tr');
  const result = {};

  rows.forEach(row => {
    const th_cells = row.querySelectorAll('th');
    const td_cells = row.querySelectorAll('td');
    if (th_cells.length === 2 && td_cells.length === 2) {
      const commendation = th_cells[1].innerText.trim();
      const rewardsCell = td_cells[1];

      // Substituir imagens de Doubloons e Gold pelo alt text
      rewardsCell.querySelectorAll('img[alt]').forEach(img => {
        if (img.alt !== "Doubloons" && img.alt !== "Gold") return;
        const altText = document.createTextNode(img.alt);
        img.parentNode.replaceChild(altText, img);
      });

      const rewards = rewardsCell.textContent.trim();
      const links = Array.from(rewardsCell.querySelectorAll('a'))
        .map(a => ({
          text: a.innerText.trim(),
          href: a.href
        }))
        .filter(link => link.text !== "Doubloons" && link.text !== "Gold");
      
      result[sanitizeName(commendation)] = { name: commendation, rewards, links };
    }
  });

  // Salva no local storage da extensão
  chrome.storage.local.set({ wikiCommendationRewards: result, wikiCommendationRewardsLastUpdated: Date.now() }, () => {
    logger.log("Rewards extracted and saved to local storage.");

    // Show success popup
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

    const content = document.createElement('div');
    content.style.background = '#222';
    content.style.color = '#fff';
    content.style.padding = '24px 32px';
    content.style.borderRadius = '8px';
    content.style.boxShadow = '0 2px 16px rgba(0,0,0,0.5)';
    content.style.textAlign = 'center';
    content.innerHTML = `
      <h2>Commendation Rewards Loaded!</h2>
      <p>The commendation rewards were successfully loaded and will now be available with the commendations on the Sea of Thieves official website.</p>
      <button id="sot-close-success-popup" style="margin-top:16px;padding:8px 16px;border:none;border-radius:4px;background:#4fc3f7;color:#222;font-weight:bold;cursor:pointer;">Close</button>
    `;

    content.querySelector('#sot-close-success-popup').onclick = () => popup.remove();

    popup.appendChild(content);
    document.body.appendChild(popup);
  });
}

// Executa a extração automaticamente
extractCommendationsFromWiki();
