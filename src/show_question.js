import { $, getCORS } from './utils'

const hurl = 'https://home.gamer.com.tw/creationCategory.php?owner=blackxblue&c=370818'

$('.anime_name')
	.append(
		$('<a>')
			.on('click', e => {
				e.preventDefault()
				ani_video.total_time = 1000
				ani_video.currentTime(ani_video.duration())
			})
			.text('直接顯示動漫通問題')
			.css('display', 'block')
	)
	.append(
		$('<a>')
			.on('click', e => {
				getCORS(hurl)
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
					.then(ans => {
						alert('答案可能是 ' + ans)
					})
					.catch(err => {
						console.error(err)
						alert('抓取答案失敗，建議去官方粉絲團尋找答案')
					})
			})
			.text('試著從 blackxblue 小屋中抓取答案(實驗性)')
			.css('display', 'block')
	)
