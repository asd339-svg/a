/* ===== 新站开张 · 交互脚本 ===== */
(function(){
  "use strict";

  /* ---------- 下载中心数据 ---------- */
  var SOCIAL_LINKS = [
    { name:"微信",   abbr:"微", color:"#07C160", desc:"聊天、朋友圈、支付全都有",   url:"https://weixin.qq.com" },
    { name:"QQ",     abbr:"Q",  color:"#12B7F5", desc:"老牌聊天交友，一起开黑",     url:"https://im.qq.com" },
    { name:"抖音",   abbr:"抖", color:"#FE2C55", desc:"刷短视频，记录美好生活",     url:"https://www.douyin.com" },
    { name:"快手",   abbr:"快", color:"#FF4906", desc:"记录世界，记录你",           url:"https://www.kuaishou.com" },
    { name:"微博",   abbr:"微", color:"#E6162D", desc:"看热搜，追热点，吃瓜前线",   url:"https://weibo.com" },
    { name:"哔哩哔哩", abbr:"B", color:"#FB7299", desc:"二次元与鬼畜的大本营",     url:"https://www.bilibili.com" },
    { name:"小红书", abbr:"红", color:"#FF2442", desc:"种草、攻略、生活方式分享",   url:"https://www.xiaohongshu.com" },
    { name:"钉钉",   abbr:"钉", color:"#0089FF", desc:"办公、打卡、网课都用它",     url:"https://www.dingtalk.com" },
    { name:"腾讯会议", abbr:"会", color:"#006EFF", desc:"线上开会、上网课神器",     url:"https://meeting.tencent.com" },
    { name:"知乎",   abbr:"知", color:"#0084FF", desc:"有问题，就会有答案",         url:"https://www.zhihu.com" }
  ];

  var GAME_LINKS = [
    { name:"我的世界", abbr:"MC", color:"#7CBD4F", desc:"方块世界，自由创造无限可能", url:"https://mc.163.com" },
    { name:"我的世界国际版", abbr:"MC", color:"#50C878", desc:"原汁原味的国际版正版", url:"https://www.minecraft.net" },
    { name:"原神",   abbr:"原", color:"#4C8DFF", desc:"开放世界冒险，抽卡集角色",   url:"https://ys.mihoyo.com" },
    { name:"崩坏：星穹铁道", abbr:"星", color:"#00C8FF", desc:"银河冒险RPG，回合制战斗", url:"https://sr.mihoyo.com" },
    { name:"绝区零", abbr:"绝", color:"#F5D12E", desc:"都市动作游戏，酷炫连招",     url:"https://zzz.mihoyo.com" },
    { name:"王者荣耀", abbr:"王", color:"#E4B45D", desc:"5v5 手游，和朋友一起上分",  url:"https://pvp.qq.com" },
    { name:"和平精英", abbr:"和", color:"#FF6A00", desc:"百人吃鸡，落地成盒也快乐",  url:"https://gp.qq.com" },
    { name:"第五人格", abbr:"第", color:"#8C6ED8", desc:"非对称对抗，追与逃的博弈",  url:"https://id5.163.com" },
    { name:"蛋仔派对", abbr:"蛋", color:"#FFB800", desc:"可爱蛋仔，滚来滚去闯关",    url:"https://eggy.163.com" },
    { name:"Steam",  abbr:"S",  color:"#66C0F4", desc:"PC 游戏大本营，买买买",      url:"https://store.steampowered.com" }
  ];

  var TOOL_LINKS = [
    { name:"百度网盘", abbr:"盘", color:"#3B7CFF", desc:"存文件、传资料，云端大仓库", url:"https://pan.baidu.com" },
    { name:"WPS Office", abbr:"W", color:"#2E7CF6", desc:"文档表格演示，办公三件套", url:"https://www.wps.cn" },
    { name:"剪映",   abbr:"剪", color:"#F24B4B", desc:"视频剪辑，模板一键成片",     url:"https://www.capcut.cn" },
    { name:"美图秀秀", abbr:"美", color:"#FF7EB3", desc:"修图美颜，照片变好看",     url:"https://xiuxiu.meitu.com" },
    { name:"有道翻译", abbr:"译", color:"#4A90D9", desc:"翻译词典，查单词看例句",   url:"https://fanyi.youdao.com" },
    { name:"高德地图", abbr:"高", color:"#33A6F0", desc:"导航出行，认路找地方",     url:"https://www.amap.com" },
    { name:"支付宝", abbr:"支", color:"#1677FF", desc:"扫码支付，收付款都用它",     url:"https://www.alipay.com" },
    { name:"美团",   abbr:"团", color:"#FFB800", desc:"外卖团购，吃喝玩乐全有",     url:"https://www.meituan.com" },
    { name:"网易云音乐", abbr:"音", color:"#EC4141", desc:"听歌找歌，发现好音乐",   url:"https://music.163.com" },
    { name:"腾讯视频", abbr:"视", color:"#FF5B33", desc:"追剧看番，热门影视全在这", url:"https://v.qq.com" }
  ];

  var GO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"></path><path d="M9 7h8v8"></path></svg>';

  /* ---------- 在线影院数据 ---------- */
  var MOVIES = [
    { name:"西游记", tag:"经典剧集", info:"央视动画 · 52集全", color:"#F5B041", aid:205684454, cids:[342113036,342116630,342121354,342248434,342248972,342250139,342250629,342258131,342276519,342277812,342279580,342281462,342283588,342316603,342318887,342322273,342324852,342330304,342342912,342344735,342347192,342350250,342355488,342358301,342363655,342431454,342437171,342442163,342449107,342450879,342452580,342454525,342456627,342465101,342763161,342763627,342764166,342764608,342765077,342773352,352496719,342848002,342849576,342857337,342859434,342861206,342864536,342868718,342870408,342873802,342877256,342879594] },
    { name:"葫芦兄弟", tag:"经典剧集", info:"13集 · 剪纸动画", color:"#58D68D", aid:2425770, cids:[3684209,3684210,3684211,3684212,3684213,3684214,3684215,3684216,3684217,3684218,3684219,3684220,3684221] },
    { name:"黑猫警长", tag:"经典剧集", info:"5集 · 国民警长", color:"#AF7AC5", aid:2435223, cids:[3682973,3682974,3682975,3682976,3682977] },
    { name:"舒克和贝塔", tag:"经典剧集", info:"13集 · 开飞机的小老鼠", color:"#48C9B0", aid:427941238, cids:[758658025,758657941,758658165,758658148,758657955,758658928,758659019,758659428,758659266,758659239,758661150,758659749,758659948] },
    { name:"邋遢大王奇遇记", tag:"经典剧集", info:"13集 · 地下冒险记", color:"#EC7063", aid:427998000, cids:[758651149,758651518,758651198,758651372,758651095,758652125,758652711,758652167,758652247,758652080,758652490,758652620,758652600] },
    { name:"阿凡提的故事", tag:"经典剧集", info:"14集 · 木偶动画", color:"#A569BD", aid:300456693, cids:[758598825,758598402,758599348,758599887,758598128,758599359,758601229,758602082,758600565,758600857,758600951,758601085,758601624,758601843] },
    { name:"大闹天宫", tag:"动画电影", info:"1961 · 经典之作 · 112分钟", color:"#E67E22", aid:650527680, cids:[973278336] },
    { name:"哪吒闹海", tag:"动画电影", info:"1979 · 上美经典 · 65分钟", color:"#5DADE2", aid:2434608, cids:[3684318] },
    { name:"熊出没之夺宝熊兵", tag:"动画电影", info:"2014 · 熊出没大电影", color:"#F1948A", aid:116262013246214, cids:[36843292216] },
    { name:"熊出没之雪岭熊风", tag:"动画电影", info:"2015 · 熊出没大电影", color:"#85C1E9", aid:115112639864506, cids:[32032884518] },
    { name:"熊出没之狂野大陆", tag:"动画电影", info:"2021 · 熊出没大电影", color:"#7DCEA0", aid:115132873055921, cids:[32104974637] },
    { name:"九色鹿", tag:"动画短片", info:"1981 · 敦煌壁画风", color:"#F7DC6F", aid:116617505670934, cids:[38526256787] },
    { name:"雪孩子", tag:"动画短片", info:"1980 · 温暖催泪", color:"#E8DAEF", aid:403426087, cids:[1196671076] },
    { name:"三个和尚", tag:"动画短片", info:"1981 · 无台词神作", color:"#F0B27A", aid:114634858173904, cids:[30347038502] },
    { name:"猴子捞月", tag:"动画短片", info:"1981 · 剪纸动画", color:"#E59866", aid:116815560706355, cids:[39423446712] },
    { name:"如果国宝会说话", tag:"纪录片", info:"央视出品 · 精选5集", color:"#DC7633", aid:17987588, cids:[30028094,29367088,29367093,29367096,29994951] }
  ];

  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';

  function renderMovies(){
    var wrap = document.getElementById("movie-grid");
    if(!wrap) return;
    var html = "";
    for(var i = 0; i < MOVIES.length; i++){
      var m = MOVIES[i];
      html +=
        '<button type="button" class="movie-card reveal" data-i="' + i + '" style="--movie-color:' + m.color + '">' +
          '<span class="movie-tag">' + m.tag + '</span>' +
          '<span class="movie-name">' + m.name + '</span>' +
          '<span class="movie-info">' + m.info + '</span>' +
          '<span class="movie-play">' + PLAY_ICON + '<b>点开就看</b></span>' +
        '</button>';
    }
    wrap.innerHTML = html;
  }
  renderMovies();

  /* ---------- 播放器弹层（支持选集） ---------- */
  var mask = document.getElementById("player-mask");
  var iframe = document.getElementById("player-iframe");
  var ptitle = document.getElementById("player-title");
  var epBar = document.getElementById("ep-bar");
  var epList = document.getElementById("ep-list");
  var curMovie = null;
  var curEp = 0;

  function buildEps(cids){
    epList.innerHTML = "";
    for(var i = 0; i < cids.length; i++){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ep-btn" + (i === 0 ? " active" : "");
      b.textContent = "第" + (i + 1) + "集";
      b.setAttribute("data-ep", i);
      epList.appendChild(b);
    }
  }
  function setEp(m, i){
    if(!m) return;
    curEp = i;
    iframe.src = "https://player.bilibili.com/player.html?aid=" + m.aid + "&cid=" + m.cids[i] + "&high_quality=1&danmaku=0";
    var btns = epList.querySelectorAll(".ep-btn");
    for(var j = 0; j < btns.length; j++){ btns[j].classList.toggle("active", j === i); }
  }
  function openPlayer(i){
    var m = MOVIES[i];
    if(!m) return;
    curMovie = m;
    ptitle.textContent = m.name;
    var multi = m.cids && m.cids.length > 1;
    epBar.hidden = !multi;
    if(multi){ buildEps(m.cids); }
    setEp(m, 0);
    mask.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePlayer(){
    iframe.src = "";
    mask.hidden = true;
    document.body.style.overflow = "";
  }
  document.addEventListener("click", function(e){
    var card = e.target.closest ? e.target.closest(".movie-card") : null;
    if(card){ openPlayer(parseInt(card.getAttribute("data-i"), 10) || 0); return; }
    var ep = e.target.closest ? e.target.closest(".ep-btn") : null;
    if(ep){ setEp(curMovie, parseInt(ep.getAttribute("data-ep"), 10) || 0); return; }
    if(e.target.closest && e.target.closest("#player-close")){ closePlayer(); return; }
    if(e.target === mask){ closePlayer(); }
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && mask && !mask.hidden){ closePlayer(); }
  });

  function renderLinks(containerId, list){
    var wrap = document.getElementById(containerId);
    if(!wrap) return;
    var html = "";
    for(var i = 0; i < list.length; i++){
      var item = list[i];
      html +=
        '<a class="dl-card" href="' + item.url + '" target="_blank" rel="noopener" style="--card-color:' + item.color + '">' +
          '<span class="dl-icon">' + item.abbr + '</span>' +
          '<span class="dl-name">' + item.name + '</span>' +
          '<span class="dl-desc">' + item.desc + '</span>' +
          '<span class="dl-go">进入官网' + GO_ICON + '</span>' +
        '</a>';
    }
    wrap.innerHTML = html;
  }

  renderLinks("social-grid", SOCIAL_LINKS);
  renderLinks("game-grid", GAME_LINKS);
  renderLinks("tool-grid", TOOL_LINKS);

  var socialCount = document.getElementById("social-count");
  if(socialCount) socialCount.textContent = SOCIAL_LINKS.length + " 款";
  var gameCount = document.getElementById("game-count");
  if(gameCount) gameCount.textContent = GAME_LINKS.length + " 款";
  var toolCount = document.getElementById("tool-count");
  if(toolCount) toolCount.textContent = TOOL_LINKS.length + " 款";

  /* ---------- 星星粒子 ---------- */
  var field = document.getElementById("star-field");
  if(field){
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STAR_COUNT = prefersReduced ? 12 : 44;
    var stars = [];
    for(var i = 0; i < STAR_COUNT; i++){
      var s = document.createElement("span");
      var size = 2 + Math.random() * 4;
      var left = Math.random() * 100;
      var top = Math.random() * 100;
      var duration = 6 + Math.random() * 8;
      s.style.cssText =
        "position:absolute;left:" + left + "%;top:" + top + "%;" +
        "width:" + size + "px;height:" + size + "px;border-radius:50%;" +
        "background:rgba(255,225,161," + (0.35 + Math.random() * 0.55) + ");" +
        "box-shadow:0 0 " + (size * 2) + "px rgba(255,201,75,.6);";
      field.appendChild(s);
      stars.push({ el: s, speed: 0.12 + Math.random() * 0.3, drift: (Math.random() - 0.5) * 0.35, phase: Math.random() * Math.PI * 2, baseTop: parseFloat(top), baseLeft: parseFloat(left), dur: duration });
    }
    var last = performance.now();
    function tick(now){
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var t = now / 1000;
      for(var j = 0; j < stars.length; j++){
        var st = stars[j];
        var y = st.baseTop + Math.sin(t * st.speed + st.phase) * 4;
        var x = st.baseLeft + Math.cos(t * st.speed * 0.7 + st.phase) * 2 + st.drift * dt;
        if(x < 0) x = 100;
        if(x > 100) x = 0;
        st.baseLeft = x;
        st.el.style.top = y + "%";
        st.el.style.left = x + "%";
        var blink = 0.55 + 0.45 * Math.sin(t * 1.6 + st.phase * 3);
        st.el.style.opacity = blink.toFixed(3);
      }
      requestAnimationFrame(tick);
    }
    if(!prefersReduced){
      requestAnimationFrame(tick);
    } else {
      for(var k = 0; k < stars.length; k++){
        stars[k].el.style.opacity = "0.8";
      }
    }
  }

  /* ---------- 滚动渐显 ---------- */
  if("IntersectionObserver" in window){
    var revealEls = document.querySelectorAll(".reveal");
    var io = new IntersectionObserver(function(entries){
      for(var i = 0; i < entries.length; i++){
        if(entries[i].isIntersecting){
          entries[i].target.classList.add("visible");
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12 });
    for(var m = 0; m < revealEls.length; m++){
      io.observe(revealEls[m]);
    }
  } else {
    var els = document.querySelectorAll(".reveal");
    for(var n = 0; n < els.length; n++){
      els[n].classList.add("visible");
    }
  }
})();
