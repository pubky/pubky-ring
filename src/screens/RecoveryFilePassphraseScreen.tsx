import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { TextInput, TouchableOpacity } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { truncateStr } from '../utils/pubky.ts';
import { EBackupPreference } from '../types/pubky.ts';
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import { BACKUP_PASSWORD_CHAR_MIN } from '../utils/constants.ts';
import { BodyMText, BodyMSBText, BodySText, CaptionBText, CaptionText } from '../theme/typography';
import { SheetScreen } from '../components/Sheet.tsx';
import type { BackupFileScreenParams, ImportFileScreenParams, SheetId } from '../sheets/types.ts';
import { Eye, EyeOff, Key } from '../icons/index.ts';
import { backupPubky } from '../utils/rnfs.ts';
import { generateBackupFileName, showToast } from '../utils/helpers.ts';
import { getPubkySecretKey, importPubky as importPubkyUtil } from '../utils/pubky.ts';
import { getStore } from '../utils/store-helpers.ts';
import { createRecoveryFile, decryptRecoveryFile } from '@synonymdev/react-native-pubky';
import { useDispatch } from 'react-redux';
import { getPubkyKeys } from '../store/selectors/pubkySelectors.ts';

const formatDate = (date: Date): string => {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-based
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');

	return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

export type RecoveryFilePassphraseScreenProps = {
	promptPayload:
		| ({ mode: 'backup' } & BackupFileScreenParams)
		| ({ mode: 'import' } & ImportFileScreenParams);
	sheetId: SheetId;
	onImportSuccess: (pubky: string, isNewPubky: boolean) => void;
};

const RecoveryFilePassphraseScreen = ({
	promptPayload,
	sheetId,
	onImportSuccess,
}: RecoveryFilePassphraseScreenProps): ReactElement => {
	const { t } = useTranslation();
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>('');
	const { mode } = useMemo(() => promptPayload, [promptPayload]);
	const [loading, setLoading] = useState(false);
	const fileName = useMemo(
		() => (promptPayload.mode === 'import' ? promptPayload.fileName : ''),
		[promptPayload],
	);
	const fileDate = useMemo(
		() =>
			promptPayload.mode === 'import' && promptPayload.fileDate
				? formatDate(new Date(promptPayload.fileDate))
				: '',
		[promptPayload],
	);
	const pubky = useMemo(() => (promptPayload.mode === 'backup' ? promptPayload.pubky : ''), [promptPayload]);
	const dispatch = useDispatch();
	const { confirmPubkyBackup } = usePubkyManagement();

	const truncatedPubky = useMemo(() => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, [pubky]);

	const handleClose = useCallback(() => {
		hideSheet(sheetId);
	}, [sheetId]);

	const handleBackupSubmit = useCallback(async (): Promise<void> => {
		const secretKeyResponse = await getPubkySecretKey(pubky);
		if (secretKeyResponse.isErr()) {
			setError(t('backup.couldNotRetrieveSecretKey'));
			return;
		}

		const createRecoveryFileRes = await createRecoveryFile(secretKeyResponse.value.secretKey, password);
		if (createRecoveryFileRes.isErr()) {
			setError(createRecoveryFileRes.error.message);
			return;
		}

		let pubkyName;
		try {
			const name = getStore().pubky.pubkys[pubky]?.name;
			if (typeof name === 'string' && name.trim()) {
				pubkyName = name.toLowerCase().replace(/\s+/g, '-') + '-backup';
			}
		} catch {}

		const backupFileName = generateBackupFileName(pubkyName);
		const backupRes = await backupPubky(createRecoveryFileRes.value, backupFileName);

		if (backupRes.isErr()) {
			setError(backupRes.error.message);
			return;
		}

		Keyboard.dismiss();
		setPassword('');
		setError('');
		confirmPubkyBackup(pubky, EBackupPreference.encryptedFile);
		showToast({
			type: 'success',
			title: t('backup.backupCreated'),
			description: `${backupFileName}.pkarr`,
		});
		hideSheet('backup');
	}, [confirmPubkyBackup, password, pubky, t]);

	const handleImportSubmit = useCallback(async (): Promise<void> => {
		if (promptPayload.mode !== 'import') {
			return;
		}

		const decryptRes = await decryptRecoveryFile(promptPayload.content, password);
		if (decryptRes.isErr()) {
			setError(
				`Failed to decrypt file: ${decryptRes.error.message}. Please check your passphrase and try again.`,
			);
			return;
		}

		const currentPubkys = getPubkyKeys(getStore());
		const importRes = await importPubkyUtil({
			secretKey: decryptRes.value,
			dispatch,
		});

		if (importRes.isErr()) {
			setError(`Failed to import pubky after decryption: ${importRes.error.message}`);
			return;
		}

		const isNewPubky = !currentPubkys.includes(importRes.value);

		Keyboard.dismiss();
		setPassword('');
		setError('');
		onImportSuccess(importRes.value, isNewPubky);
	}, [dispatch, onImportSuccess, password, promptPayload]);

	const handleSubmit = useCallback(async () => {
		try {
			setLoading(true);
			// Only validate password length for backup creation
			if (mode === 'backup' && password.length < BACKUP_PASSWORD_CHAR_MIN) {
				const chars = BACKUP_PASSWORD_CHAR_MIN > 1 ? t('backup.characters') : t('backup.character');
				setError(t('backup.passwordMinLength', { min: BACKUP_PASSWORD_CHAR_MIN, chars }));
				return;
			}

			if (!password.trim()) {
				return;
			}

			if (mode === 'backup') {
				await handleBackupSubmit();
				return;
			}

			await handleImportSubmit();
		} finally {
			setLoading(false);
		}
	}, [handleBackupSubmit, handleImportSubmit, mode, password, t]);

	const title = useMemo(() => {
		switch (mode) {
			case 'backup':
				return t('backup.file.navTitle');
			case 'import':
				return t('import.title');
			default:
				return t('backup.backup');
		}
	}, [mode, t]);

	const message = useMemo(() => {
		switch (mode) {
			case 'backup':
				return t('backup.backupMessage');
			case 'import':
				return t('backup.importMessage');
			default:
				return '';
		}
	}, [mode, t]);

	const submitButtonText = useMemo(() => {
		switch (mode) {
			case 'backup':
				return t('backup.createBackup');
			case 'import':
				return t('import.importButton');
			default:
				return t('common.submit');
		}
	}, [mode, t]);

	const content = useMemo(() => {
		switch (mode) {
			case 'backup':
				return (
					<CaptionText style={styles.inputLabel} numberOfLines={1} ellipsizeMode="middle">
						<Trans
							t={t}
							i18nKey="backup.passphraseFor"
							components={{ accent: <CaptionBText colorName="textPrimary" /> }}
							values={{ pubky: truncatedPubky }}
						/>
					</CaptionText>
				);
			case 'import':
				return (
					<View style={styles.row}>
						<View style={styles.keyContainer}>
							<Key />
						</View>
						<View style={styles.fileInfoContainer}>
							<BodyMSBText numberOfLines={1} ellipsizeMode="middle">
								{fileName}
							</BodyMSBText>
							{fileDate && <CaptionText colorName="textTertiary">{fileDate.toUpperCase()}</CaptionText>}
						</View>
					</View>
				);
		}
	}, [fileDate, fileName, mode, t, truncatedPubky]);

	return (
		<SheetScreen id={sheetId} title={title}>
			<BodyMText style={styles.message}>{message}</BodyMText>
			{content}
			<View style={[styles.inputContainer, error ? styles.inputError : null]}>
				<TextInput
					style={styles.input}
					autoComplete="off"
					secureTextEntry={!showPassword}
					value={password}
					onChangeText={text => {
						setPassword(text);
						if (error) setError('');
					}}
					placeholder={t('backup.enterPassphrase')}
					placeholderTextColor="rgba(255, 255, 255, 0.32)"
					autoFocus
					onSubmitEditing={handleSubmit}
					autoCapitalize="none"
					autoCorrect={false}
					textContentType="none"
					importantForAutofill="no"
					spellCheck={false}
					testID="BackupFilePassphraseInput"
				/>
				<TouchableOpacity
					style={styles.eyeButton}
					onPress={() => setShowPassword(!showPassword)}
					activeOpacity={0.7}
				>
					{showPassword ? <Eye size={24} /> : <EyeOff size={24} />}
				</TouchableOpacity>
			</View>
			{error ? (
				<BodySText colorName="danger" style={styles.errorText}>
					{error}
				</BodySText>
			) : null}
			<View style={styles.buttonContainer}>
				<Button
					text={loading ? t('common.close') : t('common.cancel')}
					size="large"
					testID="BackupFileCancelButton"
					onPress={handleClose}
				/>
				<Button
					text={submitButtonText}
					size="large"
					variant="secondary"
					loading={loading}
					testID="BackupFileSubmitButton"
					onPress={handleSubmit}
					disabled={!password.trim() || (mode === 'backup' && password.length < BACKUP_PASSWORD_CHAR_MIN)}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	inputLabel: {
		marginBottom: 8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
		borderRadius: 16,
		borderStyle: 'dashed',
		height: 70,
	},
	input: {
		flex: 1,
	},
	inputError: {
		borderColor: '#FF0000',
	},
	errorText: {
		marginTop: 16,
	},
	eyeButton: {
		padding: 12,
		marginHorizontal: 5,
		backgroundColor: 'transparent',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
	},
	keyContainer: {
		borderWidth: 1,
		borderRadius: 8,
		borderColor: 'rgba(255, 255, 255, 0.16)',
		height: 48,
		width: 48,
		marginRight: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fileInfoContainer: {
		flex: 1,
		marginRight: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginTop: 24,
	},
});

export default memo(RecoveryFilePassphraseScreen);
