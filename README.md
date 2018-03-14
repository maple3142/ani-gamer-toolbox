# 動畫瘋工具箱

[![Greenkeeper badge](https://badges.greenkeeper.io/maple3142/ani-gamer-toolbox.svg)](https://greenkeeper.io/)

[Greasy Fork](https://greasyfork.org/zh-TW/scripts/39136-%E5%8B%95%E7%95%AB%E7%98%8B%E5%B7%A5%E5%85%B7%E7%AE%B1)
[GitHub](https://github.com/maple3142/ani-gamer-toolbox)

## 取得動畫 m3u8 網址

範例: [魔法使的新娘 21](https://ani.gamer.com.tw/animeVideo.php?sn=9579)

安裝插件後打開網址，會在下方看到 "360p,540p..." 的欄位，複製那個網址使用 vlc 播放或是 ffmpeg 下載都可以

> 若是有廣告，在廣告結束後網址一樣會出現

ffmpeg 下載指令: `ffmpeg -i "複製來的 m3u8 網址" -c copy "輸出的檔案名稱.ts"`

## 下載彈幕

在下方有個連結 `把彈幕存成檔案`，點下去就好

## 去廣告阻擋警告訊息

在偵測到廣告阻擋器(adb,ublock 之類的)時動畫瘋會有個警告，要求關閉廣告阻擋
這個在安裝插件後會自動被阻擋