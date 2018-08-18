const metablock = require('rollup-plugin-userscript-metablock')

module.exports = {
	format: ['iife'],
	plugins: [
		metablock({
			file: 'src/meta.json'
		})
	],
	postcss: { extract: false }
}
