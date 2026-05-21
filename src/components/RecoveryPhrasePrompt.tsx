import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { useSelector } from 'react-redux';
import BlurView from './BlurView.tsx';
import PubkyCard from './PubkyCard.tsx';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { EBackupPreference } from '../types/pubky.ts';
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import { useTranslation } from 'react-i18next';
import { BodyMText, BodyMSBText, BodySSBText, BodySText } from '../theme/typography';
import Sheet from './Sheet.tsx';

const RecoveryPhrasePrompt = ({
	payload,
}: {
	payload: {
		pubky: string;
		mnemonic: string;
		onClose: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const [isBlurred, setIsBlurred] = useState<boolean>(true);
	const onClose = payload.onClose;
	const pubkyName = useSelector((state: RootState) => getPubkyName(state, payload.pubky, 12));
	const { confirmPubkyBackup } = usePubkyManagement();
	const title = t('backup.recoveryPhrase');
	const message = t('backup.recoveryPhraseMessage');

	const mnemonicWords = useMemo(() => {
		if (!payload?.mnemonic) {
			return [];
		}
		return payload.mnemonic.split(' ');
	}, [payload?.mnemonic]);

	const handleConfirmBackup = (): void => {
		setIsBlurred(false);
	};

	const handleFinishBackup = (): void => {
		confirmPubkyBackup(payload.pubky, EBackupPreference.recoveryPhrase);
		onClose();
	};

	return (
		<Sheet id="recovery-phrase-prompt" title={title}>
			<BodyMText style={styles.message}>{message}</BodyMText>

			<View style={styles.mnemonicContainer}>
				<View style={styles.columnContainer}>
					{mnemonicWords.slice(0, 6).map((word, index) => (
						<View key={index} style={styles.wordItem}>
							<BodyMSBText colorName="textTertiary" style={styles.wordNumber} maxFontSizeMultiplier={1.2}>
								{index + 1}.
							</BodyMSBText>
							<BodyMSBText maxFontSizeMultiplier={1.2}>{word}</BodyMSBText>
						</View>
					))}
				</View>
				<View style={styles.columnContainer}>
					{mnemonicWords.slice(6, 12).map((word, index) => (
						<View key={index + 6} style={styles.wordItem}>
							<BodyMSBText colorName="textTertiary" style={styles.wordNumber} maxFontSizeMultiplier={1.2}>
								{index + 7}.
							</BodyMSBText>
							<BodyMSBText maxFontSizeMultiplier={1.2}>{word}</BodyMSBText>
						</View>
					))}
				</View>

				{isBlurred && (
					<>
						<BlurView style={styles.blurOverlay} />
						<TouchableOpacity style={styles.revealButton} onPress={handleConfirmBackup}>
							<BodySSBText
								style={styles.tapToRevealText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>
								{t('backup.tapToReveal')}
							</BodySSBText>
						</TouchableOpacity>
					</>
				)}
			</View>

			<PubkyCard name={pubkyName} publicKey={payload.pubky} />

			<BodySText colorName="textTertiary" style={styles.warningText}>
				{t('backup.recoveryWarning')}
			</BodySText>

			<View style={styles.buttonContainer}>
				<Button
					text={t('backup.finishBackup')}
					size="large"
					disabled={isBlurred}
					onPress={handleFinishBackup}
				/>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	mnemonicContainer: {
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		borderRadius: 16,
		padding: 24,
		flexDirection: 'row',
		gap: 24,
		marginBottom: 24,
		position: 'relative',
	},
	blurOverlay: {
		...StyleSheet.absoluteFill,
		borderRadius: 16,
	},
	revealButton: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -50 }, { translateY: -12 }],
		backgroundColor: 'rgba(0, 0, 0, 0.64)',
		paddingHorizontal: 28,
		paddingVertical: 18,
		borderRadius: 64,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
		minHeight: 64,
		alignItems: 'center',
		justifyContent: 'center',
	},
	tapToRevealText: {},
	columnContainer: {
		flex: 1,
		gap: 8,
		backgroundColor: 'transparent',
	},
	wordItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	wordNumber: {
		marginRight: 8,
	},
	warningText: {
		marginTop: 24,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(RecoveryPhrasePrompt);
