import React, {
	memo, ReactElement, useEffect, useMemo, useState,
} from 'react';
import {
	StyleSheet,
	Platform,
	Keyboard,
} from 'react-native';
import {
	View,
	Text,
	TouchableOpacity,
	SessionText,
	ActionSheetContainer,
	TextInput,
	Eye,
	EyeOff,
} from '../theme/components.ts';

export enum EBackupPromptViewId {
    backup = 'backup',
    import = 'import',
}

const BackupPrompt = ({ payload }: {
    payload: {
        viewId: EBackupPromptViewId;
        onSubmit: (password: string) => void;
        onClose: () => void;
    };
}): ReactElement => {
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>('');
	const { onSubmit, onClose, viewId } = payload;

	const handleSubmit = (): void => {
		// Only validate password length for backup creation
		if (viewId === EBackupPromptViewId.backup && password.length < 6) {
			setError('Password must be at least 6 characters long');
			return;
		}

		if (password.trim()) {
			Keyboard.dismiss();
			onSubmit(password);
			setPassword('');
			setError('');
		}
	};

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setKeyboardVisible(true);
			}
		);
		const keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				setKeyboardVisible(false);
			}
		);

		return (): void => {
			keyboardDidHideListener.remove();
			keyboardDidShowListener.remove();
		};
	}, []);

	const title = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Create Backup';
			case EBackupPromptViewId.import:
				return 'Import Backup';
			default:
				return 'Backup';
		}
	}, [viewId]);

	const message = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Enter a passphrase to encrypt your backup (minimum 6 characters). Keep this safe - you\'ll need it to restore your Pubky.';
			case EBackupPromptViewId.import:
				return 'Enter the passphrase to decrypt the backup file.';
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

	//TODO: Really need to fix the Android keyboard issue: https://github.com/ammarahm-ed/react-native-actions-sheet/issues/398
	const platform = useMemo(() => Platform.OS, []);
	const contentStyle = useMemo(() => {
		return {
			bottom: keyboardVisible && platform === 'android' ? -150 : null,
		};
	}, [keyboardVisible, platform]);

	// const snapPoints = useMemo(() => {
	// 	const snapPoint = Platform.OS === 'ios' ? 60 : 30;
	// 	return [snapPoint];
	// }, []);

	return (
		<ActionSheetContainer
			id="backup-prompt"
			gestureEnabled={true}
			indicatorStyle={styles.indicator}
			onClose={() => {
				onClose();
				setPassword('');
				setError('');
			}}
			defaultOverlayOpacity={0.3}
			statusBarTranslucent
			drawUnderStatusBar={false}
			springOffset={50}
			keyboardHandlerEnabled={Platform.OS === 'ios'}
		>
			<View style={[styles.content, contentStyle]}>
				<Text style={styles.title}>{title}</Text>
				<SessionText style={styles.message}>
					{message}
				</SessionText>
				<View style={styles.inputContainer}>
					<TextInput
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
						{showPassword ? (<EyeOff size={20} />) : (<Eye size={20} />)}
					</TouchableOpacity>
				</View>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={[styles.button, styles.cancelButton]}
						onPress={onClose}
					>
						<Text style={styles.buttonText}>Cancel</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.button,
							styles.submitButton,
							(!password.trim() || (viewId === EBackupPromptViewId.backup && password.length < 6)) && styles.submitButtonDisabled,
						]}
						onPress={handleSubmit}
						disabled={!password.trim() || (viewId === EBackupPromptViewId.backup && password.length < 6)}
					>
						<Text style={[styles.buttonText, styles.submitButtonText]}>
							{submitButtonText}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		height: Platform.select({
			ios: '70%',
			android: 'auto',
		}),
		maxHeight: '80%',
		padding: 24,
	},
	indicator: {
		width: 40,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginTop: 8,
		marginBottom: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	message: {
		fontSize: 14,
		marginBottom: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		marginBottom: 8,
	},
	input: {
		flex: 1,
		padding: 8,
		fontSize: 16,
		left: Platform.select({
			android: 4,
			ios: 0,
		}),
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
		justifyContent: 'flex-end',
		gap: 12,
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		minWidth: 80,
	},
	cancelButton: {
		backgroundColor: '#f5f5f5',
	},
	submitButton: {
		backgroundColor: '#0066cc',
	},
	submitButtonDisabled: {
		backgroundColor: '#99ccff',
	},
	buttonText: {
		fontSize: 14,
		textAlign: 'center',
		color: '#666',
	},
	submitButtonText: {
		color: 'white',
		fontWeight: '500',
	},
});

export default memo(BackupPrompt);
