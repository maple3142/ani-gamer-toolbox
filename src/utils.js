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
export function getCORS(url) {
	return new Promise((res, rej) => {
		GM_xmlhttpRequest({
			method: 'GET',
			url,
			responseType: 'text',
			onload: r => res(r.response),
			onerror: rej
		})
	})
}
const hurl = 'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818'
export function getTodayAnswer() {
	return getCORS(hurl)
		.then(ht => {
			const $h = $(ht)
			const url = $h
				.find('.TS1')
				.toArray()
				.filter(x =>
					new RegExp(
						'\\d{2}/' +
							new Date()
								.getDate()
								.toString()
								.padStart(2, '0')
					).test(x.textContent)
				)
				.map(x => x.getAttribute('href'))[0]
			if (!url) throw new Error('No url found.')
			return getCORS('https://home.gamer.com.tw/' + url)
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
	return Promise.resolve($.ajax({ url: '/ajax/animeGetQuestion.php', data: 't=' + Date.now() })).then(JSON.parse)
}
export function answerQuestion(t) {
	return getQuestion()
		.then(obj =>
			$.ajax({
				type: 'POST',
				url: '/ajax/animeAnsQuestion.php',
				data: 'token=' + obj.token + '&ans=' + t + '&t=' + Date.now()
			})
		)
		.then(JSON.parse)
		.then(o => {
			if (o.error || o.msg === '答題錯誤') throw o
			return o
		})
}
