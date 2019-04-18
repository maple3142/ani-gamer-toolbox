import { hookSetter, cvtM3U8_to_playlist, $ } from './utils'

export const m3u8container = $('<div>').addClass('anig-ct')
//in order to get videojs instance
requirejs.config({
	baseUrl: '//i2.bahamut.com.tw',
	waitSeconds: 0,
	paths: {
		order: 'js/order',
		videojs: 'js/videojs/video7'
	},
	shim: {
		vastvpaid: {
			deps: ['videojs']
		}
	}
})
requirejs(['order!videojs'], videojs =>
	hookSetter(videojs.players, 'ani_video', vid => {
		unsafeWindow.ani_video = vid //EXPOSE

		const fn = vid.src.bind(vid)
		vid.src = src => {
			if (!src) {
				return fn()
			}
			onPlaylistUrl(typeof src === 'string' ? src : src.src)
			fn(src)
		}
	})
)
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
