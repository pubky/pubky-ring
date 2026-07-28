import React, { memo, ReactElement, ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useIsFocused, useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLUE_RADIAL_GRADIENT, RED_RADIAL_GRADIENT } from '../utils/constants.ts';
import SafeAreaInset from './SafeAreaInset.tsx';
import { LinearGradient, RadialGradient } from './LinearGradient.tsx';
import { BodyMBText } from '../theme/typography.ts';
import HeaderNavButton from './HeaderNavButton.tsx';
import { ArrowLeft } from '../icons/index.ts';
import type { SheetId } from '../sheets/types.ts';
import { getSheetContentHeight } from '../sheets/sheetLayout.ts';

export type GradientType = 'none' | 'brand' | 'danger';

interface SheetFrameProps {
	children: ReactNode;
}

interface SheetScreenProps {
	id: SheetId;
	title: string;
	children: ReactNode;
	titleTestID?: string;
	gradientType?: GradientType;
	contentStyle?: StyleProp<ViewStyle>;
	scrollable?: boolean;
	showBottomSafeAreaInset?: boolean;
	headerRight?: ReactNode;
	showBackButton?: boolean;
	onBackPress?: () => void;
}

interface SheetProps extends SheetFrameProps, SheetScreenProps {}

const gradientColors: Record<Exclude<GradientType, 'none'>, string[]> = {
	brand: BLUE_RADIAL_GRADIENT,
	danger: RED_RADIAL_GRADIENT,
};

export const SheetFrame = ({ children }: SheetFrameProps): ReactElement => {
	const { height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const sheetHeight = getSheetContentHeight(windowHeight, insets.top, insets.bottom);

	return <View style={[styles.frame, { height: sheetHeight }]}>{children}</View>;
};

export const SheetScreen = ({
	id,
	title: titleText,
	children,
	titleTestID,
	gradientType = 'none',
	contentStyle,
	scrollable = false,
	showBottomSafeAreaInset = true,
	headerRight,
	showBackButton = true,
	onBackPress,
}: SheetScreenProps): ReactElement => {
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const hasStackScreenToGoBackTo = useNavigationState(state => {
		const isRootSheetStack = state.routeNames.some(routeName => routeName.endsWith('Sheet'));
		return !isRootSheetStack && state.index > 0;
	});
	const backPressHandler = onBackPress ?? (hasStackScreenToGoBackTo ? navigation.goBack : undefined);
	const visibleBackPressHandler = showBackButton && isFocused ? backPressHandler : undefined;

	const titleHeader = (
		<View style={styles.titleContainer}>
			{visibleBackPressHandler ? (
				<HeaderNavButton
					style={styles.navButton}
					testID={`${id}-back-button`}
					onPressIn={visibleBackPressHandler}
				>
					<ArrowLeft size={24} />
				</HeaderNavButton>
			) : (
				<HeaderNavButton style={styles.navButton} />
			)}

			<BodyMBText testID={titleTestID ?? `${id}-title`}>{titleText}</BodyMBText>

			<View style={styles.navButton}>{headerRight}</View>
		</View>
	);

	return (
		<LinearGradient colors={['#1a1a1a', '#000000']}>
			{gradientType !== 'none' && (
				<RadialGradient style={styles.background} colors={gradientColors[gradientType]} />
			)}

			<View style={styles.indicator} />

			{scrollable ? (
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
					automaticallyAdjustKeyboardInsets
				>
					{titleHeader}
					<View style={[styles.scrollBody, contentStyle]}>
						{children}
						{showBottomSafeAreaInset && <SafeAreaInset edge="bottom" />}
					</View>
				</ScrollView>
			) : (
				<>
					{titleHeader}
					<View style={[styles.content, contentStyle]}>{children}</View>
					{showBottomSafeAreaInset && <SafeAreaInset edge="bottom" />}
				</>
			)}
		</LinearGradient>
	);
};

const Sheet = ({ id, children, ...screenProps }: SheetProps): ReactElement => {
	return (
		<SheetFrame>
			<SheetScreen id={id} {...screenProps}>
				{children}
			</SheetScreen>
		</SheetFrame>
	);
};

const styles = StyleSheet.create({
	frame: {
		backgroundColor: '#000000',
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
		overflow: 'hidden',
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	scrollBody: {
		flex: 1,
		paddingHorizontal: 24,
	},
});

export default memo(Sheet);
