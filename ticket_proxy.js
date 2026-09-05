// ============================================================
// 12306 本地查询代理 —— 纯 Node 标准库，无第三方依赖
// 启动：node ticket_proxy.js  （或双击 启动12306代理.bat）
// 作用：让本地 ticket.html 能查询 12306 真实余票数据
// ============================================================
const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = 8899;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let STATION_MAP = null;   // 站名 -> 代码
let cookieJar = {};       // kyfw cookie
let cookieTime = 0;

// 城市 -> 主力站（高铁优先），输入城市名时优先查主力站
const MAIN_STATIONS = {
  "北京":"北京南","上海":"上海虹桥","广州":"广州南","深圳":"深圳北","杭州":"杭州东",
  "成都":"成都东","重庆":"重庆北","武汉":"武汉","西安":"西安北","南京":"南京南",
  "天津":"天津","苏州":"苏州北","长沙":"长沙南","郑州":"郑州东","青岛":"青岛",
  "大连":"大连北","厦门":"厦门北","昆明":"昆明南","贵阳":"贵阳北","兰州":"兰州西",
  "哈尔滨":"哈尔滨西","长春":"长春西","沈阳":"沈阳北","乌鲁木齐":"乌鲁木齐","拉萨":"拉萨",
  "西宁":"西宁","银川":"银川","南宁":"南宁东","福州":"福州","南昌":"南昌西",
  "太原":"太原南","合肥":"合肥南","石家庄":"石家庄","呼和浩特":"呼和浩特","海口":"海口",
  "三亚":"三亚","无锡":"无锡东","宁波":"宁波","济南":"济南西","东莞":"东莞",
  "佛山":"佛山","中山":"中山","珠海":"珠海","绵阳":"绵阳","遵义":"遵义",
  "太原":"太原南","苏州":"苏州北"
};

// 简单 http(s) GET，支持 cookie jar
function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const headers = {
      "User-Agent": UA,
      "Referer": "https://kyfw.12306.cn/otn/leftTicket/init",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "Accept-Language": "zh-CN,zh;q=0.9",
      ...(opts.headers || {}),
    };
    if (Object.keys(cookieJar).length) headers["Cookie"] = Object.entries(cookieJar).map(([k, v]) => k + "=" + v).join("; ");
    const req = mod.request(u, { method: opts.method || "GET", headers }, (res) => {
      // 收集 set-cookie
      const sc = res.headers["set-cookie"];
      if (Array.isArray(sc)) {
        sc.forEach(c => {
          const pair = c.split(";")[0];
          const eq = pair.indexOf("=");
          if (eq > 0) cookieJar[pair.slice(0, eq)] = pair.slice(eq + 1);
        });
      }
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on("error", reject);
    req.setTimeout(opts.timeout || 15000, () => { req.destroy(new Error("timeout")); });
    req.end();
  });
}

async function fetchStations(force) {
  if (STATION_MAP && !force) return STATION_MAP;
  try {
    const url = "https://kyfw.12306.cn/otn/resources/js/framework/station_name.js?station_version=1.9277";
    const r = await request(url, { headers: { "Referer": "https://kyfw.12306.cn/otn/index/init" } });
    const m = r.body.match(/var station_names\s*=\s*'([^']+)'/);
    if (!m) throw new Error("station_name.js 解析失败");
    const map = {};
    // station_name.js 格式：@缩写|站名|代码|拼音|...
    m[1].split("@").forEach(s => {
      const p = s.split("|");
      if (p.length >= 3 && p[1]) map[p[1]] = p[2];
    });
    STATION_MAP = map;
  } catch (e) {
    // 兜底常用站
    STATION_MAP = {
      "北京":"BJP","北京南":"VNP","北京西":"BXP","北京北":"VAP","上海":"SHH","上海虹桥":"AOH",
      "广州":"GZQ","广州南":"IZQ","广州东":"GGQ","深圳":"SZQ","深圳北":"IOQ","杭州":"HZH","杭州东":"HGH",
      "成都":"CDW","成都东":"ICW","重庆":"CQW","重庆北":"CUW","武汉":"WXN","西安":"XAY","西安北":"EAY",
      "南京":"NJH","南京南":"NKH","天津":"TJP","苏州":"SZH","苏州北":"SOH","长沙":"CSQ","长沙南":"CWQ",
      "郑州":"ZZF","郑州东":"ZZF","青岛":"QDK","大连":"DLT","大连北":"DBT","厦门":"XMS","厦门北":"XKS",
      "昆明":"KMM","昆明南":"KOM","贵阳":"GIW","贵阳北":"KQW","兰州":"LZJ","兰州西":"LAJ","哈尔滨":"HBB",
      "哈尔滨西":"VAB","长春":"CCT","长春西":"CRT","沈阳":"SYT","沈阳北":"SBT","乌鲁木齐":"WAR","拉萨":"LSO",
      "西宁":"XNO","银川":"YIJ","南宁":"NNZ","南宁东":"NFZ","福州":"FZS","南昌":"NCG","南昌西":"NXG",
      "太原":"TYV","太原南":"TNV","合肥":"HFH","合肥南":"ENH","石家庄":"SJP","呼和浩特":"HHC","海口":"VUQ",
      "三亚":"SEQ","无锡":"WXH","无锡东":"WGH","宁波":"NGH","济南":"JNK","济南西":"JGK","东莞":"DAQ",
      "佛山":"FSQ","中山":"ZOQ","珠海":"ZIQ","绵阳":"MYW","遵义":"ZYW"
    };
  }
  return STATION_MAP;
}

function ensureCookie() {
  // 5 分钟内的 cookie 复用，过期重取
  if (cookieJar["JSESSIONID"] && Date.now() - cookieTime < 5 * 60 * 1000) return;
  return (async () => {
    try {
      await request("https://kyfw.12306.cn/otn/leftTicket/init");
      cookieTime = Date.now();
    } catch (e) { /* 忽略，queryG 时再试 */ }
  })();
}

const SEAT_ORDER = ["商务座", "一等座", "二等座", "高级软卧", "软卧", "硬卧", "软座", "硬座", "无座", "其他"];

function parseSeatCode(enc) {
  // 12306 余票编码：字母(席别)+值 交替，如 "90M0O0D0W0" -> 商务0 一等0 二等0 软卧0 无座0
  const out = {};
  const L = {
    "9": "商务座", "M": "一等座", "O": "二等座", "A": "动卧", "D": "软卧",
    "F": "硬卧", "I": "高级软卧", "W": "无座", "P": "商务座", "S": "特等座",
    "1": "硬座", "C": "二等座", "B": "一等座", "X": "无座", "0": null
  };
  if (!enc) return out;
  const pairs = enc.match(/[A-Za-z0-9][^A-Za-z0-9]*/g) || [];
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const key = pairs[i];
    const val = pairs[i + 1];
    const name = L[key];
    if (!name) continue;
    const v = val === "" ? -1 : parseInt(val, 10);
    out[name] = isNaN(v) ? -1 : v;
  }
  return out;
}

async function query12306(date, fromName, toName) {
  await ensureCookie();
  const stations = await fetchStations();
  // 城市名 -> 主力站 -> 代码
  const toCode = (name) => {
    const n = stations[name] ? name : (MAIN_STATIONS[name] && stations[MAIN_STATIONS[name]] ? MAIN_STATIONS[name] : name);
    const code = stations[n];
    return { name: n, code: code || "" };
  };
  const f = toCode(fromName), t = toCode(toName);
  if (!f.code || !t.code) throw new Error("未识别的站点：" + fromName + " / " + toName);
  const date2 = date.replace(/-/g, "");
  const url = `https://kyfw.12306.cn/otn/leftTicket/queryG?leftTicketDTO.train_date=${date2}&leftTicketDTO.from_station=${f.code}&leftTicketDTO.to_station=${t.code}&purpose_codes=ADULT`;
  const r = await request(url);
  if (r.status !== 200 || !r.body) throw new Error("12306 查询失败（HTTP " + r.status + "）");
  let json;
  try { json = JSON.parse(r.body); } catch (e) { throw new Error("12306 返回异常"); }
  if (!json.data || !json.data.result) {
    // 302 风控等
    if (r.status === 302 || /302/.test(r.body)) throw new Error("12306 风控拦截，请稍后重试");
    throw new Error("未获取到车次数据");
  }
  const trips = [];
  for (const row of json.data.result) {
    const p = row.split("|");
    if (p.length < 12) continue;
    const no = p[3];
    if (!no) continue;
    const type = no[0] === "G" || no[0] === "D" || no[0] === "C" ? "高铁动车" : (no[0] === "K" || no[0] === "T" || no[0] === "Z" ? "普速" : "列车");
    const dep = p[8], arr = p[9], durRaw = p[10] || "00:00";
    const durs = durRaw.split(":");
    const dur = (durs.length >= 2) ? (+durs[0]) + (+durs[1]) / 60 : 0;
    const waitable = p[11] === "Y";
    const hasTicket = p[28] === "有" || p[29] === "有" || p[30] === "有";
    const seats = parseSeatCode(p[32]);
    trips.push({
      no, type, from: f.name, to: t.name, dep, arr, dur, durTxt: durRaw,
      waitable, hasTicket, seats, date: date2,
    });
  }
  return { from: f, to: t, trips };
}

// 简单 CORS + JSON 响应
function send(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { send(res, 200, {}); return; }
  const u = new URL(req.url, "http://localhost");
  try {
    if (u.pathname === "/api/ping") {
      send(res, 200, { ok: true, name: "ticket-proxy", time: new Date().toISOString() });
    } else if (u.pathname === "/api/query") {
      const date = u.searchParams.get("date") || "";
      const from = u.searchParams.get("from") || "";
      const to = u.searchParams.get("to") || "";
      if (!date || !from || !to) return send(res, 400, { error: "缺少参数 date/from/to" });
      const data = await query12306(date, from, to);
      send(res, 200, { status: true, data });
    } else if (u.pathname === "/api/stations") {
      const m = await fetchStations();
      send(res, 200, { status: true, count: Object.keys(m).length });
    } else {
      send(res, 404, { error: "not found" });
    }
  } catch (e) {
    send(res, 200, { status: false, error: e.message });
  }
});

server.listen(PORT, () => {
  console.log("==============================================");
  console.log("  12306 查询代理已启动");
  console.log("  地址: http://127.0.0.1:" + PORT);
  console.log("  现在打开 ticket.html 即可查询真实余票");
  console.log("  关闭本窗口 = 停止代理（页面自动回退模拟数据）");
  console.log("==============================================");
});
