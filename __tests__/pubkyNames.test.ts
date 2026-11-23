import { getPubkyDisplayName, nextDefaultPubkyName, nextExternalPubkyName } from '../src/utils/pubkyNames';

const named = (...names: Array<unknown>) =>
	Object.fromEntries(names.map((name, index) => [`key-${index}`, { name }]));

describe('pubky names', () => {
	it('picks the lowest default number no other pubky uses, Bitkit names included', () => {
		expect(nextDefaultPubkyName({})).toBe('pubky #1');
		// Gaps are filled; case, spaces and the Bitkit suffix do not make a name different.
		expect(nextDefaultPubkyName(named('pubky #1', ' PUBKY #2 ', 'pubky #3 (Bitkit)', 'pubky #5'))).toBe(
			'pubky #4',
		);
		// Names that only look similar, and malformed names, do not take a number.
		expect(nextDefaultPubkyName(named('my pubky #1', 'pubky #10', '', 1, null))).toBe('pubky #1');
		// The pubky being renamed does not block its own name.
		expect(nextDefaultPubkyName(named('pubky #1', 'pubky #2'), 'key-1')).toBe('pubky #2');
		expect(nextExternalPubkyName(named('pubky #1', 'pubky #3'))).toBe('pubky #2 (Bitkit)');
	});

	it('shows the stored name, or the placeholder without a position', () => {
		expect(getPubkyDisplayName({ name: ' Work ' })).toBe('Work');
		for (const pubkyData of [{ name: '' }, { name: '  ' }, { name: 3 }, undefined]) {
			expect(getPubkyDisplayName(pubkyData)).toBe('pubky');
		}
	});
});
