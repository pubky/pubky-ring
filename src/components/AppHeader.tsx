import { Image, StyleSheet, View } from 'react-native';
import React, { memo, ReactElement } from 'react';
import { useTypedNavigation } from '../navigation/hooks.ts';
import LinearGradient from 'react-native-linear-gradient';
import { Text2Xl } from '../theme/typography';
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

const AppHeader = memo(
	({
		title,
		leftButton = undefined,
		rightButton = undefined,
		disableBackNavigation = false,
	}: AppHeaderProps): ReactElement => {
		const navigation = useTypedNavigation();

		const defaultLeftButton = disableBackNavigation ? (
			<HeaderNavButton />
		) : (
			<HeaderNavButton testID="AppHeaderBackButton" onPressIn={navigation.goBack}>
				<ArrowLeft size={20} />
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
					<Text2Xl>{title}</Text2Xl>
				) : (
					<View style={styles.logoWrapper}>
						<Image source={PubkyRingLogo} style={styles.logo} />
					</View>
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
		justifyContent: 'space-between',
		paddingHorizontal: 16,
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
		flex: 1,
		alignItems: 'center',
	},
	logo: {
		height: 36,
		resizeMode: 'contain',
	},
});

AppHeader.displayName = 'AppHeader';

export default memo(AppHeader);
