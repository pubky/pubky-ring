/**
 * Import Action Handler
 *
 * Handles import of recovery phrases and secret keys from any input source.
 * This consolidates all import processing logic.
 */

import { Result, ok, err } from '@synonymdev/result';
import { mnemonicPhraseToKeypair } from '@synonymdev/react-native-pubky';
import { InputAction, ImportParams } from '../inputParser';
import { RoutedActionContext } from '../inputRouter';
import { importPubky } from '../pubky';
import { showToast } from '../helpers';
import { getErrorMessage } from '../errorHandler';
import { getPubkyKeys } from '../../store/selectors/pubkySelectors';
import { getStore } from '../store-helpers';
import { EBackupPreference } from '../../types/pubky';
import i18n from '../../i18n';
import { showSheet } from '../../sheets/sheetNavigation.tsx';

type ImportActionData = {
	action: InputAction.Import;
	params: ImportParams;
};

/**
 * Handles import action - imports a pubky from recovery phrase or secret key
 *
 * @returns The imported pubky string on success
 */
export const handleImportAction = async (
	data: ImportActionData,
	context: RoutedActionContext,
): Promise<Result<string>> => {
	const { dispatch, skipImportSheet = false } = context;
	const { params } = data;
	const { data: importData, backupPreference } = params;

	try {
		// Get current pubkys before import to determine if this is new
		const currentPubkys = getPubkyKeys(getStore());

		// Prepare the secret key and mnemonic
		let secretKey = '';
		let mnemonic = '';

		if (backupPreference === EBackupPreference.recoveryPhrase) {
			mnemonic = importData.toLowerCase();
			// Convert mnemonic to secret key
			const keypairRes = await mnemonicPhraseToKeypair(mnemonic);
			if (keypairRes.isErr()) {
				showToast({
					type: 'error',
					title: i18n.t('import.failed'),
					description: i18n.t('import.invalidRecoveryPhrase'),
				});
				return err('Invalid recovery phrase');
			}
			secretKey = keypairRes.value.secret_key;
		} else {
			// Encrypted file / secret key
			secretKey = importData;
		}

		// Import the pubky
		const importRes = await importPubky({
			secretKey,
			dispatch,
			mnemonic,
		});

		if (importRes.isErr()) {
			const errorMessage = getErrorMessage(importRes.error, i18n.t('errors.failedToImportPubky'));
			showToast({
				type: 'error',
				title: i18n.t('import.failed'),
				description: errorMessage,
			});
			return err(errorMessage);
		}

		const importedPubky = importRes.value;

		// Show success UI unless explicitly skipped
		if (!skipImportSheet) {
			const isNewPubky = !currentPubkys.includes(importedPubky);

			context.setAddPubkyScreen({
				screen: 'ImportSuccess',
				params: { pubky: importedPubky, isNewPubky },
			});
		} else {
			// Even when skipping the sheet, show a brief toast
			showToast({
				type: 'success',
				title: i18n.t('import.pubkyImported'),
				description: i18n.t('import.importSuccess'),
			});
			showSheet('edit-pubky', {
				pubky: importedPubky,
			});
		}

		return ok(importedPubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
		console.error('Error during import:', errorMessage);
		showToast({
			type: 'error',
			title: i18n.t('import.failed'),
			description: errorMessage,
		});
		return err(errorMessage);
	}
};
