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
    { name:"大闹天宫", tag:"动画电影", info:"1961 · 经典之作 · 112分钟", color:"#F5B041", src:"https://player.bilibili.com/player.html?bvid=BV1iY4y1Z7pJ&page=1&high_quality=1&danmaku=0" },
    { name:"哪吒闹海", tag:"动画电影", info:"1979 · 上美经典 · 65分钟", color:"#5DADE2", src:"https://player.bilibili.com/player.html?aid=2434608&cid=3684318&high_quality=1&danmaku=0" },
    { name:"葫芦兄弟", tag:"经典剧集", info:"13集 · 剪纸动画", color:"#58D68D", src:"https://player.bilibili.com/player.html?aid=2425770&cid=3684209&high_quality=1&danmaku=0" },
    { name:"黑猫警长", tag:"经典剧集", info:"5集 · 国产动画", color:"#AF7AC5", src:"https://player.bilibili.com/player.html?aid=2435223&cid=3682973&high_quality=1&danmaku=0" },
    { name:"舒克和贝塔", tag:"经典剧集", info:"13集 · 开飞机的小老鼠", color:"#48C9B0", src:"https://player.bilibili.com/player.html?bvid=BV1ZG411s7qB&page=1&high_quality=1&danmaku=0" },
    { name:"邋遢大王奇遇记", tag:"经典剧集", info:"13集 · 地下冒险记", color:"#EC7063", src:"https://player.bilibili.com/player.html?bvid=BV1xG411x7XD&page=1&high_quality=1&danmaku=0" },
    { name:"阿凡提的故事", tag:"经典剧集", info:"14集 · 木偶动画", color:"#A569BD", src:"https://player.bilibili.com/player.html?bvid=BV19f4y1o7cb&page=1&high_quality=1&danmaku=0" },
    { name:"雪孩子", tag:"动画短片", info:"1980 · 温暖催泪", color:"#85C1E9", src:"https://player.bilibili.com/player.html?bvid=BV1dV411T7B4&page=1&high_quality=1&danmaku=0" },
    { name:"三个和尚", tag:"动画短片", info:"1981 · 无台词神作", color:"#F7DC6F", src:"https://player.bilibili.com/player.html?bvid=BV1GdTTzCEDD&page=1&high_quality=1&danmaku=0" },
    { name:"九色鹿", tag:"动画短片", info:"1981 · 敦煌壁画风", color:"#48C9B0", src:"https://player.bilibili.com/player.html?bvid=BV1k7Gt6mEKV&page=1&high_quality=1&danmaku=0" },
    { name:"猴子捞月", tag:"动画短片", info:"1981 · 剪纸动画", color:"#E59866", src:"https://player.bilibili.com/player.html?bvid=BV1697362EKr&page=1&high_quality=1&danmaku=0" },
    { name:"如果国宝会说话", tag:"纪录片", info:"央视出品 · 25集", color:"#E67E22", src:"https://player.bilibili.com/player.html?aid=17987588&cid=30028094&high_quality=1&danmaku=0" }
  ];

  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';

  function renderMovies(){
    var wrap = document.getElementById("movie-grid");
    if(!wrap) return;
    var html = "";
    for(var i = 0; i < MOVIES.length; i++){
      var m = MOVIES[i];
      html +=
        '<button type="button" class="movie-card reveal" data-src="' + m.src + '" style="--movie-color:' + m.color + '">' +
          '<span class="movie-tag">' + m.tag + '</span>' +
          '<span class="movie-name">' + m.name + '</span>' +
          '<span class="movie-info">' + m.info + '</span>' +
          '<span class="movie-play">' + PLAY_ICON + '<b>点开就看</b></span>' +
        '</button>';
    }
    wrap.innerHTML = html;
  }
  renderMovies();

  /* ---------- 播放器弹层 ---------- */
  var mask = document.getElementById("player-mask");
  var iframe = document.getElementById("player-iframe");
  var ptitle = document.getElementById("player-title");
  function openPlayer(card){
    var src = card.getAttribute("data-src");
    if(!src) return;
    var nm = card.querySelector(".movie-name");
    ptitle.textContent = nm ? nm.textContent : "";
    iframe.src = src;
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
    if(card){ openPlayer(card); return; }
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
