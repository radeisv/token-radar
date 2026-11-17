# Watch RADAR

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/radeisv/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/radeisv/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Watch RADAR — every pre-token protocol DefiLlama tracks, ranked by what its launch would be worth, with a farm plan for each. The scoring model scores each protocol from its own TVL, seven-day growth, age with no token, and chain reach; the watchlist rule that decides what may be ranked leaves wrapped, staked and bridged products of tokens that already trade out, however large their TVL. A make.fun token-radar-01 entry.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

The program reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard's data to `out/data.js`, copies `dashboard/` and `screenshots/` to `out/`, and writes `out/dossier.json`. Serve `out/` with any static server and open `dashboard/` — the page renders with no network.

---

<sub>Entered on [make.fun](https://make.fun/?ref=f62prjm7&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
