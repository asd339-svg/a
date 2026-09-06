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

  /* ---------- 在线影院数据（eps: [[aid,cid], ...] 每集一组） ---------- */
  var MOVIES = [
    { name:"西游记（央视动画）", tag:"经典剧集", info:"1999 · 猴哥 · 52集全", color:"#F5B041", eps:[[205684454,342113036],[205684454,342116630],[205684454,342121354],[205684454,342248434],[205684454,342248972],[205684454,342250139],[205684454,342250629],[205684454,342258131],[205684454,342276519],[205684454,342277812],[205684454,342279580],[205684454,342281462],[205684454,342283588],[205684454,342316603],[205684454,342318887],[205684454,342322273],[205684454,342324852],[205684454,342330304],[205684454,342342912],[205684454,342344735],[205684454,342347192],[205684454,342350250],[205684454,342355488],[205684454,342358301],[205684454,342363655],[205684454,342431454],[205684454,342437171],[205684454,342442163],[205684454,342449107],[205684454,342450879],[205684454,342452580],[205684454,342454525],[205684454,342456627],[205684454,342465101],[205684454,342763161],[205684454,342763627],[205684454,342764166],[205684454,342764608],[205684454,342765077],[205684454,342773352],[205684454,352496719],[205684454,342848002],[205684454,342849576],[205684454,342857337],[205684454,342859434],[205684454,342861206],[205684454,342864536],[205684454,342868718],[205684454,342870408],[205684454,342873802],[205684454,342877256],[205684454,342879594]] },
    { name:"葫芦兄弟", tag:"经典剧集", info:"13集 · 剪纸动画", color:"#58D68D", eps:[[2425770,3684209],[2425770,3684210],[2425770,3684211],[2425770,3684212],[2425770,3684213],[2425770,3684214],[2425770,3684215],[2425770,3684216],[2425770,3684217],[2425770,3684218],[2425770,3684219],[2425770,3684220],[2425770,3684221]] },
    { name:"黑猫警长", tag:"经典剧集", info:"5集 · 国民警长", color:"#AF7AC5", eps:[[2435223,3682973],[2435223,3682974],[2435223,3682975],[2435223,3682976],[2435223,3682977]] },
    { name:"舒克和贝塔", tag:"经典剧集", info:"13集 · 开飞机的小老鼠", color:"#48C9B0", eps:[[427941238,758658025],[427941238,758657941],[427941238,758658165],[427941238,758658148],[427941238,758657955],[427941238,758658928],[427941238,758659019],[427941238,758659428],[427941238,758659266],[427941238,758659239],[427941238,758661150],[427941238,758659749],[427941238,758659948]] },
    { name:"邋遢大王奇遇记", tag:"经典剧集", info:"13集 · 地下冒险记", color:"#EC7063", eps:[[427998000,758651149],[427998000,758651518],[427998000,758651198],[427998000,758651372],[427998000,758651095],[427998000,758652125],[427998000,758652711],[427998000,758652167],[427998000,758652247],[427998000,758652080],[427998000,758652490],[427998000,758652620],[427998000,758652600]] },
    { name:"阿凡提的故事", tag:"经典剧集", info:"14集 · 木偶动画", color:"#A569BD", eps:[[300456693,758598825],[300456693,758598402],[300456693,758599348],[300456693,758599887],[300456693,758598128],[300456693,758599359],[300456693,758601229],[300456693,758602082],[300456693,758600565],[300456693,758600857],[300456693,758600951],[300456693,758601085],[300456693,758601624],[300456693,758601843]] },
    { name:"熊出没之探险日记", tag:"经典剧集", info:"第一季 · 51集", color:"#F1948A", eps:[[115325005733549,32869253913],[115325005733549,32869254920],[115325005733549,32869255852],[115325005733549,32869256819],[115325005733549,32869319216],[115325005733549,32869319910],[115325005733549,32869321123],[115325005733549,32869322336],[115325005733549,32869384427],[115325005733549,32869385784],[115325005733549,32869386260],[115325005733549,32869386831],[115325005733549,32869387464],[115325005733549,32869388004],[115325005733549,32869450025],[115325005733549,32869450535],[115325005733549,32869451013],[115325005733549,32869451730],[115325005733549,32869452253],[115325005733549,32869453024],[115325005733549,32869453781],[115325005733549,32869515744],[115325005733549,32869516618],[115325005733549,32869517358],[115325005733549,32869518097],[115325005733549,32869518735],[115325005733549,32869580809],[115325005733549,32869581438],[115325005733549,32869581904],[115325005733549,32869582292],[115325005733549,32869582841],[115325005733549,32869583174],[115325005733549,32869583698],[115325005733549,32869584337],[115325005733549,32869584720],[115325005733549,32869646889],[115325005733549,32869647447],[115325005733549,32869647778],[115325005733549,32869648313],[115325005733549,32869648416],[115325005733549,32869649264],[115325005733549,32869649848],[115325005733549,32869650190],[115325005733549,32869712142],[115325005733549,32869712724],[115325005733549,32869713169],[115325005733549,32869713854],[115325005733549,32869714941],[115325005733549,32869777573],[115325005733549,32869778766],[115325005733549,32869780126]] },
    { name:"熊出没之怪兽计划2", tag:"经典剧集", info:"全52集 · 天才威的阴谋", color:"#7DCEA0", eps:[[113010387454591,500001659277385],[113010387454591,500001659277654],[113010387454591,500001659277569],[113010387454591,500001659278313],[113010387454591,500001659277751],[113010387454591,500001659285572],[113010387454591,500001659286746],[113010387454591,500001659286092],[113010387454591,500001659287999],[113010387454591,500001659288701],[113010387454591,500001659295460],[113010387454591,500001659297726],[113010387454591,500001659297855],[113010387454591,500001659298041],[113010387454591,500001659298126],[113010387454591,500001659373671],[113010387454591,500001659373677],[113010387454591,500001659532441],[113010387454591,500001659373457],[113010387454591,500001659534282],[113010387454591,500001659382155],[113010387454591,500001659382156],[113010387454591,500001659382339],[113010387454591,500001659383992],[113010387454591,500001659385556],[113010387454591,500001659388228],[113010387454591,500001659388355],[113010387454591,500001659389458],[113010387454591,500001659390674],[113010387454591,500001659395995],[113010387454591,500001659394747],[113010387454591,500001659395800],[113010387454591,500001659396469],[113010387454591,500001659399156],[113010387454591,500001659402725],[113010387454591,500001659405263],[113010387454591,500001659404081],[113010387454591,500001659404675],[113010387454591,500001659405445],[113010387454591,500001659411488],[113010387454591,500001659413078],[113010387454591,500001659414016],[113010387454591,500001659413793],[113010387454591,500001659416800],[113010387454591,500001659419495],[113010387454591,500001659421191],[113010387454591,500001659423212],[113010387454591,500001659424275],[113010387454591,500001659425354],[113010387454591,500001659426935],[113010387454591,500001659430320],[113010387454591,500001659432357]] },
    { name:"如果国宝会说话", tag:"纪录片", info:"央视出品 · 精选5集", color:"#DC7633", eps:[[17987588,30028094],[17987588,29367088],[17987588,29367093],[17987588,29367096],[17987588,29994951]] },
    { name:"大闹天宫", tag:"动画电影", info:"1961 · 经典之作 · 112分钟", color:"#F0B27A", eps:[[650527680,973278336]] },
    { name:"哪吒闹海", tag:"动画电影", info:"1979 · 上美经典 · 65分钟", color:"#5DADE2", eps:[[2434608,3684318]] },
    { name:"熊出没之夺宝熊兵", tag:"动画电影", info:"2014 · 熊出没大电影", color:"#F1948A", eps:[[116262013246214,36843292216]] },
    { name:"熊出没之雪岭熊风", tag:"动画电影", info:"2015 · 熊出没大电影", color:"#85C1E9", eps:[[115112639864506,32032884518]] },
    { name:"熊出没之狂野大陆", tag:"动画电影", info:"2021 · 熊出没大电影", color:"#7DCEA0", eps:[[115132873055921,32104974637]] },
    { name:"熊出没之伴我熊芯", tag:"动画电影", info:"2023 · 熊出没大电影", color:"#D2B4DE", eps:[[115932542277391,35522545964]] },
    { name:"九色鹿", tag:"动画短片", info:"1981 · 敦煌壁画风", color:"#F7DC6F", eps:[[116617505670934,38526256787]] },
    { name:"雪孩子", tag:"动画短片", info:"1980 · 温暖催泪", color:"#E8DAEF", eps:[[403426087,1196671076]] },
    { name:"三个和尚", tag:"动画短片", info:"1981 · 无台词神作", color:"#F5CBA7", eps:[[114634858173904,30347038502]] },
    { name:"猴子捞月", tag:"动画短片", info:"1981 · 剪纸动画", color:"#E59866", eps:[[116815560706355,39423446712]] }
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

  function buildEps(n){
    epList.innerHTML = "";
    for(var i = 0; i < n; i++){
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
    var ep = m.eps[i];
    if(!ep) return;
    iframe.src = "https://player.bilibili.com/player.html?aid=" + ep[0] + "&cid=" + ep[1] + "&high_quality=1&danmaku=0";
    var btns = epList.querySelectorAll(".ep-btn");
    for(var j = 0; j < btns.length; j++){ btns[j].classList.toggle("active", j === i); }
  }
  function openPlayer(i){
    var m = MOVIES[i];
    if(!m) return;
    curMovie = m;
    ptitle.textContent = m.name;
    var multi = m.eps && m.eps.length > 1;
    epBar.hidden = !multi;
    if(multi){ buildEps(m.eps.length); }
    setEp(m, 0);
    mask.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePlayer(){
    iframe.src = "";
    mask.hidden = true;
    document.body.style.overflow = "";
    if(document.fullscreenElement){ document.exitFullscreen(); }
  }
  var fsBtn = document.getElementById("player-fs");
  function toggleFullscreen(){
    var box = document.getElementById("player-box");
    if(document.fullscreenElement){
      document.exitFullscreen();
    }else if(box && box.requestFullscreen){
      box.requestFullscreen().catch(function(){});
    }
  }
  if(fsBtn){ fsBtn.addEventListener("click", toggleFullscreen); }
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
