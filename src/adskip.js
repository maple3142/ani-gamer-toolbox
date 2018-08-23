import { $ } from './utils'

const URL =
	'https://greasyfork.org/zh-TW/scripts/370155-%E8%B7%B3%E9%81%8E%E5%8B%95%E7%95%AB%E7%98%8B%E5%BB%A3%E5%91%8A'

export const adskip = $('<a>')
	.on('click', e => {
		if (confirm('這需要下載另一個腳本，請問要打開連結嗎?')) {
			window.open(URL, '_blank')
			GM_setValue('hideadskip', true)
			adskip.hide()
		} else {
			if (confirm('隱藏此按鈕? 重新安裝腳本可以重新顯示此按鈕')) {
				GM_setValue('hideadskip', true)
				adskip.hide()
			}
		}
	})
	.text('跳過動畫瘋廣告 ( 宣傳 )')
	.addClass('anig-tb')

if (GM_getValue('hideadskip')) {
	adskip.hide()
}
