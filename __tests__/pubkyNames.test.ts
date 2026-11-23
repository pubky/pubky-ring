import { assignDefaultPubkyNames, getPubkyDisplayName, nextDefaultPubkyName } from '../src/utils/pubkyNames';

const named = (...names: Array<string>) =>
	Object.fromEntries(names.map((name, index) => [`key-${index}`, { name }]));

describe('nextDefaultPubkyName', () => {
	it('starts at pubky #1', () => {
		expect(nextDefaultPubkyName({})).toBe('pubky #1');
	});

	it('picks the lowest free number, filling gaps left by deleted or renamed keys', () => {
		expect(nextDefaultPubkyName(named('pubky #1', 'pubky #3'))).toBe('pubky #2');
		expect(nextDefaultPubkyName(named('pubky #2', 'Work'))).toBe('pubky #1');
	});

	it('treats names that only differ in case or surrounding spaces as taken', () => {
		expect(nextDefaultPubkyName(named(' Pubky #1 ', 'PUBKY #2'))).toBe('pubky #3');
	});

	it('ignores names that only look similar, such as adopted Bitkit keys', () => {
		expect(nextDefaultPubkyName(named('pubky #1 (Bitkit)', 'my pubky #1', 'pubky #10', '', '  '))).toBe(
			'pubky #1',
		);
	});

	it("does not count the excluded key's own name as taken", () => {
		const pubkys = { a: { name: 'pubky #1' }, b: { name: 'pubky #2' } };
		expect(nextDefaultPubkyName(pubkys)).toBe('pubky #3');
		expect(nextDefaultPubkyName(pubkys, 'b')).toBe('pubky #2');
	});
});

describe('getPubkyDisplayName', () => {
	it('shows the stored name', () => {
		expect(getPubkyDisplayName({ name: 'Work' })).toBe('Work');
	});

	it('shows the placeholder without a position for a missing or blank name', () => {
		expect(getPubkyDisplayName({ name: '' })).toBe('pubky');
		expect(getPubkyDisplayName({ name: '   ' })).toBe('pubky');
		expect(getPubkyDisplayName(undefined)).toBe('pubky');
	});
});

describe('assignDefaultPubkyNames', () => {
	it('stores the position-based label each unnamed key showed before, keeping order and other fields', () => {
		const result = assignDefaultPubkyNames({
			a: { name: '', image: 'a.png' },
			b: { name: 'Work', image: '' },
			c: { name: '  ', image: '' },
		});
		expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
		expect(result).toEqual({
			a: { name: 'pubky #1', image: 'a.png' },
			b: { name: 'Work', image: '' },
			c: { name: 'pubky #3', image: '' },
		});
	});

	it('moves to the next free number when another key already uses the label', () => {
		const result = assignDefaultPubkyNames({
			a: { name: 'Work' },
			b: { name: '' },
			c: { name: '' },
			d: { name: 'Pubky #2' },
			e: { name: 'pubky #4' },
		});
		expect(result.b.name).toBe('pubky #3');
		expect(result.c.name).toBe('pubky #5');
		const names = Object.values(result).map(({ name }) => name.toLowerCase());
		expect(new Set(names).size).toBe(names.length);
	});

	it('leaves a map without unnamed keys unchanged', () => {
		const pubkys = { a: { name: 'Work' }, b: { name: 'pubky #2 (Bitkit)' } };
		expect(assignDefaultPubkyNames(pubkys)).toEqual(pubkys);
		expect(assignDefaultPubkyNames({})).toEqual({});
	});
});
