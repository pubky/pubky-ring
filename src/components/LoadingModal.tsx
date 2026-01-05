import React, { memo, ReactElement, useMemo } from 'react';
import { Image, Platform, StyleSheet } from 'react-native';
import {
	ActionSheetContainer,
	RadialGradient,
	SessionText,
	Text,
	View,
} from '../theme/components.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import ModalIndicator from './ModalIndicator.tsx';
import {
	ACTION_SHEET_HEIGHT,
	BLUE_RADIAL_GRADIENT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { useTranslation } from 'react-i18next';

const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

interface LoadingModalPayload {
	modalTitle?: string;
	title?: string;
	description?: string;
	waitText?: string;
	onClose?: () => void;
}

const LoadingModal = ({ payload }: {
	payload?: LoadingModalPayload;
}): ReactElement => {
	const { t } = useTranslation();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const onClose = useMemo(() => payload?.onClose ?? ((): void => {}), [payload]);

	const modalTitle = useMemo(() => payload?.modalTitle ?? t('loading.modalTitle'), [payload?.modalTitle, t]);
	const title = useMemo(() => payload?.title ?? t('loading.title'), [payload?.title, t]);
	const description = useMemo(() => payload?.description ?? t('loading.description'), [payload?.description, t]);
	const waitText = useMemo(() => payload?.waitText ?? t('loading.pleaseWait'), [payload?.waitText, t]);

	return (
		<ActionSheetContainer
			id="loading"
			navigationAnimation={navigationAnimation}
			onClose={onClose}
			keyboardHandlerEnabled={false}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={actionSheetHeight}
		>
			<RadialGradient
				style={styles.content}
				colors={BLUE_RADIAL_GRADIENT}
				center={{ x: 0.5, y: 0.5 }}
			>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{modalTitle}</Text>
				</View>
				<Text style={styles.headerText}>{title}</Text>
				<SessionText style={styles.message}>{description}</SessionText>
				<View style={styles.imageContainer}>
					<Image
						source={require('../images/authorizing-key.png')}
						style={styles.image}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.waitText}>{waitText}</Text>
				<View style={styles.footerBuffer} />
			</RadialGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '100%',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		fontWeight: '700',
		marginBottom: 20,
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		minHeight: 44,
	},
	imageContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	image: {
		width: 231,
		height: 231,
		alignSelf: 'center',
	},
	waitText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 18,
		textAlign: 'center',
		marginBottom: 12,
	},
	footerBuffer: {
		backgroundColor: 'transparent',
		marginBottom: Platform.select({ ios: 10, android: 20 }),
	},
});

export default memo(LoadingModal);
