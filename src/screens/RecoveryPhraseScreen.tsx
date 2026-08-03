import React, { memo, ReactElement, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableHighlight, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button.tsx';
import { useSelector } from 'react-redux';
import BlurView from '../components/BlurView.tsx';
import PubkyCard from '../components/PubkyCard.tsx';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { EBackupPreference } from '../types/pubky.ts';
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import { useTranslation } from 'react-i18next';
import { TextBaseM, TextSmM, TextSmB } from '../theme/typography';
import { SheetScreen } from '../components/Sheet.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { ThemedView } from '../theme/components.ts';
import { shadows } from '../theme/shadows.ts';
import type { BackupStackParamList } from '../sheets/types.ts';

const dummyMnemonicWords = Array.from({ length: 12 }, () => 'secret');

const RecoveryPhraseScreen = ({
	route,
}: NativeStackScreenProps<BackupStackParamList, 'RecoveryPhraseScreen'>): ReactElement => {
	const { t } = useTranslation();
	const promptPayload = route.params;
	const [isBlurred, setIsBlurred] = useState<boolean>(true);
	const pubkyName = useSelector((state: RootState) => getPubkyName(state, promptPayload.pubky, 12));
	const { confirmPubkyBackup } = usePubkyManagement();

	const mnemonicWords = useMemo(() => {
		if (!promptPayload.mnemonic) {
			return [];
		}
		return promptPayload.mnemonic.split(' ');
	}, [promptPayload.mnemonic]);

	const mnemonicWordsToShow = Platform.OS === 'android' && isBlurred ? dummyMnemonicWords : mnemonicWords;

	const handleConfirmBackup = (): void => {
		setIsBlurred(false);
	};

	const handleFinishBackup = (): void => {
		confirmPubkyBackup(promptPayload.pubky, EBackupPreference.recoveryPhrase);
		hideSheet('backup');
	};

	return (
		<SheetScreen id="backup" title={t('backup.mnemonic.navTitle')}>
			<TextBaseM style={styles.message}>{t('backup.recoveryPhraseMessage')}</TextBaseM>

			<ThemedView style={styles.mnemonicContainer} colorName="card">
				<View style={styles.columnContainer}>
					{mnemonicWordsToShow.slice(0, 6).map((word, index) => (
						<View key={index} style={styles.wordItem}>
							<TextBaseM style={styles.wordNumber} colorName="mutedForeground" maxFontSizeMultiplier={1.2}>
								{index + 1}.
							</TextBaseM>
							<TextBaseM colorName="foreground" maxFontSizeMultiplier={1.2}>
								{word}
							</TextBaseM>
						</View>
					))}
				</View>
				<View style={styles.columnContainer}>
					{mnemonicWordsToShow.slice(6, 12).map((word, index) => (
						<View key={index + 6} style={styles.wordItem}>
							<TextBaseM style={styles.wordNumber} colorName="mutedForeground" maxFontSizeMultiplier={1.2}>
								{index + 7}.
							</TextBaseM>
							<TextBaseM colorName="foreground" maxFontSizeMultiplier={1.2}>
								{word}
							</TextBaseM>
						</View>
					))}
				</View>

				{isBlurred && (
					<>
						<BlurView style={styles.blurOverlay} tintEnabled={true} />

						<TouchableHighlight
							style={styles.revealButton}
							testID="RecoveryPhraseRevealButton"
							onPress={handleConfirmBackup}
						>
							<TextSmB
								style={styles.tapToRevealText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>
								{t('backup.tapToReveal')}
							</TextSmB>
						</TouchableHighlight>
					</>
				)}
			</ThemedView>

			<TextSmM style={styles.warningText}>{t('backup.recoveryWarning')}</TextSmM>

			<PubkyCard style={styles.card} name={pubkyName} publicKey={promptPayload.pubky} />

			<View style={styles.buttonContainer}>
				<Button
					text={t('backup.finishBackup')}
					variant="secondary"
					size="large"
					disabled={isBlurred}
					testID="RecoveryPhraseFinishButton"
					onPress={handleFinishBackup}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	mnemonicContainer: {
		borderRadius: 16,
		padding: 24,
		flexDirection: 'row',
		gap: 24,
		marginBottom: 24,
		overflow: 'hidden',
	},
	blurOverlay: {
		...StyleSheet.absoluteFill,
	},
	revealButton: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -50 }, { translateY: -12 }],
		backgroundColor: '#111115',
		paddingHorizontal: 28,
		paddingVertical: 18,
		borderRadius: 64,
		borderWidth: 1,
		borderColor: '#303034',
		...shadows.xs,
	},
	tapToRevealText: {},
	columnContainer: {
		flex: 1,
		gap: 8,
	},
	wordItem: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	wordNumber: {
		marginRight: 8,
	},
	warningText: {},
	card: {
		marginTop: 'auto',
		marginBottom: 24,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});

export default memo(RecoveryPhraseScreen);
