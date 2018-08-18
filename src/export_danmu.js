import { hookSetter, saveTextAsFile, $ } from './utils'

let text, title
export const exportdanmu = $('<a>')
	.on('click', e => {
		e.preventDefault()
		saveTextAsFile(text, `${title}_彈幕.json`)
	})
	.text('把彈幕存成檔案')
	.addClass('anig-tb')
//extra: add a button to download danmu as json file
const restore = hookSetter(animefun, 'danmu', danmu => {
	text = JSON.stringify(danmu)
	title = $('.anime_name h1').text()
	restore()
})
