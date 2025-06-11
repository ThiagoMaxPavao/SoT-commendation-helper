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
      
      result[commendation] = { rewards, links };
    }
  });

  console.log("Commendations extraídas:", result);

  // Salva no local storage da extensão
  chrome.storage.local.set({ wikiCommendationRewards: result, wikiCommendationRewardsLastUpdated: Date.now() }, () => {
    console.log("Commendations extraídas e salvas com sucesso.");
  });
}

// Executa a extração automaticamente
extractCommendationsFromWiki();
