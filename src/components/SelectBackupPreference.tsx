import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import {
	Image,
	Platform,
	StyleSheet,
} from 'react-native';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
	RadialGradient,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import ModalIndicator from './ModalIndicator.tsx';
import { AUTHORIZE_KEY_GRADIENT } from '../utils/constants.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { EBackupPreference } from "../types/pubky.ts";
import { showBackupPrompt } from "../utils/sheetHelpers.ts";
import { setPubkyData } from "../store/slices/pubkysSlice.ts";
import { truncateStr } from "../utils/pubky.ts";

const ACTION_SHEET_HEIGHT = Platform.OS === 'ios' ? '95%' : '100%';

const SelectBackupPreference = ({ payload }: {
    payload: {
        pubky: string;
    };
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { pubky } = useMemo(() => payload, [payload]);
	const dispatch = useDispatch();

	const titleText = useMemo(() => {
		return 'Backup Pubky';
	}, []);

	const getImage = useCallback(() => {
		return (
			<Image
				source={require('../images/shield.png')}
				style={styles.importImage}
			/>
		);
	}, []);

	const getHeaderText = useCallback(() => {
		const txt = 'Safely backup\nyour pubky.';
		return (
			<Text style={styles.headerText}>{txt}</Text>
		);
	}, []);

	const truncatedPubky = useMemo(() => {
		const res = truncateStr(pubky);
		return res.startsWith('pk:') ? res.slice(3) : res;
	}, [pubky]);

	const messageText: string = useMemo(() => {
		return `Choose your preferred backup method for pubky ${truncatedPubky} to restore access if you lose your phone or your data.`;
	}, [truncatedPubky]);

	const selectPreference = useCallback((backupPreference: EBackupPreference): void => {
		dispatch(setPubkyData({
			pubky,
			data: {
				backupPreference
			},
		}));
		SheetManager.hide('select-backup-preference');
		setTimeout(() => {
			showBackupPrompt({
				pubky,
				backupPreference,
			}).then();
		}, 250);
	}, [dispatch, pubky]);

	const getButtonConfig = useCallback(() => {
		return [
			{ text: 'Encrypted File', onPress: (): void => selectPreference(EBackupPreference.encryptedFile), style: styles.importButton },
			{ text: 'Recovery Phrase', onPress: (): void => selectPreference(EBackupPreference.recoveryPhrase), style: styles.createButton },
		];
	}, [selectPreference]);

	const getContent = useCallback(() => {
		return (
			<>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{titleText}</Text>
				</View>
				{getHeaderText()}
				<SessionText style={styles.message}>
					{messageText}
				</SessionText>
				<View style={styles.keyContainer}>
					{getImage()}
				</View>
				<View style={styles.buttonContainer}>
					{getButtonConfig().map((button: { text: string; style: any; onPress: (() => void) | undefined; }, index: React.Key | null | undefined) => (
						<Button
							key={index}
							text={button.text}
							style={[styles.button, button.style]}
							textStyle={styles.buttonText}
							onPress={button.onPress}
						/>
					))}
				</View>
			</>
		);
	}, [getButtonConfig, getHeaderText, getImage, messageText, titleText]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="select-backup-preference"
				navigationAnimation={navigationAnimation}
				keyboardHandlerEnabled={Platform.OS === 'ios'}
				//isModal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={ACTION_SHEET_HEIGHT}
			>
				<RadialGradient
					style={styles.content}
					colors={AUTHORIZE_KEY_GRADIENT}
					center={{ x: 0.5, y: 0.5 }}
				>
					{getContent()}
				</RadialGradient>
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '98%',
	},
	keyContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		marginBottom: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		minHeight: 44,
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'space-around',
		gap: 12,
		paddingVertical: 12,
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
		minHeight: 64,
	},
	importButton: {
	},
	createButton: {
		borderWidth: 1,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
	},
	importImage: {
		width: 279,
		height: 279,
		alignSelf: 'center',
	},
});

export default memo(SelectBackupPreference);
