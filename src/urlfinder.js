import { hookSetter, cvtM3U8_to_playlist, $ } from './utils'

//in order to get videojs instance
requirejs.config({
	baseUrl: '//i2.bahamut.com.tw',
	waitSeconds: 0,
	paths: {
		order: 'js/order'
	},
	shim: {
		viblast: {},
		vastvpaid: {
			deps: ['videojs']
		}
	}
})
requirejs(['order!videojs'], videojs =>
	hookSetter(videojs.players, 'ani_video', function onAniVideo(vid) {
		window.ani_video = vid //EXPOSE
		hookSetter(vid.K, 'src', onPlaylistUrl)
	})
)
function render(pls) {
	const html = pls
		.map(
			pl =>
				`<div><label for="${pl.res.height}p">${pl.res.height}P: </label><input id="${pl.res.height}p" value="${
					pl.url
				}" style="width: 500px;"></div>`
		)
		.join('')
	$('.anime_name').append(`<div id="anigamer_m3u8_warpper">${html}</div>`)
}

function onPlaylistUrl(playlisturl) {
	if (playlisturl.indexOf('gamer_ad') !== -1) {
		//is ad
		return
	}
	const baseurl = playlisturl.replace(/index\.m3u8.*/, '')
	fetch(playlisturl)
		.then(r => r.text())
		.then(cvtM3U8_to_playlist(baseurl))
		.then(pls => (window.M3U8_PLAYLIST = pls)) //EXPOSE
		.then(render)
}
