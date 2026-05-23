import React, { memo, ReactElement, ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toastConfig } from '../theme/toastConfig.tsx';
import { BLUE_RADIAL_GRADIENT, RED_RADIAL_GRADIENT } from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { ENavigationAnimation } from '../types/settings.ts';
import SafeAreaInset from './SafeAreaInset.tsx';
import { LinearGradient, RadialGradient } from './LinearGradient.tsx';
import { BodyMBText } from '../theme/typography.ts';
import HeaderNavButton from './HeaderNavButton.tsx';
import { HEADER_HEIGHT } from './AppHeader.tsx';
import { ArrowLeft } from '../icons/index.ts';

type GradientType = 'none' | 'brand' | 'danger';

interface SheetProps {
	id: string;
	title: string;
	children: ReactNode;
	gradientType?: GradientType;
	contentStyle?: StyleProp<ViewStyle>;
	keyboardHandlerEnabled?: boolean;
	showBottomSafeAreaInset?: boolean;
	onBackPress?: () => void;
	onClose?: () => void;
}

const smallScreen = isSmallScreen();
const sheetToastConfig = toastConfig();
const gradientColors: Record<Exclude<GradientType, 'none'>, string[]> = {
	brand: BLUE_RADIAL_GRADIENT,
	danger: RED_RADIAL_GRADIENT,
};

const fadeAnimationConfig = { stiffness: 10000, damping: 1000, mass: 0.1 };
const openAnimationConfig = { stiffness: 500, damping: 50, mass: 1 };

const Sheet = ({
	id,
	title,
	children,
	gradientType = 'none',
	contentStyle,
	keyboardHandlerEnabled = Platform.OS === 'ios',
	showBottomSafeAreaInset = true,
	onBackPress,
	onClose,
}: SheetProps): ReactElement => {
	const { height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const fullHeight = windowHeight - insets.top;
	const sheetHeight = smallScreen ? fullHeight : fullHeight - HEADER_HEIGHT - 12;

	return (
		<ActionSheet
			id={id}
			containerStyle={[styles.sheetContainer, { height: sheetHeight }]}
			defaultOverlayOpacity={0.7}
			gestureEnabled={true}
			animated={true}
			drawUnderStatusBar={false}
			useBottomSafeAreaPadding={false}
			keyboardHandlerEnabled={keyboardHandlerEnabled}
			springOffset={80}
			CustomHeaderComponent={<></>}
			ExtraOverlayComponent={<Toast config={sheetToastConfig} />}
			openAnimationConfig={
				navigationAnimation === ENavigationAnimation.fade ? fadeAnimationConfig : openAnimationConfig
			}
			closeAnimationConfig={
				navigationAnimation === ENavigationAnimation.fade ? fadeAnimationConfig : undefined
			}
			onClose={onClose}
		>
			<LinearGradient colors={['#1a1a1a', '#000000']}>
				{gradientType !== 'none' && (
					<RadialGradient style={styles.background} colors={gradientColors[gradientType]} />
				)}

				<View style={styles.indicator} />

				<View style={styles.titleContainer}>
					{onBackPress ? (
						<HeaderNavButton style={styles.navButton} onPressIn={onBackPress}>
							<ArrowLeft size={24} />
						</HeaderNavButton>
					) : (
						<HeaderNavButton style={styles.navButton} />
					)}

					<BodyMBText testID={`${id}-title`}>{title}</BodyMBText>

					<HeaderNavButton style={styles.navButton} />
				</View>

				<View style={[styles.content, contentStyle]}>{children}</View>

				{showBottomSafeAreaInset && <SafeAreaInset edge="bottom" />}
			</LinearGradient>
		</ActionSheet>
	);
};

const styles = StyleSheet.create({
	sheetContainer: {
		backgroundColor: '#000000',
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		overflow: 'hidden',
	},
	background: {
		...StyleSheet.absoluteFill,
	},
	indicator: {
		alignSelf: 'center',
		width: 32,
		height: 4,
		marginTop: 12,
		marginBottom: 16,
		backgroundColor: '#636363',
		borderRadius: 2,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 24,
		paddingHorizontal: 16,
		marginBottom: 24,
	},
	navButton: {
		height: 24,
		width: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
	},
});

export default memo(Sheet);
