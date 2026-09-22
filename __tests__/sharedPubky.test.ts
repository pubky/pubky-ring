import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';
import { err, ok } from '@synonymdev/result';
import { NativeModules } from 'react-native';
import { filterUnadoptedExternal, getExternalSecretKey } from '../src/utils/sharedPubky';

jest.mock('@synonymdev/react-native-pubky', () => ({ getPublicKeyFromSecretKey: jest.fn() }));

const getExternalSecretMock = NativeModules.SharedPubky.getExternalSecret as jest.Mock;
const getPublicKeyFromSecretKeyMock = getPublicKeyFromSecretKey as jest.MockedFunction<
	typeof getPublicKeyFromSecretKey
>;

const PUBKY = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const SECRET_KEY = 'a'.repeat(64);

describe('getExternalSecretKey', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns the secret key when it derives the requested pubky', async () => {
		getExternalSecretMock.mockResolvedValue(SECRET_KEY);
		getPublicKeyFromSecretKeyMock.mockResolvedValue(ok({ public_key: PUBKY, uri: '' }));

		const res = await getExternalSecretKey(PUBKY, 'to.bitkit');

		expect(res.isOk() && res.value).toBe(SECRET_KEY);
	});

	it('rejects a secret key that derives a different pubky', async () => {
		getExternalSecretMock.mockResolvedValue(SECRET_KEY);
		getPublicKeyFromSecretKeyMock.mockResolvedValue(ok({ public_key: 'another-pubky', uri: '' }));

		const res = await getExternalSecretKey(PUBKY, 'to.bitkit');

		expect(res.isErr()).toBe(true);
	});

	it('rejects a secret key that cannot be derived from', async () => {
		getExternalSecretMock.mockResolvedValue(SECRET_KEY);
		getPublicKeyFromSecretKeyMock.mockResolvedValue(err('invalid'));

		const res = await getExternalSecretKey(PUBKY, 'to.bitkit');

		expect(res.isErr()).toBe(true);
	});

	it.each([['missing', ''], ['too short', 'a'.repeat(63)], ['not lowercase hex', `${'a'.repeat(62)}ZZ`]])(
		'rejects a %s record without deriving a public key',
		async (_label, secret) => {
			getExternalSecretMock.mockResolvedValue(secret);

			const res = await getExternalSecretKey(PUBKY, 'to.bitkit');

			expect(res.isErr()).toBe(true);
			expect(getPublicKeyFromSecretKeyMock).not.toHaveBeenCalled();
		},
	);
});

describe('filterUnadoptedExternal', () => {
	const external = [
		{ pubky: PUBKY, sourceApp: 'to.bitkit' },
		{ pubky: 'other', sourceApp: 'to.bitkit.dev' },
	];

	it('keeps only the external pubkys that are not already in the app', () => {
		expect(filterUnadoptedExternal(external, [PUBKY])).toEqual([external[1]]);
	});

	it('keeps every external pubky when none is adopted', () => {
		expect(filterUnadoptedExternal(external, [])).toEqual(external);
	});
});
