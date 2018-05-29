//extra: block anti adblock alert
const orig_alert = alert
unsafeWindow.alert = function(t) {
	if (t.includes('由於擋廣告插件會影響播放器運作')) return
	orig_alert(t)
}
