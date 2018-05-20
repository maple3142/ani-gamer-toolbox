import { $ } from './utils'

$('.anime_name').append(
	$('<a>')
		.on('click', e => {
			e.preventDefault()
			ani_video.total_time = 1000
			ani_video.currentTime(ani_video.duration())
		})
		.text('直接顯示動漫通問題')
		.css('display', 'block')
)
