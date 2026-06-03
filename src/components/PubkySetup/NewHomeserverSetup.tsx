import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Image, Platform, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { SheetManager } from 'react-native-actions-sheet';
import { TouchableOpacity } from '../../theme/components.ts';
import { showEditPubkySheet } from '../../utils/sheetHelpers.ts';
import { defaultPubkyState } from '../../store/shapes/pubky.ts';
import {
	BodyMBText,
	BodyMText,
	BodySSBText,
	BodySSpacedText,
	CaptionText,
	DisplayText,
} from '../../theme/typography';
import Button from '../Button.tsx';

enum HomeserverOption {
	default = 'default',
	custom = 'custom',
}

const NewHomeserverSetup = ({
	payload,
}: {
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
		<>
			<DisplayText style={styles.headerText}>{t('homeserver.dataHosting')}</DisplayText>

			<BodyMText style={styles.message}>
				<Trans
					t={t}
					i18nKey="homeserver.message"
					components={{ accent: <BodyMBText colorName="textPrimary" /> }}
					values={{ pubky: truncatedPubky }}
				/>
			</BodyMText>

			<View style={styles.optionsContainer}>
				<CaptionText style={styles.optionLabel}>{t('homeserver.label')}</CaptionText>

				<TouchableOpacity
					testID="HomeserverDefaultOption"
					style={styles.optionRow}
					onPress={() => setSelectedOption(HomeserverOption.default)}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.radioOuter,
							selectedOption === HomeserverOption.default && styles.radioOuterSelected,
						]}
					>
						{selectedOption === HomeserverOption.default && (
							<View testID="HomeserverDefaultRadioInner" style={styles.radioInner} />
						)}
					</View>
					<BodySSBText>
						{t('homeserver.default')} <BodySSpacedText>{t('homeserver.requiresInvite')}</BodySSpacedText>
					</BodySSBText>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.optionRow}
					activeOpacity={0.7}
					testID="HomeserverCustomOption"
					onPress={() => setSelectedOption(HomeserverOption.custom)}
				>
					<View
						style={[
							styles.radioOuter,
							selectedOption === HomeserverOption.custom && styles.radioOuterSelected,
						]}
					>
						{selectedOption === HomeserverOption.custom && (
							<View testID="HomeserverCustomRadioInner" style={styles.radioInner} />
						)}
					</View>
					<BodySSBText>{t('homeserver.custom')}</BodySSBText>
				</TouchableOpacity>
			</View>

			<View style={styles.bottomSection}>
				<Image
					source={require('../../images/setup-device.png')}
					style={styles.deviceImage}
					resizeMode="contain"
				/>
				<View style={styles.buttonContainer}>
					<Button
						style={styles.continueButton}
						text={t('common.continue')}
						size="large"
						variant="secondary"
						testID="HomeserverContinueButton"
						onPress={handleContinue}
					/>
				</View>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	headerText: {
		marginBottom: 20,
	},
	message: {
		marginBottom: 24,
	},
	optionsContainer: {
		zIndex: 10,
	},
	optionLabel: {
		marginBottom: 12,
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
		borderColor: 'rgba(255, 255, 255, 0.32)',
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		marginRight: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioOuterSelected: {
		borderColor: '#FFFFFF',
		backgroundColor: 'rgba(255, 255, 255, 0.32)',
	},
	radioInner: {
		width: 16,
		height: 16,
		borderRadius: 100,
		backgroundColor: '#FFFFFF',
	},
	bottomSection: {
		flex: 1,
		alignItems: 'center',
		marginTop: 'auto',
	},
	deviceImage: {
		width: 480,
		height: 480,
		position: 'absolute',
		bottom: -35,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginTop: 'auto',
	},
	continueButton: {
		zIndex: 1,
	},
});

export default memo(NewHomeserverSetup);
