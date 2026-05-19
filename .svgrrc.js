module.exports = {
	native: true,
	typescript: true,
	dimensions: false,
	expandProps: 'end',
	memo: true,
	svgo: true,
	svgoConfig: {
		plugins: [
			{
				name: 'preset-default',
				params: {
					overrides: {
						removeViewBox: false,
					},
				},
			},
			'removeXMLNS',
		],
	},
	replaceAttrValues: {
		'#000': 'currentColor',
		'#000000': 'currentColor',
		black: 'currentColor',
		'#fff': 'currentColor',
		'#ffffff': 'currentColor',
		'#FFF': 'currentColor',
		'#FFFFFF': 'currentColor',
		white: 'currentColor',
	},
};
