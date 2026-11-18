(function () {
  'use strict';
  var DATA = window.RADAR;
  if (!DATA) return;
  var app = el('board');
  var PAGE = 50;
  var state = { lang: 'en', q: '', category: 'all', chain: 'all', scope: 'all', tab: 'pre-token', sort: 'implied', dir: -1, selected: null, page: 1, deposit: 10000, verdict: 'all',
    sb: { scale: 1, growth: DATA.model.growth_weight, maturity: DATA.model.maturity_range, chain: DATA.model.chain_step } };
  var BASE_SB = JSON.parse(JSON.stringify(state.sb));
  var PFKEY = 'wr-pf', amt = 500, pfNote = '';
  var pf = { cash: 10000, hold: {} };
  function liveBySlug(s) { var f = null; DATA.live.forEach(function (r) { if (r.slug === s) f = r; }); return f; }
  try { var sv = JSON.parse(localStorage.getItem(PFKEY) || 'null'); if (sv && isFinite(sv.cash) && sv.cash >= 0 && sv.hold) { pf.cash = sv.cash; for (var k in sv.hold) if (liveBySlug(k) && isFinite(sv.hold[k]) && sv.hold[k] > 0) pf.hold[k] = sv.hold[k]; } } catch (e) {}
  function pfSave() { try { localStorage.setItem(PFKEY, JSON.stringify(pf)); } catch (e) {} }
  function pfTrade(slug, dir) {
    var a = dir === 0 ? Infinity : amt, h = pf.hold[slug] || 0;
    if (dir !== 0 && !(a > 0)) return;
    if (dir > 0) { if (a > pf.cash) { pfNote = vstr(34); pfRefresh(); return; } pf.cash -= a; pf.hold[slug] = h + a; }
    else { if (h <= 0) return; var s = Math.min(a, h); pf.cash += s; if (s >= h) delete pf.hold[slug]; else pf.hold[slug] = h - s; }
    pfNote = ''; pfSave(); pfRefresh();
  }
  function pfReset() { pf = { cash: 10000, hold: {} }; pfNote = ''; pfSave(); pfRefresh(); }
  function pfRefresh() { renderTable(); if (dialog && dialog.open) openDetail(state.selected, true); }

  var I18N = {
    en: {
      skip: 'Skip to board', pTit: 'Watch RADAR: pre-token protocols',
      snap: 'Snapshot', idx: 'DefiLlama index', floor: 'Floor', lang: 'Language',
      heroA: '{n} watchlist protocols', heroB: ', ranked by launch value',
      hInt: 'Watchlist: $50M+ TVL, no token on record. Implied value is a model, not a price, not a promise.',
      fWch: 'Watchlist', fWcS: 'the full list',
      fRws: 'Pre-token rows', fRwS: '{n} early',
      factTop: 'Top value', fMed: 'Median value', fMdS: 'live tokens set aside: {n}',
      find: 'Search', srch: 'Search name or category',
      cat: 'Category', aCat: 'All categories',
      chain: 'Chain', aChn: 'All chains',
      scope: 'Scope', all: 'All', wLst: 'Watchlist', early: 'Early',
      tSta: 'Token status', pTok: 'Pre-token', lTok: 'Live token',
      rSho: '{n} rows shown', sbOn: ' (sandbox model)', lCnt: '{n} live tokens',
      lCap: 'Live tokens already trade; market cap is a fact.',
      tCap: 'Strongest first.',
      rank: 'Rank', prtc: 'Protocol', tvl: 'TVL', g7d: '7d', age: 'Age', impl: 'Implied value', token: 'Token',
      stat: 'Status', mCap: 'Market cap', noTok: 'no token', aTrd: 'already trades', other: 'Other',
      eTit: 'No matches', eBdy: 'Clear search or change filters.', cFil: 'Clear filters',
      pager: 'Page {a}/{b} · rows {c}–{d} of {e}', prev: 'Prev', next: 'Next', unk: 'unknown',
      mTit: 'How the value is computed',
      mInt: 'One function scores every row; no-token rows only.',
      sbTit: 'Model sandbox',
      sbInt: 'Recomputes each row live.',
      sbSc: 'Scale ×', sbGr: 'Growth', sbMt: 'Maturity', sbCh: 'Chain', sbRst: 'Reset',
      cTit: 'Category multiples', cOth: 'Other',
      mNte: 'TVL and 7-day growth: from the snapshot.',
      ft1: 'Data: ',
      foot2: 'No prediction of issuance or timing.',
      val: 'Tested out of sample|Fitted on 4 of 5 folds of the {n} traded tokens. The P10–P90 band is this test’s spread.|Variant|Miss|≤3×|Rank ρ|Walk-fwd|Verdict|Worth farming|Marginal|Skip|Deposit|Farmer economics|Share at P10|Net after gas|Break-even|Net/hour|Traded tokens set the curve|TVL log $|Value log $|Traded tokens|Fitted curve|P25–P75 band|Hot — fastest 7-day TVL growth in this snapshot|Tracked since|Paper trading|Simulated: prices frozen at the 2026-11-14 snapshot.|Cash|Holdings|Total|Buy|Sell|Sell all|Amount|Not enough cash|Launchpad — newest pre-token protocols on this board|Newest on this board. Not confirmed launches: no launch date known|Hot',
      rkOf: 'Rank {a} of {b}', cls: 'Close',
      eqTVL: 'TVL', eGrw: '7d', eqAge: 'Age', eChs: 'Chains',
      eCat: 'Category multiple ({cat})', eGrM: 'Growth multiplier', eMtM: 'Maturity multiplier', eChM: 'Chain multiplier',
      fPln: 'Farm plan',
      dNtA: 'Recomputed here as {val}',
      dNtS: ', same as board.json.',
      dNtD: ', not the board number.',
      wWch: 'Watchlist: ${n}M+ TVL.',
      wErl: 'Below the floor.',
    },
    id: {
      skip: 'Lewati ke papan', pTit: 'Watch RADAR: protokol pra-token',
      snap: 'Cuplikan', idx: 'Indeks DefiLlama', floor: 'Ambang', lang: 'Bahasa',
      heroA: '{n} protokol watchlist', heroB: ', diurutkan berdasarkan nilai peluncuran',
      hInt: 'Watchlist: TVL $50 jt ke atas, tanpa token tercatat. Nilai tersirat adalah model, bukan harga, bukan janji.',
      fWch: 'Watchlist', fWcS: 'seluruh daftar',
      fRws: 'Baris pra-token', fRwS: '{n} awal',
      factTop: 'Nilai tertinggi', fMed: 'Nilai median', fMdS: 'token live dipisahkan: {n}',
      find: 'Cari', srch: 'Cari nama atau kategori',
      cat: 'Kategori', aCat: 'Semua kategori',
      chain: 'Chain', aChn: 'Semua chain',
      scope: 'Cakupan', all: 'Semua', wLst: 'Watchlist', early: 'Awal',
      tSta: 'Status token', pTok: 'Pra-token', lTok: 'Token live',
      rSho: '{n} baris ditampilkan', sbOn: ' (model sandbox)', lCnt: '{n} token live',
      lCap: 'Token live sudah diperdagangkan; kapitalisasi pasarnya fakta.',
      tCap: 'Terkuat di atas.',
      rank: 'Peringkat', prtc: 'Protokol', tvl: 'TVL', g7d: '7h', age: 'Usia', impl: 'Nilai tersirat', token: 'Token',
      stat: 'Status', mCap: 'Kapitalisasi pasar', noTok: 'tanpa token', aTrd: 'sudah diperdagangkan', other: 'Lainnya',
      eTit: 'Tidak ada yang cocok', eBdy: 'Hapus pencarian atau ubah filter.', cFil: 'Hapus filter',
      pager: 'Halaman {a}/{b} · baris {c}–{d} dari {e}', prev: 'Sebelumnya', next: 'Berikutnya', unk: 'tidak diketahui',
      mTit: 'Cara nilai dihitung',
      mInt: 'Satu fungsi menilai setiap baris; hanya baris tanpa token.',
      sbTit: 'Sandbox model',
      sbInt: 'Menghitung ulang tiap baris secara langsung.',
      sbSc: 'Skala ×', sbGr: 'Pertumbuhan', sbMt: 'Kematangan', sbCh: 'Chain', sbRst: 'Reset',
      cTit: 'Pengali kategori', cOth: 'Lainnya',
      mNte: 'TVL dan pertumbuhan 7 hari dari snapshot.',
      ft1: 'Data: ',
      foot2: 'Bukan prediksi penerbitan atau waktu.',
      val: 'Diuji di luar sampel|Dipasang pada 4 dari 5 lipatan {n} token yang diperdagangkan. Rentang P10–P90 adalah sebaran tes ini.|Varian|Miss|≤3×|Rank ρ|Walk-fwd|Putusan|Layak di-farming|Marginal|Lewati|Deposit|Ekonomi farming|Bagian pada P10|Netto setelah gas|Titik impas|Netto/jam|Token diperdagangkan menentukan kurva|TVL log $|Nilai log $|Token diperdagangkan|Kurva hasil pas|Rentang P25–P75|Populer — pertumbuhan TVL 7 hari tercepat di snapshot ini|Dilacak sejak|Simulasi trading|Simulasi: harga beku di snapshot 2026-11-14.|Kas|Posisi|Total|Beli|Jual|Jual semua|Jumlah|Kas tidak cukup|Launchpad — protokol pra-token terbaru di papan ini|Terbaru di papan ini. Bukan peluncuran terkonfirmasi: tanggal peluncuran belum diketahui|Populer',
      rkOf: 'Peringkat {a} dari {b}', cls: 'Tutup',
      eqTVL: 'TVL', eGrw: '7h', eqAge: 'Usia', eChs: 'Chain',
      eCat: 'Pengali kategori ({cat})', eGrM: 'Pengali pertumbuhan', eMtM: 'Pengali kematangan', eChM: 'Pengali chain',
      fPln: 'Rencana farming',
      dNtA: 'Dihitung ulang di sini menjadi {val}',
      dNtS: ', sama board.json.',
      dNtD: ', bukan angka papan.',
      wWch: 'Watchlist: TVL ${n} jt ke atas.',
      wErl: 'Di bawah ambang.',
    },
    es: {
      skip: 'Saltar al tablero', pTit: 'Watch RADAR: protocolos pre-token',
      snap: 'Instantánea', idx: 'Índice DefiLlama', floor: 'Mínimo', lang: 'Idioma',
      heroA: '{n} protocolos en seguimiento', heroB: ', clasificados por valor de lanzamiento',
      hInt: 'Lista: TVL de $50 M o más, sin token registrado. El valor implícito es un modelo, no un precio, no una promesa.',
      fWch: 'Lista', fWcS: 'la lista completa',
      fRws: 'Filas pre-token', fRwS: '{n} tempranos',
      factTop: 'Valor máximo', fMed: 'Valor mediano', fMdS: 'tokens en vivo apartados: {n}',
      find: 'Buscar', srch: 'Buscar nombre o categoría',
      cat: 'Categoría', aCat: 'Todas las categorías',
      chain: 'Cadena', aChn: 'Todas las cadenas',
      scope: 'Alcance', all: 'Todos', wLst: 'Seguimiento', early: 'Temprano',
      tSta: 'Estado del token', pTok: 'Pre-token', lTok: 'Token en vivo',
      rSho: '{n} filas mostradas', sbOn: ' (modelo sandbox)', lCnt: '{n} tokens en vivo',
      lCap: 'Tokens en vivo ya cotizan; su capitalización es un hecho.',
      tCap: 'Mayor valor primero.',
      rank: 'Puesto', prtc: 'Protocolo', tvl: 'TVL', g7d: '7d', age: 'Antigüedad', impl: 'Valor implícito', token: 'Token',
      stat: 'Estado', mCap: 'Capitalización', noTok: 'sin token', aTrd: 'ya cotiza', other: 'Otra',
      eTit: 'Sin coincidencias', eBdy: 'Limpia la búsqueda o cambia filtros.', cFil: 'Limpiar filtros',
      pager: 'Página {a}/{b} · filas {c}–{d} de {e}', prev: 'Anterior', next: 'Siguiente', unk: 'desconocida',
      mTit: 'Cómo se calcula el valor',
      mInt: 'Una función puntúa cada fila; solo filas sin token.',
      sbTit: 'Sandbox del modelo',
      sbInt: 'Recalcula cada fila en vivo.',
      sbSc: 'Escala ×', sbGr: 'Crecimiento', sbMt: 'Madurez', sbCh: 'Cadena', sbRst: 'Restablecer',
      cTit: 'Múltiplos por categoría', cOth: 'Otras',
      mNte: 'TVL y crecimiento a 7 días, de la instantánea.',
      ft1: 'Datos: ',
      foot2: 'No predice emisión ni fecha.',
      val: 'Probado fuera de muestra|Ajustado con 4 de 5 pliegues de los {n} tokens negociados. La banda P10–P90 es la dispersión de esta prueba.|Variante|Error|≤3×|Rango ρ|Adelante|Veredicto|Vale la pena|Marginal|Omitir|Depósito|Economía del farming|Parte en P10|Neto tras gas|Equilibrio|Neto/hora|Los tokens que cotizan fijan la curva|TVL log $|Valor log $|Tokens negociados|Curva ajustada|Banda P25–P75|Tendencia — mayor crecimiento de TVL en 7 días en esta instantánea|Seguido desde|Trading simulado|Simulación: precios fijos en la instantánea 2026-11-14.|Efectivo|Posiciones|Total|Comprar|Vender|Vender todo|Cantidad|Efectivo insuficiente|Launchpad — protocolos pre-token más recientes de este tablero|Los más recientes de este tablero. No son lanzamientos confirmados: no se conoce fecha de lanzamiento|Tendencia',
      rkOf: 'Puesto {a} de {b}', cls: 'Cerrar',
      eqTVL: 'TVL', eGrw: '7d', eqAge: 'Antigüedad', eChs: 'Cadenas',
      eCat: 'Múltiplo de categoría ({cat})', eGrM: 'Multiplicador de crecimiento', eMtM: 'Multiplicador de madurez', eChM: 'Multiplicador de cadena',
      fPln: 'Plan de farming',
      dNtA: 'Recalculada aquí como {val}',
      dNtS: ', igual que board.json.',
      dNtD: ', no es el número del tablero.',
      wWch: 'Lista: ${n} M+ de TVL.',
      wErl: 'Por debajo del mínimo.',
    },
    zh: {
      skip: '跳到榜单', pTit: 'Watch RADAR：按隐含价值排名',
      snap: '快照', idx: 'DefiLlama 指数', floor: '下限', lang: '语言',
      heroA: '{n} 个观察名单协议', heroB: '，按发布价值排名',
      hInt: '观察名单为 TVL 5000 万美元以上且无代币记录；隐含价值只是模型，不是价格，也不是承诺。',
      fWch: '观察名单', fWcS: '完整名单',
      fRws: '无代币行', fRwS: '{n} 个早期',
      factTop: '最高价值', fMed: '价值中位数', fMdS: '已发币的代币已分开：{n}',
      find: '搜索', srch: '搜索名称或类别',
      cat: '类别', aCat: '全部类别',
      chain: '链', aChn: '全部链',
      scope: '范围', all: '全部', wLst: '观察名单', early: '早期',
      tSta: '代币状态', pTok: '无代币', lTok: '已发币',
      rSho: '显示 {n} 行', sbOn: '（沙盒模型）', lCnt: '{n} 个已发币代币',
      lCap: '已发币代币在交易中，市值是事实。',
      tCap: '按隐含价值排列。',
      rank: '排名', prtc: '协议', tvl: 'TVL', g7d: '7日', age: '年龄', impl: '隐含价值', token: '代币',
      stat: '状态', mCap: '市值', noTok: '无代币', aTrd: '已在交易', other: '其他',
      eTit: '没有匹配结果', eBdy: '请清除搜索或更换筛选。', cFil: '清除筛选',
      pager: '第 {a}/{b} 页 · 第 {c}–{d} 行，共 {e} 行', prev: '上一页', next: '下一页', unk: '未知',
      mTit: '价值如何计算',
      mInt: '单一函数为每一行评分；仅限无代币协议。',
      sbTit: '模型沙盒',
      sbInt: '实时重算每行。',
      sbSc: '缩放 ×', sbGr: '增长', sbMt: '成熟度', sbCh: '每条链', sbRst: '重置',
      cTit: '类别倍数', cOth: '其他',
      mNte: 'TVL 与七日增长来自快照。',
      ft1: '数据：',
      foot2: '非发币时间预测。',
      val: '样本外测试|在 {n} 个已交易代币的五折中的四折上拟合。P10–P90 区间即该测试的离散程度。|变体|误差|3倍内|秩 ρ|前向|结论|值得挖矿|一般|跳过|本金|挖矿收益|P10 份额|扣除 gas 后净收益|盈亏点|每小时净收益|已交易代币决定曲线|TVL log $|价值 log $|已交易代币|拟合曲线|P25–P75 区间|热门——本快照中 7 日 TVL 增长最快|收录于|模拟交易|模拟：价格冻结于 2026-11-14 快照。|现金|持仓|总计|买入|卖出|全部卖出|金额|现金不足|Launchpad——本榜单最新收录的无代币协议|本榜单最新收录。并非已确认的发币：尚无已知的发币日期|热门',
      rkOf: '第 {a} 名，共 {b} 名', cls: '关闭',
      eqTVL: 'TVL', eGrw: '7日', eqAge: '年龄', eChs: '链数',
      eCat: '类别倍数（{cat}）', eGrM: '增长乘数', eMtM: '成熟度乘数', eChM: '链乘数',
      fPln: '挖矿计划',
      dNtA: '此处重算为 {val}',
      dNtS: '，同 board.json。',
      dNtD: '，非榜单数字。',
      wWch: '观察名单：TVL ${n} 百万美元以上。',
      wErl: '低于门槛。',
    }
  };
  var LANGS = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'id', label: 'ID', name: 'Bahasa Indonesia' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'zh', label: '中文', name: '中文（简体）' }
  ];
  function t(key, vars) {
    var table = I18N[state.lang] || I18N.en;
    var s = table[key] != null ? table[key] : (I18N.en[key] != null ? I18N.en[key] : key);
    if (vars) {
      for (var k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
    }
    return s;
  }
  // val:0 title|1 intro|2 var|3 miss|4 within|5 rho|6 wf|7 verdict|8 worth|9 marg|10 skip|11 deposit|12 econ|13 share|14 net|15 be|16 hour|17 chart|18 x|19 y|20 traded|21 curve|22 band|23 hot|24 since|25 sim|26 frozen|27 cash|28 hold|29 total|30 buy|31 sell|32 all|33 amt|34 noCash|35 lp|36 lpNote|37 hotBtn
  function vstr(i) { return (t('val').split('|'))[i] || ''; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(id) { return document.getElementById(id); }
  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n == null || !isFinite(n)) return 'n/a';
    var a = Math.abs(n);
    return a >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : a >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : a >= 1e3 ? '$' + Math.round(n / 1e3) + 'K' : usd0.format(n);
  }
  function fmtPct(n) { if (n == null || !isFinite(n)) return 'n/a'; return (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function fmtAge(d) { if (d == null) return t('unk'); if (d >= 365) return (d / 365).toFixed(1) + 'y'; return Math.round(d) + 'd'; }

  function impliedOf(row, m) {
    var growth = Math.min(DATA.model.growth_cap, Math.max(DATA.model.growth_floor, row.change_7d || 0));
    var growthMult = 1 + (growth / 100) * m.growth;
    var age = row.age_days == null ? DATA.model.unknown_age_days : row.age_days;
    var maturity = DATA.model.maturity_floor + (Math.min(Math.max(age, 0), DATA.model.maturity_days) / DATA.model.maturity_days) * m.maturity;
    var chainMult = 1 + Math.min(Math.max((row.chains || []).length - 1, 0), DATA.model.chain_cap) * m.chain;
    return Math.max(1, Math.round(row.tvl_usd * row.category_multiple * m.scale * growthMult * maturity * chainMult));
  }
  function sandboxActive() { return state.sb.scale !== 1 || state.sb.growth !== BASE_SB.growth || state.sb.maturity !== BASE_SB.maturity || state.sb.chain !== BASE_SB.chain; }
  function shownValue(row) { return sandboxActive() ? impliedOf(row, state.sb) : row.implied_value_usd; }

  function chainOf(p) { return p.chains && p.chains.length ? p.chains[0] : '—'; }
  function capitalFor(p) { var b = p.tvl_usd >= 5e9 ? 250 : p.tvl_usd >= 1e9 ? 150 : p.tvl_usd >= 1e8 ? 100 : 50; return Math.max(10, Math.round(b * state.deposit / 10000 / 5) * 5); }
  function holdDaysFor(age) { if (age == null) return 30; if (age < 180) return 60; if (age < 365) return 45; return 30; }
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase(), n = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Supply $' + capital + ' of USDC to ' + n + ' on ' + chain + ' and borrow $20 against it, then repay the borrow.';
    if (c.indexOf('dex') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Provide $' + capital + ' of liquidity to ' + n + "'s main pool on " + chain + ' and swap $10 through it once.';
    if (c.indexOf('yield aggregator') >= 0 || c.indexOf('yield') >= 0) return 'Deposit $' + capital + ' of USDC into ' + n + "'s highest-yield vault on " + chain + ' and keep the shares.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Deposit $' + capital + ' of USDC as margin on ' + n + ' and open one small hedged perpetual position.';
    if (c.indexOf('prediction') >= 0) return 'Fund $' + capital + ' and place one small prediction-market position on ' + n + '.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) return 'Deposit $' + capital + ' into a ' + n + ' curated vault on ' + chain + ' and keep the vault shares.';
    if (c.indexOf('stable') >= 0) return 'Mint $' + capital + ' of the stable asset through ' + n + ' on ' + chain + ' and hold it in your wallet.';
    if (c.indexOf('rwa') >= 0) return "Mint $" + capital + " of " + n + "'s yield-bearing asset on " + chain + ' and hold it for the full period.';
    if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + n + ' on ' + chain + ' and keep the policy active.';
    if (c.indexOf('restak') >= 0) return 'Restake $' + capital + ' of liquid-staking tokens through ' + n + ' on ' + chain + ' and keep the receipt.';
    if (c.indexOf('basis') >= 0) return 'Deposit $' + capital + ' of USDC into ' + n + "'s basis vault on " + chain + ' and keep the position open.';
    if (c.indexOf('payment') >= 0) return 'Pay $' + capital + ' through ' + n + ' on ' + chain + ' and keep the receipt for the activity record.';
    if (c.indexOf('chain') >= 0) return 'Bridge $' + capital + ' of USDC onto the chain ' + n + ' serves and use it in one app there.';
    if (c.indexOf('governance') >= 0) return 'Lock $' + capital + ' of voting power with ' + n + ' on ' + chain + ' and cast one vote.';
    if (c.indexOf('otc') >= 0 || c.indexOf('marketplace') >= 0) return 'Place one $' + capital + ' order through ' + n + ' on ' + chain + ' and settle it in full.';
    return 'Deposit $' + capital + ' of USDC into ' + n + ' on ' + chain + ' and keep the position open.';
  }
  function weeklyFor(p, chain) {
    var c = (p.category || '').toLowerCase(), n = p.name;
    if (c.indexOf('dex') >= 0 || c.indexOf('leveraged farm') >= 0) return 'Swap $10 through ' + n + ' on ' + chain + ' and adjust the liquidity position once.';
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Borrow $10 against the supply on ' + n + ', then repay it the same week.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0) return 'Close and reopen a small hedged position on ' + n + ' once.';
    if (c.indexOf('prediction') >= 0) return 'Place one small prediction on ' + n + ' and let it settle.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('yield') >= 0) return 'Top up the ' + n + ' vault by $10 and claim any accrued rewards.';
    if (c.indexOf('rwa') >= 0) return 'Check the accrued yield on the ' + n + ' asset and reinvest $10 of it.';
    if (c.indexOf('governance') >= 0) return 'Vote on one ' + n + ' proposal, or delegate the vote if none is live.';
    if (c.indexOf('insurance') >= 0) return 'Keep the ' + n + ' policy active and top it up by $10 if a new term opens.';
    return 'Make one qualifying action on ' + n + ', such as a deposit, a swap or a vote.';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s += ' Hold the position and check the protocol\'s own page.';
    return s;
  }
  function farmSteps(p) {
    var chain = chainOf(p), capital = capitalFor(p), hold = holdDaysFor(p.age_days);
    var second = p.chains && p.chains.length > 1 ? p.chains[1] : null;
    var cap2 = Math.max(5, Math.round(25 * state.deposit / 10000 / 5) * 5);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: second == null ? weeklyFor(p, chain) : 'Repeat the position on ' + second + ' with $' + cap2 + ', so the activity shows on both chains ' + p.name + ' runs on.', cost: second == null ? 'about $2 of gas a week' : '$' + cap2 + ' of capital and about $3 of gas', time: second == null ? '10 minutes a week' : '15 minutes' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open " + p.name + "'s own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  function readHash() {
    var p = new URLSearchParams(location.hash.replace(/^#/, ''));
    ['q', 'category', 'chain', 'scope', 'tab', 'lang'].forEach(function (k) { if (p.get(k)) state[k] = p.get(k); });
    if (p.get('p')) state.selected = p.get('p');
    if (p.get('page')) state.page = Math.max(1, parseInt(p.get('page'), 10) || 1);
    if (!I18N[state.lang]) state.lang = 'en';
  }
  function writeHash() {
    var p = new URLSearchParams();
    if (state.lang !== 'en') p.set('lang', state.lang);
    if (state.q) p.set('q', state.q);
    [['category', 'all'], ['chain', 'all'], ['scope', 'all'], ['tab', 'pre-token']].forEach(function (kv) { if (state[kv[0]] !== kv[1]) p.set(kv[0], state[kv[0]]); });
    if (state.selected) p.set('p', state.selected);
    if (state.page > 1) p.set('page', String(state.page));
    var n = p.toString();
    history.replaceState(null, '', n ? '#' + n : window.location.pathname + window.location.search);
  }

  function filteredRows() {
    var q = state.q.trim().toLowerCase();
    return DATA.rows.filter(function (r) {
      if (state.scope === 'watchlist' && !r.watchlist) return false;
      if (state.scope === 'early' && r.watchlist) return false;
      if (state.verdict !== 'all' && r.verdict !== state.verdict) return false;
      if (state.category !== 'all' && (r.category || 'Other') !== state.category) return false;
      if (state.chain !== 'all' && !(r.chains || []).includes(state.chain)) return false;
      if (!q) return true;
      return [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }
  var VL = { worth: 8, marginal: 9, skip: 10 };
  function verdictOptions() {
    var out = '<option value="all"' + (state.verdict === 'all' ? ' selected' : '') + '>' + esc(t('all')) + '</option>';
    ['worth', 'marginal', 'skip'].forEach(function (v) {
      out += '<option value="' + v + '"' + (state.verdict === v ? ' selected' : '') + '>' + esc(vstr(VL[v])) + '</option>';
    });
    return out;
  }
  function sortedRows(list) {
    var key = state.sort, dir = state.dir;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d == null ? -Infinity : a.change_7d; bv = b.change_7d == null ? -Infinity : b.change_7d; }
      else if (key === 'age') { av = a.age_days == null ? Infinity : a.age_days; bv = b.age_days == null ? Infinity : b.age_days; }
      else { av = shownValue(a); bv = shownValue(b); }
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }

  function hotList() {
    var list = DATA.hot.filter(function (p) { return p[3] != null && (state.chain === 'all' || p[1].indexOf(state.chain) >= 0); });
    list.sort(function (a, b) { return b[3] - a[3] || b[2] - a[2] || (a[0] < b[0] ? -1 : 1); });
    return list.slice(0, 10);
  }
  function ths(a) { return '<tr>' + a.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>'; }
  function openHot() {
    ensureDialog();
    if (dialog.open) dialog.close();
    var list = hotList();
    var body = list.length === 0 ? '<p class="sub">' + esc(t('eTit')) + '</p>' :
      '<div class="table-wrap"><table class="hot"><thead>' + ths([t('rank'), t('prtc'), t('tvl'), t('g7d')]) + '</thead><tbody>' +
      list.map(function (p, i) {
        return '<tr><td class="num">' + (i + 1) + '</td><td><div class="name"><b>' + esc(p[0]) + '</b><span class="sub">' + esc(p[1].slice(0, 2).join(', ') || '—') + '</span></div></td><td class="num">' + fmtUsd(p[2]) + '</td><td class="num ' + (p[3] >= 0 ? 'pos' : 'neg') + '">' + fmtPct(p[3]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    dialog.innerHTML = detailHead('', vstr(23), state.chain === 'all' ? t('aChn') : state.chain) + '<div class="detail-body"><section class="detail-section">' + body + '</section></div>';
    if (!dialog.open) dialog.showModal();
  }
  function renderLp() {
    var slot = el('lp-slot');
    if (!slot) return;
    var list = DATA.rows.filter(function (r) { return r.listed_at; }).sort(function (a, b) { return a.listed_at < b.listed_at ? 1 : a.listed_at > b.listed_at ? -1 : a.slug < b.slug ? -1 : 1; }).slice(0, 10);
    slot.innerHTML = '<section class="panel model lp" id="lp-panel"><h2>' + esc(vstr(35)) + '</h2><p class="sub">' + esc(vstr(36)) + '</p>' + '<div class="table-wrap"><table><thead>' + ths([t('rank'), t('prtc'), t('tvl'), vstr(24), t('age'), t('impl'), vstr(7)]) + '</thead><tbody>' +
      list.map(function (r, i) {
        return '<tr data-slug="' + esc(r.slug) + '" tabindex="0"><td class="num">' + (i + 1) + '</td><td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || t('other')) + ' on ' + esc((r.chains || []).slice(0, 2).join(', ') || '—') + '</span></div></td><td class="num">' + fmtUsd(r.tvl_usd) + '</td><td class="num">' + esc(r.listed_at) + '</td><td class="num">' + fmtAge(r.age_days) + '</td><td class="num">' + fmtUsd(r.implied_value_usd) + '</td><td><span class="badge ' + r.verdict + '">' + esc(vstr(VL[r.verdict])) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' + '</section>';
    bindRowClicks(slot);
  }

  function renderPf() {
    var slot = el('pf-slot');
    if (!slot) return;
    if (state.tab !== 'live') { slot.innerHTML = ''; return; }
    var tot = pf.cash, hs = Object.keys(pf.hold), i;
    for (i = 0; i < hs.length; i++) tot += pf.hold[hs[i]];
    var rows = hs.map(function (s) {
      var l = liveBySlug(s); if (!l) return '';
      return '<tr><td><b>' + esc(l.name) + '</b></td><td class="num">' + usd0.format(pf.hold[s]) + '</td><td class="num">' + Math.round(pf.hold[s] / tot * 100) + '%</td><td><button type="button" class="pf-mini" data-pf="all" data-slug="' + esc(s) + '">' + esc(vstr(32)) + '</button></td></tr>';
    }).join('');
    slot.innerHTML = '<section class="panel model" id="pf-panel"><h2>' + esc(vstr(25)) + '</h2><p class="sub">' + esc(vstr(26)) + '</p>' +
      '<div class="facts">' + [[vstr(27), pf.cash], [vstr(28), tot - pf.cash], [vstr(29), tot]].map(function (f) { return '<div class="fact"><span>' + esc(f[0]) + '</span><b>' + usd0.format(f[1]) + '</b></div>'; }).join('') + '</div>' +
      '<div class="pf-amt"><span class="sub">' + esc(vstr(33)) + '</span><div class="tabs" role="group">' +
      [100, 500, 1000].map(function (a) { return '<button type="button" data-pf="amt" data-amt="' + a + '" aria-pressed="' + (amt === a) + '">$' + a + '</button>'; }).join('') + '</div></div>' +
      (pfNote ? '<p class="sub" id="pf-msg" role="status">' + esc(pfNote) + '</p>' : '') +
      (hs.length ? '<div class="table-wrap"><table id="pf-hold"><tbody>' + rows + '</tbody></table></div>' : '') +
      '<p style="margin:12px 0 0"><button class="button ghost" type="button" data-pf="reset">' + esc(t('sbRst')) + '</button></p></section>';
  }

  function options(list, current, allLabel) {
    return '<option value="all"' + (current === 'all' ? ' selected' : '') + '>' + esc(allLabel) + '</option>' +
      list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === current ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
  }

  function langButtons() {
    return LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l.code + '" aria-pressed="' + (state.lang === l.code) + '" aria-label="' + esc(l.name) + '">' + esc(l.label) + '</button>';
    }).join('');
  }

  function tabsField(label, attr, items, cur) {
    return '<div class="field"><span class="lab">' + esc(label) + '</span><div class="tabs" role="group" aria-label="' + esc(label) + '">' +
      items.map(function (it) { return '<button type="button" data-' + attr + '="' + it[0] + '" aria-pressed="' + (cur === it[0]) + '">' + esc(it[1]) + '</button>'; }).join('') + '</div></div>';
  }

  function render() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var median = DATA.rows.map(function (r) { return r.implied_value_usd; }).sort(function (a, b) { return a - b; })[Math.floor(DATA.rows.length / 2)];
    var top = DATA.rows[0];
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    document.title = t('pTit');
    var skip = document.querySelector('.skip');
    if (skip) skip.textContent = t('skip');
    var html = '<div class="shell">';
    html += '<header class="top"><div class="brand"><span class="mark" aria-hidden="true"></span><span>Watch RADAR</span></div>' +
      '<div class="top-meta"><span>' + esc(t('snap')) + ' <b>' + esc(DATA.as_of) + '</b></span><span>' + esc(t('idx')) + '</span><span>' + esc(t('floor')) + ' <b>$' + Math.round(DATA.floor_usd / 1e6) + 'M</b></span></div>' +
      '<div class="lang" role="group" aria-label="' + esc(t('lang')) + '">' + langButtons() + '</div></header>';
    html += '<section class="lede"><div><h1><span class="accent">' + esc(t('heroA', { n: DATA.watchlist_size })) + '</span>' + esc(t('heroB')) + '</h1>' +
      '<p>' + esc(t('hInt')) + '</p></div>' +
      '<div class="facts">' + [[t('fWch'), DATA.watchlist_size + ' / ' + DATA.watchlist_size, t('fWcS')], [t('fRws'), DATA.board_size, t('fRwS', { n: DATA.early_size })], [t('factTop'), fmtUsd(top.implied_value_usd), top.name], [t('fMed'), fmtUsd(median), t('fMdS', { n: DATA.live_size })]].map(function (f) { return '<div class="fact"><span>' + esc(f[0]) + '</span><b>' + f[1] + '</b><small>' + esc(f[2]) + '</small></div>'; }).join('') + '</div></section>';
    html += '<div class="controls">' +
      '<div class="field"><label for="q">' + esc(t('find')) + '</label><input type="search" id="q" placeholder="' + esc(t('srch')) + '" value="' + esc(state.q) + '" aria-label="' + esc(t('find')) + '"></div>' +
      '<div class="field"><label for="category">' + esc(t('cat')) + '</label><select id="category" aria-label="' + esc(t('cat')) + '">' + options(categories, state.category, t('aCat')) + '</select></div>' +
      '<div class="field"><label for="chain">' + esc(t('chain')) + '</label><select id="chain" aria-label="' + esc(t('chain')) + '">' + options(chains, state.chain, t('aChn')) + '</select></div>' +
      '<div class="field"><label for="verdict">' + esc(vstr(7)) + '</label><select id="verdict" aria-label="' + esc(vstr(7)) + '">' + verdictOptions() + '</select></div>' +
      tabsField(vstr(11), 'deposit', [[10000, '$10,000'], [1000, '$1,000']], state.deposit) +
      tabsField(t('scope'), 'scope', [['all', t('all')], ['watchlist', t('wLst')], ['early', t('early')]], state.scope) +
      tabsField(t('tSta'), 'tab', [['pre-token', t('pTok')], ['live', t('lTok')]], state.tab) +
      '<button class="button" type="button" id="hot-open">' + esc(vstr(37)) + '</button>' +
      '<span class="count" id="count"></span></div>';
    html += '<div id="pf-slot"></div>';
    html += '<div id="table-slot"></div>';
    html += '<div id="lp-slot"></div>';
    html += '<div id="model-slot"></div>';
    html += '<footer class="foot"><p>' + esc(t('ft1')) + esc(DATA.source) + '</p>' +
      '<p>' + esc(t('foot2')) + '</p></footer>';
    html += '</div>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
    bindControls();
    renderTable();
    renderModel();
    if (state.selected) openDetail(state.selected, true);
  }

  function grp(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), function (b) { b.addEventListener('click', function () { fn(b); }); }); }
  function bindControls() {
    var q = el('q');
    q.addEventListener('input', function () { state.q = q.value; state.page = 1; writeHash(); renderTable(); });
    var cat = el('category');
    cat.addEventListener('change', function () { state.category = cat.value; state.page = 1; writeHash(); renderTable(); });
    var ch = el('chain');
    ch.addEventListener('change', function () { state.chain = ch.value; state.page = 1; writeHash(); renderTable(); });
    var vd = el('verdict');
    vd.addEventListener('change', function () { state.verdict = vd.value; state.page = 1; writeHash(); renderTable(); });
    grp('[data-deposit]', function (b) { state.deposit = parseInt(b.getAttribute('data-deposit'), 10); writeHash(); render(); if (dialog && dialog.open) openDetail(state.selected, true); });
    grp('[data-scope]', function (b) { state.scope = b.getAttribute('data-scope'); state.page = 1; writeHash(); render(); });
    grp('[data-tab]', function (b) { state.tab = b.getAttribute('data-tab'); state.page = 1; writeHash(); render(); });
    grp('[data-lang]', function (b) { state.lang = b.getAttribute('data-lang'); writeHash(); render(); if (dialog && dialog.open) openDetail(state.selected, true); });
    grp('#hot-open', openHot);
  }

  function sortBtn(key, label) {
    var arrow = state.sort === key ? (state.dir < 0 ? ' v' : ' ^') : '';
    return '<button type="button" data-sort="' + key + '">' + esc(label) + (arrow ? '<span aria-hidden="true">' + arrow + '</span>' : '') + '</button>';
  }

  function bindRowClicks(slot) {
    Array.prototype.forEach.call(slot.querySelectorAll('tbody tr'), function (tr) {
      tr.addEventListener('click', function (e) { if (e.target.closest('button')) return; openDetail(tr.getAttribute('data-slug')); });
      tr.addEventListener('keydown', function (e) { if (e.target.closest('button')) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(tr.getAttribute('data-slug')); } });
    });
  }

  function renderTable() {
    var slot = el('table-slot');
    var count = el('count');
    renderLp();
    renderPf();
    if (state.tab === 'live') {
      if (count) count.textContent = t('lCnt', { n: DATA.live.length });
      var rows = DATA.live.map(function (r) {
        var h = pf.hold[r.slug] || 0;
        return '<tr data-slug="' + esc(r.slug) + '" tabindex="0"><td class="num">live</td><td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || t('other')) + ' on ' + esc((r.chains || []).slice(0, 2).join(', ') || '—') + '</span></div></td>' +
          '<td class="num">' + fmtUsd(r.tvl_usd) + '</td><td class="num ' + (r.change_7d != null && r.change_7d >= 0 ? 'pos' : 'neg') + '">' + fmtPct(r.change_7d) + '</td>' +
          '<td class="num">' + fmtUsd(r.mcap_usd) + '</td><td><span class="status live">' + esc(t('aTrd')) + '</span></td>' +
          '<td><div class="tabs"><button type="button" data-pf="buy" data-slug="' + esc(r.slug) + '">' + esc(vstr(30)) + '</button><button type="button" data-pf="sell" data-slug="' + esc(r.slug) + '"' + (h <= 0 ? ' disabled' : '') + '>' + esc(vstr(31)) + '</button></div></td></tr>';
      }).join('');
      slot.innerHTML = '<div class="panel"><div class="table-wrap"><table><caption>' + esc(t('lCap')) + '</caption>' +
        '<thead><tr><th scope="col">' + esc(t('stat')) + '</th><th scope="col">' + esc(t('prtc')) + '</th><th scope="col">' + esc(t('tvl')) + '</th><th scope="col">' + esc(t('g7d')) + '</th><th scope="col">' + esc(t('mCap')) + '</th><th scope="col">' + esc(t('token')) + '</th><th scope="col"></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      bindRowClicks(slot);
      var modelSlot = el('model-slot');
      if (modelSlot) modelSlot.innerHTML = '';
      return;
    }
    var list = sortedRows(filteredRows());
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE;
    var pageRows = list.slice(start, start + PAGE);
    if (count) count.textContent = t('rSho', { n: list.length }) + (sandboxActive() ? t('sbOn') : '');
    if (list.length === 0) {
      slot.innerHTML = '<div class="panel"><div class="empty"><h2>' + esc(t('eTit')) + '</h2><p>' + esc(t('eBdy')) + '</p><button class="button" type="button" id="clear-filters">' + esc(t('cFil')) + '</button></div></div>';
      el('clear-filters').addEventListener('click', function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.scope = 'all'; state.verdict = 'all'; state.page = 1; writeHash(); render(); });
      var ms = el('model-slot');
      if (ms) ms.innerHTML = '';
      return;
    }
    var max = Math.max.apply(null, pageRows.map(function (r) { return shownValue(r); })) || 1;
    var body = pageRows.map(function (r) {
      var growth = r.change_7d == null ? 'n/a' : fmtPct(r.change_7d);
      var gc = r.change_7d == null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var val = shownValue(r);
      return '<tr data-slug="' + esc(r.slug) + '" data-selected="' + (state.selected === r.slug) + '" tabindex="0">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td><div class="name"><b>' + esc(r.name) + (r.watchlist ? '<span class="badge watch">' + esc(t('wLst')) + '</span>' : '<span class="badge early">' + esc(t('early')) + '</span>') + '</b><span class="sub">' + esc(r.category || t('other')) + ' on ' + esc((r.chains || []).slice(0, 2).join(', ') || '—') + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + gc + '">' + growth + '</td>' +
        '<td class="num">' + fmtAge(r.age_days) + '</td>' +
        '<td><div class="implied"><div class="bar" aria-hidden="true"><i style="width:' + Math.max(3, Math.round((val / max) * 100)) + '%"></i></div><span class="num">' + fmtUsd(val) + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.band_lo_usd) + '–' + fmtUsd(r.band_hi_usd) + '</td>' +
        '<td><span class="badge ' + r.verdict + '">' + esc(vstr(VL[r.verdict])) + '</span></td>' +
        '<td><span class="status">' + esc(t('noTok')) + '</span></td></tr>';
    }).join('');
    slot.innerHTML = '<div class="panel"><div class="table-wrap"><table>' +
      '<caption>' + esc(t('tCap')) + '</caption>' +
      '<thead><tr><th scope="col">' + sortBtn('implied', t('rank')) + '</th><th scope="col">' + sortBtn('name', t('prtc')) + '</th><th scope="col">' + sortBtn('tvl', t('tvl')) + '</th><th scope="col">' + sortBtn('growth', t('g7d')) + '</th><th scope="col">' + sortBtn('age', t('age')) + '</th><th scope="col">' + sortBtn('implied', t('impl')) + '</th><th scope="col">P10–P90</th><th scope="col">' + esc(vstr(7)) + '</th><th scope="col">' + esc(t('token')) + '</th></tr></thead>' +
      '<tbody>' + body + '</tbody></table></div>' +
      '<div class="pager"><span class="sub">' + esc(t('pager', { a: state.page, b: pages, c: start + 1, d: Math.min(start + PAGE, list.length), e: list.length })) + '</span>' +
      '<button type="button" id="prev-page" ' + (state.page <= 1 ? 'disabled' : '') + '>' + esc(t('prev')) + '</button>' +
      '<button type="button" id="next-page" ' + (state.page >= pages ? 'disabled' : '') + '>' + esc(t('next')) + '</button></div></div>';
    Array.prototype.forEach.call(slot.querySelectorAll('[data-sort]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = -1; }
        renderTable();
      });
    });
    bindRowClicks(slot);
    var prev = el('prev-page');
    if (prev) prev.addEventListener('click', function () { if (state.page > 1) { state.page -= 1; writeHash(); renderTable(); } });
    var next = el('next-page');
    if (next) next.addEventListener('click', function () { if (state.page < pages) { state.page += 1; writeHash(); renderTable(); } });
    renderModel();
  }

  function chartHtml() {
    var v = DATA.validation, W = 780, H = 320, L = 58, R = 12, T = 10, B = 34, x0 = 6.5, x1 = 10.5, y0 = 4.4, y1 = 9.7, i, x, g = '', cp = '', bd = '';
    function X(n) { return (L + (n - x0) / (x1 - x0) * (W - L - R)).toFixed(1); }
    function Y(n) { return (T + (y1 - n) / (y1 - y0) * (H - T - B)).toFixed(1); }
    var U = ['$100K', '$1M', '$10M', '$100M', '$1B', '$10B'];
    var a = v.curve_a / 2.302585, b = v.curve_b, lo = v.band_p25 / 2.302585, hi = v.band_p75 / 2.302585;
    for (i = 0; i <= 8; i++) { x = x0 + i * 0.5; cp += X(x) + ',' + Y(a + b * x) + ' '; bd += X(x) + ',' + Y(a + b * x + hi) + ' '; }
    for (i = 8; i >= 0; i--) { x = x0 + i * 0.5; bd += X(x) + ',' + Y(a + b * x + lo) + ' '; }
    for (x = 7; x <= 10; x++) g += '<line x1="' + X(x) + '" y1="' + Y(y0) + '" x2="' + X(x) + '" y2="' + Y(y1) + '" stroke="#e2e8f0"/><text x="' + X(x) + '" y="' + (H - 20) + '" font-size="11" fill="#64748b" text-anchor="middle">' + U[x - 5] + '</text>';
    for (x = 5; x <= 9; x++) g += '<line x1="' + X(x0) + '" y1="' + Y(x) + '" x2="' + X(x1) + '" y2="' + Y(x) + '" stroke="#e2e8f0"/><text x="' + (L - 6) + '" y="' + (+Y(x) + 4) + '" font-size="11" fill="#64748b" text-anchor="end">' + U[x - 5] + '</text>';
    function dots(ps, r, c, o) { return ps.map(function (p) { return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="' + r + '" fill="' + c + '" opacity="' + o + '"/>'; }).join(''); }
    return '<h3 style="margin:18px 0 4px;font-size:15px">' + esc(vstr(17)) + '</h3>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(vstr(17)) + '">' + g +
      '<polygon points="' + bd + '" fill="#0b7fa3" opacity=".12"/><polyline points="' + cp + '" fill="none" stroke="#0b7fa3" stroke-width="2"/>' +
      dots(v.traded_points, 2.6, '#0b7fa3', .75) + dots(v.pre_points, 2, '#d97706', .6) +
      '<text x="' + (W / 2) + '" y="' + (H - 4) + '" font-size="12" fill="#55677f" text-anchor="middle">' + esc(vstr(18)) + '</text>' +
      '<text transform="rotate(-90 14 148)" x="14" y="148" font-size="12" fill="#55677f" text-anchor="middle">' + esc(vstr(19)) + '</text></svg>' +
      '<p class="sub" style="margin:6px 0 0"><span style="color:#0b7fa3">●</span> ' + esc(vstr(20)) + ' <span style="color:#d97706">●</span> ' + esc(t('pTok')) + ' <span style="color:#0b7fa3">━</span> ' + esc(vstr(21)) + ' <span style="color:#0b7fa3">▮</span> ' + esc(vstr(22)) + '</p>';
  }
  function validHtml() {
    var v = DATA.validation;
    var rows = v.rows.map(function (r) {
      return '<tr><td>' + esc(r.variant) + '</td>' + [r.loo_miss.toFixed(2), r.within_3x + '%', r.rank_rho.toFixed(2), r.walk_forward.toFixed(2)].map(function (n) { return '<td class="num">' + n + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<section class="panel model" id="valid-panel"><h2>' + esc(vstr(0)) + '</h2><p class="sub">' + esc(vstr(1).replace('{n}', v.traded)) + '</p><table class="cat-table"><thead>' + ths([vstr(2), vstr(3), vstr(4), vstr(5), vstr(6)]) + '</thead><tbody>' + rows + '</tbody></table>' + chartHtml() + '</section>';
  }
  function renderModel() {
    var slot = el('model-slot');
    if (!slot || state.tab !== 'pre-token') { if (slot) slot.innerHTML = ''; return; }
    var m = DATA.model;
    var cats = Object.keys(m.category_multiples).sort(function (a, b) { return m.category_multiples[b] - m.category_multiples[a]; });
    var catRows = cats.map(function (c) { return '<tr><td>' + esc(c) + '</td><td class="num">' + m.category_multiples[c].toFixed(2) + '</td></tr>'; }).join('') +
      '<tr><td>' + esc(t('cOth')) + '</td><td class="num">' + m.default_multiple.toFixed(2) + '</td></tr>';
    slot.innerHTML = validHtml() + '<section class="panel model"><h2>' + esc(t('mTit')) + '</h2>' +
      '<p class="sub">' + esc(t('mInt')) + '</p>' +
      '<div class="formula">implied = round( tvl_usd × <b>category</b> × (1 + clamp(change_7d, ' + m.growth_floor + ', ' + m.growth_cap + ') / 100 × ' + m.growth_weight + ') × (' + m.maturity_floor + ' + min(age_days, ' + m.maturity_days + ') / ' + m.maturity_days + ' × ' + m.maturity_range + ') × (1 + min(chains − 1, ' + m.chain_cap + ') × ' + m.chain_step + ') )</div>' +
      '<h3 style="margin:0 0 8px;font-size:15px">' + esc(t('sbTit')) + '</h3>' +
      '<p class="sub">' + esc(t('sbInt')) + '</p>' +
      '<div class="sandbox">' + [['scale', 'sbSc', .5, 1.5, .05], ['growth', 'sbGr', 0, 1, .05], ['maturity', 'sbMt', 0, .6, .05], ['chain', 'sbCh', 0, .05, .01]].map(function (f) { return '<div class="field"><label for="sb-' + f[0] + '">' + esc(t(f[1])) + ' <output id="sb-' + f[0] + '-v">' + state.sb[f[0]].toFixed(2) + '</output></label><input type="range" id="sb-' + f[0] + '" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '" value="' + state.sb[f[0]] + '"></div>'; }).join('') +
      '</div><button class="button ghost" type="button" id="sb-reset">' + esc(t('sbRst')) + '</button>' +
      '<h3 style="margin:18px 0 4px;font-size:15px">' + esc(t('cTit')) + '</h3>' +
      '<table class="cat-table"><tbody>' + catRows + '</tbody></table>' +
      '<p class="note" style="margin-top:12px">' + esc(t('mNte', { n: m.unknown_age_days })) + '</p>' +
      '</section>';
    var bind = function (id, key) {
      var input = el(id);
      input.addEventListener('input', function () {
        state.sb[key] = parseFloat(input.value);
        el(id + '-v').textContent = state.sb[key].toFixed(2);
        renderTable();
      });
    };
    ['scale', 'growth', 'maturity', 'chain'].forEach(function (k) { bind('sb-' + k, k); });
    el('sb-reset').addEventListener('click', function () {
      state.sb = { scale: 1, growth: BASE_SB.growth, maturity: BASE_SB.maturity, chain: BASE_SB.chain };
      render();
    });
  }

  function eqRow(label, val) { return '<div><span>' + esc(label) + '</span><b class="num">' + val + '</b></div>'; }
  function detailHead(rankTxt, name, sub) {
    return '<div class="detail-head"><div><span class="rank">' + esc(rankTxt) + '</span><h2 id="detail-title">' + esc(name) + '</h2><p class="sub">' + esc(sub) + '</p></div><button class="close" type="button">' + esc(t('cls')) + '</button></div>';
  }
  function liveTrade(l) {
    var h = pf.hold[l.slug] || 0;
    return '<section class="detail-section"><h3>' + esc(vstr(25)) + '</h3><p class="sub">' + esc(vstr(26)) + '</p>' +
      '<div class="equation">' + eqRow(vstr(27), usd0.format(pf.cash)) + eqRow(vstr(28), usd0.format(h)) + '</div>' +
      (pfNote ? '<p class="sub" role="status">' + esc(pfNote) + '</p>' : '') +
      '<p style="margin:12px 0 0"><button class="button" type="button" data-pf="buy" data-slug="' + esc(l.slug) + '">' + esc(vstr(30)) + ' $' + amt + '</button> ' +
      '<button class="button ghost" type="button" data-pf="sell" data-slug="' + esc(l.slug) + '"' + (h <= 0 ? ' disabled' : '') + '>' + esc(vstr(31)) + ' $' + Math.min(amt, h) + '</button> ' +
      '<button class="button ghost" type="button" data-pf="all" data-slug="' + esc(l.slug) + '"' + (h <= 0 ? ' disabled' : '') + '>' + esc(vstr(32)) + '</button></p></section>';
  }
  function liveHtml(l) {
    return detailHead(t('lTok'), l.name, (l.category || t('other')) + ' on ' + (l.chains.join(', ') || '—')) +
      '<div class="detail-body"><section class="detail-section"><div class="equation">' +
      [[t('tvl'), fmtUsd(l.tvl_usd)], [t('g7d'), fmtPct(l.change_7d)], [t('mCap'), fmtUsd(l.mcap_usd)], [vstr(24), l.listed_at || '']].filter(function (p) { return p[1] !== ''; }).map(function (p) { return eqRow(p[0], p[1]); }).join('') +
      '</div><p class="sub">' + esc(t('lCap')) + '</p></section>' + liveTrade(l) + '</div>';
  }

  var dialog = null;
  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'detail';
    dialog.setAttribute('aria-labelledby', 'detail-title');
    dialog.addEventListener('close', function () { state.selected = null; writeHash(); });
    dialog.addEventListener('click', function (e) {
      if (e.target.closest('.close')) { dialog.close(); return; }
      var b = e.target.closest('[data-pf]');
      if (!b) return;
      var k = b.getAttribute('data-pf'), s = b.getAttribute('data-slug');
      if (k === 'buy') pfTrade(s, 1); else if (k === 'sell') pfTrade(s, -1); else if (k === 'all') pfTrade(s, 0);
    });
    document.body.appendChild(dialog);
  }
  function openDetail(slug, fromHash) {
    var row = null, live = null;
    DATA.rows.forEach(function (r) { if (r.slug === slug) row = r; });
    if (!row) DATA.live.forEach(function (r) { if (r.slug === slug) live = r; });
    if (!row && !live) return;
    state.selected = slug;
    if (!fromHash) writeHash();
    ensureDialog();
    var recomputed = 0, steps = [], share = 0, net = 0, hours = 1, beTxt = '', why = '';
    if (row) {
      recomputed = impliedOf(row, { scale: 1, growth: DATA.model.growth_weight, maturity: DATA.model.maturity_range, chain: DATA.model.chain_step });
      steps = farmSteps(row);
      share = row.band_lo_usd * state.deposit / row.tvl_usd;
      net = share - 15;
      hours = (35 + 10 * Math.ceil(holdDaysFor(row.age_days) / 7)) / 60;
      var be = share > 0 ? Math.min(15 / share * 100, 999) : 999;
      beTxt = be >= 999 ? '>999%' : be.toFixed(1) + '%';
      why = row.watchlist ? t('wWch', { n: Math.round(DATA.floor_usd / 1e6) }) : t('wErl');
    }
    var html = live ? liveHtml(live) : detailHead(t('rkOf', { a: row.rank, b: DATA.board_size }) + ' · ' + (row.watchlist ? t('wLst') : t('early')), row.name, (row.category || t('other')) + ' on ' + ((row.chains || []).join(', ') || '—')) +
      '<div class="detail-body"><section class="detail-section"><h3>' + esc(t('impl')) + '</h3><div class="equation">' +
      [[t('eqTVL'), fmtUsd(row.tvl_usd)], [t('eGrw'), fmtPct(row.change_7d)], [t('eqAge'), fmtAge(row.age_days)], [vstr(24), row.listed_at || ''], [t('eChs'), (row.chains || []).length], [t('eCat', { cat: row.category || t('other') }), row.category_multiple.toFixed(2)], [t('eGrM'), row.growth_multiplier], [t('eMtM'), row.maturity_multiplier], [t('eChM'), row.chain_multiplier]].filter(function (p) { return p[1] !== ''; }).map(function (p) { return eqRow(p[0], p[1]); }).join('') +
      '<div class="total"><span>' + esc(t('impl')) + '</span><b class="num">' + fmtUsd(row.implied_value_usd) + '</b></div></div>' +
      '<p class="sub">' + esc(t('dNtA', { val: fmtUsd(recomputed) })) + esc(recomputed === row.implied_value_usd ? t('dNtS') : t('dNtD')) + ' ' + esc(why) + '</p></section>' +
      '<section class="detail-section"><h3>' + esc(vstr(12)) + '</h3><div class="equation">' +
      [[13, fmtUsd(share)], [14, fmtUsd(net)], [15, beTxt], [16, fmtUsd(net / hours)]].map(function (p) { return eqRow(vstr(p[0]), p[1]); }).join('') + '</div>' +
      '<p class="sub">' + esc(row.verdict_why) + '</p></section>' +
      '<section class="detail-section"><h3>' + esc(t('fPln')) + '</h3><ol class="steps">' +
      steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return '<li><b>' + esc(action) + '</b><span class="cost">' + esc(tail) + '</span></li>';
      }).join('') + '</ol></section></div>';
    dialog.innerHTML = html;
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
  }

  window.RADAR_TEST = { farmSteps: farmSteps, impliedOf: impliedOf, rows: DATA.rows };

  readHash();
  render();
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pf]');
    if (!b) return;
    var k = b.getAttribute('data-pf'), s = b.getAttribute('data-slug');
    if (k === 'amt') { amt = parseFloat(b.getAttribute('data-amt')); pfNote = ''; renderTable(); }
    else if (k === 'buy') pfTrade(s, 1);
    else if (k === 'sell') pfTrade(s, -1);
    else if (k === 'all') pfTrade(s, 0);
    else if (k === 'reset') pfReset();
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && dialog && dialog.open) dialog.close(); });
})();
