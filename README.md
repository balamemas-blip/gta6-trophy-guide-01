# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/balamemas-blip/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/balamemas-blip/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5 — a roadmap to the platinum, missable warnings, and a cited how-to for every trophy.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=w85gyfdr&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

## About this guide

- **55 trophies**: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation. All offline — there are no online trophies.
- **Tracker**: tick trophies off and your progress saves in the browser (localStorage). Export it to a file and import it back. Filter by kind (story, missable, collectibles, activities, side quests, open world, money, online) and grade, search by name or keyword, and hide story spoilers until a trophy is earned.
- **Roadmap**: six stages to the platinum, built from the official trophy descriptions, each with its own earned tally.
- **Honest about what is unknown**: the game only just released and no verified missable list exists yet, so unconfirmed methods are marked unconfirmed instead of guessed — including the five hidden trophies the community has not solved. Names, descriptions and grades are the official PlayStation list (via Exophase & PSNProfiles); counts and methods cite Push Square, KeenGamer, gamemapa.com and Insider Gaming.
- **Offline**: plain static files under `app/`, no build step, no network requests at run time. Serve it with `node serve.ts` and open http://localhost:8080, or use any static server with `app/` at its root.
