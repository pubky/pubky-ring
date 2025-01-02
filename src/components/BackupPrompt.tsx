import React, {
	memo,
	ReactElement,
	useMemo,
	useState,
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
	ActionSheetContainer,
	TextInput,
	Eye,
	EyeOff,
	KeyRound,
	SessionText,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { truncatePubky } from '../utils/pubky.ts';

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
        onSubmit: (password: string) => void;
        onClose: () => void;
    };
}): ReactElement => {
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string>('');
	const { onSubmit, onClose, viewId } = useMemo(() => payload, [payload]);
	const fileName = useMemo(() => payload?.fileName ?? '', [payload]);
	const fileDate = useMemo(() => payload?.fileDate ? formatDate(payload.fileDate) : '', [payload]);
	const pubky = useMemo(() => payload?.pubky ?? '', [payload]);

	const truncatedPubky = useMemo(() => {
		const res = truncatePubky(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, [pubky]);

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

	const title = useMemo(() => {
		switch (viewId) {
			case EBackupPromptViewId.backup:
				return 'Backup Pubky';
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
						Passphrase for <Text style={styles.boldText}>pk:{truncatedPubky}</Text>
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
							<SessionText style={styles.dateText}>
								{fileDate.toUpperCase()}
							</SessionText>
						</View>
					</View>
				);
		}
	}, [fileDate, fileName, truncatedPubky, viewId]);

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
			<View style={styles.content}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.messageContainer}>
					<Text style={styles.message}>
						{message}
					</Text>
				</View>
				{content}
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
						{showPassword ? (<Eye size={20} />) : (<EyeOff size={20} />)}
					</TouchableOpacity>
				</View>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.buttonContainer}>
					<Button
						text={'Cancel'}
						style={styles.button}
						onPress={onClose}
					/>
					<Button
						text={submitButtonText}
						style={[styles.button, styles.submitButton]}
						onPress={handleSubmit}
						disabled={!password.trim() || (viewId === EBackupPromptViewId.backup && password.length < 6)}
					/>
				</View>
			</View>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		maxHeight: '80%',
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	indicator: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginTop: 12,
		marginBottom: 20,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		marginBottom: 24,
		alignSelf: 'center',
	},
	messageContainer: {
		marginBottom: 16,
	},
	message: {
		fontSize: 17,
		lineHeight: 22,
		alignItems: 'center',
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
	},
	input: {
		flex: 1,
		padding: 8,
		fontSize: 26,
		fontWeight: '300',
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
		marginTop: 24,
		width: '100%',
		justifyContent: 'space-around',
		alignItems: 'center',
		alignSelf: 'center',
	},
	button: {
		width: '45%',
	},
	submitButton: {
		borderWidth: 1,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	keyContainer: {
		borderWidth: 1,
		borderRadius: 8,
		height: 48,
		width: 48,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fileInfoContainer: {
		flex: 1,
		marginRight: 8,
	},
	boldText: {
		fontWeight: 'bold',
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
