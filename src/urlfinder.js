import { hookSetter, cvtM3U8_to_playlist, $ } from './utils'

export const m3u8container = $('<div>').addClass('anig-ct')

const it = setInterval(() => {
	if (typeof videojs !== 'undefined' && videojs.getPlayer('ani_video')) {
		clearInterval(it)
		const vid = videojs.getPlayer('ani_video')
		unsafeWindow.ani_video = vid
		var fn = vid.src.bind(vid)

		vid.src = function(src) {
			if (!src) {
				return fn()
			}

			onPlaylistUrl(typeof src === 'string' ? src : src.src)
			fn(src)
		}
	}
}, 100)

function render(pls) {
	pls.map(pl =>
		$('<a>')
			.addClass('anig-tb')
			.addClass('tdn')
			.text(pl.res.height + 'p')
			.attr('href', pl.url)
			.attr('target', '_blank')
	).forEach(el => m3u8container.append(el))
}

function onPlaylistUrl(playlisturl) {
	if (playlisturl.indexOf('gamer_ad') !== -1) {
		//is ad
		return
	}
	const baseurl = playlisturl.replace(/playlist\.m3u8.*/, '')
	fetch(playlisturl)
		.then(r => r.text())
		.then(cvtM3U8_to_playlist(baseurl))
		.then(pls => (window.unsafeWindow = pls)) //EXPOSE
		.then(render)
}
