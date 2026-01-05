import { Image, StyleSheet } from 'react-native';
import React, { memo, ReactElement, useCallback, useRef } from 'react';
import { TouchableOpacity, View } from '../theme/components.ts';
import { toggleTheme as _toggleTheme } from '../theme/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getTheme } from '../store/selectors/settingsSelectors.ts';
import { useTypedNavigation } from '../navigation/hooks';

const PubkyRingLogo = require('../images/pubky-ring-logo.png');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LogoButton = memo(({ onLongPress, onPress }: {
	onLongPress: () => void;
	onPress: () => void;
}) => (
	<TouchableOpacity
		activeOpacity={1}
		// TODO: Adjust light-mode gradient colors.
		//onLongPress={onLongPress}
		onPress={onPress}
		style={styles.logoWrapper}
	>
		<Image
			source={PubkyRingLogo}
			style={styles.logo}
		/>
	</TouchableOpacity>
));

const DOUBLE_TAP_DELAY = 300;

const PubkyRingHeader = memo(({
	leftButton = undefined,
	rightButton = undefined,
}: {
	leftButton?: ReactElement | null;
	rightButton?: ReactElement | null;
}): ReactElement => {
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

	return (
		<View style={styles.container}>
			{leftButton}
			<LogoButton
				onLongPress={toggleTheme}
				onPress={handleDoubleTap}
			/>
			{rightButton}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignContent: 'center',
	},
	logoWrapper: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'black',
		borderRadius: 40,
		width: '60%',
		height: 50,
		marginTop: 13,
		marginBottom: 15,
	},
	logo: {
		width: 171,
		height: 36,
		resizeMode: 'contain',
		alignSelf: 'center',
		justifyContent: 'center',
	},
});

PubkyRingHeader.displayName = 'PubkyRingHeader';

export default memo(PubkyRingHeader);
