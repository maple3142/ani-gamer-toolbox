// ==UserScript==
// @name        動畫瘋工具箱
// @namespace   https://blog.maple3142.net/
// @description 取得動畫的 m3u8 網址，下載彈幕為 json，去除擋廣告的警告訊息
// @version     0.9.0
// @author      maple3142
// @match       https://ani.gamer.com.tw/animeVideo.php?sn=*
// @connect     home.gamer.com.tw
// @require     https://cdn.jsdelivr.net/npm/m3u8-parser@4.2.0/dist/m3u8-parser.min.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

(function () {
'use strict';

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
    var url = $h.find('.TS1').toArray().filter(function (x) {
      return new RegExp('\\d{2}/' + new Date().getDate().toString().padStart(2, '0')).test(x.textContent);
    }).map(function (x) {
      return x.getAttribute('href');
    })[0];
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

var $ct = $('<div>').addClass('anig-ct');
$ct.append(exportdanmu).append(showans).append(fetchans).append(answerans);
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
