// Watch RADAR's dashboard. It reads window.RADAR (written beside dashboard/ by main.ts) and
// renders the ranked board, a filterable table, a per-protocol detail view with the model's own
// inputs and the protocol's farm plan, a live-token view set apart, and a model sandbox that
// recomputes every row from the snapshot figures. No network: every byte it shows is in data.js.
// The interface chrome speaks four languages (English, Bahasa Indonesia, Español, 中文);
// protocol names, category names and farm-plan steps stay in English: they are data, not chrome.
(function () {
  'use strict';
  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var PAGE = 50;
  var state = { lang: 'en', q: '', category: 'all', chain: 'all', scope: 'all', tab: 'pre-token', sort: 'implied', dir: -1, selected: null, page: 1,
    sb: { scale: 1, growth: DATA.model.growth_weight, maturity: DATA.model.maturity_range, chain: DATA.model.chain_step } };
  var BASE_SB = { scale: 1, growth: DATA.model.growth_weight, maturity: DATA.model.maturity_range, chain: DATA.model.chain_step };

  var I18N = {
    en: {
      skip: 'Skip to the board', pageTitle: 'Watch RADAR: pre-token protocols ranked by implied value',
      snapshot: 'Snapshot', index: 'DefiLlama protocol index', floor: 'Floor', language: 'Language',
      heroA: '{n} watchlist protocols', heroB: ', ranked by what their launch would be worth',
      heroIntro: 'The watchlist is the floor: every protocol with at least $50M of TVL and no token on record. The early radar adds 158 more pre-token protocols below that floor, every one the same rule keeps. Wrapped, staked and bridged products of tokens that already trade are left out, however large their TVL. Implied value is a model, not a price and not a promise of a launch.',
      factWatch: 'Watchlist covered', factWatchSub: 'every slug on the list',
      factRows: 'Pre-token rows scored', factRowsSub: '{n} early, below the floor',
      factTop: 'Top implied value', factMedian: 'Median implied value', factMedianSub: 'live-token protocols set aside: {n}',
      search: 'Search', searchPh: 'Search name, category or chain', searchAria: 'Search the board',
      category: 'Category', allCategories: 'All categories', catAria: 'Filter by category',
      chain: 'Chain', allChains: 'All chains', chainAria: 'Filter by chain',
      scope: 'Scope', scopeAria: 'Board scope', all: 'All', watchlist: 'Watchlist', early: 'Early',
      tokenStatus: 'Token status', tokenStatusAria: 'Token status', preToken: 'Pre-token', liveToken: 'Live token',
      rowsShown: '{n} rows shown', sandboxOn: ' (sandbox model)', liveCount: '{n} live-token protocols',
      liveCaption: 'Token live: these protocols already trade, so their market cap is a fact, not a model. They are set apart from the pre-token ranking.',
      tableCaption: 'Pre-token protocols, strongest implied value first. Select a row for its model and farm plan.',
      tableCaptionSandbox: ' The sandbox model is on: values below are recomputed live, board.json keeps the shipped model.',
      rank: 'Rank', protocol: 'Protocol', tvl: 'TVL', growth7d: '7d', age: 'Age', implied: 'Implied value', token: 'Token',
      status: 'Status', marketCap: 'Market cap', noToken: 'no token', alreadyTrades: 'already trades', other: 'Other',
      emptyTitle: 'No protocol matches that filter', emptyBody: 'Clear the search or pick another category to see the board again.', clearFilters: 'Clear filters',
      pager: 'Page {a} of {b} · rows {c}–{d} of {e}', prev: 'Previous', next: 'Next', unknown: 'unknown',
      modelTitle: 'How implied value is computed',
      modelIntro: 'Every row is scored by one function of the snapshot figures. No protocol name is special-cased, and no row is hand-picked. The same rule that builds the watchlist decides which protocols may be ranked at all: no token on record, and not a wrapped, staked or bridged product of one that trades.',
      sandboxTitle: 'Model sandbox — change the model, watch the board move',
      sandboxIntro: 'The sandbox recomputes every row live from the same figures. It changes only this page; board.json keeps the shipped model.',
      sbScale: 'Category scale ×', sbGrowth: 'Growth weight', sbMaturity: 'Maturity range', sbChain: 'Per extra chain', sbReset: 'Reset the sandbox',
      catTitle: 'Category multiples', catOther: 'Any other category',
      modelNote: 'TVL and seven-day growth come from the snapshot. Age is the time since the protocol was first listed, the best record of how long it has run with no token; an unlisted age uses {n} days. Fee-taking primitives earn the highest multiple because a token there captures the protocol\u2019s own revenue; distribution and infrastructure earn the lowest.',
      foot1A: 'Data: ', foot1B: '. The snapshot carries no ranking, no implied value and no farm plan; deriving them is this radar\u2019s work.',
      foot2: 'An implied value follows from the protocol\u2019s own TVL, its seven-day growth, how long it has run with no token, and how many chains it reaches. It is not a prediction that a token is issued, or when. Say a protocol records no token, never that it has none: its record may simply not carry one.',
      rankOf: 'Rank {a} of {b}', close: 'Close', closeDetails: 'Close details',
      eqTVL: 'TVL', eqGrowth: 'Seven-day growth', eqAge: 'Age with no token', eqChains: 'Chains reached',
      eqCatMult: 'Category multiple ({cat})', eqGrowthMult: 'Growth multiplier', eqMatMult: 'Maturity multiplier', eqChainMult: 'Chain multiplier',
      farmPlan: 'Farm plan',
      detailNoteA: 'The scoring model: the same function scores every protocol. The page recomputes this row as {val}',
      detailNoteSame: ', the same number board.json carries.',
      detailNoteDiff: ', which differs from the board: the data would be stale.',
      whyWatch: 'On the watchlist: at least ${n}M of TVL and no token on record.',
      whyEarly: 'Below the watchlist floor, found by the early radar: the same rule keeps it, so its launch is worth ranking.',
      detailNoteB: 'This is an estimate, not a price.'
    },
    id: {
      skip: 'Lewati ke papan', pageTitle: 'Watch RADAR: protokol pra-token diurutkan berdasarkan nilai tersirat',
      snapshot: 'Cuplikan', index: 'Indeks protokol DefiLlama', floor: 'Ambang', language: 'Bahasa',
      heroA: '{n} protokol watchlist', heroB: ', diurutkan berdasarkan nilai peluncurannya',
      heroIntro: 'Watchlist adalah batas bawah: setiap protokol dengan TVL minimal $50 jt dan belum tercatat punya token. Radar awal menambahkan 158 protokol pra-token lain di bawah batas itu, semuanya lolos aturan yang sama. Produk wrapped, staked, dan bridged dari token yang sudah diperdagangkan dikecualikan, sebesar apa pun TVL-nya. Nilai tersirat adalah model, bukan harga dan bukan janji peluncuran.',
      factWatch: 'Watchlist tercakup', factWatchSub: 'semua slug dalam daftar',
      factRows: 'Baris pra-token dinilai', factRowsSub: '{n} awal, di bawah ambang',
      factTop: 'Nilai tersirat tertinggi', factMedian: 'Nilai tersirat median', factMedianSub: 'protokol bertoken disisihkan: {n}',
      search: 'Cari', searchPh: 'Cari nama, kategori, atau chain', searchAria: 'Cari di papan',
      category: 'Kategori', allCategories: 'Semua kategori', catAria: 'Filter berdasarkan kategori',
      chain: 'Chain', allChains: 'Semua chain', chainAria: 'Filter berdasarkan chain',
      scope: 'Cakupan', scopeAria: 'Cakupan papan', all: 'Semua', watchlist: 'Watchlist', early: 'Awal',
      tokenStatus: 'Status token', tokenStatusAria: 'Status token', preToken: 'Pra-token', liveToken: 'Token live',
      rowsShown: '{n} baris ditampilkan', sandboxOn: ' (model sandbox)', liveCount: '{n} protokol bertoken',
      liveCaption: 'Token live: protokol ini sudah diperdagangkan, jadi kapitalisasi pasarnya adalah fakta, bukan model. Mereka dipisahkan dari peringkat pra-token.',
      tableCaption: 'Protokol pra-token, nilai tersirat terkuat di atas. Pilih baris untuk melihat model dan rencana farming-nya.',
      tableCaptionSandbox: ' Model sandbox aktif: nilai di bawah dihitung ulang secara langsung, board.json tetap memakai model bawaan.',
      rank: 'Peringkat', protocol: 'Protokol', tvl: 'TVL', growth7d: '7h', age: 'Usia', implied: 'Nilai tersirat', token: 'Token',
      status: 'Status', marketCap: 'Kapitalisasi pasar', noToken: 'tanpa token', alreadyTrades: 'sudah diperdagangkan', other: 'Lainnya',
      emptyTitle: 'Tidak ada protokol yang cocok dengan filter itu', emptyBody: 'Hapus pencarian atau pilih kategori lain untuk melihat papan lagi.', clearFilters: 'Hapus filter',
      pager: 'Halaman {a} dari {b} · baris {c}–{d} dari {e}', prev: 'Sebelumnya', next: 'Berikutnya', unknown: 'tidak diketahui',
      modelTitle: 'Cara nilai tersirat dihitung',
      modelIntro: 'Setiap baris dinilai oleh satu fungsi dari angka-angka snapshot. Tidak ada nama protokol yang diistimewakan, dan tidak ada baris yang dipilih manual. Aturan yang sama yang membangun watchlist menentukan protokol mana yang boleh diperingkat: tanpa token tercatat, dan bukan produk wrapped, staked, atau bridged dari token yang sudah diperdagangkan.',
      sandboxTitle: 'Sandbox model — ubah modelnya, lihat papan bergerak',
      sandboxIntro: 'Sandbox menghitung ulang setiap baris secara langsung dari angka yang sama. Ini hanya mengubah halaman ini; board.json tetap memakai model bawaan.',
      sbScale: 'Skala kategori ×', sbGrowth: 'Bobot pertumbuhan', sbMaturity: 'Rentang kematangan', sbChain: 'Per chain tambahan', sbReset: 'Reset sandbox',
      catTitle: 'Pengali kategori', catOther: 'Kategori lainnya',
      modelNote: 'TVL dan pertumbuhan tujuh hari berasal dari snapshot. Usia adalah waktu sejak protokol pertama kali terdaftar, catatan terbaik tentang berapa lama ia berjalan tanpa token; usia yang tidak tercatat memakai {n} hari. Primitif pengambil biaya mendapat pengali tertinggi karena token di sana menangkap pendapatan protokol itu sendiri; distribusi dan infrastruktur mendapat yang terendah.',
      foot1A: 'Data: ', foot1B: '. Snapshot tidak membawa peringkat, nilai tersirat, maupun rencana farming; menurunkannya adalah tugas radar ini.',
      foot2: 'Nilai tersirat mengikuti TVL protokol itu sendiri, pertumbuhan tujuh harinya, berapa lama ia berjalan tanpa token, dan berapa banyak chain yang dijangkaunya. Ini bukan prediksi bahwa token akan diterbitkan, atau kapan. Katakan protokol tidak tercatat punya token, jangan pernah bilang ia tidak punya: catatannya mungkin saja tidak membawanya.',
      rankOf: 'Peringkat {a} dari {b}', close: 'Tutup', closeDetails: 'Tutup detail',
      eqTVL: 'TVL', eqGrowth: 'Pertumbuhan 7 hari', eqAge: 'Usia tanpa token', eqChains: 'Chain yang dijangkau',
      eqCatMult: 'Pengali kategori ({cat})', eqGrowthMult: 'Pengali pertumbuhan', eqMatMult: 'Pengali kematangan', eqChainMult: 'Pengali chain',
      farmPlan: 'Rencana farming',
      detailNoteA: 'Model penilaian: fungsi yang sama menilai setiap protokol. Halaman ini menghitung ulang baris ini menjadi {val}',
      detailNoteSame: ', angka yang sama dengan yang dibawa board.json.',
      detailNoteDiff: ', berbeda dengan papan: datanya sudah usang.',
      whyWatch: 'Di watchlist: TVL minimal ${n} jt dan belum tercatat punya token.',
      whyEarly: 'Di bawah ambang watchlist, ditemukan radar awal: aturan yang sama mempertahankannya, jadi peluncurannya layak diperingkat.',
      detailNoteB: 'Ini perkiraan, bukan harga.'
    },
    es: {
      skip: 'Saltar al tablero', pageTitle: 'Watch RADAR: protocolos pre-token clasificados por valor implícito',
      snapshot: 'Instantánea', index: 'Índice de protocolos de DefiLlama', floor: 'Mínimo', language: 'Idioma',
      heroA: '{n} protocolos en seguimiento', heroB: ', clasificados por el valor de su lanzamiento',
      heroIntro: 'La lista de seguimiento es el mínimo: todo protocolo con al menos $50 M de TVL y sin token registrado. El radar temprano añade 158 protocolos pre-token más por debajo de ese mínimo, todos con la misma regla. Los productos envueltos, en staking o puenteados de tokens que ya cotizan quedan fuera, por grande que sea su TVL. El valor implícito es un modelo, no un precio ni una promesa de lanzamiento.',
      factWatch: 'Lista cubierta', factWatchSub: 'todos los slugs de la lista',
      factRows: 'Filas pre-token puntuadas', factRowsSub: '{n} tempranas, bajo el mínimo',
      factTop: 'Valor implícito máximo', factMedian: 'Valor implícito mediano', factMedianSub: 'protocolos con token apartados: {n}',
      search: 'Buscar', searchPh: 'Buscar nombre, categoría o cadena', searchAria: 'Buscar en el tablero',
      category: 'Categoría', allCategories: 'Todas las categorías', catAria: 'Filtrar por categoría',
      chain: 'Cadena', allChains: 'Todas las cadenas', chainAria: 'Filtrar por cadena',
      scope: 'Alcance', scopeAria: 'Alcance del tablero', all: 'Todos', watchlist: 'Seguimiento', early: 'Temprano',
      tokenStatus: 'Estado del token', tokenStatusAria: 'Estado del token', preToken: 'Pre-token', liveToken: 'Token en vivo',
      rowsShown: '{n} filas mostradas', sandboxOn: ' (modelo sandbox)', liveCount: '{n} protocolos con token',
      liveCaption: 'Token en vivo: estos protocolos ya cotizan, así que su capitalización es un hecho, no un modelo. Están separados del ranking pre-token.',
      tableCaption: 'Protocolos pre-token, con el mayor valor implícito primero. Selecciona una fila para ver su modelo y plan de farming.',
      tableCaptionSandbox: ' El modelo sandbox está activo: los valores se recalculan en vivo; board.json conserva el modelo publicado.',
      rank: 'Puesto', protocol: 'Protocolo', tvl: 'TVL', growth7d: '7d', age: 'Antigüedad', implied: 'Valor implícito', token: 'Token',
      status: 'Estado', marketCap: 'Capitalización', noToken: 'sin token', alreadyTrades: 'ya cotiza', other: 'Otra',
      emptyTitle: 'Ningún protocolo coincide con ese filtro', emptyBody: 'Limpia la búsqueda o elige otra categoría para ver el tablero de nuevo.', clearFilters: 'Limpiar filtros',
      pager: 'Página {a} de {b} · filas {c}–{d} de {e}', prev: 'Anterior', next: 'Siguiente', unknown: 'desconocida',
      modelTitle: 'Cómo se calcula el valor implícito',
      modelIntro: 'Cada fila se puntúa con una única función de las cifras de la instantánea. Ningún nombre de protocolo recibe trato especial y ninguna fila se elige a mano. La misma regla que construye la lista decide qué protocolos pueden clasificarse: sin token registrado y sin ser un producto envuelto, en staking o puenteado de uno que ya cotiza.',
      sandboxTitle: 'Sandbox del modelo: cambia el modelo y mira cómo se mueve el tablero',
      sandboxIntro: 'El sandbox recalcula cada fila en vivo con las mismas cifras. Solo cambia esta página; board.json conserva el modelo publicado.',
      sbScale: 'Escala de categoría ×', sbGrowth: 'Peso del crecimiento', sbMaturity: 'Rango de madurez', sbChain: 'Por cadena extra', sbReset: 'Restablecer el sandbox',
      catTitle: 'Múltiplos por categoría', catOther: 'Cualquier otra categoría',
      modelNote: 'El TVL y el crecimiento a siete días provienen de la instantánea. La edad es el tiempo desde que el protocolo se listó por primera vez, el mejor registro de cuánto lleva sin token; una edad no listada usa {n} días. Los primitivos que cobran comisiones reciben el múltiplo más alto porque un token allí captura los ingresos del propio protocolo; la distribución y la infraestructura, el más bajo.',
      foot1A: 'Datos: ', foot1B: '. La instantánea no trae ranking, valor implícito ni plan de farming; derivarlos es el trabajo de este radar.',
      foot2: 'Un valor implícito se deduce del propio TVL del protocolo, su crecimiento a siete días, cuánto lleva sin token y a cuántas cadenas llega. No es una predicción de que se emita un token, ni de cuándo. Di que un protocolo no registra token, nunca que no tiene ninguno: su registro simplemente puede no incluirlo.',
      rankOf: 'Puesto {a} de {b}', close: 'Cerrar', closeDetails: 'Cerrar detalles',
      eqTVL: 'TVL', eqGrowth: 'Crecimiento a 7 días', eqAge: 'Antigüedad sin token', eqChains: 'Cadenas alcanzadas',
      eqCatMult: 'Múltiplo de categoría ({cat})', eqGrowthMult: 'Multiplicador de crecimiento', eqMatMult: 'Multiplicador de madurez', eqChainMult: 'Multiplicador de cadena',
      farmPlan: 'Plan de farming',
      detailNoteA: 'El modelo de puntuación: la misma función puntúa cada protocolo. La página recalcula esta fila como {val}',
      detailNoteSame: ', el mismo número que lleva board.json.',
      detailNoteDiff: ', distinto del tablero: los datos estarían desactualizados.',
      whyWatch: 'En la lista de seguimiento: al menos ${n} M de TVL y sin token registrado.',
      whyEarly: 'Por debajo del mínimo de la lista, hallado por el radar temprano: la misma regla lo mantiene, así que su lanzamiento merece clasificarse.',
      detailNoteB: 'Esto es una estimación, no un precio.'
    },
    zh: {
      skip: '跳到榜单', pageTitle: 'Watch RADAR：按隐含价值排名的无代币协议',
      snapshot: '快照', index: 'DefiLlama 协议指数', floor: '下限', language: '语言',
      heroA: '{n} 个观察名单协议', heroB: '，按其发布价值排名',
      heroIntro: '观察名单是门槛：TVL 至少 5000 万美元且无代币记录的协议。早期雷达在门槛之下再增加 158 个无代币协议，均适用同一规则。已交易代币的包装、质押和跨链产品一律排除，无论 TVL 多大。隐含价值只是模型，不是价格，也不是发布承诺。',
      factWatch: '观察名单已覆盖', factWatchSub: '名单上的全部项目',
      factRows: '已评分的无代币行', factRowsSub: '{n} 个早期，低于门槛',
      factTop: '最高隐含价值', factMedian: '隐含价值中位数', factMedianSub: '已发币协议另列：{n}',
      search: '搜索', searchPh: '搜索名称、类别或链', searchAria: '搜索榜单',
      category: '类别', allCategories: '全部类别', catAria: '按类别筛选',
      chain: '链', allChains: '全部链', chainAria: '按链筛选',
      scope: '范围', scopeAria: '榜单范围', all: '全部', watchlist: '观察名单', early: '早期',
      tokenStatus: '代币状态', tokenStatusAria: '代币状态', preToken: '无代币', liveToken: '已发币',
      rowsShown: '显示 {n} 行', sandboxOn: '（沙盒模型）', liveCount: '{n} 个已发币协议',
      liveCaption: '已发币：这些协议已经在交易，因此市值是事实而非模型。它们与无代币排名分开列出。',
      tableCaption: '无代币协议，按隐含价值从高到低排列。点击一行查看其模型与挖矿计划。',
      tableCaptionSandbox: ' 沙盒模型已开启：以下数值实时重算，board.json 仍保留发布时的模型。',
      rank: '排名', protocol: '协议', tvl: 'TVL', growth7d: '7日', age: '年龄', implied: '隐含价值', token: '代币',
      status: '状态', marketCap: '市值', noToken: '无代币', alreadyTrades: '已在交易', other: '其他',
      emptyTitle: '没有协议符合该筛选', emptyBody: '请清除搜索或选择其他类别以再次查看榜单。', clearFilters: '清除筛选',
      pager: '第 {a} 页，共 {b} 页 · 第 {c}–{d} 行，共 {e} 行', prev: '上一页', next: '下一页', unknown: '未知',
      modelTitle: '隐含价值如何计算',
      modelIntro: '每一行都由快照数据的单一函数评分。不特殊对待任何协议名称，也不手动挑选任何行。构建观察名单的同一规则决定哪些协议可以参与排名：无代币记录，且不是已交易代币的包装、质押或跨链产品。',
      sandboxTitle: '模型沙盒——调整模型，观察榜单变化',
      sandboxIntro: '沙盒用相同数据实时重算每一行。它只改变本页；board.json 仍保留发布时的模型。',
      sbScale: '类别系数 ×', sbGrowth: '增长权重', sbMaturity: '成熟度范围', sbChain: '每增加一条链', sbReset: '重置沙盒',
      catTitle: '类别倍数', catOther: '其他类别',
      modelNote: 'TVL 与七日增长来自快照。年龄指协议首次上榜至今的时间，是衡量其无代币运行多久的最佳记录；未上榜的年龄按 {n} 天计算。收取费用的基础协议倍数最高，因为其代币捕获协议自身的收入；分发与基础设施最低。',
      foot1A: '数据：', foot1B: '。快照不含排名、隐含价值或挖矿计划；推导它们正是本雷达的工作。',
      foot2: '隐含价值由协议自身的 TVL、七日增长、无代币运行时间以及覆盖的链数推导得出。它不是对发币与否或发币时间的预测。请说协议没有代币记录，而不要说它没有代币：其记录可能只是没有收录。',
      rankOf: '第 {a} 名，共 {b} 名', close: '关闭', closeDetails: '关闭详情',
      eqTVL: 'TVL', eqGrowth: '七日增长', eqAge: '无代币年龄', eqChains: '覆盖链数',
      eqCatMult: '类别倍数（{cat}）', eqGrowthMult: '增长乘数', eqMatMult: '成熟度乘数', eqChainMult: '链乘数',
      farmPlan: '挖矿计划',
      detailNoteA: '评分模型：同一函数为每个协议评分。本页将此行重算为 {val}',
      detailNoteSame: '，与 board.json 中的数字相同。',
      detailNoteDiff: '，与榜单不同：数据已过时。',
      whyWatch: '在观察名单中：TVL 至少 ${n} 百万美元且无代币记录。',
      whyEarly: '低于观察名单门槛，由早期雷达发现：同一规则将其保留，因此其发布值得排名。',
      detailNoteB: '这只是估计，不是价格。'
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

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n == null || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd0.format(n);
  }
  function fmtPct(n) { if (n == null || !isFinite(n)) return 'n/a'; return (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function fmtAge(d) { if (d == null) return t('unknown'); if (d >= 365) return (d / 365).toFixed(1) + 'y'; return Math.max(0, Math.round(d)) + 'd'; }

  // The model in one function, so the page recomputes a row from the snapshot figures and checks
  // the number board.json carries: the page's code and the board's data are the same arithmetic.
  // The sandbox passes its own overrides; the board itself is always the shipped model.
  function impliedOf(row, m) {
    var growth = Math.min(DATA.model.growth_cap, Math.max(DATA.model.growth_floor, row.change_7d == null ? 0 : row.change_7d));
    var growthMult = 1 + (growth / 100) * m.growth;
    var age = row.age_days == null ? DATA.model.unknown_age_days : row.age_days;
    var maturity = DATA.model.maturity_floor + (Math.min(Math.max(age, 0), DATA.model.maturity_days) / DATA.model.maturity_days) * m.maturity;
    var chainMult = 1 + Math.min(Math.max((row.chains || []).length - 1, 0), DATA.model.chain_cap) * m.chain;
    return Math.max(1, Math.round(row.tvl_usd * row.category_multiple * m.scale * growthMult * maturity * chainMult));
  }
  function sandboxActive() { return state.sb.scale !== 1 || state.sb.growth !== BASE_SB.growth || state.sb.maturity !== BASE_SB.maturity || state.sb.chain !== BASE_SB.chain; }
  function shownValue(row) { return sandboxActive() ? impliedOf(row, state.sb) : row.implied_value_usd; }

  // The farm plan is the same derivation main.ts writes to board.json: category, chains, TVL and
  // age decide the action, the capital, the hold and every cost and time. No name is special-cased.
  function chainOf(p) { return p.chains && p.chains.length ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) { if (p.tvl_usd >= 5e9) return 250; if (p.tvl_usd >= 1e9) return 150; if (p.tvl_usd >= 1e8) return 100; return 50; }
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
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: second == null ? weeklyFor(p, chain) : 'Repeat the position on ' + second + ' with $25, so the activity shows on both chains ' + p.name + ' runs on.', cost: second == null ? 'about $2 of gas a week' : '$25 of capital and about $3 of gas', time: second == null ? '10 minutes a week' : '15 minutes' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: "Before you withdraw, open " + p.name + "'s own points or rewards page and claim only from the link it publishes.", cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  function readHash() {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('q')) state.q = params.get('q');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
    if (params.get('scope')) state.scope = params.get('scope');
    if (params.get('tab')) state.tab = params.get('tab');
    if (params.get('lang')) state.lang = params.get('lang');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('page')) state.page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    if (!I18N[state.lang]) state.lang = 'en';
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.lang !== 'en') params.set('lang', state.lang);
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.scope !== 'all') params.set('scope', state.scope);
    if (state.tab !== 'pre-token') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    if (state.page > 1) params.set('page', String(state.page));
    var next = params.toString();
    window.history.replaceState(null, '', next ? '#' + next : window.location.pathname + window.location.search);
  }

  function filteredRows() {
    var q = state.q.trim().toLowerCase();
    return DATA.rows.filter(function (r) {
      if (state.scope === 'watchlist' && !r.watchlist) return false;
      if (state.scope === 'early' && r.watchlist) return false;
      if (state.category !== 'all' && (r.category || 'Other') !== state.category) return false;
      if (state.chain !== 'all' && !(r.chains || []).includes(state.chain)) return false;
      if (!q) return true;
      return [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
    });
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

  function options(list, current, allLabel) {
    return '<option value="all"' + (current === 'all' ? ' selected' : '') + '>' + esc(allLabel) + '</option>' +
      list.map(function (v) { return '<option value="' + esc(v) + '"' + (v === current ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
  }

  function langButtons() {
    return LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l.code + '" aria-pressed="' + (state.lang === l.code) + '" aria-label="' + esc(l.name) + '">' + esc(l.label) + '</button>';
    }).join('');
  }

  function render() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var median = DATA.rows.map(function (r) { return r.implied_value_usd; }).sort(function (a, b) { return a - b; })[Math.floor(DATA.rows.length / 2)];
    var top = DATA.rows[0];
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    document.title = t('pageTitle');
    var skip = document.querySelector('.skip');
    if (skip) skip.textContent = t('skip');
    var html = '<div class="shell">';
    html += '<header class="top"><div class="brand"><span class="mark" aria-hidden="true"></span><span>Watch RADAR</span></div>' +
      '<div class="top-meta"><span>' + esc(t('snapshot')) + ' <b>' + esc(DATA.as_of) + '</b></span><span>' + esc(t('index')) + '</span><span>' + esc(t('floor')) + ' <b>$' + Math.round(DATA.floor_usd / 1e6) + 'M</b></span></div>' +
      '<div class="lang" role="group" aria-label="' + esc(t('language')) + '">' + langButtons() + '</div></header>';
    html += '<section class="lede"><div><h1><span class="accent">' + esc(t('heroA', { n: DATA.watchlist_size })) + '</span>' + esc(t('heroB')) + '</h1>' +
      '<p>' + esc(t('heroIntro')) + '</p></div>' +
      '<div class="facts">' +
      '<div class="fact"><span>' + esc(t('factWatch')) + '</span><b>' + DATA.watchlist_size + ' / ' + DATA.watchlist_size + '</b><small>' + esc(t('factWatchSub')) + '</small></div>' +
      '<div class="fact"><span>' + esc(t('factRows')) + '</span><b>' + DATA.board_size + '</b><small>' + esc(t('factRowsSub', { n: DATA.early_size })) + '</small></div>' +
      '<div class="fact"><span>' + esc(t('factTop')) + '</span><b>' + fmtUsd(top.implied_value_usd) + '</b><small>' + esc(top.name) + '</small></div>' +
      '<div class="fact"><span>' + esc(t('factMedian')) + '</span><b>' + fmtUsd(median) + '</b><small>' + esc(t('factMedianSub', { n: DATA.live_size })) + '</small></div>' +
      '</div></section>';
    html += '<div class="controls">' +
      '<div class="field"><label for="q">' + esc(t('search')) + '</label><input type="search" id="q" placeholder="' + esc(t('searchPh')) + '" value="' + esc(state.q) + '" aria-label="' + esc(t('searchAria')) + '"></div>' +
      '<div class="field"><label for="category">' + esc(t('category')) + '</label><select id="category" aria-label="' + esc(t('catAria')) + '">' + options(categories, state.category, t('allCategories')) + '</select></div>' +
      '<div class="field"><label for="chain">' + esc(t('chain')) + '</label><select id="chain" aria-label="' + esc(t('chainAria')) + '">' + options(chains, state.chain, t('allChains')) + '</select></div>' +
      '<div class="field"><span class="lab">' + esc(t('scope')) + '</span><div class="tabs" role="group" aria-label="' + esc(t('scopeAria')) + '">' +
      '<button type="button" data-scope="all" aria-pressed="' + (state.scope === 'all') + '">' + esc(t('all')) + '</button>' +
      '<button type="button" data-scope="watchlist" aria-pressed="' + (state.scope === 'watchlist') + '">' + esc(t('watchlist')) + '</button>' +
      '<button type="button" data-scope="early" aria-pressed="' + (state.scope === 'early') + '">' + esc(t('early')) + '</button></div></div>' +
      '<div class="field"><span class="lab">' + esc(t('tokenStatus')) + '</span><div class="tabs" role="group" aria-label="' + esc(t('tokenStatusAria')) + '">' +
      '<button type="button" data-tab="pre-token" aria-pressed="' + (state.tab === 'pre-token') + '">' + esc(t('preToken')) + '</button>' +
      '<button type="button" data-tab="live" aria-pressed="' + (state.tab === 'live') + '">' + esc(t('liveToken')) + '</button></div></div>' +
      '<span class="count" id="count"></span></div>';
    html += '<div id="table-slot"></div>';
    html += '<div id="model-slot"></div>';
    html += '<footer class="foot"><p>' + esc(t('foot1A')) + esc(DATA.source) + esc(t('foot1B')) + '</p>' +
      '<p>' + esc(t('foot2')) + '</p></footer>';
    html += '</div>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
    bindControls();
    renderTable();
    renderModel();
    if (state.selected) openDetail(state.selected, true);
  }

  function bindControls() {
    var q = document.getElementById('q');
    q.addEventListener('input', function () { state.q = q.value; state.page = 1; writeHash(); renderTable(); });
    var cat = document.getElementById('category');
    cat.addEventListener('change', function () { state.category = cat.value; state.page = 1; writeHash(); renderTable(); });
    var ch = document.getElementById('chain');
    ch.addEventListener('change', function () { state.chain = ch.value; state.page = 1; writeHash(); renderTable(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-scope]'), function (b) {
      b.addEventListener('click', function () { state.scope = b.getAttribute('data-scope'); state.page = 1; writeHash(); render(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) {
      b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); state.page = 1; writeHash(); render(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
      b.addEventListener('click', function () {
        state.lang = b.getAttribute('data-lang');
        writeHash();
        render();
        if (dialog && dialog.open) openDetail(state.selected, true);
      });
    });
  }

  function sortBtn(key, label) {
    var arrow = state.sort === key ? (state.dir < 0 ? ' v' : ' ^') : '';
    return '<button type="button" data-sort="' + key + '">' + esc(label) + (arrow ? '<span aria-hidden="true">' + arrow + '</span>' : '') + '</button>';
  }

  function renderTable() {
    var slot = document.getElementById('table-slot');
    var count = document.getElementById('count');
    if (state.tab === 'live') {
      if (count) count.textContent = t('liveCount', { n: DATA.live.length });
      var rows = DATA.live.map(function (r) {
        return '<tr><td class="num">live</td><td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.category || t('other')) + ' on ' + esc((r.chains || []).slice(0, 2).join(', ') || 'an unnamed chain') + '</span></div></td>' +
          '<td class="num">' + fmtUsd(r.tvl_usd) + '</td><td class="num ' + (r.change_7d != null && r.change_7d >= 0 ? 'pos' : 'neg') + '">' + fmtPct(r.change_7d) + '</td>' +
          '<td class="num">' + fmtUsd(r.mcap_usd) + '</td><td><span class="status live">' + esc(t('alreadyTrades')) + '</span></td></tr>';
      }).join('');
      slot.innerHTML = '<div class="panel"><div class="table-wrap"><table><caption>' + esc(t('liveCaption')) + '</caption>' +
        '<thead><tr><th scope="col">' + esc(t('status')) + '</th><th scope="col">' + esc(t('protocol')) + '</th><th scope="col">' + esc(t('tvl')) + '</th><th scope="col">' + esc(t('growth7d')) + '</th><th scope="col">' + esc(t('marketCap')) + '</th><th scope="col">' + esc(t('token')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      var modelSlot = document.getElementById('model-slot');
      if (modelSlot) modelSlot.innerHTML = '';
      return;
    }
    var list = sortedRows(filteredRows());
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE;
    var pageRows = list.slice(start, start + PAGE);
    if (count) count.textContent = t('rowsShown', { n: list.length }) + (sandboxActive() ? t('sandboxOn') : '');
    if (list.length === 0) {
      slot.innerHTML = '<div class="panel"><div class="empty"><h2>' + esc(t('emptyTitle')) + '</h2><p>' + esc(t('emptyBody')) + '</p><button class="button" type="button" id="clear-filters">' + esc(t('clearFilters')) + '</button></div></div>';
      document.getElementById('clear-filters').addEventListener('click', function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.scope = 'all'; state.page = 1; writeHash(); render(); });
      var ms = document.getElementById('model-slot');
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
        '<td><div class="name"><b>' + esc(r.name) + (r.watchlist ? '<span class="badge watch">' + esc(t('watchlist')) + '</span>' : '<span class="badge early">' + esc(t('early')) + '</span>') + '</b><span class="sub">' + esc(r.category || t('other')) + ' on ' + esc((r.chains || []).slice(0, 2).join(', ') || 'an unnamed chain') + '</span></div></td>' +
        '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
        '<td class="num ' + gc + '">' + growth + '</td>' +
        '<td class="num">' + fmtAge(r.age_days) + '</td>' +
        '<td><div class="implied"><div class="bar" aria-hidden="true"><i style="width:' + Math.max(3, Math.round((val / max) * 100)) + '%"></i></div><span class="num">' + fmtUsd(val) + '</span></div></td>' +
        '<td><span class="status">' + esc(t('noToken')) + '</span></td></tr>';
    }).join('');
    slot.innerHTML = '<div class="panel"><div class="table-wrap"><table>' +
      '<caption>' + esc(t('tableCaption')) + (sandboxActive() ? esc(t('tableCaptionSandbox')) : '') + '</caption>' +
      '<thead><tr><th scope="col">' + sortBtn('implied', t('rank')) + '</th><th scope="col">' + sortBtn('name', t('protocol')) + '</th><th scope="col">' + sortBtn('tvl', t('tvl')) + '</th><th scope="col">' + sortBtn('growth', t('growth7d')) + '</th><th scope="col">' + sortBtn('age', t('age')) + '</th><th scope="col">' + sortBtn('implied', t('implied')) + '</th><th scope="col">' + esc(t('token')) + '</th></tr></thead>' +
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
    Array.prototype.forEach.call(slot.querySelectorAll('tbody tr'), function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-slug')); });
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(tr.getAttribute('data-slug')); } });
    });
    var prev = document.getElementById('prev-page');
    if (prev) prev.addEventListener('click', function () { if (state.page > 1) { state.page -= 1; writeHash(); renderTable(); } });
    var next = document.getElementById('next-page');
    if (next) next.addEventListener('click', function () { if (state.page < pages) { state.page += 1; writeHash(); renderTable(); } });
    renderModel();
  }

  function renderModel() {
    var slot = document.getElementById('model-slot');
    if (!slot || state.tab !== 'pre-token') { if (slot) slot.innerHTML = ''; return; }
    var m = DATA.model;
    var cats = Object.keys(m.category_multiples).sort(function (a, b) { return m.category_multiples[b] - m.category_multiples[a]; });
    var catRows = cats.map(function (c) { return '<tr><td>' + esc(c) + '</td><td class="num">' + m.category_multiples[c].toFixed(2) + '</td></tr>'; }).join('') +
      '<tr><td>' + esc(t('catOther')) + '</td><td class="num">' + m.default_multiple.toFixed(2) + '</td></tr>';
    slot.innerHTML = '<section class="panel model"><h2>' + esc(t('modelTitle')) + '</h2>' +
      '<p class="sub">' + esc(t('modelIntro')) + '</p>' +
      '<div class="formula">implied = round( tvl_usd &times; <b>category</b> &times; (1 + clamp(change_7d, ' + m.growth_floor + ', ' + m.growth_cap + ') / 100 &times; ' + m.growth_weight + ') &times; (' + m.maturity_floor + ' + min(age_days, ' + m.maturity_days + ') / ' + m.maturity_days + ' &times; ' + m.maturity_range + ') &times; (1 + min(chains &minus; 1, ' + m.chain_cap + ') &times; ' + m.chain_step + ') )</div>' +
      '<h3 style="margin:0 0 8px;font-size:15px">' + esc(t('sandboxTitle')) + '</h3>' +
      '<p class="sub">' + esc(t('sandboxIntro')) + '</p>' +
      '<div class="sandbox">' +
      '<div class="field"><label for="sb-scale">' + esc(t('sbScale')) + ' <output id="sb-scale-v">' + state.sb.scale.toFixed(2) + '</output></label><input type="range" id="sb-scale" min="0.5" max="1.5" step="0.05" value="' + state.sb.scale + '"></div>' +
      '<div class="field"><label for="sb-growth">' + esc(t('sbGrowth')) + ' <output id="sb-growth-v">' + state.sb.growth.toFixed(2) + '</output></label><input type="range" id="sb-growth" min="0" max="1" step="0.05" value="' + state.sb.growth + '"></div>' +
      '<div class="field"><label for="sb-maturity">' + esc(t('sbMaturity')) + ' <output id="sb-maturity-v">' + state.sb.maturity.toFixed(2) + '</output></label><input type="range" id="sb-maturity" min="0" max="0.6" step="0.05" value="' + state.sb.maturity + '"></div>' +
      '<div class="field"><label for="sb-chain">' + esc(t('sbChain')) + ' <output id="sb-chain-v">' + state.sb.chain.toFixed(2) + '</output></label><input type="range" id="sb-chain" min="0" max="0.05" step="0.01" value="' + state.sb.chain + '"></div>' +
      '</div><button class="button ghost" type="button" id="sb-reset">' + esc(t('sbReset')) + '</button>' +
      '<h3 style="margin:18px 0 4px;font-size:15px">' + esc(t('catTitle')) + '</h3>' +
      '<table class="cat-table"><tbody>' + catRows + '</tbody></table>' +
      '<p class="note" style="margin-top:12px">' + esc(t('modelNote', { n: m.unknown_age_days })) + '</p>' +
      '</section>';
    var bind = function (id, key) {
      var input = document.getElementById(id);
      input.addEventListener('input', function () {
        state.sb[key] = parseFloat(input.value);
        document.getElementById(id + '-v').textContent = state.sb[key].toFixed(2);
        renderTable();
      });
    };
    bind('sb-scale', 'scale'); bind('sb-growth', 'growth'); bind('sb-maturity', 'maturity'); bind('sb-chain', 'chain');
    document.getElementById('sb-reset').addEventListener('click', function () {
      state.sb = { scale: 1, growth: BASE_SB.growth, maturity: BASE_SB.maturity, chain: BASE_SB.chain };
      render();
    });
  }

  var dialog = null;
  function openDetail(slug, fromHash) {
    var row = null;
    DATA.rows.forEach(function (r) { if (r.slug === slug) row = r; });
    if (!row) return;
    state.selected = slug;
    if (!fromHash) writeHash();
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'detail';
      dialog.setAttribute('aria-labelledby', 'detail-title');
      dialog.addEventListener('close', function () { state.selected = null; writeHash(); });
      document.body.appendChild(dialog);
    }
    var recomputed = impliedOf(row, { scale: 1, growth: DATA.model.growth_weight, maturity: DATA.model.maturity_range, chain: DATA.model.chain_step });
    var steps = farmSteps(row);
    var why = row.watchlist
      ? t('whyWatch', { n: Math.round(DATA.floor_usd / 1e6) })
      : t('whyEarly');
    dialog.innerHTML = '<div class="detail-head"><div><span class="rank">' + esc(t('rankOf', { a: row.rank, b: DATA.board_size })) + (row.watchlist ? ' &middot; ' + esc(t('watchlist')) : ' &middot; ' + esc(t('early'))) + '</span>' +
      '<h2 id="detail-title">' + esc(row.name) + '</h2><p class="sub">' + esc(row.category || t('other')) + ' on ' + esc((row.chains || []).join(', ') || 'an unnamed chain') + '</p></div>' +
      '<button class="close" type="button" aria-label="' + esc(t('closeDetails')) + '">' + esc(t('close')) + '</button></div>' +
      '<div class="detail-body"><section class="detail-section"><h3>' + esc(t('implied')) + '</h3><div class="equation">' +
      '<div><span>' + esc(t('eqTVL')) + '</span><b class="num">' + fmtUsd(row.tvl_usd) + '</b></div>' +
      '<div><span>' + esc(t('eqGrowth')) + '</span><b class="num">' + fmtPct(row.change_7d) + '</b></div>' +
      '<div><span>' + esc(t('eqAge')) + '</span><b class="num">' + fmtAge(row.age_days) + '</b></div>' +
      '<div><span>' + esc(t('eqChains')) + '</span><b class="num">' + (row.chains || []).length + '</b></div>' +
      '<div><span>' + esc(t('eqCatMult', { cat: row.category || t('other') })) + '</span><b class="num">' + row.category_multiple.toFixed(2) + '</b></div>' +
      '<div><span>' + esc(t('eqGrowthMult')) + '</span><b class="num">' + row.growth_multiplier + '</b></div>' +
      '<div><span>' + esc(t('eqMatMult')) + '</span><b class="num">' + row.maturity_multiplier + '</b></div>' +
      '<div><span>' + esc(t('eqChainMult')) + '</span><b class="num">' + row.chain_multiplier + '</b></div>' +
      '<div class="total"><span>' + esc(t('implied')) + '</span><b class="num">' + fmtUsd(row.implied_value_usd) + '</b></div></div>' +
      '<p class="sub">' + esc(t('detailNoteA', { val: fmtUsd(recomputed) })) + esc(recomputed === row.implied_value_usd ? t('detailNoteSame') : t('detailNoteDiff')) + ' ' + esc(why) + ' ' + esc(t('detailNoteB')) + '</p></section>' +
      '<section class="detail-section"><h3>' + esc(t('farmPlan')) + '</h3><ol class="steps">' +
      steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return '<li><b>' + esc(action) + '</b><span class="cost">' + esc(tail) + '</span></li>';
      }).join('') + '</ol></section></div>';
    dialog.querySelector('.close').addEventListener('click', function () { dialog.close(); });
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
  }

  // Test hooks for the build's own checks: the page's farm plan and implied value, callable from
  // outside so the build can prove they match board.json row for row.
  window.RADAR_TEST = { farmSteps: farmSteps, impliedOf: impliedOf, rows: DATA.rows };

  readHash();
  render();
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dialog && dialog.open) dialog.close(); });
})();
