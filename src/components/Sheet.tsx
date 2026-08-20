import React, { memo, ReactElement, ReactNode } from 'react';
import {
	Platform,
	Pressable,
	ScrollView,
	StyleProp,
	StyleSheet,
	useWindowDimensions,
	View,
	ViewStyle,
} from 'react-native';
import { useIsFocused, useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeAreaInset from './SafeAreaInset.tsx';
import { LinearGradient, RadialGradient } from './LinearGradient.tsx';
import { TextLgSb } from '../theme/typography.ts';
import HeaderNavButton from './HeaderNavButton.tsx';
import { ArrowLeft } from '../icons/index.ts';
import { HEADER_HEIGHT } from './AppHeader.tsx';
import type { SheetId } from '../sheets/types.ts';
import { getSheetContentHeight } from '../sheets/sheetLayout.ts';
import { hideActiveSheet } from '../sheets/sheetNavigation.tsx';
import { ThemedView } from '../theme/components.ts';

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
	brand: ['#0085FF', '#000000'],
	danger: ['#E95164', '#000000'],
};

export const SheetFrame = ({ children }: SheetFrameProps): ReactElement => {
	const { height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	// Android presents sheets as an in-window transparentModal (see RootNavigator / #359),
	// so we render the bottom-sheet look here: a dimmed, tap-to-dismiss backdrop above a
	// bottom-anchored, rounded card.
	if (Platform.OS === 'android') {
		const cardHeight = windowHeight - insets.top - HEADER_HEIGHT;
		return (
			<View style={styles.androidRoot}>
				<Pressable style={styles.backdrop} onPress={hideActiveSheet} />
				<View style={[styles.androidCard, { height: cardHeight }]}>{children}</View>
			</View>
		);
	}

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
					<ArrowLeft />
				</HeaderNavButton>
			) : (
				<HeaderNavButton style={styles.navButton} />
			)}

			<TextLgSb testID={titleTestID ?? `${id}-title`}>{titleText}</TextLgSb>

			<View style={styles.navButton}>{headerRight}</View>
		</View>
	);

	return (
		<LinearGradient colors={['#1D1D20', '#000000']}>
			{gradientType !== 'none' && (
				<RadialGradient style={styles.background} radius={0.7} colors={gradientColors[gradientType]} />
			)}

			<ThemedView style={styles.indicator} colorName="muted" />

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
	androidRoot: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	androidCard: {
		backgroundColor: '#000000',
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		overflow: 'hidden',
	},
	background: {
		...StyleSheet.absoluteFill,
		opacity: 0.2,
	},
	indicator: {
		alignSelf: 'center',
		width: 60,
		height: 6,
		marginTop: 16,
		marginBottom: 24,
		borderRadius: 3,
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
