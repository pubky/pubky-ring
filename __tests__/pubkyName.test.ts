import { defaultPubkyState } from '../src/store/shapes/pubky';
import { getPubkyName } from '../src/store/selectors/pubkySelectors';
import { truncateStr } from '../src/utils/pubky';
import { getFallbackPubkyName } from '../src/utils/pubkyName';
import type { Pubky } from '../src/types/pubky';
import type { RootState } from '../src/types';

// i18next needs the RNLocalize native module to initialise, so it is replaced by a lookup
// against the real English copy: the rule is asserted against the strings that actually ship.
jest.mock('../src/i18n', () => {
	const en = require('../src/i18n/locales/en.json');

	return {
		__esModule: true,
		default: {
			t: (key: string, options?: Record<string, unknown>): string => {
				const template = key
					.split('.')
					.reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], en);
				if (typeof template !== 'string') return key;
				return template.replace(/{{(\w+)}}/g, (_match, name: string) => String(options?.[name] ?? ''));
			},
		},
	};
});

// @reduxjs/toolkit pulls in immer as untransformed ESM under the React Native jest preset,
// so the selector module is given a plain, unmemoized createSelector instead.
jest.mock('@reduxjs/toolkit', () => ({
	__esModule: true,
	createSelector:
		<TState, TResult>(inputs: Array<(state: TState) => unknown>, resultFn: (...args: never[]) => TResult) =>
		(state: TState): TResult =>
			resultFn(...(inputs.map(input => input(state)) as never[])),
}));

// Importing the real utils/pubky.ts would pull the whole store and native layer into this
// unit test; only truncateStr is needed here, and it has its own coverage.
jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	truncateStr: jest.fn((str: string) => str),
}));

const truncateStrMock = truncateStr as jest.MockedFunction<typeof truncateStr>;

const OWNED_PUBKY = 'ownedPubky';
const BORROWED_PUBKY = 'borrowedPubky';

const stateWith = (pubkys: { [key: string]: Pubky }): RootState =>
	({ pubky: { pubkys, deepLink: '', processing: {} } }) as unknown as RootState;

const owned = (overrides: Partial<Pubky> = {}): Pubky => ({ ...defaultPubkyState, ...overrides });
const borrowed = (overrides: Partial<Pubky> = {}): Pubky => owned({ sourceApp: 'to.bitkit', ...overrides });

describe('getFallbackPubkyName', () => {
	it('numbers an unnamed owned pubky by its list position', () => {
		expect(getFallbackPubkyName({ index: 0 })).toBe('pubky #1');
		expect(getFallbackPubkyName({ index: 2 })).toBe('pubky #3');
	});

	it('marks an unnamed borrowed pubky as coming from Bitkit', () => {
		expect(getFallbackPubkyName({ index: 1, isBorrowed: true })).toBe('pubky #2 (Bitkit)');
	});

	it('drops the number when an owned pubky has no list position', () => {
		expect(getFallbackPubkyName({})).toBe('pubky');
	});
});

describe('getPubkyName', () => {
	beforeEach(() => {
		truncateStrMock.mockClear();
	});

	it('labels an unnamed borrowed pubky with its position and source', () => {
		const state = stateWith({ [OWNED_PUBKY]: owned(), [BORROWED_PUBKY]: borrowed() });

		expect(getPubkyName(state, BORROWED_PUBKY)).toBe('pubky #2 (Bitkit)');
	});

	it('leaves an unnamed owned pubky on the plain fallback', () => {
		const state = stateWith({ [OWNED_PUBKY]: owned(), [BORROWED_PUBKY]: borrowed() });

		expect(getPubkyName(state, OWNED_PUBKY)).toBe('pubky #1');
	});

	it('never overrides a borrowed pubky that has a name of its own', () => {
		const state = stateWith({ [BORROWED_PUBKY]: borrowed({ name: 'Satoshi' }) });

		expect(getPubkyName(state, BORROWED_PUBKY)).toBe('Satoshi');
		expect(truncateStrMock).toHaveBeenCalledWith('Satoshi', 8);
	});
});
