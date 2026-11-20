// The roadmap to the platinum: the order the official descriptions imply.
// Story first, then the stranger strands, then activities, collectibles and
// the open-world checklists, with the 100% completion clean-up last.
export const ROADMAP = [
  {
    order: 1,
    heading: 'Play the story',
    body: 'Chapters 1–4 and the final mission (trophies 2–13). Enjoy it first — Push Square notes the 100% checklist only unlocks after the story, and reviews put the story at about 60 hours.',
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    order: 2,
    heading: 'Clear the stranger strands',
    body: 'Andy, Kenton, Billy, Randy, Tyrone and Bret, plus other strangers — 8 strands for Strangers & Freaks. Do them in free roam after the story, when every location is open.',
    trophies: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    order: 3,
    heading: 'Activities',
    body: 'Gold all 42 Shooting Range challenges, win 20 races and drone races at all 14 locations, beat Cal at fishing, finish an arcade game, try all 9 activity types, and bank 250 stunts.',
    trophies: [15, 16, 17, 18, 19, 20, 21, 32, 46],
  },
  {
    order: 4,
    heading: 'Collectibles',
    body: 'WAiNK scans at 100 locations, 3 card sets, 100 vehicles discovered, all 18 meditation spots and every area of Leonida. Start meditating early — one spot is community-reported as missable.',
    trophies: [28, 30, 31, 35, 42],
  },
  {
    order: 5,
    heading: 'Open world & money',
    body: 'Robberies (5 bank vaults, an armored truck, a jewelry store unseen, one illegal operation per gang), launder $250,000 of Marked Bills, spend $100,000 in shops and buy all 8 garages.',
    trophies: [33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  },
  {
    order: 6,
    heading: 'Clean-up & 100%',
    body: 'Check the in-game 100% checklist (Progress / Stats), finish the last challenges and stunts, then A Long Road and the platinum, Vice Got a Price!, pop together.',
    trophies: [1, 14],
  },
];

export function buildRoadmap(listElement, earnedIds) {
  listElement.replaceChildren();
  for (const stage of ROADMAP) {
    const item = document.createElement('li');
    const title = document.createElement('h3');
    const number = document.createElement('span');
    number.className = 'stage-no';
    number.textContent = `Stage ${stage.order} — `;
    title.append(number, document.createTextNode(stage.heading));
    const text = document.createElement('p');
    text.textContent = stage.body;
    const done = stage.trophies.filter((id) => earnedIds.has(id)).length;
    const tally = document.createElement('p');
    tally.className = 'meta';
    tally.textContent = `${done} of ${stage.trophies.length} trophies in this stage earned`;
    item.append(title, text, tally);
    listElement.append(item);
  }
}
