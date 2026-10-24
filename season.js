// ---------- in season (from 20.10.2026): "השבוע שלי", "שוק חופשי" and the alerts ----------
// Pulled live from Sleeper in the browser (every endpoint used here sends CORS *); player values come from board.js.
// Tip-off times come from ESPN's public scoreboard (CORS *); Sleeper's schedule only has dates.
// Lock-in: each starter counts one game a week. A game counts only if the player started that day; you lock a game
// after it ends and before his next one, otherwise his latest game counts.
// "נעלתי" is shared live with the phone alerts through ntfy (24.10.2026, "locks shared with the phone" below).
// Replay a past week for testing: draft.html?tab=week&league=1286085947707912192&week=10&asof=2025-12-25

const SQ = new URLSearchParams(location.search);
const SAPI = "https://api.sleeper.com";
const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ASOF = SQ.get("asof");                // NBA (US Eastern) date to replay, YYYY-MM-DD
const WEEK_Q = +SQ.get("week") || 0;
const SEEN_KEY = "sixpack-inj-seen";        // injury statuses you already saw: {id: "Out|Knee"}
const SEA = {d: null, err: null, at: null, loading: false, timer: null, pl: null, plAt: 0, sch: null, schAt: 0,
  fa: {pos: "ALL", healthy: true, watch: false, sort: "gain", dir: -1}};
const WD = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const SEASON_TABS = ["week", "fa", "live", "news"];
const SLEEPER_URL = `https://sleeper.com/leagues/${LIVE_LEAGUE}`;
// a free agent alert needs this many points a week over my weakest player (as daily_alert.py). It was 3 until 22.10.2026,
// when the league's scoring was halved: 1.5 keeps the same meaning in the new scale
const FA_GAIN = 1.5;

const inSeason = () => (B.draft && B.draft.status === "complete") || currentPick() > TOTAL;
const usDate = t => new Intl.DateTimeFormat("en-CA", {timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"}).format(t);
const todayUS = () => ASOF || usDate(Date.now());
const dObj = s => new Date(s + "T12:00:00Z");
const dLbl = s => `${WD[dObj(s).getUTCDay()]}' ${dObj(s).getUTCDate()}.${dObj(s).getUTCMonth() + 1}`;
const fpS = s => Object.entries(SC).reduce((a, [k, w]) => a + (s[k] || 0) * w, 0);
const strip = s => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

// Israel time for a tip-off: "ה' 02:00"
const IL_FMT = new Intl.DateTimeFormat("en-US", {timeZone: "Asia/Jerusalem", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"});
const IL_WD = {Sun: "א", Mon: "ב", Tue: "ג", Wed: "ד", Thu: "ה", Fri: "ו", Sat: "ש"};
function ilTime(t, withDay = true){
  const p = Object.fromEntries(IL_FMT.formatToParts(t).map(x => [x.type, x.value]));
  return `${withDay ? IL_WD[p.weekday] + "' " : ""}${p.hour}:${p.minute}`;
}

// ---------- normal maths for the lock thresholds ----------
const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function Phi(z){ const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = phi(z) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return z > 0 ? 1 - d : d; }
// V[k] = expected locked score with k games still to come, playing the best stopping rule: lock the latest game if it beats V[k]
function lockV(m, sd, n = 6){
  const V = [0, m];
  for (let k = 2; k <= n; k++) { const c = V[k - 1], z = (m - c) / sd; V.push(m * Phi(z) + sd * phi(z) + c * (1 - Phi(z))); }
  return V;
}
// m learns from this season (24.10.2026). Minutes and each stat per minute are blended on their own with every game he
// has played this season (this week's finished games too), then scored in the league's scoring:
//   minutes = (K_STAT.min * pre minutes + his minutes) / (K_STAT.min + games)
//   stat    = (K_STAT[s] * pre stat a game + his total) / (K_STAT[s] * pre minutes + his minutes), per minute
//   m       = minutes * sum(weight * stat per minute); "rest" (fpg minus the line's points: double-doubles, bonuses,
//             technicals) counts like a stat. Before his first game m = fpg; sd keeps its size relative to m.
// K = how many games of preseason minutes the projection counts for, fitted on 2025 (engine/blend_backtest.py): small
// where his own games take over fast, big for rare noisy stats. Without a projected line (pl with minutes), his points
// as a whole with K_BLEND. Same as blend() in engine/week_report.py, so the phone and the dashboard show the same bars.
const K_STAT = {min: 2, pts: 4, reb: 4, ast: 6, rest: 4, tpm: 8, blk: 16, to: 16, stl: 24};
const K_BLEND = 6;
const BLEND_LINE = ["pts", "reb", "ast", "stl", "blk", "to", "tpm"];   // the stats in board.js's projected line (pl)
const lineFp = l => BLEND_LINE.reduce((a, k) => a + (l[k] || 0) * (SC[k] || 0), 0);
// one played game for blendM: points, minutes and the stats in BLEND_LINE (s = Sleeper's stats, or a line array)
const gameOf = (fp, sp, line) => Object.assign({fp, min: sp / 60}, ...BLEND_LINE.map((k, i) => ({[k]: Array.isArray(line) ? line[i] : line[k] || 0})));
function blendM(fpg, sd, pl, games){
  let m, minutes = null;
  if (pl && pl.min) {
    const mins = games.reduce((a, g) => a + g.min, 0);
    minutes = (K_STAT.min * pl.min + mins) / (K_STAT.min + games.length);
    m = 0;
    for (const c of [...BLEND_LINE, "rest"]) {
      const pre = c === "rest" ? fpg - lineFp(pl) : pl[c] || 0;
      const got = games.reduce((a, g) => a + (c === "rest" ? g.fp - lineFp(g) : g[c]), 0);
      m += (c === "rest" ? 1 : SC[c] || 0) * (K_STAT[c] * pre + got) / (K_STAT[c] * pl.min + mins);
    }
    m *= minutes;
  } else m = (K_BLEND * fpg + games.reduce((a, g) => a + g.fp, 0)) / (K_BLEND + games.length);
  m = Math.max(m, 0);
  return {m, sd: Math.max(1, sd * m / fpg), minutes};
}

// ---------- data ----------
// force (a refresh by hand): the injury sources skip their usual wait, Sleeper's player file and ESPN's report
async function fetchSeason(force){
  if (SEA.loading) { if (force) SEA.again = true; return; }   // a click during an automatic pull runs again right after it
  SEA.loading = true; SEA.tryAt = Date.now();
  renderHeader();
  try {
    const lid = LIVE_LEAGUE;
    const [state, lg, users, rosters] = await Promise.all([getJSON(`${API}/state/nba`), getJSON(`${API}/league/${lid}`),
      getJSON(`${API}/league/${lid}/users`), getJSON(`${API}/league/${lid}/rosters`)]);
    const season = lg.season;
    const week = WEEK_Q || (state.league_season === season ? (state.display_week || state.week || 1) : (lg.settings.last_scored_leg || 1));
    const [matchups, proj, stats, trend, tx0, tx1, nextProj] = await Promise.all([
      getJSON(`${API}/league/${lid}/matchups/${week}`).catch(() => []),
      getJSON(`${SAPI}/projections/nba/${season}/${week}?season_type=regular`).catch(() => []),
      getJSON(`${SAPI}/stats/nba/${season}/${week}?season_type=regular`).catch(() => []),
      getJSON(`${API}/players/nba/trending/add?lookback_hours=24&limit=50`).catch(() => []),
      getJSON(`${API}/league/${lid}/transactions/${week}`).catch(() => []),
      week > 1 ? getJSON(`${API}/league/${lid}/transactions/${week - 1}`).catch(() => []) : Promise.resolve([]),
      getJSON(`${SAPI}/projections/nba/${season}/${week + 1}?season_type=regular`).catch(() => []),
    ]);
    const reads = readMatchups(lid, week, matchups);     // the other reads of the matchups, while the rest loads
    await loadSchedule(season);
    await loadPlayers(force);
    SEA.d = {state, lg, users, rosters, week, season, matchups, proj, stats, trend, tx: [...tx0, ...tx1], nextProj};
    SEA.at = Date.now(); SEA.err = null; HIST.memo = null;
    // the past weeks before the alerts: every bar's m counts his games from them (blendM)
    await Promise.all([loadTips(SEA.d), loadEspnInjuries(force), loadHistory(SEA.d)]);
    noteReads(SEA.d, await reads);
    refreshAlerts();
    flushLocks();
  } catch (e) { SEA.err = String(e.message || e); }
  SEA.loading = false;
  renderHeader();
  if (S.tab === "week") renderWeek();
  if (S.tab === "fa") renderFA();
  if (S.tab === "live" && LIVE.data) renderLive();
  if (S.tab === "news") renderNews();
  if (SEA.again) { SEA.again = false; fetchSeason(true); }
}
// a screen that finds no data asks for it, but never more than once in 30 seconds: a failed pull re-renders the screen,
// and without this the screen would ask again at once, in a loop
function maybeFetchSeason(){ if (!SEA.loading && (!SEA.tryAt || Date.now() - SEA.tryAt > 30e3)) fetchSeason(); }
// ESPN: no cookies, and the browser cache is fine (these change on the order of minutes).
// Two hosts serve the same API; if one turns a browser away (it rate-limits per host), the other is tried.
const ESPN_HOSTS = ["https://site.web.api.espn.com", "https://site.api.espn.com"];
async function getEspn(u){
  let err;
  for (const h of ESPN_HOSTS) {
    try { const r = await fetch(u.replace(ESPN_HOSTS[1], h), {credentials: "omit"}); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
    catch (e) { err = e; }
  }
  throw err;
}
async function loadSchedule(season){
  if (SEA.sch && SEA.sch.season === season && Date.now() - SEA.schAt < 10 * 60e3) return;
  SEA.sch = {season, games: await getJSON(`${SAPI}/schedule/nba/regular/${season}`)};
  SEA.schAt = Date.now();
}
// the full player file is big (~2.5 MB): once per hour at most, for injuries, teams and names outside the model
async function loadPlayers(force){
  if (SEA.pl && Date.now() - SEA.plAt < (force ? 60e3 : 60 * 60e3)) return;   // by hand: at most once a minute
  try { SEA.pl = await getJSON(`${API}/players/nba`); SEA.plAt = Date.now(); NAMEIDX = null; } catch (e) { if (!SEA.pl) SEA.pl = {}; }
}
// a refresh by hand (header, league and news buttons): everything now, injuries included
function refreshAll(){ fetchSeason(true); if (S.tab === "news") loadNews(true); }
// one loop for all season tabs: every 2 minutes while you look at a season tab, every 5 in the background (for the alerts)
function startSeasonTimer(){
  lockSyncStart();
  if (SEA.timer) return;
  SEA.timer = setInterval(() => {
    if (!inSeason()) return;
    const want = !document.hidden && SEASON_TABS.includes(S.tab) ? 120e3 : 300e3;
    if (!SEA.at || Date.now() - SEA.at >= want - 5e3) fetchSeason();
  }, 30e3);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && inSeason() && SEA.at && Date.now() - SEA.at > 90e3) fetchSeason(); });

// ---------- ESPN: tip-off times, live scores, injury report ----------
const ESPN_TEAM = {GS: "GSW", NY: "NYK", SA: "SAS", NO: "NOP", UTAH: "UTA", WSH: "WAS"};
const TIP = {};          // US date -> {at, games: [...]}
const ESPN = {inj: null, injAt: 0};
async function loadDay(date, maxAge){
  const c = TIP[date];
  if (c && Date.now() - c.at < maxAge) return c;
  try {
    const j = await getEspn(`${ESPN_API}/scoreboard?dates=${date.replace(/-/g, "")}`);
    const games = (j.events || []).map(e => {
      const c0 = e.competitions[0], st = c0.status || {}, tp = st.type || {};
      const side = h => { const x = c0.competitors.find(y => y.homeAway === h) || {}, t = x.team || {};
        return {team: ESPN_TEAM[t.abbreviation] || t.abbreviation, name: t.shortDisplayName || t.name || "", score: x.score != null && x.score !== "" ? +x.score : null, logo: t.logo || "", rec: ((x.records || [])[0] || {}).summary || ""}; };
      return {id: e.id, t: new Date(e.date).getTime(), state: tp.state, done: !!tp.completed, detail: tp.shortDetail || "", clock: st.displayClock, period: st.period,
        home: side("home"), away: side("away"), tv: (c0.broadcasts || []).flatMap(b => b.names || [])};
    }).sort((a, b) => a.t - b.t);
    TIP[date] = {at: Date.now(), games};
  } catch (e) { if (c) c.at = Date.now() - maxAge + 60e3; else TIP[date] = {at: Date.now() - maxAge + 60e3, games: [], err: true}; }  // retry in a minute
  return TIP[date];
}
function tipOf(team, date){ const d = TIP[date]; return (d && d.games.find(x => x.home.team === team || x.away.team === team)) || null; }
async function loadTips(D){
  const today = todayUS();
  const dates = [...new Set(SEA.sch.games.filter(g => g.week === D.week).map(g => g.date))].filter(d => d >= today).sort();
  await Promise.all(dates.map(d => loadDay(d, d === today ? 90e3 : 30 * 60e3)));
}
// ESPN's injury report carries an expected return date that Sleeper doesn't have
async function loadEspnInjuries(force){
  if (Date.now() - ESPN.injAt < (force ? 1 : ESPN.injErr ? 5 : 30) * 60e3) return;
  ESPN.injAt = Date.now();
  try {
    const j = await getEspn(`${ESPN_API}/injuries`);
    const m = {};
    (j.injuries || []).forEach(t => (t.injuries || []).forEach(x => {
      const n = normName((x.athlete || {}).displayName); if (!n) return;
      m[n] = {status: x.status, short: x.shortComment || "", long: x.longComment || "", date: x.date, ret: ((x.details || {}).returnDate) || null,
        type: ((x.details || {}).type) || "", team: ESPN_TEAM[(((x.athlete || {}).team) || {}).abbreviation] || (t.displayName || "")};
    }));
    ESPN.inj = m; ESPN.injErr = false;
  } catch (e) { ESPN.injErr = true; }
}
// names are the only key shared by ESPN and Sleeper
const normName = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "").replace(/[^a-z]/g, "");
let NAMEIDX = null;
function idByName(name){
  if (!NAMEIDX) {
    NAMEIDX = new Map();
    Object.entries(SEA.pl || {}).forEach(([id, x]) => { const n = normName(x.full_name || `${x.first_name || ""} ${x.last_name || ""}`); if (n && (!NAMEIDX.has(n) || x.team)) NAMEIDX.set(n, id); });
    B.players.forEach(p => NAMEIDX.set(normName(p.n), p.id));
  }
  return NAMEIDX.get(normName(name)) || null;
}
const espnInjOf = id => { const p = pOf(id); return (ESPN.inj && ESPN.inj[normName(p.n)]) || null; };
const retTxt = r => { if (!r) return ""; const d = new Date(r + "T12:00:00Z"); return `חזרה משוערת ${d.getUTCDate()}.${d.getUTCMonth() + 1}`; };

// ---------- the league's scoring vs the model's ----------
// board.js is built with the league's scoring at the last refresh_data.bat. If the commissioner changes it, every number
// here stops matching Sleeper until the next refresh (20-22.10.2026: Sleeper halved every value, the model kept the old ones).
function scoringChanged(lg){
  const live = lg && lg.scoring_settings;
  if (!live) return false;
  return [...new Set([...Object.keys(live), ...Object.keys(SC)])].some(k => Math.abs((live[k] || 0) - (SC[k] || 0)) > 1e-9);
}

// ---------- points so far this season, in the league's scoring ----------
// Every player's games: past weeks are pulled once and kept in localStorage as [date, points, minutes, seconds,
// [the stats in BLEND_LINE]] per game (v 2, 24.10.2026: the last two feed blendM);
// the current week comes from the regular pull. The cache is keyed by season and scoring, so a scoring change rebuilds it.
// A week with a game not final yet (and under 2 days old) is used but not kept, so it's pulled again (as week_report.py).
const HIST_KEY = "sixpack-hist";
const HIST = {weeks: null, loading: false, memo: null, partial: {}};
const scSig = () => Object.entries(SC).filter(([, v]) => v).sort().map(([k, v]) => k + v).join(",");
function compactWeek(rows){
  const out = {}, today = todayUS();
  (rows || []).forEach(r => {      // today's games may still be on: they join tomorrow
    const s = r.stats || {};
    if (!s.sp || !r.date || r.date >= today) return;
    (out[r.player_id] = out[r.player_id] || []).push([r.date, Math.round(fpS(s) * 100) / 100, Math.round(s.sp / 60), s.sp, BLEND_LINE.map(k => s[k] || 0)]);   // Sleeper scores in quarters
  });
  return out;
}
async function loadHistory(D){
  if (HIST.loading) return false;
  if (!HIST.weeks) {
    try { const h = JSON.parse(localStorage.getItem(HIST_KEY)); HIST.weeks = h && h.season === D.season && h.sc === scSig() && h.v === 2 ? h.weeks : {}; }
    catch (e) { HIST.weeks = {}; }
  }
  const missing = [];
  for (let w = 1; w < D.week; w++) if (!HIST.weeks[w] || HIST.partial[w]) missing.push(w);
  if (!missing.length) return false;
  HIST.loading = true;
  let added = 0;
  const old = usDate(dObj(todayUS()).getTime() - 2 * DAY);
  for (const w of missing) {          // one at a time: a week is ~1 MB
    try {
      HIST.weeks[w] = compactWeek(await getJSON(`${SAPI}/stats/nba/${D.season}/${w}?season_type=regular`)); added++;
      HIST.partial[w] = SEA.sch.games.some(g => g.week === w && g.status !== "complete" && g.date >= old);
    }
    catch (e) { break; }
  }
  const keep = Object.fromEntries(Object.entries(HIST.weeks).filter(([w]) => !HIST.partial[w]));
  try { localStorage.setItem(HIST_KEY, JSON.stringify({season: D.season, sc: scSig(), v: 2, weeks: keep})); } catch (e) {}
  HIST.loading = false; HIST.memo = null;
  return added > 0;
}
// his games in the weeks before `week`, for blendM (this week's come from the week model)
const pastGames = (pid, week) => Object.entries(HIST.weeks || {}).filter(([w]) => +w < week).flatMap(([, wk]) => (wk[pid] || []).map(g => gameOf(g[1], g[3], g[4])));
function seasonLog(pid){
  if (!HIST.memo) {
    const by = {};
    const add = wk => Object.entries(wk).forEach(([id, gs]) => gs.forEach(g => (by[id] = by[id] || []).push(g)));
    Object.values(HIST.weeks || {}).forEach(add);
    if (SEA.d) add(compactWeek(SEA.d.stats));
    Object.values(by).forEach(a => a.sort((x, y) => x[0].localeCompare(y[0])));
    HIST.memo = by;
  }
  return HIST.memo[pid] || [];
}
// gp, average, best and the last three games
function seasonSum(pid){
  const g = seasonLog(pid);
  if (!g.length) return null;
  const fps = g.map(x => x[1]);
  return {gp: g.length, avg: mean(fps), best: Math.max(...fps), last: fps.slice(-3), min: mean(g.map(x => x[2]))};
}
// "21.3 (4)" with the last games, coloured against what the model expects per game
function actualCell(pid, fpg){
  const s = seasonSum(pid);
  if (!s) return `<span class="muted" title="עוד לא שיחק העונה">—</span>`;
  const cls = v => !fpg ? "" : v >= fpg * 1.15 ? "hi" : v <= fpg * 0.8 ? "lo" : "";
  return `<span class="act-avg ${cls(s.avg)}" title="ממוצע בפועל העונה, בניקוד של הליגה · הכי טוב ${f1(s.best)} · ${Math.round(s.min)} דקות בממוצע">${f1(s.avg)}<small>(${s.gp})</small></span>`;
}
function lastCell(pid, fpg){
  const s = seasonSum(pid);
  if (!s) return "";
  const cls = v => !fpg ? "" : v >= fpg * 1.15 ? "hi" : v <= fpg * 0.8 ? "lo" : "";
  return `<span class="lastg" title="שלושת המשחקים האחרונים, מהישן לחדש">${s.last.map(v => `<i class="${cls(v)}">${f1(v)}</i>`).join("")}</span>`;
}

// ---------- one player's game log (player card): this season and last ----------
const PLOG = {};
async function playerLog(pid, season){
  const k = `${pid}|${season}`, cur = String(season) === String((SEA.d && SEA.d.season) || "");
  if (PLOG[k] && (!cur || Date.now() - PLOG[k].at < 10 * 60e3)) return PLOG[k].games;
  const j = await getJSON(`${SAPI}/stats/nba/player/${pid}?season_type=regular&season=${season}&grouping=week`);
  const games = Object.values(j || {}).flat().filter(g => g && g.date && g.stats && g.stats.sp)
    .map(g => ({date: g.date, opp: g.opponent || "", away: !!g.is_away_team, s: g.stats, fp: fpS(g.stats), min: g.stats.sp / 60}))
    .sort((a, b) => a.date.localeCompare(b.date));
  PLOG[k] = {at: Date.now(), games};
  return games;
}
const CARDH = {pid: null, season: null};
async function cardHistory(p, season){
  const box = $("cardHist");
  if (!box) return;
  const cur = String((SEA.d && SEA.d.season) || (B.draft && B.draft.season) || new Date().getFullYear());
  const prev = String(+cur - 1);
  CARDH.pid = p.id;
  box.innerHTML = `<h3>היסטוריית נקודות <span class="muted">בניקוד של הליגה</span></h3><div class="hs-skel"></div>`;
  let logs;
  try { logs = await Promise.all([playerLog(p.id, cur), playerLog(p.id, prev)]); }
  catch (e) { if (CARDH.pid === p.id) box.innerHTML = `<h3>היסטוריית נקודות</h3><p class="hint">לא הצלחתי למשוך את המשחקים מ-Sleeper (${esc(String(e.message || e))}).</p>`; return; }
  if (CARDH.pid !== p.id || !$("card").open) return;      // another card was opened meanwhile
  const [now, last] = logs;
  const sel = season || (now.length ? cur : prev), games = sel === cur ? now : last;
  CARDH.season = sel;
  const tabs = `<div class="seg hs-tabs" role="tablist">${[[cur, `העונה (${now.length})`], [prev, `עונה שעברה (${last.length})`]].map(([s, t]) =>
    `<button role="tab" aria-selected="${s === sel}" class="${s === sel ? "sel" : ""}" onclick="cardHistory(PMAP.get('${p.id}') || pOf('${p.id}'), '${s}')">${t}</button>`).join("")}</div>`;
  if (!games.length) { box.innerHTML = `<h3>היסטוריית נקודות <span class="muted">בניקוד של הליגה</span></h3>${tabs}<p class="hint">${sel === cur ? "עוד לא שיחק העונה." : "לא שיחק בעונה הזאת."}</p>`; return; }
  const fps = games.map(g => g.fp), avg = mean(fps), ref = sel === cur && p.fpg ? p.fpg : avg;
  const top = Math.max(...fps, ref) || 1;
  const above = fps.filter(v => v >= ref).length;
  const wd = s => `${WD[dObj(s).getUTCDay()]}' ${dObj(s).getUTCDate()}.${dObj(s).getUTCMonth() + 1}`;
  const bars = games.map(g => `<i class="${g.fp >= ref * 1.15 ? "hi" : g.fp <= ref * 0.8 ? "lo" : ""}" style="height:${Math.max(3, g.fp / top * 100).toFixed(1)}%" title="${wd(g.date)} · ${g.away ? "@" : "vs "}${esc(g.opp)} · ${f1(g.fp)}"></i>`).join("");
  const rows = games.slice(-8).reverse().map(g => { const s = g.s;
    return `<tr><td>${wd(g.date)}</td><td dir="ltr">${g.away ? "@" : ""}${esc(g.opp)}</td><td class="num hide-sm">${Math.round(g.min)}</td>${["pts", "reb", "ast", "stl", "blk"].map(k => `<td class="num">${s[k] || 0}</td>`).join("")}<td class="num hide-sm">${s.to || 0}</td><td class="num"><b class="${g.fp >= ref * 1.15 ? "hi" : g.fp <= ref * 0.8 ? "lo" : ""}">${f1(g.fp)}</b></td></tr>`; }).join("");
  box.innerHTML = `<h3>היסטוריית נקודות <span class="muted">בניקוד של הליגה</span></h3>${tabs}
    <div class="hs-sum"><div><span>ממוצע</span><b class="num">${f1(avg)}</b></div><div><span>הכי טוב</span><b class="num">${f1(Math.max(...fps))}</b></div>
      <div><span>משחקים</span><b class="num">${games.length}</b></div><div><span>${sel === cur && p.fpg ? "מעל התחזית" : "מעל הממוצע"}</span><b class="num">${above}/${games.length}</b></div></div>
    <div class="hs-chart"><div class="hs-bars">${bars}<span class="hs-ref" style="bottom:${(ref / top * 100).toFixed(1)}%" title="${sel === cur && p.fpg ? "התחזית למשחק" : "הממוצע"}: ${f1(ref)}"></span></div>
      <div class="hs-ax"><span>${wd(games[0].date)}</span><span class="muted">קו מקווקו = ${sel === cur && p.fpg ? `התחזית למשחק (${f1(ref)})` : `הממוצע (${f1(ref)})`}</span><span>${wd(games[games.length - 1].date)}</span></div></div>
    <table class="stat-t hs-t"><tr><th>תאריך</th><th>יריב</th><th class="hide-sm">דק'</th><th>נק'</th><th>ריב'</th><th>אס'</th><th>חט'</th><th>חס'</th><th class="hide-sm">איב'</th><th>ניקוד</th></tr>${rows}</table>
    ${games.length > 8 ? `<p class="hint">בטבלה 8 המשחקים האחרונים. בגרף כל ${games.length} המשחקים, הראשון מימין.</p>` : ""}`;
}

// ---------- what one read of Sleeper can't tell about locks (24.10.2026, as ledger() in engine/week_report.py) ----------
// On 24.10.2026 Sleeper's matchups served two versions by turns, even 1.5 seconds apart and on both API hosts: Kawhi
// (never locked) read 18.75 or 29.0, Kessler 37.0 or 22.75, Sabonis 36.25 or 28.5, the other value being their 21.10
// game. A counted score can only really change when he plays again, so every pull reads the matchups MATCHUP_READS
// times, and LOCKS_KEY keeps every counted score seen per player since his latest game, per week (the last two weeks).
// Two values since his latest game = "uncertain" (pState): not locked, his latest game counts, until his next game.
// The engine keeps its own copy (engine/data/locks.json): the browser can't read it, so each side learns on its own.
const MATCHUP_READS = 4;                    // reads of the matchups per pull, 1 second apart
const LOCKS_KEY = "sixpack-locks-seen";     // {league: {week: {player: {date: his latest game, vals: [scores read]}}}}
function seenLedger(){
  if (!SEA.seen) { try { SEA.seen = (JSON.parse(localStorage.getItem(LOCKS_KEY)) || {})[LIVE_LEAGUE] || {}; } catch (e) { SEA.seen = {}; } }
  return SEA.seen;
}
// {player: Set of counted scores} over this pull's reads; the first read is the one the screens show
async function readMatchups(lid, week, first){
  const reads = {};
  const add = d => (d || []).forEach(m => Object.entries(m.players_points || {}).forEach(([id, v]) => { if (v != null) (reads[id] = reads[id] || new Set()).add(Math.round(v * 100) / 100); }));
  add(first);
  for (let i = 1; i < MATCHUP_READS && !ASOF; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try { add(await getJSON(`${API}/league/${lid}/matchups/${week}`)); } catch (e) {}
  }
  return reads;
}
function noteReads(D, reads){
  if (ASOF) return;
  const L = seenLedger(), LW = L[D.week] = L[D.week] || {}, Wm = weekModel(D), now = Date.now();
  Object.entries(reads).forEach(([id, vals]) => {
    const team = teamOf(id), ms = Wm.st[id] || {}, g = Wm.byTeam[team] || [];
    const played = g.filter(x => x.done && ms[x.date] != null);
    // live points move during his game: not a flip. Sleeper's schedule is read every 10 minutes, so a game of his today
    // also counts as on from ESPN's tip-off until it is in his stats
    const on = x => x.live || (x.date === Wm.today && ms[x.date] == null && (t => t && (t.state !== "pre" || t.t <= now))(tipOf(team, x.date)));
    if (!played.length || g.some(on)) return;
    const date = played[played.length - 1].date;
    if (!LW[id] || LW[id].date !== date) LW[id] = {date, vals: []};
    LW[id].vals = [...new Set([...LW[id].vals, ...vals])].sort((a, b) => a - b);
  });
  SEA.seen = Object.fromEntries(Object.keys(L).sort((a, b) => a - b).slice(-2).map(w => [w, L[w]]));
  let all = {};
  try { all = JSON.parse(localStorage.getItem(LOCKS_KEY)) || {}; } catch (e) {}
  all[LIVE_LEAGUE] = SEA.seen;
  try { localStorage.setItem(LOCKS_KEY, JSON.stringify(all)); } catch (e) {}
}

// ---------- model of the week ----------
const injOf = id => { const x = SEA.pl && SEA.pl[id]; return x && x.injury_status ? {s: x.injury_status, part: x.injury_body_part || "", note: x.injury_notes || "", at: x.news_updated || 0} : null; };
const isOut = i => i && /^(out|ir|sus|pup|doubtful)$/i.test(i.s);
const injCls = i => !i ? "" : isOut(i) ? "out" : "q";
const injTxt = i => !i ? "" : ({Out: "בחוץ", IR: "IR", Sus: "מושעה", Questionable: "בספק", Doubtful: "כנראה לא ישחק", "Day-To-Day": "יום-יום", DTD: "יום-יום", GTD: "החלטה לפני המשחק"}[i.s] || i.s);
function pOf(id){
  const p = PMAP.get(id);
  if (p) return p;
  const x = (SEA.pl && SEA.pl[id]) || {};
  return {id, n: x.full_name || `${x.first_name || ""} ${x.last_name || ""}`.trim() || "שחקן", t: x.team || "FA", pos: x.fantasy_positions || [], val: 0, fpg: 0, av: 0.85, stub: true};
}
const teamOf = id => (SEA.pl && SEA.pl[id] && SEA.pl[id].team) || pOf(id).t;

function weekModel(D){
  const today = todayUS();
  const games = SEA.sch.games.filter(g => g.week === D.week);
  const dates = [...new Set(games.map(g => g.date))].sort();
  const done = g => ASOF ? g.date < ASOF : (g.status === "complete" || g.date < today);
  const byTeam = {};
  games.forEach(g => [[g.home.team, g.away.team, true], [g.away.team, g.home.team, false]].forEach(([t, o, home]) =>
    (byTeam[t] = byTeam[t] || []).push({date: g.date, opp: o, home, done: done(g), live: !ASOF && g.status === "in_game", today: g.date === today})));
  Object.values(byTeam).forEach(a => a.sort((x, y) => x.date.localeCompare(y.date)));
  const st = {}, sl = {}, pj = {}, pjN = {};
  D.stats.forEach(r => { const s = r.stats || {}; if (!s.sp || (ASOF && r.date >= ASOF)) return; (st[r.player_id] = st[r.player_id] || {})[r.date] = fpS(s); (sl[r.player_id] = sl[r.player_id] || {})[r.date] = s; });
  D.proj.forEach(r => { const s = r.stats || {}; (pj[r.player_id] = pj[r.player_id] || []).push({date: r.date, fp: fpS(s), min: (s.sp || 0) / 60}); });
  D.nextProj.forEach(r => { (pjN[r.player_id] = pjN[r.player_id] || []).push(r.date); });
  return {today, dates, byTeam, st, sl, pj, pjN};
}

function pState(id, Wm, mp, week){
  const p = pOf(id), team = teamOf(id), inj = injOf(id);
  const ms = Wm.st[id] || {};
  const g = (Wm.byTeam[team] || []).map(x => ({...x, fp: ms[x.date] ?? null}));
  const played = g.filter(x => x.done && x.fp != null);
  const left = g.filter(x => !x.done);
  const fpg = p.fpg || mean((Wm.pj[id] || []).map(x => x.fp)) || 1;
  const games = [...pastGames(id, week), ...played.map(x => gameOf(x.fp, Wm.sl[id][x.date].sp, Wm.sl[id][x.date]))];
  const {m, sd, minutes} = blendM(fpg, p.sd || Math.max(4, 0.3 * fpg), p.pl, games);
  const V = lockV(m, sd);
  const lastFp = played.length ? played[played.length - 1].fp : null;
  let pts = mp && mp.players_points && mp.players_points[id] != null ? mp.players_points[id] : null;
  if (ASOF || pts == null) pts = lastFp;
  if (!played.length && !g.some(x => x.live)) pts = null;     // Sleeper shows 0 before his first game
  const lastDate = played.length ? played[played.length - 1].date : null;
  // Sleeper gave two different counted scores since his latest game (noteReads): assume no earlier lock, the safer advice
  const seen = lastDate && !ASOF && !g.some(x => x.live) ? (seenLedger()[week] || {})[id] : null;
  const uncertain = seen && seen.date === lastDate && seen.vals.length > 1 ? seen.vals : null;
  if (uncertain) pts = lastFp;
  // a counted score that matches an earlier game (not the latest) can only be a lock
  let locked = false, lockedOn = null;
  if (pts != null && played.length >= 2 && Math.abs(pts - lastFp) > 0.05) {
    const hit = played.slice(0, -1).find(x => Math.abs(x.fp - pts) < 0.05);
    if (hit) { locked = true; lockedOn = hit.date; }
  }
  // "נעלתי" (here or on the phone): S.locks[week][player] = the date of the game you locked (true: marked before
  // 24.10.2026, any game). A press for his latest game counts at once: Sleeper's API shows that lock only after his
  // next game. One for an earlier game counts only if Sleeper shows it (as the press in week_report.py).
  const mark = (S.locks && S.locks[week] && S.locks[week][id]) || null;
  const pressed = !locked && pts != null && mark === lastDate && Math.abs(pts - lastFp) < 0.05;
  if (pressed) { locked = true; lockedOn = lastDate; }
  if (mark === true && !locked) { locked = true; const hit = pts != null && played.find(x => Math.abs(x.fp - pts) < 0.05); if (hit) lockedOn = hit.date; }
  const out = isOut(inj);
  const k = out ? 0 : left.length;
  const exp = locked ? (pts || 0) : !k ? (pts || 0) : lastFp != null ? Math.max(lastFp, V[k]) : V[k];
  const sdW = locked || !k ? 0 : sd * (lastFp != null ? 0.55 : 0.7);
  let act = null;                     // what to do with this player this week
  if (locked) act = "locked";
  else if (!g.length) act = "nogames";
  else if (out && lastFp == null) act = "out";
  else if (lastFp != null && left.length && (out || lastFp >= V[left.length])) act = "lock";
  else if (lastFp != null && left.length) act = "wait";
  else if (!left.length) act = "final";
  else act = "ahead";
  const wkMin = mean((Wm.pj[id] || []).map(x => x.min));
  // thr: lock the latest game if it beats this (decision now). thrNext: the bar after his next game
  const thr = lastFp != null && left.length ? V[left.length] : null, thrNext = left.length >= 2 ? V[left.length - 1] : null;
  return {id, p, team, inj, g, played, left, k, m, sd, fpg, gp: games.length, minutes, V, lastFp, lastDate, pts, locked, lockedOn, mark, pressed, uncertain, exp, sdW, act, thr, thrNext,
    today: g.find(x => x.today && !x.done) || null, wkMin, nextGames: (Wm.pjN[id] || []).length};
}

function rosterOfUser(D, uid){ return D.rosters.find(r => r.owner_id === uid); }
function teamWeek(D, Wm, r){
  const mp = D.matchups.find(m => m.roster_id === r.roster_id);
  const starters = ((mp && mp.starters) || r.starters || []).map(x => (x && x !== "0" ? x : null));
  const reserve = new Set(r.reserve || []);
  const st = starters.map(id => id ? pState(id, Wm, mp, D.week) : null);
  const bench = (r.players || []).filter(id => !starters.includes(id) && !reserve.has(id)).map(id => pState(id, Wm, mp, D.week));
  const ir = [...reserve].map(id => pState(id, Wm, mp, D.week));
  // Lock-in: the score Sleeper shows counts locked games only. The API's points also add every unlocked starter's latest
  // game, which is what he would get if the week ended now (an unlocked starter gets his final game automatically).
  // Sleeper's API has no lock flag: a lock shows only once he plays again, or when you mark it here ("נעלתי").
  const cur = st.reduce((a, x) => a + (x && x.locked ? x.pts || 0 : 0), 0);
  const prov = mp ? mp.points || 0 : st.reduce((a, x) => a + (x && x.pts || 0), 0);
  const exp = st.reduce((a, x) => a + (x ? x.exp : 0), 0);
  const v = st.reduce((a, x) => a + (x ? x.sdW * x.sdW : 0), 0);
  const nLocked = st.filter(x => x && x.locked).length;
  const nLeft = st.reduce((a, x) => a + (x && !x.locked ? x.left.length : 0), 0);
  const nToday = st.filter(x => x && !x.locked && x.today).length;
  return {r, mp, st, bench, ir, cur, prov, exp, v, nLocked, nLeft, nToday, uid: r.owner_id};
}
// win chance of a against b from the two projections and their spread
const winP = (a, b) => Phi((a.exp - b.exp) / (Math.sqrt(a.v + b.v) || 1));

// Tonight's lineup, the same plan as "הרכב להלילה" in engine/daily_alert.py build() (24.10.2026). Only a game played in
// the lineup counts or can be locked, so each open slot goes to whoever is worth most from tonight on: greedy by value
// with augmenting paths. Tonight = the next game day with a tip-off still ahead, once its first game is under 20 hours
// away. A starter keeps his slot unless a bench player beats him by KEEP_MARGIN; one who sits tonight but plays later
// counts SIT_FREE less, since he comes back for his next game; one done for the week keeps his score; a bench player is
// worth his bar V[k], since only the games to come count for him. Locked, about to be locked or already on stays put.
// Values are rounded to 0.1 as in week_state.json, so near ties fall the same way as on the phone.
const KEEP_MARGIN = 2.0, SIT_FREE = 2.0;
// his tip-off that day: ESPN, or 01:00 (this computer's time) the night after the US date, the earliest usual tip-off
function tipAt(team, date){
  const g = tipOf(team, date);
  if (g) return g.t;
  const d = dObj(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 1, 0).getTime();
}
function todayPlan(T){
  const now = ASOF ? dObj(ASOF).getTime() : Date.now(), r1 = v => Math.round(v * 10) / 10;
  const st = T.st, mine = [...st.filter(Boolean), ...T.bench], stIds = new Set(st.filter(Boolean).map(x => x.id));
  const next = x => x.left.length ? x.left[0].date : null;
  const fut = mine.filter(x => next(x) && tipAt(x.team, next(x)) > now);
  const slate = fut.map(next).sort()[0];
  const tonight = new Map(fut.filter(x => next(x) === slate).map(x => [x.id, tipAt(x.team, slate)]));
  if (!slate || Math.min(...tonight.values()) - now >= 20 * 3600e3) return {ins: [], outs: [], slate: null};
  const lockedIds = new Set(st.filter(x => x && (x.locked || x.act === "lock" || (x.lastDate && x.mark === x.lastDate))).map(x => x.id));
  const playing = new Set(st.filter(x => x && next(x) === slate && !tonight.has(x.id)).map(x => x.id));   // tipped off
  const open = SLOTS.map((_, i) => i).filter(i => !st[i] || (!lockedIds.has(st[i].id) && !playing.has(st[i].id)));
  const worth = x => {
    if (tonight.has(x.id)) return stIds.has(x.id) ? r1(x.exp) + KEEP_MARGIN : x.act === "lock" || x.act === "wait" ? r1(x.thr) : r1(x.exp);
    if (stIds.has(x.id) && !isOut(x.inj)) {
      if (x.left.length) return r1(x.exp) - SIT_FREE;
      if (x.pts != null) return x.pts + KEEP_MARGIN;
    }
    return null;
  };
  const order = mine.filter(x => !lockedIds.has(x.id) && !playing.has(x.id) && !isOut(x.inj) && worth(x) != null && (stIds.has(x.id) || tonight.has(x.id)))
    .sort((a, b) => worth(b) - worth(a));
  const owner = {};          // slot index -> player
  const assign = (p, seen) => {
    for (const i of open) {
      if (seen.has(i) || !elig(p.p, SLOTS[i])) continue;
      seen.add(i);
      if (!owner[i] || assign(owner[i], seen)) { owner[i] = p; return true; }
    }
    return false;
  };
  order.forEach(p => assign(p, new Set()));
  const placed = new Set(Object.values(owner).map(p => p.id));
  const ins = order.filter(p => placed.has(p.id) && !stIds.has(p.id));
  const outs = open.filter(i => st[i] && !placed.has(st[i].id) && owner[i]).map(i => st[i]);
  // before anyone in the change tips off
  const at = ins.length ? Math.min(...[...ins, ...outs].filter(x => tonight.has(x.id)).map(x => tonight.get(x.id))) : null;
  return {ins, outs, slate, tonight, worth, at};
}

function freeAgents(D, Wm, mineT){
  const rostered = new Set(D.rosters.flatMap(r => [...(r.players || []), ...(r.reserve || [])]));
  const trend = Object.fromEntries((D.trend || []).map(t => [t.player_id, t.count]));
  const now = ASOF ? dObj(ASOF).getTime() : Date.now(), clear = (D.lg.settings.waiver_clear_days || 2) * DAY;
  const waivers = {};
  D.tx.filter(t => t.status === "complete" && t.drops).forEach(t => Object.keys(t.drops).forEach(id => { if (now - t.created < clear) waivers[id] = Math.max(waivers[id] || 0, t.created + clear); }));
  const mineAll = mineT ? [...mineT.st.filter(Boolean), ...mineT.bench] : [];
  const worst = mineAll.filter(x => !x.p.stub).sort((a, b) => adj(a.p) - adj(b.p))[0] || null;
  const list = B.players.filter(p => !rostered.has(p.id)).map(p => {
    const team = teamOf(p.id), sch = Wm.byTeam[team] || [];
    const left = sch.filter(x => !x.done).length;
    const wkMin = mean((Wm.pj[p.id] || []).map(x => x.min));
    return {p, team, inj: injOf(p.id), left, games: sch.length, next: (Wm.pjN[p.id] || []).length, wkMin, dMin: wkMin && p.min ? wkMin - p.min : 0,
      trend: trend[p.id] || 0, waiverUntil: waivers[p.id] || null, val: adj(p), gain: worst ? adj(p) - adj(worst.p) : 0};
  });
  return {list, worst, mineAll, trend, rostered};
}

// add X, drop Y: the gain of the whole roster (best nine plus the bench), so positions count, not only value
let swapMemo = {key: "", list: []};
function bestSwaps(X, n = 3){
  const key = `${SEA.at}|${S.risk}`;
  if (swapMemo.key === key) return swapMemo.list.slice(0, n);
  const pool = [...X.me.st.filter(Boolean), ...X.me.bench].filter(x => !x.p.stub);
  const roster = pool.map(x => x.p);
  const all = [];
  if (roster.length) {
    const base = lineup(roster).total;
    // a locked player already gave this week's score: he is never the one to drop
    X.fa.list.filter(c => !isOut(c.inj) && c.val > 0).sort((a, b) => b.val - a.val).slice(0, 24).forEach(c => pool.filter(d => !d.locked).forEach(d => {
      const g = lineup(roster.filter(p => p !== d.p).concat([c.p])).total - base;
      if (g > 0.25) all.push({c, d, g});
    }));
  }
  all.sort((a, b) => b.g - a.g);
  // each free agent once, paired with the drop that helps most; the same weak player can be the drop for several of them
  const usedC = new Set(), list = [];
  for (const s of all) { if (usedC.has(s.c.p.id)) continue; usedC.add(s.c.p.id); list.push(s); if (list.length >= 6) break; }
  swapMemo = {key, list};
  return list.slice(0, n);
}

// everything a season screen needs, built from the last pull
function seasonState(){
  const D = SEA.d;
  if (!D || !SEA.sch) return null;
  const Wm = weekModel(D), myR = rosterOfUser(D, MY_USER_ID);
  if (!myR) return {D, Wm, myR: null};
  const me = teamWeek(D, Wm, myR);
  const oppId = me.mp ? (D.matchups.find(m => m.matchup_id === me.mp.matchup_id && m.roster_id !== myR.roster_id) || {}).roster_id : null;
  const oppR = oppId ? D.rosters.find(r => r.roster_id === oppId) : null;
  const op = oppR ? teamWeek(D, Wm, oppR) : null;
  return {D, Wm, myR, me, oppR, op, plan: todayPlan(me), fa: freeAgents(D, Wm, me)};
}

// injury news that you haven't marked as seen
function injSeen(){ try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || null; } catch (e) { return null; } }
const injKey = id => { const i = injOf(id); return i ? `${i.s}|${i.part}` : ""; };
function injChanges(ids){
  let seen = injSeen();
  if (!seen) { seen = {}; ids.forEach(id => { seen[id] = injKey(id); }); try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }
  return ids.filter(id => (seen[id] ?? "") !== injKey(id) && (id in seen || injKey(id)));
}
function ackInjuries(ids){
  const seen = injSeen() || {};
  ids.forEach(id => { seen[id] = injKey(id); });
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
  refreshAlerts(); rerenderSeason();
}
// "נעלתי" here marks the lock on his latest game and tells the phone (sendLock), so the reminders stop there too.
// Pressed again it takes the mark back, here only. A lock Sleeper already shows (an earlier game) has nothing to mark.
function toggleLock(id){
  const X = seasonState(), w = X && X.myR && X.D.week; if (!w) return;
  const x = [...X.me.st.filter(Boolean), ...X.me.bench, ...X.me.ir].find(y => y.id === id);
  S.locks = S.locks || {}; S.locks[w] = S.locks[w] || {};
  if (x && x.locked && !S.locks[w][id]) { toast(`${x.p.n} נעול לפי Sleeper${x.lockedOn ? ` על המשחק מ-${fmtShort(dObj(x.lockedOn))}` : ""}`); return; }
  if (S.locks[w][id] && (!x || x.locked)) delete S.locks[w][id];
  else if (x && x.lastDate) { S.locks[w][id] = x.lastDate; sendLock(`lock|${w}|${id}|${x.lastDate}`, x.p.n); }
  else S.locks[w][id] = true;            // no game yet: a mark by hand, as before 24.10.2026
  save(); refreshAlerts(); rerenderSeason();
}
function rerenderSeason(){
  renderHeader();
  if (S.tab === "week") renderWeek();
  if (S.tab === "fa") renderFA();
  if (S.tab === "live" && LIVE.data) renderLive();
  if (S.tab === "news") renderNews();
  if (!$("alertsPop").hidden) renderAlertsPop();
}

// ---------- locks shared with the phone, live (ntfy, 24.10.2026) ----------
// The phone's "נעלתי" posts lock|<week>|<player>|<date of his latest game> to the topic <topic>-ack (engine/notify.py),
// and daily_alert.py reads that topic on every run. Here the same topic is a live stream (ntfy's SSE, CORS *): a press on
// the phone marks the lock within a second, and "נעלתי" here posts the same key, so the phone stops its reminders on the
// next run. The topic is NTFY_TOPIC from engine/.env, pasted once in the settings (S.ntfyTopic, this browser only):
// whoever knows it can read the alerts, so it is never in the code. ntfy keeps a message 12 hours and every connect asks
// for those 12 hours again; S.lockAcks holds the keys already applied, so a lock taken back here stays taken back.
const NTFY = "https://ntfy.sh";
const LSYNC = {es: null, topic: "", state: "off", tries: 0, timer: null, openAt: 0, sending: false, rr: null, news: []};
const lockTopic = () => { const t = String(S.ntfyTopic || "").trim(); return /^[-_A-Za-z0-9]{1,60}$/.test(t) ? t : ""; };
function lockSyncStart(){
  const t = ASOF ? "" : lockTopic();
  if (t && t === LSYNC.topic && (LSYNC.es || LSYNC.timer)) return;
  if (LSYNC.es) { LSYNC.es.close(); LSYNC.es = null; }
  clearTimeout(LSYNC.timer); LSYNC.timer = null;
  LSYNC.topic = t; LSYNC.tries = 0; LSYNC.openAt = 0;
  if (t) lockConnect(); else { LSYNC.state = "off"; paintLockSync(); }
}
// A dropped stream comes back after 5 s, 10 s, 20 s ... up to 5 minutes, never in a loop: one that drops within a
// minute of opening doesn't reset the wait. EventSource's own retry is cut off, since it retries every few seconds forever.
function lockConnect(){
  LSYNC.timer = null;
  if (!window.EventSource) { LSYNC.state = "bad"; paintLockSync(); return; }
  LSYNC.state = "busy";
  const es = LSYNC.es = new EventSource(`${NTFY}/${LSYNC.topic}-ack/sse?since=12h`);
  es.onopen = () => { LSYNC.state = "on"; LSYNC.openAt = Date.now(); paintLockSync(); flushLocks(); };
  es.onmessage = e => { let m = null; try { m = JSON.parse(e.data); } catch (err) {} if (m && m.event === "message") gotLock(String(m.message || "").trim(), (m.time || 0) * 1000); };
  es.onerror = () => {
    if (LSYNC.es !== es) return;
    es.close(); LSYNC.es = null;
    LSYNC.tries = LSYNC.openAt && Date.now() - LSYNC.openAt > 60e3 ? 1 : LSYNC.tries + 1;
    LSYNC.openAt = 0; LSYNC.state = "bad";
    LSYNC.timer = setTimeout(lockConnect, Math.min(300e3, 5e3 * 2 ** (LSYNC.tries - 1)));
    paintLockSync();
  };
  paintLockSync();
}
// a key from the topic (the phone, or this page's own post coming back): the lock goes on that game, a later one wins
function gotLock(key, at){
  const m = /^lock\|(\d+)\|(\w+)\|(\d{4}-\d\d-\d\d)$/.exec(key), acks = S.lockAcks || (S.lockAcks = {});
  if (!m || acks[key]) return;
  acks[key] = at || Date.now();
  S.locks = S.locks || {};
  const [, w, id, date] = m, wk = S.locks[w] = S.locks[w] || {};
  if (typeof wk[id] !== "string" || wk[id] < date) wk[id] = date;
  if (at > Date.now() - 120e3) LSYNC.news.push(id);      // pressed just now, not the 12 hours a connect brings back
  clearTimeout(LSYNC.rr);
  LSYNC.rr = setTimeout(() => {
    save(); refreshAlerts(); rerenderSeason();
    if (LSYNC.news.length) toast(`נעלתי מהטלפון: ${[...new Set(LSYNC.news)].map(i => pOf(i).n).join(", ")}`);
    LSYNC.news = [];
  }, 200);
}
// "נעלתי" here, to the phone: queued in S.lockOut until ntfy takes it (retried on every pull and reconnect)
function sendLock(key, name){
  (S.lockAcks = S.lockAcks || {})[key] = Date.now();      // its echo from the topic changes nothing
  if (!lockTopic()) { toast(`${name} סומן נעול כאן. כדי שגם הטלפון יידע, מדביקים בהגדרות את ערוץ ההתראות`); return; }
  S.lockOut = S.lockOut || [];
  if (!S.lockOut.includes(key)) S.lockOut.push(key);
  flushLocks(name);
}
async function flushLocks(name){
  const t = lockTopic();
  if (LSYNC.sending || !t || !(S.lockOut || []).length) return;
  LSYNC.sending = true;
  let failed = false;
  for (const key of [...S.lockOut]) {
    try {
      const r = await fetch(`${NTFY}/${t}-ack`, {method: "POST", body: key, credentials: "omit"});
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      S.lockOut = S.lockOut.filter(k => k !== key);
    } catch (e) { failed = true; break; }
  }
  LSYNC.sending = false;
  save();
  if (name) toast(failed ? `${name} סומן נעול כאן, אבל ntfy לא ענה. אנסה שוב לבד בעדכון הבא` : `${name} סומן נעול, והטלפון יפסיק להזכיר`);
}
function lockSyncChip(){
  const st = LSYNC.topic ? LSYNC.state : "off";
  const [txt, tip] = {on: ["מחובר לטלפון", "\"נעלתי\" בטלפון מסומן כאן מיד, ו\"נעלתי\" כאן עוצר את התזכורות בטלפון"],
    busy: ["מתחבר לטלפון…", "מתחבר לערוץ ההתראות ב-ntfy"],
    bad: ["הטלפון לא מחובר", "החיבור ל-ntfy נפל. מנסה שוב לבד, כל פעם בהפסקה ארוכה יותר"],
    off: ["לחבר לטלפון", "מדביקים בהגדרות את ערוץ ההתראות (NTFY_TOPIC מ-engine/.env), ואז \"נעלתי\" עובר בין הטלפון לכאן"]}[st];
  return `<button id="lockSync" class="btn sm lsync" type="button" onclick="openSettings()" title="${esc(tip)}"><i class="sdot ${st === "on" ? "" : st}"></i>${txt}</button>`;
}
function paintLockSync(){ const b = $("lockSync"); if (b) b.outerHTML = lockSyncChip(); }

// ---------- alerts: what needs doing, with a deadline ----------
const ALR = {list: [], tonight: null};
const ackOf = () => S.ack || (S.ack = {});
function ackAlert(id){ ackOf()[id] = Date.now(); save(); refreshAlerts(); rerenderSeason(); }
// "ניקוי הכל" in the alerts popover (Nati, 24.10.2026): every open alert to "handled" at once, with one undo
let lastCleared = null;
function clearAllAlerts(){ const t = Date.now(); lastCleared = openAlerts().map(a => a.id); lastCleared.forEach(id => { ackOf()[id] = t; }); save(); refreshAlerts(); rerenderSeason(); }
function undoClearAll(){ (lastCleared || []).forEach(id => delete ackOf()[id]); lastCleared = null; save(); refreshAlerts(); rerenderSeason(); }
function unackAlert(id){ delete ackOf()[id]; save(); refreshAlerts(); rerenderSeason(); }
// the next game of a player's team as a deadline: Israel time when ESPN has it, the US date otherwise
function dueOf(team, date){
  const g = tipOf(team, date);
  return g ? {t: g.t, txt: ilTime(g.t), live: g.state === "in"} : {t: dObj(date).getTime(), txt: dLbl(date), live: false};
}
function computeAlerts(X){
  const {D, Wm, me, op, plan, fa} = X, w = D.week, out = [];
  const all = [...me.st.filter(Boolean), ...me.bench];
  const n = x => esc(x.p.n);
  const nextDue = x => x.left[0] ? dueOf(x.team, x.left[0].date) : null;
  const vs = g => `${g.home ? "מול " : "ב-"}${esc(g.opp)}`;
  // the model no longer matches Sleeper's scoring: every number below is off until the next refresh
  if (scoringChanged(D.lg)) {
    const live = Object.entries(D.lg.scoring_settings).filter(([, v]) => v).sort().map(([k, v]) => k + v).join(",");
    out.push({id: `score|${live}`, pri: 1, kind: "lineup", ic: "target", title: "שיטת הניקוד בליגה השתנתה",
      body: "המודל עדיין בניקוד הקודם, אז הערכים, הספים והנקודות לא תואמים ל-Sleeper. מריצים את <b>refresh_data.bat</b> ומרעננים את הדף.", act: [{t: "ראיתי", ack: true}]});
  }
  // locks: starters only. A game played on the bench never counts and can't be locked (as daily_alert.py, 24.10.2026)
  me.st.filter(x => x && x.act === "lock").sort((a, b) => b.lastFp - a.lastFp).forEach(x => {
    const last = x.played[x.played.length - 1], k = x.left.length;
    out.push({id: `lock|${w}|${x.id}|${last.date}`, pri: 1, kind: "lock", ic: "lock", pid: x.id, title: `לנעול את ${n(x)}`,
      body: (isOut(x.inj) ? `${f1(x.lastFp)} ${vs(last)}, והוא ${esc(injTxt(x.inj))}. נועלים לפני שהמשחק הבא מתחיל.`
        : `${f1(x.lastFp)} ${vs(last)}, מעל הרף ${f1(x.thr)}. ${k === 1 ? "נשאר לו משחק אחד" : `נשארו לו ${k} משחקים`}.`),
      due: nextDue(x), dueLbl: "לפני המשחק הבא", act: [{t: "נעלתי", fn: `toggleLock('${x.id}')`, primary: true}, {t: "פספסתי", ack: true}]});
  });
  // no notice for an "uncertain" starter (Nati, 24.10.2026): the two values are his last two games, served by Sleeper's
  // older and newer copies, and a game you didn't lock before the next one started can't be locked anymore. He counts
  // his latest game and isn't locked, unless "נעלתי" was pressed: nothing to check in the app.
  // starters who score 0 unless swapped
  const ir = (D.lg.settings.reserve_slots || 0) > me.ir.length;
  me.st.forEach((x, i) => {
    if (!x) { out.push({id: `empty|${w}|${i}`, pri: 1, kind: "lineup", ic: "users", title: `משבצת ${SLOTS[i]} ריקה בהרכב`, body: "להכניס שחקן שמשחק השבוע.", act: []}); return; }
    if (x.locked) return;
    if (isOut(x.inj) && x.lastFp == null && x.left.length)
      out.push({id: `out|${w}|${x.id}|${x.inj.s}`, pri: 1, kind: "injury", ic: "shield", pid: x.id, title: `להוציא את ${n(x)} מההרכב`,
        body: `${esc(injTxt(x.inj))}${x.inj.part ? ` (${esc(x.inj.part)})` : ""}. בהרכב הוא שווה 0.${ir ? " יש מקום פנוי ב-IR." : ""}`, due: nextDue(x), dueLbl: "לפני המשחק שלו", act: [{t: "טיפלתי", ack: true}]});
    else if (!x.g.length)
      out.push({id: `nog|${w}|${x.id}`, pri: 1, kind: "lineup", ic: "clock", pid: x.id, title: `${n(x)} בלי משחקים השבוע`, body: "בהרכב הוא שווה 0. להחליף במישהו מהספסל שמשחק.", act: [{t: "טיפלתי", ack: true}]});
    else if (!x.left.length && x.lastFp == null)
      out.push({id: `fin|${w}|${x.id}`, pri: 1, kind: "lineup", ic: "clock", pid: x.id, title: `${n(x)} סיים את השבוע בלי ניקוד`, body: "אין לו עוד משחקים. משבצת שכדאי לתת למישהו שעוד משחק.", act: [{t: "טיפלתי", ack: true}]});
  });
  // tonight's lineup (todayPlan), worded as the phone's "הרכב להלילה"; its id is the phone's key, so a new plan is a new alert
  if (plan.ins.length) {
    const day = plan.slate === Wm.today ? "היום" : `ב-${dLbl(plan.slate)}`;
    const why = x => !plan.tonight.has(x.id) ? (x.left.length ? `לא משחק ${day}` : `סיים את השבוע עם ${f1(x.pts)}`) : isOut(x.inj) ? "בחוץ" : `צפי ${f1(x.exp)}`;
    const ids = a => a.map(x => x.id).sort().join(",");
    out.push({id: `swap|${w}|${plan.slate}|${ids(plan.ins)}>${ids(plan.outs)}`, pri: 1, kind: "lineup", ic: "swap", title: `שינוי בהרכב ${plan.slate === Wm.today ? "להיום" : `ל-${dLbl(plan.slate)}`}`,
      body: `להכניס ${plan.ins.map(x => `<b>${n(x)}</b> (צפי ${f1(plan.worth(x))})`).join(", ")} במקום ${plan.outs.length ? plan.outs.map(x => `${n(x)} (${why(x)})`).join(", ") : "המשבצת הריקה"}. משחק מהספסל לא נספר ואי אפשר לנעול אותו.`,
      due: {t: plan.at, txt: ilTime(plan.at), live: false}, dueLbl: "לפני שהמשחק הראשון מהם מתחיל", act: [{t: "החלפתי", ack: true}]});
  }
  // a free agent worth a move: the same rule as daily_alert.py, FA_GAIN+ a week over my weakest player
  const bestFA = fa.list.filter(x => !isOut(x.inj) && !x.waiverUntil).sort((a, b) => b.gain - a.gain)[0];
  if (bestFA && fa.worst && bestFA.gain >= FA_GAIN)
    out.push({id: `fa|${w}|${bestFA.p.id}`, pri: 2, kind: "fa", ic: "trend", pid: bestFA.p.id, title: `להחתים את ${esc(bestFA.p.n)}`,
      body: `שווה ${sg(bestFA.gain)} לשבוע יותר מ-${n(fa.worst)}, הכי חלש אצלך. ${bestFA.left ? `${bestFA.left} משחקים שנשארו לו השבוע` : "בלי משחקים השבוע"}.`,
      act: [{t: "לשוק", fn: "setTab('fa')"}, {t: "לא עכשיו", ack: true}]});
  // watchlist
  (S.faWatch || []).forEach(id => {
    if (out.some(a => a.pid === id)) return;      // already an alert to sign him
    const x = fa.list.find(y => y.p.id === id);
    if (x && x.gain > 0 && !isOut(x.inj)) out.push({id: `watch|${w}|${id}`, pri: 2, kind: "fa", ic: "star", pid: id, title: `${esc(x.p.n)} מרשימת המעקב פנוי`,
      body: `שווה ${sg(x.gain)} לשבוע מול ${fa.worst ? esc(fa.worst.p.n) : "השחקן הכי חלש שלך"}. ${x.left} משחקים שנשארו השבוע.`, act: [{t: "לשוק", fn: "setTab('fa')"}, {t: "לא עכשיו", ack: true}]});
    else if (!x && fa.rostered.has(id)) {
      const r = D.rosters.find(r => (r.players || []).includes(id));
      if (r && r.owner_id !== MY_USER_ID) out.push({id: `taken|${id}|${r.owner_id}`, pri: 3, kind: "news", ic: "star", pid: id, title: `${esc(pOf(id).n)} נלקח`,
        body: `${esc(tName(D, r.owner_id))} החתים אותו. הוא יורד מרשימת המעקב שלך.`, act: [{t: "הסר ממעקב", fn: `toggleWatch('${id}')`}]});
    }
  });
  // injury news on my roster since you last looked
  const myIds = [...all, ...me.ir].map(x => x.id);
  injChanges(myIds).forEach(id => {
    const x = [...all, ...me.ir].find(y => y.id === id), i = injOf(id); if (!x) return;
    out.push({id: `inj|${id}|${injKey(id)}`, pri: i && isOut(i) ? 2 : 3, kind: "injury", ic: "shield", pid: id,
      title: i ? `עדכון פציעה: ${n(x)}` : `${n(x)} חזר לשחק`,
      body: i ? `${esc(injTxt(i))}${i.part ? ` (${esc(i.part)})` : ""}.${(() => { const e = espnInjOf(id); return e && e.ret ? ` ${retTxt(e.ret)}.` : ""; })()}` : "כבר לא ברשימת הפצועים.",
      act: [{t: "ראיתי", fn: `ackInjuries(['${id}'])`}]});
  });
  const rank = {1: 0, 2: 1, 3: 2};
  return out.sort((a, b) => (rank[a.pri] - rank[b.pri]) || ((a.due ? a.due.t : 9e15) - (b.due ? b.due.t : 9e15)));
}
// tonight (the next game day): who plays, when, and the bar to lock after the game
function tonightInfo(X){
  const {Wm, me, op} = X;
  const all = [...me.st.filter(Boolean), ...me.bench];
  const day = Wm.dates.find(d => d >= Wm.today && all.some(x => x.g.some(g => g.date === d && !g.done)));
  if (!day) return null;
  const start = new Set(me.st.filter(Boolean).map(x => x.id));
  const rows = all.filter(x => x.g.some(g => g.date === day && !g.done)).map(x => {
    const g = x.g.find(y => y.date === day), rest = x.left.length - 1;
    return {x, g, start: start.has(x.id), bar: x.locked ? null : rest >= 1 ? x.V[rest] : null, last: !x.locked && rest === 0, tip: tipOf(x.team, day)};
  }).sort((a, b) => (b.start - a.start) || ((a.tip ? a.tip.t : 0) - (b.tip ? b.tip.t : 0)) || (b.x.m - a.x.m));
  const oppN = op ? [...op.st.filter(Boolean), ...op.bench].filter(x => x.g.some(g => g.date === day && !g.done)).length : 0;
  return {day, rows, oppN};
}
function refreshAlerts(){
  const X = seasonState();
  if (!X || !X.myR) return;
  ALR.list = computeAlerts(X);
  ALR.score = X.op ? {me: X.me.cur, op: X.op.cur} : null;
  ALR.tonight = tonightInfo(X);
  pruneAcks();
  notifyNew();
  updateBell();
}
const openAlerts = () => ALR.list.filter(a => !ackOf()[a.id]);
function pruneAcks(){
  const old = Date.now() - 21 * DAY;
  [S.ack, S.notified, S.lockAcks].forEach(o => o && Object.keys(o).forEach(k => { if (o[k] < old) delete o[k]; }));
}
// a system notification for alerts you haven't been told about, only while the page is in the background
let firstAlerts = true;
function notifyNew(){
  const sent = S.notified || (S.notified = {});
  const fresh = openAlerts().filter(a => a.pri <= 2 && !sent[a.id]);
  fresh.forEach(a => { sent[a.id] = Date.now(); });
  if (fresh.length && document.hidden && !firstAlerts && S.sound) {
    try {
      if (window.Notification && Notification.permission === "granted") {
        const a = fresh[0];
        new Notification(fresh.length > 1 ? `${strip(a.title)} (ועוד ${fresh.length - 1})` : strip(a.title), {body: strip(a.body), tag: "sixpack-" + a.id});
      }
    } catch (e) {}
    if (fresh.some(a => a.pri === 1)) beep();
  }
  firstAlerts = false;
  save();
}
function updateBell(){
  const n = openAlerts().filter(a => a.pri <= 2).length, urgent = openAlerts().some(a => a.pri === 1);
  const b = $("bellN");
  if (b) { b.hidden = !n; b.textContent = n; b.classList.toggle("hot", urgent); }
  if (inSeason()) document.title = n ? `(${n}) Six Pack` : "Six Pack";
}
function alertRow(a, done){
  const due = a.due ? `<span class="due ${a.due.live ? "live" : ""}" title="${esc(a.dueLbl || "")}">${ric("clock")}${a.due.live ? "משחק עכשיו" : esc(a.due.txt)}</span>` : "";
  const acts = done ? `<button class="btn sm ghost" onclick="unackAlert('${esc(a.id)}')">החזר</button>`
    : a.act.map(x => `<button class="btn sm ${x.primary ? "primary" : ""}" onclick="${x.ack ? `ackAlert('${esc(a.id)}')` : esc(x.fn)}">${esc(x.t)}</button>`).join("");
  const who = a.pid ? av(pOf(a.pid), 32) : `<span class="al-ic">${ric(a.ic)}</span>`;
  return `<li class="al-i k-${a.kind} p${a.pri} ${done ? "done" : ""}">
    <span class="al-who">${who}<i class="al-badge">${ric(a.ic)}</i></span>
    <div class="al-b"><b>${a.title}</b><p>${a.body}</p></div>
    <div class="al-side">${due}<span class="al-acts">${acts}</span></div></li>`;
}

// ---------- the alerts popover in the header ----------
function toggleAlertsPop(){
  const p = $("alertsPop");
  if (!p.hidden) { closeAlertsPop(); return; }
  if (!SEA.d && inSeason()) maybeFetchSeason();
  renderAlertsPop(); p.hidden = false; $("bellBtn").setAttribute("aria-expanded", "true");
}
function closeAlertsPop(){ $("alertsPop").hidden = true; $("bellBtn").setAttribute("aria-expanded", "false"); }
function renderAlertsPop(){
  const list = openAlerts(), perm = window.Notification ? Notification.permission : "denied";
  const nt = !window.Notification ? "" : perm === "granted" && S.sound ? `<span class="muted">התראות דפדפן פעילות</span>`
    : perm === "denied" ? `<span class="muted">התראות הדפדפן חסומות בהגדרות הדפדפן</span>`
    : `<button class="btn sm" onclick="enableNotifications()">${ric("bell")}הפעלת התראות דפדפן</button>`;
  if (list.length) lastCleared = null;   // the undo is for the clear that just emptied the list
  $("alertsPop").innerHTML = `<div class="pop-h"><b>התראות</b><span class="muted">${list.length ? `${list.length} פתוחות` : "אין התראות פתוחות"}</span>${list.length > 1 ? `<button class="btn sm ghost clr" onclick="clearAllAlerts()">ניקוי הכל</button>` : lastCleared && lastCleared.length ? `<button class="btn sm ghost clr" onclick="undoClearAll()">ביטול הניקוי</button>` : ""}<button class="x" aria-label="סגירה" onclick="closeAlertsPop()">${IC.x}</button></div>
    ${list.length ? `<ol class="al compact">${list.map(a => alertRow(a)).join("")}</ol>` : `<p class="empty-note pop-empty">${SEA.d ? "הכל מסודר. כשיהיה משחק לנעול, שינוי להרכב או החתמה ששווה לעשות, זה יופיע כאן." : "מושך את השבוע מ-Sleeper…"}</p>`}
    <div class="pop-f">${nt}<button class="btn sm" onclick="closeAlertsPop();setTab('week')">למרכז הפעולות</button></div>`;
}
async function enableNotifications(){
  try { const r = await Notification.requestPermission(); if (r === "granted") { S.sound = true; save(); new Notification("Six Pack", {body: "התראות פעילות. תקבל הודעה כשיש משחק לנעול או החלפה לעשות."}); } } catch (e) {}
  renderAlertsPop();
}
// composedPath, not contains: a button in the popover re-renders it, so by now the clicked button is no longer inside it
// and the popover closed on every action (Nati, 24.10.2026). The path is fixed when the click happens.
document.addEventListener("click", e => { const p = $("alertsPop"), path = e.composedPath(); if (p && !p.hidden && !path.includes(p) && !path.some(n => n.id === "bellBtn")) closeAlertsPop(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("alertsPop") && !$("alertsPop").hidden) closeAlertsPop(); });

// header in season: the week, the live score of my matchup and when Sleeper was last read
function seasonHeader(){
  const clock = $("clock"), chip = $("syncChip"), D = SEA.d;
  clock.className = "clock sbug";
  chip.title = "לחיצה מושכת הכל עכשיו, כולל פציעות";
  $("bellBtn").hidden = false;
  if (!D) { clock.textContent = "עונה 26/27"; chip.innerHTML = `<i class="sdot ${SEA.err ? "bad" : "busy"}"></i><span class="sync-t">${SEA.err ? "Sleeper: שגיאה" : "טוען מ-Sleeper…"}</span>`; return; }
  const myR = rosterOfUser(D, MY_USER_ID), mp = myR && D.matchups.find(m => m.roster_id === myR.roster_id);
  const op = mp && D.matchups.find(m => m.matchup_id === mp.matchup_id && m.roster_id !== mp.roster_id);
  const oppUid = op && (D.rosters.find(r => r.roster_id === op.roster_id) || {}).owner_id;
  const a = ALR.score ? ALR.score.me : 0, b = ALR.score ? ALR.score.op : 0;
  clock.innerHTML = `<span class="sbug-wk">שבוע <b class="num">${D.week}</b></span>${op ? `<span class="sbug-t">${esc(tName(D, MY_USER_ID))}</span><b class="num ${a >= b ? "lead" : ""}">${f1(a)}</b><span class="sbug-sep">:</span><b class="num ${b > a ? "lead" : ""}">${f1(b)}</b><span class="sbug-t">${esc(tName(D, oppUid))}</span>` : ""}`;
  const ago = Math.round((Date.now() - SEA.at) / 60000);
  chip.innerHTML = `<i class="sdot ${SEA.loading ? "busy" : SEA.err ? "bad" : ""}"></i><span class="sync-t">${SEA.loading ? "מעדכן…" : ago ? `עודכן לפני ${ago} דק'` : "עודכן עכשיו"}</span>`;
}

// ---------- shared bits ----------
const injBadge = i => i ? `<span class="ib ${injCls(i)}" title="${esc([i.s, i.part, i.note].filter(Boolean).join(" · "))}">${esc(injTxt(i))}</span>` : "";
const uOf = (D, uid) => D.users.find(u => u.user_id === uid);
const tName = (D, uid) => { const u = uOf(D, uid); return u ? ((u.metadata && u.metadata.team_name) || u.display_name) : "—"; };
const pName = x => x.p.stub ? `<span>${esc(x.p.n)}</span>` : nameLink(x.p);
const fmtShort = d => `${d.getUTCDate()}.${d.getUTCMonth() + 1}`;
function weekRange(Wm){ return Wm.dates.length ? `${fmtShort(dObj(Wm.dates[0]))}–${fmtShort(dObj(Wm.dates[Wm.dates.length - 1]))}` : ""; }
const recOf = r => `<bdi dir="ltr">${r.settings.wins || 0}-${r.settings.losses || 0}</bdi>`;
function rankOf(D, rid){
  const pts = r => (r.settings.fpts || 0) + (r.settings.fpts_decimal || 0) / 100;
  return [...D.rosters].sort((a, b) => ((b.settings.wins || 0) - (a.settings.wins || 0)) || (pts(b) - pts(a))).findIndex(r => r.roster_id === rid) + 1;
}
function seasonGate(out){
  if (SEA.d) return false;
  out.innerHTML = SEA.err ? `<div class="panel empty-panel"><p>לא הצלחתי למשוך נתונים מ-Sleeper (${esc(SEA.err)}). בודקים חיבור לאינטרנט ולוחצים על רענון.</p><button class="btn" onclick="fetchSeason()">רענון</button></div>`
    : `<div class="dgrid">${["s12 sk-h1", "s7 sk-h2", "s5 sk-h2", "s12 sk-h3"].map(c => `<div class="panel skel ${c}"></div>`).join("")}</div>`;
  maybeFetchSeason();
  return true;
}

// ---------- "השבוע שלי" ----------
// Rows of blocks (אפיון-דשבורד.md): the matchup in four blocks, then what to do / tonight / head to head,
// the week board, and swaps / injuries / the league's week. Each block draws its own content.
function renderWeek(){
  const out = $("weekOut");
  startSeasonTimer();
  if (seasonGate(out)) return;
  const X = seasonState();
  if (!X || !X.myR) { out.innerHTML = `<div class="panel empty-panel"><p>לא מצאתי את הקבוצה שלך בליגה הזאת.</p></div>`; return; }
  const {D, Wm, me, op, oppR, myR} = X;
  const all = [...me.st.filter(Boolean), ...me.bench];
  const cMe = ucol(MY_USER_ID), cOp = op ? ucol(op.uid) : GRAY, oppName = op ? esc(tName(D, op.uid)) : "";
  const T = ALR.tonight;

  // ---- row 1: the matchup, the projection, the locks, the days ----
  let row1;
  if (op) {
    const pw = winP(me, op), lead = me.cur - op.cur;
    const team = (TW, R, uid, mine) => `<div class="mu-t">${uAvatar(uOf(D, uid), 38)}<div class="mu-n"><b>${esc(tName(D, uid))}</b><span>${mine ? "אתה · " : ""}${recOf(R)} · מקום ${rankOf(D, R.roster_id)}</span></div>
      <div class="mu-s"><strong class="fig ${(mine ? lead >= 0 : lead < 0) ? "lead" : ""}" title="${mine ? "נעול: מה ש-Sleeper סופר עכשיו" : "נעילות של היריב מזוהות רק אחרי שהשחקן שיחק משחק נוסף, אז זה לפחות הניקוד שלו"}">${f1(TW.cur)}</strong>
        <span title="כל פותח לא נעול מקבל את המשחק האחרון שלו בשבוע">אם נגמר עכשיו <b class="num">${f1(TW.prov)}</b></span></div></div>`;
    const matchup = `<section class="panel b-mu"><div class="ph"><h2>המאץ' · שבוע ${D.week}</h2><span class="meta"><bdi dir="ltr">${weekRange(Wm)}</bdi></span></div>
      ${team(me, myR, MY_USER_ID, true)}${team(op, oppR, op.uid, false)}
      <div class="mu-p"><div class="tug" role="img" aria-label="סיכוי לנצח ${Math.round(pw * 100)}%"><i style="width:${(pw * 100).toFixed(1)}%;background:${cMe}"></i><i style="width:${((1 - pw) * 100).toFixed(1)}%;background:${cOp}"></i></div>
        <div class="mu-pl"><span><b class="fig ${pw >= 0.5 ? "good" : "bad"}">${Math.round(pw * 100)}%</b> סיכוי לנצח</span><span class="muted">${lead > 0 ? `מוביל ב-${f1(lead)}` : lead < 0 ? `מפגר ב-${f1(-lead)}` : "שוויון"} בנעול</span></div></div></section>`;

    // locked (team colour) and what the games left should still add (projection colour), on one scale
    const maxE = Math.max(me.exp, op.exp, 1);
    const pjRow = (TW, uid, nm) => { const rest = Math.max(0, TW.exp - TW.cur);
      return `<div class="pj"><div class="pj-h"><span class="who">${mdot(uid)}${nm}</span><b class="fig">${f1(TW.exp)}</b></div>
        <div class="pj-b" role="img" aria-label="נעול ${f1(TW.cur)}, צפוי עוד ${f1(rest)}"><i style="width:${(TW.cur / maxE * 100).toFixed(1)}%;background:${uid === MY_USER_ID ? cMe : cOp}"></i><i class="ex" style="width:${(rest / maxE * 100).toFixed(1)}%"></i></div>
        <div class="pj-s"><span>נעול <b class="num">${f1(TW.cur)}</b></span><span>עוד צפוי <b class="num">${f1(rest)}</b></span></div></div>`; };
    const dExp = me.exp - op.exp;
    const proj = `<section class="panel b-pj"><div class="ph"><h2>צפי לסוף השבוע</h2><span class="meta">${dExp >= 0 ? `לפני ב-${f1(dExp)}` : `אחרי ב-${f1(-dExp)}`}</span></div>
      ${pjRow(me, MY_USER_ID, "אתה")}${pjRow(op, op.uid, oppName)}
      <div class="legend-row"><span><i class="bx" style="background:var(--label)"></i>נעול (בצבע הקבוצה)</span><span><i class="bx" style="background:var(--proj)"></i>צפוי מהמשחקים שנשארו</span></div></section>`;

    // one pip per starter slot
    const pip = (x, s) => {
      if (!x) return `<i class="pip none" title="${s}: ריק"></i>`;
      const st = x.locked ? "lk" : x.left.length ? "open" : x.g.length ? "fin" : "none";
      const lbl = {lk: `נעול על ${f1(x.pts || 0)}`, open: `פתוח, ${x.left.length} משחקים נשארו`, fin: "סיים בלי נעילה: נספר המשחק האחרון", none: "אין משחקים"}[st];
      return `<i class="pip ${st} ${!x.locked && isOut(x.inj) ? "hurt" : ""}" title="${s} · ${esc(x.p.n)} · ${lbl}"></i>`; };
    const pipRow = (TW, uid, nm) => `<div class="pp"><div class="pp-h"><span class="who">${mdot(uid)}${nm}</span><b class="fig">${TW.nLocked}<small>/${SLOTS.length}</small></b></div>
      <div class="pp-r">${TW.st.map((x, i) => pip(x, SLOTS[i])).join("")}</div></div>`;
    const locks = `<section class="panel b-lk"><div class="ph"><h2>נעולים</h2><span class="meta">משבצת לכל פותח</span></div>
      ${pipRow(me, MY_USER_ID, "אתה")}${pipRow(op, op.uid, oppName)}
      <div class="pp-sl">${SLOTS.map(s => `<span>${s}</span>`).join("")}</div>
      <div class="legend-row"><span><i class="pip lk"></i>נעול</span><span><i class="pip open"></i>פתוח</span><span><i class="pip fin"></i>סיים</span><span><i class="pip open hurt"></i>פצוע</span></div></section>`;

    // games per day, mine against his; the next game day is the spotlight
    const oppAll = [...op.st.filter(Boolean), ...op.bench];
    const cnt = (list, d) => list.filter(x => x.g.some(g => g.date === d)).length;
    const nextDay = Wm.dates.find(d => d >= Wm.today && all.some(x => x.g.some(g => g.date === d && !g.done)));
    const maxDay = Math.max(1, ...Wm.dates.map(d => Math.max(cnt(all, d), cnt(oppAll, d))));
    const days = `<section class="panel b-dy"><div class="ph"><h2>משחקים לפי יום</h2><span class="meta">כמה שחקנים משחקים</span></div>
      <div class="dyc">${Wm.dates.map(d => { const a = cnt(all, d), b = cnt(oppAll, d), when = d < Wm.today ? "past" : d === Wm.today ? "today" : "";
        return `<div class="dyc-d ${when} ${d === nextDay ? "next" : ""}" title="${dLbl(d)}: ${a} שלך, ${b} של ${oppName}">
          <div class="dyc-cols"><span class="dyc-c" style="--h:${(a / maxDay * 100).toFixed(1)}%;--c:${cMe}"><b>${a}</b></span><span class="dyc-c" style="--h:${(b / maxDay * 100).toFixed(1)}%;--c:${cOp}"><b>${b}</b></span></div>
          <span class="dyc-l">${WD[dObj(d).getUTCDay()]}'<small>${dObj(d).getUTCDate()}.${dObj(d).getUTCMonth() + 1}</small></span></div>`; }).join("")}</div>
      <div class="legend-row"><span><i class="bx" style="background:${cMe}"></i>אתה</span><span><i class="bx" style="background:${cOp}"></i>${oppName}</span><span><i class="bx" style="background:var(--spot)"></i>יום המשחקים הבא</span></div></section>`;
    row1 = `<div class="row r4">${matchup}${proj}${locks}${days}</div>`;
  } else row1 = `<div class="row r1"><section class="panel empty-panel"><p>אין מאץ'אפ לשבוע ${D.week} עדיין.</p></section></div>`;

  // ---- row 2: what to do now, tonight, head to head ----
  const open = openAlerts(), done = ALR.list.filter(a => ackOf()[a.id]);
  const nUrg = open.filter(a => a.pri === 1).length, nChk = open.filter(a => a.pri === 2).length;
  const ac = `<section class="panel ac"><div class="ph"><h2>מה לעשות עכשיו</h2><span class="meta">${nUrg ? `<span class="pill bad">${nUrg} דחופים</span>` : ""}${nChk ? `<span class="pill">${nChk} לבדוק</span>` : ""}</span>
      <span class="ph-act">${lockSyncChip()}<a class="btn sm" href="${SLEEPER_URL}" target="_blank" rel="noopener">${ric("ext")}Sleeper</a></span></div>
    ${open.length ? `<ol class="al">${open.map(a => alertRow(a)).join("")}</ol>` : `<div class="al-empty">${ric("check")}<div><b>הכל מסודר</b><p>אין משחק לנעול, שינוי בהרכב או החתמה ששווה לעשות כרגע. ההתראה הבאה תגיע כשמשחק ייגמר.</p></div></div>`}
    ${done.length ? `<details class="al-done"><summary>טופלו (${done.length})</summary><ol class="al compact">${done.map(a => alertRow(a, true)).join("")}</ol></details>` : ""}</section>`;
  const tRow = r => `<div class="tn-r">${av(r.x.p, 26)}<span class="tn-n">${pName(r.x)} ${injBadge(r.x.inj)}</span>
      <span class="tn-o" dir="ltr">${r.g.home ? "vs" : "@"} ${esc(r.g.opp)}</span>
      <span class="tn-t">${r.tip ? (r.tip.state === "in" ? `<b class="live-dot">חי</b>` : ilTime(r.tip.t, T.day !== Wm.today)) : ""}</span>
      <span class="tn-s">${r.x.locked ? `<span class="tag2 ok">נעול</span>` : r.last ? `<span class="tag2" title="המשחק האחרון שלו השבוע: נספר בכל מקרה">אחרון</span>` : `<span class="tag2 pj" title="אחרי המשחק: נועלים אם הוא עבר את המספר הזה">רף <b class="num">${f1(r.bar)}</b></span>`}</span></div>`;
  const tStart = T ? T.rows.filter(r => r.start) : [], tBench = T ? T.rows.filter(r => !r.start) : [];
  const tonight = `<section class="panel b-tn"><div class="ph"><h2><i class="spot-dot"></i>${T && T.day === Wm.today ? "הלילה" : "יום המשחקים הבא"}</h2><span class="meta">${T ? `${dLbl(T.day)} · ${T.rows.length} שלך · ${T.oppN} של היריב` : ""}</span></div>
    ${T ? `<div class="tn-l">${tStart.map(tRow).join("")}</div>
      ${tBench.length ? `<div class="tn-bn"><span class="tn-bk">ספסל</span><span class="tn-fs">${tBench.map(r => `<span title="${esc(r.x.p.n)} · ${r.g.home ? "vs" : "@"} ${esc(r.g.opp)}${r.bar != null ? ` · רף ${f1(r.bar)}` : ""}">${av(r.x.p, 24)}</span>`).join("")}</span><span class="tn-bt">${tBench.map(r => esc(r.x.p.n.split(" ").slice(-1)[0])).join(", ")}</span></div>` : ""}
      <p class="hint">רף = נועלים אחרי המשחק אם הניקוד מעליו. שעון ישראל.</p>`
      : `<p class="empty-note">אין לך עוד משחקים השבוע.</p>`}</section>`;
  let hh = "";
  if (op) {
    const ds = SLOTS.map((s, i) => { const a = me.st[i], b = op.st[i]; return {s, a, b, d: (a ? a.exp : 0) - (b ? b.exp : 0)}; });
    const mx = Math.max(1, ...ds.map(r => Math.abs(r.d))), sum = ds.reduce((x, r) => x + r.d, 0);
    const nm = x => x ? `<span class="hh-p">${x.p.stub ? esc(x.p.n) : nameLink(x.p)}</span>${x.locked ? `<span class="lk" title="נעול">${ric("lock")}</span>` : ""}` : `<span class="muted">ריק</span>`;
    hh = `<section class="panel b-hh"><div class="ph"><h2>ראש בראש לפי עמדה</h2><span class="meta">הפרש בצפי · סך הכל <b class="num ${sum >= 0 ? "good" : "bad"}">${sg(sum)}</b></span></div>
      <div class="hh-h"><span></span><span>אתה</span><span class="hh-c">יתרון</span><span>${oppName}</span><span></span></div>
      <div class="hh-l">${ds.map(r => `<div class="hh-r"><span class="pos ${posGroup(r.s)}">${r.s}</span><span class="hh-n a">${nm(r.a)}</span>
        <span class="hh-b" role="img" aria-label="${r.d >= 0 ? "יתרון לך" : "יתרון ליריב"} ${f1(Math.abs(r.d))}"><span class="hh-half me">${r.d > 0 ? `<i style="width:${(r.d / mx * 100).toFixed(1)}%;background:${cMe}"></i>` : ""}</span><span class="hh-half op">${r.d < 0 ? `<i style="width:${(-r.d / mx * 100).toFixed(1)}%;background:${cOp}"></i>` : ""}</span></span>
        <span class="hh-n b">${nm(r.b)}</span><b class="hh-d num ${r.d >= 0 ? "good" : "bad"}">${sg(r.d)}</b></div>`).join("")}</div></section>`;
  }
  // the swaps (built below) sit under what to do now, so the three columns end at about the same height
  const row2 = fa => op ? `<div class="row w534"><div class="stack">${ac}${fa}</div>${tonight}${hh}</div>` : `<div class="row r2"><div class="stack">${ac}${fa}</div>${tonight}</div>`;

  // ---- row 3: the week board, one row per player, one column per day ----
  const dayCount = d => all.filter(x => x.g.some(g => g.date === d)).length;
  const cellOf = (x, d) => {
    const g = x.g.find(y => y.date === d);
    if (!g) return `<td class="dc none"></td>`;
    const opp = `${g.home ? "" : "@"}${g.opp}`;
    if (g.done && g.fp != null) {
      const isLocked = x.lockedOn === d, counted = !x.locked && x.lastFp === g.fp && x.played[x.played.length - 1].date === d;
      const cls = g.fp >= x.m * 1.15 ? "hi" : g.fp <= x.m * 0.8 ? "lo" : "";
      return `<td class="dc done ${cls} ${isLocked ? "lockd" : counted ? "cnt" : ""}" title="${esc(opp)}"><b class="num">${f1(g.fp)}</b>${isLocked ? `<i>${ric("lock")}</i>` : ""}</td>`;
    }
    if (g.done) return `<td class="dc dnp" title="${esc(opp)}">לא שיחק</td>`;
    const tip = tipOf(x.team, d);
    return `<td class="dc fut ${g.today ? "today" : ""} ${g.live ? "live" : ""}" title="${tip ? "פתיחה " + ilTime(tip.t) + " שעון ישראל" : ""}"><span dir="ltr">${esc(opp)}</span></td>`;
  };
  const ACT = {locked: ["נעול", "ok"], lock: ["לנעול", "go"], wait: ["לחכות", ""], ahead: ["עוד לא שיחק", "muted"], final: ["סיים", "muted"], nogames: ["אין משחקים", "bad"], out: ["פצוע", "bad"]};
  const rowOf = (x, slot) => `<tr class="${slot ? "" : "bn"}">
      <td class="w-slot">${slot ? `<span class="pos ${posGroup(slot)}">${slot}</span>` : `<span class="pos bn">${slot === "" ? "IR" : "BN"}</span>`}</td>
      <td class="w-pl"><div class="pcell">${av(x.p, 28)}<div><div class="nm">${pName(x)} ${injBadge(x.inj)}</div><div class="psub">${esc(x.team)} · <span title="תחזית למשחק, ממנה הרף. לפני העונה ${f1(x.fpg)}${x.minutes != null ? `. הדקות וכל קטגוריה לדקה לומדות מ-${x.gp} המשחקים שלו העונה, בניקוד של הליגה: ${f1(x.minutes)} דקות (לפני העונה ${f1(x.p.pl.min)})` : `, ביחד עם ${x.gp} המשחקים שלו העונה`}">${f1(x.m)} למשחק</span></div></div></div></td>
      ${Wm.dates.map(d => cellOf(x, d)).join("")}
      <td class="num w-cur"><b class="${x.locked ? "" : "prov"}" title="${x.locked ? "נעול" : "לא נעול: המשחק האחרון שלו. נספר רק אם תנעל, או אוטומטית אם זה המשחק האחרון שלו בשבוע"}">${x.pts != null ? f1(x.pts) : "—"}</b></td>
      <td class="num w-thr">${x.locked ? "" : (x.act === "lock" || x.act === "wait") ? `<b>${f1(x.thr)}</b>` : x.thrNext != null ? `<span title="הרף אחרי המשחק הבא שלו">${f1(x.thrNext)}</span>` : ""}</td>
      <td class="w-act"><button class="act ${ACT[x.act][1]}" onclick="toggleLock('${x.id}')" title="לחיצה מסמנת או מבטלת נעילה (אם נעלת ב-Sleeper והמערכת לא זיהתה)">${ACT[x.act][0]}</button></td>
    </tr>`;
  const board = `<div class="row r1"><section class="panel wk-board"><div class="ph"><h2>הלוח של השבוע</h2>
      <span class="legend-k"><span><i class="lgk cnt"></i>נספר עכשיו</span><span><i class="lgk lockd"></i>נעול</span><span><i class="lgk hi"></i>מעל הממוצע שלו</span><span><b class="pj-t">רף</b> = נועלים אם המשחק האחרון מעליו</span></span></div>
    <div class="tablewrap"><table class="std wk"><thead><tr><th></th><th>שחקן</th>${Wm.dates.map(d => `<th class="dh ${d === Wm.today ? "today" : ""}">${dLbl(d)}<small>${dayCount(d)} שלך</small></th>`).join("")}<th title="נעול = מודגש. אפור = המשחק האחרון של שחקן לא נעול">נספר</th><th title="נועלים את המשחק האחרון אם הוא מעל המספר הזה">רף</th><th>מה לעשות</th></tr></thead>
    <tbody>${me.st.map((x, i) => x ? rowOf(x, SLOTS[i]) : "").join("")}<tr class="sep"><td colspan="${Wm.dates.length + 5}">ספסל</td></tr>${me.bench.map(x => rowOf(x, null)).join("")}${me.ir.map(x => rowOf(x, "")).join("")}</tbody></table></div></section></div>`;

  // ---- row 4: swaps, injuries, the league's week ----
  const sw = bestSwaps(X, 4), mxG = Math.max(0.1, ...sw.map(s => s.g));
  const faHtml = `<section class="panel b-sw"><div class="ph"><h2>החלפות בשוק</h2><span class="ph-act"><button class="btn sm" onclick="setTab('fa')">לכל השוק</button></span></div>
    ${sw.length ? `<div class="swl">${sw.map(s => { const a = seasonSum(s.c.p.id);
      return `<div class="swr g">${av(s.c.p, 28)}<div class="swr-t"><b>${nameLink(s.c.p)} ${injBadge(s.c.inj)}</b><span>במקום ${esc(s.d.p.n)} · ${s.c.left} משחקים${a ? ` · בפועל ${f1(a.avg)}` : ""}</span></div>
        <span class="gbar" role="img" aria-label="רווח ${f1(s.g)}"><i style="width:${(s.g / mxG * 100).toFixed(1)}%"></i></span><b class="num good">${sg(s.g)}</b></div>`; }).join("")}</div>`
      : `<p class="empty-note">אין כרגע שחקן פנוי שמשפר את הסגל שלך.</p>`}
    <p class="hint">הפס = כמה הסגל כולו מרוויח בשבוע, כולל עמדות.</p></section>`;
  const myIds = [...all, ...me.ir].map(x => x.id), oppIds = op ? [...op.st.filter(Boolean), ...op.bench, ...op.ir].map(x => x.id) : [];
  const fresh = injChanges(myIds);
  const injList = [...myIds.map(id => [id, true]), ...oppIds.map(id => [id, false])].filter(([id]) => injOf(id) || fresh.includes(id));
  const injHtml = `<section class="panel b-inj"><div class="ph"><h2>פציעות</h2><span class="meta">${injList.filter(x => x[1]).length} אצלך · ${injList.filter(x => !x[1]).length} אצל היריב</span>${fresh.length ? `<span class="ph-act"><button class="btn sm" onclick='ackInjuries(${JSON.stringify(fresh)})'>ראיתי (${fresh.length})</button></span>` : ""}</div>
    ${injList.length ? `<div class="injl">${injList.sort((a, b) => (fresh.includes(b[0]) - fresh.includes(a[0])) || (b[1] - a[1])).map(([id, mine]) => {
      const x = pOf(id), i = injOf(id), e = espnInjOf(id);
      return `<div class="inj ${fresh.includes(id) ? "new" : ""}"><span class="inj-who" style="--r:${mine ? cMe : cOp}">${av(x, 30)}</span><div class="inj-t"><b>${x.stub ? esc(x.n) : nameLink(x)}</b><span>${mine ? "אצלך" : `אצל ${oppName}`} · ${esc(teamOf(id))}${e && e.ret ? ` · ${retTxt(e.ret)}` : ""}</span></div>
        <div class="inj-s">${i ? injBadge(i) : `<span class="ib ok">חזר</span>`}<span class="muted">${esc(i && i.part || "")}</span></div>${fresh.includes(id) ? `<em class="new-tag">חדש</em>` : ""}</div>`; }).join("")}</div>`
      : `<p class="empty-note">אין פצועים אצלך או אצל היריב.</p>`}
    <p class="hint">הטבעת בצבע הקבוצה. מ-Sleeper פעם בשעה, או מיד ברענון. תאריך חזרה מ-ESPN.</p></section>`;
  const lgT = D.rosters.map(r => ({uid: r.owner_id, TW: teamWeek(D, Wm, r)})).sort((a, b) => b.TW.exp - a.TW.exp);
  const mxL = Math.max(1, ...lgT.map(x => x.TW.exp));
  const lgHtml = `<section class="panel b-lg"><div class="ph"><h2>הליגה השבוע</h2><span class="meta">צפי לסוף השבוע</span></div>
    <div class="lgb">${lgT.map(({uid, TW}, i) => { const mine = uid === MY_USER_ID, isOp = op && uid === op.uid, col = mine ? cMe : isOp ? cOp : "#4a5f88";
      return `<div class="lgb-r ${mine ? "me" : ""}"><span class="lgb-k">${i + 1}</span><span class="who">${uAvatar(uOf(D, uid), 20)}<span class="lgb-n">${esc(tName(D, uid))}</span></span>
        <span class="lgb-b" role="img" aria-label="נעול ${f1(TW.cur)}, צפי ${f1(TW.exp)}"><i style="width:${(TW.cur / mxL * 100).toFixed(1)}%;background:${col}"></i><i class="ex" style="width:${(Math.max(0, TW.exp - TW.cur) / mxL * 100).toFixed(1)}%"></i></span><b class="num">${f1(TW.exp)}</b></div>`; }).join("")}</div>
    <p class="hint">אתה ${mine1(lgT)} · מלא = נעול, סגול = צפוי. נעילות של קבוצות אחרות מזוהות רק אחרי משחק נוסף.</p></section>`;

  out.innerHTML = `<div class="dgrid">${row1}${row2(faHtml)}${board}<div class="row r2">${injHtml}${lgHtml}</div></div>`;
}
// "מקום 2 מתוך 6 בצפי" for the league block
const mine1 = lgT => { const i = lgT.findIndex(x => x.uid === MY_USER_ID); return i < 0 ? "" : `מקום ${i + 1} מתוך ${lgT.length} בצפי`; };

// ---------- "שוק חופשי" ----------
function toggleWatch(id){
  S.faWatch = S.faWatch || [];
  const i = S.faWatch.indexOf(id);
  if (i >= 0) S.faWatch.splice(i, 1); else S.faWatch.push(id);
  save(); refreshAlerts(); rerenderSeason();
}
function sortFA(k){ const F = SEA.fa; if (F.sort === k) F.dir = -F.dir; else { F.sort = k; F.dir = -1; } renderFA(); }
function renderFA(){
  const out = $("faOut");
  startSeasonTimer();
  if (seasonGate(out)) return;
  const X = seasonState(), F = SEA.fa;
  if (!X || !X.myR) { out.innerHTML = `<div class="panel empty-panel"><p>לא מצאתי את הקבוצה שלך בליגה הזאת.</p></div>`; return; }
  const {D, Wm, me, fa} = X, watch = new Set(S.faWatch || []);

  // ---- recommended swaps ----
  const sw = bestSwaps(X, 3);
  const seasonTxt = id => { const s = seasonSum(id); return s ? `העונה בפועל: <b class="num">${f1(s.avg)}</b> למשחק (${s.gp})` : "עוד לא שיחק העונה"; };
  const swCard = (s, i) => { const d = s.d;
    return `<section class="panel sw-c"><div class="ph"><h2>החלפה ${i + 1}</h2><span class="meta"><b class="num good">${sg(s.g)}</b> לשבוע לסגל</span></div>
      <div class="sw">
      <div class="sw-p in"><span class="tag in">להחתים</span>${av(s.c.p, 44)}<div><b>${nameLink(s.c.p)}</b><span>${esc(s.c.team)} · ${(s.c.p.pos || []).join("/")} · ${f1(s.c.val)} לשבוע</span><span class="sw-act">${seasonTxt(s.c.p.id)}</span>
        <span class="sw-tags">${injBadge(s.c.inj)}${s.c.waiverUntil ? `<span class="ib q">waivers</span>` : ""}${s.c.trend ? `<span class="ib">${s.c.trend.toLocaleString("en-US")} הוסיפו</span>` : ""}</span></div></div>
      <span class="sw-x">${ric("swap")}</span>
      <div class="sw-p out"><span class="tag out">לשחרר</span>${av(d.p, 44)}<div><b>${pName(d)}</b><span>${esc(d.team)} · ${(d.p.pos || []).join("/")} · ${f1(adj(d.p))} לשבוע</span><span class="sw-act">${seasonTxt(d.id)}</span><span class="sw-tags">${injBadge(d.inj)}</span></div></div></div>
      <div class="sw-f"><span>פער בערך ${sg(s.c.val - adj(d.p))}</span><span>משחקים השבוע ${s.c.left} מול ${d.left.length}</span></div></section>`; };
  // my weakest players against the best free agent (the spotlight tick): how much room there is to upgrade
  const weak = fa.mineAll.filter(x => !x.p.stub).sort((a, b) => adj(a.p) - adj(b.p)).slice(0, 4);
  const bestFree = fa.list.filter(x => !isOut(x.inj)).reduce((a, x) => (!a || x.val > a.val ? x : a), null);
  const scaleW = Math.max(bestFree ? bestFree.val : 0, ...weak.map(x => adj(x.p)), 1);
  const weakHtml = `<section class="panel b-weak"><div class="ph"><h2>הכי חלשים אצלך</h2><span class="meta">מי הולך לשוק אם מחתימים</span></div>
    <div class="wk4">${weak.map(x => { const v = adj(x.p); return `<div class="wk4-r"><span class="who">${av(x.p, 22)}<span class="wk4-n">${nameLink(x.p)}</span></span>
      <span class="wk4-b" role="img" aria-label="ערך ${f1(v)}${bestFree ? `, הכי טוב שפנוי ${f1(bestFree.val)}` : ""}"><i style="width:${(v / scaleW * 100).toFixed(1)}%"></i>${bestFree ? `<em style="inset-inline-start:${(bestFree.val / scaleW * 100).toFixed(1)}%"></em>` : ""}</span><b class="num">${f1(v)}</b></div>`; }).join("")}</div>
    <div class="legend-row"><span><i class="bx" style="background:#4a5f88"></i>ערך שבועי</span>${bestFree ? `<span><i class="tick"></i>הכי טוב שפנוי: ${esc(bestFree.p.n)} · ${f1(bestFree.val)}</span>` : ""}</div></section>`;
  const swapsRow = sw.length ? `<div class="row r${sw.length + 1}">${sw.map(swCard).join("")}${weakHtml}</div>`
    : `<div class="row r2"><section class="panel empty-panel"><p>אין כרגע שחקן פנוי שמשפר את הסגל שלך. כשמישהו ישתחרר או שתפקיד יגדל, הוא יופיע כאן.</p></section>${weakHtml}</div>`;

  // ---- the list ----
  const posOk = x => F.pos === "ALL" || (x.p.pos || []).some(q => (ELIG[F.pos] || [F.pos]).includes(q));
  let list = fa.list.filter(x => posOk(x) && (!F.healthy || !isOut(x.inj)) && (!F.watch || watch.has(x.p.id)));
  const actual = x => { const s = seasonSum(x.p.id); return s ? s.avg : -1; };
  const key = {gain: x => x.gain, val: x => x.val, fpg: x => x.p.fpg || 0, avg: actual, left: x => x.left * 100 + x.val, next: x => x.next * 100 + x.val, min: x => x.dMin, trend: x => x.trend}[F.sort] || (x => x.gain);
  list.sort((a, b) => F.dir * (key(a) - key(b)));
  const total = list.length;
  list = list.slice(0, 50);
  const chips = ["ALL", "G", "F", "C"].map(k => `<button class="${F.pos === k ? "sel" : ""}" onclick="SEA.fa.pos='${k}';renderFA()">${k === "ALL" ? "הכל" : k}</button>`).join("");
  const arrow = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${F.dir < 0 ? "m6 9 6 6 6-6" : "m18 15-6-6-6 6"}"/></svg>`;
  const th = (k, t, cls = "", tip = "") => `<th class="${cls} ${F.sort === k ? "sorted" : ""}" ${tip ? `title="${esc(tip)}"` : ""} aria-sort="${F.sort === k ? (F.dir < 0 ? "descending" : "ascending") : "none"}"><button class="th-s" onclick="sortFA('${k}')">${t}${F.sort === k ? arrow : ""}</button></th>`;
  const table = `<section class="panel fa-list">
    <div class="ph"><h2>שחקנים פנויים</h2><span class="meta">${total} שחקנים · מול ${fa.worst ? esc(fa.worst.p.n) : "—"}, הכי חלש אצלך</span><span class="ph-act"><a class="btn sm" href="${SLEEPER_URL}" target="_blank" rel="noopener">${ric("ext")}Sleeper</a></span></div>
    <div class="fa-tools"><div class="seg-pos">${chips}</div>
      <label class="chk"><input type="checkbox" ${F.healthy ? "checked" : ""} onchange="SEA.fa.healthy=this.checked;renderFA()"> בלי פצועים</label>
      <label class="chk"><input type="checkbox" ${F.watch ? "checked" : ""} onchange="SEA.fa.watch=this.checked;renderFA()"> רק במעקב (${watch.size})</label></div>
    <div class="tablewrap"><table class="std dt">
    <thead><tr><th class="w-star"></th><th>שחקן</th>${th("val", "ערך", "", "נקודות לשבוע ב-Lock-in לפי המודל, אחרי סיכון")}${th("gain", "פער", "", "מול השחקן הכי חלש שלך")}${th("avg", "בפועל", "", "ממוצע הנקודות שלו העונה בניקוד של הליגה, ובסוגריים כמה משחקים")}<th class="hide-sm" title="שלושת המשחקים האחרונים, מהישן לחדש. ירוק = מעל התחזית, אפור = מתחת">אחרונים</th>${th("fpg", "תחזית", "hide-sm", "תחזית למשחק")}${th("left", "השבוע", "", "משחקים שנשארו מתוך כל המשחקים של הקבוצה השבוע")}${th("next", "שבוע הבא", "hide-sm")}${th("min", "דקות", "hide-sm", "דקות בתחזית של השבוע מול התחזית לעונה")}${th("trend", "מגמה", "hide-sm", "כמה הוסיפו אותו ב-Sleeper ב-24 השעות האחרונות")}</tr></thead>
    <tbody>${list.length ? list.map(x => `<tr class="${watch.has(x.p.id) ? "watched" : ""}"><td class="w-star"><button class="star ${watch.has(x.p.id) ? "on" : ""}" onclick="toggleWatch('${x.p.id}')" title="${watch.has(x.p.id) ? "הסרה מרשימת המעקב" : "מעקב: התראה כשהוא משתלם"}" aria-label="מעקב">${IC.star}</button></td>
      <td><div class="pcell">${av(x.p, 28)}<div><div class="nm">${nameLink(x.p)} ${injBadge(x.inj)}${x.waiverUntil ? ` <span class="ib q" title="שוחרר לאחרונה, עובר דרך waivers">waivers עד ${new Date(x.waiverUntil).toLocaleDateString("he-IL", {day: "numeric", month: "numeric"})}</span>` : ""}</div><div class="psub">${esc(x.team)} · ${(x.p.pos || []).join("/")}${x.p.age ? ` · גיל ${x.p.age}` : ""}</div></div></div></td>
      <td class="num"><b>${f1(x.val)}</b></td><td class="num ${x.gain > 0 ? "good" : "bad"}">${sg(x.gain)}</td><td class="num">${actualCell(x.p.id, x.p.fpg)}</td><td class="num hide-sm">${lastCell(x.p.id, x.p.fpg)}</td><td class="num hide-sm">${f1(x.p.fpg)}</td>
      <td class="num">${x.left}<span class="muted">/${x.games}</span></td><td class="num hide-sm">${x.next || "—"}</td>
      <td class="num hide-sm ${x.dMin >= 3 ? "good" : x.dMin <= -3 ? "bad" : ""}">${x.wkMin ? `<span dir="ltr">${Math.round(x.wkMin)}${Math.abs(x.dMin) >= 1 ? ` <small>(${x.dMin > 0 ? "+" : "−"}${Math.round(Math.abs(x.dMin))})</small>` : ""}</span>` : "—"}</td>
      <td class="num hide-sm">${x.trend ? x.trend.toLocaleString("en-US") : ""}</td></tr>`).join("") : `<tr><td colspan="11" class="empty-row">${F.watch ? "אין שחקנים ברשימת המעקב. לוחצים על הכוכב ליד שחקן כדי לעקוב אחריו." : "אין שחקנים שמתאימים לסינון."}</td></tr>`}</tbody></table></div>
    <p class="hint">"בפועל" = ממוצע הנקודות שלו העונה בניקוד של הליגה (לחיצה על השם פותחת את כל המשחקים). "השבוע" = משחקים שנשארו מתוך כל המשחקים של הקבוצה השבוע: ב-Lock-in יותר משחקים = יותר הזדמנויות. הכוכב = מעקב, עם התראה כשהשחקן משתלם.${HIST.loading ? " מושך את השבועות הקודמים…" : ""}</p></section>`;

  // ---- side ----
  const tr = (D.trend || []).slice(0, 8).map(t => ({id: t.player_id, c: t.count, p: pOf(t.player_id), free: !fa.rostered.has(t.player_id)}));
  const trHtml = `<section class="panel"><div class="ph"><h2>מה מוסיפים ב-Sleeper</h2><span class="meta">24 שעות</span></div><div class="trl">${tr.map(t => `<div class="tri ${t.free ? "" : "taken"}">${av(t.p, 24)}<span class="nm">${t.p.stub ? esc(t.p.n) : nameLink(t.p)}</span><span class="muted">${esc(teamOf(t.id))}</span><b class="num">${t.c.toLocaleString("en-US")}</b><em>${t.free ? "פנוי" : "תפוס"}</em></div>`).join("")}</div>
    <p class="hint">הוספות בכל הליגות ב-Sleeper. שם מתגלים שחקנים שהתפקיד שלהם גדל.</p></section>`;
  const opp = [];
  Object.entries(SEA.pl || {}).forEach(([id, x]) => {
    if (!x.team || !isOut(injOf(id))) return;
    const p = PMAP.get(id); if (!p || (p.min || 0) < 26) return;
    const mates = fa.list.filter(f => f.team === x.team && !isOut(f.inj) && f.p.pos.some(q => (p.pos || []).includes(q))).sort((a, b) => (b.dMin - a.dMin) || (b.val - a.val)).slice(0, 2);
    if (mates.length) opp.push({p, team: x.team, mates, e: espnInjOf(id)});
  });
  const oppHtml = `<section class="panel"><div class="ph"><h2>הזדמנויות מפציעות</h2></div>${opp.length ? `<div class="ops">${opp.sort((a, b) => b.p.min - a.p.min).slice(0, 5).map(o => `<div class="op">${av(o.p, 26)}<div><div class="op-h"><b>${esc(o.p.n)}</b><span class="ib out">בחוץ</span><span class="muted">${esc(o.team)}${o.e && o.e.ret ? ` · ${retTxt(o.e.ret)}` : ""}</span></div>
      <div class="op-m">פנויים: ${o.mates.map(m => `${nameLink(m.p)}${m.dMin >= 2 ? ` <small class="good"><bdi dir="ltr">+${Math.round(m.dMin)}</bdi> דק'</small>` : ""}`).join(", ")}</div></div></div>`).join("")}</div>` : `<p class="empty-note">אין כרגע שחקן רוטציה בחוץ עם מחליף פנוי.</p>`}
    <p class="hint">שחקן עם 26+ דקות שמסומן בחוץ, ושחקנים פנויים מאותה קבוצה ועמדה.</p></section>`;
  out.innerHTML = `<div class="dgrid">${swapsRow}<div class="row w93">${table}<div class="stack fa-side">${oppHtml}${trHtml}</div></div></div>`;
}
