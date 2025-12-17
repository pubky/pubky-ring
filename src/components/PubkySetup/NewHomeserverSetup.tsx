import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
	View,
	Text,
	SessionText,
	RadialGradient,
	AuthorizeButton,
	TouchableOpacity,
	BoldText,
} from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
import {
	BLUE_RADIAL_GRADIENT,
} from '../../utils/constants.ts';
import { showEditPubkySheet } from "../../utils/sheetHelpers.ts";
import { defaultPubkyState } from "../../store/shapes/pubky.ts";

export enum HomeserverOption {
	default = 'default',
	custom = 'custom',
}

const NewHomeserverSetup = ({ payload }: {
	payload: {
		pubky: string;
		onContinue?: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const [selectedOption, setSelectedOption] = useState<HomeserverOption>(HomeserverOption.default);
	const pubky = payload?.pubky ?? '';

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	const handleContinue = useCallback(async () => {
		switch (selectedOption) {
			case HomeserverOption.default:
				if (payload?.onContinue) {
					payload.onContinue();
				} else {
					closeSheet();
				}
				break;
			case HomeserverOption.custom:
				await closeSheet();
				setTimeout(() => {
					showEditPubkySheet({
						title: t('pubky.setup'),
						description: '',
						pubky: pubky,
						data: defaultPubkyState,
					});
				}, 200);
				break;
			default:
				closeSheet();
		}
	}, [selectedOption, payload, closeSheet, pubky, t]);

	const truncatedPubky = useMemo(() => {
		if (!pubky) return '';
		if (pubky.length > 20) {
			return `${pubky.substring(0, 7)}...${pubky.substring(pubky.length - 5)}`;
		}
		return pubky;
	}, [pubky]);

	return (
		<RadialGradient
			style={styles.content}
			colors={BLUE_RADIAL_GRADIENT}
			center={{ x: 0.5, y: 0.5 }}
		>
			<ModalIndicator />
			<View style={styles.titleContainer}>
				<Text style={styles.title}>{t('homeserver.title')}</Text>
			</View>
			<Text style={styles.headerText}>{t('homeserver.dataHosting')}</Text>
			<SessionText style={styles.message}>
				{t('homeserver.chooseMessage')} <BoldText>{truncatedPubky}</BoldText>
			</SessionText>

			<View style={styles.optionsContainer}>
				<Text style={styles.optionLabel}>{t('homeserver.label')}</Text>

				<TouchableOpacity
					testID="HomeserverDefaultOption"
					style={styles.optionRow}
					onPress={() => setSelectedOption(HomeserverOption.default)}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.radioOuter,
							selectedOption === HomeserverOption.default && styles.radioOuterSelected
						]}>
						{selectedOption === HomeserverOption.default && (
							<View testID="HomeserverDefaultRadioInner" style={styles.radioInner} />
						)}
					</View>
					<Text style={styles.optionText}>
						{t('homeserver.default')} <Text style={styles.optionSubtext}>{t('homeserver.requiresInvite')}</Text>
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					testID="HomeserverCustomOption"
					style={styles.optionRow}
					onPress={() => setSelectedOption(HomeserverOption.custom)}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.radioOuter,
							selectedOption === HomeserverOption.custom && styles.radioOuterSelected
						]}>
						{selectedOption === HomeserverOption.custom && (
							<View testID="HomeserverCustomRadioInner" style={styles.radioInner} />
						)}
					</View>
					<Text style={styles.optionText}>{t('homeserver.custom')}</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.bottomSection}>
				<Image
					source={require('../../images/setup-device.png')}
					style={styles.deviceImage}
					resizeMode="contain"
				/>
				<AuthorizeButton
					testID="HomeserverContinueButton"
					style={styles.continueButton}
					onPressIn={handleContinue}
				>
					<Text style={styles.buttonText}>{t('common.continue')}</Text>
				</AuthorizeButton>
			</View>
		</RadialGradient>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingBottom: 20,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		letterSpacing: 0,
		marginBottom: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 24,
		marginBottom: 30,
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	optionsContainer: {
		marginBottom: 20,
		backgroundColor: 'transparent',
		zIndex: 1,
	},
	optionLabel: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		letterSpacing: 0.8,
		color: '#FFFFFF',
		opacity: 0.6,
		marginBottom: 12,
		backgroundColor: 'transparent',
	},
	optionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: 12,
		backgroundColor: 'transparent',
	},
	radioOuter: {
		width: 32,
		height: 32,
		borderRadius: 100,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 1)',
		backgroundColor: 'rgba(255, 255, 255, 0.32)',
		marginRight: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioOuterSelected: {
		borderColor: '#FFFFFF',
	},
	radioInner: {
		width: 16,
		height: 16,
		borderRadius: 100,
		backgroundColor: '#FFFFFF',
	},
	optionText: {
		fontSize: 15,
		lineHeight: 20,
		letterSpacing: 0.4,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	optionSubtext: {
		fontSize: 15,
		lineHeight: 20,
		letterSpacing: 0.4,
		fontWeight: '400',
		opacity: 0.6,
	},
	bottomSection: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		flex: 1,
		justifyContent: 'flex-end',
		marginBottom: Platform.select({ ios: 0, android: 20 })
	},
	deviceImage: {
		width: 480,
		height: 480,
		position: 'absolute',
		bottom: -35,
	},
	continueButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		alignItems: 'center',
		display: 'flex',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		flexDirection: 'row',
		gap: 4,
		borderWidth: 1,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		color: '#FFFFFF',
	},
});

export default memo(NewHomeserverSetup);
