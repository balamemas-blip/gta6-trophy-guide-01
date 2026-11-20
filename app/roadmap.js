// The roadmap to the platinum, in the order the official descriptions
// imply: story first, then stranger strands, then activities, collectibles
// and the open-world checklists, with 100% completion last.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Play the story',
    text: 'Chapters 1–4 and the final mission (trophies 2–13). Enjoy it first — Push Square notes the 100% checklist only unlocks after the story, and reviews put the story at about 60 hours.',
  },
  {
    stage: 2,
    title: 'Clear the stranger strands',
    text: 'Andy, Kenton, Billy, Randy, Tyrone and Bret, plus other strangers — 8 strands for Strangers & Freaks. Do them in free roam after the story, when every location is open.',
  },
  {
    stage: 3,
    title: 'Activities',
    text: 'Gold all 42 Shooting Range challenges, win 20 races and drone races at all 14 locations, beat Cal at fishing, finish an arcade game, try all 9 activity types, and bank 250 stunts.',
  },
  {
    stage: 4,
    title: 'Collectibles',
    text: 'WAiNK scans at 100 locations, 3 card sets, 100 vehicles discovered, all 18 meditation spots and every area of Leonida. Start meditating early — one spot is community-reported as missable.',
  },
  {
    stage: 5,
    title: 'Open world & money',
    text: 'Robberies (5 bank vaults, an armored truck, a jewelry store unseen, one illegal operation per gang), launder $250,000 of Marked Bills, spend $100,000 in shops and buy all 8 garages.',
  },
  {
    stage: 6,
    title: 'Clean-up & 100%',
    text: 'Check the in-game 100% checklist (Progress / Stats), finish the last challenges and stunts, then A Long Road and the platinum, Vice Got a Price!, pop together.',
  },
];

export function renderRoadmap(listEl) {
  listEl.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    const num = document.createElement('span');
    num.textContent = `Stage ${s.stage} — `;
    h.append(num, document.createTextNode(s.title));
    const p = document.createElement('p');
    p.textContent = s.text;
    li.append(h, p);
    listEl.append(li);
  }
}
