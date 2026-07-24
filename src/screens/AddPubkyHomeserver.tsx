import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Trans, useTranslation } from 'react-i18next';
import { SheetScreen } from '../components/Sheet.tsx';
import Button from '../components/Button.tsx';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import { TouchableOpacity } from '../theme/components.ts';
import {
	BodyMBText,
	BodyMText,
	BodySSBText,
	BodySSpacedText,
	CaptionText,
	DisplayText,
} from '../theme/typography';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

enum HomeserverOption {
	default = 'default',
	custom = 'custom',
}

const AddPubkyHomeserver = ({
	navigation,
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'Homeserver'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky } = route.params;
	const [selectedOption, setSelectedOption] = useState<HomeserverOption>(HomeserverOption.default);

	const handleContinue = useCallback((): void => {
		switch (selectedOption) {
			case HomeserverOption.default:
				navigation.navigate('InviteCode', { pubky });
				break;
			case HomeserverOption.custom:
				showSheet('edit-pubky', { pubky });
				break;
			default:
				navigation.navigate('InviteCode', { pubky });
		}
	}, [navigation, pubky, selectedOption]);

	const truncatedPubky = useMemo(() => {
		if (!pubky) return '';
		if (pubky.length > 20) {
			return `${pubky.substring(0, 7)}...${pubky.substring(pubky.length - 5)}`;
		}
		return pubky;
	}, [pubky]);

	return (
		<SheetScreen id={SHEET_ID} title={t('homeserver.title')} gradientType="brand">
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
						{t('homeserver.default')}{' '}
						<BodySSpacedText colorName="textSecondary">{t('homeserver.requiresInvite')}</BodySSpacedText>
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
					source={require('../images/setup-device.png')}
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
		</SheetScreen>
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

export default memo(AddPubkyHomeserver);
