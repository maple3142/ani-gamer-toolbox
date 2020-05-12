export const $ = jQuery
export function hookSetter(obj, prop, cb) {
	let value,
		canceled = false
	Object.defineProperty(obj, prop, {
		set: v => {
			value = v
			if (!canceled) cb(v)
		},
		get: () => value
	})
	return () => (canceled = true)
}
export function cvtM3U8_to_playlist(baseurl) {
	return m3u8 => {
		const parser = new m3u8Parser.Parser()
		parser.push(m3u8)
		parser.end()
		const pls = parser.manifest.playlists.map(pl => ({
			url: new URL(pl.uri, baseurl).href,
			res: pl.attributes.RESOLUTION
		}))
		return pls
	}
}
export function triggerDownload(url, fname) {
	const a = document.createElement('a')
	a.href = url
	a.download = fname
	document.body.appendChild(a)
	a.click()
	a.remove()
}
export function saveTextAsFile(text, fname) {
	const blob = new Blob([text])
	const url = URL.createObjectURL(blob)
	triggerDownload(url, fname)
	URL.revokeObjectURL(url)
}
export const gxf = xf.extend({ fetch: gmfetch })
const hurl =
	'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818'
export function getTodayAnswer() {
	return gxf
		.get('https://api.gamer.com.tw/mobile_app/bahamut/v1/home.php', {
			qs: { owner: 'blackXblue', page: 1 }
		})
		.json(
			({ creation }) => creation.find(x => x.title.includes('動漫通')).sn
		)
		.then(sn =>
			gxf.get(
				'https://api.gamer.com.tw/mobile_app/bahamut/v1/home_creation_detail.php',
				{ qs: { sn } }
			)
		)
		.json(({ content }) => {
			const body = /<body[\s\w"-=]*>([\s\S]*)<\/body>/.exec(content)[1]
			const ans = /A[:：](\d)/.exec(body)[1]
			return parseInt(ans)
		})
}
export function getQuestion() {
	return xf
		.get('/ajax/animeGetQuestion.php', { qs: { t: Date.now() } })
		.json()
}
export function answerQuestion(t) {
	return getQuestion()
		.then(obj =>
			xf
				.post('/ajax/animeAnsQuestion.php', {
					urlencoded: {
						token: obj.token,
						ans: t,
						t: Date.now()
					}
				})
				.json()
		)
		.then(o => {
			if (o.error || o.msg === '答題錯誤') throw o
			return o
		})
}
