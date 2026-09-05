"use strict";

/* ================= 全局状态 ================= */
const SAVE_KEY = "fastgo_state_v2";
const defaultState = () => ({
  wallet: 2000,
  points: 0,
  earned: 0,
  name: "游客",
  phone: "",
  from: "北京",
  to: "上海",
  type: "train",
  favs: [],
  orders: [],
  contacts: [],
  coupons: [],
  waits: [],
  signDays: 0,
  lastSign: "",
  // 搜索筛选状态默认值（修复 period/maxPrice 未初始化导致的过滤与显示 bug）
  period: "all",
  maxPrice: 2500,
  sortMode: "recom",
  seatFilter: "",
  onlyAvail: false,
  onlyG: false,
  onlyDirect: false,
  results: [],
  searchDate: "",
  // 多段行程（经停点）
  stops: [],
  multiLeg: false,
  // 充值记录
  recharges: [],
  // 历史搜索 / 主题
  history: [],
  theme: "dark",
});
let state = defaultState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) state = Object.assign(defaultState(), JSON.parse(raw));
    // 搜索筛选是临时状态，不跨刷新保留（否则旧的最高价/只看高铁等会把新搜索过滤成0）
    state.period = "all"; state.maxPrice = 2500; state.sortMode = "recom";
    state.seatFilter = ""; state.onlyAvail = false; state.onlyG = false; state.onlyDirect = false;
  } catch (err) { if (typeof toast === "function") toast("⚠️ 本地存储不可用，数据可能无法跨刷新保留", "error"); }
}
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch (err) { if (typeof toast === "function") toast("⚠️ 保存失败：浏览器限制了本地存储", "error"); return false; }
}
// 兜底：任何时刻离开/刷新页面都先保存一次，避免数据丢失
window.addEventListener("beforeunload", saveState);

/* ================= 真实车站数据 ================= */
const STATIONS = (window.STATION_DATA || []).map(d => ({ name: d[0], city: d[1], code: d[2], py: d[3] }));
const STATION_CITIES = [];
{
  const seen = new Set();
  for (const s of STATIONS) if (!seen.has(s.city)) { seen.add(s.city); STATION_CITIES.push(s.city); }
}
const MAJOR_CITIES = ["北京","上海","广州","深圳","杭州","成都","重庆","武汉","西安","南京","天津","苏州","长沙","郑州","青岛","大连","厦门","昆明","贵阳","兰州","哈尔滨","长春","沈阳","乌鲁木齐","拉萨","西宁","银川","南宁","福州","南昌","太原","合肥","石家庄","呼和浩特","海口","三亚","无锡","宁波","济南","东莞","佛山","中山","珠海","绵阳","遵义"].filter(c => STATION_CITIES.includes(c));

function stationCity(name) {
  const s = STATIONS.find(x => x.name === name || x.city === name || x.code === name);
  return s ? s.city : name;
}
// 城市归并：中小城市自动匹配到就近的核心城市，保证能搜到班次
const CITY_FALLBACK = {
  "唐山":"天津","秦皇岛":"北京","邯郸":"石家庄","邢台":"石家庄","保定":"石家庄","张家口":"北京","承德":"北京","沧州":"天津","廊坊":"北京","衡水":"石家庄",
  "大同":"太原","长治":"太原","晋城":"太原","朔州":"太原","晋中":"太原","运城":"太原","忻州":"太原","临汾":"太原","吕梁":"太原","阳泉":"太原",
  "包头":"呼和浩特","鄂尔多斯":"呼和浩特","赤峰":"沈阳","通辽":"沈阳","呼伦贝尔":"哈尔滨","巴彦淖尔":"呼和浩特","乌兰察布":"呼和浩特","乌海":"银川",
  "鞍山":"沈阳","抚顺":"沈阳","本溪":"沈阳","丹东":"大连","锦州":"沈阳","营口":"大连","阜新":"沈阳","辽阳":"沈阳","盘锦":"大连","铁岭":"沈阳","朝阳":"沈阳","葫芦岛":"大连",
  "吉林":"长春","四平":"长春","通化":"长春","白山":"长春","松原":"长春","白城":"长春","延边":"长春","辽源":"长春",
  "齐齐哈尔":"哈尔滨","大庆":"哈尔滨","牡丹江":"哈尔滨","佳木斯":"哈尔滨","绥化":"哈尔滨","鸡西":"哈尔滨","鹤岗":"哈尔滨","双鸭山":"哈尔滨","伊春":"哈尔滨","七台河":"哈尔滨","黑河":"哈尔滨",
  "徐州":"南京","常州":"苏州","南通":"上海","连云港":"南京","淮安":"南京","盐城":"南京","扬州":"南京","镇江":"南京","泰州":"南京","宿迁":"南京",
  "温州":"宁波","嘉兴":"上海","湖州":"杭州","金华":"杭州","衢州":"杭州","台州":"宁波","丽水":"杭州","舟山":"宁波",
  "芜湖":"南京","蚌埠":"合肥","淮南":"合肥","马鞍山":"南京","淮北":"合肥","铜陵":"合肥","安庆":"合肥","黄山":"杭州","滁州":"合肥","阜阳":"合肥","宿州":"合肥","六安":"合肥","亳州":"合肥","池州":"合肥","宣城":"杭州",
  "莆田":"福州","三明":"厦门","泉州":"厦门","漳州":"厦门","南平":"福州","龙岩":"厦门","宁德":"福州",
  "景德镇":"南昌","萍乡":"长沙","九江":"南昌","新余":"南昌","鹰潭":"南昌","赣州":"广州","吉安":"南昌","宜春":"南昌","抚州":"南昌","上饶":"杭州",
  "淄博":"济南","枣庄":"济南","东营":"济南","烟台":"青岛","潍坊":"青岛","济宁":"济南","泰安":"济南","威海":"青岛","日照":"青岛","临沂":"济南","德州":"济南","聊城":"济南","滨州":"济南","菏泽":"济南",
  "开封":"郑州","洛阳":"郑州","平顶山":"郑州","安阳":"郑州","鹤壁":"郑州","新乡":"郑州","焦作":"郑州","濮阳":"郑州","许昌":"郑州","漯河":"郑州","三门峡":"西安","南阳":"郑州","商丘":"郑州","信阳":"武汉","周口":"郑州","驻马店":"郑州","济源":"郑州",
  "黄石":"武汉","十堰":"武汉","宜昌":"武汉","襄阳":"武汉","鄂州":"武汉","荆门":"武汉","孝感":"武汉","荆州":"武汉","黄冈":"武汉","咸宁":"武汉","随州":"武汉","恩施":"武汉","仙桃":"武汉","潜江":"武汉","天门":"武汉",
  "株洲":"长沙","湘潭":"长沙","衡阳":"长沙","邵阳":"长沙","岳阳":"长沙","常德":"长沙","张家界":"长沙","益阳":"长沙","郴州":"长沙","永州":"长沙","怀化":"长沙","娄底":"长沙",
  "韶关":"广州","汕头":"厦门","江门":"广州","湛江":"广州","茂名":"广州","肇庆":"广州","惠州":"深圳","梅州":"厦门","汕尾":"深圳","河源":"广州","阳江":"广州","清远":"广州","潮州":"厦门","揭阳":"厦门","云浮":"广州",
  "柳州":"南宁","桂林":"南宁","梧州":"广州","北海":"南宁","防城港":"南宁","钦州":"南宁","贵港":"南宁","玉林":"南宁","百色":"南宁","贺州":"广州","河池":"南宁","来宾":"南宁","崇左":"南宁",
  "儋州":"海口","琼海":"海口","文昌":"海口","万宁":"三亚","东方":"海口",
  "自贡":"成都","攀枝花":"成都","泸州":"重庆","德阳":"成都","广元":"成都","遂宁":"成都","内江":"重庆","乐山":"成都","南充":"成都","眉山":"成都","宜宾":"成都","广安":"重庆","达州":"成都","雅安":"成都","巴中":"成都","资阳":"成都",
  "六盘水":"贵阳","安顺":"贵阳","毕节":"贵阳","铜仁":"贵阳",
  "曲靖":"昆明","玉溪":"昆明","保山":"昆明","昭通":"昆明","丽江":"昆明","普洱":"昆明","临沧":"昆明","楚雄":"昆明","红河":"昆明","文山":"昆明","西双版纳":"昆明","大理":"昆明","德宏":"昆明","怒江":"昆明","迪庆":"昆明",
  "铜川":"西安","宝鸡":"西安","咸阳":"西安","渭南":"西安","延安":"西安","汉中":"西安","榆林":"西安","安康":"西安","商洛":"西安",
  "嘉峪关":"兰州","金昌":"兰州","白银":"兰州","天水":"兰州","武威":"兰州","张掖":"兰州","平凉":"西安","酒泉":"兰州","庆阳":"西安","定西":"兰州","陇南":"成都",
  "海东":"西宁","海西":"西宁","石嘴山":"银川","吴忠":"银川","固原":"银川","中卫":"银川",
  "克拉玛依":"乌鲁木齐","吐鲁番":"乌鲁木齐","哈密":"乌鲁木齐","昌吉":"乌鲁木齐","喀什":"乌鲁木齐","阿克苏":"乌鲁木齐","伊犁":"乌鲁木齐","石河子":"乌鲁木齐","日喀则":"拉萨"
};
function searchCity(name) {
  const c = stationCity(name);
  if (MAJOR_CITIES.includes(c)) return c;
  return CITY_FALLBACK[c] || c;
}


/* ================= 里程计价 ================= */
const DISTANCE = {};
(function calcDist() {
  // 简化：用城市名哈希生成一个稳定的"里程"，让票价随距离变化
  for (let i = 0; i < MAJOR_CITIES.length; i++) {
    for (let j = i + 1; j < MAJOR_CITIES.length; j++) {
      const a = MAJOR_CITIES[i], b = MAJOR_CITIES[j];
      let h = 0;
      for (const ch of (a + b)) h = (h * 31 + ch.charCodeAt(0)) % 100000;
      DISTANCE[a + "|" + b] = 150 + (h % 2050);
      DISTANCE[b + "|" + a] = DISTANCE[a + "|" + b];
    }
  }
})();
function tripDistance(from, to) { return DISTANCE[from + "|" + to] || 400; }

const TRAIN_SEATS = { "二等座": 1.0, "一等座": 1.6, "商务座": 3.0, "硬卧": 1.9, "软卧": 2.8 };
const PLANE_SEATS = { "经济舱": 1.0, "超级经济舱": 1.5, "公务舱": 2.8, "头等舱": 4.2 };
const METRO_SEATS = { "普通车厢": 1.0, "商务车厢": 3.0 };

const TRIPS = [];
const METRO_LINES = {};

(function buildData() {
  // 确定性伪随机：固定种子，保证每次刷新班次数据稳定一致（不再"刷新就变"）
  let _seed = 20260831;
  const R = () => { _seed = (_seed * 9301 + 49297) % 233280; return _seed / 233280; };
  const rnd = n => Math.floor(R() * n);
  // 热门线路必达：这些线路对一定生成车/机班次，保证主流搜索必有结果
  const MUST_HAVE = new Set([
    "北京|上海","北京|广州","北京|深圳","北京|成都","北京|武汉","北京|西安","北京|南京","北京|天津","北京|杭州","北京|长沙",
    "上海|广州","上海|深圳","上海|成都","上海|杭州","上海|南京","上海|苏州","上海|武汉","上海|北京",
    "广州|深圳","广州|成都","广州|武汉","广州|长沙","广州|厦门","广州|北京","广州|上海",
    "深圳|成都","深圳|武汉","深圳|长沙","深圳|厦门","深圳|北京","深圳|上海",
    "成都|重庆","成都|西安","武汉|长沙","西安|郑州","南京|杭州","杭州|苏州","重庆|武汉","成都|昆明","广州|西安",
    "北京|郑州","郑州|武汉","郑州|长沙","郑州|杭州","郑州|南京","郑州|广州","郑州|成都","郑州|重庆","郑州|青岛","郑州|济南","郑州|天津","郑州|大连",
    "武汉|南京","武汉|杭州","武汉|成都","武汉|重庆","武汉|西安","武汉|青岛","武汉|长沙","长沙|成都","长沙|重庆","长沙|南京","长沙|杭州",
    "杭州|武汉","杭州|成都","杭州|重庆","杭州|西安","杭州|青岛","南京|西安","南京|成都","南京|重庆","南京|武汉","西安|成都","西安|重庆","西安|昆明",
    "成都|武汉","成都|长沙","成都|青岛","成都|南京","重庆|长沙","重庆|广州","重庆|西安","重庆|青岛","重庆|昆明","青岛|北京","青岛|上海","济南|北京"
  ]);
  let tid = 1;
  // 单个方向生成函数
  const genDir = (from, to, must) => {
    const km = tripDistance(from, to);
    const trains = (must ? 2 : 1) + rnd(3);
    for (let k = 0; k < trains; k++) {
      const h = 6 + rnd(16);
      const isHigh = R() < 0.8;
      // 高铁 0.46 元/km，普速 0.12 元/km
      const base = Math.round(km * (isHigh ? 0.46 : 0.12));
      TRIPS.push({
        id: "T" + (tid++), type: "train", no: (isHigh ? (R() < .5 ? "G" : "D") : "K") + (tid * 13 % 900 + 100),
        from, to, km, dep: String(h).padStart(2, "0") + ":" + String(rnd(60)).padStart(2, "0"),
        dur: km / (isHigh ? 260 : 100) + (R() * .5), price: base,
        seats: { ...TRAIN_SEATS }, remain: R() < .06 ? 0 : 5 + rnd(260),
        tag: isHigh ? (R() < .4 ? "复兴号" : "高铁") : "普速", ontime: 85 + rnd(14),
      });
    }
    const planes = (must ? 1 : 0) + rnd(2);
    for (let k = 0; k < planes; k++) {
      const h = 7 + rnd(14);
      const base = Math.round(km * (0.7 + R() * 0.3));
      TRIPS.push({
        id: "P" + (tid++), type: "plane", no: "MU" + (tid * 7 % 900 + 100),
        from, to, km, dep: String(h).padStart(2, "0") + ":" + String(rnd(60)).padStart(2, "0"),
        dur: 1.2 + km / 850 + (R() * .6), price: base,
        seats: { ...PLANE_SEATS }, remain: R() < .04 ? 0 : 2 + rnd(130),
        tag: R() < .5 ? "直飞" : "经停", ontime: 75 + rnd(24),
      });
    }
  };
  // 每对城市双向各生成班次（去程 + 回程）
  for (let i = 0; i < MAJOR_CITIES.length; i++) {
    for (let j = i + 1; j < MAJOR_CITIES.length; j++) {
      const A = MAJOR_CITIES[i], B = MAJOR_CITIES[j];
      const must = MUST_HAVE.has(A + "|" + B) || MUST_HAVE.has(B + "|" + A);
      genDir(A, B, must);
      genDir(B, A, must);
    }
  }
  const metroStops = ["市中心","科技园","大学城","火车站","机场航站楼","商业广场","体育中心","高新区","老城区","滨江公园","汽车站","植物园","工业园","会展中心","文创街区"];
  for (const c of MAJOR_CITIES.slice(0, 16)) {
    const lines = [];
    const nLines = 4 + rnd(6);
    for (let li = 0; li < nLines; li++) {
      const stops = [];
      const nStops = 8 + rnd(8);
      for (let si = 0; si < nStops; si++) stops.push(metroStops[rnd(metroStops.length)] + (si === 0 ? "东" : si === nStops - 1 ? "西" : (rnd(20) + 1)));
      const lineName = (li + 1) + "号线";
      lines.push({ name: lineName, stops });
      TRIPS.push({
        id: "M" + (tid++), type: "metro", no: lineName,
        from: c + " · " + stops[0], to: c + " · " + stops[nStops - 1],
        km: nStops * 1.2, dep: "06:00", dur: nStops * 0.09, price: Math.round(2 + nStops * 0.4),
        seats: { ...METRO_SEATS }, remain: 999,
        tag: "全程", ontime: 99, line: lineName, city: c, stops,
      });
    }
    METRO_LINES[c] = lines;
  }
})();

/* ================= 工具函数 ================= */
const $ = id => document.getElementById(id);
const fmt = n => "¥" + Number(n).toFixed(2);
const durTxt = d => `${Math.floor(d)}h${String(Math.round((d % 1) * 60)).padStart(2, "0")}m`;
const fmt2 = mins => String(Math.floor(mins / 60) % 24).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0");

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  $("toastWrap").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .4s"; setTimeout(() => el.remove(), 400); }, 2800);
}
function normDate(d) { const dt = d ? new Date(d) : new Date(); return dt.toISOString().slice(0, 10); }
function calcArr(dep, dur) {
  const [h, m] = dep.split(":").map(Number);
  const mins = h * 60 + m + Math.round(dur * 60);
  return String(Math.floor(mins / 60) % 24).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0");
}
function seatFare(trip, label) {
  const ratio = trip.seats[label];
  return Math.round(trip.price * ratio);
}

/* ================= 会员等级 ================= */
const LEVELS = [
  { name: "见习会员", g: 0, rate: 0.99, color: "#94a3b8" },
  { name: "青铜会员", g: 500, rate: 0.98, color: "#b45309" },
  { name: "白银会员", g: 2000, rate: 0.96, color: "#cbd5e1" },
  { name: "黄金会员", g: 8000, rate: 0.94, color: "#f59e0b" },
  { name: "铂金会员", g: 20000, rate: 0.92, color: "#22d3ee" },
  { name: "钻石会员", g: 35000, rate: 0.90, color: "#a78bfa" },
  { name: "真专属会员", g: 50000, rate: 0.88, color: "#facc15" },
];
function memberInfo() {
  const g = state.orders.reduce((s, o) => s + o.total, 0) * 1;
  let lv = LEVELS[0], next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) if (g >= LEVELS[i].g) { lv = LEVELS[i]; next = LEVELS[i + 1] || null; }
  return { g, lv, next, pct: next ? Math.round((g - lv.g) / (next.g - lv.g) * 100) : 100 };
}

function renderMember() {
  const m = memberInfo();
  $("memberLv").textContent = m.lv.name;
  $("memberDesc").textContent = `购票享 ${Math.round(m.lv.rate * 100)} 折 · 消费 1 元 = 1 成长值`;
  $("growthVal").textContent = Math.round(m.g * 100) / 100;
  $("growthBar").style.width = m.pct + "%";
  $("growthHint").textContent = m.next ? `距${m.next.name}还需 ${m.next.g - m.g} 成长值` : "已达最高等级";
  $("memberLvTag").textContent = m.lv.name.replace("会员", "");
  $("nickName").textContent = state.name;
}

/* ================= 渲染 ================= */
function renderHeader() {
  $("wPoints").textContent = state.points;
  $("favCount").textContent = state.favs.length;
  $("nickName").textContent = state.name;
  const activeWaits = state.waits.filter(w => w.status === "waiting");
  $("waitCount").textContent = activeWaits.length;
  $("waitToggle").style.display = activeWaits.length ? "block" : "none";
  renderMember();
}

function renderSteps(idx) {
  document.querySelectorAll("#progressSteps .step").forEach((s, i) => {
    s.classList.toggle("active", i === idx);
    s.classList.toggle("done", i < idx);
  });
}

function renderQuick() {
  const list = TRIPS.filter(t => t.type === state.type);
  const seen = new Set();
  const uniq = [];
  for (const t of list) {
    const key = (state.type === "metro" ? t.city : t.from + "→" + t.to);
    if (!seen.has(key)) { seen.add(key); uniq.push(t); }
    if (uniq.length >= 8) break;
  }
  $("tripCount").textContent = `（${STATION_CITIES.length} 个真实城市 · ${TRIPS.length} 条模拟班次 · 按里程计价）`;
  $("quickList").innerHTML = uniq.map(t => `
    <div class="quick-item" data-quick="${t.id}">
      <div>
        <div style="font-weight:700;">${state.type === "metro" ? t.line : t.from + " → " + t.to}</div>
        <div style="font-size:12px;color:var(--dim);">${t.no} · ${t.dep} · ${t.km}km</div>
      </div>
      <div class="q-price">${fmt(t.price)}</div>
    </div>`).join("");
  $("quickList").querySelectorAll("[data-quick]").forEach(item => {
    item.onclick = () => {
      const t = TRIPS.find(x => x.id === item.dataset.quick);
      if (state.type === "metro") {
        $("metroCity").value = t.city;
        renderMetroLines();
        $("metroLine").value = t.line;
      } else {
        $("inputFrom").value = t.from;
        $("inputTo").value = t.to;
      }
      doSearch();
      const n = state.multiLeg ? state.results.legs.length : state.results.length;
      toast("已填入，为你找到 " + n + (state.multiLeg ? " 段行程" : " 趟班次"));
      document.querySelector("#resultList").scrollIntoView({ behavior: "smooth" });
    };
  });
}

function renderFilters() {
  const bar = $("filterBar");
  if (state.multiLeg) {
    bar.innerHTML = `<div style="font-size:12px;color:var(--dim);padding:6px 0;">多段行程模式 · 已按经停点拆分搜索，每段独立选座购票，筛选按单段进行</div>`;
    return;
  }
  const seats = state.results.length ? Object.keys(state.results[0].seats) : [];
  const seatChips = ["全部", ...seats].map(c =>
    `<button class="chip ${(c === "全部" && !state.seatFilter) || c === state.seatFilter ? "active" : ""}" data-seat="${c}">${c}</button>`).join("");
  const periods = [["all", "全天"], ["morning", "上午"], ["afternoon", "下午"], ["evening", "晚上"]];
  const periodChips = periods.map(([v, l]) =>
    `<button class="chip ${state.period === v ? "active" : ""}" data-period="${v}">${l}</button>`).join("");
  const sorts = [["recom", "智能"], ["price", "价格"], ["dep", "出发"], ["dur", "历时"]];
  const sortChips = sorts.map(([v, l]) =>
    `<button class="chip ${state.sortMode === v ? "active" : ""}" data-sort="${v}">${l}</button>`).join("");
  const extraChips =
    `<button class="chip ${state.onlyAvail ? "active" : ""}" data-x="avail">只看有票</button>` +
    (state.type === "train" ? `<button class="chip ${state.onlyG ? "active" : ""}" data-x="g">只看高铁</button>` : "") +
    (state.type === "plane" ? `<button class="chip ${state.onlyDirect ? "active" : ""}" data-x="direct">只看直飞</button>` : "");
  bar.innerHTML = `
    <div style="width:100%;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
      <span style="font-size:12px;color:var(--dim);font-weight:600;">座位</span>${seatChips}
      <span style="font-size:12px;color:var(--dim);font-weight:600;margin-left:8px;">时段</span>${periodChips}
      <span style="font-size:12px;color:var(--dim);font-weight:600;margin-left:8px;">排序</span>${sortChips}
    </div>
    <div style="width:100%;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">${extraChips}
      <span style="font-size:12px;color:var(--dim);font-weight:600;margin-left:8px;">最高价</span>
      <input type="range" min="100" max="2500" value="${state.maxPrice}" step="50" id="priceRange" style="width:150px;accent-color:var(--p1);">
      <span style="font-size:12px;color:var(--dim);" id="priceRangeVal">≤ ¥${state.maxPrice}</span>
    </div>`;
  bar.querySelectorAll("[data-seat]").forEach(c => c.onclick = () => { state.seatFilter = c.dataset.seat === "全部" ? "" : c.dataset.seat; renderFilters(); renderResults(); });
  bar.querySelectorAll("[data-period]").forEach(c => c.onclick = () => { state.period = c.dataset.period; renderFilters(); renderResults(); });
  bar.querySelectorAll("[data-sort]").forEach(c => c.onclick = () => { state.sortMode = c.dataset.sort; renderFilters(); renderResults(); });
  bar.querySelectorAll("[data-x]").forEach(c => c.onclick = () => {
    if (c.dataset.x === "avail") state.onlyAvail = !state.onlyAvail;
    if (c.dataset.x === "g") state.onlyG = !state.onlyG;
    if (c.dataset.x === "direct") state.onlyDirect = !state.onlyDirect;
    renderFilters(); renderResults();
  });
  const pr = bar.querySelector("#priceRange");
  if (pr) pr.oninput = e => { state.maxPrice = +e.target.value; $("priceRangeVal").textContent = "≤ ¥" + state.maxPrice; renderResults(); };
}

function filteredTrips() {
  if (state.multiLeg) return state.results.legs;
  let list = state.results.slice();
  if (state.seatFilter) list = list.filter(t => t.seats[state.seatFilter]);
  if (state.period !== "all") {
    const [s, e] = state.period === "morning" ? [6, 12] : state.period === "afternoon" ? [12, 18] : [18, 24];
    list = list.filter(t => { const h = +t.dep.split(":")[0]; return h >= s && h < e; });
  }
  if (state.onlyAvail) list = list.filter(t => t.remain > 0);
  if (state.onlyG) list = list.filter(t => t.no.startsWith("G"));
  if (state.onlyDirect) list = list.filter(t => t.tag === "直飞");
  if (state.maxPrice) list = list.filter(t => t.price <= state.maxPrice);
  const star = t => (t.tag.includes("复兴") ? 2 : 0) + Math.min(3, Math.floor(t.remain / 40)) + Math.floor(t.ontime / 50);
  if (state.sortMode === "price") list.sort((a, b) => a.price - b.price);
  else if (state.sortMode === "dep") list.sort((a, b) => a.dep.localeCompare(b.dep));
  else if (state.sortMode === "dur") list.sort((a, b) => a.dur - b.dur);
  else list.sort((a, b) => star(b) - star(a) || a.dep.localeCompare(b.dep));
  return list;
}

/* 多段行程结果渲染 */
function renderMultiResults(el) {
  const R = state.results;
  if (!R || !R.legs || !R.legs.length) { el.innerHTML = `<div class="empty">没有找到符合条件的结果</div>`; return; }
  let total = 0, totalDur = 0;
  const legBest = R.legs.map(leg => {
    if (!leg.trips.length) return null;
    const best = leg.trips.reduce((a, b) => a.price < b.price ? a : b);
    total += best.price; totalDur += best.dur;
    return best;
  });
  const foundCount = legBest.filter(Boolean).length;
  const allFound = foundCount === R.legs.length;
  $("resultCount").textContent = allFound
    ? `共 ${R.legs.length} 段 · 全程可衔接`
    : `共 ${R.legs.length} 段 · ${foundCount} 段可直达`;
  const tLabel = state.type === "train" ? "列车" : state.type === "plane" ? "航班" : "线路";
  el.innerHTML = `
    <div class="multi-summary">
      <div style="font-weight:800;font-size:15px;">🛤️ 多段行程方案</div>
      <div style="font-size:13px;color:var(--muted);margin-top:4px;">${R.path.join(" → ")}</div>
      <div style="display:flex;gap:18px;margin-top:8px;flex-wrap:wrap;font-size:13px;">
        <span>段数 <b>${R.legs.length}</b></span>
        <span>预估总价 <b style="color:var(--gold);">${fmt(total)}</b>${foundCount < R.legs.length ? `<span style="color:var(--dim);font-size:12px;">（${foundCount} 段直达合计）</span>` : ""}</span>
        <span>预估总历时 <b>${durTxt(totalDur)}</b>${foundCount < R.legs.length ? `<span style="color:var(--dim);font-size:12px;">（直达段）</span>` : ""}</span>
      </div>
      <div style="font-size:12px;color:var(--dim);margin-top:6px;">价格为各段最低票价之和，每段需单独预订，按顺序依次购票即可</div>
    </div>` +
    R.legs.map((leg, i) => {
      const head = `<div class="leg-head"><span class="leg-num">${i + 1}</span>${leg.from} → ${leg.to}</div>`;
      if (!leg.trips.length) {
        return `<div class="multi-leg">${head}<div class="empty" style="padding:14px;">该段暂无直达${tLabel}，请更换经停点或选择其他交通方式</div></div>`;
      }
      const rows = leg.trips.slice(0, 4).map(t => {
        const arr = calcArr(t.dep, t.dur);
        const soldOut = t.remain <= 0;
        return `
          <div class="leg-trip">
            <div style="min-width:72px;"><div style="font-weight:700;">${t.dep}</div><div style="font-size:11px;color:var(--dim);">${t.no}</div></div>
            <div style="min-width:72px;"><div style="font-weight:700;">${arr}</div><div style="font-size:11px;color:var(--dim);">${durTxt(t.dur)}</div></div>
            <div style="flex:1;min-width:90px;display:flex;gap:6px;flex-wrap:wrap;">
              <span class="tag">${t.tag}</span>
              <span class="tag orange">${fmt(t.price)}</span>
              <span class="tag ${soldOut ? "red" : "green"}">${soldOut ? "售罄" : "余票 " + t.remain}</span>
            </div>
            <div style="text-align:right;">
              ${soldOut
                ? `<button class="btn btn-outline" style="padding:5px 12px;font-size:12px;border-color:rgba(34,211,238,.5);color:var(--cyan);" data-mwait="${t.id}">⏳ 候补</button>`
                : `<button class="btn btn-primary" style="padding:5px 12px;font-size:12px;" data-mbook="${t.id}">预订</button>`}
            </div>
          </div>`;
      }).join("");
      return `<div class="multi-leg">${head}${rows}</div>`;
    }).join("");
  el.querySelectorAll("[data-mbook]").forEach(b => b.onclick = () => openSeat(TRIPS.find(x => x.id === b.dataset.mbook)));
  el.querySelectorAll("[data-mwait]").forEach(b => b.onclick = () => openWait(TRIPS.find(x => x.id === b.dataset.mwait)));
}

function renderResults() {
  const list = $("resultList");
  if (state.multiLeg) { renderMultiResults(list); return; }
  const trips = filteredTrips();
  $("resultCount").textContent = `共 ${trips.length} 趟`;
  if (trips.length === 0) {
    const hasFilter = state.onlyG || state.onlyAvail || state.onlyDirect || state.maxPrice || (state.period && state.period !== "all") || state.seatFilter;
    if (hasFilter) {
      const priceHint = state.maxPrice && state.maxPrice < 1000 ? "（你设了最高价 ¥" + state.maxPrice + "，车票可能都被筛掉了，点下面按钮清除试试）" : "，试试清除筛选或换其他条件";
      list.innerHTML = `<div class="empty">没有符合筛选条件的结果${priceHint}</div>
        <div style="text-align:center;margin-top:10px;"><button class="btn btn-outline" id="clearFilt" style="padding:7px 18px;font-size:13px;">🧹 清除全部筛选</button></div>`;
      const cf = $("clearFilt");
      if (cf) cf.onclick = () => { state.onlyG = false; state.onlyAvail = false; state.onlyDirect = false; state.maxPrice = 0; state.period = "all"; state.seatFilter = ""; renderFilters(); doSearch(true); };
    } else {
      const fc = searchCity(state.from || ""), tc = searchCity(state.to || "");
      if (!MAJOR_CITIES.includes(fc) || !MAJOR_CITIES.includes(tc)) {
        const hot = ["北京","上海","广州","深圳","成都","武汉","西安","杭州","南京","重庆","郑州","长沙","天津","青岛","大连","厦门"];
        list.innerHTML = `<div class="empty">「${state.from || ""}」暂无直达班次，试试这些热门城市</div>
          <div style="text-align:center;margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">${hot.map(c => `<button class="chip" data-hot="${c}">${c}</button>`).join("")}</div>`;
        list.querySelectorAll("[data-hot]").forEach(b => b.onclick = () => {
          const c = b.dataset.hot;
          if (fc === c || !MAJOR_CITIES.includes(fc)) { $("inputFrom").value = c; if (!state.to || searchCity(state.to) === c) $("inputTo").value = MAJOR_CITIES.find(x => x !== c) || "上海"; }
          else $("inputTo").value = c;
          doSearch();
        });
      } else {
        list.innerHTML = `<div class="empty">${state.cityNote ? state.cityNote : "该线路暂无班次，试试调整筛选或换其他城市"}</div>`;
      }
    }
    return;
  }
  list.innerHTML = (state.cityNote ? `<div class="city-note">${state.cityNote}</div>` : "") + trips.map(t => {
    const arr = calcArr(t.dep, t.dur);
    const soldOut = t.remain <= 0;
    const tags = (t.tag ? `<span class="tag">${t.tag}</span>` : "") +
      (t.type === "train" ? `<span class="tag orange">火车票</span>` : "") +
      (t.type === "plane" ? `<span class="tag green">含机建燃油</span>` : "") +
      (t.ontime ? `<span class="tag cyan">准点率 ${t.ontime}%</span>` : "") +
      (soldOut ? `<span class="tag red">已售罄 · 可候补</span>` : (t.remain <= 10 ? `<span class="tag red">余票紧张</span>` : ""));
    const seatPreview = Object.keys(t.seats).map(s =>
      `<span class="tag" style="${state.seatFilter && s !== state.seatFilter ? "opacity:.35" : ""}">${s} ${fmt(seatFare(t, s))}</span>`).join(" ");
    const fav = state.favs.includes(t.id);
    const isHot = !soldOut && t.remain <= 15;
    return `
      <div class="result-item" data-trip="${t.id}">
        <div class="route" style="cursor:pointer;" data-detail="${t.id}">
          <div>
            <div class="time">${t.dep}</div>
            <div class="station">${t.from}</div>
          </div>
          <div class="line">
            <span class="dur">${t.no}</span>
            <div class="bar"></div>
            <span class="dash">${durTxt(t.dur)}</span>
          </div>
          <div>
            <div class="time">${arr}</div>
            <div class="station">${t.to}</div>
          </div>
        </div>
        <div class="meta">
          <div class="tags">${tags}</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;margin-bottom:6px;">${seatPreview}</div>
          <div><span class="price">${fmt(t.price)}</span> <small>起 · ${t.km}km</small></div>
          <div class="remain ${soldOut ? "low" : (t.remain <= 10 ? "low" : "")}">${soldOut ? "今日无票" : "余票 " + t.remain + " 张"}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;justify-content:flex-end;flex-wrap:wrap;">
            <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;" data-detail="${t.id}">详情</button>
            ${isHot ? `<button class="btn" style="padding:7px 14px;font-size:13px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;box-shadow:0 0 16px rgba(239,68,68,.4);" data-speed="${t.id}">🚀 抢票</button>` : ""}
            ${soldOut
              ? `<button class="btn btn-outline" style="padding:7px 14px;font-size:13px;border-color:rgba(34,211,238,.5);color:var(--cyan);" data-wait="${t.id}">⏳ 候补</button>`
              : `<button class="btn btn-primary" style="padding:7px 14px;font-size:13px;" data-book="${t.id}">预订</button>`}
          </div>
        </div>
        <button class="fav-btn ${fav ? "on" : ""}" data-fav="${t.id}" title="收藏">${fav ? "♥" : "♡"}</button>
      </div>`;
  }).join("");
  list.querySelectorAll("[data-book]").forEach(b => b.onclick = () => openSeat(TRIPS.find(x => x.id === b.dataset.book)));
  list.querySelectorAll("[data-detail]").forEach(el => el.onclick = () => showDetail(TRIPS.find(x => x.id === el.dataset.detail)));
  list.querySelectorAll("[data-fav]").forEach(b => b.onclick = () => toggleFav(b.dataset.fav));
  list.querySelectorAll("[data-wait]").forEach(b => b.onclick = () => openWait(TRIPS.find(x => x.id === b.dataset.wait)));
  list.querySelectorAll("[data-speed]").forEach(b => b.onclick = () => openSpeed(TRIPS.find(x => x.id === b.dataset.speed)));
}

/* ================= 订单 ================= */
let orderFilter = "all";
function renderOrders() {
  const el = $("orderList");
  const list = orderFilter === "all" ? state.orders : state.orders.filter(o => o.type === orderFilter);
  $("orderCount").textContent = `共 ${list.length} 张`;
  $("statsCard").style.display = "block";
  const totalCost = state.orders.reduce((s, o) => s + o.total, 0);
  const totalSave = state.orders.reduce((s, o) => s + (o.saved || 0), 0);
  $("stTrips").textContent = state.orders.length;
  $("stCost").textContent = fmt(totalCost);
  $("stSave").textContent = fmt(totalSave);
  $("stEarn").textContent = state.earned;
  if (list.length === 0) {
    el.innerHTML = state.orders.length === 0
      ? `<div class="empty">还没有车票，先从热门线路挑一张吧</div>
         <div style="text-align:center;margin-top:10px;">
           <button class="btn btn-primary" id="emptyGoBuy" style="padding:9px 22px;font-size:13px;">🎫 立即购票</button>
         </div>`
      : `<div class="empty">该分类暂无订单</div>`;
    const gb = $("emptyGoBuy");
    if (gb) gb.onclick = () => { const sf = document.getElementById("searchForm"); if (sf) sf.scrollIntoView({ behavior: "smooth", block: "center" }); $("inputFrom").focus(); };
    return;
  }
  el.innerHTML = list.map((o, i) => `
    <div class="ticket">
      <div class="t-head">
        <span>${o.icon} ${o.no}</span>
        <span>${o.checked ? "✔ 已核票" : (o.status === "paid" ? "已出票" : "已支付")} · ${o.typeName}</span>
      </div>
      <div class="t-body">
        <div>
          <div class="t-stations">${o.from} → ${o.to}</div>
          <div class="t-info">${o.date} · ${o.dep} 出发 · ${o.seatLabel} · ${o.passenger} · ${o.id}${o.km ? " · " + o.km + "km" : ""}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--gold);font-weight:800;">${fmt(o.total)}</div>
          <div style="font-size:12px;color:var(--dim);">${o.payDesc}</div>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;flex-wrap:wrap;">
            <button class="btn btn-outline" style="padding:5px 12px;font-size:12px;border-color:rgba(251,191,36,.5);color:var(--gold);" data-tdetail="${i}">🎫 电子票</button>
            ${o.checked
              ? `<span style="color:var(--green);font-weight:700;font-size:13px;align-self:center;">✔ 已核票 · 不可退改</span>`
              : `${o.type === "metro" ? "" : `<button class="btn btn-outline" style="padding:5px 12px;font-size:12px;" data-change="${i}">改签</button>`}
            <button class="btn btn-danger" style="padding:5px 12px;font-size:12px;" data-refund="${i}">退票</button>`}
          </div>
        </div>
      </div>
    </div>`).join("");
  el.querySelectorAll("[data-refund]").forEach(b => b.onclick = () => refund(Number(b.dataset.refund)));
  el.querySelectorAll("[data-change]").forEach(b => b.onclick = () => openChange(Number(b.dataset.change)));
  el.querySelectorAll("[data-tdetail]").forEach(b => b.onclick = () => showTicketDetail(Number(b.dataset.tdetail)));
}
$("orderFilter").querySelectorAll(".mini-tab").forEach(t => {
  t.onclick = () => {
    $("orderFilter").querySelectorAll(".mini-tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    orderFilter = t.dataset.of;
    renderOrders();
  };
});

/* ================= 候补订单渲染 ================= */
function renderWaits() {
  const active = state.waits.filter(w => w.status === "waiting");
  $("waitCount").textContent = active.length;
  $("waitToggle").style.display = active.length ? "block" : "none";
}
$("waitToggle").onclick = () => {
  const el = $("waitBody");
  const waits = state.waits;
  if (!waits.length) { toast("暂无候补记录", "error"); return; }
  el.innerHTML = waits.map((w, i) => `
    <div class="wait-card">
      <div class="w-line"><span>${w.icon} ${w.no} ${w.from}→${w.to}</span><span>${w.date} ${w.dep}</span></div>
      <div class="w-line"><span>${w.seatLabel} × ${w.count}</span><span style="color:var(--gold);font-weight:700;">${fmt(w.total)}</span></div>
      <div class="w-line"><span>状态</span><span id="wStatus${i}" style="color:var(--cyan);">候补中</span></div>
      <div class="speed-bar"><i id="wBar${i}" style="width:${w.progress || 0}%"></i></div>
      <div style="text-align:right;">
        <button class="btn btn-danger" style="padding:5px 12px;font-size:12px;" data-wcancel="${i}">取消候补（全额退款）</button>
      </div>
    </div>`).join("");
  el.querySelectorAll("[data-wcancel]").forEach(b => b.onclick = () => {
    const w = state.waits[+b.dataset.wcancel];
    if (w.status !== "waiting") return;
    clearInterval(w.timer);
    w.status = "canceled";
    state.wallet += w.total;
    saveState();
    renderHeader();
    renderOrders();
    renderWaits();
    renderWaitModal();
    toast("已取消候补，全额退款 " + fmt(w.total), "success");
  });
  $("waitModal").classList.add("show");
};

/* ================= 流程：选座 ================= */
let seatIndex = 0, seats = [], passengerCount = 1, seatPref = "all";
function openSeat(trip) {
  state.selectedTrip = trip;
  seatIndex = 0;
  seats = genSeats(trip);
  $("seatMeta").innerHTML = `
    <b>${trip.from}</b> → <b>${trip.to}</b> · ${trip.no} · ${trip.dep} 出发 · ${trip.km}km<br>
    座位等级：<b>${seatLabel(trip)}</b> · 单价 <span style="color:var(--gold);font-weight:700;">${fmt(seatPrice(trip))}</span>`;
  renderSeats();
  $("seatModal").classList.add("show");
  renderSteps(1);
}
function seatLabel(trip) { return Object.keys(trip.seats)[seatIndex]; }
function seatPrice(trip) { return seatFare(trip, seatLabel(trip)); }
function genSeats(trip) {
  const rows = trip.type === "plane" ? 6 : 5, cols = trip.type === "plane" ? 3 : 4;
  const arr = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    arr.push({ label: (r + 1) + String.fromCharCode(65 + c), col: c, cols, taken: Math.random() < 0.18, selected: false });
  return arr;
}
function seatZone(s) {
  // 靠窗 = 首列或末列；过道 = 中间列（2列时即靠窗之外的过道）；中间 = 其余
  if (s.cols <= 3) {
    if (s.col === 0 || s.col === s.cols - 1) return "window";
    return "aisle";
  }
  if (s.col === 0 || s.col === s.cols - 1) return "window";
  if (s.cols === 4) return "middle";
  if (s.col === 1 || s.col === s.cols - 2) return "aisle";
  return "middle";
}
function renderSeats() {
  const grid = $("seatGrid");
  grid.innerHTML = seats.map((s, i) => {
    const isReco = seatPref !== "all" && seatZone(s) === seatPref && !s.taken;
    return `<div class="seat ${s.taken ? "taken" : ""} ${s.selected ? "selected" : ""} ${isReco ? "reco" : ""}" data-seat="${i}">${s.taken ? "×" : s.label}</div>`;
  }).join("");
  grid.querySelectorAll("[data-seat]").forEach(el => {
    el.onclick = () => {
      const s = seats[+el.dataset.seat];
      if (s.taken) { toast("该座位已被占用", "error"); return; }
      const sel = seats.filter(x => x.selected).length;
      if (s.selected) s.selected = false;
      else if (sel >= passengerCount) toast(`最多选择 ${passengerCount} 个座位`, "error");
      else s.selected = true;
      renderSeats();
    };
  });
  $("seatNextBtn").disabled = !seats.some(s => s.selected);
}
document.querySelectorAll("#prefChips [data-pref]").forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll("#prefChips [data-pref]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    seatPref = chip.dataset.pref;
    renderSeats();
  };
});
$("seatNextBtn").onclick = () => {
  const sel = seats.filter(s => s.selected).length;
  if (!sel) { toast("请至少选择一个座位", "error"); return; }
  passengerCount = sel;
  $("pCount").textContent = sel;
  $("seatModal").classList.remove("show");
  $("passengerModal").classList.add("show");
  renderSteps(2);
  renderContacts();
};

/* ================= 流程：乘客 ================= */
function renderContacts() {
  const box = $("contactQuick");
  if (state.contacts.length === 0) {
    box.innerHTML = `<button class="chip">张三</button><button class="chip">李四</button>`;
    box.querySelectorAll(".chip").forEach((b, i) => b.onclick = () => fillContact(["张三", "李四"][i]));
    return;
  }
  box.innerHTML = state.contacts.map((c, i) => `<button class="chip" data-c="${i}">${c.name}</button>`).join("");
  box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => fillContact(state.contacts[+b.dataset.c]));
}
function fillContact(c) {
  $("pName").value = c.name;
  $("pId").value = c.id || "";
  $("pPhone").value = c.phone || "";
}
$("pMinus").onclick = () => { if (passengerCount > 1) { passengerCount--; $("pCount").textContent = passengerCount; syncSeats(); } };
$("pPlus").onclick = () => { if (passengerCount < 5) { passengerCount++; $("pCount").textContent = passengerCount; syncSeats(); } };
function syncSeats() {
  let sel = seats.filter(s => s.selected).length;
  if (sel > passengerCount) {
    for (let i = seats.length - 1; i >= 0 && sel > passengerCount; i--)
      if (seats[i].selected) { seats[i].selected = false; sel--; }
  }
}
$("pNextBtn").onclick = () => {
  const name = $("pName").value.trim(), id = $("pId").value.trim(), phone = $("pPhone").value.trim();
  if (!name || !/^[\u4e00-\u9fa5·A-Za-z ]{2,20}$/.test(name)) { toast("请填写正确姓名", "error"); return; }
  if (!id) { toast("请填写证件号", "error"); return; }
  if (!/^1\d{10}$/.test(phone)) { toast("手机号格式不正确", "error"); return; }
  if (!state.contacts.some(c => c.name === name)) {
    state.contacts.push({ name, id, phone });
    if (state.contacts.length > 12) state.contacts.shift();
    saveState();
  }
  state.curName = name;
  $("passengerModal").classList.remove("show");
  $("payModal").classList.add("show");
  renderSteps(3);
  renderPaySummary();
};

/* ================= 流程：支付 ================= */
let payMethod = "wallet", selectedCoupon = null;
function orderAmount() { const t = state.selectedTrip; return Math.round(seatPrice(t) * passengerCount); }
function memberRate() { return memberInfo().lv.rate; }
function couponListUsable(total) { return state.coupons.filter(c => !c.used && total >= c.cond); }

function renderPaySummary() {
  const t = state.selectedTrip;
  const sel = seats.filter(s => s.selected);
  const base = orderAmount();
  $("sRoute").textContent = `${t.no} · ${t.from} → ${t.to}`;
  $("sDep").textContent = `${state.searchDate} ${t.dep}`;
  $("sArr").textContent = `${calcArr(t.dep, t.dur)} 到达`;
  $("sKm").textContent = `${t.km} km`;
  $("sSeats").textContent = `${seatLabel(t)} × ${sel.length}（${sel.map(s => s.label).join("、")}）`;
  $("sPassenger").textContent = `${state.curName} × ${passengerCount}`;
  $("sSubtotal").textContent = fmt(base);

  const usable = couponListUsable(base);
  if (payMethod === "coupon") selectedCoupon = usable[0] || null;
  else selectedCoupon = null;
  const couponVal = selectedCoupon ? selectedCoupon.val : 0;
  $("couponRow").style.display = couponVal ? "flex" : "none";
  $("sCoupon").textContent = couponVal ? "-" + fmt(couponVal) + "（" + selectedCoupon.cond + "可用）" : "";

  const afterCoupon = Math.max(0, base - couponVal);
  const memberVal = Math.round((afterCoupon - afterCoupon * memberRate()));
  $("memberRow").style.display = memberVal > 0 ? "flex" : "none";
  $("sMember").textContent = memberVal > 0 ? "-" + fmt(memberVal) + `（${Math.round(memberRate() * 100)}折）` : "";

  const totalBeforePoints = Math.max(0, afterCoupon - memberVal);
  const maxPts = Math.floor(state.points / 100);
  const usePts = payMethod === "points" ? Math.min(maxPts, totalBeforePoints * 100) : 0;
  const ptsVal = usePts / 100;
  $("pointsRow").style.display = ptsVal > 0.001 ? "flex" : "none";
  $("sPoints").textContent = ptsVal > 0.001 ? "-" + fmt(ptsVal) + `（${usePts}分）` : "";

  const total = Math.max(0, totalBeforePoints - ptsVal);
  $("sTotal").textContent = fmt(total);

  $("payWalletSub").textContent = `可用 ${fmt(state.wallet)}`;
  $("payPointsSub").textContent = `${state.points} 积分（可抵 ${fmt(Math.floor(maxPts / 100) / 100 === 0 ? 0 : maxPts / 100)}）`;
  $("payCouponSub").textContent = usable.length ? `可选 ${usable.length} 张券` : "无可用券";

  $("payBtn").disabled = total > state.wallet;
  $("pointsHint").style.display = "none";
  if (total > state.wallet) {
    $("pointsHint").style.display = "block";
    $("pointsHint").innerHTML = `钱包余额不足（还差 <b>${fmt(total - state.wallet)}</b>）。<a href="javascript:void(0)" id="hintSign" style="color:#8ab4ff;">签到</a> / <a href="javascript:void(0)" id="hintRecharge" style="color:#8ab4ff;">充值</a> 获取积分。`;
    const h1 = $("hintSign"), h2 = $("hintRecharge");
    if (h1) h1.onclick = () => { $("payModal").classList.remove("show"); $("pointsModal").classList.add("show"); renderPoints(); };
    if (h2) h2.onclick = () => { $("payModal").classList.remove("show"); renderRechargeModal(); $("rechargeModal").classList.add("show"); };
  }
}
document.querySelectorAll(".pay-card").forEach(card => {
  card.onclick = () => {
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    payMethod = card.dataset.pay;
    renderPaySummary();
  };
});

function pay() {
  const t = state.selectedTrip;
  const base = orderAmount();
  const couponVal = selectedCoupon ? selectedCoupon.val : 0;
  const afterCoupon = Math.max(0, base - couponVal);
  const memberVal = Math.round((afterCoupon - afterCoupon * memberRate()));
  const totalBeforePoints = Math.max(0, afterCoupon - memberVal);
  const maxPts = Math.floor(state.points / 100);
  const usePts = payMethod === "points" ? Math.min(maxPts, totalBeforePoints * 100) : 0;
  const ptsVal = usePts / 100;
  const total = Math.max(0, totalBeforePoints - ptsVal);

  if (total > state.wallet) { toast("钱包余额不足，请先充值或签到赚积分", "error"); return; }

  const payDesc = [];
  state.wallet = Math.round((state.wallet - total) * 100) / 100;
  if (usePts > 0) { state.points -= usePts; payDesc.push("积分 -" + usePts); }
  if (couponVal > 0) { selectedCoupon.used = true; payDesc.push("券 -" + fmt(couponVal)); }
  if (memberVal > 0) payDesc.push("会员 " + Math.round(memberRate() * 100) + "折");
  if (total > 0.001) payDesc.push("钱包 " + fmt(total));

  const earn = Math.floor(total * 10);
  state.points += earn;
  state.earned += earn;

  const order = {
    id: "ORD" + Date.now().toString().slice(-8),
    icon: t.type === "train" ? "🚄" : t.type === "plane" ? "✈️" : "🚇",
    typeName: t.type === "train" ? "火车票" : t.type === "plane" ? "机票" : "地铁票",
    no: t.no, from: t.from, to: t.to, type: t.type, tripId: t.id,
    date: state.searchDate, dep: t.dep, km: t.km,
    seatLabel: seatLabel(t) + " × " + seats.filter(s => s.selected).length,
    passenger: state.curName,
    total, saved: couponVal + memberVal,
    payDesc: payDesc.join(" + ") || "全免",
    status: "paid", qr: orderQr(),
  };
  state.orders.unshift(order);
  saveState();

  $("payModal").classList.remove("show");
  renderHeader();
  renderOrders();
  renderSteps(4);
  showDone(order, earn);
  toast("支付成功，返 " + earn + " 积分", "success");
}
$("payBtn").onclick = pay;

function orderQr() { return "极速出行|" + Math.random().toString(36).slice(2, 12); }

/* ================= 候补购票 ================= */
let waitTrip = null, waitCount = 1, waitSeatIdx = 0, waitBoost = 0;
function openWait(trip) {
  waitTrip = trip;
  waitCount = 1;
  waitSeatIdx = 0;
  waitBoost = 0;
  renderWaitBody();
  $("waitModal").classList.add("show");
}
function renderWaitBody() {
  const t = waitTrip;
  const labels = Object.keys(t.seats);
  const lbl = labels[waitSeatIdx];
  const fare = seatFare(t, lbl);
  const base = fare * waitCount;
  const rate = 20 + waitBoost;
  $("waitBody").innerHTML = `
    <div style="font-size:14px;line-height:1.9;margin-bottom:12px;">
      <b>${t.no}</b> ${t.from} → ${t.to} · ${t.dep} 出发 · ${t.km}km<br>
      <span style="color:var(--dim);">该班次今日已售罄，候补出票概率 <b style="color:var(--cyan);">${rate}%</b></span>
    </div>
    <div class="form-grid">
      <div class="field">
        <label>座位等级</label>
        <select id="waitSeat">
          ${labels.map((l, i) => `<option value="${i}" ${i === waitSeatIdx ? "selected" : ""}>${l} ${fmt(seatFare(t, l))}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>候补人数</label>
        <div class="count-control">
          <button type="button" id="wMinus">−</button>
          <span id="wCount" style="font-size:16px;font-weight:700;">1</span>
          <button type="button" id="wPlus">＋</button>
        </div>
      </div>
    </div>
    <div class="section-title" style="margin-top:14px;">加速服务（提高出票率）</div>
    <div class="pay-options" id="boostOpts">
      <div class="pay-card active" data-boost="0">
        <div class="pc-title">普通候补</div>
        <div class="pc-sub">免费 · 成功率 20%</div>
      </div>
      <div class="pay-card" data-boost="45">
        <div class="pc-title">加速包</div>
        <div class="pc-sub">200 积分 · 成功率 65%</div>
      </div>
      <div class="pay-card" data-boost="75">
        <div class="pc-title">VIP 极速</div>
        <div class="pc-sub">¥10 或 1000积分 · 成功率 95%</div>
      </div>
    </div>
    <div class="summary-row total"><span>预付款（全额，出票失败可退）</span><span class="amount" id="wTotal">${fmt(base)}</span></div>
    <div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-outline" data-close="waitModal">取消</button>
      <button class="btn btn-success" id="waitConfirm">提交候补</button>
    </div>`;
  $("waitSeat").onchange = e => { waitSeatIdx = +e.target.value; renderWaitBody(); };
  $("wMinus").onclick = () => { if (waitCount > 1) { waitCount--; renderWaitBody(); } };
  $("wPlus").onclick = () => { if (waitCount < 5) { waitCount++; renderWaitBody(); } };
  $("boostOpts").querySelectorAll("[data-boost]").forEach(c => c.onclick = () => {
    $("boostOpts").querySelectorAll(".pay-card").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    waitBoost = +c.dataset.boost;
    renderWaitBody();
  });
  $("waitConfirm").onclick = submitWait;
}
function submitWait() {
  const t = waitTrip;
  const lbl = Object.keys(t.seats)[waitSeatIdx];
  const base = seatFare(t, lbl) * waitCount;
  const boostCost = waitBoost === 45 ? 200 : waitBoost === 75 ? (state.points >= 1000 ? 1000 : null) : 0;
  if (waitBoost === 75 && boostCost === null) { toast("积分不足，VIP 加速需 1000 积分", "error"); return; }
  if (base > state.wallet) { toast("钱包余额不足以支付预付款", "error"); return; }
  state.wallet = Math.round((state.wallet - base) * 100) / 100;
  if (waitBoost === 45) { if (state.points < 200) { toast("积分不足 200", "error"); return; } state.points -= 200; }
  if (waitBoost === 75 && boostCost === 1000) state.points -= 1000;
  state.earned += base * 10;

  const w = {
    id: "W" + Date.now().toString().slice(-8),
    icon: t.type === "train" ? "🚄" : t.type === "plane" ? "✈️" : "🚇",
    no: t.no, from: t.from, to: t.to, type: t.type, tripId: t.id,
    date: state.searchDate, dep: t.dep, km: t.km,
    seatLabel: lbl, count: waitCount, total: base,
    boost: waitBoost, progress: 0, status: "waiting", timer: null,
  };
  state.waits.unshift(w);
  saveState();
  $("waitModal").classList.remove("show");
  renderHeader();
  toast("候补已提交，正在为你排队...", "success");

  // 模拟候补排队
  const speed = 3500 + Math.random() * 2500;
  const successRate = 20 + waitBoost;
  w.timer = setInterval(() => {
    w.progress = Math.min(100, w.progress + 8 + Math.random() * 10);
    const succ = Math.random() * 100 < successRate;
    renderHeader();
    renderWaits();
    if (succ || w.progress >= 100) {
      clearInterval(w.timer);
      if (succ) {
        w.status = "success";
        const order = {
          id: "ORD" + Date.now().toString().slice(-8),
          icon: w.icon, typeName: w.type === "train" ? "火车票" : w.type === "plane" ? "机票" : "地铁票",
          no: w.no, from: w.from, to: w.to, type: w.type, tripId: w.tripId,
          date: w.date, dep: w.dep, km: w.km,
          seatLabel: w.seatLabel + " × " + w.count,
          passenger: state.curName || "候补乘客",
          total: w.total, saved: 0, payDesc: "候补出票（已付）",
          status: "paid", qr: orderQr(),
        };
        state.orders.unshift(order);
        toast("🎉 候补出票成功：" + w.no, "success");
      } else {
        w.status = "failed";
        state.wallet = Math.round((state.wallet + w.total) * 100) / 100;
        toast("候补失败，预付款已全额退回", "error");
      }
      saveState();
      renderHeader();
      renderOrders();
      renderWaits();
    }
  }, speed / 8);
}

/* ================= 抢票加速 ================= */
let speedTrip = null;
function openSpeed(trip) {
  speedTrip = trip;
  renderSpeedBody();
  $("speedModal").classList.add("show");
}
function renderSpeedBody() {
  const t = speedTrip;
  $("speedBody").innerHTML = `
    <div style="font-size:14px;line-height:1.9;margin-bottom:10px;">
      <b>${t.no}</b> ${t.from} → ${t.to} · 余票仅剩 <b style="color:var(--red);">${t.remain}</b> 张 · ${t.dep} 出发
    </div>
    <div class="speed-bar"><i id="speedProg" style="width:10%"></i></div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--dim);">
      <span id="speedInfo">正在连接抢票通道...</span><span id="speedPct">10%</span>
    </div>
    <div style="margin-top:14px;display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-outline" data-close="speedModal">取消</button>
      <button class="btn btn-primary" id="speedGo">开始抢票</button>
    </div>`;
  $("speedGo").onclick = () => {
    const bar = $("speedProg"), info = $("speedInfo"), pct = $("speedPct");
    let p = 10;
    const iv = setInterval(() => {
      p += 6 + Math.random() * 12;
      if (p > 100) p = 100;
      bar.style.width = p + "%";
      pct.textContent = p + "%";
      if (p < 40) info.textContent = "正在抢票，请稍候...";
      else if (p < 70) info.textContent = "与 128 人竞争，加油！";
      else if (p < 95) info.textContent = "即将锁定座位...";
      else info.textContent = "抢票成功！";
      if (p >= 100) {
        clearInterval(iv);
        t.remain = Math.max(0, t.remain - 1);
        setTimeout(() => {
          $("speedModal").classList.remove("show");
          openSeat(t);
          toast("🎉 抢票成功，为你锁定座位，请尽快支付", "success");
        }, 400);
      }
    }, 220);
  };
}

/* ================= 出票 ================= */
function showDone(order, earn) {
  drawQR(order.qr);
  $("doneInfo").innerHTML = `
    <div><b>${order.icon} ${order.no}</b>　${order.from} → ${order.to}${order.km ? " · " + order.km + "km" : ""}</div>
    <div>${order.date} ${order.dep} 出发 · ${order.seatLabel}</div>
    <div>乘客：${order.passenger} · 订单号：${order.id}</div>
    <div>实付：<b style="color:var(--gold);">${fmt(order.total)}</b>（${order.payDesc}）</div>`;
  $("doneEarn").textContent = "本次消费获得 +" + earn + " 积分";
  $("doneModal").classList.add("show");
}
function realQRImg(text, px) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;";
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    const qr = qrcode(0, "M");
    qr.addData(text || "极速出行", "Byte");
    qr.make();
    const img = document.createElement("img");
    img.src = qr.createDataURL(4, 2);
    img.alt = "车票二维码";
    img.style.cssText = "width:100%;height:100%;image-rendering:pixelated;display:block;border-radius:6px;";
    wrap.appendChild(img);
  } catch (e) {
    wrap.innerHTML = '<div style="font-size:12px;color:#94a3b8;">二维码生成失败</div>';
  }
  return wrap;
}
function drawQR(text) {
  const el = $("qrSvg");
  if (!el) return;
  el.innerHTML = "";
  el.appendChild(realQRImg(text, 160));
}

$("doneAgain").onclick = () => {
  $("doneModal").classList.remove("show");
  renderSteps(0);
  state.selectedTrip = null;
  renderResults();
};

/* ================= 退票 / 改签 ================= */
function refund(idx) {
  const o = state.orders[idx];
  if (!o) return;
  if (o.checked) { toast("该车票已核票，无法退款", "error"); return; }
  if (!confirm(`确定退掉这张票吗？\n${o.no} ${o.from}→${o.to} ${fmt(o.total)}\n退款 80% 退回钱包。`)) return;
  state.wallet = Math.round((state.wallet + o.total * 0.8) * 100) / 100;
  state.orders.splice(idx, 1);
  saveState();
  renderHeader();
  renderOrders();
  toast("退票成功，钱包已退款（80%）", "success");
}
function openChange(idx) {
  state.changeIdx = idx;
  const o = state.orders[idx];
  if (o.checked) { toast("该车票已核票，无法改签", "error"); return; }
  const alts = TRIPS.filter(t => t.type === o.type && t.from === o.from && t.to === o.to && t.id !== o.tripId);
  const rows = alts.map(t => {
    const diff = Math.round((t.price - o.total));
    return `
      <div class="result-item" style="padding:12px;">
        <div>
          <div style="font-weight:700;">${t.no} ${t.dep} → ${calcArr(t.dep, t.dur)}</div>
          <div style="font-size:12px;color:var(--dim);">${t.tag} · 历时 ${durTxt(t.dur)} · 余票 ${t.remain} · ${t.km}km</div>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--gold);font-weight:700;">${fmt(t.price)}</div>
          <button class="btn ${diff > 0 ? "btn-primary" : "btn-success"}" style="margin-top:6px;padding:5px 12px;font-size:12px;" data-pick="${t.id}">${diff > 0 ? "改签 +" + fmt(diff) : diff < 0 ? "改签 -" + fmt(-diff) : "改签 免差价"}</button>
        </div>
      </div>`;
  }).join("") || `<div class="empty">没有可改签的同一线路班次</div>`;
  $("changeBody").innerHTML = `
    <div style="font-size:13px;margin-bottom:12px;padding:10px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;">
      原班次 <b>${o.no}</b> · ${o.from}→${o.to} · ${o.date} ${o.dep} · 实付 ${fmt(o.total)}<br>
      <span style="color:var(--dim);">选择同一线路的其他班次，差价多退少补</span>
    </div>
    ${rows}`;
  $("changeBody").querySelectorAll("[data-pick]").forEach(b => b.onclick = () => doChange(b.dataset.pick));
  $("changeModal").classList.add("show");
}
function doChange(tripId) {
  const o = state.orders[state.changeIdx];
  if (!o) return;
  const t = TRIPS.find(x => x.id === tripId);
  const diff = Math.round((t.price - o.total));
  if (diff > 0 && state.wallet < diff) { toast("钱包余额不足以补差价", "error"); return; }
  if (diff > 0) state.wallet = Math.round((state.wallet - diff) * 100) / 100;
  o.no = t.no; o.dep = t.dep; o.total = t.price; o.tripId = t.id; o.km = t.km;
  o.payDesc = "已改签" + (diff > 0 ? " 补差价 " + fmt(diff) : diff < 0 ? " 退差价 " + fmt(-diff) : " 免差价");
  saveState();
  renderHeader();
  renderOrders();
  $("changeModal").classList.remove("show");
  toast("改签成功", "success");
}

/* ================= 班次详情 ================= */
function genStops(trip) {
  const n = 2 + Math.floor(Math.random() * 3);
  const mids = STATION_CITIES.filter(c => c !== trip.from && c !== trip.to).sort(() => Math.random() - .5).slice(0, n);
  let mins = trip.dep.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
  const rows = [{ st: trip.from, arr: "--", dep: trip.dep }];
  for (const c of mids) {
    mins += 18 + Math.floor(Math.random() * 14);
    rows.push({ st: c, arr: fmt2(mins), dep: fmt2(mins + 5) });
    mins += 5;
  }
  mins += 25 + Math.floor(Math.random() * 10);
  rows.push({ st: trip.to, arr: fmt2(mins), dep: "--" });
  return rows;
}
function showDetail(trip) {
  const stops = genStops(trip);
  const stopHtml = stops.map((s, i) => `
    <div class="stop-row">
      <div class="dot"></div>
      <span class="st">${s.st}</span>
      <span class="tm">${i === 0 ? "始发" : i === stops.length - 1 ? "终到" : "到达 " + s.arr}</span>
      <span class="tm">${s.dep === "--" ? "" : "出发 " + s.dep}</span>
    </div>`).join("");
  const seatRows = Object.keys(trip.seats).map(s => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.06);">
      <td style="padding:8px 6px;"><b>${s}</b></td>
      <td style="padding:8px 6px;color:var(--muted);">${fmt(seatFare(trip, s))}</td>
      <td style="padding:8px 6px;color:var(--muted);">${trip.remain <= 0 ? "售罄" : "余票 " + Math.max(0, trip.remain - Math.floor(Math.random() * 40))}</td>
    </tr>`).join("");
  const facility = trip.type === "plane"
    ? `<span class="tag">🧳 行李额 20kg</span><span class="tag">🍱 免费餐食</span><span class="tag">🔌 机上充电</span>`
    : `<span class="tag">📶 全程 WiFi</span><span class="tag">🍚 餐车</span><span class="tag">🔌 插座</span>`;
  $("detailBody").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="font-size:20px;font-weight:800;">${trip.no} <span style="font-size:13px;color:var(--dim);font-weight:400;">${trip.tag}</span></div>
      <span class="tag orange">${trip.type === "train" ? "火车" : trip.type === "plane" ? "飞机" : "地铁"}</span>
    </div>
    <div style="font-size:15px;color:var(--muted);">${trip.from} → ${trip.to} · ${trip.km}km</div>
    <div class="detail-grid">
      <div class="detail-cell"><div class="k">出发</div><div class="v">${trip.dep}</div></div>
      <div class="detail-cell"><div class="k">到达</div><div class="v">${calcArr(trip.dep, trip.dur)}</div></div>
      <div class="detail-cell"><div class="k">历时</div><div class="v" style="font-size:15px;">${durTxt(trip.dur)}</div></div>
      <div class="detail-cell"><div class="k">准点率</div><div class="v" style="font-size:15px;color:var(--green);">${trip.ontime}%</div></div>
    </div>
    <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">${facility}</div>
    <div class="section-title" style="margin-top:14px;">经停站</div>
    <div class="stop-list">${stopHtml}</div>
    <div class="section-title" style="margin-top:14px;">票价</div>
    <table style="width:100%;font-size:14px;">${seatRows}</table>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
      <button class="btn btn-outline" id="detailArrival" style="border-color:rgba(251,191,36,.5);color:var(--gold);">🚗 到站服务</button>
      ${trip.remain <= 0
        ? `<button class="btn btn-outline" style="border-color:rgba(34,211,238,.5);color:var(--cyan);" id="detailWait">⏳ 候补</button>`
        : `<button class="btn btn-primary" id="detailBook">立即预订</button>`}
    </div>`;
  const db = $("detailBody").querySelector("#detailBook");
  if (db) db.onclick = () => { $("detailModal").classList.remove("show"); openSeat(trip); };
  const dw = $("detailBody").querySelector("#detailWait");
  if (dw) dw.onclick = () => { $("detailModal").classList.remove("show"); openWait(trip); };
  const da = $("detailBody").querySelector("#detailArrival");
  if (da) da.onclick = () => openArrival(trip);
  $("detailModal").classList.add("show");
}

/* ================= 收藏 ================= */
function toggleFav(id) {
  const i = state.favs.indexOf(id);
  if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
  saveState();
  renderHeader();
  renderResults();
  toast(state.favs.includes(id) ? "已加入收藏 ❤️" : "已取消收藏", state.favs.includes(id) ? "" : "error");
}
function renderFavs() {
  const el = $("favList");
  if (!state.favs.length) { el.innerHTML = `<div class="empty">还没有收藏的班次，点结果列表里的 ♡ 收藏</div>`; return; }
  el.innerHTML = state.favs.map(id => {
    const t = TRIPS.find(x => x.id === id);
    if (!t) return "";
    return `
      <div class="quick-item">
        <div>
          <div style="font-weight:700;">${t.no} ${t.from} → ${t.to}</div>
          <div style="font-size:12px;color:var(--dim);">${t.dep} 出发 · ${durTxt(t.dur)} · ${t.km}km</div>
        </div>
        <div style="text-align:right;">
          <div class="q-price">${fmt(t.price)}起</div>
          <button class="btn btn-outline" style="padding:4px 12px;font-size:12px;margin-top:4px;" data-favbook="${t.id}">预订</button>
        </div>
      </div>`;
  }).join("");
  el.querySelectorAll("[data-favbook]").forEach(b => b.onclick = () => { $("favModal").classList.remove("show"); openSeat(TRIPS.find(x => x.id === b.dataset.favbook)); });
}
$("favToggle").onclick = () => { renderFavs(); $("favModal").classList.add("show"); };

/* ================= 签到 ================= */
function renderPoints() {
  $("pmPoints").textContent = state.points;
  $("pmEarn").textContent = state.earned;
  const today = normDate();
  if (state.lastSign === today) {
    $("signState").innerHTML = `✅ 今日已签到，连续 <b>${state.signDays}</b> 天`;
    $("signBtn").disabled = true;
    $("signBtn2").disabled = true;
  } else {
    $("signState").innerHTML = state.signDays > 0 ? `🔥 已连续签到 <b>${state.signDays}</b> 天` : `开始连续签到，第 7 天额外 +300 积分`;
    $("signBtn").disabled = false;
    $("signBtn2").disabled = false;
  }
}
function doSign() {
  const today = normDate();
  if (state.lastSign === today) { toast("今天已经签过到啦", "error"); return; }
  if (state.lastSign !== normDate(new Date(Date.now() - 86400000))) state.signDays = 0;
  state.signDays++;
  let gain = 100;
  if (state.signDays % 7 === 0) gain += 300;
  state.points += gain;
  state.earned += gain;
  state.lastSign = today;
  saveState();
  renderHeader();
  renderPoints();
  toast("签到成功，+ " + gain + " 积分" + (state.signDays % 7 === 0 ? "（连续 7 天奖励！）" : ""), "success");
}
$("signBtn").onclick = doSign;
$("signBtn2").onclick = () => { doSign(); $("pointsModal").classList.remove("show"); };
$("pointsToggle").onclick = () => { renderPoints(); $("pointsModal").classList.add("show"); };

/* ================= 账号中心 / 充值中心 ================= */
$("userToggle").onclick = () => {
  $("uName").value = state.name;
  $("uPhone").value = state.phone;
  $("ucWallet").textContent = fmt(state.wallet);
  $("ucPoints").textContent = state.points;
  $("levelTable").innerHTML = LEVELS.map(l => `${l.name}：成长值 ≥${l.g} · 享 ${Math.round(l.rate * 100)} 折`).join("<br>");
  $("userModal").classList.add("show");
};
$("uSave").onclick = () => {
  const n = $("uName").value.trim();
  const p = $("uPhone").value.trim();
  if (!n) { toast("请输入昵称", "error"); return; }
  if (p && !/^1\d{10}$/.test(p)) { toast("手机号格式不正确", "error"); return; }
  state.name = n;
  if (p) state.phone = p;
  saveState();
  renderHeader();
  toast("资料已保存");
};
$("uLogout").onclick = () => {
  state.name = "游客";
  state.phone = "";
  saveState();
  renderHeader();
  toast("已退出登录");
};

/* ===== 充值中心 ===== */
let rcType = "wallet", rcAmount = 100, rcPay = "wechat";
const RC_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000, 100000, 999999];
function renderRechargeModal() {
  $("rcWallet").textContent = fmt(state.wallet);
  $("rcPoints").textContent = state.points;
  $("rcAmounts").innerHTML = RC_AMOUNTS.map(a =>
    `<button class="chip ${rcAmount === a ? "active" : ""}" data-rc-amt="${a}" style="padding:13px 0;text-align:center;font-size:15px;font-weight:700;">¥${a}</button>`).join("");
  $("rcAmounts").querySelectorAll("[data-rc-amt]").forEach(c => c.onclick = () => {
    rcAmount = +c.dataset.rcAmt;
    $("rcCustom").value = "";
    renderRechargeModal();
  });
  $("rcCustom").value = RC_AMOUNTS.includes(rcAmount) ? "" : rcAmount;
  const his = (state.recharges || []).slice(0, 6);
  $("rcHistory").innerHTML = his.length
    ? his.map(h => `
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed rgba(255,255,255,.06);">
        <span>${h.time} · ${h.type === "wallet" ? "💳 钱包" : "⭐ 积分"} · ${h.pay === "wechat" ? "微信" : "支付宝"}</span>
        <span style="color:var(--gold);font-weight:700;">${h.type === "wallet" ? "+¥" + h.amount : "+" + h.amount * 100 + " 积分"}</span>
      </div>`).join("")
    : `<div style="padding:6px 0;color:var(--dim);">暂无充值记录</div>`;
}
$("rechargeBtn").onclick = () => {
  renderRechargeModal();
  $("rechargeModal").classList.add("show");
};
$("rcType").querySelectorAll("[data-rc-type]").forEach(c => c.onclick = () => {
  $("rcType").querySelectorAll(".pay-card").forEach(x => x.classList.remove("active"));
  c.classList.add("active");
  rcType = c.dataset.rcType;
});
$("rcPay").querySelectorAll("[data-rc-pay]").forEach(c => c.onclick = () => {
  $("rcPay").querySelectorAll(".pay-card").forEach(x => x.classList.remove("active"));
  c.classList.add("active");
  rcPay = c.dataset.rcPay;
});
$("rcCustomBtn").onclick = () => {
  const v = Math.floor(+$("rcCustom").value);
  if (!v || v <= 0) { toast("请输入有效金额", "error"); return; }
  rcAmount = v;
  renderRechargeModal();
  toast("已设置自定义金额 ¥" + v);
};
$("rcConfirm").onclick = () => {
  if (!rcAmount || rcAmount <= 0) { toast("请选择或输入充值金额", "error"); return; }
  const btn = $("rcConfirm");
  btn.disabled = true;
  btn.textContent = "支付中...";
  setTimeout(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (rcType === "wallet") {
      state.wallet = Math.round((state.wallet + rcAmount) * 100) / 100;
    } else {
      state.points += Math.floor(rcAmount * 100);
      state.earned += Math.floor(rcAmount * 100);
    }
    state.recharges.unshift({ time: timeStr, type: rcType, amount: rcAmount, pay: rcPay });
    saveState();
    renderHeader();
    renderRechargeModal();
    btn.disabled = false;
    btn.textContent = "立即充值";
    toast(rcType === "wallet" ? "钱包充值成功 +" + fmt(rcAmount) : "积分充值成功 +" + Math.floor(rcAmount * 100), "success");
  }, 900);
};

/* ================= 联系人管理 ================= */
function renderContactMgr() {
  const el = $("cList");
  if (!state.contacts.length) { el.innerHTML = `<div class="empty">暂无联系人</div>`; return; }
  el.innerHTML = state.contacts.map((c, i) => `
    <div class="contact-row">
      <div>
        <div class="c-name">${c.name}</div>
        <div class="c-sub">${c.phone || ""}${c.id ? " · " + c.id : ""}</div>
      </div>
      <button class="btn btn-danger" style="padding:5px 12px;font-size:12px;" data-cdel="${i}">删除</button>
    </div>`).join("");
  el.querySelectorAll("[data-cdel]").forEach(b => b.onclick = () => {
    state.contacts.splice(+b.dataset.cdel, 1);
    saveState();
    renderContactMgr();
    renderContacts();
  });
}
$("contactManage").onclick = () => { renderContactMgr(); $("contactModal").classList.add("show"); };
$("cAdd").onclick = () => {
  const n = $("cNewName").value.trim(), p = $("cNewPhone").value.trim();
  if (!n) { toast("请输入姓名", "error"); return; }
  if (!/^1\d{10}$/.test(p)) { toast("手机号格式不正确", "error"); return; }
  state.contacts.push({ name: n, phone: p, id: "" });
  if (state.contacts.length > 12) state.contacts.shift();
  saveState();
  $("cNewName").value = ""; $("cNewPhone").value = "";
  renderContactMgr();
  renderContacts();
  toast("已添加联系人");
};

/* ================= 优惠券中心 ================= */
const COUPON_DEFS = [
  { id: "c1", name: "满 100 减 10", cond: 100, val: 10 },
  { id: "c2", name: "满 200 减 30", cond: 200, val: 30 },
  { id: "c3", name: "满 500 减 80", cond: 500, val: 80 },
];
function renderCoupons() {
  const el = $("couponList");
  el.innerHTML = COUPON_DEFS.map(d => {
    const owned = state.coupons.find(c => c.id === d.id);
    const used = owned && owned.used;
    return `
      <div class="coupon ${used ? "used" : ""}">
        <div>
          <div class="c-val">¥${d.val}</div>
          <div class="c-cond">满 ${d.cond} 可用 · ${d.name}</div>
        </div>
        <button class="btn ${used ? "btn-outline" : "btn-success"}" style="padding:6px 14px;font-size:13px;" data-claim="${d.id}" ${used ? "disabled" : ""}>${owned ? (used ? "已使用" : "已领取") : "领取"}</button>
      </div>`;
  }).join("");
  el.querySelectorAll("[data-claim]").forEach(b => b.onclick = () => {
    const d = COUPON_DEFS.find(x => x.id === b.dataset.claim);
    if (state.coupons.some(c => c.id === d.id)) { toast("该券已领取", "error"); return; }
    state.coupons.push({ ...d, used: false });
    saveState();
    renderCoupons();
    toast("领取成功：" + d.name);
  });
}

/* ================= 搜索 ================= */
function getStopValues() {
  return [...document.querySelectorAll(".stopInput")].map(i => i.value.trim()).filter(v => v);
}
/* ================= 12306 实时数据 ================= */
const LIVE_PROXY = "http://127.0.0.1:8899";
let __liveProbe = null; // null=未测 true=可用 false=本次不可用
function liveEnabled() { return __liveProbe !== false; }
function setLiveStatus(mode, count) {
  const el = $("liveTag");
  if (!el) return;
  if (mode === "on") { el.textContent = "🟢 12306真实数据（这是真的）· " + (count || "") + "趟"; el.className = "live-tag on"; el.style.display = "inline-block"; }
  else if (mode === "loading") { el.textContent = "⏳ 查询12306中…"; el.className = "live-tag loading"; el.style.display = "inline-block"; }
  else if (mode === "off") { el.textContent = "🟡 模拟数据（没连上12306，这是假的）· 重试"; el.className = "live-tag off"; el.style.display = "inline-block"; el.onclick = () => { __liveProbe = null; doSearch(); }; }
  else if (mode === "wind") { el.textContent = "🟡 12306暂时限流（这是假的）· 过会儿再试"; el.className = "live-tag off"; el.style.display = "inline-block"; el.onclick = () => { __liveProbe = null; doSearch(); }; }
  else if (mode === "busy") { el.textContent = "🟡 查询太快了（歇几秒再点）· 重试"; el.className = "live-tag off"; el.style.display = "inline-block"; el.onclick = () => { __liveProbe = null; doSearch(); }; }
  else { el.style.display = "none"; }
}
// 打开网页时自动启动本地代理（通过 fastgo:// 协议拉起，无需手动双击）
async function ensureProxy() {
  const pingOk = async () => {
    try {
      const c = new AbortController();
      const to = setTimeout(() => c.abort(), 1500);
      const r = await fetch(LIVE_PROXY + "/api/ping", { method: "GET", signal: c.signal });
      clearTimeout(to);
      return r && r.ok;
    } catch (e) { return false; }
  };
  if (await pingOk()) return;          // 代理已在跑
  try {                                 // 没跑 → 自动触发网页启动通道
    const a = document.createElement("a");
    a.href = "fastgo://start";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {}
  for (let i = 0; i < 8; i++) {         // 等代理起来
    await new Promise(res => setTimeout(res, 800));
    if (await pingOk()) return;
  }
  const t = $("liveTag");               // 浏览器拦了 → 显示一键启动按钮
  if (t) {
    t.textContent = "▶ 点我启动12306代理";
    t.className = "live-tag off";
    t.style.display = "inline-block";
    t.onclick = () => {
      try {
        const a = document.createElement("a");
        a.href = "fastgo://start";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {}
      setTimeout(() => { __liveProbe = null; doSearch(); }, 2500);
    };
  }
}
async function doSearchLive(skipHistory) {
  const f = $("inputFrom").value.trim() || "北京";
  const t = $("inputTo").value.trim() || "上海";
  const date = $("inputDate").value || normDate();
  state.from = f; state.to = t;
  setLiveStatus("loading");
  const fetchT = async (u, ms) => {
    const c = new AbortController();
    const to = setTimeout(() => c.abort(), ms);
    try { return await fetch(u, { method: "GET", signal: c.signal }); }
    finally { clearTimeout(to); }
  };
  try {
    const ping = await fetchT(LIVE_PROXY + "/api/ping", 2000);
    if (!ping.ok) { __liveProbe = false; setLiveStatus("off"); return runMockSearch(skipHistory); }
    const res = await fetchT(LIVE_PROXY + "/api/query?date=" + encodeURIComponent(date) + "&from=" + encodeURIComponent(f) + "&to=" + encodeURIComponent(t), 8000);
    const json = await res.json();
    if (json && json.status && json.data && json.data.trips && json.data.trips.length) {
      renderLiveResults(json.data, f, t, date, skipHistory);
      return;
    }
    __liveProbe = false;
    const emsg = (json && json.error) ? String(json.error) : "";
    if (/频繁/.test(emsg)) setLiveStatus("busy");
    else if (/风控|302|查询失败|HTTP/.test(emsg)) setLiveStatus("wind");
    else setLiveStatus("off");
    runMockSearch(skipHistory);
  } catch (e) {
    __liveProbe = false;
    setLiveStatus("off");
    runMockSearch(skipHistory);
  }
}
function renderLiveResults(data, f, t, date, skipHistory) {
  const sourceFrom = data.from.name, sourceTo = data.to.name;
  state.from = f; state.to = t; state.searchDate = date;
  state.multiLeg = false; state.cityNote = "";
  state.results = data.trips.map((tp, i) => {
    const isHigh = tp.no[0] === "G" || tp.no[0] === "D" || tp.no[0] === "C";
    const speed = tp.no[0] === "G" ? 290 : tp.no[0] === "D" || tp.no[0] === "C" ? 220 : 110;
    const km = Math.round(tp.dur * speed);
    const unit = tp.no[0] === "G" ? 0.46 : tp.no[0] === "D" ? 0.31 : 0.12;
    const price = Math.max(20, Math.round(km * unit / 5) * 5);
    return {
      id: "R" + i, type: "train", live: true,
      no: tp.no, from: sourceFrom, to: sourceTo, km,
      dep: tp.dep, dur: tp.dur, price,
      seats: { ...TRAIN_SEATS },
      remain: tp.hasTicket ? 99 : 0,
      ontime: 90,
      tag: (isHigh ? tp.type : "普速") + (tp.waitable ? "·可候补" : ""),
      liveWait: tp.waitable, liveHas: tp.hasTicket, liveSeats: tp.seats
    };
  });
  recordHistory([searchCity(f), searchCity(t)]);
  setLiveStatus("on", state.results.length);
  renderResults();
  renderFilters();
}
function finishSearch(skipHistory) {
  state.seatFilter = "";
  if (state.type !== "metro" && !skipHistory) {
    const path = state.multiLeg ? state.results.path : [searchCity($("inputFrom").value.trim() || "北京"), searchCity($("inputTo").value.trim() || "上海")];
    recordHistory(path);
  }
  renderResults();
  renderFilters();
}
// 地铁兜底：任何城市都能自动生成地铁线路（含站点、票价）
function genMetroLines(city) {
  if (METRO_LINES[city]) return METRO_LINES[city];
  const metroStops = ["市中心","科技园","大学城","火车站","机场航站楼","商业广场","体育中心","高新区","老城区","滨江公园","汽车站","植物园","工业园","会展中心","文创街区"];
  const lines = [];
  const nLines = 4 + Math.floor(Math.random() * 4);
  let tid = 9000;
  for (let li = 0; li < nLines; li++) {
    const stops = [];
    const nStops = 8 + Math.floor(Math.random() * 8);
    for (let si = 0; si < nStops; si++) stops.push(metroStops[Math.floor(Math.random() * metroStops.length)] + (si === 0 ? "东" : si === nStops - 1 ? "西" : (Math.floor(Math.random() * 20) + 1)));
    const lineName = (li + 1) + "号线";
    lines.push({ name: lineName, stops });
    TRIPS.push({
      id: "MM" + (tid++), type: "metro", no: lineName,
      from: city + " · " + stops[0], to: city + " · " + stops[nStops - 1],
      km: nStops * 1.2, dep: "06:00", dur: nStops * 0.09, price: Math.round(2 + nStops * 0.4),
      seats: { ...METRO_SEATS }, remain: 999,
      tag: "全程", ontime: 99, line: lineName, city, stops,
    });
  }
  METRO_LINES[city] = lines;
  return lines;
}
// 冷门线路兜底：内置假数据没覆盖时，自动造一趟稳定的模拟车次（同线路每次一样）
function genMockTrip(from, to, type) {
  const key = from + "|" + to;
  let s = 0;
  for (let i = 0; i < key.length; i++) s = (s * 31 + key.charCodeAt(i)) % 233280;
  const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const km = Math.max(120, Math.round((tripDistance ? tripDistance(from, to) : 500) || 500));
  if (type === "plane") {
    const h = 7 + Math.floor(R() * 14);
    return { id: "M" + s, type: "plane", no: "MU" + (Math.floor(R() * 900) + 100), from, to, km,
      dep: String(h).padStart(2, "0") + ":" + String(Math.floor(R() * 60)).padStart(2, "0"),
      dur: 1.2 + km / 850 + R() * .6, price: Math.round(km * (0.7 + R() * 0.3)),
      seats: { ...TRAIN_SEATS }, remain: Math.floor(R() * 200) + 5, tag: "航班", ontime: 82 + Math.floor(R() * 14), mock: true };
  }
  const isHigh = R() < 0.8;
  const h = 6 + Math.floor(R() * 14);
  return { id: "M" + s, type: "train", no: (isHigh ? (R() < .5 ? "G" : "D") : "K") + (Math.floor(R() * 900) + 100), from, to, km,
    dep: String(h).padStart(2, "0") + ":" + String(Math.floor(R() * 60)).padStart(2, "0"),
    dur: km / (isHigh ? 260 : 100) + R() * .5, price: Math.round(km * (isHigh ? 0.46 : 0.12)),
    seats: { ...TRAIN_SEATS }, remain: Math.floor(R() * 200) + 5,
    tag: isHigh ? (R() < .4 ? "复兴号" : "高铁") : "普速", ontime: 85 + Math.floor(R() * 14), mock: true };
}
function runMockSearch(skipHistory) {
  const f = $("inputFrom").value.trim() || "北京";
  const t = $("inputTo").value.trim() || "上海";
  const stops = getStopValues().map(searchCity);
  state.from = f; state.to = t; state.stops = stops;
  const rawF = stationCity(f), rawT = stationCity(t);
  const fc = searchCity(f), tc = searchCity(t);
  // 哪里写哪里：用户输入具体站名（如"北京南"）就显示站名，不归并成城市
  const dispOf = (input, city) => { const s = STATIONS.find(x => x.name === input.trim()); return s ? s.name : city; };
  const dispF = dispOf(f, fc), dispT = dispOf(t, tc);
  state.cityNote = "";
  if (rawF !== fc) state.cityNote += "「" + rawF + "」已就近匹配 " + fc + " 的线路；";
  if (rawT !== tc) state.cityNote += "「" + rawT + "」已就近匹配 " + tc + " 的线路；";
  if (fc === tc) state.cityNote += "出发与到达临近（同属「" + fc + "」），已显示直达线路；";
  state.searchDate = $("inputDate").value || normDate();
  if (stops.length) {
    const raw = [fc, ...stops, tc];
    const path = raw.filter((v, i) => i === 0 || (v && v !== raw[i - 1]));
    const legs = [];
    for (let i = 0; i < path.length - 1; i++) {
      let tp = TRIPS.filter(x => x.type === state.type && x.from === path[i] && x.to === path[i + 1]);
      if (!tp.length && state.type !== "metro") tp = [genMockTrip(path[i], path[i + 1], state.type)];
      const lf = (i === 0 && path[i] === fc) ? dispF : path[i];
      const lt = (i === path.length - 2 && path[i + 1] === tc) ? dispT : path[i + 1];
      tp = tp.map(x => ({ ...x, from: lf, to: lt }));
      legs.push({ from: lf, to: lt, trips: tp });
    }
    state.results = { multi: true, path, legs };
    state.multiLeg = true;
  } else {
    let rs = TRIPS.filter(x => x.type === state.type && x.from === fc && x.to === tc);
    if (!rs.length && state.type !== "metro") rs = [genMockTrip(fc, tc, state.type)];
    rs = rs.map(x => ({ ...x, from: dispF, to: dispT }));
    state.results = rs;
    state.multiLeg = false;
  }
  finishSearch(skipHistory);
}
function doSearch(skipHistory) {
  const sf = $("sugFrom"), st = $("sugTo");
  if (sf) sf.classList.remove("show");
  if (st) st.classList.remove("show");
  if (state.type === "metro") {
    const city = $("metroCity") ? $("metroCity").value : "北京";
    const line = $("metroLine") ? $("metroLine").value : "";
    let rs = TRIPS.filter(t => t.type === "metro" && t.city === city && (!line || t.line === line));
    if (!rs.length) {
      genMetroLines(city);
      if (typeof renderMetroLines === "function") renderMetroLines();
      rs = TRIPS.filter(t => t.type === "metro" && t.city === city && (!line || t.line === line));
    }
    state.results = rs;
    state.multiLeg = false;
    setLiveStatus("none");
    finishSearch(skipHistory);
    return;
  }
  if (liveEnabled()) { doSearchLive(skipHistory); return; }
  runMockSearch(skipHistory);
}

let stopSeq = 0;
function addStopPoint() {
  const n = document.querySelectorAll(".stopInput").length;
  if (n >= 3) { toast("最多添加 3 个经停点", "error"); return; }
  $("stopField").style.display = "block";
  const id = "stopIn" + (++stopSeq);
  const row = document.createElement("div");
  row.className = "stop-row";
  row.innerHTML = `
    <span style="color:var(--dim);font-size:12px;width:34px;flex-shrink:0;">经停</span>
    <div class="field">
      <input id="${id}" class="stopInput" placeholder="输入经停城市或车站" autocomplete="off">
      <div class="suggest" id="stopSug${stopSeq}"></div>
    </div>
    <button type="button" class="btn btn-danger" style="padding:4px 10px;font-size:12px;" data-stop-del>删除</button>`;
  $("stopList").appendChild(row);
  bindSuggest(id, "stopSug" + stopSeq);
  row.querySelector("[data-stop-del]").onclick = () => { row.remove(); doSearch(); };
  $("stopList").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function bindSearch() {
  $("searchBtn").onclick = e => { e.preventDefault(); doSearch(); };
  $("searchForm").onsubmit = e => { e.preventDefault(); doSearch(); };
  $("addStopBtn").onclick = () => { addStopPoint(); doSearch(); };
  $("clearStopBtn").onclick = () => { $("stopList").innerHTML = ""; $("stopField").style.display = "none"; doSearch(); };
  $("swapBtn").onclick = () => {
    if (state.type === "metro") return;
    const a = $("inputFrom").value, b = $("inputTo").value;
    $("inputFrom").value = b; $("inputTo").value = a;
    const inputs = [...document.querySelectorAll(".stopInput")];
    const vals = inputs.map(i => i.value);
    vals.reverse();
    inputs.forEach((inp, i) => inp.value = vals[i] || "");
    doSearch();
  };
}

/* 站点联想搜索 */
let sugTimer = null;
function bindSuggest(inputId, sugId) {
  const input = $(inputId), sug = $(sugId);
  const filter = (q) => {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    const seen = new Set();
    const res = [];
    if (state.type === "metro") {
      for (const c of STATION_CITIES) {
        if (res.length >= 12) break;
        if (c.includes(q)) res.push({ city: c, name: c, py: "", code: "" });
      }
      return res;
    }
    for (const st of STATIONS) {
      if (res.length >= 12) break;
      if (!MAJOR_CITIES.includes(st.city)) continue;
      if (st.name.includes(q) || st.py.includes(s) || st.city.includes(q)) {
        const key = st.city + st.name;
        if (seen.has(key)) continue;
        seen.add(key);
        res.push(st);
      }
    }
    for (const c of STATION_CITIES) {
      if (res.length >= 12) break;
      if (MAJOR_CITIES.includes(c) && c.includes(q) && !seen.has(c)) { seen.add(c); res.push({ city: c, name: c, py: "", code: "" }); }
    }
    return res;
  };
  input.addEventListener("input", () => {
    clearTimeout(sugTimer);
    const q = input.value;
    sugTimer = setTimeout(() => {
      const items = filter(q);
      if (!items.length) { sug.classList.remove("show"); return; }
      sug.innerHTML = items.map((st, i) => `
        <div class="si ${i === 0 ? "hl" : ""}" data-i="${i}">
          <span class="nm">${st.name}</span>
          <span class="sp">${st.city}${st.code ? " · " + st.code.toUpperCase() : ""}</span>
        </div>`).join("");
      sug.classList.add("show");
      sug.querySelectorAll(".si").forEach(el => el.onclick = () => {
        input.value = items[+el.dataset.i].name;
        sug.classList.remove("show");
      });
    }, 120);
  });
  document.addEventListener("click", e => { if (!input.contains(e.target) && !sug.contains(e.target)) sug.classList.remove("show"); });
}

/* ================= 地铁模式 ================= */
function renderMetroUI() {
  const isMetro = state.type === "metro";
  $("dateField").style.display = isMetro ? "none" : "block";
  $("searchBtn").textContent = isMetro ? "查询" : "搜索";
  $("metroField").style.display = isMetro ? "block" : "none";
  if (isMetro && !$("metroCity")) {
    $("metroCtrls").innerHTML = `
      <div class="field"><label>城市</label><input id="metroCity" list="metroCityList" value="北京"></div>
      <div class="field"><label>线路</label><select id="metroLine"><option value="">全部线路</option></select></div>
      <datalist id="metroCityList"></datalist>`;
    $("metroCityList").innerHTML = Object.keys(METRO_LINES).map(c => `<option value="${c}">`).join("");
    $("metroCity").addEventListener("change", () => { renderMetroLines(); doSearch(); });
    renderMetroLines();
    $("metroLine").addEventListener("change", doSearch);
  } else if (isMetro) {
    renderMetroLines();
  }
}
function renderMetroLines() {
  const city = $("metroCity").value || "北京";
  const lines = METRO_LINES[city] || [];
  const sel = $("metroLine");
  sel.innerHTML = `<option value="">全部线路</option>` + lines.map(l => `<option value="${l.name}">${l.name}（${l.stops.length}站）</option>`).join("");
}

/* ================= tab 切换 ================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    state.type = tab.dataset.type;
    $("lblFrom").textContent = state.type === "metro" ? "地铁城市" : "出发地";
    $("lblTo").textContent = state.type === "metro" ? "" : "到达地";
    if (state.type === "metro") {
      $("fieldTo").style.display = "none";
      $("swapBtn").style.display = "none";
      $("searchForm").style.gridTemplateColumns = "1fr auto";
      $("inputFrom").placeholder = "输入城市";
      $("stopField").style.display = "none";
    } else {
      $("fieldTo").style.display = "block";
      $("swapBtn").style.display = "block";
      $("searchForm").style.gridTemplateColumns = "";
      $("inputFrom").placeholder = "输入车站名或城市";
      if (document.querySelectorAll(".stopInput").length) $("stopField").style.display = "block";
    }
    renderMetroUI();
    renderQuick();
    if (state.type !== "metro") {
      $("inputFrom").value = state.from || "北京";
      $("inputTo").value = state.to || "上海";
    }
    doSearch();
  };
});

/* ================= 通用 ================= */
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => {
  const t = document.getElementById(b.dataset.close);
  if (t) t.classList.remove("show");
});
document.querySelectorAll(".modal-mask").forEach(m => m.onclick = e => { if (e.target === m) m.classList.remove("show"); });

function couponPicker() {
  const t = state.selectedTrip;
  if (!t) return;
  const usable = couponListUsable(orderAmount());
  if (!usable.length) { toast("当前订单无可用优惠券", "error"); return; }
  const opts = usable.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const pick = prompt("选择优惠券（输入序号，取消则不用）：\n" + opts);
  const idx = parseInt(pick, 10) - 1;
  if (idx >= 0 && usable[idx]) {
    selectedCoupon = usable[idx];
    payMethod = "coupon";
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("active"));
    document.querySelector('[data-pay="coupon"]').classList.add("active");
    renderPaySummary();
    toast("已选择优惠券：" + usable[idx].name);
  }
}
$("payCouponSub").style.cursor = "pointer";
$("payCouponSub").onclick = couponPicker;

/* ================= 主题切换 ================= */
function applyTheme() {
  document.body.dataset.theme = state.theme || "dark";
  $("themeToggle").textContent = state.theme === "light" ? "☀️" : "🌙";
}
$("themeToggle").onclick = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  saveState();
  applyTheme();
  toast(state.theme === "light" ? "已切换为浅色主题" : "已切换为深色主题");
};

/* ================= 限时秒杀 ================= */
let flashTrips = [], flashEnd = 0;
function genFlash() {
  const pool = TRIPS.filter(t => t.type !== "metro" && t.remain > 0);
  flashTrips = [];
  const picked = [...pool].sort(() => Math.random() - .5).slice(0, 6);
  for (const t of picked) {
    const disc = 5 + Math.floor(Math.random() * 4); // 5-8 折
    flashTrips.push({ trip: t, price: Math.round(t.price * disc / 10), disc });
  }
  flashEnd = Date.now() + 90000; // 每 90 秒换一批
}
function renderFlash() {
  if (!flashTrips.length) genFlash();
  $("flashList").innerHTML = flashTrips.map((f, i) => `
    <div class="flash-item">
      <div>
        <div style="font-weight:700;">${f.trip.no} ${f.trip.from} → ${f.trip.to}</div>
        <div style="font-size:12px;color:var(--dim);">${f.trip.dep} 出发 · ${durTxt(f.trip.dur)} · ${f.trip.tag}</div>
      </div>
      <div style="text-align:right;">
        <div>
          <span style="color:var(--gold);font-weight:800;font-size:18px;">${fmt(f.price)}</span>
          <s style="color:var(--dim);font-size:12px;">${fmt(f.trip.price)}</s>
          <span class="tag red">${f.disc}折</span>
        </div>
        <button class="btn btn-primary" style="padding:6px 14px;font-size:12px;margin-top:6px;background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 0 14px rgba(239,68,68,.35);" data-flash="${i}">⚡ 抢购</button>
      </div>
    </div>`).join("");
  $("flashList").querySelectorAll("[data-flash]").forEach(b => b.onclick = () => {
    const f = flashTrips[+b.dataset.flash];
    openSeat(Object.assign({}, f.trip, { price: f.price }));
    toast("⚡ 秒杀价已锁定，请尽快支付", "success");
  });
}
function tickFlash() {
  const left = Math.max(0, flashEnd - Date.now());
  const s = Math.ceil(left / 1000);
  $("flashTimer").textContent = `距本场结束 ${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  if (left <= 0) { genFlash(); renderFlash(); }
}

/* ================= 历史搜索 ================= */
function recordHistory(path) {
  if (!path || path.length < 2) return;
  const clean = path.filter(Boolean);
  if (clean.length < 2) return;
  const key = clean.join("→");
  if (key.includes("→→")) return;
  state.history = (state.history || []).filter(h => h.join("→") !== key);
  state.history.unshift(clean.slice());
  if (state.history.length > 8) state.history.pop();
  saveState();
  renderHistory();
}
function addStopPointWith(val) {
  addStopPoint();
  const inputs = document.querySelectorAll(".stopInput");
  if (inputs.length) inputs[inputs.length - 1].value = val;
}
function renderHistory() {
  const bar = $("historyBar");
  if (!state.history || !state.history.length) { if (bar) bar.style.display = "none"; return; }
  bar.style.display = "block";
  $("historyList").innerHTML = state.history.map((h, i) =>
    `<button class="chip" data-hist="${i}">${h.join(" → ")}</button>`).join("") +
    `<button class="chip" data-hist-clear style="color:var(--dim);">✕ 清空</button>`;
  $("historyList").querySelectorAll("[data-hist]").forEach(b => b.onclick = () => {
    const h = state.history[+b.dataset.hist];
    if (state.type === "metro") return;
    $("inputFrom").value = h[0];
    $("inputTo").value = h[h.length - 1];
    $("stopList").innerHTML = "";
    if (h.length > 2) {
      $("stopField").style.display = "block";
      h.slice(1, -1).forEach(st => addStopPointWith(st));
    }
    doSearch();
    toast("已搜索：" + h.join(" → "));
  });
  const clear = $("historyList").querySelector("[data-hist-clear]");
  if (clear) clear.onclick = () => { state.history = []; saveState(); renderHistory(); toast("已清空搜索历史"); };
}

/* ================= 电子票详情 ================= */
function drawQRTo(holderId, text) {
  const el = document.getElementById(holderId);
  if (!el) return;
  el.innerHTML = "";
  el.appendChild(realQRImg(text, 130));
}

function checkTicket(idx) {
  const o = state.orders[idx];
  if (!o || o.checked) return;
  const scanned = o.qr || orderQr();
  if (!scanned) { toast("二维码读取失败", "error"); return; }
  o.checked = true;
  o.checkedAt = new Date().toTimeString().slice(0, 5);
  saveState();
  renderOrders();
  showTicketDetail(idx);
  toast("✔ 扫码成功，车票已核销为已核票", "success");
}
function showTicketDetail(idx) {
  const o = state.orders[idx];
  if (!o) return;
  const gate = "检票口 " + (8 + Math.floor(Math.random() * 28));
  const car = String(3 + Math.floor(Math.random() * 15)).padStart(2, "0");
  const seatNo = (o.seatLabel || "").split("×")[0].trim();
  const passenger = o.passenger || "乘客";
  const checked = !!o.checked;
  const reminded = reminders.some(r => r.id === o.id);
  const statusText = checked
    ? `<span style="color:var(--green);">✔ 已核票 ${o.checkedAt || ""}</span>`
    : (o.status === "paid" ? "已出票" : "已支付");
  const qrArea = checked ? `
          <div style="background:#fff;border-radius:12px;padding:10px;box-shadow:var(--glow);flex-shrink:0;position:relative;">
            <div id="tdQr" style="width:130px;height:130px;filter:grayscale(.85);opacity:.7;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-18deg);border:3px solid var(--green);color:var(--green);font-weight:900;font-size:18px;padding:2px 12px;border-radius:8px;background:rgba(52,211,153,.18);letter-spacing:4px;">已核票</div>
          </div>` : `
          <div style="background:#fff;border-radius:12px;padding:10px;box-shadow:var(--glow);flex-shrink:0;">
            <div id="tdQr" style="width:130px;height:130px;"></div>
          </div>`;
  const checkArea = checked ? `
    <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.4);color:var(--green);font-size:13px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;">✅</span> 本票已于 <b>${o.checkedAt || "--:--"}</b> 核验通过，可正常乘车
    </div>` : `
    <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(251,191,36,.1);border:1px dashed rgba(251,191,36,.5);color:var(--gold);font-size:13px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;">📷</span> 乘车时出示二维码，检票扫码后自动变为已核票
    </div>`;
  $("ticketDetailBody").innerHTML = `
    <div style="border:1px solid var(--border2);border-radius:14px;overflow:hidden;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:linear-gradient(135deg, rgba(79,140,255,.15), rgba(155,92,255,.1));">
        <div style="font-size:20px;font-weight:800;">${o.icon} ${o.no}</div>
        <div style="text-align:right;font-size:12px;color:var(--muted);">${statusText}<br><span style="font-size:11px;">${o.id}</span></div>
      </div>
      <div style="padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;">
          <div>
            <div style="font-size:26px;font-weight:900;">${o.dep}</div>
            <div style="font-size:14px;color:var(--muted);">${o.from}</div>
          </div>
          <div style="flex:1;text-align:center;font-size:12px;color:var(--dim);">
            ${o.date}<br>↓<br>${o.km ? o.km + "km" : ""}
          </div>
          <div style="text-align:right;">
            <div style="font-size:26px;font-weight:900;">${o.arr || calcArr(o.dep, o.dur || 2)}</div>
            <div style="font-size:14px;color:var(--muted);">${o.to}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;font-size:13px;">
          <div class="detail-cell"><div class="k">检票口</div><div class="v" style="font-size:15px;">${gate}</div></div>
          <div class="detail-cell"><div class="k">车厢座位</div><div class="v" style="font-size:15px;">${car}车 ${seatNo || "随机"}</div></div>
          <div class="detail-cell"><div class="k">乘客</div><div class="v" style="font-size:15px;">${passenger}</div></div>
          <div class="detail-cell"><div class="k">票价</div><div class="v" style="font-size:15px;color:var(--gold);">${fmt(o.total)}</div></div>
        </div>
        <div style="display:flex;gap:14px;margin-top:14px;align-items:center;">
          ${qrArea}
          <div style="font-size:12px;color:var(--muted);line-height:1.8;flex:1;">
            <div>💳 乘车请出示二维码或证件</div>
            <div>📱 ${o.payDesc || "已支付"}</div>
            <div>⚠️ 退票将收取 20% 手续费，改签免手续费</div>
          </div>
        </div>
        ${checkArea}
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-outline" id="tdShare" style="padding:8px 18px;font-size:13px;">📤 分享车票</button>
      <button class="btn btn-outline" id="tdExport" style="padding:8px 18px;font-size:13px;">🖨️ 报销凭证</button>
      <button class="btn btn-outline" id="tdRemind" style="padding:8px 18px;font-size:13px;border-color:rgba(34,211,238,.5);color:var(--cyan);">${reminded ? "🔔 已提醒" : "⏰ 出发提醒"}</button>
      ${checked ? "" : `<button class="btn btn-primary" id="tdCheck" style="padding:8px 18px;font-size:13px;background:linear-gradient(135deg,#34d399,#059669);box-shadow:0 0 14px rgba(52,211,153,.35);">📷 模拟扫码核票</button>`}
      <button class="btn btn-outline" data-close="ticketDetailModal" style="padding:8px 18px;font-size:13px;">完成</button>
    </div>`;
  drawQRTo("tdQr", o.qr || orderQr());
  const share = $("tdShare"), exp = $("tdExport"), chk = $("tdCheck"), rem = $("tdRemind");
  if (share) share.onclick = () => { toast("车票已分享（演示）", "success"); };
  if (exp) exp.onclick = () => { toast("报销凭证已生成（演示）", "success"); };
  if (chk) chk.onclick = () => checkTicket(idx);
  if (rem) rem.onclick = () => toggleReminder(idx);
  $("ticketDetailModal").classList.add("show");
}

/* ================= 新功能：票价日历 / 到站服务 / 出发提醒 / 每日抽奖 / 导出 ================= */
function fmtLocalDate(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

/* ---- 7 天票价日历 ---- */
function openPriceCal() {
  const f = stationCity($("inputFrom").value.trim() || "北京");
  const t = stationCity($("inputTo").value.trim() || "上海");
  const trips = TRIPS.filter(x => x.type === state.type && x.from === f && x.to === t);
  if (!trips.length) { toast("该线路暂无班次，无法比价", "error"); return; }
  const base = Math.min(...trips.map(x => x.price));
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const seed = d.getDate() * 137 + (d.getMonth() + 1) * 17 + i * 29;
    const rnd = ((seed * 9301 + 49297) % 233280) / 233280;
    days.push({ d, price: Math.round(base * (0.82 + rnd * 0.4)) });
  }
  const prices = days.map(x => x.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const todayStr = fmtLocalDate(today);
  $("calRoute").textContent = f + " → " + t + " · 未来 7 天最低价走势（模拟比价）";
  $("calBody").innerHTML = days.map(x => {
    const ratio = (x.price - min) / (max - min || 1);
    const cls = ratio < .33 ? "low" : ratio < .66 ? "mid" : "high";
    const ds = fmtLocalDate(x.d);
    const isToday = ds === todayStr;
    return `<div class="cal-day ${cls}" data-date="${ds}" style="${isToday ? "outline:2px solid #4f8cff;" : ""}">
      <div class="cd-w">${isToday ? "今天" : "周" + "日一二三四五六"[x.d.getDay()]}</div>
      <div class="cd-d">${x.d.getDate()}</div>
      <div class="cd-p">¥${x.price}</div>
      <div class="cd-tag">${ratio < .33 ? "低价" : ratio < .66 ? "中等" : "高价"}</div>
    </div>`;
  }).join("");
  $("calBody").querySelectorAll("[data-date]").forEach(el => el.onclick = () => {
    $("inputDate").value = el.dataset.date;
    state.searchDate = el.dataset.date;
    doSearch();
    $("priceCalModal").classList.remove("show");
    toast("已切换至 " + el.dataset.date);
  });
  $("priceCalModal").classList.add("show");
}

/* ---- 到站服务 ---- */
function openArrival(trip) {
  const to = trip.to, dist = trip.km || 200;
  const taxi = Math.round(8 + dist * 1.6), hotel = Math.round(120 + dist * 0.4), pick = Math.round(30 + dist * 0.9), tour = Math.round(dist * 1.2);
  const train = trip.type === "plane" ? "✈️" : "🚄";
  $("arrivalBody").innerHTML = `
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">${train} ${trip.no} 到达 <b style="color:var(--text);">${to}</b> 后的接驳服务，出行更省心：</div>
    <div class="arrival-grid">
      <div class="arrival-item" data-svc="taxi"><div class="ai-ic">🚕</div><div class="ai-t">打车接站</div><div class="ai-p">¥${taxi}</div><div class="ai-d">出站口专车等待 · 约 ${Math.max(15, Math.round(dist / 40))} 分钟</div></div>
      <div class="arrival-item" data-svc="hotel"><div class="ai-ic">🏨</div><div class="ai-t">附近酒店</div><div class="ai-p">¥${hotel} 起</div><div class="ai-d">车站周边优选 · 免费接驳</div></div>
      <div class="arrival-item" data-svc="pickup"><div class="ai-ic">🚘</div><div class="ai-t">接送机</div><div class="ai-p">¥${pick}</div><div class="ai-d">机场/高铁站 · 准时接送</div></div>
      <div class="arrival-item" data-svc="tour"><div class="ai-ic">🗺️</div><div class="ai-t">当地游</div><div class="ai-p">¥${tour} 起</div><div class="ai-d">${to} 一日游精选</div></div>
    </div>`;
  $("arrivalBody").querySelectorAll("[data-svc]").forEach(el => el.onclick = () => {
    const map = { taxi: "🚕 接站专车已呼叫，请到出站口上车", hotel: "🏨 附近酒店已推荐，可在线预订", pickup: "🚘 接送机已加入行程单", tour: "🗺️ 当地一日游已生成行程" };
    toast(map[el.dataset.svc] || "已下单", "success");
    $("arrivalModal").classList.remove("show");
  });
  $("arrivalModal").classList.add("show");
}

/* ---- 出发提醒 ---- */
let reminders = [];
try { reminders = JSON.parse(localStorage.getItem("fastgo_reminders") || "[]"); } catch (e) {}
function saveReminders() { try { localStorage.setItem("fastgo_reminders", JSON.stringify(reminders)); } catch (e) {} }
function toggleReminder(idx) {
  const o = state.orders[idx];
  if (!o) return;
  const has = reminders.some(r => r.id === o.id);
  if (has) { reminders = reminders.filter(r => r.id !== o.id); saveReminders(); toast("已取消出发提醒", ""); }
  else { reminders.push({ id: o.id, no: o.no, from: o.from, to: o.to, date: o.date, dep: o.dep, fired: false }); saveReminders(); toast("⏰ 已设置出发提醒，到点自动提醒", "success"); }
  if (state.orders[idx]) showTicketDetail(idx);
}
setInterval(() => {
  const now = new Date();
  const today = fmtLocalDate(now);
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  reminders.forEach(r => {
    if (r.fired) return;
    if (r.date === today && r.dep <= hhmm) { r.fired = true; saveReminders(); toast("⏰ 出发提醒：" + r.no + " " + r.from + "→" + r.to + " 到点出发啦", "success"); }
  });
}, 30000);

/* ---- 每日抽奖 ---- */
const LOTTERY_PRIZES = [
  { ic: "⭐", t: "5 积分", give() { state.points += 5; saveState(); renderHeader(); } },
  { ic: "🎟️", t: "满100减20", give() { state.coupons.push({ id: "lot" + Date.now(), name: "抽奖券·满100减20", val: 20, cond: 100, used: false }); saveState(); } },
  { ic: "⭐", t: "10 积分", give() { state.points += 10; saveState(); renderHeader(); } },
  { ic: "🎁", t: "满200减50", give() { state.coupons.push({ id: "lot" + Date.now(), name: "抽奖券·满200减50", val: 50, cond: 200, used: false }); saveState(); } },
  { ic: "😅", t: "谢谢参与", give() {} },
  { ic: "💎", t: "20 积分", give() { state.points += 20; saveState(); renderHeader(); } },
  { ic: "🎟️", t: "满100减20", give() { state.coupons.push({ id: "lot" + Date.now(), name: "抽奖券·满100减20", val: 20, cond: 100, used: false }); saveState(); } },
  { ic: "🎫", t: "退票免费券", give() { state.coupons.push({ id: "lot" + Date.now(), name: "抽奖券·退票免手续费", val: 0, cond: 0, free: true, used: false }); saveState(); } }
];
function openLottery() {
  const last = localStorage.getItem("fastgo_lottery");
  const today = fmtLocalDate(new Date());
  const can = last !== today;
  $("lotteryInfo").textContent = can ? "🎉 今日还有 1 次免费抽奖机会！" : "今日已抽过，明天再来吧";
  let cells = "";
  for (let i = 0; i < 9; i++) {
    if (i === 4) { cells += `<div class="g9 g9-go" data-go="1">抽<br>奖</div>`; continue; }
    const p = LOTTERY_PRIZES[i < 4 ? i : i - 1];
    cells += `<div class="g9" data-p="${i}"><div class="g9-ic">${p.ic}</div><div class="g9-t">${p.t}</div></div>`;
  }
  $("lotteryGrid").innerHTML = cells;
  $("lotteryResult").textContent = "";
  const go = $("lotteryGrid").querySelector("[data-go]");
  go.onclick = () => drawLottery(can);
  $("lotteryModal").classList.add("show");
}
function drawLottery(can) {
  if (!can) { toast("今天已经抽过啦，明天再来", "error"); return; }
  localStorage.setItem("fastgo_lottery", fmtLocalDate(new Date()));
  const winIdx = Math.floor(Math.random() * LOTTERY_PRIZES.length);
  const targetPos = winIdx < 4 ? winIdx : winIdx + 1;
  const cells = [...$("lotteryGrid").querySelectorAll(".g9")];
  const order = [0, 1, 2, 5, 8, 7, 6, 3];
  const targetOrderIdx = order.indexOf(targetPos);
  const totalSteps = 9 + targetOrderIdx;
  let idx = 0;
  const iv = setInterval(() => {
    cells.forEach(c => c.classList.remove("active"));
    const cur = order[idx % 8];
    cells[cur].classList.add("active");
    idx++;
    if (idx >= totalSteps) {
      clearInterval(iv);
      const finalPos = order[targetOrderIdx];
      cells.forEach(c => c.classList.remove("active"));
      cells[finalPos].classList.add("active");
      const prize = LOTTERY_PRIZES[finalPos < 4 ? finalPos : finalPos - 1];
      setTimeout(() => { prize.give(); $("lotteryResult").innerHTML = "🎉 恭喜抽中：" + prize.ic + " " + prize.t; toast("🎁 抽中：" + prize.t, "success"); }, 350);
    }
  }, 90);
}

/* ---- 导出订单 CSV ---- */
function exportOrders() {
  if (!state.orders.length) { toast("暂无订单可导出", "error"); return; }
  const header = ["订单号", "车次", "类型", "出发", "到达", "日期", "出发时间", "座位", "乘客", "金额", "状态"];
  const rows = state.orders.map(o => [o.id, o.no, o.typeName, o.from, o.to, o.date, o.dep, o.seatLabel, o.passenger, o.total, o.checked ? "已核票" : "已出票"]);
  const csv = "\ufeff" + [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "极速出行_订单导出.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  toast("已导出 " + state.orders.length + " 条订单", "success");
}

/* ---- 按钮绑定 ---- */
const priceCalBtn = $("priceCalBtn"); if (priceCalBtn) priceCalBtn.onclick = openPriceCal;
const exportBtn = $("exportBtn"); if (exportBtn) exportBtn.onclick = exportOrders;
const lotteryBtn = $("lotteryBtn"); if (lotteryBtn) lotteryBtn.onclick = openLottery;

/* ================= 出行服务 ================= */
document.querySelectorAll(".service-item").forEach(s => s.onclick = () => {
  const map = {
    insurance: "🛡️ 购票保障：如遇车次停运或延误，系统自动全额退款至账户钱包。",
    refund: "📋 退改签规则：发车前可退票（收取 20% 手续费），可免费改签一次；发车后不可退。",
    luggage: "🧳 行李托运：随身行李限重 5kg，托运限重 20kg，超重需另购行李票。",
    hotline: "📞 客服热线：400-888-0000（每日 9:00-21:00），电子票问题可在线反馈。"
  };
  toast(map[s.dataset.svc] || "出行服务", "");
});

/* ================= 初始化 ================= */
(function init() {
  loadState();
  $("inputFrom").value = state.from || "北京";
  $("inputTo").value = state.to || "上海";
  $("inputDate").value = normDate();
  state.searchDate = $("inputDate").value;
  $("stationTotal").textContent = STATIONS.length;
  bindSearch();
  bindSuggest("inputFrom", "sugFrom");
  bindSuggest("inputTo", "sugTo");
  renderHeader();
  renderQuick();
  doSearch(true);
  renderOrders();
  renderCoupons();
  renderPoints();
  renderWaits();
  applyTheme();
  genFlash();
  renderFlash();
  renderHistory();
  setInterval(tickFlash, 1000);
  ensureProxy();
})();
