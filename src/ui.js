import { exportdanmu } from './export_danmu'
import { showans, fetchans, answerans } from './show_question'
import { m3u8container } from './urlfinder'
import { $ } from './utils'

const $ct = $('<div>').addClass('anig-ct')
$ct.append(exportdanmu)
	.append(showans)
	.append(fetchans)
	.append(answerans)

$('.anime_name').append($ct).append(m3u8container)
