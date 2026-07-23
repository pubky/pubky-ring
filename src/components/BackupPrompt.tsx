import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { SheetManager } from 'react-native-actions-sheet';
import { TextInput, TouchableOpacity } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { truncateStr } from '../utils/pubky.ts';
import { Result } from '@synonymdev/result';
import { EBackupPreference } from '../types/pubky.ts';
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import { BACKUP_PASSWORD_CHAR_MIN } from '../utils/constants.ts';
import { BodyMText, BodyMSBText, BodySText, CaptionBText, CaptionText } from '../theme/typography';
import Sheet from './Sheet.tsx';
import { EBackupPromptViewId } from '../utils/sheetHelpers.ts';
import { Eye, EyeOff, Key } from '../icons/index.ts';

const formatDate = (date: Date): string => {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-based
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');

	return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

const BackupPrompt = ({
	payload,
}: {
	payload: {
		pubky?: string;
		fileName?: string;
		fileDate?: Date;
		viewId: EBackupPromptViewId;
		onSubmit: (password: string) => Promise<Result<any>>;
		onClose?: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>('');
	const { onSubmit, onClose, viewId } = useMemo(() => payload, [payload]);
	const [loading, setLoading] = useState(false);
	const fileName = useMemo(() => payload?.fileName ?? '', [payload]);
	const fileDate = useMemo(() => (payload?.fileDate ? formatDate(payload.fileDate) : ''), [payload]);
	const pubky = useMemo(() => payload?.pubky ?? '', [payload]);
	const { confirmPubkyBackup } = usePubkyManagement();

	const truncatedPubky = useMemo(() => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, [pubky]);

	const handleClose = useCallback(() => {
		SheetManager.hide('backup-prompt');
	}, []);

	const handleSubmit = useCallback(async () => {
		try {
			setLoading(true);
			// Only validate password length for backup creation
			if (viewId === EBackupPromptViewId.backup && password.length < BACKUP_PASSWORD_CHAR_MIN) {
				const chars = BACKUP_PASSWORD_CHAR_MIN > 1 ? t('backup.characters') : t('backup.character');
				setError(t('backup.passwordMinLength', { min: BACKUP_PASSWORD_CHAR_MIN, chars }));
				return;
			}

			if (password.trim()) {
				const res = await onSubmit(password);
				if (res.isErr()) {
					setError(res.error.message);
					return;
				}
				Keyboard.dismiss();
				setPassword('');
				setError('');
				confirmPubkyBackup(pubky, EBackupPreference.encryptedFile);
			}
		} finally {
			setLoading(false);
		}
	}, [viewId, password, t, onSubmit, confirmPubkyBackup, pubky]);

	const title = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return t('backup.file.navTitle');
			case EBackupPromptViewId.import:
				return t('import.title');
			default:
				return t('backup.backup');
		}
	}, [viewId, t]);

	const message = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return t('backup.backupMessage');
			case EBackupPromptViewId.import:
				return t('backup.importMessage');
			default:
				return '';
		}
	}, [viewId, t]);

	const submitButtonText = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return t('backup.createBackup');
			case EBackupPromptViewId.import:
				return t('import.importButton');
			default:
				return t('common.submit');
		}
	}, [viewId, t]);

	const content = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
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
			case EBackupPromptViewId.import:
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
	}, [fileDate, fileName, t, truncatedPubky, viewId]);

	return (
		<Sheet
			id="backup-prompt"
			title={title}
			keyboardHandlerEnabled={true}
			onClose={() => {
				onClose?.();
				setPassword('');
				setError('');
			}}
		>
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
					disabled={
						!password.trim() ||
						(viewId === EBackupPromptViewId.backup && password.length < BACKUP_PASSWORD_CHAR_MIN)
					}
				/>
			</View>
		</Sheet>
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

export default memo(BackupPrompt);
