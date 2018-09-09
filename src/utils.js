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
			url: 'https:' + baseurl + pl.uri,
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
export const gxf = xf.create(gmfetch)
const hurl = 'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818'
export function getTodayAnswer() {
	return gxf
		.get(hurl)
		.text()
		.then(ht => {
			const $h = $(ht)
			const $el = $($h.find('.TS1')[0])
			const r = /(\d+)\/(\d+)/.exec($el.text())
			if (!r) throw new Error('Unexpected error.')
			const [month, date] = r.slice(1).map(Number)
			const d = new Date()
			if (month !== d.getMonth() + 1 || date !== d.getDate()) throw new Error('Invalid date.')
			const url = $el.attr('href')
			if (!url) throw new Error('No url found.')
			return gxf.get('https://home.gamer.com.tw/' + url).text()
		})
		.then(ht => {
			const $h = $(ht)
			return /A:(\d)/.exec(
				$h
					.find('.MSG-list8C')
					.find('div')
					.text()
			)[1]
		})
}
export function getQuestion() {
	return xf.get('/ajax/animeGetQuestion.php', { qs: { t: Date.now() } }).json()
}
export function answerQuestion(t) {
	return getQuestion()
		.then(obj =>
			xf.post('/ajax/animeAnsQuestion.php', {
				form: {
					token: obj.token,
					ans: t,
					t: Date.now()
				}
			}).json()
		)
		.then(o => {
			if (o.error || o.msg === '答題錯誤') throw o
			return o
		})
}
