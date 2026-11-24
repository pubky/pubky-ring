// In-memory MMKV for tests; the package ships untranspiled ESM and needs native code.
const createMMKV = () => {
	const values = new Map();
	return {
		set: (key, value) => values.set(key, value),
		getString: key => (typeof values.get(key) === 'string' ? values.get(key) : undefined),
		getNumber: key => (typeof values.get(key) === 'number' ? values.get(key) : undefined),
		getBoolean: key => (typeof values.get(key) === 'boolean' ? values.get(key) : undefined),
		contains: key => values.has(key),
		remove: key => values.delete(key),
		getAllKeys: () => [...values.keys()],
		clearAll: () => values.clear(),
	};
};

module.exports = { __esModule: true, createMMKV };
