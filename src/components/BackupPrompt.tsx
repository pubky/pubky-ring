import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet } from 'react-native';
import {
	ActionSheetContainer,
	Eye,
	EyeOff,
	KeyRound,
	SessionText,
	SkiaGradient,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { truncateStr } from '../utils/pubky.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { Result } from '@synonymdev/result';
import ModalIndicator from './ModalIndicator.tsx';
import { EBackupPreference } from "../types/pubky.ts";
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import {
	ACTION_SHEET_HEIGHT_TEXTINPUT,
} from '../utils/constants.ts';

export enum EBackupPromptViewId {
    backup = 'backup',
    import = 'import',
}

const formatDate = (date: Date): string => {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-based
	const year = date.getFullYear();
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');

	return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

const BackupPrompt = ({ payload }: {
    payload: {
		pubky?: string;
		fileName?: string;
		fileDate?: Date;
        viewId: EBackupPromptViewId;
        onSubmit: (password: string) => Promise<Result<any>>;
        onClose: () => void;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>('');
	const { onSubmit, onClose, viewId } = useMemo(() => payload, [payload]);
	const [loading, setLoading] = useState(false);
	const fileName = useMemo(() => payload?.fileName ?? '', [payload]);
	const fileDate = useMemo(() => payload?.fileDate ? formatDate(payload.fileDate) : '', [payload]);
	const pubky = useMemo(() => payload?.pubky ?? '', [payload]);
	const { confirmPubkyBackup } = usePubkyManagement();

	const truncatedPubky = useMemo(() => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, [pubky]);

	const handleSubmit = useCallback(async () => {
		try {
			setLoading(true);
			// Only validate password length for backup creation
			if (viewId === EBackupPromptViewId.backup && password.length < 6) {
				setError('Password must be at least 6 characters long');
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
	}, [onSubmit, password, viewId, confirmPubkyBackup, pubky]);

	const title = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Encrypted File';
			case EBackupPromptViewId.import:
				return 'Import Pubky';
			default:
				return 'Backup';
		}
	}, [viewId]);

	const message = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Enter a password or passphrase to encrypt and secure your backup. Keep it safe, you’ll need it to restore your pubky.';
			case EBackupPromptViewId.import:
				return 'Enter your password or passphrase to decrypt your pubky backup.';
			default:
				return '';
		}
	}, [viewId]);

	const submitButtonText = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Create Backup';
			case EBackupPromptViewId.import:
				return 'Import';
			default:
				return 'Submit';
		}
	}, [viewId]);

	const content = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return (
					<Text style={styles.message}>
						<Text style={[styles.message, styles.passphraseText]}>Passphrase for</Text> <Text style={styles.boldPubky}>pk:{truncatedPubky}</Text>
					</Text>
				);
			case EBackupPromptViewId.import:
				return (
					<View style={styles.row}>
						<View style={styles.keyContainer}>
							<KeyRound size={24} />
						</View>
						<View style={styles.fileInfoContainer}>
							<Text numberOfLines={1} ellipsizeMode="middle" style={styles.fileText}>
								{fileName}
							</Text>
							{fileDate && (
								<SessionText style={styles.dateText}>
									{fileDate.toUpperCase()}
								</SessionText>
							)}
						</View>
					</View>
				);
		}
	}, [fileDate, fileName, truncatedPubky, viewId]);

	return (
		<ActionSheetContainer
			id="backup-prompt"
			navigationAnimation={navigationAnimation}
			onClose={() => {
				onClose();
				setPassword('');
				setError('');
			}}
			keyboardHandlerEnabled={true}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={ACTION_SHEET_HEIGHT_TEXTINPUT}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<ModalIndicator />
				<Text style={styles.title}>{title}</Text>
				<View style={styles.messageContainer}>
					<Text style={styles.message}>
						{message}
					</Text>
				</View>
				{content}
				<View style={styles.inputContainer}>
					<TextInput
						autoComplete={'current-password'}
						style={[styles.input, error ? styles.inputError : null]}
						secureTextEntry={!showPassword}
						value={password}
						onChangeText={setPassword}
						placeholder="Enter passphrase"
						placeholderTextColor="#999"
						autoFocus
						onSubmitEditing={handleSubmit}
						autoCapitalize="none"
					/>
					<TouchableOpacity
						style={styles.eyeButton}
						onPress={() => setShowPassword(!showPassword)}
						activeOpacity={0.7}
					>
						{showPassword ? (<Eye size={20} />) : (<EyeOff size={20} />)}
					</TouchableOpacity>
				</View>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.buttonContainer}>
					<Button
						text={loading ? 'Close' : 'Cancel'}
						style={styles.button}
						onPress={onClose}
					/>
					<Button
						text={submitButtonText}
						loading={loading}
						style={[styles.button, styles.submitButton]}
						onPress={handleSubmit}
						disabled={!password.trim() || (viewId === EBackupPromptViewId.backup && password.length < 6)}
					/>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		minHeight: '40%',
		paddingHorizontal: 24,
		paddingBottom: 10,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		textTransform: 'capitalize',
		marginBottom: 24,
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	messageContainer: {
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	message: {
		fontSize: 17,
		fontWeight: '400',
		lineHeight: 22,
		letterSpacing: 0.4,
		alignItems: 'center',
	},
	passphraseText: {
		color: 'rgba(255, 255, 255, 0.5)',
		textTransform: 'uppercase',
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: 0.8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#5D5D5D',
		borderRadius: 16,
		marginTop: 16,
		marginBottom: 8,
		borderStyle: 'dashed',
		minHeight: 74,
		backgroundColor: 'transparent',
	},
	input: {
		flex: 1,
		paddingLeft: 16,
		fontSize: 26,
		fontWeight: '300',
		lineHeight: 32,
		textAlignVertical: 'center',
		left: Platform.select({
			android: 4,
			ios: 0,
		}),
		backgroundColor: 'transparent',
	},
	inputError: {
		borderColor: '#dc2626',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 12,
		marginBottom: 16,
		marginLeft: 4,
	},
	eyeButton: {
		padding: 12,
		marginHorizontal: 5,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 24,
		width: '100%',
		justifyContent: 'space-around',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
		minHeight: 64,
	},
	submitButton: {
		borderWidth: 1,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	keyContainer: {
		borderWidth: 1,
		borderRadius: 8,
		height: 48,
		width: 48,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	fileInfoContainer: {
		flex: 1,
		marginRight: 8,
		backgroundColor: 'transparent',
	},
	boldPubky: {
		fontWeight: 'bold',
		textTransform: 'uppercase',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: 0.8,
	},
	fileText: {
		fontSize: 17,
		fontWeight: 600,
		lineHeight: 22,
	},
	dateText: {
		fontSize: 13,
		fontWeight: 500,
		lineHeight: 18,
	},
});

export default memo(BackupPrompt);
