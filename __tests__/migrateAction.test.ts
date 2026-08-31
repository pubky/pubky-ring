import { err, ok } from '@synonymdev/result';
import { InputAction } from '../src/utils/inputParser';
import { handleMigrateAction, resetMigrateAccumulator } from '../src/utils/actions/migrateAction';
import { hideActiveSheet, showSheet } from '../src/sheets/sheetNavigation';
import { importPubky } from '../src/utils/pubky';
import { mnemonicPhraseToKeypair } from '@synonymdev/react-native-pubky';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	importPubky: jest.fn(),
}));

jest.mock('../src/utils/errorHandler', () => ({
	__esModule: true,
	getErrorMessage: (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) return error.message;
		if (typeof error === 'string' && error) return error;
		return fallback;
	},
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	hideActiveSheet: jest.fn(),
	showSheet: jest.fn(),
}));

const hideActiveSheetMock = hideActiveSheet as jest.MockedFunction<typeof hideActiveSheet>;
const showSheetMock = showSheet as jest.MockedFunction<typeof showSheet>;
const importPubkyMock = importPubky as jest.MockedFunction<typeof importPubky>;
const mnemonicPhraseToKeypairMock = mnemonicPhraseToKeypair as jest.MockedFunction<
	typeof mnemonicPhraseToKeypair
>;

describe('handleMigrateAction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resetMigrateAccumulator();
		mnemonicPhraseToKeypairMock.mockResolvedValue(err(new Error('not a mnemonic')));
		importPubkyMock.mockResolvedValue(ok('pubky-imported'));
	});

	it('closes the active scanner sheet for single-key migration imports', async () => {
		const dispatch = jest.fn();

		const result = await handleMigrateAction(
			{
				action: InputAction.Migrate,
				params: {
					index: 0,
					total: 1,
					key: 'encrypted-secret-key',
				},
			},
			{ dispatch },
		);

		expect(result.isOk()).toBe(true);
		expect(hideActiveSheetMock).toHaveBeenCalled();
		expect(importPubkyMock).toHaveBeenCalledWith({
			secretKey: 'encrypted-secret-key',
			dispatch,
			mnemonic: '',
		});
		expect(showSheetMock).toHaveBeenCalledWith('add-pubky', {
			screen: 'ImportSuccess',
			params: { isMigration: true, pubkys: ['pubky-imported'], totalCount: 1, failedCount: 0 },
		});
	});

	it('shows compact import success for completed multi-key migrations', async () => {
		const dispatch = jest.fn();
		importPubkyMock.mockResolvedValueOnce(ok('pubky-one')).mockResolvedValueOnce(ok('pubky-two'));

		const firstResult = await handleMigrateAction(
			{
				action: InputAction.Migrate,
				params: {
					index: 0,
					total: 2,
					key: 'encrypted-secret-key-one',
				},
			},
			{ dispatch },
		);
		const secondResult = await handleMigrateAction(
			{
				action: InputAction.Migrate,
				params: {
					index: 1,
					total: 2,
					key: 'encrypted-secret-key-two',
				},
			},
			{ dispatch },
		);

		expect(firstResult.isOk()).toBe(true);
		expect(secondResult.isOk()).toBe(true);
		expect(hideActiveSheetMock).toHaveBeenCalled();
		expect(showSheetMock).toHaveBeenCalledWith('add-pubky', {
			screen: 'ImportSuccess',
			params: {
				isMigration: true,
				pubkys: ['pubky-one', 'pubky-two'],
				totalCount: 2,
				failedCount: 0,
			},
		});
	});
});
