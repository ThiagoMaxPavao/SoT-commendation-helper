const rows = document.querySelectorAll('table tbody tr');
const result = [];

rows.forEach(row => {
  const th_cells = row.querySelectorAll('th');
  const td_cells = row.querySelectorAll('td');
  if (th_cells.length == 2 && td_cells.length == 2) {
    const commendation = th_cells[1].innerText.trim();
    const rewardsCell = td_cells[1];
    const rewards = td_cells[1].innerText.trim();
    const links = Array.from(rewardsCell.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }));
    result.push({ commendation, rewards, links });
  }
});

console.log(JSON.stringify(result, null, 2));
