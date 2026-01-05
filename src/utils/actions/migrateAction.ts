/**
 * Migrate Action Handler
 *
 * Handles import of keys from migrate QR codes.
 * Accumulates frames from dynamic QR codes and imports all keys
 * when all frames have been collected.
 */

import { Result, ok, err } from '@synonymdev/result';
import { SheetManager } from 'react-native-actions-sheet';
import { mnemonicPhraseToKeypair } from '@synonymdev/react-native-pubky';
import { InputAction, MigrateParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { importPubky } from '../pubky';
import { showToast } from '../helpers';
import { getErrorMessage } from '../errorHandler';
import { showImportSuccessUI } from '../sheetHelpers';
import { getPubkyKeys } from '../../store/selectors/pubkySelectors';
import { getStore } from '../store-helpers';
import i18n from '../../i18n';

type MigrateActionData = {
	action: InputAction.Migrate;
	params: MigrateParams;
};

/**
 * Parses a key input (mnemonic or secret key) and returns the secret key and mnemonic
 */
const parseKeyInput = async (
	key: string
): Promise<{ secretKey: string; mnemonic: string }> => {
	const keypairRes = await mnemonicPhraseToKeypair(key.toLowerCase());
	if (keypairRes.isOk()) {
		return {
			mnemonic: key.toLowerCase(),
			secretKey: keypairRes.value.secret_key,
		};
	}
	return { secretKey: key, mnemonic: '' };
};

// Module-level state for tracking imported keys
let importedIndices: Set<number> = new Set();
let expectedTotal: number | null = null;
let successfulImports = 0;
let failedImports = 0;
let migrationCancelled = false;
let onMigrationCompleteCallback: (() => void) | null = null;

// Store import promises for parallel processing
let importPromises: Map<number, Promise<Result<string>>> = new Map();

// Progress tracking for UI updates
export interface MigrationProgress {
	current: number;
	total: number;
	isActive: boolean;
	isImporting: boolean;
}

type ProgressListener = (progress: MigrationProgress) => void;
let progressListeners: Set<ProgressListener> = new Set();

/**
 * Subscribe to migration progress updates
 */
export const subscribeMigrationProgress = (listener: ProgressListener): (() => void) => {
	progressListeners.add(listener);
	// Immediately send current state
	listener(getMigrationProgress());
	return () => progressListeners.delete(listener);
};

/**
 * Get current migration progress
 */
export const getMigrationProgress = (): MigrationProgress => ({
	current: successfulImports + failedImports,  // Completed imports
	total: expectedTotal ?? 0,
	isActive: expectedTotal !== null && (successfulImports + failedImports) < expectedTotal,
	isImporting: importPromises.size > 0 && (successfulImports + failedImports) < importPromises.size,
});

/**
 * Notify all listeners of progress change
 */
const notifyProgressListeners = (): void => {
	const progress = getMigrationProgress();
	progressListeners.forEach(listener => listener(progress));
};

/**
 * Sets a callback to be called when migration completes (all frames imported)
 */
export const setOnMigrationComplete = (callback: (() => void) | null): void => {
	onMigrationCompleteCallback = callback;
};

/**
 * Resets the migration state
 */
export const resetMigrateAccumulator = (): void => {
	importedIndices = new Set();
	expectedTotal = null;
	successfulImports = 0;
	failedImports = 0;
	migrationCancelled = false;
	importPromises = new Map();
	notifyProgressListeners();
};

/**
 * Handles cleanup when scanner is closed manually during a migration.
 * Shows summary of any imported keys, then resets state.
 */
export const handleMigrationScannerClose = (): void => {
	// Mark migration as cancelled to prevent race conditions with pending imports
	migrationCancelled = true;

	// If we had any successful imports, show a summary
	if (successfulImports > 0) {
		// Use expectedTotal for accurate count, fall back to processed count
		const totalKeys = expectedTotal ?? (successfulImports + failedImports);
		const isPartial = expectedTotal !== null && importedIndices.size < expectedTotal;
		showMigrationSummary(successfulImports, totalKeys, isPartial);
	}

	// Always reset state
	resetMigrateAccumulator();
};

/**
 * Completes the migration - closes camera and shows summary
 */
const completeMigration = async (): Promise<void> => {
	// Capture counts before resetting
	const finalSuccessCount = successfulImports;
	const finalTotalCount = importedIndices.size;

	// Reset state immediately
	resetMigrateAccumulator();

	// Close camera now that all keys are imported
	await SheetManager.hide('camera');

	// Show completion summary with captured values
	showMigrationSummary(finalSuccessCount, finalTotalCount);

	// Notify and clear completion callback to prevent stale callbacks on consecutive migrations
	const callback = onMigrationCompleteCallback;
	onMigrationCompleteCallback = null;
	callback?.();
};

/**
 * Handles migrate action - fires off imports immediately in parallel
 * Each frame triggers an immediate import without waiting for others
 * When all frames are received, waits for all imports to complete
 *
 * @returns 'importing' while processing, or result on completion
 */
export const handleMigrateAction = async (
	data: MigrateActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { dispatch } = context;
	const { params } = data;
	const { key, index, total } = params;

	// Validate params early to prevent edge case issues
	if (total <= 0 || index < 0 || index >= total) {
		return err('Invalid migration parameters');
	}

	try {
		// Single key migration - import and show success UI
		if (total === 1) {
			await SheetManager.hide('camera');
			return await importSingleKey(key, dispatch);
		}

		// Multi-key migration

		// Initialize or validate expected total
		if (expectedTotal === null) {
			expectedTotal = total;
			notifyProgressListeners();
		} else if (expectedTotal !== total) {
			// New migration started, reset and start fresh
			resetMigrateAccumulator();
			expectedTotal = total;
			notifyProgressListeners();
		}

		// Skip if already processing this index
		if (importedIndices.has(index)) {
			return ok('duplicate');
		}

		// Check if migration was cancelled
		if (migrationCancelled) {
			return ok('cancelled');
		}

		// Mark this index as being processed
		importedIndices.add(index);
		notifyProgressListeners();

		// Start import immediately (DON'T await) - fire and forget with tracking
		const importPromise = importKeyImmediately(key, dispatch)
			.then(result => {
				// Update progress when this individual import completes
				if (result.isOk()) {
					successfulImports++;
				} else {
					failedImports++;
				}
				notifyProgressListeners();
				return result;
			});

		importPromises.set(index, importPromise);

		// Check if ALL frames have been received
		if (importedIndices.size === expectedTotal) {
			// Wait for all imports to complete in parallel
			await Promise.all(importPromises.values());

			// Check if cancelled while waiting
			if (!migrationCancelled) {
				await completeMigration();
			}
		}

		return ok('importing');
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error during migrate import';
		console.error('Error during migrate import:', errorMessage);
		showToast({
			type: 'error',
			title: i18n.t('import.failed'),
			description: errorMessage,
		});
		return err(errorMessage);
	}
};

/**
 * Imports a single key (for single-key migrations)
 */
const importSingleKey = async (
	key: string,
	dispatch: ActionContext['dispatch']
): Promise<Result<string>> => {
	const currentPubkys = getPubkyKeys(getStore());
	const { secretKey, mnemonic } = await parseKeyInput(key);

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
	const isNewPubky = !currentPubkys.includes(importedPubky);
	showImportSuccessUI(importedPubky, isNewPubky);

	return ok(importedPubky);
};

/**
 * Imports a single key immediately (for multi-key migrations)
 * Does not show success UI - that's handled by the summary at the end
 */
const importKeyImmediately = async (
	key: string,
	dispatch: ActionContext['dispatch']
): Promise<Result<string>> => {
	const { secretKey, mnemonic } = await parseKeyInput(key);

	const importRes = await importPubky({
		secretKey,
		dispatch,
		mnemonic,
	});

	if (importRes.isErr()) {
		const errorMessage = getErrorMessage(importRes.error, i18n.t('errors.failedToImportPubky'));
		// Don't show toast for individual failures - will show summary at end
		return err(errorMessage);
	}

	return ok(importRes.value);
};

/**
 * Shows a summary toast after keys have been processed
 * @param successCount - Number of successfully imported keys
 * @param totalCount - Total number of keys expected
 * @param isPartial - Whether this is a partial import (scanner closed early)
 */
const showMigrationSummary = (successCount: number, totalCount: number, isPartial: boolean = false): void => {
	const failureCount = totalCount - successCount;

	if (successCount > 0 && failureCount === 0 && !isPartial) {
		// All keys imported successfully
		showToast({
			type: 'success',
			title: i18n.t('migrate.successTitle'),
			description: i18n.t('migrate.successMessage', {
				imported: successCount,
				total: totalCount,
			}),
		});
	} else if (successCount > 0 && isPartial) {
		// Partial import (scanner closed early)
		showToast({
			type: 'success',
			title: i18n.t('migrate.partialTitle'),
			description: i18n.t('migrate.successMessage', {
				imported: successCount,
				total: totalCount,
			}),
		});
	} else if (successCount > 0 && failureCount > 0) {
		// Some keys failed to import
		showToast({
			type: 'warning',
			title: i18n.t('migrate.successTitle'),
			description: i18n.t('migrate.partialSuccess', {
				imported: successCount,
				failed: failureCount,
			}),
		});
	} else {
		showToast({
			type: 'error',
			title: i18n.t('import.failed'),
			description: i18n.t('migrate.allFailed'),
		});
	}
};
