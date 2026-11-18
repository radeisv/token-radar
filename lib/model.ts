// Watch RADAR's model, version radar-2: one sealed snapshot in, one ranked board out.
//
// The board ranks every protocol the snapshot's own watchlist rule keeps: pre-token, and not a
// wrapped, staked or bridged product of a token that already trades. The watchlist is the floor:
// its 40 slugs are all covered, and the early radar adds every other protocol the same rule keeps
// below the floor, however many that is. Nothing here names a protocol: the same rule and the same
// function score every row, and the board's order follows from the snapshot's figures alone.
//
// Implied value, for one protocol:
//
//   implied = round( tvl_usd x category_multiple x growth_multiplier x maturity_multiplier x chain_multiplier )
//
//   category_multiple  what a dollar of this kind of protocol's TVL is worth as a token: fee-taking
//                      primitives (Dexs, Lending, Derivatives) score highest, distribution and
//                      infrastructure (Chain, Governance Incentives) lowest. A parameter by category,
//                      never by name; the dashboard's model panel lists every value.
//   growth_multiplier  1 + clamp(change_7d, -60, 120) / 100 x 0.5: a protocol whose TVL is growing
//                      is worth more than one the same size that is shrinking.
//   maturity_multiplier 0.6 + min(age_days, 1095) / 1095 x 0.4: age is the time since DefiLlama first
//                      listed the protocol, the best record of how long it has run with no token.
//                      A protocol nobody has waited on is worth less than one the market has
//                      watched for years. Unknown age counts as 365 days.
//   chain_multiplier   1 + min(chains - 1, 4) x 0.02: a protocol live on more chains reaches more
//                      wallets, so its launch reaches further. Capped at four extra chains.
//
// A protocol whose token already trades is never ranked: the dashboard shows those separately with
// their market caps, which are facts, not a model. Implied value is the entry's own claim, never a
// price and never a prediction that a token is issued, or when.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  /** Value of one TVL dollar by category: the table below, looked up by the protocol's category. */
  category_multiples: Record<string, number>;
  /** Multiple for a category the table does not name. */
  default_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  /** Extra value per chain beyond the first, capped at chain_cap extra chains. */
  chain_step: number;
  chain_cap: number;
}

/** One TVL dollar's token value by what the protocol does. Fee-taking primitives first. */
export const CATEGORY_MULTIPLES: Record<string, number> = {
  Dexs: 0.35,
  Lending: 0.32,
  Derivatives: 0.32,
  CDP: 0.3,
  Yield: 0.3,
  'Yield Aggregator': 0.3,
  'Collateral Markets': 0.28,
  'Risk Curators': 0.28,
  'Onchain Capital Allocator': 0.28,
  RWA: 0.26,
  Restaking: 0.26,
  'Basis Trading': 0.26,
  Payments: 0.24,
  Insurance: 0.24,
  CeDeFi: 0.24,
  'Staking Pool': 0.24,
  Chain: 0.22,
  'Governance Incentives': 0.22,
  'Prediction Market': 0.22,
};

export const MODEL: ModelConstants = {
  category_multiples: CATEGORY_MULTIPLES,
  default_multiple: 0.2,
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  chain_step: 0.02,
  chain_cap: 4,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  watchlist: boolean;
  age_days: number | null;
  implied_value_usd: number;
  /** P10–P90 of the implied value, from the shipped model's own out-of-sample spread. */
  band_lo_usd: number;
  band_hi_usd: number;
  /** Whether the row is worth farming, on its P10 value and its seven-day growth. */
  verdict: 'worth' | 'marginal' | 'skip';
  /** The one-line reason for the verdict, in English: it is data, like the farm plan. */
  verdict_why: string;
  model: {
    category_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row; the farm plan is rebuilt in the page from the same rules. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  watchlist: boolean;
  implied_value_usd: number;
  band_lo_usd: number;
  band_hi_usd: number;
  verdict: 'worth' | 'marginal' | 'skip';
  verdict_why: string;
  category_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
  listed_at: string | null;
}

/** One variant of the model family, tested out of sample on the traded tokens. */
export interface ValidationRow {
  /** The variant's name, as the dashboard shows it. */
  variant: string;
  /** Median |ln(pred/mcap)| on held-out folds: the typical factor the prediction is off by. */
  loo_miss: number;
  /** Share of held-out predictions within 3x of the traded market cap, 0..100. */
  within_3x: number;
  /** Spearman rank correlation of held-out predictions against market cap. */
  rank_rho: number;
  /** Median |ln| error fitting the oldest 70% of listings and scoring the newest 30%. */
  walk_forward: number;
}

/** The out-of-sample test of the model family, and the chart it draws. */
export interface Validation {
  /** Traded tokens the test is fitted and scored on: a market cap above zero, no CEX. */
  traded: number;
  /** One row per variant, cheapest first. */
  rows: ValidationRow[];
  /** exp(q10) and exp(q90) of the shipped model's out-of-fold log residuals: the band factors. */
  band_lo: number;
  band_hi: number;
  /** The log-log curve fitted on all traded tokens: ln(mcap) = curve_a + curve_b * ln(tvl). */
  curve_a: number;
  curve_b: number;
  /** P25 and P75 of the curve fit's residuals, in log units: the chart's band. */
  band_p25: number;
  band_p75: number;
  /** Traded tokens as [log10 tvl, log10 mcap], three decimals. */
  traded_points: Array<[number, number]>;
  /** Board rows as [log10 tvl, log10 implied], three decimals. */
  pre_points: Array<[number, number]>;
}

/** The Hot list's source: one row per protocol — name, chains, TVL, 7-day change — for the page to rank by momentum. */
export type HotSource = Array<[string, string[], number, number | null]>;

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  validation: Validation;
  rows: RadarRow[];
  live: LiveRow[];
  hot: HotSource;
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The four multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
): { implied: number; categoryMult: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const categoryMult = model.category_multiples[protocol.category ?? ''] ?? model.default_multiple;
  const extraChains = Math.min(Math.max(protocol.chains.length - 1, 0), model.chain_cap);
  const chainMult = 1 + extraChains * model.chain_step;
  const implied = Math.max(1, Math.round(protocol.tvl_usd * categoryMult * growthMult * maturityMult * chainMult));
  return { implied, categoryMult, growthPct, growthMult, maturityMult, chainMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;
/** Categories that are a wrapped, staked or bridged product of a token that already trades. */
const WRAPPED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);
/** A whole word that marks a wrapped or staked product. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
/** Names that begin with an exchange's name are that exchange's product, not a launch of their own. */
const EXCHANGES = ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Bitget', 'OKX', 'Bitfinex', 'Gemini'];

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/**
 * Whether a protocol is one the board may rank: pre-token, and not a wrapped, staked or bridged
 * product of a token that already trades, by the house watchlist rule applied to every row alike.
 * WBTC is Bitcoin on Ethereum and a staked-ETH product is ETH in a staking wrapper: neither is a
 * protocol still waiting on a launch of its own, however large its TVL.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && WRAPPED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGES.some((e) => p.name.startsWith(e))) return false;
  return true;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL, validation: Validation | null = null): BoardRow[] {
  const val = validation ?? validateModel(snapshot);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but
  // the board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other protocol the same rule keeps, below the floor. No cap, no hand-pick:
  // the rule decides, and a wrapped product's TVL never buys it a rank.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => {
    const verdict = verdictFor(s.implied, val.band_lo, s.p.change_7d);
    return {
      rank: i + 1,
      slug: s.p.slug,
      name: s.p.name,
      category: s.p.category,
      chains: s.p.chains,
      tvl_usd: s.p.tvl_usd,
      change_7d: s.p.change_7d,
      mcap_usd: s.p.mcap_usd,
      listed_at: s.p.listed_at,
      gecko_id: s.p.gecko_id,
      symbol: s.p.symbol,
      token_status: 'pre-token',
      watchlist: snapshot.watchlist.includes(s.p.slug),
      age_days: s.age,
      implied_value_usd: s.implied,
      band_lo_usd: Math.round(s.implied * val.band_lo),
      band_hi_usd: Math.round(s.implied * val.band_hi),
      verdict: verdict.verdict,
      verdict_why: verdict.why,
      model: {
        category_multiple: s.categoryMult,
        growth_pct: s.growthPct,
        growth_multiplier: round4(s.growthMult),
        maturity_multiplier: round4(s.maturityMult),
        chain_multiplier: round4(s.chainMult),
        age_days: s.age,
      },
      farm_steps: farmSteps(s.p, s.age).map(stepText),
    };
  });
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and borrow $20 against it, then repay the borrow.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and swap $10 through it once.`;
  if (c.includes('yield aggregator') || c.includes('yield')) return `Deposit $${capital} of USDC into ${name}'s highest-yield vault on ${chain} and keep the shares.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedged perpetual position.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one small prediction-market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} curated vault on ${chain} and keep the vault shares.`;
  if (c.includes('stable')) return `Mint $${capital} of the stable asset through ${name} on ${chain} and hold it in your wallet.`;
  if (c.includes('rwa')) return `Mint $${capital} of ${name}'s yield-bearing asset on ${chain} and hold it for the full period.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('restak')) return `Restake $${capital} of liquid-staking tokens through ${name} on ${chain} and keep the receipt.`;
  if (c.includes('basis')) return `Deposit $${capital} of USDC into ${name}'s basis vault on ${chain} and keep the position open.`;
  if (c.includes('payment')) return `Pay $${capital} through ${name} on ${chain} and keep the receipt for the activity record.`;
  if (c.includes('chain')) return `Bridge $${capital} of USDC onto the chain ${name} serves and use it in one app there.`;
  if (c.includes('governance')) return `Lock $${capital} of voting power with ${name} on ${chain} and cast one vote.`;
  if (c.includes('otc') || c.includes('marketplace')) return `Place one $${capital} order through ${name} on ${chain} and settle it in full.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly qualifying action: what to repeat so the activity is counted more than once. */
function weeklyFor(p: SnapshotProtocol, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Swap $10 through ${name} on ${chain} and adjust the liquidity position once.`;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Borrow $10 against the supply on ${name}, then repay it the same week.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close and reopen a small hedged position on ${name} once.`;
  if (c.includes('prediction')) return `Place one small prediction on ${name} and let it settle.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('yield')) return `Top up the ${name} vault by $10 and claim any accrued rewards.`;
  if (c.includes('rwa')) return `Check the accrued yield on the ${name} asset and reinvest $10 of it.`;
  if (c.includes('governance')) return `Vote on one ${name} proposal, or delegate the vote if none is live.`;
  if (c.includes('insurance')) return `Keep the ${name} policy active and top it up by $10 if a new term opens.`;
  return `Make one qualifying action on ${name}, such as a deposit, a swap or a vote.`;
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 * A protocol on more than one chain gets a step to repeat the position on its second chain, so the
 * activity is visible where the protocol actually runs.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const name = p.name;
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const second = p.chains.length > 1 ? p.chains[1]! : null;
  const steps: FarmStep[] = [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: second === null ? weeklyFor(p, chain) : `Repeat the position on ${second} with $25, so the activity shows on both chains ${name} runs on.`,
      cost: second === null ? 'about $2 of gas a week' : '$25 of capital and about $3 of gas',
      time: second === null ? '10 minutes a week' : '15 minutes',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open ${p.name}'s own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
  return steps;
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
      listed_at: p.listed_at,
    }));
}

/** A finite median of numbers, or 0 for an empty set. */
function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 0) return 0;
  return s.length % 2 === 1 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
}

/** The q-th quantile of a sorted array, 0 <= q <= 1. */
function quantileOf(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))]!;
}

/** Round to three decimals, for the chart's points and the validation's factors. */
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Spearman rank correlation of two equal-length arrays. */
function spearman(xs: number[], ys: number[]): number {
  const rank = (arr: number[]): number[] => {
    const order = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(arr.length);
    order.forEach(([, i], pos) => { r[i] = pos + 1; });
    return r;
  };
  const rx = rank(xs), ry = rank(ys);
  const mx = rx.reduce((a, b) => a + b, 0) / rx.length, my = ry.reduce((a, b) => a + b, 0) / ry.length;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < rx.length; i++) { num += (rx[i]! - mx) * (ry[i]! - my); dx += (rx[i]! - mx) ** 2; dy += (ry[i]! - my) ** 2; }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

/** The traded tokens the model family is fitted and tested on: a market cap above zero, no CEX. */
function tradedSet(snapshot: Snapshot): SnapshotProtocol[] {
  return snapshot.protocols.filter((p) => !isPreToken(p) && p.mcap_usd !== null && p.mcap_usd > 0 && p.category !== 'CEX');
}

/** OLS on ln(mcap) against ln(tvl): the size curve's intercept and slope. */
function logLogFit(set: SnapshotProtocol[]): { a: number; b: number } {
  const xs = set.map((p) => Math.log(p.tvl_usd)), ys = set.map((p) => Math.log(p.mcap_usd!));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i]! - mx) * (ys[i]! - my); den += (xs[i]! - mx) ** 2; }
  const b = den === 0 ? 0 : num / den;
  return { a: my - b * mx, b };
}

/** Category offsets from a fit: median residual per category, shrunk toward zero by n/(n+4). */
function categoryOffsets(set: SnapshotProtocol[], fit: { a: number; b: number }): Record<string, number> {
  const by: Record<string, number[]> = {};
  for (const p of set) {
    const c = p.category ?? 'Other';
    (by[c] ??= []).push(Math.log(p.mcap_usd!) - (fit.a + fit.b * Math.log(p.tvl_usd)));
  }
  const out: Record<string, number> = {};
  for (const c of Object.keys(by)) out[c] = medianOf(by[c]!) * (by[c]!.length / (by[c]!.length + 4));
  return out;
}

/** Everything one variant's fit carries: flat multiple, size curve, and category offsets. */
interface VariantFit { flat: number; a: number; b: number; cat: Record<string, number>; }

function fitVariant(train: SnapshotProtocol[]): VariantFit {
  const f = logLogFit(train);
  return { flat: medianOf(train.map((p) => p.mcap_usd! / p.tvl_usd)), a: f.a, b: f.b, cat: categoryOffsets(train, f) };
}

/** One variant's prediction of a protocol's market cap. Variant 6 is the shipped linear model. */
function variantPred(p: SnapshotProtocol, fit: VariantFit, variant: number, asOf: string): number {
  const v = impliedValue(p, asOf, MODEL);
  const curve = Math.exp(fit.a + fit.b * Math.log(p.tvl_usd));
  const off = Math.exp(fit.cat[p.category ?? 'Other'] ?? 0);
  if (variant === 0) return fit.flat * p.tvl_usd;
  if (variant === 1) return curve;
  if (variant === 2) return curve * off;
  if (variant === 3) return curve * off * v.growthMult;
  if (variant === 4) return curve * off * v.growthMult * v.maturityMult;
  if (variant === 5) return curve * off * v.growthMult * v.maturityMult * v.chainMult;
  return v.implied;
}

const VALIDATION_VARIANTS = ['Flat multiple', 'Size curve', '+ category', '+ growth', '+ maturity', '+ chain'];

/**
 * The model family, tested out of sample on the traded tokens: five folds by slug order, each
 * variant fitted on four fifths and scored on the fifth, plus a walk-forward split that fits the
 * oldest 70% of listings and scores the newest 30%. The shipped model's own out-of-fold residuals
 * give the P10–P90 band factors. Everything is deterministic: folds follow slug order.
 */
export function validateModel(snapshot: Snapshot): Validation {
  const traded = tradedSet(snapshot);
  const sorted = [...traded].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const folds: SnapshotProtocol[][] = [[], [], [], [], []];
  sorted.forEach((p, i) => folds[i % 5]!.push(p));
  const dated = [...traded].filter((p) => p.listed_at !== null).sort((a, b) => (a.listed_at! < b.listed_at! ? -1 : 1));
  const cut = Math.floor(dated.length * 0.7);
  const wfTrain = dated.slice(0, cut), wfTest = dated.slice(cut);
  const rows: ValidationRow[] = VALIDATION_VARIANTS.map((variant, v) => {
    const miss: number[] = [];
    const within: number[] = [];
    const px: number[] = [];
    const py: number[] = [];
    for (let k = 0; k < 5; k++) {
      const test = folds[k]!;
      const train = folds.flatMap((g, j) => (j === k ? [] : g));
      const fit = fitVariant(train);
      for (const p of test) {
        const pred = variantPred(p, fit, v, snapshot.as_of);
        const r = Math.log(pred / p.mcap_usd!);
        miss.push(Math.abs(r));
        within.push(Math.abs(r) <= Math.log(3) ? 1 : 0);
        px.push(pred);
        py.push(p.mcap_usd!);
      }
    }
    const wfFit = fitVariant(wfTrain);
    const wf = medianOf(wfTest.map((p) => Math.abs(Math.log(variantPred(p, wfFit, v, snapshot.as_of) / p.mcap_usd!))));
    return {
      variant,
      loo_miss: Math.round(medianOf(miss) * 100) / 100,
      within_3x: Math.round((within.reduce((a, b) => a + b, 0) / Math.max(1, within.length)) * 100),
      rank_rho: Math.round(spearman(px, py) * 100) / 100,
      walk_forward: Math.round(wf * 100) / 100,
    };
  });
  // The shipped model's out-of-fold residuals, no fitted scale: their 10th and 90th percentiles
  // are the band. A launch is genuinely uncertain; the band says how uncertain, in the model's
  // own units.
  const residuals: number[] = [];
  for (let k = 0; k < 5; k++) {
    const test = folds[k]!;
    for (const p of test) {
      const v = impliedValue(p, snapshot.as_of, MODEL);
      residuals.push(Math.log(v.implied / p.mcap_usd!));
    }
  }
  const resSorted = [...residuals].sort((a, b) => a - b);
  const bandLo = round3(Math.exp(quantileOf(resSorted, 0.1)));
  const bandHi = round3(Math.exp(quantileOf(resSorted, 0.9)));
  // The chart: the curve fitted on all traded tokens, its P25–P75 residual band, and both point sets.
  const fit = fitVariant(traded);
  const curveRes = traded.map((p) => Math.log(p.mcap_usd!) - (fit.a + fit.b * Math.log(p.tvl_usd))).sort((a, b) => a - b);
  return {
    traded: traded.length,
    rows,
    band_lo: bandLo,
    band_hi: bandHi,
    curve_a: round3(fit.a),
    curve_b: round3(fit.b),
    band_p25: Math.round(quantileOf(curveRes, 0.25) * 100) / 100,
    band_p75: Math.round(quantileOf(curveRes, 0.75) * 100) / 100,
    traded_points: traded.map((p) => [round3(Math.log10(p.tvl_usd)), round3(Math.log10(p.mcap_usd!))] as [number, number]),
    pre_points: [],
  };
}

/** A short dollar figure: $38M, $1.2M, $850K. */
function fmtShort(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

/**
 * A row's farm verdict, from its P10 value and its seven-day growth. The rule is stated on the
 * page: a launch has to be big even in the bad case, and growing, to be worth farming; a tiny
 * P10 or a fast-shrinking TVL is a skip; everything else is marginal.
 */
export function verdictFor(implied: number, bandLo: number, growth: number | null): { verdict: 'worth' | 'marginal' | 'skip'; why: string } {
  const p10 = implied * bandLo;
  const g = growth ?? 0;
  if (p10 >= 25_000_000 && g >= 0) return { verdict: 'worth', why: `P10 ${fmtShort(p10)} and growing — even the bad case pays.` };
  if (p10 < 2_000_000) return { verdict: 'skip', why: `P10 ${fmtShort(p10)} — too small to cover the gas.` };
  if (g < -20) return { verdict: 'skip', why: `TVL down ${Math.abs(g).toFixed(0)}% in a week — the protocol is shrinking.` };
  return { verdict: 'marginal', why: `P10 ${fmtShort(p10)} — worth a look, not a priority.` };
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    watchlist: row.watchlist,
    implied_value_usd: row.implied_value_usd,
    band_lo_usd: row.band_lo_usd,
    band_hi_usd: row.band_hi_usd,
    verdict: row.verdict,
    verdict_why: row.verdict_why,
    category_multiple: row.model.category_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const validation = validateModel(snapshot);
  const board = buildBoard(snapshot, model, validation);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !r.watchlist).length;
  validation.pre_points = board.map((r) => [round3(Math.log10(r.tvl_usd)), round3(Math.log10(r.implied_value_usd))] as [number, number]);
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    validation,
    rows: board.map(radarRow),
    live,
    hot: snapshot.protocols.map((p) => [p.name, p.chains, p.tvl_usd, p.change_7d] as [string, string[], number, number | null]),
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
    if (r.implied_value_usd > 100_000_000_000_000) return `${r.slug} has implied value over the cap`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  // The snapshot's source names a URL; the dashboard carries no network address anywhere, so the
  // data ships the source as a plain label instead.
  const clean: RadarData = { ...radar, source: `DefiLlama public protocols API, fetched ${radar.as_of}` };
  return `window.RADAR=${JSON.stringify(clean)};\n`;
}
