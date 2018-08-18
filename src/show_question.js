import { $, answerQuestion, getTodayAnswer } from './utils'

export const showans = $('<a>')
	.on('click', e => {
		e.preventDefault()
		ani_video.total_time = 1000
		ani_video.currentTime(ani_video.duration())
	})
	.text('直接顯示動漫通問題')
	.addClass('anig-tb')
export const fetchans = $('<a>')
	.on('click', e => {
		getTodayAnswer()
			.then(ans => {
				alert('答案可能是 ' + ans)
			})
			.catch(err => {
				console.error(err)
				alert('抓取答案失敗，建議去官方粉絲團尋找答案')
			})
	})
	.text('試著從 blackxblue 小屋中抓取答案(實驗性)')
	.addClass('anig-tb')
export const answerans = $('<a>')
	.on('click', e => {
		getTodayAnswer()
			.then(answerQuestion)
			.then(result => {
				alert(`答題成功: ${result.gift}`)
			})
			.catch(err => {
				console.error(err)
				alert(`回答問題失敗: ${err.msg}`)
			})
	})
	.text('直接回答問題(實驗性)')
	.addClass('anig-tb')
