// ==UserScript==
// @name        動畫瘋工具箱
// @namespace   https://blog.maple3142.net/
// @description 取得動畫的 m3u8 網址，下載彈幕為 json，去除擋廣告的警告訊息
// @version     0.9.1
// @author      maple3142
// @match       https://ani.gamer.com.tw/animeVideo.php?sn=*
// @connect     home.gamer.com.tw
// @require     https://cdn.jsdelivr.net/npm/m3u8-parser@4.2.0/dist/m3u8-parser.min.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

(function () {
'use strict';

function _sliceIterator(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _slicedToArray(arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else if (Symbol.iterator in Object(arr)) {
    return _sliceIterator(arr, i);
  } else {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }
}

var $ = jQuery;
function hookSetter(obj, prop, cb) {
  var value,
      canceled = false;
  Object.defineProperty(obj, prop, {
    set: function set(v) {
      value = v;
      if (!canceled) cb(v);
    },
    get: function get() {
      return value;
    }
  });
  return function () {
    return canceled = true;
  };
}
function cvtM3U8_to_playlist(baseurl) {
  return function (m3u8) {
    var parser = new m3u8Parser.Parser();
    parser.push(m3u8);
    parser.end();
    var pls = parser.manifest.playlists.map(function (pl) {
      return {
        url: 'https:' + baseurl + pl.uri,
        res: pl.attributes.RESOLUTION
      };
    });
    return pls;
  };
}
function triggerDownload(url, fname) {
  var a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function saveTextAsFile(text, fname) {
  var blob = new Blob([text]);
  var url = URL.createObjectURL(blob);
  triggerDownload(url, fname);
  URL.revokeObjectURL(url);
}
function getCORS(url) {
  return new Promise(function (res, rej) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      responseType: 'text',
      onload: function onload(r) {
        return res(r.response);
      },
      onerror: rej
    });
  });
}
var hurl = 'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818';
function getTodayAnswer() {
  return getCORS(hurl).then(function (ht) {
    var $h = $(ht);
    var $el = $($h.find('.TS1')[0]);
    var r = /(\d+)\/(\d+)/.exec($el.text());
    if (!r) throw new Error('Unexpected error.');

    var _r$slice$map = r.slice(1).map(Number),
        _r$slice$map2 = _slicedToArray(_r$slice$map, 2),
        month = _r$slice$map2[0],
        date = _r$slice$map2[1];

    var d = new Date();
    if (month !== d.getMonth() + 1 || date !== d.getDate()) throw new Error('Invalid date.');
    var url = $el.attr('href');
    if (!url) throw new Error('No url found.');
    return getCORS('https://home.gamer.com.tw/' + url);
  }).then(function (ht) {
    var $h = $(ht);
    return /A:(\d)/.exec($h.find('.MSG-list8C').find('div').text())[1];
  });
}
function getQuestion() {
  return Promise.resolve($.ajax({
    url: '/ajax/animeGetQuestion.php',
    data: 't=' + Date.now()
  })).then(JSON.parse);
}
function answerQuestion(t) {
  return getQuestion().then(function (obj) {
    return $.ajax({
      type: 'POST',
      url: '/ajax/animeAnsQuestion.php',
      data: 'token=' + obj.token + '&ans=' + t + '&t=' + Date.now()
    });
  }).then(JSON.parse).then(function (o) {
    if (o.error || o.msg === '答題錯誤') throw o;
    return o;
  });
}

var m3u8container = $('<div>').addClass('anig-ct'); //in order to get videojs instance

requirejs.config({
  baseUrl: '//i2.bahamut.com.tw',
  waitSeconds: 0,
  paths: {
    order: 'js/order'
  },
  shim: {
    vastvpaid: {
      deps: ['videojs']
    }
  }
});
requirejs(['order!videojs'], function (videojs) {
  return hookSetter(videojs.players, 'ani_video', function (vid) {
    unsafeWindow.ani_video = vid; //EXPOSE

    hookSetter(vid.K, 'src', onPlaylistUrl);
  });
});

function render(pls) {
  pls.map(function (pl) {
    return $('<a>').addClass('anig-tb').addClass('tdn').text(pl.res.height + 'p').attr('href', pl.url).attr('target', '_blank');
  }).forEach(function (el) {
    return m3u8container.append(el);
  });
}

function onPlaylistUrl(playlisturl) {
  if (playlisturl.indexOf('gamer_ad') !== -1) {
    //is ad
    return;
  }

  var baseurl = playlisturl.replace(/playlist\.m3u8.*/, '');
  fetch(playlisturl).then(function (r) {
    return r.text();
  }).then(cvtM3U8_to_playlist(baseurl)).then(function (pls) {
    return window.unsafeWindow = pls;
  }) //EXPOSE
  .then(render);
}

//extra: block anti adblock alert
var orig_alert = alert;

unsafeWindow.alert = function (t) {
  if (t.includes('由於擋廣告插件會影響播放器運作')) return;
  orig_alert(t);
};

var text;
var title;
var exportdanmu = $('<a>').on('click', function (e) {
  e.preventDefault();
  saveTextAsFile(text, "".concat(title, "_\u5F48\u5E55.json"));
}).text('把彈幕存成檔案').addClass('anig-tb'); //extra: add a button to download danmu as json file

var restore = hookSetter(animefun, 'danmu', function (danmu) {
  text = JSON.stringify(danmu);
  title = $('.anime_name h1').text();
  restore();
});

var showans = $('<a>').on('click', function (e) {
  e.preventDefault();
  ani_video.total_time = 1000;
  ani_video.currentTime(ani_video.duration());
}).text('直接顯示動漫通問題').addClass('anig-tb');
var fetchans = $('<a>').on('click', function (e) {
  getTodayAnswer().then(function (ans) {
    alert('答案可能是 ' + ans);
  }).catch(function (err) {
    console.error(err);
    alert('抓取答案失敗，建議去官方粉絲團尋找答案');
  });
}).text('試著從 blackxblue 小屋中抓取答案(實驗性)').addClass('anig-tb');
var answerans = $('<a>').on('click', function (e) {
  getTodayAnswer().then(answerQuestion).then(function (result) {
    alert("\u7B54\u984C\u6210\u529F: ".concat(result.gift));
  }).catch(function (err) {
    console.error(err);
    alert("\u56DE\u7B54\u554F\u984C\u5931\u6557: ".concat(err.msg));
  });
}).text('直接回答問題(實驗性)').addClass('anig-tb');

var URL$1 = 'https://greasyfork.org/zh-TW/scripts/370155-%E8%B7%B3%E9%81%8E%E5%8B%95%E7%95%AB%E7%98%8B%E5%BB%A3%E5%91%8A';
var adskip = $('<a>').on('click', function (e) {
  if (confirm('這需要下載另一個腳本，請問要打開連結嗎?')) {
    window.open(URL$1, '_blank');
    GM_setValue('hideadskip', true);
    adskip.hide();
  } else {
    if (confirm('隱藏此按鈕? 重新安裝腳本可以重新顯示此按鈕')) {
      GM_setValue('hideadskip', true);
      adskip.hide();
    }
  }
}).text('跳過動畫瘋廣告 ( 宣傳 )').addClass('anig-tb');

if (GM_getValue('hideadskip')) {
  adskip.hide();
}

var $ct = $('<div>').addClass('anig-ct');
$ct.append(exportdanmu).append(showans).append(fetchans).append(answerans).append(adskip);
$('.anime_name').append($ct).append(m3u8container);

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css = ".anig-ct {\n\tdisplay: flex;\n\twidth: 100%;\n\tmargin: 5px;\n}\n\n.anig-tb {\n\tdisplay: inline-block;\n\tpadding: 5px;\n\tbackground: #00B4D8;\n\tcolor: #FFF;\n\tmargin-right: 5px;\n\tborder: 1px solid #BBB;\n}\n\n.tdn{\n\ttext-decoration: none;\n}\n";
styleInject(css);

}());
