import { Image, StyleSheet } from 'react-native';
import React, { memo, ReactElement, useCallback, useRef } from 'react';
import { TouchableOpacity, View } from '../theme/components.ts';
import { toggleTheme as _toggleTheme } from '../theme/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getTheme } from '../store/selectors/settingsSelectors.ts';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PubkyRingHeader = ({
	leftButton = undefined,
	rightButton = undefined,
}: {
	leftButton?: ReactElement;
	rightButton?: ReactElement;
}): ReactElement => {
	const dispatch = useDispatch();
	const theme = useSelector(getTheme);
	const navigation = useNavigation<NavigationProp>();
	const lastTapRef = useRef(0);

	const toggleTheme = useCallback(() => {
		_toggleTheme({ dispatch, theme });
	}, [theme, dispatch]);

	const handleDoubleTap = useCallback((): void => {
		const now = Date.now();
		const DOUBLE_TAP_DELAY = 300;

		if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
			navigation.navigate('Settings');
		}
		lastTapRef.current = now;
	}, [navigation]);

	return (
		<View style={styles.container}>
			{leftButton}
			<TouchableOpacity
				activeOpacity={1}
				onLongPress={toggleTheme}
				onPress={handleDoubleTap}
				style={styles.logoWrapper}
			>
				<Image
					source={require('../images/pubky-ring-logo.png')}
					style={styles.logo}
				/>
			</TouchableOpacity>
			{rightButton}
		</View>
	);
};

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

export default memo(PubkyRingHeader);
