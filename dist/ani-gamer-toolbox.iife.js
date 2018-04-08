// ==UserScript==
// @name        動畫瘋工具箱
// @namespace   https://blog.maple3142.net/
// @description 取得動畫的 m3u8 網址，下載彈幕為 json，去除擋廣告的警告訊息
// @version     0.6
// @author      maple3142
// @match       https://ani.gamer.com.tw/animeVideo.php?sn=*
// @require     https://cdn.jsdelivr.net/npm/m3u8-parser@4.2.0/dist/m3u8-parser.min.js
// @grant       none
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
  $('.anime_name').append($('<a href="javascript:void(0)">把彈幕存成檔案</a>').on('click', function () {
    saveTextAsFile(text, "".concat(title, "_\u5F48\u5E55.json"));
  }));
  restore();
});

//extra: block anti adblock alert
var orig_alert = alert;

alert = function alert(t) {
  if (t.includes('由於擋廣告插件會影響播放器運作')) return;
  orig_alert(t);
};

}());
