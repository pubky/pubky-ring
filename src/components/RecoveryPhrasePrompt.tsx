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

const getMarginBottom = (index: number): number => {
	return index + 1 === 6 ? 0 : 12;
};
const RecoveryPhrasePrompt = ({ payload }: {
    payload: {
        pubky: string;
		mnemonic: string;
        onClose: () => void;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const [error, setError] = useState<string>('');
	const [isBlurred, setIsBlurred] = useState<boolean>(true);
	const onClose = useMemo(() => payload?.onClose ?? ((): void => {}), [payload]);
	const pubkyName = useSelector((state: RootState) => getPubkyName(state, payload.pubky));

	const title = useMemo(() => {
		return 'Recovery Phrase';
	}, []);

	const message = useMemo(() => {
		return 'Write down these 12 words in the right order and store them in a safe place.';
	}, []);

	const mnemonicWords = useMemo(() => {
		if (!payload?.mnemonic) {return [];}
		return payload.mnemonic.split(' ');
	}, [payload?.mnemonic]);

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
		>
			<SkiaGradient modal={true} style={styles.content}>
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
								onPress={() => setIsBlurred(false)}
							>
								<Text style={styles.tapToRevealText}>Tap to reveal</Text>
							</TouchableOpacity>
						</>
					)}
				</View>

				<PubkyCard name={pubkyName} publicKey={payload.pubky} />

				<Text style={styles.warningText}>
					Never share your recovery phrase with anyone as this may result in the loss of access to your profile, data, and online identity.
				</Text>

				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}

				<View style={styles.buttonContainer}>
					<Button
						text={'Finish backup'}
						style={styles.button}
						onPress={onClose}
						disabled={isBlurred}
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
		minHeight: '90%',
		paddingHorizontal: 24,
		paddingBottom: 34,
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
		fontWeight: 400,
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
		fontWeight: 600,
		lineHeight: 22,
		marginRight: 8,
		width: 24,
	},
	wordText: {
		fontSize: 17,
		fontWeight: 600,
		lineHeight: 22,
	},
	warningText: {
		fontSize: 15,
		fontWeight: 400,
		lineHeight: 20,
		color: '#888',
		textAlign: 'center',
		marginBottom: 24,
	},
	errorText: {
		color: '#dc2626',
		fontSize: 12,
		marginBottom: 16,
		marginLeft: 4,
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
		width: '100%',
		minHeight: 56,
	},
});

export default memo(RecoveryPhrasePrompt);
