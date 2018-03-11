import { hookSetter, $ } from './utils'

//extra: add a button to download danmu as json file
hookSetter(animefun, 'danmu', danmu => {
	const text = JSON.stringify(danmu)
	const title = $('.anime_name h1').text()
	$('.anime_name').append(
		$('<a href="javascript:void(0)">把彈幕存成檔案</a>').on('click', () => {
			saveTextAsFile(text, `${title}_彈幕.json`)
		})
	)
})
