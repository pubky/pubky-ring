import React, { memo, ReactElement, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import {
	ActionSheetContainer,
	SkiaGradient,
	Text,
	View,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import ModalIndicator from './ModalIndicator.tsx';
import BlurView from './BlurView.tsx';
import PubkyCard from './PubkyCard.tsx';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { EBackupPreference } from "../types/pubky.ts";
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import {
	ACTION_SHEET_HEIGHT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { useTranslation } from 'react-i18next';

const getMarginBottom = (index: number): number => {
	return index + 1 === 6 ? 0 : 12;
};
const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

const RecoveryPhrasePrompt = ({ payload }: {
    payload: {
        pubky: string;
		mnemonic: string;
        onClose: () => void;
    };
}): ReactElement => {
	const { t } = useTranslation();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const [error, setError] = useState<string>('');
	const [isBlurred, setIsBlurred] = useState<boolean>(true);
	const onClose = useMemo(() => payload?.onClose ?? ((): void => {}), [payload]);
	const pubkyName = useSelector((state: RootState) => getPubkyName(state, payload.pubky, 12));
	const { confirmPubkyBackup } = usePubkyManagement();

	const title = useMemo(() => {
		return t('backup.recoveryPhrase');
	}, [t]);

	const message = useMemo(() => {
		return t('backup.recoveryPhraseMessage');
	}, [t]);

	const mnemonicWords = useMemo(() => {
		if (!payload?.mnemonic) {return [];}
		return payload.mnemonic.split(' ');
	}, [payload?.mnemonic]);

	const handleConfirmBackup = (): void => {
		setIsBlurred(false);
		confirmPubkyBackup(payload.pubky, EBackupPreference.recoveryPhrase);
	};

	return (
		<ActionSheetContainer
			id="recovery-phrase-prompt"
			navigationAnimation={navigationAnimation}
			onClose={() => {
				onClose();
				setError('');
			}}
			keyboardHandlerEnabled={true}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={actionSheetHeight}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<View style={styles.mainContent}>
					<ModalIndicator />
					<Text style={styles.title}>{title}</Text>
					<Text style={styles.message}>{message}</Text>

					<View style={styles.mnemonicContainer}>
						<View style={styles.columnContainer}>
							{mnemonicWords.slice(0, 6).map((word, index) => (
								<View key={index} style={[styles.wordItem, { marginBottom: getMarginBottom(index) }]}>
									<Text style={styles.wordNumber}>{index + 1}.</Text>
									<Text style={styles.wordText}>{word}</Text>
								</View>
							))}
						</View>
						<View style={styles.columnContainer}>
							{mnemonicWords.slice(6, 12).map((word, index) => (
								<View key={index + 6} style={[styles.wordItem, { marginBottom: getMarginBottom(index) }]}>
									<Text style={styles.wordNumber}>{index + 7}.</Text>
									<Text style={styles.wordText}>{word}</Text>
								</View>
							))}
						</View>
						{isBlurred && (
							<>
								<BlurView style={styles.blurOverlay} />
								<TouchableOpacity
									style={styles.revealButton}
									onPress={handleConfirmBackup}
								>
									<Text
										style={styles.tapToRevealText}
										numberOfLines={1}
										adjustsFontSizeToFit
										minimumFontScale={0.8}
									>{t('backup.tapToReveal')}</Text>
								</TouchableOpacity>
							</>
						)}
					</View>

					<PubkyCard name={pubkyName} publicKey={payload.pubky} />

					<Text style={styles.warningText}>
						{t('backup.recoveryWarning')}
					</Text>

					{error ? (
						<Text style={styles.errorText}>{error}</Text>
					) : null}
					<View style={styles.footer}>
						<View style={styles.buttonContainer}>
							<Button
								text={t('backup.finishBackup')}
								style={styles.button}
								onPress={onClose}
								disabled={isBlurred}
							/>
						</View>
					</View>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		height: '100%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingHorizontal: 24,
	},
	mainContent: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		marginBottom: 16,
		alignSelf: 'center',
	},
	message: {
		fontSize: 17,
		fontWeight: '400',
		lineHeight: 22,
		textAlign: 'left',
		marginBottom: 24,
		color: '#E0E0E0',
	},
	mnemonicContainer: {
		backgroundColor: '#2A2A2A',
		borderRadius: 16,
		padding: 20,
		flexDirection: 'row',
		marginBottom: 24,
		position: 'relative',
	},
	blurOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: 16,
	},
	revealButton: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -50 }, { translateY: -12 }],
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		paddingHorizontal: 28,
		paddingVertical: 18,
		borderRadius: 64,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.3)',
		minHeight: 64,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tapToRevealText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	columnContainer: {
		flex: 1,
		paddingHorizontal: 10,
		backgroundColor: 'transparent',
	},
	wordItem: {
		flexDirection: 'row',
		marginBottom: 12,
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	wordNumber: {
		fontSize: 17,
		fontWeight: '600',
		lineHeight: 22,
		marginRight: 8,
		width: 24,
	},
	wordText: {
		fontSize: 17,
		fontWeight: '600',
		lineHeight: 22,
	},
	warningText: {
		fontSize: 15,
		fontWeight: '400',
		lineHeight: 20,
		color: '#888',
		textAlign: 'left',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 12,
		marginLeft: 4,
		marginVertical: 12
	},
	footer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'transparent'
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	button: {
		width: '100%',
		minHeight: 56,
	},
});

export default memo(RecoveryPhrasePrompt);
