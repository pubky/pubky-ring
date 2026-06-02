module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		// React Compiler must run first so it can analyze components before
		// other transforms. react-native-worklets/plugin must remain last.
		'babel-plugin-react-compiler',
		'react-native-worklets/plugin',
	],
};
