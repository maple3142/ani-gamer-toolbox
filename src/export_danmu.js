import { hookSetter, saveTextAsFile, $ } from './utils'

//extra: add a button to download danmu as json file
const restore = hookSetter(animefun, 'danmu', danmu => {
	const text = JSON.stringify(danmu)
	const title = $('.anime_name h1').text()
	$('.anime_name').append(
		$('<a>')
			.on('click', e => {
				e.preventDefault()
				saveTextAsFile(text, `${title}_彈幕.json`)
			})
			.text('把彈幕存成檔案')
			.css('display', 'block')
	)
	restore()
})
