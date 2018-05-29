// ==UserScript==
// @name        動畫瘋工具箱
// @namespace   https://blog.maple3142.net/
// @description 取得動畫的 m3u8 網址，下載彈幕為 json，去除擋廣告的警告訊息
// @version     0.7.1
// @author      maple3142
// @match       https://ani.gamer.com.tw/animeVideo.php?sn=*
// @connect     home.gamer.com.tw
// @require     https://cdn.jsdelivr.net/npm/m3u8-parser@4.2.0/dist/m3u8-parser.min.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

(function () {
'use strict';

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
var $ = jQuery;

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
    window.ani_video = vid; //EXPOSE

    hookSetter(vid.K, 'src', onPlaylistUrl);
  });
});

function render(pls) {
  var html = pls.map(function (pl) {
    return "<div><label for=\"".concat(pl.res.height, "p\">").concat(pl.res.height, "P: </label><input id=\"").concat(pl.res.height, "p\" value=\"").concat(pl.url, "\" style=\"width: 500px;\"></div>");
  }).join('');
  $('.anime_name').append("<div id=\"anigamer_m3u8_warpper\">".concat(html, "</div>"));
}

function onPlaylistUrl(playlisturl) {
  if (playlisturl.indexOf('gamer_ad') !== -1) {
    //is ad
    return;
  }

  var baseurl = playlisturl.replace(/index\.m3u8.*/, '');
  fetch(playlisturl).then(function (r) {
    return r.text();
  }).then(cvtM3U8_to_playlist(baseurl)).then(function (pls) {
    return window.M3U8_PLAYLIST = pls;
  }) //EXPOSE
  .then(render);
}

var restore = hookSetter(animefun, 'danmu', function (danmu) {
  var text = JSON.stringify(danmu);
  var title = $('.anime_name h1').text();
  $('.anime_name').append($('<a>').on('click', function (e) {
    e.preventDefault();
    saveTextAsFile(text, "".concat(title, "_\u5F48\u5E55.json"));
  }).text('把彈幕存成檔案').css('display', 'block'));
  restore();
});

//extra: block anti adblock alert
var orig_alert = alert;

unsafeWindow.alert = function (t) {
  if (t.includes('由於擋廣告插件會影響播放器運作')) return;
  orig_alert(t);
};

var hurl = 'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818';
$('.anime_name').append($('<a>').on('click', function (e) {
  e.preventDefault();
  ani_video.total_time = 1000;
  ani_video.currentTime(ani_video.duration());
}).text('直接顯示動漫通問題').css('display', 'block')).append($('<a>').on('click', function (e) {
  getCORS(hurl).then(function (ht) {
    var $h = $(ht);
    var url = $h.find('.TS1').toArray().filter(function (x) {
      return new RegExp('\\d{2}/' + new Date().getDate()).test(x.textContent);
    }).map(function (x) {
      return x.getAttribute('href');
    })[0];
    if (!url) throw new Error('No url found.');
    return getCORS('https://home.gamer.com.tw/' + url);
  }).then(function (ht) {
    var $h = $(ht);
    return /A:(\d)/.exec($h.find('.MSG-list8C').find('div').text())[1];
  }).then(function (ans) {
    alert('答案可能是 ' + ans);
  }).catch(function (err) {
    console.error(err);
    alert('抓取答案失敗，建議去官方粉絲團尋找答案');
  });
}).text('試著從 blackxblue 小屋中抓取答案(實驗性)').css('display', 'block'));

}());
