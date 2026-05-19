import { Image, StyleSheet } from 'react-native';
import React, { memo, ReactElement, useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View } from '../theme/components.ts';
import { toggleTheme as _toggleTheme } from '../theme/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getTheme } from '../store/selectors/settingsSelectors.ts';
import { useTypedNavigation } from '../navigation/hooks.ts';
import LinearGradient from 'react-native-linear-gradient';
import { textStyles } from '../theme/utils';
import HeaderNavButton from './HeaderNavButton.tsx';
import { ArrowLeft } from '../icons/index.ts';

const PubkyRingLogo = require('../images/pubky-ring-logo.png');

export const HEADER_HEIGHT = 56;

type AppHeaderProps = {
	title?: string;
	leftButton?: ReactElement | null;
	rightButton?: ReactElement | null;
	disableBackNavigation?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LogoButton = memo(({ onLongPress, onPress }: { onLongPress: () => void; onPress: () => void }) => (
	<TouchableOpacity
		activeOpacity={1}
		// TODO: Adjust light-mode gradient colors.
		//onLongPress={onLongPress}
		onPress={onPress}
		style={styles.logoWrapper}
	>
		<Image source={PubkyRingLogo} style={styles.logo} />
	</TouchableOpacity>
));

const DOUBLE_TAP_DELAY = 300;

const AppHeader = memo(
	({
		title,
		leftButton = undefined,
		rightButton = undefined,
		disableBackNavigation = false,
	}: AppHeaderProps): ReactElement => {
		const dispatch = useDispatch();
		const theme = useSelector(getTheme, (prev, next) => prev === next);
		const navigation = useTypedNavigation();
		const lastTapRef = useRef(0);

		const toggleTheme = useCallback(() => {
			_toggleTheme({ dispatch, theme });
		}, [theme, dispatch]);

		const handleDoubleTap = useCallback((): void => {
			const now = Date.now();

			if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
				navigation.navigate('Settings', { showSecretSettings: true });
			}
			lastTapRef.current = now;
		}, [navigation]);

		const defaultLeftButton = disableBackNavigation ? (
			<HeaderNavButton />
		) : (
			<HeaderNavButton onPressIn={navigation.goBack}>
				<ArrowLeft size={24} />
			</HeaderNavButton>
		);
		const resolvedLeftButton = leftButton ?? defaultLeftButton;
		const resolvedRightButton = rightButton === undefined ? <HeaderNavButton /> : rightButton;

		return (
			<View style={styles.container}>
				<LinearGradient
					style={styles.gradient}
					colors={['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0.95)', 'transparent']}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					locations={[0, 0.3, 1]}
					pointerEvents="none"
				/>

				{resolvedLeftButton}

				{title ? (
					<Text style={styles.title}>{title}</Text>
				) : (
					<LogoButton onLongPress={toggleTheme} onPress={handleDoubleTap} />
				)}

				{resolvedRightButton}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		alignContent: 'center',
		paddingHorizontal: 16,
		backgroundColor: 'transparent',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: HEADER_HEIGHT,
		zIndex: 3,
	},
	gradient: {
		...StyleSheet.absoluteFill,
	},
	logoWrapper: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		flex: 1,
	},
	logo: {
		height: 36,
		resizeMode: 'contain',
	},
	title: {
		...textStyles.heading,
		textAlign: 'center',
		flex: 1,
	},
});

AppHeader.displayName = 'AppHeader';

export default memo(AppHeader);
